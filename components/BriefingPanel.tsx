'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft, Play, Check, AlertTriangle, Plus, FileDown, Printer,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────
// Types — Briefing = pre-action tactical document, NOT a profile page
// ──────────────────────────────────────────────────────────────────────────

export type BriefingHero = {
  clientId: string;
  vakaNo: string;
  firstName: string;
  lastName: string;
  age?: number;
  sessionNumber: number;
  sessionStartISO: string;  // "2026-05-26T10:00:00"
  modality?: string;        // "ACT · Maruziyet"
};

export type Vital = {
  date: string;             // "2026.04.20"
  suds: number;             // 0-10
  mood: number;             // 0-10
};

export type Intention = {
  body: string;             // "Maruziyet ikinci basamak — küçük grup önünde 2 dk sunum."
  reason: string;           // "Geçen seansta SUDS 7→4 düştü. Bu seans bir adım yukarı."
};

export type VerbatimQuote = {
  text: string;
  who: string;              // "elif y."
  sessionMeta: string;      // "6. seans · 2026.05.17"
};

export type ToolkitTool = {
  id: string;
  short: string;            // "Defüzyon"
  full: string;             // "Yaprak metaforu"
  modality: string;         // "ACT"
  durationMin: number;
};

export type SessionStep = {
  block: 'opening' | 'main' | 'closing';
  label: string;            // "Sunum simülasyonu"
  durationMin: number;
  modality?: string;
};

export type RiskStrip = {
  level: 'low' | 'medium' | 'high';
  flags?: string[];         // ["intihar: yok", "self-harm: yok"]
};

export type BriefingPanelProps = {
  hero: BriefingHero;
  intention?: Intention;
  vitals?: Vital[];               // son 6 seans
  verbatim?: VerbatimQuote;
  toolkit?: ToolkitTool[];
  sessionSteps?: SessionStep[];
  homeworkLeftovers?: string[];   // tamamlanmayan ödevler (kısa metin)
  risk?: RiskStrip;

  onBack?(): void;
  onStartSession?(): void;
  onPrint?(): void;
  onExportPdf?(): void;
  onAddTool?(): void;
  onOpenTool?(id: string): void;
  onOpenLastSession?(): void;
};

// ──────────────────────────────────────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_HERO: BriefingHero = {
  clientId: '',
  vakaNo: '',
  firstName: '—',
  lastName: '',
  sessionNumber: 1,
  sessionStartISO: new Date(Date.now() + 23 * 60 * 1000).toISOString(),
};

const DEFAULT_INTENTION: Intention = {
  body: '',
  reason: '',
};

const DEFAULT_VITALS: Vital[] = [];

const _UNUSED_VITALS: Vital[] = [
  { date: '11.04', suds: 9, mood: 3 },
  { date: '11.18', suds: 8, mood: 4 },
  { date: '12.05', suds: 7, mood: 5 },
  { date: '01.10', suds: 6, mood: 6 },
  { date: '02.15', suds: 7, mood: 6 },
  { date: '05.17', suds: 5, mood: 7 },
];

const DEFAULT_VERBATIM: VerbatimQuote = {
  text: '',
  who: '',
  sessionMeta: '',
};

const DEFAULT_TOOLKIT: ToolkitTool[] = [
  { id: 't1', short: 'Defüzyon',  full: 'Yaprak metaforu',           modality: 'ACT', durationMin: 6 },
  { id: 't2', short: 'Değer',     full: 'Değer kartları',            modality: 'ACT', durationMin: 10 },
  { id: 't3', short: 'Maruziyet', full: 'Kısa sunum simülasyonu',    modality: 'BDT', durationMin: 18 },
  { id: 't4', short: 'SUDS',      full: 'Anlık SUDS izleme',         modality: 'BDT', durationMin: 3 },
  { id: 't5', short: 'Kapanış',   full: 'Değer ile bağlantı kurma',  modality: 'ACT', durationMin: 6 },
];

const DEFAULT_STEPS: SessionStep[] = [
  { block: 'opening', label: 'İlişki kurma + gündem',         durationMin: 3 },
  { block: 'opening', label: 'Hafta özeti + ödev kontrolü',   durationMin: 5 },
  { block: 'main',    label: 'Sunum simülasyonu',             durationMin: 18, modality: 'BDT' },
  { block: 'main',    label: 'SUDS izleme + defüzyon arası',  durationMin: 8,  modality: 'ACT' },
  { block: 'main',    label: 'Değer ile bağlantı',            durationMin: 6,  modality: 'ACT' },
  { block: 'closing', label: 'Ödev belirleme',                durationMin: 5 },
  { block: 'closing', label: 'Sonraki seans odağı',           durationMin: 5 },
];

const DEFAULT_HW_LEFT = ['Değer pusulası — günlük yazıma eklenmedi'];

const DEFAULT_RISK: RiskStrip = {
  level: 'low',
  flags: ['intihar yok', 'self-harm yok', 'son ölçüm 14 gün'],
};

// ──────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────

export default function BriefingPanel(props: BriefingPanelProps) {
  const hero = props.hero ?? DEFAULT_HERO;
  const intention = props.intention ?? DEFAULT_INTENTION;
  const vitals = props.vitals ?? DEFAULT_VITALS;
  const verbatim = props.verbatim ?? DEFAULT_VERBATIM;
  const toolkit = props.toolkit ?? DEFAULT_TOOLKIT;
  const steps = props.sessionSteps ?? DEFAULT_STEPS;
  const hwLeft = props.homeworkLeftovers ?? DEFAULT_HW_LEFT;
  const risk = props.risk ?? DEFAULT_RISK;

  // ── Canlı countdown ───────────────────────────────────────────
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const start = new Date(hero.sessionStartISO);
  const diffMs = start.getTime() - now.getTime();
  const negative = diffMs < 0;
  const abs = Math.abs(diffMs);
  const mm = Math.floor(abs / 60000);
  const ss = Math.floor((abs % 60000) / 1000);
  const countdownPad = `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;

  const totalMin = steps.reduce((s, b) => s + b.durationMin, 0);

  // ── Interactive tick list (seans sırasında işaretleme) ────────
  const [ticked, setTicked] = useState<boolean[]>(() => steps.map(() => false));
  const tickedCount = ticked.filter(Boolean).length;

  return (
    <div className="br">
      {/* ── Print-friendly top strip ─────────────────────────── */}
      <header className="br-strip">
        <button type="button" className="br-back" onClick={props.onBack}>
          <ArrowLeft size={14} strokeWidth={1.8} />
        </button>

        <div className="br-strip-id">
          <span className="br-eyebrow">vaka {hero.vakaNo} · {hero.sessionNumber}. seans</span>
          <strong>
            {hero.firstName} <em>{hero.lastName}</em>
            {hero.age && <span className="age">{hero.age} yaş</span>}
          </strong>
          {hero.modality && <span className="modality">{hero.modality}</span>}
        </div>

        <div className="br-strip-actions">
          <button type="button" className="br-icon-btn" onClick={props.onPrint} title="Yazdır">
            <Printer size={14} />
          </button>
          <button type="button" className="br-icon-btn" onClick={props.onExportPdf} title="PDF al">
            <FileDown size={14} />
          </button>
          <button type="button" className="br-btn primary" onClick={props.onStartSession}>
            <Play size={14} strokeWidth={2.4} /> Seansa başla
          </button>
        </div>
      </header>

      <main className="br-main">
        {/* ── Üstte LIVE PANEL: countdown + vital signs ─────── */}
        <section className="br-live">
          <div className="br-countdown" data-state={negative ? 'past' : (mm < 5 ? 'soon' : 'wait')}>
            <span className="br-eyebrow">{negative ? 'seans başladı' : 'seansa kalan'}</span>
            <div className="br-clock">
              <span className="num">{countdownPad}</span>
              <span className="unit">dk</span>
            </div>
            <span className="br-start-label">
              {hero.sessionNumber}. seans · {start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {vitals.length > 0 && (
            <div className="br-vitals">
              <div className="br-vitals-head">
                <span className="br-eyebrow">vital signs · son 6 seans</span>
                <div className="br-vitals-legend">
                  <span className="dot suds" /> SUDS
                  <span className="dot mood" /> Ruh hali
                </div>
              </div>
              <VitalsChart data={vitals} />
              <div className="br-vitals-foot">
                {vitals.map((v) => (
                  <span key={v.date}>{v.date}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── İNTENT: tek cümle bold ───────────────────────── */}
        {intention.body && (
          <section className="br-intent">
            <span className="br-eyebrow">tek niyet</span>
            <h1 className="br-intent-body">{intention.body}</h1>
            {intention.reason && <p className="br-intent-reason">{intention.reason}</p>}
          </section>
        )}

        {/* ── VERBATIM — çıplak italik alıntı (dark card YOK) ── */}
        {verbatim.text && (
          <section className="br-verbatim">
            <span className="br-eyebrow">son sözler</span>
            <blockquote>
              <p>{verbatim.text}</p>
              <footer>
                <cite>{verbatim.who}</cite>
                <span>{verbatim.sessionMeta}</span>
                <button type="button" className="br-link" onClick={props.onOpenLastSession}>
                  seans notuna git →
                </button>
              </footer>
            </blockquote>
          </section>
        )}

        {/* ── TOOLKIT SHELF — yatay scroll chip raftı ─────── */}
        <section className="br-shelf">
          <div className="br-shelf-head">
            <span className="br-eyebrow">hazır toolkit</span>
            <span className="br-shelf-sub">tıkla, panele al</span>
          </div>
          <div className="br-shelf-row">
            {toolkit.map((t) => (
              <button
                key={t.id}
                type="button"
                className="br-tool"
                onClick={() => props.onOpenTool?.(t.id)}
              >
                <span className="modality">{t.modality}</span>
                <strong>{t.short}</strong>
                <span className="full">{t.full}</span>
                <span className="dur">{t.durationMin} dk</span>
              </button>
            ))}
            <button type="button" className="br-tool br-tool-add" onClick={props.onAddTool}>
              <Plus size={20} strokeWidth={1.5} />
              <span>kütüphaneden ekle</span>
            </button>
          </div>
        </section>

        {/* ── INTERACTIVE CHECKLIST — seans sırasında tickle ── */}
        <section className="br-checklist">
          <div className="br-checklist-head">
            <span className="br-eyebrow">seans planı · {totalMin} dk</span>
            <span className="br-progress">
              <strong>{tickedCount}</strong> / {steps.length} adım
            </span>
          </div>
          <ol>
            {steps.map((s, i) => {
              const isTicked = ticked[i];
              return (
                <li key={i} className={`br-step block-${s.block} ${isTicked ? 'done' : ''}`}>
                  <button
                    type="button"
                    className={`br-step-tick ${isTicked ? 'done' : ''}`}
                    onClick={() =>
                      setTicked((arr) => arr.map((v, idx) => (idx === i ? !v : v)))
                    }
                    aria-pressed={isTicked}
                    aria-label={isTicked ? 'Geri al' : 'Tamamlandı işaretle'}
                  >
                    {isTicked && <Check size={13} strokeWidth={2.6} />}
                  </button>
                  <span className="br-step-block">{s.block === 'main' ? '◆' : '·'}</span>
                  <span className="br-step-label">{s.label}</span>
                  {s.modality && <span className="br-step-modality">{s.modality}</span>}
                  <span className="br-step-dur">{s.durationMin} dk</span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ── EKSİK ÖDEV + RİSK STRIP ──────────────────────── */}
        <section className="br-tail">
          {hwLeft.length > 0 && (
            <div className="br-hw-left">
              <span className="br-eyebrow">eksik ödev</span>
              <ul>
                {hwLeft.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={`br-risk-strip risk-${risk.level}`}>
            <header>
              {risk.level !== 'low' && <AlertTriangle size={14} strokeWidth={2} />}
              <strong>
                {risk.level === 'low'    && 'risk düşük'}
                {risk.level === 'medium' && 'risk · izle'}
                {risk.level === 'high'   && 'risk yüksek · protokol açık'}
              </strong>
            </header>
            {risk.flags && (
              <ul>
                {risk.flags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// VitalsChart — mini dual-line SUDS / mood
// ──────────────────────────────────────────────────────────────────────────

function VitalsChart({ data }: { data: Vital[] }) {
  const w = 480;
  const h = 70;
  const padX = 6;
  const padY = 4;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const yOf = (v: number) => padY + (innerH - (v / 10) * innerH);

  const path = (key: 'suds' | 'mood') =>
    data
      .map((d, i) => {
        const x = padX + i * stepX;
        const y = yOf(d[key]);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="br-chart" preserveAspectRatio="none">
      {/* grid mid line */}
      <line x1={padX} y1={padY + innerH / 2} x2={w - padX} y2={padY + innerH / 2}
        stroke="rgba(14,15,18,0.05)" strokeDasharray="2 4" />
      {/* SUDS line — accent */}
      <path d={path('suds')} fill="none" stroke="#C2522A" strokeWidth={1.6} strokeLinecap="round" />
      {/* mood line — green */}
      <path d={path('mood')} fill="none" stroke="#2F5D3A" strokeWidth={1.6} strokeLinecap="round" />
      {/* points */}
      {data.map((d, i) => {
        const x = padX + i * stepX;
        return (
          <g key={i}>
            <circle cx={x} cy={yOf(d.suds)} r={2.8} fill="#C2522A" />
            <circle cx={x} cy={yOf(d.mood)} r={2.8} fill="#2F5D3A" />
          </g>
        );
      })}
    </svg>
  );
}
