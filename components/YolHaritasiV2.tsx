'use client';

import { useMemo, useState } from 'react';
import './YolHaritasiV2.css';

// ──────────────────────────────────────────────────────────────────────────
// Yol Haritası — "Klinik Editöryel Dosya" · Yol Haritası v2.html birebir port.
// Terapistin kendi araç/materyal geliştirme yol haritası (statik içerik).
// Durum filtresi (Tümü/Hazır/Yapımda/Planlı) + özet şeridi + galeri.
// ──────────────────────────────────────────────────────────────────────────

export type YolHaritasiV2Props = {
  onBack?(): void;
  onNav?(target: string): void;
  onNewTool?(): void;
};

type Stage = 'done' | 'wip' | 'plan';
type Tool = { t: string; cat: string; stage: Stage; pct: number; icon: keyof typeof ICONS; desc: string };

const ICONS = {
  cycle: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v4h4" /></>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></>,
  radar: <><polygon points="12 3 20 9 17 19 7 19 4 9" /><polygon points="12 8 16 11 14.5 16 9.5 16 8 11" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>,
  ladder: <><path d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  play: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M10 9l5 3-5 3z" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><polygon points="15.5 8.5 11 11 8.5 15.5 13 13" /></>,
};

const STAGE_TXT: Record<Stage, string> = { done: 'Hazır', wip: 'Yapımda', plan: 'Planlı' };

const TOOLS: Tool[] = [
  { t: 'BDT Döngüsü Görselleştirme', cat: 'Görselleştirme · BDT', stage: 'done', pct: 100, icon: 'cycle', desc: 'Düşünce–duygu–davranış–beden zincirini danışanla canlı doldurma aracı.' },
  { t: 'ACT Matriks', cat: 'Görselleştirme · ACT', stage: 'done', pct: 100, icon: 'grid', desc: 'Dört çeyrek matris: değer yönü vs. kaçınma, seans içi kullanım için.' },
  { t: 'Radar / Heatmap Dashboard', cat: 'Dashboard · Ölçüm', stage: 'wip', pct: 64, icon: 'radar', desc: 'Hexaflex radarı + seans-arası SUDS ısı haritası; danışan ilerleme paneli.' },
  { t: 'Otomatik Rapor Taslağı', cat: 'Otomasyon · AI', stage: 'wip', pct: 42, icon: 'doc', desc: 'Seans notlarından kurum/aile için biçimlendirilmiş özet taslağı üretir.' },
  { t: 'Maruziyet Rasyoneli Formu', cat: 'Form · BDT/ERP', stage: 'wip', pct: 30, icon: 'ladder', desc: 'Danışana maruziyetin mantığını açıklayan, basamak hiyerarşisi kuran form.' },
  { t: 'Ders Programı Şablonu', cat: 'Şablon · Psikoeğitim', stage: 'plan', pct: 0, icon: 'calendar', desc: 'Grup/psikoeğitim oturumları için haftalık modül planlayıcı.' },
  { t: 'Etkinlik Dosyası', cat: 'Materyal · Çocuk', stage: 'plan', pct: 0, icon: 'play', desc: 'Oyun terapisi etkinlik kartları arşivi; yaşa göre filtrelenebilir.' },
  { t: 'Değerler Pusulası', cat: 'Görselleştirme · ACT', stage: 'plan', pct: 0, icon: 'compass', desc: 'Yaşam alanları üzerinde değer-eylem uyumunu gösteren interaktif pusula.' },
];

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi', active: true },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

export default function YolHaritasiV2(props: YolHaritasiV2Props) {
  const { onBack, onNav, onNewTool } = props;
  const [stage, setStage] = useState<Stage | ''>('');

  const counts = useMemo(() => ({
    all: TOOLS.length,
    done: TOOLS.filter((t) => t.stage === 'done').length,
    wip: TOOLS.filter((t) => t.stage === 'wip').length,
    plan: TOOLS.filter((t) => t.stage === 'plan').length,
    avg: Math.round(TOOLS.reduce((n, t) => n + t.pct, 0) / TOOLS.length),
  }), []);

  const rows = stage ? TOOLS.filter((t) => t.stage === stage) : TOOLS;
  const tailNote = stage
    ? `${rows.length} araç gösteriliyor · ${STAGE_TXT[stage]}`
    : `${TOOLS.length} araç · yeni eklemek için sağ üstten “Yeni araç”.`;

  const FILTERS: { key: Stage | ''; label: string; ct: number; dot?: string }[] = [
    { key: '', label: 'Tümü', ct: counts.all },
    { key: 'done', label: 'Hazır', ct: counts.done, dot: 'var(--pos)' },
    { key: 'wip', label: 'Yapımda', ct: counts.wip, dot: 'var(--now)' },
    { key: 'plan', label: 'Planlı', ct: counts.plan, dot: 'var(--ink-faint)' },
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="yh2" data-stage={stage}>
        <div className="shell">

          <div className="topbar">
            <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Çalışma Alanı</button>
            <button className="tb-new" type="button" onClick={() => onNewTool?.()}><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Yeni araç</button>
          </div>

          <div className="modal-body">

            <div className="hero">
              <span className="eyebrow">Çalışma Alanı · Yol Haritası</span>
              <h1>Araç &amp; materyal <i>yol haritası</i></h1>
              <p>Klinik pratiği için geliştirdiğin görselleştirme, form ve şablonların kuyruğu. Her kart bir araç; durumuyla, kategorisiyle ve ilerlemesiyle birlikte.</p>
              <div className="summary">
                <span className="sm"><b className="num">{counts.all}</b><span>araç</span></span>
                <span className="sm"><b className="num">{counts.done}</b><span>hazır</span></span>
                <span className="sm live"><b className="num">{counts.wip}</b><span>yapımda</span></span>
                <span className="sm"><b className="num">{counts.avg}%</b><span>ortalama ilerleme</span></span>
              </div>
            </div>

            <div className="filterbar">
              <div className="filterbar-in">
                <span className="lbl">Durum</span>
                {FILTERS.map((f) => (
                  <button key={f.key || 'all'} className={`chip${stage === f.key ? ' on' : ''}`} onClick={() => setStage(f.key)}>
                    {f.dot && <span className="d" style={{ background: f.dot }} />}{f.label} <span className="ct">{f.ct}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="gallery">
              {rows.length === 0 ? (
                <div className="empty"><span className="ring">∅</span><span className="t">Bu durumda araç yok</span></div>
              ) : rows.map((t, i) => (
                <article className={`tool ${t.stage}`} key={i} data-screen-label={`Araç — ${t.t}`}>
                  <div className="tool-top">
                    <span className="ic"><svg viewBox="0 0 24 24">{ICONS[t.icon]}</svg></span>
                    <span className={`status ${t.stage}`}><span className="d" />{STAGE_TXT[t.stage]}</span>
                  </div>
                  <h3>{t.t}</h3>
                  <div className="cat">{t.cat}</div>
                  <p className="desc">{t.desc}</p>
                  <div className="foot">
                    <span className="track"><span className="fill" style={{ width: `${t.pct}%` }} /></span>
                    <span className="pct num">{t.pct}%</span>
                  </div>
                </article>
              ))}
            </div>
            <div className="tail"><p>{tailNote}</p></div>

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
