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
      settlement_time,
      user_id: userId,
      customer_details
    } = notification;

    // Compute subscription and expiry dates
    const subscriptionDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const expiryDateObj = settlement_time ? new Date(settlement_time) : new Date();
    expiryDateObj.setMonth(expiryDateObj.getMonth() + 1);
    const expiryDate = expiryDateObj.toISOString().split('T')[0];

    // Find existing subscription transaction by orderId
    let transaction = await SubscriptionTransaction.findOne({ orderId });
    if (!transaction) {
      console.log(`⚠️ No transaction found for orderId ${orderId}.`);
      if (!userId) {
        console.warn(`⛔ Cannot create transaction without userId. Skipping creation.`);
        return res.status(200).json({ message: 'Transaction not found; creation skipped due to missing userId' });
      }
      console.log(`🔄 Creating new transaction record for orderId ${orderId}.`);
      transaction = new SubscriptionTransaction({
        orderId,
        userId,
        amount: parseFloat(gross_amount),
        snapToken: transactionId,
        transactionId,
        paymentType,
        isActive: status === 'settlement',
        status: status === 'settlement' ? 'active' : 'pending',
        subscriptionDate: status === 'settlement' ? subscriptionDate : null,
        expiryDate: status === 'settlement' ? expiryDate : null,
        customerName: customer_details?.first_name || 'Unknown',
        customerEmail: customer_details?.email || 'Unknown',
        rawResponse: notification
      });
      await transaction.save();
      console.log('✅ New subscription transaction created:', transaction._id);
    } else {
      console.log(`📄 Transaction ${transaction._id} found; updating.`);
      transaction.transactionId   = transactionId;
      transaction.paymentType     = paymentType;
      transaction.amount          = parseFloat(gross_amount);
      transaction.snapToken       = transactionId;
      transaction.isActive        = status === 'settlement';
      transaction.status          = status === 'settlement' ? 'active' : 'pending';
      transaction.subscriptionDate = status === 'settlement' ? subscriptionDate : null;
      transaction.expiryDate      = status === 'settlement' ? expiryDate : null;
      transaction.rawResponse     = notification;
      await transaction.save();
      console.log(`✅ SubscriptionTransaction updated for orderId ${orderId}.`);
    }

    return res.status(200).json({ message: 'Notification handled successfully' });
  } catch (error) {
    console.error('❗ Error handling notification:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};




