
const mongoose = require('mongoose');

const noteHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' },
  type: { type: String, enum: ['income', 'expense'], required: true },
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  amount: Number,
  category: String,
  note: String,
  date: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NoteHistory', noteHistorySchema);
