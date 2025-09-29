// routes/user.js
const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const User = require('../models/User');

// Middleware to check authentication
function authMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  next();
}

// Report Lost Item
router.post('/report', async (req, res) => {
  try {
    const { title, description, location, date, contact } = req.body;

    const newItem = new Item({ title, description, location, date, contact });
    await newItem.save();

    res.json({ message: 'Report submitted successfully!' }); // ✅ message sent to frontend
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while submitting report' });
  }
});


// Search Items
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const items = await Item.find({
      $or: [
        { title: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') }
      ]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Claim Item
router.post('/claim/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.status = 'claimed';
    await item.save();
    res.json({ message: 'Item claimed successfully', item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Settings (Get Profile)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
