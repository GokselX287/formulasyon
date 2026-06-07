import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const b = await req.json();
  const now = new Date().toISOString();

  // Takip girişimi: takip_sayisi artır, notu kaydet
  if (b.takipGirisimi) {
    db.prepare(`
      UPDATE seans_bildirimleri SET
        takip_sayisi = COALESCE(takip_sayisi, 0) + 1,
        takip_tarihi = ?,
        takip_notu   = ?,
        sonraki_adim = ?,
        durum        = COALESCE(?, durum)
      WHERE id = ?
    `).run(now, b.takipNotu ?? null, b.sonrakiAdim ?? null, b.durum ?? null, id);
    return NextResponse.json({ ok: true });
  }

  // Sadece gönderilen alanları güncelle (partial update)
  const colMap: Record<string, string> = {
    durum:             'durum',
    mazeret:           'mazeret',
    terapistTutum:     'terapist_tutum',
    dikkatEdilecekler: 'dikkat_edilecekler',
    niyetKalibi:       'niyet_kalibi',
    ertlemeTarihi:     'erteleme_tarihi',
  };
  const sets: string[] = [];
  const vals: any[]    = [];
  for (const [key, col] of Object.entries(colMap)) {
    if (key in b) { sets.push(`${col} = ?`); vals.push(b[key]); }
  }
  if (b.durum && b.durum !== 'bekleyen') {
    sets.push('kapandi_at = ?'); vals.push(now);
  }
  if (!sets.length) return NextResponse.json({ ok: true });
  vals.push(id);
  db.prepare(`UPDATE seans_bildirimleri SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  getDb().prepare('DELETE FROM seans_bildirimleri WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}
