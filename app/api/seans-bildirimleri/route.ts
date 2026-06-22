import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ownerOr401, ownsClient, notFound } from '@/lib/tenant';

function mapRow(r: Record<string, any>) {
  return {
    id: r.id,
    randevuId: r.randevu_id,
    clientId: r.client_id,
    clientName: r.client_name,
    seansNo: r.seans_no,
    randevuTarihi: r.randevu_tarihi,
    randevuSaati: r.randevu_saati,
    durum: r.durum,
    mazeret: r.mazeret,
    terapistTutum: r.terapist_tutum,
    dikkatEdilecekler: r.dikkat_edilecekler,
    niyetKalibi: r.niyet_kalibi,
    ertlemeTarihi: r.erteleme_tarihi,
    createdAt: r.created_at,
    kapandiAt: r.kapandi_at,
  };
}

export async function GET(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM seans_bildirimleri WHERE owner_id = ? ORDER BY randevu_tarihi DESC`
  ).all(uid) as Record<string, any>[];
  return NextResponse.json(rows.map(mapRow));
}

export async function POST(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const b = await req.json();

  // Kayıtlı danışan varsa sahiplik kapısı (varlığı sızdırma)
  if (b.clientId && !ownsClient(uid, b.clientId)) return notFound();

  const id = `sb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(`
    INSERT INTO seans_bildirimleri
      (id, randevu_id, client_id, client_name, seans_no, randevu_tarihi, randevu_saati, durum, owner_id)
    VALUES (?,?,?,?,?,?,?,'bekleyen',?)
  `).run(id, b.randevuId, b.clientId, b.clientName, b.seansNo, b.randevuTarihi, b.randevuSaati ?? null, uid);
  return NextResponse.json({ id });
}
