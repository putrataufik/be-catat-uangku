const Transaction = require("../models/transactionModel");
const updateBudgetUsage = require("../utils/updateBudgetUsage");
const Wallet = require("../models/walletModel");
const mongoose = require('mongoose');


exports.createTransaction = async (req, res) => {
  try {
    const { walletId, type, amount, category, date, note } = req.body;

    // cek wallet
    const wallet = await Wallet.findById(walletId);
    if (!wallet)
      return res.status(404).json({ message: "Wallet tidak ditemukan" });

    // Buat transaksi
    const transaction = new Transaction({
      walletId,
      type,
      amount,
      category,
      date,
      note,
    });

    await transaction.save();

    // Update saldo wallet
    if (type === "income") {
      wallet.balance += amount;
    } else if (type === "expense") {
      wallet.balance -= amount;
    }

    await wallet.save();
    await updateBudgetUsage(req.user.userId, walletId, category);

    res.status(201).json({
      message: "Transaksi berhasil dicatat",
      transaction,
      currentBalance: wallet.balance,
    });
  } catch (err) {
    console.error("❌ Error saat membuat transaksi:", err);
    res
      .status(500)
      .json({ message: "Gagal mencatat transaksi", error: err.message });
  }
};

exports.getTransactionsByWallet = async (req, res) => {
  try {
    const { walletId } = req.params;

    const transactions = await Transaction.find({ walletId }).sort({
      date: -1,
    });

    res.json(transactions);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengambil transaksi", error: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Cari transaksi berdasarkan id
    const transaction = await Transaction.findById(id);
    if (!transaction)
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });

    // Cari wallet yang berhubungan dengan transaksi tersebut
    const wallet = await Wallet.findById(transaction.walletId);
    if (!wallet)
      return res.status(404).json({ message: "Wallet tidak ditemukan" });

    // Update saldo sesuai jenis transaksi
    if (transaction.type === "income") {
      wallet.balance -= transaction.amount;
    } else if (transaction.type === "expense") {
      wallet.balance += transaction.amount;
    }

    await wallet.save(); // simpan perubahan wallet
    await updateBudgetUsage(
      req.user.userId,
      transaction.walletId,
      transaction.category
    );
    await transaction.deleteOne(); // hapus transaksi

    res.json({
      message: "Transaksi berhasil dihapus",
      currentBalance: wallet.balance,
    });
  } catch (err) {
    console.error("❌ Gagal menghapus transaksi:", err);
    res
      .status(500)
      .json({ message: "Gagal menghapus transaksi", error: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, date, note } = req.body;

    // Cari transaksi lama
    const oldTransaction = await Transaction.findById(id);
    if (!oldTransaction)
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });

    const wallet = await Wallet.findById(oldTransaction.walletId);
    if (!wallet)
      return res.status(404).json({ message: "Wallet tidak ditemukan" });

    // Step 1: Rollback efek transaksi lama
    if (oldTransaction.type === "income") {
      wallet.balance -= oldTransaction.amount;
    } else if (oldTransaction.type === "expense") {
      wallet.balance += oldTransaction.amount;
    }

    // Step 2: Update transaksi dengan data baru
    oldTransaction.type = type || oldTransaction.type;
    oldTransaction.amount = amount || oldTransaction.amount;
    oldTransaction.category = category || oldTransaction.category;
    oldTransaction.date = date || oldTransaction.date;
    oldTransaction.note = note || oldTransaction.note;

    await oldTransaction.save();

    // Step 3: Terapkan efek transaksi baru
    if (oldTransaction.type === "income") {
      wallet.balance += oldTransaction.amount;
    } else if (oldTransaction.type === "expense") {
      wallet.balance -= oldTransaction.amount;
    }

    await wallet.save();
    await updateBudgetUsage(
      req.user.userId,
      oldTransaction.walletId,
      oldTransaction.category
    );

    res.json({
      message: "Transaksi berhasil diperbarui",
      transaction: oldTransaction,
      currentBalance: wallet.balance,
    });
  } catch (err) {
    console.error("❌ Gagal mengupdate transaksi:", err);
    res
      .status(500)
      .json({ message: "Gagal mengupdate transaksi", error: err.message });
  }
};

// Ambil semua transaksi milik user
exports.getAllTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const wallets = await Wallet.find({ userId }).select('_id');
    const walletIds = wallets.map(wallet => wallet._id);

    const filter = { walletId: { $in: walletIds } };

    if (req.query.type) {
      filter.type = req.query.type; // filter berdasarkan type income/expense
    }
    if (req.query.category) {
      filter.category = req.query.category; // filter berdasarkan kategori
    }
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });

    res.json(transactions);
  } catch (err) {
    console.error("❌ Gagal mengambil semua transaksi:", err);
    res.status(500).json({ message: "Gagal mengambil semua transaksi", error: err.message });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    res.json(transaction);
  } catch (err) {
    console.error("❌ Gagal mengambil detail transaksi:", err);
    res.status(500).json({ message: "Gagal mengambil transaksi", error: err.message });
  }
};

exports.getTransactionSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, category, startDate, endDate, groupBy } = req.query;

    const aggregatePipeline = [
      {
        $lookup: {
          from: 'wallets',
          localField: 'walletId',
          foreignField: '_id',
          as: 'wallet'
        }
      },
      { $unwind: '$wallet' }
    ];

    const matchConditions = {
      'wallet.userId': new mongoose.Types.ObjectId(userId),
    };

    if (type) matchConditions.type = type;
    if (category) matchConditions.category = category;
    if (startDate || endDate) {
      matchConditions.date = {};
      if (startDate) matchConditions.date.$gte = new Date(startDate);
      if (endDate) matchConditions.date.$lte = new Date(endDate);
    }

    aggregatePipeline.push({ $match: matchConditions });

    // Dynamic grouping
    if (groupBy === 'category') {
      aggregatePipeline.push({
        $group: {
          _id: '$category',
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
            }
          },
          count: { $sum: 1 }
        }
      });
      aggregatePipeline.push({ $sort: { _id: 1 } });

    } else if (groupBy === 'month') {
      aggregatePipeline.push({
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
            }
          },
          count: { $sum: 1 }
        }
      });
      aggregatePipeline.push({ $sort: { _id: 1 } });

    } else if (!groupBy || groupBy === 'total') {
      aggregatePipeline.push({
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
            }
          },
          count: { $sum: 1 }
        }
      });

    } else {
      return res.status(400).json({
        message: "Parameter 'groupBy' hanya boleh: category, month, atau total (default)"
      });
    }

    const result = await Transaction.aggregate(aggregatePipeline);

    // Tambahkan netTotal secara manual di JS
    const summaryWithNet = result.map(item => ({
      ...item,
      netTotal: item.totalIncome - item.totalExpense
    }));

    res.json({
      summary: summaryWithNet,
      filters: { type, category, startDate, endDate, groupBy: groupBy || 'total' }
    });

  } catch (err) {
    console.error("❌ Gagal mendapatkan summary transaksi:", err);
    res.status(500).json({ message: "Gagal mendapatkan summary", error: err.message });
  }
};