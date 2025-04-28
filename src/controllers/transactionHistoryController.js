const Transaction = require("../models/transactionModel");
const Wallet = require("../models/walletModel")

exports.getHistoryByWalletId = async (req, res) => {
  try {
    const { walletId } = req.params;

    const transactions = await Transaction.find({ walletId }).sort({
      date: -1,
    }); // urutkan dari terbaru

    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengambil riwayat transaksi wallet",
      error: err.message,
    });
  }
};

exports.getAllTransactionByUserId = async (req, res) => {
    try {
      // Cari semua wallet milik user tersebut
      const wallets = await Wallet.find({ userId: req.user.userId});
  
      const walletIds = wallets.map(wallet => wallet._id);
  
      // Cari semua transaksi berdasarkan walletIds
      const transactions = await Transaction.find({ walletId: { $in: walletIds } })
        .sort({ date: -1 });
  
      res.status(200).json(transactions);
    } catch (err) {
      res.status(500).json({
        message: 'Gagal mengambil semua transaksi user',
        error: err.message,
      });
    }
  };

exports.getTransactionById = async (req, res) => {
  try {
  const { transactionId } = req.params;
  const transaction = await Transaction.find({ transactionId }).sort({
    date: -1
  });

  res.status(200).json(transaction);

  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil riwayat transaksi",
      error: err.message,
    });
  }
}


