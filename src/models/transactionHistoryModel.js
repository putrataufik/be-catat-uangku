// models/transactionHistoryModel.js
const mongoose = require('mongoose');

const transactionHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  type: { type: String, enum: ['income', 'expense'], required: true },
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  amount: Number,
  category: String,
  note: String,
  date: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TransactionHistory', transactionHistorySchema);
