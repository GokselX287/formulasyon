'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './TakvimRandevular.css';

// ──────────────────────────────────────────────────────────────────────────
// Takvim & Randevular — "Klinik Editöryel Dosya"
// "Takvim & Randevular.html" birebir port; veri macOS "Randevular"dan canlı.
// ──────────────────────────────────────────────────────────────────────────

export type RawCalEvent = { id: string; title: string; start: string; end?: string };
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
  onNewAppointment?(): void;
  onManualSync?(): Promise<void> | void;
  onOpenInterventionSuggest?(): void;
  onEditMissingFees?(): void;
};

type SubTab = 'takvim' | 'hazirlik' | 'musaitlik' | 'gecmis' | 'sms' | 'gelisim';
type CalMode = 'gun' | 'hafta' | 'ay';

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTHS_FULL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const TONES = [
  { bg: '#E8EAF7', ink: '#4C5078' }, { bg: '#FBE7DC', ink: '#8C5A41' },
  { bg: '#DFF0E5', ink: '#477254' }, { bg: '#E3EAF6', ink: '#46587C' },
  { bg: '#EDE6F4', ink: '#604B75' }, { bg: '#F6EFD9', ink: '#6F5C30' },
];
function toneFor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const hhmm = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
const isoOf = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const minutesOfISO = (iso: string) => (Number(iso.slice(11, 13)) || 0) * 60 + (Number(iso.slice(14, 16)) || 0);

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

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

const AXIS_START = 9 * 60, AXIS_END = 18 * 60, HOUR_PX = 58;

export default function TakvimRandevular(props: TakvimRandevularProps) {
  const { events, resolveClient, avgFee = 0, missingFeeCount = 0, availability, onAddBlock, gelisimEvents, onBack, onNav, onOpenClient, onPrepareSession, onNewAppointment, onManualSync, onOpenInterventionSuggest, onEditMissingFees } = props;
  // #6 Müsaitlik blok tipleri
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
  const [calMode, setCalMode] = useState<CalMode>('hafta');
  const [histQuery, setHistQuery] = useState('');
  const [smsSel, setSmsSel] = useState<Set<string>>(new Set());
  const [smsSent, setSmsSent] = useState(false);
  const [syncLabel, setSyncLabel] = useState('macOS Calendar');
  const [syncing, setSyncing] = useState(false);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // ── Hafta (Pzt→Paz) ──
  const week = useMemo(() => {
    const dow = (now.getDay() + 6) % 7;
    const monday = new Date(now); monday.setHours(0, 0, 0, 0); monday.setDate(now.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      const iso = isoOf(d);
      return { name: DAY_NAMES[i], num: d.getDate(), date: iso, today: iso === todayISO };
    });
  }, [now, todayISO]);

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
        id: e.id, name, date, start, end: end > start ? end : start + 50,
        startISO: e.start, matched,
        topic: c?.topic ?? null,
        fileHref: c?.fileHref ?? (c?.id ? `/profil/${c.id}` : null),
        phone: c?.phone ?? null, reviewed: !!c?.reviewed, tone: toneFor(name),
        fee: c?.fee != null ? Number(c.fee) : null,
      };
    });
  }, [events, resolveClient]);

  type Appt = (typeof ALL)[number];

  const todayAppts = useMemo(() => ALL.filter((a) => a.date === todayISO).sort((x, y) => x.start - y.start), [ALL, todayISO]);
  const nextAppt = useMemo(() => todayAppts.find((a) => a.start >= nowMinutes) ?? null, [todayAppts, nowMinutes]);
  const conflict = useMemo(() => {
    for (let i = 1; i < todayAppts.length; i++) {
      const gap = todayAppts[i].start - todayAppts[i - 1].end;
      if (gap < 10) return { prev: todayAppts[i - 1], next: todayAppts[i], gap };
    }
    return null;
  }, [todayAppts]);

  const history = useMemo(() => {
    const nowISO = `${todayISO}T${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    return ALL.filter((a) => a.startISO < nowISO).sort((x, y) => y.startISO.localeCompare(x.startISO)).slice(0, 40);
  }, [ALL, todayISO, now]);

  const weekRange = `${week[0]?.num} – ${week[6]?.num} ${MONTHS[new Date(week[6]?.date + 'T12:00:00').getMonth()]} ${new Date(week[6]?.date + 'T12:00:00').getFullYear()}`;
  const todayLabel = `${now.getDate()} ${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()} · ${['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][now.getDay()]}`;

  const dev = useMemo(() => {
    const g = gelisimEvents ?? [];
    if (!g.length) return null;
    const toItem = (x: GelisimEv) => ({ date: x.date, kind: 'Etkinlik', title: x.title, meta: `${x.time} · ${x.durationMin} dk`, progress: 0 });
    return { upcoming: g.filter((x) => !x.done).map(toItem), completed: g.filter((x) => x.done).map(toItem) };
  }, [gelisimEvents]);

  // tab değişince scroll top
  const goTab = (t: SubTab) => { setSubTab(t); if (modalBodyRef.current) modalBodyRef.current.scrollTop = 0; };
  const open = (a: Appt) => { onOpenClient?.(a.name); };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true); setSyncLabel('Senkronize ediliyor…');
    try { await onManualSync?.(); } finally {
      setSyncLabel('Güncel · ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
      setSyncing(false);
      setTimeout(() => setSyncLabel('macOS Calendar'), 3000);
    }
  };

  const TABS: { key: SubTab; label: string; cnt?: number }[] = [
    { key: 'takvim', label: 'Takvim', cnt: todayAppts.length },
    { key: 'hazirlik', label: 'Seansa Hazırlık', cnt: todayAppts.length },
    { key: 'musaitlik', label: 'Müsaitlik' },
    { key: 'gecmis', label: 'Geçmiş' },
    { key: 'sms', label: 'SMS', cnt: todayAppts.filter((a) => a.matched).length },
  ];

  // ── EVENT BLOK (hafta) ──
  const EvBlock = ({ a, dayMode = false }: { a: Appt; dayMode?: boolean }) => {
    const px = dayMode ? 64 : HOUR_PX;
    const top = (a.start - AXIS_START) / 60 * px;
    const h = Math.max(dayMode ? 50 : 32, (a.end - a.start) / 60 * px - 4);
    const past = a.date === todayISO && a.end <= nowMinutes && (!nextAppt || a.id !== nextAppt.id);
    const isNext = !!nextAppt && a.id === nextAppt.id;
    const roomy = h >= (dayMode ? 72 : 64);
    return (
      <div className={`ev ${past ? 'past' : ''} ${isNext ? 'next' : ''}`} style={{ top, height: h, ['--ev-bg' as any]: a.tone.bg, ['--ev-ink' as any]: a.tone.ink }} onClick={() => open(a)}>
        {dayMode && isNext ? <span className="ev-flag">sıradaki · {Math.max(0, a.start - nowMinutes)} dk</span> : <button className="ev-dots" aria-hidden>⋯</button>}
        <span className="ev-name">{a.name}</span>
        <span className="ev-time">{hhmm(a.start)} – {hhmm(a.end)}</span>
        {dayMode && a.matched && h >= 72 && a.topic ? <span className="ev-topic">{a.topic}</span> : null}
        {a.matched && a.reviewed && roomy ? <span className="ev-confirm">incelendi</span>
          : (!a.matched && roomy ? <span className="ev-confirm nm">eşleşme yok</span> : null)}
      </div>
    );
  };

  const NowLine = ({ dayMode = false }: { dayMode?: boolean }) => {
    if (!mounted || nowMinutes < AXIS_START || nowMinutes > AXIS_END) return null;
    const px = dayMode ? 64 : HOUR_PX;
    const top = (nowMinutes - AXIS_START) / 60 * px + (dayMode ? 0 : 6);
    return <div className={`nowline ${dayMode ? 'day' : ''}`} style={{ top }}><span className="lab">{hhmm(nowMinutes)}</span></div>;
  };

  const hours = []; for (let m = AXIS_START; m < AXIS_END; m += 60) hours.push(m);

  // ── Yan ray (haftalık özet + çakışma) ──
  const WeekSide = () => {
    const counts = week.map((d) => ALL.filter((a) => a.date === d.date).length);
    const maxCnt = Math.max(1, ...counts);
    const total = week.reduce((s, _, i) => s + counts[i], 0);
    const workDays = week.filter((d) => d.name !== 'Cmt' && d.name !== 'Paz').length || 1;
    const avg = (total / workDays).toFixed(1).replace('.', ',');
    const peakIdx = counts.indexOf(Math.max(...counts));
    const peakFull = { Pzt: 'Pazartesi', Sal: 'Salı', Çar: 'Çarşamba', Per: 'Perşembe', Cum: 'Cuma', Cmt: 'Cumartesi', Paz: 'Pazar' }[week[peakIdx].name];

    // ── Tahmini haftalık kazanç (fiyatı OLMAYAN danışanlar hesaba KATILMAZ) ──
    const weekDates = new Set(week.map((d) => d.date));
    const weekAppts = ALL.filter((a) => weekDates.has(a.date));
    const feeAppts = weekAppts.filter((a) => a.fee != null);
    const feeCount = feeAppts.length;
    const excludedCount = weekAppts.length - feeCount; // fiyatsız → hariç tutulan seans
    const weekEarn = feeAppts.reduce((s, a) => s + (a.fee as number), 0);
    const perSession = feeCount ? Math.round(weekEarn / feeCount) : 0;
    const tl = (n: number) => `₺${Math.round(n).toLocaleString('tr-TR')}`;

    return (
      <>
        <div className="side-card">
          <span className="eyebrow">bu hafta · özet</span>
          <h3 className="sc-title">7 gün, <i>{total}</i> seans.</h3>
          <ul className="wsum">
            {week.map((d, i) => (
              <li key={d.date} className={`${d.today ? 'is-today' : ''} ${counts[i] === 0 ? 'zero' : ''}`}>
                <span className="wd-lbl">{d.name}</span>
                <span className="wsum-track"><span className="wsum-fill" style={{ width: `${Math.round(counts[i] / maxCnt * 100)}%` }} /></span>
                <span className="wd-cnt num">{counts[i]}</span>
              </li>
            ))}
          </ul>
          <div className="wsum-foot">
            <div className="pk"><span className="l">en yoğun gün</span><span className="v">{peakFull} · {counts[peakIdx]} seans</span></div>
            <div className="avg"><div className="v num">{avg}</div><div className="l">gün ort.</div></div>
          </div>
        </div>

        <div className="side-card earn">
          <span className="eyebrow">tahmini haftalık kazanç</span>
          {feeCount > 0 ? (
            <>
              <div className="earn-big num">{tl(weekEarn)}</div>
              <div className="earn-sub">
                <span><b className="num">{tl(perSession)}</b> ort. / seans</span>
                <span><b className="num">{feeCount}</b> ücretli seans</span>
              </div>
              {excludedCount > 0 && (
                <p className="earn-note">{excludedCount} fiyatsız seans hesaba katılmadı (yalnızca ücreti girilmiş danışanlar sayılır).</p>
              )}
            </>
          ) : (
            <p className="earn-empty">Henüz fiyatlı seans yok. Danışan dosyasındaki <b>“seans ücreti”</b> alanını doldurunca haftalık kazanç burada hesaplanır.</p>
          )}
          {missingFeeCount > 0 && (
            <button type="button" className="earn-warn" onClick={() => onEditMissingFees?.()}>
              <span className="ew-ic" aria-hidden="true">!</span>
              <span className="ew-tx"><b>{missingFeeCount}</b> sayıda danışanın fiyat bilgisi girilmemiştir. <u>Düzenleyin.</u></span>
            </button>
          )}
        </div>
        {conflict && (
          <div className="side-card alert"><span className="al-icon" />
            <span className="eyebrow">Çakışma uyarısı</span>
            <p>Bugün <b>{hhmm(conflict.prev.start)} {conflict.prev.name}</b> ile <b>{hhmm(conflict.next.start)} {conflict.next.name}</b> arasında yalnızca <b>{conflict.gap} dk</b> var — hazırlık payı yetersiz.</p>
          </div>
        )}
      </>
    );
  };

  // ── Takvim görünümleri ──
  const WeekView = () => (
    <div className="cal-wrap">
      <div className="cal-card">
        <div className="wk-head">
          <div />
          {week.map((d) => <div key={d.date} className={`wd ${d.today ? 'today' : ''}`}><span className="wd-name">{d.name}</span><span className="wd-num num">{d.num}</span></div>)}
        </div>
        <div className="wk-body" style={{ height: (AXIS_END - AXIS_START) / 60 * HOUR_PX + 8 }}>
          <div className="axis">{hours.map((m) => <span key={m}>{hhmm(m)}</span>)}</div>
          {week.map((d) => (
            <div key={d.date} className={`col ${d.today ? 'today' : ''}`}>
              {ALL.filter((a) => a.date === d.date).map((a) => <EvBlock key={a.id} a={a} />)}
            </div>
          ))}
          <NowLine />
        </div>
      </div>
      <div className="side"><WeekSide /></div>
    </div>
  );

  const DayView = () => (
    <div className="day-wrap">
      <div className="cal-card">
        {todayAppts.length ? (
          <div className="day-body" style={{ height: (AXIS_END - AXIS_START) / 60 * 64 + 8 }}>
            <div className="axis">{hours.map((m) => <span key={m}>{hhmm(m)}</span>)}</div>
            <div className="day-col">{todayAppts.map((a) => <EvBlock key={a.id} a={a} dayMode />)}<NowLine dayMode /></div>
          </div>
        ) : <Empty t="Bugün için randevu yok." s="macOS Takvim'de bugüne ait etkinlik bulunamadı." />}
      </div>
      <div className="side"><WeekSide /></div>
    </div>
  );

  const MonthView = () => {
    const y = now.getFullYear(), mo = now.getMonth();
    const firstDow = (new Date(y, mo, 1).getDay() + 6) % 7;
    const days = new Date(y, mo + 1, 0).getDate();
    const byDate: Record<string, Appt[]> = {};
    ALL.forEach((a) => { (byDate[a.date] = byDate[a.date] || []).push(a); });
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(<div key={`o${i}`} className="mcell out" />);
    for (let d = 1; d <= days; d++) {
      const ds = `${y}-${pad2(mo + 1)}-${pad2(d)}`;
      const list = (byDate[ds] || []).sort((x, y2) => x.start - y2.start);
      cells.push(
        <div key={ds} className={`mcell ${ds === todayISO ? 'is-today' : ''}`}>
          <span className="mn num">{d}</span>
          <div className="mdot">
            {list.slice(0, 3).map((a) => <span key={a.id} className="me" style={{ ['--ev-spine' as any]: a.tone.ink }} onClick={() => open(a)}><i />{hhmm(a.start)} {a.name.split(' ')[0]}</span>)}
            {list.length > 3 && <span className="more">+{list.length - 3} daha</span>}
          </div>
        </div>,
      );
    }
    return <div className="cal-card"><div className="month-grid">{DAY_NAMES.map((n) => <div key={n} className="mh">{n}</div>)}{cells}</div></div>;
  };

  const Empty = ({ t, s }: { t: string; s: string }) => (
    <div className="empty"><div className="e-mark">∅</div><div className="e-title">{t}</div><div className="e-sub">{s}</div></div>
  );
  const PanelHead = ({ title, sub }: { title: string; sub?: React.ReactNode }) => (
    <div className="panel-head"><div className="ph-l"><h1 className="ph-title">{title}</h1>{sub ? <p className="ph-sub">{sub}</p> : null}</div></div>
  );

  // ── SMS ──
  const fillTpl = (a: Appt) => SMS_TEMPLATES[1].body.replace('{isim}', a.name.split(' ')[0]).replace('{saat}', hhmm(a.start));
  const toggleSms = (id: string) => setSmsSel((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  // varsayılan seçim: eşleşen + telefonu olanlar
  useEffect(() => {
    setSmsSel(new Set(todayAppts.filter((a) => a.matched && a.phone).map((a) => a.id)));
    setSmsSent(false);
  }, [todayAppts]);
  const smsSelCount = smsSel.size;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="trv">
        <div className="shell">

          {/* ÜST BAR */}
          <div className="topbar">
            <div className="tb-left">
              <button className="back" type="button" onClick={() => (onBack ? onBack() : onNav?.('home'))}><span className="chev">‹</span>Ana Sayfa</button>
              <div className="tb-date"><span className="e">bugün</span><span className="d">{todayLabel}</span></div>
            </div>
            <div className="topbar-right">
              <button className="sync" type="button" onClick={handleSync}><span className="dot" />{syncLabel}</button>
              <button className="btn-new" type="button" onClick={() => onNewAppointment?.()}>Yeni randevu<span className="circ">+</span></button>
            </div>
          </div>

          {/* SEKME ÇUBUĞU */}
          <div className="tabbar">
            <div className="tabs">
              {TABS.map((t) => (
                <button key={t.key} className={`tab ${subTab === t.key ? 'active' : ''}`} type="button" onClick={() => goTab(t.key)}>
                  {t.label}{t.cnt != null && <span className="cnt num">{t.cnt}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-body" ref={modalBodyRef}>
            <main>

              {/* 1 · TAKVİM */}
              {subTab === 'takvim' && (
                <div className="panel" data-screen-label="Takvim">
                  <div className="panel-head">
                    <div className="ph-l"><span className="eyebrow">Takvim · macOS Randevular</span><h1 className="ph-title">Takvim &amp; <i>Randevular</i></h1></div>
                    <div className="view-ctl">
                      <div className="seg">
                        {(['gun', 'hafta', 'ay'] as CalMode[]).map((m) => (
                          <button key={m} className={calMode === m ? 'on' : ''} onClick={() => setCalMode(m)}>{m === 'gun' ? 'Gün' : m === 'hafta' ? 'Hafta' : 'Ay'}</button>
                        ))}
                      </div>
                      <div className="wknav">
                        <button title="Önceki">‹</button>
                        <button className="today-btn">Bugün</button>
                        <button title="Sonraki">›</button>
                        <span className="wk-range mono">{weekRange}</span>
                      </div>
                    </div>
                  </div>
                  {calMode === 'hafta' ? <WeekView /> : calMode === 'gun' ? <DayView /> : <MonthView />}
                </div>
              )}

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
                            {n.matched
                              ? <button className="btn btn-primary" onClick={() => onPrepareSession?.(n.name)}>Hazırlığa geç →</button>
                              : <button className="btn btn-primary" onClick={() => open(n)}>Danışan eşleştir</button>}
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
                            <div className={`sms-state ${smsSent && on ? 'sent' : ''}`}>{smsSent && on ? 'gönderildi' : can ? 'gönderilecek' : 'atlandı'}</div>
                          </div>
                        );
                      })}
                      <div className="sms-foot">
                        <span className="eyebrow">{smsSelCount} mesaj seçili</span>
                        <button className={`btn ${smsSent ? 'btn-light' : 'btn-dark'}`} onClick={() => setSmsSent(true)} disabled={smsSelCount === 0}>{smsSent ? 'Gönderildi ✓' : 'Toplu gönder'}</button>
                      </div>
                    </div>
                    <div className="side-card" style={{ alignSelf: 'start' }}>
                      <span className="eyebrow">şablonlar</span>
                      <div className="tmpl">{SMS_TEMPLATES.map((t) => <div key={t.name} className="t"><span className="tn">{t.name}</span>{t.body}</div>)}</div>
                      <p style={{ fontSize: '11.5px', color: 'var(--ink-faint)', margin: '14px 0 0', lineHeight: 1.5 }}>Telefon yalnızca danışan kaydıyla eşleşen randevular için bilinir; eşleşmeyenler otomatik atlanır.</p>
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

            </main>
          </div>

          <nav className="dock">
            {DOCK.map((d) => <a key={d.target} href="#" className={d.active ? 'active' : ''} onClick={(e) => { e.preventDefault(); onNav?.(d.target); }}>{d.label}</a>)}
          </nav>

        </div>
      </div>
    </>
  );
}
