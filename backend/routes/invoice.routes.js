const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
    console.log(`[Invoice Route] ${req.method} ${req.originalUrl}`, 'body:', req.body, 'query:', req.query, 'params:', req.params);
    
    const originalJson = res.json;
    res.json = function(data) {
        if (res.statusCode >= 400) {
            console.error(`[Invoice Route Error] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`, data);
        } else {
            console.log(`[Invoice Route Response] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`, 'Response Data:', data);
        }
        return originalJson.call(this, data);
    };
    
    next();
});
const invoiceController = require('../controllers/invoice.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/next-no', verifyToken, invoiceController.getNextInvoiceNo);
router.get('/labour-names', verifyToken, invoiceController.getLabourNames);
router.get('/labour/list', verifyToken, invoiceController.getLabourInvoices);
router.get('/insurance/list', verifyToken, invoiceController.getInsuranceInvoices);
router.get('/ready/labour', verifyToken, invoiceController.getReadyLabourBills);
router.get('/ready/insurance', verifyToken, invoiceController.getReadyInsuranceBills);
router.get('/:id', verifyToken, invoiceController.getInvoice);
router.get('/:id/pdf', invoiceController.generatePDF);
router.get('/:id/pdf/:filename', invoiceController.generatePDF);
router.get('/:id/word', invoiceController.generateWord);
router.post('/labour', verifyToken, invoiceController.createLabourInvoice);
router.post('/insurance', verifyToken, invoiceController.createInsuranceInvoice);
router.put('/:id', verifyToken, invoiceController.updateInvoice);
router.put('/:id/ready', verifyToken, invoiceController.markReady);

module.exports = router;
