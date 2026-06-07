import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM randevu ORDER BY tarih ASC, saat ASC').all() as Record<string, any>[];
  return NextResponse.json(rows.map(r => ({
    id: r.id, clientId: r.client_id, clientName: r.client_name,
    tarih: r.tarih, saat: r.saat, sure: r.sure, not: r.not_text,
    done: r.done === 1,
  })));
}

export async function POST(req: Request) {
  const db = getDb();
  const b = await req.json();
  const id = b.id || `rdv_${Date.now()}`;
  db.prepare(`INSERT OR REPLACE INTO randevu (id, client_id, client_name, tarih, saat, sure, not_text, done)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    id, b.clientId ?? null, b.clientName ?? null,
    b.tarih ?? null, b.saat ?? '09:00', b.sure ?? 50,
    b.not ?? null, b.done ? 1 : 0,
  );

  // Kayıtlı danışan varsa → seans bildirimi oluştur
  if (b.clientId) {
    const clientId = String(b.clientId);

    // Kaç seans girilmiş + zaten kaç bildirim var (her ikisi de seans no hesabı için)
    const seansCount = (db.prepare(
      `SELECT COUNT(*) as cnt FROM seanslar WHERE client_id = ?`
    ).get(clientId) as { cnt: number }).cnt;

    const bildirimCount = (db.prepare(
      `SELECT COUNT(*) as cnt FROM seans_bildirimleri WHERE client_id = ?`
    ).get(clientId) as { cnt: number }).cnt;

    // Bu randevu için toplam seans no = girilmiş seanslar + tüm bildirimler + 1
    const seansNo = seansCount + bildirimCount + 1;

    const sbId = `sb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    db.prepare(`
      INSERT INTO seans_bildirimleri
        (id, randevu_id, client_id, client_name, seans_no, randevu_tarihi, randevu_saati, durum)
      VALUES (?,?,?,?,?,?,?,'bekleyen')
    `).run(sbId, id, clientId, b.clientName ?? '', seansNo, b.tarih ?? '', b.saat ?? null);
  }

  return NextResponse.json({ id });
}
