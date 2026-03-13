const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/next-no', verifyToken, invoiceController.getNextInvoiceNo);
router.get('/labour-names', verifyToken, invoiceController.getLabourNames);
router.get('/labour/list', verifyToken, invoiceController.getLabourInvoices);
router.get('/insurance/list', verifyToken, invoiceController.getInsuranceInvoices);
router.get('/ready/labour', verifyToken, invoiceController.getReadyLabourBills);
router.get('/ready/insurance', verifyToken, invoiceController.getReadyInsuranceBills);
router.get('/:id', verifyToken, invoiceController.getInvoice);
router.get('/:id/pdf', verifyToken, invoiceController.generatePDF);
router.post('/labour', verifyToken, invoiceController.createLabourInvoice);
router.post('/insurance', verifyToken, invoiceController.createInsuranceInvoice);
router.put('/:id', verifyToken, invoiceController.updateInvoice);
router.put('/:id/ready', verifyToken, invoiceController.markReady);

module.exports = router;
