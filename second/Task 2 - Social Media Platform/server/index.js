require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use((req, res, next) => { res.setHeader('Connection', 'close'); next(); });
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/users',   require('./routes/users'));
app.use('/api/posts',   require('./routes/posts'));

// Nested: comments + likes under /api/posts/:postId
app.use('/api/posts/:postId/comments', require('./routes/comments'));
app.use('/api/posts/:postId/like',     require('./routes/likes'));

// ─── Catch-all: serve frontend ────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Social Media Platform running at http://localhost:${PORT}`);
  console.log(`   Frontend: http://localhost:${PORT}`);
  console.log(`   API:      http://localhost:${PORT}/api\n`);
});
