'use client';

import { useEffect, useState } from 'react';
import './SeansaHazirlikV2.css';

// ──────────────────────────────────────────────────────────────────────────
// Seansa Hazırlık — "Klinik Editöryel Dosya" · Seansa Hazırlık v2.html port.
// Hero (danışan + geri sayım) · niyet (gerçek brief notu, düzenlenebilir) ·
// vital/son sözler/araç kiti/plan. Veri yoksa blok gizlenir (uydurma yok).
// Niyet → gerçek /api/brief (patientId). Diğer viz blokları örnek (illüstratif,
// app'in demo-briefing pattern'i) — gerçek seyir/plan verisi bağlanınca dolar.
// ──────────────────────────────────────────────────────────────────────────

export type BriefVital = { label: string; series: number[]; unit: string };
export type BriefPlanBlock = { dur: string; t: string; d: string; phase: string };
export type SeansaHazirlikV2Props = {
  clientId: string;
  clientName?: string;
  topic?: string;
  ekol?: string;
  at?: string;           // "10:00"
  inMin?: number | null; // seansa kalan dk
  intent?: string;
  vitals?: BriefVital[];
  lastWords?: { quote: string; src: string } | null;
  toolkit?: { t: string; icon: keyof typeof ICONS }[];
  plan?: BriefPlanBlock[];
  onBack?(): void;
  onNav?(target: string): void;
  onOpenFile?(): void;
  onSaveIntent?(text: string): void;
  onOpenLibrary?(): void;
};

const ICONS = {
  leaf: <><path d="M5 21c0-8 5-14 14-16-1 9-6 15-14 16z" /><path d="M5 21c3-5 7-8 12-9" /></>,
  tag: <><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z" /><circle cx="8" cy="8" r="1.5" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><polygon points="15.5 8.5 11 11 8.5 15.5 13 13" /></>,
  ladder: <><path d="M7 3v18M17 3v18M7 8h10M7 13h10M7 18h10" /></>,
};

const TONES = [{ bg: '#E8EAF7', ink: '#4C5078' }, { bg: '#FBE7DC', ink: '#8C5A41' }, { bg: '#DFF0E5', ink: '#477254' }, { bg: '#E3EAF6', ink: '#46587C' }, { bg: '#EDE6F4', ink: '#604B75' }, { bg: '#F6EFD9', ink: '#6F5C30' }];
const toneFor = (n: string) => { let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return TONES[h % TONES.length]; };
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

function Spark({ series }: { series: number[] }) {
  const w = 140, h = 42, max = Math.max(...series), min = Math.min(...series), rng = (max - min) || 1;
  const step = w / (series.length - 1);
  const pts = series.map((v, i) => [i * step, h - ((v - min) / rng) * (h - 8) - 4]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"><path d={d} fill="none" stroke="#57554F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="3.5" fill="#2A2926" /></svg>;
}

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

export default function SeansaHazirlikV2(props: SeansaHazirlikV2Props) {
  const { clientName = 'Danışan', topic, ekol, at, inMin, vitals, lastWords, toolkit, plan, onBack, onNav, onOpenFile, onSaveIntent, onOpenLibrary } = props;
  const [editing, setEditing] = useState(false);
  const [intent, setIntent] = useState(props.intent ?? '');
  useEffect(() => { setIntent(props.intent ?? ''); }, [props.intent]);

  const t = toneFor(clientName);
  const cd = inMin != null ? (inMin >= 60 ? `${Math.floor(inMin / 60)}s ${inMin % 60}dk` : `${inMin} dk`) : null;
  const planTotal = plan?.reduce((n, b) => n + (parseInt(b.dur) || 0), 0) ?? 0;

  const saveIntent = () => { setEditing(false); onSaveIntent?.(intent); };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&display=swap" rel="stylesheet" />

      <div className="sh2">
        <div className="shell">

          <div className="topbar">
            <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Takvim</button>
            <button className="tb-open" type="button" onClick={() => onOpenFile?.()}><svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>Dosyayı aç</button>
          </div>

          <div className="modal-body">
            <div className="hero">
              <div className="hero-in">
                <div>
                  <span className="eyebrow">Seansa hazırlık · sıradaki</span>
                  <div className="who">
                    <span className="av" style={{ background: t.bg, color: t.ink }}>{initials(clientName)}</span>
                    <div><h1>{clientName}</h1><div className="sub">{[topic, ekol].filter(Boolean).join(' · ')}</div></div>
                  </div>
                </div>
                {(cd || at) && (
                  <div className="countdown">
                    <div className="l">Seansa kalan</div>
                    <div className="t num">{cd ?? '—'}</div>
                    <div className="at">{at ? `bugün ${at}` : ''}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="body">
              <div className="col">
                {/* Niyet — gerçek brief notu, düzenlenebilir */}
                <div className="block intent">
                  <div className="bh"><span className="eyebrow">Bu seansın tek niyeti</span>
                    <button className="edit" type="button" onClick={() => (editing ? saveIntent() : setEditing(true))}>{editing ? 'bitti' : 'düzenle'}</button>
                  </div>
                  {editing
                    ? <textarea className="intent-edit" value={intent} autoFocus onChange={(e) => setIntent(e.target.value)} onBlur={saveIntent} placeholder="Tek bir cümle — seansın pusulası." />
                    : <div className="txt">{intent || <span style={{ color: 'var(--ink-faint)' }}>Henüz niyet yazılmadı — “düzenle” ile ekle.</span>}</div>}
                  <div className="hint">Tek bir cümle — seansın pusulası. “düzenle” ile değiştirebilirsin.</div>
                </div>

                {vitals && vitals.length > 0 && (
                  <div className="block vital">
                    <div className="bh"><span className="eyebrow">Seanslar arası seyir</span></div>
                    <div className="rows">{vitals.map((v, i) => {
                      const s = v.series, delta = s[s.length - 1] - s[0];
                      return <div className="spark" key={i}><span className="sl">{v.label}</span><Spark series={s} /><span className="val num">{s[s.length - 1]}{v.unit} {delta > 0 ? <span className="dir up">▲</span> : delta < 0 ? <span className="dir down">▼</span> : null}</span></div>;
                    })}</div>
                  </div>
                )}

                {plan && plan.length > 0 && (
                  <div className="block plan">
                    <div className="bh"><span className="eyebrow">Seans planı</span></div>
                    <div className="blocks">{plan.map((b, i) => (
                      <div className="pblock" key={i}><div className="dur">{b.dur}<span>süre</span></div><div className="pc"><div className="pt">{b.t}</div><div className="pd">{b.d}</div><span className="ph">{b.phase}</span></div></div>
                    ))}</div>
                    <div className="total"><span>planlanan toplam</span><b className="num">{planTotal} dk</b></div>
                  </div>
                )}
              </div>

              <div className="col">
                {lastWords && (
                  <div className="block lastwords">
                    <div className="bh"><span className="eyebrow">Son seanstan</span></div>
                    <blockquote>{lastWords.quote}</blockquote>
                    <div className="src">{lastWords.src}</div>
                  </div>
                )}
                {toolkit && toolkit.length > 0 && (
                  <div className="block toolkit">
                    <div className="bh"><span className="eyebrow">Hazır toolkit</span><button className="edit" type="button" onClick={() => onOpenLibrary?.()}>kütüphane →</button></div>
                    <div className="chips">{toolkit.map((k, i) => <span className="chip" key={i}><svg viewBox="0 0 24 24">{ICONS[k.icon] ?? ICONS.tag}</svg>{k.t}</span>)}</div>
                  </div>
                )}
              </div>
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
