'use client';

/**
 * HexaflexSeansPanel · V3
 * Seans sonu değerlendirme paneli — 6 boyut × terapist değerlendirmesi × haftalık seyir.
 * SeansDetay bileşeni içine yerleştirilir.
 */

import React, { useCallback, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { HexaflexScores, HexaflexHistoryEntry } from '@/lib/types';
import { Sparkles } from 'lucide-react';

// ── Sabitler ───────────────────────────────────────────────────────────────

const DIMS = [
  {
    key: 'defuzyon'      as const,
    label: 'Defuzyon',
    hint: 'Düşüncelerden mesafe alabilme',
    color: '#6366f1',
    bg: '#eef2ff',
    low: 'Düşüncelere sıkışma, bilişsel füzyon belirgin.',
    high: 'Düşüncelerden sağlıklı mesafe alınıyor.',
  },
  {
    key: 'kabul'         as const,
    label: 'Kabul',
    hint: 'Deneyimi olduğu gibi kabul etme',
    color: '#f97316',
    bg: '#fff7ed',
    low: 'Yaşantısal kaçınma örüntüleri görülüyor.',
    high: 'Zor duygu ve düşüncelere açıklık var.',
  },
  {
    key: 'andaOlma'      as const,
    label: 'Şimdiki An',
    hint: "An'da tam olarak var olma",
    color: '#14b8a6',
    bg: '#f0fdfa',
    low: "An'a temas zayıf; ruminasyon / endişe belirgin.",
    high: 'Şimdiki ana güçlü temas sağlanıyor.',
  },
  {
    key: 'baglamBenlik'  as const,
    label: 'Bağlam-Benlik',
    hint: 'Gözlemci benlik perspektifi',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    low: 'İçerik benlikle özdeşleşme; katı benlik hikâyesi.',
    high: 'Gözlemci perspektifi kullanılabiliyor.',
  },
  {
    key: 'degerNetligi'  as const,
    label: 'Değer Netliği',
    hint: 'Değerlere netlik ve bağlılık',
    color: '#22c55e',
    bg: '#f0fdf4',
    low: 'Değerler belirsiz veya doğrudan yaşanmıyor.',
    high: 'Değer odaklı yaşam belirginleşiyor.',
  },
  {
    key: 'bagliEylem'    as const,
    label: 'Bağlı Eylem',
    hint: 'Değer yönelimli eylem kalıpları',
    color: '#f59e0b',
    bg: '#fffbeb',
    low: 'Değer yönelimli eylem düzeyi düşük; inertia / kaçınma.',
    high: 'Değerlere uyumlu adımlar atılıyor.',
  },
] as const;

type DimKey = typeof DIMS[number]['key'];

// ── Yardımcı ───────────────────────────────────────────────────────────────

const DEFAULT_SCORES: HexaflexScores = {
  defuzyon: 5, kabul: 5, andaOlma: 5,
  baglamBenlik: 5, degerNetligi: 5, bagliEylem: 5,
};

function avg(s: HexaflexScores) {
  return (s.defuzyon + s.kabul + s.andaOlma + s.baglamBenlik + s.degerNetligi + s.bagliEylem) / 6;
}

function esneklikMeta(score: number) {
  if (score < 3)   return { label: 'Düşük Esneklik',  color: '#ef4444', bar: 'bg-red-500' };
  if (score < 5)   return { label: 'Gelişmekte',       color: '#f97316', bar: 'bg-orange-500' };
  if (score < 6.5) return { label: 'Orta Esneklik',   color: '#eab308', bar: 'bg-yellow-500' };
  if (score < 8)   return { label: 'İyi Esneklik',    color: '#22c55e', bar: 'bg-green-500' };
  return               { label: 'Yüksek Esneklik',   color: '#15803d', bar: 'bg-green-700' };
}

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ── Radar SVG ──────────────────────────────────────────────────────────────

function RadarSvg({
  scores,
  prevScores,
  size = 260,
}: {
  scores: HexaflexScores;
  prevScores?: HexaflexScores;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.37;
  const rings = [0.25, 0.5, 0.75, 1];

  const pts = (s: HexaflexScores) =>
    DIMS.map((d, i) => {
      const r = (s[d.key] / 10) * maxR;
      return polarToXY(i * 60, r, cx, cy);
    });

  const current = pts(scores);
  const prev    = prevScores ? pts(prevScores) : null;

  const poly = (p: { x: number; y: number }[]) => p.map(pt => `${pt.x},${pt.y}`).join(' ');

  const scoreAvg = avg(scores);
  const { color } = esneklikMeta(scoreAvg);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id="hsp-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.04} />
        </radialGradient>
      </defs>

      {/* Arka plan halkalar */}
      {rings.map(r => (
        <polygon key={r}
          points={DIMS.map((_, i) => { const p = polarToXY(i * 60, maxR * r, cx, cy); return `${p.x},${p.y}`; }).join(' ')}
          fill="none"
          stroke={r === 1 ? 'rgba(14,15,18,0.13)' : 'rgba(14,15,18,0.06)'}
          strokeWidth={r === 1 ? 1.5 : 1}
        />
      ))}

      {/* Eksen çizgileri */}
      {DIMS.map((_, i) => {
        const e = polarToXY(i * 60, maxR, cx, cy);
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(14,15,18,0.08)" strokeWidth="1" />;
      })}

      {/* Önceki seans hayalet */}
      {prev && (
        <polygon
          points={poly(prev)}
          fill="rgba(148,163,184,0.08)"
          stroke="rgba(148,163,184,0.5)"
          strokeWidth="1.5"
          strokeDasharray="5,3"
        />
      )}

      {/* Ana polygon */}
      <polygon
        points={poly(current)}
        fill="url(#hsp-fill)"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Noktalar */}
      {current.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={5}
          fill={DIMS[i].color} stroke="white" strokeWidth="2" />
      ))}

      {/* Etiketler */}
      {DIMS.map((d, i) => {
        const lp = polarToXY(i * 60, maxR + 24, cx, cy);
        return (
          <text key={d.key} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fontWeight="700" fill={d.color}
            fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="0.02em">
            {d.label.split('-')[0].slice(0, 5)}
          </text>
        );
      })}

      {/* Merkez */}
      <circle cx={cx} cy={cy} r={28} fill="white" stroke={color} strokeWidth="1.5" />
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
        fontSize="17" fontWeight="300" fill={color}
        fontFamily="'Fraunces', serif" fontStyle="italic">
        {scoreAvg.toFixed(1)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle"
        fontSize="7" fontWeight="600" fill="rgba(14,15,18,0.4)"
        fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="0.08em">
        ESNEKLİK
      </text>
    </svg>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  scores?: HexaflexScores;
  note?: string;
  history?: HexaflexHistoryEntry[];
  onChange: (scores: HexaflexScores) => void;
  onNoteChange: (note: string) => void;
}

// ── Trend grafiği ──────────────────────────────────────────────────────────

function TrendChart({ history }: { history: HexaflexHistoryEntry[] }) {
  const data = history.map((h, i) => ({
    label: `S${h.no}`,
    ...h.scores,
  }));

  return (
    <div style={{ height: 200, marginTop: 4 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(14,15,18,0.06)" />
          <XAxis dataKey="label" stroke="rgba(14,15,18,0.25)" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 10]} stroke="rgba(14,15,18,0.25)" fontSize={10} tickLine={false} axisLine={false} ticks={[0, 2, 4, 6, 8, 10]} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid rgba(14,15,18,0.10)', fontSize: 11, padding: '8px 12px' }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} iconType="circle" iconSize={6} />
          {DIMS.map(d => (
            <Line key={d.key} type="monotone" dataKey={d.key} name={d.label}
              stroke={d.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Haftalık özet kartı ────────────────────────────────────────────────────

function WeeklySummaryCard({ history }: { history: HexaflexHistoryEntry[] }) {
  if (history.length < 2) return null;

  const last    = history[history.length - 1].scores;
  const prev    = history[history.length - 2].scores;

  const deltas = DIMS.map(d => ({
    ...d,
    current: last[d.key],
    delta: last[d.key] - prev[d.key],
  }));

  const overallDelta = avg(last) - avg(prev);

  return (
    <div style={{
      padding: '14px 16px',
      background: 'rgba(14,15,18,0.025)',
      border: '1px solid rgba(14,15,18,0.08)',
      borderRadius: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
          Haftalık Özet
        </span>
        <span style={{
          fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--mono)',
          color: overallDelta >= 0 ? '#22c55e' : '#ef4444',
        }}>
          {overallDelta >= 0 ? '↑' : '↓'} {Math.abs(overallDelta).toFixed(1)} genel
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 12px' }}>
        {deltas.map(d => (
          <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--ink-2)', fontFamily: 'var(--sans)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: d.delta >= 0 ? '#22c55e' : '#ef4444' }}>
              {d.delta >= 0 ? '+' : ''}{d.delta.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Otomatik değerlendirme üreteci ─────────────────────────────────────────

function generateEval(scores: HexaflexScores, history?: HexaflexHistoryEntry[]): string {
  const lines: string[] = [];

  const scoreAvg = avg(scores);
  const { label } = esneklikMeta(scoreAvg);
  lines.push(`Genel psikolojik esneklik: ${label} (${scoreAvg.toFixed(1)}/10).`);

  // Düşük boyutlar (≤ 4)
  const low = DIMS.filter(d => scores[d.key] <= 4);
  if (low.length > 0) {
    lines.push(`\nÖncelikli çalışma alanları: ${low.map(d => d.label).join(', ')}.`);
    low.forEach(d => lines.push(`• ${d.label}: ${d.low}`));
  }

  // Yüksek boyutlar (≥ 7)
  const high = DIMS.filter(d => scores[d.key] >= 7);
  if (high.length > 0) {
    lines.push(`\nGüçlü alanlar: ${high.map(d => d.label).join(', ')}.`);
  }

  // Örüntü yorumları
  if (scores.defuzyon <= 4 && scores.kabul <= 4) {
    lines.push('\nBilişsel füzyon ve yaşantısal kaçınma birlikte: ACT müdahale önceliği — defuzyon ve kabul çalışmaları.');
  }
  if (scores.degerNetligi <= 4 && scores.bagliEylem <= 4) {
    lines.push('\nDeğer-eylem bağlantısı zayıf: Değer açıklama egzersizleri ve basamaklı eylem planlaması önerilir.');
  }
  if (scores.andaOlma <= 4) {
    lines.push('\nŞimdiki ana temas güçlendirilmeli: Farkındalık uygulamaları ve nefes-beden egzersizleri eklenebilir.');
  }

  // Geçmiş kıyaslaması
  if (history && history.length >= 2) {
    const prevEntry = history[history.length - 2];
    if (prevEntry) {
      const delta = scoreAvg - avg(prevEntry.scores);
      if (Math.abs(delta) >= 0.5) {
        lines.push(`\nSeans arası değişim: ${delta >= 0 ? '↑ artış' : '↓ düşüş'} (${delta >= 0 ? '+' : ''}${delta.toFixed(1)} puan).`);
      }
    }
  }

  return lines.join('\n');
}

// ── Ana bileşen ────────────────────────────────────────────────────────────

export default function HexaflexSeansPanel({
  scores: propScores,
  note = '',
  history = [],
  onChange,
  onNoteChange,
}: Props) {
  const scores: HexaflexScores = propScores ?? DEFAULT_SCORES;
  const [showTrend, setShowTrend] = useState(false);

  const prevEntry = history.length > 0 ? history[history.length - 1] : undefined;
  const prevScores = prevEntry?.scores;

  const update = useCallback((key: DimKey, value: number) => {
    onChange({ ...scores, [key]: value });
  }, [scores, onChange]);

  const scoreAvg = avg(scores);
  const { label: esLabel, color: esColor } = esneklikMeta(scoreAvg);
  const overallDelta = prevScores ? scoreAvg - avg(prevScores) : undefined;

  const hasHistory = history.length >= 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Radar + Özet ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Radar */}
        <div style={{ flex: '0 0 auto' }}>
          <RadarSvg scores={scores} prevScores={prevScores} />
          {prevScores && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6, gap: 16 }}>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 18, borderTop: '2px solid rgba(148,163,184,0.6)', borderTopStyle: 'dashed' }} />
                Önceki seans
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 18, borderTop: `2px solid ${esColor}` }} />
                Bu seans
              </span>
            </div>
          )}
        </div>

        {/* Skor kartı */}
        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>

          {/* Endeks */}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 4 }}>
              Psikolojik Esneklik Endeksi
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 48, lineHeight: 1, letterSpacing: '-0.03em', color: esColor }}>
                {scoreAvg.toFixed(1)}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>/10</span>
                {overallDelta !== undefined && (
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: overallDelta >= 0 ? '#22c55e' : '#ef4444' }}>
                    {overallDelta >= 0 ? '↑ +' : '↓ '}{Math.abs(overallDelta).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            {/* Durum rozeti */}
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: esColor + '18', borderRadius: 999, padding: '5px 12px', border: `1px solid ${esColor}28` }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: esColor }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: esColor, fontFamily: 'var(--sans)' }}>{esLabel}</span>
            </div>
          </div>

          {/* Boyut mini-listesi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DIMS.map(d => {
              const val = scores[d.key];
              const pct = (val / 10) * 100;
              const delta = prevScores ? val - prevScores[d.key] : undefined;
              return (
                <div key={d.key} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 18px 28px', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: d.color, fontFamily: 'var(--sans)', whiteSpace: 'nowrap' }}>{d.label}</span>
                  <div style={{ height: 5, background: 'rgba(14,15,18,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: d.color, borderRadius: 999, transition: 'width 0.3s ease' }} />
                  </div>
                  {delta !== undefined ? (
                    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: delta >= 0 ? '#22c55e' : '#ef4444', textAlign: 'right' }}>
                      {delta >= 0 ? '↑' : '↓'}
                    </span>
                  ) : <span />}
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--ink)', textAlign: 'right' }}>{val}</span>
                </div>
              );
            })}
          </div>

          {/* Haftalık özet */}
          {hasHistory && <WeeklySummaryCard history={[...history, { no: -1, tarih: new Date().toISOString(), scores }]} />}
        </div>
      </div>

      {/* ── 6 Boyut Sliders ───────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(14,15,18,0.025)',
        border: '1px solid rgba(14,15,18,0.08)',
        borderRadius: 16,
        padding: '20px 22px',
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 14 }}>
          6 Boyut Değerlendirmesi
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px 28px' }}>
          {DIMS.map(d => {
            const val = scores[d.key];
            const prevVal = prevScores?.[d.key];
            const delta = prevVal !== undefined ? val - prevVal : undefined;
            return (
              <div key={d.key} style={{
                padding: '12px 14px',
                background: d.bg,
                borderRadius: 12,
                border: `1px solid ${d.color}22`,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {/* Başlık */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: d.color, fontFamily: 'var(--sans)', letterSpacing: '-0.01em' }}>
                      {d.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(14,15,18,0.5)', fontFamily: 'var(--sans)', marginTop: 1 }}>
                      {d.hint}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 28, lineHeight: 1, color: d.color, letterSpacing: '-0.02em' }}>
                      {val}
                    </span>
                    {delta !== undefined && (
                      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: delta >= 0 ? '#22c55e' : '#ef4444' }}>
                        {delta >= 0 ? '+' : ''}{delta}
                      </span>
                    )}
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={0} max={10} step={1}
                  value={val}
                  onChange={e => update(d.key, parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: d.color, cursor: 'pointer', height: 4 }}
                />

                {/* Tick labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'rgba(14,15,18,0.3)', fontFamily: 'var(--mono)' }}>
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>

                {/* Dinamik yorum */}
                {val <= 4 && (
                  <div style={{ fontSize: 11, color: 'rgba(14,15,18,0.6)', fontFamily: 'var(--sans)', fontStyle: 'italic', paddingTop: 2, borderTop: `1px solid ${d.color}20` }}>
                    {d.low}
                  </div>
                )}
                {val >= 8 && (
                  <div style={{ fontSize: 11, color: d.color, fontFamily: 'var(--sans)', fontStyle: 'italic', paddingTop: 2, borderTop: `1px solid ${d.color}20` }}>
                    {d.high}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Terapist Değerlendirmesi ───────────────────────────────────── */}
      <div style={{
        background: 'white',
        border: '1px solid rgba(14,15,18,0.10)',
        borderRadius: 16,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            Terapist Değerlendirmesi
          </div>
          <button
            onClick={() => onNoteChange(generateEval(scores, history))}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 999,
              padding: '5px 11px',
              cursor: 'pointer',
              fontSize: 11.5, fontWeight: 600, color: '#6366f1',
              fontFamily: 'var(--sans)',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles style={{ width: 13, height: 13 }} />
            Otomatik Öner
          </button>
        </div>
        <textarea
          value={note}
          onChange={e => onNoteChange(e.target.value)}
          rows={5}
          placeholder={`Esneklik profilini yorumlayın:\n• Hangi boyutlar öncelikli çalışma alanı?\n• Seans arası değişim nasıl görünüyor?\n• Bir sonraki seans için ACT odağı ne olmalı?`}
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid rgba(14,15,18,0.10)',
            borderRadius: 12,
            background: 'rgba(14,15,18,0.02)',
            fontFamily: 'var(--sans)',
            fontSize: 13.5,
            lineHeight: 1.6,
            color: 'var(--ink)',
            resize: 'vertical',
            outline: 'none',
          }}
        />
      </div>

      {/* ── Boylamsal Seyir ────────────────────────────────────────────── */}
      {hasHistory && (
        <div style={{
          background: 'white',
          border: '1px solid rgba(14,15,18,0.10)',
          borderRadius: 16,
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
              Boylamsal Seyir ({history.length} seans)
            </div>
            <button
              onClick={() => setShowTrend(t => !t)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--sans)', fontWeight: 600,
              }}
            >
              {showTrend ? 'Gizle' : 'Göster'}
            </button>
          </div>

          {/* Micro sparklines (her zaman görünür) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 16px' }}>
            {DIMS.map(d => {
              const pts = history.map(h => h.scores[d.key]);
              const min = Math.min(...pts);
              const max = Math.max(...pts);
              const trend = pts.length >= 2 ? pts[pts.length - 1] - pts[0] : 0;
              return (
                <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: d.color, fontFamily: 'var(--sans)', width: 68, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.label}
                  </span>
                  <svg width={48} height={20} style={{ flexShrink: 0 }}>
                    {pts.map((v, i) => {
                      if (i === 0) return null;
                      const x1 = ((i - 1) / (pts.length - 1)) * 48;
                      const x2 = (i / (pts.length - 1)) * 48;
                      const range = max - min || 1;
                      const y1 = 18 - ((pts[i - 1] - min) / range) * 16;
                      const y2 = 18 - ((v - min) / range) * 16;
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={d.color} strokeWidth="1.5" />;
                    })}
                    {pts.map((v, i) => {
                      const x = (i / Math.max(pts.length - 1, 1)) * 48;
                      const range = max - min || 1;
                      const y = 18 - ((v - min) / range) * 16;
                      return <circle key={i} cx={x} cy={y} r={2} fill={d.color} />;
                    })}
                  </svg>
                  <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--mono)', color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
                    {trend >= 0 ? '↑' : '↓'}{Math.abs(trend).toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Full trend chart */}
          {showTrend && <TrendChart history={history} />}
        </div>
      )}
    </div>
  );
}
