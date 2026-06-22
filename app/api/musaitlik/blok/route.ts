import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';
import { ownerOr401 } from '@/lib/tenant';

// POST — özel blok ekle
export async function POST(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const { tarih, baslangic, bitis, aciklama, renk } = await req.json();
  if (!tarih || !baslangic || !bitis) {
    return NextResponse.json({ error: 'tarih, baslangic, bitis zorunlu' }, { status: 400 });
  }
  const id = randomUUID();
  db.prepare(`
    INSERT INTO musaitlik_blok (id, tarih, baslangic, bitis, aciklama, renk, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, tarih, baslangic, bitis, aciklama ?? null, renk ?? 'gray', uid);
  return NextResponse.json({ id });
}

// DELETE — özel blok sil
export async function DELETE(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  db.prepare(`DELETE FROM musaitlik_blok WHERE id = ? AND owner_id = ?`).run(id, uid);
  return NextResponse.json({ ok: true });
}
