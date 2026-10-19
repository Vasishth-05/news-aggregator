const express = require('express');
const bcrypt = require('bcrypt');
const Register = require('../model/aggregator.model.js');
const { default: mongoose } = require('mongoose');
const JWT_SECRET = 'harekrsna';
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const {username, email, password} = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if( 
        [username, email, password].some(field => !field) 
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
        password: hashedPassword
    });

    const createdUser = await Register.findById(newUser._id).select('-password');

    if(!createdUser){
        throw new Error('Something went wrong while creating the user');
    }

    res.status(201).json({
        message: 'User registered successfully',
        user: newUser
    });
}

const generateToken = (id) => {
    jwt.sign({id},JWT_SECRET,{
                expiresIn:'30d'
            })
}


const signIn = async (req, res) => {
    const {email,password} = req.body

    const user = await Register.findOne({email});

    if (!user) {
        throw new Error("User not Found ");
    }

    const isPassword = bcrypt.compareSync(password,user.password);

    const payload = {
        id: user._id
    }

    const token = jwt.sign(payload,JWT_SECRET,{
        expiresIn:"1d"
    })

    if(!isPassword){
        throw new Error ('Invalid Password');
    }

    res.status(201).json({
        message : 'successfully signedIn',
        token:token
    })


    // if (user && (await bcrypt.compareSync(password,user.password))){
    //     res.status(201).json({
    //         _id:user._id,
    //         name:user.name,
    //         email:user.email,
    //         token: generateToken(user._id)
    //     })
    // } else {
    //     res.status(400)
    //     throw new Error('Invalid Credentials')
    // }
}

module.exports = {
    register,
    signIn
}