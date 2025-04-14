const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { getWallets, createWallet } = require('../controllers/walletController');

router.get('/', auth, getWallets);
router.post('/', auth, createWallet);

module.exports = router;
