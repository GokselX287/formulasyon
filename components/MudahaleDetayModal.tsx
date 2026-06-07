'use client';

import { useEffect, useState } from 'react';
import {
  X, Heart, Star, Plus, UserPlus, FileDown, Quote as QuoteIcon,
  ChevronLeft, ChevronRight, ExternalLink, AlertOctagon, Check,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────
// Types — Müdahale detay modal
//   Not a profile page · not a briefing · modal scoped with 3 internal tabs
// ──────────────────────────────────────────────────────────────────────────

export type Modality = 'BDT'|'ACT'|'EFT'|'CFT'|'EMDR'|'Şema'|'Sistemik'|'Diğer';
export type Outcome  = 'yararli'|'notr'|'yararsiz';

export type ProtocolStep = {
  num: string;            // "01"
  title: string;
  body: string;
  warn?: string;          // bu adımda dikkat edilecek nokta
};

export type ImpactAxis = {
  name: string;
  helps: number;          // 0-10  (yeşil overlay)
  caution: number;        // 0-10  (kırmızı overlay)
};

export type Variant = {
  id: string;
  group: 'yetişkin'|'ergen'|'çocuk'|'çift'|'grup';
  label: string;          // "Çocuk 7-11 — oyun ile"
  body: string;           // 1-2 satır farklılık özeti
};

export type CaseAnecdote = {
  text: string;
  accentItalicPhrase: string;
  clientCode: string;     // "vaka #142"
  modality: Modality;
  sessionNo: number;
  outcome: Outcome;
};

export type Reference = {
  title: string;
  authors: string;
  year: number;
  journal?: string;
  doi?: string;
  url?: string;
};

export type UsageStat = {
  totalUses: number;
  byOutcome: { yararli: number; notr: number; yararsiz: number };
  byClientType: { code: string; uses: number }[];   // ["#142", 4]
};

export type MudahaleDetayProps = {
  open: boolean;
  onClose(): void;

  // Identity
  id: string;
  title: string;
  modality: Modality;
  evidence: 'rkc'|'sistematik-review'|'klinik-kilavuz'|'vaka-serisi';
  short: string;               // 1-2 satır tanım
  problems: string[];
  durationMin: number;
  favorite?: boolean;

  // Tab 1: Protokol
  protocol?: ProtocolStep[];
  contraindications?: string[];

  // Tab 2: Materyal & Adaptasyon
  materials?: string[];
  variants?: Variant[];
  personalNotes?: string;
  onSavePersonalNotes?(text: string): void;

  // Tab 3: Kullanım & Kanıt
  anecdotes?: CaseAnecdote[];
  impact?: ImpactAxis[];        // 6 boyut
  usage?: UsageStat;
  references?: Reference[];

  // Aksiyonlar
  onToggleFavorite?(): void;
  onAddToBasket?(): void;
  onAssignToClient?(): void;
  onExportPdf?(): void;
};

// ──────────────────────────────────────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_PROTOCOL: ProtocolStep[] = [
  { num: '01', title: 'Rasyonel paylaşımı', body: 'Danışana defüzyon kavramını günlük örnekle açıkla. "Düşünce yağmuru" metaforu.' },
  { num: '02', title: 'Yaprak imgelemine geçiş', body: 'Gözler kapalı, 3 dakika dere kenarında oturma imgelemi.', warn: 'Travma öyküsü olanlarda su imgelemi kontrendike olabilir, ev imgelemi alternatif.' },
  { num: '03', title: 'Düşünceleri yaprağa koyma', body: 'Gelen her düşünceyi yaprağa koyup akmasını izleme.' },
  { num: '04', title: 'Süreç paylaşımı', body: 'Hangi düşüncelerin daha "yapışkan" olduğunu konuş.' },
  { num: '05', title: 'Ev ödevi planlama', body: 'Günde 2 kez 3 dakikalık tekrarı belirle.' },
];

const DEFAULT_IMPACT: ImpactAxis[] = [
  { name: 'Defüzyon',      helps: 9, caution: 1 },
  { name: 'Kabul',         helps: 7, caution: 2 },
  { name: 'Şimdiki an',    helps: 8, caution: 1 },
  { name: 'Bağlam-benlik', helps: 6, caution: 2 },
  { name: 'Değerler',      helps: 4, caution: 0 },
  { name: 'Eylem',         helps: 3, caution: 0 },
];

const DEFAULT_VARIANTS: Variant[] = [
  { id: 'v1', group: 'yetişkin', label: 'Yetişkin — standart', body: 'Standart 3 dk imgelem, dere ve yaprak.' },
  { id: 'v2', group: 'çocuk',    label: 'Çocuk 7-11 — oyun',   body: '"Düşünce uçurtması" alternatifi; çizim ile birleştir.' },
  { id: 'v3', group: 'ergen',    label: 'Ergen — müzik',       body: 'Lo-fi arka plan; düşünceyi şarkı sözü gibi yazıp atma.' },
  { id: 'v4', group: 'çift',     label: 'Çift — paylaşımlı',   body: 'Her partner kendi yaprağını paylaşır; tartışma yok, tanıklık var.' },
];

const DEFAULT_ANECDOTES: CaseAnecdote[] = [
  {
    text: '"Yapraklara baktım, sonra kendime şu yapraktaki düşüncelerim olmayabilir,',
    accentItalicPhrase: ' ben yaprakları izleyenim ',
    clientCode: 'vaka #142', modality: 'ACT', sessionNo: 4, outcome: 'yararli',
  },
  {
    text: '"İlk defa düşüncelerimle savaşmadığım bir an oldu. Ses durmadı ama',
    accentItalicPhrase: ' ben oradan kayboldum',
    clientCode: 'vaka #129', modality: 'ACT', sessionNo: 6, outcome: 'yararli',
  },
  {
    text: '"Yaprak çalıştı ama eve gidince yine düşüncelere kapıldım.',
    accentItalicPhrase: ' Tek seansta çözülecek değil',
    clientCode: 'vaka #112', modality: 'ACT', sessionNo: 3, outcome: 'notr',
  },
];

const DEFAULT_USAGE: UsageStat = {
  totalUses: 47,
  byOutcome: { yararli: 32, notr: 12, yararsiz: 3 },
  byClientType: [
    { code: '#142', uses: 4 },
    { code: '#129', uses: 3 },
    { code: '#112', uses: 2 },
  ],
};

const DEFAULT_REFS: Reference[] = [
  { title: 'Defusion techniques in ACT: A systematic review', authors: 'Levin, M. E. & Hayes, S. C.', year: 2024, journal: 'Behaviour Research and Therapy', doi: '10.1016/j.brat.2024.104389' },
  { title: 'The leaves on a stream exercise: efficacy in social anxiety', authors: 'Karekla, M. et al.', year: 2023, journal: 'JCBS', doi: '10.1016/j.jcbs.2023.04.012' },
  { title: 'Pediatric ACT defusion adaptations', authors: 'Coyne, L. W. & Murrell, A.', year: 2022, journal: 'Child and Adolescent Mental Health', doi: '10.1111/camh.12555' },
];

// ──────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────

type TabKey = 'protokol' | 'materyal' | 'kullanim';

export default function MudahaleDetayModal(props: MudahaleDetayProps) {
  const {
    open, onClose, id, title, modality, evidence, short, problems,
    durationMin, favorite,
    protocol = DEFAULT_PROTOCOL,
    contraindications,
    materials = ['Sessiz oda', 'Saat / kronometre', 'İsteğe bağlı görsel kart'],
    variants = DEFAULT_VARIANTS,
    personalNotes: initialNotes = '',
    onSavePersonalNotes,
    anecdotes = DEFAULT_ANECDOTES,
    impact = DEFAULT_IMPACT,
    usage = DEFAULT_USAGE,
    references = DEFAULT_REFS,
    onToggleFavorite, onAddToBasket, onAssignToClient, onExportPdf,
  } = props;

  const [tab, setTab] = useState<TabKey>('protokol');
  const [appliedSteps, setAppliedSteps] = useState<Set<string>>(new Set());
  const [anecIdx, setAnecIdx] = useState(0);
  const [notes, setNotes] = useState(initialNotes);
  const [notesDirty, setNotesDirty] = useState(false);

  // Esc kapama
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Otomatik kayıt 1.5s sonra
  useEffect(() => {
    if (!notesDirty) return;
    const t = setTimeout(() => {
      onSavePersonalNotes?.(notes);
      setNotesDirty(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [notes, notesDirty, onSavePersonalNotes]);

  if (!open) return null;

  const evidenceStars = { 'rkc': 5, 'sistematik-review': 4, 'klinik-kilavuz': 3, 'vaka-serisi': 2 }[evidence];

  const anec = anecdotes[anecIdx % anecdotes.length];

  return (
    <div className="md-scrim" onClick={onClose} role="dialog" aria-modal="true">
      <div className="md" onClick={(e) => e.stopPropagation()}>
        {/* ── HEAD ─────────────────────────────────────────── */}
        <header className="md-head">
          <div className="md-head-left">
            <span className={`md-modality m-${modality.toLowerCase()}`}>{modality}</span>
            <h1 className="md-title">{title}</h1>
            <span className="md-stars" aria-label={`kanıt düzeyi ${evidenceStars}/5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={11} strokeWidth={1.6}
                  fill={i < evidenceStars ? 'currentColor' : 'none'} />
              ))}
            </span>
          </div>
          <div className="md-head-right">
            <button type="button" className={`md-icon-btn ${favorite ? 'on' : ''}`} onClick={onToggleFavorite} title="Favori">
              <Heart size={16} strokeWidth={1.8} fill={favorite ? 'currentColor' : 'none'} />
            </button>
            <button type="button" className="md-icon-btn" onClick={onExportPdf} title="PDF al">
              <FileDown size={16} />
            </button>
            <button type="button" className="md-close" onClick={onClose} aria-label="Kapat">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ── SUB-HEAD: short + chips ──────────────────────── */}
        <div className="md-subhead">
          <p className="md-short">{short}</p>
          <div className="md-chips">
            {problems.map((p) => <span key={p} className="md-chip">{p}</span>)}
            <span className="md-chip dur">{durationMin} dk</span>
          </div>
        </div>

        {/* ── TAB NAV ──────────────────────────────────────── */}
        <nav className="md-tabs" role="tablist">
          {([
            { k: 'protokol',  l: 'Protokol' },
            { k: 'materyal',  l: 'Materyal & Adaptasyon' },
            { k: 'kullanim',  l: 'Kullanım & Kanıt' },
          ] as const).map((t) => (
            <button
              key={t.k}
              type="button"
              role="tab"
              aria-selected={tab === t.k}
              className={`md-tab ${tab === t.k ? 'active' : ''}`}
              onClick={() => setTab(t.k)}
            >
              {t.l}
            </button>
          ))}
        </nav>

        {/* ── TAB CONTENT ──────────────────────────────────── */}
        <div className="md-body">
          {tab === 'protokol' && (
            <div className="md-protocol">
              <ol>
                {protocol.map((s) => {
                  const isOn = appliedSteps.has(s.num);
                  return (
                    <li key={s.num} className={`md-step ${isOn ? 'applied' : ''}`}>
                      <div className="md-step-head">
                        <span className="md-step-num">{s.num}</span>
                        <h3 className="md-step-title">{s.title}</h3>
                        <button
                          type="button"
                          className={`md-step-tick ${isOn ? 'on' : ''}`}
                          onClick={() =>
                            setAppliedSteps((prev) => {
                              const next = new Set(prev);
                              if (next.has(s.num)) next.delete(s.num);
                              else next.add(s.num);
                              return next;
                            })
                          }
                          aria-pressed={isOn}
                          title="Bu seansta uygulandı"
                        >
                          {isOn ? <Check size={12} strokeWidth={2.6} /> : <span>seansa işaretle</span>}
                        </button>
                      </div>
                      <p className="md-step-body">{s.body}</p>
                      {s.warn && (
                        <div className="md-step-warn">
                          <AlertOctagon size={13} /> {s.warn}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
              {contraindications && contraindications.length > 0 && (
                <aside className="md-contra">
                  <span className="md-eyebrow">kontrendikasyonlar</span>
                  <ul>
                    {contraindications.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </aside>
              )}
            </div>
          )}

          {tab === 'materyal' && (
            <div className="md-materyal">
              <section>
                <span className="md-eyebrow">gerekli materyal</span>
                <ul className="md-mat-list">
                  {materials.map((m, i) => <li key={i}><span className="dot" /> {m}</li>)}
                </ul>
              </section>

              <section>
                <span className="md-eyebrow">varyantlar</span>
                <div className="md-variants">
                  {variants.map((v) => (
                    <article key={v.id} className={`md-variant g-${v.group}`}>
                      <span className="md-variant-group">{v.group}</span>
                      <h4>{v.label}</h4>
                      <p>{v.body}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="md-notes">
                <div className="md-notes-head">
                  <span className="md-eyebrow">klinik notlarım</span>
                  {notesDirty && <span className="md-saving">otomatik kaydediliyor…</span>}
                  {!notesDirty && initialNotes && <span className="md-saved">kaydedildi</span>}
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
                  placeholder="Bu müdahaleyi kendi pratiğinde nasıl uyarlıyorsun? Hangi vakalarda en çok işe yarıyor?"
                />
              </section>
            </div>
          )}

          {tab === 'kullanim' && (
            <div className="md-kullanim">
              {/* Anecdote carousel */}
              <article className="md-anec">
                <header>
                  <span className="md-eyebrow">vaka anekdotu</span>
                  <span className="md-anec-counter">
                    {anecIdx + 1} / {anecdotes.length}
                  </span>
                </header>
                <blockquote>
                  <QuoteIcon size={18} className="md-anec-q" />
                  <p>
                    {anec.text}
                    <em className="accent">{anec.accentItalicPhrase}</em>
                    {'..."'}
                  </p>
                  <footer>
                    <span className={`md-anec-out o-${anec.outcome}`}>
                      {anec.outcome === 'yararli'  && '✓ yararlı'}
                      {anec.outcome === 'notr'     && '∼ nötr'}
                      {anec.outcome === 'yararsiz' && '× yararsız'}
                    </span>
                    <span>{anec.clientCode} · {anec.sessionNo}. seans</span>
                  </footer>
                </blockquote>
                <div className="md-anec-nav">
                  <button type="button" onClick={() => setAnecIdx((i) => (i - 1 + anecdotes.length) % anecdotes.length)} aria-label="önceki">
                    <ChevronLeft size={14} />
                  </button>
                  <button type="button" onClick={() => setAnecIdx((i) => (i + 1) % anecdotes.length)} aria-label="sonraki">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </article>

              {/* Dual-overlay impact radar */}
              <article className="md-impact">
                <header>
                  <span className="md-eyebrow">etki haritası</span>
                  <div className="md-impact-legend">
                    <span className="dot helps" /> yardım eder
                    <span className="dot caution" /> dikkat
                  </div>
                </header>
                <div className="md-impact-body">
                  <ImpactRadar axes={impact} />
                  <ul className="md-impact-list">
                    {impact.map((a) => (
                      <li key={a.name}>
                        <span className="name">{a.name}</span>
                        <span className="bars">
                          <span className="bar helps" style={{ width: `${(a.helps/10)*100}%` }} />
                          {a.caution > 0 && <span className="bar caution" style={{ width: `${(a.caution/10)*100}%` }} />}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              {/* Usage stats */}
              <article className="md-usage">
                <header>
                  <span className="md-eyebrow">kullanım istatistikleri</span>
                </header>
                <div className="md-usage-body">
                  <div className="md-usage-stat">
                    <span className="num">{usage.totalUses}</span>
                    <em>toplam uygulama</em>
                  </div>
                  <div className="md-usage-outcomes">
                    <span className="title">sonuçlar</span>
                    {([
                      { k: 'yararli',  l: 'yararlı',  v: usage.byOutcome.yararli  },
                      { k: 'notr',     l: 'nötr',     v: usage.byOutcome.notr     },
                      { k: 'yararsiz', l: 'yararsız', v: usage.byOutcome.yararsiz },
                    ] as const).map((o) => {
                      const pct = Math.round((o.v / Math.max(1, usage.totalUses)) * 100);
                      return (
                        <div key={o.k} className={`md-outcome-row o-${o.k}`}>
                          <span className="label">{o.l}</span>
                          <span className="bar"><span style={{ width: `${pct}%` }} /></span>
                          <span className="val">{o.v}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>

              {/* References */}
              <article className="md-refs">
                <header>
                  <span className="md-eyebrow">kaynaklar</span>
                </header>
                <ul>
                  {references.map((r, i) => (
                    <li key={i}>
                      <div>
                        <strong>{r.title}</strong>
                        <span>
                          {r.authors} · {r.year}{r.journal ? ` · ${r.journal}` : ''}
                        </span>
                      </div>
                      {(r.doi || r.url) && (
                        <a href={r.url ?? `https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">
                          {r.doi ? r.doi : 'kaynak'} <ExternalLink size={11} />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          )}
        </div>

        {/* ── ALT STICKY ACTIONS ──────────────────────────── */}
        <footer className="md-foot">
          <button type="button" className="md-btn ghost" onClick={onAddToBasket}>
            <Plus size={14} /> Sepete ekle
          </button>
          <button type="button" className="md-btn primary" onClick={onAssignToClient}>
            <UserPlus size={14} /> Danışana ata
          </button>
        </footer>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// ImpactRadar — DUAL overlay (helps green + caution red)
// ──────────────────────────────────────────────────────────────────────────

function ImpactRadar({ axes }: { axes: ImpactAxis[] }) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 86;
  const n = Math.max(3, axes.length);

  const pointAt = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (value / 10) * r;
    return [cx + rr * Math.cos(angle), cy + rr * Math.sin(angle)] as const;
  };
  const labelAt = (i: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const lr = r + 16;
    return [cx + lr * Math.cos(angle), cy + lr * Math.sin(angle)] as const;
  };
  const polyAt = (level: number) =>
    Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return `${cx + level * r * Math.cos(angle)},${cy + level * r * Math.sin(angle)}`;
    }).join(' ');

  const helpsPoly   = axes.map((a, i) => pointAt(i, a.helps).join(',')).join(' ');
  const cautionPoly = axes.map((a, i) => pointAt(i, a.caution).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="md-radar" aria-hidden>
      {[0.25, 0.5, 0.75, 1.0].map((lv, i) => (
        <polygon key={i} points={polyAt(lv)} fill="none" stroke="rgba(14,15,18,0.07)" strokeWidth={1} />
      ))}
      {/* helps — green */}
      <polygon points={helpsPoly}
        fill="rgba(47,93,58,0.16)" stroke="#2F5D3A" strokeWidth={1.5} />
      {/* caution — red */}
      <polygon points={cautionPoly}
        fill="rgba(184,50,22,0.12)" stroke="#B83216" strokeWidth={1.2}
        strokeDasharray="3 3" />
      {axes.map((a, i) => {
        const [px, py] = pointAt(i, a.helps);
        return <circle key={i} cx={px} cy={py} r={3.2} fill="#2F5D3A" />;
      })}
      {axes.map((a, i) => {
        const [lx, ly] = labelAt(i);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="md-radar-label">
            {a.name.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}
