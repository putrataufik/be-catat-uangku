const express = require('express');
const router = express.Router();
const { saveDeviceToken } = require('../controllers/fcmController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/token', authMiddleware, saveDeviceToken);

module.exports = router;
