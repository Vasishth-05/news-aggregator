require('dotenv').config();

const app = require('./app');
const dbConnect = require('./src/db/aggregator.db');

const port = process.env.PORT || 5000;

dbConnect()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is listening on ${port}`);
        });
    })
    .catch((error) => {
        console.error('Unable to start server:', error);
        process.exitCode = 1;
    });
