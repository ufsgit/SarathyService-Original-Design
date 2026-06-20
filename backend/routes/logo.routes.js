const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');

const {
    upload,
    listLogos,
    getLogoById,
    createLogo,
    updateLogo,
    updateLogoWithImage,
    deleteLogo
} = require('../controllers/logo.controller');

// Logo routes
router.get('/list', listLogos);
router.get('/get/:id', getLogoById);
router.post('/create', verifyToken, isAdmin, upload.single('logo_image'), createLogo);
router.put('/update/:id', verifyToken, isAdmin, updateLogo);
router.put('/update-with-image/:id', verifyToken, isAdmin, upload.single('logo_image'), updateLogoWithImage);
router.delete('/delete/:id', verifyToken, isAdmin, deleteLogo);

module.exports = router;
