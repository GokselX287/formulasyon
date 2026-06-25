import type { Metadata } from 'next';
import { section } from '../sections';
import { pageMeta, faqJsonLd } from '../meta';

export const metadata: Metadata = pageMeta({
  title: 'Sıkça Sorulan Sorular — Calmie',
  description:
    'Calmie hakkında sıkça sorulan sorular — KVKK uyumu, çalıştığı terapi ekolleri, SMS hatırlatma, fiyat ve kağıt/Excel düzeninden geçiş kolaylığı.',
  path: '/sss',
});

export default function SssPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }} />
      <main className="main wrap" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: section('sss') }} />
    </>
  );
}
