const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    preferences:{
        type:[String],
        default:[]
    },
    readArticles:{
        type:[String],
        default:[]
    },
    favouriteArticles:{
        type:[String],
        default:[]
    }
    
}, { timestamps: true });

const User = mongoose.model('Users', userSchema);

module.exports = {User};