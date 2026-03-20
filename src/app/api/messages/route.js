import getDb, { uuidv4 } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    let messages;
    if (sessionId) {
      messages = db
        .prepare('SELECT role, content, thinking, created_at, session_id FROM messages WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC LIMIT 200')
        .all(userId, sessionId);
    } else {
      messages = db
        .prepare('SELECT role, content, thinking, created_at, session_id FROM messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 500')
        .all(userId);
    }

    return NextResponse.json(messages);
  } catch (err) {
    console.error('Messages GET error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
