import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';
import { ownerOr401 } from '@/lib/tenant';

// GET — list form links for a client
export async function GET(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const clientId = req.nextUrl.searchParams.get('clientId');

  if (clientId) {
    const rows = db.prepare(
      `SELECT * FROM form_linkleri WHERE client_id = ? AND owner_id = ? ORDER BY created_at DESC`
    ).all(clientId, uid);
    return NextResponse.json(rows);
  }

  const rows = db.prepare(`SELECT * FROM form_linkleri WHERE owner_id = ? ORDER BY created_at DESC`).all(uid);
  return NextResponse.json(rows);
}

// POST — create a new form link
export async function POST(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const body = await req.json();
  const { clientId, clientName, formTipi, olcekId, olcekAd, payload } = body;

  if (!clientId || !clientName || !formTipi) {
    return NextResponse.json({ error: 'clientId, clientName, formTipi zorunlu' }, { status: 400 });
  }

  const id = randomUUID();
  const token = randomUUID().replace(/-/g, '');

  db.prepare(`
    INSERT INTO form_linkleri (id, token, client_id, client_name, form_tipi, olcek_id, olcek_ad, payload, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, token, clientId, clientName, formTipi, olcekId ?? null, olcekAd ?? null,
    payload != null ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : null, uid);

  const row = db.prepare(`SELECT * FROM form_linkleri WHERE id = ? AND owner_id = ?`).get(id, uid);
  return NextResponse.json(row, { status: 201 });
}

// PATCH — toggle aktif
export async function PATCH(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const { id, aktif } = await req.json();
  db.prepare(`UPDATE form_linkleri SET aktif = ? WHERE id = ? AND owner_id = ?`).run(aktif ? 1 : 0, id, uid);
  return NextResponse.json({ ok: true });
}
