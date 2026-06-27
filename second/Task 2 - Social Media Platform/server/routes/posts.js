const express  = require('express');
const auth     = require('../middleware/auth');
const { db, nextId } = require('../db');

const router = express.Router();

// ─── Helper: enrich post with user, likes, comment count ─────────────────────
function enrichPost(post, currentUserId) {
  const user = db.get('users').find({ id: post.user_id }).value();
  const likes_count   = db.get('likes').filter({ post_id: post.id }).size().value();
  const comment_count = db.get('comments').filter({ post_id: post.id }).size().value();
  const is_liked      = !!db.get('likes').find({ post_id: post.id, user_id: currentUserId }).value();

  return {
    ...post,
    author: user ? { id: user.id, username: user.username, avatar_color: user.avatar_color } : null,
    likes_count,
    comment_count,
    is_liked
  };
}

// ─── GET /api/posts/feed ──────────────────────────────────────────────────────
router.get('/feed', auth, (req, res) => {
  const followingIds = db.get('followers')
    .filter({ follower_id: req.user.id })
    .map('following_id')
    .value();

  // Include own posts + followed users' posts
  const relevantIds = [req.user.id, ...followingIds];

  const posts = db.get('posts')
    .filter(p => relevantIds.includes(p.user_id))
    .orderBy('created_at', 'desc')
    .value()
    .map(p => enrichPost(p, req.user.id));

  res.json(posts);
});

// ─── GET /api/posts/explore ───────────────────────────────────────────────────
router.get('/explore', auth, (req, res) => {
  const posts = db.get('posts')
    .orderBy('created_at', 'desc')
    .take(50)
    .value()
    .map(p => enrichPost(p, req.user.id));

  res.json(posts);
});

// ─── GET /api/users/:id/posts ─────────────────────────────────────────────────
router.get('/user/:userId', auth, (req, res) => {
  const userId = parseInt(req.params.userId);
  const posts = db.get('posts')
    .filter({ user_id: userId })
    .orderBy('created_at', 'desc')
    .value()
    .map(p => enrichPost(p, req.user.id));

  res.json(posts);
});

// ─── POST /api/posts ──────────────────────────────────────────────────────────
router.post('/', auth, (req, res) => {
  const { content } = req.body;

  if (!content || content.trim().length === 0)
    return res.status(400).json({ error: 'Post content cannot be empty' });

  if (content.length > 500)
    return res.status(400).json({ error: 'Post cannot exceed 500 characters' });

  const post = {
    id:         nextId('posts'),
    user_id:    req.user.id,
    content:    content.trim(),
    created_at: new Date().toISOString()
  };

  db.get('posts').push(post).write();
  res.status(201).json(enrichPost(post, req.user.id));
});

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────
router.delete('/:id', auth, (req, res) => {
  const postId = parseInt(req.params.id);
  const post = db.get('posts').find({ id: postId }).value();

  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  db.get('posts').remove({ id: postId }).write();
  db.get('comments').remove({ post_id: postId }).write();
  db.get('likes').remove({ post_id: postId }).write();

  res.json({ message: 'Post deleted' });
});

module.exports = router;
