require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const {User} = require('../model/aggregator.model.js');
const JWT_SECRET = process.env.JWT_SECRET;
const jwt = require('jsonwebtoken');
const axios = require('axios');
const nodeCache = require('node-cache');
const newsCache = new nodeCache({stdTTL:300});

const register = async (req, res) => {
  try {
    const { name, email, password, preferences } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    const existingUser = await User.findOne({ email });

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
      preferences: preferences || []
    });

    return res.status(200).json({
      message: 'User registered successfully',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        preferences: newUser.preferences
      }
    });

  } catch (error) {
    console.error('Register error:', error);

    return res.status(500).json({
      message: 'Registration failed'
    });
  }
};

const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const isPassword = bcrypt.compareSync(password, user.password);

        if (!isPassword) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const payload = {
            id: user._id
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: '1d'
        });

        return res.status(200).json({
            message: 'Successfully signed in',
            token
        });

    } catch (error) {
        console.error('Sign-in error:', error);

        return res.status(500).json({
            message: 'Sign-in failed'
        });
    }
};

const userPreferences = async (req, res) => {
  try {
    return res.status(200).json({
      message: 'Successfully retrieved user preferences',
      preferences: req.user.preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error.message);

    return res.status(500).json({
      message: 'Failed to retrieve preferences'
    });
  }
};


const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!Array.isArray(preferences)) {
      return res.status(400).json({
        message: 'Preferences must be an array'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { preferences } },
      { returnDocument: 'after' }
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
    console.error('Update preferences error:', error.message);

    return res.status(500).json({
      message: 'Failed to update preferences'
    });
  }
};

const getNews = async (req, res) => {
  try {
    const preferences = req.user.preferences || [];

    if (preferences.length === 0) {
      return res.status(400).json({
        message: 'Please set your news preferences first'
      });
    }

    const cacheKey = `news_${req.user._id}_${preferences.join('_')}`;

    const cachedNews = newsCache.get(cacheKey);

    if (cachedNews) {
      return res.status(200).json({
        news: cachedNews,
        source: 'cache'
      });
    }

    const response = await axios.get(
      'https://v3-api.newscatcherapi.com/api/search',
      {
        params: {
          q: preferences.map(p => `(${p})`).join(' OR ')
        },
        headers: {
          'x-api-token': process.env.NEWSCATCHER_API_KEY
        }
      }
    );

    const articles = response.data.articles || [];

    newsCache.set(cacheKey, articles);

    return res.status(200).json({
      news: articles,
      source: 'api'
    });

  } catch (error) {
    console.error(
      'Get news error:',
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: 'Failed to fetch news'
    });
  }
};


const markAsRead = async(req,res) => {
    try {

        const articleId = req.params.id;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $addToSet:{readArticles:articleId}
            },
            { new:true }
        )

        if(!user){
            res.status(404).json({
                message: 'User not found'
            })
        }

        return res.status(200).json({
            message:'Article marked as read',
            readArticles:user.readArticles
        })
        
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to mark article as read',
        });
    }
}

const markAsFavourite = async(req,res) => {
     try {

        const articleId = req.params.id;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $addToSet:{favouriteArticles:articleId}
            },
            { new:true }
        )

        if(!user){
            res.status(404).json({
                message: 'User not found'
            })
        }

        return res.status(200).json({
            message:'Article marked as favourite',
            favouriteArticles:user.favouriteArticles
        })
        
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to mark article as favourite',
        });
    }

}

const getReadArticles = async(req,res) => {
    try {
        const user = await User.findById(req.user._id)
        .select('readArticles');
    
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            readArticles: user.readArticles
        })

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch read articles'
        });
    }
}

const getFavoriteArticles = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('favouriteArticles');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            favouriteArticles: user.favouriteArticles
        });

    } catch (error) {
        console.error('Get favorites error:', error.message);

        return res.status(500).json({
            message: 'Failed to fetch favorite articles'
        });
    }
};

const searchNews = async (req,res) => {
    try {
        const keyword = req.params.keyword;

        if (!keyword || !keyword.trim()){
            return res.status(400).json({
                message: 'Please provide a search keyword'
            })
        }

        const cacheKey = `search_${keyword.trim().toLowerCase()}`;

        const cachedArticles = newsCache.get(cacheKey);

        if (cachedArticles){
            return res.status(200).json({
                source:'cache',
                keyword,
                articles:cachedArticles
            })
        }

        const response = await axios.get(
            'https://v3-api.newscatcherapi.com/api/search',
            {
                params: {
                    q: keyword.trim()
                },
                headers: {
                    'x-api-token': process.env.NEWSCATCHER_API_KEY
                }
            }
        );

        const articles = response.data.articles;

        newsCache.set(cacheKey,articles);

        return res.status(200).json({
            keyword,
            source : 'api',
            articles: response.data.articles
        });

    } catch (error) {
        console.error(
            'NewsCatcher search error:',
            error.response?.data || error.message
        );

        return res.status(502).json({
            message: 'Failed to search news'
        });
    }
}

module.exports = {
    register,
    signIn,
    userPreferences,
    updatePreferences,
    getNews,
    markAsRead,
    markAsFavourite,
    getReadArticles,
    getFavoriteArticles,
    searchNews
}
