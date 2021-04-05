module.exports = Object.freeze({
    // Defaults to no namespace if this env/config var is not set. Set this to true on unmanaged packages or other no-namespace orgs.
    namespace: process.env.NO_NAMESPACE ? '' : 'privacycenter__',
    pgPoolMaxConnections: process.env.WEB_CONCURRENCY && process.env.WEB_CONCURRENCY > 10 ? process.env.WEB_CONCURRENCY : 10,
    // The maximum number of jobs each worker should process at once. This is per process. This will need to be tuned for your application. If each job is mostly waiting on network responses it can be much higher. If each job is CPU-intensive, it might need to be much lower.
    maxJobsPerWorkerHeavyCPU: 1,
    maxJobsPerWorkerHeavyNetwork: 1, // Strictly keep to 10 workers, not 10 x this number
    // Spin up multiple processes to handle jobs to take advantage of more CPU cores
    // workers: process.env.WEB_CONCURRENCY || 2,
    // Salesforce allows 10 concurrent query cursors, but not sure if those are used for bulk api.
    // Increasing beyond 10 to around 15 did seem to reduce overall runtime, but bulk job times became pretty erratic. Going to stick with 10 for now.
    workers: 10,
    // workers: process.env.WEB_CONCURRENCY || 2,
    // redis
    redisSettings: {
        lockDuration: 120000, // Key expiration time for job locks.
        lockRenewTime: 60000, // Interval on which to acquire the job lock
        stalledInterval: 60000 // How often check for stalled jobs (use 0 for never checking).
    },
    batchPollingInterval: 4000, // ms
    batchPollingTimeout: 1000 * 60 * 10 * 10 + 60000, // Maximum time for a job is 10 tries at 10 minutes each plus 1 extra minute to be safe
    globalJobSettings: {
        removeOnComplete: true,
        removeOnFail: true // Failed jobs are only removed after all retries exhausted (default is try single time only)
    },
    retryJobSettings: {
        attempts: 5, // Includes initial try, i.e. this is the total number of attempts a single job can make.
        backoff: {
            type: 'exponential', // Backoff type, which can be either `fixed` or `exponential`.
            delay: 1000 // Backoff delay, in milliseconds.
        }
    },
    sfApiVersion: process.env.SF_API_VERSION || "51.0"
});