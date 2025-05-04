const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  walletIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
  }],  
  name: String,
  amount: Number,
  usedAmount: {
    type: Number,
    default: 0,
  },
  categories: [String], // ⬅️ ubah dari category: String
  period: String, // "monthly", "weekly", etc.
  startDate: Date,
  endDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Budget', budgetSchema);
