import { getDb } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') ?? searchParams.get('patientId');
  const db = getDb();

  const rows = (clientId
    ? db.prepare(`
        SELECT s.*, c.alias as ad_soyad
        FROM seanslar s
        JOIN clients c ON s.client_id = c.id
        WHERE s.client_id = ?
        ORDER BY s.tarih ASC
      `).all(clientId)
    : db.prepare(`
        SELECT s.*, c.alias as ad_soyad
        FROM seanslar s
        JOIN clients c ON s.client_id = c.id
        ORDER BY s.tarih DESC
      `).all()
  ) as any[];

  const result = rows.map(r => ({
    id: r.id,
    patientId: String(r.client_id),
    patientName: r.ad_soyad,
    no: r.no ?? 1,
    tarih: r.tarih,
    tip: r.tip ?? 'seans',
    durum: r.durum ?? 'katildi',
    anamnez: r.anamnez_data ? JSON.parse(r.anamnez_data) : undefined,
    seansNotu: r.seans_notu_data ? JSON.parse(r.seans_notu_data) : undefined,
    detay: r.detay_json ? JSON.parse(r.detay_json) : undefined,
    olusturmaTarihi: r.created_at,
    guncellemeTarihi: r.guncelleme_tarihi ?? r.created_at,
  }));

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const { patientId, tarih, tip, no, anamnez, seansNotu } = body;
  const clientId = patientId ?? body.client_id;
  const DURUMLAR = ['katildi', 'katilmadi', 'ertelendi', 'iptal'];
  const durum = DURUMLAR.includes(body.durum) ? body.durum : 'katildi';

  db.prepare(`
    INSERT INTO seanslar (id, client_id, tarih, tip, no, anamnez_data, seans_notu_data, durum, created_at, guncelleme_tarihi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    clientId,
    tarih ?? now,
    tip ?? 'seans',
    no ?? 1,
    anamnez ? JSON.stringify(anamnez) : null,
    seansNotu ? JSON.stringify(seansNotu) : null,
    durum,
    now,
    now,
  );

  return Response.json({ ok: true, id });
}
