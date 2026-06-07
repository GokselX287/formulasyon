'use client';
import { useState, useCallback } from 'react';
import { AlertTriangle, Target, Shield, Zap, Brain, Heart, Activity, ChevronRight, Plus } from 'lucide-react';
import { BdtModelDisplay } from './ModelOlustur';

// ─── Canonical data model ─────────────────────────────────────────────────────

export type CaseData = {
  client: {
    id: string;
    functionalityScore: number; // 0-10
    sessionPlan: number;
    primaryFramework: string;
    referralMotivation: string;
  };
  chiefComplaints: Array<{ complaint: string; clinicalNote: string }>;
  fourP: {
    predisposing: string[];
    precipitating: string[];
    perpetuating: string[];
    protective: string[];
  };
  longitudinal: {
    earlyExperiences: string[];
    coreBeliefs: string[];
    intermediateBeliefs: string[];
    copingStrategies: string[];
  };
  situational: {
    trigger: string;
    automaticThoughts: string[];
    emotions: string[];
    bodily: string[];
    emotionIntensity: number; // 0-100
    safetyBehaviors: string[];
    targetBehaviors: string[];
  };
  intervention: {
    smartGoals: Array<{ specific: string; measurable: string; timeframeSessions: number }>;
    adherence: string;
    barriers: string[];
  };
};

// ─── Validation ───────────────────────────────────────────────────────────────

type ValidationResult = { field: string; issue: string }[];

function validateCase(d: CaseData): ValidationResult {
  const issues: ValidationResult = [];
  const check = (val: unknown, field: string) => {
    const empty =
      val === null || val === undefined || val === '' ||
      (Array.isArray(val) && val.length === 0);
    if (empty) issues.push({ field, issue: 'Boş' });
  };
  check(d.client.referralMotivation, 'client.referralMotivation');
  check(d.client.functionalityScore, 'client.functionalityScore');
  check(d.client.sessionPlan, 'client.sessionPlan');
  check(d.chiefComplaints, 'chiefComplaints');
  check(d.fourP.predisposing, 'fourP.predisposing');
  check(d.fourP.precipitating, 'fourP.precipitating');
  check(d.fourP.perpetuating, 'fourP.perpetuating');
  check(d.fourP.protective, 'fourP.protective');
  check(d.longitudinal.earlyExperiences, 'longitudinal.earlyExperiences');
  check(d.longitudinal.coreBeliefs, 'longitudinal.coreBeliefs');
  check(d.longitudinal.intermediateBeliefs, 'longitudinal.intermediateBeliefs');
  check(d.longitudinal.copingStrategies, 'longitudinal.copingStrategies');
  check(d.situational.trigger, 'situational.trigger');
  check(d.situational.automaticThoughts, 'situational.automaticThoughts');
  check(d.situational.emotions, 'situational.emotions');
  check(d.situational.bodily, 'situational.bodily');
  check(d.situational.emotionIntensity, 'situational.emotionIntensity');
  check(d.situational.safetyBehaviors, 'situational.safetyBehaviors');
  check(d.situational.targetBehaviors, 'situational.targetBehaviors');
  check(d.intervention.smartGoals, 'intervention.smartGoals');
  check(d.intervention.adherence, 'intervention.adherence');
  check(d.intervention.barriers, 'intervention.barriers');
  return issues;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Pill({ text, red }: { text: string; red?: boolean }) {
  return (
    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full border ${
      red
        ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300'
        : 'bg-[#F4F5F8] border-gray-200 text-[#0E0F12] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
    }`}>
      {text}
    </span>
  );
}

function PillList({ items, red }: { items: string[]; red?: boolean }) {
  if (!items || items.length === 0) return <span className="text-[11px] text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((it, i) => <Pill key={i} text={it} red={red} />)}
    </div>
  );
}

function SectionCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 ${className}`}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-semibold mb-3">{title}</p>
      {children}
    </div>
  );
}

// ─── View 1: Hub Özet ─────────────────────────────────────────────────────────

function HubOzet({ d }: { d: CaseData }) {
  const cards = [
    {
      icon: <Brain className="w-4 h-4" />, label: 'Ana şikayetler',
      content: d.chiefComplaints.length > 0
        ? d.chiefComplaints.map(c => c.complaint).join(' · ')
        : '—',
    },
    {
      icon: <Activity className="w-4 h-4" />, label: 'Hazırlayıcı',
      content: d.fourP.predisposing.length > 0 ? d.fourP.predisposing.join(', ') : '—',
    },
    {
      icon: <Zap className="w-4 h-4" />, label: 'Tetikleyici',
      content: d.fourP.precipitating.length > 0 ? d.fourP.precipitating.join(', ') : '—',
    },
    {
      icon: <AlertTriangle className="w-4 h-4" />, label: 'Sürdürücü',
      content: d.fourP.perpetuating.length > 0 ? d.fourP.perpetuating.join(', ') : '—',
    },
    {
      icon: <Shield className="w-4 h-4" />, label: 'Koruyucu',
      content: d.fourP.protective.length > 0 ? d.fourP.protective.join(', ') : '—',
    },
    {
      icon: <Target className="w-4 h-4" />, label: 'Hedef',
      content: d.intervention.smartGoals.length > 0
        ? d.intervention.smartGoals.map(g => g.specific).join(' · ')
        : '—',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Yönlendirme & Motivasyon</p>
            <p className="text-sm text-[#0E0F12] dark:text-gray-100 mt-1 leading-relaxed">
              {d.client.referralMotivation || '—'}
            </p>
          </div>
          <div className="flex gap-6 ml-auto flex-shrink-0">
            <div className="text-center">
              <p className="text-2xl font-semibold text-[#0E0F12] dark:text-white">{d.client.functionalityScore}<span className="text-sm text-gray-400">/10</span></p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">İşlevsellik</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-[#0E0F12] dark:text-white">{d.client.sessionPlan}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Seans Planı</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#0E0F12] dark:text-white">{d.client.primaryFramework}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Çerçeve</p>
            </div>
          </div>
        </div>
      </div>

      {/* 6-card radial grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-400">{c.icon}</span>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{c.label}</p>
            </div>
            <p className="text-xs text-[#0E0F12] dark:text-gray-200 leading-relaxed line-clamp-3">{c.content}</p>
          </div>
        ))}
      </div>

      {/* Chief complaints detail */}
      <SectionCard title="Şikayetler (klinik yorum)">
        {d.chiefComplaints.length === 0
          ? <span className="text-xs text-gray-400">—</span>
          : (
            <div className="space-y-2">
              {d.chiefComplaints.map((c, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="font-medium text-[#0E0F12] dark:text-gray-100 min-w-[130px]">{c.complaint || '—'}</span>
                  <span className="text-gray-500 dark:text-gray-400">{c.clinicalNote || '—'}</span>
                </div>
              ))}
            </div>
          )}
      </SectionCard>
    </div>
  );
}

// ─── View 2: Boylamsal Formülasyon (Piramit) ──────────────────────────────────

function BoyumsalFormulasyon({ d }: { d: CaseData }) {
  const layers = [
    {
      label: 'Başa çıkma stratejileri',
      sublabel: '(uyumsuz — üst, kırmızı)',
      items: d.longitudinal.copingStrategies,
      red: true,
      width: 'w-full',
    },
    {
      label: 'Ara inançlar / koşullu kurallar',
      sublabel: '',
      items: d.longitudinal.intermediateBeliefs,
      red: false,
      width: 'w-[92%]',
    },
    {
      label: 'Temel inançlar / şemalar',
      sublabel: '',
      items: d.longitudinal.coreBeliefs,
      red: false,
      width: 'w-[80%]',
    },
    {
      label: 'Erken yaşantılar',
      sublabel: '(zemin — hazırlayıcı)',
      items: d.longitudinal.earlyExperiences,
      red: false,
      width: 'w-[68%]',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex text-[10px] text-gray-400 uppercase tracking-widest justify-between px-4">
        <span>↑ besleme</span>
        <span>↓ filtreleme</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        {layers.map((layer, i) => (
          <div key={i} className={`${layer.width} transition-all`}>
            <div className={`rounded-2xl border p-4 ${
              layer.red
                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className={`text-[10px] uppercase tracking-widest font-semibold ${layer.red ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                    {layer.label}
                  </span>
                  {layer.sublabel && (
                    <span className="text-[10px] text-gray-400 ml-2">{layer.sublabel}</span>
                  )}
                </div>
                {layer.red && (
                  <span className="text-[10px] bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold">Kilit</span>
                )}
              </div>
              <PillList items={layer.items} red={layer.red} />
            </div>
          </div>
        ))}
      </div>

      {/* fourP side reference */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <SectionCard title="Precipitating (tetikleyici)">
          <PillList items={d.fourP.precipitating} />
        </SectionCard>
        <SectionCard title="Perpetuating (sürdürücü)">
          <PillList items={d.fourP.perpetuating} />
        </SectionCard>
      </div>
    </div>
  );
}

// ─── View 3: Durumsal Döngü (4D SVG) ─────────────────────────────────────────

function DurumsalDongu({ d, onAddSmartGoal }: { d: CaseData; onAddSmartGoal: () => void }) {
  const intensity = d.situational.emotionIntensity;

  // SVG positions for A B C D boxes in a diamond cycle
  // viewBox 600x500
  const cx = 300, cy = 240;
  const r = 130;
  const positions = {
    A: { x: cx,       y: cy - r,       label: 'A · Tetikleyici' },
    B: { x: cx + r,   y: cy,           label: 'B · Otomatik düşünce' },
    C: { x: cx,       y: cy + r,       label: 'C · Duygu + beden' },
    D: { x: cx - r,   y: cy,           label: 'D · Kilit davranış' },
  };

  const BOX_W = 130;
  const BOX_H = 56;
  const BOX_R = 12;

  type NodeKey = 'A' | 'B' | 'C' | 'D';
  const nodeKeys: NodeKey[] = ['A', 'B', 'C', 'D'];

  // Arrow helper: center of box edge
  const edge = (from: NodeKey, to: NodeKey) => {
    const f = positions[from];
    const t = positions[to];
    const dx = t.x - f.x, dy = t.y - f.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / dist, ny = dy / dist;
    const halfW = BOX_W / 2, halfH = BOX_H / 2;
    const sx = f.x + nx * Math.min(halfW, halfH + 2);
    const sy = f.y + ny * Math.min(halfH, halfW + 2);
    const ex = t.x - nx * Math.min(halfW, halfH + 2);
    const ey = t.y - ny * Math.min(halfH, halfW + 2);
    return { sx, sy, ex, ey };
  };

  const flows: [NodeKey, NodeKey][] = [['A', 'B'], ['B', 'C'], ['C', 'D']];
  // D→A loop arrow (bottom left → top)
  const loopArrow = edge('D', 'A');

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <svg viewBox="0 60 600 420" className="w-full" style={{ maxHeight: 420 }}>
          <defs>
            <marker id="arrow-dark" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#374151" />
            </marker>
            <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#dc2626" />
            </marker>
          </defs>

          {/* Flow arrows A→B, B→C, C→D */}
          {flows.map(([f, t]) => {
            const { sx, sy, ex, ey } = edge(f, t);
            return (
              <line key={`${f}${t}`} x1={sx} y1={sy} x2={ex} y2={ey}
                stroke="#9CA3AF" strokeWidth="1.5" markerEnd="url(#arrow-dark)" />
            );
          })}

          {/* D→A loop (closing cycle) */}
          {(() => {
            const { sx, sy, ex, ey } = edge('D', 'A');
            return (
              <line x1={sx} y1={sy} x2={ex} y2={ey}
                stroke="#9CA3AF" strokeWidth="1.5" markerEnd="url(#arrow-dark)" />
            );
          })()}

          {/* D→B dashed red arrow — çürütme blokajı */}
          {(() => {
            const { sx, sy, ex, ey } = edge('D', 'B');
            const mx = (sx + ex) / 2, my = (sy + ey) / 2 - 20;
            return (
              <>
                <path d={`M${sx},${sy} Q${mx},${my} ${ex},${ey}`}
                  fill="none" stroke="#dc2626" strokeWidth="1.5"
                  strokeDasharray="5 4" markerEnd="url(#arrow-red)" />
                <text x={mx} y={my - 6} textAnchor="middle"
                  fontSize="10" fill="#dc2626" fontWeight="500">
                  çürütme blokajı
                </text>
              </>
            );
          })()}

          {/* Node boxes */}
          {nodeKeys.map((key) => {
            const p = positions[key];
            const isD = key === 'D';
            const bx = p.x - BOX_W / 2, by = p.y - BOX_H / 2;
            return (
              <g key={key}>
                <rect x={bx} y={by} width={BOX_W} height={BOX_H} rx={BOX_R}
                  fill={isD ? '#fef2f2' : '#F8F9FA'}
                  stroke={isD ? '#dc2626' : '#E5E7EB'}
                  strokeWidth={isD ? 1.5 : 1}
                />
                <text x={p.x} y={by + 17} textAnchor="middle"
                  fontSize="9" fill={isD ? '#dc2626' : '#6B7280'} fontWeight="600" letterSpacing="0.08em">
                  {p.label}
                </text>
                {key === 'A' && (
                  <foreignObject x={bx + 6} y={by + 22} width={BOX_W - 12} height={BOX_H - 26}>
                    <div style={{ fontSize: 10, color: '#111827', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {d.situational.trigger || '—'}
                    </div>
                  </foreignObject>
                )}
                {key === 'B' && (
                  <foreignObject x={bx + 6} y={by + 22} width={BOX_W - 12} height={BOX_H - 26}>
                    <div style={{ fontSize: 10, color: '#111827', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {d.situational.automaticThoughts.length > 0 ? d.situational.automaticThoughts.join(' / ') : '—'}
                    </div>
                  </foreignObject>
                )}
                {key === 'C' && (
                  <foreignObject x={bx + 6} y={by + 22} width={BOX_W - 12} height={BOX_H - 26}>
                    <div style={{ fontSize: 10, color: '#111827', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {[...d.situational.emotions, ...d.situational.bodily].join(' · ') || '—'}
                    </div>
                  </foreignObject>
                )}
                {key === 'D' && (
                  <foreignObject x={bx + 6} y={by + 22} width={BOX_W - 12} height={BOX_H - 26}>
                    <div style={{ fontSize: 10, color: '#dc2626', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {d.situational.safetyBehaviors.length > 0 ? d.situational.safetyBehaviors.join(' · ') : '—'}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}

          {/* Intensity badge on C */}
          {(() => {
            const p = positions['C'];
            const bx = p.x - BOX_W / 2, by = p.y - BOX_H / 2;
            return (
              <g>
                <rect x={bx + BOX_W - 34} y={by - 14} width={34} height={16} rx={8}
                  fill="#0E0F12" />
                <text x={bx + BOX_W - 17} y={by - 3} textAnchor="middle"
                  fontSize="9" fill="white" fontWeight="600">
                  {intensity}%
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Detail panels */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="A · Tetikleyici">
          <p className="text-xs text-[#0E0F12] dark:text-gray-200">{d.situational.trigger || '—'}</p>
        </SectionCard>
        <SectionCard title={`C · Yoğunluk (${intensity}/100)`}>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-2">
            <div className="bg-[#0E0F12] dark:bg-white h-2 rounded-full" style={{ width: `${intensity}%` }} />
          </div>
          <PillList items={[...d.situational.emotions, ...d.situational.bodily]} />
        </SectionCard>
        <SectionCard title="B · Otomatik düşünceler">
          <PillList items={d.situational.automaticThoughts} />
        </SectionCard>
        <SectionCard title="D · Kilit davranışlar (güvenlik)" className="border-red-200 dark:border-red-800">
          <PillList items={d.situational.safetyBehaviors} red />
        </SectionCard>
      </div>

      {/* Kilit soru kutusu */}
      <button
        onClick={onAddSmartGoal}
        className="w-full text-left rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-4 hover:border-[#0E0F12] dark:hover:border-gray-400 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Kilit soru</p>
            <p className="text-sm font-medium text-[#0E0F12] dark:text-gray-100">
              "Bu davranış olmasaydı ne öğrenilirdi?"
            </p>
          </div>
          <div className="flex items-center gap-1 text-gray-400 group-hover:text-[#0E0F12] dark:group-hover:text-white transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-xs">SMART hedef ekle</span>
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── View 4: SMART Müdahale Haritası ─────────────────────────────────────────

function SmartMudahale({ d, onAddSmartGoal, newGoalOpen, onNewGoalClose, onNewGoalSave }: {
  d: CaseData;
  onAddSmartGoal: () => void;
  newGoalOpen: boolean;
  onNewGoalClose: () => void;
  onNewGoalSave: (g: { specific: string; measurable: string; timeframeSessions: number }) => void;
}) {
  const [draft, setDraft] = useState({ specific: '', measurable: '', timeframeSessions: 12 });

  const save = () => {
    if (!draft.specific.trim()) return;
    onNewGoalSave(draft);
    setDraft({ specific: '', measurable: '', timeframeSessions: 12 });
  };

  // Map targetBehaviors to goals by index (wrap-around)
  const targets = d.situational.targetBehaviors;

  return (
    <div className="space-y-4">
      {/* SMART Goal cards */}
      <div className="grid md:grid-cols-2 gap-3">
        {d.intervention.smartGoals.length === 0
          ? <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-400 col-span-2">—</div>
          : d.intervention.smartGoals.map((g, i) => {
            const related = targets.filter((_, ti) => ti % d.intervention.smartGoals.length === i);
            return (
              <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-[#0E0F12] dark:text-gray-100">{g.specific || '—'}</p>
                  <span className="text-[10px] bg-[#F4F5F8] dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                    {g.timeframeSessions} seans
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{g.measurable || '—'}</p>
                {related.length > 0 && (
                  <div className="flex flex-wrap gap-1 border-t border-gray-100 dark:border-gray-800 pt-2">
                    {related.map((tb, ti) => (
                      <span key={ti} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                        {tb}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Remaining targetBehaviors not assigned above */}
      {targets.length > 0 && (
        <SectionCard title="İstenen alternatif davranışlar">
          <PillList items={targets} />
        </SectionCard>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Adherence — green */}
        <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-4">
          <p className="text-[10px] uppercase tracking-widest text-green-600 dark:text-green-400 font-semibold mb-2">Uyum paneli</p>
          <p className="text-xs text-green-800 dark:text-green-200">{d.intervention.adherence || '—'}</p>
        </div>
        {/* Barriers — yellow */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4">
          <p className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-semibold mb-2">Bariyer paneli</p>
          {d.intervention.barriers.length === 0
            ? <span className="text-xs text-amber-700 dark:text-amber-300">—</span>
            : <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              {d.intervention.barriers.map((b, i) => (
                <li key={i} className="flex gap-1"><span className="text-amber-400">·</span>{b}</li>
              ))}
            </ul>
          }
        </div>
      </div>

      {/* Add goal button */}
      <button onClick={onAddSmartGoal} className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#0E0F12] dark:hover:text-white transition-colors">
        <Plus className="w-4 h-4" /> Yeni SMART hedef ekle
      </button>

      {/* New SMART goal form */}
      {newGoalOpen && (
        <div className="rounded-2xl border border-[#0E0F12] dark:border-white bg-white dark:bg-gray-900 p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Yeni SMART Hedef</p>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Spesifik</label>
            <input className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-[#F4F5F8] dark:bg-gray-800 dark:text-white outline-none focus:border-[#0E0F12]"
              value={draft.specific} onChange={e => setDraft({ ...draft, specific: e.target.value })}
              placeholder="Hedef başlığı…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Ölçülebilir</label>
            <textarea rows={2} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-[#F4F5F8] dark:bg-gray-800 dark:text-white outline-none focus:border-[#0E0F12] resize-none"
              value={draft.measurable} onChange={e => setDraft({ ...draft, measurable: e.target.value })}
              placeholder="Başarı kriteri…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Seans sayısı</label>
            <input type="number" min={1} max={100} className="w-24 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-[#F4F5F8] dark:bg-gray-800 dark:text-white outline-none focus:border-[#0E0F12]"
              value={draft.timeframeSessions} onChange={e => setDraft({ ...draft, timeframeSessions: Number(e.target.value) })} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onNewGoalClose} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              İptal
            </button>
            <button onClick={save} className="text-xs bg-[#0E0F12] text-white px-4 py-1.5 rounded-lg hover:opacity-80 transition-opacity">
              Kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main VakaHaritasi component ──────────────────────────────────────────────

type ViewKey = 'hub' | 'piramit' | 'dongu' | 'mudahale' | 'model';

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: 'hub',      label: 'Hub Özet'       },
  { key: 'piramit',  label: 'Boylamsal'       },
  { key: 'dongu',    label: 'Durumsal Döngü'  },
  { key: 'mudahale', label: 'Müdahale'        },
  { key: 'model',    label: 'BDT Modeli'      },
];

type Props = {
  initialData?: CaseData;
  patientId?: string;
};

export default function VakaHaritasi({ initialData, patientId }: Props) {
  const [data, setData] = useState<CaseData>(initialData ?? DEMO_CASE);
  const [view, setView] = useState<ViewKey>('hub');
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const issues = validateCase(data);

  const handleAddSmartGoal = useCallback(() => {
    setNewGoalOpen(true);
    setView('mudahale');
  }, []);

  const handleNewGoalSave = useCallback((g: { specific: string; measurable: string; timeframeSessions: number }) => {
    setData(prev => ({
      ...prev,
      intervention: {
        ...prev.intervention,
        smartGoals: [...prev.intervention.smartGoals, g],
      },
    }));
    setNewGoalOpen(false);
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-gray-400">Vaka Haritası</p>
          <h1 className="text-xl font-medium mt-0.5 text-[#0E0F12] dark:text-white">
            {data.client.id} · {data.client.primaryFramework}
          </h1>
        </div>
        <button
          onClick={() => setShowValidation(v => !v)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
            issues.length > 0
              ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300'
              : 'border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          {issues.length === 0 ? 'Doğrulama tamam' : `${issues.length} eksik alan`}
        </button>
      </div>

      {/* Validation panel */}
      {showValidation && issues.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4">
          <p className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-semibold mb-2">Eşleme tablosunda dolmayan alanlar</p>
          <div className="flex flex-wrap gap-2">
            {issues.map((iss, i) => (
              <span key={i} className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                {iss.field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* View tabs */}
      <div className="flex gap-1 bg-[#F4F5F8] dark:bg-gray-800 p-1 rounded-2xl">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`flex-1 text-xs py-2 rounded-xl font-medium transition-colors ${
              view === v.key
                ? 'bg-white dark:bg-gray-900 text-[#0E0F12] dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-[#0E0F12] dark:hover:text-white'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Active view */}
      {view === 'hub' && <HubOzet d={data} />}
      {view === 'piramit' && <BoyumsalFormulasyon d={data} />}
      {view === 'dongu' && <DurumsalDongu d={data} onAddSmartGoal={handleAddSmartGoal} />}
      {view === 'mudahale' && (
        <SmartMudahale
          d={data}
          onAddSmartGoal={handleAddSmartGoal}
          newGoalOpen={newGoalOpen}
          onNewGoalClose={() => setNewGoalOpen(false)}
          onNewGoalSave={handleNewGoalSave}
        />
      )}
      {view === 'model' && (
        <BdtModelDisplay patientId={patientId} />
      )}
    </div>
  );
}

// ─── Demo / test case (anon-001) ──────────────────────────────────────────────

export const DEMO_CASE: CaseData = {
  client: {
    id: 'anon-001',
    functionalityScore: 5,
    sessionPlan: 12,
    primaryFramework: 'BDT',
    referralMotivation:
      'Gerginlik ne yaparsa geçmemiş, ilaca bağımlı yaşamak istemiyor. Hep aynı toksik ilişkilere çekildiğini ve hayır diyemediği için sürekli uyumlu göründüğünü fark etmiş.',
  },
  chiefComplaints: [
    { complaint: 'İsteksizlik', clinicalNote: 'Motivasyon eksikliği, anlamsızlık' },
    { complaint: 'İlişkide sıkışma/boğulma', clinicalNote: 'Güvenli bağlanma sorunu' },
    { complaint: 'Yoğun sıkıntı hali', clinicalNote: 'Duyguya tahammülsüzlük' },
    { complaint: 'Uyku sorunları', clinicalNote: 'Aşırı düşünme, sürekli stres tepkisi' },
    { complaint: 'Amaçsızlık', clinicalNote: 'Değerlerden uzaklaşma' },
    { complaint: 'İsteklerini söyleyememe', clinicalNote: 'Reddedilme korkusu, düşüncelerle kaynaşma' },
    { complaint: 'Sürekli gerginlik', clinicalNote: 'Otonom hiperaktivasyon' },
  ],
  fourP: {
    predisposing: [
      'Aşırı eleştirel aile', 'Sürekli öfkeli ve suçlayıcı baba',
      'Fikirlerin önemsenmemesi', 'Lisede zorbalık dönemi',
      'Çok sayıda reddedilme deneyimi', 'Susma ve kaçma örüntüsünü öğrenme',
    ],
    precipitating: ['Aynı toksik ilişki örüntüsünün tekrarı', 'Geçmeyen yorgunluk hissi', 'Artan öfke hali'],
    perpetuating: ['Kimse beni sevmez', 'Kimse bana değer vermez', 'Fikirlerim önemsenmez', 'Yetersizim'],
    protective: ['4 yakın arkadaş', 'İyileşen maddi durum', 'Yeni proje fikri', 'Sorunları daha önce kendi başına aşmış olma', 'Terapiye ilgi'],
  },
  longitudinal: {
    earlyExperiences: [
      'Aşırı eleştirel aile', 'Sürekli öfkeli ve suçlayıcı baba',
      'Fikirlerin önemsenmemesi', 'Lisede zorbalık dönemi',
      'Çok sayıda reddedilme deneyimi', 'Susma ve kaçma örüntüsünü öğrenme',
    ],
    coreBeliefs: ['Sevilmiyorum', 'Yetersizim', 'Kimse bana tahammül etmez', 'Yalnızım', 'Sorunluyum-bozuğum'],
    intermediateBeliefs: [
      'İsteklerimi söylersem insanlar beni reddeder',
      'Sorunlarımdan bahsedersem yargılarlar',
      'Güçsüzlüğümü belli edersem tekrar zorbalık yaşarım',
      'İnsanlar dedikodumu yapar',
    ],
    copingStrategies: [
      'Alkol alma', 'Sosyal izolasyon',
      'Sorunları tek başına çözmeye çalışma', 'Uyuyarak kaçınma', 'Kendine acımasız davranma',
    ],
  },
  situational: {
    trigger: 'Arkadaşım bana güçsüzsün dedi.',
    automaticThoughts: [
      'Bir daha konuşma, gururunu düşün',
      'Kimse beni istemiyor zaten',
      'Arkadaşlığını kes, yoksa daha da boğulacaksın',
    ],
    emotions: ['Dehşet', 'Çaresizlik', 'Yoğun hayal kırıklığı'],
    bodily: ['Mide bulantısı', 'Ter basması', 'Aşırı gerilme'],
    emotionIntensity: 85,
    safetyBehaviors: [
      'İnstagramdan engelleme', 'Fotoğrafına bakıp gururu için iletişime geçmeme',
      'Diğerleriyle az görüşme', 'Kimseye sorun anlatmama',
      'Abur cubur yeme', 'Video izleyerek uyumaya çalışma',
    ],
    targetBehaviors: [
      'İstemediği durumlarda hayır diyebilme',
      'Kırıldığında içine atmayıp sorununu söyleyebilme',
      'İsteksizliğe takılmadan önemli şeylere devam edebilme',
      "'Saçma bulurlar' düşüncesiyle birlikte 'istiyorum' diyebilme",
    ],
  },
  intervention: {
    smartGoals: [
      { specific: 'İstekleri dile getirme', measurable: "Bir arkadaşı 'nereye gidelim' dediğinde çekinmeden istediği yeri belirtebilme", timeframeSessions: 12 },
      { specific: 'Reddedilme korkusunu aşma', measurable: 'Reddedileceğim düşüncesiyle birlikte tekrar görüşme talep edebilme', timeframeSessions: 12 },
      { specific: 'Sınır çizebilme', measurable: "Rahatsızlık anında 'Hayır, kendimi rahatsız ediyorum' tipi ifade", timeframeSessions: 12 },
    ],
    adherence: 'Seanslara zamanında katılıyor, seans arası konuşulanları deniyor.',
    barriers: ['Hemen kırılma yaşıyor', 'Zihni yıkıcı iç konuşmaya başlıyor', 'Özel ilgi istiyor, alamayınca hevesi kırılıyor'],
  },
};
