
const SalesforceModel = require('../../models/salesforce');
const express = require('express');

let router = express.Router();

const salesforce = new SalesforceModel();

// router.get('/testConnectivity', async function(req, res) {
//     res.json({
//         online: true
//     });
// });

// These are subroutes under the /salesforce route. So getQuery is /salesforce/getQuery
router.post('/getQuery', async function(req, res) {
    const { sfQuery } = req.body;

    try {
        const sfResp = await salesforce.getQuery(sfQuery);
        res.json({
            sfResp
        });
    } catch (err) {
        console.error(err);
        const msg = `Error running salesforce getQuery method: ${err.message}`;
        res.json({
            error: msg
        });
    }
});

router.get('/getActivePolicies', async function(req, res) {
    // console.log(`MADE IT HERE`);
    try {
        const sfResp = await salesforce.getActivePolicies();
        // console.log(`sfResp: `, sfResp);
        res.json({
            sfResp
        });
    } catch (err) {
        console.error(err);
        const msg = `Error running salesforce getActivePolicies method: ${err.message}`;
        res.json({
            error: msg
        });
    }
});

router.post('/getAllPolicies', async function(req, res) {
    const { activeOnly = true } = req.body;
    try {
        const sfResp = await salesforce.getAllPolicies(activeOnly);
        res.json({
            sfResp
        });
    } catch (err) {
        console.error(err);
        const msg = `Error running salesforce getAllPolicies method: ${err.message}`;
        res.json({
            error: msg
        });
    }
});

router.post('/getPolicyByName', async function(req, res) {
    const { developerName, activeOnly = true } = req.body;
    try {
        const sfResp = await salesforce.getPolicyByName(developerName, activeOnly);
        res.json({
            sfResp
        });
    } catch (err) {
        console.error(err);
        const msg = `Error running salesforce getPolicyByName method: ${err.message}`;
        res.json({
            error: msg
        });
    }
});

router.post('/getObjectsByPolicyId', async function(req, res) {
    const { policyId, activeOnly = true } = req.body;

    try {
        const sfResp = await salesforce.getObjectsByPolicyId(policyId, activeOnly);
        res.json({
            sfResp
        });
    } catch (err) {
        console.error(err);
        const msg = `Error running salesforce getObjectsByPolicyId method: ${err.message}`;
        res.json({
            error: msg
        });
    }
});

router.post('/getAllObjects', async function(req, res) {
    const { activeOnly = true } = req.body;

    try {
        const sfResp = await salesforce.getAllObjects(activeOnly);
        res.json({
            sfResp
        });
    } catch (err) {
        console.error(err);
        const msg = `Error running salesforce getAllObjects method: ${err.message}`;
        res.json({
            error: msg
        });
    }
});

router.post('/getFieldsByObjectIds', async function(req, res) {
    const { objectIds, activeOnly = true } = req.body;

    try {
        const sfResp = await salesforce.getFieldsByObjectIds(objectIds, activeOnly);
        res.json({
            sfResp
        });
    } catch (err) {
        console.error(err);
        const msg = `Error running salesforce getFieldsByObjectIds method: ${err.message}`;
        res.json({
            error: msg
        });
    }
});

router.post('/getAllFields', async function(req, res) {
    const { activeOnly = true } = req.body;

    try {
        const sfResp = await salesforce.getAllFields(activeOnly);
        res.json({
            sfResp
        });
    } catch (err) {
        console.error(err);
        const msg = `Error running salesforce getAllFields method: ${err.message}`;
        res.json({
            error: msg
        });
    }
});

router.post('/getAllParts', async function(req, res) {
    const { activeOnly = true } = req.body;

    try {
        const sfResp = await salesforce.getAllParts(activeOnly);
        res.json({
            sfResp
        });
    } catch (err) {
        console.error(err);
        const msg = `Error running salesforce getAllParts method: ${err.message}`;
        res.json({
            error: msg
        });
    }
});

router.post('/getAllPartsByPolicyName', async function(req, res) {
    const { developerName, activeOnly = true } = req.body;

    try {
        const sfResp = await salesforce.getAllPartsByPolicyName(developerName, activeOnly);
        res.json({
            sfResp
        });
    } catch (err) {
        console.error(err);
        const msg = `Error running salesforce getAllPartsByPolicyName method: ${err.message}`;
        res.json({
            error: msg
        });
    }
});

router.post('/insertRunLog', async function(req, res) {
    const { executionId, policyName, logStatus, logType, logMessage } = req.body;

    try {
        const sfResp = await salesforce.insertRunLog(executionId, policyName, logStatus, logType, logMessage);
        res.json({
            sfResp
        });
    } catch (err) {
        console.error(err);
        const msg = `Error running salesforce insertRunLog method: ${err.message}`;
        res.json({
            error: msg
        });
    }
});

router.post('/retrieveRunlogs', async function(req, res) {
    // const { objectIds } = req.body;

    try {
        const sfResp = await salesforce.retrieveRunlogs(req.body);
        res.json({
            sfResp
        });
    } catch (err) {
        console.error(err);
        const msg = `Error running salesforce retrieveRunlogs method: ${err.message}`;
        res.json({
            error: msg
        });
    }
});

// Bulk operation is not called via express, only via job through redis due to content size
// async bulkOperation(sobject, records, action) {
// }

module.exports = router;