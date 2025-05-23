exports.adjustWalletBalance = (wallet, type, amount, mode = 'apply') => {
  const multiplier = mode === 'rollback' ? -1 : 1;

  if (type === 'income') {
    wallet.balance += multiplier * amount;
  } else if (type === 'expense') {
    wallet.balance -= multiplier * amount;
  }

  return wallet;
};
