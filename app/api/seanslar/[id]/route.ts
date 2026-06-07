import { getDb } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare('DELETE FROM seanslar WHERE id = ?').run(id);
  return Response.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { tarih, anamnez, seansNotu, detay } = body;
  const now = new Date().toISOString();
  const db = getDb();

  // Partial update: sadece gelen alanları güncelle
  if (detay !== undefined && tarih === undefined && anamnez === undefined && seansNotu === undefined) {
    // Sadece detay güncelleniyor (hexaflex otomatik kayıt)
    db.prepare(`
      UPDATE seanslar
      SET detay_json = ?, guncelleme_tarihi = ?
      WHERE id = ?
    `).run(detay ? JSON.stringify(detay) : null, now, id);
  } else {
    // Tam güncelleme
    db.prepare(`
      UPDATE seanslar
      SET tarih = ?, anamnez_data = ?, seans_notu_data = ?, detay_json = ?, guncelleme_tarihi = ?
      WHERE id = ?
    `).run(
      tarih,
      anamnez ? JSON.stringify(anamnez) : null,
      seansNotu ? JSON.stringify(seansNotu) : null,
      detay ? JSON.stringify(detay) : null,
      now,
      id,
    );
  }

  return Response.json({ ok: true });
}
