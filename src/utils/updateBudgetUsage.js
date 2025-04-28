// Ini Untuk Rencana Anggaran / Budgeting
const Budget = require('../models/budgetModel');
const Transaction = require('../models/transactionModel');

const updateBudgetUsage = async (userId, walletId, category) => {
  const budgets = await Budget.find({
    userId,
    walletId,
    category,
  });

  for (let budget of budgets) {
    const expenses = await Transaction.find({
      walletId,
      type: 'expense',
      category,
      date: {
        $gte: budget.startDate,
        $lte: budget.endDate,
      },
    });

    const usedAmount = expenses.reduce((total, tx) => total + tx.amount, 0);
    budget.usedAmount = usedAmount;
    await budget.save();
  }
};

module.exports = updateBudgetUsage;
