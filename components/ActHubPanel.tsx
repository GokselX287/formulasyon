'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  Hexagon, Triangle, Heart, Layers, Target,
  ArrowRight, ArrowLeft, Archive, FileText, Plus,
  ChevronLeft, ChevronRight, Lightbulb, Sparkles,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

export type ActSubTab = 'hub' | 'hexaflex' | 'triflex' | 'sefkat' | 'ekoller' | 'smart-hedef';

export type RecentWork = {
  tool:      string;       // "Hexaflex" | "Şefkat" ...
  time:      string;       // "2 saat önce" | "Dün 14:30"
  deltaCopy?: string;      // "+0.4 esneklik" | "1 yeni egzersiz"
  subTab?:   ActSubTab;    // which tool to jump to on click
};

export type WeekStats = {
  count:           number;
  avgFlexibility:  number;     // 0-10
};

export type ToolNote = {
  title:  string;
  body:   string;     // 2-3 paragraph clinical note (\n\n separated)
};

export type ActHubPanelProps = {
  subTab?:           ActSubTab;
  onChangeSubTab?:   (tab: ActSubTab) => void;
  recentWorks?:      RecentWork[];
  weekStats?:        WeekStats;

  // Tool chrome
  toolSlot?:         ReactNode;
  toolNote?:         ToolNote;
  hexaflexMode?:     'hexaflex' | 'triflex';   // for the ACTDancing mode toggle
  onHexaflexModeChange?: (mode: 'hexaflex' | 'triflex') => void;
  onAddToSession?:       () => void;
  onArchiveWork?:        () => void;
  onAddSupervisionNote?: () => void;
};

// ─── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_RECENT: RecentWork[] = [
  { tool: 'Hexaflex',  time: '2 saat önce',  deltaCopy: '+0.4 esneklik',    subTab: 'hexaflex' },
  { tool: 'Şefkat',    time: 'Dün 16:20',    deltaCopy: 'yeni egzersiz',     subTab: 'sefkat'   },
  { tool: 'Triflex',   time: 'Salı 11:00',   deltaCopy: 'pratik tamamlandı', subTab: 'triflex'  },
  { tool: 'Ekoller',   time: 'Geçen hafta',  deltaCopy: 'BDT karşılaştırma', subTab: 'ekoller'  },
  { tool: 'Hexaflex',  time: '8 gün önce',   deltaCopy: 'Defüzyon 5→7',      subTab: 'hexaflex' },
];

const DEFAULT_WEEK_STATS: WeekStats = { count: 12, avgFlexibility: 6.4 };

const DEFAULT_TOOL_NOTE: Record<Exclude<ActSubTab,'hub'|'smart-hedef'>, ToolNote> = {
  hexaflex: {
    title: 'Hexaflex okuması, statik bir tanı değildir.',
    body:
      'Altı boyut, danışanın o anki bağlamına göre titreşir. Bir seansta düşük olan ' +
      '"şimdiki an", bir sonraki seansta bir vakanın yas süreciyle birlikte yeniden ' +
      'şekillenebilir.\n\n' +
      'Klinik kullanımda hexaflex\'i değerlendirme değil, paylaşılan bir dil olarak ' +
      'düşünün — danışanla beraber bakılan bir harita. Boyut puanları haftalık ' +
      'farkı izlemek için yeterli; mutlak puan tek başına bir şey söylemez.',
  },
  triflex: {
    title: 'Üç kanat: aç ol, şimdi ol, önemli olanı yap.',
    body:
      'Triflex, hexaflex\'in altı boyutunu klinik uygulamada daha kolay konuşulan üç ' +
      'kümeye indirir. Açıklık (defüzyon + kabul), merkezlilik (şimdiki an + ' +
      'bağlam-benlik), bağlanma (değerler + eylem).\n\n' +
      'Yeni başlayan danışanlarla ilk formülasyon çerçevesi olarak triflex çoğu ' +
      'zaman hexaflex\'ten daha akışkan kalır.',
  },
  sefkat: {
    title: 'Üç sistem her zaman birbiriyle dans eder.',
    body:
      'Gilbert\'ın çerçevesinde tehdit, sürüş ve sakinlik sistemleri sürekli dengeye ' +
      'çalışır. Sürekli tehdit modunda yaşayan bir danışanla "kendine şefkat" demek, ' +
      'çoğu zaman sakinlik sistemini çalıştırma davetidir.\n\n' +
      'Egzersizler tek başına yetmez — danışanın şefkati hangi anılarla ilişkilendirdiğini ' +
      'önce keşfetmek gerekir. Hayali şefkatli figür çalışması, başlangıç için iyi bir ' +
      'köprüdür.',
  },
  ekoller: {
    title: 'Aynı vakaya, farklı pencereler.',
    body:
      'Bir vaka tek bir ekolün diliyle anlatıldığında, kalan boyutları görmezden gelmek ' +
      'kolaylaşır. Bu karşılaştırma haritası 11 ekolün aynı vakaya nasıl baktığını ' +
      'yan yana koyar.\n\n' +
      'Ekol seçimi bir kimlik meselesi değil; vakanın hangi düzlemiyle çalıştığınızla ilgili ' +
      'bir karar. Şu an çalıştığınız vakayla en çok rezonans yapan ekolü öne çıkarın.',
  },
};

// ─── Component ────────────────────────────────────────────────────────────

export default function ActHubPanel({
  subTab:        subTabProp,
  onChangeSubTab,
  recentWorks  = DEFAULT_RECENT,
  weekStats    = DEFAULT_WEEK_STATS,
  toolSlot,
  toolNote,
  hexaflexMode:  hexModeProp,
  onHexaflexModeChange,
  onAddToSession,
  onArchiveWork,
  onAddSupervisionNote,
}: ActHubPanelProps) {
  const [subTabState,  setSubTabState]  = useState<ActSubTab>('hub');
  const [hexModeState, setHexModeState] = useState<'hexaflex' | 'triflex'>('hexaflex');
  const [noteOpen,     setNoteOpen]     = useState(true);

  const subTab = subTabProp ?? subTabState;
  const setSubTab = (t: ActSubTab) => {
    setSubTabState(t);
    onChangeSubTab?.(t);
  };
  const hexMode = hexModeProp ?? hexModeState;
  const setHexMode = (m: 'hexaflex' | 'triflex') => {
    setHexModeState(m);
    onHexaflexModeChange?.(m);
  };

  if (subTab === 'hub') {
    return (
      <Hub
        recentWorks={recentWorks}
        weekStats={weekStats}
        onOpenTool={setSubTab}
      />
    );
  }

  // SMART Hedef kendi tam sayfasını açar — ToolChrome wrapper olmadan
  if (subTab === 'smart-hedef') {
    return (
      <div className="act-tool" data-screen-label="05 ACT · SMART Hedef" data-tool="smart-hedef">
        <header className="act-tool-top">
          <div className="act-tool-top-left">
            <button type="button" className="act-icon-btn" onClick={() => setSubTab('hub')} aria-label="Hub'a dön">
              <ArrowLeft size={14} strokeWidth={1.8} />
            </button>
            <div className="act-tool-name">
              <span className="act-eyebrow">değer tabanlı hedef kurma</span>
              <h1>SMART <em>Hedef</em></h1>
            </div>
          </div>
        </header>
        <div className="act-tool-canvas" style={{ flex: 1, overflow: 'auto' }}>
          {toolSlot}
        </div>
      </div>
    );
  }

  const note = toolNote ?? DEFAULT_TOOL_NOTE[subTab as Exclude<ActSubTab, 'hub' | 'smart-hedef'>];

  return (
    <ToolChrome
      subTab={subTab}
      onBack={() => setSubTab('hub')}
      hexMode={hexMode}
      onHexModeChange={setHexMode}
      toolSlot={toolSlot}
      note={note}
      noteOpen={noteOpen}
      onToggleNote={() => setNoteOpen((v) => !v)}
      onAddToSession={onAddToSession}
      onArchiveWork={onArchiveWork}
      onAddSupervisionNote={onAddSupervisionNote}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HUB
// ─────────────────────────────────────────────────────────────────────────

function Hub({
  recentWorks, weekStats, onOpenTool,
}: {
  recentWorks: RecentWork[];
  weekStats:   WeekStats;
  onOpenTool:  (t: ActSubTab) => void;
}) {
  const tools = useMemo(() => ([
    {
      key: 'hexaflex' as const, Icon: Hexagon,
      eyebrow: "ACT'ın anatomisi",
      title:   'Hexaflex',
      desc:    '6 boyut — füzyon, kaçınma, ben-içerik, an, değer, eylem.',
      Vis:     HexaflexVis,
      tone:    'accent' as const,
    },
    {
      key: 'triflex' as const, Icon: Triangle,
      eyebrow: 'Sadeleştirilmiş model',
      title:   'Triflex',
      desc:    'Açıklık · Merkezlilik · Bağlanma — üç kanat.',
      Vis:     TriflexVis,
      tone:    'ink' as const,
    },
    {
      key: 'sefkat' as const, Icon: Heart,
      eyebrow: 'Tehdit · sürüş · sakinlik sistemleri',
      title:   'Öz-şefkat',
      titleSerif: true,
      desc:    'Hexagon pratiği + CFT teorisi.',
      Vis:     HeartVis,
      tone:    'accent' as const,
    },
    {
      key: 'ekoller' as const, Icon: Layers,
      eyebrow: "BDT'den ACT'a, EFT'den şemaya",
      title:   '11 ekol haritası',
      desc:    'Katman, zaman ve karşılaştırma görünümü.',
      Vis:     LayersVis,
      tone:    'ink' as const,
    },
    {
      key: 'smart-hedef' as const, Icon: Target,
      eyebrow: 'Değer tabanlı hedef kurma',
      title:   'SMART Hedef',
      desc:    'Spesifik, ölçülebilir, ulaşılabilir — ACT değerleriyle hizalanmış hedef oluştur.',
      Vis:     SmartVis,
      tone:    'ink' as const,
    },
  ]), []);

  return (
    <div className="act" data-screen-label="05 ACT Hub">
      {/* HERO */}
      <header className="act-hero">
        <div className="act-hero-left">
          <span className="act-eyebrow">ACT · terapist gelişim</span>
          <h1 className="act-hero-title">
            Esneklik bir kas.<br/>
            <em>Her gün</em> biraz daha.
          </h1>
          <p className="act-hero-sub">
            Hexaflex, Triflex, öz-şefkat ve karşılaştırmalı ekol haritası.
            Bir aracı seç, kendi pratiğinde dene; sonra danışanla aynı dili konuş.
          </p>
        </div>
        <aside className="act-hero-stats">
          <div className="act-stat">
            <span className="act-eyebrow">bu hafta</span>
            <div className="act-stat-val">{weekStats.count}<em>çalışma</em></div>
          </div>
          <div className="act-stat">
            <span className="act-eyebrow">ortalama esneklik</span>
            <div className="act-stat-val">
              {weekStats.avgFlexibility.toFixed(1).replace('.', ',')}<em>/10</em>
            </div>
            <div className="act-stat-bar">
              <span style={{ width: `${(weekStats.avgFlexibility / 10) * 100}%` }} />
            </div>
          </div>
        </aside>
      </header>

      {/* CARDS */}
      <section className="act-cards">
        {tools.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`act-card tone-${t.tone}`}
            onClick={() => onOpenTool(t.key)}
          >
            <div className="act-card-vis"><t.Vis /></div>
            <div className="act-card-body">
              <div className="act-card-top">
                <t.Icon size={16} strokeWidth={1.6} />
                <span className="act-eyebrow">{t.eyebrow}</span>
              </div>
              <h2 className={`act-card-title ${t.titleSerif === false ? 'sans' : ''}`}>
                {t.title}
              </h2>
              <p className="act-card-desc">{t.desc}</p>
              <div className="act-card-foot">
                <span className="act-card-cta">Aç <ArrowRight size={13} strokeWidth={1.8} /></span>
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* RECENT */}
      <section className="act-recent">
        <div className="act-section-head">
          <h3 className="act-section-title">Son <em>çalışmalar</em></h3>
          <span className="act-section-aside">Kendi pratiğinde son ne yaptın? Buradan devam edebilirsin.</span>
        </div>
        <div className="act-recent-chips">
          {recentWorks.map((w, i) => (
            <button
              key={i} type="button"
              className="act-chip"
              onClick={() => w.subTab && onOpenTool(w.subTab)}
            >
              <span className="act-chip-tool">{w.tool}</span>
              <span className="act-chip-time">{w.time}</span>
              {w.deltaCopy && <span className="act-chip-delta">{w.deltaCopy}</span>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TOOL CHROME
// ─────────────────────────────────────────────────────────────────────────

const TOOL_META: Record<Exclude<ActSubTab,'hub'|'smart-hedef'>, {
  title: string;
  eyebrow: string;
  subTabs: string[];
}> = {
  hexaflex: { title: 'Hexaflex', eyebrow: 'esneklik anatomisi',  subTabs: [] },
  triflex:  { title: 'Triflex',  eyebrow: 'üç kanat',             subTabs: [] },
  sefkat:   { title: 'Öz-şefkat', eyebrow: 'CFT pratiği',         subTabs: [] },
  ekoller:  { title: '11 ekol',   eyebrow: 'karşılaştırma',       subTabs: [] },
};

function ToolChrome({
  subTab, onBack, hexMode, onHexModeChange,
  toolSlot, note, noteOpen, onToggleNote,
  onAddToSession, onArchiveWork, onAddSupervisionNote,
}: {
  subTab: Exclude<ActSubTab,'hub'|'smart-hedef'>;
  onBack: () => void;
  hexMode: 'hexaflex' | 'triflex';
  onHexModeChange: (m: 'hexaflex' | 'triflex') => void;
  toolSlot?: ReactNode;
  note: ToolNote;
  noteOpen: boolean;
  onToggleNote: () => void;
  onAddToSession?: () => void;
  onArchiveWork?: () => void;
  onAddSupervisionNote?: () => void;
}) {
  const meta = TOOL_META[subTab];
  const [innerTab, setInnerTab] = useState(meta.subTabs[0] ?? '');

  return (
    <div className="act-tool" data-screen-label={`05 ACT · ${meta.title}`} data-tool={subTab}>
      {/* Top bar */}
      <header className="act-tool-top">
        <div className="act-tool-top-left">
          <button type="button" className="act-icon-btn" onClick={onBack} aria-label="Hub'a dön">
            <ArrowLeft size={14} strokeWidth={1.8} />
          </button>
          <div className="act-tool-name">
            <span className="act-eyebrow">{meta.eyebrow}</span>
            <h1>
              {meta.title.split(' ').slice(0,-1).join(' ')}{' '}
              <em>{meta.title.split(' ').slice(-1)[0]}</em>
            </h1>
          </div>
        </div>

        <nav className="act-tool-subtabs" role="tablist" aria-label="Görünüm">
          {meta.subTabs.map((t) => (
            <button
              key={t} role="tab" type="button"
              aria-selected={innerTab === t}
              className={`act-subtab ${innerTab === t ? 'on' : ''}`}
              onClick={() => setInnerTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="act-tool-top-right">
          {subTab === 'hexaflex' && (
            <div className="act-mode" role="radiogroup" aria-label="Model">
              <button type="button" role="radio"
                aria-checked={hexMode === 'hexaflex'}
                className={`act-mode-btn ${hexMode === 'hexaflex' ? 'on' : ''}`}
                onClick={() => onHexModeChange('hexaflex')}
              >
                Hexaflex
              </button>
              <button type="button" role="radio"
                aria-checked={hexMode === 'triflex'}
                className={`act-mode-btn ${hexMode === 'triflex' ? 'on' : ''}`}
                onClick={() => onHexModeChange('triflex')}
              >
                Triflex
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <div className={`act-tool-grid ${noteOpen ? '' : 'note-closed'}`}>
        <div className="act-tool-canvas">
          {toolSlot ?? <ToolPlaceholder name={meta.title} />}
        </div>

        <aside className={`act-tool-note ${noteOpen ? '' : 'col'}`}>
          <button
            type="button" className="act-note-collapse"
            onClick={onToggleNote}
            aria-label={noteOpen ? 'Notu kapat' : 'Notu aç'}
            aria-expanded={noteOpen}
          >
            {noteOpen ? <ChevronRight size={14} strokeWidth={1.8} /> : <ChevronLeft size={14} strokeWidth={1.8} />}
          </button>

          {noteOpen ? (
            <div className="act-note-body">
              <span className="act-eyebrow">klinik not</span>
              <h3>{note.title}</h3>
              <div className="act-note-text">
                {note.body.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
              </div>
              <button type="button" className="act-btn act-btn-primary act-btn-block" onClick={onAddToSession}>
                <Plus size={14} strokeWidth={2} />
                Bu pratiği seans planına ekle
                <ArrowRight size={13} strokeWidth={1.8} className="act-btn-arrow" />
              </button>
            </div>
          ) : (
            <span className="act-rail-label">Klinik not</span>
          )}
        </aside>
      </div>

      {/* Bottom */}
      <footer className="act-tool-bottom">
        <div className="act-tool-bottom-actions">
          <button type="button" className="act-btn act-btn-ghost" onClick={onArchiveWork}>
            <Archive size={13} strokeWidth={1.8} /> Bu çalışmayı arşivle
          </button>
          <button type="button" className="act-btn act-btn-ghost" onClick={onAddSupervisionNote}>
            <FileText size={13} strokeWidth={1.8} /> Süpervizyon notuna ekle
          </button>
        </div>
        <div className="act-tool-bottom-tip">
          <Lightbulb size={13} strokeWidth={1.8} />
          <span>Tip: bu aracı bir danışan dosyasından da açabilirsin.</span>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Mini-visuals (hub cards) + placeholder
// ─────────────────────────────────────────────────────────────────────────

function HexaflexVis() {
  const size = 140, c = size / 2, R = 44;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = -Math.PI / 2 + i * (Math.PI / 3);
    return [c + R * Math.cos(a), c + R * Math.sin(a)] as const;
  });
  const poly = pts.map(p => p.join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" aria-hidden>
      <polygon points={poly} fill="rgba(194,82,42,0.06)" stroke="rgba(14,15,18,0.18)" strokeWidth="1" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="6" fill="var(--accent)" />
      ))}
      <circle cx={c} cy={c} r="3" fill="var(--ink)" />
    </svg>
  );
}

function TriflexVis() {
  const size = 140, c = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" aria-hidden>
      <circle cx={c - 18} cy={c + 10} r="32" fill="none" stroke="var(--ink)" strokeWidth="1.4" opacity="0.7" />
      <circle cx={c + 18} cy={c + 10} r="32" fill="none" stroke="var(--ink)" strokeWidth="1.4" opacity="0.7" />
      <circle cx={c}      cy={c - 18} r="32" fill="none" stroke="var(--ink)" strokeWidth="1.4" opacity="0.7" />
    </svg>
  );
}

function HeartVis() {
  const size = 140, c = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" aria-hidden>
      <circle cx={c} cy={c} r="48" fill="none" stroke="rgba(194,82,42,0.20)" strokeWidth="1" />
      <circle cx={c} cy={c} r="32" fill="none" stroke="rgba(194,82,42,0.30)" strokeWidth="1" />
      <path d={`M ${c} ${c + 30} C ${c - 38} ${c + 4}, ${c - 38} ${c - 28}, ${c} ${c - 8} C ${c + 38} ${c - 28}, ${c + 38} ${c + 4}, ${c} ${c + 30} Z`}
            fill="rgba(194,82,42,0.10)" stroke="var(--accent)" strokeWidth="1.6" />
    </svg>
  );
}

function LayersVis() {
  const size = 140, c = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i}
          x={c - 36 + i * 4}
          y={c - 34 + i * 12}
          width="72"
          height="22"
          rx="3"
          fill={i === 3 ? 'var(--ink)' : 'transparent'}
          stroke="var(--ink)"
          strokeWidth="1.2"
          opacity={0.35 + i * 0.18}
        />
      ))}
    </svg>
  );
}

function SmartVis() {
  const size = 140, c = size / 2;
  const labels = ['S', 'M', 'A', 'R', 'T'];
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" aria-hidden>
      {labels.map((l, i) => {
        const x = 18 + i * 22;
        const barH = 20 + (i % 3) * 14 + (i === 2 ? 8 : 0);
        const y = c + 18 - barH;
        return (
          <g key={l}>
            <rect x={x} y={y} width="14" height={barH} rx="3"
              fill={i === 0 ? 'var(--ink)' : 'transparent'}
              stroke="var(--ink)" strokeWidth="1.2" opacity={0.25 + i * 0.15} />
            <text x={x + 7} y={c + 34} textAnchor="middle"
              fontSize="9" fontWeight="600" fill="var(--ink)" opacity="0.5">{l}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ToolPlaceholder({ name }: { name: string }) {
  return (
    <div className="act-tool-placeholder">
      <svg viewBox="0 0 600 360" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="act-stripes" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(14,15,18,0.04)" strokeWidth="14" />
          </pattern>
        </defs>
        <rect width="600" height="360" fill="url(#act-stripes)" />
        <g transform="translate(300 180)">
          <rect x="-80" y="-22" width="160" height="44" rx="22" fill="var(--paper)" stroke="rgba(14,15,18,0.18)" strokeWidth="1.4" />
          <text textAnchor="middle" y="5" fontFamily="var(--mono, monospace)" fontSize="12" fill="var(--muted, #7B7C82)">
            {name.toUpperCase()}_SLOT
          </text>
        </g>
      </svg>
    </div>
  );
}
