'use client';

import { useEffect } from 'react';

// ──────────────────────────────────────────────────────────────────────────
// TEK-SAYFA landing'in davranış katmanı. app/landing-body.html ile gelen
// statik markup üzerinde çalışır:
//   · tema seçici (.bgsw) → body'ye dark/night/plain ekler, localStorage'a yazar
//   · mobil menü (#menuBtn / #mobileMenu)
//   · reveal-on-scroll (.reveal → .in)  ·  aktif menü vurgusu (IntersectionObserver)
// JS gecikse/çalışmasa bile içerik görünür kalır (.reveal gizleme yalnız .fx-on iken).
// ──────────────────────────────────────────────────────────────────────────

export default function LandingFx() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('fx-on');

    // ---- tema seçici + kalıcılık ----
    const sw = document.querySelector<HTMLElement>('.bgsw');
    const applyTheme = (t: string) => {
      document.body.classList.toggle('dark', t === 'night');
      document.body.classList.toggle('night', t === 'night');
      document.body.classList.toggle('plain', t === 'light-plain' || t === 'night');
      sw?.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
        b.setAttribute('aria-pressed', b.dataset.theme === t ? 'true' : 'false'),
      );
    };
    let saved: string | null = null;
    try { saved = localStorage.getItem('calmie-theme'); } catch {}
    applyTheme(saved || 'light');
    const onSwClick = (e: Event) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!b || !b.dataset.theme) return;
      applyTheme(b.dataset.theme);
      try { localStorage.setItem('calmie-theme', b.dataset.theme); } catch {}
    };
    sw?.addEventListener('click', onSwClick);

    // ---- mobil menü ----
    const mb = document.getElementById('menuBtn');
    const mm = document.getElementById('mobileMenu');
    const onMenu = () => {
      const open = mm?.classList.toggle('open');
      mb?.setAttribute('aria-expanded', String(!!open));
    };
    const closeMenu = () => {
      mm?.classList.remove('open');
      mb?.setAttribute('aria-expanded', 'false');
    };
    mb?.addEventListener('click', onMenu);
    mm?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

    // ---- reveal-on-scroll ----
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (ents) => ents.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('in'); io!.unobserve(en.target); }
        }),
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
      );
      revealEls.forEach((el) => io!.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('in'));
    }

    // ---- aktif menü vurgusu ----
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]'));
    const map: Record<string, HTMLAnchorElement> = {};
    links.forEach((a) => { map[a.getAttribute('href')!.slice(1)] = a; });
    const secs = Array.from(document.querySelectorAll<HTMLElement>('section[id]'));
    let so: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      so = new IntersectionObserver(
        (ents) => ents.forEach((en) => {
          if (en.isIntersecting) {
            links.forEach((a) => a.classList.remove('active'));
            map[en.target.id]?.classList.add('active');
          }
        }),
        { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
      );
      secs.forEach((s) => so!.observe(s));
    }

    return () => {
      root.classList.remove('fx-on');
      sw?.removeEventListener('click', onSwClick);
      mb?.removeEventListener('click', onMenu);
      mm?.querySelectorAll('a').forEach((a) => a.removeEventListener('click', closeMenu));
      io?.disconnect();
      so?.disconnect();
    };
  }, []);

  return null;
}
