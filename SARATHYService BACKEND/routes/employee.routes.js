const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', verifyToken, employeeController.getAll);
router.get('/mechanics', verifyToken, employeeController.getMechanics);
router.get('/advisors', verifyToken, employeeController.getAdvisors);
router.get('/:id', verifyToken, employeeController.getById);
router.get('/:id/login', verifyToken, isAdmin, employeeController.getLogin);
router.post('/', verifyToken, isAdmin, upload.single('e_photo'), employeeController.create);
router.put('/:id', verifyToken, isAdmin, upload.single('e_photo'), employeeController.update);
router.put('/:id/status', verifyToken, isAdmin, employeeController.updateStatus);
router.put('/:id/login', verifyToken, isAdmin, employeeController.updateLogin);
router.delete('/:id', verifyToken, isAdmin, employeeController.remove);

module.exports = router;
