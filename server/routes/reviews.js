const router = require('express').Router();
const Review = require('../models/Review');
const User   = require('../models/User');
const authMiddleware = require('../middleware/auth');

// POST submit a review
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { sessionId, mentorId, mentorName, rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating 1-5 required' });

    // Upsert — one review per session
    const review = await Review.findOneAndUpdate(
      { sessionId },
      { userId: req.user.id, mentorId, mentorName, rating, comment: comment || '' },
      { upsert: true, new: true }
    );

    // Update mentor's average rating
    const allReviews = await Review.find({ mentorId });
    const avg = allReviews.reduce((a, b) => a + b.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(mentorId, { rating: Math.round(avg * 10) / 10 });

    res.status(201).json(review);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET reviews for a mentor
router.get('/mentor/:mentorId', async (req, res) => {
  try {
    const reviews = await Review.find({ mentorId: req.params.mentorId }).sort({ createdAt: -1 }).limit(20);
    res.json(reviews);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
