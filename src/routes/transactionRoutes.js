// src/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const { createTransaction, getTransactionsByWallet, deleteTransaction } = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, createTransaction); // Buat transaksi
router.get('/:walletId', authMiddleware, getTransactionsByWallet); // Ambil transaksi berdasarkan wallet
router.delete('/:id', authMiddleware, deleteTransaction);


module.exports = router;
