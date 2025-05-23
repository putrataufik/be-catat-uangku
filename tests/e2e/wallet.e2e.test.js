const request = require('supertest');
const app = require('../../src/app');

describe('E2E Wallet Test', () => {
  const user = {
    name: 'Dompet User',
    email: 'wallet@example.com',
    password: 'Password1!',
  };

  let token;
  let walletId;

  beforeEach(async () => {
    // Register dan Login
    await request(app).post('/api/users/register').send(user);
    const res = await request(app).post('/api/users/login').send({
      email: user.email,
      password: user.password,
    });
    token = res.body.token;
  });

  test('Create wallet - success', async () => {
    const res = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dompet Utama', balance: 100000 });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Dompet Utama');
    expect(res.body.balance).toBe(100000);
    walletId = res.body._id;
  });

  test('Get wallet list - should return created wallet', async () => {
    // Buat dulu
    await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dompet Utama', balance: 100000 });

    const res = await request(app)
      .get('/api/wallets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Dompet Utama' })
      ])
    );
  });

  test('Update wallet - success', async () => {
    // Buat wallet dulu
    const createRes = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dompet Lama', balance: 50000 });

    const res = await request(app)
      .put(`/api/wallets/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dompet Baru', balance: 75000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.wallet.name).toBe('Dompet Baru');
    expect(res.body.wallet.balance).toBe(75000);
  });

  test('Delete wallet - success', async () => {
    // Buat wallet dulu
    const createRes = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dompet Hapus', balance: 30000 });

    const res = await request(app)
      .delete(`/api/wallets/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Wallet berhasil dihapus');
  });

  test('Wallet summary - empty data', async () => {
    const createRes = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dompet Summary', balance: 0 });

    const res = await request(app)
      .get(`/api/wallets/${createRes.body._id}/summary`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalIncome).toBe(0);
    expect(res.body.totalExpense).toBe(0);
    expect(res.body.count).toBe(0);
    expect(res.body.walletName).toBe('Dompet Summary');
  });
});
