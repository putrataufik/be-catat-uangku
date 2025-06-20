const Note = require('../models/noteModel');
const Wallet = require('../models/walletModel');
const mongoose = require('mongoose');

exports.getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.user.userId });
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil dompet", error: err.message });
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

    res.status(500).json({ message: "Gagal membuat dompet", error: err.message });
  }
};

exports.updateWallet = async (req, res) => {
  try {
    const { id } = req.params;
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
    res.status(500).json({ message: "Gagal memperbarui wallet", error: err.message });
  }
};

exports.deleteWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const wallet = await Wallet.findOneAndDelete({ _id: id, userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet tidak ditemukan atau bukan milik kamu" });
    }

    await Note.deleteMany({ walletId: wallet._id }); // hapus semua catatan terkait

    res.json({ message: "Wallet berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus wallet", error: err.message });
  }
};

exports.getWalletSummary = async (req, res) => {
  try {
    const { walletId } = req.params;
    const userId = req.user.userId;
    const { startDate, endDate, category, type } = req.query;

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

    const notes = await Note.find(filter);

    const totalIncome = notes
      .filter(n => n.type === 'income')
      .reduce((sum, n) => sum + n.amount, 0);

    const totalExpense = notes
      .filter(n => n.type === 'expense')
      .reduce((sum, n) => sum + n.amount, 0);

    res.json({
      walletId,
      walletName: wallet.name,
      totalIncome,
      totalExpense,
      netTotal: totalIncome - totalExpense,
      count: notes.length,
      filters: { startDate, endDate, type, category }
    });
  } catch (err) {
    console.error('❌ Gagal mendapatkan summary wallet:', err);
    res.status(500).json({ message: 'Gagal mendapatkan summary wallet', error: err.message });
  }
};

exports.getTrendSaldoByWallet = async (req, res) => {
  try {
    const walletId = req.params.walletId;
    const period = parseInt(req.query.period) || 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - period + 1);

    // Verifikasi bahwa wallet milik user
    const wallet = await Wallet.findOne({ _id: walletId, userId: req.user.userId }).lean();
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet tidak ditemukan atau bukan milik Anda",
      });
    }

    const currentBalance = wallet.balance;

    // Ambil catatan transaksi berdasarkan wallet dan periode
    const raw = await Note.aggregate([
      { $match: { walletId: wallet._id, date: { $gte: fromDate } } },
      {
        $project: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          amount: 1,
          type: 1,
        },
      },
      {
        $group: {
          _id: "$day",
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Hitung net perubahan selama periode
    const netPeriod = raw.reduce(
      (sum, item) => sum + (item.totalIncome - item.totalExpense),
      0
    );

    // Saldo awal = saldo sekarang - net perubahan
    let cumulative = currentBalance - netPeriod;

    const trend = raw.map((item) => {
      cumulative += item.totalIncome - item.totalExpense;
      return { date: item._id, balance: cumulative };
    });

    return res.json({
      success: true,
      data: {
        walletId: wallet._id,
        walletName: wallet.name,
        trend,
        currentBalance,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil trend saldo wallet",
      error: err.message,
    });
  }
};

exports.getWalletById = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet tidak ditemukan' });
    }

    res.json(wallet);
  } catch (err) {
    res.status(500).json({
      message: 'Gagal mengambil wallet',
      error: err.message,
    });
  }
};
