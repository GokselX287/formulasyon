import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';
import { ownerOr401 } from '@/lib/tenant';

// GET — tüm şablon + blokları döndür
export async function GET(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const sablon = db.prepare(`SELECT * FROM musaitlik_sablon WHERE owner_id = ? ORDER BY gun, baslangic`).all(uid);
  const bloklar = db.prepare(`SELECT * FROM musaitlik_blok WHERE owner_id = ? ORDER BY tarih, baslangic`).all(uid);
  return NextResponse.json({ sablon, bloklar });
}

// POST — şablon satırı ekle/güncelle
// body: { gun, tip, baslangic, bitis, id? }
export async function POST(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const body = await req.json();
  const { gun, tip, baslangic, bitis, id } = body;
  const rowId = id ?? randomUUID();

  db.prepare(`
    INSERT INTO musaitlik_sablon (id, gun, tip, baslangic, bitis, owner_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      gun=excluded.gun, tip=excluded.tip,
      baslangic=excluded.baslangic, bitis=excluded.bitis
    WHERE owner_id = ?
  `).run(rowId, gun, tip, baslangic ?? null, bitis ?? null, uid, uid);

  return NextResponse.json({ id: rowId });
}

// DELETE — şablon satırı sil
// body: { id } veya ?id= query
export async function DELETE(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const id = req.nextUrl.searchParams.get('id') ?? (await req.json().catch(() => ({}))).id;
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  db.prepare(`DELETE FROM musaitlik_sablon WHERE id = ? AND owner_id = ?`).run(id, uid);
  return NextResponse.json({ ok: true });
}
