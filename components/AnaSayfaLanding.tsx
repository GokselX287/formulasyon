'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './AnaSayfaLanding.css';

// ──────────────────────────────────────────────────────────────────────────
// Ana Sayfa (landing uyumlu) — "Calmie - Ana Sayfa - HANDOFF" birebir portu.
// .aslx köküne scope'lu; tüm metin/sayı gerçek veriden (props.data) gelir.
// ──────────────────────────────────────────────────────────────────────────

export type LandSession = {
  who: string; file: string; mod: string[]; topic: string;
  no: number; time: string;
  status?: 'past' | 'next' | 'upcoming'; dateISO?: string;
};
export type LandRange = { title: string; total: number; unit: string; bars: { l: string; v: number; today?: boolean }[] };
export type LandData = {
  dateTop: string;
  therapist: { name: string; full: string };
  stats: { total: number; active: number; seen: number };
  weekly: { sessionsThisWeek: number };
  sessions: LandSession[];
  mood: { trend: number[]; note: string };
  intensity: { active: 'week' | 'month' | 'year'; week: LandRange; month: LandRange; year: LandRange };
  calendar: { monthName: string; year: number; month: number; today: number; counts: Record<string | number, number> };
  continuity: {
    total: number; avg: string; median: number; longest: number;
    histogram: { k: string; n: number }[]; dropoutInsight: string;
    retention: { nm: string; pct: number }[]; exit: { l: string; n: number; c: string }[];
  };
  drop: { list: { name: string; risk: string; level: 'high' | 'mid'; meta: string; file?: string }[] };
  seen: { distinct: number; withProblem: number; without: number; list: { name: string; problem: string; file?: string }[] };
};

export type AnaSayfaLandingProps = {
  data: LandData;
  onOpenFile?(file: string, name?: string): void;
  onNav?(target: string): void;
  onOpenProfile?(): void;
  onSaveWellbeing?(score: number, note: string): void | Promise<void>;
};

const FONTS = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap';

const minutesOf = (t: string) => { const m = String(t).match(/(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : 0; };
const initials = (s: string) => (s || '').replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase() || '—';
const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* yoksay */ } };

function sparkPath(vals: number[], w: number, h: number) {
  if (vals.length < 2) return `M0 ${h / 2} L${w} ${h / 2}`;
  const max = Math.max(...vals, 1), min = Math.min(...vals, 0);
  const rng = (max - min) || 1;
  return vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / rng) * h;
    return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  }).join(' ');
}

const Arrow = () => <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const Check = () => <svg viewBox="0 0 24 24"><path d="M5 12l4.5 4.5L19 7" /></svg>;

const THEMES = [
  { id: 'sage', dot: '#8FB58C' },
  { id: 'ocean', dot: '#5FA9C0' },
  { id: 'dusk', dot: '#9A7FD0' },
  { id: 'clay', dot: '#D78C66' },
  { id: 'rose', dot: '#C97FA0' },
];

const SECTIONS = [
  { id: 'secTodo', lab: 'Bugün' },
  { id: 'secIntensity', lab: 'Yoğunluk' },
  { id: 'secContinuity', lab: 'Süreklilik' },
  { id: 'secCalendar', lab: 'Takvim' },
  { id: 'secRisk', lab: 'Risk' },
];

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MOOD_GLYPHS = ['☁', '🌥', '⛅', '🌤', '☀'];

export default function AnaSayfaLanding({ data, onOpenFile, onNav, onOpenProfile, onSaveWellbeing }: AnaSayfaLandingProps) {
  const D = data;
  const rootRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── tema (localStorage: calmie-theme) ──────────────────────────────
  const [theme, setTheme] = useState('sage');
  useEffect(() => {
    const saved = lsGet('calmie-theme');
    if (saved && THEMES.some((t) => t.id === saved)) setTheme(saved);
  }, []);
  const applyTheme = (id: string) => { setTheme(id); lsSet('calmie-theme', id); };

  // ── haftalık çalışma saati (localStorage: calmie-weekly-hours) ──────
  const [weeklyHours, setWeeklyHours] = useState<string | null>(null);
  const [whEditing, setWhEditing] = useState(false);
  useEffect(() => { setWeeklyHours(lsGet('calmie-weekly-hours')); }, []);
  const whManual = weeklyHours !== null && weeklyHours !== '';
  const whValue = whManual ? weeklyHours! : String(Math.round(D.weekly.sessionsThisWeek * 50 / 60));
  const whSub = whManual ? 'manuel' : 'tahmini';
  const commitWh = (raw: string) => {
    let v = parseInt(raw, 10); if (isNaN(v)) v = 0; v = Math.max(0, Math.min(168, v));
    setWeeklyHours(String(v)); lsSet('calmie-weekly-hours', String(v)); setWhEditing(false);
  };

  // ── seans sıralama + durum (gerçek saate göre, mount sonrası) ───────
  const sorted = useMemo(() => {
    const list = [...D.sessions].map((s) => ({ ...s, _min: minutesOf(s.time) }))
      .sort((a, b) => a._min - b._min);
    if (mounted) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      let nextSet = false;
      list.forEach((s) => {
        if (s._min < nowMin) s.status = 'past';
        else if (!nextSet) { s.status = 'next'; nextSet = true; }
        else s.status = 'upcoming';
      });
    } else {
      // SSR: ilk geleceği next işaretle (hydration için belirleyici)
      let nextSet = false;
      list.forEach((s) => { if (!s.status) s.status = !nextSet ? (nextSet = true, 'next') : 'upcoming'; });
    }
    return list;
  }, [D.sessions, mounted]);
  const nextSession = sorted.find((s) => s.status === 'next') || sorted[0];

  const greetWord = !mounted ? 'Merhaba'
    : (new Date().getHours() < 12 ? 'Günaydın' : new Date().getHours() < 18 ? 'İyi günler' : 'İyi akşamlar');

  // ── ruh hali seçimi ────────────────────────────────────────────────
  const [mood, setMood] = useState<number | null>(null);
  const pickMood = (v: number) => { setMood(v); try { onSaveWellbeing?.(v, ''); } catch { /* yoksay */ } };

  // ── yoğunluk dönemi + bar animasyonu ───────────────────────────────
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>(D.intensity.active || 'week');
  const [intReady, setIntReady] = useState(false);
  useEffect(() => {
    setIntReady(false);
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setIntReady(true)));
    return () => cancelAnimationFrame(r);
  }, [period, mounted]);
  const intData = D.intensity[period];
  const intMax = Math.max(...intData.bars.map((b) => b.v), 1);

  // ── haftalık takvim (Pzt başlangıçlı) ──────────────────────────────
  const cal = D.calendar;
  const calWeek = useMemo(() => {
    const wd = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
    const todayDate = new Date(cal.year, cal.month - 1, cal.today);
    const monday = new Date(todayDate); monday.setDate(cal.today - ((todayDate.getDay() + 6) % 7));
    const days: { wd: string; dn: number; cnt: number; today: boolean; busy: boolean }[] = [];
    let weekTotal = 0;
    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday); dt.setDate(monday.getDate() + i);
      const dn = dt.getDate(), inMonth = dt.getMonth() === cal.month - 1;
      const isToday = inMonth && dn === cal.today;
      const cnt = inMonth ? (isToday ? sorted.length : (Number(cal.counts[dn]) || 0)) : 0;
      weekTotal += cnt;
      days.push({ wd: wd[i], dn, cnt, today: isToday, busy: cnt > 0 });
    }
    return { days, weekTotal };
  }, [cal, sorted.length]);

  // hafta aralığı etiketi ("22–28 Haziran")
  const weekRangeLabel = useMemo(() => {
    const todayDate = new Date(cal.year, cal.month - 1, cal.today);
    const monday = new Date(todayDate); monday.setDate(cal.today - ((todayDate.getDay() + 6) % 7));
    const sun = new Date(monday); sun.setDate(monday.getDate() + 6);
    return monday.getMonth() === sun.getMonth()
      ? `${monday.getDate()}–${sun.getDate()} ${AYLAR[sun.getMonth()]}`
      : `${monday.getDate()} ${AYLAR[monday.getMonth()]} – ${sun.getDate()} ${AYLAR[sun.getMonth()]}`;
  }, [cal]);

  // ── süreklilik donut (ayrılma nedenleri) ───────────────────────────
  const c = D.continuity;
  const exitTotal = c.exit.reduce((a, b) => a + b.n, 0);
  const donut = useMemo(() => {
    const R = 52, CIRC = 2 * Math.PI * R;
    let acc = 0;
    return c.exit.map((e) => {
      const frac = exitTotal ? e.n / exitTotal : 0;
      const len = frac * CIRC, off = -acc * CIRC;
      acc += frac;
      return { c: e.c, dash: `${len.toFixed(2)} ${(CIRC - len).toFixed(2)}`, off: off.toFixed(2) };
    });
  }, [c.exit, exitTotal]);
  const histMax = Math.max(...c.histogram.map((h) => h.n), 1);

  // ── railnav scroll-spy + reveal + show ─────────────────────────────
  const [activeSec, setActiveSec] = useState('secTodo');
  const [railShow, setRailShow] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  useEffect(() => {
    if (!mounted) return;
    const root = rootRef.current; if (!root) return;
    // scroll-spy
    const spy = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setActiveSec((e.target as HTMLElement).id); }),
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    SECTIONS.forEach((s) => { const el = root.querySelector('#' + s.id); if (el) spy.observe(el); });
    // reveal
    const ro = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
    root.querySelectorAll('.reveal').forEach((r) => ro.observe(r));
    // rail show
    const onScroll = () => setRailShow(window.scrollY > window.innerHeight * 0.55);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => { spy.disconnect(); ro.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [mounted]);

  const scrollToSec = (id: string) => {
    const t = rootRef.current?.querySelector('#' + id) as HTMLElement | null; if (!t) return;
    const y = t.getBoundingClientRect().top + window.scrollY - 78;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const openFile = (s: { file?: string; who?: string; name?: string }) => {
    if (s.file) onOpenFile?.(s.file, s.who || s.name);
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={FONTS} rel="stylesheet" />

      <div className="aslx" ref={rootRef} data-theme={theme === 'sage' ? undefined : theme}>
        <div className="scene" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        {/* ───────── NAV ───────── */}
        <div className="navwrap">
          <nav className="nav" aria-label="Birincil">
            <a className="logo" onClick={() => scrollToSec('secTodo')}>Calmie<i>.</i></a>
            <div className="nav-links">
              <a className="active">Ana Sayfa</a>
              <a onClick={() => onNav?.('calendar')}>Takvim</a>
              <a onClick={() => onNav?.('calisma-alani')}>Çalışma Alanı</a>
              <a onClick={() => onOpenProfile?.()}>Profil</a>
            </div>
            <a className="nav-prof" onClick={() => onOpenProfile?.()}>
              <div className="np-col">
                <span className="pro-badge"><svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.3L21 9l-4.8 4.3L17.6 22 12 18.4 6.4 22l1.4-8.7L3 9l6.4-.7z" /></svg>PRO</span>
                <span className="np-name">{D.therapist.name}</span>
              </div>
              <span className="np-av">{initials(D.therapist.full)}</span>
            </a>
            <button className="menu-btn" aria-label="Menü" onClick={() => setMobileMenu((v) => !v)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </nav>
          <div className={'mobile-menu' + (mobileMenu ? ' open' : '')}>
            <a onClick={() => setMobileMenu(false)}>Ana Sayfa</a>
            <a onClick={() => { setMobileMenu(false); onNav?.('calendar'); }}>Takvim &amp; Randevular</a>
            <a onClick={() => { setMobileMenu(false); onNav?.('calisma-alani'); }}>Çalışma Alanı</a>
            <a onClick={() => { setMobileMenu(false); onOpenProfile?.(); }}>Profil</a>
          </div>
        </div>

        {/* ───────── HERO ───────── */}
        <section className="hero" id="hero">
          <div className="hero-inner">
            <div className="hero-text reveal">
              <span className="eyebrow hero-eye"><span className="pulse" />{D.dateTop}</span>
              <h1 className="hero-title" suppressHydrationWarning>{greetWord},<br /><span className="ser">{D.therapist.name}.</span></h1>
              <p className="hero-lead">Sen seanslarına odaklan diye, ihtiyaç duyduğun her şey tek ekranda.</p>
            </div>
          </div>

          <div className="hero-cards reveal">
            <article className="hc hc-light" role="button" tabIndex={0} aria-label="Bugünün seanslarına git"
              onClick={() => scrollToSec('secTodo')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToSec('secTodo'); } }}>
              <div className="hc-date">{D.dateTop}</div>
              <div className="hc-eye">Seans akışı</div>
              <div className="hc-title">Bugünün<br />seansları</div>
              <div className="hc-eye">Haftalık çalışma</div>
              <div className="hc-big">{whValue}<small>saat</small></div>
            </article>
            {nextSession && (
              <article className="hc hc-dark" role="button" tabIndex={0} aria-label="Sıradaki seans dosyasını aç"
                onClick={() => openFile(nextSession)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFile(nextSession); } }}>
                <div className="hcd-top">
                  <span className="hcd-live"><span className="dot" />{nextSession.status === 'next' ? 'Sıradaki seans' : 'İlk seans'}</span>
                  <span className="hcd-mod">{nextSession.mod.join(' · ')}</span>
                </div>
                <div className="hcd-time">{nextSession.time}</div>
                <div className="hcd-name">{nextSession.who}</div>
                <div className="hcd-topic">{nextSession.topic}</div>
                <div className="hcd-foot">
                  <span className="hcd-no">{nextSession.no}. seans · dosyayı aç</span>
                  <span className="hcd-go"><Arrow /></span>
                </div>
              </article>
            )}
          </div>

          <div className="watermark" aria-hidden="true">Calmie<i>.</i><span className="wm-tag">Klinik<br />Asistan</span></div>
        </section>

        {/* ───────── STAT STRIP ───────── */}
        <section className="strip">
          <div className="wrap">
            <article className="tile reveal">
              <div className="te"><span className="eyebrow">Haftalık çalışma</span>
                {!whEditing && <span className="edit" onClick={() => setWhEditing(true)}>düzenle</span>}
              </div>
              <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d={sparkPath(D.intensity.week.bars.map((b) => b.v), 100, 30)} fill="none" stroke="url(#aslxG1)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="tile-big">
                {whEditing
                  ? <input className="wh-input" type="number" min={0} max={168} autoFocus defaultValue={whValue}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitWh((e.target as HTMLInputElement).value); else if (e.key === 'Escape') setWhEditing(false); }}
                      onBlur={(e) => commitWh(e.target.value)} />
                  : <span className="num">{whValue}</span>}
                <small>saat</small>
              </div>
              <div className="tile-sub">{D.weekly.sessionsThisWeek} seans planlandı · {whSub}</div>
            </article>

            <article className="tile reveal">
              <div className="te"><span className="eyebrow">Aktif danışan</span></div>
              <div className="av-stack">{sorted.slice(0, 4).map((s, i) => <span key={i}>{initials(s.who)}</span>)}</div>
              <div className="tile-big">{D.stats.active}<small>kişi</small></div>
              <div className="tile-sub">{D.stats.seen} kişiyle bu ay görüşüldü</div>
            </article>

            <article className="tile reveal">
              <div className="te"><span className="eyebrow">Bu hafta</span></div>
              <div className="tile-big" style={{ marginTop: 'auto' }}>{D.weekly.sessionsThisWeek}<small>seans</small></div>
              <div className="tile-sub">{weekRangeLabel} aralığında planlı</div>
            </article>

            <article className="tile reveal">
              <div className="te"><span className="eyebrow">Toplam kayıt</span></div>
              <div className="tile-big" style={{ marginTop: 'auto' }}>{D.stats.total}<small>dosya</small></div>
              <div className="tile-sub">Arşiv dahil tüm danışan dosyaları</div>
            </article>
          </div>
        </section>

        <main className="main">
          <div className="wrap">

            {/* ───────── §1 BUGÜN ───────── */}
            <section className="sec" id="secTodo">
              <div className="sec-head reveal">
                <div className="l"><span className="eyebrow">yapılacaklar · ritim</span>
                  <h2 className="sec-title">Bugün neler <span className="ser">çalışman</span> gerekiyor?</h2></div>
                <p className="sec-aside">{sorted.length} seans planlı. Saati geçenler işaretlendi; sıradaki vurguda.</p>
              </div>
              <div className="grid-2 reveal">
                <div className="panel">
                  <div className="panel-eye"><span className="eyebrow">Bugünün seansları</span><span className="eyebrow">{sorted.length} seans</span></div>
                  <div className="tl">
                    {sorted.length === 0 && <div className="tl-empty">Bugün planlı seans yok.</div>}
                    {sorted.map((s, i) => {
                      const cls = s.status === 'next' ? ' next' : s.status === 'past' ? ' past' : '';
                      return (
                        <div key={i} className={'tl-row' + cls} role="button" tabIndex={0} onClick={() => openFile(s)}
                          onKeyDown={(e) => { if (e.key === 'Enter') openFile(s); }}>
                          <span className="tl-time">{s.time}</span>
                          <span className="tl-mid">
                            <span className="tl-name">{s.who}{s.status === 'next' && <span className="tl-badge">Sıradaki</span>}</span>
                            <span className="tl-topic">{s.topic}</span>
                          </span>
                          <span className="tl-end">
                            {s.status === 'past'
                              ? <span className="tl-check"><Check /></span>
                              : <><span className="tl-mod">{s.mod[0] || ''}</span><span className="tl-arr"><Arrow /></span></>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <article className="panel mood">
                  <span className="card-tint" />
                  <div className="mood-z">
                    <div className="panel-eye"><span className="eyebrow">Kendi iyilik halin</span></div>
                    <div className="mood-orb" />
                    <h3 className="mood-q">Bugün nasılsın?</h3>
                    <p className="mood-note">{D.mood.note}</p>
                    <div className="mood-scale">
                      {MOOD_GLYPHS.map((g, i) => (
                        <button key={i} type="button" className={mood === i + 1 ? 'on' : ''} onClick={() => pickMood(i + 1)}>{g}</button>
                      ))}
                    </div>
                    <div className="mood-trend">
                      {(() => { const maxT = Math.max(...D.mood.trend, 1); return D.mood.trend.map((v, i) => <i key={i} style={{ height: `${Math.round(v / maxT * 100)}%` }} />); })()}
                    </div>
                  </div>
                </article>
              </div>
            </section>

            {/* ───────── §2 YOĞUNLUK ───────── */}
            <section className="sec" id="secIntensity">
              <div className="sec-head reveal">
                <div className="l"><span className="eyebrow">yük dengesi</span>
                  <h2 className="sec-title">Ne kadar <span className="ser">yoğunsun?</span></h2></div>
                <p className="sec-aside">Seans yükünü hafta, ay ve yıl ölçeğinde gör — kendi temponu koru.</p>
              </div>
              <div className="panel reveal">
                <div className="panel-eye">
                  <span className="eyebrow">{intData.title}</span>
                  <div className="seg">
                    {(['week', 'month', 'year'] as const).map((p) => (
                      <button key={p} type="button" className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>
                        {p === 'week' ? 'Hafta' : p === 'month' ? 'Ay' : 'Yıl'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="int-total"><b>{intData.total}</b><span>{intData.unit}</span></div>
                <div className="int-bars">
                  {intData.bars.map((b, i) => (
                    <div key={i} className={'int-bar' + (b.today ? ' today' : '')}>
                      <span className="v">{b.v || ''}</span>
                      <span className="b" style={{ height: intReady ? `${Math.max(4, b.v / intMax * 100)}%` : '0%' }} />
                      <span className="l">{b.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ───────── §3 SÜREKLİLİK ───────── */}
            <section className="sec" id="secContinuity">
              <div className="sec-head reveal">
                <div className="l"><span className="eyebrow">bağ &amp; devamlılık</span>
                  <h2 className="sec-title">Danışanlar kaç seans <span className="ser">devam ediyor?</span></h2></div>
                <p className="sec-aside">Süreçte kalma, ortalama seans sayısı ve süreçten ayrılma nedenleri.</p>
              </div>
              <div className="cont-grid reveal">
                <div className="panel">
                  <div className="cont-metrics">
                    <div className="cm"><b>{c.avg}</b><span>Ortalama seans</span></div>
                    <div className="cm"><b>{c.median}</b><span>Medyan</span></div>
                    <div className="cm"><b>{c.longest}</b><span>En uzun süreç</span></div>
                    <div className="cm"><b>{c.total}</b><span>Aktif danışan</span></div>
                  </div>
                  <span className="eyebrow">Seans sayısı dağılımı</span>
                  <div className="hist">
                    {c.histogram.map((h, i) => (
                      <div key={i} className="hist-col"><span className="b" style={{ height: `${Math.max(4, h.n / histMax * 100)}%` }} /><span className="l">{h.k}</span></div>
                    ))}
                  </div>
                  <p className="insight">Düşüşler çoğunlukla <b>{c.dropoutInsight}</b> sonra başlıyor — erken bağ kuran danışanlar süreçte daha uzun kalıyor.</p>
                </div>
                <div className="panel">
                  <span className="eyebrow">Süreçte kalma oranı</span>
                  <div className="ret" style={{ marginTop: 16 }}>
                    {c.retention.map((r, i) => (
                      <div key={i} className="ret-row">
                        <div className="ret-top"><span className="ret-nm">{r.nm}</span><span className="ret-pct">%{r.pct}</span></div>
                        <div className="ret-track"><div className="ret-fill" style={{ width: `${r.pct}%` }} /></div>
                      </div>
                    ))}
                  </div>
                  <div className="exit">
                    <svg width="128" height="128" viewBox="0 0 128 128" style={{ flex: 'none' }}>
                      {donut.map((d, i) => (
                        <circle key={i} r="52" cx="64" cy="64" fill="none" stroke={d.c} strokeWidth="20"
                          strokeDasharray={d.dash} strokeDashoffset={d.off} transform="rotate(-90 64 64)" />
                      ))}
                      <text x="64" y="60" textAnchor="middle" fontSize="26" fontWeight="600" fill="#23222A">{exitTotal}</text>
                      <text x="64" y="78" textAnchor="middle" fontSize="9" fill="#86858F" fontFamily="Plus Jakarta Sans" letterSpacing="1">DANIŞAN</text>
                    </svg>
                    <div className="exit-legend">
                      {c.exit.map((e, i) => (
                        <div key={i} className="exit-li"><i style={{ background: e.c }} />{e.l} <b>{e.n}</b></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ───────── §4 TAKVİM ───────── */}
            <section className="sec" id="secCalendar">
              <div className="sec-head reveal">
                <div className="l"><span className="eyebrow">ajanda</span>
                  <h2 className="sec-title">Bu <span className="ser">hafta</span></h2></div>
                <p className="sec-aside">Bu hafta {calWeek.weekTotal} seans planlı. Bugün {sorted.length} danışan görüyorsun.</p>
              </div>
              <div className="grid-2b reveal">
                <div className="panel">
                  <div className="cal-head">
                    <div className="cal-mn">{cal.monthName}<span>bu hafta {calWeek.weekTotal} seans</span></div>
                    <div className="cal-nav">
                      <button type="button" aria-label="Önceki" onClick={() => onNav?.('calendar')}><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg></button>
                      <button type="button" aria-label="Sonraki" onClick={() => onNav?.('calendar')}><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg></button>
                    </div>
                  </div>
                  <div className="cal-week">
                    {calWeek.days.map((d, i) => (
                      <div key={i} className={'cal-day' + (d.today ? ' today' : '') + (d.busy ? ' busy' : '')}>
                        <span className="wd">{d.wd}</span><span className="dn">{d.dn}</span>
                        <span className="cn">{d.cnt > 0 ? d.cnt : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="panel">
                  <p className="cal-list-h">Bugün · {sorted.length} danışan</p>
                  <div className="cal-list">
                    {sorted.length === 0 && <div className="cal-empty">Bugün için seans yok.</div>}
                    {sorted.map((s, i) => (
                      <button key={i} type="button" className="cal-row" onClick={() => openFile(s)}>
                        <span className="t">{s.time}</span><span className="n">{s.who}</span><span className="m">{s.mod[0] || ''}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ───────── §5 RİSK ───────── */}
            <section className="sec" id="secRisk">
              <div className="sec-head reveal">
                <div className="l"><span className="eyebrow">erken uyarı</span>
                  <h2 className="sec-title">İletişimi <span className="ser">kesilenler</span></h2></div>
                <p className="sec-aside">{D.drop.list.length} danışan bir süredir sessiz — bağı tazelemek için iyi bir an olabilir.</p>
              </div>
              <div className="panel reveal">
                <div className="risk-list">
                  {D.drop.list.length === 0 && <div className="risk-empty">Şu an iletişimi kesilen danışan görünmüyor. 🌿</div>}
                  {D.drop.list.map((d, i) => (
                    <div key={i} className="risk-row" role="button" tabIndex={0} onClick={() => openFile(d)}
                      onKeyDown={(e) => { if (e.key === 'Enter') openFile(d); }}>
                      <span className="risk-av">{initials(d.name)}</span>
                      <span className="risk-mid"><span className="risk-nm">{d.name}</span><span className="risk-meta">{d.meta}</span></span>
                      <span className={'risk-tag ' + d.level}>{d.risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>
        </main>

        {/* ───────── FOOTER ───────── */}
        <div className="footwrap">
          <footer>
            <div className="foot-grid">
              <div className="foot-brand">
                <a className="logo" onClick={() => scrollToSec('secTodo')}>Calmie<i>.</i></a>
                <p>İşini profesyonel boyutta yapmak isteyen herkes için dijital klinik asistanı — sade, güvenli, bütüncül.</p>
              </div>
              <div className="foot-col">
                <h4>Panel</h4>
                <a onClick={() => scrollToSec('secTodo')}>Ana Sayfa</a>
                <a onClick={() => onNav?.('calendar')}>Takvim &amp; Randevular</a>
                <a onClick={() => onNav?.('calisma-alani')}>Çalışma Alanı</a>
              </div>
              <div className="foot-col">
                <h4>Hesap</h4>
                <a onClick={() => onOpenProfile?.()}>Profil</a>
                <a onClick={() => onNav?.('ayarlar')}>Ayarlar</a>
              </div>
            </div>
            <div className="foot-bottom">
              <small>© 2026 Calmie. Tüm hakları saklıdır.</small>
              <div className="foot-legal">
                <a>KVKK</a>
                <a>Gizlilik Politikası</a>
                <a>Kullanım Koşulları</a>
              </div>
            </div>
          </footer>
        </div>

        {/* ───────── TEMA DOCK ───────── */}
        <div className="dock" aria-label="Renk teması">
          {THEMES.map((t) => (
            <button key={t.id} type="button" className={'dock-dot' + (theme === t.id ? ' on' : '')} style={{ background: t.dot }} aria-label={`${t.id} tema`} onClick={() => applyTheme(t.id)} />
          ))}
        </div>

        {/* ───────── RAILNAV ───────── */}
        <nav className={'railnav' + (railShow ? ' show' : '')} aria-label="Bölümler">
          {SECTIONS.map((s, i) => (
            <a key={s.id} className={'rn-item' + (activeSec === s.id ? ' active' : '')} onClick={() => scrollToSec(s.id)}>
              <span className="rn-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="rn-label">{s.lab}</span>
              <span className="rn-tick" />
            </a>
          ))}
        </nav>

        {/* spark gradyanı */}
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true"><defs>
          <linearGradient id="aslxG1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9AA6E8" /><stop offset="1" stopColor="#B98FD6" /></linearGradient>
        </defs></svg>
      </div>
    </>
  );
}
