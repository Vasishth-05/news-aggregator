const mongoose = require('mongoose');

const dbConnect = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
};

module.exports = dbConnect;
