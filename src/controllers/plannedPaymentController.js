const PlannedPayment = require('../models/plannedPaymentModel');
const Wallet = require('../models/walletModel');
const Note = require('../models/noteModel');

exports.createPlannedPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      wallet_id,
      title,
      description,
      amount,
      is_variable_amount,
      type,
      category,
      payment_date,
      is_recurring,
      recurring_type,
      recurring_interval,
      end_date,
      reminders
    } = req.body;

    const wallet = await Wallet.findOne({ _id: wallet_id, userId });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet tidak ditemukan atau bukan milik Anda' });
    }

    const planned = new PlannedPayment({
      user_id: userId,
      wallet_id,
      title,
      description,
      amount,
      is_variable_amount,
      type,
      category,
      payment_date,
      is_recurring,
      recurring_type,
      recurring_interval,
      end_date,
      reminders
    });

    await planned.save();

    res.status(201).json({
      message: 'Planned payment berhasil ditambahkan',
      plannedPayment: planned
    });
  } catch (err) {
    console.error('❌ Gagal membuat planned payment:', err);
    res.status(500).json({ message: 'Gagal membuat planned payment', error: err.message });
  }
};

exports.getPlannedPayments = async (req, res) => {
  try {
    const plans = await PlannedPayment.find({ user_id: req.user.userId });
    res.status(200).json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data', error: err.message });
  }
};

exports.getPlannedPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await PlannedPayment.findOne({ _id: id, user_id: req.user.userId });
    if (!plan) return res.status(404).json({ message: 'Planned payment tidak ditemukan' });

    const notes = await Note.find({ plannedPaymentId: plan._id });

    res.json({ plan, notes });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil planned payment', error: err.message });
  }
};

exports.updatePlannedPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await PlannedPayment.findOneAndUpdate(
      { _id: id, user_id: req.user.userId },
      req.body,
      { new: true }
    );

    if (!plan) return res.status(404).json({ message: 'Planned payment tidak ditemukan' });

    res.json({ message: 'Berhasil diupdate', plan });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update planned payment', error: err.message });
  }
};

exports.deletePlannedPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await PlannedPayment.findOneAndDelete({ _id: id, user_id: req.user.userId });
    if (!deleted) return res.status(404).json({ message: 'Planned payment tidak ditemukan' });

    res.json({ message: 'Berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal hapus planned payment', error: err.message });
  }
};

exports.payPlannedPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await PlannedPayment.findOne({ _id: id, user_id: req.user.userId });
    if (!plan) return res.status(404).json({ message: 'Planned payment tidak ditemukan' });

    const wallet = await Wallet.findById(plan.wallet_id);
    if (!wallet) return res.status(404).json({ message: 'Wallet tidak ditemukan' });

    const paymentDate = new Date(plan.payment_date);
    const monthStart = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1);
    const monthEnd = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 1);

    const existingNote = await Note.findOne({
      plannedPaymentId: plan._id,
      date: { $gte: monthStart, $lt: monthEnd }
    });

    if (existingNote) {
      return res.status(400).json({ message: 'Pembayaran untuk bulan ini sudah dilakukan' });
    }

    if (plan.type === 'expense' && wallet.balance < plan.amount) {
      return res.status(400).json({ message: 'Saldo tidak mencukupi untuk pembayaran ini' });
    }

    wallet.balance += plan.type === 'income' ? plan.amount : -plan.amount;
    await wallet.save();

    const note = new Note({
      walletId: plan.wallet_id,
      type: plan.type,
      amount: plan.amount,
      category: plan.category,
      date: plan.payment_date,
      note: `[Planned] ${plan.title}`,
      plannedPaymentId: plan._id
    });
    await note.save();

    plan.status = 'paid';
    await plan.save();

    res.json({
      message: 'Pembayaran berhasil dikonfirmasi',
      note,
      currentBalance: wallet.balance,
      statusNow: plan.status
    });
  } catch (err) {
    console.error('❌ Gagal melakukan pembayaran:', err);
    res.status(500).json({ message: 'Gagal melakukan pembayaran', error: err.message });
  }
};

exports.cancelPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await PlannedPayment.findOne({ _id: id, user_id: req.user.userId });
    if (!plan) {
      return res.status(404).json({ message: 'Planned payment tidak ditemukan atau bukan milik Anda' });
    }

    const wallet = await Wallet.findById(plan.wallet_id);
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet tidak ditemukan' });
    }

    const notes = await Note.find({ plannedPaymentId: plan._id }).sort({ date: -1 }).limit(1);
    if (!notes.length) {
      return res.status(404).json({ message: 'Tidak ditemukan catatan untuk dibatalkan' });
    }

    const latestNote = notes[0];

    if (plan.type === 'income') {
      wallet.balance -= latestNote.amount;
    } else if (plan.type === 'expense') {
      wallet.balance += latestNote.amount;
    }

    await wallet.save();
    await latestNote.deleteOne();

    const remaining = await Note.countDocuments({ plannedPaymentId: plan._id });
    plan.status = remaining > 0 ? 'paid' : 'planned';
    await plan.save();

    res.json({
      message: 'Pembayaran terakhir berhasil dibatalkan',
      rollbackAmount: latestNote.amount,
      currentBalance: wallet.balance,
      statusNow: plan.status
    });
  } catch (err) {
    console.error('❌ Gagal membatalkan pembayaran:', err);
    res.status(500).json({ message: 'Gagal membatalkan pembayaran', error: err.message });
  }
};
