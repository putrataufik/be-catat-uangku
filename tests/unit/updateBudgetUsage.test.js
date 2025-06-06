const { calculateUsedAmount } = require('../../src/utils/updateBudgetUsage');
const Note = require('../../src/models/noteModel');

// Mock model
jest.mock('../../src/models/noteModel');

describe('🧪 Unit Test: calculateUsedAmount', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('✅ return totalUsed jika ada transaksi', async () => {
    // setup mock return value
    Note.aggregate.mockResolvedValue([{ totalUsed: 300000 }]);

    const budget = {
      walletIds: ['wallet1'],
      categories: ['makanan'],
      startDate: '2024-05-01',
      endDate: '2024-05-31',
    };

    const result = await calculateUsedAmount(budget);
    expect(result).toBe(300000);
    expect(Note.aggregate).toHaveBeenCalled();
  });

  test('🟡 return 0 jika tidak ada transaksi', async () => {
    Note.aggregate.mockResolvedValue([]);

    const budget = {
      walletIds: ['wallet1'],
      categories: ['makanan'],
      startDate: '2024-05-01',
      endDate: '2024-05-31',
    };

    const result = await calculateUsedAmount(budget);
    expect(result).toBe(0);
  });
});
