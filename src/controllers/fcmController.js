const DeviceToken = require('../models/deviceTokenModel');

exports.saveDeviceToken = async (req, res) => {
  const userId = req.user.userId;
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const result = await DeviceToken.findOneAndUpdate(
      { userId },
      { token, isActive: true, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: 'Token saved successfully', data: result });
  } catch (error) {
    console.error('[FCM] Error:', error);
    res.status(500).json({ message: 'Failed to save token' });
  }
};
