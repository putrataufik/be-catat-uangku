exports.validateName = (name) => {
  return name.length >= 4;
};

exports.validatePassword = (password) => {
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return regex.test(password);
};
