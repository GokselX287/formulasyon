import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ownerOr401 } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const type  = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);

  const rows = type
    ? (db
        .prepare('SELECT * FROM reflections WHERE owner_id = ? AND type = ? ORDER BY created_at DESC, id DESC LIMIT ?')
        .all(uid, type, limit) as Record<string, unknown>[])
    : (db
        .prepare('SELECT * FROM reflections WHERE owner_id = ? ORDER BY created_at DESC, id DESC LIMIT ?')
        .all(uid, limit) as Record<string, unknown>[]);

  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db   = getDb();
  const body = await req.json();

  // Yansıma notu iki bölüm: fark_notu + klinik_notu (yapılandırılmış).
  // Geriye uyum için birleşik `body` de doldurulur (eski okuyucular için).
  const fark   = (body.fark_notu ?? body.farkNotu ?? '').toString().trim();
  const klinik = (body.klinik_notu ?? body.klinikNotu ?? '').toString().trim();
  let combined = body.text ?? body.body ?? '';
  if (!combined && (fark || klinik)) {
    const parts: string[] = [];
    if (fark) parts.push(`Fark ettiklerim — ${fark}`);
    if (klinik) parts.push(`Klinik yansımalar — ${klinik}`);
    combined = parts.join('\n\n');
  }

  const type = body.type ?? 'daily';

  // Check-in: gün başına TEK kayıt — bugünki check-in varsa güncelle (yoksa aşağıda eklenir).
  // Böylece "İyilik hali seyri" grafiği her gün için tek nokta tutar.
  if (type === 'check-in') {
    const existing = db
      .prepare(`SELECT id FROM reflections WHERE owner_id = ? AND type = 'check-in' AND date(created_at, 'localtime') = date('now', 'localtime') ORDER BY id DESC LIMIT 1`)
      .get(uid) as { id: number } | undefined;
    if (existing) {
      db.prepare(`UPDATE reflections SET score = ?, body = ?, meta = ? WHERE id = ? AND owner_id = ?`).run(
        body.score != null && body.score !== '' ? Number(body.score) : null,
        combined,
        body.meta ?? null,
        existing.id,
        uid,
      );
      return Response.json({ id: existing.id, updated: true });
    }
  }

  const result = db
    .prepare(
      `INSERT INTO reflections (therapist_id, type, emotion, body, accent_word, meta, emotions, score, fark_notu, klinik_notu, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      body.therapist_id ?? null,
      type,
      body.emotion ?? null,
      combined,
      body.accent_word ?? null,
      body.meta ?? null,
      body.emotions ? JSON.stringify(body.emotions) : null,
      body.score != null && body.score !== '' ? Number(body.score) : null,
      fark || null,
      klinik || null,
      uid,
    );

  return Response.json({ id: result.lastInsertRowid });
}
