const { adjustWalletBalance } = require('./walletHelper');

exports.rollbackNote = (wallet, note) => {
  return adjustWalletBalance(wallet, note.type, note.amount, 'rollback');
};

exports.applyNote = (wallet, note) => {
  return adjustWalletBalance(wallet, note.type, note.amount, 'apply');
};
