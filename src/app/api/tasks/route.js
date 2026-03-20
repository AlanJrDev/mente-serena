import getDb, { uuidv4 } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/tasks — fetch all tasks
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const tasks = db
      .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY is_completed ASC, created_at DESC LIMIT 50')
      .all(userId);
    return NextResponse.json(tasks);
  } catch (err) {
    console.error('Tasks GET error:', err);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/tasks — create new task
export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, description } = await request.json();
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO tasks (id, user_id, title, description, is_completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, title, description, 0, now, now);

    return NextResponse.json({ id, title, description, is_completed: 0, created_at: now, updated_at: now });
  } catch (err) {
    console.error('Tasks POST error:', err);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// PATCH /api/tasks — toggle task completion
export async function PATCH(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { taskId, isCompleted } = await request.json();
    const db = getDb();

    db.prepare(
      'UPDATE tasks SET is_completed = ?, completed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).run(
      isCompleted ? 1 : 0,
      isCompleted ? new Date().toISOString() : null,
      new Date().toISOString(),
      taskId,
      userId
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Tasks PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
