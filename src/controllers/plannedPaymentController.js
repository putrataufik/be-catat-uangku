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

function getNextPaymentDate(plan) {
  if (!plan.is_recurring) return null;

  const lastDate = new Date(plan.payment_date);
  const interval = plan.recurring_interval || 1;

  let nextDate;
  switch (plan.recurring_type) {
    case 'monthly':
      nextDate = new Date(lastDate.setMonth(lastDate.getMonth() + interval));
      break;
    case 'weekly':
      nextDate = new Date(lastDate.setDate(lastDate.getDate() + 7 * interval));
      break;
    case 'yearly':
      nextDate = new Date(lastDate.setFullYear(lastDate.getFullYear() + interval));
      break;
    default:
      return null;
  }

  if (plan.end_date && nextDate > new Date(plan.end_date)) {
    return null;
  }

  return nextDate;
}

exports.getPlannedPayments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const plans = await PlannedPayment.find({ user_id: userId });

    const now = new Date();

    // Fungsi bantu untuk menghitung pembayaran berikutnya
    const getNextPaymentDate = (plan) => {
      if (!plan.is_recurring) return null;

      const lastPaymentDate = new Date(plan.payment_date);
      const interval = plan.recurring_interval || 1;
      let nextDate;

      switch (plan.recurring_type) {
        case 'monthly':
          nextDate = new Date(lastPaymentDate.setMonth(lastPaymentDate.getMonth() + interval));
          break;
        case 'weekly':
          nextDate = new Date(lastPaymentDate.setDate(lastPaymentDate.getDate() + 7 * interval));
          break;
        case 'yearly':
          nextDate = new Date(lastPaymentDate.setFullYear(lastPaymentDate.getFullYear() + interval));
          break;
        default:
          return null;
      }

      if (plan.end_date && new Date(nextDate) > new Date(plan.end_date)) {
        return null;
      }

      return nextDate;
    };

    const enrichedPlans = await Promise.all(
      plans.map(async (plan) => {
        const paymentDate = new Date(plan.payment_date);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // Cek apakah sudah dibayar bulan ini
        const existingNote = await Note.findOne({
          plannedPaymentId: plan._id,
          date: { $gte: monthStart, $lt: monthEnd }
        });

        // Riwayat pembayaran
        const notes = await Note.find({ plannedPaymentId: plan._id }).sort({ date: -1 });

        // Info dompet
        const wallet = await Wallet.findById(plan.wallet_id);

        // Tanggal pembayaran berikutnya
        const nextPaymentDate = getNextPaymentDate(plan);

        return {
          ...plan.toObject(),
          isPaidThisMonth: !!existingNote,
          isUpcoming: nextPaymentDate && nextPaymentDate >= now && !existingNote,
          nextPaymentDate,
          paymentHistory: notes,
          walletInfo: wallet
            ? {
                name: wallet.name,
                currentBalance: wallet.balance
              }
            : null
        };
      })
    );

    res.status(200).json(enrichedPlans);
  } catch (err) {
    console.error('❌ Gagal mengambil data planned payments:', err);
    res.status(500).json({ message: 'Gagal mengambil data', error: err.message });
  }
};


// update disini nanti
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
    const { targetMonth, targetYear } = req.body;

    const plan = await PlannedPayment.findOne({ _id: id, user_id: req.user.userId });
    if (!plan) return res.status(404).json({ message: 'Planned payment tidak ditemukan' });

    const wallet = await Wallet.findById(plan.wallet_id);
    if (!wallet) return res.status(404).json({ message: 'Wallet tidak ditemukan' });

    if (targetMonth == null || targetYear == null) {
      return res.status(400).json({ message: 'targetMonth dan targetYear harus diisi' });
    }

    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 1);

    const duplicate = await Note.findOne({
      plannedPaymentId: plan._id,
      date: { $gte: start, $lt: end }
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Pembayaran untuk bulan ini sudah dilakukan' });
    }

    if (plan.type === 'expense' && wallet.balance < plan.amount) {
      return res.status(400).json({ message: 'Saldo tidak mencukupi' });
    }

    wallet.balance += plan.type === 'income' ? plan.amount : -plan.amount;
    await wallet.save();

    const paymentDate = new Date(targetYear, targetMonth - 1, 1);

    const note = new Note({
      walletId: plan.wallet_id,
      type: plan.type,
      amount: plan.amount,
      category: plan.category,
      date: paymentDate,
      note: `[Planned] ${plan.title} (${targetMonth}/${targetYear})`,
      plannedPaymentId: plan._id
    });
    await note.save();

    plan.status = 'paid';
    plan.payment_date = paymentDate;
    await plan.save();

    res.json({
      message: 'Pembayaran berhasil',
      note,
      currentBalance: wallet.balance
    });
  } catch (err) {
    console.error('❌ Gagal melakukan pembayaran:', err);
    res.status(500).json({ message: 'Gagal melakukan pembayaran', error: err.message });
  }
};

exports.cancelPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetMonth, targetYear } = req.body;

    if (targetMonth == null || targetYear == null) {
      return res.status(400).json({ message: 'targetMonth dan targetYear harus diisi' });
    }

    const plan = await PlannedPayment.findOne({ _id: id, user_id: req.user.userId });
    if (!plan) {
      return res.status(404).json({ message: 'Planned payment tidak ditemukan' });
    }

    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 1);

    const note = await Note.findOne({
      plannedPaymentId: plan._id,
      date: { $gte: start, $lt: end }
    });

    if (!note) {
      return res.status(404).json({ message: 'Pembayaran untuk bulan tersebut belum dilakukan' });
    }

    const wallet = await Wallet.findById(plan.wallet_id);
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet tidak ditemukan' });
    }

    // Kembalikan saldo
    wallet.balance += plan.type === 'income' ? -note.amount : note.amount;
    await wallet.save();

    // Hapus Note
    await note.deleteOne();

    // Update status (jika bulan yang dibatalkan adalah bulan terakhir)
    const now = new Date();
    const isCurrentMonth = start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
    if (isCurrentMonth) {
      plan.status = 'planned';
      await plan.save();
    }

    res.json({
      message: 'Pembayaran berhasil dibatalkan',
      restoredBalance: wallet.balance
    });
  } catch (err) {
    console.error('❌ Gagal membatalkan pembayaran:', err);
    res.status(500).json({ message: 'Gagal membatalkan pembayaran', error: err.message });
  }
};

