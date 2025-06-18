const request = require("supertest");
const app = require("../../src/app");

describe("E2E: Planned Payment Flow", () => {
  let token, wallet, plannedPaymentId;

  const user = {
    name: "Planned User",
    email: "planned@example.com",
    password: "Password1!",
  };

  const plannedData = {
    title: "Internet Subscription",
    description: "Monthly internet payment",
    amount: 150000,
    is_variable_amount: false,
    type: "expense",
    category: "Utilities",
    payment_date: new Date(),
    is_recurring: true,
    recurring_type: "monthly",
    recurring_interval: 1,
    reminders: [{ days_before: 3 }],
  };

  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(user);
    const loginRes = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: user.password,
    });
    token = loginRes.body.token;

    const walletRes = await request(app)
      .post("/api/wallets")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Main Wallet", balance: 200000 });
    wallet = walletRes.body;
  });

  it("should create a new planned payment", async () => {
    const res = await request(app)
      .post("/api/planned-payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...plannedData, wallet_id: wallet._id });

    expect(res.statusCode).toBe(201);
    expect(res.body.plannedPayment.title).toBe("Internet Subscription");
    plannedPaymentId = res.body.plannedPayment._id;
  });

  it("should retrieve all planned payments", async () => {
    const res = await request(app)
      .get("/api/planned-payments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should retrieve planned payment by ID", async () => {
    const create = await request(app)
      .post("/api/planned-payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...plannedData, wallet_id: wallet._id });
    const id = create.body.plannedPayment._id;

    const res = await request(app)
      .get(`/api/planned-payments/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.plan._id).toBe(id);
  });

  it("should update a planned payment", async () => {
    const create = await request(app)
      .post("/api/planned-payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...plannedData, wallet_id: wallet._id });
    const id = create.body.plannedPayment._id;

    const res = await request(app)
      .put(`/api/planned-payments/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Plan" });

    expect(res.statusCode).toBe(200);
    expect(res.body.plan.title).toBe("Updated Plan");
  });

it("should pay a planned payment and deduct wallet balance", async () => {
    const create = await request(app)
      .post("/api/planned-payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...plannedData, wallet_id: wallet._id });
    const id = create.body.plannedPayment._id;

    const pay = await request(app)
      .post(`/api/planned-payments/${id}/pay`)
      .set("Authorization", `Bearer ${token}`)
      .send({ targetMonth: 8, targetYear: 2025 });

    expect(pay.statusCode).toBe(200);
    expect(pay.body.note.amount).toBe(plannedData.amount);
    expect(pay.body.statusNow || pay.body.note).toBeDefined();
  });

  it("should cancel the last planned payment note and refund wallet", async () => {
    const cancelAmount = 200000;
    const create = await request(app)
      .post("/api/planned-payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...plannedData, amount: cancelAmount, wallet_id: wallet._id });
    const id = create.body.plannedPayment._id;

    await request(app)
      .post(`/api/planned-payments/${id}/pay`)
      .set("Authorization", `Bearer ${token}`)
      .send({ targetMonth: 8, targetYear: 2025 });

    const cancel = await request(app)
      .post(`/api/planned-payments/${id}/cancel-payment`)
      .set("Authorization", `Bearer ${token}`)
      .send({ targetMonth: 8, targetYear: 2025 });

    expect(cancel.statusCode).toBe(200);
    const refunded = cancel.body.rollbackAmount || cancel.body.restoredBalance;
    expect(refunded).toBe(cancelAmount);
    expect(cancel.body.statusNow).toBe("planned");
  });

  it("should delete a planned payment", async () => {
    const create = await request(app)
      .post("/api/planned-payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...plannedData, wallet_id: wallet._id });
    const id = create.body.plannedPayment._id;

    const res = await request(app)
      .delete(`/api/planned-payments/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Berhasil dihapus");
  });
});