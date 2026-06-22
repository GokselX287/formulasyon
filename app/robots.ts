import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://calmie.app';

// Yalnız pazarlama yüzeyi indekslensin; uygulama ve özel veri rotaları engellensin.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/kayit', '/giris'],
        disallow: [
          '/uygulama', '/api/', '/admin', '/clients/', '/danisan/', '/profil/',
          '/dosya/', '/ozet/', '/briefing/', '/supervizyon', '/pt/', '/sozluk',
          '/sifre-sifirla', '/dogrula', '/form/',
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
