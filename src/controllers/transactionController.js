const Transaction = require("../models/transactionModel");
const Wallet = require("../models/walletModel");

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

    res.status(201).json(transaction);
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
    await transaction.deleteOne(); // hapus transaksi

    res.json({ message: "Transaksi berhasil dihapus" });
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
    if (!oldTransaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

    const wallet = await Wallet.findById(oldTransaction.walletId);
    if (!wallet) return res.status(404).json({ message: 'Wallet tidak ditemukan' });

    // Step 1: Rollback efek transaksi lama
    if (oldTransaction.type === 'income') {
      wallet.balance -= oldTransaction.amount;
    } else if (oldTransaction.type === 'expense') {
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
    if (oldTransaction.type === 'income') {
      wallet.balance += oldTransaction.amount;
    } else if (oldTransaction.type === 'expense') {
      wallet.balance -= oldTransaction.amount;
    }

    await wallet.save();

    res.json({ message: 'Transaksi berhasil diperbarui', transaction: oldTransaction });
  } catch (err) {
    console.error('❌ Gagal mengupdate transaksi:', err);
    res.status(500).json({ message: 'Gagal mengupdate transaksi', error: err.message });
  }
};
