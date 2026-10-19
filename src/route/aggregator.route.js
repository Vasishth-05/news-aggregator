const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/aggregator.auth.middleware')

const aggregatorController = require('../controller/aggregator.controller');

router.route('/signup')
    .post(aggregatorController.register);

router.route('/login')
    .post(aggregatorController.signIn)

router.route('/preferences')
    .get(protect, aggregatorController.userPreferences)

module.exports = router