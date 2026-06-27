const express  = require('express');
const auth     = require('../middleware/auth');
const { db, nextId } = require('../db');

const router = express.Router();

// ─── Helper: safe user object (no password) ───────────────────────────────────
function safeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

function getStats(userId) {
  const posts_count     = db.get('posts').filter({ user_id: userId }).size().value();
  const followers_count = db.get('followers').filter({ following_id: userId }).size().value();
  const following_count = db.get('followers').filter({ follower_id: userId }).size().value();
  return { posts_count, followers_count, following_count };
}

// ─── GET /api/users/search?q= ─────────────────────────────────────────────────
router.get('/search', auth, (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json([]);

  const users = db.get('users')
    .filter(u => u.username.includes(q))
    .take(10)
    .value()
    .map(u => ({ ...safeUser(u), ...getStats(u.id) }));

  res.json(users);
});

// ─── GET /api/users/me ────────────────────────────────────────────────────────
router.get('/me', auth, (req, res) => {
  const user = db.get('users').find({ id: req.user.id }).value();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ ...safeUser(user), ...getStats(user.id) });
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
router.get('/:id', auth, (req, res) => {
  const user = db.get('users').find({ id: parseInt(req.params.id) }).value();
  if (!user) return res.status(404).json({ error: 'User not found' });

  const isFollowing = !!db.get('followers').find({
    follower_id: req.user.id,
    following_id: user.id
  }).value();

  res.json({ ...safeUser(user), ...getStats(user.id), is_following: isFollowing });
});

// ─── PUT /api/users/me ────────────────────────────────────────────────────────
router.put('/me', auth, (req, res) => {
  const { bio } = req.body;
  db.get('users').find({ id: req.user.id }).assign({ bio: bio || '' }).write();
  const updated = db.get('users').find({ id: req.user.id }).value();
  res.json({ ...safeUser(updated), ...getStats(updated.id) });
});

// ─── POST /api/users/:id/follow ───────────────────────────────────────────────
router.post('/:id/follow', auth, (req, res) => {
  const followingId = parseInt(req.params.id);
  if (followingId === req.user.id)
    return res.status(400).json({ error: "You can't follow yourself" });

  const target = db.get('users').find({ id: followingId }).value();
  if (!target) return res.status(404).json({ error: 'User not found' });

  const existing = db.get('followers').find({
    follower_id: req.user.id, following_id: followingId
  }).value();

  if (existing) return res.status(409).json({ error: 'Already following' });

  const follow = {
    id:           nextId('followers'),
    follower_id:  req.user.id,
    following_id: followingId,
    created_at:   new Date().toISOString()
  };
  db.get('followers').push(follow).write();

  res.status(201).json({ message: 'Followed successfully' });
});

// ─── DELETE /api/users/:id/follow ────────────────────────────────────────────
router.delete('/:id/follow', auth, (req, res) => {
  const followingId = parseInt(req.params.id);

  db.get('followers').remove({
    follower_id:  req.user.id,
    following_id: followingId
  }).write();

  res.json({ message: 'Unfollowed successfully' });
});

// ─── GET /api/users/:id/followers ─────────────────────────────────────────────
router.get('/:id/followers', auth, (req, res) => {
  const userId = parseInt(req.params.id);
  const followerIds = db.get('followers')
    .filter({ following_id: userId })
    .map('follower_id')
    .value();

  const users = followerIds.map(fid => {
    const u = db.get('users').find({ id: fid }).value();
    return u ? safeUser(u) : null;
  }).filter(Boolean);

  res.json(users);
});

// ─── GET /api/users/:id/following ─────────────────────────────────────────────
router.get('/:id/following', auth, (req, res) => {
  const userId = parseInt(req.params.id);
  const followingIds = db.get('followers')
    .filter({ follower_id: userId })
    .map('following_id')
    .value();

  const users = followingIds.map(fid => {
    const u = db.get('users').find({ id: fid }).value();
    return u ? safeUser(u) : null;
  }).filter(Boolean);

  res.json(users);
});

module.exports = router;
