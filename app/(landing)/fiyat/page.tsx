import type { Metadata } from 'next';
import { section } from '../sections';
import { pageMeta } from '../meta';

export const metadata: Metadata = pageMeta({
  title: 'Fiyat — Calmie',
  description:
    'Basit, tek plan. Sınırsız danışan dosyası, tüm formülasyon görünümleri (4P · Beck · ACT), otomatik SMS ve PDF raporlama — aylık ya da indirimli yıllık.',
  path: '/fiyat',
});

export default function FiyatPage() {
  return <main className="main wrap" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: section('fiyat', 'guven') }} />;
}
