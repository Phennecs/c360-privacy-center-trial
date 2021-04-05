// const herokuModel = require('../../models/heroku');
// const SalesforceModel = require('../../models/salesforce');
const { authHeroku } = require('../process');
const getPendingJobCount = require('../worker/worker-utils/get-pending-job-count');
const { handleJobSubmission } = require('../worker/worker-utils/job-gateway');

// const salesforce = new SalesforceModel();
// const heroku = new herokuModel();

async function abortHandler (req, res) {
    console.log('Abort request received: req.body =>', req.body);

    // create Heroku Model to Auth
    let bearerToken = req.header('Authorization');
    let policyName = req.body.DeveloperName;

    const authResult = await authHeroku(bearerToken, null, policyName, true);

    res.status(authResult.status == 'Success' ? 200 : 404).json(authResult).end();

    if (authResult.status !== 'Success') {
        console.error(`Abort endpoint Heroku auth failed!`);
        return;
    }

    console.log(`Auth passed, proceeding.`);

    const { configQueue, nonPolicyQueues, policyQueue, upStateQueue } = require('../../models/queue');

    // Include policy queue here because we need to check both pending policies (policy queue) and actively running policies (nonpolicy queues)
    const pendingJobCount = await getPendingJobCount([ policyQueue, ...nonPolicyQueues, upStateQueue ]);
    if (!pendingJobCount) {
        console.log('No pending jobs or queued policies detected, no need to abort anything.');
        return;
    } else {
        console.log('Pending jobs or policies were detected, some policy is queued or running. Proceeding with abort job submission (if matching abort criteria).');
    }

    console.log(`Submitting policy-aborter job for policyName: ${policyName}!`);
    const job = await handleJobSubmission({
        queue: configQueue,
        jobType: 'policy-aborter',
        jobData: {
            // executionId,
            policyName
        },
        skipCounters: true // Needed on this initial job submission because the config schema has not been initialized yet. Tables won't exist.
    });

    return;
}

module.exports = abortHandler;