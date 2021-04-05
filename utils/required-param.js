const { RequiredParameterError } = require('../errors/index');

function requiredParam (param) {
    throw new RequiredParameterError(param);
}

module.exports = requiredParam;