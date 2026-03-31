const router      = require('express').Router();
const MoodLog     = require('../models/MoodLog');
const ChatSession = require('../models/ChatSession');
const Journal     = require('../models/Journal');
const authMiddleware = require('../middleware/auth');

// Compute distress score 0–10
function computeDistress({ avgMoodThisWeek, escalations, daysSinceLastCheckin, checkinStreak }) {
  let score = 0;
  // Low mood = higher distress (mood is 1-5, so 5-avg gives 0-4)
  if (avgMoodThisWeek !== null) score += (5 - avgMoodThisWeek) * 1.5;
  // Any escalation history
  if (escalations > 0) score += Math.min(escalations * 1.5, 3);
  // Disengagement — not checked in for a while
  if (daysSinceLastCheckin > 14) score += 2;
  else if (daysSinceLastCheckin > 7) score += 1;
  // Low streak = inconsistent engagement
  if (checkinStreak === 0) score += 0.5;
  return Math.min(Math.round(score * 10) / 10, 10);
}

function distressLevel(score) {
  if (score <= 2)  return { label: 'Stable',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   dot: '#22c55e' };
  if (score <= 5)  return { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  dot: '#f59e0b' };
  return               { label: 'High Risk', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   dot: '#f43f5e' };
}

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const now    = new Date();

    // ── Mood logs ────────────────────────────────────────────────────────────
    const moodLogs = await MoodLog.find({ userId }).sort({ createdAt: 1 }).limit(90);
    const scores   = moodLogs.map(m => m.score);

    const thisWeekLogs = moodLogs.filter(m => (now - new Date(m.createdAt)) < 7 * 86400000);
    const lastWeekLogs = moodLogs.filter(m => {
      const age = now - new Date(m.createdAt);
      return age >= 7 * 86400000 && age < 14 * 86400000;
    });

    const avg = arr => arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;
    const avgThis = avg(thisWeekLogs.map(m => m.score));
    const avgLast = avg(lastWeekLogs.map(m => m.score));
    const lowest  = scores.length ? +Math.min(...scores).toFixed(1) : null;

    // Trend
    let trend = 'Not enough data';
    if (avgThis !== null && avgLast !== null) {
      const diff = avgThis - avgLast;
      trend = diff > 0.3 ? '↑ Improving' : diff < -0.3 ? '↓ Declining' : '→ Stable';
    }

    // Checkin streak (consecutive days with at least one log)
    let streak = 0;
    const logDays = new Set(moodLogs.map(m => new Date(m.createdAt).toDateString()));
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (logDays.has(d.toDateString())) streak++;
      else break;
    }

    // Days since last checkin
    const lastLog = moodLogs[moodLogs.length - 1];
    const daysSinceLastCheckin = lastLog
      ? Math.floor((now - new Date(lastLog.createdAt)) / 86400000)
      : 999;

    // Mood frequency by slot
    const slotCounts = { morning: 0, afternoon: 0, evening: 0 };
    moodLogs.forEach(m => { if (slotCounts[m.slot] !== undefined) slotCounts[m.slot]++; });

    // ── Chat sessions ────────────────────────────────────────────────────────
    const sessions   = await ChatSession.find({ userId }).sort({ createdAt: -1 }).limit(20);
    const escalations = sessions.filter(s => s.escalated).length;
    const totalMins  = sessions.reduce((a, s) => a + (s.duration || 0), 0);

    // ── Journal ──────────────────────────────────────────────────────────────
    const journals = await Journal.find({ userId }).sort({ createdAt: -1 }).limit(5);

    // ── Distress score ───────────────────────────────────────────────────────
    const distressScore = computeDistress({ avgMoodThisWeek: avgThis, escalations, daysSinceLastCheckin, checkinStreak: streak });
    const level = distressLevel(distressScore);

    // ── Recurring mood themes ────────────────────────────────────────────────
    const moodFreq = {};
    moodLogs.forEach(m => { if (m.label) moodFreq[m.label] = (moodFreq[m.label] || 0) + 1; });
    const topMoods = Object.entries(moodFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([label, count]) => ({ label, count }));

    // ── Activity timeline ────────────────────────────────────────────────────
    const timeline = [];
    sessions.slice(0, 5).forEach(s => timeline.push({
      icon: s.escalated ? '🆘' : '🤝',
      title: `${s.escalated ? 'Crisis session' : 'Support chat'} with ${s.volunteerName}`,
      sub: `${s.duration || 0} min · ${s.messages?.length || 0} messages${s.escalated ? ' · Escalated' : ''}`,
      date: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      type: s.escalated ? 'crisis' : 'chat',
    }));
    journals.forEach(j => timeline.push({
      icon: '📔',
      title: j.title || 'Journal entry',
      sub: j.mood ? `Mood: ${j.emoji || ''} ${j.mood}` : 'Personal reflection',
      date: new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      type: 'journal',
    }));
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      // Mood data
      moodLogs: moodLogs.map(m => ({ score: m.score, slot: m.slot, date: m.createdAt, label: m.label })),
      stats: { avgThis, avgLast, lowest, trend, streak, daysSinceLastCheckin, slotCounts },
      topMoods,

      // Distress
      distressScore,
      distressLevel: level,

      // Activity
      sessionCount:  sessions.length,
      escalations,
      totalMins,
      journalCount:  journals.length,
      timeline:      timeline.slice(0, 10),

      // Engagement
      totalCheckins: moodLogs.length,
      lastActive:    lastLog ? lastLog.createdAt : null,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
