const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const User = require("../models/userModel");

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token

  if (!token) return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    req.user = decoded; // menyimpan payload di request
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token tidak valid' });
  }
};

module.exports = authMiddleware;
