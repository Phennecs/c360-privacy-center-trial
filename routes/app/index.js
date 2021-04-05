const express = require('express');
const appVersion = require('../../utils/app-version');

const router = express.Router();

router.get('/version', async function(req, res) {
    res.json({
        appVersion
    });
});

module.exports = router;