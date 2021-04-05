const requiredParam = require("../utils/required-param");

async function acquireAdvisoryLock(db = requiredParam('db'), lockNumber = requiredParam('lockNumber')) {
    return await db.lockQuery('SELECT pg_advisory_lock($1);', [ lockNumber ]);
}

async function releaseAdvisoryLock(db = requiredParam('db'), lockNumber = requiredParam('lockNumber')) {
    return await db.lockQuery('SELECT pg_advisory_unlock($1);', [ lockNumber ]);
}

module.exports = {
    acquireAdvisoryLock,
    releaseAdvisoryLock
};