const Note = require("../models/noteModel");
const Wallet = require("../models/walletModel");

exports.getHistoryByWalletId = async (req, res) => {
  try {
    const { walletId } = req.params;

    const notes = await Note.find({ walletId }).sort({ date: -1 }); // urutkan dari terbaru

    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengambil riwayat catatan wallet",
      error: err.message,
    });
  }
};

exports.getAllNotesByUserId = async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.user.userId });
    const walletIds = wallets.map(wallet => wallet._id);

    const notes = await Note.find({ walletId: { $in: walletIds } }).sort({ date: -1 });

    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({
      message: 'Gagal mengambil semua catatan user',
      error: err.message,
    });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const { noteId } = req.params;
    const note = await Note.find({ _id: noteId }).sort({ date: -1 });

    res.status(200).json(note);
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengambil catatan",
      error: err.message,
    });
  }
};
