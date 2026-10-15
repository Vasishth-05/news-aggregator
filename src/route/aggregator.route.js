const express = require('express');
const router = express.Router();

const aggregatorController = require('../controller/aggregator.controller');

router.route('/register')
    .post(aggregatorController.register);

module.exports = router;