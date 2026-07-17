const express = require('express');
const router = express.Router();
const vehicleHistoryController = require('../controllers/vehicle-history.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/search', verifyToken, vehicleHistoryController.search);
router.get('/search-reg', verifyToken, vehicleHistoryController.searchRegNo);
router.get('/pdf', verifyToken, vehicleHistoryController.generatePDF);
router.get('/pdf/:filename', verifyToken, vehicleHistoryController.generatePDF);

module.exports = router;
