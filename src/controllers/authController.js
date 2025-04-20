const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

exports.register = async (req, res) => {
  try {
    console.log('🛠️ register controller running...');
    const { name, email, password } = req.body;

    // Validasi nama
    if (name.length < 4) {
      return res.status(400).json({ message: 'Nama harus lebih dari 3 karakter' });
    }

    // Validasi password
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password minimal 8 karakter dan harus mengandung setidaknya 1 huruf kapital, 1 angka, dan 1 simbol'
      });
    }

    // Cek jika user sudah ada
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email sudah digunakan' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Registrasi berhasil' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // cari user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email tidak ditemukan' });

    // cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Password salah' });

    // generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, isPremium: user.isPremium } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
