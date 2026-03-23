import { sql, uuidv4 } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check if user already exists
    const { rows: existing } = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }

    const id = uuidv4();

    await sql`
      INSERT INTO users (id, name, email, password_hash) 
      VALUES (${id}, ${name}, ${email}, ${password})
    `;

    return NextResponse.json({ id, name, email });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
