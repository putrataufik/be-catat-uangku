// src/controllers/dashboardController.js
const Note   = require('../models/noteModel');
const Wallet = require('../models/walletModel');


exports.getTrendSaldo = async (req, res) => {
  try {
    // Periode default 30 hari
    const period = parseInt(req.query.period) || 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - period + 1);

    // Ambil semua wallet user
    const wallets = await Wallet
      .find({ userId: req.user.userId })
      .select('_id balance')
      .lean();
    // Total saldo saat ini (endDate)
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

    const walletIds = wallets.map(w => w._id);

    // Agregasi catatan per hari (net income-expense)
    const raw = await Note.aggregate([
      { $match: { walletId: { $in: walletIds }, date: { $gte: fromDate } } },
      { $project: {
          day:    { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          amount: 1,
          type:   1
      }},
      { $group: {
          _id:           "$day",
          totalIncome:  { $sum: { $cond: [ { $eq: ["$type", "income"] }, "$amount", 0 ] } },
          totalExpense: { $sum: { $cond: [ { $eq: ["$type", "expense"] }, "$amount", 0 ] } }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Hitung net perubahan selama periode
    const netPeriod = raw.reduce(
      (sum, item) => sum + (item.totalIncome - item.totalExpense),
      0
    );
    // Tentukan saldo awal pada fromDate
    let cumulative = totalBalance - netPeriod;

    // Bangun trend dengan saldo kumulatif
    const trend = raw.map(item => {
      cumulative += (item.totalIncome - item.totalExpense);
      return { date: item._id, balance: cumulative };
    });

    // Format wallet balances
    const walletBalances = wallets.map(w => ({
      id:      w._id,
      balance: w.balance
    }));

    return res.json({
      success: true,
      data: {
        trend,
        wallets: walletBalances,
        totalBalance
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
