const { adjustWalletBalance } = require('./walletHelper');

exports.rollbackTransaction = (wallet, transaction) => {
  return adjustWalletBalance(wallet, transaction.type, transaction.amount, 'rollback');
};

exports.applyTransaction = (wallet, transaction) => {
  return adjustWalletBalance(wallet, transaction.type, transaction.amount, 'apply');
};
