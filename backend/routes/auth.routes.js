const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
    console.log(`[Auth Route] ${req.method} ${req.originalUrl}`, 'body:', req.body, 'query:', req.query, 'params:', req.params);
    next();
});
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/change-admin-password', verifyToken, authController.changeAdminPassword);
router.post('/change-staff-password', verifyToken, authController.changeStaffPassword);
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
