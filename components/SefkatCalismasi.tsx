'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Heart, ChevronRight, RotateCcw, X, Sparkles, ImagePlus, BookOpen, FlaskConical, AlertTriangle, Zap } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type SefkatPhase = 'intro' | 'upload' | 'breathing' | 'practice' | 'done';
type BreathStep  = 'inhale' | 'hold' | 'exhale';

// ─── Geometry (same hex math as ACT Dancing) ──────────────────────────────────
const VW = 500, VH = 500;
const CX = 250, CY = 250;
const OUTER_R = 148;
const NODE_R   = 43;
const CENTER_R = 55;

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

// ─── Şefkat Boyutları ─────────────────────────────────────────────────────────
const NODES = [
  {
    i: 0, key: 'farkindalik',   angleDeg: 0,
    label: 'Farkındalık',
    color: '#6B9DC2', bg: 'rgba(107,157,194,0.13)',
    emoji: '👁',
    title: 'Acıyı Fark Ediyorum',
    prompt: 'Şu an bedeninizde ve zihninizde ne fark ediyorsunuz? Yargılamadan, sadece gözlemleyin.\n\nNerede hissediyorsunuz? Nasıl bir his?',
    affirmation: '"Bu an zor. Bu gerçek ve bu tamam."',
    breath: 'Derin bir nefes alın ve yavaşça bırakın.',
  },
  {
    i: 1, key: 'ortak-insanlik', angleDeg: 60,
    label: 'Ortak\nİnsanlık',
    color: '#9B72AA', bg: 'rgba(155,114,170,0.13)',
    emoji: '🤝',
    title: 'Yalnız Değilim',
    prompt: 'Bu fotoğraftaki kişiyle aynı acıyı hisseden milyonlarca insan var. Hepimiz bazen böyle hissederiz.\n\nŞu an dünyada aynı şeyi hisseden başka biri de var.',
    affirmation: '"Acı çekmek insanlığın ortak deneyimidir."',
    breath: 'Nefes alırken "hepimiz" deyin, verirken "yalnız değilim."',
  },
  {
    i: 2, key: 'oz-nezaket',   angleDeg: 120,
    label: 'Öz-Nezaket',
    color: '#C96080', bg: 'rgba(201,96,128,0.13)',
    emoji: '💌',
    title: 'Kendime Nazik Olabilirim',
    prompt: 'Bu fotoğraftaki kişiye — o çocuğa ya da o sevgili canlıya — bir arkadaşınız gibi ne söylerdiniz?\n\nO kelimeleri şimdi yüksek sesle ya da içinizden kendinize söyleyin.',
    affirmation: '"Kendime, en yakın arkadaşıma gösterdiğim anlayışı gösterebilirim."',
    breath: 'Nefes alırken elinizi kalbinize koyun.',
  },
  {
    i: 3, key: 'guvenli-yer',  angleDeg: 180,
    label: 'Güvenli\nYer',
    color: '#5E9B7A', bg: 'rgba(94,155,122,0.13)',
    emoji: '🌿',
    title: 'İçimdeki Güvenli Alan',
    prompt: 'İçinizde her şeyi gören, her zaman yanınızda olan bir sessizlik var. Hiçbir düşüncenin, hiçbir duygunun sizi tamamen kapatamaycağı bir alan.\n\nO alana dokunun.',
    affirmation: '"İçimde her zaman güvenli bir yer var. Ona istediğim zaman dönebilirim."',
    breath: 'Her nefeste biraz daha o güvenli yere yaklaşın.',
  },
  {
    i: 4, key: 'sefkat-sesi',  angleDeg: 240,
    label: 'Şefkat\nSesi',
    color: '#C47A50', bg: 'rgba(196,122,80,0.13)',
    emoji: '🗣',
    title: 'Yumuşak Bir Sesle',
    prompt: 'Kendinize karşı içinizdeki ses nasıl? Sert mi, yargılayıcı mı?\n\nŞimdi o sesi değiştirin. Sevdiğiniz birine konuşur gibi — yumuşak, sabırlı, anlayışlı.',
    affirmation: '"Kendi en iyi arkadaşım olabilirim."',
    breath: 'Nefes verirken o sesi kendinize doğru bırakın.',
  },
  {
    i: 5, key: 'sefkat-gonder', angleDeg: 300,
    label: 'Şefkat\nGönder',
    color: '#C9A84C', bg: 'rgba(201,168,76,0.13)',
    emoji: '✨',
    title: 'Şefkat Gönderip Alıyorum',
    prompt: 'Bu fotoğraftaki kişiye — o çocuğa ya da o sevgili canlıya — tüm kalbinizle şefkat gönderin.\n\nSonra o şefkati içinize çekin. Verdiğinizin aynısını almayı da hak ediyorsunuz.',
    affirmation: '"Kendime de şefkat vermeyi hak ediyorum."',
    breath: 'Nefes alırken şefkati içinize çekin, verirken dünyaya gönderin.',
  },
];

const NODE_POSITIONS = NODES.map(n => polarXY(n.angleDeg, OUTER_R));
const OUTLINE_POINTS = NODE_POSITIONS.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

// ─── CompassionHexSVG ─────────────────────────────────────────────────────────
function CompassionHexSVG({
  activeIdx,
  photoUrl,
  breathScale,
  phase,
}: {
  activeIdx: number;
  photoUrl: string | null;
  breathScale: number;   // 1.0 – 1.06, drives center pulse
  phase: SefkatPhase;
}) {
  const isRunning = phase === 'practice';
  const renderOrder = NODES.map((_, i) => i).filter(i => i !== activeIdx).concat(activeIdx);
  const activeNode  = NODES[activeIdx];

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height="100%"
      style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {/* Photo clip to center hex */}
        <clipPath id="center-photo-clip">
          <polygon points={pointyHexPts(CX, CY, CENTER_R - 2)} />
        </clipPath>
        {/* Soft glow for active node */}
        <filter id="sefkat-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Drop shadow for active */}
        <filter id="sefkat-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="5" stdDeviation="10" floodOpacity="0.22" />
        </filter>
        {/* Radial gradient for center */}
        <radialGradient id="center-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FCEAE8" />
          <stop offset="100%" stopColor="#F5D9D4" />
        </radialGradient>
      </defs>

      {/* Outer hex outline */}
      <polygon points={OUTLINE_POINTS} fill="none" stroke="#E2D5CE" strokeWidth="1.5" />

      {/* Lines: center → nodes */}
      {NODES.map((n, i) => {
        const pos = NODE_POSITIONS[i];
        const isActive = i === activeIdx;
        return (
          <line key={n.key} x1={CX} y1={CY} x2={pos.x} y2={pos.y}
            stroke={isActive ? n.color : '#EAE0D8'}
            strokeWidth={isActive ? 2.5 : 1}
            style={{ transition: 'stroke 0.5s, stroke-width 0.5s' }} />
        );
      })}

      {/* Center hex (breathing pulse) */}
      <g style={{
        transformOrigin: `${CX}px ${CY}px`,
        transform: `scale(${breathScale})`,
        transition: 'transform 0.4s ease-in-out',
      }}>
        {/* Soft outer pulse ring */}
        <polygon points={pointyHexPts(CX, CY, CENTER_R + 10)}
          fill="none" stroke="#E8C8C0" strokeWidth="1"
          opacity="0.5" />
        {/* Center face */}
        <polygon points={pointyHexPts(CX, CY, CENTER_R)}
          fill={photoUrl ? 'none' : 'url(#center-grad)'}
          stroke="#D4A898" strokeWidth="2" />
        {/* Photo or heart */}
        {photoUrl ? (
          <image
            href={photoUrl}
            x={CX - CENTER_R} y={CY - CENTER_R}
            width={CENTER_R * 2} height={CENTER_R * 2}
            clipPath="url(#center-photo-clip)"
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <>
            <text x={CX} y={CY + 8} textAnchor="middle" fontSize="28">🤍</text>
          </>
        )}
      </g>

      {/* Nodes — inactive first, active last (z-order) */}
      {renderOrder.map(i => {
        const n   = NODES[i];
        const pos = NODE_POSITIONS[i];
        const isActive  = i === activeIdx;
        const lines     = n.label.split('\n');
        const scale     = isActive && isRunning ? 1.5 : 1;

        return (
          <g key={n.key} style={{
            transformOrigin: `${pos.x}px ${pos.y}px`,
            transform: `scale(${scale})`,
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            {/* Glow halo */}
            {isActive && isRunning && (
              <polygon points={flatHexPts(pos.x, pos.y, NODE_R + 14)}
                fill={n.color} opacity="0.12" filter="url(#sefkat-glow)" />
            )}
            {/* Hex face */}
            <polygon
              points={flatHexPts(pos.x, pos.y, NODE_R)}
              fill={isActive ? n.bg : '#FAF7F5'}
              stroke={isActive ? n.color : '#DDD5CE'}
              strokeWidth={isActive ? 2.5 : 1.5}
              filter={isActive && isRunning ? 'url(#sefkat-shadow)' : undefined}
              style={{ transition: 'fill 0.5s, stroke 0.5s' }}
            />
            {/* Emoji */}
            <text x={pos.x} y={pos.y - (lines.length > 1 ? 10 : 6)}
              textAnchor="middle" fontSize="14"
              opacity={isActive ? 1 : 0.5}
              style={{ transition: 'opacity 0.4s' }}>
              {n.emoji}
            </text>
            {/* Label */}
            {lines.map((line, li) => (
              <text key={li} x={pos.x}
                y={pos.y + (lines.length === 1 ? 16 : li * 12 + 6)}
                textAnchor="middle"
                fontSize={lines.length === 1 ? '11' : '10'}
                fontWeight={isActive ? '700' : '500'}
                fill={isActive ? n.color : '#7A6E68'}
                style={{ transition: 'fill 0.3s' }}>
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Breathing Screen ─────────────────────────────────────────────────────────
function BreathingScreen({ onReady }: { onReady: () => void }) {
  const [step, setStep]   = useState<BreathStep>('inhale');
  const [count, setCount] = useState(4);
  const [cycle, setCycle] = useState(0);
  const [scale, setScale] = useState(1);
  const CYCLES = 3;

  useEffect(() => {
    const STEPS: { step: BreathStep; dur: number; targetScale: number }[] = [
      { step: 'inhale', dur: 4, targetScale: 1.18 },
      { step: 'hold',   dur: 4, targetScale: 1.18 },
      { step: 'exhale', dur: 6, targetScale: 0.88 },
    ];
    let stepIdx = 0;
    let remaining = STEPS[0].dur;
    setStep(STEPS[0].step);
    setScale(STEPS[0].targetScale);
    setCount(remaining);

    const id = setInterval(() => {
      remaining--;
      setCount(remaining);
      if (remaining <= 0) {
        stepIdx = (stepIdx + 1) % STEPS.length;
        if (stepIdx === 0) {
          setCycle(c => {
            if (c + 1 >= CYCLES) { clearInterval(id); return c; }
            return c + 1;
          });
        }
        remaining = STEPS[stepIdx].dur;
        setStep(STEPS[stepIdx].step);
        setScale(STEPS[stepIdx].targetScale);
        setCount(remaining);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const STEP_LABELS: Record<BreathStep, string> = {
    inhale: 'Nefes Al', hold: 'Tut', exhale: 'Nefes Ver',
  };
  const STEP_COLORS: Record<BreathStep, string> = {
    inhale: '#9B72AA', hold: '#6B9DC2', exhale: '#5E9B7A',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-purple-50 gap-8 px-4">
      <div className="text-center">
        <p className="text-sm text-gray-400 uppercase tracking-widest font-medium">Hazırlanıyoruz</p>
        <h2 className="text-2xl font-semibold text-gray-800 mt-1">Birlikte nefes alalım</h2>
      </div>
      {/* Breathing circle */}
      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
        <div
          className="absolute rounded-full border-2"
          style={{
            width: 220 * scale, height: 220 * scale,
            borderColor: STEP_COLORS[step] + '40',
            backgroundColor: STEP_COLORS[step] + '10',
            transition: `width ${step === 'inhale' ? 4 : step === 'hold' ? 0.2 : 6}s ease-in-out, height ${step === 'inhale' ? 4 : step === 'hold' ? 0.2 : 6}s ease-in-out, background-color 1s`,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 140, height: 140,
            backgroundColor: STEP_COLORS[step] + '18',
            border: `2px solid ${STEP_COLORS[step]}50`,
            transition: 'border-color 1s, background-color 1s',
          }}
        />
        <div className="text-center z-10">
          <div className="text-3xl font-light" style={{ color: STEP_COLORS[step] }}>{count}</div>
          <div className="text-sm font-semibold mt-1" style={{ color: STEP_COLORS[step] }}>
            {STEP_LABELS[step]}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: CYCLES }, (_, i) => (
          <div key={i} className="w-2 h-2 rounded-full transition-all"
            style={{ backgroundColor: i <= cycle ? '#9B72AA' : '#E8D5E8' }} />
        ))}
      </div>
      <button onClick={onReady}
        className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 px-5 py-2 rounded-full transition-all hover:border-gray-400">
        Hazırım, başlayalım →
      </button>
    </div>
  );
}

// ─── Practice Screen ──────────────────────────────────────────────────────────
function PracticeScreen({
  photoUrl,
  onDone,
}: {
  photoUrl: string | null;
  onDone: (notes: string[]) => void;
}) {
  const [activeIdx, setActiveIdx]   = useState(0);
  const [notes, setNotes]           = useState<string[]>(Array(NODES.length).fill(''));
  const [showAffirm, setShowAffirm] = useState(false);
  const [breathScale, setBreathScale] = useState(1);

  // Slow breath pulse (4s in, 5s out) drives center
  useEffect(() => {
    let expanding = true;
    const tick = () => {
      setBreathScale(expanding ? 1.055 : 0.97);
      expanding = !expanding;
    };
    tick();
    const id = setInterval(tick, expanding ? 4000 : 5000);
    return () => clearInterval(id);
  }, []);

  const node    = NODES[activeIdx];
  const isLast  = activeIdx === NODES.length - 1;

  const next = () => {
    setShowAffirm(false);
    if (isLast) { onDone(notes); return; }
    setActiveIdx(i => i + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-purple-50 flex flex-col"
      style={{ userSelect: 'none' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white/70 backdrop-blur-sm border-b border-rose-100/50">
        <span className="text-sm font-semibold text-gray-500">Şefkat Çalışması</span>
        <div className="flex gap-1.5">
          {NODES.map((n, i) => (
            <button key={n.key} onClick={() => { setActiveIdx(i); setShowAffirm(false); }}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                backgroundColor: i === activeIdx ? n.color : i < activeIdx ? n.color + '80' : '#DDD5CE',
                transform: i === activeIdx ? 'scale(1.3)' : 'scale(1)',
              }} />
          ))}
        </div>
        <span className="text-xs text-gray-400 font-medium">{activeIdx + 1} / {NODES.length}</span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Hexagon SVG */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-0">
          <div style={{ width: '100%', maxWidth: '460px', maxHeight: '460px' }}>
            <CompassionHexSVG
              activeIdx={activeIdx}
              photoUrl={photoUrl}
              breathScale={breathScale}
              phase="practice"
            />
          </div>
        </div>

        {/* Right panel: prompt + reflection */}
        <div className="w-80 flex-shrink-0 flex flex-col border-l border-rose-100/60 bg-white/60 backdrop-blur-sm overflow-y-auto">
          {/* Node header */}
          <div className="p-5 border-b border-rose-100/60"
            style={{ background: `linear-gradient(135deg, ${node.bg}, transparent)` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{node.emoji}</span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: node.color }}>
                {node.label.replace('\n', ' ')}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 leading-tight">{node.title}</h3>
            <p className="text-xs text-gray-500 mt-1 italic">{node.breath}</p>
          </div>

          {/* Prompt */}
          <div className="p-5 flex-1 space-y-4">
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {node.prompt}
            </div>

            {/* Affirmation */}
            <div>
              {!showAffirm ? (
                <button onClick={() => setShowAffirm(true)}
                  className="w-full py-2.5 text-sm font-medium rounded-xl border-2 border-dashed transition-all hover:border-solid"
                  style={{ borderColor: node.color + '60', color: node.color }}>
                  Olumlamayı Gör ✦
                </button>
              ) : (
                <div className="rounded-2xl p-4 text-center border-2"
                  style={{ backgroundColor: node.bg, borderColor: node.color + '40' }}>
                  <div className="text-sm font-semibold italic leading-relaxed" style={{ color: node.color }}>
                    {node.affirmation}
                  </div>
                </div>
              )}
            </div>

            {/* Reflection textarea */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                Şu an ne hissediyorsunuz?
              </label>
              <textarea
                value={notes[activeIdx]}
                onChange={e => setNotes(n => n.map((v, i) => i === activeIdx ? e.target.value : v))}
                placeholder="Duygularınızı, bedeninizde ne hissettiğinizi, aklınıza gelenleri yazabilirsiniz…"
                rows={4}
                className="w-full text-sm text-gray-700 border border-rose-200 rounded-2xl p-3 resize-none outline-none focus:border-rose-400 bg-white/70"
                style={{ userSelect: 'text' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Next / Done */}
          <div className="p-5 border-t border-rose-100/60">
            <button onClick={next}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95"
              style={{ backgroundColor: node.color }}>
              {isLast ? (
                <><Sparkles size={16} /> Çalışmayı Tamamla</>
              ) : (
                <>Sonraki Boyut <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Done Screen ──────────────────────────────────────────────────────────────
function DoneScreen({ notes, photoUrl, onRestart }: {
  notes: string[]; photoUrl: string | null; onRestart: () => void;
}) {
  const filled = notes.filter(n => n.trim()).length;
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-purple-50 flex flex-col items-center justify-center px-4 py-12 gap-8">
      {/* Center glow */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-rose-200/40 blur-2xl scale-150" />
        {photoUrl ? (
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl shadow-rose-100">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="relative w-28 h-28 rounded-full bg-white flex items-center justify-center text-5xl shadow-xl shadow-rose-100 border-4 border-rose-100">
            🤍
          </div>
        )}
      </div>

      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-800">Harika bir çalışmaydı.</h2>
        <p className="text-gray-500 mt-2 leading-relaxed text-sm">
          Kendinize zaman ve şefkat ayırdınız. Bu, psikolojik esnekliğin en önemli adımlarından biridir.
        </p>
      </div>

      {/* Node summary */}
      {filled > 0 && (
        <div className="w-full max-w-lg space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Notlarınız</p>
          {NODES.map((n, i) => notes[i]?.trim() ? (
            <div key={n.key} className="bg-white/80 rounded-2xl p-4 border border-rose-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{n.emoji}</span>
                <span className="text-xs font-semibold" style={{ color: n.color }}>
                  {n.label.replace('\n', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{notes[i]}</p>
            </div>
          ) : null)}
        </div>
      )}

      <div className="flex gap-3 flex-wrap justify-center">
        <button onClick={onRestart}
          className="flex items-center gap-2 bg-white border border-rose-200 text-rose-600 px-6 py-3 rounded-2xl font-semibold text-sm shadow-sm hover:shadow-md transition-all">
          <RotateCcw size={15} /> Tekrar Yap
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center max-w-xs leading-relaxed">
        Bu çalışmayı düzenli olarak yapmak, öz-şefkat kasını güçlendirir ve psikolojik esnekliği artırır.
      </p>
    </div>
  );
}

// ─── Teori Paneli ─────────────────────────────────────────────────────────────
function SefkatTeoriPaneli() {
  const [acikMit, setAcikMit] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-purple-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        {/* Başlık */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-rose-400" />
            Öz-Şefkat: Teorik Çerçeve
          </h2>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Kristin Neff'in öz-şefkat modeli ve Paul Gilbert'in CFT çerçevesi — neden işe yarar, nasıl açıklanır.
          </p>
        </div>

        {/* ── 1. Kristin Neff — 3 Bileşen ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">1</span>
            <h3 className="text-lg font-bold text-gray-800">Kristin Neff — Öz-Şefkatın 3 Bileşeni</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Neff (2003) öz-şefkatin üç birbirine geçen bileşenden oluştuğunu tanımlar. Bunların hepsinin aynı anda aktive edilmesi "öz-şefkat tepkisi"ni oluşturur.
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              {
                emoji: '👁', renk: '#6B9DC2', bg: 'bg-blue-50 border-blue-200',
                baslik: 'Farkındalık',
                ing: 'Mindfulness',
                aciklama: 'Acıyı ne bastır ne dramatize et — dengeli bir farkındalıkla gör. Düşünceler ve duygular gözlemlenir, onlarla özdeşleşilmez.',
                karsiti: 'Karşıtı: Aşırı özdeşleşme (ruminasyon) veya bastırma.',
                hexNode: 'Farkındalık boyutuna karşılık gelir.',
              },
              {
                emoji: '🌍', renk: '#9B72AA', bg: 'bg-purple-50 border-purple-200',
                baslik: 'Ortak İnsanlık',
                ing: 'Common Humanity',
                aciklama: 'Acı çekmek insanlığın ortak deneyimidir. "Sadece ben böyleyim" hissi izolasyonu artırır; bu bileşen onu çözer.',
                karsiti: 'Karşıtı: İzolasyon — "Benim başıma geliyor, ben yetersizim."',
                hexNode: 'Ortak İnsanlık boyutuna karşılık gelir.',
              },
              {
                emoji: '💌', renk: '#C96080', bg: 'bg-rose-50 border-rose-200',
                baslik: 'Öz-Nezaket',
                ing: 'Self-Kindness',
                aciklama: 'Sert öz-eleştiri yerine sıcaklık ve anlayış. Kendine, zor bir dönemde olan sevdiğin birine davranır gibi davranmak.',
                karsiti: 'Karşıtı: Öz-yargı — "Ben zayıfım, kendimi toparlamalıyım."',
                hexNode: 'Öz-Nezaket + Şefkat Sesi boyutlarına karşılık gelir.',
              },
            ].map(b => (
              <div key={b.baslik} className={`rounded-2xl border p-4 ${b.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{b.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{b.baslik}</p>
                    <p className="text-[10px] text-gray-400 italic">{b.ing}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">{b.aciklama}</p>
                <p className="text-[10px] text-gray-400 italic border-t border-black/10 pt-2">{b.karsiti}</p>
                <p className="text-[10px] mt-1" style={{ color: b.renk }}>↳ {b.hexNode}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 leading-relaxed">
            <strong>Önemli not:</strong> Üç bileşen birbirini besler ama bağımsızdır. Danışan farkındalık pratiğinde ustalaşsa bile öz-nezaketi zor bulabilir — her bileşenin ayrı ayrı hedeflenmesi gerekir.
          </div>
        </section>

        {/* ── 2. Paul Gilbert — CFT: 3 Duygu Sistemi ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">2</span>
            <h3 className="text-lg font-bold text-gray-800">Paul Gilbert — CFT: 3 Duygu Düzenleme Sistemi</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Gilbert, evrimsel biyolojiden hareketle insanın üç temel duygu düzenleme sistemi olduğunu öne sürer. Psikolojik sorunların büyük çoğunluğu bu üç sistemin dengesizliğinden kaynaklanır.
          </p>

          <div className="grid md:grid-cols-3 gap-3">
            {[
              {
                sistem: 'Tehdit Sistemi',
                renk: '#E05A5A', bg: 'bg-red-50 border-red-200',
                ikon: '⚡',
                biyoloji: 'Amigdala, kortizol, noradrenalin',
                isten: 'Tehlikeyi fark et, hayatta kal',
                duygular: 'Kaygı · Öfke · Utanç · İğrenme',
                sorun: 'Kronik utanç veya özeleştiri bu sistemi sürekli aktive eder. Beyin "gerçek tehlike" ile "kendi kendini eleştiren düşünce"yi ayırt edemez.',
              },
              {
                sistem: 'Sürücü Sistemi',
                renk: '#D4A02A', bg: 'bg-yellow-50 border-yellow-200',
                ikon: '🎯',
                biyoloji: 'Dopamin, nükleus akkumbens',
                isten: 'Hedef ara, elde et, ilerle',
                duygular: 'Heyecan · Motivasyon · İstek · Merak',
                sorun: 'Aşırı aktif sürücü sistemi tükenmişliğe ve hiçbir zaman yetmeme hissine yol açar. "Başarı = değer" bağlantısı şemayı besler.',
              },
              {
                sistem: 'Sakinleştirici Sistem',
                renk: '#5E9B7A', bg: 'bg-green-50 border-green-200',
                ikon: '🌿',
                biyoloji: 'Oksitosin, endorfin, vagal ton',
                isten: 'Güvende hisset, bağlan, dinlen',
                duygular: 'Huzur · Ait olma · Tatmin · Şefkat',
                sorun: 'Bağlanma yaralanması bu sistemi bloke edebilir. "Şefkat = zayıflık" inancı, sakinleştirici sistemi erişilemez kılar.',
              },
            ].map(s => (
              <div key={s.sistem} className={`rounded-2xl border p-4 ${s.bg}`}>
                <div className="text-2xl mb-2">{s.ikon}</div>
                <p className="text-sm font-bold text-gray-800 mb-0.5">{s.sistem}</p>
                <p className="text-[10px] text-gray-400 mb-2 font-mono">{s.biyoloji}</p>
                <p className="text-xs text-gray-500 mb-1"><strong>İşlevi:</strong> {s.isten}</p>
                <p className="text-xs text-gray-600 mb-2"><strong>Duygular:</strong> {s.duygular}</p>
                <div className="text-[10px] text-gray-500 border-t border-black/10 pt-2 leading-relaxed italic">{s.sorun}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
            <p className="text-sm font-semibold text-purple-800 mb-2">🔑 Klinik önem</p>
            <p className="text-sm text-purple-700 leading-relaxed">
              Şefkat çalışması, <strong>sakinleştirici sistemi aktive ederek tehdit sisteminin etkisini azaltır</strong>.
              Bu nörobiyolojik bir süreçtir — "kendini topla" ya da "pozitif düşün" söylemi değil.
              Terapistin sıcaklığı da sakinleştirici sistemi aktive eder; bu yüzden terapötik ilişki CFT'de merkezdir.
            </p>
          </div>
        </section>

        {/* ── 3. Hexagondaki 6 boyutun teorik temeli ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">3</span>
            <h3 className="text-lg font-bold text-gray-800">Pratikteki 6 Boyutun Teorik Temeli</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Egzersizin hexagonal yapısındaki 6 düğüm, Neff ve Gilbert modellerinin örtüştüğü pratik kapılarıdır. Her biri farklı bir blokajı hedefler.
          </p>
          <div className="space-y-2">
            {[
              { emoji: '👁', isim: 'Farkındalık',      teori: 'Neff Bileşen 1',   aciklama: 'Acıyı ne bastır ne dramatize et. Gözlemle, yargılama.' },
              { emoji: '🤝', isim: 'Ortak İnsanlık',   teori: 'Neff Bileşen 2',   aciklama: 'İzolasyonu kır. Aynı acıyı hisseden milyonlarca insan var.' },
              { emoji: '💌', isim: 'Öz-Nezaket',       teori: 'Neff Bileşen 3',   aciklama: 'Sert yargı yerine arkadaşa davranır gibi — yumuşak, anlayışlı.' },
              { emoji: '🌿', isim: 'Güvenli Yer',      teori: 'CFT Sakinleştirici Sistem', aciklama: 'Oksitosin aktivasyonu. İçsel güvenli alanı bulmak vagal tonu artırır.' },
              { emoji: '🗣', isim: 'Şefkat Sesi',      teori: 'CFT İç Ses Çalışması', aciklama: 'Özeleştirici iç sesi şefkatli bir sese dönüştürmek — Tehdit → Sakinleştirici.' },
              { emoji: '✨', isim: 'Şefkat Gönder/Al', teori: 'Tonglen / Loving-Kindness', aciklama: 'Şefkati alma kapasitesini geliştirmek — "vermeyi hak ediyorum" inancını test etmek.' },
            ].map(b => (
              <div key={b.isim} className="flex gap-3 items-start bg-white/60 rounded-xl border border-rose-100 px-4 py-3">
                <span className="text-xl flex-shrink-0">{b.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">{b.isim}</span>
                    <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">{b.teori}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{b.aciklama}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. Yaygın mitler ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">4</span>
            <h3 className="text-lg font-bold text-gray-800">Yaygın Yanlış Anlamalar</h3>
          </div>
          <p className="text-sm text-gray-600">Danışanlar ve zaman zaman klinisyenler bu inanışlarla karşınıza çıkabilir:</p>
          <div className="space-y-2">
            {[
              {
                mit: '"Öz-şefkat narsisizme yol açar."',
                gercek: 'Araştırmalar tam tersini gösteriyor. Öz-şefkat yüksek kişiler daha az öz-odaklı, daha sosyal bağlantılı ve daha empati kapasiteli.',
              },
              {
                mit: '"Kendimi acıyıp durmak doğru değil."',
                gercek: 'Öz-şefkat acıya batmak değil — acıyı dengeli bir farkındalıkla görmek ve yargılamadan karşılamak. Aksine ruminasyonu kırır.',
              },
              {
                mit: '"Acı çekmeyi durdurmak için kendimi zorlamalıyım."',
                gercek: 'Öz-eleştiri kısa vadede motivasyonu tetikleyebilir ama uzun vadede tehdit sistemini kronikleştirir. Şefkat motivasyonu kırmaz, sürdürür.',
              },
              {
                mit: '"Bu sadece pozitif düşünmek."',
                gercek: 'Tam karşıtı. Öz-şefkat acıyı inkâr etmez — tam olarak görür ve onunla kalır. Sahte iyimserlik değil, radikal kabuldür.',
              },
              {
                mit: '"Şefkat görmesini hak etmiyorum."',
                gercek: 'Bu CFT\'nin doğrudan hedeflediği inanç. Terapist sıcaklığı bu inancı yeniden işleyen birincil mekanizmadır.',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setAcikMit(acikMit === i ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left bg-red-50/60 hover:bg-red-50 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 italic flex-1">{item.mit}</span>
                  <span className="text-xs text-gray-400">{acikMit === i ? '▲' : '▼'}</span>
                </button>
                {acikMit === i && (
                  <div className="px-4 py-3 bg-green-50 border-t border-green-100">
                    <div className="flex gap-2">
                      <Zap className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-800 leading-relaxed">{item.gercek}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. Terapiste protokol ipuçları ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">5</span>
            <h3 className="text-lg font-bold text-gray-800">Terapiste Protokol İpuçları</h3>
          </div>
          <div className="space-y-3">
            {[
              {
                baslik: 'Şefkat çalışmasını ne zaman başlatmalı?',
                icerik: 'Danışanla güvenli bir terapötik ittifak kurulduktan sonra. Yüksek utanç veya öz-eleştiri varlığında erken müdahale faydalıdır. Aktif travma işlemi sırasında değil — önce stabilizasyon.',
              },
              {
                baslik: '"Compassion phobia" — şefkate direnç',
                icerik: 'Bazı danışanlar şefkat egzersizlerinde ani ağlama veya bunalma yaşar. Bu "sakinleştirici sistem açılıyor" işaretidir. "Bu güvenli" psychoeducation ile normalize edin. Egzersizin dozunu ayarlayın — kısa ve düşük yoğunluklu başlayın.',
              },
              {
                baslik: 'ACT ile entegrasyon',
                icerik: 'Öz-şefkat, psikolojik esnekliğin "bağlamsal benlik" ve "kabul" süreçlerini güçlendirir. Defüzyon + öz-şefkat kombinasyonu, özellikle özeleştirici otomatik düşünceler için güçlüdür.',
              },
              {
                baslik: 'Fotoğraf seçimi klinik dikkat',
                icerik: 'Çocukluk fotoğrafı güçlü bir nesne ilişkileri köprüsü kurar. Ancak travma geçmişi olan danışanlarda tetikleyici olabilir. Evcil hayvan ya da nötr sevgi figürü daha güvenli alternatifler.',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl bg-teal-50 border border-teal-200 p-4">
                <p className="text-sm font-semibold text-teal-800 mb-1">▸ {item.baslik}</p>
                <p className="text-sm text-teal-700 leading-relaxed">{item.icerik}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Kaynakça ── */}
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5" /> Temel Kaynaklar
          </p>
          <ul className="space-y-1">
            {[
              'Neff, K.D. (2003). Self-Compassion: An Alternative Conceptualization. Self and Identity, 2(2), 85–101.',
              'Gilbert, P. (2009). The Compassionate Mind. London: Constable.',
              'Gilbert, P. & Procter, S. (2006). Compassionate Mind Training for People with High Shame. Clinical Psychology & Psychotherapy, 13, 353–379.',
              'Germer, C.K. & Neff, K.D. (2013). Self-Compassion in Clinical Practice. Journal of Clinical Psychology, 69(8), 856–867.',
            ].map((k, i) => (
              <li key={i} className="text-[11px] text-gray-500 leading-relaxed">· {k}</li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
type SefkatMode = 'pratik' | 'teori';

export default function SefkatCalismasi() {
  const [mode, setMode]         = useState<SefkatMode>('pratik');
  const [phase, setPhase]       = useState<SefkatPhase>('intro');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [doneNotes, setDoneNotes] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const restart = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setDoneNotes([]);
    setPhase('intro');
  };

  // ── Teori modu ──
  if (mode === 'teori') {
    return (
      <div className="flex flex-col h-full">
        {/* Tab bar */}
        <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-rose-200/60 bg-white/50 backdrop-blur-sm">
          {(['pratik', 'teori'] as SefkatMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 border-b-rose-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}>
              {m === 'pratik' ? <><Heart className="w-3.5 h-3.5" /> Pratik</> : <><BookOpen className="w-3.5 h-3.5" /> Teori</>}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto">
          <SefkatTeoriPaneli />
        </div>
      </div>
    );
  }

  // ── Pratik modu ──
  // ── Intro ──
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-purple-50 flex flex-col">
        {/* Tab bar */}
        <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-rose-200/60 bg-white/50 backdrop-blur-sm flex-shrink-0">
          {(['pratik', 'teori'] as SefkatMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 border-b-rose-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}>
              {m === 'pratik' ? <><Heart className="w-3.5 h-3.5" /> Pratik</> : <><BookOpen className="w-3.5 h-3.5" /> Teori</>}
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center space-y-6">
          {/* Icon */}
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-lg shadow-rose-100 flex items-center justify-center text-4xl border border-rose-100">
              🤍
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Şefkat Çalışması</h1>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              Öz-şefkat, kendinize bir yabancı gibi değil — sevdiğiniz birine bakıyormuş gibi bakmaktır.
            </p>
          </div>
          {/* Explanation cards */}
          <div className="grid sm:grid-cols-3 gap-3 text-left">
            {[
              { emoji: '🧠', title: 'Farkındalık', desc: 'Acıyı reddetmeden, dramatize etmeden fark etmek' },
              { emoji: '🌍', title: 'Ortak İnsanlık', desc: 'Bu hisler sadece sana özgü değil — hepimiz bu yoldan geçeriz' },
              { emoji: '💌', title: 'Öz-Nezaket', desc: 'Kendine bir arkadaşına göstereceğin anlayışı göstermek' },
            ].map(c => (
              <div key={c.title} className="bg-white/80 rounded-2xl p-4 border border-rose-100 shadow-sm">
                <div className="text-2xl mb-1">{c.emoji}</div>
                <div className="text-sm font-semibold text-gray-800">{c.title}</div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 text-sm text-amber-800 text-left leading-relaxed">
            <strong>Bir sonraki adımda</strong> size bir fotoğraf yüklemenizi önereceğiz.
            Çocukluk fotoğrafınız, evcil hayvanınızın fotoğrafı veya kayıtsız şartsız sevgi hissettiğiniz biri…
            Bu fotoğraf yalnızca cihazınızda kalır, hiçbir yere gönderilmez.
          </div>
          <button
            onClick={() => setPhase('upload')}
            className="mx-auto flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-10 py-4 rounded-2xl font-bold text-base shadow-lg shadow-rose-200 transition-all active:scale-95">
            <Heart size={18} /> Başlayalım
          </button>
        </div>
        </div>
      </div>
    );
  }

  // ── Upload ──
  if (phase === 'upload') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-purple-50 flex flex-col items-center justify-center px-4 py-12 gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Bir fotoğraf seçin</h2>
          <p className="text-gray-500 mt-2 text-sm">Çocukluğunuzdan, evcil hayvanınızdan veya kayıtsız şartsız sevdiğiniz biri</p>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="w-full max-w-md border-2 border-dashed border-rose-200 rounded-3xl p-10 flex flex-col items-center gap-4 cursor-pointer bg-white/60 hover:bg-white/80 hover:border-rose-400 transition-all text-center"
        >
          {photoUrl ? (
            <div className="relative">
              <img src={photoUrl} alt="Seçilen fotoğraf"
                className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-lg shadow-rose-100" />
              <button
                onClick={e => { e.stopPropagation(); setPhotoUrl(null); }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-400">
                <X size={12} />
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center">
                <ImagePlus size={28} className="text-rose-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Fotoğraf yükle</p>
                <p className="text-xs text-gray-400 mt-0.5">veya sürükle & bırak</p>
              </div>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>

        <p className="text-xs text-gray-400 text-center max-w-xs leading-relaxed">
          🔒 Fotoğrafınız yalnızca bu ekranda gösterilir. Hiçbir sunucuya yüklenmez.
        </p>

        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => setPhase('breathing')}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg shadow-rose-100 transition-all active:scale-95">
            {photoUrl ? <><Heart size={16}/> Devam</> : <><ChevronRight size={16}/> Fotoğrafsız Devam</>}
          </button>
        </div>
      </div>
    );
  }

  // ── Breathing ──
  if (phase === 'breathing') {
    return <BreathingScreen onReady={() => setPhase('practice')} />;
  }

  // ── Practice ──
  if (phase === 'practice') {
    return (
      <PracticeScreen
        photoUrl={photoUrl}
        onDone={notes => { setDoneNotes(notes); setPhase('done'); }}
      />
    );
  }

  // ── Done ──
  return <DoneScreen notes={doneNotes} photoUrl={photoUrl} onRestart={restart} />;
}
