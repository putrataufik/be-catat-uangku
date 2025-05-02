const Transaction = require('../models/transactionModel');
const Wallet = require('../models/walletModel');
const mongoose = require('mongoose');

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
    await Transaction.deleteMany({ walletId: wallet._id });


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

exports.getWalletSummary = async (req, res) => {
  try {
    const { walletId } = req.params;
    const userId = req.user.userId;
    const { startDate, endDate, category, type } = req.query;

    // Pastikan wallet milik user
    const wallet = await Wallet.findOne({ _id: walletId, userId });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet tidak ditemukan atau bukan milik Anda' });
    }

    const filter = { walletId: new mongoose.Types.ObjectId(walletId) };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter);

    const totalIncome = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpense = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      walletId,
      walletName: wallet.name,
      totalIncome,
      totalExpense,
      netTotal: totalIncome - totalExpense,
      count: transactions.length,
      filters: { startDate, endDate, type, category }
    });
  } catch (err) {
    console.error('❌ Gagal mendapatkan summary wallet:', err);
    res.status(500).json({ message: 'Gagal mendapatkan summary wallet', error: err.message });
  }
};
