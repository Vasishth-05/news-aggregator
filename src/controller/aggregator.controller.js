require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const {User} = require('../model/aggregator.model.js');
const JWT_SECRET = process.env.JWT_SECRET;
const jwt = require('jsonwebtoken');
const axios = require('axios');

const register = async (req, res) => {
    const {name, email, password,preferences} = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if( 
        [name , password].some(field => !field) 
    ){
        throw new Error('All fields are required');
    }

    const existingUser = await User.findOne({
        $or: [
            { name },
            { email }
        ]
    });

    if(existingUser){
        throw new Error('Username or email already exists');
    }

    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        preferences
        
    });

    const createdUser = await User.findById(newUser._id).select('-password');

    if(!createdUser){
        throw new Error('Something went wrong while creating the user');
    }

    res.status(200).json({
        message: 'User registered successfully',
        user: newUser
    });
}

const signIn = async (req, res) => {
    const {email,password} = req.body

    const user = await User.findOne({email});

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
        return res.status(401).json({
            message: 'invalid password'
        })
    }

    res.status(200).json({
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

const userPreferences = async(req,res) => {
    const {email} = req.body

    const user = await User.findOne({email});

    if (!user) {
        res.status(401).json({
            message: "Not a User"
        })
    }

    res.status(200).json({
        message : 'successfully got User preferences',
        preferences:user.preferences
    })
}

const updatePreferences = async(req,res) => {
    try {

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                preferences: []
            },
            {new:true,runValidators:true}
        ).select('-password');

        if(!user){
            return res.status(404).json({
                message: 'User not found'
            })
        }

        res.status(200).json({
            message: 'Preferences updated successfully',
            preferences: user.preferences
        })

    } catch (error) {
        res.status(500).json({
            message:"Server Error",
            error: error.message
        })
    }
}

const getNews = async(req,res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const preferences = user.preferences;

        if(!preferences?.length ){
            return res.status(400).json({
                message : 'Please set your news preferences first'
            })
        }

        const response = await axios.get(
            "https://v3-api.newscatcherapi.com/api/search",
            {
                params:{
                    q:preferences.join(' OR ')
                },
                headers:{
                    'x-api-token': process.env.NEWSCATCHER_API_KEY
                }
            }
        )

        res.status(200).json({
            articles: response.data.articles
        })

    } catch (error) {
        console.error('NewsCatcher error:', error.response?.data || error.message);

        return res.status(502).json({
            message: 'Failed to fetch news'
        });
    }
}

module.exports = {
    register,
    signIn,
    userPreferences,
    updatePreferences,
    getNews
}
