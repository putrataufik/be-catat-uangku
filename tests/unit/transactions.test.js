// Unit tests for walletHelper.js
const { adjustWalletBalance } = require('../../src/utils/walletHelper');

describe('adjustWalletBalance', () => {
  it('should add income amount when mode is apply', () => {
    const wallet = { balance: 1000 };
    adjustWalletBalance(wallet, 'income', 500);
    expect(wallet.balance).toBe(1500);
  });

  it('should subtract expense amount when mode is apply', () => {
    const wallet = { balance: 1000 };
    adjustWalletBalance(wallet, 'expense', 200);
    expect(wallet.balance).toBe(800);
  });

  it('should rollback income amount', () => {
    const wallet = { balance: 1000 };
    adjustWalletBalance(wallet, 'income', 300, 'rollback');
    expect(wallet.balance).toBe(700);
  });

  it('should rollback expense amount', () => {
    const wallet = { balance: 1000 };
    adjustWalletBalance(wallet, 'expense', 100, 'rollback');
    expect(wallet.balance).toBe(1100);
  });
});


// Unit tests for noteValidator.js
const { validateNoteInput } = require('../../src/utils/noteValidator');

describe('validateNoteInput', () => {
  it('should return null for valid input', () => {
    const result = validateNoteInput({
      type: 'income',
      amount: 100,
      category: 'Food',
      date: '2025-05-01'
    });
    expect(result).toBe(null);
  });

  it('should return error for invalid type', () => {
    const result = validateNoteInput({
      type: 'bonus',
      amount: 100,
      category: 'Reward',
      date: '2025-05-01'
    });
    expect(result).toMatch(/tidak valid/);
  });

  it('should return error for negative amount', () => {
    const result = validateNoteInput({
      type: 'expense',
      amount: -50,
      category: 'Food',
      date: '2025-05-01'
    });
    expect(result).toMatch(/angka positif/);
  });

  it('should return error for invalid date', () => {
    const result = validateNoteInput({
      type: 'income',
      amount: 100,
      category: 'Salary',
      date: 'invalid-date'
    });
    expect(result).toMatch(/Tanggal tidak valid/);
  });
});


// Unit tests for noteProcessor.js
const { rollbackNote, applyNote } = require('../../src/utils/noteProcessor');

describe('Note Processor', () => {
  it('should rollback income note', () => {
    const wallet = { balance: 1000 };
    const note = { type: 'income', amount: 300 };
    rollbackNote(wallet, note);
    expect(wallet.balance).toBe(700);
  });

  it('should apply expense note', () => {
    const wallet = { balance: 1000 };
    const note = { type: 'expense', amount: 200 };
    applyNote(wallet, note);
    expect(wallet.balance).toBe(800);
  });
});