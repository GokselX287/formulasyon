import { readFileSync } from 'fs';
import { join } from 'path';

// ──────────────────────────────────────────────────────────────────────────
// Landing bölümleri tek tasarım kaynağından (app/landing-body.html) okunur.
// Çok-sayfalı landing'e geçtik: nav + footer + sahne artık React (layout +
// LandingNav/LandingFooter). Bu yardımcı, o dosyadaki yalnızca <section>
// bloklarını sırayla çıkarır; her route kendi bölümünü gömer.
//   0 hero · 1 problem(nasıl çalışır) · 2 moduller · 3 ozellikler ·
//   4 fiyat · 5 güven · 6 sss
// Bölümler iç içe geçmez → non-greedy eşleşme güvenli. Markup birebir korunur.
// ──────────────────────────────────────────────────────────────────────────

let cache: string[] | null = null;

function all(): string[] {
  if (!cache) {
    const html = readFileSync(join(process.cwd(), 'app', 'landing-body.html'), 'utf8');
    cache = html.match(/<section\b[\s\S]*?<\/section>/g) || [];
  }
  return cache;
}

const INDEX = {
  hero: 0,
  nasil: 1,
  moduller: 2,
  ozellikler: 3,
  fiyat: 4,
  guven: 5,
  sss: 6,
} as const;

export type SectionKey = keyof typeof INDEX;

export function section(...keys: SectionKey[]): string {
  const secs = all();
  return keys.map((k) => secs[INDEX[k]] || '').join('\n');
}
