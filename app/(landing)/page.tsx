import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { pageMeta } from './meta';

// ──────────────────────────────────────────────────────────────────────────
// TEK-SAYFA landing. Tüm tasarım app/landing-body.html içinde (nav · hero ·
// problem · moduller · ozellikler · fiyat · guven · sss · footer · tema seçici).
// Davranış (kaydırma / tema / menü) app/LandingFx.tsx içinde (layout'ta mount'lu).
// Eski çok-sayfalı sürümdeki sections.ts artık ana sayfa için kullanılmaz.
// ──────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  ...pageMeta({
    title: 'Calmie — İşini profesyonelce yapmak isteyen herkes için dijital klinik asistanı',
    description:
      'Anamnezden vaka formülasyonuna, randevudan otomatik hatırlatmaya — tüm klinik sürecin tek panelde. Dosyalama yükünden kurtul; danışanına ve kendine zaman ayır. Klinik psikologlar için KVKK uyumlu dijital klinik asistanı.',
    path: '/',
  }),
  keywords: [
    'vaka formülasyonu programı', 'terapist danışan takip yazılımı', 'klinik psikolog yazılımı',
    'danışan yönetim programı', 'psikoterapi yazılımı', 'seans takip programı',
    'randevu hatırlatma sistemi', 'KVKK uyumlu danışan yönetimi', 'bozukluk döngüsü', 'anamnez formu',
  ],
};

let cache: string | null = null;
function landingBody(): string {
  if (cache == null) {
    cache = readFileSync(join(process.cwd(), 'app', 'landing-body.html'), 'utf8');
  }
  return cache;
}

export default function HomePage() {
  return <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: landingBody() }} />;
}
