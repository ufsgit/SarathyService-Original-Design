const express = require('express');
const router = express.Router();
const insuranceController = require('../controllers/insurance.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, insuranceController.getAll);
router.get('/list', verifyToken, insuranceController.getPaginated);
router.get('/:id', verifyToken, insuranceController.getById);
router.post('/', verifyToken, isAdmin, insuranceController.create);
router.put('/:id', verifyToken, isAdmin, insuranceController.update);
router.delete('/:id', verifyToken, isAdmin, insuranceController.remove);

module.exports = router;
