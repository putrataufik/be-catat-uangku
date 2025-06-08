const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});
console.log('midtrans server key :', process.env.MIDTRANS_SERVER_KEY);
console.log('midtrans client key :', process.env.MIDTRANS_CLIENT_KEY);

module.exports = snap;
