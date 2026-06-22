import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────────────────────────────────
// Ortak öneri havuzu — terapistlerin doldurduğu ifadeler ALAN/düğüm bazlı,
// danışan kimliği OLMADAN toplanır; başka terapist aynı alanı doldururken
// autocomplete önerisi olarak çıkar. (Proxy auth ile yalnız giriş yapmış
// terapist erişir.)
// ──────────────────────────────────────────────────────────────────────────

// GET ?key=sa_safety → o alan için sık girilen ifadeler (freq DESC).
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key');
  if (!key) return NextResponse.json([]);
  const rows = getDb()
    .prepare('SELECT value FROM field_suggestions WHERE field_key = ? ORDER BY freq DESC, updated_at DESC LIMIT 60')
    .all(String(key)) as { value: string }[];
  return NextResponse.json(rows.map((r) => r.value));
}

// POST {key, values:string[]} → her ifadeyi havuza ekle / sayacını artır (upsert).
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const key = typeof b?.key === 'string' ? b.key.trim() : '';
  const values: unknown[] = Array.isArray(b?.values) ? b.values : [];
  if (!key || !values.length) return NextResponse.json({ ok: false }, { status: 400 });
  const db = getDb();
  const up = db.prepare(`
    INSERT INTO field_suggestions (field_key, value, freq, updated_at)
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(field_key, value) DO UPDATE SET freq = freq + 1, updated_at = datetime('now')
  `);
  const tx = db.transaction((vals: unknown[]) => {
    for (const raw of vals) {
      const v = String(raw).trim();
      // çok kısa / çok uzun ifadeleri ele — anlamlı öneriler kalsın
      if (v.length < 3 || v.length > 280) continue;
      up.run(key, v);
    }
  });
  tx(values);
  return NextResponse.json({ ok: true });
}
