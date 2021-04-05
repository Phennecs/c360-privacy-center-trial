async function getPendingJobCount(queues) {
    let pendingJobCount = 0;
    for (const queue of queues) {
        const jobs = await queue.getJobCounts();
        pendingJobCount += jobs.waiting + jobs.active + jobs.delayed + jobs.paused;
    }
    return pendingJobCount;
}

module.exports = getPendingJobCount;