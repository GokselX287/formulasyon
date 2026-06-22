'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './TakvimRandevular.css';
import TakipListesi from './TakipListesi';

// ──────────────────────────────────────────────────────────────────────────
// Takvim & Randevular — "Calmie mesh/cam" kabuk (Cv görsel-20).
// Kabuk + Takvim sekmesi yeni Calmie diline giydirildi (.tkv scope).
// Diğer sekmeler (Hazırlık/Müsaitlik/Geçmiş/SMS/Gelişim/Web Sitesi) kapsam dışı
// → mevcut işlevsel içerik korundu (.trv sarmalı). Veri macOS "Randevular"dan canlı.
// ──────────────────────────────────────────────────────────────────────────

export type RawCalEvent = { id: string; title: string; start: string; end?: string; uid?: string };
export type ApptEdit = { uid: string; tarih: string; saat: string; sure: number; title?: string };
type ClientMatch = { id?: string; topic?: string; phone?: string; reviewed?: boolean; fileHref?: string; fee?: number };
type GelisimEv = { id: string; title: string; date: string; time: string; durationMin: number; done?: boolean };

export type TakvimRandevularProps = {
  events?: RawCalEvent[];
  resolveClient?: (name: string) => ClientMatch | undefined;
  avgFee?: number;
  missingFeeCount?: number;
  availability?: { sablon: any[]; bloklar: any[] };
  onAddBlock?: (b: { tarih: string; baslangic: string; bitis: string; aciklama?: string; renk: string }) => void;
  gelisimEvents?: GelisimEv[];
  onBack?(): void;
  onNav?(target: string): void;
  onOpenClient?(name: string): void;
  onPrepareSession?(name: string): void;
  onNewAppointment?(prefill?: { tarih?: string; saat?: string }): void;
  onManualSync?(): Promise<void> | void;
  onOpenInterventionSuggest?(): void;
  onEditMissingFees?(): void;
  onCancelSession?(name: string, mode: 'iptal' | 'ertelendi', isoDate: string): void | Promise<void>;
  // macOS "Randevular" takvimine yazan düzenlemeler:
  onUpdateEvent?(patch: ApptEdit): Promise<boolean> | boolean;
  onDeleteEvent?(uid: string, name?: string): Promise<boolean> | boolean;
};

type SubTab = 'takvim' | 'hazirlik' | 'musaitlik' | 'gecmis' | 'sms' | 'gelisim' | 'takip' | 'websitesi';
type CalView = 'hafta' | 'gun' | 'ay';
type StatPeriod = 'hafta' | 'ay' | 'yil';

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTHS_FULL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAY_ABBR = ['paz', 'pzt', 'sal', 'çar', 'per', 'cum', 'cmt']; // getDay() (0=Paz)

// ── Eski editöryel tonlar (ALL.tone — .trv pane'leri için) ──
const TONES = [
  { bg: '#E8EAF7', ink: '#4C5078' }, { bg: '#FBE7DC', ink: '#8C5A41' },
  { bg: '#DFF0E5', ink: '#477254' }, { bg: '#E3EAF6', ink: '#46587C' },
  { bg: '#EDE6F4', ink: '#604B75' }, { bg: '#F6EFD9', ink: '#6F5C30' },
];
function toneFor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}
// ── Yeni .tkv pastel tonları (token'lar tokens.css → .tkv'ye scope'landı) ──
const TONE_KEYS = ['leylak', 'mor', 'gul', 'civit', 'erik', 'notr'];
const hashName = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const toneVars = (name: string): React.CSSProperties => {
  const k = TONE_KEYS[hashName(name) % 6];
  return { ['--tbg' as any]: `var(--tone-${k}-bg)`, ['--tbd' as any]: `var(--tone-${k}-bd)`, ['--tink' as any]: `var(--tone-${k}-ink)`, ['--tdot' as any]: `var(--tone-${k}-dot)` };
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const hhmm = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
const isoOf = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const minutesOfISO = (iso: string) => (Number(iso.slice(11, 13)) || 0) * 60 + (Number(iso.slice(14, 16)) || 0);
const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };

const WORKING_HOURS = [
  { d: 'Pazartesi', v: '09:00 – 18:00' }, { d: 'Salı', v: '09:00 – 18:00' },
  { d: 'Çarşamba', v: '09:00 – 18:00' }, { d: 'Perşembe', v: '09:00 – 18:00' },
  { d: 'Cuma', v: '09:00 – 16:00' }, { d: 'Cumartesi', v: 'Kapalı', off: true },
  { d: 'Pazar', v: 'Kapalı', off: true },
];
const SMS_TEMPLATES = [
  { name: 'Hatırlatma', body: 'Merhaba {isim}, yarınki {saat} seansınızı hatırlatmak isteriz. Görüşmek üzere.' },
  { name: 'Gün içi', body: 'Merhaba {isim}, bugün {saat} randevunuzu hatırlatırız. İyi günler.' },
];
const SITE_TEMPLATES = [
  { key: 'huzur', name: 'Huzur', desc: 'Yumuşak pastel mesh, havadar, sakin.', prev: 'linear-gradient(135deg,#E8EAF7,#EDE6F4 58%,#FBE7DC)' },
  { key: 'klinik', name: 'Klinik', desc: 'Krem editöryel, güçlü tipografi.', prev: 'linear-gradient(135deg,#F6EFD9,#EFEDE8)' },
  { key: 'sinematik', name: 'Sinematik', desc: 'Dokulu koyu hero, büyük başlık.', prev: 'linear-gradient(135deg,#2C2C33,#46587C)' },
  { key: 'sicak', name: 'Sıcak', desc: 'Toprak tonları, portre öncelikli.', prev: 'linear-gradient(135deg,#FBE7DC,#DFF0E5)' },
  { key: 'sade', name: 'Sade', desc: 'Ultra-minimal, bol boşluk, mono vurgu.', prev: 'linear-gradient(135deg,#EFEDE8,#FFFFFF)' },
];

// Dock her sayfada AnaSayfaV3 ile birebir aynı: Ana Sayfa · Çalışma Alanı · Profil · Ayarlar.
// Takvim, Çalışma Alanı'nın bir odası olduğundan "Çalışma Alanı" aktif (BuHafta vb. ile tutarlı).
const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Ayarlar', target: 'ayarlar' },
];

const THEMES = [
  { k: 'default', sw: 'linear-gradient(135deg,#EE5870 0%,#FED6A0 52%,#6086CE 100%)', t: 'Varsayılan' },
  { k: 'mavi', sw: 'linear-gradient(135deg,#3A62C4,#B4D2FA)', t: 'Mavi' },
  { k: 'gri', sw: 'linear-gradient(135deg,#70727C,#E4E5E9)', t: 'Gri-beyaz' },
  { k: 'su', sw: 'linear-gradient(135deg,#289694,#B8EADE)', t: 'Su yeşili' },
  { k: 'koyu', sw: 'linear-gradient(135deg,#1E543A,#6EAF82)', t: 'Koyu yeşil' },
];

const HSTART = 9 * 60, HEND = 22 * 60, HPX = 60;

// Randevu düzenleme modalı — inline stiller (CSS bağımlılığı yok)
const EDIT_LBL: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ink-mute)' };
const EDIT_INP: React.CSSProperties = { fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, color: 'var(--ink)', background: '#fff', border: '1px solid rgba(16,15,13,.16)', borderRadius: 10, padding: '9px 11px', textTransform: 'none', letterSpacing: 0, outline: 'none', width: '100%' };
const EDIT_BTN: React.CSSProperties = { fontFamily: 'inherit', fontSize: 13, fontWeight: 600, borderRadius: 999, padding: '9px 16px', border: 'none', cursor: 'pointer' };
const EDIT_GHOST: React.CSSProperties = { ...EDIT_BTN, background: '#fff', boxShadow: 'inset 0 0 0 1px rgba(16,15,13,.18)', color: 'var(--ink)' };
const EDIT_PRIMARY: React.CSSProperties = { ...EDIT_BTN, background: '#100F0D', color: '#F8F6F0' };
const EDIT_DEL: React.CSSProperties = { ...EDIT_BTN, background: 'rgba(192,57,43,.1)', color: '#C0392B' };
const DROP_FROM = 20 * 60; // 20:00 sonrası = iptal / erteleme alanı

export default function TakvimRandevular(props: TakvimRandevularProps) {
  const { events, resolveClient, avgFee = 0, missingFeeCount = 0, availability, onAddBlock, gelisimEvents, onBack, onNav, onOpenClient, onPrepareSession, onNewAppointment, onManualSync, onOpenInterventionSuggest, onEditMissingFees, onCancelSession, onUpdateEvent, onDeleteEvent } = props;

  const BLOCK_TYPES: { key: string; label: string }[] = [
    { key: 'kapali', label: 'Kapalı' }, { key: 'yemek', label: 'Yemek' },
    { key: 'mola', label: 'Mola' }, { key: 'izin', label: 'İzin / Hastalık' }, { key: 'musait_degil', label: 'Müsait değil' },
  ];
  const blockLabel = (renk: string) => BLOCK_TYPES.find((t) => t.key === renk)?.label ?? 'Müsait değil';
  const [blkForm, setBlkForm] = useState({ tarih: '', baslangic: '09:00', bitis: '10:00', renk: 'kapali', aciklama: '' });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const now = useMemo(() => new Date(), []);
  const todayISO = isoOf(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [subTab, setSubTab] = useState<SubTab>('takvim');
  const [calView, setCalView] = useState<CalView>('hafta');
  const [weekOff, setWeekOff] = useState(0);
  const [dayOff, setDayOff] = useState(0);
  const [monthOff, setMonthOff] = useState(0);
  const [statPeriod, setStatPeriod] = useState<StatPeriod>('hafta');
  const [earnPeriod, setEarnPeriod] = useState<StatPeriod>('hafta');
  const [histQuery, setHistQuery] = useState('');
  const [smsSel, setSmsSel] = useState<Set<string>>(new Set());
  const [smsSent, setSmsSent] = useState(false);
  // SMS test — kendi numarana gerçek gönderim (Netgsm kurulumunu doğrular)
  const [testPhone, setTestPhone] = useState('0554 195 18 54');
  const [testMsg, setTestMsg] = useState('Calmie test mesajı — SMS kurulumu çalışıyor. ✓');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const sendTestSms = async () => {
    if (testing || !testPhone.trim() || !testMsg.trim()) return;
    setTesting(true); setTestResult(null);
    try {
      const r = await fetch('/api/sms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone.trim(), name: 'Test', message: testMsg.trim(), trigger_type: 'manual' }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.ok) setTestResult({ ok: true, text: 'Gönderildi ✓' + (d.jobid ? ` · jobid ${d.jobid}` : '') });
      else setTestResult({ ok: false, text: d.error || 'Gönderilemedi' });
    } catch {
      setTestResult({ ok: false, text: 'Ağ hatası — sunucuya ulaşılamadı' });
    } finally { setTesting(false); }
  };
  const [syncing, setSyncing] = useState(false);
  const [syncTxt, setSyncTxt] = useState('güncel');
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLElement>(null);

  // ── Tema (Ana Sayfa ile paylaşılır) ──
  const [theme, setTheme] = useState<string>(() => lsGet('calmie_home_bgtheme') || 'default');
  const [themePreview, setThemePreview] = useState<string | null>(null);
  const effTheme = themePreview ?? theme;
  const commitTheme = (v: string) => { setTheme(v); setThemePreview(null); try { localStorage.setItem('calmie_home_bgtheme', v); } catch {} };

  // ── Dock glider ──
  const dockRef = useRef<HTMLElement>(null);
  const gliderRef = useRef<HTMLSpanElement>(null);
  const activeLink = () => (dockRef.current?.querySelector('a.active') || dockRef.current?.querySelector('a')) as HTMLElement | null;
  const moveGlider = (a: HTMLElement | null, instant = false) => {
    const g = gliderRef.current; if (!g || !a) return;
    if (instant) g.style.transition = 'none';
    g.style.width = a.offsetWidth + 'px';
    g.style.transform = `translateX(${a.offsetLeft}px)`;
    g.classList.add('on');
    dockRef.current?.querySelectorAll('a').forEach((l) => l.classList.toggle('lit', l === a));
    if (instant) { void g.offsetWidth; g.style.transition = ''; }
  };
  useEffect(() => {
    moveGlider(activeLink(), true);
    const onR = () => moveGlider(activeLink(), true);
    window.addEventListener('resize', onR);
    (document as any).fonts?.ready?.then(() => moveGlider(activeLink(), true));
    return () => window.removeEventListener('resize', onR);
  }, [mounted]);

  // ── Toast ──
  const showToast = (m: string) => { setToast(m); window.clearTimeout((showToast as any)._t); (showToast as any)._t = window.setTimeout(() => setToast(null), 2200); };

  // ── Seansı iptal/erteleme alanına sürükleme ──
  const cancelZoneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [cancelPrompt, setCancelPrompt] = useState<{ name: string; date: string; start: number; uid?: string | null } | null>(null);
  // ── Tut-bırak (POINTER tabanlı — HTML5 DnD güvenilmez olduğu için) ──
  const wkBodyRef = useRef<HTMLDivElement>(null);
  const pdragRef = useRef<{ appt: Appt; startX: number; startY: number; moved: boolean } | null>(null);
  const suppressColClick = useRef(false);
  const [pdrag, setPdrag] = useState<{ id: string; name: string; x: number; y: number; label: string } | null>(null);
  // ── Hafta gezinme: yatay kaydırma (boş ızgarada sürükle) + trackpad yatay tekerlek ──
  const swipeRef = useRef<{ startX: number; startY: number; active: boolean } | null>(null);
  const wheelAccum = useRef(0);
  const wheelCD = useRef(false);
  const [slideDir, setSlideDir] = useState(0);   // -1/0/1 → kaydırma animasyonu yönü
  const confirmCancel = async (mode: 'iptal' | 'ertelendi') => {
    if (!cancelPrompt) return;
    const cp = cancelPrompt;
    setCancelPrompt(null);
    onCancelSession?.(cp.name, mode, cp.date);
    // İptal → macOS Takvim'den de sil (erteleme ise olay yerinde kalır, kullanıcı taşır)
    if (mode === 'iptal' && cp.uid) {
      const ok = await onDeleteEvent?.(cp.uid, cp.name);
      showToast(ok ? `${cp.name} · seans iptal edildi ve takvimden silindi` : `${cp.name} · dosyada iptal işaretlendi (takvimden silinemedi)`);
    } else {
      showToast(`${cp.name} · seans ${mode === 'iptal' ? 'iptal edildi' : 'ertelendi'} olarak işaretlendi`);
    }
  };

  // ── Bu hafta (Pzt→Paz) · sabit, .trv pane'leri için ──
  const week = useMemo(() => {
    const dow = (now.getDay() + 6) % 7;
    const monday = new Date(now); monday.setHours(0, 0, 0, 0); monday.setDate(now.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      const iso = isoOf(d);
      return { name: DAY_NAMES[i], num: d.getDate(), date: iso, today: iso === todayISO };
    });
  }, [now, todayISO]);
  const baseMonday = useMemo(() => { const dow = (now.getDay() + 6) % 7; const m = new Date(now); m.setHours(0, 0, 0, 0); m.setDate(now.getDate() - dow); return m; }, [now]);

  // ── Navigasyonlu takvim haftası (weekOff) ──
  const calWeek = useMemo(() => {
    const mon = new Date(baseMonday); mon.setDate(mon.getDate() + weekOff * 7);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); const iso = isoOf(d); return { name: DAY_NAMES[i], num: d.getDate(), date: iso, today: iso === todayISO, weekend: i >= 5 }; });
  }, [baseMonday, weekOff, todayISO]);
  const calDayDate = useMemo(() => { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + dayOff); return isoOf(d); }, [now, dayOff]);

  // ── Tüm randevular (enriched) ──
  const ALL = useMemo(() => {
    const raw = Array.isArray(events) ? events : [];
    return raw.filter((e) => e?.title && e?.start).map((e) => {
      const name = e.title.trim();
      const date = e.start.slice(0, 10);
      const start = minutesOfISO(e.start);
      const end = e.end && e.end.length >= 16 ? minutesOfISO(e.end) : start + 50;
      const c = resolveClient?.(name);
      const matched = !!(c && c.id);
      return {
        id: e.id, uid: e.uid ?? null, name, date, start, end: end > start ? end : start + 50,
        startISO: e.start, matched, topic: c?.topic ?? null,
        fileHref: c?.fileHref ?? (c?.id ? `/profil/${c.id}` : null),
        phone: c?.phone ?? null, reviewed: !!c?.reviewed, tone: toneFor(name),
        fee: c?.fee != null ? Number(c.fee) : null,
      };
    });
  }, [events, resolveClient]);
  type Appt = (typeof ALL)[number];

  const todayAppts = useMemo(() => ALL.filter((a) => a.date === todayISO).sort((x, y) => x.start - y.start), [ALL, todayISO]);
  const nextAppt = useMemo(() => todayAppts.find((a) => a.start >= nowMinutes) ?? null, [todayAppts, nowMinutes]);
  // Çakışma: görüntülenen haftanın TÜM günleri taranır; en erken gündeki ilk <10 dk ara döner.
  const conflict = useMemo(() => {
    for (const d of week) {
      const dayAppts = ALL.filter((a) => a.date === d.date).sort((x, y) => x.start - y.start);
      for (let i = 1; i < dayAppts.length; i++) {
        const gap = dayAppts[i].start - dayAppts[i - 1].end;
        if (gap < 10) {
          const mo = MONTHS[Number(d.date.slice(5, 7)) - 1];
          const prev = dayAppts[i - 1], next = dayAppts[i];
          // Üst üste binen (stacked) aralık: [geç başlayan, erken biten]. gap<0 ise gerçek çakışma.
          const overlapStart = Math.max(prev.start, next.start);
          const overlapEnd = Math.min(prev.end, next.end);
          return { prev, next, gap, dayLabel: `${d.name} · ${d.num} ${mo}`, isToday: !!d.today, overlapStart, overlapEnd };
        }
      }
    }
    return null;
  }, [ALL, week]);
  const weekHasAppts = useMemo(() => week.some((d) => ALL.some((a) => a.date === d.date)), [week, ALL]);

  const history = useMemo(() => {
    const nowISO = `${todayISO}T${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    return ALL.filter((a) => a.startISO < nowISO).sort((x, y) => y.startISO.localeCompare(x.startISO)).slice(0, 40);
  }, [ALL, todayISO, now]);

  const dev = useMemo(() => {
    const g = gelisimEvents ?? [];
    if (!g.length) return null;
    const toItem = (x: GelisimEv) => ({ date: x.date, kind: 'Etkinlik', title: x.title, meta: `${x.time} · ${x.durationMin} dk`, progress: 0 });
    return { upcoming: g.filter((x) => !x.done).map(toItem), completed: g.filter((x) => x.done).map(toItem) };
  }, [gelisimEvents]);

  // ── Seans durumu (yalnız bugünün blokları) ──
  const statusOf = (a: Appt): 'past' | 'now' | 'next' | 'upcoming' | '' => {
    if (a.date !== todayISO || !mounted) return '';
    if (a.end <= nowMinutes) return 'past';
    if (a.start <= nowMinutes && nowMinutes < a.end) return 'now';
    if (nextAppt && a.id === nextAppt.id) return 'next';
    return 'upcoming';
  };

  // ── Yoğunluk (hafta/ay/yıl) ──
  const ymd = (iso: string) => iso;
  const density = useMemo(() => {
    const countOn = (iso: string) => ALL.filter((a) => a.date === iso).length;
    // hafta
    const haftaCounts = week.map((d) => countOn(d.date));
    const todayIdx = week.findIndex((d) => d.today);
    // ay — mevcut ayın haftalık kovaları
    const y = now.getFullYear(), mo = now.getMonth();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const ayBuckets: number[] = [0, 0, 0, 0, 0];
    for (let dd = 1; dd <= daysInMonth; dd++) { const iso = `${y}-${pad2(mo + 1)}-${pad2(dd)}`; const b = Math.min(4, Math.floor((dd - 1) / 7)); ayBuckets[b] += countOn(iso); }
    const ayActive = Math.min(4, Math.floor((now.getDate() - 1) / 7));
    // yıl — 12 ay
    const yilCounts = Array.from({ length: 12 }, (_, m) => ALL.filter((a) => a.date.slice(0, 7) === `${y}-${pad2(m + 1)}`).length);
    return {
      hafta: { word: 'hafta', unit: 'bu hafta', labels: DAY_NAMES, counts: haftaCounts, active: todayIdx < 0 ? 0 : todayIdx },
      ay: { word: 'ay', unit: 'bu ay', labels: ['1.H', '2.H', '3.H', '4.H', '5.H'], counts: ayBuckets, active: ayActive },
      yil: { word: 'yıl', unit: 'bu yıl', labels: MONTHS, counts: yilCounts, active: now.getMonth() },
    };
  }, [ALL, week, now]);

  // ── Tahmini kazanç (hafta + ay) ──
  const earn = useMemo(() => {
    const tl = (n: number) => `₺${Math.round(n).toLocaleString('tr-TR')}`;
    const calc = (appts: Appt[]) => {
      const feeAppts = appts.filter((a) => a.fee != null);
      const feeCount = feeAppts.length;
      const sum = feeAppts.reduce((s, a) => s + (a.fee as number), 0);
      return { total: tl(sum), avg: tl(feeCount ? Math.round(sum / feeCount) : 0), paid: feeCount, free: appts.length - feeCount, has: feeCount > 0 };
    };
    const weekDates = new Set(week.map((d) => d.date));
    const ym = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    const yy = String(now.getFullYear());
    return {
      hafta: calc(ALL.filter((a) => weekDates.has(a.date))),
      ay: calc(ALL.filter((a) => a.date.slice(0, 7) === ym)),
      yil: calc(ALL.filter((a) => a.date.slice(0, 4) === yy)),
    };
  }, [ALL, week, now]);
  const weekBlocks = (availability?.bloklar ?? []).filter((b: any) => week.some((d) => d.date === b.tarih)).length;

  // ── Watch (saat kartı) ──
  const watch = useMemo(() => ({
    day: DAY_ABBR[now.getDay()],
    date: `${now.getDate()} ${MONTHS[now.getMonth()].toLowerCase()}`,
    time: mounted ? `${pad2(now.getHours())}:${pad2(now.getMinutes())}` : '—',
  }), [now, mounted]);

  // ── Aralık etiketi ──
  const rangeLabel = useMemo(() => {
    if (calView === 'gun') { const d = new Date(calDayDate + 'T12:00:00'); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
    if (calView === 'ay') { const d = new Date(now.getFullYear(), now.getMonth() + monthOff, 1); return `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`; }
    const a = calWeek[0], b = calWeek[6]; const bm = new Date(b.date + 'T12:00:00');
    return `${a.num} – ${b.num} ${MONTHS[bm.getMonth()]} ${bm.getFullYear()}`;
  }, [calView, calWeek, calDayDate, monthOff, now]);
  const todayLabel = `${now.getDate()} ${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()} · ${['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][now.getDay()]}`;

  const goTab = (t: SubTab) => { setSubTab(t); if (scrollRef.current) scrollRef.current.scrollTop = 0; };
  const navTo = (d: number) => {
    if (d !== 0) { setSlideDir(d); window.clearTimeout((navTo as any)._t); (navTo as any)._t = window.setTimeout(() => setSlideDir(0), 280); }
    if (d === 0) { setWeekOff(0); setDayOff(0); setMonthOff(0); } else if (calView === 'ay') setMonthOff((v) => v + d); else if (calView === 'gun') setDayOff((v) => v + d); else setWeekOff((v) => v + d);
  };
  // Boş ızgarada yatay sürükle → hafta/gün/ay gezinme (olay üzerinde başlarsa karışma)
  const gridDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.ev')) return;   // olay sürüklemesi ayrı (evDown)
    swipeRef.current = { startX: e.clientX, startY: e.clientY, active: false };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* yoksay */ }
  };
  const gridMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = swipeRef.current; if (!s) return;
    const dx = e.clientX - s.startX, dy = e.clientY - s.startY;
    if (!s.active && Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.3) s.active = true;
  };
  const gridUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = swipeRef.current; swipeRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* yoksay */ }
    if (!s || !s.active) return;
    const dx = e.clientX - s.startX;
    if (Math.abs(dx) > 55) { suppressColClick.current = true; navTo(dx > 0 ? -1 : 1); }   // sağa çek=önceki, sola çek=sonraki
  };
  // Trackpad iki-parmak yatay kaydırma → hafta gezinme
  const gridWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) + 2) return;   // dikey scroll'a dokunma
    if (wheelCD.current) return;
    wheelAccum.current += e.deltaX;
    if (Math.abs(wheelAccum.current) > 90) {
      navTo(wheelAccum.current > 0 ? 1 : -1);   // sağa kaydır=sonraki, sola=önceki
      wheelAccum.current = 0; wheelCD.current = true;
      window.setTimeout(() => { wheelCD.current = false; }, 420);
    }
  };
  const open = (a: Appt) => { onOpenClient?.(a.name); };

  // ── Randevu düzenleme (macOS Takvim'e yazar) ──
  const [editAppt, setEditAppt] = useState<Appt | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; tarih: string; saat: string; sure: number }>({ title: '', tarih: '', saat: '', sure: 50 });
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState('');

  const openEdit = (a: Appt) => {
    setEditAppt(a);
    setEditForm({ title: a.name, tarih: a.date, saat: hhmm(a.start), sure: Math.max(5, a.end - a.start) });
    setEditErr('');
  };
  const saveEdit = async () => {
    if (!editAppt) return;
    if (!editAppt.uid) { setEditErr('Bu randevunun takvim kimliği yok — önce "Senkronize et" ile yenile.'); return; }
    if (!editForm.tarih || !editForm.saat) { setEditErr('Tarih ve saat gerekli.'); return; }
    setEditBusy(true); setEditErr('');
    const ok = await onUpdateEvent?.({ uid: editAppt.uid, tarih: editForm.tarih, saat: editForm.saat, sure: Number(editForm.sure) || 50, title: (editForm.title || '').trim() || undefined });
    setEditBusy(false);
    if (ok) { setEditAppt(null); showToast('Randevu güncellendi'); }
    else setEditErr('macOS Takvim güncellenemedi (Takvim uygulaması/izin gerekli).');
  };
  const deleteEdit = async () => {
    if (!editAppt) return;
    if (!editAppt.uid) { setEditErr('Bu randevunun takvim kimliği yok — önce senkronu yenile.'); return; }
    if (typeof window !== 'undefined' && !window.confirm(`"${editAppt.name}" randevusu macOS Takvim'den silinsin mi?`)) return;
    setEditBusy(true); setEditErr('');
    const ok = await onDeleteEvent?.(editAppt.uid, editAppt.name);
    setEditBusy(false);
    if (ok) { setEditAppt(null); showToast('Randevu silindi'); }
    else setEditErr('macOS Takvim\'den silinemedi.');
  };
  // Boş hücreye tıkla → yeni randevu (sürükleme sonrası gelen tıkı yut)
  const colCreate = (date: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressColClick.current) { suppressColClick.current = false; return; }
    const rect = e.currentTarget.getBoundingClientRect();
    let mins = HSTART + Math.round((((e.clientY - rect.top) / HPX) * 60) / 30) * 30;
    mins = Math.max(HSTART, Math.min(HEND - 30, mins));
    onNewAppointment?.({ tarih: date, saat: hhmm(mins) });
  };

  // ── POINTER tut-bırak: olayı tut → hafta ızgarasında yeni gün/saate taşı (modal onayı) ──
  const AXIS_W = 64;
  const dropFromXY = (clientX: number, clientY: number): { date: string; mins: number; label: string } | null => {
    const body = wkBodyRef.current; if (!body) return null;
    const r = body.getBoundingClientRect();
    const colW = (r.width - AXIS_W) / 7;
    let idx = Math.floor((clientX - r.left - AXIS_W) / colW);
    idx = Math.max(0, Math.min(6, idx));
    const wd: any = calWeek[idx]; if (!wd) return null;
    let mins = HSTART + Math.round((((clientY - r.top) / HPX) * 60) / 15) * 15;
    mins = Math.max(HSTART, Math.min(HEND - 15, mins));
    return { date: wd.date, mins, label: `${String(wd.name || '').toLowerCase()} ${pad2(wd.num)} · ${hhmm(mins)}` };
  };
  const inCancelZone = (clientY: number) => { const z = cancelZoneRef.current; if (!z) return false; const zr = z.getBoundingClientRect(); return clientY >= zr.top && clientY <= zr.bottom + 40; };
  const evDown = (a: Appt, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;   // sağ tık hariç; dokunma/kalem serbest
    pdragRef.current = { appt: a, startX: e.clientX, startY: e.clientY, moved: false };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* yoksay */ }
  };
  const evMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = pdragRef.current; if (!st) return;
    if (!st.moved && Math.hypot(e.clientX - st.startX, e.clientY - st.startY) > 5) { st.moved = true; setDragging(true); }
    if (!st.moved) return;
    const cancel = inCancelZone(e.clientY);
    const d = cancel ? null : dropFromXY(e.clientX, e.clientY);
    setPdrag({ id: st.appt.id, name: st.appt.name, x: e.clientX, y: e.clientY, label: cancel ? 'İptal / erteleme alanı' : (d ? d.label : '') });
  };
  const evUp = (a: Appt, e: React.PointerEvent<HTMLDivElement>) => {
    const st = pdragRef.current; pdragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* yoksay */ }
    setPdrag(null); setDragging(false);
    suppressColClick.current = true;   // ardından gelebilecek kolon tıkını yut
    if (!st) return;
    if (!st.moved) { openEdit(a); return; }                 // hareketsiz = tıklama → düzenle modalı
    if (inCancelZone(e.clientY)) { setCancelPrompt({ name: a.name, date: a.date, start: a.start, uid: a.uid ?? null }); return; }
    const d = dropFromXY(e.clientX, e.clientY);
    if (!d || (d.date === a.date && d.mins === a.start)) return;   // hedef yok ya da aynı yer
    setEditAppt(a);
    setEditForm({ title: a.name, tarih: d.date, saat: hhmm(d.mins), sure: Math.max(5, a.end - a.start) });
    setEditErr('');
  };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true); setSyncTxt('senkron…');
    try { await onManualSync?.(); } finally {
      setSyncing(false); setSyncTxt('güncel'); showToast('macOS Takvim ile senkronize edildi');
    }
  };

  const TABS: { key: SubTab; label: string; cnt?: number }[] = [
    { key: 'takvim', label: 'Takvim', cnt: todayAppts.length },
    { key: 'hazirlik', label: 'Seansa Hazırlık', cnt: todayAppts.length },
    { key: 'musaitlik', label: 'Müsaitlik' },
    { key: 'gecmis', label: 'Geçmiş' },
    { key: 'takip', label: 'Takip' },
    // SMS, Gelişim Planı ve Web Sitesi sekmeleri Çalışma Alanı kutularına taşındı; artık oradan yönetilir.
  ];

  // ── Takvim seans bloğu (.ev) ──
  const EvBlock = ({ a, today }: { a: Appt; today: boolean }) => {
    const st = today ? statusOf(a) : '';
    const top = (a.start - HSTART) / 60 * HPX, h = (a.end - a.start) / 60 * HPX;
    let tag: React.ReactNode = null;
    if (!a.matched) tag = <span className="ev-tag"><span className="nomatch" />eşleşme yok</span>;
    else if (a.reviewed) tag = <span className="ev-tag"><span className="seen">✓</span> incelendi</span>;
    else if (st === 'next') tag = <span className="ev-tag">sıradaki</span>;
    return (
      <div className={`ev ${st === 'next' ? 'next' : ''} ${st === 'past' ? 'past' : ''}${pdrag?.id === a.id ? ' dragging' : ''}`}
        style={{ ...toneVars(a.name), top, height: h, touchAction: 'none' }}
        onPointerDown={(e) => evDown(a, e)}
        onPointerMove={evMove}
        onPointerUp={(e) => evUp(a, e)}>
        <div className="ev-n">{a.name}</div>
        <div className="ev-t">{hhmm(a.start)}–{hhmm(a.end)}</div>
        {h > 54 ? tag : null}
      </div>
    );
  };

  const hoursAxis: number[] = []; for (let m = HSTART; m <= HEND; m += 60) hoursAxis.push(m);
  const bodyH = (HEND - HSTART) / 60 * HPX;
  const nowTop = (nowMinutes - HSTART) / 60 * HPX;
  const dzTop = (DROP_FROM - HSTART) / 60 * HPX, dzH = (HEND - DROP_FROM) / 60 * HPX;

  const WeekView = () => (
    <div className={`wk${slideDir > 0 ? ' sl-next' : slideDir < 0 ? ' sl-prev' : ''}`} onWheel={gridWheel}>
      <button type="button" className="wk-arrow l" onClick={() => navTo(-1)} aria-label="Önceki hafta" title="Önceki hafta">
        <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg></button>
      <button type="button" className="wk-arrow r" onClick={() => navTo(1)} aria-label="Sonraki hafta" title="Sonraki hafta">
        <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg></button>
      <div className="wk-head">
        <div className="corner" />
        {calWeek.map((d) => (
          <div key={d.date} className={`wk-hd${d.today ? ' today has-watch' : ''}${d.weekend ? ' weekend' : ''}`}>
            {d.today ? (
              <button type="button" className={`wk-watch${syncing ? ' syncing' : ''}`} onClick={handleSync} aria-label="Bugün — senkronize et" title="Bugün · senkronize et">
                <span className="ww-tex" aria-hidden="true" />
                <span className="ww-time">{watch.time}</span>
                <span className="ww-date">{watch.day} · {watch.date}</span>
                <span className="ww-status"><span className="dot" />{syncTxt}</span>
              </button>
            ) : (
              <><div className="n">{pad2(d.num)}</div><div className="d">{d.name.toLowerCase()}</div><div className="tick" /></>
            )}
          </div>
        ))}
      </div>
      <div className="wk-body" ref={wkBodyRef} style={{ height: bodyH, ['--hpx' as any]: `${HPX}px`, touchAction: 'pan-y' }}
        onPointerDown={gridDown} onPointerMove={gridMove} onPointerUp={gridUp}>
        <div className="wk-axis">{hoursAxis.map((m) => <div key={m} className="hr"><span>{hhmm(m)}</span></div>)}</div>
        {calWeek.map((d) => (
          <div key={d.date} className={`wk-col${d.today ? ' today' : ''}${d.weekend ? ' weekend' : ''}`}
            onClick={(e) => colCreate(d.date, e)}>
            {ALL.filter((a) => a.date === d.date).map((a) => <EvBlock key={a.id} a={a} today={d.today} />)}
          </div>
        ))}
        <div ref={cancelZoneRef} className={`drop-zone${dragging ? ' hot' : ''}`} style={{ top: dzTop, height: dzH }}>
          <div className="dz-in">İptal / erteleme alanı · 20:00 sonrası<br />seansı buraya bırak</div>
        </div>
        {weekOff === 0 && mounted && nowMinutes >= HSTART && nowMinutes <= HEND && (
          <div className="now-line" style={{ top: nowTop }}><span className="lbl">{hhmm(nowMinutes)}</span></div>
        )}
      </div>
    </div>
  );

  const DayView = () => {
    const evs = ALL.filter((a) => a.date === calDayDate).sort((x, y) => x.start - y.start);
    const isToday = calDayDate === todayISO;
    if (!evs.length) return <div className="card"><div className="empty">Bugün için randevu yok.<div className="e-sub">macOS Takvim'de bu güne ait etkinlik bulunamadı.</div></div></div>;
    let nowDrawn = false;
    return (
      <div className="day-list">
        {evs.map((a) => {
          const st = isToday ? statusOf(a) : '';
          const sep = isToday && !nowDrawn && a.start > nowMinutes;
          if (sep) nowDrawn = true;
          return (
            <div key={a.id}>
              {sep && <div className="now-sep"><span className="lb">şimdi · {hhmm(nowMinutes)}</span><span className="ln" /></div>}
              <div className={`day-ev${st === 'past' ? ' past' : ''}`} style={toneVars(a.name)}
                onClick={() => openEdit(a)}>
                <div className="dt">{hhmm(a.start)}<small>{hhmm(a.end)}</small></div>
                <div>
                  <div className="dn">{a.name}{st === 'now' ? <span style={{ color: 'var(--now)', fontSize: 12 }}> · şimdi</span> : st === 'next' ? <span style={{ color: 'var(--now)', fontSize: 12 }}> · sıradaki</span> : null}</div>
                  <div className="dtopic">{a.matched ? a.topic : 'Yalnızca takvim adı ve saati biliniyor.'}</div>
                  <div className="dmeta">{a.matched ? <><span className="chip ok">dosya eşleşti</span>{a.reviewed && <span className="chip ok">incelendi</span>}</> : <span className="chip no">eşleşme yok</span>}</div>
                </div>
                <div className="po-go" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-mute)' }}>{a.matched ? 'Dosyayı aç →' : 'Eşleştir →'}</div>
              </div>
            </div>
          );
        })}
        {isToday && !nowDrawn && <div className="now-sep"><span className="ln" /><span className="lb">şimdi · {hhmm(nowMinutes)} · günün seansları bitti</span></div>}
      </div>
    );
  };

  const MonthView = () => {
    const dt = new Date(now.getFullYear(), now.getMonth() + monthOff, 1);
    const y = dt.getFullYear(), mo = dt.getMonth();
    const startDow = (new Date(y, mo, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const total = Math.ceil((startDow + daysInMonth) / 7) * 7;
    const byDate: Record<string, Appt[]> = {};
    ALL.forEach((a) => { (byDate[a.date] = byDate[a.date] || []).push(a); });
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < total; i++) {
      const dnum = i - startDow + 1; const col = i % 7;
      if (dnum < 1 || dnum > daysInMonth) { cells.push(<div key={i} className={`mo-cell dim${col >= 5 ? ' weekend' : ''}`} />); continue; }
      const iso = `${y}-${pad2(mo + 1)}-${pad2(dnum)}`;
      const list = (byDate[iso] || []).slice().sort((a, b) => a.start - b.start);
      cells.push(
        <div key={i} className={`mo-cell${iso === todayISO ? ' today' : ''}${col >= 5 ? ' weekend' : ''}`}>
          <span className="dnum">{dnum}</span>
          {list.slice(0, 3).map((a) => <div key={a.id} className="mo-ev" style={toneVars(a.name)} onClick={() => openEdit(a)}><span className="mo-dot" /><span className="mo-tm">{hhmm(a.start)}</span> {a.name.split(' ')[0]}</div>)}
          {list.length > 3 && <div className="mo-more">+{list.length - 3} daha</div>}
        </div>,
      );
    }
    return <div className="mo"><div className="mo-head">{DAY_NAMES.map((d) => <div key={d}>{d}</div>)}</div><div className="mo-grid">{cells}</div></div>;
  };

  // ── Yoğunluk widget'ı ──
  const YogWidget = () => {
    const S = density[statPeriod];
    const total = S.counts.reduce((a, b) => a + b, 0);
    const max = Math.max(...S.counts, 1);
    return (
      <div className="card card-pad" id="yogCard">
        <div className="yog-q">Bu {S.word} ne kadar yoğunsun?</div>
        <div className="yog-seg">
          {(['hafta', 'ay', 'yil'] as StatPeriod[]).map((k) => <button key={k} type="button" className={statPeriod === k ? 'on' : ''} onClick={() => setStatPeriod(k)}>{k === 'hafta' ? 'Hafta' : k === 'ay' ? 'Ay' : 'Yıl'}</button>)}
        </div>
        <div className="yog-big"><span className="n">{total} seans</span><span className="u">· {S.unit}</span></div>
        <div className={`yog-bars${statPeriod === 'yil' ? ' dense' : ''}`}>
          {S.counts.map((n, i) => (
            <div key={i} className={`yb${i === S.active ? ' on' : ''}`}>
              <span className="yb-n">{n}</span>
              <span className="yb-col" style={{ height: Math.round(16 + (n / max) * 108) }} />
              <span className="yb-d">{S.labels[i]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Rail = () => (
    <div className="rail">
      <YogWidget />
      <div className="dark-box card-pad">
        <span className="card-eye" style={{ color: 'rgba(244,242,238,.6)' }}>tahmini kazanç</span>
        <div className="earn-seg">
          {(['hafta', 'ay', 'yil'] as StatPeriod[]).map((k) => (
            <button key={k} type="button" className={earnPeriod === k ? 'on' : ''} onClick={() => setEarnPeriod(k)}>{k === 'hafta' ? 'Hafta' : k === 'ay' ? 'Ay' : 'Yıl'}</button>
          ))}
        </div>
        {(() => {
          const E = earn[earnPeriod];
          const unit = earnPeriod === 'hafta' ? 'bu hafta' : earnPeriod === 'ay' ? 'bu ay' : 'bu yıl';
          return E.has ? (
            <>
              <div className="earn-num">{E.total}</div>
              <div className="earn-sub"><div><b>{E.avg}</b>ort. / seans</div><div><b>{E.paid}</b>ücretli seans · {unit}</div></div>
              {E.free > 0 && <div className="earn-note">{E.free} fiyatsız seans hesaba katılmadı ({unit}).</div>}
              {missingFeeCount > 0 && (
                <div className="earn-warn" id="earnWarn" onClick={() => (onEditMissingFees ? onEditMissingFees() : showToast('Fiyat bilgisi eksik danışanlar listeleniyor…'))}>
                  <svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                  <span>{missingFeeCount} danışanın fiyat bilgisi girilmemiştir. Düzenleyin.</span>
                </div>
              )}
            </>
          ) : (
            <p className="earn-note" style={{ marginTop: 10 }}>{unit} için fiyatlı seans yok — danışan dosyasındaki “seans ücreti” doldurulunca burada hesaplanır.</p>
          );
        })()}
      </div>
      {conflict ? (
        <div className="vcard" role="group" aria-label="Çakışma uyarısı kartı">
          <span className="vc-tex" aria-hidden="true" /><span className="vc-glare" aria-hidden="true" /><span className="vc-bang" aria-hidden="true">!</span>
          <div className="vc-body">
            <div className="vc-top"><span className="vc-brand">Çakışan seans saatleri</span><span className="vc-day">{conflict.isToday ? 'bugün' : conflict.dayLabel}</span></div>
            <div className="vc-mid"><span className="vc-lbl">{conflict.gap < 0 ? 'üst üste binen saat' : 'çakışan aralık'}</span><div className="vc-num"><span>{hhmm(conflict.gap < 0 ? conflict.overlapStart : conflict.prev.start)}</span><i>—</i><span>{hhmm(conflict.gap < 0 ? conflict.overlapEnd : conflict.next.end)}</span></div></div>
            <div className="vc-holder"><span className="vc-lbl">çakışan seanslar</span>
              <div className="vc-rows">
                <div className="vc-row"><span className="vc-rn">{conflict.prev.name}</span><span className="vc-rt">{hhmm(conflict.prev.start)}<i>–</i>{hhmm(conflict.prev.end)}</span></div>
                <div className="vc-row"><span className="vc-rn">{conflict.next.name}</span><span className="vc-rt">{hhmm(conflict.next.start)}<i>–</i>{hhmm(conflict.next.end)}</span></div>
              </div>
            </div>
            <div className="vc-foot">
              <div><span className="vc-lbl">hazırlık payı</span><div className="vc-val">{Math.max(0, conflict.gap)} DK</div></div>
              <div><span className="vc-lbl">durum</span><div className="vc-val">{conflict.gap < 0 ? 'ÇAKIŞMA' : 'YETERSİZ'}</div></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card card-pad" role="group" aria-label="Çakışma durumu">
          <div className="card-head"><span className="card-eye">çakışma kontrolü</span></div>
          <div className="vc-ok">
            <span className="vc-ok-tick" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <div>
              <div className="vc-ok-title">Çakışma yok</div>
              <p className="vc-ok-sub">{
                weekHasAppts
                  ? 'Bu haftaki seanslar arasında yeterli hazırlık payı var.'
                  : 'Bu hafta için planlı seans bulunmuyor.'
              }</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── SMS ──
  // Taslak mesaj — düzenlenebilir, localStorage'da kalıcı; {isim}/{saat} gönderirken doldurulur.
  const [draftMsg, setDraftMsg] = useState<string>(() => lsGet('calmie_sms_draft') || SMS_TEMPLATES[1].body);
  const saveDraft = (v: string) => { setDraftMsg(v); try { localStorage.setItem('calmie_sms_draft', v); } catch {} };
  const fillTpl = (a: Appt) => draftMsg.replace(/\{isim\}/g, a.name.split(' ')[0]).replace(/\{saat\}/g, hhmm(a.start));
  const toggleSms = (id: string) => setSmsSel((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  useEffect(() => { setSmsSel(new Set(todayAppts.filter((a) => a.matched && a.phone).map((a) => a.id))); setSmsSent(false); setSentIds(new Set()); setFailedIds(new Map()); }, [todayAppts]);
  const smsSelCount = smsSel.size;

  // Toplu gönderim — seçili + eşleşmiş + telefonlu randevulara gerçek SMS (Netgsm)
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [failedIds, setFailedIds] = useState<Map<string, string>>(new Map());
  const sendBulk = async () => {
    if (sending) return;
    const targets = todayAppts.filter((a) => smsSel.has(a.id) && a.matched && !!a.phone && !sentIds.has(a.id));
    if (targets.length === 0) return;
    setSending(true);
    const ok = new Set(sentIds); const fail = new Map(failedIds);
    for (const a of targets) {
      try {
        const r = await fetch('/api/sms', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: a.phone, name: a.name, message: fillTpl(a), trigger_type: 'appointment_reminder' }),
        });
        const d = await r.json().catch(() => ({}));
        if (d.ok) { ok.add(a.id); fail.delete(a.id); } else { fail.set(a.id, d.error || 'Gönderilemedi'); }
      } catch { fail.set(a.id, 'Ağ hatası'); }
    }
    setSentIds(ok); setFailedIds(fail); setSmsSent(true); setSending(false);
    const okN = targets.filter((a) => ok.has(a.id)).length; const failN = targets.length - okN;
    showToast(failN === 0 ? `${okN} SMS gönderildi ✓` : `${okN} gönderildi · ${failN} başarısız`);
  };

  // ── Web Sitesi ──
  const [siteTemplate, setSiteTemplate] = useState<string | null>(() => lsGet('calmie_site_template'));
  const pickTemplate = (k: string) => { setSiteTemplate(k); try { localStorage.setItem('calmie_site_template', k); } catch {} };

  const initials = (s: string) => s.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const Empty = ({ t, s }: { t: string; s: string }) => (<div className="empty"><div className="e-mark">∅</div><div className="e-title">{t}</div><div className="e-sub">{s}</div></div>);
  const PanelHead = ({ title, sub }: { title: string; sub?: React.ReactNode }) => (<div className="panel-head"><div className="ph-l"><h1 className="ph-title">{title}</h1>{sub ? <p className="ph-sub">{sub}</p> : null}</div></div>);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap" rel="stylesheet" />

      <div className="tkv" data-bg={effTheme === 'default' ? undefined : effTheme}>
        {/* mesh zemin */}
        <div className="sk-bg" aria-hidden="true">
          <span className="sk-mesh" />
          <svg className="sk-lines" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="none" strokeLinecap="round">
              <path d="M-120,640 C260,520 520,468 800,372 1120,262 1360,214 1780,128" stroke="rgba(255,255,255,.28)" strokeWidth="3" />
              <path d="M-120,772 C300,648 580,556 880,470 1180,384 1420,318 1780,250" stroke="rgba(255,255,255,.18)" strokeWidth="5" />
              <path d="M-120,884 C340,760 640,672 940,584 1220,500 1460,432 1780,372" stroke="rgba(255,255,255,.12)" strokeWidth="8" />
            </g>
          </svg>
          <img className="sk-photo" src="/calmie-hero-default.jpg" alt="" />
          <img className="sk-cherry" src="/tema-cherry.jpg" alt="" /><span className="sk-cherry-scrim" />
          <img className="sk-fur" src="/tema-kurk.jpg" alt="" /><span className="sk-fur-scrim" />
          <span className="sk-tint" /><span className="sk-grade" /><span className="sk-crest" /><span className="sk-vignette" />
        </div>

        <div className="shell">
          {/* ÜST: temalı mesh şerit */}
          <header className="cal-head">
            <div className="topbar">
              <div className="brand"><span className="logo"><b>Calmie</b><i>.</i></span></div>
              <nav className="dock" aria-label="Bölümler" ref={dockRef} onMouseLeave={() => moveGlider(activeLink())}>
                <span className="dock-glider" ref={gliderRef} aria-hidden="true" />
                {DOCK.map((d) => (
                  <a key={d.target} href="#" className={d.active ? 'active' : ''} onMouseEnter={(e) => moveGlider(e.currentTarget)} onClick={(e) => { e.preventDefault(); if (!d.active) onNav?.(d.target); }}>{d.label}</a>
                ))}
              </nav>
              <div className="topbar-right">
                <div className="tb-prof">
                  <div className="nm-col">
                    <span className="pro-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.3L21 9l-4.8 4.3L17.6 22 12 18.4 6.4 22l1.4-8.7L3 9l6.4-.7z" /></svg>PRO</span>
                    <a className="nm" href="#" onClick={(e) => { e.preventDefault(); onNav?.('terapist'); }}>Göksel Akkaya</a>
                  </div>
                  <span className="av" aria-hidden="true" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#F4F2EE' }}>GA</span>
                </div>
              </div>
            </div>

            <div className="cal-hero">
              <div className="cal-hero-l">
                {onBack && (
                  <button type="button" className="cal-back" onClick={() => onBack()}>
                    <span aria-hidden="true">‹</span>Çalışma Alanı
                  </button>
                )}
                <span className="eyebrow">takvim · randevu merkezi</span>
                <h1>Takvim & <i>Randevular</i></h1>
              </div>
              <div className="cal-hero-r">
                {/* Saat kartı: hafta görünümünde bugün ekrandaysa, saat bugünün sütun başlığına taşınır (aşağıda). Diğer tüm durumlarda hero'da gösterilir (senkron butonu her yerde erişilebilir). */}
                {!(subTab === 'takvim' && calView === 'hafta' && calWeek.some((d) => d.today)) && (
                  <button type="button" className={`watch${syncing ? ' syncing' : ''}`} id="syncBtn" onClick={handleSync} aria-label="Senkronize et">
                    <span className="w-tex" aria-hidden="true" />
                    <span className="w-day">{watch.day}</span>
                    <span className="w-date">{watch.date}</span>
                    <span className="w-time">{watch.time}</span>
                    <span className="w-status"><span className="dot" />{syncTxt}</span>
                  </button>
                )}
                <button type="button" className="btn-new" onClick={() => (onNewAppointment ? onNewAppointment() : showToast('Yeni randevu formu açılıyor…'))}>Yeni randevu <span className="c"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></span></button>
              </div>
            </div>

            <nav className="cal-tabs" aria-label="Takvim bölümleri">
              {TABS.map((t) => (
                <button key={t.key} type="button" className={`tab${subTab === t.key ? ' on' : ''}`} onClick={() => goTab(t.key)}>
                  {t.label}{t.cnt != null && <span className="badge">{t.cnt}</span>}
                </button>
              ))}
            </nav>
          </header>

          {/* İÇERİK */}
          <main className="cal-scroll" id="calScroll" ref={scrollRef}>
            {subTab === 'takvim' ? (
              <section className="pane on" data-screen-label="Takvim">
                <div className="view-bar">
                  <div><span className="eyebrow" style={{ color: 'var(--hd-mute)' }}>takvim · macOS randevular</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div className="seg">
                      {(['hafta', 'gun', 'ay'] as CalView[]).map((k) => <button key={k} className={calView === k ? 'on' : ''} onClick={() => setCalView(k)}>{k === 'hafta' ? 'Hafta' : k === 'gun' ? 'Gün' : 'Ay'}</button>)}
                    </div>
                    <div className="wknav">
                      <button onClick={() => navTo(-1)} aria-label="Önceki"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg></button>
                      <button className="today-btn" onClick={() => navTo(0)}>Bugün</button>
                      <button onClick={() => navTo(1)} aria-label="Sonraki"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg></button>
                      <span className="wk-range num">{rangeLabel}</span>
                    </div>
                  </div>
                </div>
                <div className={calView !== 'ay' ? 'grid-2' : ''}>
                  {/* Fonksiyon olarak çağrılır (<WeekView/> DEĞİL): inline component her render'da
                      remount oluyordu → sürükleme sırasındaki setState .ev'yi yok edip pointer-capture'ı
                      düşürüyordu (tut-taşı çalışmıyordu). Fonksiyon çağrısı JSX'i parent ağacına gömer. */}
                  <div>{calView === 'hafta' ? WeekView() : calView === 'gun' ? DayView() : MonthView()}</div>
                  {calView !== 'ay' && Rail()}
                </div>
              </section>
            ) : (
              <div className="trv trv-pane">
                <main>
                  {/* 2 · SEANSA HAZIRLIK */}
                  {subTab === 'hazirlik' && (
                    todayAppts.length === 0 ? (
                      <div className="panel"><PanelHead title="Seansa Hazırlık" sub="Bugünün seanslarına hazırlan." /><Empty t="Bugün için randevu yok." s="Hazırlanacak seans bulunmuyor." /></div>
                    ) : (() => {
                      const n = nextAppt || todayAppts[0];
                      const eta = Math.max(0, n.start - nowMinutes);
                      const others = todayAppts.filter((a) => a.id !== n.id);
                      return (
                        <div className="panel" data-screen-label="Seansa Hazırlık">
                          <PanelHead title="Seansa Hazırlık" sub={<>Bugün <b>{todayAppts.length}</b> seans · sıradaki <b>{n.name}</b>.</>} />
                          <div className="prep-grid">
                            <div className="prep-next">
                              <div className="pn-top"><span className="pn-badge">{eta > 0 ? 'Sıradaki' : 'Şimdi'}</span><span className="pn-eta">{hhmm(n.start)} – {hhmm(n.end)}{eta > 0 ? ` · ${eta} dk sonra` : ''}</span></div>
                              <h2 className="pn-name">{n.name}</h2>
                              <div className="pn-meta"><span>{hhmm(n.start)}</span><span>{n.end - n.start} dk</span><span>{n.matched ? 'dosya eşleşti' : 'dosya eşleşmedi'}</span></div>
                              <div className="pn-topic"><span className="lbl">{n.matched ? 'Sunum sorunu' : 'Bilgi'}</span>{n.matched ? n.topic : 'Bu isim danışan kaydıyla eşleşmiyor — yalnızca takvim adı ve saati biliniyor.'}</div>
                              <div className="pn-cta">
                                {n.matched ? <button className="btn btn-primary" onClick={() => onPrepareSession?.(n.name)}>Hazırlığa geç →</button> : <button className="btn btn-primary" onClick={() => open(n)}>Danışan eşleştir</button>}
                                <button className="btn btn-ghost" onClick={() => onOpenInterventionSuggest?.()}>Müdahale kütüphanesinden öner</button>
                                {n.matched && <button className="btn btn-ghost" onClick={() => open(n)}>Dosyayı aç</button>}
                              </div>
                            </div>
                            <div>
                              <div className="pool-head"><span className="eyebrow">bugünün diğer seansları</span><span className="eyebrow">{others.length} seans</span></div>
                              <div className="pool">
                                {others.map((a) => {
                                  const past = a.end <= nowMinutes;
                                  return (
                                    <div key={a.id} className={`pcard ${past ? 'is-done' : ''}`} style={{ ['--ev-bg' as any]: a.tone.bg, ['--ev-ink' as any]: a.tone.ink, ['--ev-spine' as any]: a.tone.ink }} onClick={() => open(a)}>
                                      <div className="pc-time mono">{hhmm(a.start)}{past ? ' · tamamlandı' : ''}</div>
                                      <h3 className="pc-name">{a.name}</h3>
                                      <div className="pc-topic">{a.matched ? a.topic : <span className="nomatch">eşleşme yok</span>}</div>
                                      <div className="pc-foot">{a.matched && a.reviewed ? <span className="reviewed">incelendi</span> : <span />}<span className="pc-open">{a.matched ? 'Dosyayı aç →' : 'Listeye git →'}</span></div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {/* 3 · MÜSAİTLİK */}
                  {subTab === 'musaitlik' && (
                    <div className="panel" data-screen-label="Müsaitlik">
                      <PanelHead title="Müsaitlik" sub="Haftalık dolu/boş ısı ızgarası ve çalışma saatleri." />
                      <div className="avail-grid">
                        <div className="heat">
                          <table>
                            <thead><tr><th />{week.map((d) => <th key={d.date}>{d.name} {d.num}</th>)}</tr></thead>
                            <tbody>
                              {Array.from({ length: 9 }, (_, i) => 9 + i).map((hr) => (
                                <tr key={hr}>
                                  <td className="hr mono">{pad2(hr)}:00</td>
                                  {week.map((d) => {
                                    const off = d.name === 'Cmt' || d.name === 'Paz' || (d.name === 'Cum' && hr >= 16);
                                    if (off) return <td key={d.date}><div className="cell off" /></td>;
                                    const hm = (s: string) => (Number(s?.slice(0, 2)) || 0) * 60 + (Number(s?.slice(3, 5)) || 0);
                                    const blk = (availability?.bloklar ?? []).find((b: any) => b.tarih === d.date && hm(b.baslangic) <= hr * 60 && hm(b.bitis) > hr * 60);
                                    if (blk) return <td key={d.date}><div className={`cell blk blk-${blk.renk || 'musait_degil'}`} title={`${blockLabel(blk.renk)}${blk.aciklama ? ' — ' + blk.aciklama : ''}`} /></td>;
                                    const appt = ALL.find((a) => a.date === d.date && a.start < (hr + 1) * 60 && a.end > hr * 60);
                                    return <td key={d.date}>{appt ? <div className="cell busy" {...(d.today ? { 'data-today': '' } : {})} data-nm={appt.name.split(' ')[0]} /> : <div className="cell" />}</td>;
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="legend" style={{ marginTop: 14 }}>
                            <span className="lg"><i style={{ background: 'var(--clay)' }} />dolu</span>
                            <span className="lg"><i style={{ background: 'var(--now)' }} />bugün dolu</span>
                            <span className="lg"><i style={{ background: 'var(--paper-2)', boxShadow: 'inset 0 0 0 1px var(--line)' }} />boş</span>
                            <span className="lg"><i className="blk-kapali" />kapalı</span>
                            <span className="lg"><i className="blk-yemek" />yemek</span>
                            <span className="lg"><i className="blk-mola" />mola</span>
                            <span className="lg"><i className="blk-izin" />izin</span>
                            <span className="lg"><i className="blk-musait_degil" />müsait değil</span>
                          </div>
                        </div>
                        <div className="avail-side">
                          <div className="side-card">
                            <span className="eyebrow">bu hafta</span>
                            <div className="statline" style={{ marginTop: 12 }}>
                              <div className="stat"><div className="sv num">{ALL.filter((a) => week.some((d) => d.date === a.date)).length}</div><div className="sl">dolu slot</div></div>
                              <div className="stat"><div className="sv num">{week.reduce((acc, d) => { if (d.name === 'Cmt' || d.name === 'Paz') return acc; const span = d.name === 'Cum' ? 7 : 9; return acc + Math.max(0, span - ALL.filter((a) => a.date === d.date).length); }, 0)}</div><div className="sl">boş slot</div></div>
                            </div>
                          </div>
                          <div className="side-card">
                            <span className="eyebrow">çalışma saatleri</span>
                            <ul className="hours">{WORKING_HOURS.map((w) => <li key={w.d}><span className="hd">{w.d}</span><span className={`hv ${w.off ? 'off' : ''}`}>{w.v}</span></li>)}</ul>
                          </div>
                          <div className="side-card">
                            <span className="eyebrow">müsaitlik bloğu ekle</span>
                            <div className="blk-form">
                              <input type="date" value={blkForm.tarih} onChange={(e) => setBlkForm((s) => ({ ...s, tarih: e.target.value }))} />
                              <div className="blk-row">
                                <input type="time" value={blkForm.baslangic} onChange={(e) => setBlkForm((s) => ({ ...s, baslangic: e.target.value }))} />
                                <span>–</span>
                                <input type="time" value={blkForm.bitis} onChange={(e) => setBlkForm((s) => ({ ...s, bitis: e.target.value }))} />
                              </div>
                              <select value={blkForm.renk} onChange={(e) => setBlkForm((s) => ({ ...s, renk: e.target.value }))}>
                                {BLOCK_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                              </select>
                              <input type="text" placeholder="Not (ops.)" value={blkForm.aciklama} onChange={(e) => setBlkForm((s) => ({ ...s, aciklama: e.target.value }))} />
                              <button type="button" disabled={!blkForm.tarih} onClick={() => { onAddBlock?.({ tarih: blkForm.tarih, baslangic: blkForm.baslangic, bitis: blkForm.bitis, renk: blkForm.renk, aciklama: blkForm.aciklama || undefined }); setBlkForm((s) => ({ ...s, aciklama: '' })); }}>Blok ekle</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4 · GEÇMİŞ */}
                  {subTab === 'gecmis' && (() => {
                    const q = histQuery.trim().toLocaleLowerCase('tr-TR');
                    const shown = history.filter((h) => !q || h.name.toLocaleLowerCase('tr-TR').includes(q));
                    return (
                      <div className="panel" data-screen-label="Geçmiş">
                        <PanelHead title="Geçmiş" sub="Geçmiş randevular — isimle ara." />
                        <div className="search"><span className="ic">⌕</span><input type="text" placeholder="Danışan adı ara…" value={histQuery} onChange={(e) => setHistQuery(e.target.value)} /></div>
                        <div className="hist">
                          {shown.map((h) => {
                            const dd = new Date(h.startISO + ':00');
                            const dayName = DAY_NAMES[(dd.getDay() + 6) % 7];
                            return (
                              <div key={h.id} className="hrow" onClick={() => { if (h.matched) open(h); }}>
                                <div className="h-date mono"><span className="hd-day">{dayName} {pad2(dd.getDate())}</span>{h.date.slice(0, 7).replace('-', ' · ')} · {hhmm(h.start)}</div>
                                <div className="h-main"><div className="h-name">{h.name}</div>{h.matched ? <div className="h-topic">{h.topic}</div> : <div className="h-topic nm">eşleşme yok</div>}</div>
                                <div className="h-open">{h.matched ? 'dosya →' : 'liste →'}</div>
                              </div>
                            );
                          })}
                          {shown.length === 0 && <div className="no-results">Eşleşen randevu yok.</div>}
                          <div className="hist-stat">
                            <div className="stat"><div className="sv num">{history.length}</div><div className="sl">son 40 · seans</div></div>
                            <div className="stat"><div className="sv num">{new Set(history.map((h) => h.name)).size}</div><div className="sl">farklı danışan</div></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 5 · SMS */}
                  {subTab === 'sms' && (
                    <div className="panel" data-screen-label="SMS">
                      <PanelHead title="SMS Hatırlatma" sub="Bugünün randevularından otomatik hatırlatma listesi." />

                      {/* SMS testi — kendi numarana gerçek gönderim */}
                      <div className="sms-test">
                        <div className="st-head">
                          <span className="eyebrow">test · kendi numarana</span>
                          <span className="st-note">Netgsm kurulumunu doğrulamak için gerçek bir SMS gönderir.</span>
                        </div>
                        <div className="st-form">
                          <input className="st-phone" type="tel" inputMode="tel" placeholder="5XX XXX XX XX"
                            value={testPhone} onChange={(e) => setTestPhone(e.target.value)} aria-label="Test telefon numarası" />
                          <input className="st-msg" type="text" placeholder="Test mesajı"
                            value={testMsg} onChange={(e) => setTestMsg(e.target.value)} aria-label="Test mesajı" />
                          <button type="button" className="btn-primary st-send" disabled={testing || !testPhone.trim() || !testMsg.trim()} onClick={sendTestSms}>
                            {testing ? 'Gönderiliyor…' : 'Test gönder'}
                          </button>
                        </div>
                        {testResult && <div className={`st-result ${testResult.ok ? 'ok' : 'err'}`}>{testResult.text}</div>}
                      </div>

                      <div className="sms-grid">
                        <div className="sms-list">
                          <div className="sms-bar"><span className="lbl">Bugün · <span>{todayAppts.length} randevu, {todayAppts.filter((a) => a.matched && a.phone).length} gönderilebilir</span></span></div>
                          {todayAppts.length === 0 && <div style={{ padding: '30px 22px', color: 'var(--ink-mute)' }}>Bugün için randevu yok.</div>}
                          {todayAppts.map((a) => {
                            const can = a.matched && !!a.phone;
                            const on = smsSel.has(a.id);
                            return (
                              <div key={a.id} className={`smsrow ${can ? '' : 'off'}`}>
                                <div className={`chk ${on ? 'on' : ''}`} onClick={() => { if (can) toggleSms(a.id); }} aria-disabled={!can} />
                                <div className="sms-who"><span className="nm">{a.name}</span><span className="tm mono">{hhmm(a.start)}{can ? ` · ${a.phone}` : ''}</span></div>
                                <div className="sms-msg">{can ? fillTpl(a) : <span className="nophone">kayıt/telefon eşleşmesi yok — gönderilemez</span>}</div>
                                <div className={`sms-state ${sentIds.has(a.id) ? 'sent' : failedIds.has(a.id) ? 'fail' : ''}`} title={failedIds.get(a.id) || undefined}>{sentIds.has(a.id) ? 'gönderildi' : failedIds.has(a.id) ? 'başarısız' : can ? 'gönderilecek' : 'atlandı'}</div>
                              </div>
                            );
                          })}
                          <div className="sms-foot">
                            <span className="eyebrow">{smsSent ? `${sentIds.size} gönderildi${failedIds.size ? ` · ${failedIds.size} başarısız` : ''}` : `${smsSelCount} mesaj seçili`}</span>
                            {(() => {
                              const pending = [...smsSel].filter((id) => !sentIds.has(id)).length;
                              const done = smsSent && pending === 0;
                              return (
                                <button className={`btn ${done ? 'btn-light' : 'btn-dark'}`} onClick={sendBulk} disabled={sending || pending === 0}>
                                  {sending ? 'Gönderiliyor…' : done ? 'Gönderildi ✓' : smsSent ? `Kalanları gönder (${pending})` : 'Toplu gönder'}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="side-card sms-draft" style={{ alignSelf: 'start' }}>
                          <span className="eyebrow">taslak mesaj</span>
                          <textarea className="draft-ta" value={draftMsg} onChange={(e) => saveDraft(e.target.value)} rows={4} placeholder="Gönderilecek hatırlatma metni…" aria-label="Taslak SMS mesajı" />
                          <div className="draft-meta">
                            {(() => { const tr = /[çğıöşüÇĞİÖŞÜ]/.test(draftMsg); const seg = tr ? 70 : 160; const n = Math.max(1, Math.ceil(draftMsg.length / seg)); return <span className="draft-count">{draftMsg.length} karakter · {n} SMS{tr ? ' · TR' : ''}</span>; })()}
                            <div className="draft-tpls">
                              {SMS_TEMPLATES.map((t) => <button key={t.name} type="button" className="draft-tpl" onClick={() => saveDraft(t.body)} title={t.body}>{t.name}</button>)}
                            </div>
                          </div>
                          <div className="draft-tags"><b>{'{isim}'}</b> ve <b>{'{saat}'}</b> gönderirken otomatik doldurulur.</div>
                          <div className="draft-prev"><span className="dp-lbl">önizleme</span><p>{draftMsg.replace(/\{isim\}/g, 'Mert').replace(/\{saat\}/g, '14:00')}</p></div>
                          <p className="tmpl-note">Telefon yalnızca danışan kaydıyla eşleşen randevular için bilinir; eşleşmeyenler otomatik atlanır.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6 · GELİŞİM PLANI */}
                  {subTab === 'gelisim' && (
                    <div className="panel" data-screen-label="Gelişim Planı">
                      <PanelHead title="Gelişim Planı" sub="Eğitim ve mesleki yatırım etkinliklerin — ayrı bir takvim kaynağından." />
                      {!dev || (dev.upcoming.length === 0 && dev.completed.length === 0) ? (
                        <Empty t="Henüz gelişim etkinliği yok." s="Eğitim/süpervizyon planı eklenince burada görünür." />
                      ) : (
                        <div className="dev-cols">
                          <div>
                            <div className="dev-col-head"><span className="d" style={{ background: 'var(--now)' }} /><span className="t">Yaklaşan</span></div>
                            {dev.upcoming.map((x, i) => (
                              <div key={i} className="dev-item"><div className="di-top"><span className="di-date mono">{x.date}</span><span className="di-kind">{x.kind}</span></div><h3 className="di-title">{x.title}</h3><div className="di-meta">{x.meta}</div>{x.progress != null && <div className="di-prog"><span style={{ width: `${x.progress}%` }} /></div>}</div>
                            ))}
                          </div>
                          <div>
                            <div className="dev-col-head"><span className="d" style={{ background: 'var(--sage)' }} /><span className="t">Tamamlanan</span></div>
                            {dev.completed.map((x, i) => (
                              <div key={i} className="dev-item done"><div className="di-top"><span className="di-date mono">{x.date}</span><span className="di-kind">{x.kind}</span></div><h3 className="di-title">{x.title}</h3><div className="di-meta">{x.meta}</div></div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 7 · TAKİP — tüm danışanları kapsayan genel takip panosu */}
                  {subTab === 'takip' && (
                    <div className="panel" data-screen-label="Takip">
                      <TakipListesi />
                    </div>
                  )}

                  {/* 8 · WEB SİTESİ */}
                  {subTab === 'websitesi' && (
                    <div className="panel" data-screen-label="Web Sitesi">
                      <PanelHead title="Web Siten" sub="Calmie estetiğiyle, dakikalar içinde klinik web siteni kur — 5 hazır şablondan seç." />
                      <div className="site-grid">
                        <div className="site-main">
                          <div className="site-intro">
                            <span className="eyebrow">başlangıç</span>
                            <h2 className="si-title">Kendi klinik web siteni kur.</h2>
                            <p className="si-desc">Sürükle-bırak yok — şablonunu seç, içeriğini doldur, yayınla. Çalışma saatlerin <b>Müsaitlik</b>'ten, “Randevu al” bağlantın <b>online ön-form</b>dan, ad ve portren <b>Profil</b>'den otomatik gelir.</p>
                            <div className="site-addr"><span className="sa-k">adres</span><span className="sa-v mono">calmie.site/dr-goksel</span></div>
                          </div>
                          <div className="tmpl-head"><span className="eyebrow">şablon seç</span><span className="eyebrow">{SITE_TEMPLATES.length} şablon</span></div>
                          <div className="tmpl-grid">
                            {SITE_TEMPLATES.map((t) => (
                              <button key={t.key} type="button" className={`tmpl-card ${siteTemplate === t.key ? 'on' : ''}`} onClick={() => pickTemplate(t.key)}>
                                <span className="tc-prev" style={{ background: t.prev }} aria-hidden="true" />
                                <span className="tc-name">{t.name}</span>
                                <span className="tc-desc">{t.desc}</span>
                                <span className="tc-pick">{siteTemplate === t.key ? 'Seçildi ✓' : 'Seç'}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="site-side">
                          <div className="side-card">
                            <span className="eyebrow">durum</span>
                            {siteTemplate ? (
                              <>
                                <div className="ss-row"><span className="ss-k">Şablon</span><span className="ss-v">{SITE_TEMPLATES.find((t) => t.key === siteTemplate)?.name}</span></div>
                                <div className="ss-row"><span className="ss-k">Yayın</span><span className="ss-v off">taslak</span></div>
                                <p className="ss-note">İçerik düzenleme ve yayın akışı tasarım aşamasında — şablon seçimin kaydedildi.</p>
                              </>
                            ) : (
                              <p className="ss-note">Henüz şablon seçilmedi. Soldan bir şablon seçerek başla.</p>
                            )}
                          </div>
                          <div className="side-card">
                            <span className="eyebrow">site içeriği · otomatik</span>
                            <ul className="site-feed">
                              <li><span>Çalışma saatleri</span><b>Müsaitlik'ten</b></li>
                              <li><span>Randevu butonu</span><b>online ön-form</b></li>
                              <li><span>Ad &amp; portre</span><b>Profil'den</b></li>
                              <li><span>İletişim</span><b>ayarlardan</b></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </main>
              </div>
            )}
          </main>

          {/* tema seçici */}
          <div className="bg-pick" role="group" aria-label="Arka plan rengi" onMouseLeave={() => setThemePreview(null)}>
            {THEMES.map((t) => (
              <button key={t.k} type="button" className={`bgsw${effTheme === t.k ? ' on' : ''}`} style={{ ['--sw' as any]: t.sw }} title={t.t} aria-label={t.t}
                onMouseEnter={() => setThemePreview(t.k)} onClick={() => commitTheme(t.k)} />
            ))}
          </div>
        </div>

        {/* iptal / erteleme modalı */}
        {cancelPrompt && (
          <div className="overlay" onClick={() => setCancelPrompt(null)}>
            <div className="modal" role="dialog" aria-modal="true" aria-label="Seansı işaretle" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head"><span className="s">Seansı işaretle</span>
                <button type="button" className="modal-x" aria-label="Kapat" onClick={() => setCancelPrompt(null)}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>
              <p className="modal-sub"><b>{cancelPrompt.name}</b> · {new Date(cancelPrompt.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} {hhmm(cancelPrompt.start)} seansını iptal/erteleme alanına bıraktın. Bu değişiklik danışan dosyasına işlenir.</p>
              <div className="modal-opts">
                <button type="button" className="modal-opt cancel" onClick={() => confirmCancel('iptal')}><span className="mo-ic"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></span><span>İptal edildi<small>Seans gerçekleşmedi</small></span></button>
                <button type="button" className="modal-opt delay" onClick={() => confirmCancel('ertelendi')}><span className="mo-ic"><svg viewBox="0 0 24 24"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg></span><span>Ertelendi<small>Başka güne taşındı</small></span></button>
                <button type="button" className="modal-opt keep" onClick={() => setCancelPrompt(null)}><span className="mo-ic"><svg viewBox="0 0 24 24"><path d="M9 14l-4-4 4-4M5 10h11a4 4 0 0 1 0 8h-1" /></svg></span><span>Vazgeç<small>Değişiklik yok</small></span></button>
              </div>
            </div>
          </div>
        )}

        {/* Randevu düzenleme modalı — macOS Takvim'e yazar */}
        {editAppt && (
          <div className="overlay" onClick={() => { if (!editBusy) setEditAppt(null); }}>
            <div className="modal" role="dialog" aria-modal="true" aria-label="Randevuyu düzenle" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head"><span className="s">Randevuyu düzenle</span>
                <button type="button" className="modal-x" aria-label="Kapat" onClick={() => setEditAppt(null)}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
                <label style={EDIT_LBL}>Başlık
                  <input type="text" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} style={EDIT_INP} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.9fr', gap: 10 }}>
                  <label style={EDIT_LBL}>Tarih
                    <input type="date" value={editForm.tarih} onChange={(e) => setEditForm((f) => ({ ...f, tarih: e.target.value }))} style={EDIT_INP} />
                  </label>
                  <label style={EDIT_LBL}>Saat
                    <input type="time" value={editForm.saat} onChange={(e) => setEditForm((f) => ({ ...f, saat: e.target.value }))} style={EDIT_INP} />
                  </label>
                  <label style={EDIT_LBL}>Süre (dk)
                    <input type="number" min={5} step={5} value={String(editForm.sure)} onChange={(e) => setEditForm((f) => ({ ...f, sure: Number(e.target.value) || 50 }))} style={EDIT_INP} />
                  </label>
                </div>
                {editErr && <div style={{ fontSize: 12, color: '#C0392B', lineHeight: 1.4 }}>{editErr}</div>}
                {!editAppt.uid && <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', lineHeight: 1.4 }}>Bu randevu henüz senkronlanmamış — düzenlemek/silmek için önce "Senkronize et".</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 4, flexWrap: 'wrap' }}>
                  {editAppt.matched && <button type="button" onClick={() => { const a = editAppt; setEditAppt(null); open(a); }} style={EDIT_GHOST}>Dosyayı aç →</button>}
                  <button type="button" onClick={deleteEdit} disabled={editBusy} style={{ ...EDIT_DEL, opacity: editBusy ? 0.5 : 1 }}>Sil</button>
                  <span style={{ flex: 1 }} />
                  <button type="button" onClick={() => setEditAppt(null)} disabled={editBusy} style={EDIT_GHOST}>Vazgeç</button>
                  <button type="button" onClick={saveEdit} disabled={editBusy} style={{ ...EDIT_PRIMARY, opacity: editBusy ? 0.75 : 1, cursor: editBusy ? 'progress' : 'pointer' }}>{editBusy ? '⏳ İşleniyor…' : 'Kaydet'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* toast */}
        <div className={`toast${toast ? ' show' : ''}`}><svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg><span>{toast}</span></div>
        {pdrag && <div className="ev-ghost" style={{ left: pdrag.x + 14, top: pdrag.y + 14 }}><b>{pdrag.name}</b>{pdrag.label ? <span>→ {pdrag.label}</span> : null}</div>}
      </div>
    </>
  );
}
