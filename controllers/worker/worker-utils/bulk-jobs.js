const requiredParam = require("../../../utils/required-param");
const DBModel = require('../../../models/database');

const db = new DBModel();

async function insertBulkJob ({
    jobId = requiredParam('jobId'),
    executionId = requiredParam('executionId'),
    sobject = requiredParam('sobject'),
    operation = requiredParam('operation'),
    concurrencyMode = requiredParam('concurrencyMode'),
    jobInfo,
    finalState = requiredParam('finalState'),
    initialCount = requiredParam('initialCount'),
    totalCount = requiredParam('totalCount'),
    successfulCount = requiredParam('successfulCount'),
    failedCount = requiredParam('failedCount'),
    unprocessedCount = requiredParam('unprocessedCount'),
    timedOut = false,
    isRetry = false,
    startTs = requiredParam('startTs'),
    endTs = requiredParam('endTs'),
    durationMs = requiredParam('durationMs')
}) {
    const insertQuery = `INSERT INTO config.bulk_job (job_id, execution_id, sobject, operation, concurrency_mode, job_info,
        final_state, initial_count, total_count, successful_count, failed_count, unprocessed_count, timed_out, is_retry, start_ts, end_ts, duration_ms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (job_id)
        DO NOTHING
        RETURNING *
    `;
    const queryValues = [ jobId, executionId, sobject, operation, concurrencyMode, jobInfo, finalState, initialCount, totalCount, successfulCount, failedCount,
        unprocessedCount, timedOut, isRetry, startTs, endTs, durationMs ];

    console.log(`Bulk job insert query generated: ${insertQuery} Values: ${queryValues}`);
    try {
        const queryResult = await db.insertQuery(insertQuery, queryValues);
        console.log(`Bulk job inserted! ${JSON.stringify(queryResult.rows)}`);
        return queryResult;
    } catch (err) {
        console.error(`Bulk job insert query failed! jobId: ${jobId}, executionId: ${executionId}, sobject: ${sobject}, operation: ${operation}, concurrencyMode: ${concurrencyMode}. Error: `, err);
        // Don't throw
        return null;
    }
}

async function insertBulkJobErrors ({
    jobId = requiredParam('jobId'),
    errorCode = requiredParam('error_code'),
    errorCount = requiredParam('error_count')
}) {
    const insertQuery = `INSERT INTO config.bulk_job_errors (job_id, error_code, error_count)
        VALUES ($1, $2, $3)
        ON CONFLICT (job_id, error_code)
        DO NOTHING
        RETURNING *
    `;
    const queryValues = [ jobId, errorCode, errorCount ];

    console.log(`Bulk job error insert query generated: ${insertQuery} Values: ${queryValues}`);
    try {
        const queryResult = await db.insertQuery(insertQuery, queryValues);
        console.log(`Bulk job error inserted! ${JSON.stringify(queryResult.rows)}`);
        return queryResult;
    } catch (err) {
        console.error(`Bulk job error insert query failed! jobId: ${jobId}, errorCode: ${errorCode}, errorCount: ${errorCount}`, err);
        // Don't throw
        return null;
    }
}

async function insertUniqBulkJobErrorsPerObj ({
    executionId = requiredParam('executionId'),
    sobject = requiredParam('jobId'),
    errorCode = requiredParam('error_code'),
    fullError = requiredParam('fullError')
}) {
    const insertQuery = `INSERT INTO config.uniq_bulk_errors_per_obj (execution_id, sobject, error_code, full_error)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (execution_id, sobject, error_code)
        DO NOTHING
        RETURNING *
    `;
    const queryValues = [ executionId, sobject, errorCode, fullError ];

    console.log(`Bulk job unique error insert query generated: ${insertQuery} Values: ${queryValues}`);
    try {
        const queryResult = await db.insertQuery(insertQuery, queryValues);
        console.log(`Bulk job unique error inserted! ${JSON.stringify(queryResult.rows)}`);
        return queryResult;
    } catch (err) {
        console.error(`Bulk job unique error insert query failed! sobject: ${sobject}, errorCode: ${errorCode}`, err);
        // Don't throw
        return null;
    }
}

module.exports = {
    insertBulkJob,
    insertBulkJobErrors,
    insertUniqBulkJobErrorsPerObj
};