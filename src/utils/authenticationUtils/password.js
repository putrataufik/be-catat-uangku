const bcrypt = require('bcryptjs');

exports.hashPassword = async (plainPassword) => {
  return await bcrypt.hash(plainPassword, 10);
};

exports.comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
