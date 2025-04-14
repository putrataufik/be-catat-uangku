// src/controllers/transactionController.js
const Transaction = require('../models/transactionModel');
const Wallet = require('../models/walletModel');

exports.createTransaction = async (req, res) => {
  try {
    const { walletId, type, amount, category, date, note } = req.body;

    // Pastikan wallet ada
    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: 'Wallet tidak ditemukan' });

    // Buat transaksi
    const transaction = new Transaction({
      walletId,
      type,
      amount,
      category,
      date,
      note
    });

    await transaction.save();

    // Update saldo wallet
    if (type === 'income') {
      wallet.balance += amount;
    } else if (type === 'expense') {
      wallet.balance -= amount;
    }

    await wallet.save();

    res.status(201).json(transaction);
  } catch (err) {
    console.error('❌ Error saat membuat transaksi:', err);
    res.status(500).json({ message: 'Gagal mencatat transaksi', error: err.message });
  }
};

exports.getTransactionsByWallet = async (req, res) => {
  try {
    const { walletId } = req.params;

    const transactions = await Transaction.find({ walletId }).sort({ date: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil transaksi', error: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Cari transaksi
      const transaction = await Transaction.findById(id);
      if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
  
      // Cari wallet terkait
      const wallet = await Wallet.findById(transaction.walletId);
      if (!wallet) return res.status(404).json({ message: 'Wallet tidak ditemukan' });
  
      // Update saldo sesuai jenis transaksi
      if (transaction.type === 'income') {
        wallet.balance -= transaction.amount;
      } else if (transaction.type === 'expense') {
        wallet.balance += transaction.amount;
      }
  
      await wallet.save(); // simpan perubahan wallet
      await transaction.deleteOne(); // hapus transaksi
  
      res.json({ message: 'Transaksi berhasil dihapus' });
    } catch (err) {
      console.error('❌ Gagal menghapus transaksi:', err);
      res.status(500).json({ message: 'Gagal menghapus transaksi', error: err.message });
    }
  };
  
