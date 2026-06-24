'use client';

import { useEffect } from 'react';

// ──────────────────────────────────────────────────────────────────────────
// Landing'in vanilla JS etkileşimleri (cam/editöryel tasarım):
//  • mobil menü aç/kapa
//  • reveal-on-scroll (IntersectionObserver, .reveal → .in)
//  • sağ kenar bölüm ilerleme rayı (railNav) + scroll-spy
// Markup, page.tsx'te dangerouslySetInnerHTML ile SSR edilir; bu efekt
// hidrasyondan sonra DOM'a bağlanır. Tümünde temizleyici var (HMR/strict-mode).
// ──────────────────────────────────────────────────────────────────────────

export default function LandingFx() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // JS çalışıyor → reveal animasyonunu etkinleştir. (CSS'te gizleme .fx-on'a bağlı;
    // bu sınıf eklenmezse içerik baştan görünür kalır → landing asla boş kalmaz.)
    const root = document.documentElement;
    root.classList.add('fx-on');
    cleanups.push(() => root.classList.remove('fx-on'));

    // ---- mobil menü ----
    const mb = document.getElementById('menuBtn');
    const mm = document.getElementById('mobileMenu');
    if (mb && mm) {
      const toggle = () => mm.classList.toggle('open');
      mb.addEventListener('click', toggle);
      cleanups.push(() => mb.removeEventListener('click', toggle));
      const close = () => mm.classList.remove('open');
      const links = Array.from(mm.querySelectorAll('a'));
      links.forEach((a) => a.addEventListener('click', close));
      cleanups.push(() => links.forEach((a) => a.removeEventListener('click', close)));
    }

    // ---- reveal on scroll (rect + scroll: her tarayıcıda güvenilir) ----
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    const reveal = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      // Viewport ölçülemiyorsa (bazı headless/önizleme ortamları 0 döner) → hiçbir
      // içeriği gizli bırakma, hepsini aç. Gerçek tarayıcıda vh>0 → normal scroll-reveal.
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
    // layout/innerHeight ilk mount'ta hazır olmayabilir → birkaç gecikmeli pas
    requestAnimationFrame(reveal);
    const t = setTimeout(reveal, 300);
    window.addEventListener('load', reveal);
    window.addEventListener('scroll', reveal, { passive: true });
    cleanups.push(() => {
      clearTimeout(t);
      window.removeEventListener('load', reveal);
      window.removeEventListener('scroll', reveal);
    });

    // ---- sağ kenar bölüm ilerleme rayı ----
    const sections = [
      { id: 'hero', label: 'Giriş' },
      { id: 'problem', label: 'Sorun' },
      { id: 'moduller', label: 'Modüller' },
      { id: 'ozellikler', label: 'Özellikler' },
      { id: 'fiyat', label: 'Fiyat' },
      { id: 'sss', label: 'SSS' },
    ].filter((s) => document.getElementById(s.id));
    const host = document.getElementById('railNav');
    if (host && sections.length) {
      host.innerHTML = sections
        .map(
          (s, i) =>
            '<a class="rn-item" href="#' + s.id + '" data-id="' + s.id + '">' +
            '<span class="rn-num">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<span class="rn-label">' + s.label + '</span>' +
            '<span class="rn-tick"></span></a>',
        )
        .join('');

      let current: string | null = null;
      const setActive = (id: string) => {
        if (id === current) return;
        current = id;
        host.querySelectorAll('.rn-item').forEach((a) =>
          a.classList.toggle('active', (a as HTMLElement).dataset.id === id),
        );
      };
      const spy = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setActive(e.target.id);
          });
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
      );
      sections.forEach((s) => {
        const el = document.getElementById(s.id);
        if (el) spy.observe(el);
      });
      cleanups.push(() => spy.disconnect());

      const toggleRail = () =>
        host.classList.toggle('show', window.scrollY > window.innerHeight * 0.55);
      toggleRail();
      window.addEventListener('scroll', toggleRail, { passive: true });
      cleanups.push(() => window.removeEventListener('scroll', toggleRail));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
