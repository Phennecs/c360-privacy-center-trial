const SFAxiosWrapper = require('../../models/salesforce/sf-axios-wrapper');
const { authHeroku } = require('../process');

let sfAxios = null;

function initSFAxiosWrapper() {
    if (sfAxios != null) {
        return;
    }

    const loginUrl = process.env.SF_LOGIN_URL;
    const instanceUrl = process.env.SF_INSTANCE_URL;
    const clientId = process.env.SF_CLIENT_ID;
    const refreshToken = process.env.SF_REFRESH_TOKEN;

    if (!loginUrl || !instanceUrl || !clientId || !refreshToken) {
        console.warn(`One or more of SF_LOGIN_URL, SF_INSTANCE_URL, SF_CLIENT_ID, or SF_REFRESH_TOKEN config vars are not set. Cannot proceed to initialize SFAxiosWrapper for post-upgrade methods.`);
        return;
    }

    sfAxios = new SFAxiosWrapper(loginUrl, instanceUrl, clientId, refreshToken).getSFAxiosInstance();
}

async function postUpgradeHandler (req, res) {
    console.log('post-upgrade request received: req.body =>', req.body);

    // create Heroku Model to Auth
    let bearerToken = req.header('Authorization');

    const authResult = await authHeroku(bearerToken, null, 'postUpgrade', false);

    if (authResult.status !== 'Success') {
        console.error(`Post-upgrade endpoint Heroku auth failed!`);
        return res.status(404).json(authResult).end();
    }

    console.log(`Auth passed, proceeding.`);

    initSFAxiosWrapper();
    if (!sfAxios) {
        console.warn(`Post-upgrade could not run because the appropriate SF OAuth vars are not set.`);
        return res.status(404).json({
            error: 'OAUTH_INCOMPLETE',
            errorMessage: 'Post-upgrade could not run because the appropriate SF OAuth vars are not set. Looks like OAuth has not been completed.'
        });
    }

    try {
        const packageRes = await sfAxios.get(
            `/services/apexrest/post-upgrade`,
            {}
        );

        console.log(`post-upgrade packageRes.data =>`, packageRes.data);

        return res.status(200).json({
            invoked: true,
            packageResponse: packageRes.data
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            invoked: false
        });
    }
}

module.exports = postUpgradeHandler;