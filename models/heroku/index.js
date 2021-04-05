const { default: axios } = require('axios');
const https = require('https');

class HerokuModel {

    constructor() {

    }

    async getQuery(hostName, path, mapId, headerAuth) {

        if (hostName === process.env.HEROKU_CONNECT_REGION_URI) {

            //console.log('creds: ' + hostName + ' - ' + path + ' - ' + mapId + ' - ' + headerAuth);

            return new Promise ((resolve, reject) => {

                let herokuConnectOptions = {
                    hostname: hostName,
                    path: path,
                    headers: {
                        Authorization: headerAuth
                    }
                };

                let req = https.get(herokuConnectOptions, (response) => {

                    var result = '';
                    response.on('data', function (chunk) {
                        result += chunk;
                    });

                    response.on('end', function () {
                        result = JSON.parse(result);
                        //console.log('result mappings: ', result.mappings);
                        var results = { result };
                        resolve(results);
                    });

                });

            });

        } else if (hostName === 'api.heroku.com') {

            return new Promise ((resolve, reject) => {

                let herokuConnectOptions = {
                    hostname: hostName,
                    path: path + mapId,
                    headers: {
                        'Authorization': headerAuth,
                        'Accept': 'application/vnd.heroku+json; version=3',
                        'Content-type': 'application/json'
                    }
                };

                let req = https.get(herokuConnectOptions, (response) => {

                    var result = '';
                    response.on('data', function (chunk) {
                        result += chunk;
                    });

                    response.on('end', function () {
                        result = JSON.parse(result);
                        var results = { result };
                        resolve(results);
                    });

                });

            });

        }

    }

    async setConfigVars(hostName, path, headerAuth, tokenInfo) {

        //return new Promise ((resolve, reject) => {

        let herokuPlatformOptions = {
            method: "PATCH",
            hostname: hostName,
            path: path,
            headers: {
                'Authorization': headerAuth,
                'Accept': 'application/vnd.heroku+json; version=3',
                'Content-type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(tokenInfo))
            }
        };

        let req = https.request(herokuPlatformOptions, (response) => {

            var result = '';
            response.on('data', function (chunk) {
                result += chunk;
            });

        });

        req.write(JSON.stringify(tokenInfo));
        req.end();

        //});

    }

    // Should include "Bearer " prefix
    async validateHerokuAuthHeader(herokuAuthHeader) {
        try {
            const appInfoRes = await axios.get(`https://api.heroku.com/apps/${process.env.HEROKU_DNS_APP_ID}`, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/vnd.heroku+json; version=3",
                    Authorization: herokuAuthHeader
                },
                timeout: 4000
            });

            // console.log(appInfo);
            // console.log(appInfo.id, process.env.HEROKU_DNS_APP_ID);

            if (!appInfoRes) {
                return false;
            }

            const appInfo = appInfoRes.data;

            if (appInfo.id === process.env.HEROKU_DNS_APP_ID) {
                return true;
            }
            return false;

        } catch (err) {
            console.error(`validateHerokuAuthHeader error:`, err.message);
            return false;
        }
    }

    // async authHeroku(hostName, path, headerAuth) {

    //     return new Promise ((resolve, reject) => {

    //         let herokuConnectOptions = {
    //             method: "POST",
    //             hostname: hostName,
    //             path: path,
    //             headers: {
    //                 Authorization: headerAuth
    //             }
    //         };

    //         let req = https.get(herokuConnectOptions, (response) => {

    //             var result = '';
    //             response.on('data', function (chunk) {

    //                 result += chunk;

    //             });

    //             response.on('end', function () {

    //                 result = JSON.parse(result);
    //                 var results = { result };
    //                 resolve(results);

    //             });

    //         });

    //     });

    // }

}

module.exports = HerokuModel;