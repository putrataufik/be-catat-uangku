const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  days_before: {
    type: Number,
    required: true,
  },
  sent: {
    type: Boolean,
    default: false,
  }
}, { _id: false });

const PlannedPaymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  wallet_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  amount: {
    type: Number,
    required: true,
  },
  is_variable_amount: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  payment_date: {
    type: Date,
    required: true,
  },
  is_recurring: {
    type: Boolean,
    default: false,
  },
  recurring_type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    default: 'monthly',
  },
  recurring_interval: {
    type: Number,
    default: 1,
  },
  end_date: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['planned', 'paid', 'overdue', 'skipped'],
    default: 'planned',
  },
  reminders: {
    type: [ReminderSchema],
    default: [],
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('PlannedPayment', PlannedPaymentSchema);
