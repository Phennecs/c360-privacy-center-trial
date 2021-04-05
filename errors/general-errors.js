class RequiredParameterError extends Error {
    constructor (param) {
        super(`${param} can not be null or undefined.`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RequiredParameterError);
        }
    }
}

class InvalidMaskingCategoryError extends Error {
    constructor (maskingCategory) {
        super(`Invalid masking category: ${maskingCategory}`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidMaskingCategoryError);
        }
    }
}

class NoPolicyObjectsConfiguredError extends Error {
    constructor (msg) {
        super(msg);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NoPolicyObjectsConfiguredError);
        }
    }
}

class NoMatchingObjectRecordsError extends Error {
    constructor (msg) {
        super(msg);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NoMatchingObjectRecordsError);
        }
    }
}

class UnsupportedModifierTypeError extends Error {
    constructor (msg) {
        super(msg);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UnsupportedModifierTypeError);
        }
    }
}

module.exports = {
    RequiredParameterError,
    InvalidMaskingCategoryError,
    NoPolicyObjectsConfiguredError,
    NoMatchingObjectRecordsError,
    UnsupportedModifierTypeError
};