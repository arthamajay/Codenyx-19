const router = require('express').Router();
const MoodLog = require('../models/MoodLog');
const authMiddleware = require('../middleware/auth');

// Helper: start of today in UTC
function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET today's logs for current user — returns which slots are done
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const logs = await MoodLog.find({
      userId: req.user.id,
      createdAt: { $gte: todayStart() },
    }).sort({ createdAt: 1 });
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST log mood for a slot
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { score, label, slot, note } = req.body;
    if (!slot) return res.status(400).json({ message: 'slot is required (morning/afternoon/evening)' });

    // Prevent duplicate slot for same day
    const existing = await MoodLog.findOne({
      userId: req.user.id,
      slot,
      createdAt: { $gte: todayStart() },
    });
    if (existing) return res.status(409).json({ message: `You already logged your ${slot} mood today.` });

    const log = await MoodLog.create({ userId: req.user.id, score, label, slot, note: note || '' });
    res.status(201).json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET mood history for current user (last 30 entries, oldest first for chart)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const logs = await MoodLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(logs.reverse());
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
