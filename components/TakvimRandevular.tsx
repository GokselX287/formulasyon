'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './TakvimRandevular.css';
import TakipListesi from './TakipListesi';

// ──────────────────────────────────────────────────────────────────────────
// Takvim & Randevular — "landing uyumlu" Calmie mesh/cam kabuk (Cv görsel-39).
// REFERANS_birebir.html portu: siyah üst nav · mesh sahne · opal cam · tema dock.
// 5 sekme: Takvim · Seansa Hazırlık · Müsaitlik · Geçmiş · Takip.
// TÜM veri/davranış mantığı (macOS Randevular senkronu, sürükle-bırak, düzenle,
// yoğunluk/kazanç/çakışma) önceki sürümden BİREBİR korunmuştur.
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
  onUpdateEvent?(patch: ApptEdit): Promise<boolean> | boolean;
  onDeleteEvent?(uid: string, name?: string): Promise<boolean> | boolean;
};

type SubTab = 'takvim' | 'hazirlik' | 'musaitlik' | 'gecmis' | 'takip';
type CalView = 'hafta' | 'gun' | 'ay';
type StatPeriod = 'hafta' | 'ay' | 'yil';

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTHS_FULL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAY_FULL = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const FONTS = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap';

// ── 6 danışan pastel tonu (ad → stabil ton, hash(name)%6) ──
const TONE6 = [
  { bg: '#E3EBDF', dot: '#6E9E7E', ink: '#3F5E4A' }, // sage
  { bg: '#DCE9EA', dot: '#5E97A0', ink: '#3A5E63' }, // teal
  { bg: '#EFE7D4', dot: '#C2A45E', ink: '#6E5E33' }, // gold
  { bg: '#F0E2D8', dot: '#C98A6C', ink: '#7A5240' }, // clay
  { bg: '#EAE0EA', dot: '#A788B0', ink: '#5E4868' }, // mauve
  { bg: '#E4E5EB', dot: '#8488A0', ink: '#474B5E' }, // slate
];
const hashName = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const toneVars = (name: string): React.CSSProperties => {
  const t = TONE6[hashName(name) % 6];
  return { ['--tbg' as any]: t.bg, ['--tbd' as any]: 'transparent', ['--tink' as any]: t.ink, ['--tdot' as any]: t.dot };
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

// Tema dock (Ana Sayfa/Danışanlar ile paylaşımlı: localStorage 'calmie-theme')
const DOCK_THEMES = [
  { id: 'sage', dot: '#8FB58C' }, { id: 'ocean', dot: '#5FA9C0' }, { id: 'dusk', dot: '#9A7FD0' },
  { id: 'clay', dot: '#D78C66' }, { id: 'rose', dot: '#C97FA0' },
];

const HSTART = 9 * 60, HEND = 22 * 60, HPX = 45;
const DROP_FROM = 20 * 60; // 20:00 sonrası = iptal / erteleme alanı

export default function TakvimRandevular(props: TakvimRandevularProps) {
  const { events, resolveClient, missingFeeCount = 0, availability, onAddBlock, onBack, onNav, onOpenClient, onNewAppointment, onManualSync, onEditMissingFees, onCancelSession, onUpdateEvent, onDeleteEvent } = props;

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
  const [cancelRange, setCancelRange] = useState<{ from: number; to: number }>({ from: 20 * 60, to: HEND });
  const [histQuery, setHistQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncTxt, setSyncTxt] = useState('güncel');
  const [toast, setToast] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  // ── Tema (Ana Sayfa/Danışanlar ile paylaşılır: calmie-theme) ──
  const [theme, setTheme] = useState('sage');
  useEffect(() => { const s = lsGet('calmie-theme'); if (s && DOCK_THEMES.some((t) => t.id === s)) setTheme(s); }, []);
  const applyTheme = (id: string) => { setTheme(id); try { localStorage.setItem('calmie-theme', id); } catch { /* yoksay */ } };

  // ── İptal/erteleme bölgesi saat aralığı (terapist belirler; yerel) ──
  useEffect(() => { try { const r = lsGet('tkv-cancel-range'); if (r) { const o = JSON.parse(r); if (typeof o?.from === 'number' && typeof o?.to === 'number' && o.from < o.to) setCancelRange({ from: o.from, to: o.to }); } } catch { /* yoksay */ } }, []);
  const saveCancelRange = (next: { from: number; to: number }) => { setCancelRange(next); try { localStorage.setItem('tkv-cancel-range', JSON.stringify(next)); } catch { /* yoksay */ } };

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
  const confirmCancel = async (mode: 'iptal' | 'ertelendi') => {
    if (!cancelPrompt) return;
    const cp = cancelPrompt;
    setCancelPrompt(null);
    onCancelSession?.(cp.name, mode, cp.date);
    if (mode === 'iptal' && cp.uid) {
      const ok = await onDeleteEvent?.(cp.uid, cp.name);
      showToast(ok ? `${cp.name} · seans iptal edildi ve takvimden silindi` : `${cp.name} · dosyada iptal işaretlendi (takvimden silinemedi)`);
    } else {
      showToast(`${cp.name} · seans ${mode === 'iptal' ? 'iptal edildi' : 'ertelendi'} olarak işaretlendi`);
    }
  };

  // ── Bu hafta (Pzt→Paz) · sabit ──
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
        phone: c?.phone ?? null, reviewed: !!c?.reviewed,
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

  // ── Seans durumu (yalnız bugünün blokları) ──
  const statusOf = (a: Appt): 'past' | 'now' | 'next' | 'upcoming' | '' => {
    if (a.date !== todayISO || !mounted) return '';
    if (a.end <= nowMinutes) return 'past';
    if (a.start <= nowMinutes && nowMinutes < a.end) return 'now';
    if (nextAppt && a.id === nextAppt.id) return 'next';
    return 'upcoming';
  };

  // ── Yoğunluk (hafta/ay/yıl) ──
  const density = useMemo(() => {
    const countOn = (iso: string) => ALL.filter((a) => a.date === iso).length;
    const haftaCounts = week.map((d) => countOn(d.date));
    const todayIdx = week.findIndex((d) => d.today);
    const y = now.getFullYear(), mo = now.getMonth();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const ayBuckets: number[] = [0, 0, 0, 0, 0];
    for (let dd = 1; dd <= daysInMonth; dd++) { const iso = `${y}-${pad2(mo + 1)}-${pad2(dd)}`; const b = Math.min(4, Math.floor((dd - 1) / 7)); ayBuckets[b] += countOn(iso); }
    const ayActive = Math.min(4, Math.floor((now.getDate() - 1) / 7));
    const yilCounts = Array.from({ length: 12 }, (_, m) => ALL.filter((a) => a.date.slice(0, 7) === `${y}-${pad2(m + 1)}`).length);
    return {
      hafta: { word: 'hafta', unit: 'bu hafta', labels: DAY_NAMES, counts: haftaCounts, active: todayIdx < 0 ? 0 : todayIdx },
      ay: { word: 'ay', unit: 'bu ay', labels: ['1.H', '2.H', '3.H', '4.H', '5.H'], counts: ayBuckets, active: ayActive },
      yil: { word: 'yıl', unit: 'bu yıl', labels: MONTHS, counts: yilCounts, active: now.getMonth() },
    };
  }, [ALL, week, now]);

  // ── Tahmini kazanç (hafta + ay + yıl) ──
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

  // ── Saat (senkron butonu için) ──
  const watch = useMemo(() => ({
    time: mounted ? `${pad2(now.getHours())}:${pad2(now.getMinutes())}` : '—',
  }), [now, mounted]);

  // ── Aralık etiketi ──
  const rangeLabel = useMemo(() => {
    if (calView === 'gun') { const d = new Date(calDayDate + 'T12:00:00'); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
    if (calView === 'ay') { const d = new Date(now.getFullYear(), now.getMonth() + monthOff, 1); return `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`; }
    const a = calWeek[0], b = calWeek[6]; const bm = new Date(b.date + 'T12:00:00');
    return `${a.num} – ${b.num} ${MONTHS[bm.getMonth()]} ${bm.getFullYear()}`;
  }, [calView, calWeek, calDayDate, monthOff, now]);
  const todayLabel = `${now.getDate()} ${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()} · ${DAY_FULL[now.getDay()]}`;

  const goTab = (t: SubTab) => { setSubTab(t); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const navTo = (d: number) => {
    if (d === 0) { setWeekOff(0); setDayOff(0); setMonthOff(0); } else if (calView === 'ay') setMonthOff((v) => v + d); else if (calView === 'gun') setDayOff((v) => v + d); else setWeekOff((v) => v + d);
  };
  // Boş ızgarada yatay sürükle → hafta/gün/ay gezinme
  const gridDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.ev')) return;
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
    if (Math.abs(dx) > 55) { suppressColClick.current = true; navTo(dx > 0 ? -1 : 1); }
  };
  const gridWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) + 2) return;
    if (wheelCD.current) return;
    wheelAccum.current += e.deltaX;
    if (Math.abs(wheelAccum.current) > 90) {
      navTo(wheelAccum.current > 0 ? 1 : -1);
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
  const colCreate = (date: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressColClick.current) { suppressColClick.current = false; return; }
    const rect = e.currentTarget.getBoundingClientRect();
    let mins = HSTART + Math.round((((e.clientY - rect.top) / HPX) * 60) / 30) * 30;
    mins = Math.max(HSTART, Math.min(HEND - 30, mins));
    onNewAppointment?.({ tarih: date, saat: hhmm(mins) });
  };

  // ── POINTER tut-bırak: olayı tut → hafta ızgarasında yeni gün/saate taşı ──
  const AXIS_W = 60;
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
    if (e.pointerType === 'mouse' && e.button !== 0) return;
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
    suppressColClick.current = true;
    if (!st) return;
    if (!st.moved) { openEdit(a); return; }
    if (inCancelZone(e.clientY)) { setCancelPrompt({ name: a.name, date: a.date, start: a.start, uid: a.uid ?? null }); return; }
    const d = dropFromXY(e.clientX, e.clientY);
    if (!d || (d.date === a.date && d.mins === a.start)) return;
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
    { key: 'musaitlik', label: 'Müsaitlik' },
    { key: 'gecmis', label: 'Geçmiş' },
    { key: 'takip', label: 'Takip' },
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
        {h > 54 ? tag : null}
        <div className="ev-t">{hhmm(a.start)} – {hhmm(a.end)}</div>
      </div>
    );
  };

  const hoursAxis: number[] = []; for (let m = HSTART; m <= HEND; m += 60) hoursAxis.push(m);
  const cancelSlots: number[] = []; for (let m = HSTART; m <= HEND; m += 30) cancelSlots.push(m);
  const bodyH = (HEND - HSTART) / 60 * HPX;
  const nowTop = (nowMinutes - HSTART) / 60 * HPX;
  const dzTop = (cancelRange.from - HSTART) / 60 * HPX, dzH = Math.max(18, (cancelRange.to - cancelRange.from) / 60 * HPX);

  const WeekView = () => (
    <div className="wk" onWheel={gridWheel}>
      <div className="wk-head">
        <div className="wk-hd" />
        {calWeek.map((d) => (
          <div key={d.date} className={`wk-hd${d.today ? ' today' : ''}${d.weekend ? ' weekend' : ''}`}>
            <div className="n">{pad2(d.num)}</div><div className="d">{d.name.toLowerCase()}</div>
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
          <div className="dz-in">İptal / erteleme alanı · {hhmm(cancelRange.from)}–{hhmm(cancelRange.to)}<br />seansı buraya bırak</div>
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
    if (!evs.length) return (
      <div className="empty">
        <div className="empty-ic"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round" /></svg></div>
        <h2 className="empty-t">Bugün için randevu yok</h2>
        <p className="empty-d">macOS Takvim'de bu güne ait etkinlik bulunamadı.</p>
      </div>
    );
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
              <div className={`day-ev${st === 'past' ? ' past' : ''}`} style={toneVars(a.name)} onClick={() => openEdit(a)}>
                <div className="dt">{hhmm(a.start)}<small>{hhmm(a.end)}</small></div>
                <div>
                  <div className="dn">{a.name}{st === 'now' ? <span style={{ color: 'var(--violet)', fontSize: 12 }}> · şimdi</span> : st === 'next' ? <span style={{ color: 'var(--violet)', fontSize: 12 }}> · sıradaki</span> : null}</div>
                  <div className="dtopic">{a.matched ? a.topic : 'Yalnızca takvim adı ve saati biliniyor.'}</div>
                  <div className="dmeta">{a.matched ? <><span className="chip ok">dosya eşleşti</span>{a.reviewed && <span className="chip ok">incelendi</span>}</> : <span className="chip no">eşleşme yok</span>}</div>
                </div>
                <div className="po-go">{a.matched ? 'Dosyayı aç →' : 'Eşleştir →'}</div>
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
      <div className="card card-pad">
        <div className="yog-q">Bu {S.word} ne kadar yoğunsun?</div>
        <div className="yog-seg">
          {(['hafta', 'ay', 'yil'] as StatPeriod[]).map((k) => <button key={k} type="button" className={statPeriod === k ? 'on' : ''} onClick={() => setStatPeriod(k)}>{k === 'hafta' ? 'Hafta' : k === 'ay' ? 'Ay' : 'Yıl'}</button>)}
        </div>
        <div className="yog-big"><span className="n">{total}</span><span className="u">seans · {S.unit}</span></div>
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
              <div className="earn-sub"><div><b>{E.avg}</b>ort. / seans</div><div><b>{E.paid}</b>ücretli · {unit}</div></div>
              {E.free > 0 && <div className="earn-note">{E.free} fiyatsız seans hesaba katılmadı ({unit}).</div>}
              {missingFeeCount > 0 && (
                <div className="earn-warn" onClick={() => (onEditMissingFees ? onEditMissingFees() : showToast('Fiyat bilgisi eksik danışanlar listeleniyor…'))}>
                  <svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                  <span>{missingFeeCount} danışanın fiyat bilgisi girilmemiş. Düzenle.</span>
                </div>
              )}
            </>
          ) : (
            <p className="earn-note" style={{ marginTop: 12 }}>{unit} için fiyatlı seans yok — danışan dosyasındaki “seans ücreti” doldurulunca burada hesaplanır.</p>
          );
        })()}
      </div>
      <div className="card card-pad cancel-cfg">
        <span className="card-eye">iptal / erteleme alanı</span>
        <p className="cc-lead">Takvimde bu saat aralığı “seansı bırak” bölgesidir. Sürüklenen seans burada iptal/ertelenir — aralığı sen belirle.</p>
        <div className="cc-row">
          <label>Başlangıç
            <select value={cancelRange.from} onChange={(e) => { const f = +e.target.value; saveCancelRange({ from: f, to: Math.max(f + 30, cancelRange.to) }); }}>
              {cancelSlots.filter((m) => m < HEND).map((m) => <option key={m} value={m}>{hhmm(m)}</option>)}
            </select>
          </label>
          <span className="cc-dash">–</span>
          <label>Bitiş
            <select value={cancelRange.to} onChange={(e) => { const t = +e.target.value; saveCancelRange({ from: Math.min(cancelRange.from, t - 30), to: t }); }}>
              {cancelSlots.filter((m) => m > cancelRange.from).map((m) => <option key={m} value={m}>{hhmm(m)}</option>)}
            </select>
          </label>
        </div>
      </div>
    </div>
  );

  // ── Çakışma kartı (tabwrap sağı) ──
  const ConflictCard = () => conflict ? (
    <div className="conflict" role="alert">
      <div className="conflict-ic"><svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg></div>
      <div className="conflict-txt">
        <div className="conflict-eye">çakışma · {conflict.isToday ? 'bugün' : 'bu hafta'}</div>
        <div className="conflict-msg"><b>{conflict.prev.name}</b> {hhmm(conflict.prev.start)}–{hhmm(conflict.prev.end)} ile sonraki seans arasında yalnızca <b className="num">{Math.max(0, conflict.gap)} dk</b> var — hazırlık payı yetersiz.</div>
      </div>
    </div>
  ) : (
    <div className="conflict calm">
      <div className="conflict-ic"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg></div>
      <div className="conflict-txt">
        <div className="conflict-eye">çakışma kontrolü</div>
        <div className="conflict-msg">{weekHasAppts ? 'Bu haftaki seanslar arasında yeterli hazırlık payı var.' : 'Bu hafta için planlı seans bulunmuyor.'}</div>
      </div>
    </div>
  );

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={FONTS} rel="stylesheet" />

      <div className="tkv" data-theme={theme === 'sage' ? undefined : theme} data-screen-label="Takvim — Calmie">
        <div className="scene" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        {/* ───────── NAV ───────── */}
        <div className="navwrap">
          <nav className="nav" aria-label="Birincil">
            <a className="logo" onClick={() => onNav?.('home')}>Calmie<i>.</i></a>
            <div className="nav-links">
              <a onClick={() => onNav?.('home')}>Ana Sayfa</a>
              <a onClick={() => onNav?.('calendar')}>Takvim</a>
              <a className="active" onClick={() => onBack?.()}>Çalışma Alanı</a>
              <a onClick={() => onNav?.('terapist')}>Profil</a>
            </div>
            <div className="nav-actions">
              <button className="nav-new" type="button" onClick={() => (onNewAppointment ? onNewAppointment() : showToast('Yeni randevu formu açılıyor…'))}>
                <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg><span>Yeni randevu</span>
              </button>
              <a className="nav-av" onClick={() => onNav?.('terapist')}>GA</a>
            </div>
            <button className="menu-btn" aria-label="Menü" onClick={() => setMobileMenu((v) => !v)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </nav>
          <div className={'mobile-menu' + (mobileMenu ? ' open' : '')}>
            <a onClick={() => { setMobileMenu(false); onNav?.('home'); }}>Ana Sayfa</a>
            <a onClick={() => { setMobileMenu(false); onNav?.('calendar'); }}>Takvim &amp; Randevular</a>
            <a onClick={() => { setMobileMenu(false); onBack?.(); }}>Çalışma Alanı</a>
            <a onClick={() => { setMobileMenu(false); onNav?.('terapist'); }}>Profil</a>
          </div>
        </div>

        <main className="page">
          <div className="wrap">

            {/* ───────── IDENTITY STRIP ───────── */}
            <div className="idstrip">
              <div className="idstrip-l">
                <a className="back" onClick={() => onBack?.()}><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>Çalışma Alanı</a>
                <h1 className="id-title"><b>Takvim</b> <em>&amp; Randevular</em></h1>
                <div className="id-sub">{todayLabel}<span className="dotsep" />{todayAppts.length} seans bugün</div>
              </div>
              <div className="id-actions">
                <button type="button" className={`sync${syncing ? ' syncing' : ''}`} onClick={handleSync} aria-label="Senkronize et">
                  <svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" /></svg>
                  <span className="dot" />{syncing ? 'Senkronize ediliyor…' : `Güncel · ${watch.time}`}
                </button>
                <button type="button" className="btn btn-primary" onClick={() => (onNewAppointment ? onNewAppointment() : showToast('Yeni randevu formu açılıyor…'))}>
                  <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Yeni randevu
                </button>
              </div>
            </div>

            {/* ───────── TAB BAR + CONFLICT ───────── */}
            <div className="tabwrap">
              <div className="tabs">
                {TABS.map((t) => (
                  <button key={t.key} type="button" className={`tab${subTab === t.key ? ' on' : ''}`} onClick={() => goTab(t.key)}>
                    {t.label}{t.cnt != null && <span className="badge">{t.cnt}</span>}
                  </button>
                ))}
              </div>
              <div className="conflict-host">{ConflictCard()}</div>
            </div>

            {/* ───────── 1 · TAKVİM ───────── */}
            {subTab === 'takvim' && (
              <section className="pane">
                <div className="view-bar">
                  <div className="seg">
                    {(['hafta', 'gun', 'ay'] as CalView[]).map((k) => <button key={k} type="button" className={calView === k ? 'on' : ''} onClick={() => setCalView(k)}>{k === 'hafta' ? 'Hafta' : k === 'gun' ? 'Gün' : 'Ay'}</button>)}
                  </div>
                  <div className="wknav">
                    <button type="button" onClick={() => navTo(-1)} aria-label="Önceki"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg></button>
                    <span className="wk-range">{rangeLabel}</span>
                    <button type="button" onClick={() => navTo(1)} aria-label="Sonraki"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg></button>
                    {(calView === 'ay' ? monthOff !== 0 : calView === 'gun' ? dayOff !== 0 : weekOff !== 0) && (
                      <button type="button" className="today-btn" onClick={() => navTo(0)}>Bugün</button>
                    )}
                  </div>
                </div>
                <div className={calView !== 'ay' ? 'grid-2' : ''}>
                  <div>{calView === 'hafta' ? WeekView() : calView === 'gun' ? DayView() : MonthView()}</div>
                  {calView !== 'ay' && Rail()}
                </div>
              </section>
            )}

            {/* ───────── 2 · MÜSAİTLİK ───────── */}
            {subTab === 'musaitlik' && (() => {
              const hm = (s: string) => (Number(s?.slice(0, 2)) || 0) * 60 + (Number(s?.slice(3, 5)) || 0);
              const fullCount = ALL.filter((a) => week.some((d) => d.date === a.date)).length;
              const emptyCount = week.reduce((acc, d) => { if (d.name === 'Cmt' || d.name === 'Paz') return acc; const span = d.name === 'Cum' ? 7 : 9; return acc + Math.max(0, span - ALL.filter((a) => a.date === d.date).length); }, 0);
              return (
                <section className="pane">
                  <div className="pane-head"><span className="eyebrow">müsaitlik</span><h2>Müsaitlik</h2><p>Haftalık dolu/boş ısı ızgarası ve çalışma saatleri.</p></div>
                  <div className="avail-grid">
                    <div className="card card-pad">
                      <table className="heat">
                        <thead><tr><th className="htime" />{week.map((d) => <th key={d.date}>{d.name} {d.num}</th>)}</tr></thead>
                        <tbody>
                          {Array.from({ length: 9 }, (_, i) => 9 + i).map((hr) => (
                            <tr key={hr}>
                              <td className="htime">{pad2(hr)}:00</td>
                              {week.map((d) => {
                                const off = d.name === 'Cmt' || d.name === 'Paz' || (d.name === 'Cum' && hr >= 16);
                                if (off) return <td key={d.date}><div className="cell closed" /></td>;
                                const blk = (availability?.bloklar ?? []).find((b: any) => b.tarih === d.date && hm(b.baslangic) <= hr * 60 && hm(b.bitis) > hr * 60);
                                if (blk) return <td key={d.date}><div className={`cell ${blk.renk || 'musait_degil'}`} title={`${blockLabel(blk.renk)}${blk.aciklama ? ' — ' + blk.aciklama : ''}`}><span className="blk">{blockLabel(blk.renk)}</span></div></td>;
                                const appt = ALL.find((a) => a.date === d.date && a.start < (hr + 1) * 60 && a.end > hr * 60);
                                return <td key={d.date}>{appt ? <div className={`cell ${d.today ? 'todayfull' : 'full'}`} title={appt.name}><span className="ci">{appt.name.split(' ')[0]}</span></div> : <div className="cell" />}</td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="legend">
                        <span><i className="lg-full" />dolu</span><span><i className="lg-today" />bugün dolu</span><span><i className="lg-empty" />boş</span>
                        <span><i className="lg-kapali" />kapalı</span><span><i className="lg-yemek" />yemek</span><span><i className="lg-mola" />mola</span>
                        <span><i className="lg-izin" />izin</span><span><i className="lg-musait_degil" />müsait değil</span>
                      </div>
                    </div>
                    <div className="av-side">
                      <div className="card card-pad">
                        <span className="card-eye">bu hafta</span>
                        <div className="av-stat" style={{ marginTop: 12 }}>
                          <div><div className="sv">{fullCount}</div><div className="sl">dolu slot</div></div>
                          <div><div className="sv">{emptyCount}</div><div className="sl">boş slot</div></div>
                        </div>
                      </div>
                      <div className="card card-pad">
                        <span className="card-eye">çalışma saatleri</span>
                        <div className="wh-list" style={{ marginTop: 10 }}>{WORKING_HOURS.map((w) => <div key={w.d} className={`wh-day${w.off ? ' off' : ''}`}><span>{w.d}</span><span className="num">{w.v}</span></div>)}</div>
                      </div>
                      <div className="card card-pad">
                        <span className="card-eye">müsaitlik bloğu ekle</span>
                        <div className="form-row"><label>Tarih</label><input type="date" value={blkForm.tarih} onChange={(e) => setBlkForm((s) => ({ ...s, tarih: e.target.value }))} /></div>
                        <div className="form-row"><label>Başlangıç – Bitiş</label><div className="form-2"><input type="time" value={blkForm.baslangic} onChange={(e) => setBlkForm((s) => ({ ...s, baslangic: e.target.value }))} /><span>–</span><input type="time" value={blkForm.bitis} onChange={(e) => setBlkForm((s) => ({ ...s, bitis: e.target.value }))} /></div></div>
                        <div className="form-row"><label>Tip</label><select value={blkForm.renk} onChange={(e) => setBlkForm((s) => ({ ...s, renk: e.target.value }))}>{BLOCK_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
                        <div className="form-row"><label>Not (ops.)</label><input type="text" placeholder="Not" value={blkForm.aciklama} onChange={(e) => setBlkForm((s) => ({ ...s, aciklama: e.target.value }))} /></div>
                        <button type="button" className="btn btn-primary form-btn" disabled={!blkForm.tarih} onClick={() => { onAddBlock?.({ tarih: blkForm.tarih, baslangic: blkForm.baslangic, bitis: blkForm.bitis, renk: blkForm.renk, aciklama: blkForm.aciklama || undefined }); setBlkForm((s) => ({ ...s, aciklama: '' })); showToast('Müsaitlik bloğu eklendi'); }}>Blok ekle</button>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* ───────── 4 · GEÇMİŞ ───────── */}
            {subTab === 'gecmis' && (() => {
              const q = histQuery.trim().toLocaleLowerCase('tr-TR');
              const shown = history.filter((h) => !q || h.name.toLocaleLowerCase('tr-TR').includes(q));
              return (
                <section className="pane">
                  <div className="pane-head"><span className="eyebrow">geçmiş</span><h2>Geçmiş</h2><p>Geçmiş randevular — isimle ara.</p></div>
                  <label className="search">
                    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
                    <input type="text" placeholder="Danışan adı ara…" value={histQuery} onChange={(e) => setHistQuery(e.target.value)} />
                  </label>
                  <div className="hist-list">
                    {shown.map((h) => {
                      const dd = new Date(h.startISO + ':00');
                      const dayName = DAY_NAMES[(dd.getDay() + 6) % 7];
                      return (
                        <div key={h.id} className="hist-row" onClick={() => { if (h.matched) open(h); }}>
                          <div className="hdate">{dayName} {pad2(dd.getDate())} · {h.date.slice(0, 7).replace('-', ' · ')} · {hhmm(h.start)}</div>
                          <div><div className="hname">{h.name}</div>{h.matched ? <div className="htopic">{h.topic}</div> : <div className="htopic nm">eşleşme yok</div>}</div>
                          <div className="hgo">{h.matched ? 'dosya →' : 'liste →'}</div>
                        </div>
                      );
                    })}
                    {shown.length === 0 && <div className="hist-empty">Eşleşen randevu yok.</div>}
                  </div>
                  <div className="hist-stat">
                    <div><b>{history.length}</b>son 40 · seans</div>
                    <div><b>{new Set(history.map((h) => h.name)).size}</b>farklı danışan</div>
                  </div>
                </section>
              );
            })()}

            {/* ───────── 5 · TAKİP ───────── */}
            {subTab === 'takip' && (
              <section className="pane">
                <TakipListesi />
              </section>
            )}

          </div>
        </main>

        {/* ───────── TEMA DOCK ───────── */}
        <div className="dock" aria-label="Renk teması">
          {DOCK_THEMES.map((t) => (
            <button key={t.id} type="button" className={'dock-dot' + (theme === t.id ? ' on' : '')} style={{ background: t.dot }} aria-label={`${t.id} tema`} onClick={() => applyTheme(t.id)} />
          ))}
        </div>

        {/* ───────── İPTAL / ERTELEME MODALI ───────── */}
        {cancelPrompt && (
          <div className="modal-back" onClick={(e) => { if (e.target === e.currentTarget) setCancelPrompt(null); }}>
            <div className="modal" role="dialog" aria-modal="true" aria-label="Seansı işaretle">
              <div className="modal-top"><span className="modal-name">Seansı işaretle</span>
                <button type="button" className="modal-x" aria-label="Kapat" onClick={() => setCancelPrompt(null)}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
              </div>
              <p className="modal-sub"><b>{cancelPrompt.name}</b> · {new Date(cancelPrompt.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} {hhmm(cancelPrompt.start)} seansını iptal/erteleme alanına bıraktın. Bu değişiklik danışan dosyasına işlenir.</p>
              <div className="modal-opts">
                <button type="button" className="modal-opt cancel" onClick={() => confirmCancel('iptal')}><span className="mo-ic"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></span><span>İptal edildi<small>Seans gerçekleşmeyecek</small></span></button>
                <button type="button" className="modal-opt delay" onClick={() => confirmCancel('ertelendi')}><span className="mo-ic"><svg viewBox="0 0 24 24"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg></span><span>Ertelendi<small>İleri bir tarihe taşınacak</small></span></button>
                <button type="button" className="modal-opt keep" onClick={() => setCancelPrompt(null)}><span className="mo-ic"><svg viewBox="0 0 24 24"><path d="M9 14l-4-4 4-4M5 10h11a4 4 0 0 1 0 8h-1" /></svg></span><span>Vazgeç<small>Değişiklik yapma</small></span></button>
              </div>
            </div>
          </div>
        )}

        {/* ───────── RANDEVU DÜZENLEME MODALI ───────── */}
        {editAppt && (
          <div className="modal-back" onClick={(e) => { if (e.target === e.currentTarget && !editBusy) setEditAppt(null); }}>
            <div className="modal" role="dialog" aria-modal="true" aria-label="Randevuyu düzenle">
              <div className="modal-top"><span className="modal-name">Randevuyu düzenle</span>
                <button type="button" className="modal-x" aria-label="Kapat" onClick={() => setEditAppt(null)}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
              </div>
              <div className="modal-form">
                <label className="modal-lbl">Başlık<input className="modal-inp" type="text" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} /></label>
                <div className="modal-grid3">
                  <label className="modal-lbl">Tarih<input className="modal-inp" type="date" value={editForm.tarih} onChange={(e) => setEditForm((f) => ({ ...f, tarih: e.target.value }))} /></label>
                  <label className="modal-lbl">Saat<input className="modal-inp" type="time" value={editForm.saat} onChange={(e) => setEditForm((f) => ({ ...f, saat: e.target.value }))} /></label>
                  <label className="modal-lbl">Süre (dk)<input className="modal-inp" type="number" min={5} step={5} value={String(editForm.sure)} onChange={(e) => setEditForm((f) => ({ ...f, sure: Number(e.target.value) || 50 }))} /></label>
                </div>
                {editErr && <div className="modal-err">{editErr}</div>}
                {!editAppt.uid && <div className="modal-note">Bu randevu henüz senkronlanmamış — düzenlemek/silmek için önce "Senkronize et".</div>}
                <div className="modal-acts">
                  {editAppt.matched && <button type="button" className="btn btn-ghost" onClick={() => { const a = editAppt; setEditAppt(null); open(a); }}>Dosyayı aç →</button>}
                  <button type="button" className="modal-del" onClick={deleteEdit} disabled={editBusy} style={{ opacity: editBusy ? 0.5 : 1 }}>Sil</button>
                  <span style={{ flex: 1 }} />
                  <button type="button" className="btn btn-ghost" onClick={() => setEditAppt(null)} disabled={editBusy}>Vazgeç</button>
                  <button type="button" className="btn btn-primary" onClick={saveEdit} disabled={editBusy}>{editBusy ? 'İşleniyor…' : 'Kaydet'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────── TOAST + DRAG GHOST ───────── */}
        <div className="toast-wrap">
          {toast && <div className="toast show"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg><span>{toast}</span></div>}
        </div>
        {pdrag && <div className="ev-ghost" style={{ left: pdrag.x + 14, top: pdrag.y + 14 }}><b>{pdrag.name}</b>{pdrag.label ? <span>→ {pdrag.label}</span> : null}</div>}
      </div>
    </>
  );
}
