const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { getTrendSaldo, getArusKas } = require('../controllers/dashboardController');

router.get('/trend-saldo', auth, getTrendSaldo);
router.get('/arus-kas', auth, getArusKas);
module.exports = router;
