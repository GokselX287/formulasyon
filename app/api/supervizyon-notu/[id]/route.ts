import { getDb } from '@/lib/db';
import { ownerOr401 } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

function toPanel(r: Record<string, any>) {
  return {
    id:                 r.id,
    noteNo:             r.note_no             ?? String(r.id),
    date:               r.date                ?? '',
    caseCode:           r.case_code           ?? '',
    topic:              r.topic               ?? '',
    supervisorName:     r.supervisor_name     ?? '',
    therapistInitials:  r.therapist_initials  ?? '',
    segments:           r.segments_json ? JSON.parse(r.segments_json) : [],
    themes:             r.themes_json   ? JSON.parse(r.themes_json)   : [],
    difficulty:         r.difficulty    ?? undefined,
    learning:           r.learning      ?? undefined,
    redFlag:            r.red_flag      ?? undefined,
    createdAt:          r.created_at,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const { id } = await params;
  const row = db
    .prepare('SELECT * FROM supervizyon_notlari WHERE id = ? AND owner_id = ?')
    .get(id, uid) as Record<string, any> | undefined;
  if (!row) return Response.json({ error: 'not found' }, { status: 404 });
  return Response.json(toPanel(row));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db   = getDb();
  const { id } = await params;
  const body = await req.json();

  const sets: string[] = [];
  const vals: any[]   = [];

  const map: Record<string, string> = {
    noteNo:            'note_no',
    date:              'date',
    caseCode:          'case_code',
    topic:             'topic',
    supervisorName:    'supervisor_name',
    therapistInitials: 'therapist_initials',
    difficulty:        'difficulty',
    learning:          'learning',
    redFlag:           'red_flag',
  };

  for (const [k, col] of Object.entries(map)) {
    if (k in body) { sets.push(`${col} = ?`); vals.push(body[k]); }
  }
  if (body.segments !== undefined) {
    sets.push('segments_json = ?'); vals.push(JSON.stringify(body.segments));
  }
  if (body.themes !== undefined) {
    sets.push('themes_json = ?'); vals.push(JSON.stringify(body.themes));
  }

  if (!sets.length) return Response.json({ ok: true });
  vals.push(id, uid);
  db.prepare(`UPDATE supervizyon_notlari SET ${sets.join(', ')} WHERE id = ? AND owner_id = ?`).run(...vals);
  return Response.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const { id } = await params;
  db.prepare('DELETE FROM supervizyon_notlari WHERE id = ? AND owner_id = ?').run(id, uid);
  return Response.json({ ok: true });
}
