const express = require('express');
const router = express.Router();
const jobcardController = require('../controllers/jobcard.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, jobcardController.getAll);
router.get('/:id', verifyToken, jobcardController.getById);
router.post('/', verifyToken, jobcardController.create);
router.post('/check', verifyToken, jobcardController.checkJobCardNo);

module.exports = router;
