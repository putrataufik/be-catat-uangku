// src/routes/userProfileRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getUserProfile, updateUserName } = require('../controllers/userController');

router.use(authMiddleware);

router.get('/', getUserProfile);
router.put('/', updateUserName);

module.exports = router;
