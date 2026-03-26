const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branch.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/paginated', verifyToken, branchController.getPaginated);
router.get('/', verifyToken, branchController.getAll);
router.get('/:id', verifyToken, branchController.getById);
router.post('/', verifyToken, isAdmin, branchController.create);
router.put('/:id', verifyToken, isAdmin, branchController.update);
router.delete('/:id', verifyToken, isAdmin, branchController.remove);

module.exports = router;
