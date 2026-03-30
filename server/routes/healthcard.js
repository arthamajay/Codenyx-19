const router = require('express').Router();
const MoodLog = require('../models/MoodLog');
const ChatSession = require('../models/ChatSession');
const Vent = require('../models/Vent');
const authMiddleware = require('../middleware/auth');

// GET full health card data for current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Mood logs last 30
    const moodLogs = await MoodLog.find({ userId }).sort({ createdAt: 1 }).limit(30);

    // Chat sessions
    const sessions = await ChatSession.find({ userId }).sort({ createdAt: -1 }).limit(10);

    // User's own vents (by userId stored in anon field — we track via sessions)
    const recentVents = await Vent.find().sort({ createdAt: -1 }).limit(100);

    // Build history from sessions + mood logs
    const history = [];
    sessions.forEach(s => {
      history.push({
        icon: s.escalated ? '🆘' : '🤝',
        title: `${s.escalated ? 'SOS session' : 'Volunteer chat'} with ${s.volunteerName}`,
        sub: `${s.duration || 0} min session`,
        date: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    });
    moodLogs.slice(-5).reverse().forEach(m => {
      history.push({
        icon: '📊',
        title: `Mood logged: ${m.label || m.score + '/10'}`,
        sub: 'Daily check-in',
        date: new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    });

    // Mood stats
    const scores = moodLogs.map(m => m.score);
    const thisWeek = scores.slice(-7);
    const lastWeek = scores.slice(-14, -7);
    const avgThis = thisWeek.length ? (thisWeek.reduce((a,b) => a+b, 0) / thisWeek.length).toFixed(1) : null;
    const avgLast = lastWeek.length ? (lastWeek.reduce((a,b) => a+b, 0) / lastWeek.length).toFixed(1) : null;
    const lowest = scores.length ? Math.min(...scores).toFixed(1) : null;
    const trend = avgThis && avgLast ? (parseFloat(avgThis) > parseFloat(avgLast) ? '↑ Improving' : '↓ Declining') : 'Not enough data';

    res.json({
      moodLogs: moodLogs.map(m => ({ score: m.score, date: m.createdAt })),
      history: history.slice(0, 10),
      stats: { avgThis, avgLast, lowest, trend },
      sessionCount: sessions.length,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
