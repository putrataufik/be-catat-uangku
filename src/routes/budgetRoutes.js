// src/routes/budgetRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { createBudget, getBudgets, getBudgetById,updateBudgetById,deleteBudgetById } = require('../controllers/budgetController');

router.use(authMiddleware);

router.post('/',authMiddleware, createBudget);
router.get('/',authMiddleware, getBudgets);
router.get('/:id', authMiddleware, getBudgetById);         
router.put('/:id', authMiddleware, updateBudgetById);      
router.delete('/:id', authMiddleware, deleteBudgetById);   

module.exports = router;
