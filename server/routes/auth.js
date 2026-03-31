const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

const sign = (user) =>
  jwt.sign(
    { id: user._id, name: user.name, username: user.username, role: user.role, age: user.age },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// Only expose safe fields — never email
const publicUser = (u) => ({
  id:         u._id.toString(),
  name:       u.name,
  username:   u.username,
  role:       u.role,
  age:        u.age,
  specialties: u.specialties,
  bio:        u.bio,
  status:     u.status,
  sessions:   u.sessions,
  rating:     u.rating,
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, age, role } = req.body;
    if (!name || !username || !email || !password)
      return res.status(400).json({ message: 'Name, username, email and password are required' });

    // Validate username format
    if (!/^[a-z0-9_]{3,20}$/.test(username.toLowerCase()))
      return res.status(400).json({ message: 'Username must be 3–20 characters, letters/numbers/underscore only' });

    const emailExists    = await User.findOne({ email });
    if (emailExists) return res.status(409).json({ message: 'Email already registered' });

    const usernameExists = await User.findOne({ username: username.toLowerCase() });
    if (usernameExists) return res.status(409).json({ message: 'Username already taken' });

    const user = await User.create({ name, username: username.toLowerCase(), email, password, age: age || 0, role: role || 'user' });
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/auth/login — accepts username or email
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body; // 'login' = username or email
    if (!login || !password) return res.status(400).json({ message: 'Username/email and password required' });

    // Try username first, then email
    const user = await User.findOne({
      $or: [{ username: login.toLowerCase() }, { email: login.toLowerCase() }]
    });

    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Incorrect username or password' });
    if (user.isActive === false)
      return res.status(403).json({ message: 'Your account has been deactivated. Contact the admin.' });

    res.json({ token: sign(user), user: publicUser(user) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const exists = await User.findOne({ username: req.params.username.toLowerCase() });
    res.json({ available: !exists });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
