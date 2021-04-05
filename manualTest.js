require('dotenv').config();

// const { LOCK_TYPES, LOCK_TYPE_MAP, acquireLock, releaseLock } = require('./controllers/worker/worker-utils/lock-utils');
// const { PHASE_FLAG_TYPES } = require('./controllers/worker/worker-utils/phase-flag');
// const { acquireAdvisoryLock } = require('./db-utils/advisory-lock');

// const advisoryLock = require('advisory-lock').default;

// const connectorAuthMiddleware = require('./routes/middleware/connector-auth');
// const BulkUpdater = require('./controllers/worker/bulk-updater');
// const { objectToSfCsv } = require('./models/salesforce/sf-csv-utils');
// const objectToSfCsv = require('./models/salesforce/object-to-sf-csv');
// const sleep = require('./utils/sleep');

// const { retrieveConfigVars } = require('./models/heroku/platform/apps');

const Salesforce = require('./models/salesforce');
const Bulk2Job = require('./models/salesforce/bulk2-job');
// const { safeCompare, hashConnApiKey } = require('./utils/connector-crypto-utils');
const salesforce = new Salesforce();
// const crypto = require('crypto');

// var ciphers = crypto.getCiphers();
// for(var i = 0; i < ciphers.length; i++) {
//     console.log(ciphers[i]);
// }

(async () => {
    // let base64data = Buffer.from('797f919433a30924fc2b2cc552ae2746:4555c5bcfad809d1805082d0e83d5823cd544c21244a3ed170f89acff65bd5c1').toString('base64');

    // console.log("converted to Base64 is " + base64data);

    // const res = await salesforce.getAllPartsByPolicyName('ZT1', true);
    const res2 = await salesforce.getAllParts(false);
    console.log(JSON.stringify(res2, undefined, 2));
    console.log(res2.policies.records.length, res2.objects.records.length, res2.fields.records.length);

    // console.log(JSON.stringify(await salesforce.getAllObjects(false), undefined, 2));

    // const bulk2Job = new Bulk2Job({
    //     object: 'Contact',
    //     operation: 'upsert',
    //     externalIdFieldName: 'id'
    // });

    // const allRes = await bulk2Job.getAllResults('7503g0000063mJp');
    // console.log(JSON.stringify(allRes, undefined, 2));

})();



// const hashedApiKey = hashConnApiKey(process.env.PRIVACYCENTER_CONN_API_KEY);
// console.log(hashedApiKey);

// async function connectorAuthMiddlewareTest(recHashedApiKey) {
//     // const recHashedApiKey = req.get('authorization');
//     // if (!req.get('authorization')) {
//     //     // TODO - Force credentials to be used once we have the automated config var update implemented if an existing app doesn't have these keys defined
//     //     console.error(`No credentials sent on connector request! Proceeding for now...`);
//     //     // return res.status(403).json({ error: 'No credentials sent!' });
//     //     next();
//     // }

//     if (!safeCompare(recHashedApiKey, hashedApiKey)) {
//         console.error(`Connector credentials did not match!`);
//         return;
//         // return res.status(401).json({ error: 'Unauthorized!' });
//     }
//     console.log(`Connector credentials authorized, proceeding.`);
//     // next();
// }

// const throng = require('throng');
// const sleep = require('./utils/sleep');
// const { Client } = require('pg');
// throng({
//     master: startMaster,
//     worker: startWorker, // Fn to call in cluster workers (can be async)
//     count: 5, // Number of workers (WEB_CONCURRENCY =~ cpu count)
//     lifetime: Infinity, // Min time to keep cluster alive (ms)
//     grace: 5000 // Grace period between signal and hard shutdown (ms)
// });

// const HerokuModel = require('./models/heroku');
// const heroku = new HerokuModel();

// const { buildQuery } = require('./db-utils/query-builders');


// async function startMaster() {
//     const startMs = new Date().getTime();
//     console.log(`Setting timeout...`);
//     setTimeout(() => {
//         console.log(`GOAL 5 HOUR TIMEOUT REACHED!`);
//         process.exit();
//     }, 5 * 60 * 60 * 1000); // 5 hours

//     console.log(`Time passed: ${((new Date().getTime() - startMs) / 1000 / 60).toFixed(0)} minutes`);

//     setInterval(() => {
//         console.log(`Time passed: ${((new Date().getTime() - startMs) / 1000 / 60).toFixed(0)} minutes`);
//     }, 10 * 60 * 1000); // 10 minutes
// }

async function startWorker(id) {
    try {

        // console.log(PHASE_FLAG_TYPES);
        // console.log(PHASE_FLAG_TYPES.HALT);

        // console.log(Object.values(LOCK_TYPES));
        // console.log(LOCK_TYPES);
        // console.log(LOCK_TYPE_MAP);
        // console.log(LOCK_TYPES.SERIAL_BULK);
        // console.log(LOCK_TYPE_MAP[LOCK_TYPES.SERIAL_BULK]);

        // const DBModel = require('./models/database');
        // const db = new DBModel();

        // // Set first lock
        // // await acquireAdvisoryLock(db, 1234);
        // // await acquireLock(db, LOCK_TYPES.TEST);

        // // new Client({
        // //     connectionString: process.env.DATABASE_URL,
        // //     ssl: {
        // //         rejectUnauthorized: false
        // //     }
        // // }).connect((err) => {
        // //     console.log(`Connected`, err);
        // // });

        // // console.log(advisoryLock);
        // // const mutex = advisoryLock({
        // //     connectionString: process.env.DATABASE_URL,
        // //     ssl: {
        // //         rejectUnauthorized: false
        // //     }
        // // })('some-lock');
        // // console.log(`mutex created`, mutex);

        // // eslint-disable-next-line
        // // function runMe(index) {

        // // This should block forever basically
        // await acquireLock(db, LOCK_TYPES.TEST);
        // // await acquireLock(db, LOCK_TYPES.SERIAL_BULK);
        // console.log(`HERE ${id}`);

        // await sleep(100 * 60 * 1000); // 100 minutes
        // // return Promise.resolve();
        // // }

        // await releaseLock(db, LOCK_TYPES.TEST);


        // mutex
        //     .withLock(runMe.bind(this, id)) // "blocks" until lock is free
        //     // .withLock(runMe) // "blocks" until lock is free
        //     .catch((err) => {
        //         // this gets executed if the postgres connection closes unexpectedly, etc.
        //         console.log(`Error:`, err);
        //     })
        //     .then(() => {
        //         console.log(`UNLOCKED`);
        //         // lock is released now...
        //     });

        // try {
        //     console.log(`acquiring lock...`);
        //     await mutex.lock();
        //     console.log(`lock acquired`);
        // } catch (err) {
        //     console.error(err);
        // }

        // mutex.tryLock().then((obtainedLock) => {
        //     console.log(`obtainedLock:` , obtainedLock);
        //     if (obtainedLock) {
        //         return runMe(id).then(() => mutex.unlock());
        //     } else {
        //         throw new Error('failed to obtain lock');
        //     }
        // });

        // await releaseLock(db, LOCK_TYPES.TEST);
        // console.log(`I shouldn't make it here ${index}!`);
        // await releaseLock(db, LOCK_TYPES.SERIAL_BULK);
        // await releaseLock(db, LOCK_TYPES.TEST);
        // }

        // await releaseLock(db, LOCK_TYPES.SERIAL_BULK);
        // const promises = [];
        // for (let i = 1; i <= 10; i++) {
        //     promises.push(runMe(i));
        // }

        // setTimeout(() => {
        //     console.log(`GOAL 5 HOUR TIMEOUT REACHED!`);
        //     process.exit();
        // }, 5 * 60 * 60 * 1000); // 5 hours

        // setInterval(() => {
        //     console.log(`Time passed: ${((new Date().getTime() - startMs) / 1000 / 60).toFixed(0)}`);
        // }, 10 * 60 * 1000); // 10 minutes

        // await Promise.all(promises);
        // console.log('Made it past the lock! Should not happen.');


        // console.log(`authSuccessful: ${authSuccessful}`);

        // await connectorAuthMiddlewareTest(hashConnApiKey(process.env.PRIVACYCENTER_CONN_API_KEY));

        // const policyList = await salesforce.getPolicyByName('ZGrand2');
        // const policyId = policyList.records[0].Id;
        // console.log(`policyId: ${policyId}`);

        // const cmdoList = await salesforce.getObjectsByPolicyId(policyId);
        // console.log(JSON.stringify(cmdoList, undefined, 2));



        // const res = await salesforce.retrieveObjectsByIds([
        //     "m013g000000XuKgAAK",
        //     "m013g000000XuKlAAK",
        //     "m013g000000XuKqAAK"
        // ]);
        // console.log(`res => ${JSON.stringify(res, undefined, 2)}`);

        // const objects = [
        //     {
        //         "Id": "m013g000000XuKgAAK",
        //         // "Parent_Object_ID__c": "m013g000000XuKqAAK",
        //         "MasterLabel": "AccountZGrand2Up"
        //     }
        // ];

        // const res2 = await salesforce.updateObjects(objects);
        // console.log(`res2 => ${JSON.stringify(res2, undefined, 2)}`);

        // // const md = await salesforce.readAllMetadata();
        // // console.log(`md => ${JSON.stringify(md, undefined, 2)}`);

        // const type = 'CustomObject';
        // const fullNames = [
        //     "Data_Object__mdt",
        // ];
        // const md = await salesforce.readMetadata(type, fullNames);
        // console.log(`md => ${JSON.stringify(md, undefined, 2)}`);





        // const res = await salesforce.updateObjectMetadata(objects);
        // console.log(`Res => ` + JSON.stringify(res, undefined, 2));

        // const bulkUpdater = new BulkUpdater({
        //     job: {
        //         data: {
        //             policyWrapper: {
        //                 fake: 'fakeval'
        //             },
        //             executionId: 1608150184112,
        //             policyName: 'mantest',
        //             objectName: 'Account',
        //             objectHash: 'fakehash',
        //             recordRetention: 'transform',
        //             batchRecords: [
        //                 { id: '0013g00000BmUIGAA3', name: 'secondname' }
        //             ]
        //         }
        //     },
        //     salesforce: 'fakeobject',
        //     modifyQueue: 'fakeobject'
        // });

        // const res = await bulkUpdater.run();
        // console.log(`res => `, res);





        //     // const res = await retrieveConfigVars(process.env.CUST_HEROKU_APP_UUID, 'self');
        //     // const res = await retrieveConfigVars(process.env.CUST_HEROKU_APP_UUID, 'self');
        //     // const res = await retrieveConfigVars('dmaskf2-pc-cust', 'customer');

        //     const Bulk2Job = require('./models/salesforce/bulk2-job');
        //     const job = new Bulk2Job({
        //         object: 'Account',
        //         operation: 'delete', // operation options: insert, upsert, update, delete, query, queryAll
        //         externalIdFieldName: null // Only needed up upsert
        //     });

        // const objArr = [
        //     {
        //         id: '0013g00"000Cw"jv3AAB',
        //     },
        //     {
        //         id: '0013g00000Cwjv4AAB',
        //     }
        // ];
        // console.log(`objArr => `, objArr);

        // const csv = await objectToSfCsv(objArr);
        // console.log(`csv => \n`, csv);

        //     // Create job
        //     try {
        //         console.log(`=== Creating new job...`);
        //         await job.createJob();

        //         try {
        //             console.log(`=== Retrieving job info...`);
        //             const jobInfo = await job.getJobInfo();
        //             console.log(`jobInfo => `, jobInfo);

        //             try {
        //                 console.log(`=== Uploading job csv...`);
        //                 const uploadResData = await job.uploadJobData(objArr);
        //                 console.log(`uploadResData => `, uploadResData);

        //                 try {
        //                     console.log(`=== Retrieving POST job info...`);
        //                     const jobInfo = await job.getJobInfo();
        //                     console.log(`POST jobInfo => `, jobInfo);

        //                     try {
        //                         console.log(`=== Closing job...`);
        //                         const closeData = await job.closeJob();
        //                         console.log(`closeData => `, closeData);

        //                         try {
        //                             console.log(`=== Sleeping 5 seconds...`);
        //                             await sleep(5000);

        //                             console.log(`=== Retrieving POST CLOSE job info...`);
        //                             const jobInfo = await job.getJobInfo();
        //                             console.log(`POST jobInfo => `, jobInfo);

        //                             const res = await job.getAllResults();
        //                             console.log(`res => \n`, res);
        //                             // const successfulResults = await job.getSuccessfulResults();
        //                             // const failedResults = await job.getFailedResults();
        //                             // const unprocessedRecords = await job.getUnprocessedRecords();

        //                             // console.log(`successfulResults => `, successfulResults);
        //                             // console.log(`failedResults => `, failedResults);
        //                             // console.log(`unprocessedRecords => `, unprocessedRecords);

        //                         } catch (err) {
        //                             console.error(`Error getting POST CLOSE job info: `, err.message);
        //                         }
        //                     } catch (err) {
        //                         console.error(`Error closing job: `, err.message);
        //                     }
        //                 } catch (err) {
        //                     console.error(`Error getting POST job info: `, err.message);
        //                 }
        //             } catch (err) {
        //                 console.error(`Error uploading job csv: `, err.message);
        //             }
        //         } catch (err) {
        //             console.error(`Error getting job info: `, err.message);
        //         }
        //     } catch (err) {
        //         console.error(`Error creating job: `, err.message);
        //     }


        //     // Close the job

        //     // Check the status of the job

        //     // Resubmit (via new job) or otherwise handle failed or unprocessed records


    } catch (err) {
        console.error(`Error: `, err);
    }

    // const query = buildQuery('salesforce.user', '*', 200000, true, ' condition is not null ', 'salesforce.account', 'salesforce.user.accountid', 2234832, null, 1605127574354, 'sld8s73js9');


    // const query2 = buildQuery('cache.user', '*', 200000, true, ' condition is not null ', 'cache.account', 'cache.user.accountid', 2234832, null, 1605127574354, 'sld8s73js9');


    // try {
    //     const configVars = await heroku.getConfigVars(process.env.CUST_HEROKU_ACCESS_TOKEN);
    //     // console.log('Config vars => ', configVars);
    // } catch (err) {
    //     console.error(`Caught error: `, err);
    // }
    // try {
    //     // const res = await salesforce.getActivePolicies();
    //     const res = await salesforce.getPolicyByName('ZSimple');
    //     console.log(`res: `, res);
    // } catch (err) {
    //     console.log(`Error: `, err);
    // }
// })();
}


// const getIndexDetails = require("./db-utils/get-index-details");

// // const { buildQuery, buildCountAndFinalIdQuery } = require('./db-utils/query-builders');
// console.log('Started!');


// async function buildCacheIndexes(objectNames) {
//     const indexDetails = await getIndexDetails(db, [ 'salesforce', 'cache' ]);

//     const sfIndexes = indexDetails.filter(obj => obj.schema_name == 'salesforce');
//     const cacheIndexes = indexDetails.filter(obj => obj.schema_name == 'cache');

//     const indexCreateQueries = [];

//     // Loop over each index on the salesforce tables (for the object in the current policy only), if it doesn't exist on the same field in the cache schema, create it.
//     for (const sfIndex of sfIndexes.filter(sfIndex => objectNames.includes(sfIndex.table_name))) {
//         // Try to find a match in the cache table indexes where both the table name and column list matches, we don't check anything else currently.
//         if (cacheIndexes.findIndex(cacheIndex => sfIndex.table_name == cacheIndex.table_name && sfIndex.columns == cacheIndex.columns) == -1) {
//             console.log(`! Creating query for missing index on cache table: ${sfIndex.table_name} columns: ${sfIndex.columns} !`);
//             const cacheIndexCreateQuery = sfIndex.def.replace('ON salesforce.', 'ON cache.');
//             indexCreateQueries.push(cacheIndexCreateQuery);
//         }
//     }

//     if (indexCreateQueries.length) {
//         console.log(`Creating ${indexCreateQueries.length} indexes...`);
//         try {
//             indexCreateQueries.forEach(icq => console.log(`Executing index creation query => ${icq}`));
//             const indexCreatePromises = indexCreateQueries.map(icq => db.createQuery(icq));
//             const indexCreateResults = await Promise.all(indexCreatePromises);
//             console.log(`Index creation results: ${JSON.stringify(indexCreateResults)}`);
//             return indexCreateResults.length;
//         } catch (err) {
//             console.error(`!! Error creating one or more cache table indexes: `, err);
//             return -1;
//         }
//     } else {
//         return 0;
//     }

// }

// (async () => {

//     try {
//         // const res = await getIndexDetails(db, [ 'salesforce', 'cache' ]);
//         const res = await buildCacheIndexes([ 'account' ]);
//         console.log(`res => ${JSON.stringify(res, undefined, 2)}`);
//     } catch (err) {
//         console.error(`Error: `, err);
//     }
// })();

// const { tableLimit, recordSetSize, maxJobsPerWorkerHeavyCPU, maxJobsPerWorkerHeavyNetwork, workers, skipSFDeletes, redisSettings } = require('./settings');
// const Queue = require('bull');

// const workQueue = new Queue('mytest', process.env.REDIS_URL, { settings: redisSettings });

// const redisModel = require('./models/redis');

// function sleep(ms) {
//     return new Promise((resolve) => {
//         setTimeout(resolve, ms);
//     });
// }

// // let i = 0;
// workQueue.process('testcallout', 4, async (job) => {
//     console.log(`callout process invoked, j=${job.data.j} attemptMade: ${job.attemptsMade} vs opts.attempts: ${job.opts.attempts}`);
//     // i++;
//     if (job.data.j > 5) {
//         throw new Error('Test error!');
//     }
//     console.log(`callout job running: jobId:${job.id} ${JSON.stringify(job.data)}`);
//     await sleep(4000);
// });

// workQueue.on('completed', job => {
//     console.log(`Job type:${job.name} id:${job.id} has completed  j:${job.data.j}`);
// });

// workQueue.on('failed', (job, result) => {
//     console.error(`!!! Job type:${job.name} id:${job.id} has failed with result: ${JSON.stringify(result)} j:${job.data.j}`);
//     console.log(`attemptsMade:${job.attemptsMade} attempts:${job.opts.attempts}`);
//     if (job.attemptsMade >= job.opts.attempts) {
//         console.error(`MAXIMUM RETRIES REACHED for id:${job.id} j:${job.data.j}`);
//     }
//     console.log(JSON.stringify(job, undefined, 2));
// });

// workQueue.on('stalled', (job, result) => {
//     console.error(`!!! Job type:${job.data.jobType} id:${job.id} has failed with result: ${JSON.stringify(result)}`);
// });

// // workQueue.on('waiting', function(jobId){
// //     console.log('A Job is waiting to be processed as soon as a worker is idling.');
// // });

// // workQueue.on('active', function(job, jobPromise){
// //     console.log('A job has started. You can use `jobPromise.cancel()`` to abort it.');
// // });

// (async () => {
//     let redisDB = new redisModel();
//     await redisDB.flushAll();
//     console.log('Adding callout jobs');
//     for (let j = 0; j <= 6; j++) {
//         // console.log(`j: ${j}`);
//         try {
//             await workQueue.add('testcallout', {
//                 jobType: 'testcallout',
//                 foo: 'bar',
//                 j
//             }, { removeOnComplete: true });
//             // }, { removeOnComplete: true, attempts: 3, backoff: { type: 'exponential' } });
//             // console.log(`Added!`);
//         } catch (err) {
//             console.error('Error adding callout job', err);
//         }
//     }
// })();







// setInterval(async () => {
//     console.log(JSON.stringify(await workQueue.getJob('1'), undefined, 2));
//     console.log(await workQueue.getJobs(['testcallout']));
//     console.log(JSON.stringify(await workQueue.getJobCounts(), undefined, 2));
// }, 2000);

// const policyWrapperJSON = '{"sfid":"m023t000000U7GkAAK","label":"ZacTest20201013","name":"ZacTest20201013","createdDate":"2020-10-13","policyObjects":[{"object_name":"opportunity","where_connect":"salesforce.opportunity.sfid = \\"0063t00000uYDIWAA4\\" AND salesforce.opportunity.amount > 0","where_cache":"cache.opportunity.sfid = \\"0063t00000uYDIWAA4\\" AND cache.opportunity.amount > 0","record_retention":"Delete","child":false,"parent_object":null,"master_field":null,"fields":[{"field":"CampaignId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"IsClosed","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"ForecastCategory","action":"Retain","field_length":40,"field_type":"Picklist","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"OwnerId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"HasOpportunityLineItem","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"StageName","action":"Retain","field_length":40,"field_type":"Picklist","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"LastModifiedDate","action":"Retain","field_length":0,"field_type":"Date","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"CreatedById","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"HasOverdueTask","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"IsWon","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"IsPrivate","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"CloseDate","action":"Retain","field_length":0,"field_type":"Date","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"HasOpenActivity","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"Amount","action":"Retain","field_length":0,"field_type":"Number","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"LastModifiedById","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false}]},{"object_name":"opportunitylineitem","where_connect":"salesforce.opportunity.sfid = \\"0063t00000uYDIWAA4\\" AND salesforce.opportunity.amount > 0","where_cache":"cache.opportunity.sfid = \\"0063t00000uYDIWAA4\\" AND cache.opportunity.amount > 0","record_retention":null,"child":true,"parent_object":"Opportunity","master_field":"OpportunityId","fields":[{"field":"SortOrder","action":"Retain","field_length":0,"field_type":"Number","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"Quantity","action":"Retain","field_length":0,"field_type":"Number","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"OpportunityId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"LastModifiedDate","action":"Retain","field_length":0,"field_type":"Date","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"LastModifiedById","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"CreatedById","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false}]}],"connectObjects":[{"object_name":"opportunity","fields":[{"field":"amount","data_type":"double precision"},{"field":"campaignid","data_type":"character varying"},{"field":"closedate","data_type":"date"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"forecastcategory","data_type":"character varying"},{"field":"hasopenactivity","data_type":"boolean"},{"field":"hasopportunitylineitem","data_type":"boolean"},{"field":"hasoverduetask","data_type":"boolean"},{"field":"id","data_type":"integer"},{"field":"isclosed","data_type":"boolean"},{"field":"isdeleted","data_type":"boolean"},{"field":"isprivate","data_type":"boolean"},{"field":"iswon","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"name","data_type":"character varying"},{"field":"ownerid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"stagename","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"opportunitylineitem","fields":[{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"name","data_type":"character varying"},{"field":"opportunityid","data_type":"character varying"},{"field":"quantity","data_type":"double precision"},{"field":"sfid","data_type":"character varying"},{"field":"sortorder","data_type":"integer"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"account","fields":[{"field":"annualrevenue","data_type":"double precision"},{"field":"billingcity","data_type":"character varying"},{"field":"billingstate","data_type":"character varying"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"name","data_type":"character varying"},{"field":"numberofemployees","data_type":"integer"},{"field":"ownerid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"accounthistory","fields":[{"field":"accountid","data_type":"character varying"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"field","data_type":"character varying"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"sfid","data_type":"character varying"}]},{"object_name":"case","fields":[{"field":"accountid","data_type":"character varying"},{"field":"assetid","data_type":"character varying"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"id","data_type":"integer"},{"field":"isclosed","data_type":"boolean"},{"field":"isdeleted","data_type":"boolean"},{"field":"isescalated","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"ownerid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"subject","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"casefeed","fields":[{"field":"body","data_type":"text"},{"field":"commentcount","data_type":"integer"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"isrichtext","data_type":"boolean"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"likecount","data_type":"integer"},{"field":"parentid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"contact","fields":[{"field":"createddate","data_type":"timestamp without time zone"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"lastname","data_type":"character varying"},{"field":"name","data_type":"character varying"},{"field":"ownerid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"contactpointemail","fields":[{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"emailaddress","data_type":"character varying"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"isprimary","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"name","data_type":"character varying"},{"field":"ownerid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"event","fields":[{"field":"accountid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"id","data_type":"integer"},{"field":"isalldayevent","data_type":"boolean"},{"field":"isdeleted","data_type":"boolean"},{"field":"isprivate","data_type":"boolean"},{"field":"isreminderset","data_type":"boolean"},{"field":"ownerid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"idea","fields":[{"field":"createddate","data_type":"timestamp without time zone"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"sfid","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"lead","fields":[{"field":"annualrevenue","data_type":"double precision"},{"field":"cleanstatus","data_type":"character varying"},{"field":"company","data_type":"character varying"},{"field":"companydunsnumber","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"email","data_type":"character varying"},{"field":"firstname","data_type":"character varying"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"isunreadbyowner","data_type":"boolean"},{"field":"lastname","data_type":"character varying"},{"field":"name","data_type":"character varying"},{"field":"ownerid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"status","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"note","fields":[{"field":"body","data_type":"text"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"isprivate","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"ownerid","data_type":"character varying"},{"field":"parentid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]}],"cacheObjects":[{"object_name":"opportunity","fields":[{"field":"amount","data_type":"double precision"},{"field":"campaignid","data_type":"character varying"},{"field":"closedate","data_type":"date"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"forecastcategory","data_type":"character varying"},{"field":"hasopenactivity","data_type":"boolean"},{"field":"hasopportunitylineitem","data_type":"boolean"},{"field":"hasoverduetask","data_type":"boolean"},{"field":"id","data_type":"integer"},{"field":"isclosed","data_type":"boolean"},{"field":"isdeleted","data_type":"boolean"},{"field":"isprivate","data_type":"boolean"},{"field":"iswon","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"name","data_type":"character varying"},{"field":"ownerid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"stagename","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"opportunitylineitem","fields":[{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"name","data_type":"character varying"},{"field":"opportunityid","data_type":"character varying"},{"field":"quantity","data_type":"double precision"},{"field":"sfid","data_type":"character varying"},{"field":"sortorder","data_type":"integer"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]}]}';

// try {
//     const policyWrapper = JSON.parse(policyWrapperJSON);
//     console.log(`parsed! ${JSON.stringify(policyWrapper, undefined, 2)}`);
// } catch (err) {
//     console.error(err);
// }

// const val = '{"sfid":"m023t000000U7W2AAK","label":"Test1","name":"Test1","createdDate":"2020-10-16","policyObjects":[{"object_name":"account","where_connect":null,"where_cache":null,"record_retention":"Delete","child":false,"parent_object":null,"master_field":null,"fields":[{"field":"BillingCity","action":"Retain","field_length":40,"field_type":"Text","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"DandbCompanyId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"BillingStreet","action":"Retain","field_length":255,"field_type":"Text","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"DunsNumber","action":"Retain","field_length":9,"field_type":"Text","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"CreatedById","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"Description","action":"Retain","field_length":32000,"field_type":"Text","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"BillingState","action":"Retain","field_length":80,"field_type":"Text","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"BillingGeocodeAccuracy","action":"Retain","field_length":40,"field_type":"Picklist","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"AccountSource","action":"Retain","field_length":40,"field_type":"Picklist","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"BillingLongitude","action":"Retain","field_length":0,"field_type":"Number","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"OwnerId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"ParentId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"BillingCountry","action":"Retain","field_length":80,"field_type":"Text","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"LastModifiedDate","action":"Retain","field_length":0,"field_type":"Date","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"CleanStatus","action":"Retain","field_length":40,"field_type":"Picklist","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"AccountNumber","action":"Retain","field_length":40,"field_type":"Text","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"BillingPostalCode","action":"Retain","field_length":20,"field_type":"Text","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"EmailAddress","action":"Retain","field_length":80,"field_type":"Email","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"AnnualRevenue","action":"Retain","field_length":0,"field_type":"Number","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"BillingLatitude","action":"Retain","field_length":0,"field_type":"Number","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"LastModifiedById","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"IsPrimary","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false}]},{"object_name":"opportunity","where_connect":null,"where_cache":null,"record_retention":"Delete","child":false,"parent_object":null,"master_field":null,"fields":[{"field":"ContactId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"IsPrivate","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"HasOpenActivity","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"ForecastCategory","action":"Retain","field_length":40,"field_type":"Picklist","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"CloseDate","action":"Retain","field_length":0,"field_type":"Date","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"CampaignId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"IsClosed","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"AccountId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"OwnerId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"IsWon","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"HasOverdueTask","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"Amount","action":"Retain","field_length":0,"field_type":"Number","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"HasOpportunityLineItem","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"ContractId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"CreatedById","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"LastModifiedById","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"LastModifiedDate","action":"Retain","field_length":0,"field_type":"Date","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"StageName","action":"Retain","field_length":40,"field_type":"Picklist","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false}]},{"object_name":"contactpointemail","where_connect":null,"where_cache":null,"record_retention":null,"child":true,"parent_object":"Account","master_field":"ParentId","fields":[{"field":"CreatedById","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"ActiveToDate","action":"Retain","field_length":0,"field_type":"Date","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"ParentId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"EmailAddress","action":"Retain","field_length":80,"field_type":"Email","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"EmailMailBox","action":"Retain","field_length":250,"field_type":"Text","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"IsPrimary","action":"Retain","field_length":0,"field_type":"Boolean","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"BestTimeToContactEndTime","action":"Retain","field_length":0,"field_type":"Time","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"OwnerId","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"LastModifiedDate","action":"Retain","field_length":0,"field_type":"Date","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"BestTimeToContactStartTime","action":"Retain","field_length":0,"field_type":"Time","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"BestTimeToContactTimezone","action":"Retain","field_length":255,"field_type":"Picklist","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"LastModifiedById","action":"Retain","field_length":18,"field_type":"Id","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false},{"field":"EmailLatestBounceDateTime","action":"Retain","field_length":0,"field_type":"Date","start_date":null,"end_date":null,"range_min":null,"range_max":null,"unique":false}]}],"connectObjects":[{"object_name":"account","fields":[{"field":"accountnumber","data_type":"character varying"},{"field":"accountsource","data_type":"character varying"},{"field":"annualrevenue","data_type":"double precision"},{"field":"billingcity","data_type":"character varying"},{"field":"billingcountry","data_type":"character varying"},{"field":"billinggeocodeaccuracy","data_type":"character varying"},{"field":"billinglatitude","data_type":"double precision"},{"field":"billinglongitude","data_type":"double precision"},{"field":"billingpostalcode","data_type":"character varying"},{"field":"billingstate","data_type":"character varying"},{"field":"billingstreet","data_type":"character varying"},{"field":"cleanstatus","data_type":"character varying"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"dandbcompanyid","data_type":"character varying"},{"field":"description","data_type":"text"},{"field":"dunsnumber","data_type":"character varying"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"name","data_type":"character varying"},{"field":"ownerid","data_type":"character varying"},{"field":"parentid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"opportunity","fields":[{"field":"accountid","data_type":"character varying"},{"field":"amount","data_type":"double precision"},{"field":"campaignid","data_type":"character varying"},{"field":"closedate","data_type":"date"},{"field":"contactid","data_type":"character varying"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"forecastcategory","data_type":"character varying"},{"field":"hasopenactivity","data_type":"boolean"},{"field":"hasopportunitylineitem","data_type":"boolean"},{"field":"hasoverduetask","data_type":"boolean"},{"field":"id","data_type":"integer"},{"field":"isclosed","data_type":"boolean"},{"field":"isdeleted","data_type":"boolean"},{"field":"isprivate","data_type":"boolean"},{"field":"iswon","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"name","data_type":"character varying"},{"field":"ownerid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"stagename","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"contactpointemail","fields":[{"field":"activetodate","data_type":"date"},{"field":"besttimetocontactendtime","data_type":"time without time zone"},{"field":"besttimetocontactstarttime","data_type":"time without time zone"},{"field":"besttimetocontacttimezone","data_type":"character varying"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"emailaddress","data_type":"character varying"},{"field":"emaillatestbouncedatetime","data_type":"timestamp without time zone"},{"field":"emailmailbox","data_type":"character varying"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"isprimary","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"name","data_type":"character varying"},{"field":"ownerid","data_type":"character varying"},{"field":"parentid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]}],"cacheObjects":[{"object_name":"account","fields":[{"field":"accountnumber","data_type":"character varying"},{"field":"accountsource","data_type":"character varying"},{"field":"annualrevenue","data_type":"double precision"},{"field":"billingcity","data_type":"character varying"},{"field":"billingcountry","data_type":"character varying"},{"field":"billinggeocodeaccuracy","data_type":"character varying"},{"field":"billinglatitude","data_type":"double precision"},{"field":"billinglongitude","data_type":"double precision"},{"field":"billingpostalcode","data_type":"character varying"},{"field":"billingstate","data_type":"character varying"},{"field":"billingstreet","data_type":"character varying"},{"field":"cleanstatus","data_type":"character varying"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"dandbcompanyid","data_type":"character varying"},{"field":"description","data_type":"text"},{"field":"dunsnumber","data_type":"character varying"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"name","data_type":"character varying"},{"field":"ownerid","data_type":"character varying"},{"field":"parentid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"opportunity","fields":[{"field":"accountid","data_type":"character varying"},{"field":"amount","data_type":"double precision"},{"field":"campaignid","data_type":"character varying"},{"field":"closedate","data_type":"date"},{"field":"contactid","data_type":"character varying"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"forecastcategory","data_type":"character varying"},{"field":"hasopenactivity","data_type":"boolean"},{"field":"hasopportunitylineitem","data_type":"boolean"},{"field":"hasoverduetask","data_type":"boolean"},{"field":"id","data_type":"integer"},{"field":"isclosed","data_type":"boolean"},{"field":"isdeleted","data_type":"boolean"},{"field":"isprivate","data_type":"boolean"},{"field":"iswon","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"name","data_type":"character varying"},{"field":"ownerid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"stagename","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]},{"object_name":"contactpointemail","fields":[{"field":"activetodate","data_type":"date"},{"field":"besttimetocontactendtime","data_type":"time without time zone"},{"field":"besttimetocontactstarttime","data_type":"time without time zone"},{"field":"besttimetocontacttimezone","data_type":"character varying"},{"field":"createdbyid","data_type":"character varying"},{"field":"createddate","data_type":"timestamp without time zone"},{"field":"emailaddress","data_type":"character varying"},{"field":"emaillatestbouncedatetime","data_type":"timestamp without time zone"},{"field":"emailmailbox","data_type":"character varying"},{"field":"id","data_type":"integer"},{"field":"isdeleted","data_type":"boolean"},{"field":"isprimary","data_type":"boolean"},{"field":"lastmodifiedbyid","data_type":"character varying"},{"field":"lastmodifieddate","data_type":"timestamp without time zone"},{"field":"name","data_type":"character varying"},{"field":"ownerid","data_type":"character varying"},{"field":"parentid","data_type":"character varying"},{"field":"sfid","data_type":"character varying"},{"field":"systemmodstamp","data_type":"timestamp without time zone"}]}]}'

// console.log(JSON.stringify(JSON.parse(val), undefined, 2 }));

// const { tableLimit } = require('./settings');
// const { Pool } = require('pg');
// const { TableNotFoundError } = require('./errors');

// const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//     ssl: {
//         rejectUnauthorized: false
//     }
// });

// // const { retrievePolicyWrapperFromConfigTbBySFID } = require('./controllers/connect');
// // const policyWrapper = await retrievePolicyWrapperFromConfigTbBySFID("m023t000000U7GkAAK");
// // // console.log(JSON.stringify(policyWrapper, undefined, 2).slice(0,1000 }));
// // console.log(policyWrapper);
// const client = await pool.connect();

// const tableLimit = 100;

// const schemaObject = 'salesforce.contact';

// // const tableDetails = await client.query(`SELECT count(x.*) cnt, max(x.id) lastid FROM ( select ${schemaObject}.id from ${schemaObject} ORDER BY ${schemaObject}.id desc LIMIT ${tableLimit} ) x;`);

// // schemaObject = requiredParam('schemaObject'),
// // tableLimit = null,
// // isChild,
// // where,
// // schemaParentObject,
// // schemaMasterField

// const queryString = buildCountAndFinalIdQuery(schemaObject, tableLimit, true, 'firstname is not null', 'account', 'accountid');
// try {
// const tableDetails = await client.query(queryString);

// const tableCount = tableDetails.rows[0].cnt;
// const finalId = tableDetails.rows[0].finalid;
// // const finalIdQuery = await client.query(`SELECT ${schemaObject}.id FROM ${schemaObject} ORDER BY ${schemaObject}.id DESC LIMIT 1;`);

// // if (finalIdQuery.rowCount > 0) {
//     // finalId = finalIdQuery.rows[0].id;
// // }
// console.log(`tableCount: ${tableCount}  finalId: ${finalId}`);
// // console.log(`tableDetails: ${JSON.stringify(tableDetails, undefined, 2)}`);
// } catch (err) {
//     console.error(`Error from count/final query: `, err);
//     if (err.code && err.code === '42P01') {
//         console.error(`Table not found error! Doing nothing for this error for testing.`);
//         // throw new TableNotFoundError(err.message);
//     } else {
//         throw err;
//     }
// }

// const { namespace } = require('./settings');

// const obj = {
//     privacycenter__Created_Date__c: 'iamnamespaced',
//     Created_Date__c: 'iamNOTnamespaced'
// };

// console.log(`namespace: x ${namespace} x`);
// console.log(obj[`${namespace}Created_Date__c`]);

// }
