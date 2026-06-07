import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// v2 tasarımı için ek alanlar — idempotent migration (varsa atlar).
function ensureColumns(db: ReturnType<typeof getDb>) {
  for (const col of ['challenge INTEGER', 'learning INTEGER', 'case_label TEXT']) {
    try { db.prepare(`ALTER TABLE supervizyon ADD COLUMN ${col}`).run(); } catch { /* zaten var */ }
  }
}

export async function GET() {
  const db = getDb();
  ensureColumns(db);
  const rows = db.prepare('SELECT * FROM supervizyon ORDER BY created_at DESC').all() as Record<string, any>[];
  return NextResponse.json(rows.map(r => ({
    ...r,
    selectedCases: r.selected_cases ? JSON.parse(r.selected_cases) : [],
    caseNotes: r.case_notes ? JSON.parse(r.case_notes) : {},
    tools: r.tools ? JSON.parse(r.tools) : [],
    caseLabel: r.case_label ?? null,
  })));
}

export async function POST(req: Request) {
  const db = getDb();
  ensureColumns(db);
  const body = await req.json();
  const id = body.id || `sup_${Date.now()}`;
  db.prepare(`INSERT OR REPLACE INTO supervizyon
    (id, tarih, supervisor, format, duration, goal, selected_cases, case_notes, tools, notes, post_notes, status, challenge, learning, case_label, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
  `).run(
    id, body.tarih ?? null, body.supervisor ?? null, body.format ?? 'bireysel',
    body.duration ?? null, body.goal ?? null,
    JSON.stringify(body.selectedCases ?? []),
    JSON.stringify(body.caseNotes ?? {}),
    JSON.stringify(body.tools ?? []),
    body.notes ?? null, body.postNotes ?? null, body.status ?? 'hazirlanıyor',
    body.challenge ?? null, body.learning ?? null, body.caseLabel ?? null,
  );
  return NextResponse.json({ id });
}
