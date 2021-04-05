const requiredParam = require("../../../utils/required-param");
const { globalJobSettings, retryJobSettings } = require('../../../settings');
const { JobSubmissionError } = require("../../../errors/job-errors");
const SalesforceModel = require('../../../models/salesforce');
const { updateJobCounter } = require('./job-counters');

const salesforce = new SalesforceModel();

async function handleJobSubmission({
    queue = requiredParam('queue'),
    jobType = requiredParam('jobType'),
    jobData = requiredParam('jobData'),
    enableRetries = false,
    bullJobOptOverrides = null,
    skipCounters = false,
    noJobName = false // Specifically for use with bulk updater and sub state updater so we can have it in a separate codebase on a different dyno
}) {
    const retryOpts = enableRetries ? retryJobSettings : null;
    const jobOptions = {
        ...globalJobSettings,
        ...retryOpts,
        ...bullJobOptOverrides // Since last, it will override other properties already configured above
    };
    try {
        if (!skipCounters) await updateJobCounter(jobData.executionId, jobType, 'submitted', 'INCREMENT');

        let job;
        if (noJobName) {
            job = await queue.add(jobData, jobOptions);
        } else {
            job = await queue.add(jobType, jobData, jobOptions);
        }

        if (!skipCounters) await updateJobCounter(jobData.executionId, jobType, 'successful_sub', 'INCREMENT');

        return job;
    } catch (error) {
        // Update failedSubmission count here
        if (!skipCounters) await updateJobCounter(jobData.executionId, jobType, 'failed_sub', 'INCREMENT');

        console.error(`Error submitting jobType: ${jobType} with jobOptions: ${JSON.stringify(jobOptions)} and jobData(sliced 200): ${JSON.stringify(jobData).slice(0,200)}`);
        throw new JobSubmissionError(`Error submitting jobType: ${jobType}`);
    }
}

async function handleJobCompleted(job, result) {
    console.log(`Job type:${job.name} id:${job.id} completed!${job.data.objectName ? ` objectName:${job.data.objectName}` : ''}${job.data.schemaObject ? ` schemaObject:${job.data.schemaObject}` : ''}${job.data.recordRetention ? ` retentionType:${job.data.recordRetention}` : ''}`); // has completed in ${elapsedSeconds}s ${elapsedMs}ms ${elapsedNs}ns.`);
    await updateJobCounter(job.data.executionId, job.name, 'completed', 'INCREMENT');
}

async function handleJobFailure(job, result, runLogSubject, runLogMsg) {
    const jobExtract = { jobName: job.name, jobQueueName: job.queue.name, jobOpts: job.opts, jobData: job.data, jobFailedReason: job.failedReason };
    jobExtract.jobData.batchRecords = "OMITTED";

    console.error(`!!! Job type:${job.name} id:${job.id}${job.data.schemaObject ? ` schemaObject:${job.data.schemaObject}` : ''} ${job.data.recordRetention ? `retentionType:${job.data.recordRetention}` : ''} has failed with result: ${JSON.stringify(result)} - jobExtract: `, jobExtract);
    console.log(`id:${job.id} attemptsMade:${job.attemptsMade} attempts:${job.opts.attempts} attemptsRemaing:${job.opts.attempts - job.attemptsMade}`);

    await updateJobCounter(job.data.executionId, job.name, 'failed', 'INCREMENT');

    if (job.attemptsMade >= job.opts.attempts) {
        console.error(`!!!!!! MAXIMUM RETRIES REACHED for id:${job.id} !!!!!!`);
        await updateJobCounter(job.data.executionId, job.name, 'failed_all', 'INCREMENT');
        await salesforce.insertRunLog(job.data.executionId, job.data.policyName, 'Error', runLogSubject, runLogMsg);
    }
}

async function handleJobStalled(job) {
    const jobExtract = { jobName: job.name, jobQueueName: job.queue.name, jobOpts: job.opts, jobData: job.data, jobFailedReason: job.failedReason };

    console.error(`!!! Job type:${job.name} id:${job.id}${job.data.schemaObject ? ` schemaObject:${job.data.schemaObject}` : ''} ${job.data.recordRetention ? `retentionType:${job.data.recordRetention}` : ''} has stalled! - jobExtract: `, jobExtract);
    // TODO change the run log subject dynamically, doesn't really show up in runlogs atm though so not high priority.
    await salesforce.insertRunLog(job.data.executionId, job.data.policyName, 'Error', 'Phase Completion', `One or more intermediary jobs have stalled.`);

    await updateJobCounter(job.data.executionId, job.name, 'stalled', 'INCREMENT');
}

module.exports = {
    handleJobSubmission,
    handleJobCompleted,
    handleJobFailure,
    handleJobStalled
};
