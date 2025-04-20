// src/controllers/plannedPaymentController.js
const PlannedPayment = require('../models/plannedPaymentModel');
const Wallet = require('../models/walletModel');

exports.createPlannedPayment = async (req, res) => {
  try {
    const { walletId, name, category, amount, repeatInterval, recipient, note, todayReminder, h3Reminder, nextDueDate } = req.body;
    const userId = req.user.userId;

    const newPlan = new PlannedPayment({
      userId,
      walletId,
      name,
      category,
      amount,
      repeatInterval,
      recipient,
      note,
      todayReminder,
      h3Reminder,
      nextDueDate,
    });

    await newPlan.save();
    res.status(201).json({ message: 'Planned payment berhasil dibuat', plan: newPlan });
  } catch (err) {
    console.error('❌ Error membuat planned payment:', err);
    res.status(500).json({ message: 'Gagal membuat planned payment', error: err.message });
  }
};

exports.getPlannedPayments = async (req, res) => {
  try {
    const plans = await PlannedPayment.find({ userId: req.user.userId }).sort({ nextDueDate: 1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil planned payments', error: err.message });
  }
};

exports.deletePlannedPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await PlannedPayment.findByIdAndDelete(id);
    if (!plan) return res.status(404).json({ message: 'Planned payment tidak ditemukan' });

    res.json({ message: 'Planned payment berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus', error: err.message });
  }
};

// ✅ Update Planned Payment
exports.updatePlannedPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const plan = await PlannedPayment.findByIdAndUpdate(id, updates, { new: true });
    if (!plan) return res.status(404).json({ message: 'Rencana pembayaran tidak ditemukan' });

    res.json({ message: 'Rencana berhasil diperbarui', plan });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui rencana', error: err.message });
  }
};

// ✅ Bayar Planned Payment (kurangi saldo wallet)
exports.payPlannedPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await PlannedPayment.findById(id);
    if (!plan) return res.status(404).json({ message: 'Rencana tidak ditemukan' });

    const wallet = await Wallet.findById(plan.walletId);
    if (!wallet) return res.status(404).json({ message: 'Wallet tidak ditemukan' });

    // cek saldo cukup
    if (wallet.balance < plan.amount) {
      return res.status(400).json({ message: 'Saldo tidak mencukupi' });
    }

    // kurangi saldo
    wallet.balance -= plan.amount;
    await wallet.save();

    // update nextDueDate berdasarkan repeatInterval (sederhana)
    const nextDate = new Date(plan.nextDueDate);
    if (plan.repeatInterval === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (plan.repeatInterval === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (plan.repeatInterval === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    plan.nextDueDate = nextDate;
    await plan.save();

    res.json({ message: 'Pembayaran berhasil dilakukan', walletBalance: wallet.balance, nextDueDate: plan.nextDueDate });
  } catch (err) {
    res.status(500).json({ message: 'Gagal membayar', error: err.message });
  }
};
