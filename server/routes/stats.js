const router = require('express').Router();
const User = require('../models/User');
const Vent = require('../models/Vent');
const Clinic = require('../models/Clinic');

router.get('/', async (req, res) => {
  try {
    const [totalUsers, ventsToday, availableMentors, openClinics] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Vent.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
      User.countDocuments({ role: 'mentor', status: 'available', isActive: true }),
      Clinic.aggregate([{ $group: { _id: null, slots: { $sum: '$slots' } } }]),
    ]);
    res.json({
      users: totalUsers,
      ventsToday,
      volunteers: availableMentors,
      slots: openClinics[0]?.slots || 0,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
