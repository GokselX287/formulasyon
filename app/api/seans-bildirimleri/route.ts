import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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

export async function GET() {
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM seans_bildirimleri ORDER BY randevu_tarihi DESC`
  ).all() as Record<string, any>[];
  return NextResponse.json(rows.map(mapRow));
}

export async function POST(req: Request) {
  const db = getDb();
  const b = await req.json();
  const id = `sb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(`
    INSERT INTO seans_bildirimleri
      (id, randevu_id, client_id, client_name, seans_no, randevu_tarihi, randevu_saati, durum)
    VALUES (?,?,?,?,?,?,?,'bekleyen')
  `).run(id, b.randevuId, b.clientId, b.clientName, b.seansNo, b.randevuTarihi, b.randevuSaati ?? null);
  return NextResponse.json({ id });
}
