const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middlewares/authMiddleware');
// Endpoint untuk membuat Snap token langganan
router.post('/', auth, subscriptionController.createSubscription);
router.post('/midtrans/webhook', subscriptionController.handleMidtransWebhook);
module.exports = router;
