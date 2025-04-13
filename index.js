const app = require('./src/app');
const dotenv = require('dotenv');
const connectDB = require('./src/configs/db');

dotenv.config();
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
