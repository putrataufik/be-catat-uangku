const cron = require('node-cron');
const admin = require('../configs/firebase'); // pastikan sudah setup Firebase Admin SDK
const DeviceToken = require('../models/deviceTokenModel');

const sendDailyReminder = async () => {
  try {
    const tokens = await DeviceToken.find({ isActive: true }).select('token');

    if (tokens.length === 0) return;

    const message = {
      notification: {
        title: 'Catat Pengeluaran Hari Ini 💸',
        body: 'Jangan lupa catat pengeluaranmu hari ini di Catat Uangku!',
      }
    };

    const batch = tokens.map(({ token }) =>
      admin.messaging().send({ ...message, token })
    );

    await Promise.allSettled(batch);
    console.log(`[FCM] 🎯 Notifikasi dikirim ke ${tokens.length} pengguna`);
  } catch (error) {
    console.error('[FCM] ❌ Gagal kirim notifikasi:', error.message);
  }
};

// ✅ Untuk development: kirim tiap menit
cron.schedule('* * * * *', sendDailyReminder);

// Untuk production: setiap jam 20:00 WITA
// cron.schedule('0 20 * * *', sendDailyReminder);
