const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

deviceTokenSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
