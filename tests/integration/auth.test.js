const request = require('supertest');
const app = require('../../src/app');


describe('Integration Test: /api/users/register & /api/users/login', () => {
  test('Register berhasil dengan data valid', async () => {
    const res = await request(app).post('/api/users/register').send({
      name: 'TestUser',
      email: 'testuser@example.com',
      password: 'Password1!'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Registrasi berhasil');
  });

  test('✅ Login berhasil setelah register', async () => {
    // registrasi dulu
    await request(app).post('/api/users/register').send({
      name: 'LoginUser',
      email: 'login@example.com',
      password: 'Password1!'
    });

    // login
    const res = await request(app).post('/api/users/login').send({
      email: 'login@example.com',
      password: 'Password1!'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'login@example.com');
  });

  test('❌ Register gagal karena password lemah', async () => {
    const res = await request(app).post('/api/users/register').send({
      name: 'WeakPass',
      email: 'weak@example.com',
      password: '12345678' // tidak sesuai syarat
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Password minimal 8 karakter/);
  });

  test('❌ Login gagal karena email tidak ditemukan', async () => {
    const res = await request(app).post('/api/users/login').send({
      email: 'notfound@example.com',
      password: 'Password1!'
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email tidak ditemukan');
  });

  test('❌ Login gagal karena password salah', async () => {
    await request(app).post('/api/users/register').send({
      name: 'WrongPassUser',
      email: 'wrongpass@example.com',
      password: 'Password1!'
    });

    const res = await request(app).post('/api/users/login').send({
      email: 'wrongpass@example.com',
      password: 'WrongPassword!'
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Password salah');
  });
});
