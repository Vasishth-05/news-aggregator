const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema({
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
    }
    
}, { timestamps: true });

const signInSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
    
}, { timestamps: true });

const Register = mongoose.model('Register', registerSchema);
const SignIn = mongoose.model('SignIn', signInSchema);

module.exports = Register , SignIn;