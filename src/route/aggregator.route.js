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
    .put(protect, aggregatorController.updatePreferences)

router.route('/')
    .get(protect,aggregatorController.getNews)

router.route('/read')
    .post(protect,aggregatorController.markAsRead)
    .get(protect,aggregatorController.getReadArticles)

router.route('/favourite')
    .post(protect,aggregatorController.markAsFavourite)
    .get(protect,aggregatorController.getFavoriteArticles)

module.exports = router