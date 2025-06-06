// src/routes/noteRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createNote, 
  getNotesByWallet, 
  deleteNote, 
  updateNote, 
  getAllNotes,
  getNoteById,
  getNoteSummary,
} = require('../controllers/noteController'); // Ganti nama file controller jika belum
const authMiddleware = require('../middlewares/authMiddleware');

// Buat catatan baru
router.post('/', authMiddleware, createNote);

// Ambil semua catatan milik user (support filter: type, category, tanggal)
router.get('/', authMiddleware, getAllNotes);

// Ambil semua catatan berdasarkan walletId
router.get('/wallet/:walletId', authMiddleware, getNotesByWallet);

// Ambil detail catatan berdasarkan id
router.get('/detail/:id', authMiddleware, getNoteById);

// Update catatan
router.put('/:id', authMiddleware, updateNote);

// Hapus catatan
router.delete('/:id', authMiddleware, deleteNote);

// Summary catatan (total amount + count)
router.get('/summary', authMiddleware, getNoteSummary);

module.exports = router;
