const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, customerController.getAll);
router.get('/search', verifyToken, customerController.search);
router.get('/reg/:regNo', verifyToken, customerController.getByRegistration);
router.get('/:id', verifyToken, customerController.getById);
router.post('/', verifyToken, customerController.create);
router.post('/datatable', verifyToken, customerController.dataTable);
router.post('/check-registration', verifyToken, customerController.checkRegistration);
router.put('/:id', verifyToken, customerController.update);
router.delete('/:id', verifyToken, customerController.remove);

module.exports = router;
