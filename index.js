'use strict';
require('dotenv').config();

const appVersion = require('./utils/app-version');
console.log(`--->>> CONN APP VERSION => ${appVersion} <<<---`);

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000;
const helmet = require('helmet');
const enforce = require('express-sslify');
const { handleJobSubmission } = require('./controllers/worker/worker-utils/job-gateway');

// TODO need to add express-ip-access-control package most likely, whitelist SF IP ranges only

app.use(helmet());

// Force HTTPS on all requests
// Use enforce.HTTPS({ trustProtoHeader: true }) in case you are behind
// a load balancer (e.g. Heroku). See further comments below
app.use(enforce.HTTPS({ trustProtoHeader: true }));

const routes = require('./routes');

// // Express Middleware
// app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

routes.init(app);

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

// Submit a restarted notification job when this script starts up, to notify the backend
(async () => {
    if (!process.env.REDIS_URL) {
        console.log(`REDIS_URL is not set, will not trigger customer-app-restarted!`);
        return;
    }
    const { configQueue } = require('./models/queue');

    console.log(`Submitting customer-app-restarted job.`);
    try {
        await handleJobSubmission({
            queue: configQueue,
            jobType: 'customer-app-restarted',
            jobData: {},
            skipCounters: true // Needed on this initial job submission because the config schema has not been initialized yet. Tables won't exist.
        });
    } catch (err) {
        console.error(`ERROR: Could not submit customer-app-restarted job to config queue. `, err);
    }
})();
