// src/models/plannedPaymentModel.js
const mongoose = require('mongoose');

const plannedPaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
  },
  name: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  repeatInterval: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  recipient: { type: String },
  note: { type: String },
  todayReminder: { type: Boolean, default: false },
  h3Reminder: { type: Boolean, default: false },
  nextDueDate: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('PlannedPayment', plannedPaymentSchema);
