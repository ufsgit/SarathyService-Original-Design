const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
    console.log(`[Vehicle History Route] ${req.method} ${req.originalUrl}`, 'body:', req.body, 'query:', req.query, 'params:', req.params);
    
    const originalJson = res.json;
    res.json = function(data) {
        if (res.statusCode >= 400) {
            console.error(`[Vehicle History Route Error] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`, data);
        } else {
            console.log(`[Vehicle History Route Response] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`, 'Response Data:', data);
        }
        return originalJson.call(this, data);
    };
    
    next();
});
const vehicleHistoryController = require('../controllers/vehicle-history.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/search', verifyToken, vehicleHistoryController.search);
router.get('/search-reg', verifyToken, vehicleHistoryController.searchRegNo);
router.get('/pdf', verifyToken, vehicleHistoryController.generatePDF);
router.get('/pdf/:filename', verifyToken, vehicleHistoryController.generatePDF);

module.exports = router;
