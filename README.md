# 📘 Catat Uangku – API Route Documentation

Dokumentasi REST API untuk aplikasi **Catat Uangku**.

---

## 🌍 Base URL

| Lingkungan    | Base URL                            |
|---------------|--------------------------------------|
| 🧪 Development | `http://localhost:3000/api`          |
| 🌐 Production  | `https://www.catatuangku.site/api`   |

---

## 🔐 Authentication Routes

**Base Path:** `/users`

| Method | Endpoint     | Description             | Auth | Request Body                                   | Response                                      |
|--------|--------------|-------------------------|------|------------------------------------------------|-----------------------------------------------|
| POST   | `/register`  | Register new user       | ❌   | `{ name, email, password }`                    | `{ message: "Registrasi berhasil" }`          |
| POST   | `/login`     | Login and get token     | ❌   | `{ email, password }`                          | `{ message: "Login berhasil", token: "..." }` |

---

## 👤 Profile Routes

**Base Path:** `/profile`

| Method | Endpoint | Description              | Auth | Request Body            | Response                          |
|--------|----------|--------------------------|------|--------------------------|-----------------------------------|
| GET    | `/`      | Get current user profile | ✅   | -                        | `{ name, email, _id }`            |
| PUT    | `/`      | Update user name         | ✅   | `{ name: "New Name" }`   | `{ message, updatedProfile }`     |

---

## 💼 Wallet Routes

**Base Path:** `/wallets`

| Method | Endpoint             | Description               | Auth | Request Body                            | Response                        |
|--------|----------------------|---------------------------|------|-----------------------------------------|---------------------------------|
| GET    | `/`                  | List user’s wallets       | ✅   | -                                       | `[ { _id, name, balance } ]`    |
| POST   | `/`                  | Create a wallet           | ✅   | `{ name: "My Wallet", balance: 50000 }` | `{ _id, name, balance }`        |
| PUT    | `/:id`               | Update a wallet           | ✅   | `{ name?, balance? }`                   | `{ message, wallet }`           |
| DELETE | `/:id`               | Delete wallet             | ✅   | -                                       | `{ message }`                   |
| GET    | `/:walletId/summary` | Wallet transaction stats  | ✅   | -                                       | `{ totalIncome, totalExpense }` |

---

## 📝 Notes (Transactions) Routes

**Base Path:** `/notes`

| Method | Endpoint             | Description               | Auth | Request Body                                           | Response                              |
|--------|----------------------|---------------------------|------|--------------------------------------------------------|----------------------------------------|
| POST   | `/`                  | Create note               | ✅   | `{ walletId, type, amount, category, date, note }`     | `{ message, transaction }`             |
| GET    | `/`                  | All notes                 | ✅   | (optional filters: `type`, `category`, `date range`)   | `[ ... ]`                              |
| GET    | `/wallet/:walletId` | Notes by wallet           | ✅   | -                                                      | `[ ... ]`                              |
| GET    | `/detail/:id`       | Detail of note            | ✅   | -                                                      | `{ transaction }`                      |
| PUT    | `/:id`              | Update note               | ✅   | `{ amount?, note?, category?, type?, date? }`          | `{ message, transaction }`             |
| DELETE | `/:id`              | Delete note               | ✅   | -                                                      | `{ message }`                          |
| GET    | `/summary`          | Summary report            | ✅   | (optional: `groupBy`, `walletId`)                      | `{ summary: [...], filters: {...} }`   |

---

## 📆 Planned Payment Routes

**Base Path:** `/planned-payments`

| Method | Endpoint              | Description                      | Auth | Request Body                                             | Response                          |
|--------|------------------------|----------------------------------|------|----------------------------------------------------------|-----------------------------------|
| POST   | `/`                    | Create planned payment           | ✅   | `{ wallet_id, title, amount, type, payment_date, ... }`  | `{ message, plannedPayment }`     |
| GET    | `/`                    | All planned payments             | ✅   | -                                                        | `[ ... ]`                          |
| GET    | `/:id`                 | Get by ID                        | ✅   | -                                                        | `{ plan, transactions }`          |
| PUT    | `/:id`                 | Update planned payment           | ✅   | `{ ...fields to update... }`                             | `{ message, plan }`               |
| DELETE | `/:id`                 | Delete planned payment           | ✅   | -                                                        | `{ message }`                     |
| POST   | `/:id/pay`             | Pay one planned payment          | ✅   | -                                                        | `{ message, transaction }`        |
| POST   | `/:id/cancel-payment`  | Cancel payment & rollback wallet | ✅   | -                                                        | `{ message, rollbackAmount }`     |

---

## 💰 Budget Routes

**Base Path:** `/budgets`

| Method | Endpoint    | Description             | Auth | Request Body                                          | Response                          |
|--------|-------------|-------------------------|------|-------------------------------------------------------|-----------------------------------|
| POST   | `/`         | Create new budget       | ✅   | `{ walletId, categories: [...], amount, period }`     | `{ message, budget }`             |
| GET    | `/`         | Get all budgets         | ✅   | -                                                     | `[ ... ]`                          |
| GET    | `/:id`      | Get budget by ID        | ✅   | -                                                     | `{ budget }`                       |
| PUT    | `/:id`      | Update budget           | ✅   | `{ amount?, categories?, period? }`                   | `{ message, updatedBudget }`      |
| DELETE | `/:id`      | Delete budget           | ✅   | -                                                     | `{ message }`                      |

---

## 📷 Scan Receipt Routes

**Base Path:** `/scan-receipt`

| Method | Endpoint | Description                     | Auth | Request Body                   | Response                                 |
|--------|----------|---------------------------------|------|--------------------------------|------------------------------------------|
| POST   | `/`      | Upload & scan receipt (image)   | ✅   | Form-Data with `image` field   | `{ amount, category, date, note }`       |

---

## 🔒 Auth Middleware

Semua endpoint (kecuali `/users/register` dan `/users/login`) dilindungi oleh middleware `authMiddleware`.

### Format Header

```http
Authorization: Bearer <your_token_here>
