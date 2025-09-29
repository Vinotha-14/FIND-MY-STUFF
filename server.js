// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect DB
connectDB().catch(err => {
  console.error('DB connection failed', err);
  process.exit(1);
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// API
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);

// fallback
app.use((req, res) => res.status(404).send({ message: 'Not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));



const userRoutes = require('./routes/User');
app.use('/api/user', userRoutes);
