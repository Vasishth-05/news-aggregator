const express = require('express');
const bcrypt = require('bcrypt');
const Register = require('../model/aggregator.model.js');

const register = async (req, res) => {
    const {username, email, password} = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if( 
        [username, email, hashedPassword].some(field => !field) 
    ){
        throw new Error('All fields are required');
    }

    const existingUser = await Register.findOne({
        $or: [
            { username },
            { email }
        ]
    });

    if(existingUser){
        throw new Error('Username or email already exists');
    }

    const newUser = await Register.create({
        username,
        email,
        hashedPassword
    });

    const createdUser = await newUser.findById(newUser._id).select('-hashedPassword');

    if(!createdUser){
        throw new Error('Something went wrong while creating the user');
    }

    res.status(201).json({
        message: 'User registered successfully',
        user: newUser
    });
}


const signIn = async (req, res) => {

}

module.exports = {
    register,
    signIn
}