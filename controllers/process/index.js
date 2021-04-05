'use strict';

// const redisModel = require('../../models/redis'),
const herokuModel = require('../../models/heroku');
const SalesforceModel = require('../../models/salesforce');
const { handleJobSubmission } = require('../worker/worker-utils/job-gateway');
const getPendingJobCount = require('../worker/worker-utils/get-pending-job-count');

const salesforce = new SalesforceModel();
const heroku = new herokuModel();
// const redisDB = new redisModel();

async function authHeroku(authHeader, executionId, policyName, skipRunLogs = false) {

    if (authHeader != null) {

        try {
            // let authHeroku = await heroku.authHeroku('hc-central.heroku.com', '/auth/' + process.env.HEROKU_DNS_APP_ID, bearerToken);
            // console.log('authHeroku: ', authHeroku);
            const authSuccessful = await heroku.validateHerokuAuthHeader(authHeader);

            if (!authSuccessful) {
                if (!skipRunLogs) await salesforce.insertRunLog(executionId, policyName, 'Error', 'Cache Processing', 'Authentication into Heroku is denied.');
                return {
                    status: "Unauthorized"
                };
            } else {
                console.log(`Auth passed, proceeding.`);
                return {
                    status: "Success"
                };
            }
        } catch (err) {
            console.error(`Error during auth against /auth with bearerToken.`, err);
            if (!skipRunLogs) await salesforce.insertRunLog(executionId, policyName, 'Error', 'Cache Processing', 'Authentication into Heroku is denied.');
            return {
                status: "Unauthorized"
            };
        }

    } else {

        if (!skipRunLogs) await salesforce.insertRunLog(executionId, policyName, 'Error', 'Cache Processing', 'Unable to authenticate the authorization token for access into Heroku.');
        return {
            status: "Missing Authorization Token"
        };
    }
}

const index = async (req, res) => {

    console.log('Process request received: req.body =>', req.body);

    // create Heroku Model to Auth
    let bearerToken = req.header('Authorization');
    let executionId = req.body.ExecutionId;
    let policyName = req.body.DeveloperName;

    const authResult = await authHeroku(bearerToken, executionId, policyName);
    res.status(authResult.status == 'Success' ? 200 : 404).json(authResult).end();

    if (authResult.status !== 'Success') {
        console.error(`Process endpoint Heroku auth failed!`);
        return;
    }

    console.log(`Auth passed, proceeding.`);

    let runLogWasInserted;

    let policyQueue, nonPolicyQueues, upStateQueue;

    if (!process.env.REDIS_URL) {
        console.log(`REDIS_URL is not set, will not proceed!`);
        runLogWasInserted = await salesforce.insertRunLog(executionId, policyName, 'Failure', 'Cache Processing', `Policy: ${policyName} could not be queued for execution. The Redis addon in the Heroku app does not appear to be fully set up.`);
        res.json({
            status: `Redis URL does not appear to be set. Not proceeding.`
        });
        return;
    } else {
        ({ policyQueue, nonPolicyQueues, upStateQueue } = require('../../models/queue'));

        // Check if there are duplicates of this policy in the queue, if so, do not insert a new entry
        const policyJobs = await policyQueue.getJobs([ 'delayed', 'active', 'waiting', 'paused' ]);
        if (policyJobs.some(job => job.data.policyName == policyName)) {
            const msg = `Policy: ${policyName} is already queued for execution. It will not be queued again until the pre-existing run has completed and the next scheduled run of this policy begins. If this message occurs often, please consider reducing the frequency of this policy's run schedule.`;
            runLogWasInserted = await salesforce.insertRunLog(executionId, policyName, 'Failure', 'Cache Processing', msg);
            console.warn(msg);
            res.json({
                status: msg
            });
            return;
        } else {
            // Else proceed as normal
            // The purpose of this run log is to make sure run logs can be inserted at all so we get error messages through. If the namespace is incorrect for example, this will return false.
            runLogWasInserted = await salesforce.insertRunLog(executionId, policyName, 'Success', 'Cache Processing', `Policy: ${policyName} is initializing.`);
        }
    }

    if (!runLogWasInserted) {
        res.json({
            status: "Initial run log insertion failure"
        });
        console.error(`Initial run log was not inserted! Not proceeding.`);
        return;
    }

    // console.warn('!!! Flushing all in redis !!!');
    // await redisDB.flushAll(); // TODO Note this prevents any concurrent jobs from running at the same time as they can empty each other's queue

    // Check job counts for all queues other than policyQueue. If any are pending/active, then do nothing.
    // If none are pending, then make sure the policy queue has been resumed.
    const pendingJobCount = await getPendingJobCount([ ...nonPolicyQueues, upStateQueue ]);
    if (pendingJobCount) {
        console.log('Pending jobs were detected, the policy queue will not be resumed.');
    } else {
        console.log('No pending jobs detected, resuming policy queue.');
        await policyQueue.resume(false);
    }

    console.log(`Submitting policy-driver job!`);
    const job = await handleJobSubmission({
        queue: policyQueue,
        jobType: 'policy-driver',
        jobData: {
            executionId,
            policyName
        },
        skipCounters: true // Needed on this initial job submission because the config schema has not been initialized yet. Tables won't exist.
    });
    // Note the first step in the policy-driver job is to sleep two seconds so that this run log can be inserted before it starts doing anything
    const runLogWasInserted2 = await salesforce.insertRunLog(executionId, policyName, 'Success', 'Cache Processing', `Policy: ${policyName} is now queued for execution.`);

    return;
};

module.exports = {
    index,
    authHeroku
};