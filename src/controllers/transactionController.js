const Transaction = require("../models/transactionModel");
const Wallet = require("../models/walletModel");
const { updateBudgetUsage } = require("../utils/updateBudgetUsage");
const { validateTransactionInput } = require("../utils/transactionValidator");
const { rollbackTransaction, applyTransaction } = require("../utils/transactionProcessor");
const { buildTransactionSummary } = require("../services/transactionSummaryService");

exports.createTransaction = async (req, res) => {
  try {
    const { walletId, type, amount, category, date, note } = req.body;
    const error = validateTransactionInput({ type, amount, category, date });
    if (error) return res.status(400).json({ message: error });

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet tidak ditemukan" });

    const transaction = new Transaction({ walletId, type, amount, category, date, note });
    await transaction.save();

    applyTransaction(wallet, transaction);
    await wallet.save();

    await updateBudgetUsage(req.user.userId, walletId, category);

    res.status(201).json({
      message: "Transaksi berhasil dicatat",
      transaction,
      currentBalance: wallet.balance,
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal mencatat transaksi", error: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ message: "Transaksi tidak ditemukan" });

    const wallet = await Wallet.findById(transaction.walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet tidak ditemukan" });

    rollbackTransaction(wallet, transaction);
    await wallet.save();
    await updateBudgetUsage(req.user.userId, transaction.walletId, transaction.category);
    await transaction.deleteOne();

    res.json({ message: "Transaksi berhasil dihapus", currentBalance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus transaksi", error: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, date, note } = req.body;
    const oldTransaction = await Transaction.findById(id);
    if (!oldTransaction) return res.status(404).json({ message: "Transaksi tidak ditemukan" });

    const wallet = await Wallet.findById(oldTransaction.walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet tidak ditemukan" });

    rollbackTransaction(wallet, oldTransaction);

    oldTransaction.type = type || oldTransaction.type;
    oldTransaction.amount = amount || oldTransaction.amount;
    oldTransaction.category = category || oldTransaction.category;
    oldTransaction.date = date || oldTransaction.date;
    oldTransaction.note = note || oldTransaction.note;
    await oldTransaction.save();

    applyTransaction(wallet, oldTransaction);
    await wallet.save();
    await updateBudgetUsage(req.user.userId, wallet._id, oldTransaction.category);

    res.json({
      message: "Transaksi berhasil diperbarui",
      transaction: oldTransaction,
      currentBalance: wallet.balance,
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal mengupdate transaksi", error: err.message });
  }
};

exports.getTransactionsByWallet = async (req, res) => {
  try {
    const { walletId } = req.params;
    const transactions = await Transaction.find({ walletId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil transaksi", error: err.message });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.user.userId }).select('_id');
    const walletIds = wallets.map(w => w._id);
    const filter = { walletId: { $in: walletIds } };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil semua transaksi", error: err.message });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil transaksi", error: err.message });
  }
};

exports.getTransactionSummary = async (req, res) => {
  try {
    const summary = await buildTransactionSummary(req.user.userId, req.query);
    res.json({
      summary,
      filters: { ...req.query, groupBy: req.query.groupBy || 'total' }
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal mendapatkan summary", error: err.message });
  }
};