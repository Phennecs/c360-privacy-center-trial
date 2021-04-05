const path = require('path');

function getAppVersion() {
    return require.main.require('./package.json').version;
}

const appVersion = getAppVersion();

module.exports = appVersion;