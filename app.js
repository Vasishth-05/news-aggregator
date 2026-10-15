require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

const mongoose = require('mongoose');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbConnect = require('./src/db/aggregator.db.js');

function startServer() {
    dbConnect();

    app.listen(port, (err) => {
        if (err) {
            return console.log('Something bad happened', err);
        }
        console.log(`Server is listening on ${port}`);
    });
}

startServer();



module.exports = app;