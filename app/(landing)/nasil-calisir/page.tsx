import type { Metadata } from 'next';
import { section } from '../sections';
import { pageMeta } from '../meta';

export const metadata: Metadata = pageMeta({
  title: 'Nasıl çalışır — Calmie',
  description:
    'Kağıt ve Excel düzeninden dijital klinik asistanına: Calmie randevu, dosya, formülasyon ve hatırlatmayı nasıl tek akışta otomatikleştirir?',
  path: '/nasil-calisir',
});

export default function NasilCalisirPage() {
  return <main className="main wrap" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: section('nasil') }} />;
}
