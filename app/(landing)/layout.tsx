import type { Metadata } from 'next';
import '../landing.css';
import LandingFx from '../LandingFx';
import { SITE, orgJsonLd } from './meta';

// ──────────────────────────────────────────────────────────────────────────
// TEK-SAYFA landing kabuğu. Nav + footer + sahne + tema seçici artık
// app/landing-body.html içindedir (page.tsx gömer); burada SADECE fontlar,
// global stil, JSON-LD ve davranış katmanı (LandingFx) kalır.
// Eski LandingNav.tsx / LandingFooter.tsx kullanılmıyor — silebilirsin.
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
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..700&family=JetBrains+Mono:wght@400;500;700&display=swap"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      {children}
      <LandingFx />
    </>
  );
}
