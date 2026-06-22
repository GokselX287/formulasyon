import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { normIl, ilBul } from '@/lib/turkiyeGeo';
import { ownerOr401 } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// Danışan coğrafi dağılımı — anamnez_json.demografik.{sehir,ilce} üzerinden il bazlı
// sayım (+ il içi ilçe kırılımı). Kimliksiz; yalnız sayılar döner.
export async function GET(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const rows = getDb().prepare('SELECT anamnez_json FROM clients WHERE owner_id = ?').all(uid) as { anamnez_json: string | null }[];

  const iller = new Map<string, { sehir: string; count: number; ilceler: Map<string, number> }>();
  let total = 0;
  let bilinmeyen = 0;

  for (const r of rows) {
    if (!r.anamnez_json) continue;
    let demo: any;
    try { demo = JSON.parse(r.anamnez_json)?.demografik; } catch { continue; }
    const sehirRaw = typeof demo?.sehir === 'string' ? demo.sehir.trim() : '';
    const ilceRaw = typeof demo?.ilce === 'string' ? demo.ilce.trim() : '';
    if (!sehirRaw) continue;
    total++;
    const il = ilBul(sehirRaw);
    if (!il) { bilinmeyen++; continue; }       // tanınmayan il → haritaya konmaz, ayrı sayılır
    const key = normIl(il.ad);
    let bucket = iller.get(key);
    if (!bucket) { bucket = { sehir: il.ad, count: 0, ilceler: new Map() }; iller.set(key, bucket); }
    bucket.count++;
    if (ilceRaw) bucket.ilceler.set(ilceRaw, (bucket.ilceler.get(ilceRaw) ?? 0) + 1);
  }

  const list = [...iller.values()]
    .map((b) => ({
      sehir: b.sehir,
      count: b.count,
      ilceler: [...b.ilceler.entries()].map(([ilce, count]) => ({ ilce, count })).sort((a, z) => z.count - a.count),
    }))
    .sort((a, z) => z.count - a.count || a.sehir.localeCompare(z.sehir, 'tr'));

  return NextResponse.json({ total, bilinmeyen, iller: list });
}
