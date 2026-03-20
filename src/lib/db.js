import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(process.cwd(), 'mente-serena.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  const database = db;

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT ('user_' || lower(hex(randomblob(8)))),
      name TEXT NOT NULL DEFAULT 'Usuário',
      email TEXT,
      password_hash TEXT,
      avatar_emoji TEXT DEFAULT 'Sprout',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mood_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mood TEXT NOT NULL,
      energy INTEGER NOT NULL CHECK(energy BETWEEN 1 AND 10),
      notes TEXT,
      sleep_quality TEXT,
      gratitude TEXT,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'ai', 'system')),
      content TEXT NOT NULL,
      thinking TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'geral',
      is_completed INTEGER DEFAULT 0,
      generated_by TEXT DEFAULT 'ai',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_mood_user_date ON mood_logs(user_id, logged_at);
    CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, created_at);
  `);

  // Ensure default user exists
  const defaultUser = database.prepare('SELECT id FROM users WHERE id = ?').get('default_user');
  if (!defaultUser) {
    database.prepare('INSERT INTO users (id, name, avatar_emoji) VALUES (?, ?, ?)').run(
      'default_user', 'Você', 'Sprout'
    );
  }

  // Ensure password_hash exists if upgrading from previous version
  try {
    database.exec('ALTER TABLE users ADD COLUMN password_hash TEXT;');
  } catch (e) {
    // Column might already exist
  }

  // Seed some initial mood data for the dashboard demo
  const moodCount = database.prepare('SELECT COUNT(*) as count FROM mood_logs WHERE user_id = ?').get('default_user');
  if (moodCount.count === 0) {
    seedDemoData(database);
  }
}

function seedDemoData(database) {
  const moods = ['feliz', 'calmo', 'neutro', 'ansioso', 'triste', 'calmo', 'feliz', 'feliz', 'neutro', 'calmo', 'feliz', 'energético', 'calmo', 'neutro'];
  const energies = [8, 6, 5, 3, 2, 7, 9, 7, 5, 6, 8, 9, 7, 5];
  const notes = [
    'Dia produtivo no trabalho',
    'Meditei por 15 minutos',
    'Dia normal, sem grandes eventos',
    'Muitas reuniões, me senti sobrecarregado',
    'Pouca energia hoje',
    'Caminhada no parque ajudou muito',
    'Recebi boas notícias!',
    'Dia com amigos, muito bom',
    'Rotina sem novidades',
    'Yoga pela manhã',
    'Projeto finalizado com sucesso',
    'Treino intenso, me senti ótimo!',
    'Leitura antes de dormir',
    'Dia preguiçoso mas tranquilo',
  ];

  const insertMood = database.prepare(`
    INSERT INTO mood_logs (id, user_id, mood, energy, notes, logged_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ? || ' days'))
  `);

  for (let i = 0; i < moods.length; i++) {
    insertMood.run(
      uuidv4(),
      'default_user',
      moods[i],
      energies[i],
      notes[i],
      String(-13 + i)
    );
  }

  // Seed tasks
  const seedTasks = [
    { title: 'Respiração 4-7-8', description: 'Pratique 3 ciclos de respiração: inspire por 4s, segure 7s, expire 8s. Ajuda a reduzir a ansiedade.', category: 'respiração' },
    { title: 'Caminhada de 15 minutos', description: 'Saia para uma caminhada leve ao ar livre. O exercício e a luz natural melhoram o humor.', category: 'exercício' },
    { title: 'Escreva 3 gratidões', description: 'Liste 3 coisas pelas quais você é grato hoje. Pode ser simples como "o café da manhã".', category: 'reflexão' },
  ];

  const insertTask = database.prepare(`
    INSERT INTO tasks (id, user_id, title, description, category, generated_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const task of seedTasks) {
    insertTask.run(uuidv4(), 'default_user', task.title, task.description, task.category, 'ai');
  }
}

export default getDb;
export { uuidv4 };
