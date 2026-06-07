import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

// POST — özel blok ekle
export async function POST(req: NextRequest) {
  const db = getDb();
  const { tarih, baslangic, bitis, aciklama, renk } = await req.json();
  if (!tarih || !baslangic || !bitis) {
    return NextResponse.json({ error: 'tarih, baslangic, bitis zorunlu' }, { status: 400 });
  }
  const id = randomUUID();
  db.prepare(`
    INSERT INTO musaitlik_blok (id, tarih, baslangic, bitis, aciklama, renk)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, tarih, baslangic, bitis, aciklama ?? null, renk ?? 'gray');
  return NextResponse.json({ id });
}

// DELETE — özel blok sil
export async function DELETE(req: NextRequest) {
  const db = getDb();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  db.prepare(`DELETE FROM musaitlik_blok WHERE id = ?`).run(id);
  return NextResponse.json({ ok: true });
}
