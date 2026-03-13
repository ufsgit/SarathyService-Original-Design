const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/change-admin-password', verifyToken, authController.changeAdminPassword);
router.post('/change-staff-password', verifyToken, authController.changeStaffPassword);
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
