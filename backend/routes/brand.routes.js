const express = require('express');
const router = express.Router();
const { getActiveBrand } = require('../controllers/brand.controller');

// Brand config routes
router.get('/active', getActiveBrand);

module.exports = router;
