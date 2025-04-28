// src/controllers/budgetController.js
// Rencana Anggaran / Budgeting Endpoints

const Budget = require('../models/budgetModel');

exports.createBudget = async (req, res) => {
  try {
    const { walletId, name, amount, category, period, startDate, endDate } = req.body;

    if (!name || !amount || !category || !period || !startDate || !endDate || !walletId) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    const newBudget = new Budget({
      userId: req.user.userId,
      walletId,
      name,
      amount,
      category,
      period,
      startDate,
      endDate,
    });

    const saved = await newBudget.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Gagal membuat anggaran', error: err.message });
  }
};

exports.getBudgets = async (req, res) => {
    try {
      const budgets = await Budget.find({ userId: req.user.userId });
  
      const budgetsWithPercentage = budgets.map(budget => {
        const percentUsed = (budget.usedAmount / budget.amount) * 100;
        return {
          ...budget.toObject(),
          percentUsed: Math.min(percentUsed, 100).toFixed(2), // agar tidak lebih dari 100%
        };
      });
  
      res.json(budgetsWithPercentage);
    } catch (err) {
      res.status(500).json({ message: 'Gagal mengambil data anggaran', error: err.message });
    }
  };
