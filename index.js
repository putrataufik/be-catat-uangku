// ✅ Panggil dotenv dulu SEBELUM import lainnya
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/configs/db');
const midtrans = require('./src/configs/midtrans');

connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
