const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdf.controller');

// Get raw invoice data for frontend PDF generation
router.get('/invoice-data/:id', pdfController.getInvoicePdfData);

module.exports = router;
