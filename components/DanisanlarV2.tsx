'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './DanisanlarV2.css';
import type { Client } from './DanisanlarPanel';

// ──────────────────────────────────────────────────────────────────────────
// Danışanlar — "Klinik Editöryel Dosya" · Danışanlar v2.html birebir port.
// Aktif (active+takip) / Geçmiş (arşiv: 3 exitReason alt grubu + sebep yok).
// Gerçek veriye bağlı (clients: Client[]). Ekol bilinmiyorsa (modality 'Diğer')
// ekol çipi/filtre gösterilmez — uydurma yok.
// ──────────────────────────────────────────────────────────────────────────

export type DanisanlarV2Props = {
  clients: Client[];
  onBack?(): void;
  onNav?(target: string): void;
  onNewClient?(): void;
  onOpenClient?(id: string): void;
  onPrefetchClient?(id: string): void;
};

type View = 'aktif' | 'gecmis';

const TONES = [
  { bg: '#E8EAF7', ink: '#4C5078' }, { bg: '#FBE7DC', ink: '#8C5A41' }, { bg: '#DFF0E5', ink: '#477254' },
  { bg: '#E3EAF6', ink: '#46587C' }, { bg: '#EDE6F4', ink: '#604B75' }, { bg: '#F6EFD9', ink: '#6F5C30' },
];
const toneFor = (n: string) => {
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
};
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const trLower = (s: string) => s.toLocaleLowerCase('tr');

const ARCHIVE_GROUPS: { key: NonNullable<Client['exitReason']> | 'none'; label: string; note: string }[] = [
  { key: 'completed', label: 'Süreci tamamlayanlar', note: 'Hedeflerine ulaşıp planlı sonlandıran danışanlar.' },
  { key: 'dropout', label: 'Yarıda bırakanlar', note: 'Süreci kendi isteğiyle erken sonlandıranlar.' },
  { key: 'financial', label: 'Maddi sebeple bırakanlar', note: 'Ekonomik nedenle ara veren danışanlar.' },
  { key: 'none', label: 'Sebep belirtilmemiş', note: 'Arşivlenmiş ancak ayrılış sebebi girilmemiş danışanlar.' },
];

const outcomeText = (c: Client): string => {
  const n = c.sessionCount;
  switch (c.exitReason) {
    case 'completed': return `Tamamlandı · ${n} seans`;
    case 'dropout': return `Yarıda bıraktı · ${n}. seans`;
    case 'financial': return `Maddi sebep · ${n}. seans`;
    default: return `Arşiv · ${n} seans`;
  }
};

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

export default function DanisanlarV2(props: DanisanlarV2Props) {
  const { clients, onBack, onNav, onNewClient, onOpenClient, onPrefetchClient } = props;
  const [view, setView] = useState<View>('aktif');
  const [ekol, setEkol] = useState('');
  const [query, setQuery] = useState('');
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  const optRefs = useRef<Record<View, HTMLButtonElement | null>>({ aktif: null, gecmis: null });

  const activeClients = useMemo(() => clients.filter((c) => c.status !== 'passive'), [clients]);
  const archiveClients = useMemo(() => clients.filter((c) => c.status === 'passive'), [clients]);

  // Ekol filtresi yalnız gerçek ekol verisi varsa gösterilir (modality !== 'Diğer')
  const ekolOptions = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => { if (c.modality && c.modality !== 'Diğer') set.add(c.modality); });
    return [...set];
  }, [clients]);

  useEffect(() => {
    const el = optRefs.current[view];
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
  }, [view, activeClients.length, archiveClients.length]);

  const match = (c: Client) => {
    if (ekol && c.modality !== ekol) return false;
    if (query && !trLower(c.name).includes(query)) return false;
    return true;
  };

  const Row = ({ c, arch }: { c: Client; arch: boolean }) => {
    const t = toneFor(c.name);
    const watch = c.dropRisk === 'high' || c.dropRisk === 'medium';
    return (
      <button
        type="button"
        className={`row${arch ? ' arch' : ''}`}
        data-name={c.name}
        onMouseEnter={() => onPrefetchClient?.(c.id)}
        onClick={() => onOpenClient?.(c.id)}
      >
        <span className="av" style={{ background: t.bg, color: t.ink }}>{initials(c.name)}</span>
        <div className="who"><strong>{c.name}</strong><span>{c.age ? `${c.age} yaş` : `#${c.id}`}</span></div>
        <div className="mid">
          <div className="yak">{c.issue}</div>
          {c.modality && c.modality !== 'Diğer' && <span className="ekol">{c.modality}</span>}
        </div>
        {arch ? (
          <div className="end">
            <span className="seans"><b className="num">{c.sessionCount}</b>seans</span>
            <span className="outcome">{outcomeText(c)}</span>
          </div>
        ) : (
          <div className="end">
            <div className="cont"><span className="pct num">{c.continuityPct}%</span><span className="track"><span className="fill" style={{ width: `${c.continuityPct}%` }} /></span></div>
            <span className="seans"><b className="num">{c.sessionCount}</b>seans</span>
            {c.nextAppointment && <span className="nextapt">{c.nextAppointment}</span>}
            {watch && <span className="risk watch">drop riski</span>}
          </div>
        )}
      </button>
    );
  };

  const Empty = ({ t, s }: { t: string; s: string }) => (
    <div className="empty"><span className="ring">∅</span><span className="t">{t}</span><span className="s">{s}</span></div>
  );

  const activeRows = activeClients.filter(match);
  const archiveGroups = ARCHIVE_GROUPS
    .map((g) => ({ ...g, rows: archiveClients.filter((c) => (g.key === 'none' ? !c.exitReason : c.exitReason === g.key)).filter(match) }))
    .filter((g) => g.rows.length > 0);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="dn2" data-view={view}>
        <div className="shell">

          <div className="topbar">
            <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Çalışma Alanı</button>
            <button className="tb-new" type="button" onClick={() => onNewClient?.()}><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Yeni danışan</button>
          </div>

          <div className="modal-body">

            <div className="controls">
              <div className="controls-in">
                <div className="cr-top">
                  <div className="seg" role="group" aria-label="Liste">
                    <span className="thumb" style={thumb ? { left: thumb.left, width: thumb.width } : { opacity: 0 }} />
                    <button ref={(el) => { optRefs.current.aktif = el; }} className="opt" aria-pressed={view === 'aktif'} onClick={() => setView('aktif')}>Aktif <span className="ct">{activeClients.length}</span></button>
                    <button ref={(el) => { optRefs.current.gecmis = el; }} className="opt" aria-pressed={view === 'gecmis'} onClick={() => setView('gecmis')}>Geçmiş <span className="ct">{archiveClients.length}</span></button>
                  </div>
                  <div className="search">
                    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                    <input type="text" value={query} onChange={(e) => setQuery(trLower(e.target.value.trim()))} placeholder="Danışan ara…" aria-label="Danışan ara" />
                  </div>
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

            <div className="list-wrap">
              {view === 'aktif' ? (
                <>
                  {(() => {
                    const f = { haftalik: 0, iki_haftalik: 0, aylik: 0 };
                    activeClients.forEach((c) => { const k = (c as any).takipSikligi as keyof typeof f | undefined; if (k && f[k] != null) f[k]++; });
                    return (
                      <div className="freq-bar">
                        <div className="freq-m"><span className="v num">{f.haftalik}</span><span className="l">Haftalık</span></div>
                        <div className="freq-m"><span className="v num">{f.iki_haftalik}</span><span className="l">2 haftalık</span></div>
                        <div className="freq-m"><span className="v num">{f.aylik}</span><span className="l">Aylık</span></div>
                        <div className="freq-m total"><span className="v num">{activeClients.length}</span><span className="l">Toplam aktif</span></div>
                      </div>
                    );
                  })()}
                  {activeRows.length ? (
                    <div className="grp">
                      <div className="grp-head"><span className="eyebrow">Aktif danışanlar</span><span className="ct num">{activeRows.length} kayıt</span></div>
                      {activeRows.map((c) => <Row key={c.id} c={c} arch={false} />)}
                    </div>
                  ) : <Empty t="Eşleşen aktif danışan yok" s="Arama ya da ekol filtresini değiştir." />}
                </>
              ) : (
                archiveGroups.length ? (
                  archiveGroups.map((g) => (
                    <div className="grp" key={g.key}>
                      <div className="grp-head"><span className="eyebrow">{g.label}</span><span className="ct num">{g.rows.length} kayıt</span></div>
                      <p className="grp-note">{g.note}</p>
                      {g.rows.map((c) => <Row key={c.id} c={c} arch={true} />)}
                    </div>
                  ))
                ) : <Empty t="Eşleşen arşiv kaydı yok" s="Arama ya da ekol filtresini değiştir." />
              )}
            </div>

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
