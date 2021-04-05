'use strict';
const createAuthRefreshInterceptor = require('axios-auth-refresh');
const requiredParam = require('../../utils/required-param');

// Used for refresh requests since those don't use auth headers
const basicAxios = require('axios');

class SFAxiosWrapper {
    constructor(
        loginUrl = requiredParam('loginUrl'),
        instanceUrl = requiredParam('instanceUrl'),
        clientId = requiredParam('clientId'),
        refreshToken = requiredParam('refreshToken')
    ) {

        this.loginUrl = loginUrl;
        this.instanceUrl = instanceUrl;
        this.clientId = clientId;
        this.refreshToken = refreshToken;

        this.initAxios();
    }

    initAxios() {
        // Primary Salesforce-endpoint axios instance which handles auth headers and refresh automatically
        this.axios = basicAxios.create({
            baseURL: this.instanceUrl
        });

        this.axios.interceptors.request.use(this.addAuthHeader.bind(this));
        createAuthRefreshInterceptor.default(this.axios, this.refreshAuthWrapper.bind(this));
    }

    getSFAxiosInstance() {
        return this.axios;
    }

    generateAuthString () {
        return `Bearer ${this.accessToken}`;
    }

    // This is called on every request to add the access token header
    addAuthHeader (config) {
        config.headers.Authorization = this.generateAuthString();
        return config;
    }

    // This is called if a request fails with a 401 unauthorized, it attempts to refresh the access token then reattach it
    async refreshAuthWrapper (failedRequest) {
        const config = failedRequest.config;
        console.log(`Attempting SF token refresh!`);

        await this.refreshAccessToken();

        console.log(`Refreshed SF token!`);

        failedRequest.response.config.headers['Authorization'] = this.generateAuthString();
    }

    async refreshAccessToken () {
        // Using basic axios because we don't use an auth header to get a new access token
        // Remove extra slash if needed
        try {
            const refreshUrl = `${this.loginUrl}/services/oauth2/token`.replace(/([^:]\/)\/+/g, "$1");
            console.log(`Posting to refresh URL: ${refreshUrl}`);
            const response = await basicAxios.post(refreshUrl, {}, {
                params: {
                    grant_type: 'refresh_token',
                    client_id: this.clientId,
                    refresh_token : this.refreshToken,
                    format: 'json'
                }
            });
            const tokenData = response.data;
            console.log(`Obtained refreshed SF token data!`);
            this.accessToken = tokenData.access_token;

        } catch (err) {
            console.error(`Failed to obtain refresh token!`, err);
            throw new Error(`Failed to obtain refresh token!`);
        }

        // Sample response
        // {
        //     "id":"https://login.salesforce.com/id/00Dx0000000BV7z/005x00000012Q9P",
        //     "issued_at":"1278448384422",
        //     "instance_url":"https://yourInstance.salesforce.com/",
        //     "signature":"SSSbLO/gBhmmyNUvN18ODBDFYHzakxOMgqYtu+hDPsc=",
        //     "access_token":"00Dx0000000BV7z!AR8AQP0jITN80ESEsj5EbaZTFG0RNBaT1cyWk7TrqoDjoNIWQ2ME_sTZzBjfmOE6zMHq6y8PIW4eWze9JksNEkWUl.Cju7m4",
        //     "token_type":"Bearer",
        //     "scope":"id api refresh_token"
        // }
    }
}

module.exports = SFAxiosWrapper;