const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authenticationRoutes');
const userProfileRoutes = require('./routes/profileRoutes');
const walletRoutes = require('./routes/walletRoutes');
const noteRoutes = require('./routes/noteRoutes');
const plannedPaymentRoutes = require('./routes/plannedPaymentRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const scanReceipt = require('./routes/scanRoutes');
const voiceReceipt = require('./routes/voiceRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


// List Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', userProfileRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/planned-payments', plannedPaymentRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/scan-receipt', scanReceipt);
app.use('/api/voice-receipt', voiceReceipt);
app.use('/api/subscribe', subscriptionRoutes);

// // Tambahkan ini untuk menangani redirect dari Midtrans ke aplikasi mobile kamu:
app.get('/payment-success', (req, res) => {
  res.redirect('catatuangku://payment-success');
});

app.get('/payment-failed', (req, res) => {
  res.redirect('catatuangku://payment-failed');
});

app.get('/payment-error', (req, res) => {
  res.redirect('catatuangku://payment-error');
});

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
