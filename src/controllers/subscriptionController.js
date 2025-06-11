require("dotenv").config();
const snap = require("../configs/midtrans");
const User = require("../models/userModel");
const SubscriptionTransaction = require("../models/subscriptionTransactionModel");
const crypto = require("crypto");

/**
 * Create a new subscription transaction via Midtrans Snap
 */
exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    // Validate input
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount provided." });
    }

    // Find user
    const user = await User.findById(userId).select("name email");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate unique order ID
    const orderId = `SUBS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Build Midtrans parameters
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: user.name,
        email: user.email,
      },
      item_details: [
        {
          id: "premium-subscription",
          price: amount,
          quantity: 1,
          name: "Premium Subscription",
        },
      ],
    };

    // Create transaction
    const { token, redirect_url } = await snap.createTransaction(parameter);

    // Persist transaction with status 'pending'
    await SubscriptionTransaction.create({
      userId,
      orderId,
      snapToken: token,
      amount,
      transactionStatus: "pending",
      rawResponse: parameter,
    });

    return res.status(201).json({
      message: "Subscription transaction created.",
      snapToken: token,
      redirect_url,
      orderId,
    });
  } catch (error) {
    console.log("Error in createSubscription:", { error });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Handle Midtrans webhook notifications
 */
exports.handleMidtransWebhook = async (req, res) => {
  console.log('📩 Webhook HIT ✅');
  console.log('🔍 Payload:', req.body);

  try {
    const payload = req.body;
    const orderId = payload.order_id;
    const status = payload.transaction_status;
    const paymentType = payload.payment_type;
    const paidAt = payload.settlement_time ? new Date(payload.settlement_time) : null;

    console.log('🆔 Order ID:', orderId);
    console.log('📦 Status:', status);
    console.log('💳 Payment Type:', paymentType);
    console.log('⏱️ Paid At:', paidAt);

    // Ekstrak userId dari orderId
    const userId = orderId.split('_')[1]; // contoh: subscr_653af92a61b88b5a... -> ambil userId
    console.log('👤 User ID dari Order ID:', userId);

    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User tidak ditemukan dengan ID:', userId);
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (status === 'settlement') {
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);

      user.isPremium = true;
      user.premium = {
        startDate: now,
        endDate: end,
        lastPaymentOrderId: orderId,
        paymentMethod: paymentType,
      };

      await user.save();
      console.log('🏆 User berhasil di-update ke premium:', {
        id: user._id,
        isPremium: user.isPremium,
        premium: user.premium,
      });
    } else {
      console.log('ℹ️ Status bukan settlement, tidak mengubah user.');
    }

    res.status(200).json({ message: 'Webhook processed' });
  } catch (err) {
    console.error('❗ Webhook error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


