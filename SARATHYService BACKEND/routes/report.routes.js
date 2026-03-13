const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/job-card-summary', verifyToken, reportController.getJobCardSummary);
router.post('/job-card-statement', verifyToken, reportController.getJobCardStatement);
router.get('/previous-bills/labour', verifyToken, reportController.getPreviousLabourBills);
router.get('/previous-bills/insurance', verifyToken, reportController.getPreviousInsuranceBills);
router.get('/filter-options', verifyToken, reportController.getFilterOptions);

module.exports = router;
