'use client';

import { useEffect, useMemo, useState } from 'react';
import './MudahaleV2.css';
import type { Intervention } from './MudahalePanel';

// ──────────────────────────────────────────────────────────────────────────
// Müdahale Kütüphanesi — "Klinik Editöryel Dosya" · Müdahale v2.html port.
// Teknik kartları + ekol filtresi (gerçek modality'lerden) + arama + favori +
// seans sepeti + detay modalı (adımlar/kullanım/kaynak). Gerçek interventions.
// ──────────────────────────────────────────────────────────────────────────

export type MudahaleV2Props = {
  interventions: Intervention[];
  basket: string[];
  onBack?(): void;
  onNav?(target: string): void;
  onToggleFavorite?(id: string): void;
  onAddToBasket?(id: string): void;
  onRemoveFromBasket?(id: string): void;
  onCreateSessionPlan?(ids: string[]): void;
};

const DURATION_LABEL: Record<string, string> = {
  'kisa': '≤10 dk', 'orta': '10-25 dk', 'uzun': '25 dk+', 'tam-seans': 'Tam seans',
};
const FORMAT_LABEL: Record<string, string> = {
  'seans-ici': 'Seans-içi', 'ev-odevi': 'Ev ödevi', 'psikoegitim': 'Psikoeğitim', 'calisma-kagidi': 'Çalışma kâğıdı',
};
const EVIDENCE_LABEL: Record<string, string> = {
  'rkc': 'RKÇ', 'sistematik-review': 'Sistematik review', 'klinik-kilavuz': 'Klinik kılavuz', 'vaka-serisi': 'Vaka serisi',
};

const catText = (it: Intervention) => (it.problems ?? []).slice(0, 3).join(' · ') || '—';
const metaList = (it: Intervention) => [
  DURATION_LABEL[it.duration] ?? it.duration,
  FORMAT_LABEL[it.format] ?? it.format,
  EVIDENCE_LABEL[it.evidence] ?? it.evidence,
].filter(Boolean);
const srcText = (it: Intervention) => it.references?.[0]?.title ?? '';

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

export default function MudahaleV2(props: MudahaleV2Props) {
  const { interventions, basket, onBack, onNav, onToggleFavorite, onAddToBasket, onRemoveFromBasket, onCreateSessionPlan } = props;
  const [ekol, setEkol] = useState('');
  const [query, setQuery] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const ekolOptions = useMemo(() => {
    const set = new Set<string>();
    interventions.forEach((it) => { if (it.modality) set.add(it.modality); });
    return [...set];
  }, [interventions]);

  const inBasket = (id: string) => basket.includes(id);
  const toggleBasket = (id: string) => (inBasket(id) ? onRemoveFromBasket : onAddToBasket)?.(id);

  const visible = (it: Intervention) => {
    if (ekol && it.modality !== ekol) return false;
    if (favOnly && !it.favorite) return false;
    if (query) {
      const hay = `${it.title} ${it.description} ${(it.problems ?? []).join(' ')}`.toLocaleLowerCase('tr');
      if (!hay.includes(query)) return false;
    }
    return true;
  };

  const rows = interventions.filter(visible);
  const open = openId ? interventions.find((it) => it.id === openId) ?? null : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenId(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const HeartIcon = () => (<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 5a5 5 0 0 1 9.5 7c-2.5 4.5-9.5 9-9.5 9z" /></svg>);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="mk2">
        <div className="shell">

          <div className="topbar">
            <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Çalışma Alanı</button>
            <button className="cart-btn" type="button" onClick={() => basket.length && onCreateSessionPlan?.(basket)}>
              <svg viewBox="0 0 24 24"><path d="M5 7h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
              Seans sepeti <span className={`ct${basket.length === 0 ? ' zero' : ''}`}>{basket.length}</span>
            </button>
          </div>

          <div className="modal-body">

            <div className="head" data-screen-label="Müdahale Kütüphanesi">
              <span className="eyebrow">Müdahale Kütüphanesi</span>
              <h1>Teknik &amp; <i>protokol</i> kitaplığı</h1>
              <p className="lead">Ekole göre süzülmüş kanıta dayalı teknikler. Bir kartı aç — uygulama adımları ve kaynağıyla; favorile, seans sepetine ekleyip danışana ata.</p>
            </div>

            <div className="controls">
              <div className="controls-in">
                <div className="cr-top">
                  <div className="search">
                    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                    <input type="text" value={query} onChange={(e) => setQuery(e.target.value.trim().toLocaleLowerCase('tr'))} placeholder="Teknik ara…" aria-label="Teknik ara" />
                  </div>
                  <button className={`fav-toggle${favOnly ? ' on' : ''}`} type="button" onClick={() => setFavOnly((v) => !v)}><HeartIcon />Favoriler</button>
                </div>
                {ekolOptions.length > 0 && (
                  <div className="filters">
                    <span className="lbl">Ekol</span>
                    <button className={`chip${ekol === '' ? ' on' : ''}`} onClick={() => setEkol('')}>Tümü</button>
                    {ekolOptions.map((e) => (
                      <button key={e} className={`chip${ekol === e ? ' on' : ''}`} onClick={() => setEkol(e)}>{e}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid-wrap">
              <div className="grid">
                {rows.length === 0 ? (
                  <div className="empty"><span className="ring">∅</span><span className="t">Eşleşen teknik yok</span><span>Arama, ekol ya da favori filtresini değiştir.</span></div>
                ) : rows.map((it) => (
                  <article className="tcard" key={it.id} onClick={() => setOpenId(it.id)} data-screen-label={`Teknik — ${it.title}`}>
                    <div className="tc-top">
                      <span className="tc-ekol">{it.modality}</span>
                      <button className={`fav${it.favorite ? ' on' : ''}`} aria-label="Favori" onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(it.id); }}><HeartIcon /></button>
                    </div>
                    <h3>{it.title}</h3>
                    <p className="desc">{it.description}</p>
                    <div className="cat">{catText(it)}</div>
                    <div className="tc-foot">
                      <span className="steps-n">{it.protocol?.length ? `${it.protocol.length} adım` : 'Protokol'}</span>
                      <button className={`add-btn${inBasket(it.id) ? ' added' : ''}`} onClick={(e) => { e.stopPropagation(); toggleBasket(it.id); }}>
                        {inBasket(it.id) ? 'Sepette ✓' : <><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Sepete</>}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

          </div>{/* /modal-body */}

          {/* DETAY MODALI */}
          <div className={`overlay${open ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setOpenId(null); }}>
            {open && (
              <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className="sheet-head">
                  <div className="sheet-top">
                    <span className="tc-ekol">{open.modality} · {catText(open)}</span>
                    <button className="sheet-close" aria-label="Kapat" onClick={() => setOpenId(null)}>✕</button>
                  </div>
                  <h2>{open.title}</h2>
                  <p className="sub">{open.description}</p>
                </div>
                <div className="sheet-body">
                  {open.protocol?.length ? (
                    <div className="blk">
                      <div className="bh">Uygulama adımları<span className="ln" /></div>
                      <ol className="steps">{open.protocol.map((s, i) => <li key={i}><span>{s}</span></li>)}</ol>
                    </div>
                  ) : null}
                  <div className="blk">
                    <div className="bh">Kullanım<span className="ln" /></div>
                    <div className="meta-row">{metaList(open).map((m, i) => <span className="m" key={i}>{m}</span>)}</div>
                  </div>
                  {srcText(open) && (
                    <div className="blk">
                      <div className="bh">Kaynak<span className="ln" /></div>
                      <p className="src">{srcText(open)}</p>
                    </div>
                  )}
                </div>
                <div className="sheet-foot">
                  <button className="btn ghost" onClick={() => onToggleFavorite?.(open.id)}>
                    <svg viewBox="0 0 24 24" fill={open.favorite ? 'currentColor' : 'none'}><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 5a5 5 0 0 1 9.5 7c-2.5 4.5-9.5 9-9.5 9z" /></svg>
                    {open.favorite ? 'Favoride' : 'Favorile'}
                  </button>
                  <button className="btn solid" onClick={() => { if (inBasket(open.id)) onCreateSessionPlan?.(basket); else onAddToBasket?.(open.id); }}>
                    <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                    {inBasket(open.id) ? 'Sepette · danışana ata' : 'Seans sepetine ekle'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <nav className="dock" aria-label="Bölümler">
            {DOCK.map((d) => (
              <a key={d.target} href="#" className={d.active ? 'active' : ''} onClick={(e) => { e.preventDefault(); if (!d.active) onNav?.(d.target); }}>{d.label}</a>
            ))}
          </nav>

        </div>
      </div>
    </>
  );
}
