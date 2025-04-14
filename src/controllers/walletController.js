const Wallet = require('../models/walletModel');

exports.getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.user.userId }); // dari middleware JWT
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil dompet', error: err.message });
  }
};

exports.createWallet = async (req, res) => {
    try {
      const { name, balance } = req.body;
  
      const wallet = new Wallet({
        userId: req.user.userId,
        name,
        balance
      });
  
      await wallet.save();
  
      res.status(201).json(wallet);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ message: 'Nama wallet sudah digunakan' });
      }
  
      res.status(500).json({ message: 'Gagal membuat dompet', error: err.message });
    }
  };
  
