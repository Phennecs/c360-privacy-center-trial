class JobSubmissionError extends Error {
    constructor (msg) {
        super(msg);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, JobSubmissionError);
        }
    }
}

class InvalidCounterOperationError extends Error {
    constructor (msg) {
        super(msg);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidCounterOperationError);
        }
    }
}

class InvalidJobStatusError extends Error {
    constructor (msg) {
        super(msg);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidJobStatusError);
        }
    }
}

class ChunkTransformationError extends Error {
    constructor (error) {
        super(`Chunk transformation failed: ${error.message}`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ChunkTransformationError);
        }
    }
}

class BulkUpdateError extends Error {
    constructor (error) {
        super(`Bulk update failed: ${error.message}`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BulkUpdateError);
        }
    }
}

module.exports = {
    JobSubmissionError,
    InvalidCounterOperationError,
    InvalidJobStatusError,
    ChunkTransformationError,
    BulkUpdateError
};