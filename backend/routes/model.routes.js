const express = require('express');
const router = express.Router();
const modelController = require('../controllers/model.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/paginated', verifyToken, modelController.getPaginated);
router.get('/', verifyToken, modelController.getAll);
router.get('/:id', verifyToken, modelController.getById);
router.post('/', verifyToken, isAdmin, modelController.create);
router.put('/:id', verifyToken, isAdmin, modelController.update);
router.delete('/:id', verifyToken, isAdmin, modelController.remove);

module.exports = router;
