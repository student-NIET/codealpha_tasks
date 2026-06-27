const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { db, nextId } = require('../db');

const router = express.Router();

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });

    if (username.length < 3)
      return res.status(400).json({ error: 'Username must be at least 3 characters' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existingUser = db.get('users').find(
      u => u.username === username.toLowerCase() || u.email === email.toLowerCase()
    ).value();

    if (existingUser)
      return res.status(409).json({ error: 'Username or email already taken' });

    const AVATAR_COLORS = [
      '#7c3aed', '#db2777', '#2563eb', '#059669',
      '#d97706', '#dc2626', '#7c3aed', '#0891b2'
    ];

    const hashed = bcrypt.hashSync(password, 10);
    const user = {
      id:           nextId('users'),
      username:     username.toLowerCase(),
      email:        email.toLowerCase(),
      password:     hashed,
      bio:          '',
      avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      created_at:   new Date().toISOString()
    };

    db.get('users').push(user).write();

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, bio: user.bio, avatar_color: user.avatar_color }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required' });

    const user = db.get('users').find(u => u.username === username.toLowerCase()).value();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = bcrypt.compareSync(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, bio: user.bio, avatar_color: user.avatar_color }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
