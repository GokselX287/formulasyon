'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowRight, Link, Zap, Brain, Heart, Compass, Target, Eye, Clock } from 'lucide-react';
import { Badge }                               from '@/components/ui/badge';
import { Button }                              from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────

type Patient = { adSoyad: string; yas?: string; patientType?: 'cocuk' | 'yetiskin' };
type Formulation = {
  actSimdi?: string;   actDefuzyon?: string;  actKabul?: string;
  actDegerler?: string; actEylem?: string;    actBaglam?: string;
  otomatikDusunceler?: string; duyguBedensel?: string;
};
type Seans = { id: string; tarih: string; konu?: string; notlar?: string };

// ─── Branch definitions ───────────────────────────────────────────────────────

const BRANCH_DEFS = [
  {
    id: 1,
    key: 'simdi',
    title: 'Şimdiki An',
    subtitle: 'Bağlantı',
    Icon: Clock,
    color: '#00CCFF',
    actKey: 'actSimdi' as keyof Formulation,
    examples: ['Toplantı öncesi kaygı', 'Geçmiş düşünceler', '"Ya olmadı?" endişesi', 'Ruminasyon döngüsü'],
    relatedIds: [2, 6],
  },
  {
    id: 2,
    key: 'defuzyon',
    title: 'Bilişsel Ayrışma',
    subtitle: 'Otomatik Düşünceler',
    Icon: Brain,
    color: '#AA55FF',
    actKey: 'actDefuzyon' as keyof Formulation,
    fallbackKey: 'otomatikDusunceler' as keyof Formulation,
    examples: ['"Ben yetersizim"', '"Kimse sevmiyor"', '"Başaramayacağım"', '"Hep böyle olur"'],
    relatedIds: [1, 3],
  },
  {
    id: 3,
    key: 'kabul',
    title: 'Kabul',
    subtitle: 'Duygu & Beden',
    Icon: Heart,
    color: '#FF4488',
    actKey: 'actKabul' as keyof Formulation,
    fallbackKey: 'duyguBedensel' as keyof Formulation,
    examples: ['Göğüs sıkışması', 'Yoğun kaygı (7/10)', 'Boğazda düğüm', 'Kalp çarpıntısı'],
    relatedIds: [2, 4],
  },
  {
    id: 4,
    key: 'degerler',
    title: 'Değerler',
    subtitle: 'Yaşam Yönleri',
    Icon: Compass,
    color: '#FFB344',
    actKey: 'actDegerler' as keyof Formulation,
    examples: ['Aile ve yakın ilişkiler', 'Mesleki büyüme', 'Dürüstlük', 'Sağlıklı yaşam'],
    relatedIds: [3, 5],
  },
  {
    id: 5,
    key: 'eylem',
    title: 'Adanmış Eylem',
    subtitle: 'Değer Yönlü Adımlar',
    Icon: Target,
    color: '#44AAFF',
    actKey: 'actEylem' as keyof Formulation,
    examples: ['Haftada 3 egzersiz', 'Günlük 10 dk nefes', 'Haftalık aile yemeği', 'Değer günlüğü'],
    relatedIds: [4, 6],
  },
  {
    id: 6,
    key: 'baglam',
    title: 'Bağlamsal Benlik',
    subtitle: 'Gözlemleyen Benlik',
    Icon: Eye,
    color: '#8866DD',
    actKey: 'actBaglam' as keyof Formulation,
    examples: ['"Endişeli ebeveyn" rolü', 'Savunmacı tepkiler', 'Kaçınmacı kalıp', 'Eleştirici iç ses'],
    relatedIds: [5, 1],
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseItems(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(/[,;\n•·]+/).map(s => s.trim()).filter(s => s.length > 1);
}

function getStatus(items: string[]): 'completed' | 'in-progress' | 'pending' {
  if (items.length >= 3) return 'completed';
  if (items.length >= 1) return 'in-progress';
  return 'pending';
}

function getEnergy(items: string[], max = 4): number {
  return Math.min(100, Math.round((items.length / max) * 100));
}

// ─── Status label helper ──────────────────────────────────────────────────────

function statusLabel(status: 'completed' | 'in-progress' | 'pending'): string {
  if (status === 'completed')  return 'VERİ VAR';
  if (status === 'in-progress') return 'GELİŞİYOR';
  return 'ÖRNEK';
}

function statusStyle(status: 'completed' | 'in-progress' | 'pending'): string {
  if (status === 'completed')   return 'text-white  bg-black       border-white';
  if (status === 'in-progress') return 'text-black  bg-white       border-black';
  return 'text-white bg-black/40 border-white/50';
}

// ─── Center Hexagon ───────────────────────────────────────────────────────────

function CenterHex({ patientName, totalReal, totalAll }: {
  patientName: string;
  totalReal: number;
  totalAll: number;
}) {
  const pct = Math.round((totalReal / Math.max(totalAll, 1)) * 100);
  return (
    <div className="absolute w-20 h-20 flex items-center justify-center z-10"
         style={{ filter: 'drop-shadow(0 0 18px rgba(140,80,255,0.55))' }}>
      {/* Animated ping rings */}
      <div className="absolute w-24 h-24 rounded-full border border-white/20 animate-ping opacity-60" />
      <div className="absolute w-28 h-28 rounded-full border border-white/10 animate-ping opacity-40"
           style={{ animationDelay: '0.7s' }} />
      {/* Hexagon SVG */}
      <svg width="76" height="76" viewBox="0 0 76 76" className="absolute">
        <defs>
          <linearGradient id="hex-center-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#7C3AED" />
            <stop offset="50%"  stopColor="#2563EB" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>
        {/* Pointy-top hexagon */}
        <polygon
          points="38,4 69,21 69,55 38,72 7,55 7,21"
          fill="url(#hex-center-g)"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.2"
        />
      </svg>
      {/* Labels */}
      <div className="relative z-10 text-center pointer-events-none">
        <p className="text-[10px] font-black tracking-[0.18em] text-white leading-none"
           style={{ textShadow: '0 0 10px rgba(180,140,255,0.9)' }}>ACT</p>
        <p className="text-[7px] font-medium text-white/70 mt-0.5 leading-none max-w-[54px] truncate">
          {patientName}
        </p>
        <p className="text-[8px] font-bold text-white/50 mt-1 leading-none">%{pct}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = { patient: Patient; formulation?: Formulation | null; seanslar?: Seans[] };

export default function DanisanMindMap({ patient, formulation, seanslar = [] }: Props) {
  const [expanded,    setExpanded]    = useState<Record<number, boolean>>({});
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [activeId,    setActiveId]    = useState<number | null>(null);
  const [rotation,    setRotation]    = useState(0);
  const [autoRotate,  setAutoRotate]  = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef     = useRef<HTMLDivElement>(null);
  const nodeRefs     = useRef<Record<number, HTMLDivElement | null>>({});

  // Build items from formulation data
  const items = useMemo(() => BRANCH_DEFS.map(b => {
    const raw = formulation
      ? ((b as { fallbackKey?: keyof Formulation }).fallbackKey && !formulation[b.actKey]
          ? formulation[(b as { fallbackKey?: keyof Formulation }).fallbackKey!]
          : formulation[b.actKey])
      : undefined;
    const realItems = parseItems(raw as string | undefined);
    const isExample = realItems.length === 0;
    const displayItems = isExample ? b.examples.slice(0, 4) : realItems.slice(0, 6);
    return {
      id:          b.id,
      title:       b.title,
      subtitle:    b.subtitle,
      Icon:        b.Icon,
      color:       b.color,
      relatedIds:  b.relatedIds as unknown as number[],
      items:       displayItems,
      isExample,
      status:      isExample ? ('pending' as const) : getStatus(realItems),
      energy:      isExample ? 0 : getEnergy(realItems),
      realCount:   realItems.length,
    };
  }), [formulation]);

  const totalReal = useMemo(() =>
    items.reduce((a, b) => a + (b.isExample ? 0 : b.items.length), 0), [items]);
  const totalAll  = useMemo(() => items.reduce((a, b) => a + b.items.length, 0), [items]);

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate) return;
    const id = setInterval(() => setRotation(r => (r + 0.3) % 360), 50);
    return () => clearInterval(id);
  }, [autoRotate]);

  const toggleItem = (id: number) => {
    setExpanded(prev => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).forEach(k => { next[+k] = false; });
      const opening = !prev[id];
      next[id] = opening;
      if (opening) {
        setActiveId(id);
        setAutoRotate(false);
        const item = items.find(i => i.id === id);
        const pulse: Record<number, boolean> = {};
        item?.relatedIds.forEach(rid => { pulse[rid] = true; });
        setPulseEffect(pulse);
        // Center on node
        const idx = items.findIndex(i => i.id === id);
        const target = (idx / items.length) * 360;
        setRotation(270 - target);
      } else {
        setActiveId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }
      return next;
    });
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpanded({});
      setActiveId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const calcPos = (index: number) => {
    const angle = ((index / items.length) * 360 + rotation) % 360;
    const rad   = (angle * Math.PI) / 180;
    const r     = 195;
    return {
      x:       r * Math.cos(rad),
      y:       r * Math.sin(rad),
      zIndex:  Math.round(100 + 50 * Math.cos(rad)),
      opacity: Math.max(0.35, Math.min(1, 0.35 + 0.65 * ((1 + Math.sin(rad)) / 2))),
    };
  };

  return (
    <div className="space-y-3">
      {/* Header strip */}
      <div className="card p-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#0E0F12]">
            ⬡ ACT Hexaflex Mind Map
            <span className="font-normal text-gray-400 ml-2">— {patient.adSoyad}</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            <span className="text-indigo-500 font-medium">{totalReal} gerçek kayıt</span>
            {' · '}{totalAll - totalReal} örnek · düğüme tıkla veya boşluğa tıklayarak kapat
          </p>
        </div>
        {seanslar.length > 0 && (
          <span className="text-xs text-gray-400">{seanslar.length} seans</span>
        )}
      </div>

      {/* Orbital canvas */}
      <div
        ref={containerRef}
        onClick={handleBackgroundClick}
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ height: '580px', background: '#000000', cursor: 'default' }}
      >
        <div
          ref={orbitRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: '1000px' }}
        >
          {/* Center hexagon */}
          <CenterHex
            patientName={patient.adSoyad}
            totalReal={totalReal}
            totalAll={totalAll}
          />

          {/* Orbit ring */}
          <div className="absolute w-[390px] h-[390px] rounded-full"
               style={{ border: '1px solid rgba(255,255,255,0.08)' }} />

          {/* Orbital nodes */}
          {items.map((item, index) => {
            const pos        = calcPos(index);
            const isOpen     = !!expanded[item.id];
            const isRelated  = activeId !== null &&
              items.find(i => i.id === activeId)?.relatedIds.includes(item.id);
            const isPulsing  = !!pulseEffect[item.id];
            const { Icon }   = item;

            return (
              <div
                key={item.id}
                ref={el => { nodeRefs.current[item.id] = el; }}
                className="absolute transition-all duration-700 cursor-pointer select-none"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  zIndex:    isOpen ? 200 : pos.zIndex,
                  opacity:   isOpen ? 1 : pos.opacity,
                }}
                onClick={e => { e.stopPropagation(); toggleItem(item.id); }}
              >
                {/* Energy aura */}
                <div
                  className={`absolute rounded-full ${isPulsing ? 'animate-pulse' : ''}`}
                  style={{
                    background: `radial-gradient(circle, ${item.color}33 0%, transparent 70%)`,
                    width:  `${item.energy * 0.4 + 44}px`,
                    height: `${item.energy * 0.4 + 44}px`,
                    left:   `-${(item.energy * 0.4 + 44 - 40) / 2}px`,
                    top:    `-${(item.energy * 0.4 + 44 - 40) / 2}px`,
                  }}
                />

                {/* Node button */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    border-2 transition-all duration-300
                    ${isOpen
                      ? 'bg-white text-black border-white scale-150 shadow-lg'
                      : isRelated
                      ? 'bg-white/40 text-white border-white animate-pulse'
                      : 'bg-black text-white border-white/40'}
                  `}
                  style={isOpen ? { boxShadow: `0 0 18px ${item.color}88` } : {}}
                >
                  <Icon size={16} />
                </div>

                {/* Label under node */}
                <div
                  className={`absolute whitespace-nowrap text-[10px] font-semibold
                    tracking-wide text-center transition-all duration-300
                    ${isOpen ? 'text-white scale-110' : 'text-white/65'}`}
                  style={{ top: '44px', left: '50%', transform: isOpen ? 'translateX(-50%) scale(1.1)' : 'translateX(-50%)' }}
                >
                  {item.title}
                </div>

                {/* Expanded card */}
                {isOpen && (
                  <Card
                    className="absolute w-64 bg-black/92 border-white/25 shadow-xl overflow-visible"
                    style={{
                      top:    '64px',
                      left:   '50%',
                      transform: 'translateX(-50%)',
                      backdropFilter: 'blur(18px)',
                      boxShadow: `0 0 30px ${item.color}22, 0 8px 32px rgba(0,0,0,0.6)`,
                      border: `1px solid ${item.color}35`,
                    }}
                  >
                    {/* Connector line */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-white/40" />

                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex justify-between items-center gap-2">
                        <Badge className={`px-2 text-[9px] ${statusStyle(item.status)}`}>
                          {statusLabel(item.status)}
                        </Badge>
                        <span
                          className="text-[9px] font-mono shrink-0"
                          style={{ color: item.color }}
                        >
                          {item.realCount} kayıt
                        </span>
                      </div>
                      <CardTitle className="text-xs text-white mt-2 font-bold">
                        {item.title}
                      </CardTitle>
                      <p className="text-[10px] text-white/50 mt-0.5">{item.subtitle}</p>
                    </CardHeader>

                    <CardContent className="px-4 pb-4 pt-0">
                      {/* Items list */}
                      <div className="space-y-1 mb-3">
                        {item.items.map((txt, i) => (
                          <div key={i}
                            className="text-[10px] text-white/75 pl-2 border-l"
                            style={{ borderColor: item.isExample ? 'rgba(255,255,255,0.15)' : item.color + '66',
                                     fontStyle: item.isExample ? 'italic' : 'normal' }}>
                            {txt}
                          </div>
                        ))}
                        {item.isExample && (
                          <p className="text-[9px] text-white/30 italic mt-1">
                            Örnek veri — Formülasyon sekmesinden ekle
                          </p>
                        )}
                      </div>

                      {/* Energy bar */}
                      <div className="mt-3 pt-2 border-t border-white/10">
                        <div className="flex justify-between items-center text-[10px] mb-1">
                          <span className="flex items-center gap-1 text-white/50">
                            <Zap size={9} /> Doluluk
                          </span>
                          <span className="font-mono text-white/50">{item.energy}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${item.energy}%`,
                              background: `linear-gradient(90deg, ${item.color}88, ${item.color})`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Related nodes */}
                      {item.relatedIds.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-white/10">
                          <div className="flex items-center gap-1 mb-2">
                            <Link size={9} className="text-white/40" />
                            <span className="text-[9px] text-white/40 uppercase tracking-wider font-medium">
                              Bağlantılı Alanlar
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map(rid => {
                              const rel = items.find(i => i.id === rid);
                              if (!rel) return null;
                              return (
                                <Button
                                  key={rid}
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 py-0 text-[9px] rounded-none border-white/20 bg-transparent hover:bg-white/10 text-white/70 hover:text-white"
                                  onClick={e => { e.stopPropagation(); toggleItem(rid); }}
                                >
                                  {rel.title}
                                  <ArrowRight size={7} className="ml-1 text-white/50" />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend strip */}
      <div className="card p-3">
        <div className="flex flex-wrap gap-2 items-center">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="flex items-center gap-1.5 text-xs rounded-xl px-3 py-1.5 font-semibold transition"
              style={{
                background: expanded[item.id] ? item.color : '#F4F5F8',
                color:      expanded[item.id] ? 'white' : item.realCount > 0 ? item.color : '#9CA3AF',
                border:     `1px solid ${expanded[item.id] ? item.color : 'transparent'}`,
              }}
            >
              <item.Icon size={11} />
              {item.title}
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  background: item.realCount > 0
                    ? (expanded[item.id] ? 'rgba(255,255,255,0.25)' : item.color)
                    : '#E2E8F0',
                  color: item.realCount > 0 ? 'white' : '#94A3B8',
                }}
              >
                {item.realCount}
              </span>
            </button>
          ))}
          <span className="ml-auto text-[10px] text-gray-400">boşluğa tıkla → kapat</span>
        </div>
      </div>
    </div>
  );
}
