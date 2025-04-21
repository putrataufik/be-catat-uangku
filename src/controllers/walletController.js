const Wallet = require("../models/walletModel");

exports.getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.user.userId }); // dari middleware JWT
    res.json(wallets);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengambil dompet", error: err.message });
  }
};

exports.createWallet = async (req, res) => {
  try {
    const { name, balance } = req.body;

    const wallet = new Wallet({
      userId: req.user.userId,
      name,
      balance,
    });

    await wallet.save();

    res.status(201).json(wallet);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Nama wallet sudah digunakan" });
    }

    res
      .status(500)
      .json({ message: "Gagal membuat dompet", error: err.message });
  }
};

exports.updateWallet = async (req, res) => {
  try {
    const { id } = req.params; // walletId
    const userId = req.user.userId;
    const { name, balance } = req.body;

    const wallet = await Wallet.findOne({ _id: id, userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet tidak ditemukan" });
    }

    if (name) wallet.name = name;
    if (balance !== undefined) wallet.balance = balance;

    await wallet.save();

    res.json({ message: "Wallet berhasil diperbarui", wallet });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal memperbarui wallet", error: err.message });
  }
};

exports.deleteWallet = async (req, res) => {
  try {
    const { id } = req.params; // walletId
    const userId = req.user.userId;

    const wallet = await Wallet.findOneAndDelete({ _id: id, userId });

    if (!wallet) {
      return res
        .status(404)
        .json({ message: "Wallet tidak ditemukan atau bukan milik kamu" });
    }

    res.json({ message: "Wallet berhasil dihapus" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal menghapus wallet", error: err.message });
  }
};
