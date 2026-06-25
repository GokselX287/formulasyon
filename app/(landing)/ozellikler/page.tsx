import type { Metadata } from 'next';
import { section } from '../sections';
import { pageMeta } from '../meta';

export const metadata: Metadata = pageMeta({
  title: 'Özellikler — Calmie',
  description:
    'Hazır değerlendirme formları, bozukluk döngüsü görselleştirme, PDF rapor, iki yönlü macOS takvim ve otomatik SMS — Calmie özellikleri tek bakışta.',
  path: '/ozellikler',
});

export default function OzelliklerPage() {
  return <main className="main wrap" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: section('ozellikler') }} />;
}
