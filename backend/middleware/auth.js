const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Support token in Authorization header OR as ?token= query param (for direct PDF links)
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.', redirect: '/login' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (err) {
        console.log("token error", err);
        return res.status(401).json({ message: 'Invalid or expired token. Please login again.', redirect: '/login' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Admin access required.' });
    }
};

const isStaff = (req, res, next) => {
    if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
        next();
    } else {
        return res.status(403).json({ message: 'Staff access required.' });
    }
};

module.exports = { verifyToken, isAdmin, isStaff };
