'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './SozlukV2.css';
import { SOZLUK, type Ekol } from '@/lib/sozluk-icerik';

// ──────────────────────────────────────────────────────────────────────────
// Sözlük — "Klinik Editöryel Dosya" · Sözlük v2.html port.
// Gerçek SOZLUK (ekol bazlı girdiler) düzleştirilir; cat = ekol abbr.
// Arama + kategori chip + kart/liste görünümü + alfabetik. Uydurma yok.
// ──────────────────────────────────────────────────────────────────────────

export type SozlukV2Props = { onBack?(): void; onNav?(target: string): void };

type Term = { term: string; abbr: string; cat: string; def: string; related: string[] };

const TERMS: Term[] = (Object.keys(SOZLUK) as Ekol[]).flatMap((ekol) => {
  const b = SOZLUK[ekol];
  return b.girdiler.map((g) => ({ term: g.terim, abbr: b.abbr, cat: b.abbr, def: g.kisaTanim, related: g.etiketler ?? [] }));
});

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

export default function SozlukV2(props: SozlukV2Props) {
  const { onBack, onNav } = props;
  const [layout, setLayout] = useState<'kart' | 'liste'>('kart');
  const [cat, setCat] = useState('');
  const [query, setQuery] = useState('');
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  const vtRefs = useRef<Record<string, HTMLButtonElement | null>>({ kart: null, liste: null });

  useEffect(() => { const el = vtRefs.current[layout]; if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth }); }, [layout]);

  const cats = useMemo(() => [...new Set(TERMS.map((t) => t.cat))], []);
  const rows = useMemo(() => TERMS.filter((t) => {
    if (cat && t.cat !== cat) return false;
    if (query) { const hay = `${t.term} ${t.abbr} ${t.def} ${t.cat}`.toLocaleLowerCase('tr'); if (!hay.includes(query)) return false; }
    return true;
  }).sort((a, b) => a.term.localeCompare(b.term, 'tr')), [cat, query]);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="sz2" data-layout={layout}>
        <div className="shell">

          <div className="topbar">
            <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Ana Sayfa</button>
          </div>

          <div className="modal-body">
            <div className="hero">
              <span className="eyebrow">Referans · Klinik Sözlük</span>
              <h1>Klinik terim <i>sözlüğü</i></h1>
              <p>Ekol, teknik ve kavram tanımları. Seans notu yazarken hızlı başvuru; ana sayfadaki kısa kartlar buradan beslenir.</p>
            </div>

            <div className="controls">
              <div className="controls-in">
                <div className="cr-top">
                  <div className="search">
                    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                    <input type="text" value={query} onChange={(e) => setQuery(e.target.value.trim().toLocaleLowerCase('tr'))} placeholder="Terim, kısaltma ya da tanımda ara…" aria-label="Sözlükte ara" />
                  </div>
                  <div className="viewtog" role="group" aria-label="Görünüm">
                    <span className="thumb" style={thumb ? { left: thumb.left, width: thumb.width } : { opacity: 0 }} />
                    <button ref={(el) => { vtRefs.current.kart = el; }} aria-pressed={layout === 'kart'} onClick={() => setLayout('kart')}><svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></svg>Kart</button>
                    <button ref={(el) => { vtRefs.current.liste = el; }} aria-pressed={layout === 'liste'} onClick={() => setLayout('liste')}><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>Liste</button>
                  </div>
                </div>
                <div className="cats">
                  <span className="lbl">Kategori</span>
                  <button className={`chip${cat === '' ? ' on' : ''}`} onClick={() => setCat('')}>Tümü</button>
                  {cats.map((c) => <button key={c} className={`chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
                </div>
              </div>
            </div>

            <div className="wrap">
              <div className="alpha"><b>{rows.length}</b> terim{cat ? ` · ${cat}` : ''}{query ? ` · “${query}” araması` : ''}</div>
              {rows.length === 0 ? (
                <div className="grid"><div className="empty"><span className="ring">∅</span><span className="t">Eşleşen terim yok</span></div></div>
              ) : (<>
                <div className="grid">
                  {rows.map((t, i) => (
                    <article className="term" key={i} data-screen-label={`Terim — ${t.term}`}>
                      <div className="term-top"><h3>{t.term}</h3>{t.abbr && <span className="abbr">{t.abbr}</span>}</div>
                      <span className="cat">{t.cat}</span>
                      <p className="def">{t.def}</p>
                      {t.related.length > 0 && <div className="rel">{t.related.map((r, j) => <span key={j}>{r}</span>)}</div>}
                    </article>
                  ))}
                </div>
                <div className="list">
                  {rows.map((t, i) => (
                    <div className="lrow" key={i} data-screen-label={`Terim — ${t.term}`}>
                      <div className="lt">{t.term}{t.abbr && <span className="abbr">{t.abbr}</span>}</div>
                      <div className="ld">{t.def}</div>
                      <span className="lc">{t.cat}</span>
                    </div>
                  ))}
                </div>
              </>)}
            </div>
            <div className="tail"><p>{TERMS.length} terim · alfabetik</p></div>
          </div>

          <nav className="dock" aria-label="Bölümler">
            {DOCK.map((d) => (
              <a key={d.target} href="#" className={d.target === 'home' ? '' : ''} onClick={(e) => { e.preventDefault(); onNav?.(d.target); }}>{d.label}</a>
            ))}
          </nav>

        </div>
      </div>
    </>
  );
}
