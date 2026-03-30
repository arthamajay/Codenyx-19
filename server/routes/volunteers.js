const router = require('express').Router();
const User = require('../models/User');
const ChatSession = require('../models/ChatSession');
const authMiddleware = require('../middleware/auth');

// GET all active mentors (for the Help section)
router.get('/', async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor', isActive: true })
      .select('-password')
      .sort({ status: 1, sessions: -1 });
    res.json(mentors);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST save chat session + increment mentor session count
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { volunteerName, messages, escalated, duration } = req.body;
    const session = await ChatSession.create({ userId: req.user.id, volunteerName, messages, escalated, duration });
    await User.findOneAndUpdate({ name: volunteerName, role: 'mentor' }, { $inc: { sessions: 1 } });
    res.status(201).json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
