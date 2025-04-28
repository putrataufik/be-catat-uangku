// src/routes/budgetRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { createBudget, getBudgets } = require('../controllers/budgetController');

router.use(authMiddleware);

router.post('/', createBudget);
router.get('/', getBudgets);

module.exports = router;
