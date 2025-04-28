// src/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const { createTransaction, getTransactionsByWallet, deleteTransaction, updateTransaction, } = require('../controllers/transactionController');
const {getAllTransactionByUserId} = require('../controllers/transactionHistoryController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, createTransaction);
router.get('/history', authMiddleware, getAllTransactionByUserId);
router.get('/:walletId', authMiddleware, getTransactionsByWallet);
router.delete('/:id', authMiddleware, deleteTransaction);
router.put('/:id', authMiddleware, updateTransaction);



module.exports = router;
