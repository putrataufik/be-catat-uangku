const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token

  if (!token) return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // menyimpan payload di request
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token tidak valid' });
  }
};

module.exports = authMiddleware;
