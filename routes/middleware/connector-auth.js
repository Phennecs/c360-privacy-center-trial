const { hashConnApiKey, safeCompare, decryptConnApiKey } = require("../../utils/connector-crypto-utils");

// const hashedApiKey = process.env.PRIVACYCENTER_CONN_API_KEY ? hashConnApiKey(process.env.PRIVACYCENTER_CONN_API_KEY) : null;

// I don't think uses the secret to encrypt the key actually gains any security over just a standard basic auth call.
// We're mainly relying on TLS/https to hide the authentication header from the world.
function connectorAuthMiddleware(req, res, next) {
    const encEncrApiKey = req.get('authorization');
    if (!encEncrApiKey) {
        console.error(`No credentials sent on connector request!`);
        return res.status(403).json({ error: 'No credentials sent!' });
    }

    const decrKey = decryptConnApiKey(encEncrApiKey);
    if (!safeCompare(decrKey, process.env.PRIVACYCENTER_CONN_API_KEY)) {
        console.error(`Connector credentials did not match!`);
        return res.status(401).json({ error: 'Unauthorized!' });
    }
    // console.log(`Connector creds authorized, proceeding`);
    next();
}

module.exports = connectorAuthMiddleware;