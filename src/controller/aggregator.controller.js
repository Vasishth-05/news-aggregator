const express = require('express');
const bcrypt = require('bcrypt');
const {User} = require('../model/aggregator.model.js');
const JWT_SECRET = process.env.JWT_SECRET;
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const {username, email, password, categories, languages} = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if( 
        [username, email, password].some(field => !field) 
    ){
        throw new Error('All fields are required');
    }

    const existingUser = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    });

    if(existingUser){
        throw new Error('Username or email already exists');
    }

    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        preferences : {
            categories:categories || [],
            languages:languages || []
        }
        
    });

    const createdUser = await User.findById(newUser._id).select('-password');

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

const userPreferences = async(req,res) => {
    const {email,password,categories,languages} = req.body

    const user = await User.findOne({email});

    if (!user) {
        throw new Error("User not Found ");
    }

    const isPassword = bcrypt.compareSync(password,user.password);

    if(!isPassword){
        throw new Error ('Invalid Password');
    }

    res.status(201).json({
        message : 'successfully got User preferences',
        preferences:{
            categories,
            languages
        }
    })
}

const updatePreferences = async(req,res) => {
    try {
        
        const {categories,languages} = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                preferences: {
                    categories,
                    languages
                }
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

module.exports = {
    register,
    signIn,
    userPreferences,
    updatePreferences
}