// routes/plannedPaymentRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  createPlannedPayment,
  getPlannedPayments,
  getPlannedPaymentById,
  updatePlannedPaymentById,
  deletePlannedPaymentById,
  payPlannedPaymentById
} = require('../controllers/plannedPaymentController');

// Endpoint Planned Payment
router.post('/', authMiddleware, createPlannedPayment); // 1. Buat baru
router.get('/', authMiddleware, getPlannedPayments); // 2. Ambil semua milik user
router.get('/:id', authMiddleware, getPlannedPaymentById); // 3. Ambil berdasarkan ID
router.put('/:id', authMiddleware, updatePlannedPaymentById); // 4. Update berdasarkan ID
router.delete('/:id', authMiddleware, deletePlannedPaymentById); // 5. Hapus berdasarkan ID
router.post('/:id/pay', authMiddleware, payPlannedPaymentById); // 6. Bayar

module.exports = router;
