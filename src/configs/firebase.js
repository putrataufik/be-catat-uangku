const admin = require('firebase-admin');
const path = require('./serviceAccountKey.json');

const serviceAccount = require(path.resolve(__dirname, './serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
