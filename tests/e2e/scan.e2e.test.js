const request = require("supertest");
const path = require("path");
const app = require("../../src/app");
const fs = require("fs");

describe("E2E: Scan Receipt Upload and Parsing", () => {
  let token;

  const user = {
    name: "Scanner User",
    email: "scanner@example.com",
    password: "Test1234!",
  };

  beforeEach(async () => {
    await request(app).post("/api/users/register").send(user);

    const login = await request(app).post("/api/users/login").send({
      email: user.email,
      password: user.password,
    });

    token = login.body.token;
  });

  it("should reject when no image is uploaded", async () => {
    const res = await request(app)
      .post("/api/scan-receipt")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Gambar nota diperlukan");
  });

  it("should reject unsupported file type", async () => {
    const res = await request(app)
      .post("/api/scan-receipt")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", Buffer.from("dummy content"), {
        filename: "nota.txt",
        contentType: "text/plain",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Tipe gambar tidak didukung");
  });

  it("should accept a valid image and return transaction JSON", async () => {
    const imagePath = path.resolve(__dirname, "../assets/sample-recipe.jpg");

    if (!fs.existsSync(imagePath)) {
      console.warn("⚠️ Test skipped: sample-receipt.jpg not found in assets folder.");
      return;
    }

    const res = await request(app)
      .post("/api/scan-receipt")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", imagePath);

    expect(res.statusCode).toBe(200);
    expect(res.body.transaction).toHaveProperty("amount");
    expect(res.body.transaction).toHaveProperty("category");
    expect(res.body.transaction).toHaveProperty("date");
    expect(res.body.transaction).toHaveProperty("note");
  });
});