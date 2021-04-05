const requiredParam = require("../../../utils/required-param");
const { InvalidCounterOperationError, InvalidJobStatusError } = require('../../../errors');
const DBModel = require('../../../models/database');
const phaseJobMap = require('./job-phase-map');

const db = new DBModel();

const validOperations = [
    'INCREMENT',
    'DECREMENT'
];

// Non-status fields
// execution_id bigint NOT NULL
// job_type text NOT NULL

const jobStatusFields = {
    // Key must match the field name exactly below
    submitted: 'submitted bigint DEFAULT 0',
    successful_sub: 'successful_sub bigint DEFAULT 0',
    failed_sub: 'failed_sub bigint DEFAULT 0',
    failed: 'failed bigint DEFAULT 0',
    failed_all: 'failed_all bigint DEFAULT 0',
    stalled: 'stalled bigint DEFAULT 0',
    completed: 'completed bigint DEFAULT 0',
};

function generateOperationExpr(operation, counterField) {
    let operationExpr;
    switch (operation) {
        case 'INCREMENT':
            operationExpr = db.format('%I = %I + 1', counterField, counterField);
            break;
        case 'DECREMENT':
            operationExpr = db.format('%I = %I - 1', counterField, counterField);
            break;
        default:
            throw new InvalidCounterOperationError(`Invalid counter operation: ${operation}`);
    }
    return operationExpr;
}

function isValidOperation(operation) {
    return validOperations.includes(operation);
}

function isValidJobStatus(jobStatus) {
    return Object.keys(jobStatusFields).includes(jobStatus);
}

async function updateJobCounter (
    executionId = requiredParam('executionId'),
    jobType = requiredParam('jobType'),
    jobStatus = requiredParam('jobStatus'),
    operation = requiredParam('operation')
) {
    if (!isValidJobStatus(jobStatus)) {
        throw new InvalidJobStatusError(`Invalid jobStatus: ${jobStatus}`);
    }
    if (!isValidOperation(operation)) {
        throw new InvalidCounterOperationError(`Invalid counter operation: ${operation}`);
    }

    const operationExpr = generateOperationExpr(operation, jobStatus);
    // These records are initialized with default values of 0 for each counter in the config schema setup.
    // operationExpr is safely filtered when generated, not an injection risk
    const updateQuery = `UPDATE config.job_counters SET ${operationExpr} WHERE execution_id = $1 and job_type = $2;`;
    const values = [ executionId, jobType ];
    // console.log(`Counter update query generated: ${updateQuery} Values: ${values.join(',')}`);
    try {
        await db.updateQuery(updateQuery, values);
        // console.log(`Counter updated!`);
    } catch (err) {
        console.error(`Counter update query failed! jobType: ${jobType} jobStatus: ${jobStatus} executionId: ${executionId} operation: ${operation}`);
        // Don't throw
    }
}

async function getJobCountsByPhaseAndExecutionId (phase, executionId) {
    const jobTypeInClause = phaseJobMap[phase].map(jobType => `'${jobType}'`).join(', ');
    const countQuery = `select * from config.job_counters where execution_id = ${executionId} AND job_type IN (${jobTypeInClause});`;
    console.log(`Get counts by ExecId and Phase query generated: ${countQuery}`);

    const counts = {};
    for (const countField of Object.keys(jobStatusFields)) {
        counts[countField] = 0;
    }

    const countQueryResults = await db.getQuery(countQuery);
    countQueryResults.rows.forEach(row => {
        for (const countField of Object.keys(jobStatusFields)) {
            counts[countField] += row[countField];
        }
    });

    return counts;
}

module.exports = {
    jobStatusFields,
    updateJobCounter,
    getJobCountsByPhaseAndExecutionId
};