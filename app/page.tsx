import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import './landing.css';
import LandingFx from './LandingFx';

// ──────────────────────────────────────────────────────────────────────────
// Kök "/" — HERKESE AÇIK pazarlama landing'i (SEO). Sunucu-render; içerik
// HTML'de gelir (crawl edilebilir). Uygulama /uygulama altında (girişli).
// Tasarım: "Cam / Editöryel" dili. Markup birebir korunur (app/landing-body.html),
// stiller app/landing.css'te, etkileşimler app/LandingFx.tsx'te.
// ──────────────────────────────────────────────────────────────────────────

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://calmie.app';

// TODO(fiyat): Gerçek rakamla değiştir. Şu an yer-tutucu (landing-body.html ile aynı).
const PRICE_MONTHLY = '499';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Calmie — İşini profesyonelce yapmak isteyen herkes için dijital klinik asistanı',
  description:
    'Anamnezden vaka formülasyonuna, randevudan otomatik hatırlatmaya — tüm klinik sürecin tek panelde. Dosyalama yükünden kurtul; danışanına ve kendine zaman ayır. Klinik psikologlar için KVKK uyumlu dijital klinik asistanı.',
  keywords: [
    'vaka formülasyonu programı', 'terapist danışan takip yazılımı', 'klinik psikolog yazılımı',
    'danışan yönetim programı', 'psikoterapi yazılımı', 'seans takip programı',
    'randevu hatırlatma sistemi', 'KVKK uyumlu danışan yönetimi', 'bozukluk döngüsü', 'anamnez formu',
  ],
  authors: [{ name: 'Calmie' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: SITE,
    siteName: 'Calmie',
    title: 'Calmie — Terapistler için dijital klinik asistanı',
    description:
      'Dosyalamayı sevmemen çok normal. Sen işine ve kendine odaklan, gerisini Calmie üstlensin — anamnez, formülasyon, randevu ve hatırlatma tek panelde.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calmie — Terapistler için dijital klinik asistanı',
    description:
      'Anamnez, vaka formülasyonu, bozukluk döngüsü, seans ve randevu — tek panelde. KVKK uyumlu.',
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Calmie nedir?',
    a: 'Calmie, klinik psikologlar ve psikoterapistler için bir dijital klinik asistanıdır. Anamnez, vaka formülasyonu, bozukluk döngüsü, seans takibi ve randevu hatırlatmasını tek panelde toplar; kağıt ve Excel dağınıklığını ortadan kaldırır.',
  },
  {
    q: 'Verilerim güvende mi? KVKK uyumlu mu?',
    a: 'Evet. Her terapist yalnızca kendi danışanlarının verisine erişir; veriler izole ve şifreli saklanır. Altyapı KVKK ilkelerine uygun tasarlanmıştır.',
  },
  {
    q: 'Hangi terapi ekolleriyle çalışıyor?',
    a: 'Vaka formülasyonu; 4P modeli, Beck bilişsel modeli ve ACT Hexaflex görünümleriyle çalışır. Sözlük BDT, ACT, Şema ve Psikodinamik ekollerden ortak bir dil sunar.',
  },
  {
    q: 'Randevu hatırlatma SMS’i gönderebilir miyim?',
    a: 'Evet. Takvim macOS ile senkron çalışır ve randevu yaklaşınca danışana otomatik bilgilendirme SMS’i gider; böylece gelmeyen danışan ve boşa giden saat azalır.',
  },
  {
    q: 'Ne kadar? İptal edebilir miyim?',
    a: 'Tek bir plan var: aylık ya da yıllık (yıllık ödemede indirimli). Kredi kartı olmadan ücretsiz başlarsın, taahhüt yoktur, istediğin an iptal edebilirsin.',
  },
  {
    q: 'Kağıt/Excel düzenimden geçiş zor mu?',
    a: 'Hayır. Yeni danışanı dakikalar içinde eklersin; eski A4 düzeninden dijital klinik asistanına geçiş ilk dosyanı kurmanla başlar. Özetlerini ve raporlarını dilediğin an PDF olarak dışa aktarırsın.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Calmie',
      url: SITE,
      description: 'Klinik psikologlar için danışan yönetimi ve vaka formülasyonu yazılımı.',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Calmie',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      url: SITE,
      offers: { '@type': 'Offer', price: PRICE_MONTHLY, priceCurrency: 'TRY' },
      description:
        'Anamnez, vaka formülasyonu, bozukluk döngüsü, seans takibi ve randevu hatırlatması tek panelde toplayan, klinik psikologlara yönelik KVKK uyumlu danışan yönetim yazılımı.',
      inLanguage: 'tr',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

// Tasarım markup'ı birebir korunur (prototipten çıkarıldı). fs ile okunur ki
// 26KB HTML + 49 inline SVG JSX'e elle çevrilirken sadakat kaybı olmasın.
const bodyHtml = readFileSync(join(process.cwd(), 'app', 'landing-body.html'), 'utf8');

export default function LandingPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Instrument+Serif:ital@0;1&family=Space+Mono:wght@400;700&display=swap"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <LandingFx />
    </>
  );
}
