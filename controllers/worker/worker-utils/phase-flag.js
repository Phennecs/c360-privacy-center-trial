const Enum = require("../../../utils/enum");
const requiredParam = require("../../../utils/required-param");

const PHASE_FLAG_TYPES = Object.freeze(new Enum(['FAILURE', 'HALT', 'SPECIAL']));

async function insertPhaseFlag (
    db = requiredParam('db'),
    executionId = requiredParam('executionId'),
    currentPhase = requiredParam('currentPhase'),
    flagType = requiredParam('flagType'),
    reason = requiredParam('reason')
) {
    // Only inserts the first occurrence for a given execution_id + phase (pk). Right now this is only called from cache-driver which should not be running concurrent executions.
    const query = `INSERT INTO config.POLICY_PHASE_FLAG (execution_id, phase, flag_type, reason) VALUES ($1, $2, $3, $4) ON CONFLICT (execution_id, phase, flag_type, reason) DO NOTHING RETURNING *`;
    const values = [ executionId, currentPhase, flagType, reason ];

    console.log(`phase-flag insert query: ${query} - values: ${values.join(',')}`);

    try {
        const res = await db.createQuery(query, values);
        return res.rows;
    } catch (error) {
        console.error(`Error inserting to POLICY_PHASE_FLAG: `, error);
        return null;
    }
}

module.exports = {
    PHASE_FLAG_TYPES,
    insertPhaseFlag
};