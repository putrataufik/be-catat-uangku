const snap = require('../configs/midtrans');
const User = require('../models/userModel');
const SubscriptionTransaction = require('../models/subscriptionTransactionModel'); // pastikan ada

exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.userId; // didapat dari token middleware
    const { amount } = req.body;

    console.log("UserID dari token:", userId);
    console.log("Amount dari body:", amount);

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const orderId = `SUBS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
          id: 'premium-subscription',
          price: amount,
          quantity: 1,
          name: 'Langganan Premium Catat Uangku',
        }
      ],
    };

    const transaction = await snap.createTransaction(parameter);

    // Simpan ke database MongoDB
    await SubscriptionTransaction.create({
      userId,
      orderId,
      snapToken: transaction.token,
      amount,
      rawResponse: transaction,
    });

    return res.status(201).json({
      message: 'Transaksi berhasil dibuat',
      snapToken: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId,
    });

  } catch (err) {
    console.error('Gagal membuat langganan:', err);
    return res.status(500).json({
      message: 'Gagal membuat langganan',
      error: err.ApiResponse ? JSON.stringify(err.ApiResponse) : err.message,
    });
  }
};


exports.handleMidtransWebhook = async (req, res) => {
    console.log('Webhook HIT ✅');
  console.log('Payload:', req.body);
  try {
    const payload = req.body;
    const orderId = payload.order_id;
    const status = payload.transaction_status;
    const paymentType = payload.payment_type;
    const paidAt = payload.settlement_time ? new Date(payload.settlement_time) : null;

    const transaction = await SubscriptionTransaction.findOne({ orderId });
    if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

    // Update data transaksi
    transaction.transactionStatus = status;
    transaction.paymentType = paymentType;
    transaction.paidAt = paidAt;
    transaction.rawResponse = payload;
    await transaction.save();

    // Update status langganan user jika sukses
    if (status === 'settlement') {
      const user = await User.findById(transaction.userId);
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1); // langganan 1 bulan

      user.isPremium = true;
      user.premium = {
        startDate: now,
        endDate: end,
        lastPaymentOrderId: orderId,
        paymentMethod: paymentType
      };

      await user.save();
    }

    res.status(200).json({ message: 'Webhook processed' });

  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
