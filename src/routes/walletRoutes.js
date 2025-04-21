const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { getWallets, createWallet, updateWallet, deleteWallet } = require('../controllers/walletController');

router.get('/', auth, getWallets);
router.post('/', auth, createWallet);
router.put('/:id', updateWallet);
router.delete('/:id', deleteWallet);
module.exports = router;
