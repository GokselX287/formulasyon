'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './AnaSayfaV3.css';

// ──────────────────────────────────────────────────────────────────────────
// Ana Sayfa v3 — "Calmie" (design_handoff_ana_sayfa_v3 birebir port)
// .asv3 köküne scope'lu; gerçek veriye bağlı (uydurma yok).
// ──────────────────────────────────────────────────────────────────────────

export type V3Session = {
  who: string; file: string; mod: string[]; topic: string;
  no: number; sev: number; time: string;
  status?: 'past' | 'next' | 'upcoming';
  mark?: 'done' | 'late' | 'cancel' | null;
  dateISO?: string;
};
export type V3IntensityRange = { title: string; total: number; unit: string; range?: string; bars: { l: string; v: number; today?: boolean }[] };
export type V3Data = {
  dateTop: string; dateFull: string;
  therapist: { name: string; full: string };
  weekly: { sessionsThisWeek: number };
  sessions: V3Session[];
  intensity: { active: 'week' | 'month' | 'year'; week: V3IntensityRange; month: V3IntensityRange; year: V3IntensityRange };
  drop: { count: number };
  continuity: {
    total: number; avg: string; median: number; longest: number;
    visitInterval?: number; visitIntervalAll?: number; visitIntervalActive?: number;
    histogram: { k: string; n: number }[]; dropoutInsight: string;
    retention: { nm: string; pct: number }[]; exit: { l: string; n: number; c: string }[];
  };
  reflections: { date: string; fark: string; klinik: string }[];
};

export type V3StaleClient = { id: string; name: string; lastSession: string; intervalDays: number; daysSince: number };

export type AnaSayfaV3Props = {
  data: V3Data;
  staleClients?: V3StaleClient[];
  onSetClientStatus?(id: string, status: 'active' | 'passive'): void | Promise<void>;
  onOpenFile?(file: string, name?: string): void;
  onNav?(target: string): void;
  onOpenProfile?(): void;
  onMarkSession?(file: string, mode: 'done' | 'late' | 'cancel' | null, s: V3Session): void;
  onSaveWellbeing?(score: number, note: string): void | Promise<void>;
  onSaveReflection?(fark: string, klinik: string): void | Promise<void>;
};

const FONTS = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600&display=swap';
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const minutesOf = (t: string) => { const m = String(t).match(/(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : 0; };
const initials = (s: string) => s.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const Arrow = () => <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
const MARK_LABEL: Record<string, string> = { done: 'Gerçekleşti', late: 'Ertelendi', cancel: 'İptal' };
// Yapılacak iş durumları (zaman çizelgesi + profil "iş tamamlama" çizelgesi)
type TodoStatus = 'done' | 'late' | 'skip';
const TODO_LABEL: Record<TodoStatus, string> = { done: 'Yapıldı', late: 'Ertelendi', skip: 'Yapılmayacak' };
const dayKey = () => new Date().toISOString().slice(0, 10);

// Arkaplan stil presetleri (referanstan birebir)
const STYLES: Record<string, any> = {
  orijinal: { label: 'Orijinal', filter: 'none', grade: 'none', gradeOp: 0, vigOp: 0, grainOp: 0, scrimOp: 0 },
  editor: { label: 'Editöryel', filter: 'contrast(1.08) saturate(1.06) brightness(1.02)', grade: 'radial-gradient(120% 90% at 80% 6%, rgba(255,244,226,.55), rgba(255,244,226,0) 52%),linear-gradient(200deg, rgba(150,176,210,0) 38%, rgba(24,30,46,.5) 100%)', gradeOp: .5, vigOp: .55, grainOp: .07, scrimOp: 1 },
  sinematik: { label: 'Sinematik', filter: 'contrast(1.17) saturate(1.02) brightness(.99)', grade: 'linear-gradient(180deg, rgba(255,206,150,.32) 0%, rgba(255,206,150,0) 30%),linear-gradient(0deg, rgba(16,52,70,.58) 0%, rgba(16,52,70,0) 44%)', gradeOp: .62, vigOp: .82, grainOp: .085, scrimOp: 1 },
  sicak: { label: 'Sıcak Film', filter: 'contrast(1.06) saturate(1.14) brightness(1.03) sepia(.12)', grade: 'radial-gradient(120% 100% at 72% 0%, rgba(255,196,120,.5), rgba(255,196,120,0) 55%),linear-gradient(200deg, rgba(120,70,40,0) 40%, rgba(58,28,16,.5) 100%)', gradeOp: .56, vigOp: .5, grainOp: .12, scrimOp: 1 },
  antrasit: { label: 'Antrasit', filter: 'grayscale(1) contrast(1.13) brightness(1.02)', grade: 'linear-gradient(200deg, rgba(126,142,170,.28) 0%, rgba(18,22,32,.6) 100%)', gradeOp: .5, vigOp: .66, grainOp: .09, scrimOp: 1 },
  sade: { label: 'Sade', filter: 'contrast(1.03) saturate(1.02) brightness(1.01)', grade: 'linear-gradient(200deg, rgba(150,176,210,0) 52%, rgba(24,30,46,.3) 100%)', gradeOp: .2, vigOp: .36, grainOp: .05, scrimOp: 1 },
};
// Hero arkaplanı için varsayılan görsel (kaynak tasarımdaki gömülü dokuma doku);
// kullanıcı kendi görselini yüklemediğinde bu gösterilir.
const DEFAULT_BG = '/calmie-hero-default.jpg';
// Varsayılan profil avatarı (kullanıcı kendi fotoğrafını yüklemediğinde).
const DEFAULT_AV = '/calmie-avatar-default.jpg';
// localStorage'ı render sırasında güvenli oku → lazy init ile reload'da "default→kayıtlı" flash'ı önler.
const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };
const STYLE_SWATCH: Record<string, string> = {
  orijinal: 'linear-gradient(135deg,#7B2E86,#EDE6F2)', editor: 'linear-gradient(135deg,#6E86B0,#E9DCC6)',
  sinematik: 'linear-gradient(135deg,#0F3446,#FFCE96)', sicak: 'linear-gradient(135deg,#3A1C10,#FFC478)',
  antrasit: 'linear-gradient(135deg,#2B3142,#C2CAD8)', sade: 'linear-gradient(135deg,#9FB2CE,#F2F2EE)',
};
const THEMES: { k: string; sw: string; t: string }[] = [
  { k: 'default', sw: 'linear-gradient(135deg,#EE5870 0%,#FED6A0 52%,#6086CE 100%)', t: 'Varsayılan' },
  { k: 'mavi', sw: 'linear-gradient(135deg,#1E2C5E,#7E3A66 62%,#B23E66)', t: 'Cherry · gece mavisi' },
  { k: 'gri', sw: 'linear-gradient(135deg,#A6B2C0,#DEE3E8)', t: 'Kürk · soft blue' },
  { k: 'su', sw: 'linear-gradient(135deg,#289694,#B8EADE)', t: 'Su yeşili' },
  { k: 'koyu', sw: 'linear-gradient(135deg,#1E543A,#6EAF82)', t: 'Koyu yeşil' },
];

const RAIL = [
  { id: 'bugun', label: 'Bugün' }, { id: 'bolumler', label: 'Bölümler' },
];

// Alt sahne akordeon sekmeleri (v4 kaynak buildAccordion) — aynı anda tek panel açık
type AccKey = 'todo' | 'mood' | 'yogunluk' | 'sureklilik' | 'yansima';
const ACC_TABS: { k: AccKey; label: string; plabel: string; icon: React.ReactNode }[] = [
  { k: 'todo', label: 'Yapılacaklar', plabel: 'Bugün yapılacaklar', icon: <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4.2" /><path d="M8.5 12.4l2.4 2.4 4.6-4.9" /></svg> },
  { k: 'mood', label: 'Ruh Halin', plabel: 'Ruh hali check-in', icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4" /><path d="M8.4 14.2s1.3 1.9 3.6 1.9 3.6-1.9 3.6-1.9" /><path d="M9 10h.01M15 10h.01" /></svg> },
  { k: 'yogunluk', label: 'Yoğunluk', plabel: 'Ne kadar yoğunsun?', icon: <svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V5M19 20v-6" /></svg> },
  { k: 'sureklilik', label: 'Süreklilik', plabel: 'Seans devamlılığı', icon: <svg viewBox="0 0 24 24"><path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" /><path d="M20.5 4.2V9h-4.8" /></svg> },
  { k: 'yansima', label: 'Yansıma', plabel: 'Yansıma defteri', icon: <svg viewBox="0 0 24 24"><path d="M12 20h8.5" /><path d="M16.4 4.1a1.9 1.9 0 0 1 2.7 2.7L7.6 18.3l-3.6.9.9-3.6z" /></svg> },
];

export default function AnaSayfaV3({ data, staleClients, onSetClientStatus, onOpenFile, onNav, onOpenProfile, onMarkSession, onSaveWellbeing, onSaveReflection }: AnaSayfaV3Props) {
  const D = data;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Seans durumları (gerçek saate göre, mount sonrası) ──
  const { sorted, nextSession } = useMemo(() => {
    const list = D.sessions.map((s) => ({ ...s, _min: minutesOf(s.time) }));
    list.sort((a, b) => a._min - b._min);
    const nowMin = mounted ? new Date().getHours() * 60 + new Date().getMinutes() : -1;
    let nextSet = false;
    list.forEach((s) => {
      if (s.status) { if (s.status === 'next') nextSet = true; return; } // page'ten geldiyse koru
      if (mounted && s._min < nowMin) s.status = 'past';
      else if (!nextSet) { s.status = 'next'; nextSet = true; }
      else s.status = 'upcoming';
    });
    return { sorted: list, nextSession: list.find((s) => s.status === 'next') ?? null };
  }, [D.sessions, mounted]);
  const sessionCount = D.sessions.length;

  // ── Tema rengi (data-bg) ──
  const [theme, setTheme] = useState<string>(() => lsGet('calmie_home_bgtheme') || 'default');
  const [themePreview, setThemePreview] = useState<string | null>(null);
  const effTheme = themePreview ?? theme;
  const commitTheme = (v: string) => { setTheme(v); setThemePreview(null); try { localStorage.setItem('calmie_home_bgtheme', v); } catch {} };

  // ── Arkaplan stili + foto ──
  // v4: "Stil" düğmesi ve stil presetleri kaldırıldı → arkaplan işleme hep "orijinal".
  // Arkaplan görseli yalnızca hero'ya sürükle-bırak ile değişir; tema bg-pick noktalarıyla.
  const bgStyle = 'orijinal';
  const [bgPhoto, setBgPhoto] = useState<string | null>(() => lsGet('siyi_home_bg_v1'));
  const [dragOver, setDragOver] = useState(false);
  const loadBg = (f?: File | null) => {
    if (!f || f.type.indexOf('image/') !== 0) return;
    const rd = new FileReader();
    rd.onload = () => {
      const im = new Image();
      im.onload = () => {
        const long = Math.max(im.width, im.height); const target = Math.min(2600, Math.max(long, 1600));
        const sc = target / long; const w = Math.round(im.width * sc), h = Math.round(im.height * sc);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const cx = c.getContext('2d'); if (!cx) return; cx.imageSmoothingEnabled = true; (cx as any).imageSmoothingQuality = 'high'; cx.drawImage(im, 0, 0, w, h);
        let out = ''; for (const q of [0.9, 0.84, 0.76]) { try { out = c.toDataURL('image/jpeg', q); localStorage.setItem('siyi_home_bg_v1', out); break; } catch {} }
        if (out) setBgPhoto(out);
      };
      im.src = String(rd.result);
    };
    rd.readAsDataURL(f);
  };
  const st = STYLES[bgStyle] ?? STYLES.orijinal;
  const heroBgStyle: React.CSSProperties = {
    ['--bg-filter' as any]: st.filter, ['--bg-grade' as any]: st.grade, ['--bg-grade-op' as any]: st.gradeOp,
    ['--bg-vig-op' as any]: st.vigOp, ['--bg-grain-op' as any]: st.grainOp, ['--bg-scrim-op' as any]: st.scrimOp ?? 1,
  };

  // ── Avatar ──
  const [avatar, setAvatar] = useState<string | null>(() => lsGet('siyi_profil_foto'));
  const avFileRef = useRef<HTMLInputElement>(null);
  const onAvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { const im = new Image(); im.onload = () => {
      const M = 256, s = Math.min(M / im.width, M / im.height, 1); const w = Math.round(im.width * s), h = Math.round(im.height * s);
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d')?.drawImage(im, 0, 0, w, h);
      const out = c.toDataURL('image/jpeg', 0.86); setAvatar(out); try { localStorage.setItem('siyi_profil_foto', out); } catch {}
    }; im.src = String(rd.result); };
    rd.readAsDataURL(f); e.target.value = '';
  };

  // ── Haftalık çalışma saati ──
  const [whManual, setWhManual] = useState<string | null>(null);
  const [whEditing, setWhEditing] = useState(false);
  const [whDraft, setWhDraft] = useState('');
  useEffect(() => { try { const v = localStorage.getItem('home-weekly-hours'); if (v != null) setWhManual(v); } catch {} }, []);
  const whEst = Math.round(D.weekly.sessionsThisWeek * 50 / 60);
  const whVal = (whManual != null && whManual !== '') ? whManual : String(whEst);
  const commitWh = (save: boolean) => {
    if (save) { let v = parseInt(whDraft, 10); if (isNaN(v)) v = 0; v = Math.max(0, Math.min(168, v)); setWhManual(String(v)); try { localStorage.setItem('home-weekly-hours', String(v)); } catch {} }
    setWhEditing(false);
  };

  // ── Yoğunluk segmenti ──
  const [intView, setIntView] = useState<'week' | 'month' | 'year'>(D.intensity.active);
  const intD = D.intensity[intView];
  const intMax = Math.max(1, ...intD.bars.map((b) => b.v));

  // ── Seans işaretleme ──
  const [marks, setMarks] = useState<Record<string, 'done' | 'late' | 'cancel' | undefined>>(() => {
    const m: Record<string, any> = {}; D.sessions.forEach((s) => { if (s.mark) m[s.file] = s.mark; }); return m;
  });
  const toggleMark = (s: V3Session, k: 'done' | 'late' | 'cancel') => {
    setMarks((prev) => { const nx = prev[s.file] === k ? undefined : k; onMarkSession?.(s.file, nx ?? null, s); return { ...prev, [s.file]: nx }; });
  };

  // ── Yapılacaklar ──
  const baseTodos = useMemo(() => {
    const arr: { id: string; text: string; tag: string; when: string }[] = sorted.map((s, i) => ({ id: 's-' + (s.file || i), text: `${s.who} (${s.time}) — briefing'i gözden geçir`, tag: 'Seans', when: `${s.time} öncesi` }));
    if (D.drop.count > 0) arr.push({ id: 'drop', text: `Drop riski: ${D.drop.count} danışanı izle / ara`, tag: 'Takip', when: 'Bugün' });
    arr.push({ id: 'brief', text: 'Günü özetle — günlük randevu briefing\'ini incele', tag: 'Özet', when: 'Gün sonu' });
    return arr;
  }, [sorted, D.drop.count]);
  // İş durumları: yapıldı/ertelendi/yapılmayacak — gün başına localStorage (profil "iş tamamlama" çizelgesi bunları okur)
  const [todoStatus, setTodoStatusState] = useState<Record<string, TodoStatus | undefined>>({});
  const [customTodos, setCustomTodos] = useState<{ id: string; text: string }[]>([]);
  const [newTodo, setNewTodo] = useState('');
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('home-todos-' + dayKey()) || '{}');
      const { custom, _total, ...rest } = raw;
      const st: Record<string, TodoStatus> = {};
      Object.entries(rest).forEach(([k, v]) => { st[k] = (v === 'late' || v === 'skip') ? v : 'done'; }); // eski boolean true → 'done'
      setTodoStatusState(st); setCustomTodos(Array.isArray(custom) ? custom : []);
    } catch {}
  }, [mounted]);
  const allTodos = [...baseTodos, ...customTodos.map((c) => ({ id: c.id, text: c.text, tag: 'Serbest', when: 'Bugün' }))];
  const persistTodos = (st: Record<string, TodoStatus | undefined>, custom: { id: string; text: string }[]) => {
    try {
      const clean: Record<string, TodoStatus> = {};
      Object.entries(st).forEach(([k, v]) => { if (v) clean[k] = v; });
      // _total: o günün toplam iş sayısı (çizelgede tamamlama oranı için)
      localStorage.setItem('home-todos-' + dayKey(), JSON.stringify({ ...clean, custom, _total: baseTodos.length + custom.length }));
    } catch {}
  };
  const setTodoStatus = (id: string, status: TodoStatus) => setTodoStatusState((p) => { const nx = { ...p }; if (nx[id] === status) delete nx[id]; else nx[id] = status; persistTodos(nx, customTodos); return nx; });
  const toggleTodo = (id: string) => setTodoStatus(id, 'done');
  const addTodo = () => { const v = newTodo.trim(); if (!v) return; const nc = [...customTodos, { id: 'c-' + Date.now(), text: v }]; setCustomTodos(nc); persistTodos(todoStatus, nc); setNewTodo(''); };
  const todoDoneCount = allTodos.filter((t) => todoStatus[t.id] === 'done').length;

  // ── Gecikmiş danışan (zorunlu) görevleri — aktif/pasif kararı verilene dek kapanmaz ──
  // Aktif danışan, kendi sıklığını aşan süredir gelmemiş + randevusu yoksa burada belirir.
  const STALE_ACK_KEY = 'home-stale-ack';
  const [staleAck, setStaleAck] = useState<Record<string, string>>({});
  useEffect(() => { try { setStaleAck(JSON.parse(localStorage.getItem(STALE_ACK_KEY) || '{}')); } catch {} }, [mounted]);
  const staleList = (staleClients ?? []).filter((s) => staleAck[s.id] !== (s.lastSession || '1'));
  const resolveStale = (s: V3StaleClient, status: 'active' | 'passive') => {
    setStaleAck((p) => { const nx = { ...p, [s.id]: s.lastSession || '1' }; try { localStorage.setItem(STALE_ACK_KEY, JSON.stringify(nx)); } catch {} return nx; });
    onSetClientStatus?.(s.id, status);
  };
  const fmtShort = (iso: string) => { try { return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }); } catch { return iso; } };

  // ── İyilik hali — sürüklenen 1-10 ölçer + not modalı (gün başına tek kayıt, upsert) ──
  const [wbScore, setWbScore] = useState<number | null>(null);
  const [wbNote, setWbNote] = useState('');
  const [wbSaved, setWbSaved] = useState(false);
  const [wbSaving, setWbSaving] = useState(false);
  const [wbDragging, setWbDragging] = useState(false);
  const [wbModal, setWbModal] = useState(false);
  const wbTrackRef = useRef<HTMLDivElement>(null);
  const wbScoreRef = useRef<number | null>(null);
  const wbCommitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bugünki check-in'i yükle (varsa skor + not önceden gelir)
  useEffect(() => {
    fetch('/api/reflections?type=check-in&limit=1')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        const last = Array.isArray(rows) ? rows[0] : null;
        if (!last || !last.created_at) return;
        const d = new Date(String(last.created_at).replace(' ', 'T') + 'Z'); const n = new Date();
        if (d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()) {
          if (last.score != null) { setWbScore(Number(last.score)); wbScoreRef.current = Number(last.score); }
          if (last.body) setWbNote(String(last.body));
        }
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!wbModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setWbModal(false); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [wbModal]);
  const commitWb = async (score: number | null, note: string) => {
    if (score == null) return;
    setWbSaving(true);
    try { await onSaveWellbeing?.(score, note.trim()); setWbSaved(true); } catch {} finally { setWbSaving(false); }
  };
  const commitWbDebounced = (score: number | null, note: string) => {
    if (wbCommitTimer.current) clearTimeout(wbCommitTimer.current);
    wbCommitTimer.current = setTimeout(() => commitWb(score, note), 400);
  };
  const wbSetScore = (v: number) => { const s = Math.max(1, Math.min(10, v)); wbScoreRef.current = s; setWbScore(s); setWbSaved(false); };
  const wbValFromX = (clientX: number) => { const el = wbTrackRef.current; if (!el) return wbScore ?? 5; const r = el.getBoundingClientRect(); let t = (clientX - r.left) / r.width; t = Math.max(0, Math.min(1, t)); return Math.round(t * 9) + 1; };
  const wbPos = (((wbScore == null ? 5 : wbScore) - 1) / 9) * 100;
  const onWbDown = (e: React.PointerEvent) => { setWbDragging(true); try { wbTrackRef.current?.setPointerCapture(e.pointerId); } catch {} wbSetScore(wbValFromX(e.clientX)); e.preventDefault(); };
  const onWbMove = (e: React.PointerEvent) => { if (!wbDragging) return; wbSetScore(wbValFromX(e.clientX)); };
  const onWbUp = () => { if (!wbDragging) return; setWbDragging(false); commitWb(wbScoreRef.current, wbNote); };
  const onWbKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { wbSetScore((wbScore ?? 5) - 1); commitWbDebounced(wbScoreRef.current, wbNote); e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { wbSetScore((wbScore ?? 5) + 1); commitWbDebounced(wbScoreRef.current, wbNote); e.preventDefault(); }
  };
  const saveWbNote = async () => { await commitWb(wbScore ?? wbScoreRef.current, wbNote); setTimeout(() => setWbModal(false), 650); };

  // ── Yansıma ──
  const [reflList, setReflList] = useState(D.reflections);
  const [rfFark, setRfFark] = useState('');
  const [rfKlinik, setRfKlinik] = useState('');
  useEffect(() => { setReflList(D.reflections); }, [D.reflections]);
  const saveRefl = () => {
    const fark = rfFark.trim(), klinik = rfKlinik.trim(); if (!fark && !klinik) return;
    setReflList((p) => [{ date: 'Bugün · ' + (D.dateFull.split('· ')[1] ?? ''), fark, klinik }, ...p]);
    onSaveReflection?.(fark, klinik); setRfFark(''); setRfKlinik('');
  };

  // ── Akordeon (alt sahne tek-panel menüsü) ──
  const [accOpen, setAccOpen] = useState<AccKey | null>('todo');

  // ── Modal ──
  const [modal, setModal] = useState<null | 'continuity'>(null);
  useEffect(() => { if (!modal) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [modal]);

  // ── Scroll-spy ──
  const [activeRail, setActiveRail] = useState('bugun');
  useEffect(() => {
    const root = scrollRef.current; if (!root) return;
    const secs = Array.from(root.querySelectorAll('#bugun, .main .section')) as HTMLElement[];
    const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) setActiveRail((e.target as HTMLElement).id); }), { root, rootMargin: '-12% 0px -78% 0px', threshold: 0 });
    secs.forEach((s) => io.observe(s)); return () => io.disconnect();
  }, [mounted]);
  const scrollTo = (id: string) => { const root = scrollRef.current; const el = root?.querySelector('#' + id) as HTMLElement | null; if (root && el) root.scrollTo({ top: el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 4, behavior: 'smooth' }); };

  // ── Dock glider (aktif/hover sekmeye kayan beyaz pill) ──
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

  // ── Akış detay modali (seanslar / yapılacaklar) ──
  const [akModal, setAkModal] = useState<null | 'seans' | 'todo'>(null);
  useEffect(() => {
    if (!akModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAkModal(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [akModal]);

  const greetHour = mounted ? new Date().getHours() : -1;
  const greetWord = !mounted ? 'Merhaba'
    : greetHour < 5 ? 'İyi geceler'
    : greetHour < 12 ? 'Günaydın'
    : greetHour < 18 ? 'İyi günler'
    : greetHour < 22 ? 'İyi akşamlar'
    : 'İyi geceler';
  const deckList = nextSession ? [nextSession, ...sorted.filter((s) => s !== nextSession)] : sorted.slice();
  const shown = deckList.slice(0, 3);
  const C = D.continuity;
  const histMax = Math.max(1, ...C.histogram.map((h) => h.n));
  // §2 — Halka (donut) grafik: boş seans-kovaları elenir, monokrom greige rampa, dilim yolu.
  const contBins = C.histogram.filter((h) => h.n > 0);
  const contTotal = contBins.reduce((s, h) => s + h.n, 0) || 1;
  const VIZ_STOPS = [[44, 40, 34], [74, 68, 59], [104, 97, 85], [134, 126, 112], [164, 156, 140], [190, 182, 166]];
  const vizRamp = (t: number) => { const seg = t * (VIZ_STOPS.length - 1); const i = Math.min(Math.floor(seg), VIZ_STOPS.length - 2); const f = seg - i; const a = VIZ_STOPS[i], b = VIZ_STOPS[i + 1]; const c = a.map((v, k) => Math.round(v + (b[k] - v) * f)); return `rgb(${c[0]},${c[1]},${c[2]})`; };
  const D_R = 128, D_RI = 80, D_CX = 150, D_CY = 150;
  const polar = (r: number, deg: number) => { const a = (deg - 90) * Math.PI / 180; return [(D_CX + r * Math.cos(a)).toFixed(2), (D_CY + r * Math.sin(a)).toFixed(2)]; };
  const arcPath = (s: number, e: number) => { const [x1, y1] = polar(D_R, s), [x2, y2] = polar(D_R, e), [x3, y3] = polar(D_RI, e), [x4, y4] = polar(D_RI, s); const lg = (e - s) > 180 ? 1 : 0; return `M${x1} ${y1} A${D_R} ${D_R} 0 ${lg} 1 ${x2} ${y2} L${x3} ${y3} A${D_RI} ${D_RI} 0 ${lg} 0 ${x4} ${y4} Z`; };
  let _acc = 0;
  const slices = contBins.map((h, i) => { const fr = h.n / contTotal; const s = _acc * 360, e = (_acc + fr) * 360; _acc += fr; const t = contBins.length > 1 ? i / (contBins.length - 1) : 0; return { k: h.k, n: h.n, pct: Math.round(fr * 100), color: vizRamp(t), path: arcPath(s, e >= 360 ? 359.99 : e) }; });
  // Özet rapor notları — tümü veriden türetilir
  const binN = (k: string) => (contBins.find((h) => h.k === k)?.n ?? 0);
  const sumK = (ks: string[]) => contBins.filter((h) => ks.includes(h.k)).reduce((s, h) => s + h.n, 0);
  const earlyN = sumK(['1', '2', '3']), earlyPct = Math.round(earlyN / contTotal * 100);
  const earlyPeak = ['1', '2', '3'].map((k) => ({ k, n: binN(k) })).reduce((m, x) => x.n > m.n ? x : m, { k: '', n: 0 });
  const midPct = Math.round(sumK(['4', '5']) / contTotal * 100);
  const deepPct = Math.round(sumK(['6', '7', '8', '9', '10+']) / contTotal * 100);
  const loyalPct = Math.round(binN('10+') / contTotal * 100);
  const contNotes = [
    { i: '01', t: 'Erken ayrılma penceresi', b: <>Danışanların <b>%{earlyPct}'i</b> ({earlyN} danışan) süreci ilk üç seansta sonlandırıyor; en yoğun ayrılma <b>{earlyPeak.k}. seansta</b> ({earlyPeak.n} danışan) yaşanıyor. Terapötik bağın henüz kurulduğu bu dönem, sürecin en kırılgan eşiği.</> },
    { i: '02', t: 'Süreklilik eşiği', b: <>Medyan <b>{C.median} seans</b>. Bu eşiği aşan danışanlar belirgin biçimde kalıcılaşıyor; dördüncü–beşinci seanstaki <b>%{midPct}</b>'lik kesim, sürecin yön bulduğu geçiş bölgesini oluşturuyor.</> },
    { i: '03', t: 'Sadık çekirdek', b: <>Danışanların <b>%{deepPct}'i</b> altı seans ve üzerini tamamlıyor. <b>%{loyalPct}</b>'lik bir çekirdek 10+ seansa devam ederek ortalama seans sayısını <b>{C.avg}</b>'e taşıyor.</> },
  ];

  const DOCK = [
    { l: 'Ana Sayfa', t: 'home', active: true },
    { l: 'Çalışma Alanı', t: 'calisma-alani' },
    { l: 'Profil', t: 'terapist' },
    { l: 'Ayarlar', t: 'ayarlar' },
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={FONTS} rel="stylesheet" />

      <div className="asv3" data-bg={effTheme === 'default' ? undefined : effTheme}>
        {/* gizli SVG filtre */}
        <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute', pointerEvents: 'none' }}>
          <filter id="liquidLens" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.013" numOctaves={2} seed={9} result="noise" />
            <feGaussianBlur in="noise" stdDeviation="1.4" result="soft" />
            <feDisplacementMap in="SourceGraphic" in2="soft" scale={26} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        <div className="shell">
          {/* ÜST BAR */}
          <div className="topbar">
            <div className="brand"><span className="logo"><b>Calmie</b><i>.</i></span></div>
            <nav className="dock" aria-label="Bölümler" ref={dockRef} onMouseLeave={() => moveGlider(activeLink())}>
              <span className="dock-glider" ref={gliderRef} aria-hidden="true" />
              {DOCK.map((d) => (
                <a key={d.t} href="#" className={d.active ? 'active' : ''} onMouseEnter={(e) => moveGlider(e.currentTarget)} onClick={(e) => { e.preventDefault(); if (!d.active) onNav?.(d.t); }}>{d.l}</a>
              ))}
            </nav>
            <div className="topbar-right">
              <div className="tb-prof">
                <div className="nm-col">
                  <span className="pro-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.3L21 9l-4.8 4.3L17.6 22 12 18.4 6.4 22l1.4-8.7L3 9l6.4-.7z" /></svg>PRO</span>
                  <button type="button" className="nm" onClick={() => onOpenProfile?.()}>{D.therapist.full}</button>
                </div>
                <button type="button" className="av" title="Profil fotoğrafını değiştir" aria-label="Profil fotoğrafını değiştir" onClick={() => avFileRef.current?.click()}>
                  <img src={avatar || DEFAULT_AV} alt={D.therapist.full} />
                  <span className="cam" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="13" r="3.2" /></svg></span>
                </button>
                <input type="file" ref={avFileRef} accept="image/*" hidden onChange={onAvFile} />
              </div>
            </div>
          </div>

          <div className="modal-body" id="modalBody" ref={scrollRef}>

            {/* HERO */}
            <section className={'hero' + (dragOver ? ' dragover' : '')} id="bugun" data-bg={effTheme === 'default' ? undefined : effTheme} data-screen-label="Ana Sayfa — Karşılama"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={(e) => { if (e.target === e.currentTarget) setDragOver(false); }}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); loadBg(e.dataTransfer.files?.[0]); }}>
              <div className="hero-bg" aria-hidden="true" style={heroBgStyle}>
                <span className="hb-mesh" />
                <svg className="hb-lines" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <g fill="none" strokeLinecap="round">
                    <path d="M-160,700 C180,640 360,420 760,400 1160,380 1300,180 1760,140" stroke="rgba(255,255,255,.1)" strokeWidth="90" />
                    <path d="M-160,920 C300,860 520,620 900,580 1280,540 1480,420 1780,330" stroke="rgba(255,255,255,.07)" strokeWidth="130" />
                    <path d="M-120,640 C260,520 520,468 800,372 1120,262 1360,214 1780,128" stroke="rgba(255,255,255,.34)" strokeWidth="3.4" />
                    <path d="M-120,772 C300,648 580,556 880,470 1180,384 1420,318 1780,250" stroke="rgba(255,255,255,.24)" strokeWidth="5.5" />
                    <path d="M-120,884 C340,760 640,672 940,584 1220,500 1460,432 1780,372" stroke="rgba(255,255,255,.16)" strokeWidth="8" />
                    <path d="M-140,520 C160,560 420,360 700,420 980,480 1240,300 1480,360 1620,395 1700,330 1800,300" stroke="rgba(255,255,255,.2)" strokeWidth="2.6" />
                    <path d="M-120,556 C240,452 520,408 820,316 1100,232 1380,196 1780,96" stroke="rgba(96,26,62,.3)" strokeWidth="3" />
                    <path d="M-120,712 C320,600 600,520 900,430 1180,346 1440,288 1780,210" stroke="rgba(96,26,62,.2)" strokeWidth="5" />
                    <path d="M200,980 C420,760 380,560 640,470 900,380 980,200 1240,170 1420,150 1540,60 1620,-40" stroke="rgba(255,255,255,.18)" strokeWidth="4.5" />
                  </g>
                </svg>
                <img className="hb-photo" alt="" src={bgPhoto || DEFAULT_BG} />
                {/* Cherry & night blue — v4 §1: foto değil, saf CSS çok-radyal mesh (asset yok) */}
                <span className="hb-cherry" /><span className="hb-cherry-scrim" />
                <img className="hb-fur" alt="" src="/tema-kurk.jpg" /><span className="hb-fur-scrim" />
                <span className="hb-tint" /><span className="hb-grade" /><span className="hb-vignette" /><span className="hb-grain" /><span className="hb-scrim" />
              </div>
              <div className="hero-drop" aria-hidden="true"><div className="box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 15V4m0 0L8 8m4-4l4 4" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
                Görseli buraya bırak
              </div></div>

              {/* HERO SAHNESİ */}
              <div className="hero-scene">
                <div className="hs-grid">
                  <div className="hs-left">
                    <div className="hl">
                      <h1 className="hl-head">{greetWord}, {D.therapist.name}.</h1>
                      <p className="hl-lead">Sen seanslarına odaklan diye, ihtiyacın duyduğun her şey tek ekranda.</p>
                    </div>
                  </div>
                  <div className="hs-right">
                    {/* SEANS DESTESİ */}
                    <div className="nx">
                      <div className="nx-main" role="button" tabIndex={0} aria-label="Bugünün seanslarına git" onClick={() => scrollTo('akis')}>
                        <span className="nx-date">{D.dateFull}</span>
                        <span className="nx-eye">{shown.length ? `Sıradaki · ${shown.length} seans` : 'seans akışı'}</span>
                        <h3 className="nx-head">Bugünün<br />seansları</h3>
                        <span className="nx-wh" role="button" tabIndex={0} aria-label="Haftalık çalışma saatini düzenle"
                          onClick={(e) => { e.stopPropagation(); if (!whEditing) { setWhDraft(whVal); setWhEditing(true); } }}>
                          <span className="nx-wh-eye">Haftalık çalışma</span>
                          <span className="nx-wh-foot">
                            <span className="wh-main">
                              {whEditing ? (
                                <input className="wh-input num" type="number" min={0} max={168} autoFocus value={whDraft}
                                  onClick={(e) => e.stopPropagation()} onChange={(e) => setWhDraft(e.target.value)}
                                  onBlur={() => commitWh(true)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitWh(true); } else if (e.key === 'Escape') { e.preventDefault(); commitWh(false); } }} />
                              ) : <span className="wh-num num">{whVal}</span>}
                              <span className="wh-unit">saat</span>
                            </span>
                          </span>
                        </span>
                      </div>
                      {shown.length ? (
                        <div className="nx-pops" onClick={() => onOpenFile?.(shown[0].file, shown[0].who)}>
                          {shown.map((s, i) => (
                            <button type="button" className="nx-pop" key={s.file + i} style={{ ['--idx' as any]: i, zIndex: 30 - i }}
                              onClick={(e) => { e.stopPropagation(); onOpenFile?.(s.file, s.who); }}>
                              <span className="nx-pop-top"><span className="nx-pop-name">{s.who}</span><span className="nx-pop-time"><b className="num">{s.time}</b><span>{i === 0 ? 'Sıradaki' : `${s.no}. seans`}</span></span></span>
                              <span className="nx-pop-sub">{s.topic}</span>
                              <span className="nx-pop-foot"><span className="nx-pill">Dosyayı gör <Arrow /></span></span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="nx-empty" aria-label="Bugün seans yok">
                          <span className="nx-empty-ic"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 9h18M8 3v4M16 3v4" /><path d="M9.5 15.5l2 2 3.5-4" /></svg></span>
                          <span className="nx-empty-t">Bugün seans yok</span>
                          <span className="nx-empty-s">Takvimde bugüne randevu görünmüyor.</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              <div className="selv-mark" aria-hidden="true">Calmie<span className="dot">.<span className="cal-tag"><span>Klinik</span><span>Asistan</span></span></span></div>

              <div className="bg-pick" role="group" aria-label="Arka plan rengi" onMouseLeave={() => setThemePreview(null)}>
                {THEMES.map((t) => (
                  <button key={t.k} type="button" className={`bgsw${theme === t.k ? ' on' : ''}`} style={{ ['--sw' as any]: t.sw }} title={t.t} aria-label={t.t}
                    onMouseEnter={() => setThemePreview(t.k)} onClick={() => commitTheme(t.k)} />
                ))}
              </div>
            </section>

            {/* ALT SAHNE */}
            <main className="main">

              {/* ALT SAHNE — AKORDEON MENÜ (tek panel açık) */}
              <section className="section acc-section" id="bolumler" data-screen-label="Bugün neler çalışman gerekiyor">
                <div className="sec-head">
                  <div className="l"><span className="eyebrow">yapılacaklar · ruh halin</span>
                    <h2 className="sec-title">Bugün neler <i>çalışman</i> gerekiyor?</h2></div>
                  <p className="sec-aside">{todoDoneCount}/{allTodos.length} iş tamamlandı</p>
                </div>

                <div className="acc-pick">
                  <span className="lbl">Bölümler</span>
                  <p>Bir bölüme dokun, aşağıda açılsın.</p>
                  <div className="acc-btns">
                    {ACC_TABS.map((t) => (
                      <button key={t.k} type="button" className={`acc-btn${accOpen === t.k ? ' on' : ''}`} aria-pressed={accOpen === t.k}
                        onClick={() => setAccOpen(accOpen === t.k ? null : t.k)}>{t.icon}<span>{t.label}</span></button>
                    ))}
                  </div>
                </div>

                <div className="acc-stack">

                {/* ── TODO PANELİ ── */}
                <div className="acc-panel" data-k="todo" hidden={accOpen !== 'todo'}>
                  <div className="acc-phead"><span className="acc-plabel">Bugün yapılacaklar</span><span className="acc-pact" /></div>
                  <div className="acc-body">
                  <div className="todo-cardwrap" id="todoTimeline">
                    {staleList.length > 0 && (
                      <div className="must-wrap">
                        <div className="must-head">
                          <span className="must-head-bang">!</span>
                          <span className="must-head-text"><b>{staleList.length} danışan dosyası</b> karar bekliyor</span>
                        </div>
                        {staleList.slice(0, 2).map((s) => (
                          <div className="tl-must" key={'stale-' + s.id}>
                            <span className="tc-body">
                              <span className="tl-must-name">{s.name}</span>
                              <span className="tl-must-meta">{s.daysSince} gündür randevu yok · ~{s.intervalDays} günde bir gelir · son seans {fmtShort(s.lastSession)}</span>
                              <div className="tl-must-acts">
                                <button type="button" className="must-active" onClick={() => resolveStale(s, 'active')}>Aktif · devam ediyor</button>
                                <button type="button" className="must-passive" onClick={() => resolveStale(s, 'passive')}>Pasif · geçmişe al</button>
                              </div>
                            </span>
                            <span className="tl-must-bang" aria-label="karar bekliyor">!</span>
                          </div>
                        ))}
                        {staleList.length > 2 && <div className="must-more">+{staleList.length - 2} dosya daha karar bekliyor</div>}
                      </div>
                    )}
                    {allTodos.length ? (
                      <div className="todo-cards">
                        {allTodos.map((t) => {
                          const stt = todoStatus[t.id];
                          const cls = stt === 'done' ? ' done' : stt === 'late' ? ' s-late' : stt === 'skip' ? ' s-skip' : '';
                          return (
                            <div key={t.id} className={`todo-card${cls}${t.tag === 'Takip' ? ' alert' : ''}`} data-id={t.id}
                              role="button" tabIndex={0} aria-pressed={stt === 'done'}
                              onClick={() => setTodoStatus(t.id, 'done')}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTodoStatus(t.id, 'done'); } }}>
                              <span className="tc-check"><svg className="tc-checkmark" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" /></svg></span>
                              <span className="tc-body">
                                <span className="tc-text">{t.text}</span>
                                <span className="tc-meta"><span className="tc-tag">{t.tag}</span><span className="tc-when">{stt ? TODO_LABEL[stt] : t.when}</span></span>
                                <span className="tc-status" role="group" aria-label="İş durumu">
                                  {(['done', 'late', 'skip'] as const).map((k) => (
                                    <button key={k} type="button" className={`m-${k}${stt === k ? ' on' : ''}`} aria-pressed={stt === k}
                                      onClick={(e) => { e.stopPropagation(); setTodoStatus(t.id, k); }}>{TODO_LABEL[k]}</button>
                                  ))}
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : <div className="tl-empty">Bugün için planlı iş yok.</div>}
                    <div className="tl-add"><div className="tl-add-inner">
                      <input type="text" placeholder="yeni iş ekle…" autoComplete="off" value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTodo(); } }} />
                      <button type="button" aria-label="İş ekle" onClick={addTodo}>+</button>
                    </div></div>
                  </div>
                  </div>
                </div>

                {/* ── RUH HALİ PANELİ ── */}
                <div className="acc-panel" data-k="mood" hidden={accOpen !== 'mood'}>
                  <div className="acc-phead"><span className="acc-plabel">Ruh hali check-in</span><span className="acc-pact" /></div>
                  <div className="acc-body">
                  <div className="akis-card akis-wb wb-card" id="checkin" data-screen-label="Kendi iyilik halini izle">
                    <img className="wb-photo" alt="" src={bgPhoto || DEFAULT_BG} />
                    <div className="mood-orb" aria-hidden="true">
                      <svg className="mo-sky" viewBox="0 0 220 150" fill="none">
                        <defs>
                          <radialGradient id="moSunG" cx="44%" cy="42%" r="64%">
                            <stop offset="0%" stopColor="#ED6A00" /><stop offset="55%" stopColor="#FB8E00" /><stop offset="100%" stopColor="#FFAD0A" />
                          </radialGradient>
                          <linearGradient id="moCloudG" x1="0" y1="0" x2=".55" y2="1">
                            <stop offset="0%" stopColor="#FBFCFE" /><stop offset="100%" stopColor="#E7EBF7" />
                          </linearGradient>
                          <clipPath id="moCloudC">
                            <circle cx="56" cy="98" r="30" /><circle cx="98" cy="80" r="38" /><circle cx="140" cy="100" r="28" /><rect x="26" y="96" width="142" height="34" rx="17" />
                          </clipPath>
                          <filter id="moBlurF" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14" /></filter>
                        </defs>
                        <g className="mo-rays" stroke="#FFAF25" strokeWidth="5" strokeLinecap="round" opacity=".95">
                          <path d="M190 60H200" /><path d="M184.1 82L192.8 87" /><path d="M168 98.1L173 106.8" />
                          <path d="M146 104V114" /><path d="M124 98.1L119 106.8" /><path d="M107.9 82L99.2 87" />
                          <path d="M102 60H92" /><path d="M107.9 38L99.2 33" /><path d="M124 21.9L119 13.2" />
                          <path d="M146 16V6" /><path d="M168 21.9L173 13.2" /><path d="M184.1 38L192.8 33" />
                        </g>
                        <circle cx="146" cy="60" r="38" fill="url(#moSunG)" stroke="#E88C00" strokeWidth="1.4" />
                        <g className="mo-cloudg">
                          <g clipPath="url(#moCloudC)">
                            <rect x="20" y="36" width="156" height="100" fill="url(#moCloudG)" opacity=".92" />
                            <circle cx="146" cy="66" r="50" fill="url(#moSunG)" opacity=".8" filter="url(#moBlurF)" />
                          </g>
                        </g>
                      </svg>
                    </div>
                    <h3 className="wb-title">Bugün nasılsın?</h3>
                    <div className="wb-slider">
                      <div className="wb-track" ref={wbTrackRef} onPointerDown={onWbDown} onPointerMove={onWbMove} onPointerUp={onWbUp}>
                        <div className="wb-fill" style={{ width: `${wbPos}%` }} />
                        <button type="button" className={`wb-thumb${wbDragging ? ' drag' : ''}${wbScore == null ? ' empty' : ''}`} style={{ left: `${wbPos}%` }}
                          role="slider" aria-label="Bugünkü ruh hali" aria-valuemin={1} aria-valuemax={10} aria-valuenow={wbScore ?? undefined} onKeyDown={onWbKey}>
                          <span className="wb-val">{wbScore == null ? '·' : wbScore}</span>
                        </button>
                      </div>
                    </div>
                    <div className="wb-ends"><span>çok zor</span><span>çok iyi</span></div>
                    <button type="button" className={`wb-note-btn${wbNote.trim() ? ' has' : ''}`} onClick={() => setWbModal(true)}>
                      <span className="wb-note-ic"><svg viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></span>
                      <span className="wb-note-txt">{wbNote.trim() ? wbNote.trim() : 'Not Yaz'}</span>
                      <span className="wb-note-arr"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg></span>
                    </button>
                  </div>
                  </div>
                </div>

                {/* ── YOĞUNLUK PANELİ ── */}
                <div className="acc-panel" data-k="yogunluk" hidden={accOpen !== 'yogunluk'}>
                  <div className="acc-phead"><span className="acc-plabel">Ne kadar yoğunsun?</span><span className="acc-pact" /></div>
                  <div className="acc-body">
                    <div className="hero-insights">
                      <article className="icard ins-int">
                        <div className="icard-head"><span className="icard-title">{intD.title}</span>
                          <div className="seg">
                            {(['week', 'month', 'year'] as const).map((p) => (
                              <button key={p} type="button" className={intView === p ? 'on' : ''} onClick={() => setIntView(p)}>{p === 'week' ? 'Hafta' : p === 'month' ? 'Ay' : 'Yıl'}</button>
                            ))}
                          </div>
                        </div>
                        <div className="week-total" style={{ marginTop: 14 }}><b className="num">{intD.total} seans</b>{intD.range && <span className="week-range">{intD.range}</span>}</div>
                        <div className="week-bars">
                          {intD.bars.map((b, i) => (
                            <div key={i} className={`wcol${b.today ? ' today' : ''}`}><span className="v num">{b.v}</span>
                              <span className="bar" style={{ height: `${Math.round(b.v / intMax * 100)}%` }} /><span className="l">{b.l}</span></div>
                          ))}
                        </div>
                      </article>
                    </div>
                  </div>
                </div>

                {/* ── SÜREKLİLİK PANELİ ── */}
                <div className="acc-panel" id="sureklilik" data-k="sureklilik" hidden={accOpen !== 'sureklilik'}>
                  <div className="acc-phead"><span className="acc-plabel">Seans devamlılığı</span>
                    <span className="acc-pact"><button type="button" className="sec-link" onClick={() => setModal('continuity')}>Detaylı danışan devamlılık özeti <Arrow /></button></span></div>
                  <div className="acc-body">
                {contBins.length ? (<>
                  <div className="cont-top">
                    <div className="cont-lead-col">
                      <p className="cont-lead">Geçmiş danışanlarının kaç seansa devam ettiğinin dağılımı. Halka grafik, her seans-sayısı kovasındaki danışan oranını gösterir.</p>
                      {(C.visitIntervalAll || C.visitIntervalActive) ? (
                        <div className="cont-freq">
                          <span className="cf-eye">ortalama ziyaret aralığı</span>
                          <span className="cf-row"><b className="num">{C.visitIntervalAll || '—'}</b> gün · tüm danışanlar</span>
                          <span className="cf-row"><b className="num">{C.visitIntervalActive || '—'}</b> gün · aktif danışanlar</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="cont-sum">
                      <div className="sbox"><div className="v num">{C.total}</div><div className="l">danışan</div></div>
                      <div className="sbox"><div className="v num">{C.avg}</div><div className="l">ort. seans</div></div>
                      <div className="sbox"><div className="v num">{C.median}</div><div className="l">medyan</div></div>
                    </div>
                  </div>
                  <div className="pie">
                    <div className="pie-donut">
                      <svg viewBox="0 0 300 300" className="pie-svg" role="img" aria-label="Danışanların seans-sayısı dağılımı">
                        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} className="pie-slice" />)}
                      </svg>
                      <div className="pie-center"><span className="pc-num num">{C.total}</span><span className="pc-lab">danışan</span></div>
                    </div>
                    <div className="pie-legend">
                      <div className="pl-head"><span>seans</span><span>danışan sayısı &amp; oranı</span></div>
                      {slices.map((s, i) => (
                        <div className="pl-row" key={i}>
                          <span className="pl-dot" style={{ background: s.color }} />
                          <span className="pl-k">{s.k} seans</span>
                          <span className="pl-n num">{s.n} <i>kişi</i></span>
                          <span className="pl-track"><span className="pl-fill" style={{ width: `${s.pct}%` }} /></span>
                          <span className="pl-pct num">%{s.pct}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pie-notes">
                    <div className="pn-eyebrow">özet rapor</div>
                    <div className="pn-grid">
                      {contNotes.map((n) => (
                        <div className="pn" key={n.i}><span className="pn-i num">{n.i}</span><div className="pn-c"><h4 className="pn-t">{n.t}</h4><p className="pn-b">{n.b}</p></div></div>
                      ))}
                    </div>
                  </div>
                </>) : <p className="cont-empty">Devamlılık grafiği için henüz yeterli seans verisi yok.</p>}
                  </div>
                </div>

                {/* ── YANSIMA PANELİ ── */}
                <div className="acc-panel" data-k="yansima" hidden={accOpen !== 'yansima'}>
                  <div className="acc-phead"><span className="acc-plabel">Yansıma defteri</span><span className="acc-pact" /></div>
                  <div className="acc-body">
                <div className="refl">
                  <div className="refl-form">
                    <div className="rf-field"><label>Fark ettiklerim</label>
                      <textarea placeholder="Bugün neyi fark ettin? (gözlem, öz-bakım, duygu)" value={rfFark} onChange={(e) => setRfFark(e.target.value)} /></div>
                    <div className="rf-field"><label>Klinik yansımalar</label>
                      <textarea placeholder="Vaka / süreçle ilgili klinik çıkarımların" value={rfKlinik} onChange={(e) => setRfKlinik(e.target.value)} /></div>
                    <div><button type="button" className="btn-primary" disabled={!rfFark.trim() && !rfKlinik.trim()} onClick={saveRefl}>Yansımayı kaydet</button></div>
                  </div>
                  <div>
                    <div className="refl-list-title">Geçmiş yansımalar</div>
                    <div className="refl-list">
                      {reflList.length ? reflList.map((n, i) => (
                        <article className="rnote" key={i}>
                          <div className="rn-date">{n.date}</div>
                          {n.fark && <div className="rn-seg"><div className="h">Fark ettiklerim</div><p>{n.fark}</p></div>}
                          {n.klinik && <div className="rn-seg"><div className="h">Klinik yansımalar</div><p>{n.klinik}</p></div>}
                        </article>
                      )) : <p className="refl-empty">Henüz yansıma notu yok — yukarıdan ilk notunu ekleyebilirsin.</p>}
                    </div>
                  </div>
                </div>
                  </div>
                </div>

                </div>{/* /acc-stack */}
              </section>

              {/* İYİLİK HALİ — not modalı (overlay) */}
              {wbModal && (
                <div className="wbm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setWbModal(false); }}>
                  <div className="wbm" role="dialog" aria-modal="true" aria-label="Bugüne dair not">
                    <div className="wbm-head">
                      <div className="wbm-h"><span className="s">Bugüne dair not</span><span className="h">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                      <button type="button" className="wbm-x" onClick={() => setWbModal(false)} aria-label="Kapat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                    </div>
                    <div className="wbm-body">
                      <textarea value={wbNote} maxLength={200} placeholder="Bugünü bir-iki kelimeyle anlat… ne hissettin, ne fark ettin?"
                        onChange={(e) => { setWbNote(e.target.value.slice(0, 200)); setWbSaved(false); }} />
                      <span className="wb-count">{wbNote.length} / 200</span>
                    </div>
                    <div className="wbm-foot">
                      <button type="button" className="btn-primary" onClick={saveWbNote}>{wbSaving ? 'Kaydediliyor…' : 'Kaydet'}</button>
                      <span className={`wb-saved${wbSaved ? ' show' : ''}`}>Kaydedildi · teşekkürler</span>
                    </div>
                  </div>
                </div>
              )}

            </main>
          </div>

          {/* SAĞ RAY */}
          <nav className="railnav" aria-label="Bölümler">
            {RAIL.map((it) => (
              <a key={it.id} className={`rn-item${activeRail === it.id ? ' active' : ''}`} href={`#${it.id}`} onClick={(e) => { e.preventDefault(); scrollTo(it.id); }}>
                <span className="rn-label">{it.label}</span><span className="rn-tick" />
              </a>
            ))}
          </nav>
        </div>

        {/* MODAL — akış detayı (seanslar / yapılacaklar) */}
        {akModal && (
          <div className="ak-overlay" onClick={(e) => { if (e.currentTarget === e.target) setAkModal(null); }}>
            <div className="ak-modal" role="dialog" aria-modal="true" aria-label="Detay">
              <div className="ak-head">
                <span className="s">{akModal === 'seans' ? 'Bugünün seansları' : 'Bugün yapılacaklar'}</span>
                <span className="c">{akModal === 'seans' ? `${sessionCount} seans` : `${todoDoneCount}/${allTodos.length} tamamlandı`}</span>
                <button type="button" className="ak-x" aria-label="Kapat" onClick={() => setAkModal(null)}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
              </div>
              <div className="ak-body">
                {akModal === 'seans' ? (
                  <div className="flow">
                    {sessionCount ? sorted.map((s, i) => {
                      const cls = s.status === 'next' ? ' next' : s.status === 'past' ? ' past' : '';
                      const mk = marks[s.file];
                      return (
                        <div key={s.file + i}>
                          <div className={`frow${cls}${mk === 'cancel' ? ' canceled' : ''}`} role="button" tabIndex={0} onClick={() => onOpenFile?.(s.file, s.who)}>
                            <div className="ft"><span className="ft-time num">{s.time}</span><span className="ft-no">{s.no}. seans</span></div>
                            <div className="fmid">
                              <div className="fname">{s.who}{s.status === 'next' && <span className="fbadge">Sıradaki</span>}</div>
                              <div className="ftopic">{s.topic}</div>
                            </div>
                            <div className="fend"><span className="fmod">{s.mod.join(' · ')}</span><span className="farr" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span></div>
                          </div>
                          {s.status === 'past' && (
                            <div className="fmark" onClick={(e) => e.stopPropagation()}>
                              <span className="lbl">Saati geçti — bu seans:</span>
                              <div className="opts">{(['done', 'late', 'cancel'] as const).map((k) => (
                                <button key={k} type="button" className={mk === k ? 'on' : ''} onClick={() => toggleMark(s, k)}><span className="d" />{MARK_LABEL[k]}</button>
                              ))}</div>
                            </div>
                          )}
                        </div>
                      );
                    }) : <div className="flow-empty">Bugün için takvimde randevu yok.</div>}
                  </div>
                ) : (
                  <>
                    <div className="todos">
                      {allTodos.length ? allTodos.map((t) => (
                        <button key={t.id} type="button" className={`trow${todoStatus[t.id] === 'done' ? ' done' : ''}`} aria-pressed={todoStatus[t.id] === 'done'} onClick={() => toggleTodo(t.id)}>
                          <span className="tk" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" /></svg></span>
                          <span className="tx">{t.text}</span>
                          <span className="tmeta"><span className="ttag">{t.tag}</span><span className="twhen">{t.when}</span></span>
                        </button>
                      )) : <div className="flow-empty">Bugün için planlı iş yok.</div>}
                    </div>
                    <div className="todo-add">
                      <input type="text" placeholder="Yeni iş ekle…" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTodo(); }} />
                      <button type="button" aria-label="Ekle" onClick={addTodo}><svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" /></svg></button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL — devamlılık */}
        <div className={`scrim${modal ? ' show' : ''}`} aria-hidden={!modal} onClick={(e) => { if (e.currentTarget === e.target) setModal(null); }}>
          {modal === 'continuity' && (
            <div className="mcard">
              <div className="mc-top"><h3 className="mc-title">Danışan devamlılık özeti</h3>
                <button type="button" className="mc-x" aria-label="Kapat" onClick={() => setModal(null)}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>
              <div className="mc-sum q4">
                <div className="mc-box"><div className="v num">{C.total}</div><div className="l">toplam danışan</div></div>
                <div className="mc-box"><div className="v num">{C.avg}</div><div className="l">ortalama seans</div></div>
                <div className="mc-box"><div className="v num">{C.median}</div><div className="l">medyan</div></div>
                <div className="mc-box"><div className="v num">{C.longest}</div><div className="l">en uzun süreç</div></div>
              </div>
              <div className="mc-note">En çok bırakma <b>{C.dropoutInsight}</b> sonra yaşanıyor.</div>
              <div className="mc-sect"><div className="sh">Seans sayısı dağılımı</div>
                {C.histogram.map((h, i) => (
                  <div className="mc-bar" key={i}><span className="nm">{h.k} seans</span>
                    <span className="track"><span className="fill" style={{ width: `${Math.round(h.n / histMax * 100)}%` }} /></span>
                    <span className="pct num">{h.n}</span></div>
                ))}</div>
              <div className="mc-sect"><div className="sh">Devam oranı</div>
                {C.retention.map((r, i) => (
                  <div className="mc-bar" key={i}><span className="nm">{r.nm}</span>
                    <span className="track"><span className="fill" style={{ width: `${r.pct}%` }} /></span>
                    <span className="pct num">{r.pct}%</span></div>
                ))}</div>
              <div className="mc-sect"><div className="sh">Ayrılış durumu</div>
                <div className="exit-grid">{C.exit.map((x, i) => (
                  <div className="exit-card" key={i}><span className="ec-l"><span className="d" style={{ background: x.c }} />{x.l}</span><span className="ec-n num">{x.n}</span></div>
                ))}</div></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
