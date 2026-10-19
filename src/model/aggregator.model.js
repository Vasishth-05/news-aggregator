const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
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
        categories:{
            type:[String],
            default:[]
        },
        languages:{
            type:[String],
            default:[]
        }
    }
    
}, { timestamps: true });

const User = mongoose.model('Users', userSchema);

module.exports = {User};