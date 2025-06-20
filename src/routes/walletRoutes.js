const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { getWallets, createWallet, updateWallet, deleteWallet, getWalletSummary, getTrendSaldoByWallet, getWalletById } = require('../controllers/walletController');

router.get('/', auth, getWallets);
router.get('/:id', auth, getWalletById);
router.post('/', auth, createWallet);
router.put('/:id',auth, updateWallet);
router.delete('/:id',auth, deleteWallet);
router.get('/:walletId/summary', auth, getWalletSummary);
router.get('/:walletId/trend', auth, getTrendSaldoByWallet);

module.exports = router;
