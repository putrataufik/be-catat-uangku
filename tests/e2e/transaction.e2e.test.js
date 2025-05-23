const request = require("supertest");
const app = require("../../src/app");

describe("E2E: Transaction flow with multiple wallets", () => {
  let token;
  let walletA, walletB;
  let transactionA, transactionB;

  const user = {
    name: "E2E Test User",
    email: "e2e.user@example.com",
    password: "SecurePass123!",
  };

  beforeEach(async () => {
    await request(app).post("/api/users/register").send(user);

    const loginRes = await request(app).post("/api/users/login").send({
      email: user.email,
      password: user.password,
    });
    token = loginRes.body.token;

    const resA = await request(app)
      .post("/api/wallets")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Wallet A", balance: 100000 });
    walletA = resA.body;

    const resB = await request(app)
      .post("/api/wallets")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Wallet B", balance: 50000 });
    walletB = resB.body;

    const txA = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        walletId: walletA._id,
        type: "expense",
        amount: 20000,
        category: "Food",
        date: new Date().toISOString(),
        note: "Lunch",
      });
    transactionA = txA.body.transaction;

    const txB = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        walletId: walletB._id,
        type: "income",
        amount: 30000,
        category: "Salary",
        date: new Date().toISOString(),
        note: "Salary received",
      });
    transactionB = txB.body.transaction;
  });

  it("should update transaction amounts and validate balances", async () => {
    const updateA = await request(app)
      .put(`/api/transactions/${transactionA._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 25000 });

    expect(updateA.statusCode).toBe(200);
    expect(updateA.body.transaction.amount).toBe(25000);

    const updateB = await request(app)
      .put(`/api/transactions/${transactionB._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 35000 });

    expect(updateB.statusCode).toBe(200);
    expect(updateB.body.transaction.amount).toBe(35000);
  });

  it("should update transaction types and adjust wallet balances", async () => {
    const changeA = await request(app)
      .put(`/api/transactions/${transactionA._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "income", amount: 25000 });

    expect(changeA.statusCode).toBe(200);
    expect(changeA.body.transaction.type).toBe("income");

    const changeB = await request(app)
      .put(`/api/transactions/${transactionB._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "expense", amount: 35000 });

    expect(changeB.statusCode).toBe(200);
    expect(changeB.body.transaction.type).toBe("expense");
  });

  it("should retrieve transactions by wallet", async () => {
    const resA = await request(app)
      .get(`/api/transactions/wallet/${walletA._id}`)
      .set("Authorization", `Bearer ${token}`);

    const resB = await request(app)
      .get(`/api/transactions/wallet/${walletB._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(resA.statusCode).toBe(200);
    expect(resA.body.length).toBeGreaterThan(0);
    expect(resB.statusCode).toBe(200);
    expect(resB.body.length).toBeGreaterThan(0);
  });

  it("should retrieve all transactions for the user", async () => {
    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it("should retrieve a valid transaction summary", async () => {
    const res = await request(app)
      .get("/api/transactions/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.summary)).toBe(true);
    expect(res.body.summary[0].totalIncome).toBeDefined();
    expect(res.body.filters.groupBy).toBe("total");
  });
});
