import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const db = getDb();
    
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
