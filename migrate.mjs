import Database from 'better-sqlite3';

const db = new Database('./mente-serena.db');
try {
  db.prepare('ALTER TABLE messages ADD COLUMN session_id TEXT DEFAULT "default"').run();
  console.log('Added session_id!');
} catch(e) {
  console.log(e.message);
}
