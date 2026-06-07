'use client';

import { ArrowRight, Sparkles } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

type ContinuityClient = {
  name: string;
  pct: number;     // 0-100
  accent?: boolean;
};

type TodaySession = {
  ix: string;                 // "I" | "II" | ...
  time: string;               // "10:00"
  name: string;
  issue: string;
  modality: string;
  seans: number;
  sev: number;                // 1-5  severity dots
  next: string;               // "Bugün, 14:00" | "Yarın · 09:30"
  status: 'done' | 'next' | 'upcoming';
  nextAccent?: boolean;       // tint 'next' text in accent
};

export type HomePanelProps = {
  therapist?: {
    firstName: string;
    sessionCountToday: number;
    date: string;             // "Salı · 24 Mayıs 2026"
  };
  stats?: {
    totalSessions: number;
    totalDelta?: string;
    activeClients: number;
    activeDelta?: string;
    continuityPct: number;
    continuityDelta?: string;
    pendingTasks: number;
    pendingDelta?: string;
  };
  todayHeadline?: {
    time: string;
    name: string;
    meta: string;             // "7. seans · Maruziyet — sosyal kaygı · 50 dk"
  };
  sessions?: TodaySession[];
  insights?: {
    flexibilityScore: number;      // /10
    flexibilityCopy: string;
    flexibilityMeterPct?: number;  // 0-100
    weeklySessionCount: number;
    weeklyBars?: number[];         // heights (px) — defaults to a sane set
    dropRisk: number;              // count
    dropRiskCopy?: string;
  };
  continuity?: {
    headline?: string;
    copy?: string;
    clients?: ContinuityClient[];
    values?: { label: string; level: number; lead?: boolean }[];
  };
  onOpenPatient?: () => void;
  onOpenFormulation?: () => void;
  onOpenBriefing?: () => void;
  onAskAssistant?: () => void;
};

// ─── Defaults (used if the parent doesn't pass data yet) ─────────────────

const DEFAULT_SESSIONS: TodaySession[] = [
  { ix: 'I',   time: '10:00', name: 'Elif Y.',   issue: 'Sosyal kaygı — maruziyet protokolü',         modality: 'ACT · Maruziyet',   seans: 7,  sev: 3, next: 'Bugün, 10:00',   status: 'next',     nextAccent: true },
  { ix: 'II',  time: '13:30', name: 'Mert K.',   issue: 'OKB — yıkama kompulsiyonu, ERP 4. seans',   modality: 'BDT · ERP',         seans: 4,  sev: 4, next: 'Bugün, 13:30',   status: 'upcoming' },
  { ix: 'III', time: '16:00', name: 'Selin A.',  issue: 'Yas süreci — anne kaybı, 6. ay',             modality: 'CFT · İşleme',      seans: 12, sev: 2, next: 'Bugün, 16:00',   status: 'upcoming' },
  { ix: 'IV',  time: '18:00', name: 'Burak D.',  issue: 'Çift terapisi — iletişim örüntüleri',       modality: 'EFT · Çift',        seans: 9,  sev: 3, next: 'Yarın · 09:30',  status: 'upcoming' },
];

const DEFAULT_CLIENTS: ContinuityClient[] = [
  { name: 'Elif Y.',    pct: 92, accent: true },
  { name: 'Mert K.',    pct: 88 },
  { name: 'Selin A.',   pct: 76 },
  { name: 'Burak D.',   pct: 70 },
  { name: 'Naz Ö.',     pct: 64 },
];

const DEFAULT_VALUES = [
  { label: 'Otantiklik', level: 9, lead: true },
  { label: 'Süreklilik', level: 9, lead: true },
  { label: 'Merak',      level: 8 },
  { label: 'Şefkat',     level: 8 },
  { label: 'Yapı',       level: 7 },
];

// ─── Component ────────────────────────────────────────────────────────────

export default function HomePanel({
  therapist = { firstName: 'Ayşe', sessionCountToday: 3, date: 'Salı · 24 Mayıs 2026' },
  stats = {
    totalSessions:    847, totalDelta:      '+12 BU AY',
    activeClients:    38,  activeDelta:     '+4 BU AY',
    continuityPct:    92,  continuityDelta: '↑ 3 PUAN',
    pendingTasks:     7,   pendingDelta:    '2 ACİL',
  },
  todayHeadline = { time: '10:00', name: 'Elif Y.', meta: '7. seans · Maruziyet — sosyal kaygı · 50 dk' },
  sessions = DEFAULT_SESSIONS,
  insights = {
    flexibilityScore: 6.2,
    flexibilityCopy: 'Ortalama ACT esnekliği son 4 haftada 5.4 → 6.2. En çok defüzyon ve değer netliğinde iyileşme var.',
    flexibilityMeterPct: 78,
    weeklySessionCount: 24,
    weeklyBars: [12, 18, 14, 22, 18, 26, 22],
    dropRisk: 3,
    dropRiskCopy: 'Drop riski — 14 günde 1+ iptal',
  },
  continuity = {
    headline: 'Süreklilik haritası',
    copy: 'Geçen ayın seans katılım oranı; turuncu olan, üst üste 3 seansını tamamlayanlar.',
    clients: DEFAULT_CLIENTS,
    values:  DEFAULT_VALUES,
  },
  onOpenPatient,
  onOpenFormulation,
  onOpenBriefing,
  onAskAssistant,
}: HomePanelProps) {
  return (
    <div className="hp" data-screen-label="02 Ana Sayfa">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hp-hero">
        <div>
          <div className="hp-hero-eyebrow">
            <span className="eyebrow">{therapist.date}</span>
            <span className="eyebrow hp-accent">● {therapist.sessionCountToday} seans bugün</span>
          </div>
          <h1 className="hp-hero-title">
            Günaydın, {therapist.firstName}.<br/>
            <em>{turkishNumberWord(therapist.sessionCountToday)}</em> seans, bir bütün gün.
          </h1>
          <p className="hp-hero-sub">
            Sabah {todayHeadline.time}&apos;da {todayHeadline.name} ile başlıyorsunuz.
            Önce briefing&apos;i gözden geçirin — son seansta belirlenen ödevler ve SUDS düşüşü hazır.
          </p>
          <div className="hp-hero-cta-row">
            <button type="button" className="hp-btn hp-btn-primary" onClick={onOpenBriefing}>
              Bugünün briefing&apos;i <ArrowRight size={14} strokeWidth={1.8} />
            </button>
            <button type="button" className="hp-btn hp-btn-ghost" onClick={onAskAssistant}>
              <Sparkles size={14} strokeWidth={1.8} /> Asistan&apos;a sor
            </button>
          </div>
        </div>
        <aside className="hp-hero-right">
          <Stat label="Toplam seans"    value={stats.totalSessions}    delta={stats.totalDelta} />
          <Stat label="Aktif danışan"   value={stats.activeClients}    delta={stats.activeDelta} />
          <Stat label="Süreklilik"      value={stats.continuityPct}    suffix="%"  delta={stats.continuityDelta} deltaTone="up" />
          <Stat label="Bekleyen görev"  value={stats.pendingTasks}     delta={stats.pendingDelta} deltaTone="accent" />
        </aside>
      </section>

      {/* ── Bugünün akışı ────────────────────────────────── */}
      <section className="hp-section">
        <div className="hp-section-head">
          <h2 className="hp-section-title">Bugünün <em>akışı</em></h2>
          <div className="hp-section-aside">
            Üç seans, iki süpervizyon notu ve bir maruziyet planı.
            Akış aralarında 25 dakika nefes payı var.
          </div>
        </div>

        <div className="hp-today">
          <div className="hp-today-now">
            <div className="hp-today-now-head">
              <div className="hp-live"><span className="hp-pulse" />Sıradaki seans</div>
              <div className="hp-today-now-time">{todayHeadline.time}</div>
              <div className="hp-today-now-name">{todayHeadline.name}</div>
              <div className="hp-today-now-meta">{todayHeadline.meta}</div>
            </div>
            <div className="hp-today-now-action">
              <button type="button" className="hp-today-now-btn" onClick={onOpenPatient}>
                Dosyayı aç <ArrowRight size={13} strokeWidth={1.8} />
              </button>
              <button type="button" className="hp-today-now-btn ghost" onClick={onOpenFormulation}>
                Formülasyon
              </button>
            </div>
          </div>

          <div className="hp-today-list">
            <div className="hp-tlist-head">
              <span>#</span>
              <span>Danışan</span>
              <span>Konu</span>
              <span>Ekol</span>
              <span>Seans</span>
              <span>Yoğunluk</span>
              <span className="right">Sıradaki</span>
            </div>
            {sessions.map((s) => (
              <div
                key={s.ix}
                className={`hp-tlist-row ${s.status === 'next' ? 'next' : ''}`}
                onClick={s.status === 'next' ? onOpenPatient : undefined}
                role={s.status === 'next' ? 'button' : undefined}
              >
                <span className="hp-tlist-ix">
                  <span className={`hp-tlist-dot ${s.status}`} />
                  {s.ix}
                </span>
                <div className="hp-tlist-name">
                  <strong>{s.name}</strong>
                  <span>{s.modality}</span>
                </div>
                <div className="hp-tlist-issue">{s.issue}</div>
                <span className="hp-tlist-modality">
                  <span className="hp-pill-dot" />
                  {s.modality.split('·')[0].trim()}
                </span>
                <span className="hp-tlist-seans">{s.seans}.</span>
                <span className="hp-tlist-severity" aria-label={`yoğunluk ${s.sev}/5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < s.sev ? '' : 'off'} style={{ height: 4 + i * 2.5 }} />
                  ))}
                </span>
                <span className={`hp-tlist-next ${s.nextAccent ? 'accent' : ''}`}>{s.next}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Haftalık içgörü ──────────────────────────────── */}
      <section className="hp-section">
        <div className="hp-section-head">
          <h2 className="hp-section-title">Haftalık <em>içgörü</em></h2>
          <div className="hp-section-aside">
            Süreklilik, esneklik ve drop riski — üç gösterge,
            tek tablo. Detay için karta tıkla.
          </div>
        </div>

        <div className="hp-insights">
          <div className="hp-insight-feature">
            <span className="label">Ortalama ACT esnekliği</span>
            <div>
              <div className="big">{insights.flexibilityScore.toFixed(1).replace('.', ',')}<em>/10</em></div>
              <div className="hp-meter" style={{ ['--pct' as string]: `${insights.flexibilityMeterPct ?? 70}%` }} />
            </div>
            <p className="desc">{insights.flexibilityCopy}</p>
          </div>

          <div className="hp-insight-small">
            <div className="top">
              <span className="label">Bu hafta</span>
              <div className="hp-bars">
                {(insights.weeklyBars ?? [12,18,14,22,18,26,22]).map((h, i) => (
                  <span key={i} style={{ height: h }} />
                ))}
              </div>
            </div>
            <div className="num">{insights.weeklySessionCount}<em>seans</em></div>
            <div className="foot">
              <span>Pzt → Paz</span>
              <span>+3 bekleyen</span>
            </div>
          </div>

          <div className="hp-insight-small">
            <div className="top">
              <span className="label">Drop riski</span>
              <span className="eyebrow hp-accent">izle</span>
            </div>
            <div className="num">{insights.dropRisk}<em>danışan</em></div>
            <div className="foot">
              <span>{insights.dropRiskCopy}</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Süreklilik & Değerler ───────────────────────── */}
      <section className="hp-section">
        <div className="hp-continuity">
          <div className="hp-continuity-left">
            <span className="hp-pill">son 30 gün</span>
            <h3>
              {continuity.headline?.split(' ').slice(0, -1).join(' ') ?? 'Süreklilik'}{' '}
              <em>{continuity.headline?.split(' ').slice(-1)[0] ?? 'haritası'}</em>.
            </h3>
            <p>{continuity.copy}</p>
            <div className="hp-values">
              {(continuity.values ?? DEFAULT_VALUES).map((v) => (
                <span key={v.label} className={`hp-value-chip ${v.lead ? 'lead' : ''}`}>
                  {v.label} <span className="lvl">{v.level}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="hp-continuity-right">
            {(continuity.clients ?? DEFAULT_CLIENTS).map((c) => (
              <div key={c.name} className="hp-continuity-bar">
                <span className="nm">{c.name}</span>
                <span className="track"><span className={`fill ${c.accent ? 'accent' : ''}`} style={{ width: `${c.pct}%` }} /></span>
                <span className="pct">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function Stat({
  label, value, suffix, delta, deltaTone,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  delta?: string;
  deltaTone?: 'up' | 'accent' | 'muted';
}) {
  return (
    <div className="hp-hero-stat">
      <div>
        <div className="l">{label}</div>
        {delta && <div className={`delta ${deltaTone ?? ''}`}>{delta}</div>}
      </div>
      <div className="v">{value}{suffix && <em>{suffix}</em>}</div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function turkishNumberWord(n: number): string {
  const words = ['Sıfır','Bir','İki','Üç','Dört','Beş','Altı','Yedi','Sekiz','Dokuz','On'];
  return words[n] ?? String(n);
}
