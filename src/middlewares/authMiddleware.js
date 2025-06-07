const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // GANTI DARI decoded.id KE decoded.userId
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(403).json({ message: 'Token tidak valid' });
  }
};

module.exports = authMiddleware;
