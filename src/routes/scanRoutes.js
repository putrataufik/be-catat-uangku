const express = require('express');
const router = express.Router();
const { uploadMiddleware, scanReceipt } = require('../controllers/scanReceiptController');
const auth = require('../middlewares/authMiddleware');

router.post('/', auth, uploadMiddleware, scanReceipt);

module.exports = router;
