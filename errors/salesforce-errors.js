class SFInvalidTypeError extends Error {
    constructor (err) {
        super(`Salesforce INVALID_TYPE error: ${err.message}`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SFInvalidTypeError);
        }
    }
}

class BulkSingleRecordLimitsExceededError extends Error {
    constructor (nextRecordStats) {
        super(`Bulk data API single record limits exceeded: ${JSON.stringify(nextRecordStats)}`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BulkSingleRecordLimitsExceededError);
        }
    }
}

module.exports = {
    SFInvalidTypeError,
    BulkSingleRecordLimitsExceededError
};