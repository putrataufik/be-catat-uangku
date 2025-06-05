const request = require("supertest");
const app = require("../../src/app");

describe("E2E Auth Test", () => {
  const validUser = {
    name: "Azna Tester",
    email: "azna@example.com",
    password: "Password1!",
  };
  test("Register - valid", async () => {
    const res = await request(app).post("/api/users/register").send(validUser);
    expect(res.statusCode).toBe(201);
  });

  test("Register - duplicate email", async () => {
    await request(app).post("/api/users/register").send(validUser); // Daftarkan dulu
    const res = await request(app).post("/api/users/register").send(validUser); // Coba lagi
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email sudah digunakan");
  });

  test("Login - correct credentials", async () => {
    await request(app).post("/api/users/register").send(validUser); // Tambahkan ini
    const res = await request(app).post("/api/users/login").send({
      email: validUser.email,
      password: validUser.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(validUser.email);
  });

  test("Login - wrong password", async () => {
    await request(app).post("/api/users/register").send(validUser); // Pastikan user terdaftar
    const res = await request(app).post("/api/users/login").send({
      email: validUser.email,
      password: "WrongPassword!",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Password salah");
  });
});
