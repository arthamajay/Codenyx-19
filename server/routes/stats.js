const router = require('express').Router();
const User = require('../models/User');
const Vent = require('../models/Vent');
const Volunteer = require('../models/Volunteer');
const Clinic = require('../models/Clinic');

// GET live stats
router.get('/', async (req, res) => {
  try {
    const [totalUsers, ventsToday, availableVolunteers, openClinics] = await Promise.all([
      User.countDocuments(),
      Vent.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
      Volunteer.countDocuments({ status: 'available' }),
      Clinic.aggregate([{ $group: { _id: null, slots: { $sum: '$slots' } } }]),
    ]);
    res.json({
      users: totalUsers,
      ventsToday,
      volunteers: availableVolunteers,
      slots: openClinics[0]?.slots || 0,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
