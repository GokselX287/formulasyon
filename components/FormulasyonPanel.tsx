'use client';

import { useMemo, useState, useEffect, type ReactNode } from 'react';
import {
  Plus, Minus, Maximize2, RotateCcw, EyeOff, Eye, Share2, Download,
  Sparkles, FileText, ArrowRight, ChevronLeft, ChevronRight,
  AlertTriangle, RefreshCw, CheckCircle2, Network, Radar,
  RotateCw, Map, Layers, Paperclip, FileDown, X, Send, Mail,
  Award, Upload, FileAudio, FileImage, StickyNote, FilePlus2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

export type FormulationViewMode = 'focus' | 'gaps' | 'bdt' | 'act';
export type FormulationVizMode  = 'harita' | 'radar' | 'dongu' | 'vaka' | 'sema';

export type FourP = {
  predisposing:  string[];
  precipitating: string[];
  perpetuating:  string[];
  protective:    string[];
};

export type BeckChain = {
  earlyLife:           string;
  coreBelief:          string;
  rules:               string;
  automaticThoughts:   string[];
};

export type Hexaflex = {
  fusion:           number;
  avoidance:        number;
  selfAsContent:    number;
  presentMoment:    number;
  values:           number;
  committedAction:  number;
};

export type SelectedNode = {
  id?:               string;
  type:              string;
  label:             string;
  content:           string;
  relatedSessions?:  { ix: string; date: string; quote: string }[];
  gaps?:             string[];
};

export type FormulationTemplate = {
  id:           string;
  title:        string;
  description:  string;
  modality:     string;          // "ACT" | "BDT" | "CFT" | "EMDR" …
};

export type FormulationAttachment = {
  id:    string;
  name:  string;
  type:  'pdf' | 'img' | 'audio' | 'note';
  date:  string;
  size?: string;
};

export type FormulasyonPanelProps = {
  client?: { id: string; name: string; age?: number; issue: string };
  viewMode?:        FormulationViewMode;
  vizMode?:         FormulationVizMode;
  maturityScore?:   number;
  fourP?:           FourP;
  beck?:            BeckChain;
  hexaflex?:        Hexaflex;
  selectedNode?:    SelectedNode | null;
  sessionTimeline?: number[];
  summary?:         string;
  stats?:           { nodes: number; edges: number; gaps: number };

  /** Backward-compat: maps to vizSlots.harita when vizSlots is not supplied. */
  mindMapSlot?:     ReactNode;
  /** Per-visualisation slot.  Anything not provided falls back to a striped placeholder. */
  vizSlots?: {
    harita?:  ReactNode;
    radar?:   ReactNode;
    dongu?:   ReactNode;
    vaka?:    ReactNode;
    sema?:    ReactNode;
  };

  /** Age flag — when true, the header chip turns terracotta and a banner offers the child flow. */
  isChild?:                 boolean;
  onSwitchToChildFlow?:     () => void;

  /** Support sheets / modal */
  templates?:               FormulationTemplate[];
  attachments?:             FormulationAttachment[];
  onApplyTemplate?:         (id: string) => void;
  onCreateTemplate?:        () => void;
  onDownloadAttachment?:    (id: string) => void;
  onUploadAttachment?:      () => void;
  onAddNote?:               () => void;
  onExportPdf?:             () => void;
  onEmailSummary?:          () => void;
  onSendToSupervision?:     () => void;

  onViewModeChange?:        (mode: FormulationViewMode) => void;
  onVizModeChange?:         (mode: FormulationVizMode) => void;
  onSelectNode?:            (id: string) => void;
  onCreateIntervention?:    () => void;
  onAddSupervisionNote?:    () => void;
  onRefreshSummary?:        () => void;
  onCheckModelFit?:         () => void;
  onZoomIn?:                () => void;
  onZoomOut?:               () => void;
  onResetView?:             () => void;
  onToggleFullscreen?:      () => void;
  onShare?:                 () => void;
  onExport?:                () => void;
};

// ─── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_CLIENT = {
  id: '142', name: 'Elif Yıldız', age: 28,
  issue: 'Sosyal kaygı — sunum ve toplantılarda donma',
};

const DEFAULT_FOURP: FourP = {
  predisposing:  ['Eleştirel anne figürü', 'Akademik mükemmeliyetçilik', 'Çocuklukta sosyal dışlanma (12 yaş)'],
  precipitating: ['9 ay önce ekip sunumunda donma', 'Sonrasında benzer ortamlardan kaçınma'],
  perpetuating:  ['Kaçınma → kısa vadeli rahatlama', 'Güvenlik davranışları (kamerayı kapatma, susma)', 'Olumsuz öz-değerlendirme döngüsü'],
  protective:    ['İki yakın arkadaş', 'Düzenli egzersiz', 'Yaratıcı işine bağlılık', 'Yüksek terapi motivasyonu'],
};

const DEFAULT_BECK: BeckChain = {
  earlyLife:    'Eleştirel anne, kıyaslayan akademik ortam (lise).',
  coreBelief:   '"Hata yaparsam kaybolurum / sevilmem."',
  rules:        '"Her şeyi doğru yapmalıyım, yoksa beni terk ederler."',
  automaticThoughts: [
    '"Beni yargılıyorlar."',
    '"Sesim titriyor, fark edecekler."',
    '"Bu işi alamayacağım."',
  ],
};

const DEFAULT_HEXAFLEX: Hexaflex = {
  fusion: 8, avoidance: 7, selfAsContent: 6,
  presentMoment: 4, values: 8, committedAction: 5,
};

const DEFAULT_SELECTED_NODE: SelectedNode = {
  id: 'core-belief',
  type: 'Çekirdek inanç',
  label: '"Hata yaparsam kaybolurum"',
  content: 'Çocuklukta eleştirel anne figürüyle pekişen, sevilebilirliği koşula bağlayan derin inanç. Üç farklı seansta benzer ifadelerle yüzeye çıktı.',
  relatedSessions: [
    { ix: 'III', date: '2025.12.05', quote: '"Birini hayal kırıklığına uğratırsam, yerimi başkası alır."' },
    { ix: 'V',   date: '2026.02.15', quote: '"Sunumda bir kelime yutarsam her şey biter."' },
    { ix: 'VI',  date: '2026.04.20', quote: '"Bu kez hata yapmazsam belki kabul edilirim."' },
  ],
  gaps: ['Bu inancın değer çatışmasıyla ilişkisi henüz haritada yok.'],
};

const DEFAULT_TIMELINE = [22, 38, 30, 56, 64, 78];

const DEFAULT_SUMMARY =
  'Elif\'in sosyal kaygı tablosunun arkasındaki örüntü, çocuklukta öğrenilen ' +
  '"her şeyi doğru yapmazsam sevilmem" varsayımına dayanıyor. Yaratıcılık ve ' +
  'otantiklik değerleri güçlü; ancak bağlam-benlik boyutu zayıf, bu da maruziyet ' +
  'sırasında "gözlemleyen ben"e geçişi güçleştiriyor. Sonraki aşamada değer ' +
  'odaklı eylem + kademeli maruziyet protokolü öneriliyor.';

const DEFAULT_TEMPLATES: FormulationTemplate[] = [
  { id: 't-sosyal-act',  title: 'Sosyal kaygı / ACT',     description: 'Defüzyon + değer-odaklı kademeli maruziyet; Hexaflex temelli.',     modality: 'ACT'  },
  { id: 't-okb-erp',     title: 'OKB / BDT-ERP',           description: 'Hiyerarşi → maruz bırakma + tepki önleme; 12 seans iskeleti.',     modality: 'BDT'  },
  { id: 't-yas-cft',     title: 'Yas / CFT',               description: 'Şefkat sistemleri + anlam çalışması; 8-10 seans.',                  modality: 'CFT'  },
  { id: 't-travma-emdr', title: 'Travma / EMDR',           description: '8 fazlı protokol; ön-stabilizasyon + kaynak geliştirme.',          modality: 'EMDR' },
  { id: 't-cift-eft',    title: 'Çift terapisi / EFT',     description: 'Kovala-kaç döngüsü; bağlanma yaralarının yumuşatılması.',          modality: 'EFT'  },
];

const DEFAULT_ATTACHMENTS: FormulationAttachment[] = [
  { id: 'a1', name: 'Anamnez formu — Elif Y.',         type: 'pdf',   date: '2025.11.04', size: '184 KB' },
  { id: 'a2', name: 'LSAS skorlama ekranı',            type: 'img',   date: '2025.11.18', size: '1.2 MB' },
  { id: 'a3', name: 'III. seans · maruziyet rasyoneli', type: 'audio', date: '2025.12.05', size: '6:42'   },
  { id: 'a4', name: 'Değerler matrisi notları',         type: 'note',  date: '2026.01.10', size: '—'      },
  { id: 'a5', name: 'V. seans · ev ödevi geri bildirimi', type: 'pdf', date: '2026.02.15', size: '92 KB'  },
];

// ─── Component ────────────────────────────────────────────────────────────

export default function FormulasyonPanel({
  client          = DEFAULT_CLIENT,
  viewMode:       viewModeProp,
  vizMode:        vizModeProp,
  maturityScore   = 68,
  fourP           = DEFAULT_FOURP,
  beck            = DEFAULT_BECK,
  hexaflex        = DEFAULT_HEXAFLEX,
  selectedNode    = DEFAULT_SELECTED_NODE,
  sessionTimeline = DEFAULT_TIMELINE,
  summary         = DEFAULT_SUMMARY,
  stats           = { nodes: 23, edges: 31, gaps: 4 },
  mindMapSlot,
  vizSlots,
  isChild,
  onSwitchToChildFlow,
  templates       = DEFAULT_TEMPLATES,
  attachments     = DEFAULT_ATTACHMENTS,
  onApplyTemplate, onCreateTemplate,
  onDownloadAttachment, onUploadAttachment, onAddNote,
  onExportPdf, onEmailSummary, onSendToSupervision,
  onViewModeChange,
  onVizModeChange,
  onCreateIntervention,
  onAddSupervisionNote,
  onRefreshSummary,
  onCheckModelFit,
  onZoomIn, onZoomOut, onResetView, onToggleFullscreen,
  onShare, onExport,
}: FormulasyonPanelProps) {
  const [leftCollapsed,  setLeftCollapsed]  = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [showGaps,       setShowGaps]       = useState(true);
  const [viewModeState,  setViewModeState]  = useState<FormulationViewMode>('focus');
  const [vizModeState,   setVizModeState]   = useState<FormulationVizMode>('harita');
  const [openSheet,      setOpenSheet]      = useState<null | 'templates' | 'attachments'>(null);
  const [exportOpen,     setExportOpen]     = useState(false);

  const viewMode = viewModeProp ?? viewModeState;
  const setViewMode = (m: FormulationViewMode) => {
    setViewModeState(m);
    onViewModeChange?.(m);
  };
  const vizMode = vizModeProp ?? vizModeState;
  const setVizMode = (m: FormulationVizMode) => {
    setVizModeState(m);
    onVizModeChange?.(m);
  };

  // Esc closes any open overlay
  useEffect(() => {
    if (!openSheet && !exportOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenSheet(null); setExportOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSheet, exportOpen]);

  const hexItems = useMemo(() => ([
    { key: 'fusion',          label: 'Bilişsel füzyon',  value: hexaflex.fusion,         tone: 'bad'  as const },
    { key: 'avoidance',       label: 'Yaşantısal kaçınma', value: hexaflex.avoidance,    tone: 'bad'  as const },
    { key: 'selfAsContent',   label: 'İçerik-benlik',    value: hexaflex.selfAsContent,  tone: 'bad'  as const },
    { key: 'presentMoment',   label: 'Şimdiki an',       value: hexaflex.presentMoment,  tone: 'good' as const },
    { key: 'values',          label: 'Değerler',         value: hexaflex.values,         tone: 'good' as const },
    { key: 'committedAction', label: 'Eyleme bağlılık',  value: hexaflex.committedAction,tone: 'good' as const },
  ]), [hexaflex]);

  // Resolve which slot to render in the centre
  const activeSlot = useMemo(() => {
    const slots = {
      harita: vizSlots?.harita ?? mindMapSlot,
      radar:  vizSlots?.radar,
      dongu:  vizSlots?.dongu,
      vaka:   vizSlots?.vaka,
      sema:   vizSlots?.sema,
    };
    return slots[vizMode];
  }, [vizSlots, mindMapSlot, vizMode]);

  // Resolve eyebrow + counts copy for active visualisation
  const vizMeta = VIZ_META[vizMode];

  // Show child banner only when isChild AND parent didn't already pass age >= 18
  const showChildBanner = !!isChild;

  return (
    <div className="fm" data-screen-label="04 Formülasyon" data-view={viewMode} data-viz={vizMode}>
      {/* ── TOP BAR ───────────────────────────────────────── */}
      <header className="fm-top">
        <div className="fm-client">
          <div className="fm-avatar">{initials(client.name)}</div>
          <div>
            <div className="fm-client-eyebrow-row">
              <span className="fm-eyebrow">
                vaka #{client.id}{client.age ? ` · ${client.age} yaş` : ''}
              </span>
              <AgeChip age={client.age} isChild={isChild} />
            </div>
            <h1 className="fm-client-name">
              {client.name.split(' ').slice(0, -1).join(' ')}{' '}
              <em>{client.name.split(' ').slice(-1)[0]}</em>
            </h1>
            <p className="fm-client-issue">{client.issue}</p>
          </div>
        </div>

        <nav className="fm-tabs-stack" aria-label="Görünüm kontrolleri">
          {/* Row 1 — view mode */}
          <div className="fm-tabs" role="tablist" aria-label="Görünüm modu">
            {([
              { k: 'focus', l: 'Focus' },
              { k: 'gaps',  l: 'Boşluklar' },
              { k: 'bdt',   l: 'BDT' },
              { k: 'act',   l: 'ACT' },
            ] as const).map((t) => (
              <button
                key={t.k} role="tab" aria-selected={viewMode === t.k}
                type="button"
                className={`fm-tab ${viewMode === t.k ? 'on' : ''}`}
                onClick={() => setViewMode(t.k)}
              >
                {t.l}
              </button>
            ))}
          </div>

          {/* Row 2 — viz toggle */}
          <div className="fm-viz" role="tablist" aria-label="Merkez görünüm">
            {VIZ_ITEMS.map(({ k, l, Icon }) => (
              <button
                key={k} role="tab" aria-selected={vizMode === k}
                type="button"
                className={`fm-viz-btn ${vizMode === k ? 'on' : ''}`}
                onClick={() => setVizMode(k)}
              >
                <Icon size={13} strokeWidth={1.8} />
                {l}
              </button>
            ))}
          </div>
        </nav>

        <div className="fm-top-right">
          <div className="fm-top-actions">
            <button type="button" className="fm-icon-btn" aria-label="Paylaş" title="Paylaş" onClick={onShare}>
              <Share2 size={15} strokeWidth={1.8} />
            </button>
            <button type="button" className="fm-icon-btn" aria-label="Dışa aktar" title="Hızlı dışa aktar" onClick={onExport}>
              <Download size={15} strokeWidth={1.8} />
            </button>
            <div className="fm-top-divider" />
            <button
              type="button"
              className={`fm-icon-btn ${openSheet === 'templates' ? 'active' : ''}`}
              aria-label="Şablonlar" title="Şablonlar"
              aria-pressed={openSheet === 'templates'}
              onClick={() => setOpenSheet((s) => s === 'templates' ? null : 'templates')}
            >
              <FileText size={15} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              className={`fm-icon-btn ${openSheet === 'attachments' ? 'active' : ''}`}
              aria-label="Ekler" title="Ekler"
              aria-pressed={openSheet === 'attachments'}
              onClick={() => setOpenSheet((s) => s === 'attachments' ? null : 'attachments')}
            >
              <Paperclip size={15} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              className="fm-btn fm-btn-primary fm-btn-pdf"
              onClick={() => setExportOpen(true)}
            >
              <FileDown size={14} strokeWidth={1.8} />
              Özet / PDF
            </button>
          </div>
        </div>
      </header>

      {/* ── CHILD BANNER ──────────────────────────────────── */}
      {showChildBanner && (
        <div className="fm-child-banner" role="status">
          <span className="fm-child-banner-dot" />
          <p>
            Bu danışan için <strong>çocuk değerlendirme akışı</strong> mevcut —
            BDT, oyun terapisi ve veli bilgilendirme adımları farklı.
          </p>
          <button type="button" className="fm-btn fm-btn-primary" onClick={onSwitchToChildFlow}>
            Çocuk akışına geç
            <ArrowRight size={13} strokeWidth={1.8} />
          </button>
        </div>
      )}

      {/* ── MAIN GRID ─────────────────────────────────────── */}
      <div
        className="fm-grid"
        data-left-collapsed={leftCollapsed  ? 'true' : 'false'}
        data-right-collapsed={rightCollapsed ? 'true' : 'false'}
      >
        {/* ── LEFT PANEL ──────────────────────────────────── */}
        <aside className={`fm-side fm-side-left ${leftCollapsed ? 'col' : ''}`}>
          <button
            type="button" className="fm-collapse"
            onClick={() => setLeftCollapsed((v) => !v)}
            aria-label={leftCollapsed ? 'Klinik yapıyı aç' : 'Klinik yapıyı kapat'}
            aria-expanded={!leftCollapsed}
          >
            {leftCollapsed ? <ChevronRight size={14} strokeWidth={1.8} /> : <ChevronLeft size={14} strokeWidth={1.8} />}
          </button>

          {leftCollapsed ? (
            <span className="fm-rail-label">Klinik Yapı</span>
          ) : (
            <div className="fm-side-body">
              <Section title="4P modeli" eyebrow="boylamsal" highlightEmpty={viewMode === 'gaps'}>
                <div className="fm-4p">
                  {([
                    { k: 'predisposing',  label: 'Yatkın',    items: fourP.predisposing  },
                    { k: 'precipitating', label: 'Tetik',     items: fourP.precipitating, accent: true },
                    { k: 'perpetuating',  label: 'Sürdür',    items: fourP.perpetuating  },
                    { k: 'protective',    label: 'Koru',      items: fourP.protective,    tone: 'good' as const },
                  ]).map((p) => (
                    <div key={p.k} className={`fm-4p-card ${p.accent ? 'accent' : ''} ${p.tone === 'good' ? 'good' : ''} ${p.items.length === 0 ? 'empty' : ''}`}>
                      <span className="fm-4p-key">{p.label}</span>
                      {p.items.length > 0 ? (
                        <ul>
                          {p.items.slice(0, 3).map((it, i) => <li key={i}>{it}</li>)}
                          {p.items.length > 3 && <li className="more">+{p.items.length - 3} daha</li>}
                        </ul>
                      ) : (
                        <p className="fm-empty-note">Henüz veri yok.</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Beck modeli" eyebrow="bilişsel akış" highlightEmpty={viewMode === 'gaps'}>
                <div className="fm-beck">
                  <BeckRow level="1" name="Erken yaşam"     value={beck.earlyLife} />
                  <BeckRow level="2" name="Çekirdek inanç"  value={beck.coreBelief}    bold />
                  <BeckRow level="3" name="Şartlı kurallar" value={beck.rules} />
                  <div className="fm-beck-row">
                    <span className="fm-beck-level">4</span>
                    <div className="fm-beck-body">
                      <span className="fm-eyebrow">Otomatik düşünceler</span>
                      {beck.automaticThoughts.length > 0 ? (
                        <ul className="fm-beck-thoughts">
                          {beck.automaticThoughts.map((q, i) => <li key={i}>{q}</li>)}
                        </ul>
                      ) : <p className="fm-empty-note">—</p>}
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="ACT Hexaflex" eyebrow="esneklik" highlightEmpty={viewMode === 'gaps'}>
                <ul className="fm-hex">
                  {hexItems.map((h) => {
                    const pct = (h.value / 10) * 100;
                    const concerning = h.tone === 'bad' ? h.value >= 7 : h.value <= 4;
                    return (
                      <li key={h.key} className={concerning ? 'fm-hex-row alert' : 'fm-hex-row'}>
                        <span className="fm-hex-name">{h.label}</span>
                        <span className="fm-hex-bar"><span style={{ width: `${pct}%` }} className={h.tone === 'good' ? 'good' : 'bad'} /></span>
                        <span className="fm-hex-val">{h.value}<em>/10</em></span>
                      </li>
                    );
                  })}
                </ul>
              </Section>
            </div>
          )}
        </aside>

        {/* ── CENTER ──────────────────────────────────────── */}
        <main className="fm-center">
          <div className="fm-canvas">
            <div className="fm-canvas-toolbar">
              <div className="fm-canvas-toolbar-left">
                <span className="fm-eyebrow">{vizMeta.eyebrow}</span>
                <span className="fm-canvas-stats">
                  {vizMode === 'harita' ? (
                    <>
                      {stats.nodes} düğüm · {stats.edges} ilişki
                      {stats.gaps > 0 && <span className="fm-stat-gap"> · {stats.gaps} boşluk</span>}
                    </>
                  ) : vizMeta.subtitle}
                </span>
              </div>
              <div className="fm-canvas-toolbar-right">
                {vizMode === 'harita' && (
                  <>
                    <button
                      type="button"
                      className={`fm-pill-toggle ${showGaps ? 'on' : ''}`}
                      onClick={() => setShowGaps((v) => !v)}
                      aria-pressed={showGaps}
                    >
                      {showGaps ? <Eye size={13} strokeWidth={1.8} /> : <EyeOff size={13} strokeWidth={1.8} />}
                      Boşlukları göster
                    </button>
                    <div className="fm-canvas-divider" />
                  </>
                )}
                <button type="button" className="fm-icon-btn sm" aria-label="Uzaklaş" onClick={onZoomOut}>
                  <Minus size={14} strokeWidth={2} />
                </button>
                <button type="button" className="fm-icon-btn sm" aria-label="Yakınlaş" onClick={onZoomIn}>
                  <Plus size={14} strokeWidth={2} />
                </button>
                <button type="button" className="fm-icon-btn sm" aria-label="Sıfırla" onClick={onResetView}>
                  <RotateCcw size={13} strokeWidth={1.8} />
                </button>
                <button type="button" className="fm-icon-btn sm" aria-label="Tam ekran" onClick={onToggleFullscreen}>
                  <Maximize2 size={13} strokeWidth={1.8} />
                </button>
              </div>
            </div>

            <div className="fm-canvas-slot">
              {activeSlot ?? <CanvasPlaceholder name={vizMeta.placeholder} />}
            </div>
          </div>

          <div className="fm-timeline">
            <div className="fm-timeline-head">
              <span className="fm-eyebrow">son 6 seans · işleme yoğunluğu</span>
              <span className="fm-timeline-aside">Yoğun seansta haritada daha çok düğüm eklendi.</span>
            </div>
            <div className="fm-timeline-bars">
              {sessionTimeline.slice(-6).map((v, i, arr) => {
                const isLast = i === arr.length - 1;
                return (
                  <div key={i} className="fm-tl-col">
                    <span className="fm-tl-val">{v}</span>
                    <span className={`fm-tl-bar ${isLast ? 'last' : ''}`} style={{ height: `${Math.max(6, v)}%` }} />
                    <span className="fm-tl-ix">{romanish(arr.length - 5 + i + 1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* ── RIGHT PANEL ─────────────────────────────────── */}
        <aside className={`fm-side fm-side-right ${rightCollapsed ? 'col' : ''}`}>
          <button
            type="button" className="fm-collapse"
            onClick={() => setRightCollapsed((v) => !v)}
            aria-label={rightCollapsed ? 'Düğüm detayını aç' : 'Düğüm detayını kapat'}
            aria-expanded={!rightCollapsed}
          >
            {rightCollapsed ? <ChevronLeft size={14} strokeWidth={1.8} /> : <ChevronRight size={14} strokeWidth={1.8} />}
          </button>

          {rightCollapsed ? (
            <span className="fm-rail-label">{selectedNode ? selectedNode.type : 'Düğüm'}</span>
          ) : selectedNode ? (
            <div className="fm-side-body">
              <Section title="Seçili düğüm" eyebrow={selectedNode.type}>
                <div className="fm-node">
                  <h3 className="fm-node-label">{selectedNode.label}</h3>
                  <p className="fm-node-content">{selectedNode.content}</p>
                </div>

                {selectedNode.gaps && selectedNode.gaps.length > 0 && (
                  <div className="fm-gap-warn">
                    <AlertTriangle size={14} strokeWidth={2} />
                    <div>
                      <strong>Boşluk tespit edildi</strong>
                      {selectedNode.gaps.map((g, i) => <span key={i}>{g}</span>)}
                    </div>
                  </div>
                )}

                {selectedNode.relatedSessions && selectedNode.relatedSessions.length > 0 && (
                  <div className="fm-quotes">
                    <span className="fm-eyebrow">ilgili seans alıntıları</span>
                    {selectedNode.relatedSessions.map((s, i) => (
                      <div key={i} className="fm-quote">
                        <div className="fm-quote-head">
                          <span className="fm-quote-ix">{s.ix}</span>
                          <span className="fm-quote-date">{s.date}</span>
                        </div>
                        <p>&quot;{s.quote}&quot;</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="fm-node-actions">
                  <button type="button" className="fm-btn fm-btn-primary fm-btn-block" onClick={onCreateIntervention}>
                    <Sparkles size={14} strokeWidth={1.8} /> Müdahale öner
                    <ArrowRight size={13} strokeWidth={1.8} className="fm-btn-arrow" />
                  </button>
                  <button type="button" className="fm-btn fm-btn-ghost fm-btn-block" onClick={onAddSupervisionNote}>
                    <FileText size={14} strokeWidth={1.8} /> Süpervizyon notu ekle
                  </button>
                </div>
              </Section>
            </div>
          ) : (
            <div className="fm-side-body">
              <div className="fm-empty-state">
                <Network size={20} strokeWidth={1.6} />
                <p>Haritada bir düğüm seç.</p>
                <span>Seçim yapınca detay, ilgili alıntılar ve müdahale önerileri burada açılır.</span>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── BOTTOM ────────────────────────────────────────── */}
      <footer className="fm-bottom">
        <div className="fm-bottom-summary">
          <span className="fm-eyebrow">formülasyon özeti</span>
          <p>{summary}</p>
          <div className="fm-bottom-actions">
            <button type="button" className="fm-btn fm-btn-ghost" onClick={onRefreshSummary}>
              <RefreshCw size={13} strokeWidth={1.8} /> Özeti yenile
            </button>
            <button type="button" className="fm-btn fm-btn-ghost" onClick={onCheckModelFit}>
              <CheckCircle2 size={13} strokeWidth={1.8} /> Model uyumunu kontrol et
            </button>
          </div>
        </div>
        <div className="fm-bottom-stats">
          <Stat label="Düğüm"   value={stats.nodes} />
          <Stat label="İlişki"  value={stats.edges} />
          <Stat label="Boşluk"  value={stats.gaps}  tone={stats.gaps > 0 ? 'accent' : undefined} />
        </div>
      </footer>

      {/* ── Sheets / Modal ────────────────────────────────── */}
      <TemplatesSheet
        open={openSheet === 'templates'}
        items={templates}
        onClose={() => setOpenSheet(null)}
        onApply={onApplyTemplate}
        onCreate={onCreateTemplate}
      />
      <AttachmentsSheet
        open={openSheet === 'attachments'}
        items={attachments}
        onClose={() => setOpenSheet(null)}
        onDownload={onDownloadAttachment}
        onUpload={onUploadAttachment}
        onAddNote={onAddNote}
      />
      <ExportModal
        open={exportOpen}
        client={client}
        fourP={fourP}
        beck={beck}
        hexaflex={hexaflex}
        summary={summary}
        onClose={() => setExportOpen(false)}
        onExportPdf={onExportPdf}
        onEmail={onEmailSummary}
        onSendToSupervision={onSendToSupervision}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Viz toggle metadata
// ─────────────────────────────────────────────────────────────────────────

const VIZ_ITEMS = [
  { k: 'harita' as const, l: 'Harita', Icon: Network },
  { k: 'radar'  as const, l: 'Radar',  Icon: Radar   },
  { k: 'dongu'  as const, l: 'Döngü',  Icon: RotateCw },
  { k: 'vaka'   as const, l: 'Vaka',   Icon: Map     },
  { k: 'sema'   as const, l: 'Şema',   Icon: Layers  },
];

const VIZ_META: Record<FormulationVizMode, {
  eyebrow:     string;
  subtitle:    string;
  placeholder: string;
}> = {
  harita: { eyebrow: 'mind map · v3',         subtitle: '',                                placeholder: 'MIND_MAP' },
  radar:  { eyebrow: 'hexaflex radar · v3',   subtitle: '6 boyut · esneklik anlık görünüm', placeholder: 'HEXAFLEX_RADAR' },
  dongu:  { eyebrow: 'bozukluk döngüsü · v3', subtitle: 'tetik → düşünce → duygu → davranış', placeholder: 'BOZUKLUK_DONGUSU' },
  vaka:   { eyebrow: 'vaka haritası · v3',    subtitle: 'bağlam, ilişkiler, yaşam çizgisi', placeholder: 'VAKA_HARITASI' },
  sema:   { eyebrow: 'şema haritası · v3',    subtitle: '18 erken uyumsuz şema',           placeholder: 'SEMA_TERAPISI' },
};

// ─── Sub-components ───────────────────────────────────────────────────────

function AgeChip({ age, isChild }: { age?: number; isChild?: boolean }) {
  const child = isChild ?? (age !== undefined && age < 18);
  if (child) {
    return (
      <span className="fm-age-chip child">
        <span className="fm-age-chip-dot" />
        Çocuk{age !== undefined ? ` · ${age} yaş` : ''}
      </span>
    );
  }
  return <span className="fm-age-chip adult">Yetişkin</span>;
}

function Section({
  title, eyebrow, children, highlightEmpty,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  highlightEmpty?: boolean;
}) {
  return (
    <section className={`fm-section ${highlightEmpty ? 'gaps-mode' : ''}`}>
      <div className="fm-section-head">
        {eyebrow && <span className="fm-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function BeckRow({
  level, name, value, bold,
}: { level: string; name: string; value: string; bold?: boolean }) {
  return (
    <div className="fm-beck-row">
      <span className="fm-beck-level">{level}</span>
      <div className="fm-beck-body">
        <span className="fm-eyebrow">{name}</span>
        <p className={bold ? 'fm-beck-val bold' : 'fm-beck-val'}>{value || '—'}</p>
      </div>
    </div>
  );
}

function Stat({
  label, value, tone,
}: { label: string; value: number | string; tone?: 'accent' | 'good' }) {
  return (
    <div className="fm-stat">
      <span className="fm-eyebrow">{label}</span>
      <div className={`fm-stat-val ${tone ?? ''}`}>{value}</div>
    </div>
  );
}

function CanvasPlaceholder({ name }: { name: string }) {
  return (
    <div className="fm-canvas-placeholder">
      <svg viewBox="0 0 600 360" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id={`fm-stripes-${name}`} patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(14,15,18,0.04)" strokeWidth="14" />
          </pattern>
        </defs>
        <rect width="600" height="360" fill={`url(#fm-stripes-${name})`} />
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

// ─────────────────────────────────────────────────────────────────────────
// Templates sheet
// ─────────────────────────────────────────────────────────────────────────

function TemplatesSheet({
  open, items, onClose, onApply, onCreate,
}: {
  open: boolean;
  items: FormulationTemplate[];
  onClose: () => void;
  onApply?: (id: string) => void;
  onCreate?: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fm-overlay" role="dialog" aria-modal="true" aria-label="Formülasyon şablonları">
      <button type="button" className="fm-overlay-scrim" aria-label="Kapat" onClick={onClose} />
      <aside className="fm-sheet">
        <header className="fm-sheet-head">
          <div>
            <span className="fm-eyebrow">kütüphane</span>
            <h2>Formülasyon <em>şablonları</em></h2>
          </div>
          <button type="button" className="fm-icon-btn" aria-label="Kapat" onClick={onClose}>
            <X size={15} strokeWidth={1.8} />
          </button>
        </header>
        <p className="fm-sheet-intro">
          Hazır iskeletler — boş alanlarınızı önceden doldurur, mevcut verilerinize zarar vermez.
        </p>
        <ul className="fm-tpl-list">
          {items.map((t) => (
            <li key={t.id} className="fm-tpl-row">
              <div className="fm-tpl-body">
                <div className="fm-tpl-top">
                  <h3>{t.title}</h3>
                  <span className="fm-tpl-modality">{t.modality}</span>
                </div>
                <p>{t.description}</p>
              </div>
              <button
                type="button"
                className="fm-btn fm-btn-ghost"
                onClick={() => onApply?.(t.id)}
              >
                Uygula <ArrowRight size={12} strokeWidth={1.8} />
              </button>
            </li>
          ))}
        </ul>
        <footer className="fm-sheet-foot">
          <button type="button" className="fm-btn fm-btn-primary fm-btn-block" onClick={onCreate}>
            <FilePlus2 size={14} strokeWidth={1.8} /> Yeni şablon oluştur
            <ArrowRight size={13} strokeWidth={1.8} className="fm-btn-arrow" />
          </button>
        </footer>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Attachments sheet
// ─────────────────────────────────────────────────────────────────────────

const ATTACH_TYPE_META: Record<FormulationAttachment['type'], { label: string; Icon: typeof FileText }> = {
  pdf:   { label: 'pdf',   Icon: FileText   },
  img:   { label: 'görsel', Icon: FileImage  },
  audio: { label: 'ses',   Icon: FileAudio  },
  note:  { label: 'not',   Icon: StickyNote },
};

function AttachmentsSheet({
  open, items, onClose, onDownload, onUpload, onAddNote,
}: {
  open: boolean;
  items: FormulationAttachment[];
  onClose: () => void;
  onDownload?: (id: string) => void;
  onUpload?: () => void;
  onAddNote?: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fm-overlay" role="dialog" aria-modal="true" aria-label="Ekler">
      <button type="button" className="fm-overlay-scrim" aria-label="Kapat" onClick={onClose} />
      <aside className="fm-sheet">
        <header className="fm-sheet-head">
          <div>
            <span className="fm-eyebrow">vaka dosyası</span>
            <h2><em>{items.length}</em> ek dosya</h2>
          </div>
          <button type="button" className="fm-icon-btn" aria-label="Kapat" onClick={onClose}>
            <X size={15} strokeWidth={1.8} />
          </button>
        </header>
        <ul className="fm-att-list">
          {items.map((a) => {
            const meta = ATTACH_TYPE_META[a.type];
            const Icon = meta.Icon;
            return (
              <li key={a.id} className="fm-att-row">
                <div className={`fm-att-icon t-${a.type}`}><Icon size={16} strokeWidth={1.6} /></div>
                <div className="fm-att-body">
                  <strong>{a.name}</strong>
                  <span>{meta.label} · {a.date}{a.size && a.size !== '—' ? ` · ${a.size}` : ''}</span>
                </div>
                <button
                  type="button" className="fm-icon-btn sm"
                  aria-label="İndir"
                  onClick={() => onDownload?.(a.id)}
                >
                  <Download size={13} strokeWidth={1.8} />
                </button>
              </li>
            );
          })}
        </ul>
        <footer className="fm-sheet-foot fm-sheet-foot-row">
          <button type="button" className="fm-btn fm-btn-primary" onClick={onUpload}>
            <Upload size={14} strokeWidth={1.8} /> Dosya yükle
          </button>
          <button type="button" className="fm-btn fm-btn-ghost" onClick={onAddNote}>
            <StickyNote size={14} strokeWidth={1.8} /> Not ekle
          </button>
        </footer>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Export modal
// ─────────────────────────────────────────────────────────────────────────

function ExportModal({
  open, client, fourP, beck, hexaflex, summary,
  onClose, onExportPdf, onEmail, onSendToSupervision,
}: {
  open: boolean;
  client: { id: string; name: string; age?: number; issue: string };
  fourP: FourP;
  beck: BeckChain;
  hexaflex: Hexaflex;
  summary: string;
  onClose: () => void;
  onExportPdf?: () => void;
  onEmail?: () => void;
  onSendToSupervision?: () => void;
}) {
  if (!open) return null;
  const hexAvg = (
    (hexaflex.fusion + hexaflex.avoidance + hexaflex.selfAsContent +
      hexaflex.presentMoment + hexaflex.values + hexaflex.committedAction) / 6
  );

  return (
    <div className="fm-overlay center" role="dialog" aria-modal="true" aria-label="Formülasyon özeti">
      <button type="button" className="fm-overlay-scrim" aria-label="Kapat" onClick={onClose} />
      <div className="fm-modal">
        <header className="fm-modal-head">
          <div>
            <span className="fm-eyebrow">dışa aktarım</span>
            <h2>Formülasyon <em>özeti</em></h2>
          </div>
          <button type="button" className="fm-icon-btn" aria-label="Kapat" onClick={onClose}>
            <X size={15} strokeWidth={1.8} />
          </button>
        </header>

        <div className="fm-modal-body">
          <div className="fm-summary-preview">
            <div className="fm-sp-paper">
              <div className="fm-sp-head">
                <div>
                  <span className="fm-eyebrow">vaka #{client.id}</span>
                  <h3>{client.name}{client.age ? `, ${client.age}` : ''}</h3>
                  <p>{client.issue}</p>
                </div>
                <div className="fm-sp-stamp">v3</div>
              </div>

              <div className="fm-sp-grid">
                <div className="fm-sp-block">
                  <span className="fm-eyebrow">4P</span>
                  <ul>
                    <li><strong>Yatkın</strong>  · {fourP.predisposing[0]  ?? '—'}</li>
                    <li><strong>Tetik</strong>   · {fourP.precipitating[0] ?? '—'}</li>
                    <li><strong>Sürdür</strong>  · {fourP.perpetuating[0]  ?? '—'}</li>
                    <li><strong>Koru</strong>    · {fourP.protective[0]    ?? '—'}</li>
                  </ul>
                </div>
                <div className="fm-sp-block">
                  <span className="fm-eyebrow">Beck akışı</span>
                  <p className="fm-sp-core">{beck.coreBelief}</p>
                  <p className="fm-sp-rule">{beck.rules}</p>
                </div>
                <div className="fm-sp-block fm-sp-block-wide">
                  <div className="fm-sp-block-head">
                    <span className="fm-eyebrow">Hexaflex</span>
                    <span className="fm-sp-hex-avg">ort. {hexAvg.toFixed(1).replace('.', ',')}/10</span>
                  </div>
                  <ul className="fm-sp-hex">
                    {[
                      ['Füzyon',    hexaflex.fusion],
                      ['Kaçınma',   hexaflex.avoidance],
                      ['İçerik',    hexaflex.selfAsContent],
                      ['Şimdi',     hexaflex.presentMoment],
                      ['Değer',     hexaflex.values],
                      ['Eylem',     hexaflex.committedAction],
                    ].map(([l, v]) => (
                      <li key={l as string}>
                        <span>{l}</span>
                        <span className="bar"><span style={{ width: `${((v as number)/10)*100}%` }} /></span>
                        <span className="v">{v as number}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="fm-sp-summary">{summary}</p>
            </div>
          </div>

          <aside className="fm-modal-actions">
            <span className="fm-eyebrow">gönder</span>
            <button type="button" className="fm-btn fm-btn-primary fm-btn-block" onClick={onExportPdf}>
              <FileDown size={14} strokeWidth={1.8} /> PDF olarak indir
              <ArrowRight size={13} strokeWidth={1.8} className="fm-btn-arrow" />
            </button>
            <button type="button" className="fm-btn fm-btn-ghost fm-btn-block" onClick={onEmail}>
              <Mail size={14} strokeWidth={1.8} /> E-mail at
            </button>
            <button type="button" className="fm-btn fm-btn-ghost fm-btn-block" onClick={onSendToSupervision}>
              <Award size={14} strokeWidth={1.8} /> Süpervizyona gönder
            </button>
            <p className="fm-modal-hint">
              <Send size={11} strokeWidth={1.8} />
              PDF&apos;in alt köşesinde otomatik filigran: Klinik Asistan · 2026.05.24
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function romanish(n: number): string {
  const map = ['', 'I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  return map[n] ?? String(n);
}
