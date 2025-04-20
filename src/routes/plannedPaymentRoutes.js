// src/routes/plannedPaymentRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { createPlannedPayment, getPlannedPayments, deletePlannedPayment, updatePlannedPayment, payPlannedPayment } = require('../controllers/plannedPaymentController');

router.use(authMiddleware);

router.post('/', createPlannedPayment);
router.get('/', getPlannedPayments);
router.put('/:id', updatePlannedPayment);
router.post('/pay/:id', payPlannedPayment);
router.delete('/:id', deletePlannedPayment);

module.exports = router;
