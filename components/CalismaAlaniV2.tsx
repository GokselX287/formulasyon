'use client';

import './CalismaAlaniV2.css';

// ──────────────────────────────────────────────────────────────────────────
// Çalışma Alanı — Hub landing · "Klinik Editöryel Dosya"
// Çalışma Alanı v2.html birebir port. 3 giriş kartı + son çalışılan şerit.
// Gerçek veriye bağlı: aktif/arşiv danışan + bugün seans + son çalışılanlar.
// Kullanıcı kararı: Formülasyon & Tasarım kartları çalışır (Yakında yok).
// ──────────────────────────────────────────────────────────────────────────

export type HubStat = { v: string; l: string };
export type RecentClient = { id: string; name: string; topic: string };

export type CalismaAlaniV2Props = {
  therapistName?: string;
  stats: HubStat[];
  recent: RecentClient[];
  onBack?(): void;
  onNav?(target: string): void;
  onNewClient?(): void;
  onOpenProfile?(): void;
  onOpenDanisanlar?(): void;
  onOpenFormulasyon?(): void;
  onOpenTasarimlar?(): void;
  onOpenTakvim?(): void;
  onOpenMuhasebe?(): void;
  onOpenClient?(id: string): void;
};

const TONES = [
  { bg: '#E8EAF7', ink: '#4C5078' }, { bg: '#FBE7DC', ink: '#8C5A41' }, { bg: '#DFF0E5', ink: '#477254' },
  { bg: '#E3EAF6', ink: '#46587C' }, { bg: '#EDE6F4', ink: '#604B75' }, { bg: '#F6EFD9', ink: '#6F5C30' },
];
const toneFor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
};
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

export default function CalismaAlaniV2(props: CalismaAlaniV2Props) {
  const { therapistName = 'Göksel Akkaya', stats, recent, onBack, onNav, onNewClient, onOpenProfile,
    onOpenDanisanlar, onOpenTasarimlar, onOpenTakvim, onOpenMuhasebe, onOpenClient } = props;

  const entries = [
    {
      no: '01', cls: 'c4', title: 'Takvim & Randevular', onClick: onOpenTakvim,
      desc: 'Haftalık/aylık takvim, randevular, hazırlık, müsaitlik ve geçmiş — seans akışının tamamı.',
      meta: ['Takvim', 'Hazırlık', 'Müsaitlik'], go: 'Takvimi aç',
      icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    },
    {
      no: '02', cls: 'c1', title: 'Danışan Listesi', onClick: onOpenDanisanlar,
      desc: 'Aktif ve geçmiş danışanlar — arama, etiket filtresi, süreklilik ve risk göstergeleri.',
      meta: [`${stats[0]?.v ?? '0'} aktif`, `${stats[1]?.v ?? '0'} arşiv`], go: 'Listeyi aç',
      icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    },
    {
      no: '03', cls: 'c3', title: 'Tasarım Dosyaları', onClick: onOpenTasarimlar,
      desc: 'Danışan materyalleri — dış görsellerin (Canva/Figma) yüklenmesi ve galeri yönetimi.',
      meta: ['Galeri', 'Yükle'], go: 'Galeriyi aç',
      icon: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="m21 15-5-5L5 21" /></>,
    },
    {
      no: '04', cls: 'c2', title: 'Muhasebe İçerikleri', onClick: onOpenMuhasebe,
      desc: 'Fatura ve mali belgeler — Drive’a bağlan, dosyaları doğrudan yükle ve sakla.',
      meta: ['Drive', 'Fatura', 'Yükle'], go: 'Muhasebeyi aç',
      icon: <><path d="M3 7h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M3 7l2.5-4h13L21 7" /><path d="M8 12h8" /></>,
    },
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="ca2">
        <div className="shell">

          <div className="topbar">
            <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Ana Sayfa</button>
            <div className="topbar-right">
              <button className="tb-new" type="button" onClick={() => onNewClient?.()}><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Yeni danışan</button>
              <button className="tb-prof" type="button" onClick={() => onOpenProfile?.()}><span className="av">{initials(therapistName)}</span><span className="nm">{therapistName}</span></button>
            </div>
          </div>

          <div className="modal-body">
            <div className="body-pad">

              <div className="intro" data-screen-label="Çalışma Alanı — Giriş">
                <div>
                  <span className="eyebrow">Çalışma Alanı</span>
                  <h1>Vaka çalışman, <i>tek yerde</i></h1>
                  <p className="lead">Danışan dosyaları, klinik formülasyon ve materyaller — hepsi buradan başlar.</p>
                </div>
                <div className="intro-stats">
                  {stats.map((s, i) => (
                    <div className="istat" key={i}><div className="v num">{s.v}</div><div className="l">{s.l}</div></div>
                  ))}
                </div>
              </div>

              <div className="hub">
                {entries.map((e) => (
                  <button type="button" className={`hcard ${e.cls}`} key={e.no} data-screen-label={e.title} onClick={() => e.onClick?.()}>
                    <span className="hc-no">{e.no}</span>
                    <span className="hc-icon"><svg viewBox="0 0 24 24">{e.icon}</svg></span>
                    <div className="hc-title">{e.title}</div>
                    <p className="hc-desc">{e.desc}</p>
                    <div className="hc-meta">{e.meta.map((m, j) => <span key={j}>{m}</span>)}</div>
                    <div className="hc-foot">
                      <span className="hc-go">{e.go}</span>
                      <span className="hc-arrow"><svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
                    </div>
                  </button>
                ))}
              </div>

              {recent.length > 0 && (
                <div className="recent" data-screen-label="Son çalışılan">
                  <div className="recent-head">
                    <span className="eyebrow">Son çalışılan dosyalar</span>
                    <a href="#" onClick={(e) => { e.preventDefault(); onOpenDanisanlar?.(); }}>Tüm danışanlar →</a>
                  </div>
                  <div className="rgrid">
                    {recent.map((r) => {
                      const t = toneFor(r.name);
                      return (
                        <button type="button" className="rcard" key={r.id} onClick={() => onOpenClient?.(r.id)}>
                          <span className="av" style={{ background: t.bg, color: t.ink }}>{initials(r.name)}</span>
                          <span className="who"><b>{r.name}</b><span>{r.topic}</span></span>
                        </button>
                      );
                    })}
                  </div>
                </div>
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
