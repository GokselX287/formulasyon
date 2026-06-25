import type { Metadata } from 'next';
import { section } from './sections';
import { pageMeta } from './meta';

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

export default function HomePage() {
  return <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: section('hero') }} />;
}
