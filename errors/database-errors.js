class ConfigDatabaseQueryError extends Error {
    constructor (msg) {
        super(`Error executing config database query: ${msg}`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConfigDatabaseQueryError);
        }
    }
}

class TableNotFoundError extends Error {
    constructor (msg) {
        super(`Table not found: ${msg}`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TableNotFoundError);
        }
    }
}

class CacheInsertionError extends Error {
    constructor (error) {
        super(`Cache table insertion failed: ${error.message}`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CacheInsertionError);
        }
    }
}

class GenericTableError extends Error {
    constructor (error) {
        super(`Generic table error: ${error.message}`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, GenericTableError);
        }
    }
}

class InvalidWhereCriteriaError extends Error {
    constructor (objectName, where) {
        super(`The where criteria was invalid for object: ${objectName} whereCriteria: >>> ${where} <<<`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidWhereCriteriaError);
        }
    }
}

class ConnectTableNotFoundError extends Error {
    constructor (tableList) {
        super(`The following objects should have been synced by Connect, but their tables were missing: ${tableList.join(', ')}`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConnectTableNotFoundError);
        }
    }
}

class IndexCreationError extends Error {
    constructor () {
        super(`One or more table indexes could not be created.`);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, IndexCreationError);
        }
    }
}

module.exports = {
    ConfigDatabaseQueryError,
    TableNotFoundError,
    CacheInsertionError,
    GenericTableError,
    InvalidWhereCriteriaError,
    ConnectTableNotFoundError,
    IndexCreationError
};