exports.validateNoteInput = ({ type, amount, category, date }) => {
  if (!['income', 'expense'].includes(type)) {
    return "Jenis catatan tidak valid";
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return "Jumlah harus berupa angka positif";
  }
  if (!category || typeof category !== 'string') {
    return "Kategori wajib diisi";
  }
  if (!date || isNaN(Date.parse(date))) {
    return "Tanggal tidak valid";
  }
  return null;
};
