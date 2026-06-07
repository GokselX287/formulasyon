'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, Sun, Moon, Edit3, BookOpen } from 'lucide-react';
import { sozlukOnizleme, VARSAYILAN_EKOLLER, type Ekol } from '@/lib/sozluk-icerik';

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

export type TherapistHero = {
  firstName: string;
  dateLabel: string;
  sessionCountToday: number;
};

export type Stats = {
  totalSessions: number;
  totalDelta?: string;
  activeClients: number;
  activeDelta?: string;
  continuityPct: number;
  continuityDelta?: string;
  pendingTasks: number;
  pendingDelta?: string;
};

export type NextSessionCard = {
  time: string;
  clientName: string;
  meta: string;
};

export type TodaySession = {
  ix: string;
  time: string;
  clientId?: string;
  clientName: string;
  topic: string;
  modality: string;        // "ACT · Maruziyet"
  sessionNo: number;
  sev: 1 | 2 | 3 | 4 | 5;
  nextLabel: string;
  status: 'past' | 'next' | 'upcoming';
  brief?: string;          // kısa briefing özeti (son seans notu / hedef / dikkat)
  // ── seans destesi alanları (opsiyonel — yoksa türetilir) ──
  initials?: string;
  role?: string;           // "7. seans · Maruziyet — sosyal kaygı"
  wellbeing?: number;      // /10
  wellbeingDir?: '↗' | '→' | '↘';
  valueBondPct?: number;   // %
  lastSuds?: number;       // /10
  sudsDir?: '↗' | '→' | '↓';
  valueFocus?: string[];
};

export type FlexibilityCard = { score: number; description: string; meterPct?: number };

export type WeeklyIntensity = {
  days: { label: string; sessions: number; today?: boolean }[];
  totalLabel?: string;
  comparisonLabel?: string;
};

export type DropRiskCard = { count: number; copy: string; list?: { name: string; reason: string }[] };

export type ContinuityClient = { name: string; pct: number; accent?: boolean };
export type ValueChip = { label: string; level: number; lead?: boolean };
export type Continuity = { headline?: string; copy?: string; clients: ContinuityClient[]; values: ValueChip[] };

export type ReflectionLeaf = { date: string; excerpt: string; accentItalicPhrase?: string; meta?: string };

export type ProcessesCard = { count: number; subtitle: string };

export type EmotionTag =
  | 'odakli' | 'sakin' | 'merakli' | 'sefkatli'
  | 'yorgun' | 'dagınık' | 'kaygili' | 'bos';

export type HomeDashboardProps = {
  therapist: TherapistHero;
  stats?: Stats;
  nextSession?: NextSessionCard;
  todaySessions?: TodaySession[];
  flexibility?: FlexibilityCard;
  weekly?: WeeklyIntensity;
  dropRisk?: DropRiskCard;
  continuity?: Continuity;
  reflection?: ReflectionLeaf;
  processes?: ProcessesCard;
  emotion?: EmotionTag;
  intent?: string;
  sozlukEkoller?: Ekol[];
  reviewedIds?: string[];

  resolvePatientId?(name: string): string | undefined;

  onOpenBriefing?(): void;
  onAskAssistant?(): void;
  onOpenSozluk?(): void;
  onOpenPatient?(id?: string): void;
  onOpenPatientSessions?(id?: string): void;
  onOpenFormulation?(): void;
  onOpenProcesses?(): void;
  onSelectEmotion?(e: EmotionTag): void;
  onChangeIntent?(t: string): void;
  onWriteReflection?(): void;
  onOpenContinuity?(): void;
  onOpenWeekly?(): void;
};

// ──────────────────────────────────────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_HERO: TherapistHero = { firstName: 'Göksel', dateLabel: 'Salı · 26 Mayıs 2026', sessionCountToday: 3 };

const DEFAULT_STATS: Stats = {
  totalSessions: 847, totalDelta: '+12 bu ay',
  activeClients: 38, activeDelta: '+4 bu ay',
  continuityPct: 92, continuityDelta: '↑ 3 puan',
  pendingTasks: 7, pendingDelta: '2 acil',
};

const DEFAULT_NEXT: NextSessionCard = { time: '10:00', clientName: 'Elif Y.', meta: '7. seans · Maruziyet — sosyal kaygı · 50 dk' };

const DEFAULT_TODAY: TodaySession[] = [
  { ix: 'I', time: '10:00', clientName: 'Elif Y.', topic: 'Sosyal kaygı — maruziyet protokolü', modality: 'ACT · Maruziyet', sessionNo: 7, sev: 3, nextLabel: 'Bugün, 10:00', status: 'next',
    initials: 'EY', role: '7. seans · Maruziyet — sosyal kaygı', wellbeing: 7.1, wellbeingDir: '↗', valueBondPct: 86, lastSuds: 4, sudsDir: '↓', valueFocus: ['Otantiklik', 'Yakınlık', 'Cesaret'] },
  { ix: 'II', time: '13:30', clientName: 'Mert K.', topic: 'OKB — yıkama kompulsiyonu, ERP 4. seans', modality: 'BDT · ERP', sessionNo: 4, sev: 4, nextLabel: 'Bugün, 13:30', status: 'upcoming',
    initials: 'MK', role: '4. seans · BDT · ERP — OKB', wellbeing: 6.3, wellbeingDir: '→', valueBondPct: 79, lastSuds: 6, sudsDir: '↓', valueFocus: ['Düzen', 'Özgürlük', 'Denge'] },
  { ix: 'III', time: '16:00', clientName: 'Selin A.', topic: 'Yas süreci — anne kaybı, 6. ay', modality: 'CFT · İşleme', sessionNo: 12, sev: 2, nextLabel: 'Bugün, 16:00', status: 'upcoming',
    initials: 'SA', role: '12. seans · CFT · Yas süreci', wellbeing: 5.8, wellbeingDir: '↗', valueBondPct: 71, lastSuds: 5, sudsDir: '→', valueFocus: ['Şefkat', 'Bağ', 'Anlam'] },
  { ix: 'IV', time: '18:00', clientName: 'Burak D.', topic: 'Çift terapisi — iletişim örüntüleri', modality: 'EFT · Çift', sessionNo: 9, sev: 3, nextLabel: 'Yarın · 09:30', status: 'upcoming',
    initials: 'BD', role: '9. seans · EFT · Çift terapisi', wellbeing: 6.0, wellbeingDir: '→', valueBondPct: 74, lastSuds: 5, sudsDir: '→', valueFocus: ['İletişim', 'Güven'] },
];

const DEFAULT_FLEX: FlexibilityCard = { score: 6.2, description: 'Ortalama ACT esnekliği son 4 haftada 5,4 → 6,2. En çok defüzyon ve değer netliğinde iyileşme var.', meterPct: 62 };

const DEFAULT_WEEKLY: WeeklyIntensity = {
  days: [
    { label: 'Pzt', sessions: 4 }, { label: 'Sal', sessions: 3, today: true }, { label: 'Çar', sessions: 5 },
    { label: 'Per', sessions: 2 }, { label: 'Cum', sessions: 4 }, { label: 'Cmt', sessions: 3 }, { label: 'Paz', sessions: 1 },
  ],
  totalLabel: '22 seans',
  comparisonLabel: 'geçen haftaya +3',
};

const DEFAULT_DROP: DropRiskCard = {
  count: 3, copy: '14 günde 1+ iptal / sessizlik',
  list: [
    { name: 'Kerem A.', reason: '3 iptal · 18 gün' },
    { name: 'Lale Y.', reason: '2 no-show · 25 gün' },
    { name: 'Tolga E.', reason: '14 gündür sessiz' },
  ],
};

const DEFAULT_CONTINUITY: Continuity = {
  headline: 'Süreklilik haritası',
  copy: 'Geçen ayın seans katılım oranı; turuncu olan, üst üste 3 seansını tamamlayanlar.',
  clients: [
    { name: 'Elif Y.', pct: 92, accent: true },
    { name: 'Mert K.', pct: 88 },
    { name: 'Selin A.', pct: 76 },
    { name: 'Burak D.', pct: 70 },
    { name: 'Naz Ö.', pct: 64 },
  ],
  values: [
    { label: 'Otantiklik', level: 9, lead: true },
    { label: 'Süreklilik', level: 9, lead: true },
    { label: 'Merak', level: 8 },
    { label: 'Şefkat', level: 8 },
    { label: 'Yapı', level: 7 },
  ],
};

const DEFAULT_REFLECTION: ReflectionLeaf = {
  date: 'dün · 25 mayıs',
  excerpt: 'Mert\'le çalışırken kendi sabırsızlığımı fark ettim. Onun susmasını',
  accentItalicPhrase: ' bir boşluk olarak değil, bir cevap olarak ',
  meta: 'günlük yansıma',
};

const EMOTIONS: { key: EmotionTag; label: string }[] = [
  { key: 'odakli', label: 'odaklı' }, { key: 'sakin', label: 'sakin' }, { key: 'merakli', label: 'meraklı' },
  { key: 'sefkatli', label: 'şefkatli' }, { key: 'yorgun', label: 'yorgun' }, { key: 'dagınık', label: 'dağınık' },
  { key: 'kaygili', label: 'kaygılı' }, { key: 'bos', label: 'boş' },
];

const TR_WORD = ['Sıfır', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz', 'On'];

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ──────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────

export default function HomeDashboardPanel(props: HomeDashboardProps) {
  const therapist = props.therapist ?? DEFAULT_HERO;
  const stats = props.stats ?? DEFAULT_STATS;
  const next = props.nextSession ?? DEFAULT_NEXT;
  const today = props.todaySessions ?? DEFAULT_TODAY;
  const flex = props.flexibility ?? DEFAULT_FLEX;
  const weekly = props.weekly ?? DEFAULT_WEEKLY;
  const drop = props.dropRisk ?? DEFAULT_DROP;
  const cont = props.continuity ?? DEFAULT_CONTINUITY;
  const reflection = props.reflection ?? DEFAULT_REFLECTION;
  const processes = props.processes ?? { count: stats.pendingTasks, subtitle: `${stats.pendingDelta ?? '0 acil'} · ${stats.pendingTasks} görev` };
  const sozlukEkoller = props.sozlukEkoller ?? VARSAYILAN_EKOLLER;
  const sozlukItems = sozlukOnizleme(sozlukEkoller, 3);

  const [emotion, setEmotion] = useState<EmotionTag | undefined>(props.emotion);
  const [intent, setIntent] = useState(props.intent ?? '');

  const hours = typeof window !== 'undefined' ? new Date().getHours() : 9;
  const partOfDay = hours < 12 ? 'Günaydın' : hours < 18 ? 'İyi günler' : 'İyi akşamlar';
  const isNight = hours < 7 || hours >= 20;
  const hasSessions = therapist.sessionCountToday > 0;

  return (
    <div className="hd2">
      <div className="hd2-device">

        {/* ═══ 1. HERO ═══ */}
        <section className="hd2-hero">
          <div className="hd2-hero-left">
            <span className="hd2-eyebrow">
              {isNight ? <Moon /> : <Sun />} {therapist.dateLabel.toLowerCase()}
            </span>
            <h1 className="hd2-hero-head">
              <span className="thin">{partOfDay}, {therapist.firstName}.</span>
              <span className="med">{TR_WORD[therapist.sessionCountToday] ?? therapist.sessionCountToday} seans, bir bütün gün.</span>
            </h1>
            <p className="hd2-hero-bio">
              {hasSessions ? (
                <>Sabah <strong>{next.time}</strong>&apos;da <strong>{next.clientName}</strong> ile başlıyorsun. Önce briefing&apos;i gözden geçir — son seansta belirlenen ödevler ve SUDS düşüşü hazır.</>
              ) : (
                <>Bugün seansın yok. Süpervizyon notlarını okumak ya da haftalık özet hazırlamak için iyi bir gün.</>
              )}
            </p>
          </div>

          <div className="hd2-hero-bento">
            <div className="hd2-now-wrap">
              <SessionDeck
                sessions={today}
                onOpenPatient={props.onOpenPatient}
                onOpenFormulation={props.onOpenFormulation}
                resolvePatientId={props.resolvePatientId}
                reviewedIds={props.reviewedIds}
              />
            </div>

            <div className="hd2-bento-stats">
              <StatBlock label="Toplam seans" delta={stats.totalDelta} value={`${stats.totalSessions}`} />
              <StatBlock label="Aktif danışan" delta={stats.activeDelta} value={`${stats.activeClients}`} />
              <StatBlock label="Süreklilik" delta={stats.continuityDelta} deltaTone="up" value={`${stats.continuityPct}%`} />
            </div>

            <button type="button" className="hd2-proc" onClick={props.onOpenProcesses}>
              <span className="hd2-proc-bg" />
              <span className="hd2-proc-badge">{processes.count} süreç</span>
              <span className="hd2-proc-foot">
                <span className="hd2-proc-t-main">Danışan Süreçlerim</span>
                <span className="hd2-proc-t-sub">{processes.subtitle}</span>
              </span>
            </button>
          </div>
        </section>

        {/* ═══ 2. CHECK-IN ═══ */}
        <section>
          <div className="hd2-checkin-card">
            <div className="hd2-ci-block">
              <span className="hd2-eyebrow">şimdi nasılsın?</span>
              <div className="hd2-chips">
                {EMOTIONS.map((e) => (
                  <button
                    key={e.key}
                    type="button"
                    className={`hd2-emo ${emotion === e.key ? 'on' : ''}`}
                    aria-pressed={emotion === e.key}
                    onClick={() => { setEmotion(e.key); props.onSelectEmotion?.(e.key); }}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="hd2-ci-block">
              <span className="hd2-eyebrow">bugün için niyet</span>
              <div className="hd2-ci-intent">
                <Edit3 />
                <input
                  className="hd2-ci-input"
                  type="text"
                  value={intent}
                  placeholder="Bugün için tek bir cümle…"
                  onChange={(e) => setIntent(e.target.value)}
                  onBlur={() => props.onChangeIntent?.(intent)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 3. BUGÜNÜN MÜDAHALE PLANLARI ═══ */}
        <section className="hd2-sec" id="gunun-seanslari" style={{ scrollMarginTop: 24 }}>
          <header className="hd2-sec-head">
            <span className="hd2-eyebrow">müdahale / çalışma planları</span>
            <h2 className="hd2-sec-title">Bugünün <em>müdahale</em> planları.</h2>
            <p className="hd2-sec-aside">
              {today.length} seans, {today.length > 1 ? 'her birinin arasında 25 dakika nefes payı olan' : 'rahat tempolu'} bir gün.
            </p>
          </header>
          <SessionTable sessions={today} onOpenPatient={props.onOpenPatientSessions ?? props.onOpenPatient} resolvePatientId={props.resolvePatientId} reviewedIds={props.reviewedIds} />
        </section>

        {/* ═══ 4. HAFTALIK İÇGÖRÜ ═══ */}
        <section className="hd2-sec">
          <header className="hd2-sec-head">
            <span className="hd2-eyebrow">haftalık içgörü</span>
            <h2 className="hd2-sec-title">Süreklilik, <em>esneklik</em> ve drop riski.</h2>
            <p className="hd2-sec-aside">Üç gösterge, tek bakış. Detay için karta dokun.</p>
          </header>
          <div className="hd2-insights">
            <article className="hd2-card lift hd2-flex-card">
              <span className="hd2-eyebrow">ortalama act esnekliği</span>
              <div className="hd2-flex-big">{flex.score.toFixed(1).replace('.', ',')}<em>/10</em></div>
              <div className="hd2-meter"><span style={{ width: `${flex.meterPct ?? 62}%` }} /></div>
              <p className="hd2-flex-desc">{flex.description}</p>
            </article>

            <article className="hd2-card lift hd2-week-card" onClick={props.onOpenWeekly}>
              <div className="hd2-week-top">
                <span className="hd2-week-eyebrow">bu hafta · yoğunluk</span>
                <div className="hd2-week-total">
                  <strong>{weekly.totalLabel ?? `${weekly.days.reduce((s, d) => s + d.sessions, 0)} seans`}</strong>
                  {weekly.comparisonLabel && <span>{weekly.comparisonLabel}</span>}
                </div>
              </div>
              <WeeklyLoadChart days={weekly.days} />
            </article>

            <article className="hd2-card lift hd2-drop-card">
              <div className="hd2-drop-top">
                <span className="hd2-eyebrow">drop riski</span>
                <span className="hd2-pill-tag accent">izle</span>
              </div>
              <div className="hd2-drop-big">{drop.count}<em>danışan</em></div>
              <p className="hd2-drop-copy">{drop.copy}</p>
              {drop.list && drop.list.length > 0 && (
                <ul className="hd2-drop-list">
                  {drop.list.slice(0, 3).map((d, i) => (
                    <li key={i}><strong>{d.name}</strong><span>{d.reason}</span></li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        </section>

        {/* ═══ 5. SÜREKLİLİK & DEĞERLER ═══ */}
        <section className="hd2-sec">
          <div className="hd2-cont">
            <div className="hd2-cont-left">
              <span className="hd2-pill-tag">son 30 gün</span>
              <h3 className="hd2-cont-head">
                {(cont.headline ?? 'Süreklilik haritası').split(' ').slice(0, -1).join(' ')}{' '}
                <em>{(cont.headline ?? 'Süreklilik haritası').split(' ').slice(-1)[0]}</em>.
              </h3>
              <p>{cont.copy}</p>
              <div className="hd2-values">
                {cont.values.map((v) => (
                  <span key={v.label} className={`hd2-value-chip ${v.lead ? 'lead' : ''}`}>
                    {v.label} <span className="lv">{v.level}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="hd2-cont-right">
              {cont.clients.map((c) => (
                <div key={c.name} className="hd2-cont-bar">
                  <span className="nm">{c.name}</span>
                  <span className="track"><span className={`fill ${c.accent ? 'brand' : ''}`} style={{ width: `${c.pct}%` }} /></span>
                  <span className="pct">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 6. SON YANSIMA ═══ */}
        <section className="hd2-sec">
          <article className="hd2-card hd2-reflect">
            <div className="hd2-reflect-top">
              <span className="hd2-badge glass-dark">son yansıma</span>
              <button type="button" className="hd2-link-mini" onClick={props.onWriteReflection}>
                <Edit3 /> yeni yansıma
              </button>
            </div>
            <span className="hd2-reflect-meta">{reflection.meta ?? 'günlük yansıma'} · {reflection.date}</span>
            <p>
              {reflection.excerpt}
              {reflection.accentItalicPhrase && <em>{reflection.accentItalicPhrase}</em>}…
            </p>
          </article>
        </section>

        {/* ═══ 7. PSİKOLOJİ SÖZLÜĞÜ ═══ */}
        {sozlukItems.length > 0 && (
          <section className="hd2-sec">
            <header className="hd2-sec-head">
              <span className="hd2-eyebrow"><BookOpen /> psikoloji sözlüğü</span>
              <h2 className="hd2-sec-title">Ekolünden <em>bu haftanın</em> kavramları.</h2>
              <p className="hd2-sec-aside">
                {sozlukEkoller.map((e) => e.toUpperCase()).join(' & ')} bültenlerinden seçili terimler.
              </p>
            </header>
            <div className="hd2-sozluk-grid">
              {sozlukItems.map((it) => (
                <button key={it.girdi.id} type="button" className="hd2-sozluk-card" onClick={props.onOpenSozluk}>
                  <div className="hd2-sozluk-card-top">
                    <span className={`hd2-sozluk-abbr ${it.ekol}`}>{it.abbr}</span>
                    <span className="hd2-sozluk-kategori">{it.girdi.kategori}</span>
                  </div>
                  <h3 className="hd2-sozluk-terim">{it.girdi.terim}</h3>
                  <p className="hd2-sozluk-tanim">{it.girdi.kisaTanim}</p>
                </button>
              ))}
              <button type="button" className="hd2-sozluk-all" onClick={props.onOpenSozluk}>
                <span>Tüm sözlüğü aç</span>
                <ArrowRight />
              </button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// StatBlock
// ──────────────────────────────────────────────────────────────────────────

function StatBlock({ label, delta, value, deltaTone }: { label: string; delta?: string; value: string; deltaTone?: 'up' | 'accent' }) {
  return (
    <div className="hd2-stat">
      <div className="hd2-stat-l">{label}</div>
      {delta && <div className={`hd2-stat-d ${deltaTone ?? ''}`}>{delta.toLowerCase()}</div>}
      <div className="hd2-stat-v">{value}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SessionDeck — kaydırmalı kart destesi (referans vanilla JS → React state)
// ──────────────────────────────────────────────────────────────────────────

function SessionDeck({
  sessions, onOpenPatient, onOpenFormulation, resolvePatientId, reviewedIds,
}: {
  sessions: TodaySession[];
  onOpenPatient?(id?: string): void;
  onOpenFormulation?(): void;
  resolvePatientId?(name: string): string | undefined;
  reviewedIds?: string[];
}) {
  const reviewedSet = new Set(reviewedIds ?? []);
  const n = sessions.length;
  const [cur, setCur] = useState(0);
  const [dx, setDx] = useState(0);
  const [exiting, setExiting] = useState<{ i: number; dir: number } | null>(null);

  const startX = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);
  const dxRef = useRef(0);
  const exitingRef = useRef(false);

  const pad = (x: number) => `${x + 1 < 10 ? '0' : ''}${x + 1}`;

  const advance = (dir: number) => {
    if (n < 2 || exitingRef.current) return;
    exitingRef.current = true;
    setExiting({ i: cur, dir });
    window.setTimeout(() => {
      setCur((c) => (c + 1) % n);
      setExiting(null);
      exitingRef.current = false;
    }, 380);
  };

  // drag / swipe (fare + dokunmatik)
  useEffect(() => {
    const getX = (e: MouseEvent | TouchEvent) =>
      'touches' in e ? (e.touches[0]?.clientX ?? dxRef.current + startX.current) : (e as MouseEvent).clientX;
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const d = getX(e) - startX.current;
      if (Math.abs(d) > 4) moved.current = true;
      dxRef.current = d;
      setDx(d);
    };
    const up = () => {
      if (!dragging.current) return;
      dragging.current = false;
      const d = dxRef.current;
      if (Math.abs(d) > 70) advance(d < 0 ? -1 : 1);
      dxRef.current = 0;
      setDx(0);
      window.setTimeout(() => { moved.current = false; }, 0);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move as EventListener);
      window.removeEventListener('touchend', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, n]);

  const startDrag = (clientX: number, target: EventTarget | null) => {
    if (n < 2 || exitingRef.current) return;
    if (target instanceof HTMLElement && target.closest('.hd2-now-cta')) return;
    dragging.current = true;
    moved.current = false;
    startX.current = clientX;
  };

  const cardStyle = (i: number): CSSProperties => {
    if (exiting && exiting.i === i) {
      return {
        transition: 'transform .4s ease, opacity .4s ease',
        transform: `translateX(${exiting.dir * 135}%) rotate(${exiting.dir * 7}deg) scale(0.97)`,
        opacity: 0, zIndex: 40, pointerEvents: 'none',
      };
    }
    if (i === cur && dx !== 0) {
      return {
        transition: 'none',
        transform: `translateX(${dx}px) rotate(${dx * 0.025}deg)`,
        opacity: 1, zIndex: 30,
      };
    }
    const off = (i - cur + n) % n;
    let transform = 'translate(-38px,38px) scale(0.94)';
    let opacity = 0; let z = 0;
    if (off === 0) { transform = 'translate(0,0) scale(1)'; opacity = 1; z = 30; }
    else if (off === 1) { transform = 'translate(-19px,19px) scale(0.97)'; opacity = 1; z = 20; }
    else if (off === 2) { transform = 'translate(-38px,38px) scale(0.94)'; opacity = 1; z = 10; }
    return {
      transition: 'transform .44s cubic-bezier(.2,.7,.3,1), opacity .44s ease',
      transform, opacity, zIndex: z,
      pointerEvents: off <= 2 ? 'auto' : 'none',
    };
  };

  return (
    <>
      <div
        className="hd2-now-stack"
        onMouseDown={(e) => startDrag(e.clientX, e.target)}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.target)}
      >
        {sessions.map((s, i) => {
          const isFront = (i - cur + n) % n === 0 && !exiting;
          const initials = s.initials ?? deriveInitials(s.clientName);
          const role = s.role ?? `${s.sessionNo}. seans · ${s.modality} — ${s.topic}`;
          const wb = s.wellbeing ?? 6.5;
          const wbDir = s.wellbeingDir ?? '→';
          const bond = s.valueBondPct ?? 80;
          const suds = s.lastSuds ?? 5;
          const sudsDir = s.sudsDir ?? '→';
          const values = s.valueFocus ?? [s.modality.split('·')[0].trim()];
          const pid = s.clientId ?? resolvePatientId?.(s.clientName);
          const reviewed = pid ? reviewedSet.has(pid) : false;
          return (
            <article
              key={s.ix}
              className={`hd2-now ${isFront ? 'is-front' : ''} ${i === cur && dx !== 0 ? 'grabbing' : ''} ${reviewed ? 'reviewed' : ''}`}
              style={cardStyle(i)}
              onClick={() => { if (!isFront && !moved.current) advance(1); }}
            >
              <div className="hd2-now-head">
                <span className="hd2-now-avatar"><i>{initials}</i></span>
                <div className="hd2-now-id">
                  <h3 className="hd2-now-name">{s.clientName}</h3>
                  <span className="hd2-now-role">{role}</span>
                </div>
                <span className="hd2-now-badge">
                  <span className="hd2-now-pulse" />{i === 0 ? 'sıradaki' : 'seans'} · {s.time}
                </span>
              </div>
              <div className="hd2-now-metrics">
                <div className="hd2-now-metric">
                  <span className="hd2-now-m-l">ort. iyilik hali</span>
                  <span className="hd2-now-m-v">{wb.toFixed(1).replace('.', ',')}<small>/10</small> <span className="pos">{wbDir}</span></span>
                </div>
                <div className="hd2-now-metric">
                  <span className="hd2-now-m-l">değer bağlılığı</span>
                  <span className="hd2-now-m-v">%{bond}</span>
                </div>
                <div className="hd2-now-metric">
                  <span className="hd2-now-m-l">son SUDS</span>
                  <span className="hd2-now-m-v">{suds}<small>/10 {sudsDir}</small></span>
                </div>
              </div>
              <div className="hd2-now-values">
                <span className="hd2-now-sect-l">değer odağı</span>
                <div className="hd2-now-chips">
                  {values.map((v) => <span key={v} className="hd2-g-chip">{v}</span>)}
                </div>
              </div>
              {reviewed && <span className="hd2-now-reviewed">✓ bugün incelendi</span>}
              <div className="hd2-now-cta">
                <button type="button" className="hd2-now-btn" onClick={() => onOpenPatient?.(s.clientId ?? resolvePatientId?.(s.clientName))}>Dosyayı aç <ArrowRight /></button>
                <button type="button" className="hd2-now-btn glass" onClick={onOpenFormulation}>Formülasyon</button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hd2-now-nav">
        <span className="hd2-now-hint">kaydır</span>
        <div className="hd2-now-dots">
          {sessions.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`d ${i === cur ? 'on' : ''}`}
              aria-label={`Seans ${i + 1}`}
              onClick={() => { if (!exitingRef.current) setCur(i); }}
            />
          ))}
        </div>
        <span className="hd2-now-count">{pad(cur)} / {pad(n - 1)}</span>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SessionTable
// ──────────────────────────────────────────────────────────────────────────

function SessionTable({ sessions, onOpenPatient, resolvePatientId, reviewedIds }: { sessions: TodaySession[]; onOpenPatient?(id?: string): void; resolvePatientId?(name: string): string | undefined; reviewedIds?: string[] }) {
  const reviewedSet = new Set(reviewedIds ?? []);
  return (
    <div className="hd2-tlist">
      <div className="hd2-tlist-head">
        <span>#</span><span>Danışan</span><span>Konu</span><span>Ekol</span><span>Seans</span><span>Yoğunluk</span><span className="right">Sıradaki</span>
      </div>
      {sessions.map((s) => {
        const pid = s.clientId ?? resolvePatientId?.(s.clientName);
        const reviewed = pid ? reviewedSet.has(pid) : false;
        return (
        <button
          key={s.ix}
          type="button"
          className={`hd2-tlist-row ${s.status === 'next' ? 'next' : ''} ${s.status === 'past' ? 'past' : ''} ${reviewed ? 'reviewed' : ''}`}
          onClick={pid ? () => onOpenPatient?.(pid) : (s.status === 'next' ? () => onOpenPatient?.() : undefined)}
        >
          <span className="hd2-tlist-ix">
            <span className={`hd2-tlist-dot ${s.status === 'next' ? 'next' : 'up'}`} />{s.ix}
          </span>
          <span className="hd2-tlist-name">
            <strong>{s.clientName}{reviewed && <span className="hd2-tlist-reviewed">✓ incelendi</span>}</strong>
            <span>{s.modality}</span>
          </span>
          <span className="hd2-tlist-issue">{s.topic}</span>
          <span className="hd2-tlist-mod"><span className="d" />{s.modality.split('·')[0].trim()}</span>
          <span className="hd2-tlist-no">{s.sessionNo}.</span>
          <span className="hd2-tlist-sev" aria-label={`yoğunluk ${s.sev}/5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <i key={i} className={i < s.sev ? '' : 'off'} style={{ height: 4 + i * 3 }} />
            ))}
          </span>
          <span className={`hd2-tlist-next ${s.status === 'next' ? 'accent' : ''}`}>{s.nextLabel}</span>
        </button>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// WeeklyLoadChart
// ──────────────────────────────────────────────────────────────────────────

function WeeklyLoadChart({ days }: { days: WeeklyIntensity['days'] }) {
  const max = Math.max(1, ...days.map((d) => d.sessions));
  return (
    <div className="hd2-week-chart">
      <div className="hd2-week-bars">
        {days.map((d, i) => (
          <div key={i} className={`hd2-week-col ${d.today ? 'today' : ''}`}>
            <span className="bar" style={{ height: `${(d.sessions / max) * 100}%` }}>
              <span className="v">{d.sessions}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="hd2-week-labels">
        {days.map((d, i) => (
          <span key={i} className={d.today ? 'today' : ''}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
