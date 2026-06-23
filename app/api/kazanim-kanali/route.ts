import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ownerOr401 } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// =====================================================================
// Danışan kazanım kanalı — "Danışan nereden geldi?" (Çalışma Alanı §03).
// Kaynak: clients.anamnez_json.nasilBuldu ("Bizi nasıl buldu?" serbest metni).
// Serbest metin kanonik kanallara kategorize edilir (öneri/google/eğitim/diğer).
// Kimliksiz; yalnız sayılar + donut/liste için renk/etiket döner.
// =====================================================================

type ChannelKey = 'oneri' | 'google' | 'egitim' | 'diger';

const CHANNEL_META: Record<ChannelKey, { label: string; sub: string; color: string }> = {
  oneri:  { label: 'Öneri / Referans',     sub: 'Mevcut danışan & meslektaş yönlendirmesi', color: '#C97FA0' },
  google: { label: "Google'da arama",       sub: 'Arama & web sitesi üzerinden',            color: '#B98FD0' },
  egitim: { label: 'Eğitim yönlendirmesi',  sub: 'Atölye & eğitim katılımcıları',           color: '#E5A0B8' },
  diger:  { label: 'Diğer',                 sub: 'Sınıflandırılmamış kaynaklar',            color: '#9FA1C0' },
};

// Sıra önemli: "eğitim yönlendirmesi" hem eğit hem yönlendir içerir → eğitim önce.
function categorize(raw: string): ChannelKey {
  const t = raw.toLocaleLowerCase('tr');
  if (/eğit|egit|atöly|atoly|workshop|kurs|seminer|konferans|sempozyum/.test(t)) return 'egitim';
  if (/google|arama|internet|web|site|online|çevrim|cevrim|instagram|youtube|sosyal medya|reklam/.test(t)) return 'google';
  if (/öner|oner|referans|tavsiye|arkadaş|arkadas|danışan|danisan|meslektaş|meslektas|yönlendir|yonlendir|tanıdık|tanidik|aile|akraba|hasta/.test(t)) return 'oneri';
  return 'diger';
}

export async function GET(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const rows = getDb().prepare('SELECT anamnez_json FROM clients WHERE owner_id = ?').all(uid) as { anamnez_json: string | null }[];

  const counts: Record<ChannelKey, number> = { oneri: 0, google: 0, egitim: 0, diger: 0 };
  let total = 0;          // kaynağı bilinen danışan
  let bilinmeyen = 0;     // anamnezde "nasıl buldu" boş

  for (const r of rows) {
    if (!r.anamnez_json) { bilinmeyen++; continue; }
    let parsed: any;
    try { parsed = JSON.parse(r.anamnez_json); } catch { bilinmeyen++; continue; }
    const raw = (typeof parsed?.nasilBuldu === 'string' ? parsed.nasilBuldu : (typeof parsed?.demografik?.nasilBuldu === 'string' ? parsed.demografik.nasilBuldu : '')).trim();
    if (!raw) { bilinmeyen++; continue; }
    counts[categorize(raw)]++;
    total++;
  }

  // Boş kanalları gizle (donut/liste yalnız dolu kanalları gösterir); sayıya göre azalan.
  const channels = (Object.keys(counts) as ChannelKey[])
    .filter((k) => counts[k] > 0)
    .map((k) => ({ key: k, label: CHANNEL_META[k].label, sub: CHANNEL_META[k].sub, color: CHANNEL_META[k].color, n: counts[k] }))
    .sort((a, b) => b.n - a.n);

  return NextResponse.json({ total, bilinmeyen, channels });
}
