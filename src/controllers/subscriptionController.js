require("dotenv").config();
const snap = require("../configs/midtrans");
const User = require("../models/userModel");
const SubscriptionTransaction = require("../models/subscriptionTransactionModel");

exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { gross_amount } = req.body;

    // Validate input
    if (!gross_amount || typeof gross_amount !== "number" || gross_amount <= 0) {
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
    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: gross_amount,
      },
      customer_details: {
        first_name: user.name,
        email: user.email,
      },
      item_details: [
        {
          id: "premium-subscription",
          price: gross_amount,
          quantity: 1,
          name: "Premium Subscription",
        },
      ],
    };

    // Create transaction via Midtrans Snap
    const transaction = await snap.createTransaction(transactionDetails);

    // Prepare subscription data
    const subscriptionData = {
      orderId: transactionDetails.transaction_details.order_id,
      grossAmount: transactionDetails.transaction_details.gross_amount,
      status: "pending",            // Status awal sebelum settlement
      isActive: false,              // Belum aktif sebelum settlement
      paymentToken: transaction.token,      // Token transaksi Midtrans
      paymentUrl: transaction.redirect_url, // URL pembayaran
      customerName: transactionDetails.customer_details.first_name,
      customerEmail: transactionDetails.customer_details.email,
      userId: userId,               // ID dari authenticated user
      createdAt: new Date().toISOString(),
      // juga simpan rawRequest kalau diperlukan
      rawRequest: transactionDetails
    };

    // Persist ke MongoDB
    await SubscriptionTransaction.create(subscriptionData);

    return res.status(201).json({
      message: "Subscription transaction created.",
      paymentToken: subscriptionData.paymentToken,
      paymentUrl: subscriptionData.paymentUrl,
      orderId: subscriptionData.orderId,
    });
  } catch (error) {
    console.error("Error in createSubscription:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.handleMidtransWebhook = async (req, res) => {
  try {
    const notification = req.body;
    console.log('📩 Notification received:', notification);

    const {
      order_id: orderId,
      transaction_id: transactionId,
      transaction_status: status,
      payment_type: paymentType,
      gross_amount,
      settlement_time
    } = notification;

    // Find existing subscription transaction by orderId
    let transaction = await SubscriptionTransaction.findOne({ orderId });
    if (!transaction) {
      console.warn(`⚠️ Transaction ${orderId} not found; skipping.`);
      return res.status(200).json({ message: 'Transaction not found; no action' });
    }

    // Update subscription transaction fields
    transaction.snapToken   = transactionId;
    transaction.amount      = parseFloat(gross_amount);
    transaction.transactionStatus = status;
    transaction.paymentType = paymentType || transaction.paymentType;
    transaction.paidAt      = settlement_time ? new Date(settlement_time) : transaction.paidAt;
    transaction.rawRequest  = notification;

    // Set active, dates
    if (status === 'settlement') {
      const now = new Date();
      const expiry = new Date(now);
      expiry.setMonth(expiry.getMonth() + 1);
      transaction.isActive        = true;
      transaction.subscriptionDate = now;
      transaction.expiryDate       = expiry;
    }

    await transaction.save();
    console.log(`✅ SubscriptionTransaction updated for orderId ${orderId}.`);

    // Update user profile to premium if settled
    if (status === 'settlement' && transaction.userId) {
      const user = await User.findById(transaction.userId);
      if (user) {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        user.isPremium = true;
        user.premium = {
          startDate,
          endDate,
          lastPaymentOrderId: orderId,
          paymentMethod: paymentType
        };
        await user.save();
        console.log(`🏆 User ${user._id} upgraded to premium.`);
      } else {
        console.warn(`❌ User ${transaction.userId} not found; cannot update profile.`);
      }
    }

    return res.status(200).json({ message: 'Notification handled successfully' });
  } catch (error) {
    console.error('❗ Error handling notification:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};



