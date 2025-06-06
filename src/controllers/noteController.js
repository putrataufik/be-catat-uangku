const Note = require("../models/noteModel");
const Wallet = require("../models/walletModel");
const { updateBudgetUsage } = require("../utils/updateBudgetUsage");
const { validateNoteInput } = require("../utils/noteValidator");
const { rollbackNote, applyNote } = require("../utils/noteProcessor");
const { buildNoteSummary } = require("../services/noteSummaryService");

exports.createNote = async (req, res) => {
  try {
    const { walletId, type, amount, category, date, note } = req.body;
    const error = validateNoteInput({ type, amount, category, date });
    if (error) return res.status(400).json({ message: error });

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet tidak ditemukan" });

    const newNote = new Note({ walletId, type, amount, category, date, note });
    await newNote.save();

    applyNote(wallet, newNote);
    await wallet.save();

    await updateBudgetUsage(req.user.userId, walletId, category);

    res.status(201).json({
      message: "Catatan berhasil dicatat",
      note: newNote,
      currentBalance: wallet.balance,
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal mencatat catatan", error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: "Catatan tidak ditemukan" });

    const wallet = await Wallet.findById(note.walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet tidak ditemukan" });

    rollbackNote(wallet, note);
    await wallet.save();
    await updateBudgetUsage(req.user.userId, note.walletId, note.category);
    await note.deleteOne();

    res.json({ message: "Catatan berhasil dihapus", currentBalance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus catatan", error: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, date, note } = req.body;
    const oldNote = await Note.findById(id);
    if (!oldNote) return res.status(404).json({ message: "Catatan tidak ditemukan" });

    const wallet = await Wallet.findById(oldNote.walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet tidak ditemukan" });

    rollbackNote(wallet, oldNote);

    oldNote.type = type || oldNote.type;
    oldNote.amount = amount || oldNote.amount;
    oldNote.category = category || oldNote.category;
    oldNote.date = date || oldNote.date;
    oldNote.note = note || oldNote.note;
    await oldNote.save();

    applyNote(wallet, oldNote);
    await wallet.save();
    await updateBudgetUsage(req.user.userId, wallet._id, oldNote.category);

    res.json({
      message: "Catatan berhasil diperbarui",
      note: oldNote,
      currentBalance: wallet.balance,
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal mengupdate catatan", error: err.message });
  }
};

exports.getNotesByWallet = async (req, res) => {
  try {
    const { walletId } = req.params;
    const notes = await Note.find({ walletId }).sort({ date: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil catatan", error: err.message });
  }
};

exports.getAllNotes = async (req, res) => {
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

    const notes = await Note.find(filter).sort({ date: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil semua catatan", error: err.message });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: "Catatan tidak ditemukan" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil catatan", error: err.message });
  }
};

exports.getNoteSummary = async (req, res) => {
  try {
    const summary = await buildNoteSummary(req.user.userId, req.query);
    res.json({
      summary,
      filters: { ...req.query, groupBy: req.query.groupBy || 'total' }
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal mendapatkan ringkasan catatan", error: err.message });
  }
};
