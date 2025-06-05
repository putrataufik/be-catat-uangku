const User = require("../models/userModel");
const {
  validateName,
  validatePassword,
} = require("../utils/authenticationUtils/validators");
const {
  hashPassword,
  comparePassword,
} = require("../utils/authenticationUtils/password");
const { generateToken } = require("../utils/authenticationUtils/jwt");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!validateName(name)) {
      return res
        .status(400)
        .json({ message: "Nama harus lebih dari 3 karakter" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password minimal 8 karakter dan harus mengandung setidaknya 1 huruf kapital, 1 angka, dan 1 simbol",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email sudah digunakan" });

    const hashedPassword = await hashPassword(password);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    // Generate token setelah registrasi berhasil
    const token = generateToken({ userId: user._id });

    // Langsung kirim response seperti saat login
    res.status(201).json({
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Email tidak ditemukan" });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Password salah" });

    const token = generateToken({ userId: user._id });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
