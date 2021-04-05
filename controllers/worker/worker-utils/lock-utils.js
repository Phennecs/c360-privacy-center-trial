const { acquireAdvisoryLock, releaseAdvisoryLock } = require("../../../db-utils/advisory-lock");
const Enum = require("../../../utils/enum");
const requiredParam = require("../../../utils/required-param");

const LOCK_TYPES = Object.freeze(new Enum(['SERIAL_BULK', 'TEST']));

// Assign an index to each enum value
// const obj = {};
const LOCK_TYPE_MAP = Object.freeze(
    Object.keys(LOCK_TYPES).reduce((obj, key, index) => ({
        // console.log(`key: ${key} index: ${index}`);
        ...obj,
        [key]: 1000 + index
    }), {})
);


async function acquireLock(db = requiredParam('db'), lockType = requiredParam('lockType')) {
    if (!Object.values(LOCK_TYPES).includes(lockType)) {
        throw new Error(`Unsupported lockType for acquireLock: ${lockType}. Valid types are: ${Object.values(LOCK_TYPES).join(', ')}`);
    }
    console.log(`Acquiring lock: ${lockType} ...`);
    const res = await acquireAdvisoryLock(db, LOCK_TYPE_MAP[lockType]);
    console.log(`Lock acquired: ${lockType}`);
    return res;
}

async function releaseLock(db = requiredParam('db'), lockType = requiredParam('lockType')) {
    if (!Object.values(LOCK_TYPES).includes(lockType)) {
        throw new Error(`Unsupported lockType for releaseLock. Valid types are: ${Object.values(LOCK_TYPES).join(', ')}`);
    }
    console.log(`Releasing lock: ${lockType} ...`);
    const res = await releaseAdvisoryLock(db, LOCK_TYPE_MAP[lockType]);
    console.log(`Lock released: ${lockType}`);
}

module.exports = {
    LOCK_TYPES,
    LOCK_TYPE_MAP,
    acquireLock,
    releaseLock
};
