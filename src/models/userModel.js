const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [4, 'Username harus lebih dari 3 karakter'] // minimal 4 karakter (lebih dari 3)
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
        `Password minimal 8 karakter dan harus mengandung setidaknya 1 huruf kapital, 1 angka, dan 1 simbol`
    }
  },
  isPremium: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
