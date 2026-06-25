import type { Metadata } from 'next';
import '../landing.css';
import LandingFx from '../LandingFx';
import LandingNav from './LandingNav';
import LandingFooter from './LandingFooter';
import { SITE, orgJsonLd } from './meta';

// ──────────────────────────────────────────────────────────────────────────
// Çok-sayfalı pazarlama landing'inin paylaşılan kabuğu. Her route kendi
// bölümünü `children` olarak verir; nav + footer + sahne burada kalıcıdır.
// One-page çıpa kaydırması yerine her menü ayrı URL'ye gider (LandingNav).
// ──────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Calmie — Terapistler için dijital klinik asistanı' },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Instrument+Serif:ital@0;1&family=Space+Mono:wght@400;700&display=swap"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      <div className="scene" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <LandingNav />
      {children}
      <LandingFooter />
      <LandingFx />
    </>
  );
}
