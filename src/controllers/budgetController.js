// src/controllers/budgetController.js
// Rencana Anggaran / Budgeting Endpoints

const Budget = require("../models/budgetModel");
const { calculateUsedAmount } = require("../utils/updateBudgetUsage");

exports.createBudget = async (req, res) => {
  try {
    const { walletIds, name, amount, categories, period, startDate, endDate } =
      req.body;

    if (!Array.isArray(walletIds) || walletIds.length === 0) {
      return res
        .status(400)
        .json({
          message: "walletIds harus berupa array dan tidak boleh kosong",
        });
    }

    const newBudget = new Budget({
      userId: req.user.userId,
      walletIds,
      name,
      amount,
      categories,
      period,
      startDate,
      endDate,
    });

    const saved = await newBudget.save();
    res.status(201).json(saved);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal membuat anggaran", error: err.message });
  }
};

exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.userId });

    const result = await Promise.all(budgets.map(async (budget) => {
      const used = await calculateUsedAmount(budget);
      const percentUsed = (used / budget.amount) * 100;
      const remaining = budget.amount - used;

      return {
        ...budget.toObject(),
        usedAmount: used,
        remainingAmount: Math.max(remaining, 0),
        percentUsed: Math.min(percentUsed, 100).toFixed(2),
      };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil anggaran', error: err.message });
  }
};

exports.getBudgetById = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findOne({ _id: id, userId: req.user.userId });

    if (!budget) {
      return res.status(404).json({ message: 'Anggaran tidak ditemukan' });
    }

    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data anggaran', error: err.message });
  }
};

exports.updateBudgetById = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Budget.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Anggaran tidak ditemukan atau tidak bisa diupdate' });
    }

    res.json({
      message: 'Anggaran berhasil diperbarui',
      budget: updated
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengupdate anggaran', error: err.message });
  }
};

exports.deleteBudgetById = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Budget.findOneAndDelete({ _id: id, userId: req.user.userId });

    if (!deleted) {
      return res.status(404).json({ message: 'Anggaran tidak ditemukan atau sudah dihapus' });
    }

    res.json({ message: 'Anggaran berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus anggaran', error: err.message });
  }
};

