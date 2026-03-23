import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';

/**
 * Módulo de banco de dados usando Neon PostgreSQL via @vercel/postgres.
 * 
 * A variável de ambiente POSTGRES_URL (ou DATABASE_URL) é configurada 
 * automaticamente pela integração Neon no painel da Vercel.
 * 
 * Para desenvolvimento local, configure no .env.local:
 * POSTGRES_URL=postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
 */

// Função para inicializar o schema do banco de dados
async function ensureTablesExist() {
  try {
    // Criar tabela de usuários
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'Usuário',
        email TEXT UNIQUE,
        password_hash TEXT,
        avatar_emoji TEXT DEFAULT 'Sprout',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Criar tabela de mood_logs
    await sql`
      CREATE TABLE IF NOT EXISTS mood_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mood TEXT NOT NULL,
        energy INTEGER NOT NULL CHECK(energy BETWEEN 1 AND 10),
        notes TEXT,
        sleep_quality TEXT,
        gratitude TEXT,
        logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Criar tabela de messages
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK(role IN ('user', 'ai', 'system')),
        content TEXT NOT NULL,
        thinking TEXT,
        session_id TEXT DEFAULT 'default',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Criar tabela de tasks
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'geral',
        is_completed INTEGER DEFAULT 0,
        generated_by TEXT DEFAULT 'ai',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Criar índices
    await sql`CREATE INDEX IF NOT EXISTS idx_mood_user_date ON mood_logs(user_id, logged_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id, created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, created_at)`;

    // Criar usuário padrão se não existir
    const { rows } = await sql`SELECT id FROM users WHERE id = 'default_user'`;
    if (rows.length === 0) {
      await sql`INSERT INTO users (id, name, avatar_emoji) VALUES ('default_user', 'Você', 'Sprout')`;
      await seedDemoData();
    }

    console.log('✅ Database schema initialized successfully');
  } catch (e) {
    console.error('Erro na inicialização do banco:', e);
  }
}

async function seedDemoData() {
  const moods = ['feliz', 'calmo', 'neutro', 'ansioso', 'triste'];
  const energies = [8, 6, 5, 3, 2];

  for (let i = 0; i < moods.length; i++) {
    const id = uuidv4();
    const mood = moods[i];
    const energy = energies[i];
    const dayOffset = `${-i} days`;
    await sql`
      INSERT INTO mood_logs (id, user_id, mood, energy, notes, logged_at)
      VALUES (${id}, 'default_user', ${mood}, ${energy}, 'Dados iniciais', NOW() + ${dayOffset}::interval)
    `;
  }
}

// Dispara a criação das tabelas quando o módulo é importado pela primeira vez
let _initPromise = null;
function getInitPromise() {
  if (!_initPromise) {
    _initPromise = ensureTablesExist().catch(console.error);
  }
  return _initPromise;
}
getInitPromise();

// Exporta o objeto sql para uso nas rotas (tagged template literal)
export { sql, uuidv4 };
export default sql;