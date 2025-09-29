// routes/protected.js
const express = require('express');
const verifyToken = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /api/protected/me
router.get('/me', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

module.exports = router;
