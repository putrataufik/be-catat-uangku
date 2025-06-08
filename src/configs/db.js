const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MONGO URL KEY:", process.env.MONGO_URI);
    console.log('MongoDB terhubung');
  } catch (err) {
    console.error('Gagal koneksi MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
