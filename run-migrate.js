const getDb = require('./src/lib/db').default;
const db = getDb();
try {
  db.prepare('ALTER TABLE messages ADD COLUMN session_id TEXT DEFAULT "default"').run();
  console.log('Migration successful: Added session_id to messages');
} catch (e) {
  console.log('Migration error or already exists:', e.message);
}
