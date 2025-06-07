const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [4, 'Username harus lebih dari 3 karakter']
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(v);
      },
      message: props =>
        'Password minimal 8 karakter dan harus mengandung setidaknya 1 huruf kapital, 1 angka, dan 1 simbol'
    }
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premium: {
    startDate: Date, // Tanggal mulai langganan
    endDate: Date,   // Tanggal akhir langganan (bisa dibandingkan dengan Date.now())
    lastPaymentOrderId: String, // Order ID dari pembayaran terakhir
    paymentMethod: {
      type: String,
      enum: ['gopay', 'qris', 'bank_transfer', 'other'],
      default: 'gopay'
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
