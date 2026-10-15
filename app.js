require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

const mongoose = require('mongoose');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function startServer() {
    mongoose.connect(process.env.MONGO_URI)

    app.listen(port, (err) => {
        if (err) {
            return console.log('Something bad happened', err);
        }
        console.log(`Server is listening on ${port}`);
    });
}

startServer();



module.exports = app;