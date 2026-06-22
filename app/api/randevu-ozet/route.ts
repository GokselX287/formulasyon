import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ownerOr401 } from '@/lib/tenant';

// Dün / Bugün / Yarın randevu değişiklikleri
// Returns: { cancellations, newAppointments }

export async function GET(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();

  const now   = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const tomorrow  = new Date(now); tomorrow .setDate(now.getDate() + 1);

  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const [yDay, tDay, tmrw] = [ymd(yesterday), ymd(now), ymd(tomorrow)];

  // ── 1. İptal / erteleme / no-show bildirimleri ──────────────────────
  const cancellations = (db.prepare(`
    SELECT * FROM seans_bildirimleri
    WHERE durum IN ('no_show','iptal','erteleme')
      AND randevu_tarihi BETWEEN ? AND ?
      AND owner_id = ?
    ORDER BY randevu_tarihi ASC, randevu_saati ASC
  `).all(yDay, tmrw, uid) as Record<string, any>[]).map(r => ({
    id:             r.id,
    clientId:       r.client_id,
    clientName:     r.client_name,
    seansNo:        r.seans_no,
    date:           r.randevu_tarihi,
    time:           r.randevu_saati ?? null,
    durum:          r.durum as 'no_show' | 'iptal' | 'erteleme',
    mazeret:        r.mazeret ?? null,
    ertlemeTarihi:  r.erteleme_tarihi ?? null,
    createdAt:      r.created_at,
  }));

  // ── 2. Yeni oluşturulan takvim randevuları (son 48 saat içinde eklendi) ─
  const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const newAppointments = (db.prepare(`
    SELECT * FROM calendar_events
    WHERE start BETWEEN ? AND ?
      AND created_at >= ?
      AND owner_id = ?
    ORDER BY start ASC
  `).all(`${yDay}T00:00`, `${tmrw}T23:59`, cutoff, uid) as Record<string, any>[]).map(r => ({
    id:        r.id,
    title:     r.title,
    start:     r.start,
    end:       r.end_time,
    notes:     r.notes ?? null,
    createdAt: r.created_at,
  }));

  return Response.json({
    window: { yesterday: yDay, today: tDay, tomorrow: tmrw },
    cancellations,
    newAppointments,
  });
}
