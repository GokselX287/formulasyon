'use client';

import React, { useEffect, useRef, useState } from 'react';

// ---------- Types ----------
type CalEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
};

type Patient = { id: string; adSoyad: string };

type SablonRow = { id: string; gun: number; tip: string; baslangic: string | null; bitis: string | null };
type MBlok     = { id: string; tarih: string; baslangic: string; bitis: string; aciklama: string | null; renk: string };
type MData     = { sablon: SablonRow[]; bloklar: MBlok[] };

type Props = {
  events: CalEvent[];
  onRefresh: () => void;
  loading?: boolean;
  patients?: Patient[];
};

// ---------- Helpers ----------
function getMonday(d: Date): Date {
  const day = new Date(d);
  const dow = day.getDay();
  const diff = (dow + 6) % 7;
  day.setDate(day.getDate() - diff);
  day.setHours(0, 0, 0, 0);
  return day;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function parseEvent(e: CalEvent): { start: Date; end: Date } {
  const parseStr = (s: string): Date => {
    if (!s) return new Date(NaN);
    if (s.includes('Z') || (s.includes('T') && s.length > 16)) return new Date(s);
    if (s.includes('T')) {
      const [datePart, timePart] = s.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute);
    }
    return new Date(s);
  };
  const start = parseStr(e.start);
  const end = e.end ? parseStr(e.end) : new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function pad2(n: number) { return String(n).padStart(2, '0'); }

const HOUR_HEIGHT = 64;
const DAY_START = 7;
const DAY_END = 22;
const VISIBLE_HOURS = DAY_END - DAY_START;
const HOUR_LABELS = Array.from({ length: VISIBLE_HOURS + 1 }, (_, i) => i + DAY_START);
const TIME_COL_W = 52;
const SLOT_MINS = 30; // booking slot size

const TR_DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TR_MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// ---------- Inline styles ----------
const navBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5',
  background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 16, color: '#3c3c43', lineHeight: 1,
};
const toolbarBtnStyle: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 6, border: '1px solid #d1d1d6', background: '#fff',
  cursor: 'pointer', fontSize: 13, color: '#3c3c43',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', lineHeight: '20px',
};

// ---------- Collision layout ----------
type LayoutEvent = { event: CalEvent; start: Date; end: Date; col: number; totalCols: number };

function computeLayout(events: { event: CalEvent; start: Date; end: Date }[]): LayoutEvent[] {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const result: LayoutEvent[] = sorted.map(e => ({ ...e, col: 0, totalCols: 1 }));
  const cols: Date[] = [];
  for (const ev of result) {
    let placed = false;
    for (let c = 0; c < cols.length; c++) {
      if (ev.start >= cols[c]) { ev.col = c; cols[c] = ev.end; placed = true; break; }
    }
    if (!placed) { ev.col = cols.length; cols.push(ev.end); }
  }
  for (let i = 0; i < result.length; i++) {
    let maxCol = result[i].col;
    for (let j = 0; j < result.length; j++) {
      if (i !== j && result[i].start < result[j].end && result[i].end > result[j].start)
        maxCol = Math.max(maxCol, result[j].col);
    }
    result[i].totalCols = maxCol + 1;
  }
  return result;
}

// ---------- MonthGrid ----------
function MonthGrid({ weekStart, events }: { weekStart: Date; events: CalEvent[] }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(weekStart); d.setDate(1); return d; });
  const monthLabel = `${TR_MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const firstDow = (cursor.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const shift = (n: number) => { const d = new Date(cursor); d.setMonth(d.getMonth() + n); setCursor(d); };
  const eventsForDay = (day: number) => events.filter(e => {
    const { start } = parseEvent(e);
    return start.getFullYear() === cursor.getFullYear() && start.getMonth() === cursor.getMonth() && start.getDate() === day;
  });
  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === cursor.getFullYear() && today.getMonth() === cursor.getMonth() && today.getDate() === day;
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #e5e5e5', gap: 8 }}>
        <button onClick={() => shift(-1)} style={navBtnStyle}>‹</button>
        <span style={{ fontWeight: 600, fontSize: 15, minWidth: 160, textAlign: 'center' }}>{monthLabel}</span>
        <button onClick={() => shift(1)} style={navBtnStyle}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
          <div key={d} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#8e8e93', borderBottom: '1px solid #e5e5e5' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, i) => (
          <div key={i} style={{ minHeight: 90, padding: 4, borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5', backgroundColor: day && isToday(day) ? '#f0f7ff' : '#fff' }}>
            {day && (<>
              <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: isToday(day) ? 700 : 400, color: isToday(day) ? '#fff' : '#3c3c43', backgroundColor: isToday(day) ? '#007aff' : 'transparent', marginBottom: 2 }}>{day}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {eventsForDay(day).slice(0, 3).map(e => {
                  const { start } = parseEvent(e);
                  return (<div key={e.id} style={{ backgroundColor: '#0a84ff', color: '#fff', borderRadius: 3, padding: '1px 4px', fontSize: 10, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.title}>{`${pad2(start.getHours())}:${pad2(start.getMinutes())} `}{e.title}</div>);
                })}
                {eventsForDay(day).length > 3 && <div style={{ fontSize: 10, color: '#8e8e93' }}>+{eventsForDay(day).length - 3} daha</div>}
              </div>
            </>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- BookingForm ----------
type BookingSlot = { date: Date; hour: number; minute: number };

function BookingForm({ slot, patients, events, onClose, onSaved }: {
  slot: BookingSlot;
  patients: Patient[];
  events: CalEvent[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [sure, setSure] = useState(50);
  const [not, setNot] = useState('');
  const [addToCal, setAddToCal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const tarih = `${slot.date.getFullYear()}-${pad2(slot.date.getMonth() + 1)}-${pad2(slot.date.getDate())}`;
  const saat = `${pad2(slot.hour)}:${pad2(slot.minute)}`;

  // End time display
  const endMs = new Date(slot.date.getFullYear(), slot.date.getMonth(), slot.date.getDate(), slot.hour, slot.minute).getTime() + sure * 60000;
  const endD = new Date(endMs);
  const saatBitis = `${pad2(endD.getHours())}:${pad2(endD.getMinutes())}`;

  const handlePatientChange = (id: string) => {
    setClientId(id);
    const p = patients.find(p => p.id === id);
    setClientName(p?.adSoyad ?? '');
  };

  const handleSave = async () => {
    if (!clientName.trim()) { setError('Danışan adı gerekli.'); return; }
    setSaving(true);
    setError('');
    try {
      // 1. DB'ye kaydet
      await fetch('/api/randevu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientId || undefined, clientName, tarih, saat, sure, not }),
      });
      // 2. macOS Calendar'a yaz
      if (addToCal) {
        const calRes = await fetch('/api/takvim-yaz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: clientName, tarih, saat, sure, desc: not }),
        });
        if (!calRes.ok) {
          const d = await calRes.json();
          setError(`Takvime eklenemedi: ${d.error ?? 'bilinmeyen hata'}`);
        }
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 380, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>Yeni Randevu</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0E0F12' }}>
              {slot.date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div style={{ fontSize: 14, color: '#6366f1', fontWeight: 600, marginTop: 2 }}>{saat} – {saatBitis}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: '#f4f5f8', cursor: 'pointer', fontSize: 16, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Danışan */}
          <div>
            <label style={labelStyle}>Danışan</label>
            {patients.length > 0 ? (
              <select value={clientId} onChange={e => handlePatientChange(e.target.value)} style={inputStyle}>
                <option value="">— Manuel ad gir —</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.adSoyad}</option>)}
              </select>
            ) : null}
            {(!clientId) && (
              <input
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Ad Soyad"
                style={{ ...inputStyle, marginTop: patients.length > 0 ? 6 : 0 }}
              />
            )}
          </div>

          {/* Süre */}
          <div>
            <label style={labelStyle}>Süre</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[45, 50, 60, 90].map(m => (
                <button key={m} onClick={() => setSure(m)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: `1.5px solid ${sure === m ? '#6366f1' : '#e5e5e5'}`, background: sure === m ? '#ede9fe' : '#fff', color: sure === m ? '#6366f1' : '#555', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {m}dk
                </button>
              ))}
            </div>
          </div>

          {/* Not */}
          <div>
            <label style={labelStyle}>Not (opsiyonel)</label>
            <textarea value={not} onChange={e => setNot(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} placeholder="Seans notu, hatırlatma…" />
          </div>

          {/* Takvime ekle toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div
              onClick={() => setAddToCal(v => !v)}
              style={{ width: 40, height: 22, borderRadius: 11, background: addToCal ? '#6366f1' : '#d1d1d6', display: 'flex', alignItems: 'center', padding: '0 2px', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transform: addToCal ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
            </div>
            <span style={{ fontSize: 13, color: '#3c3c43', fontWeight: 500 }}>macOS Takvim'e de ekle</span>
          </label>

          {error && <div style={{ fontSize: 12, color: '#ef4444', background: '#fef2f2', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '11px 0', borderRadius: 12, border: 'none', background: saving ? '#a5b4fc' : '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
          >
            {saving ? 'Kaydediliyor…' : 'Randevu Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#1c1c1e', outline: 'none', boxSizing: 'border-box', background: '#fafafa' };

// ---------- Slot busy check ----------
function isSlotBusy(day: Date, h: number, m: number, durationMins: number, events: CalEvent[]): boolean {
  const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime();
  const slotEnd = slotStart + durationMins * 60000;
  return events.some(e => {
    const { start, end } = parseEvent(e);
    if (!isSameDay(start, day)) return false;
    return start.getTime() < slotEnd && end.getTime() > slotStart;
  });
}

// ---------- Slot blocked check (musaitlik) ----------
function isSlotBlocked(day: Date, h: number, m: number, musaitlik: MData): boolean {
  const dow = (day.getDay() + 6) % 7; // 0=Pzt
  const slotStr = `${pad2(h)}:${pad2(m)}`;

  // Haftalık şablon: çalışma bloğu var mı?
  const calisma = musaitlik.sablon.find(s => s.gun === dow && s.tip === 'calisma');
  if (!calisma) return true; // o gün için çalışma tanımı yok → kapalı

  // Slot çalışma saatleri dışında mı?
  if (slotStr < (calisma.baslangic ?? '00:00') || slotStr >= (calisma.bitis ?? '23:59')) return true;

  // Mola/yemek bloğunda mı?
  const molalar = musaitlik.sablon.filter(s => s.gun === dow && (s.tip === 'mola' || s.tip === 'yemek'));
  for (const b of molalar) {
    if (b.baslangic && b.bitis && slotStr >= b.baslangic && slotStr < b.bitis) return true;
  }

  // Özel tarih bloğunda mı?
  const tarih = `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}`;
  for (const b of musaitlik.bloklar) {
    if (b.tarih === tarih && slotStr >= b.baslangic && slotStr < b.bitis) return true;
  }

  return false;
}

// Blok rengi → CSS
function blokRenkStyle(day: Date, h: number, m: number, musaitlik: MData): string {
  const dow = (day.getDay() + 6) % 7;
  const slotStr = `${pad2(h)}:${pad2(m)}`;
  const calisma = musaitlik.sablon.find(s => s.gun === dow && s.tip === 'calisma');
  // Çalışma dışı veya gün kapalı → koyu gri
  if (!calisma || slotStr < (calisma.baslangic ?? '') || slotStr >= (calisma.bitis ?? '')) {
    return 'rgba(30,30,30,0.08)';
  }
  // Mola/yemek → turuncu tint
  const molalar = musaitlik.sablon.filter(s => s.gun === dow && (s.tip === 'mola' || s.tip === 'yemek'));
  if (molalar.some(b => b.baslangic && b.bitis && slotStr >= b.baslangic && slotStr < b.bitis)) {
    return 'rgba(251,146,60,0.15)';
  }
  // Özel blok → mor tint
  const tarih = `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}`;
  if (musaitlik.bloklar.some(b => b.tarih === tarih && slotStr >= b.baslangic && slotStr < b.bitis)) {
    return 'rgba(139,92,246,0.15)';
  }
  return 'rgba(30,30,30,0.08)';
}

// ---------- WeekCalendar ----------
export default function WeekCalendar({ events, onRefresh, loading, patients = [] }: Props) {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nowTop, setNowTop] = useState<number | null>(null);
  const [bookingMode, setBookingMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [musaitlik, setMusaitlik] = useState<MData>({ sablon: [], bloklar: [] });

  // Booking modu açılınca müsaitlik verisi çek
  useEffect(() => {
    if (!bookingMode) return;
    fetch('/api/musaitlik').then(r => r.json()).then(setMusaitlik).catch(() => {});
  }, [bookingMode]);

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const now = new Date();
    const minutesSinceDayStart = (now.getHours() - DAY_START) * 60 + now.getMinutes();
    el.scrollTop = Math.max(0, minutesSinceDayStart * (HOUR_HEIGHT / 60) - 120);
  }, [view]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const mins = (now.getHours() - DAY_START) * 60 + now.getMinutes();
      setNowTop(now.getHours() >= DAY_START && now.getHours() <= DAY_END ? mins * (HOUR_HEIGHT / 60) : null);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  const prevWeek = () => setWeekStart(w => addDays(w, -7));
  const nextWeek = () => setWeekStart(w => addDays(w, 7));
  const goToday = () => setWeekStart(getMonday(new Date()));

  const weekEnd = addDays(weekStart, 6);
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${weekStart.getDate()}–${weekEnd.getDate()} ${TR_MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${weekStart.getDate()} ${TR_MONTHS_SHORT[weekStart.getMonth()]} – ${weekEnd.getDate()} ${TR_MONTHS_SHORT[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
  const isCurrentWeek = isSameDay(weekStart, getMonday(new Date()));

  const weekEvents = events.filter(e => {
    const { start } = parseEvent(e);
    return !isNaN(start.getTime()) && start >= weekStart && start < addDays(weekStart, 7);
  });
  const allDayEvents = weekEvents.filter(e => { const { start, end } = parseEvent(e); return end.getTime() - start.getTime() >= 23 * 3600000; });
  const timedEvents = weekEvents.filter(e => { const { start, end } = parseEvent(e); return end.getTime() - start.getTime() < 23 * 3600000; });

  const eventsByDay: { event: CalEvent; start: Date; end: Date }[][] = Array.from({ length: 7 }, () => []);
  timedEvents.forEach(e => {
    const { start, end } = parseEvent(e);
    const dayIdx = days.findIndex(d => isSameDay(d, start));
    if (dayIdx !== -1) eventsByDay[dayIdx].push({ event: e, start, end });
  });
  const layoutsByDay = eventsByDay.map(computeLayout);
  const todayColIdx = days.findIndex(d => isSameDay(d, today));
  const currentWeekHasToday = todayColIdx !== -1;

  // Booking slots: every SLOT_MINS minutes from DAY_START to DAY_END
  const slots: { h: number; m: number }[] = [];
  for (let h = DAY_START; h < DAY_END; h++) {
    for (let m = 0; m < 60; m += SLOT_MINS) {
      slots.push({ h, m });
    }
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 88px)', background: '#fff', borderRadius: 12, border: `1.5px solid ${bookingMode ? '#6366f1' : '#e5e5e5'}`, overflow: 'hidden', boxShadow: bookingMode ? '0 0 0 3px #ede9fe, 0 1px 3px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.06)', transition: 'border-color 0.2s, box-shadow 0.2s' }}>

      {/* Toolbar */}
      <div style={{ height: 52, borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={prevWeek} style={navBtnStyle}>‹</button>
          <button onClick={goToday} style={{ ...toolbarBtnStyle, fontWeight: isCurrentWeek ? 600 : 400, backgroundColor: isCurrentWeek ? '#f2f2f7' : '#fff' }}>Bugün</button>
          <button onClick={nextWeek} style={navBtnStyle}>›</button>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1c1c1e', letterSpacing: '-0.2px' }}>{weekLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Randevu Oluştur butonu */}
          <button
            onClick={() => { setBookingMode(v => !v); setSelectedSlot(null); }}
            style={{
              ...toolbarBtnStyle,
              background: bookingMode ? '#6366f1' : '#fff',
              color: bookingMode ? '#fff' : '#6366f1',
              border: `1.5px solid ${bookingMode ? '#6366f1' : '#6366f1'}`,
              fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
          >
            {bookingMode ? '✕ İptal' : '＋ Randevu Oluştur'}
          </button>

          <button onClick={onRefresh} disabled={loading} style={{ ...toolbarBtnStyle, display: 'flex', alignItems: 'center', gap: 4, opacity: loading ? 0.6 : 1 }}>
            <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
            {loading ? 'Yükleniyor…' : 'Yenile'}
          </button>
          <div style={{ display: 'flex', border: '1px solid #d1d1d6', borderRadius: 6, overflow: 'hidden' }}>
            {(['week', 'month'] as const).map((v, i) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '4px 10px', border: 'none', borderLeft: i > 0 ? '1px solid #d1d1d6' : 'none', background: view === v ? '#007aff' : '#fff', color: view === v ? '#fff' : '#3c3c43', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>
                {v === 'week' ? 'Hafta' : 'Ay'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Booking mode banner */}
      {bookingMode && (
        <div style={{ background: '#ede9fe', borderBottom: '1px solid #c4b5fd', padding: '6px 16px', fontSize: 12, color: '#5b21b6', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>🗓</span>
          <span>Boş bir saat dilimine tıklayarak randevu oluşturun.</span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#22c55e', marginRight: 4 }} />Boş</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#94a3b8', marginRight: 4 }} />Dolu</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#d1d5db', marginRight: 4 }} />Kapalı</span>
          </span>
        </div>
      )}

      {view === 'month' ? (
        <MonthGrid weekStart={weekStart} events={events} />
      ) : (
        <>
          {allDayEvents.length > 0 && (
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e5e5', flexShrink: 0 }}>
              <div style={{ width: TIME_COL_W, flexShrink: 0, fontSize: 10, color: '#8e8e93', textAlign: 'right', padding: '4px 6px 0 0' }}>Tüm gün</div>
              {days.map((day, di) => {
                const dayAllDay = allDayEvents.filter(e => { const { start } = parseEvent(e); return isSameDay(start, day); });
                return (
                  <div key={di} style={{ flex: 1, borderLeft: '1px solid #e5e5e5', padding: '2px 2px', minHeight: 24 }}>
                    {dayAllDay.map(e => (
                      <div key={e.id} style={{ background: '#0a84ff', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.title}>{e.title}</div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Day headers */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e5e5', height: 48, flexShrink: 0 }}>
            <div style={{ width: TIME_COL_W, flexShrink: 0 }} />
            {days.map((day, di) => {
              const isToday = isSameDay(day, today);
              return (
                <div key={di} style={{ flex: 1, borderLeft: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: isToday ? '#007aff' : '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{TR_DAYS_SHORT[di]}</span>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isToday ? '#007aff' : 'transparent', color: isToday ? '#fff' : '#1c1c1e', fontSize: 15, fontWeight: isToday ? 700 : 400 }}>{day.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Scrollable time grid */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
            <div style={{ display: 'flex', position: 'relative' }}>
              {/* Hour labels */}
              <div style={{ width: TIME_COL_W, flexShrink: 0, position: 'relative' }}>
                {HOUR_LABELS.map(h => (
                  <div key={h} style={{ height: h === DAY_END ? 0 : HOUR_HEIGHT, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, position: 'relative', top: h === DAY_START ? 0 : -6 }}>
                    {h < DAY_END && <span style={{ fontSize: 10, color: '#8e8e93', fontVariantNumeric: 'tabular-nums' }}>{pad2(h)}:00</span>}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day, di) => {
                const isToday = isSameDay(day, today);
                const layout = layoutsByDay[di];
                return (
                  <div key={di} style={{ flex: 1, borderLeft: '1px solid #e5e5e5', position: 'relative', background: isToday ? '#f8fbff' : '#fff' }}>
                    {/* Hour lines */}
                    {HOUR_LABELS.map(h => (
                      <div key={h} style={{ position: 'absolute', top: (h - DAY_START) * HOUR_HEIGHT, left: 0, right: 0, height: 1, background: h === DAY_START ? 'transparent' : '#e5e5e5', pointerEvents: 'none' }} />
                    ))}
                    {HOUR_LABELS.slice(0, VISIBLE_HOURS).map(h => (
                      <div key={`half-${h}`} style={{ position: 'absolute', top: (h - DAY_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2, left: 0, right: 0, height: 1, background: '#f0f0f0', pointerEvents: 'none' }} />
                    ))}

                    {/* Booking slots overlay */}
                    {bookingMode && slots.map(({ h, m }) => {
                      const busy    = isSlotBusy(day, h, m, SLOT_MINS, events);
                      const blocked = !busy && musaitlik.sablon.length > 0 && isSlotBlocked(day, h, m, musaitlik);
                      const free    = !busy && !blocked;
                      const topPx   = ((h - DAY_START) * 60 + m) * (HOUR_HEIGHT / 60);
                      const heightPx = SLOT_MINS * (HOUR_HEIGHT / 60);

                      const bg = busy    ? 'rgba(148,163,184,0.15)'
                               : blocked ? blokRenkStyle(day, h, m, musaitlik)
                               : 'rgba(34,197,94,0.10)';
                      const border = busy    ? '1px solid rgba(148,163,184,0.12)'
                                   : blocked ? '1px solid rgba(0,0,0,0.06)'
                                   : '1px solid rgba(34,197,94,0.22)';

                      return (
                        <div
                          key={`slot-${h}-${m}`}
                          onClick={() => free && setSelectedSlot({ date: day, hour: h, minute: m })}
                          style={{
                            position: 'absolute', top: topPx + 1, left: 1, right: 1,
                            height: heightPx - 1, borderRadius: 4,
                            background: bg, border,
                            cursor: free ? 'pointer' : 'not-allowed',
                            zIndex: 0, transition: 'background 0.1s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                          onMouseEnter={e => {
                            if (free) (e.currentTarget as HTMLDivElement).style.background = 'rgba(34,197,94,0.22)';
                          }}
                          onMouseLeave={e => {
                            if (free) (e.currentTarget as HTMLDivElement).style.background = bg;
                          }}
                        >
                          {free && (
                            <span style={{ fontSize: 9, color: '#16a34a', fontWeight: 600, opacity: 0 }}
                              onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.opacity = '1'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.opacity = '0'; }}
                            >{pad2(h)}:{pad2(m)}</span>
                          )}
                        </div>
                      );
                    })}

                    {/* Events (dimmed in booking mode) */}
                    {layout.map(({ event, start, end, col, totalCols }) => {
                      const startMin = (start.getHours() - DAY_START) * 60 + start.getMinutes();
                      const endMin = (end.getHours() - DAY_START) * 60 + end.getMinutes();
                      const durationMin = Math.max(endMin - startMin, 20);
                      const topPx = startMin * (HOUR_HEIGHT / 60);
                      const heightPx = Math.max(durationMin * (HOUR_HEIGHT / 60), 22);
                      const colW = 100 / totalCols;
                      return (
                        <div key={event.id} title={event.title} style={{ position: 'absolute', top: topPx + 1, height: heightPx - 2, left: `calc(${col * colW}% + 2px)`, width: `calc(${colW}% - 4px)`, background: bookingMode ? '#94a3b8' : '#0a84ff', borderRadius: 6, padding: '2px 5px', overflow: 'hidden', cursor: 'default', boxSizing: 'border-box', zIndex: 2, opacity: bookingMode ? 0.7 : 1, transition: 'background 0.2s, opacity 0.2s' }}
                          onMouseEnter={e => { if (!bookingMode) (e.currentTarget as HTMLDivElement).style.filter = 'brightness(0.88)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.filter = 'none'; }}
                        >
                          <div style={{ color: '#fff', fontSize: 11, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: heightPx < 34 ? 'nowrap' : 'normal' }}>{event.title}</div>
                          {heightPx >= 34 && <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, marginTop: 1 }}>{pad2(start.getHours())}:{pad2(start.getMinutes())} – {pad2(end.getHours())}:{pad2(end.getMinutes())}</div>}
                        </div>
                      );
                    })}

                    {/* Now line */}
                    {isToday && currentWeekHasToday && nowTop !== null && (
                      <div style={{ position: 'absolute', top: nowTop, left: -8, right: 0, height: 2, background: '#ff3b30', pointerEvents: 'none', zIndex: 3 }}>
                        <div style={{ position: 'absolute', left: 0, top: -4, width: 9, height: 9, borderRadius: '50%', background: '#ff3b30' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ height: VISIBLE_HOURS * HOUR_HEIGHT }} />
          </div>
        </>
      )}

      {/* Booking form modal */}
      {selectedSlot && (
        <BookingForm
          slot={selectedSlot}
          patients={patients}
          events={events}
          onClose={() => setSelectedSlot(null)}
          onSaved={() => { setSelectedSlot(null); setBookingMode(false); onRefresh(); }}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
