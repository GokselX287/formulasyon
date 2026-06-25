import type { Metadata } from 'next';

// Çok-sayfalı landing için paylaşılan SEO yardımcıları + JSON-LD.
export const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://calmie.app';

// TODO(fiyat): Gerçek rakamla değiştir. landing-body.html ile aynı yer-tutucu.
export const PRICE_MONTHLY = '499';

export function pageMeta(opts: { title: string; description: string; path: string }): Metadata {
  const url = opts.path === '/' ? SITE : `${SITE}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      url,
      siteName: 'Calmie',
      title: opts.title,
      description: opts.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
    },
  };
}

export const FAQ: { q: string; a: string }[] = [
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

// Site geneli: Organization + SoftwareApplication (her sayfada layout'tan render edilir).
export const orgJsonLd = {
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
  ],
};

// SSS sayfası: FAQPage şeması.
export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
