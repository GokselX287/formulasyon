import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET — list form links for a client
export async function GET(req: NextRequest) {
  const db = getDb();
  const clientId = req.nextUrl.searchParams.get('clientId');

  if (clientId) {
    const rows = db.prepare(
      `SELECT * FROM form_linkleri WHERE client_id = ? ORDER BY created_at DESC`
    ).all(clientId);
    return NextResponse.json(rows);
  }

  const rows = db.prepare(`SELECT * FROM form_linkleri ORDER BY created_at DESC`).all();
  return NextResponse.json(rows);
}

// POST — create a new form link
export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { clientId, clientName, formTipi, olcekId, olcekAd, payload } = body;

  if (!clientId || !clientName || !formTipi) {
    return NextResponse.json({ error: 'clientId, clientName, formTipi zorunlu' }, { status: 400 });
  }

  const id = randomUUID();
  const token = randomUUID().replace(/-/g, '');

  db.prepare(`
    INSERT INTO form_linkleri (id, token, client_id, client_name, form_tipi, olcek_id, olcek_ad, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, token, clientId, clientName, formTipi, olcekId ?? null, olcekAd ?? null,
    payload != null ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : null);

  const row = db.prepare(`SELECT * FROM form_linkleri WHERE id = ?`).get(id);
  return NextResponse.json(row, { status: 201 });
}

// PATCH — toggle aktif
export async function PATCH(req: NextRequest) {
  const db = getDb();
  const { id, aktif } = await req.json();
  db.prepare(`UPDATE form_linkleri SET aktif = ? WHERE id = ?`).run(aktif ? 1 : 0, id);
  return NextResponse.json({ ok: true });
}
