
module.exports = {
    ...require('./general-errors'),
    ...require('./database-errors'),
    ...require('./job-errors'),
    ...require('./salesforce-errors'),
    ...require('./redis-errors')
};