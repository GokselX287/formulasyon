'use client';

/**
 * HexaflexRadar · V3
 * Psikolojik esneklik altı-boyut radar görselleştirmesi.
 * FormulasyonPanel viz-slot olarak kullanılır.
 *
 * Props (backward-compat):
 *   formulationId    — /api/scores/:id'ye PATCH gönderir
 *   initialScores    — başlangıç değerleri (defusion → defuzyon map)
 *
 * V3 eklentileri:
 *   compareScores    — önceki seans "hayalet" çizgisi
 *   interactive      — slider'ları göster / gizle (default true)
 *   showCenterScore  — ortada esneklik skoru (default true)
 *   historyData      — seans geçmişi (haftalık özet sparkline)
 */

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Tip tanımları ──────────────────────────────────────────────────────────

export interface HexaflexScores {
  defuzyon: number;
  kabul: number;
  andaOlma: number;
  baglamBenlik: number;
  degerNetligi: number;
  bagliEylem: number;
}

export interface HexaflexHistoryEntry {
  label: string; // "S1", "S2" gibi
  defuzyon: number;
  kabul: number;
  andaOlma: number;
  baglamBenlik: number;
  degerNetligi: number;
  bagliEylem: number;
}

// FormulasyonPanel compat
type LegacyScores = {
  defusion: number;
  acceptance: number;
  present_moment: number;
  self_as_context: number;
  values_clarity: number;
  committed_action: number;
};

interface Props {
  formulationId?: number;
  initialScores?: Partial<LegacyScores> | Partial<HexaflexScores>;
  compareScores?: Partial<HexaflexScores>;
  historyData?: HexaflexHistoryEntry[];
  interactive?: boolean;
  showCenterScore?: boolean;
  onScoresChange?: (scores: HexaflexScores) => void;
}

// ── Sabitler ───────────────────────────────────────────────────────────────

const DIMS = [
  { key: 'defuzyon'     as const, label: 'Defuzyon',      short: 'DEF', color: '#6366f1' },
  { key: 'kabul'        as const, label: 'Kabul',          short: 'KBL', color: '#f97316' },
  { key: 'andaOlma'     as const, label: 'Şimdiki An',    short: 'ŞAN', color: '#14b8a6' },
  { key: 'baglamBenlik' as const, label: 'Bağlam-Benlik', short: 'BGB', color: '#8b5cf6' },
  { key: 'degerNetligi' as const, label: 'Değer Netliği', short: 'DĞR', color: '#22c55e' },
  { key: 'bagliEylem'   as const, label: 'Bağlı Eylem',   short: 'BEY', color: '#f59e0b' },
] as const;

const DEFAULT_SCORES: HexaflexScores = {
  defuzyon: 5, kabul: 5, andaOlma: 5,
  baglamBenlik: 5, degerNetligi: 5, bagliEylem: 5,
};

// ── Yardımcı ───────────────────────────────────────────────────────────────

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function toHexaflex(raw: Partial<LegacyScores> | Partial<HexaflexScores>): HexaflexScores {
  // HexaflexScores shape doğrudan geldiyse
  if ('defuzyon' in raw || 'kabul' in raw) {
    const s = raw as Partial<HexaflexScores>;
    return { ...DEFAULT_SCORES, ...s };
  }
  // LegacyScores — ters dönüşüm (fusion inverse → defuzyon)
  const l = raw as Partial<LegacyScores>;
  return {
    defuzyon:     l.defusion       ?? DEFAULT_SCORES.defuzyon,
    kabul:        l.acceptance     ?? DEFAULT_SCORES.kabul,
    andaOlma:     l.present_moment ?? DEFAULT_SCORES.andaOlma,
    baglamBenlik: l.self_as_context ?? DEFAULT_SCORES.baglamBenlik,
    degerNetligi: l.values_clarity  ?? DEFAULT_SCORES.degerNetligi,
    bagliEylem:   l.committed_action ?? DEFAULT_SCORES.bagliEylem,
  };
}

function avg(s: HexaflexScores) {
  return (s.defuzyon + s.kabul + s.andaOlma + s.baglamBenlik + s.degerNetligi + s.bagliEylem) / 6;
}

function esneklikLabel(score: number): { label: string; color: string } {
  if (score < 3)  return { label: 'Düşük Esneklik',   color: '#ef4444' };
  if (score < 5)  return { label: 'Gelişmekte',        color: '#f97316' };
  if (score < 6.5) return { label: 'Orta Esneklik',   color: '#eab308' };
  if (score < 8)  return { label: 'İyi Esneklik',     color: '#22c55e' };
  return              { label: 'Yüksek Esneklik',     color: '#15803d' };
}

// ── Radar SVG ──────────────────────────────────────────────────────────────

function RadarSvg({
  scores,
  compare,
  size = 280,
  showCenter = true,
}: {
  scores: HexaflexScores;
  compare?: Partial<HexaflexScores>;
  size?: number;
  showCenter?: boolean;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const rings = [0.25, 0.5, 0.75, 1];

  const makePoints = (s: HexaflexScores) =>
    DIMS.map((d, i) => {
      const r = (s[d.key] / 10) * maxR;
      return polarToXY(i * 60, r, cx, cy);
    });

  const pts = makePoints(scores);
  const polygon = pts.map(p => `${p.x},${p.y}`).join(' ');

  const ghostPts = compare
    ? makePoints({ ...DEFAULT_SCORES, ...compare })
    : null;
  const ghostPolygon = ghostPts?.map(p => `${p.x},${p.y}`).join(' ');

  const scoreAvg = avg(scores);
  const { color } = esneklikLabel(scoreAvg);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id="hx-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0.06} />
        </radialGradient>
        <filter id="hx-glow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feFlood floodColor={color} floodOpacity={0.3} result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Arka plan halkalar */}
      {rings.map(r => (
        <polygon
          key={r}
          points={DIMS.map((_, i) => {
            const p = polarToXY(i * 60, maxR * r, cx, cy);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none"
          stroke={r === 1 ? 'rgba(14,15,18,0.14)' : 'rgba(14,15,18,0.07)'}
          strokeWidth={r === 1 ? 1.5 : 1}
        />
      ))}

      {/* Eksen çizgileri */}
      {DIMS.map((_, i) => {
        const end = polarToXY(i * 60, maxR, cx, cy);
        return (
          <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
            stroke="rgba(14,15,18,0.10)" strokeWidth="1" />
        );
      })}

      {/* Hayalet (önceki seans) */}
      {ghostPolygon && (
        <polygon
          points={ghostPolygon}
          fill="rgba(148,163,184,0.08)"
          stroke="rgba(148,163,184,0.55)"
          strokeWidth="1.5"
          strokeDasharray="5,3"
        />
      )}

      {/* Ana data polygon */}
      <polygon
        points={polygon}
        fill="url(#hx-fill)"
        stroke={color}
        strokeWidth="2"
        filter="url(#hx-glow)"
        strokeLinejoin="round"
      />

      {/* Data noktalları */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4}
          fill={DIMS[i].color}
          stroke="white"
          strokeWidth="1.5"
        />
      ))}

      {/* Eksen etiketleri */}
      {DIMS.map((d, i) => {
        const labelR = maxR + 22;
        const p = polarToXY(i * 60, labelR, cx, cy);
        const val = scores[d.key];
        return (
          <g key={d.key}>
            <text x={p.x} y={p.y - 5} textAnchor="middle" dominantBaseline="middle"
              fontSize="9.5" fontWeight="600" fill={d.color} fontFamily="'Plus Jakarta Sans', sans-serif"
              letterSpacing="0.03em">
              {d.short}
            </text>
            <text x={p.x} y={p.y + 9} textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fontWeight="700" fill="rgba(14,15,18,0.75)" fontFamily="'JetBrains Mono', monospace">
              {val}
            </text>
          </g>
        );
      })}

      {/* Merkez skor */}
      {showCenter && (
        <g>
          <circle cx={cx} cy={cy} r={26} fill="white" stroke={color} strokeWidth="1.5" />
          <text x={cx} y={cy - 3} textAnchor="middle" dominantBaseline="middle"
            fontSize="16" fontWeight="300" fill={color}
            fontFamily="'Fraunces', serif" fontStyle="italic">
            {scoreAvg.toFixed(1)}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle"
            fontSize="7.5" fontWeight="600" fill="rgba(14,15,18,0.45)"
            fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="0.06em">
            ESNEK
          </text>
        </g>
      )}
    </svg>
  );
}

// ── Ana bileşen ────────────────────────────────────────────────────────────

export default function HexaflexRadar({
  formulationId,
  initialScores = {},
  compareScores,
  historyData,
  interactive = true,
  showCenterScore = true,
  onScoresChange,
}: Props) {
  const [scores, setScores] = useState<HexaflexScores>(() =>
    toHexaflex(initialScores)
  );
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setScores(toHexaflex(initialScores));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function update(key: keyof HexaflexScores, value: number) {
    const next = { ...scores, [key]: value };
    setScores(next);
    onScoresChange?.(next);
    if (formulationId == null) return;
    setSaving(true);
    await fetch(`/api/scores/${formulationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });
    setSaving(false);
  }

  const scoreAvg = avg(scores);
  const { label: esLabel, color: esColor } = esneklikLabel(scoreAvg);
  const hasHistory = (historyData?.length ?? 0) > 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* Üst alan: Radar + Skor kartı */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Radar */}
        <div style={{ flex: '0 0 auto' }}>
          <RadarSvg scores={scores} compare={compareScores} showCenter={showCenterScore} />
        </div>

        {/* Skor kartı */}
        <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 6 }}>
              Psikolojik Esneklik Endeksi
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 52, lineHeight: 1, letterSpacing: '-0.03em', color: esColor }}>
                {scoreAvg.toFixed(1)}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>/10</span>
            </div>
            <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: esColor + '18', borderRadius: 999, padding: '4px 10px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: esColor, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: esColor, fontFamily: 'var(--sans)', letterSpacing: '0.02em' }}>
                {esLabel}
              </span>
            </div>
          </div>

          {/* Mini boyut listesi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DIMS.map(d => {
              const val = scores[d.key];
              const pct = (val / 10) * 100;
              return (
                <div key={d.key} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 22px', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: d.color, fontFamily: 'var(--sans)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.label}
                  </span>
                  <div style={{ height: 5, background: 'rgba(14,15,18,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: d.color, borderRadius: 999, transition: 'width 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--mono)', textAlign: 'right' }}>{val}</span>
                </div>
              );
            })}
          </div>

          {saving && (
            <span style={{ fontSize: 10.5, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Kaydediliyor…</span>
          )}
        </div>
      </div>

      {/* Sliders */}
      {interactive && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px 24px' }}>
          {DIMS.map(d => {
            const val = scores[d.key];
            return (
              <div key={d.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: d.color, fontFamily: 'var(--sans)' }}>
                    {d.label}
                  </label>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--ink)' }}>{val}</span>
                </div>
                <input
                  type="range"
                  min={0} max={10} step={1}
                  value={val}
                  onChange={e => update(d.key, parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: d.color }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Geçmiş seyir */}
      {hasHistory && (
        <div>
          <button
            onClick={() => setShowHistory(h => !h)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11.5, fontWeight: 600, color: 'var(--muted)',
              fontFamily: 'var(--sans)', letterSpacing: '0.04em',
              padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {showHistory ? '▾' : '▸'} Seyir Grafiği ({historyData!.length} seans)
          </button>

          {showHistory && (
            <div style={{ height: 180, marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(14,15,18,0.06)" />
                  <XAxis dataKey="label" stroke="rgba(14,15,18,0.25)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} stroke="rgba(14,15,18,0.25)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(14,15,18,0.10)', fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                  {DIMS.map(d => (
                    <Line
                      key={d.key}
                      type="monotone"
                      dataKey={d.key}
                      name={d.label}
                      stroke={d.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
