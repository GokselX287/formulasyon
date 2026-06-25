import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://calmie.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/moduller`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/nasil-calisir`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/ozellikler`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/fiyat`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE}/sss`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/kayit`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/giris`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
