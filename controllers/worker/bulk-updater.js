const sizeof = require('object-sizeof');

const requiredParam = require("../../utils/required-param");
const { skipSFDeletes } = require('../../settings');
const { updateBulkCounters } = require("./worker-utils/bulk-counters");
const { handleJobSubmission } = require("../worker/worker-utils/job-gateway");
const { JobSubmissionError, BulkSingleRecordLimitsExceededError } = require('../../errors');
const Bulk2Job = require('../../models/salesforce/bulk2-job');
const { insertBulkJob, insertBulkJobErrors, insertUniqBulkJobErrorsPerObj } = require('./worker-utils/bulk-jobs');
const { acquireLock, releaseLock, LOCK_TYPES } = require('./worker-utils/lock-utils');

class BulkUpdater {

    constructor({
        job = requiredParam('job'),
        salesforce = requiredParam('salesforce'),
        db = requiredParam('db'),
        modifyQueue = requiredParam('modifyQueue'),
        bulkQueue = requiredParam('bulkQueue'),
        upStateQueue = requiredParam('upStateQueue')
    }) {
        this.validateJobData(job.data);

        this.job = job;
        this.salesforce = salesforce;
        this.db = db;
        this.modifyQueue = modifyQueue;
        this.upStateQueue = upStateQueue;

        this.data = this.job.data;
        this.batchRecordsCount = this.job.data.batchRecords.length;
        this.recordRetention = this.data.recordRetention.toLowerCase();

        if (this.data.isRetry) {
            this.logPrefix = '(RETRY) ';
        } else if (this.data.isUnproccRetry) {
            this.logPrefix = '(UNPR_RETRY) ';
        } else {
            this.logPrefix = '';
        }
    }

    validateJobData({
        policyWrapper = requiredParam('policyWrapper'),
        executionId = requiredParam('executionId'),
        policyName = requiredParam('policyName'),
        objectName = requiredParam('objectName'),
        objectHash = requiredParam('objectHash'),
        objectId = requiredParam('objectId'),
        recordRetention = requiredParam('recordRetention'),
        hardDelete,
        batchRecords = requiredParam('batchRecords'),
        isRetry,
        // isSerialRetry,
        isUnproccRetry
    }) {
        // No additional validations atm
    }

    async run() {
        try {
            // NOTE that this method shifts off the array entries passed, so after this point, do not access batchRecords. This is to reduce memory usage and prevent duplicating/copying the potentially large array.
            const batches = this.splitIntoBatches(this.data.batchRecords);

            const batchInfoList = await this.submitBatchesToSF(batches);

            console.log(`${this.logPrefix}+++++ batchInfoList (sliced 2000) on object=${this.data.objectName} +++++\n${JSON.stringify(batchInfoList, undefined, 2).slice(0,2000)}\n------------------`);

            await this.insertSpecialUniqErrors(batchInfoList);

            const bulkCounterResults = await this.updateBulkCounters(batchInfoList);

            const jobInsertResults = await this.insertJobDetailsToDb(batchInfoList);

            const [ submittedUpdaterJob, enableEndPhaseRetries ] = await this.submitSubUpdaterJob(batchInfoList);

            const resubUnproccResults = await this.resubmitUnprocessedRecords(batchInfoList);

            return { success: true, enableEndPhaseRetries };
            // return { success: true, batchInfoList: bulkResultsList.map(bulkResults => bulkResults.batchInfo), allBatchesRecordCount: this.batchRecordsCount, updaterJobSubmitted: true };
        } catch (error) {
            console.error(`${this.logPrefix}Error submitting batch operation to Salesforce!`, error);
            return { success: false, error: error };
        }
    }

    // https://developer.salesforce.com/docs/atlas.en-us.api_bulk_v2.meta/api_bulk_v2/bulk_api_2_limits.htm
    batchStatsExceedLimits({ bytes, charCount, recordCount }) {

        // Not needed on v2 of bulk api
        // if (recordCount > 10000) {
        //     console.warn(`${this.logPrefix}recordCount: ${recordCount} exceeded limit of 10000`);
        //     return true;
        // }

        // Using 100000000 instead of 104857600 to provide a little extra safety margin
        if (bytes > 100000000) {
            console.warn(`${this.logPrefix}Total batch bytes: ${bytes} exceeded limit of 100000000 (100 MB)`);
            return true;
        }

        // // Using 9900000 instead of 10000000 for extra safety margin
        // if (charCount > 9900000) {
        //     console.warn(`${this.logPrefix}Total batch charCount: ${charCount} exceeded limit of 9900000`);
        //     return true;
        // }

        return false;
    }

    // Can be called on a single record or an array of records
    getRecordOrBatchStats(recordsInput) {
        return {
            bytes: sizeof(recordsInput),
            charCount: JSON.stringify(recordsInput).length,
            recordCount: Array.isArray(recordsInput) ? recordsInput.length : 1
        };
    }

    // Only call on single record
    getFullRecordStats(record) {
        return {
            ...this.getRecordOrBatchStats(record),
            fieldCount: Object.keys(record).length,
            maxFieldCharCount: Math.max(Object.values(record).map(val => JSON.stringify(val).length))
        };
    }

    prettyBatchRecordStats(recordStats) {
        return `recordCount:${recordStats.recordCount}  megabytes:${(recordStats.bytes/1024/1024).toFixed(2)}  charCount:${recordStats.charCount}`;
    }

    nextRecordFitsInBatch(currBatchStats, nextRecordStats) {
        return !this.batchStatsExceedLimits(this.addBatchStats(currBatchStats, nextRecordStats));
    }

    addBatchStats(currBatchStats, nextRecordStats) {
        return {
            bytes: currBatchStats.bytes + nextRecordStats.bytes,
            charCount: currBatchStats.charCount + nextRecordStats.charCount,
            recordCount: currBatchStats.recordCount + nextRecordStats.recordCount,
        };
    }

    // A field can contain a maximum of 32,000 characters.
    // A record can contain a maximum of 5,000 fields.
    // A record can contain a maximum of 400,000 characters for all its fields.
    singleRecordExceedsLimits({ charCount, fieldCount, maxFieldCharCount}) {

        if (fieldCount > 5000) {
            console.warn(`${this.logPrefix}fieldCount: ${fieldCount} exceeded limit of 5000.`);
            return true;
        }

        if (charCount > 399000) {
            console.warn(`${this.logPrefix}charCount: ${charCount} exceeded limit of 399000.`);
            return true;
        }

        if (maxFieldCharCount > 31900) {
            console.warn(`${this.logPrefix}maxFieldCharCount: ${maxFieldCharCount} exceeded limit of 31900.`);
            return true;
        }

        return false;
    }

    allRecordsWithinRecordLimits(records) {
        return records.every(record => !this.singleRecordExceedsLimits(this.getFullRecordStats(record)));
    }

    splitIntoBatches(records) {
        const initialStats = this.getRecordOrBatchStats(records);
        console.log(`${this.logPrefix}Records batch for object=${this.data.objectName} stats pre-split: ${this.prettyBatchRecordStats(initialStats)}`);

        if (!this.allRecordsWithinRecordLimits(records)) {
            throw new BulkSingleRecordLimitsExceededError(initialStats);
        }

        if (!this.batchStatsExceedLimits(initialStats)) {
            return [ records ];
        } else {
            console.log(`${this.logPrefix}Splitting up records for ${this.data.objectName}`);
        }

        const batches = [];

        const initializeBatchStats = () => {
            return {
                bytes: 0,
                charCount: 0,
                recordCount: 0
            };
        };

        let batch = [];
        let currBatchStats = initializeBatchStats();

        while (records.length) {
            const nextRecord = records.shift();
            const nextRecordStats = this.getRecordOrBatchStats(nextRecord);

            // If the next record won't fit in the batch, save the old batch and start a new one
            if (!this.nextRecordFitsInBatch(currBatchStats, nextRecordStats)) {
                // If the next record won't fit in the batch and the batch is empty, that means this single record exceeded the limits.
                // TODO We need to eventually split the record up into multiple batches, but that logic is not in place yet.
                // If a single field is too long, then it should marked as a skipped record and not included in batch
                if (!batch.length) {
                    throw new BulkSingleRecordLimitsExceededError(nextRecordStats);
                }
                batches.push(batch);
                batch = [];
                currBatchStats = initializeBatchStats();
            }

            batch.push(nextRecord);
            currBatchStats = this.addBatchStats(currBatchStats, nextRecordStats);
        }
        // Push final batch on
        if (batch.length) {
            batches.push(batch);
        }

        return batches;
    }

    async submitBatchesToSF(batches) {
        const batchInfoList = [];
        for (const batch of batches) {
            const batchInfo = await this.submitBatchToSF(batch);

            if (batchInfo) batchInfoList.push(batchInfo);
            else console.warn(`No batchInfo returned from submitBatchToSF()!`);
        }
        return batchInfoList;
    }

    async submitBatchToSF(batchRecords) {
        // const bulkReport = {};
        // let bulkResultsList;

        if (!batchRecords || !batchRecords.length) {
            return;
        }

        const job = new Bulk2Job({
            object: this.data.objectName,
            operation: this.recordRetention === 'delete' ?
                this.data.hardDelete === true ?
                    'hardDelete' : 'delete'
                : this.recordRetention === 'transform' ?
                    'upsert' : null, // operation options: insert, upsert, update, delete, query, queryAll
            externalIdFieldName: this.recordRetention === 'delete' ? null : this.recordRetention === 'transform' ? 'id' : null // Only needed up upsert);
        });

        // If an execution error happens with the API calls, this will return null. Otherwise, it should contain the job results which may or may not have failed records.
        // Example return:
        // {
        //  successfulResults => [
        //        {
        //             sf__Id: '0013g00000Cwjv3AAB',
        //             sf__Created: 'false',
        //             id: '0013g00000Cwjv3AAB'
        //         },
        //         {
        //             sf__Id: '0013g00000Cwjv4AAB',
        //             sf__Created: 'false',
        //             id: '0013g00000Cwjv4AAB'
        //         }
        //     ],
        //     failedResults: [
        //         {
        //             sf__Id: '',
        //             sf__Error: 'ENTITY_IS_DELETED:entity is deleted:--',
        //             id: '0013g00000Cwjv3AAB'
        //         },
        //         {
        //             sf__Id: '',
        //             sf__Error: 'ENTITY_IS_DELETED:entity is deleted:--',
        //             id: '0013g00000Cwjv4AAB'
        //         }
        //     ],
        //     unprocessedRecords: [] // Unprocessed records will not have the sf__ fields in them, they are exactly the objects passed in since SF never processed them
        // }
        try {
            if (this.data.isRetry) await acquireLock(this.db, LOCK_TYPES.SERIAL_BULK);
            const batchInfo = await job.runFullBulkJobFlow(batchRecords);

            return batchInfo;
        } finally {
            if (this.data.isRetry) await releaseLock(this.db, LOCK_TYPES.SERIAL_BULK);
        }
    }

    async bulkDelete(sobject, records) {
        return await this.salesforce.bulkOperation(sobject, records, 'delete');
    }

    async bulkUpdate(sobject, records) {
        return await this.salesforce.bulkOperation(sobject, records, 'update');
    }

    async insertSpecialUniqErrors(batchInfoList) {
        for (const batchInfo of batchInfoList) {
            const { jobInfo, results, coercedToStandardDelete } = batchInfo;

            if (coercedToStandardDelete) {

                const errorCode = 'COERCED_TO_STANDARD_DELETE';
                const fullError = 'Bulk job creation with operation hardDelete failed and was defaulted to standard delete.';

                const uniqErrorInsertRes = await insertUniqBulkJobErrorsPerObj({
                    executionId: this.data.executionId,
                    sobject: this.data.objectName,
                    errorCode,
                    fullError
                });

                // If the above insert returns a row, that meant this was the first time we inserted that object/errorCode/fullError combination. Insert a run log for that newly-encountered error.
                if (uniqErrorInsertRes.rows.length) {
                    let errorMsg = `Bulk data load for object: ${this.data.objectName} encountered a new error: ${errorCode}. Further instances of this error will not be logged on this run. Full error: Initial attempt to create a bulk job with operation hardDelete has failed and has been defaulted to standard delete. This likely means the Hard Delete administrative permission is not enabled for the PC SF user. We recommend creating a new permission set to solve this. More info can be found here: https://help.salesforce.com/articleView?id=000328731&type=1&mode=1`;
                    console.warn(this.logPrefix + errorMsg);

                    const runLogInserted = await this.salesforce.insertRunLog(this.data.executionId, this.data.policyName, 'Error', 'Bulk Operation', errorMsg);
                }

                return;
            }
        }
    }

    async updateBulkCounters(batchInfoList) {

        // Initial count is the row count submitted to the bulk job
        let initialCount = 0;
        // These counts are based on the results object returned from the bulk api
        let failedCount = 0;
        let updatedCount = 0;
        let totalCount = 0;

        for (const batchInfo of batchInfoList) {
            const { jobInfo, results, coercedToStandardDelete, initialCount:initCnt, missingFromResultSfids } = batchInfo;
            if (results) {
                initialCount += initCnt;
                if (this.data.isRetry) {
                    // Retries have already been added to the counts on their earlier run so we need to adjust the numbers differently.
                    // Subtract newly successful count from failed count
                    failedCount -= results.successfulResults.length;
                    // Add newly succesful count to successful (updated) count
                    updatedCount += results.successfulResults.length;
                    // Don't change totalCount
                } else {
                    failedCount += results.failedResults.length + missingFromResultSfids.length;
                    updatedCount += results.successfulResults.length;
                    totalCount += results.failedResults.length + results.successfulResults.length + missingFromResultSfids.length;
                }
            }
        }

        const bulkCounterResults = await updateBulkCounters(
            this.data.executionId,
            this.data.recordRetention,
            this.data.objectId,
            initialCount,
            updatedCount,
            failedCount,
            totalCount
        );
        return bulkCounterResults;
    }

    async insertJobDetailsToDb(batchInfoList) {

        for (const batchInfo of batchInfoList) {
            const { jobInfo, results, initialCount, missingFromResultSfids, timedOut, startTs, endTs } = batchInfo;

            const durationMs = startTs && endTs ? endTs.getTime() - startTs.getTime() : null;

            const jobInsertRes = await insertBulkJob({
                jobId: jobInfo.id,
                executionId: this.data.executionId,
                sobject: this.data.objectName,
                operation: jobInfo.operation,
                concurrencyMode: jobInfo.concurrencyMode,
                jobInfo,
                finalState: jobInfo.state,
                initialCount,
                totalCount: results.successfulResults.length + results.failedResults.length + results.unprocessedRecords.length + missingFromResultSfids.length,
                successfulCount: results.successfulResults.length,
                failedCount: results.failedResults.length + missingFromResultSfids.length,
                unprocessedCount: results.unprocessedRecords.length,
                timedOut: !!timedOut,
                isRetry: this.data.isRetry,
                startTs,
                endTs,
                durationMs
            });

            if (results.failedResults.length || missingFromResultSfids.length) {
                const errors = {};
                const uniqueFullErrors = [];

                results.failedResults.forEach(failedRow => {
                    const fullError = failedRow.sf__Error;
                    let errorCode = failedRow.sf__Error;

                    if (errorCode == '' || !errorCode) {
                        errorCode = 'unknown';
                    } else {
                        errorCode = failedRow.sf__Error.replace(/:.*/, '');
                    }

                    if (!(errorCode in errors)) {
                        errors[errorCode] = 0;
                    }
                    errors[errorCode]++;

                    if (!uniqueFullErrors.some(obj => obj.fullError == fullError)) {
                        uniqueFullErrors.push({
                            errorCode,
                            fullError
                        });
                    }

                });

                if (missingFromResultSfids.length) {
                    errors['MISSING_FROM_RESULTS'] = missingFromResultSfids.length;
                    uniqueFullErrors.push({
                        errorCode: 'MISSING_FROM_RESULTS',
                        fullError: 'MISSING_FROM_RESULTS: One or more records were missing from the result list returned by the bulk API. This typically happens on some aborted jobs after max timeout is reached.'
                    });
                }

                for (const { errorCode, fullError } of uniqueFullErrors) {
                    const uniqErrorInsertRes = await insertUniqBulkJobErrorsPerObj({
                        executionId: this.data.executionId,
                        sobject: this.data.objectName,
                        errorCode,
                        fullError
                    });

                    // If the above insert returns a row, that meant this was the first time we inserted that object/errorCode/fullError combination. Insert a run log for that newly-encountered error.
                    if (uniqErrorInsertRes.rows.length) {
                        let errorMsg = `Bulk data load for object: ${this.data.objectName} encountered a new error: ${errorCode}. Further instances of this error will not be logged on this run. Full error: ${fullError}`;
                        console.warn(this.logPrefix + errorMsg);
                        if (errorCode == 'MISSING_FROM_RESULTS') {
                            errorMsg +=  ' These records will be processed on the next policy execution.';
                        } else {
                            errorMsg +=  ' More info on these error codes can be found here: https://developer.salesforce.com/docs/atlas.en-us.228.0.api.meta/api/sforce_api_calls_concepts_core_data_objects.htm';
                        }
                        const runLogInserted = await this.salesforce.insertRunLog(this.data.executionId, this.data.policyName, 'Error', 'Bulk Operation', errorMsg);
                    }
                }

                for (const [ errorCode, errorCount ] of Object.entries(errors)) {
                    const errorInsertRes = await insertBulkJobErrors({
                        jobId: jobInfo.id,
                        errorCode,
                        errorCount
                    });
                }
            }
        }
    }

    async submitSubUpdaterJob(batchInfoList) {

        // This should be enabled if we have an error code that needs a serial bulk retry at the end of the run. Currently, this is for 'l' lock errors.
        // If we later end up using the 'r' retry flag, that will also be applicable.
        let enableEndPhaseRetries = false;

        const subIdStateArr = [];

        for (const batchInfo of batchInfoList) {
            const { jobInfo, results, missingFromResultSfids, timedOut } = batchInfo;

            if (results) {
                let alreadyErrored = false;

                // Handle successful results
                const succIdStateArr = results.successfulResults.map(row => {
                    if (!row.sf__Id && !row.id && !alreadyErrored) {
                        console.error(`${this.logPrefix}One or more batch successful result rows did not have a sf__Id or id field! This should never happen.`);
                        console.log(`successRow:`, JSON.stringify(row));
                        alreadyErrored = true;
                    }
                    const id = row.sf__Id ? row.sf__Id : row.id ? row.id : null;
                    const state = 's';
                    return [ id, state ];
                });

                alreadyErrored = false;

                // Handle all errors
                const failedIdStateArr = results.failedResults.map(failedRow => {
                    if (!failedRow.sf__Id && !failedRow.id && !alreadyErrored) {
                        console.error(`${this.logPrefix}One or more batch result failed rows did not have an sf__Id or id field! This should never happen.`);
                        console.log(`failedRow:`, JSON.stringify(failedRow));
                        alreadyErrored = true;
                    }
                    const id = failedRow.sf__Id ? failedRow.sf__Id : failedRow.id ? failedRow.id : null;

                    let errorCode = failedRow.sf__Error;
                    if (!errorCode) {
                        errorCode = 'unknown';
                    } else {
                        errorCode = failedRow.sf__Error.replace(/:.*/, '');
                        if (errorCode == '') {
                            errorCode = 'unknown';
                        }
                    }

                    // Valid error codes:
                    // n - not submitted, initial default state on cache upsert from cache phase

                    // s - submitted successfully, bulk update completed

                    // l - row lock, should be resubmitted sequentially at the end of current run
                    // r - retry, separate from row lock, same submittal process though?
                    // f - failed retry

                    // e - errored - should be picked up on subsequent runs, but not on this one
                    // x - errored permanently - should never be processed again if possible. Atm, this is for cases where we try to delete an already-deleted record from the org.
                    // t - timed out - should be picked up on subsequent runs, but not on this one (not used currently)
                    // m - missing from results - should be picked up on subsequent runs, but not on this one. This is typically from aborting a job at max timeout. Sometimes it does not return any results.

                    let state;

                    if (this.data.isRetry) {
                        state = 'f';
                    // TODO FIELD_INTEGRITY_EXCEPTION should NOT be included in this list, this is just an easy way to test lock functionality.
                    // } else if (['UNABLE_TO_LOCK_ROW', 'FIELD_INTEGRITY_EXCEPTION'].includes(errorCode)) {
                    } else if (['UNABLE_TO_LOCK_ROW'].includes(errorCode)) {
                        state = 'l';
                        enableEndPhaseRetries = true;
                    } else if (['ENTITY_IS_DELETED'].includes(errorCode)) {
                        state = 'x';
                    } else {
                        state = 'e';
                    }

                    return [ id, state ];
                });

                // Records that were missing from the results on a timed out bulk call are set to m for missing from results
                const missingIdStateArr = missingFromResultSfids.map(missingSfid => {
                    return [ missingSfid, 'm' ];
                });

                // This will simulate row lock for testing rowlock retry logic. Should only be used in testing envs.
                // NOTE it will impact the look of the config bulk numbers some since this modifies it after the counts are submitted
                if (!this.data.isRetry && process.env.FORCE_BULK_LOCKS && this.job.id % 2 == 0) {
                    const numRecForceLock = succIdStateArr.length < 15 ? succIdStateArr.length : 15;
                    for (let i = 1; i <= numRecForceLock; i++) {
                        const entry = succIdStateArr.shift();
                        // if (i == 0) {
                        //     console.log(`Entry ind:0 BEFORE => ${JSON.stringify(entry)}`);
                        // }
                        entry[1] = 'l';
                        // if (i == 0) {
                        //     console.log(`Entry ind:0 AFTER => ${JSON.stringify(entry)}`);
                        // }
                        failedIdStateArr.push(entry);
                    }
                    enableEndPhaseRetries = true;
                }

                // for (const [ errorCode, errorCount ] of Object.entries(errors)) {
                //     if (['lockcodehere'].includes(errorCode)) {

                //     }
                // }

                subIdStateArr.push(...succIdStateArr, ...failedIdStateArr, ...missingIdStateArr);
                // subIds.push(...currIds);
            }
        }

        if (subIdStateArr.length) {
            try {
                console.log(`${this.logPrefix}Submitting cache-submitted-updater job for ${this.data.objectName} with ${subIdStateArr.length} records.`);
                const job = await handleJobSubmission({
                    queue: this.upStateQueue,
                    jobType: 'cache-submitted-updater',
                    jobData: {
                        executionId: this.data.executionId,
                        policyName: this.data.policyName,
                        objectName: this.data.objectName,
                        subIdStateArr
                    },
                    enableRetries: true,
                    noJobName: true
                });
                return [ job, enableEndPhaseRetries ];
            } catch (err) {
                throw new JobSubmissionError(`ERROR: Could not submit cache-submitted-updater job to modify queue. ${err.message}`);
            }
        } else {
            return [ null, enableEndPhaseRetries ];
        }
    }

    async resubmitUnprocessedRecords(batchInfoList) {
        const allUnprocRecords = [];
        for (const batchInfo of batchInfoList) {
            const { jobInfo, results } = batchInfo;
            // This will unfortunately double the memory useage a bit, of the unproc records
            if (results && results.unprocessedRecords.length) {
                allUnprocRecords.push(...results.unprocessedRecords);
            }
        }
        if (allUnprocRecords.length) {
            const bulkUpdaterJob = await this.submitBulkUpdater(allUnprocRecords);
            return bulkUpdaterJob;
        } else {
            return null;
        }
    }

    async submitBulkUpdater(unprocessedRecords) {
        console.log(`${this.logPrefix}Re-submitting unprocessed records to bulk-updater job for objectName: ${this.data.objectName} with ${unprocessedRecords.length} records...`);
        const job = await handleJobSubmission({
            queue: this.bulkQueue, // TODO
            jobType: 'bulk-updater',
            jobData: {
                ...this.data,
                batchRecords: unprocessedRecords,
                isUnproccRetry: true
            },
            enableRetries: false,
            // bullJobOptOverrides: {
            //     retries: 2
            // },
            noJobName: true
        });
        return job;
    }

}

module.exports = BulkUpdater;