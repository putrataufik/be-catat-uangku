const mongoose = require('mongoose');
const Note = require('../models/noteModel'); // ganti dari noteModel

exports.buildNoteSummary = async (userId, filters) => {
  const { type, category, startDate, endDate, groupBy } = filters;

  const aggregatePipeline = [
    {
      $lookup: {
        from: 'wallets',
        localField: 'walletId',
        foreignField: '_id',
        as: 'wallet'
      }
    },
    { $unwind: '$wallet' },
    {
      $match: {
        'wallet.userId': new mongoose.Types.ObjectId(userId),
        ...(type && { type }),
        ...(category && { category }),
        ...(startDate || endDate ? {
          date: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) }),
          }
        } : {})
      }
    }
  ];

  if (groupBy === 'category') {
    aggregatePipeline.push({
      $group: {
        _id: '$category',
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
          }
        },
        totalExpense: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
          }
        },
        count: { $sum: 1 }
      }
    });
  } else if (groupBy === 'month') {
    aggregatePipeline.push({
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
          }
        },
        totalExpense: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
          }
        },
        count: { $sum: 1 }
      }
    });
  } else {
    aggregatePipeline.push({
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
          }
        },
        totalExpense: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
          }
        },
        count: { $sum: 1 }
      }
    });
  }

  const result = await Note.aggregate(aggregatePipeline);

  return result.map(item => ({
    ...item,
    netTotal: item.totalIncome - item.totalExpense
  }));
};
