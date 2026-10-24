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

router.route('/:id/read')
    .post(protect,aggregatorController.markAsRead)

router.route('/read')
    .get(protect,aggregatorController.getReadArticles)

router.route('/:id/favourite')
    .post(protect,aggregatorController.markAsFavourite)

router.route('/favourite')
    .get(protect,aggregatorController.getFavoriteArticles)

router.route('/search/:keyword')
    .get(protect,aggregatorController.searchNews)

module.exports = router