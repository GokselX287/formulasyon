import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';
import { ownerOr401, ownsClient, notFound } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// Danışan sorun döngüleri — danışana eklenen bozukluk döngüleri + doldurulan alanlar.
export async function GET(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const clientId = new URL(req.url).searchParams.get('clientId');
  if (!clientId) return NextResponse.json([]);
  const rows = getDb().prepare('SELECT * FROM client_cycles WHERE client_id = ? AND owner_id = ? ORDER BY created_at').all(String(clientId), uid);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const b = await req.json().catch(() => ({}));
  if (!b?.client_id || !b?.type) return NextResponse.json({ ok: false, error: 'client_id ve type gerekli.' }, { status: 400 });
  if (!ownsClient(uid, b.client_id)) return notFound();
  const id = randomUUID();
  getDb().prepare('INSERT INTO client_cycles (id, client_id, owner_id, type, label, fields_json) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, String(b.client_id), uid, String(b.type), b.label ?? null, typeof b.fields === 'string' ? b.fields : JSON.stringify(b.fields ?? {}));
  const row = getDb().prepare('SELECT * FROM client_cycles WHERE id = ? AND owner_id = ?').get(id, uid);
  return NextResponse.json({ ok: true, cycle: row });
}

export async function PATCH(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const b = await req.json().catch(() => ({}));
  if (!b?.id) return NextResponse.json({ ok: false, error: 'id gerekli.' }, { status: 400 });
  const fields = typeof b.fields === 'string' ? b.fields : JSON.stringify(b.fields ?? {});
  getDb().prepare("UPDATE client_cycles SET fields_json = ?, updated_at = datetime('now') WHERE id = ? AND owner_id = ?").run(fields, String(b.id), uid);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id gerekli.' }, { status: 400 });
  getDb().prepare('DELETE FROM client_cycles WHERE id = ? AND owner_id = ?').run(String(id), uid);
  return NextResponse.json({ ok: true });
}
