const router = require('express').Router();
const Clinic = require('../models/Clinic');
const authMiddleware = require('../middleware/auth');

// GET all clinics
router.get('/', async (req, res) => {
  try {
    const clinics = await Clinic.find();
    res.json(clinics);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST book a slot
router.post('/:id/book', authMiddleware, async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) return res.status(404).json({ message: 'Clinic not found' });
    if (clinic.status === 'full') return res.status(400).json({ message: 'No slots available' });
    if (clinic.slots > 0) {
      clinic.slots -= 1;
      if (clinic.slots === 0) clinic.status = 'wait';
      await clinic.save();
    }
    res.json({ message: 'Slot booked', clinic });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
