const jwt = require('jsonwebtoken');
const { User } = require('../model/aggregator.model.js');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    message: 'User no longer exists'
                });
            }

            return next();

        } catch (error) {
            return res.status(401).json({
                message: 'Not authorized, token invalid or expired',
                error: error.message
            });
        }
    }

    return res.status(401).json({
        message: 'Not authorized, no token'
    });
};

module.exports = { protect };