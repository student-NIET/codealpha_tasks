const express  = require('express');
const auth     = require('../middleware/auth');
const { db, nextId } = require('../db');

const router = express.Router({ mergeParams: true });

// ─── GET /api/posts/:postId/comments ─────────────────────────────────────────
router.get('/', auth, (req, res) => {
  const postId = parseInt(req.params.postId);

  const comments = db.get('comments')
    .filter({ post_id: postId })
    .orderBy('created_at', 'asc')
    .value()
    .map(c => {
      const user = db.get('users').find({ id: c.user_id }).value();
      return {
        ...c,
        author: user ? { id: user.id, username: user.username, avatar_color: user.avatar_color } : null
      };
    });

  res.json(comments);
});

// ─── POST /api/posts/:postId/comments ────────────────────────────────────────
router.post('/', auth, (req, res) => {
  const postId = parseInt(req.params.postId);
  const { content } = req.body;

  if (!content || content.trim().length === 0)
    return res.status(400).json({ error: 'Comment cannot be empty' });

  const post = db.get('posts').find({ id: postId }).value();
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = {
    id:         nextId('comments'),
    post_id:    postId,
    user_id:    req.user.id,
    content:    content.trim(),
    created_at: new Date().toISOString()
  };

  db.get('comments').push(comment).write();

  const user = db.get('users').find({ id: req.user.id }).value();
  res.status(201).json({
    ...comment,
    author: { id: user.id, username: user.username, avatar_color: user.avatar_color }
  });
});

module.exports = router;
