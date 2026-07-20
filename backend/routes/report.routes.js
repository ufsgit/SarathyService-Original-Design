const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
    console.log(`[Report Route] ${req.method} ${req.originalUrl}`, 'body:', req.body, 'query:', req.query, 'params:', req.params);
    
    const originalJson = res.json;
    res.json = function(data) {
        if (res.statusCode >= 400) {
            console.error(`[Report Route Error] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`, data);
        } else {
            console.log(`[Report Route Response] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`, 'Response Data:', data);
        }
        return originalJson.call(this, data);
    };
    
    next();
});
const reportController = require('../controllers/report.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/job-card-summary', verifyToken, reportController.getJobCardSummary);
router.post('/job-card-statement', verifyToken, reportController.getJobCardStatement);
router.get('/previous-bills/labour', verifyToken, reportController.getPreviousLabourBills);
router.get('/previous-bills/insurance', verifyToken, reportController.getPreviousInsuranceBills);
router.get('/filter-options', verifyToken, reportController.getFilterOptions);

module.exports = router;
