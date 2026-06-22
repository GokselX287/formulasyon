import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ownerOr401 } from '@/lib/tenant';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  getDb().prepare('DELETE FROM seanslar WHERE id = ? AND owner_id = ?').run(id, uid);
  return Response.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  const body = await req.json();
  const { tarih, anamnez, seansNotu, detay, durum } = body;
  const now = new Date().toISOString();
  const db = getDb();

  // Sadece katılım durumu güncelleniyor (katildi|katilmadi|ertelendi|iptal)
  if (durum !== undefined && tarih === undefined && anamnez === undefined && seansNotu === undefined && detay === undefined) {
    const DURUMLAR = ['katildi', 'katilmadi', 'ertelendi', 'iptal'];
    const d = DURUMLAR.includes(durum) ? durum : 'katildi';
    db.prepare(`UPDATE seanslar SET durum = ?, guncelleme_tarihi = ? WHERE id = ? AND owner_id = ?`).run(d, now, id, uid);
    return Response.json({ ok: true });
  }

  // Partial update: sadece gelen alanları güncelle
  if (detay !== undefined && tarih === undefined && anamnez === undefined && seansNotu === undefined) {
    // Sadece detay güncelleniyor (hexaflex otomatik kayıt)
    db.prepare(`
      UPDATE seanslar
      SET detay_json = ?, guncelleme_tarihi = ?
      WHERE id = ? AND owner_id = ?
    `).run(detay ? JSON.stringify(detay) : null, now, id, uid);
  } else {
    // Tam güncelleme
    db.prepare(`
      UPDATE seanslar
      SET tarih = ?, anamnez_data = ?, seans_notu_data = ?, detay_json = ?, guncelleme_tarihi = ?
      WHERE id = ? AND owner_id = ?
    `).run(
      tarih,
      anamnez ? JSON.stringify(anamnez) : null,
      seansNotu ? JSON.stringify(seansNotu) : null,
      detay ? JSON.stringify(detay) : null,
      now,
      id,
      uid,
    );
  }

  return Response.json({ ok: true });
}
