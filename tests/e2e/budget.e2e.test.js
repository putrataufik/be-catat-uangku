const request = require("supertest");
const app = require("../../src/app");

describe("E2E: Budget Management Flow", () => {
  let token, wallet1, wallet2, budgetId;

  const user = {
    name: "Budget Tester",
    email: "budget@example.com",
    password: "Test1234!",
  };

  const baseBudget = {
    name: "Monthly Food Budget",
    amount: 500000,
    categories: ["Food", "Beverage"],
    period: "monthly",
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  };

  beforeEach(async () => {
    await request(app).post("/api/users/register").send(user);

    const login = await request(app).post("/api/users/login").send({
      email: user.email,
      password: user.password,
    });
    token = login.body.token;

    const res1 = await request(app)
      .post("/api/wallets")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Wallet 1", balance: 100000 });
    wallet1 = res1.body;

    const res2 = await request(app)
      .post("/api/wallets")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Wallet 2", balance: 200000 });
    wallet2 = res2.body;
  });

  it("should create a new budget", async () => {
    const res = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...baseBudget, walletIds: [wallet1._id, wallet2._id] });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Monthly Food Budget");
    budgetId = res.body._id;
  });

  it("should retrieve all budgets with usage info", async () => {
    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...baseBudget, walletIds: [wallet1._id, wallet2._id] });

    const res = await request(app)
      .get("/api/budgets")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("usedAmount");
  });

  it("should retrieve a budget by ID", async () => {
    const create = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...baseBudget, walletIds: [wallet1._id] });

    const id = create.body._id;

    const res = await request(app)
      .get(`/api/budgets/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(id);
  });

  it("should update a budget", async () => {
    const create = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...baseBudget, walletIds: [wallet1._id] });

    const id = create.body._id;

    const update = await request(app)
      .put(`/api/budgets/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Budget Name" });

    expect(update.statusCode).toBe(200);
    expect(update.body.budget.name).toBe("Updated Budget Name");
  });

  it("should delete a budget", async () => {
    const create = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...baseBudget, walletIds: [wallet2._id] });

    const id = create.body._id;

    const del = await request(app)
      .delete(`/api/budgets/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.statusCode).toBe(200);
    expect(del.body.message).toBe("Anggaran berhasil dihapus");
  });
});
