'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// ──────────────────────────────────────────────────────────────────────────
// Çok-sayfalı landing'in reveal-on-scroll efekti (cam/editöryel tasarım).
// Mobil menü → LandingNav (React). One-page rayı kaldırıldı (artık ayrı URL'ler).
// `.reveal → .in` görünüme girince. Gizleme yalnız JS çalışırken (.fx-on);
// JS gecikse/çalışmasa içerik görünür kalır — sayfa asla boş olmaz.
// pathname bağımlılığı: route değişince yeni bölümün .reveal'lerini yeniden bağla.
// ──────────────────────────────────────────────────────────────────────────

export default function LandingFx() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('fx-on');

    const revealEls = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    const reveal = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      // Viewport ölçülemiyorsa (bazı headless/önizleme ortamları 0 döner) → hepsini aç.
      if (!vh) {
        revealEls.forEach((el) => el.classList.add('in'));
        window.removeEventListener('scroll', reveal);
        return;
      }
      let pending = false;
      for (const el of revealEls) {
        if (el.classList.contains('in')) continue;
        if (el.getBoundingClientRect().top < vh * 0.92) el.classList.add('in');
        else pending = true;
      }
      if (!pending) window.removeEventListener('scroll', reveal);
    };
    reveal();
    requestAnimationFrame(reveal);
    const t = setTimeout(reveal, 300);
    window.addEventListener('load', reveal);
    window.addEventListener('scroll', reveal, { passive: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener('load', reveal);
      window.removeEventListener('scroll', reveal);
      root.classList.remove('fx-on');
    };
  }, [pathname]);

  return null;
}
