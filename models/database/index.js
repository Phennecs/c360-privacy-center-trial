const { Pool, Client } = require('pg');
const { pgPoolMaxConnections } = require('../../settings');
const format = require('pg-format');

const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: pgPoolMaxConnections
});

// TODO This might need to be a pool as well...
// In order for the advisory locks to block for a long time, we have to disable the idleTimeout for those transactions.
const lockClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    idleTimeoutMillis: 0
});
lockClient.connect();

class DBModel {

    constructor() {
        this.format = format;
    }

    async getQuery(query, values = null) {

        //console.log(`truncate query : ` + query);
        if (!values) {
            return await dbPool.query(query);
        } else {
            return await dbPool.query(query, values);
        }

    }

    async insertQuery(query, values = null) {

        //console.log(`truncate query : ` + query);
        if (!values) {
            return await dbPool.query(query);
        } else {
            return await dbPool.query(query, values);
        }

    }

    async dropQuery(query) {

        //console.log(`drop query : ` + query);
        return await dbPool.query(query);

    }

    async createQuery(query, values = null) {

        //console.log(`truncate query : ` + query);
        if (!values) {
            return await dbPool.query(query);
        } else {
            return await dbPool.query(query, values);
        }

    }

    async truncateQuery(query) {

        //console.log(`truncate query : ` + query);
        return await dbPool.query(query);

    }

    async updateQuery(query, values = null) {

        //console.log(`truncate query : ` + query);
        if (!values) {
            return await dbPool.query(query);
        } else {
            return await dbPool.query(query, values);
        }

    }

    async lockQuery(query, values = null) {
        if (!values) {
            return await lockClient.query(query);
        } else {
            return await lockClient.query(query, values);
        }
    }

}

module.exports = DBModel;