const { redisSettings } = require('../../settings');
const Queue = require('bull');
const Redis = require('ioredis');
const url = require('url');
const { RedisConnectionError } = require('../../errors');

// Bull will configure many event listeners on a single connection when using connection sharing. Increase the warning limit.
require('events').EventEmitter.defaultMaxListeners = 200;

// if (!process.env.REDIS_URL) {

// }

// Had to put this method in to handle the rediss protocol that heroku redis has just started using. They provide a self-signed certificate which causes redis connections to fail on tls due to self-signed cert.
// This is NOT secure, but is currently required due to Heroku.
const redisOptsFromUrl = (urlString) => {
    const redisOpts = {};
    try {
        const redisUrl = url.parse(urlString);
        redisOpts.port = Number(redisUrl.port) || 6379;
        redisOpts.host = redisUrl.hostname;
        redisOpts.db = redisUrl.pathname ? Number(redisUrl.pathname.split("/")[1]) : 0;
        if (redisUrl.auth) {
            redisOpts.password = redisUrl.auth.split(":")[1];
        }
        // console.log(`Redis protocol: ${redisUrl.protocol}`);
        if (redisUrl.protocol === "rediss:") {
            redisOpts.tls = {
                rejectUnauthorized: false,
                requestCert: true,
                agent: false
            };
        }
    } catch (e) {
        throw new Error(e.message);
    }
    return redisOpts;
};


const redisOpts = redisOptsFromUrl(process.env.REDIS_URL);
// console.log(`Redis tls opts: ${JSON.stringify(redisOpts.tls)}`);
// console.log(`redisOpts: ${JSON.stringify(redisOpts, undefined, 2)}`);

function createNewRedis() {
    try {
        const redis = new Redis(redisOpts);
        return redis;
    } catch (err) {
        console.error(`Error creating new redis instance! Process will now exit.`, err);
        throw new RedisConnectionError(`Error creating new redis instance: ${err.message}`);
    }
}

const client = createNewRedis();
const subscriber = createNewRedis();

// To allow sharing of connections
const opts = {
    createClient: function (type) {
        switch (type) {
            case 'client':
                return client;
            case 'subscriber':
                return subscriber;
            case 'bclient':
                return createNewRedis();
            default:
                throw new Error('Unexpected connection type: ', type);
        }
    }
};

const configQueue = new Queue('config-queue', { ...opts, settings: redisSettings });

const policyQueue = new Queue('policy-queue', { ...opts, settings: redisSettings });

const cacheQueue = new Queue('cache-queue', { ...opts, settings: redisSettings });
const modifyQueue = new Queue('modify-queue', { ...opts, settings: redisSettings });
const bulkQueue = new Queue('bulk-queue', { ...opts, settings: redisSettings });
const upStateQueue = new Queue('upstate-queue', { ...opts, settings: redisSettings });
// const fileQueue = new Queue('file-queue', { ...opts, settings: redisSettings });

// console.log('Creating new queue objects...');

// Note this does not contain upStateQueue
const nonPolicyQueues = [
    cacheQueue,
    modifyQueue,
    bulkQueue,
];

// refreshQueue () {

// }

module.exports = {
    configQueue,
    policyQueue,
    cacheQueue,
    modifyQueue,
    bulkQueue,
    upStateQueue,
    // fileQueue,
    nonPolicyQueues
};