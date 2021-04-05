const requiredParam = require("../../../utils/required-param");
const DBModel = require('../../../models/database');

const db = new DBModel();

async function updateBulkCounters (
    executionId = requiredParam('executionId'),
    recordRetention = requiredParam('recordRetention'),
    objectId = requiredParam('objectId'),
    initialCount = requiredParam('initialCount'),
    updatedCount = requiredParam('updatedCount'),
    failedCount = requiredParam('failedCount'),
    totalCount = requiredParam('totalCount')
) {
    // The schema.tablename. prefix in the SET clause is required due to "ambiguous column reference" error otherwise. Conflicts with the EXCLUDED table I think.
    const updateQuery = `INSERT INTO config.bulk_counters (execution_id, record_retention, object_id, initial_count, total_count, updated_count, failed_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (execution_id, record_retention, object_id)
        DO UPDATE SET
            initial_count = config.bulk_counters.initial_count + EXCLUDED.initial_count,
            total_count = config.bulk_counters.total_count + EXCLUDED.total_count,
            updated_count = config.bulk_counters.updated_count + EXCLUDED.updated_count,
            failed_count = config.bulk_counters.failed_count + EXCLUDED.failed_count
        RETURNING *
    `;
    const queryValues = [ executionId, recordRetention, objectId, initialCount, totalCount, updatedCount, failedCount ];

    // console.log(`Bulk counters update query generated: ${updateQuery} Values: ${queryValues}`);
    try {
        const queryResult = await db.updateQuery(updateQuery, queryValues);
        // console.log(`Bulk counters updated! ${JSON.stringify(queryResult.rows)}`);
        return queryResult;
    } catch (err) {
        console.error(`Bulk counters update query failed! executionId: ${executionId} recordRetention: ${recordRetention} objectId: ${objectId} updatedCount: ${updatedCount} failedCount: ${failedCount} totalCount: ${totalCount}`, err);
        // Don't throw
        return null;
    }
}

async function getBulkCountersByExecutionId(executionId = requiredParam('executionId')) {
    const query = 'select jc.*, poh.object_name from config.bulk_counters jc left join config.policy_object_hash poh on jc.execution_id = poh.execution_id and jc.object_id = poh.object_id where jc.execution_id = $1';
    const queryValues = [ executionId ];
    try {
        const queryResult = await db.getQuery(query, queryValues);
        return queryResult.rows;
    } catch (err) {
        console.error(`Error retrieving bulk counters by executionId: ${executionId}. Error: `, err);
        return null;
    }
}

module.exports = {
    updateBulkCounters,
    getBulkCountersByExecutionId
};