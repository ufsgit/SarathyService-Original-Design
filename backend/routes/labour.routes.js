const express = require('express');
const router = express.Router();
const labourController = require('../controllers/labour.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/paginated', verifyToken, labourController.getPaginated);
router.get('/', verifyToken, labourController.getAll);
router.get('/:id', verifyToken, labourController.getById);
router.post('/', verifyToken, isAdmin, labourController.create);
router.put('/:id', verifyToken, isAdmin, labourController.update);
router.delete('/:id', verifyToken, isAdmin, labourController.remove);

module.exports = router;
