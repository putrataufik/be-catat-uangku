// src/controllers/userController.js

const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

// GET: Ambil data user
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data user', error: err.message });
  }
};

// src/controllers/userController.js

exports.updateUserName = async (req, res) => {
    try {
      const { name } = req.body;
  
      if (!name) return res.status(400).json({ message: 'Nama tidak boleh kosong' });
  
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  
      user.name = name;
      await user.save();
  
      res.json({ message: 'Nama berhasil diperbarui', name: user.name });
    } catch (err) {
      res.status(500).json({ message: 'Gagal memperbarui nama', error: err.message });
    }
  };
  
