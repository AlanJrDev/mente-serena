import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    let result;
    if (sessionId) {
      result = await sql`
        SELECT role, content, thinking, created_at, session_id 
        FROM messages 
        WHERE user_id = ${userId} AND session_id = ${sessionId} 
        ORDER BY created_at ASC 
        LIMIT 200
      `;
    } else {
      result = await sql`
        SELECT role, content, thinking, created_at, session_id 
        FROM messages 
        WHERE user_id = ${userId} 
        ORDER BY created_at ASC 
        LIMIT 500
      `;
    }

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Messages GET error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
