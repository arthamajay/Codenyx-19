const router = require('express').Router();
const User = require('../models/User');
const Vent = require('../models/Vent');
const MoodLog = require('../models/MoodLog');
const ChatSession = require('../models/ChatSession');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const bcrypt = require('bcryptjs');

const guard = [authMiddleware, adminMiddleware];

// ── DASHBOARD STATS ──────────────────────────────────────────────────────────
router.get('/stats', guard, async (req, res) => {
  try {
    const [totalUsers, totalMentors, totalVents, totalSessions, recentVents] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'mentor' }),
      Vent.countDocuments(),
      ChatSession.countDocuments(),
      Vent.find({ distress: { $gt: 0.7 } }).sort({ createdAt: -1 }).limit(5),
    ]);
    res.json({ totalUsers, totalMentors, totalVents, totalSessions, highDistressVents: recentVents });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── MENTOR MANAGEMENT ────────────────────────────────────────────────────────

// GET all mentors
router.get('/mentors', guard, async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor' }).select('-password').sort({ createdAt: -1 });
    res.json(mentors);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create mentor (admin only)
router.post('/mentors', guard, async (req, res) => {
  try {
    const { name, email, password, age, specialties, bio } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const mentor = await User.create({
      name, email, password, age: age || 25, role: 'mentor',
      specialties: specialties || [], bio: bio || '',
      status: 'available', sessions: 0, rating: 5.0,
    });
    const m = mentor.toObject(); delete m.password;
    res.status(201).json(m);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH update mentor (specialties, bio, status, isActive)
router.patch('/mentors/:id', guard, async (req, res) => {
  try {
    const allowed = ['name', 'specialties', 'bio', 'status', 'isActive', 'rating'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const mentor = await User.findOneAndUpdate({ _id: req.params.id, role: 'mentor' }, update, { new: true }).select('-password');
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
    res.json(mentor);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE mentor
router.delete('/mentors/:id', guard, async (req, res) => {
  try {
    await User.findOneAndDelete({ _id: req.params.id, role: 'mentor' });
    res.json({ message: 'Mentor removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── USER MANAGEMENT ──────────────────────────────────────────────────────────

// GET all users
router.get('/users', guard, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 }).limit(100);
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH toggle user active status
router.patch('/users/:id', guard, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'user' }, { isActive: req.body.isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── VENTS (admin view) ───────────────────────────────────────────────────────
router.get('/vents', guard, async (req, res) => {
  try {
    const vents = await Vent.find().sort({ createdAt: -1 }).limit(100);
    res.json(vents.map(v => {
      const obj = v.toObject();
      obj.reactions = Object.fromEntries(v.reactions || []);
      return obj;
    }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE vent (admin moderation)
router.delete('/vents/:id', guard, async (req, res) => {
  try {
    await Vent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vent removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
