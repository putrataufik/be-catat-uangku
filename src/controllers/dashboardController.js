// src/controllers/dashboardController.js
const Note = require("../models/noteModel");
const Wallet = require("../models/walletModel");
const PlannedPayment = require("../models/plannedPaymentModel");

exports.getTrendSaldo = async (req, res) => {
  try {
    // Periode default 30 hari
    const period = parseInt(req.query.period) || 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - period + 1);

    // Ambil semua wallet user
    const wallets = await Wallet.find({ userId: req.user.userId })
      .select("_id balance")
      .lean();
    // Total saldo saat ini (endDate)
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

    const walletIds = wallets.map((w) => w._id);

    // Agregasi catatan per hari (net income-expense)
    const raw = await Note.aggregate([
      { $match: { walletId: { $in: walletIds }, date: { $gte: fromDate } } },
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
    // Tentukan saldo awal pada fromDate
    let cumulative = totalBalance - netPeriod;

    // Bangun trend dengan saldo kumulatif
    const trend = raw.map((item) => {
      cumulative += item.totalIncome - item.totalExpense;
      return { date: item._id, balance: cumulative };
    });

    // Format wallet balances
    const walletBalances = wallets.map((w) => ({
      id: w._id,
      balance: w.balance,
    }));

    return res.json({
      success: true,
      data: {
        trend,
        wallets: walletBalances,
        totalBalance,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil trend saldo",
      error: err.message,
    });
  }
};

exports.getArusKas = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const wallets = await Wallet.find({ userId: req.user.userId })
      .select("_id")
      .lean();
    const walletIds = wallets.map((w) => w._id);

    const result = await Note.aggregate([
      {
        $match: {
          walletId: { $in: walletIds },
          date: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          income: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    const data = result[0] || { income: 0, expense: 0 };
    const netCashflow = data.income - data.expense;

    return res.json({
      success: true,
      data: {
        income: data.income,
        expense: data.expense,
        netCashflow,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data arus kas",
      error: err.message,
    });
  }
};

exports.getTopExpenses = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const wallets = await Wallet.find({ userId: req.user.userId })
      .select("_id")
      .lean();
    const walletIds = wallets.map((w) => w._id);

    const result = await Note.aggregate([
      {
        $match: {
          walletId: { $in: walletIds },
          date: { $gte: startOfMonth },
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 5, // Ambil top 5 pengeluaran kategori
      },
    ]);

    const data = result.map((item) => ({
      category: item._id,
      total: item.total,
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data pengeluaran teratas",
      error: err.message,
    });
  }
};

exports.getPlannedPayments = async (req, res) => {
  try {
    const now = new Date();

    const payments = await PlannedPayment.find({
      user_id: req.user.userId,
      status: { $in: ["planned", "overdue"] },
    })
      .sort({ payment_date: 1 })
      .limit(5)
      .populate("wallet_id", "name");

    const formatted = payments.map((payment) => {
      const timeDiff = new Date(payment.payment_date) - Date.now();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      return {
        id: payment._id,
        title: payment.title,
        description: payment.description || "",
        wallet: payment.wallet_id?.name || "-",
        category: payment.category,
        amount: payment.amount,
        type: payment.type,
        payment_date: payment.payment_date,
        status: payment.status,
        hours_remaining: daysRemaining,
      };
    });

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil rencana pembayaran",
      error: err.message,
    });
  }
};

