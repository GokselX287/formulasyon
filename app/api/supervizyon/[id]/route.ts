import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ownerOr401 } from '@/lib/tenant';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  const sets: string[] = [];
  const vals: any[] = [];
  const map: Record<string, string> = {
    tarih: 'tarih', supervisor: 'supervisor', format: 'format', duration: 'duration',
    goal: 'goal', notes: 'notes', postNotes: 'post_notes', status: 'status',
    challenge: 'challenge', learning: 'learning', caseLabel: 'case_label',
  };
  for (const [k, col] of Object.entries(map)) {
    if (k in body) { sets.push(`${col}=?`); vals.push(body[k]); }
  }
  if (body.selectedCases !== undefined) { sets.push('selected_cases=?'); vals.push(JSON.stringify(body.selectedCases)); }
  if (body.caseNotes !== undefined) { sets.push('case_notes=?'); vals.push(JSON.stringify(body.caseNotes)); }
  if (body.tools !== undefined) { sets.push('tools=?'); vals.push(JSON.stringify(body.tools)); }
  if (!sets.length) return NextResponse.json({ ok: true });
  vals.push(id, uid);
  db.prepare(`UPDATE supervizyon SET ${sets.join(',')} WHERE id=? AND owner_id=?`).run(...vals);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const { id } = await params;
  db.prepare('DELETE FROM supervizyon WHERE id=? AND owner_id=?').run(id, uid);
  return NextResponse.json({ ok: true });
}
