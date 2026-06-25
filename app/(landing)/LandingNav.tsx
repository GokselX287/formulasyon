'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ──────────────────────────────────────────────────────────────────────────
// Çok-sayfalı landing'in kalıcı üst navigasyonu. Her menü öğesi ayrı route'a
// gider (one-page çıpa değil). Aktif sayfa vurgulanır; mobilde menü açılır.
// Markup/sınıflar landing.css ile birebir (.navwrap/.nav/.nav-links ...).
// ──────────────────────────────────────────────────────────────────────────

const LINKS = [
  { href: '/moduller', label: 'Modüller' },
  { href: '/nasil-calisir', label: 'Nasıl çalışır' },
  { href: '/ozellikler', label: 'Özellikler' },
  { href: '/fiyat', label: 'Fiyat' },
  { href: '/sss', label: 'SSS' },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <div className="navwrap">
      <nav className="nav" aria-label="Birincil">
        <div className="brand">
          <Link href="/" className="logo">
            Calmie<i>.</i>
          </Link>
        </div>
        <div className="nav-links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(l.href) ? 'active' : undefined}
              aria-current={isActive(l.href) ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="nav-cta">
          <Link href="/giris" className="login">
            Giriş yap
          </Link>
          <Link href="/kayit" className="btn btn-primary">
            Kapalı betaya giriş kodu iste
          </Link>
          <button
            className="menu-btn"
            type="button"
            aria-label="Menü"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>
      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={isActive(l.href) ? 'active' : undefined}
            aria-current={isActive(l.href) ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
        <Link href="/giris" onClick={() => setOpen(false)}>
          Giriş yap
        </Link>
        <Link href="/kayit" className="btn" onClick={() => setOpen(false)}>
          Kapalı betaya giriş kodu iste
        </Link>
      </div>
    </div>
  );
}
