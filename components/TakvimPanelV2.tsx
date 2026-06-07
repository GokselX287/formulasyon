'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw,
  AlertTriangle, Share2, Sparkles, ArrowRight, Check, Clock, Send, FileText, Search, X,
} from 'lucide-react';
import './TakvimPanelV2.css';

// ─────────────────────────────────────────────────────────────────────────
// Veri modeli
// ─────────────────────────────────────────────────────────────────────────

export type TakvimSubTab = 'takvim' | 'hazirlik' | 'musaitlik' | 'gecmis' | 'sms' | 'gelisim';
type CalMode = 'gun' | 'hafta' | 'ay';
type Tone = 'amber' | 'sky' | 'blush' | 'lavender' | 'sage' | 'stone';

const HOURS = { start: 9, end: 18 };
const ROW_H = 64;
const TOTAL_H = (HOURS.end - HOURS.start) * ROW_H; // 576

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const TONES: Tone[] = ['amber', 'sky', 'blush', 'lavender', 'sage', 'stone'];

// İsimden stabil renk (ekol bilinmediği için — sahte ekol yok, sadece görsel ayrım)
function toneFor(name: string): Tone {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

// macOS takvim ham etkinliği (GET /api/calendar-sync)
export type RawCalEvent = { id: string; title: string; start: string; end?: string };
// Panelde kullanılan normalize edilmiş seans
type NEv = {
  id: string; name: string; dateISO: string; start: number; durMin: number;
  startISO: string; topic?: string; clientId?: string; tone: Tone; isNext?: boolean;
};

const WORK_HOURS = ['Pzt–Cu · 09:00–18:00', 'Cmt · 10:00–14:00', 'Pa · kapalı'];

const SMS_TPL = [
  { id: 't1', title: 'Standart hatırlatma', body: '"Merhaba {ad}, bugün saat {saat} seansımızı hatırlatmak isterim. Görüşmek üzere."' },
  { id: 't2', title: 'Çift seansı',         body: '"Merhaba {ad}, bugün {saat} çift seansımızı bekliyorum. Ortağınızla birlikte gelmenizi rica ederim."' },
  { id: 't3', title: 'İptal teyidi',        body: '"Merhaba {ad}, {tarih} tarihli seansınız iptal edildi. Yeni saat için lütfen geri dönün."' },
];

type GelisimEv = { id: string; title: string; date: string; time: string; durationMin: number; done?: boolean };

const pad2 = (n: number) => String(n).padStart(2, '0');
const fmt = (t: number) => `${pad2(Math.floor(t))}:${pad2(Math.round((t - Math.floor(t)) * 60))}`;
const isoOf = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// ─────────────────────────────────────────────────────────────────────────
// Bileşen
// ─────────────────────────────────────────────────────────────────────────

export type TakvimPanelV2Props = {
  subTab?: TakvimSubTab;
  onChangeSubTab?: (t: TakvimSubTab) => void;
  events?: RawCalEvent[];                                       // macOS "Randevular" — gerçek takvim
  resolveClient?: (name: string) => { id?: string; topic?: string } | undefined;
  gelisimEvents?: GelisimEv[];
  onToggleGelisimDone?: (id: string, done: boolean) => void;
  onManualSync?: () => Promise<void> | void;
  onOpenClient?: (name: string) => void;
  onNewAppointment?: () => void;
  onOpenInterventionSuggest?: () => void;
  reviewedIds?: string[];
  resolvePatientId?: (name: string) => string | undefined;
  syncLabel?: string;
};

export default function TakvimPanelV2(props: TakvimPanelV2Props) {
  const {
    subTab: subTabProp, onChangeSubTab, events, resolveClient, gelisimEvents, onToggleGelisimDone,
    onManualSync, onOpenClient, onNewAppointment, onOpenInterventionSuggest,
    reviewedIds, resolvePatientId, syncLabel: syncLabelProp,
  } = props;
  const reviewedSet = new Set(reviewedIds ?? []);

  // Hidrasyon güvenli "şimdi" (dakika hassasiyetli parçalar mount sonrası)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const now = useMemo(() => new Date(), []);
  const todayISO = isoOf(now);
  const nowHour = now.getHours() + now.getMinutes() / 60;

  // Bu haftanın günleri (Pazartesi bazlı)
  const weekDays = useMemo(() => {
    const dow = (now.getDay() + 6) % 7; // 0 = Pzt
    const monday = new Date(now); monday.setHours(0, 0, 0, 0); monday.setDate(now.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      const iso = isoOf(d);
      return { dn: DAY_NAMES[i], dd: d.getDate(), iso, today: iso === todayISO };
    });
  }, [now, todayISO]);

  // ── Ham etkinlikleri normalize et ──────────────────────────────────────
  const allEvents = useMemo<NEv[]>(() => {
    const raw = Array.isArray(events) ? events : [];
    const list = raw
      .filter((e) => e?.title && e?.start)
      .map((e) => {
        const dateISO = e.start.slice(0, 10);
        const hh = Number(e.start.slice(11, 13)) || 0;
        const mm = Number(e.start.slice(14, 16)) || 0;
        const start = hh + mm / 60;
        let durMin = 50;
        if (e.end && e.end.length >= 16) {
          const eh = Number(e.end.slice(11, 13)) || 0, em = Number(e.end.slice(14, 16)) || 0;
          const diff = (eh * 60 + em) - (hh * 60 + mm);
          if (diff > 0) durMin = diff;
        }
        const match = resolveClient?.(e.title);
        return {
          id: e.id, name: e.title.trim(), dateISO, start, durMin, startISO: e.start,
          topic: match?.topic, clientId: match?.id, tone: toneFor(e.title.trim()),
        } as NEv;
      });
    // Sıradaki seansı işaretle (şu andan sonraki en yakın)
    const nowISO = `${todayISO}T${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    const future = list.filter((e) => e.startISO >= nowISO).sort((a, b) => a.startISO.localeCompare(b.startISO));
    if (future[0]) future[0].isNext = true;
    return list;
  }, [events, resolveClient, todayISO, now]);

  const weekEvents = useMemo(
    () => allEvents.map((e) => ({ ...e, day: weekDays.findIndex((d) => d.iso === e.dateISO) }))
      .filter((e) => e.day >= 0),
    [allEvents, weekDays],
  );
  const todayEvents = useMemo(
    () => allEvents.filter((e) => e.dateISO === todayISO).sort((a, b) => a.start - b.start),
    [allEvents, todayISO],
  );
  const nextEvent = useMemo(() => allEvents.find((e) => e.isNext), [allEvents]);

  const [subTabState, setSubTabState] = useState<TakvimSubTab>('takvim');
  const subTab = subTabProp ?? subTabState;
  const setSubTab = (t: TakvimSubTab) => { setSubTabState(t); onChangeSubTab?.(t); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const [calMode, setCalMode] = useState<CalMode>('hafta');
  const [gel, setGel] = useState<GelisimEv[]>(gelisimEvents ?? []);
  useEffect(() => { setGel(gelisimEvents ?? []); }, [gelisimEvents]);
  const [syncing, setSyncing] = useState(false);

  // Geçmiş filtresi (isimle ara) + geçmiş seanslar (şu andan önce)
  const [fClient, setFClient] = useState('');
  const pastEvents = useMemo(() => {
    const nowISO = `${todayISO}T${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    return allEvents.filter((e) => e.startISO < nowISO)
      .sort((a, b) => b.startISO.localeCompare(a.startISO))
      .slice(0, 80);
  }, [allEvents, todayISO, now]);
  const history = pastEvents.filter((h) =>
    !fClient.trim() || h.name.toLocaleLowerCase('tr-TR').includes(fClient.trim().toLocaleLowerCase('tr-TR')));

  // SMS — bugünün randevularından hatırlatma
  const initialSms = useMemo(
    () => todayEvents.map((e) => {
      const first = e.name.split(/\s+/)[0];
      return { id: e.id, name: e.name, time: fmt(e.start), st: 'pending' as 'sent' | 'pending',
        preview: `"Merhaba ${first}, bugün ${fmt(e.start)} seansımızı hatırlatmak isterim. Görüşmek üzere."` };
    }),
    [todayEvents],
  );
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const sms = initialSms.map((s) => ({ ...s, st: sentIds.has(s.id) ? 'sent' as const : s.st }));
  const pendingCount = sms.filter((s) => s.st === 'pending').length;
  const sendBulk = () => setSentIds(new Set(initialSms.map((s) => s.id)));

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try { await onManualSync?.(); } finally { setSyncing(false); }
  };

  const SUBTABS: { k: TakvimSubTab; l: string }[] = [
    { k: 'takvim', l: 'Takvim' }, { k: 'hazirlik', l: 'Seansa Hazırlık' }, { k: 'musaitlik', l: 'Müsaitlik' },
    { k: 'gecmis', l: 'Geçmiş' }, { k: 'sms', l: 'SMS' }, { k: 'gelisim', l: 'Gelişim Planı' },
  ];

  const weekStart = weekDays[0], weekEnd = weekDays[6];
  const monShort = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', { month: 'short' });
  const rangeText = calMode === 'hafta'
    ? `${weekStart?.dd} – ${weekEnd?.dd} ${monShort(weekEnd?.iso ?? todayISO)}`
    : calMode === 'gun'
      ? now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' })
      : now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const todayLabel = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const syncLabel = syncing ? 'senkronize ediliyor…' : (syncLabelProp ?? 'macOS Calendar');

  return (
    <div className="tkv">
      <div className="tkv-device">

        {/* ═══ BAŞLIK ═══ */}
        <header className="tkv-head">
          <div className="tkv-head-left">
            <span className="tkv-eyebrow"><CalendarIcon /> bugün · {todayLabel}</span>
            <h1 className="tkv-title">Takvim &amp; <em>Randevular</em></h1>
          </div>
          <div className="tkv-head-right">
            <button type="button" className="tkv-sync" onClick={handleSync} disabled={syncing}>
              {syncing ? <RefreshCw size={12} strokeWidth={1.8} className="tkv-spin" /> : <span className="tkv-sync-dot" />}
              {syncLabel}
            </button>
            <button type="button" className="tkv-new" onClick={onNewAppointment}>
              Yeni randevu <span className="tkv-new-circ"><Plus size={16} strokeWidth={2} /></span>
            </button>
          </div>
        </header>

        {/* ═══ SEGMENT NAV ═══ */}
        <nav className="tkv-seg" role="tablist">
          {SUBTABS.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={subTab === t.k}
              className={`tkv-seg-btn ${subTab === t.k ? 'on' : ''}`} onClick={() => setSubTab(t.k)}>
              {t.l}
            </button>
          ))}
        </nav>

        {/* ═══ TAKVİM ═══ */}
        {subTab === 'takvim' && (
          <div className="tkv-view">
            <div className="tkv-cal-toolbar">
              <div className="tkv-tb-nav">
                <button className="tkv-ico" aria-label="Önceki"><ChevronLeft size={15} strokeWidth={1.8} /></button>
                <span className="tkv-range"><CalendarIcon size={13} strokeWidth={1.8} /> {rangeText}</span>
                <button className="tkv-ico" aria-label="Sonraki"><ChevronRight size={15} strokeWidth={1.8} /></button>
                <button className="tkv-ghost">Bugün</button>
              </div>
              <div className="tkv-modeseg">
                {(['gun', 'hafta', 'ay'] as CalMode[]).map((m) => (
                  <button key={m} className={`tkv-mode-btn ${calMode === m ? 'on' : ''}`} onClick={() => setCalMode(m)}>
                    {m === 'gun' ? 'Gün' : m === 'hafta' ? 'Hafta' : 'Ay'}
                  </button>
                ))}
              </div>
            </div>

            <div className="tkv-cal-wrap">
              <main className="tkv-card tkv-cal-card">
                {calMode === 'hafta' && <WeekGrid weekDays={weekDays} events={weekEvents} nowHour={nowHour} mounted={mounted} next={nextEvent} onOpenClient={onOpenClient} onNewAppointment={onNewAppointment} onPrepare={() => setSubTab('hazirlik')} />}
                {calMode === 'gun'   && <DayGrid now={now} events={todayEvents} nowHour={nowHour} mounted={mounted} onOpenClient={onOpenClient} />}
                {calMode === 'ay'    && <MonthGrid now={now} events={allEvents} todayISO={todayISO} onOpenClient={onOpenClient} />}
              </main>
              <CalSide weekDays={weekDays} events={weekEvents} onShareSlots={onNewAppointment} />
            </div>
          </div>
        )}

        {/* ═══ SEANSA HAZIRLIK ═══ */}
        {subTab === 'hazirlik' && (
          <div className="tkv-view">
            <section className="tkv-pool" id="gunun-seanslari-havuz">
              <div className="tkv-side-head"><span className="tkv-eyebrow">günün seansları · havuz</span><h3>Bugün <em>{todayEvents.length} seans</em>.</h3></div>
              {todayEvents.length === 0 && <p className="tkv-empty">Bugün için randevu yok.</p>}
              <div className="tkv-pool-grid">
                {todayEvents.map((e) => {
                  const pid = e.clientId ?? resolvePatientId?.(e.name);
                  const done = pid ? reviewedSet.has(pid) : false;
                  return (
                    <button key={e.id} type="button" className={`tkv-poolcard ${done ? 'done' : ''}`} onClick={() => onOpenClient?.(e.name)}>
                      <div className="tkv-poolcard-top">
                        <span className="tkv-poolcard-time">{fmt(e.start)}</span>
                        {e.isNext && <span className="tkv-poolcard-next">sıradaki</span>}
                        {done && <span className="tkv-poolcard-done"><Check size={11} strokeWidth={2.6} /> incelendi</span>}
                      </div>
                      <h4 className="tkv-poolcard-name">{e.name}</h4>
                      {e.topic && <p className="tkv-poolcard-topic">{e.topic}</p>}
                      <span className="tkv-poolcard-cta">Dosyayı aç <ArrowRight size={13} strokeWidth={1.8} /></span>
                    </button>
                  );
                })}
              </div>
            </section>

            {todayEvents.length > 0 && (
              <div className="tkv-grid-2">
                <main className="tkv-card tkv-hzr">
                  <div className="tkv-hzr-head">
                    <div className="tkv-hzr-time"><strong>{fmt((nextEvent && nextEvent.dateISO === todayISO ? nextEvent : todayEvents[0]).start)}</strong><span>sıradaki · {(nextEvent && nextEvent.dateISO === todayISO ? nextEvent : todayEvents[0]).durMin} dk</span></div>
                    <div className="tkv-hzr-id">
                      <h2 className="tkv-hzr-name">{(nextEvent && nextEvent.dateISO === todayISO ? nextEvent : todayEvents[0]).name}</h2>
                      {(nextEvent && nextEvent.dateISO === todayISO ? nextEvent : todayEvents[0]).topic && (
                        <div className="tkv-hzr-row">
                          <span className="tkv-hzr-topic">{(nextEvent && nextEvent.dateISO === todayISO ? nextEvent : todayEvents[0]).topic}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <section className="tkv-hzr-sec">
                    <span className="tkv-eyebrow">son seans notu</span>
                    <p className="tkv-hzr-note">Detaylı seans notu ve formülasyon için danışan dosyasını aç.</p>
                  </section>
                  <section className="tkv-hzr-focus">
                    <div className="tkv-hzr-focus-ic"><Sparkles size={15} strokeWidth={1.7} /></div>
                    <div className="tkv-hzr-focus-body">
                      <span className="tkv-eyebrow">bu seansa hazırlan</span>
                      <p>Danışanın güncel formülasyonuna göre müdahale önerisi al.</p>
                      <button type="button" className="tkv-btn-dark" onClick={onOpenInterventionSuggest}>Müdahale kütüphanesinden öner <ArrowRight size={13} strokeWidth={1.8} /></button>
                    </div>
                  </section>
                </main>
                <aside className="tkv-card tkv-side-card">
                  <div className="tkv-side-head"><span className="tkv-eyebrow">bugünün diğer seansları</span><h3>{Math.max(0, todayEvents.length - 1)} seans daha.</h3></div>
                  <ul className="tkv-other">
                    {todayEvents.filter((e) => e !== (nextEvent && nextEvent.dateISO === todayISO ? nextEvent : todayEvents[0])).map((e) => (
                      <li key={e.id} onClick={() => onOpenClient?.(e.name)} role="button">
                        <span className="tkv-other-t">{fmt(e.start)}</span>
                        <div><strong>{e.name}</strong>{e.topic && <span>{e.topic}</span>}</div>
                        <ArrowRight size={13} strokeWidth={1.8} />
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            )}
          </div>
        )}

        {/* ═══ MÜSAİTLİK ═══ */}
        {subTab === 'musaitlik' && (
          <div className="tkv-view">
            <main className="tkv-card tkv-msl">
              <div className="tkv-msl-hours">
                <span className="tkv-eyebrow">çalışma saatleri</span>
                <div className="tkv-chips">
                  {WORK_HOURS.map((c) => <span key={c} className="tkv-chip">{c}</span>)}
                  <button className="tkv-chip-add" onClick={onNewAppointment}><Plus size={11} strokeWidth={2} /> Şablon ekle</button>
                </div>
              </div>
              <AvailabilityGrid weekDays={weekDays} events={weekEvents} />
            </main>
          </div>
        )}

        {/* ═══ GEÇMİŞ ═══ */}
        {subTab === 'gecmis' && (
          <div className="tkv-view tkv-grid-2">
            <main className="tkv-card tkv-gec">
              <div className="tkv-gec-filters">
                <div className="tkv-filter grow"><span className="tkv-eyebrow">danışan</span><div className="tkv-input"><Search size={13} strokeWidth={1.8} /><input placeholder="İsme göre ara" value={fClient} onChange={(e) => setFClient(e.target.value)} /></div></div>
              </div>
              <div className="tkv-hist">
                <div className="tkv-hist-h"><span>Tarih</span><span>Danışan</span><span className="r">Durum</span></div>
                {history.length === 0 && <div className="tkv-hist-empty">Eşleşen geçmiş randevu yok.</div>}
                {history.map((h) => {
                  const d = new Date(h.startISO + ':00');
                  const dateLabel = `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)} · ${fmt(h.start)}`;
                  return (
                    <button key={h.id} type="button" className="tkv-hist-r" onClick={() => onOpenClient?.(h.name)}>
                      <span className="tkv-hist-date">{dateLabel}</span>
                      <span className="tkv-hist-name"><strong>{h.name}</strong>{h.topic && <span>{h.topic}</span>}</span>
                      <span className="tkv-hist-badge done">tamamlandı</span>
                    </button>
                  );
                })}
              </div>
            </main>
            <aside className="tkv-card tkv-side-card">
              <div className="tkv-side-head"><span className="tkv-eyebrow">dönem istatistiği</span><h3>Geçmiş <em>randevular</em>.</h3></div>
              <div className="tkv-stats">
                <div className="tkv-stat big"><span className="tkv-eyebrow">Toplam (son 80)</span><span className="tkv-stat-v">{pastEvents.length}</span></div>
                <div className="tkv-stat"><span className="tkv-eyebrow">Bu hafta</span><span className="tkv-stat-v">{weekEvents.length}</span></div>
              </div>
              <p className="tkv-stat-note">İptal / no-show takibi macOS takviminde tutulmadığından gösterilmez.</p>
            </aside>
          </div>
        )}

        {/* ═══ SMS ═══ */}
        {subTab === 'sms' && (
          <div className="tkv-view tkv-grid-2">
            <main className="tkv-card tkv-sms">
              <div className="tkv-side-head row">
                <div><span className="tkv-eyebrow">bugünün hatırlatmaları</span><h3><em>{sms.length}</em> mesaj, <em>{pendingCount}</em> bekliyor.</h3></div>
                <button type="button" className="tkv-btn-dark" onClick={sendBulk} disabled={pendingCount === 0}><Send size={13} strokeWidth={1.8} /> Toplu gönder</button>
              </div>
              {sms.length === 0 && <p className="tkv-empty">Bugün için hatırlatma yok.</p>}
              <ul className="tkv-sms-list">
                {sms.map((s) => (
                  <li key={s.id} className="tkv-sms-row">
                    <span className="tkv-sms-when"><Clock size={12} strokeWidth={1.8} />{s.time}</span>
                    <div className="tkv-sms-body"><strong>{s.name}</strong><p>{s.preview}</p></div>
                    <span className={`tkv-sms-badge ${s.st}`}>{s.st === 'sent' ? 'gönderildi' : 'bekliyor'}</span>
                  </li>
                ))}
              </ul>
            </main>
            <aside className="tkv-card tkv-side-card">
              <div className="tkv-side-head row"><div><span className="tkv-eyebrow">şablonlar</span><h3>3 şablon.</h3></div><button className="tkv-ghost sm"><Plus size={12} strokeWidth={2} /> Yeni</button></div>
              <ul className="tkv-tpl-list">
                {SMS_TPL.map((t) => (
                  <li key={t.id}><button type="button" className="tkv-tpl"><div className="tkv-tpl-top"><FileText size={12} strokeWidth={1.8} /><span>{t.title}</span></div><p>{t.body}</p></button></li>
                ))}
              </ul>
            </aside>
          </div>
        )}

        {/* ═══ GELİŞİM ═══ */}
        {subTab === 'gelisim' && (
          <div className="tkv-view tkv-gelisim">
            <div className="tkv-gel-head">
              <div><span className="tkv-eyebrow">gelişim planı</span><h2 className="tkv-gel-title">Eğitim &amp; <em>Yatırım</em> takvimi</h2></div>
              <div className="tkv-gel-stats">
                <span className="tkv-gel-stat"><strong>{gel.filter((e) => !e.done).length}</strong> yaklaşan</span>
                <span className="tkv-gel-stat done"><strong>{gel.filter((e) => e.done).length}</strong> tamamlanan</span>
              </div>
            </div>
            {gel.length === 0 && <div className="tkv-hist-empty">Henüz gelişim etkinliği yok.</div>}
            {(['Yaklaşan', 'Tamamlananlar'] as const).map((grp) => {
              const items = gel.filter((e) => grp === 'Yaklaşan' ? !e.done : e.done)
                .sort((a, b) => grp === 'Yaklaşan' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
              if (items.length === 0) return null;
              return (
                <div key={grp} className="tkv-gel-group">
                  <span className="tkv-gel-glabel">{grp}</span>
                  <div className="tkv-gel-list">
                    {items.map((ev) => {
                      const d = new Date(ev.date + 'T12:00:00');
                      return (
                        <article key={ev.id} className={`tkv-gel-card ${ev.done ? 'done' : ''}`}>
                          <div className="tkv-gel-date"><span className="d">{d.getDate()}</span><span className="m">{d.toLocaleDateString('tr-TR', { month: 'short' })}</span></div>
                          <div className="tkv-gel-body"><span className="tkv-gel-time">{ev.time} · {ev.durationMin} dk</span><h4>{ev.title}</h4></div>
                          <button type="button" className={`tkv-gel-check ${ev.done ? 'done' : ''}`}
                            onClick={() => { setGel((p) => p.map((x) => x.id === ev.id ? { ...x, done: !x.done } : x)); onToggleGelisimDone?.(ev.id, !ev.done); }}>
                            <Check size={14} strokeWidth={2.4} />
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Hafta ızgarası
// ─────────────────────────────────────────────────────────────────────────

type WeekEv = NEv & { day: number };

function WeekGrid({ weekDays, events, nowHour, mounted, next, onOpenClient, onNewAppointment, onPrepare }: {
  weekDays: { dn: string; dd: number; iso: string; today: boolean }[];
  events: WeekEv[]; nowHour: number; mounted: boolean; next?: NEv;
  onOpenClient?: (name: string) => void; onNewAppointment?: () => void; onPrepare?: () => void;
}) {
  const hours = Array.from({ length: HOURS.end - HOURS.start + 1 }, (_, i) => HOURS.start + i);
  const nextMin = next ? Math.round((next.start - nowHour) * 60) : 0;
  const todayIdx = weekDays.findIndex((d) => d.today);

  return (
    <div className="tkv-week">
      <div className="tkv-week-head">
        <div className="tkv-week-corner" />
        {weekDays.map((d, i) => {
          const count = events.filter((e) => e.day === i).length;
          return (
            <div key={d.dn} className={`tkv-wd ${d.today ? 'today' : ''}`}>
              <span className="tkv-wd-name">{d.dn}</span>
              <span className="tkv-wd-num">{d.dd}</span>
              <span className="tkv-wd-dots">{Array.from({ length: Math.min(count, 5) }).map((_, j) => <i key={j} />)}</span>
            </div>
          );
        })}
      </div>

      <div className="tkv-week-body" style={{ height: TOTAL_H }}>
        <div className="tkv-axis">
          {hours.map((h) => <span key={h} className="tkv-axis-h" style={{ top: (h - HOURS.start) * ROW_H }}>{pad2(h)}:00</span>)}
        </div>
        {weekDays.map((d, di) => (
          <div key={d.dn} className={`tkv-col ${di >= 5 ? 'weekend' : ''} ${d.today ? 'today' : ''}`}>
            {hours.slice(0, -1).map((h) => (
              <span key={h} className="tkv-ghost-slot" style={{ top: (h - HOURS.start) * ROW_H }} onClick={onNewAppointment}><Plus size={14} strokeWidth={2} /></span>
            ))}
            {events.filter((e) => e.day === di).map((e) => {
              const top = (e.start - HOURS.start) * ROW_H;
              const height = (e.durMin / 60) * ROW_H - 4;
              const compact = height < 52;
              return (
                <div key={e.id} role="button" tabIndex={0} className={`tkv-ev tkv-ev--${e.tone} ${e.isNext ? 'next' : ''} ${compact ? 'compact' : ''}`} style={{ top, height }}
                  onClick={() => onOpenClient?.(e.name)}>
                  {e.isNext && mounted && <span className="tkv-ev-now">ŞİMDİ</span>}
                  <span className="tkv-ev-time">{fmt(e.start)}</span>
                  <span className="tkv-ev-name">{e.name}</span>
                  {!compact && e.topic && <span className="tkv-ev-meta">{e.topic.split('·')[0].trim()}</span>}
                </div>
              );
            })}
            {d.today && mounted && nowHour >= HOURS.start && nowHour <= HOURS.end && (
              <div className="tkv-nowline" style={{ top: (nowHour - HOURS.start) * ROW_H }}>
                <span className="tkv-nowline-knob" />
                <span className="tkv-nowline-lbl">{fmt(nowHour)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {next && mounted && (
        <div className="tkv-nextpill">
          <span className="tkv-nextpill-av"><i>{next.name[0]}</i></span>
          <div className="tkv-nextpill-body">
            <span className="tkv-eyebrow light">sıradaki seans</span>
            <span className="tkv-nextpill-line">{next.name} · {fmt(next.start)}{next.day === todayIdx && nextMin > 0 ? <> · <strong>{nextMin} dk sonra</strong></> : null}</span>
          </div>
          <button type="button" className="tkv-nextpill-cta" onClick={onPrepare}>Hazırlığa geç <ArrowRight size={13} strokeWidth={1.8} /></button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Gün ızgarası
// ─────────────────────────────────────────────────────────────────────────

function DayGrid({ now, events, nowHour, mounted, onOpenClient }: {
  now: Date; events: NEv[]; nowHour: number; mounted: boolean; onOpenClient?: (name: string) => void;
}) {
  const hours = Array.from({ length: HOURS.end - HOURS.start + 1 }, (_, i) => HOURS.start + i);
  return (
    <div className="tkv-day">
      <div className="tkv-day-head">
        <span className="tkv-day-num">{now.getDate()}</span>
        <div><h2 className="tkv-day-count">{events.length} seans · <em>{now.toLocaleDateString('tr-TR', { weekday: 'long' })}</em></h2><span className="tkv-eyebrow">{now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
      </div>
      <div className="tkv-day-body" style={{ height: TOTAL_H }}>
        <div className="tkv-axis">
          {hours.map((h) => <span key={h} className="tkv-axis-h" style={{ top: (h - HOURS.start) * ROW_H }}>{pad2(h)}:00</span>)}
        </div>
        <div className="tkv-day-col">
          {events.length === 0 && <p className="tkv-empty tkv-day-empty">Bugün için randevu yok.</p>}
          {events.map((e) => {
            const top = (e.start - HOURS.start) * ROW_H;
            const height = (e.durMin / 60) * ROW_H - 4;
            return (
              <div key={e.id} role="button" tabIndex={0} className={`tkv-dev tkv-ev--${e.tone} ${e.isNext ? 'next' : ''}`} style={{ top, height }} onClick={() => onOpenClient?.(e.name)}>
                <span className="tkv-dev-time">{fmt(e.start)}–{fmt(e.start + e.durMin / 60)}</span>
                <span className="tkv-dev-name">{e.name}</span>
                {e.topic && <span className="tkv-dev-topic">{e.topic}</span>}
              </div>
            );
          })}
          {mounted && nowHour >= HOURS.start && nowHour <= HOURS.end && (
            <div className="tkv-nowline" style={{ top: (nowHour - HOURS.start) * ROW_H }}>
              <span className="tkv-nowline-knob" />
              <span className="tkv-nowline-lbl">{fmt(nowHour)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Ay ızgarası
// ─────────────────────────────────────────────────────────────────────────

function MonthGrid({ now, events, todayISO, onOpenClient }: {
  now: Date; events: NEv[]; todayISO: string; onOpenClient?: (name: string) => void;
}) {
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lead = (firstDay.getDay() + 6) % 7; // Pzt bazlı
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { day?: number; out?: boolean }[] = [];
  for (let i = 0; i < lead; i++) cells.push({ out: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  const eventsForDay = (d: number) => {
    const iso = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    return events.filter((e) => e.dateISO === iso).sort((a, b) => a.start - b.start);
  };
  return (
    <div className="tkv-month">
      <div className="tkv-month-head">{DAY_NAMES.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="tkv-month-grid">
        {cells.map((c, i) => {
          if (c.out) return <div key={i} className="tkv-mc out" />;
          const evs = eventsForDay(c.day!);
          const iso = `${year}-${pad2(month + 1)}-${pad2(c.day!)}`;
          return (
            <div key={i} className={`tkv-mc ${iso === todayISO ? 'today' : ''}`}>
              <span className="tkv-mc-num">{c.day}</span>
              <div className="tkv-mc-evs">
                {evs.slice(0, 2).map((e) => (
                  <span key={e.id} role="button" className={`tkv-mc-ev tkv-ev--${e.tone}`} onClick={() => onOpenClient?.(e.name)}>{fmt(e.start)} {e.name}</span>
                ))}
                {evs.length > 2 && <span className="tkv-mc-more">+{evs.length - 2} daha</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Takvim yan rayı
// ─────────────────────────────────────────────────────────────────────────

function CalSide({ weekDays, events, onShareSlots }: {
  weekDays: { dn: string; today: boolean }[]; events: WeekEv[]; onShareSlots?: () => void;
}) {
  const total = events.length;
  // Gerçek çakışma: aynı gün, aralık < 10 dk (veya üst üste)
  let conflict: { day: number; a: WeekEv; b: WeekEv } | null = null;
  for (let di = 0; di < 7 && !conflict; di++) {
    const dayEvs = events.filter((e) => e.day === di).sort((a, b) => a.start - b.start);
    for (let i = 1; i < dayEvs.length; i++) {
      const prev = dayEvs[i - 1], cur = dayEvs[i];
      if (cur.start * 60 < prev.start * 60 + prev.durMin + 10) { conflict = { day: di, a: prev, b: cur }; break; }
    }
  }
  return (
    <aside className="tkv-cal-side">
      <div className="tkv-card tkv-side-card">
        <div className="tkv-side-head"><span className="tkv-eyebrow">bu hafta · özet</span><h3>7 gün, <em>{total}</em> seans.</h3></div>
        <ul className="tkv-wsum">
          {weekDays.map((d, i) => {
            const count = events.filter((e) => e.day === i).length;
            const free = Math.max(0, (HOURS.end - HOURS.start) - count);
            return (
              <li key={d.dn} className={d.today ? 'today' : ''}>
                <span className="tkv-wsum-name">{d.dn}</span>
                <span className="tkv-wsum-bar">{Array.from({ length: 6 }).map((_, j) => <i key={j} className={j < count ? 'on' : ''} />)}</span>
                <span className="tkv-wsum-meta"><strong>{count}</strong> · {free} boş</span>
              </li>
            );
          })}
        </ul>
      </div>

      {conflict && (
        <div className="tkv-card tkv-alert">
          <div className="tkv-alert-head"><AlertTriangle size={14} strokeWidth={2} /> <strong>Çakışma uyarısı</strong></div>
          <p>{DAY_NAMES[conflict.day]} · {fmt(conflict.a.start)} {conflict.a.name} ile {fmt(conflict.b.start)} {conflict.b.name} arasında hazırlık payı yok.</p>
        </div>
      )}

      <div className="tkv-card tkv-legend-card">
        <span className="tkv-eyebrow">macOS "Randevular" takviminden senkronlanır</span>
        <button type="button" className="tkv-ghost block" onClick={onShareSlots}><Share2 size={13} strokeWidth={1.8} /> Boş slotları paylaş <ArrowRight size={13} strokeWidth={1.8} className="arr" /></button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Müsaitlik ısı ızgarası
// ─────────────────────────────────────────────────────────────────────────

function AvailabilityGrid({ weekDays, events }: {
  weekDays: { dn: string }[]; events: WeekEv[];
}) {
  const rows = [9, 10, 11, 13, 14, 15, 16];
  const state = (h: number, di: number): 'busy' | 'off' | 'free' => {
    if (di === 6) return 'off';
    if (di === 5 && h >= 14) return 'off';
    const busy = events.some((e) => e.day === di && Math.floor(e.start) === h);
    return busy ? 'busy' : 'free';
  };
  return (
    <div className="tkv-heat">
      <div className="tkv-heat-h"><span /> {weekDays.map((d) => <span key={d.dn}>{d.dn}</span>)}</div>
      {rows.map((h) => (
        <div key={h} className="tkv-heat-r">
          <span className="tkv-heat-lbl">{pad2(h)}</span>
          {weekDays.map((d, di) => <i key={d.dn} className={`tkv-mslot ${state(h, di)}`} />)}
        </div>
      ))}
      <div className="tkv-heat-legend">
        <span className="tkv-leg"><i className="tkv-leg-sw free" /> Müsait</span>
        <span className="tkv-leg"><i className="tkv-leg-sw busy" /> Dolu</span>
        <span className="tkv-leg"><i className="tkv-leg-sw off" /> Kapalı</span>
      </div>
    </div>
  );
}
