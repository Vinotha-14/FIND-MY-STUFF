// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000
};

function createToken(user) {
  return jwt.sign({ id: user._id.toString(), roles: user.roles }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
}

// Register user
router.post('/register/user', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email, password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({ name, email, passwordHash, roles: ['User'] });
    await user.save();

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Register admin (requires ADMIN_SECRET)
router.post('/register/admin', async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;
    if (!name || !email || !password || !adminSecret) return res.status(400).json({ message: 'name,email,password,adminSecret required' });
    if (adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ message: 'Invalid admin secret' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({ name, email, passwordHash, roles: ['Admin'] });
    await user.save();

    return res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Login User (updates lastLogin)
router.post('/login/user', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email & password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    // ensure has User role
    if (!user.roles.includes('User') && !user.roles.includes('Admin')) {
      return res.status(403).json({ message: 'This account does not have User role' });
    }

    // create token and set cookie
    const token = createToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);

    // update lastLogin (this writes to DB on login)
    user.lastLogin = new Date();
    await user.save();

    return res.json({ message: 'Logged in successfully (User)' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Login Admin (updates lastLogin)
router.post('/login/admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email & password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.roles.includes('Admin')) return res.status(403).json({ message: 'This account does not have Admin role' });

    const token = createToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);

    user.lastLogin = new Date();
    await user.save();

    return res.json({ message: 'Logged in successfully (Admin)' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ message: 'Logged out' });
});

// Forgot password — creates reset token and returns resetUrl in dev
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });

    const user = await User.findOne({ email });
    if (!user) {
      // avoid revealing existence
      return res.json({ message: 'If that email exists you will receive a reset link' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
    const html = `<p>To reset your password click the link below (valid 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;

    await sendEmail(email, 'Password reset', html);

    // 🚀 Dev mode: send resetUrl as "redirect"
    // In dev, return direct redirect instead of just showing URL
if (process.env.NODE_ENV !== 'production') {
  return res.json({ redirect: resetUrl });
}


    return res.json({ message: 'If that email exists you will receive a reset link' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'password required' });

    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: 'Password has been reset. You can now login.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;