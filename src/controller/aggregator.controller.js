require('dotenv').config();
const bcrypt = require('bcrypt');
const {User} = require('../model/aggregator.model.js');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const register = async (req, res) => {
    const { name, email, password, preferences } = req.body;

    if ([name, email, password].some((field) => !field)) {
        return res.status(400).json({
            message: 'Name, email, and password are required'
        });
    }

    try {
        const existingUser = await User.findOne({
            $or: [{ name }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Username or email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            preferences
        });

        res.status(200).json({
            message: 'User registered successfully',
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                preferences: newUser.preferences
            }
        });
    } catch (error) {
        console.error('User registration error:', error);
        res.status(500).json({ message: 'Failed to register user' });
    }
};

const signIn = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'Email and password are required'
        });
    }

    try {
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1d'
        });

        res.status(200).json({
            message: 'successfully signedIn',
            token
        });
    } catch (error) {
        console.error('User sign-in error:', error);
        res.status(500).json({ message: 'Failed to sign in' });
    }
};

const userPreferences = async(req,res) => {
    if (!req.user) {
        return res.status(401).json({
            message: 'Not authorized'
        });
    }

    return res.status(200).json({
        message: 'successfully got User preferences',
        preferences: req.user.preferences
    });
};

const updatePreferences = async(req,res) => {
    const { preferences } = req.body;

    if (
        !Array.isArray(preferences) ||
        preferences.some((preference) => typeof preference !== 'string')
    ) {
        return res.status(400).json({
            message: 'Preferences must be an array of strings'
        });
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { preferences },
            { returnDocument: 'after', runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'Preferences updated successfully',
            preferences: user.preferences
        });
    } catch (error) {
        console.error('Preference update error:', error);
        return res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

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
};

module.exports = {
    register,
    signIn,
    userPreferences,
    updatePreferences,
    getNews
}