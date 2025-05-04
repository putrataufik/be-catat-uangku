const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes')
const walletRoutes = require('./routes/walletRoutes')
const transactionRoutes = require('./routes/transactionRoutes');
const plannedPaymentRoutes = require('./routes/plannedPaymentRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const scanReceipt = require('./routes/scanRoutes');

const app = express();

app.use(cors());
app.use(express.json());

//list Routes
app.use('/api/users', userRoutes);
app.use('/api/profile', userProfileRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/planned-payments', plannedPaymentRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/scan-receipt', scanReceipt)


// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // tambahkan ini
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});


module.exports = app;
