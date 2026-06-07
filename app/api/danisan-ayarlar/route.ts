import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET — get settings for a client
export async function GET(req: NextRequest) {
  const db = getDb();
  const clientId = req.nextUrl.searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json({ error: 'clientId gerekli' }, { status: 400 });
  }

  const row = db.prepare(`SELECT * FROM danisan_ayarlar WHERE client_id = ?`).get(clientId) as any;

  if (!row) {
    return NextResponse.json({
      client_id: clientId,
      on_form_aktif: 0,
      haftalik_olcek_aktif: 0,
      haftalik_olcek_id: null,
    });
  }

  return NextResponse.json(row);
}

// POST/PUT — upsert settings for a client
export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { clientId, onFormAktif, haftalikOlcekAktif, haftalikOlcekId } = body;

  if (!clientId) {
    return NextResponse.json({ error: 'clientId gerekli' }, { status: 400 });
  }

  db.prepare(`
    INSERT INTO danisan_ayarlar (client_id, on_form_aktif, haftalik_olcek_aktif, haftalik_olcek_id, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(client_id) DO UPDATE SET
      on_form_aktif = excluded.on_form_aktif,
      haftalik_olcek_aktif = excluded.haftalik_olcek_aktif,
      haftalik_olcek_id = excluded.haftalik_olcek_id,
      updated_at = datetime('now')
  `).run(clientId, onFormAktif ? 1 : 0, haftalikOlcekAktif ? 1 : 0, haftalikOlcekId ?? null);

  const row = db.prepare(`SELECT * FROM danisan_ayarlar WHERE client_id = ?`).get(clientId);
  return NextResponse.json(row);
}
