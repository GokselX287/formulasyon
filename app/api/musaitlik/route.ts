import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET — tüm şablon + blokları döndür
export async function GET() {
  const db = getDb();
  const sablon = db.prepare(`SELECT * FROM musaitlik_sablon ORDER BY gun, baslangic`).all();
  const bloklar = db.prepare(`SELECT * FROM musaitlik_blok ORDER BY tarih, baslangic`).all();
  return NextResponse.json({ sablon, bloklar });
}

// POST — şablon satırı ekle/güncelle
// body: { gun, tip, baslangic, bitis, id? }
export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { gun, tip, baslangic, bitis, id } = body;
  const rowId = id ?? randomUUID();

  db.prepare(`
    INSERT INTO musaitlik_sablon (id, gun, tip, baslangic, bitis)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      gun=excluded.gun, tip=excluded.tip,
      baslangic=excluded.baslangic, bitis=excluded.bitis
  `).run(rowId, gun, tip, baslangic ?? null, bitis ?? null);

  return NextResponse.json({ id: rowId });
}

// DELETE — şablon satırı sil
// body: { id } veya ?id= query
export async function DELETE(req: NextRequest) {
  const db = getDb();
  const id = req.nextUrl.searchParams.get('id') ?? (await req.json().catch(() => ({}))).id;
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  db.prepare(`DELETE FROM musaitlik_sablon WHERE id = ?`).run(id);
  return NextResponse.json({ ok: true });
}
