'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  Plus, RefreshCw, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Calendar as CalendarIcon, Share2, AlertTriangle,
  Sparkles, ArrowRight, Check, CheckCircle2, XCircle, Clock,
  Send, FileText, Search, MessageSquare,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

export type TakvimSubTab = 'takvim' | 'hazirlik' | 'musaitlik' | 'gecmis' | 'sms' | 'gelisim';

export type GelisimEvent = {
  id: string;
  title: string;
  date: string;      // "YYYY-MM-DD"
  time: string;      // "HH:MM"
  durationMin: number;
  done?: boolean;
};

export type SyncStatus = { lastSync: string; healthy: boolean };

export type WeekSummary = {
  days: { name: string; count: number; emptySlots: number; isToday?: boolean }[];
  conflicts?: { copy: string }[];
};

export type NextSession = {
  time:               string;
  name:               string;
  modality:           string;
  issue:              string;
  lastNoteSummary:    string;
  homework:           { label: string; done: boolean }[];
  suggestedFocus?:    string;
};

export type SmsReminder = {
  id:         string;
  clientName: string;
  time:       string;
  preview:    string;
  status:     'pending' | 'sent' | 'failed';
};

export type SmsTemplate = {
  id:    string;
  title: string;
  body:  string;
};

export type TodaySummary = {
  sessions:          number;
  freeHours:         number;
  pendingReminders:  number;
};

export type TakvimPanelProps = {
  subTab?:           TakvimSubTab;
  onChangeSubTab?:   (t: TakvimSubTab) => void;

  weekCalendarSlot?: ReactNode;
  musaitlikSlot?:    ReactNode;
  randevuPanelSlot?: ReactNode;

  syncStatus?:           SyncStatus;
  onCreateAppointment?:  () => void;
  onManualSync?:         () => void;

  weekSummary?:       WeekSummary;
  onShareFreeSlots?:  () => void;

  nextSession?:               NextSession;
  otherSessions?:             { time: string; name: string; modality: string }[];
  onOpenInterventionSuggest?: () => void;
  onToggleHomework?:          (index: number, done: boolean) => void;

  workingHoursChips?:  string[];
  blockedDates?:       { date: string; reason: string }[];

  historyFilters?: {
    startDate?: string;
    endDate?:   string;
    modality?:  string;
    client?:    string;
  };
  onChangeHistoryFilter?: (next: NonNullable<TakvimPanelProps['historyFilters']>) => void;
  periodStats?: { sessions: number; cancelled: number; noShow: number };

  smsReminders?: SmsReminder[];
  smsTemplates?: SmsTemplate[];
  onSendBulkSms?:   () => void;
  onEditTemplate?:  (id: string) => void;
  onCreateTemplate?: () => void;

  todaySummary?: TodaySummary;

  todayDate?: string;
  todayLabel?: string;

  gelisimEvents?: GelisimEvent[];
  onToggleGelisimDone?: (id: string, done: boolean) => void;
};

// ─── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_WEEK_SUMMARY: WeekSummary = {
  days: [
    { name: 'Pzt', count: 4, emptySlots: 2 },
    { name: 'Sal', count: 3, emptySlots: 3, isToday: true },
    { name: 'Çar', count: 2, emptySlots: 4 },
    { name: 'Per', count: 5, emptySlots: 1 },
    { name: 'Cum', count: 3, emptySlots: 3 },
    { name: 'Cmt', count: 1, emptySlots: 2 },
    { name: 'Paz', count: 0, emptySlots: 0 },
  ],
  conflicts: [
    { copy: 'Per 28.05 14:00 — Mert K. ve Selin A. yan yana, hazırlık payı yok.' },
  ],
};

const DEFAULT_NEXT_SESSION: NextSession = {
  time:     '10:00',
  name:     'Elif Yıldız',
  modality: 'ACT · Maruziyet',
  issue:    'Sosyal kaygı — sunum ve toplantılarda donma',
  lastNoteSummary:
    'Geçen seansta yaratıcılık değerine bağlı küçük bir maruziyet üzerinde anlaştık. ' +
    'SUDS başlangıç 7, son 4. "Olumsuz değerlendirilirsem kaybolurum" inancı belirginleşti.',
  homework: [
    { label: 'Haftalık 1 sergi açılışına gitmek (ödevi tamamladı)', done: true },
    { label: 'Sunum öncesi 5 dk defüzyon egzersizi', done: true },
    { label: 'Kamerayı açık tutarak 1 toplantı', done: false },
  ],
  suggestedFocus:
    "'Gözlemleyen ben' egzersizi — bağlam-benlik boyutunu güçlendirir, defüzyon kazanımını sabitler.",
};

const DEFAULT_OTHER_SESSIONS = [
  { time: '13:30', name: 'Mert Karaca', modality: 'BDT · ERP' },
  { time: '16:00', name: 'Selin Aydın', modality: 'CFT · İşleme' },
];

const DEFAULT_BLOCKED = [
  { date: 'Cu 28.05', reason: 'Süpervizyon grubu · 13:00-15:00' },
  { date: 'Pa 30.05', reason: 'Tüm gün — konferans' },
  { date: 'Sa 02.06', reason: 'Öğle arası · 12:00-13:30 (genişletildi)' },
];

const DEFAULT_SMS_REMINDERS: SmsReminder[] = [
  { id: 's1', clientName: 'Elif Y.',  time: '08:00', preview: '"Merhaba Elif, bugün 10:00 seansımız. Görüşmek üzere — Ayşe."',  status: 'sent'    },
  { id: 's2', clientName: 'Mert K.',  time: '11:30', preview: '"Merhaba Mert, bugün 13:30 ERP seansımızı hatırlatmak isterim."', status: 'pending' },
  { id: 's3', clientName: 'Selin A.', time: '14:00', preview: '"Selin merhaba, bugün 16:00 seansımız. Hazırlığınız varsa görüşelim."', status: 'pending' },
  { id: 's4', clientName: 'Burak D.', time: 'Yarın 08:00', preview: '"Burak merhaba, yarın 09:30 çift seansımız."', status: 'pending' },
];

const DEFAULT_SMS_TEMPLATES: SmsTemplate[] = [
  { id: 't1', title: 'Standart hatırlatma',  body: '"Merhaba {ad}, bugün saat {saat} seansımızı hatırlatmak isterim. Görüşmek üzere — Ayşe."' },
  { id: 't2', title: 'Çift seansı',           body: '"Merhaba {ad}, bugün {saat} çift seansımızı bekliyorum. Ortağınızla birlikte gelmenizi rica ederim."' },
  { id: 't3', title: 'İptal teyidi',          body: '"Merhaba {ad}, {tarih} tarihli seansınız iptal edildi. Yeni saat için lütfen geri dönün."' },
];

const DEFAULT_WORKING_HOURS = [
  'Pzt-Cu · 09:00-18:00',
  'Cmt · 10:00-14:00',
  'Pa · kapalı',
];

const DEFAULT_TODAY_SUMMARY: TodaySummary = {
  sessions: 3, freeHours: 2, pendingReminders: 1,
};

// ─── Component ────────────────────────────────────────────────────────────

export default function TakvimPanel({
  subTab: subTabProp,
  onChangeSubTab,
  weekCalendarSlot,
  musaitlikSlot,
  randevuPanelSlot,
  syncStatus = { lastSync: '2 dk önce', healthy: true },
  onCreateAppointment,
  onManualSync,
  weekSummary       = DEFAULT_WEEK_SUMMARY,
  onShareFreeSlots,
  nextSession       = DEFAULT_NEXT_SESSION,
  otherSessions     = DEFAULT_OTHER_SESSIONS,
  onOpenInterventionSuggest,
  onToggleHomework,
  workingHoursChips = DEFAULT_WORKING_HOURS,
  blockedDates      = DEFAULT_BLOCKED,
  historyFilters,
  onChangeHistoryFilter,
  periodStats       = { sessions: 86, cancelled: 7, noShow: 3 },
  smsReminders      = DEFAULT_SMS_REMINDERS,
  smsTemplates      = DEFAULT_SMS_TEMPLATES,
  onSendBulkSms,
  onEditTemplate,
  onCreateTemplate,
  todaySummary      = DEFAULT_TODAY_SUMMARY,
  todayDate         = '26 May 2026',
  todayLabel        = 'Bugün · Salı',
  gelisimEvents     = [],
  onToggleGelisimDone,
}: TakvimPanelProps) {
  const [subTabState, setSubTabState] = useState<TakvimSubTab>('takvim');
  const subTab = subTabProp ?? subTabState;
  const setSubTab = (t: TakvimSubTab) => {
    setSubTabState(t);
    onChangeSubTab?.(t);
  };

  return (
    <div className="tk" data-screen-label={`06 Takvim · ${subTab}`}>
      {/* ── TOP BAR ─────────────────────────────────────── */}
      <header className="tk-top">
        <div className="tk-top-row1">
          <div className="tk-top-left">
            <span className="tk-eyebrow">{todayLabel.toUpperCase()} · {todayDate.toUpperCase()}</span>
            <h1 className="tk-title">Takvim</h1>
          </div>
          <div className="tk-top-right">
            <button
              type="button"
              className={`tk-sync ${syncStatus.healthy ? 'ok' : 'bad'}`}
              onClick={onManualSync}
              title="macOS Calendar ile senkronize et"
            >
              <span className="tk-sync-dot" />
              macOS Calendar · {syncStatus.lastSync}
            </button>
            <button type="button" className="tk-btn tk-btn-primary" onClick={onCreateAppointment}>
              <Plus size={14} strokeWidth={2} /> Yeni randevu
            </button>
          </div>
        </div>

        <nav className="tk-subtabs" role="tablist" aria-label="Takvim alt sekmeleri">
          {([
            { k: 'takvim',    l: 'Takvim'           },
            { k: 'hazirlik',  l: 'Seansa Hazırlık'  },
            { k: 'musaitlik', l: 'Müsaitlik'        },
            { k: 'gecmis',    l: 'Geçmiş'           },
            { k: 'sms',       l: 'SMS'              },
            { k: 'gelisim',   l: 'Gelişim Planı'    },
          ] as const).map((t) => (
            <button
              key={t.k} role="tab" type="button"
              aria-selected={subTab === t.k}
              className={`tk-subtab ${subTab === t.k ? 'on' : ''}`}
              onClick={() => setSubTab(t.k)}
            >
              {t.l}
            </button>
          ))}
        </nav>
      </header>

      {/* ── MAIN ────────────────────────────────────────── */}
      <div className="tk-main">
        {subTab === 'takvim' && (
          <TakvimView
            weekCalendarSlot={weekCalendarSlot}
            weekSummary={weekSummary}
            onShareFreeSlots={onShareFreeSlots}
          />
        )}
        {subTab === 'hazirlik' && (
          <HazirlikView
            nextSession={nextSession}
            otherSessions={otherSessions}
            onOpenInterventionSuggest={onOpenInterventionSuggest}
            onToggleHomework={onToggleHomework}
          />
        )}
        {subTab === 'musaitlik' && (
          <MusaitlikView
            musaitlikSlot={musaitlikSlot}
            workingHoursChips={workingHoursChips}
            blockedDates={blockedDates}
          />
        )}
        {subTab === 'gecmis' && (
          <GecmisView
            randevuPanelSlot={randevuPanelSlot}
            filters={historyFilters}
            onChangeFilter={onChangeHistoryFilter}
            periodStats={periodStats}
          />
        )}
        {subTab === 'sms' && (
          <SmsView
            reminders={smsReminders}
            templates={smsTemplates}
            onSendBulkSms={onSendBulkSms}
            onEditTemplate={onEditTemplate}
            onCreateTemplate={onCreateTemplate}
          />
        )}
        {subTab === 'gelisim' && (
          <GelisimView
            events={gelisimEvents}
            onToggleDone={onToggleGelisimDone}
          />
        )}
      </div>

      {/* ── BOTTOM BAR ──────────────────────────────────── */}
      <footer className="tk-bottom">
        <div className="tk-bottom-left">
          <button
            type="button"
            className={`tk-sync sm ${syncStatus.healthy ? 'ok' : 'bad'}`}
            onClick={onManualSync}
          >
            <RefreshCw size={12} strokeWidth={1.8} />
            macOS Calendar · {syncStatus.lastSync}
          </button>
        </div>
        <div className="tk-bottom-right">
          <span className="tk-bottom-sum">
            <strong>{todaySummary.sessions}</strong> seans
            <span className="tk-dot" />
            <strong>{todaySummary.freeHours}</strong> saat boşluk
            <span className="tk-dot" />
            <strong>{todaySummary.pendingReminders}</strong> hatırlatma bekliyor
          </span>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// A — TAKVİM
// ─────────────────────────────────────────────────────────────────────────

function TakvimView({
  weekCalendarSlot, weekSummary, onShareFreeSlots,
}: {
  weekCalendarSlot?: ReactNode;
  weekSummary: WeekSummary;
  onShareFreeSlots?: () => void;
}) {
  return (
    <div className="tk-grid tk-grid-cal">
      <main className="tk-cal">
        <div className="tk-cal-toolbar">
          <div className="tk-cal-toolbar-nav">
            <button type="button" className="tk-icon-btn sm" aria-label="Önceki hafta">
              <ChevronLeft size={14} strokeWidth={1.8} />
            </button>
            <span className="tk-cal-week">
              <CalendarIcon size={13} strokeWidth={1.8} />
              26 May – 1 Haz · Hafta 22
            </span>
            <button type="button" className="tk-icon-btn sm" aria-label="Sonraki hafta">
              <ChevronRight size={14} strokeWidth={1.8} />
            </button>
            <button type="button" className="tk-btn tk-btn-ghost sm" style={{ marginLeft: 8 }}>
              Bugüne dön
            </button>
          </div>
          <div className="tk-cal-toolbar-zoom">
            <button type="button" className="tk-icon-btn sm" aria-label="Uzaklaş">
              <ZoomOut size={13} strokeWidth={1.8} />
            </button>
            <button type="button" className="tk-icon-btn sm" aria-label="Yakınlaş">
              <ZoomIn size={13} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div className="tk-cal-slot">
          {weekCalendarSlot ?? <SlotPlaceholder name="WEEK_CALENDAR" />}
        </div>
      </main>

      <aside className="tk-week">
        <div className="tk-card">
          <div className="tk-card-head">
            <span className="tk-eyebrow">bu hafta · özet</span>
            <h3>7 gün, <em>18</em> seans.</h3>
          </div>
          <ul className="tk-week-days">
            {weekSummary.days.map((d) => (
              <li key={d.name} className={d.isToday ? 'today' : ''}>
                <span className="tk-day-name">{d.name}</span>
                <span className="tk-day-bar">
                  {Array.from({ length: Math.max(d.count + d.emptySlots, 1) }).map((_, i) => (
                    <span
                      key={i}
                      className={i < d.count ? 'on' : 'off'}
                      style={{ flex: 1 }}
                    />
                  ))}
                </span>
                <span className="tk-day-meta">
                  <strong>{d.count}</strong>
                  <span>· {d.emptySlots} boş</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {weekSummary.conflicts && weekSummary.conflicts.length > 0 && (
          <div className="tk-card tk-alert">
            <div className="tk-alert-head">
              <AlertTriangle size={14} strokeWidth={2} />
              <strong>Çakışma uyarısı</strong>
            </div>
            {weekSummary.conflicts.map((c, i) => (
              <p key={i}>{c.copy}</p>
            ))}
          </div>
        )}

        <button type="button" className="tk-btn tk-btn-ghost tk-btn-block" onClick={onShareFreeSlots}>
          <Share2 size={13} strokeWidth={1.8} />
          Boş slotları paylaş
          <ArrowRight size={13} strokeWidth={1.8} className="tk-btn-arrow" />
        </button>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// B — HAZIRLIK
// ─────────────────────────────────────────────────────────────────────────

function HazirlikView({
  nextSession, otherSessions, onOpenInterventionSuggest, onToggleHomework,
}: {
  nextSession:            NextSession;
  otherSessions:          { time: string; name: string; modality: string }[];
  onOpenInterventionSuggest?: () => void;
  onToggleHomework?:      (i: number, done: boolean) => void;
}) {
  const [hw, setHw] = useState(nextSession.homework);
  return (
    <div className="tk-grid tk-grid-hzr">
      <main className="tk-hzr-main tk-card">
        <div className="tk-hzr-head">
          <span className="tk-eyebrow">sıradaki seans · 50 dk</span>
          <div className="tk-hzr-title-row">
            <div className="tk-hzr-time">{nextSession.time}</div>
            <div className="tk-hzr-meta">
              <h2 className="tk-hzr-name">
                {nextSession.name.split(' ').slice(0,-1).join(' ')}{' '}
                <em>{nextSession.name.split(' ').slice(-1)[0]}</em>
              </h2>
              <div className="tk-hzr-row2">
                <span className="tk-pill">
                  <span className="tk-pill-dot" />
                  {nextSession.modality}
                </span>
                <span className="tk-hzr-issue">{nextSession.issue}</span>
              </div>
            </div>
          </div>
        </div>

        <section className="tk-hzr-section">
          <span className="tk-eyebrow">son seans notu</span>
          <p className="tk-hzr-note">{nextSession.lastNoteSummary}</p>
        </section>

        <section className="tk-hzr-section">
          <span className="tk-eyebrow">verilen ödevler</span>
          <ul className="tk-hw">
            {hw.map((h, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={`tk-hw-check ${h.done ? 'on' : ''}`}
                  aria-pressed={h.done}
                  onClick={() => {
                    const nx = [...hw];
                    nx[i] = { ...nx[i], done: !nx[i].done };
                    setHw(nx);
                    onToggleHomework?.(i, nx[i].done);
                  }}
                >
                  {h.done && <Check size={11} strokeWidth={2.4} />}
                </button>
                <span className={h.done ? 'done' : ''}>{h.label}</span>
              </li>
            ))}
          </ul>
        </section>

        {nextSession.suggestedFocus && (
          <section className="tk-hzr-focus">
            <div className="tk-hzr-focus-icon"><Sparkles size={14} strokeWidth={1.6} /></div>
            <div className="tk-hzr-focus-body">
              <span className="tk-eyebrow">bu seansta odaklan</span>
              <p>{nextSession.suggestedFocus}</p>
              <button type="button" className="tk-btn tk-btn-primary" onClick={onOpenInterventionSuggest}>
                Müdahale kütüphanesinden öner
                <ArrowRight size={13} strokeWidth={1.8} />
              </button>
            </div>
          </section>
        )}
      </main>

      <aside className="tk-hzr-side">
        <div className="tk-card">
          <div className="tk-card-head">
            <span className="tk-eyebrow">bugünün diğer seansları</span>
            <h3>{otherSessions.length} seans daha.</h3>
          </div>
          <ul className="tk-other-list">
            {otherSessions.map((s, i) => (
              <li key={i}>
                <div className="tk-other-time">{s.time}</div>
                <div className="tk-other-body">
                  <strong>{s.name}</strong>
                  <span>{s.modality}</span>
                </div>
                <ArrowRight size={13} strokeWidth={1.8} />
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// C — MÜSAİTLİK
// ─────────────────────────────────────────────────────────────────────────

function MusaitlikView({
  musaitlikSlot, workingHoursChips, blockedDates,
}: {
  musaitlikSlot?: ReactNode;
  workingHoursChips: string[];
  blockedDates: { date: string; reason: string }[];
}) {
  return (
    <div className="tk-grid tk-grid-msl">
      <main className="tk-card tk-msl-main">
        <div className="tk-msl-hours">
          <span className="tk-eyebrow">çalışma saatleri</span>
          <div className="tk-msl-chips">
            {workingHoursChips.map((c, i) => (
              <span key={i} className="tk-chip">{c}</span>
            ))}
            <button type="button" className="tk-chip-add">
              <Plus size={11} strokeWidth={2} /> Şablon ekle
            </button>
          </div>
        </div>

        <div className="tk-msl-slot">
          {musaitlikSlot ?? <SlotPlaceholder name="MUSAITLIK_PANEL" />}
        </div>

        <div className="tk-msl-blocks">
          <div className="tk-card-head">
            <span className="tk-eyebrow">bloklu tarihler</span>
            <h3>Şu an <em>{blockedDates.length}</em> blok aktif.</h3>
          </div>
          <ul className="tk-blocks-list">
            {blockedDates.map((b, i) => (
              <li key={i}>
                <span className="tk-block-date">{b.date}</span>
                <span className="tk-block-reason">{b.reason}</span>
                <button type="button" className="tk-icon-btn sm" aria-label="Kaldır">
                  <XCircle size={13} strokeWidth={1.8} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// D — GEÇMİŞ
// ─────────────────────────────────────────────────────────────────────────

function GecmisView({
  randevuPanelSlot, filters, onChangeFilter, periodStats,
}: {
  randevuPanelSlot?: ReactNode;
  filters?:          TakvimPanelProps['historyFilters'];
  onChangeFilter?:   TakvimPanelProps['onChangeHistoryFilter'];
  periodStats:       { sessions: number; cancelled: number; noShow: number };
}) {
  const f = filters ?? { startDate: '01.04.2026', endDate: '26.05.2026', modality: 'Hepsi', client: '' };
  const update = (patch: Partial<NonNullable<TakvimPanelProps['historyFilters']>>) => {
    onChangeFilter?.({ ...f, ...patch });
  };
  return (
    <div className="tk-grid tk-grid-gec">
      <main className="tk-card tk-gec-main">
        <div className="tk-gec-filters">
          <div className="tk-filter">
            <span className="tk-eyebrow">tarih</span>
            <div className="tk-filter-input">
              <input type="text" value={f.startDate ?? ''} onChange={(e) => update({ startDate: e.target.value })} />
              <span>→</span>
              <input type="text" value={f.endDate ?? ''} onChange={(e) => update({ endDate: e.target.value })} />
            </div>
          </div>
          <div className="tk-filter">
            <span className="tk-eyebrow">ekol</span>
            <select className="tk-filter-input" value={f.modality ?? 'Hepsi'} onChange={(e) => update({ modality: e.target.value })}>
              {['Hepsi', 'BDT', 'ACT', 'EFT', 'CFT', 'EMDR', 'Şema'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="tk-filter tk-filter-grow">
            <span className="tk-eyebrow">danışan</span>
            <div className="tk-filter-input tk-search-in">
              <Search size={13} strokeWidth={1.8} />
              <input
                type="text"
                value={f.client ?? ''}
                placeholder="İsme göre ara"
                onChange={(e) => update({ client: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="tk-gec-slot">
          {randevuPanelSlot ?? <SlotPlaceholder name="RANDEVU_PANEL · geçmiş" />}
        </div>
      </main>

      <aside className="tk-card tk-gec-side">
        <div className="tk-card-head">
          <span className="tk-eyebrow">dönem istatistiği</span>
          <h3>Son <em>56 gün</em>.</h3>
        </div>
        <div className="tk-gec-stats">
          <Stat label="Toplam seans" value={periodStats.sessions} big />
          <Stat label="İptal"        value={periodStats.cancelled} tone="muted" />
          <Stat label="No-show"      value={periodStats.noShow}    tone="risk"  />
        </div>
        <p className="tk-gec-aside">
          İptal oranı %{Math.round((periodStats.cancelled / periodStats.sessions) * 100)} —
          klinik ortalamanın altında.
        </p>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// E — SMS
// ─────────────────────────────────────────────────────────────────────────

function SmsView({
  reminders, templates, onSendBulkSms, onEditTemplate, onCreateTemplate,
}: {
  reminders:        SmsReminder[];
  templates:        SmsTemplate[];
  onSendBulkSms?:    () => void;
  onEditTemplate?:   (id: string) => void;
  onCreateTemplate?: () => void;
}) {
  const pending = reminders.filter((r) => r.status === 'pending').length;
  return (
    <div className="tk-grid tk-grid-sms">
      <main className="tk-sms-main">
        <div className="tk-card">
          <div className="tk-card-head tk-sms-head">
            <div>
              <span className="tk-eyebrow">bugünün hatırlatmaları</span>
              <h3><em>{reminders.length}</em> mesaj, <em>{pending}</em> bekliyor.</h3>
            </div>
            <button type="button" className="tk-btn tk-btn-primary" onClick={onSendBulkSms}>
              <Send size={13} strokeWidth={1.8} /> Toplu gönder
            </button>
          </div>
          <ul className="tk-sms-list">
            {reminders.map((r) => (
              <li key={r.id} className={`tk-sms-row tk-sms-${r.status}`}>
                <div className="tk-sms-when">
                  <Clock size={12} strokeWidth={1.8} />
                  {r.time}
                </div>
                <div className="tk-sms-body">
                  <strong>{r.clientName}</strong>
                  <p>{r.preview}</p>
                </div>
                <SmsStatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </div>
      </main>

      <aside className="tk-sms-side">
        <div className="tk-card">
          <div className="tk-card-head tk-sms-tpl-head">
            <div>
              <span className="tk-eyebrow">şablonlar</span>
              <h3>{templates.length} şablon.</h3>
            </div>
            <button type="button" className="tk-btn tk-btn-ghost sm" onClick={onCreateTemplate}>
              <Plus size={12} strokeWidth={2} /> Yeni
            </button>
          </div>
          <ul className="tk-tpl-list">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button" className="tk-tpl"
                  onClick={() => onEditTemplate?.(t.id)}
                >
                  <div className="tk-tpl-top">
                    <FileText size={12} strokeWidth={1.8} />
                    <span>{t.title}</span>
                  </div>
                  <p>{t.body}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function SmsStatusBadge({ status }: { status: SmsReminder['status'] }) {
  if (status === 'sent')   return <span className="tk-sms-badge sent"><CheckCircle2 size={11} strokeWidth={2} /> gönderildi</span>;
  if (status === 'failed') return <span className="tk-sms-badge failed"><XCircle size={11} strokeWidth={2} /> başarısız</span>;
  return <span className="tk-sms-badge pending"><Clock size={11} strokeWidth={2} /> bekliyor</span>;
}

// ─── Sub-atoms ────────────────────────────────────────────────────────────

function Stat({
  label, value, big, tone,
}: { label: string; value: number | string; big?: boolean; tone?: 'muted' | 'risk' | 'good' }) {
  return (
    <div className={`tk-stat ${big ? 'big' : ''}`}>
      <span className="tk-eyebrow">{label}</span>
      <span className={`tk-stat-val tone-${tone ?? 'ink'}`}>{value}</span>
    </div>
  );
}

function SlotPlaceholder({ name }: { name: string }) {
  return (
    <div className="tk-placeholder">
      <svg viewBox="0 0 600 360" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id={`tk-stripes-${name}`} patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(14,15,18,0.04)" strokeWidth="14" />
          </pattern>
        </defs>
        <rect width="600" height="360" fill={`url(#tk-stripes-${name})`} />
        <g transform="translate(300 180)">
          <rect x="-110" y="-22" width="220" height="44" rx="22" fill="var(--paper)" stroke="rgba(14,15,18,0.18)" strokeWidth="1.4" />
          <text textAnchor="middle" y="5" fontFamily="var(--mono, monospace)" fontSize="12" fill="var(--muted, #7B7C82)">
            {name}_SLOT
          </text>
        </g>
      </svg>
    </div>
  );
}

// ─── GelisimView ────────────────────────────────────────────────────────────

function GelisimView({
  events,
  onToggleDone,
}: {
  events: GelisimEvent[];
  onToggleDone?: (id: string, done: boolean) => void;
}) {
  const fmt = (dateStr: string) => {
    try {
      return new Date(dateStr + 'T12:00:00').toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  const upcoming = events.filter(e => !e.done).sort((a, b) => a.date.localeCompare(b.date));
  const done     = events.filter(e =>  e.done).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="tk-gelisim">
      <div className="tk-gelisim-head">
        <div>
          <span className="tk-eyebrow">gelişim planı</span>
          <h2 className="tk-gelisim-title">Eğitim & <em>Yatırım</em> Takvimi</h2>
        </div>
        <div className="tk-gelisim-stats">
          <span className="tk-gelisim-stat">
            <strong>{upcoming.length}</strong> yaklaşan
          </span>
          <span className="tk-gelisim-stat done">
            <strong>{done.length}</strong> tamamlanan
          </span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="tk-gelisim-empty">
          <CalendarIcon size={32} strokeWidth={1.2} />
          <p>Henüz gelişim etkinliği eklenmedi.</p>
          <p className="tk-gelisim-empty-hint">Terapist Profili → Aylık Hedefler'den etkinlik ekleyebilirsiniz.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="tk-gelisim-group">
              <span className="tk-gelisim-group-label">Yaklaşan</span>
              <div className="tk-gelisim-list">
                {upcoming.map(ev => (
                  <article key={ev.id} className="tk-gelisim-card">
                    <div className="tk-gelisim-card-date">
                      <span className="tk-gelisim-day">
                        {new Date(ev.date + 'T12:00:00').getDate()}
                      </span>
                      <span className="tk-gelisim-mon">
                        {new Date(ev.date + 'T12:00:00').toLocaleDateString('tr-TR', { month: 'short' })}
                      </span>
                    </div>
                    <div className="tk-gelisim-card-body">
                      <span className="tk-gelisim-card-time">{ev.time} · {ev.durationMin} dk</span>
                      <h4 className="tk-gelisim-card-title">{ev.title}</h4>
                      <span className="tk-gelisim-card-full">{fmt(ev.date)}</span>
                    </div>
                    <button
                      type="button"
                      className="tk-gelisim-check"
                      onClick={() => onToggleDone?.(ev.id, true)}
                      title="Tamamlandı olarak işaretle"
                    >
                      <Check size={14} strokeWidth={2} />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div className="tk-gelisim-group">
              <span className="tk-gelisim-group-label">Tamamlananlar</span>
              <div className="tk-gelisim-list">
                {done.map(ev => (
                  <article key={ev.id} className="tk-gelisim-card tk-gelisim-card--done">
                    <div className="tk-gelisim-card-date">
                      <span className="tk-gelisim-day">{new Date(ev.date + 'T12:00:00').getDate()}</span>
                      <span className="tk-gelisim-mon">{new Date(ev.date + 'T12:00:00').toLocaleDateString('tr-TR', { month: 'short' })}</span>
                    </div>
                    <div className="tk-gelisim-card-body">
                      <span className="tk-gelisim-card-time">{ev.time} · {ev.durationMin} dk</span>
                      <h4 className="tk-gelisim-card-title">{ev.title}</h4>
                    </div>
                    <button
                      type="button"
                      className="tk-gelisim-check tk-gelisim-check--done"
                      onClick={() => onToggleDone?.(ev.id, false)}
                      title="Tamamlanmadı olarak işaretle"
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
