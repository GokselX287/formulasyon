import { getDb } from '@/lib/db';
import { NextRequest } from 'next/server';

function toPanel(r: Record<string, any>) {
  return {
    id:                 r.id,
    noteNo:             r.note_no       ?? String(r.id),
    date:               r.date          ?? '',
    caseCode:           r.case_code     ?? '',
    topic:              r.topic         ?? '',
    supervisorName:     r.supervisor_name    ?? '',
    therapistInitials:  r.therapist_initials ?? '',
    segments:           r.segments_json ? JSON.parse(r.segments_json) : [],
    themes:             r.themes_json   ? JSON.parse(r.themes_json)   : [],
    difficulty:         r.difficulty    ?? undefined,
    learning:           r.learning      ?? undefined,
    redFlag:            r.red_flag      ?? undefined,
    createdAt:          r.created_at,
  };
}

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM supervizyon_notlari ORDER BY created_at DESC')
    .all() as Record<string, any>[];
  return Response.json(rows.map(toPanel));
}

export async function POST(req: NextRequest) {
  const db   = getDb();
  const body = await req.json();

  const result = db
    .prepare(`
      INSERT INTO supervizyon_notlari
        (note_no, date, case_code, topic, supervisor_name, therapist_initials,
         segments_json, themes_json, difficulty, learning, red_flag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      body.noteNo             ?? null,
      body.date               ?? null,
      body.caseCode           ?? null,
      body.topic              ?? null,
      body.supervisorName     ?? null,
      body.therapistInitials  ?? null,
      body.segments  ? JSON.stringify(body.segments)  : null,
      body.themes    ? JSON.stringify(body.themes)    : null,
      body.difficulty ?? null,
      body.learning   ?? null,
      body.redFlag    ?? null,
    );

  return Response.json({ id: result.lastInsertRowid });
}
