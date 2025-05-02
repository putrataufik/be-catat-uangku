// src/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createTransaction, 
  getTransactionsByWallet, 
  deleteTransaction, 
  updateTransaction, 
  getAllTransactions,
  getTransactionById,
  getTransactionSummary,
} = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Buat transaksi baru
router.post('/', authMiddleware, createTransaction);

// Ambil semua transaksi milik user (support filter: type, category, tanggal)
router.get('/', authMiddleware, getAllTransactions);

// Ambil semua transaksi berdasarkan walletId
router.get('/wallet/:walletId', authMiddleware, getTransactionsByWallet);

// Ambil detail transaksi berdasarkan id
router.get('/detail/:id', authMiddleware, getTransactionById);

// Update transaksi
router.put('/:id', authMiddleware, updateTransaction);

// Hapus transaksi
router.delete('/:id', authMiddleware, deleteTransaction);

// Summary transaksi (total amount + count)
router.get('/summary', authMiddleware, getTransactionSummary);


module.exports = router;
