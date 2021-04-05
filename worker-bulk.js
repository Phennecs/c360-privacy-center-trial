require('dotenv').config();
const v8 = require('v8');
const throng = require('throng');
const { maxJobsPerWorkerHeavyNetwork, workers } = require('./settings');
const { BulkUpdateError } = require('./errors');
const { handleJobCompleted, handleJobFailure, handleJobStalled } = require('./controllers/worker/worker-utils/job-gateway');
const SalesforceModel = require('./models/salesforce');
const DBModel = require('./models/database');

if (!process.env.REDIS_URL) {
    console.log(`REDIS_URL is not set, will not proceed!`);
    return;
}
const { bulkQueue, modifyQueue, upStateQueue } = require('./models/queue');

const BulkUpdater = require('./controllers/worker/bulk-updater');
const { insertPhaseFlag, PHASE_FLAG_TYPES } = require('./controllers/worker/worker-utils/phase-flag');

throng({
    worker: startWorker, // Fn to call in cluster workers (can be async)
    count: workers, // Number of workers (WEB_CONCURRENCY =~ cpu count)
    lifetime: Infinity, // Min time to keep cluster alive (ms)
    grace: 5000 // Grace period between signal and hard shutdown (ms)
});

async function startWorker(id, disconnect) {

    const stats = v8.getHeapStatistics();
    console.log(`Throng worker started with id: ${id}   maxHeapSize: ${(stats.heap_size_limit/1024/1024).toFixed(0)} mb`);

    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);

    function shutdown() {
        console.log(`Throng worker id: ${ id } shutdown invoked.`);
        disconnect();
    }

    const db = new DBModel();
    const salesforce = new SalesforceModel();

    //**********************************//
    //******* CHUNK TRANSFORMER ********//
    //**********************************//
    bulkQueue.process(maxJobsPerWorkerHeavyNetwork, async (job) => {
        job.name = 'bulk-updater'; // This is not using a named processor, so add this in for metrics and event handlers to use.
        console.log(`${job.name} job started - jobId:${job.id} - policyName: ${job.data.policyName} executionId: ${job.data.executionId} - objectName: ${job.data.objectName}`);

        try {
            const bulkUpdater = new BulkUpdater({ job, salesforce, db, modifyQueue, bulkQueue, upStateQueue });
            const results = await bulkUpdater.run();
            console.log(`Bulk update results: ${JSON.stringify(results)}`);

            if (results.enableEndPhaseRetries) {
                const flagRes = await insertPhaseFlag(db, job.data.executionId, 'MODIFY', PHASE_FLAG_TYPES.SPECIAL, 'enableEndPhaseRetries');
            }

            if (!results.success) {
                throw new BulkUpdateError(results.error);
            }
        } catch (err) {
            if (err instanceof BulkUpdateError) {
                console.error(`Bulk update error`, err);
            } else {
                console.error(`bulk-updater error`, err);
            }
            // Throw error so job will fail and attempt to retry
            throw err;
        }

    });

    //*************************************//
    //******* QUEUE EVENT HANDLING ********//
    //*************************************//

    // Events that can be handled the same regardless of which queue can go here
    for (const queue of [ bulkQueue ]) {

        queue.on('completed', async (job, result) => {
            // const { elapsedSeconds, elapsedMs, elapsedNs } = calcElapsed(job.data.hrStart);
            await handleJobCompleted(job, result);
        });

        queue.on('stalled', async (job) => {
            // const { elapsedSeconds, elapsedMs, elapsedNs } = calcElapsed(job.data.hrStart);
            await handleJobStalled(job);
        });

    }

    bulkQueue.on('failed', async (job, result) => {
        await handleJobFailure(job, result, 'Modify Phase Completion', `The Modification Phase has failed with result: ${result}.`);
    });
}
