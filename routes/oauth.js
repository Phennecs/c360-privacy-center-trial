'use strict';

const express = require('express');
let router = express.Router();

const herokuModel = require('../models/heroku');
const jsforce = require('jsforce');
const { sfApiVersion } = require('../settings');
const { handleJobSubmission } = require('../controllers/worker/worker-utils/job-gateway');
const { configQueue } = require('../models/queue');

const heroku = new herokuModel();

router.post('/configure', async function(req,res) {

    console.log('/oauth2/configure received!');

    const authHeader = req.header('Authorization');

    if (!authHeader) {
        console.error(`Missing auth header on /configure request.`);
        return res.status(401).json({
            error: "Unauthorized: Missing auth header."
        });
    }

    const authSuccessful = await heroku.validateHerokuAuthHeader(authHeader);

    if (!authSuccessful) {
        console.error(`Heroku authentication failed on /configure request.`);
        return res.status(401).json({
            error: "Unauthorized: Heroku authentication failed."
        });
    }

    console.log(`Heroku auth was successful! Proceeding...`);

    // let authHeroku = await heroku.authHeroku('hc-central.heroku.com', '/auth/' + process.env.HEROKU_DNS_APP_ID, bearerToken);
    // console.log('/configure authHeroku: ', authHeroku);

    // if (authHeroku.result.id === 'unauthorized' || authHeroku.result.id === 'unauth') {
    //     return res.status(401).json({
    //         status: "Unauthorized"
    //     });
    // }

    console.log(req.body);

    const authCode = req.body.authCode;
    const clientId = req.body.clientId;
    const loginUrl = req.body.loginUrl;
    const redirectUri = req.body.redirectUri;

    const oauth2 = new jsforce.OAuth2({
        loginUrl,
        clientId,
        // clientSecret: process.env.SF_CLIENT_SECRET_ID, // Shouldn't be needed if the checkbox is not checked in SF
        redirectUri
    });

    const conn = new jsforce.Connection({
        oauth2,
        version: sfApiVersion
    });

    try {
        conn.authorize(authCode, async function(err, userInfo) {
            if (err) {
                console.error(err);
                res.status(401).json({
                    received: true,
                    authSuccessful: false,
                    configVarsSet: false,
                    error: `Error attempting to authenticate against Salesforce using new OAuth credentials: ${err.message}`
                });
                return;
            }

            // TODO remove this console log
            // console.log('conn.accessToken: ', conn.accessToken + ', conn.refreshToken: ', conn.refreshToken + ', conn.instanceUrl: ', conn.instanceUrl);

            if (!conn.accessToken || !conn.refreshToken || !conn.instanceUrl) {
                const msg = `Access token, refresh token, or instance URL were not obtained from OAuth against SF. Something is wrong.`;
                console.error(msg);
                res.status(500).json({
                    received: true,
                    authSuccessful: false,
                    configVarsSet: false,
                    error: msg
                });
                return;
            }

            const tokenInfo = {
                SF_LOGIN_URL: loginUrl,
                SF_CLIENT_ID: clientId,
                SF_REDIRECT_URI: redirectUri,
                SF_ACCESS_TOKEN: conn.accessToken,
                SF_REFRESH_TOKEN: conn.refreshToken,
                SF_INSTANCE_URL: conn.instanceUrl
            };

            try {
                console.log(`Submitting update-cust-sf-oauth-vars job. SF_INSTANCE_URL => ${tokenInfo.SF_INSTANCE_URL}`);
                await handleJobSubmission({
                    queue: configQueue,
                    jobType: 'update-cust-sf-oauth-vars',
                    jobData: { tokenInfo },
                    skipCounters: true
                });
                // const custHerokuTokenType = process.env.CUST_HEROKU_TOKEN_TYPE;
                // const custHerokuRefreshToken = process.env.CUST_HEROKU_REFRESH_TOKEN;
                // const custHerokuAccessToken = ;

                // console.log(`tokenInfo.SF_INSTANCE_URL => `, tokenInfo.SF_INSTANCE_URL);
                // await heroku.setConfigVars('api.heroku.com', '/apps/' + process.env.HEROKU_DNS_APP_ID + '/config-vars', `${custHerokuTokenType} ${custHerokuAccessToken}`, tokenInfo);
                // // console.log('setConfigVars response: ', setConfigVarsResp);
                // // TODO check response code from above call

                res.status(200).json({
                    received: true,
                    authSuccessful: true,
                    configVarsSet: true // This isn't 100% accurate now since we moved the oauth setting to the addon app
                });
                return;

            } catch (err) {
                const msg = `Error setting heroku config vars. ${err.message}`;
                console.error(msg);
                res.status(500).json({
                    received: true,
                    authSuccessful: true,
                    configVarsSet: false,
                    error: msg
                });
                return;
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            received: true,
            authSuccessful: false,
            configVarsSet: false,
            error: `Unexpected error: ${err.message}`
        });
        return;
    }

});


module.exports = router;