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
const calculateUsedAmount = async (budget) => {
  const used = await Transaction.aggregate([
    {
      $match: {
        walletId: { $in: budget.walletIds },
        type: 'expense',
        category: { $in: budget.categories },
        date: {
          $gte: new Date(budget.startDate),
          $lte: new Date(budget.endDate),
        }
      }
    },
    {
      $group: {
        _id: null,
        totalUsed: { $sum: '$amount' }
      }
    }
  ]);

  return used.length > 0 ? used[0].totalUsed : 0;
};

module.exports = {updateBudgetUsage, calculateUsedAmount };
