const express = require('express');
const router = express.Router();
const { voiceReceipt } = require('../controllers/voiceReceiptController');
const auth = require('../middlewares/authMiddleware');

router.post('/', auth, voiceReceipt);

module.exports = router;
