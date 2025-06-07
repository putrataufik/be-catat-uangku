const mongoose = require('mongoose');

const subscriptionTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true // Setiap transaksi harus punya order ID yang unik
  },
  snapToken: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentType: {
    type: String, // e.g., "gopay", "qris", "bank_transfer"
    required: false
  },
  transactionStatus: {
    type: String,
    enum: [
      'pending',
      'settlement',
      'cancel',
      'deny',
      'expire',
      'refund',
      'partial_refund',
      'capture'
    ],
    default: 'pending'
  },
  paidAt: Date, // Diisi saat transaksi berhasil (settlement)
  rawResponse: {
    type: mongoose.Schema.Types.Mixed, // Menyimpan full response dari Midtrans (opsional, untuk debugging/log)
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SubscriptionTransaction', subscriptionTransactionSchema);
