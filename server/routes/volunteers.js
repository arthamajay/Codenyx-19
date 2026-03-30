const router = require('express').Router();
const Volunteer = require('../models/Volunteer');
const ChatSession = require('../models/ChatSession');
const authMiddleware = require('../middleware/auth');

// GET all volunteers
router.get('/', async (req, res) => {
  try {
    const volunteers = await Volunteer.find().sort({ status: 1, sessions: -1 });
    res.json(volunteers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST save chat session
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { volunteerName, messages, escalated, duration } = req.body;
    const session = await ChatSession.create({ userId: req.user.id, volunteerName, messages, escalated, duration });
    // Increment volunteer session count
    await Volunteer.findOneAndUpdate({ name: volunteerName }, { $inc: { sessions: 1 } });
    res.status(201).json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
