const crypto = require('crypto');
const requiredParam = require('./required-param');

// Note the config var name is prefixed with PRIVACYCENTER_ in the customer app
const algorithm = 'aes-256-cbc';

// Secret must be 16 bytes (32 chars in hex). Truncate in case it is longer (should not be for all newer installs)
const secret = process.env.PRIVACYCENTER_CONN_API_SECRET ? process.env.PRIVACYCENTER_CONN_API_SECRET.substr(0,32) : null;

function encryptAndEncodeConnApiKey(apiKey = requiredParam('apiKey')) {
    if (!secret) {
        throw new Error(`Cannot encrypt without a valid secret value. A config var appear to be missing.`);
    }
    const iv = crypto.randomBytes(16);

    let cipher = crypto.createCipheriv(algorithm, Buffer.from(secret), iv);
    let encrypted = cipher.update(apiKey);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Returned encrypted key will be base64 encoded
    return Buffer.from(`${iv.toString('hex')}:${encrypted.toString('hex')}`).toString('base64');
}

function decryptConnApiKey(encrApiKeyBase64 = requiredParam('encrApiKeyBase64')) {
    if (!encrApiKeyBase64) {
        return null;
    }

    if (!secret) {
        return null;
    }

    // Incoming key will be base64 encoded
    try {
        const buff = Buffer.from(encrApiKeyBase64, 'base64');
        const encrApiKey = buff.toString('ascii');

        // console.log(`encrData: ${encrDataBuffer} encrData type: ${typeof encrDataBuffer}`);
        const [ ivHex, encryptedTextHex ] = encrApiKey.toString().split(':', 2);

        const iv = Buffer.from(ivHex, 'hex');
        let encryptedText = Buffer.from(encryptedTextHex, 'hex');

        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secret), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        console.error(`Error attempting to decrypt connApiKey:`, error);
        return null;
    }
}

function safeCompare(a, b) {
    if (!a || !b) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

module.exports = {
    encryptAndEncodeConnApiKey,
    decryptConnApiKey,
    safeCompare
};