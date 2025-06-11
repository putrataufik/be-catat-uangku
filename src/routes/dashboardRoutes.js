const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { getTrendSaldo } = require('../controllers/dashboardController');

router.get('/trend-saldo', auth, getTrendSaldo);

module.exports = router;
