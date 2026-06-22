'use client';

import { useEffect, useState, type ReactNode } from 'react';
import './CalmieChrome.css';
import '@/app/giris/giris.css';

// Paylaşılan auth kabuğu — Calmie tema mesh/foto zemini + frosted gate + marka.
// /giris, /kayit, /sifre-sifirla, /dogrula bunu kullanır (tek tutarlı görünüm).

const DEFAULT_BG = '/calmie-hero-default.jpg';
const lsGet = (k: string): string | null => {
  try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; }
};

export default function AuthChrome({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('default');
  const [bgPhoto, setBgPhoto] = useState<string | null>(null);
  useEffect(() => { setTheme(lsGet('calmie_home_bgtheme') || 'default'); setBgPhoto(lsGet('siyi_home_bg_v1')); }, []);

  return (
    <div className="giris cchrome" data-bg={theme === 'default' ? undefined : theme}>
      <div className="app-bg" aria-hidden="true">
        <span className="hb-mesh" />
        <img className="hb-photo" alt="" src={bgPhoto || DEFAULT_BG} />
        <img className="hb-cherry" alt="" src="/tema-cherry.jpg" /><span className="hb-cherry-scrim" />
        <img className="hb-fur" alt="" src="/tema-kurk.jpg" /><span className="hb-fur-scrim" />
        <span className="hb-tint" /><span className="hb-veil" /><span className="hb-grain" />
      </div>
      <header className="g-top"><b>Calmie</b><i>.</i></header>
      <div className="gate">{children}</div>
    </div>
  );
}

// ── Sosyal giriş butonları — yalnız etkin (env'i dolu) sağlayıcılar gösterilir ──
const ICONS: Record<string, ReactNode> = {
  google: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.9a5.04 5.04 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.26-4.72 3.26-8.07z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.24 1.05-3.74 1.05-2.87 0-5.3-1.94-6.17-4.55H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.83 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.65-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.13-3.13C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.65 2.84C6.7 7.31 9.13 5.38 12 5.38z"/></svg>
  ),
  microsoft: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#F25022" d="M3 3h8.5v8.5H3z"/><path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z"/><path fill="#00A4EF" d="M3 12.5h8.5V21H3z"/><path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z"/></svg>
  ),
};

export function OAuthButtons({ providers, prefix = 'ile devam et' }: {
  providers: { id: string; label: string }[];
  prefix?: string;
}) {
  if (!providers?.length) return null;
  return (
    <div className="oauth-row">
      {providers.map((p) => (
        <a key={p.id} className="btn oauth" href={`/api/auth/oauth/${p.id}`}>
          {ICONS[p.id]} {p.label} {prefix}
        </a>
      ))}
    </div>
  );
}
