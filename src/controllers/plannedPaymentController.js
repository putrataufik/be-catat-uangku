// controllers/plannedPaymentController.js
const PlannedPayment = require('../models/plannedPaymentModel');
const Wallet = require('../models/walletModel');
const Transaction = require('../models/transactionModel');

// 1. Create Planned Payment
exports.createPlannedPayment = async (req, res) => {
  try {
    const newPlan = new PlannedPayment({
      ...req.body,
      user_id: req.user.userId,
    });
    const savedPlan = await newPlan.save();
    res.status(201).json(savedPlan);
  } catch (err) {
    res.status(500).json({ message: 'Gagal membuat planned payment', error: err.message });
  }
};

// 2. Get All Planned Payments of a User
exports.getPlannedPayments = async (req, res) => {
  try {
    const plans = await PlannedPayment.find({ user_id: req.user.userId });
    res.status(200).json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data', error: err.message });
  }
};

// 3. Get Planned Payment by ID
exports.getPlannedPaymentById = async (req, res) => {
  try {
    const plan = await PlannedPayment.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Planned payment tidak ditemukan' });
    res.status(200).json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil detail', error: err.message });
  }
};

// 4. Update Planned Payment
exports.updatePlannedPaymentById = async (req, res) => {
  try {
    const updated = await PlannedPayment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Planned payment tidak ditemukan' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Gagal update', error: err.message });
  }
};

// 5. Delete Planned Payment
exports.deletePlannedPaymentById = async (req, res) => {
  try {
    const plan = await PlannedPayment.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Planned payment tidak ditemukan' });

    if (plan.transaction_id) {
      await Transaction.findByIdAndDelete(plan.transaction_id);
    }

    await PlannedPayment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus', error: err.message });
  }
};

// 6. Pay Planned Payment
exports.payPlannedPaymentById = async (req, res) => {
  try {
    const plan = await PlannedPayment.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Planned payment tidak ditemukan' });

    if (plan.status === 'paid' && plan.payment_date > new Date()) {
      return res.status(400).json({ message: 'Pembayaran sudah dilakukan untuk periode ini' });
    }

    const wallet = await Wallet.findById(plan.wallet_id);
    if (!wallet) return res.status(404).json({ message: 'Wallet tidak ditemukan' });

    if (plan.type === 'expense' && wallet.balance < plan.amount) {
      return res.status(400).json({ message: 'Saldo tidak mencukupi' });
    }

    // Update saldo wallet
    wallet.balance += plan.type === 'income' ? plan.amount : -plan.amount;
    await wallet.save();

    // Catat sebagai transaksi
    const transaction = new Transaction({
      walletId: wallet._id,
      type: plan.type,
      amount: plan.amount,
      category: plan.category,
      date: new Date(),
      note: `Pembayaran ${plan.title}`,
      plannedPaymentId: plan._id, // Menyimpan ID Planned Payment ke transaksi
      createdAt: new Date(),
    });
    await transaction.save();

    // Simpan ID transaksi ke PlannedPayment
    plan.transaction_id = transaction._id;

    // Hitung tanggal berikutnya
    const nextDate = new Date(plan.payment_date);
    if (plan.recurring_type === 'daily') nextDate.setDate(nextDate.getDate() + plan.recurring_interval);
    else if (plan.recurring_type === 'weekly') nextDate.setDate(nextDate.getDate() + 7 * plan.recurring_interval);
    else if (plan.recurring_type === 'monthly') nextDate.setMonth(nextDate.getMonth() + plan.recurring_interval);
    else if (plan.recurring_type === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + plan.recurring_interval);

    plan.payment_date = nextDate;
    plan.status = 'paid';
    await plan.save();

    res.status(200).json({ message: 'Pembayaran berhasil', transaction });
  } catch (err) {
    res.status(500).json({ message: 'Gagal melakukan pembayaran', error: err.message });
  }
};

