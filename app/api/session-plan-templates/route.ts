import { getDb } from '@/lib/db';
import { ownerOr401 } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const data = await request.json();
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO session_plans
      (client_id, session_length, items_json, homework, next_focus, is_template, owner_id)
    VALUES (?,?,?,?,?,1,?)
  `).run(
    data.clientId ? Number(data.clientId) : null,
    data.sessionLength ?? 50,
    data.items ? JSON.stringify(data.items) : null,
    data.homework ?? null,
    data.nextFocus ?? null,
    uid,
  );

  return Response.json({ ok: true, id: result.lastInsertRowid }, { status: 201 });
}
