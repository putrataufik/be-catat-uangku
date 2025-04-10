// Dummy data
let users = [
    { id: 1, name: 'Andi', email: 'andi@mail.com' },
    { id: 2, name: 'Budi', email: 'budi@mail.com' },
  ];
  
  exports.getAllUsers = (req, res) => {
    res.json(users);
  };
  
  exports.getUserById = (req, res) => {
    const user = users.find(u => u.id == req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User tidak ditemukan' });
    }
  };
  
  exports.createUser = (req, res) => {
    const { name, email } = req.body;
    const newUser = { id: Date.now(), name, email };
    users.push(newUser);
    res.status(201).json(newUser);
  };
  
  exports.updateUser = (req, res) => {
    const { name, email } = req.body;
    const user = users.find(u => u.id == req.params.id);
    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      res.json(user);
    } else {
      res.status(404).json({ message: 'User tidak ditemukan' });
    }
  };
  
  exports.deleteUser = (req, res) => {
    users = users.filter(u => u.id != req.params.id);
    res.json({ message: 'User dihapus' });
  };
  