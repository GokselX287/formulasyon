'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import './CalmieChrome.css';
import './CalismaAlaniShell.css';

// ──────────────────────────────────────────────────────────────────────────
// Çalışma Alanı Shell — Çalışma Alanı alt sayfaları (SMS, Muhasebe …) için
// paylaşılan editöryel kabuk. Tema mesh/foto zemin + üst menü (Ana Sayfa
// dock'u, kayan glider) paylaşımlı chrome'dan (CalmieChrome.css) gelir; üstte
// hafif frosted veil, içerik kabartılı beyaz nöromorfik kartlarda sergilenir.
// Görsel dil AyarlarPanel (.ayr) ile birebir — menü/tema her sayfada aynı.
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_BG = '/calmie-hero-default.jpg';
const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Ayarlar', target: 'ayarlar' },
];

export type CalismaAlaniShellProps = {
  eyebrow: string;
  title: ReactNode;        // ör. <>SMS <i>gönderimi</i></>
  lead?: string;
  backLabel?: string;
  wide?: boolean;
  onBack?: () => void;
  onNav?: (t: string) => void;
  children: ReactNode;
  /** Danışanlar listesiyle BİREBİR nötr gri zemin (tema mesh/foto yerine). Menü yazıları koyuya döner. */
  plain?: boolean;
};

export default function CalismaAlaniShell({ eyebrow, title, lead, backLabel = 'Çalışma Alanı', wide, onBack, onNav, children, plain }: CalismaAlaniShellProps) {
  const [theme] = useState<string>(() => lsGet('calmie-theme') || 'sage');
  const [bgPhoto] = useState<string | null>(() => lsGet('siyi_home_bg_v1'));

  // ── menü glider (Ana Sayfa ile aynı) ──
  const menuRef = useRef<HTMLElement>(null);
  const gliderRef = useRef<HTMLSpanElement>(null);
  const activeLink = () => (menuRef.current?.querySelector('a.active') || menuRef.current?.querySelector('a')) as HTMLElement | null;
  const moveGlider = (a: HTMLElement | null, instant = false) => {
    const g = gliderRef.current; if (!g || !a) return;
    if (instant) g.style.transition = 'none';
    g.style.width = a.offsetWidth + 'px';
    g.style.transform = `translateX(${a.offsetLeft}px)`;
    g.classList.add('on');
    menuRef.current?.querySelectorAll('a').forEach((l) => l.classList.toggle('lit', l === a));
    if (instant) { void g.offsetWidth; g.style.transition = ''; }
  };
  useEffect(() => {
    moveGlider(activeLink(), true);
    const onR = () => moveGlider(activeLink(), true);
    window.addEventListener('resize', onR);
    (document as any).fonts?.ready?.then(() => moveGlider(activeLink(), true));
    return () => window.removeEventListener('resize', onR);
  }, []);

  return (
    <div className="cas cchrome" data-theme={theme}>
      {/* tema mesh/foto zemin — paylaşımlı */}
      <div className="app-bg" aria-hidden="true">
        <span className="hb-mesh" />
        <img className="hb-photo" alt="" src={bgPhoto || DEFAULT_BG} />
        <img className="hb-cherry" alt="" src="/tema-cherry.jpg" /><span className="hb-cherry-scrim" />
        <img className="hb-fur" alt="" src="/tema-kurk.jpg" /><span className="hb-fur-scrim" />
        <span className="hb-tint" /><span className="hb-veil" /><span className="hb-grain" />
      </div>

      {/* üst menü — Ana Sayfa dock'u ile aynı */}
      <header className="page-menu">
        <span className="pm-brand"><b>Calmie</b><i>.</i></span>
        <nav className="pm-nav" aria-label="Sayfa menüsü" ref={menuRef} onMouseLeave={() => moveGlider(activeLink())}>
          <span className="pm-glider" ref={gliderRef} aria-hidden="true" />
          {DOCK.map((d) => (
            <a key={d.target} href="#" className={d.active ? 'active' : ''} onMouseEnter={(e) => moveGlider(e.currentTarget)}
              onClick={(e) => { e.preventDefault(); if (!d.active) onNav?.(d.target); }}>{d.label}</a>
          ))}
        </nav>
      </header>

      {/* içerik */}
      <div className="cas-scroll">
        <div className={'cas-inner' + (wide ? ' cas-wide' : '')}>
          <header className="cas-head">
            {onBack && <button className="cas-back" type="button" onClick={() => onBack()}><span className="chev">‹</span>{backLabel}</button>}
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            {lead && <p className="cas-lead">{lead}</p>}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
