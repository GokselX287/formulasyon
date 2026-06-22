/* =====================================================================
   danisanlarListe.helpers — Danışanlar Listesi eşleme/tarih/istatistik
   yardımcıları. Veri uygulamanın gerçek Client modelinden (@/lib/types)
   gelir; burada uydurma veri YOK. Handoff: Cv görsel-32.
   ===================================================================== */
import type { Client } from '@/lib/types';

export type { Client };

/* ─── Kanonik etiketler + tespit (serbest metin → kanonik anahtar) ────── */
export const CANON_LABEL: Record<string, string> = {
  anksiyete: 'Anksiyete', depresyon: 'Depresyon', okb: 'OKB', travma: 'Travma',
  iliski: 'İlişki', panik: 'Panik', yas: 'Yas', mukemmel: 'Mükemmeliyetçilik',
};
const TAG_PATTERNS: [string, RegExp][] = [
  ['okb', /okb|obse|kompuls|erp/],
  ['panik', /panik/],
  ['travma', /travma|tssb/],
  ['depresyon', /depres/],
  ['iliski', /ilişki|çift|evlil/],
  ['yas', /yas|kayıp|kayb|anne kaybı/],
  ['mukemmel', /mükemmel|sınav kayg/],
  ['anksiyete', /kayg|anksiyete/],
];
export function tagKey(text?: string): string | null {
  const t = (text || '').toLocaleLowerCase('tr');
  for (const [key, rx] of TAG_PATTERNS) if (rx.test(t)) return key;
  return null;
}
export function detectKeys(c: Client): string[] {
  const seen = new Set<string>();
  [...(c.tags || []), c.issue || ''].forEach((s) => { const k = tagKey(s); if (k) seen.add(k); });
  return [...seen];
}

/* ─── Client → görünüm eşlemesi ───────────────────────────────────────── */
export type Status = 'active' | 'passive' | 'risk';
export const statusLabel: Record<Status, string> = { active: 'Aktif', passive: 'Pasif', risk: 'Riskli' };
export function mapStatus(c: Client): Status {
  if (c.status === 'passive') return 'passive';
  if (c.dropRisk === 'high') return 'risk';
  return 'active';
}
export type Category = 'cocuk' | 'ergen' | 'yetiskin';
export function category(age?: number | null): Category {
  if (age == null) return 'yetiskin';
  if (age <= 12) return 'cocuk';
  if (age <= 17) return 'ergen';
  return 'yetiskin';
}
export function tagText(c: Client): string {
  return c.tags && c.tags.length ? c.tags.join(' · ') : (c.issue || '—');
}
export function noteText(c: Client): string {
  return c.issue || (mapStatus(c) === 'passive' ? 'İzlem' : 'Devam');
}

/* ─── Tarih yardımcıları ──────────────────────────────────────────────── */
const ISO = /^\d{4}-\d{2}-\d{2}/;
export function fmt(d?: string | null): string {
  if (!d) return '—';
  const m = ISO.exec(d);
  if (m) { const [y, mo, da] = m[0].split('-'); return `${da}.${mo}.${y}`; }
  return d;
}
export function relNext(d?: string | null, today: Date = new Date()): { text: string; up: boolean } {
  if (!d) return { text: 'Planlanmadı', up: false };
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return { text: d, up: true };
  const days = Math.round((dt.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { text: 'Geçti', up: false };
  if (days === 0) return { text: 'Bugün', up: true };
  if (days === 1) return { text: 'Yarın', up: true };
  return { text: fmt(d), up: true };
}

/* ─── İstatistik (3 tile) ─────────────────────────────────────────────── */
export function computeStats(clients: Client[]) {
  let active = 0, risk = 0; const seen = new Set<string>();
  clients.forEach((c) => {
    const s = mapStatus(c);
    if (s === 'active') active++;
    if (s === 'risk') risk++;
    if (c.lastSession) seen.add(c.id);
  });
  return { active, risk, total: seen.size };
}
