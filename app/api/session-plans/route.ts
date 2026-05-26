import { getDb } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO session_plans
      (client_id, session_length, items_json, homework, next_focus, is_template)
    VALUES (?,?,?,?,?,0)
  `).run(
    data.clientId ? Number(data.clientId) : null,
    data.sessionLength ?? 50,
    data.items ? JSON.stringify(data.items) : null,
    data.homework ?? null,
    data.nextFocus ?? null,
  );

  return Response.json({ ok: true, id: result.lastInsertRowid }, { status: 201 });
}
