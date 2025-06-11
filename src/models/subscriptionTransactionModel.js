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
    unique: true
  },
  grossAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'cancel', 'deny', 'expire', 'refund', 'partial_refund', 'capture'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  paymentToken: {
    type: String,
    required: true
  },
  paymentUrl: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: false
  },
  customerEmail: {
    type: String,
    required: false
  },
  rawRequest: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  paidAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SubscriptionTransaction', subscriptionTransactionSchema);
