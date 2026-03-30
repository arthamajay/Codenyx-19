const router = require('express').Router();
const Vent = require('../models/Vent');
const authMiddleware = require('../middleware/auth');

// Serialize vent so reactions Map becomes a plain object for the client
function serialize(vent) {
  const obj = vent.toObject({ virtuals: false });
  obj.reactions = Object.fromEntries(vent.reactions || []);
  return obj;
}

// GET all vents (newest first)
router.get('/', async (req, res) => {
  try {
    const vents = await Vent.find().sort({ createdAt: -1 }).limit(100);
    res.json(vents.map(serialize));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create vent (auth required)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { anon, color, mood, text, distress } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Text is required' });
    const vent = await Vent.create({
      anon, color, mood, text: text.trim(), distress: distress || 0,
      reactions: new Map([['🤍', 0], ['💜', 0], ['🌱', 0]]),
    });
    res.status(201).json(serialize(vent));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST react / un-react
router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const userId = req.user.id;
    const vent = await Vent.findById(req.params.id);
    if (!vent) return res.status(404).json({ message: 'Vent not found' });

    const alreadyReacted = vent.reactedBy.find(r => r.userId === userId && r.emoji === emoji);
    const current = vent.reactions.get(emoji) || 0;

    if (alreadyReacted) {
      vent.reactions.set(emoji, Math.max(0, current - 1));
      vent.reactedBy = vent.reactedBy.filter(r => !(r.userId === userId && r.emoji === emoji));
    } else {
      vent.reactions.set(emoji, current + 1);
      vent.reactedBy.push({ userId, emoji });
    }

    await vent.save();
    res.json(serialize(vent));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
