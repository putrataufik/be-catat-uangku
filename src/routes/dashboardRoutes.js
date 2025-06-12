const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { getTrendSaldo, getArusKas, getTopExpenses, getPlannedPayments } = require('../controllers/dashboardController');

router.get('/trend-saldo', auth, getTrendSaldo);
router.get('/arus-kas', auth, getArusKas);
router.get('/top-expenses', auth, getTopExpenses);
router.get('/planned-payments', auth, getPlannedPayments);
module.exports = router;
