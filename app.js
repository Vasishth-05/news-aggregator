require('dotenv').config();

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const aggregatorRoutes = require('./src/route/aggregator.route.js');

app.use('/users', aggregatorRoutes);
app.use('/news', aggregatorRoutes);

module.exports = app;