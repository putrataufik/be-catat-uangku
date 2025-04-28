const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { getWallets, createWallet, updateWallet, deleteWallet } = require('../controllers/walletController');

router.get('/', auth, getWallets);
router.post('/', auth, createWallet);
router.put('/:id',auth, updateWallet);
router.delete('/:id',auth, deleteWallet);
module.exports = router;
