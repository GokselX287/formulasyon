'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Users, Zap, ChevronRight, Eye, EyeOff, BookOpen, PanelRightOpen, PanelRightClose, Lightbulb, ChevronDown, ChevronUp, PenLine } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'setup' | 'running' | 'paused' | 'done';
type DancingMode = 'hexaflex' | 'triflex';
type Category = 'farkinda' | 'aktif' | 'acik' | 'all';

interface Participant { name: string; role: string }
interface Config {
  duration: number;
  speed: number;
  sequential: boolean;
  educatorName: string;
  therapistName: string;
  participants: Participant[];
}

// ─── ACT Data ─────────────────────────────────────────────────────────────────
const NODES = [
  {
    i: 0, key: 'simdiki-an', label: 'Şimdiki Anla\nTemas', category: 'farkinda' as Category,
    angleDeg: 0,
    desc: 'Şimdiki An Farkındalığı: Dikkati "Şimdi ve Burada" ya vermek',
    interventions: [
      'Şu an ne fark ediyorsunuz?',
      'Bu anda bedeninizde neler oluyor?',
      'Tam olarak şu an ne yaşıyorsunuz?',
      'Etrafınızda şu an neler görüyorsunuz, duyuyorsunuz?',
      'Nefes alırken bedeninizde ne hissediyorsunuz?',
    ],
    triflexHint: 'Şimdiki an farkındalığı → FARKINDA',
  },
  {
    i: 1, key: 'degerler', label: 'Değerler', category: 'aktif' as Category,
    angleDeg: 60,
    desc: 'Değerlere Temas: Hayatta sizin için neyin önemli olduğunu anlamak/tanımak',
    interventions: [
      'Hayatınızda gerçekten önemli olan ne?',
      'Nasıl bir insan olmak istiyorsunuz?',
      'Bu alanda değerleriniz nelerdir?',
      'Hayatınız tam istediğiniz gibi olsaydı, ne farklı olurdu?',
      'Bu alanda en önem verdiğiniz şey nedir?',
    ],
    triflexHint: 'Değer netleştirme → AKTİF / ANGAJE',
  },
  {
    i: 2, key: 'adanmis-eylem', label: 'Adanmış\nEylem', category: 'aktif' as Category,
    angleDeg: 120,
    desc: 'Adanmış Eylem: Zor olsa bile sizin için önemli olan şeyleri yapmak',
    interventions: [
      'Değerlerinize doğru şimdi ne yapabilirsiniz?',
      'Bu hafta ne deneyebilirsiniz?',
      'Bu değer doğrultusunda atacağınız en küçük adım ne olabilir?',
      'Zor olsa bile önemli olan eylemleri nasıl sürdürürsünüz?',
      'Bu eylemi gerçekleştirmenizi neler kolaylaştırır?',
    ],
    triflexHint: 'Adanmış eylem / davranış aktivasyonu → AKTİF / ANGAJE',
  },
  {
    i: 3, key: 'baglamsal-benlik', label: 'Bağlamsal\nBenlik', category: 'all' as Category,
    angleDeg: 180,
    desc: 'Bağlamsal Benlik: Kendini gözlemleme / esnek perspektif-alma',
    interventions: [
      'Düşünceleri izleyen kim fark edebilir?',
      'Siz o düşüncenin kendisi misiniz, yoksa onu fark eden mi?',
      'Kendinizi bir gözlemci gözüyle görebilir misiniz?',
      'On yıl önce de aynı siz vardınız, o dönemden bakabilir misiniz?',
      'Bu perspektiften bakıldığında ne görüyorsunuz?',
    ],
    triflexHint: 'Perspektif alma → tüm boyutları köprüler',
  },
  {
    i: 4, key: 'bilissel-ayrisma', label: 'Bilişsel\nAyrışma', category: 'acik' as Category,
    angleDeg: 240,
    desc: 'Defüzyon (Bilişsel Ayrışma): Düşüncelerden Ayrışma',
    interventions: [
      '"... diye düşünüyorum" diyebilir misiniz?',
      'Zihniniz size ne söylüyor?',
      'Bu düşünce bir gerçek mi, yoksa bir tahmin mi?',
      'Bu düşünceyi bir bulut gibi geçip giderken izleyebilir misiniz?',
      'Bu düşüncenin sizi ne kadar kontrol etmesine izin veriyorsunuz?',
    ],
    triflexHint: 'Bilişsel ayrışma / defüzyon → AÇIK',
  },
  {
    i: 5, key: 'kabul', label: 'Kabul', category: 'acik' as Category,
    angleDeg: 300,
    desc: 'Deneyimlemeye isteklilik: Ortaya çıkan her şeyin orada olmasına izin vermek',
    interventions: [
      'Bu duyguya yer açabilir misiniz?',
      'Kaçmak yerine bu deneyimle kalabilir misiniz?',
      'Bu hissin tam olarak nerede olduğunu hissedebilir misiniz?',
      'Buna karşı savaşmak yerine onu gözlemleyebilir misiniz?',
      'Duygunuzun sadece orada kalmasına izin verebilir misiniz?',
    ],
    triflexHint: 'Kabul / isteklilik → AÇIK',
  },
];

const CAT_STYLE: Record<Category, { label: string; color: string; bg: string; textColor: string }> = {
  farkinda: { label: 'FARKINDA',      color: '#C0392B', bg: 'rgba(192,57,43,0.15)',  textColor: '#C0392B' },
  aktif:    { label: 'AKTİF (ANGAJE)',color: '#1A5276', bg: 'rgba(26,82,118,0.15)',  textColor: '#1A5276' },
  acik:     { label: 'AÇIK',          color: '#784212', bg: 'rgba(120,66,18,0.15)',  textColor: '#784212' },
  all:      { label: '',              color: '#1E8449', bg: 'rgba(30,132,73,0.12)',  textColor: '#1E8449' },
};

const DURATIONS = [5, 10, 12, 15, 20];
const SPEEDS    = [
  { label: 'Yavaş', value: 20, desc: '20 sn/boyut' },
  { label: 'Orta',  value: 12, desc: '12 sn/boyut' },
  { label: 'Hızlı', value: 7,  desc: '7 sn/boyut'  },
];
const ROLES = ['Terapist', 'Danışan', 'Süpervizör', 'Yazıcı'];
const ROLE_COLORS: Record<string, string> = {
  Terapist: '#C0392B', Danışan: '#1A5276', Süpervizör: '#1E8449', Yazıcı: '#6D3B8A',
};
const ROLE_DESCS: Record<string, string> = {
  Terapist: 'Seans yürüten klinisyen adayı',
  Danışan: 'Gerçek veya rol play danışan',
  Süpervizör: 'Terapist tıkandığında tek öneri verir',
  Yazıcı: 'Hexaflex boyutlarını takip eder, not alır',
};

const DEFAULT_CONFIG: Config = {
  duration: 10,
  speed: 12,
  sequential: true,
  educatorName: '',
  therapistName: '',
  participants: ROLES.map(r => ({ name: '', role: r })),
};

// ─── SVG Geometry ─────────────────────────────────────────────────────────────
const VW = 520, VH = 540;
const CX = 260, CY = 270;
const OUTER_R = 162;
const NODE_R = 44;
const CENTER_R = 60;

function polarXY(angleDeg: number, r: number, cx = CX, cy = CY) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function flatHexPts(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = i * 60 * Math.PI / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function pointyHexPts(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 + 30) * Math.PI / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

const NODE_POSITIONS = NODES.map(n => polarXY(n.angleDeg, OUTER_R));
const OUTLINE_POINTS = NODE_POSITIONS.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

// ─── HexaflexSVG ──────────────────────────────────────────────────────────────
function HexaflexSVG({
  activeIdx,
  mode,
  nodeTimeLeft,
  speed,
  phase,
  hideTimer,
}: {
  activeIdx: number;
  mode: DancingMode;
  nodeTimeLeft: number;
  speed: number;
  phase: Phase;
  hideTimer: boolean;
}) {
  const activeNode = NODES[activeIdx];
  const activeCat = activeNode.category;
  const progress = nodeTimeLeft / speed;
  const isRunning = phase === 'running';

  // Render inactive nodes first, active last → SVG z-order
  const renderOrder = NODES.map((_, i) => i).filter(i => i !== activeIdx).concat(activeIdx);

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      height="100%"
      style={{ display: 'block', maxHeight: '100%', overflow: 'visible' }}
    >
      <defs>
        <filter id="glow-node" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="shadow-active" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* ── Triflex outer category labels ── */}
      {mode === 'triflex' && (
        <g>
          <text x={CX} y={18} textAnchor="middle" fontSize="15" fontWeight="700"
            fill={activeCat === 'farkinda' ? '#C0392B' : '#D0BBBB'}
            style={{ transition: 'fill 0.4s', letterSpacing: '2px' }}>FARKINDA</text>
          <text x={VW - 12} y={CY + 6} textAnchor="end" fontSize="15" fontWeight="700"
            fill={activeCat === 'aktif' ? '#1A5276' : '#BBBBD0'}
            style={{ transition: 'fill 0.4s', letterSpacing: '2px' }}>
            <tspan x={VW - 12} dy="0">AKTİF</tspan>
            <tspan x={VW - 12} dy="18">(ANGAJE)</tspan>
          </text>
          <text x={14} y={CY + 6} textAnchor="start" fontSize="15" fontWeight="700"
            fill={activeCat === 'acik' ? '#784212' : '#D0C8BB'}
            style={{ transition: 'fill 0.4s', letterSpacing: '2px' }}>AÇIK</text>
        </g>
      )}

      {/* ── Triflex category rect highlights ── */}
      {mode === 'triflex' && (() => {
        const catRects: Record<Category, { x: number; y: number; w: number; h: number; r: number } | null> = {
          farkinda: { x: CX - 70, y: 28, w: 140, h: NODE_POSITIONS[0].y - 28 + NODE_R + 12, r: 12 },
          aktif:    { x: NODE_POSITIONS[1].x - NODE_R - 12, y: NODE_POSITIONS[1].y - NODE_R - 12, w: VW - (NODE_POSITIONS[1].x - NODE_R - 12), h: NODE_POSITIONS[2].y - NODE_POSITIONS[1].y + NODE_R * 2 + 24, r: 12 },
          acik:     { x: 0, y: NODE_POSITIONS[5].y - NODE_R - 12, w: NODE_POSITIONS[5].x + NODE_R + 12, h: NODE_POSITIONS[4].y - NODE_POSITIONS[5].y + NODE_R * 2 + 24, r: 12 },
          all:      null,
        };
        const rect = catRects[activeCat];
        if (!rect) return null;
        const cs = CAT_STYLE[activeCat];
        return (
          <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={rect.r}
            fill={cs.bg} stroke={cs.color} strokeWidth="1.5" strokeDasharray="4 3"
            style={{ transition: 'all 0.5s', opacity: 0.7 }} />
        );
      })()}

      {/* ── Outer hexagon outline ── */}
      <polygon points={OUTLINE_POINTS} fill="none" stroke="#D8D0CC" strokeWidth="1.5" />

      {/* ── Lines: center to each node ── */}
      {NODES.map((n, i) => {
        const pos = NODE_POSITIONS[i];
        const isActive = i === activeIdx;
        return (
          <line key={n.key} x1={CX} y1={CY} x2={pos.x} y2={pos.y}
            stroke={isActive ? CAT_STYLE[n.category].color : '#E0D8D4'}
            strokeWidth={isActive ? 2.5 : 1}
            style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }} />
        );
      })}

      {/* ── Center hexagon (rendered before nodes so active node appears on top) ── */}
      <polygon points={pointyHexPts(CX, CY, CENTER_R)} fill="#C0392B" stroke="#A93226" strokeWidth="2" />
      <text x={CX} y={CY - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="white">PSİKOLOJİK</text>
      <text x={CX} y={CY + 6}  textAnchor="middle" fontSize="10" fontWeight="700" fill="white">ESNEKLİK</text>

      {/* ── Node hexagons — inactive first, active last ── */}
      {renderOrder.map(i => {
        const n   = NODES[i];
        const pos = NODE_POSITIONS[i];
        const isActive = i === activeIdx;
        const cs  = CAT_STYLE[n.category];
        const lines = n.label.split('\n');
        // 1.5× scale for active node, spring easing
        const scale = isActive && isRunning ? 1.5 : 1;

        return (
          <g
            key={n.key}
            style={{
              transformOrigin: `${pos.x}px ${pos.y}px`,
              transform: `scale(${scale})`,
              transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Outer glow halo */}
            {isActive && isRunning && (
              <polygon
                points={flatHexPts(pos.x, pos.y, NODE_R + 12)}
                fill={cs.color} opacity="0.14"
                filter="url(#glow-node)"
              />
            )}
            {/* Hexagon face */}
            <polygon
              points={flatHexPts(pos.x, pos.y, NODE_R)}
              fill={isActive ? cs.bg : '#F5F2F0'}
              stroke={isActive ? cs.color : '#C8C0BC'}
              strokeWidth={isActive ? 2.5 : 1.5}
              filter={isActive && isRunning ? 'url(#shadow-active)' : undefined}
              style={{ transition: 'fill 0.4s, stroke 0.4s' }}
            />
            {/* Label */}
            {lines.map((line, li) => (
              <text key={li}
                x={pos.x}
                y={pos.y + (lines.length === 1 ? 5 : li * 14 - 7)}
                textAnchor="middle"
                fontSize={lines.length === 1 ? '12' : '11'}
                fontWeight={isActive ? '700' : '500'}
                fill={isActive ? cs.color : '#3A3530'}
                style={{ transition: 'fill 0.3s' }}
              >{line}</text>
            ))}
            {/* Countdown arc — inside group so it scales with the node */}
            {isActive && isRunning && !hideTimer && (() => {
              const r = NODE_R + 16;
              const circumference = 2 * Math.PI * r;
              const dash = progress * circumference;
              return (
                <circle cx={pos.x} cy={pos.y} r={r}
                  fill="none" stroke={cs.color} strokeWidth="3"
                  strokeDasharray={`${dash.toFixed(2)} ${circumference.toFixed(2)}`}
                  strokeDashoffset={circumference / 4}
                  strokeLinecap="round" opacity="0.75"
                  style={{ transition: 'stroke-dasharray 0.95s linear' }} />
              );
            })()}
          </g>
        );
      })}
    </svg>
  );
}

// ─── SetupScreen ──────────────────────────────────────────────────────────────
function SetupScreen({
  config,
  setConfig,
  mode,
  setMode,
  hideTimer,
  setHideTimer,
  onStart,
}: {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  mode: DancingMode;
  setMode: (m: DancingMode) => void;
  hideTimer: boolean;
  setHideTimer: (v: boolean) => void;
  onStart: () => void;
}) {
  const updateParticipant = (i: number, field: keyof Participant, value: string) => {
    const next = [...config.participants];
    next[i] = { ...next[i], [field]: value };
    setConfig(c => ({ ...c, participants: next }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blue-50 flex flex-col items-center py-10 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-rose-600 text-white px-5 py-2 rounded-full text-sm font-bold mb-3">
          <Zap size={14} />
          ACT Pratik Sistemi
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Hexaflex Dancing</h1>
        <p className="text-gray-500 mt-2 text-sm">Terapist adayları için canlı ACT boyut pratiği</p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-3 mb-8">
        {(['hexaflex', 'triflex'] as DancingMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-6 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
              mode === m
                ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200'
                : 'border-gray-200 text-gray-600 hover:border-rose-300'
            }`}
          >
            {m === 'hexaflex' ? '⬡ Hexaflex Dancing' : '△ Triflex Dancing'}
            {m === 'triflex' && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Yeni</span>
            )}
          </button>
        ))}
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Settings */}
        <div className="lg:col-span-2 space-y-5">
          {/* Duration */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Seans Süresi
            </h3>
            <div className="flex gap-2 flex-wrap">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setConfig(c => ({ ...c, duration: d }))}
                  className={`w-16 h-14 rounded-xl font-bold text-lg transition-all ${
                    config.duration === d
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-rose-50 hover:text-rose-600 border border-gray-200'
                  }`}
                >
                  {d}<span className="text-xs font-normal">dk</span>
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Geçiş Hızı
            </h3>
            <div className="flex gap-3">
              {SPEEDS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setConfig(c => ({ ...c, speed: s.value }))}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                    config.speed === s.value
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-rose-50 border border-gray-200'
                  }`}
                >
                  {s.label}
                  <div className="text-xs font-normal opacity-70 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Order */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Sıra
            </h3>
            <div className="flex gap-3">
              {[
                { label: 'Sıralı', value: true, icon: '→' },
                { label: 'Rastgele', value: false, icon: '⤫' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setConfig(c => ({ ...c, sequential: opt.value }))}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    config.sequential === opt.value
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-rose-50 border border-gray-200'
                  }`}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timer visibility */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              Süre Gösterimi
            </h3>
            <div className="flex gap-3">
              {[
                { label: 'Göster', value: false, icon: <Eye size={14} />, desc: 'Geri sayım ve arc görünür' },
                { label: 'Gizle', value: true,  icon: <EyeOff size={14} />, desc: 'Adaylar süreyi görmez' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setHideTimer(opt.value)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    hideTimer === opt.value
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-rose-50 border border-gray-200'
                  }`}
                >
                  {opt.icon} {opt.label}
                  <div className="text-xs font-normal opacity-70 hidden sm:block">{opt.desc}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Gizle seçildiğinde boyut geri sayım arci ve seans saati ekranda görünmez; seans süresi arka planda işlemeye devam eder.
            </p>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">5</span>
              Katılımcılar
            </h3>
            <p className="text-xs text-gray-400 mb-3 ml-8">Her grupta 4 kişilik roller: Terapist – Danışan – Süpervizör – Yazıcı</p>
            <div className="grid grid-cols-2 gap-3">
              {config.participants.map((p, i) => {
                const color = ROLE_COLORS[p.role] ?? '#888';
                return (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-xl border border-gray-100 bg-gray-50">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {p.role[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold" style={{ color }}>{p.role}</div>
                      <input
                        type="text"
                        value={p.name}
                        onChange={e => updateParticipant(i, 'name', e.target.value)}
                        placeholder="İsim (isteğe bağlı)"
                        className="w-full text-xs text-gray-700 bg-transparent border-none outline-none placeholder-gray-300 mt-0.5"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Names + Info */}
        <div className="space-y-5">
          {/* Educator / Therapist names */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users size={14} className="text-rose-500" />
              Oturum Bilgisi
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Eğitici</label>
                <input
                  type="text"
                  value={config.educatorName}
                  onChange={e => setConfig(c => ({ ...c, educatorName: e.target.value }))}
                  placeholder="Eğiticinin adı"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Terapist Adayı</label>
                <input
                  type="text"
                  value={config.therapistName}
                  onChange={e => setConfig(c => ({ ...c, therapistName: e.target.value }))}
                  placeholder="Terapist adayının adı"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-400"
                />
              </div>
            </div>
          </div>

          {/* Role guide */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Rol Rehberi</h3>
            <div className="space-y-3">
              {ROLES.map(role => (
                <div key={role} className="flex gap-2">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: ROLE_COLORS[role] }}
                  />
                  <div>
                    <div className="text-xs font-semibold" style={{ color: ROLE_COLORS[role] }}>{role}</div>
                    <div className="text-xs text-gray-400">{ROLE_DESCS[role]}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700 font-medium">⏱ Her döngüde terapist 5 dk seans yapar, sonra sadece danışan 1 dk geri bildirim verir.</p>
            </div>
          </div>

          {/* Preview hex small */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center justify-center" style={{ height: '160px' }}>
            <HexaflexSVG activeIdx={0} mode={mode} nodeTimeLeft={20} speed={20} phase="paused" hideTimer={false} />
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        className="mt-8 flex items-center gap-3 bg-rose-600 hover:bg-rose-700 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-rose-200 transition-all active:scale-95"
      >
        <Play size={22} />
        Seansı Başlat
        <ChevronRight size={18} />
      </button>
      <p className="mt-2 text-xs text-gray-400">
        {config.duration} dakika · {config.sequential ? 'Sıralı' : 'Rastgele'} · {SPEEDS.find(s => s.value === config.speed)?.desc}
      </p>
    </div>
  );
}

// ─── DancingScreen ────────────────────────────────────────────────────────────
function DancingScreen({
  config,
  mode,
  phase,
  setPhase,
  activeIdx,
  setActiveIdx,
  nodeTimeLeft,
  setNodeTimeLeft,
  sessionTimeLeft,
  setSessionTimeLeft,
  hideTimer,
  setHideTimer,
  onReset,
}: {
  config: Config;
  mode: DancingMode;
  phase: Phase;
  setPhase: (p: Phase) => void;
  activeIdx: number;
  setActiveIdx: React.Dispatch<React.SetStateAction<number>>;
  nodeTimeLeft: number;
  setNodeTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  sessionTimeLeft: number;
  setSessionTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  hideTimer: boolean;
  setHideTimer: (v: boolean) => void;
  onReset: () => void;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [interventionIdx, setInterventionIdx] = useState(0);
  const [yaziciNote, setYaziciNote] = useState('');
  const yaziciNoteRef = useRef('');

  // Instructor panel state
  const [showInstructor, setShowInstructor] = useState(true);
  const [educatorNotes, setEducatorNotes] = useState<Record<string, string>>({});
  const [pinnedIntervention, setPinnedIntervention] = useState<number | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(true);

  const updateEducatorNote = (nodeKey: string, val: string) =>
    setEducatorNotes(prev => ({ ...prev, [nodeKey]: val }));

  const activeNode = NODES[activeIdx];
  const cs = CAT_STYLE[activeNode.category];

  const advance = useCallback(() => {
    setActiveIdx(prev => {
      let next: number;
      if (config.sequential) {
        next = (prev + 1) % 6;
      } else {
        const opts = [0, 1, 2, 3, 4, 5].filter(n => n !== prev);
        next = opts[Math.floor(Math.random() * opts.length)];
      }
      return next;
    });
    setNodeTimeLeft(config.speed);
    setInterventionIdx(prev => (prev + 1) % 5);
  }, [config.sequential, config.speed, setActiveIdx, setNodeTimeLeft]);

  useEffect(() => {
    if (phase !== 'running') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setNodeTimeLeft(t => {
        if (t <= 1) { advance(); return config.speed; }
        return t - 1;
      });
      setSessionTimeLeft(t => {
        if (t <= 1) {
          setPhase('done');
          // Save session log to localStorage
          try {
            const log = {
              id: crypto.randomUUID(),
              date: new Date().toLocaleDateString('tr-TR'),
              time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
              mode,
              duration: config.duration,
              speed: config.speed,
              sequential: config.sequential,
              educatorName: config.educatorName,
              therapistName: config.therapistName,
              participants: config.participants,
              yaziciNotes: yaziciNoteRef.current,
            };
            const existing = JSON.parse(localStorage.getItem('act-session-logs') || '[]');
            localStorage.setItem('act-session-logs', JSON.stringify([log, ...existing].slice(0, 100)));
          } catch { /* ignore */ }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, advance, config.speed, setNodeTimeLeft, setSessionTimeLeft, setPhase]);

  const sessionPct = sessionTimeLeft / (config.duration * 60);
  const mm = String(Math.floor(sessionTimeLeft / 60)).padStart(2, '0');
  const ss = String(sessionTimeLeft % 60).padStart(2, '0');

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blue-50 flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">Seans Tamamlandı!</h2>
          <p className="text-gray-500 mt-2">Harika bir pratik seansıydı.</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 bg-rose-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg"
        >
          <RotateCcw size={16} /> Yeni Seans
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50 flex flex-col" style={{ userSelect: 'none' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onReset} className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1">
            <RotateCcw size={13} /> Sıfırla
          </button>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs font-medium text-gray-500">
            {mode === 'hexaflex' ? '⬡ Hexaflex' : '△ Triflex'} Dancing
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Session countdown */}
          {!hideTimer ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-sm font-mono font-bold text-gray-800">{mm}:{ss}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-300 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-sm font-mono font-bold text-gray-300">--:--</span>
            </div>
          )}
          {/* Node countdown */}
          {!hideTimer ? (
            <div
              className="text-sm font-mono font-bold px-3 py-1.5 rounded-full text-white"
              style={{ backgroundColor: cs.color }}
            >
              {nodeTimeLeft}s
            </div>
          ) : (
            <div className="text-sm font-mono font-bold px-3 py-1.5 rounded-full text-gray-300 bg-gray-100 border border-dashed border-gray-200">
              --s
            </div>
          )}
          {/* Timer toggle */}
          <button
            onClick={() => setHideTimer(!hideTimer)}
            title={hideTimer ? 'Süreyi Göster' : 'Süreyi Gizle'}
            className={`p-2 rounded-full border transition-all ${
              hideTimer
                ? 'bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100'
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            {hideTimer ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Instructor panel toggle */}
          <button
            onClick={() => setShowInstructor(v => !v)}
            title={showInstructor ? 'Eğitici Panelini Gizle' : 'Eğitici Panelini Göster'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
              showInstructor
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
            }`}
          >
            {showInstructor ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            <span className="hidden sm:inline">Eğitici</span>
          </button>
          <button
            onClick={() => setPhase(phase === 'running' ? 'paused' : 'running')}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            {phase === 'running' ? <Pause size={14} /> : <Play size={14} />}
            {phase === 'running' ? 'Duraklat' : 'Devam Et'}
          </button>
        </div>
      </div>

      {/* Session progress bar */}
      <div className="h-1 bg-gray-100">
        {!hideTimer && (
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{ width: `${(1 - sessionPct) * 100}%`, backgroundColor: cs.color }}
          />
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel: participants + yazıcı note */}
        <div className="w-48 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col p-4 gap-3">
          {config.educatorName && (
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Eğitici</div>
              <div className="font-semibold text-gray-800 text-sm truncate">{config.educatorName}</div>
            </div>
          )}
          {config.therapistName && (
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Terapist Adayı</div>
              <div className="font-semibold text-gray-800 text-sm truncate">{config.therapistName}</div>
            </div>
          )}
          {(config.educatorName || config.therapistName) && <hr className="border-gray-100" />}
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Katılımcılar</div>
          {config.participants.map((p, i) => {
            const color = ROLE_COLORS[p.role] ?? '#888';
            return (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {p.name ? p.name[0].toUpperCase() : p.role[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-tight truncate" style={{ color }}>{p.role}</div>
                  {p.name && <div className="text-xs text-gray-500 leading-tight truncate">{p.name}</div>}
                </div>
              </div>
            );
          })}
          {/* Yazıcı note — bottom of left panel */}
          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block flex-shrink-0" />
              Yazıcı Notu
            </div>
            <textarea
              className="w-full text-xs text-gray-600 border border-gray-200 rounded-xl p-2 resize-none h-24 outline-none focus:border-purple-300"
              placeholder="Müdahaleleri not al…"
              value={yaziciNote}
              onChange={e => { setYaziciNote(e.target.value); yaziciNoteRef.current = e.target.value; }}
            />
          </div>
        </div>

        {/* Center: full-width hexaflex SVG */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex items-center justify-center p-6 relative">
            {phase === 'paused' && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="text-4xl mb-2">⏸</div>
                  <p className="text-gray-600 font-semibold">Duraklatıldı</p>
                  <button
                    onClick={() => setPhase('running')}
                    className="mt-3 flex items-center gap-2 bg-rose-600 text-white px-6 py-2 rounded-xl font-semibold mx-auto"
                  >
                    <Play size={14} /> Devam Et
                  </button>
                </div>
              </div>
            )}
            <div style={{ width: '100%', maxWidth: '560px', maxHeight: '560px' }}>
              <HexaflexSVG
                activeIdx={activeIdx}
                mode={mode}
                nodeTimeLeft={nodeTimeLeft}
                speed={config.speed}
                phase={phase}
                hideTimer={hideTimer}
              />
            </div>
          </div>

          {/* Bottom info strip — active dimension */}
          <div className="flex-shrink-0 flex items-center justify-center gap-3 px-6 py-3 border-t border-gray-100 bg-white/80">
            {activeNode.category !== 'all' && (
              <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: cs.color }}>
                {CAT_STYLE[activeNode.category].label}
              </span>
            )}
            <span className="text-base font-bold text-gray-800">{activeNode.label.replace('\n', ' ')}</span>
            <span className="text-xs text-gray-400 hidden sm:block max-w-xs truncate">{activeNode.desc}</span>
            {mode === 'triflex' && (
              <span className="text-xs text-gray-400 hidden md:block italic">{activeNode.triflexHint}</span>
            )}
          </div>
        </div>

        {/* ── Right: Instructor Panel ── */}
        {showInstructor && (
          <div className="w-72 flex-shrink-0 border-l border-amber-100 bg-amber-50/60 flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-amber-100 bg-amber-100/60 flex items-center gap-2 flex-shrink-0">
              <BookOpen size={14} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Eğitici Paneli</span>
              <span className="ml-auto text-[10px] text-amber-600 bg-amber-200/60 px-2 py-0.5 rounded-full">
                {activeNode.label.replace('\n', ' ')}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Boyut açıklaması */}
              <div className="rounded-xl bg-white border border-amber-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  {activeNode.category !== 'all' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: cs.color }}>
                      {CAT_STYLE[activeNode.category].label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{activeNode.desc}</p>
                {mode === 'triflex' && (
                  <p className="text-[10px] text-amber-600 italic mt-2 border-t border-amber-100 pt-2">
                    {activeNode.triflexHint}
                  </p>
                )}
              </div>

              {/* Intervention önerileri */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb size={12} className="text-amber-600" />
                  <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Müdahale Önerileri</span>
                </div>
                <div className="space-y-1.5">
                  {activeNode.interventions.map((iv, idx) => {
                    const pinned = pinnedIntervention === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setPinnedIntervention(pinned ? null : idx)}
                        className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all leading-relaxed ${
                          pinned
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md font-medium'
                            : 'bg-white text-gray-700 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                        }`}
                      >
                        <span className="opacity-50 mr-1.5">{idx + 1}.</span>
                        {iv}
                      </button>
                    );
                  })}
                </div>
                {pinnedIntervention !== null && (
                  <div className="mt-2 rounded-xl bg-amber-500/10 border border-amber-300 px-3 py-2">
                    <p className="text-[10px] text-amber-700 font-semibold mb-0.5">📌 Öne çıkarılan soru:</p>
                    <p className="text-xs text-amber-800 font-medium leading-snug">
                      {activeNode.interventions[pinnedIntervention]}
                    </p>
                  </div>
                )}
              </div>

              {/* Eğitici notu */}
              <div>
                <button
                  onClick={() => setNotesExpanded(v => !v)}
                  className="flex items-center gap-1.5 mb-2 w-full text-left"
                >
                  <PenLine size={12} className="text-amber-600" />
                  <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex-1">
                    Eğitici Notu
                    <span className="ml-1 text-amber-500 font-normal normal-case">
                      ({activeNode.label.replace('\n', ' ')})
                    </span>
                  </span>
                  {notesExpanded ? <ChevronUp size={12} className="text-amber-500" /> : <ChevronDown size={12} className="text-amber-500" />}
                </button>
                {notesExpanded && (
                  <textarea
                    className="w-full text-xs text-gray-700 border border-amber-200 rounded-xl p-2.5 resize-none h-28 outline-none focus:border-amber-400 bg-white leading-relaxed"
                    placeholder={`Bu boyut için not al veya terapist adayına mesaj bırak…\n\nÖrnek: "Ayrışma sorusuna geçmeden önce 'bu düşünce mi, sen mi?' ayrımını sor."`}
                    value={educatorNotes[activeNode.key] ?? ''}
                    onChange={e => updateEducatorNote(activeNode.key, e.target.value)}
                    style={{ userSelect: 'text' } as React.CSSProperties}
                  />
                )}
              </div>

              {/* Tüm notlar özeti */}
              {Object.keys(educatorNotes).some(k => educatorNotes[k]) && (
                <div className="rounded-xl border border-amber-200 bg-white p-3">
                  <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-2">Tüm Boyut Notları</p>
                  <div className="space-y-2">
                    {NODES.map(n => educatorNotes[n.key] ? (
                      <div key={n.key} className={`rounded-lg px-2.5 py-1.5 border ${n.key === activeNode.key ? 'border-amber-400 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
                        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{n.label.replace('\n', ' ')}</p>
                        <p className="text-[10px] text-gray-600 leading-snug">{educatorNotes[n.key]}</p>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TriflexPlaceholder ────────────────────────────────────────────────────────
function TriflexInfo() {
  return (
    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-sm text-blue-700">
      <div className="font-bold mb-2">Triflex Dancing Hakkında</div>
      <p>Triflex modunda, hexaflex boyutlarına ek olarak üst kategoriler de (FARKINDA / AÇIK / AKTİF) vurgulanır. Terapist adayları hem boyuta özgü, hem de kategoriye özgü müdahaleler geliştirir.</p>
      <ul className="mt-3 space-y-1 list-disc list-inside opacity-80">
        <li><strong>Şimdiki Anla Temas aktifken:</strong> FARKINDA kategori vurgulu → farkındalık/pekiştirme müdahalesi</li>
        <li><strong>Değerler veya Adanmış Eylem:</strong> AKTİF/ANGAJE → aktivasyon/motivasyon müdahalesi</li>
        <li><strong>Kabul veya Bilişsel Ayrışma:</strong> AÇIK → kabullenici/defüzyon müdahalesi</li>
      </ul>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ACTDancing({ initialMode = 'hexaflex' }: { initialMode?: DancingMode }) {
  const [mode, setMode] = useState<DancingMode>(initialMode);
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<Config>({ ...DEFAULT_CONFIG });
  const [activeIdx, setActiveIdx] = useState(0);
  const [nodeTimeLeft, setNodeTimeLeft] = useState(DEFAULT_CONFIG.speed);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(DEFAULT_CONFIG.duration * 60);
  const [hideTimer, setHideTimer] = useState(false);

  const handleStart = () => {
    setActiveIdx(0);
    setNodeTimeLeft(config.speed);
    setSessionTimeLeft(config.duration * 60);
    setPhase('running');
  };

  const handleReset = () => {
    setPhase('setup');
    setActiveIdx(0);
  };

  if (phase === 'setup') {
    return (
      <div>
        <SetupScreen
          config={config}
          setConfig={setConfig}
          mode={mode}
          setMode={setMode}
          hideTimer={hideTimer}
          setHideTimer={setHideTimer}
          onStart={handleStart}
        />
        {mode === 'triflex' && (
          <div className="max-w-2xl mx-auto px-4 pb-10">
            <TriflexInfo />
          </div>
        )}
      </div>
    );
  }

  return (
    <DancingScreen
      config={config}
      mode={mode}
      phase={phase}
      setPhase={setPhase}
      activeIdx={activeIdx}
      setActiveIdx={setActiveIdx}
      nodeTimeLeft={nodeTimeLeft}
      setNodeTimeLeft={setNodeTimeLeft}
      sessionTimeLeft={sessionTimeLeft}
      setSessionTimeLeft={setSessionTimeLeft}
      hideTimer={hideTimer}
      setHideTimer={setHideTimer}
      onReset={handleReset}
    />
  );
}
