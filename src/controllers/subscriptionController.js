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


exports.handleNotification = async (req, res) => {
  try {
    const notification = req.body;
    const apiClient = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const statusResponse = await apiClient.transaction.notification(notification);

    const { order_id, transaction_status } = statusResponse;
    const transaction = await SubscriptionTransaction.findOne({ orderId: order_id });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    if (transaction_status === 'settlement') {
      await User.findByIdAndUpdate(transaction.userId, {
        isPremium: true,
        premium: {
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          lastPaymentOrderId: order_id,
          paymentMethod: notification.payment_type
        }
      });
    }

    res.status(200).json({ message: 'Notifikasi diproses' });
  } catch (err) {
    console.error('Gagal memproses notifikasi:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
