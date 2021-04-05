const requiredParam = require("../../utils/required-param");
const SFAxiosWrapper = require('./sf-axios-wrapper');
const settings = require('../../settings');
const { objectToSfCsv, sfCsvToObject } = require("./sf-csv-utils");
const sleep = require("../../utils/sleep");

const loginUrl = process.env.SF_LOGIN_URL;
const instanceUrl = process.env.SF_INSTANCE_URL;
const clientId = process.env.SF_CLIENT_ID;
const refreshToken = process.env.SF_REFRESH_TOKEN;

if (!loginUrl || !instanceUrl || !clientId || !refreshToken) {
    console.warn(`One or more of SF_LOGIN_URL, SF_INSTANCE_URL, SF_CLIENT_ID, or SF_REFRESH_TOKEN config vars are not set. Cannot proceed to initialize Bulk2Job class.`);
    return;
}
const sfAxios = new SFAxiosWrapper(loginUrl, instanceUrl, clientId, refreshToken).getSFAxiosInstance();

// Limits for Bulk API V2 Ingest Jobs  https://developer.salesforce.com/docs/atlas.en-us.api_bulk_v2.meta/api_bulk_v2/bulk_api_2_limits.htm
// Item	Limit
// Maximum number of records uploaded per rolling 24-hour period	150,000,000
// Maximum number of times a batch can be retried. See How Requests Are Processed.	The API automatically handles retries. If you receive a message that the API retried more than 10 times, use a smaller upload file and try again.
// Maximum file size.	150 MB   NOTE, this is actually 100 MB on the sending side because SF encodes it after receiving the data, increasing the size by up to 50%.
// Maximum number of characters in a field.	32,000
// Maximum number of fields in a record.	5,000
// Maximum number of characters in a record.	400,000

// NOTE This class only handles the creation and submission of a bulk job, it does not account for the limitations.
// Those limitations must be handled prior to submitting the job.

class Bulk2Job {

    constructor(options) {

        this.object = options.object || requiredParam('options.object');

        // operation options: insert, upsert, update, delete, hardDelete, query, queryAll
        this.operation = options.operation || requiredParam('options.operation');

        // externalIdFieldName only needed for upsert jobs
        this.externalIdFieldName = options.externalIdFieldName || options.operation == 'upsert' ? 'id' : null;

        this.apiVersion = settings.sfApiVersion;

        this.pollingMs = settings.batchPollingInterval || 4000;
        this.pollingTimeoutMs = settings.batchPollingTimeout || 1000 * 60 * 10 * 10 + 60000; // Maximum time for a job is 10 tries at 10 minutes each plus 1 extra minute to be safe

        // jobId is set on createJob
        this.jobId = null;

        // If hardDelete = true and hardDelete jobCreate fails, force it to standard 'delete' and set this flag to true
        this.coercedToStandardDelete = false;

        this.timeoutHandle = null;
    }

    // async getUrl() {
    //     if (!this.instanceUrl) {
    //         const response = await sfAxios.get(
    //             this.idUrl, {
    //                 headers: {
    //                     authorization: `Bearer ${this.accessToken}`
    //                 }
    //             });
    //         this.instanceUrl = response.data.instanceUrls.profile;
    //         this.instanceUrl = this.instanceUrl.substring(0, this.instanceUrl.lastIndexOf('/'));
    //     }
    // }

    async createJob(tryCount = 1) {
        if (this.jobId) {
            console.warn(`Attempted to create job ${this.jobId} twice, will not create again.`);
            return;
        }
        const body = {
            object: this.object,
            operation: this.operation
        };
        if (this.externalIdFieldName) {
            body.externalIdFieldName = this.externalIdFieldName;
        }
        console.log(`createJob body => ${JSON.stringify(body)}`);
        try {
            const response = await sfAxios.post(
                `/services/data/v${this.apiVersion}/jobs/ingest`,
                body, {});
            this.jobId = response.data.id;
            console.log(`Job created with id: ${this.jobId}`);
        } catch (err) {
            // If hardDelete is attempted without the hard delete permission enabled on the profile (or assigned via permission set), createJob will return a 400 Bad Request.
            // It is disabled by default.
            if (tryCount === 1 && err.response && err.response.status == 400 && err.response.statusText == 'Bad Request' && this.operation === 'hardDelete') {
                console.warn(`Initial attempt to create a bulk job with operation hardDelete has failed and has been defaulted to standard delete. This likely means the Hard Delete administrative permission is not enabled for the PC SF user.`);
                this.operation = 'delete';
                this.coercedToStandardDelete = true;
                // tryCount is to prevent infinite loops if createJob keeps failing with 400s even on retries
                return await this.createJob(tryCount + 1);
            } else {
                if (tryCount > 1) {
                    console.warn(`createJob failed on a retry, this should not happen!`);
                }
                throw err;
            }
        }
    }

    // Job-Phase State Description
    // Creation Open An ingest job was created and is open for data uploads.
    // Creation UploadComplete (Ingest) All job data has been uploaded. The job is queued and ready to be processed.
    // Processing InProgress The job is being processed by Salesforce. This includes automatic, optimized batching or chunking of job data, and processing of job operations.
    // Outcome JobComplete The job was processed.
    // Outcome Failed The job could not be processed successfully.
    // Outcome Aborted The job was canceled by the job creator, or by a user with the “Manage Data Integrations” permission.
    async getJobInfo(id = this.jobId) {

        // await this.getUrl();
        try {
            const response = await sfAxios.get(
                `/services/data/v${this.apiVersion}/jobs/ingest/${id}`, {});
            return response.data;
        } catch (err) {
            console.error(`Error retrieving bulk data load job info:`, err);
            return null;
        }
    }

    async uploadJobData(objArray) {
        try {
            const csvData = await objectToSfCsv(objArray);

            // TODO Remove this section
            const csvArr = csvData.split('\n').splice(0,5);
            console.log(`First 5 lines of csv data (incl header):\n${csvArr.join('\n')}`);
            // END

            try {
                // await this.createJob();
                const response = await sfAxios.put(
                    `/services/data/v${this.apiVersion}/jobs/ingest/${this.jobId}/batches`,
                    csvData, {
                        headers: {
                            'Content-Type': 'text/csv'
                        }
                    }
                );

                return response.data;
            } catch (err) {
                console.error(`Error uploading bulk data load job csv:`, err);
                return null;
            }
        } catch (err) {
            console.error(`Error parsing bulk data load object array into csv:`, err);
            return null;
        }
    }

    async abortJob(id = this.jobId) {
        return await this.abortComplete(id, 'Aborted');
    }

    async closeJob(id = this.jobId) {
        return await this.abortComplete(id, 'UploadComplete');
    }

    async abortComplete(id = this.jobId, myState) {
        // await this.getUrl();
        const body = {
            state: myState
        };
        try {
            const response = await sfAxios.patch(
                `/services/data/v${this.apiVersion}/jobs/ingest/${id}`,
                body, {
                    headers: {
                        Accept: 'application/json'
                    }
                });
            return response.data;
        } catch (err) {
            console.error(`Error aborting bulk data load job:`, err);
            return null;
        }
    }

    async deleteJob(id = this.jobId) {
        // await this.getUrl();
        try {
            await sfAxios.delete(
                `/services/data/v${this.apiVersion}/jobs/ingest/${id}`, {});
        } catch (err) {
            console.error(`Error deleting bulk data load job:`, err);
            return null;
        }
    }

    async getSuccessfulResults(id = this.jobId) {
        return await this.getResults(id, 'successfulResults');
    }

    async getFailedResults(id = this.jobId) {
        return await this.getResults(id, 'failedResults');
    }

    async getUnprocessedRecords(id = this.jobId) {
        return await this.getResults(id, 'unprocessedrecords');
    }

    async getResults(id = this.jobId, resultType) {
        try {
            const response = await sfAxios.get(
                `/services/data/v${this.apiVersion}/jobs/ingest/${id}/${resultType}/`, {
                    responseType: 'stream',
                });

            return new Promise((resolve, reject) => {
                // await this.getUrl();

                // console.log(`Response data => `, response.data);

                const stream = response.data;
                const chunks = [];

                stream.on('data', (chunk /* chunk is an ArrayBuffer */) => {
                    chunks.push(chunk);
                });
                stream.on('end', async () => {
                    const csvStr = Buffer.concat(chunks).toString("utf-8");
                    const objArr = await sfCsvToObject(csvStr);
                    resolve(objArr);
                });
            });
        } catch (err) {
            console.error(`Error getting results for bulk data load job resultType: ${resultType}:`, err);
            return null;
        }
    }

    async getAllResults(id = this.jobId) {
        const p1 = this.getSuccessfulResults(id);
        const p2 = this.getFailedResults(id);
        const p3 = this.getUnprocessedRecords(id);
        try {
            const [ successfulResults, failedResults, unprocessedRecords ] = await Promise.all([ p1, p2, p3 ]);
            return {
                successfulResults,
                failedResults,
                unprocessedRecords
            };
        } catch (err) {
            console.log(`Error retrieving one or more result types for bulk data load job:`, err);
            return null;
        }
    }

    findMissingResultSfids(objArr, results) {
        // If the job times out, sometimes it won't return any result records, including unprocessed. So we need to check the counts and sfids in the results against the initial record set.
        // If there are records missing from the results, then push them into the missing array so we can set those to error code = 'm' and log appropriately.
        const allResultSfids = [
            ...results.successfulResults.map(row => row.sf__Id ? row.sf__Id : row.id).filter(Boolean),
            ...results.failedResults.map(row => row.sf__Id ? row.sf__Id : row.id).filter(Boolean),
            ...results.unprocessedRecords.map(row => row.id).filter(Boolean) // Unprocc records have original formatting and field names, different than succ/fail results
        ];
        const totalResCount = results.successfulResults.length + results.failedResults.length + results.unprocessedRecords.length;
        const missingFromResultSfids = [];

        console.log(`objArr count: ${objArr.length} allResultSfids count: ${allResultSfids.length} estimated missing count withOUT ids: ${objArr.length - totalResCount} estimated missing count with ids: ${objArr.length - allResultSfids.length}`);

        objArr.forEach(initRow => {
            const initSfid = initRow.id;
            if (!initSfid) {
                console.error(`Row was missing sfid in the objArr.`);
                return;
            }
            if (!allResultSfids.includes(initSfid)) {
                missingFromResultSfids.push(initSfid);
            }
        });
        if (missingFromResultSfids.length) {
            console.error(`Bulk job was missing records from its results! ${missingFromResultSfids.length} out of ${objArr.length} original records.`);
        }
        return missingFromResultSfids;
    }

    async runFullBulkJobFlow(objArr = requiredParam('objArr')) {
        let initialCount = objArr ? objArr.length : 0;
        let jobInfo;
        let results;
        let missingFromResultSfids = [];

        /* eslint-disable no-alert, no-async-promise-executor */
        return new Promise(async (resolve, reject) => {

            const startTs = new Date();
            try {
                console.log(`=== Creating new job...`);
                await this.createJob();

                try {
                    console.log(`=== Uploading job csv...`);
                    const uploadResData = await this.uploadJobData(objArr);
                    console.log(`uploadResData => `, uploadResData);

                    let timedOut = false;
                    this.timeoutHandle = setTimeout(async () => {
                        timedOut = true;
                        jobInfo = await this.getJobInfo();
                        console.error(`!!! The maximum bulk data load timeout has been reached (Timeout=${this.pollingTimeoutMs/1000} sec). Aborting job after ${((new Date().getTime() - startTs.getTime()) / 1000).toFixed(1)} seconds. Current bulk data load job info =>`, jobInfo);
                        // After aborting, retrieve the results. Some records might have been processed.
                        const abortInfo = await this.abortJob();
                        await sleep(2000);
                        jobInfo = await this.getJobInfo();
                        results = await this.getAllResults();

                        missingFromResultSfids = this.findMissingResultSfids(objArr, results);

                        resolve({ jobInfo, results, coercedToStandardDelete: this.coercedToStandardDelete, initialCount, missingFromResultSfids, timedOut: true, startTs, endTs: new Date() });
                    }, this.pollingTimeoutMs);

                    try {
                        console.log(`=== Closing job...`);
                        const closeData = await this.closeJob();
                        console.log(`closeData => `, closeData);

                        try {
                            // Close data returns the same info as jobInfo
                            jobInfo = closeData;

                            if (jobInfo.state == 'Open') {
                                await sleep(this.pollingMs * 2);
                                jobInfo = await this.getJobInfo();
                                if (jobInfo.state == 'Open') {
                                    throw new Error(`Bulk data load job is still open after attempting to mark it upload closed. This should not happen.`);
                                }
                            }

                            while (jobInfo.state == 'UploadComplete' || jobInfo.state == 'InProgress') {
                                if (timedOut) return; // If the timeout resolved the promise already, don't proceed with polling or logic in general
                                await sleep(this.pollingMs);
                                jobInfo = await this.getJobInfo();
                            }
                            // Job finished so no need to invoke or wait for the timeout handler, clear it
                            clearTimeout(this.timeoutHandle);

                            if (timedOut) return; // If the timeout resolved the promise already, don't proceed with further logic

                            results = await this.getAllResults();

                            // The Math portion is just a true/false coin toss for some randomness
                            if (process.env.FORCE_BULK_RESULT_REMOVALS_TEST && (Math.floor(Math.random() * 2) == 0)) {
                                // Remove 5 entries from results
                                console.warn(`-- FORCE REMOVING 5 entries from bulk successfulResults. --`);
                                results.successfulResults.splice(0, 5);
                            }

                            const endTs = new Date();
                            const durSec = ((endTs.getTime() - startTs.getTime()) / 1000).toFixed(1);
                            console.log(`Bulk data load job completed after ${durSec} seconds on OBJECT: ${this.object}, STATE: ${jobInfo.state}, jobInfo => `, jobInfo);

                            missingFromResultSfids = this.findMissingResultSfids(objArr, results);

                            resolve({ jobInfo, results, coercedToStandardDelete: this.coercedToStandardDelete, initialCount, missingFromResultSfids, startTs, endTs: new Date() });
                        } catch (err) {
                            console.error(`Error waiting for bulk data load job to complete: `, err.message);
                        }
                    } catch (err) {
                        console.error(`Error closing bulk data load job after upload: `, err.message);
                    }
                } catch (err) {
                    console.error(`Error uploading bulk data load job csv: `, err.message);
                }


            } catch (err) {
                console.error(`Error creating bulk data load job: `, err.message);
            }
            // If any errors, it is likely that one or both of these values will be null
            resolve({ jobInfo, results, coercedToStandardDelete: this.coercedToStandardDelete, initialCount, missingFromResultSfids, startTs, endTs: new Date() });
        });
    }
}

exports = module.exports = Bulk2Job;