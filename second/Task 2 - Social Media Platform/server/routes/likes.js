const express  = require('express');
const auth     = require('../middleware/auth');
const { db, nextId } = require('../db');

const router = express.Router({ mergeParams: true });

// ─── POST /api/posts/:postId/like ─────────────────────────────────────────────
router.post('/', auth, (req, res) => {
  const postId = parseInt(req.params.postId);

  const post = db.get('posts').find({ id: postId }).value();
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const existing = db.get('likes').find({ post_id: postId, user_id: req.user.id }).value();
  if (existing) return res.status(409).json({ error: 'Already liked' });

  db.get('likes').push({
    id:      nextId('likes'),
    post_id: postId,
    user_id: req.user.id
  }).write();

  const likes_count = db.get('likes').filter({ post_id: postId }).size().value();
  res.status(201).json({ liked: true, likes_count });
});

// ─── DELETE /api/posts/:postId/like ──────────────────────────────────────────
router.delete('/', auth, (req, res) => {
  const postId = parseInt(req.params.postId);

  db.get('likes').remove({ post_id: postId, user_id: req.user.id }).write();

  const likes_count = db.get('likes').filter({ post_id: postId }).size().value();
  res.json({ liked: false, likes_count });
});

module.exports = router;
