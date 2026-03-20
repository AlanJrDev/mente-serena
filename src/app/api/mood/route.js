import getDb, { uuidv4 } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/mood — save a mood log entry
export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { mood, energy, notes } = await request.json();

    if (!mood || !energy) {
      return NextResponse.json({ error: 'Mood and energy are required' }, { status: 400 });
    }

    const db = getDb();
    const id = uuidv4(); // Keep id for the return statement

    // Save mood
    db.prepare('INSERT INTO mood_logs (id, user_id, mood, energy, notes) VALUES (?, ?, ?, ?, ?)')
      .run(id, userId, mood, energy, notes || null);

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('Mood POST error:', err);
    return NextResponse.json({ error: 'Failed to save mood log' }, { status: 500 });
  }
}

// GET /api/mood — fetch recent mood logs
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    
    const logs = db.prepare('SELECT mood, energy, notes, logged_at FROM mood_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 30')
      .all(userId);
    return NextResponse.json(logs);
  } catch (err) {
    console.error('Mood GET error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
