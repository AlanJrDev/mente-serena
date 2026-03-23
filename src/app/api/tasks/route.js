import { sql, uuidv4 } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/tasks — fetch all tasks
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { rows } = await sql`
      SELECT * FROM tasks 
      WHERE user_id = ${userId} 
      ORDER BY is_completed ASC, created_at DESC 
      LIMIT 50
    `;

    return NextResponse.json(rows);
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
    const id = uuidv4();
    const now = new Date().toISOString();

    await sql`
      INSERT INTO tasks (id, user_id, title, description, is_completed, created_at, updated_at) 
      VALUES (${id}, ${userId}, ${title}, ${description}, 0, ${now}, ${now})
    `;

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
    const now = new Date().toISOString();
    const completedAt = isCompleted ? now : null;
    const completedValue = isCompleted ? 1 : 0;

    await sql`
      UPDATE tasks 
      SET is_completed = ${completedValue}, completed_at = ${completedAt}, updated_at = ${now} 
      WHERE id = ${taskId} AND user_id = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Tasks PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
