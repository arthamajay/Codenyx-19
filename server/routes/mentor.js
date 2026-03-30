const router = require('express').Router();
const User = require('../models/User');
const ChatSession = require('../models/ChatSession');
const authMiddleware = require('../middleware/auth');

const mentorGuard = [authMiddleware, (req, res, next) => {
  if (req.user?.role !== 'mentor') return res.status(403).json({ message: 'Mentor access required' });
  next();
}];

// GET mentor's own profile
router.get('/me', mentorGuard, async (req, res) => {
  try {
    const mentor = await User.findById(req.user.id).select('-password');
    res.json(mentor);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH update own status / bio
router.patch('/me', mentorGuard, async (req, res) => {
  try {
    const allowed = ['status', 'bio', 'specialties'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const mentor = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    res.json(mentor);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET mentor's chat sessions
router.get('/sessions', mentorGuard, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ volunteerName: req.user.name }).sort({ createdAt: -1 }).limit(50);
    res.json(sessions);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
