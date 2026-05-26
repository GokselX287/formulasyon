import { getDb } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO intervention_assignments
      (intervention_id, client_id, when_type, scheduled_date, duration_minutes,
       as_homework, note, outcome)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(
    Number(data.interventionId),
    Number(data.clientId),
    data.when ?? data.whenType ?? null,
    data.date ?? null,
    data.durationMinutes ?? null,
    data.asHomework ? 1 : 0,
    data.note ?? null,
    data.outcome ?? null,
  );

  // Increment use_count
  db.prepare(`UPDATE interventions SET use_count = use_count + 1 WHERE id = ?`).run(Number(data.interventionId));

  return Response.json({ ok: true, id: result.lastInsertRowid }, { status: 201 });
}
