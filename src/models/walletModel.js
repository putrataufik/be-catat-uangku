const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  balance: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Membuat compound index untuk memastikan kombinasi userId dan name unik
walletSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Wallet', walletSchema);