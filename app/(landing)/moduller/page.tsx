import type { Metadata } from 'next';
import { section } from '../sections';
import { pageMeta } from '../meta';

export const metadata: Metadata = pageMeta({
  title: 'Modüller — Calmie',
  description:
    'Randevudan otomatik dosya açmaya, takvim senkronundan SMS hatırlatmaya — Calmie modülleri klinik akışını dağınıklık olmadan tek panelde toplar.',
  path: '/moduller',
});

export default function ModullerPage() {
  return <main className="main wrap" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: section('moduller') }} />;
}
