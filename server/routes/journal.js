const router = require('express').Router();
const Journal = require('../models/Journal');
const authMiddleware = require('../middleware/auth');

// GET all journal entries for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const entries = await Journal.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(entries);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create journal entry
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, mood, emoji } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content is required' });
    const entry = await Journal.create({ userId: req.user.id, title: title || '', content: content.trim(), mood: mood || '', emoji: emoji || '' });
    res.status(201).json(entry);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE journal entry
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const entry = await Journal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!entry) return res.status(404).json({ message: 'Not found' });
    await entry.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
