// src/controllers/dashboardController.js
const Note   = require('../models/noteModel');
const Wallet = require('../models/walletModel');

exports.getTrendSaldo = async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - period + 1);

    // Ambil semua wallet milik user
    const wallets = await Wallet
      .find({ userId: req.user.userId })
      .select('_id name balance')
      .lean();
    const walletIds = wallets.map(w => w._id);

    // Agregasi Note per hari
    const raw = await Note.aggregate([
      { $match: { walletId: { $in: walletIds }, date: { $gte: fromDate } } },
      { $project: {
          day:    { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          amount: 1,
          type:   1
      }},
      { $group: {
          _id:           "$day",
          totalIncome:   { $sum: { $cond: [ { $eq: ["$type", "income"] }, "$amount", 0 ] } },
          totalExpense:  { $sum: { $cond: [ { $eq: ["$type", "expense"] }, "$amount", 0 ] } }
      }},
      { $sort: { "_id": 1 } }
    ]);

    // Hitung saldo kumulatif
    let cumulative = 0;
    const trend = raw.map(item => {
      cumulative += (item.totalIncome - item.totalExpense);
      return { date: item._id, balance: cumulative };
    });

    // Format wallets dan total balance
    const walletBalances = wallets.map(w => ({
      id:      w._id,
      name:    w.name,
      balance: w.balance
    }));
    const totalBalance = walletBalances.reduce((sum, w) => sum + w.balance, 0);

    // Kirim response lengkap
    return res.json({
      success: true,
      data: {
        trend,
        wallets: walletBalances,
        totalBalance    // ← ini yang baru ditambahkan
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil trend saldo',
      error: err.message
    });
  }
};
