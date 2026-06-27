const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync(path.join(__dirname, '..', 'database.json'));
const db = low(adapter);

// ─── Default Schema ───────────────────────────────────────────────────────────
db.defaults({
  users:     [],
  posts:     [],
  comments:  [],
  likes:     [],
  followers: [],
  _counters: { users: 0, posts: 0, comments: 0, likes: 0, followers: 0 }
}).write();

// ─── Helper: Auto-increment IDs ───────────────────────────────────────────────
function nextId(table) {
  const counters = db.get('_counters');
  const current  = counters.get(table).value() || 0;
  const next     = current + 1;
  counters.set(table, next).write();
  return next;
}

console.log('✅ Database (lowdb/JSON) initialized.');

module.exports = { db, nextId };
