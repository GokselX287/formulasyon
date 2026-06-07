'use client';

import React, { useState } from 'react';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

type DiagramType =
  | 'sosyal-kaygi' | 'okb' | 'depresyon-gelisimsel' | 'depresyon-dongu' | 'panik' | 'yab'
  | 'cocuk-depresyon' | 'akb' | 'anksiyete-formul' | 'ozgul-fobi' | 'yeme-sorunlari'
  | 'istek-mutluluk' | 'ddd-basit' | 'akb-komplex' | 'kacinma-ogrenme'
  | 'yab-basit' | 'hastalik-anksiyete' | 'hastalik-anksiyete-detay'
  | 'ruminasyon' | 'ruminasyon-ust-bilis' | 'cekingenlik' | 'basit-obsesyon' | 'travma';

const DIAGRAMS: { id: DiagramType; label: string; tag: string }[] = [
  { id: 'sosyal-kaygi',            label: 'Sosyal Kaygı Döngüsü',           tag: 'BDT' },
  { id: 'okb',                     label: 'OKB Döngüsü',                    tag: 'BDT' },
  { id: 'depresyon-gelisimsel',    label: 'Depresyon — Gelişimsel',         tag: 'BDT' },
  { id: 'depresyon-dongu',         label: 'Depresyon Döngüsü',              tag: 'BDT' },
  { id: 'panik',                   label: 'Panik Döngüsü',                  tag: 'BDT' },
  { id: 'yab',                     label: 'YAB Formülasyonu',               tag: 'BDT' },
  { id: 'cocuk-depresyon',         label: 'Çocuk Depresyon Döngüsü',        tag: 'BDT' },
  { id: 'akb',                     label: 'Ayrılık Kaygısı (AKB)',          tag: 'BDT' },
  { id: 'anksiyete-formul',        label: 'Anksiyete Formülü',              tag: 'BDT' },
  { id: 'ozgul-fobi',              label: 'Özgül Fobi Modeli',              tag: 'BDT' },
  { id: 'yeme-sorunlari',          label: 'Yeme Sorunları Modeli',          tag: 'BDT' },
  { id: 'istek-mutluluk',          label: 'İstek / Mutluluk Döngüsü',       tag: 'BDT' },
  { id: 'ddd-basit',               label: 'Düşünce-Duygu-Davranış',         tag: 'BDT' },
  { id: 'akb-komplex',             label: 'AKB / Okul Reddi — Komplex',     tag: 'BDT' },
  { id: 'kacinma-ogrenme',         label: 'Kaçınma & Öğrenme Modeli',       tag: 'BDT' },
  { id: 'yab-basit',               label: 'YAB — Basit Model',              tag: 'BDT' },
  { id: 'hastalik-anksiyete',      label: 'Hastalık Anksiyetesi',           tag: 'BDT' },
  { id: 'hastalik-anksiyete-detay',label: 'Hastalık Anksiyetesi — Detaylı', tag: 'BDT' },
  { id: 'ruminasyon',               label: 'Ruminasyon Döngüsü (ABCD)',      tag: 'BDT' },
  { id: 'ruminasyon-ust-bilis',     label: 'Ruminasyon — Üst-Biliş Modeli', tag: 'BDT' },
  { id: 'cekingenlik',              label: 'Çekingenlik (Geri Durma)',        tag: 'BDT' },
  { id: 'basit-obsesyon',           label: 'Basit Obsesyon Döngüsü',         tag: 'BDT' },
  { id: 'travma',                   label: 'Travma Modeli',                   tag: 'BDT' },
];

type FieldsState = Record<string, string>;

function EditableNode({
  label, fieldKey, fields, onChange, className, style,
}: {
  label: string; fieldKey: string; fields: FieldsState; onChange: (k: string, v: string) => void;
  className?: string; style?: React.CSSProperties;
}) {
  return (
    <div className={cx('rounded-xl border p-3 text-center', className)} style={style}>
      <div className="text-[11px] font-bold text-current mb-1 uppercase tracking-wide">{label}</div>
      <textarea
        value={fields[fieldKey] || ''}
        onChange={e => onChange(fieldKey, e.target.value)}
        className="w-full bg-transparent border-none outline-none resize-none text-xs text-center leading-relaxed min-h-[40px]"
        placeholder="…"
      />
    </div>
  );
}

// ─── Sosyal Kaygı — SVG diagram (Clark & Wells 1995) ─────────────────────────
function SosyalKaygiDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  // SVG coordinate system
  const W = 720, H = 760;

  // Box definitions: { x, y, w, h }
  // All boxes are horizontally centred at cx=360
  const A = { x: 228, y: 22,  w: 264, h: 74  }; // Sosyal Durum       — oval
  const B = { x: 210, y: 144, w: 300, h: 72  }; // Varsayımlar        — rect
  const C = { x: 195, y: 264, w: 330, h: 82  }; // Sosyal Tehdit      — rect
  const D = { x: 186, y: 406, w: 348, h: 88  }; // İşlemleme (teal)   — oval
  const E = { x: 28,  y: 572, w: 236, h: 80  }; // Güvenlik           — rect
  const F = { x: 456, y: 572, w: 236, h: 80  }; // Semptomlar         — rect

  const cx = (b: typeof A) => b.x + b.w / 2;
  const cy = (b: typeof A) => b.y + b.h / 2;

  // Inline style shorthand for textarea nodes
  const taStyle = (color = '#374151'): React.CSSProperties => ({
    width: '100%', background: 'transparent', border: 'none', outline: 'none',
    resize: 'none', fontSize: 9, textAlign: 'center', lineHeight: 1.4,
    minHeight: 28, color, fontFamily: 'inherit',
  });
  const labelStyle = (color = '#374151'): React.CSSProperties => ({
    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color, marginBottom: 2, lineHeight: 1.2,
  });
  const foInner: React.CSSProperties = {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', height: '100%',
  };

  return (
    <div className="overflow-x-auto -mx-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 720 }}>
        <defs>
          {/* Grey arrowhead */}
          <marker id="sk-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
          </marker>
          {/* Dark arrowhead for feedback loops */}
          <marker id="sk-ad" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
          </marker>
        </defs>

        {/* ── Arrows (drawn behind boxes) ─────────────────────────────── */}

        {/* A → B  (vertical centre) */}
        <line x1={cx(A)} y1={A.y+A.h} x2={cx(B)} y2={B.y}
          stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#sk-a)" />

        {/* B → C */}
        <line x1={cx(B)} y1={B.y+B.h} x2={cx(C)} y2={C.y}
          stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#sk-a)" />

        {/* C → D  (left lane, downward) */}
        <line x1={cx(C)-18} y1={C.y+C.h} x2={cx(D)-18} y2={D.y}
          stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#sk-a)" />

        {/* D → C  (right lane, upward) */}
        <line x1={cx(D)+18} y1={D.y} x2={cx(C)+18} y2={C.y+C.h}
          stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#sk-a)" />

        {/* D → E  (diagonal bottom-left) */}
        <line
          x1={D.x + 80} y1={D.y+D.h}
          x2={cx(E)}     y2={E.y}
          stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#sk-a)" />

        {/* D → F  (diagonal bottom-right) */}
        <line
          x1={D.x+D.w - 80} y1={D.y+D.h}
          x2={cx(F)}         y2={F.y}
          stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#sk-a)" />

        {/* E → F  (horizontal, mid-height of boxes) */}
        <line x1={E.x+E.w} y1={cy(E)} x2={F.x} y2={cy(F)}
          stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#sk-a)" />

        {/* Left feedback loop (solid): E.left → wall → A.left */}
        <path
          d={`M ${E.x},${cy(E)} L 10,${cy(E)} L 10,${cy(A)} L ${A.x},${cy(A)}`}
          fill="none" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#sk-ad)" />

        {/* Right feedback loop (dashed): F.right → wall → A.right */}
        <path
          d={`M ${F.x+F.w},${cy(F)} L ${W-10},${cy(F)} L ${W-10},${cy(A)} L ${A.x+A.w},${cy(A)}`}
          fill="none" stroke="#6b7280" strokeWidth="1.5"
          strokeDasharray="6,4" markerEnd="url(#sk-ad)" />

        {/* ── Boxes (drawn on top of arrows) ──────────────────────────── */}

        {/* A: Sosyal Durum — pill shape */}
        <rect x={A.x} y={A.y} width={A.w} height={A.h} rx="37"
          fill="white" stroke="#9ca3af" strokeWidth="1.5" />
        <foreignObject x={A.x+10} y={A.y+6} width={A.w-20} height={A.h-12}>
          <div style={foInner}>
            <div style={labelStyle()}>Sosyal Durum</div>
            <textarea value={fields['sa_situation']||''} onChange={e=>onChange('sa_situation',e.target.value)}
              style={taStyle()} placeholder="Durumu belirtin…" />
          </div>
        </foreignObject>

        {/* B: Varsayımlar */}
        <rect x={B.x} y={B.y} width={B.w} height={B.h} rx="8"
          fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1.5" />
        <foreignObject x={B.x+10} y={B.y+6} width={B.w-20} height={B.h-12}>
          <div style={foInner}>
            <div style={labelStyle()}>Varsayımların Aktivasyonu</div>
            <textarea value={fields['sa_assumptions']||''} onChange={e=>onChange('sa_assumptions',e.target.value)}
              style={taStyle()} placeholder="Etkinleşen erken dönem varsayımlar…" />
          </div>
        </foreignObject>

        {/* C: Sosyal Tehdit */}
        <rect x={C.x} y={C.y} width={C.w} height={C.h} rx="8"
          fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1.5" />
        <foreignObject x={C.x+10} y={C.y+6} width={C.w-20} height={C.h-12}>
          <div style={foInner}>
            <div style={labelStyle()}>Sosyal Tehdit Algısı</div>
            <div style={{ fontSize:8, color:'#6b7280', marginBottom:2 }}>(Olumsuz Otomatik Düşünceler)</div>
            <textarea value={fields['sa_threat']||''} onChange={e=>onChange('sa_threat',e.target.value)}
              style={taStyle()} placeholder="Otomatik düşünceler…" />
          </div>
        </foreignObject>

        {/* D: Kendini İşlemleme — teal pill */}
        <rect x={D.x} y={D.y} width={D.w} height={D.h} rx="44"
          fill="#f0fdfa" stroke="#0d9488" strokeWidth="2" />
        <foreignObject x={D.x+14} y={D.y+8} width={D.w-28} height={D.h-16}>
          <div style={foInner}>
            <div style={labelStyle('#0f766e')}>Kendini Sosyal Nesne Olarak İşlemleme</div>
            <textarea value={fields['sa_processing']||''} onChange={e=>onChange('sa_processing',e.target.value)}
              style={taStyle('#0f766e')} placeholder="İçeriden izleme, imaj, kendini değerlendirme…" />
          </div>
        </foreignObject>

        {/* E: Güvenlik Davranışları */}
        <rect x={E.x} y={E.y} width={E.w} height={E.h} rx="8"
          fill="white" stroke="#9ca3af" strokeWidth="1.5" />
        <foreignObject x={E.x+8} y={E.y+6} width={E.w-16} height={E.h-12}>
          <div style={foInner}>
            <div style={labelStyle()}>Güvenlik Arama Davranışları</div>
            <textarea value={fields['sa_safety']||''} onChange={e=>onChange('sa_safety',e.target.value)}
              style={taStyle()} placeholder="Kaçınma, güvenlik sinyalleri…" />
          </div>
        </foreignObject>

        {/* F: Somatik & Bilişsel Semptomlar */}
        <rect x={F.x} y={F.y} width={F.w} height={F.h} rx="8"
          fill="white" stroke="#9ca3af" strokeWidth="1.5" />
        <foreignObject x={F.x+8} y={F.y+6} width={F.w-16} height={F.h-12}>
          <div style={foInner}>
            <div style={labelStyle()}>Somatik & Bilişsel Semptomlar</div>
            <textarea value={fields['sa_symptoms']||''} onChange={e=>onChange('sa_symptoms',e.target.value)}
              style={taStyle()} placeholder="Titreme, yüz kızarması, boş zihin…" />
          </div>
        </foreignObject>

      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">
        Clark &amp; Wells (1995) — Sosyal Kaygı BDT Modeli
      </p>
    </div>
  );
}

// OKB
function OkbDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto py-4 space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <EditableNode label="Kaçınma" fieldKey="ocd_avoidance" fields={fields} onChange={onChange}
          className="w-48 border-blue-400 bg-blue-50 text-blue-800"
        />
        <div className="flex items-center gap-2 mt-3">
          <span className="text-gray-400 text-lg">→</span>
          <EditableNode label="Dış / İç Dünya" fieldKey="ocd_world" fields={fields} onChange={onChange}
            className="w-36 border-gray-200 bg-gray-50"
          />
          <span className="text-gray-400 text-lg">→</span>
          <EditableNode label="Dikkat" fieldKey="ocd_attention" fields={fields} onChange={onChange}
            className="w-28 border-gray-200 bg-gray-50"
          />
          <span className="text-gray-400 text-lg">→</span>
        </div>
        <EditableNode label="Tetikleyici (İç/Dış Uyaranlar)" fieldKey="ocd_trigger" fields={fields} onChange={onChange}
          className="w-48 border-red-400 bg-red-50 text-red-800"
        />
      </div>
      {/* Middle row */}
      <div className="flex items-stretch justify-between gap-3">
        <div className="w-48 flex flex-col gap-2 items-center">
          <span className="text-gray-400">↑</span>
          <EditableNode label="Sıkıntı" fieldKey="ocd_distress_left" fields={fields} onChange={onChange}
            className="w-full border-gray-300 bg-white"
          />
          <span className="text-xs text-gray-500 font-semibold">↑ Yorgunluk ↑</span>
          <EditableNode label="Nötralizasyonla İlgili Değerlendirme" fieldKey="ocd_neut_appraisal" fields={fields} onChange={onChange}
            className="w-full border-gray-200 bg-gray-50"
          />
          <span className="text-gray-400">↑</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EditableNode label="Düşünce Baskılama" fieldKey="ocd_suppression" fields={fields} onChange={onChange}
            className="w-64 border-red-300 bg-red-50 text-red-900"
            style={{ borderStyle: 'dashed' }}
          />
        </div>
        <div className="w-48 flex flex-col gap-2 items-center">
          <span className="text-gray-400">↓</span>
          <EditableNode label="Tehlike Algısı (Obsesyon)" fieldKey="ocd_obsession" fields={fields} onChange={onChange}
            className="w-full border-indigo-400 bg-indigo-50 text-indigo-900"
          />
          <span className="text-gray-400">↓</span>
          <EditableNode label="İkincil Değerlendirme" fieldKey="ocd_sec_appraisal" fields={fields} onChange={onChange}
            className="w-full border-gray-200 bg-gray-50"
          />
          <span className="text-gray-400">↓</span>
          <EditableNode label="Sıkıntı" fieldKey="ocd_distress_right" fields={fields} onChange={onChange}
            className="w-full border-red-400 bg-red-50 text-red-800"
          />
          <span className="text-gray-400">↓</span>
        </div>
      </div>
      {/* Bottom row */}
      <div className="flex items-center justify-center gap-4">
        <EditableNode label="Rahatlama" fieldKey="ocd_relief" fields={fields} onChange={onChange}
          className="w-44 border-green-400 bg-green-50 text-green-900"
        />
        <span className="text-gray-400 text-xl">←</span>
        <EditableNode label="Nötralizasyon — Kompülsiyon" fieldKey="ocd_compulsion" fields={fields} onChange={onChange}
          className="w-52 border-blue-400 bg-blue-50 text-blue-900"
        />
      </div>
    </div>
  );
}

// Depresyon Gelişimsel
function DepresyonGelisimselDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const arrowStyle = 'text-center text-green-600 text-xl font-bold';
  return (
    <div className="max-w-lg mx-auto py-4 flex flex-col gap-3 items-stretch">
      <EditableNode label="Erken Yaşantılar" fieldKey="gen_early_exp" fields={fields} onChange={onChange}
        className="border-green-500 bg-green-50 text-green-900"
      />
      <div className={arrowStyle}>↓</div>
      <EditableNode label="İşlevsel Olmayan İnançlar (Temel + Ara İnançlar)" fieldKey="gen_core_beliefs" fields={fields} onChange={onChange}
        className="border-green-500 bg-green-50 text-green-900"
      />
      <div className={arrowStyle}>↓</div>
      <EditableNode label="Kritik Olaylar" fieldKey="gen_critical_incidents" fields={fields} onChange={onChange}
        className="border-green-500 bg-green-50 text-green-900"
      />
      <div className={arrowStyle}>↓</div>
      <EditableNode label="Olumsuz Otomatik Düşünceler" fieldKey="gen_negative_thoughts" fields={fields} onChange={onChange}
        className="border-green-500 bg-green-50 text-green-900"
      />
      <div className={arrowStyle}>↓</div>
      <EditableNode label="Belirtiler (Davranışsal, Bilişsel, Duygusal, Somatik)" fieldKey="gen_symptoms" fields={fields} onChange={onChange}
        className="border-green-500 bg-green-50 text-green-900"
      />
    </div>
  );
}

// Depresyon Döngüsü
function DepresyonDonguDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  return (
    <div className="max-w-2xl mx-auto py-8 relative">
      <div className="flex justify-center gap-16 mb-6">
        <EditableNode label="Fizyoloji" fieldKey="dep_physiology" fields={fields} onChange={onChange}
          className="w-40 border-orange-300 bg-orange-50 text-orange-900"
        />
        <EditableNode label="Duygu" fieldKey="dep_emotion" fields={fields} onChange={onChange}
          className="w-40 border-orange-300 bg-orange-50 text-orange-900"
        />
      </div>
      <div className="flex items-center justify-between mb-6">
        <EditableNode label="Çevre" fieldKey="dep_environment" fields={fields} onChange={onChange}
          className="w-40 border-orange-300 bg-orange-50 text-orange-900"
        />
        <div className="w-32 h-32 rounded-full bg-orange-500 flex items-center justify-center shadow-lg text-white font-bold text-base text-center">Depresyon</div>
        <EditableNode label="Biliş" fieldKey="dep_cognition" fields={fields} onChange={onChange}
          className="w-40 border-orange-300 bg-orange-50 text-orange-900"
        />
      </div>
      <div className="flex justify-center">
        <EditableNode label="Davranış" fieldKey="dep_behavior" fields={fields} onChange={onChange}
          className="w-40 border-orange-300 bg-orange-50 text-orange-900"
        />
      </div>
      <div className="mt-4 text-xs text-gray-400 text-center italic">Döngüdeki beş bileşen birbirini karşılıklı besler.</div>
    </div>
  );
}

// Panik Döngüsü — SVG (Clark 1986)
function PanikDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 720, H = 660;

  // ── Box definitions ────────────────────────────────────────────────────────
  const A = { x: 220, y: 18,  w: 280, h: 58  }; // Tetikleyici   — oval, cyan
  const B = { x: 200, y: 128, w: 320, h: 62  }; // Otomatik Düşünce
  const C = { x: 200, y: 248, w: 320, h: 62  }; // Duygu
  const D = { x: 175, y: 370, w: 370, h: 68  }; // Bedensel Duyumlar — red
  const E = { x: 155, y: 500, w: 410, h: 74  }; // Katastrofik Yorumlama — amber pill

  // ANS annotation box (right side, beside D)
  const ANS = { x: 556, y: 355, w: 154, h: 82 };

  const bCx = (b: typeof A) => b.x + b.w / 2;
  const bCy = (b: typeof A) => b.y + b.h / 2;

  const foInner: React.CSSProperties = {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', height: '100%',
  };
  const lbl = (color = '#374151', size = 8.5): React.CSSProperties => ({
    fontSize: size, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color, marginBottom: 2, lineHeight: 1.2, textAlign: 'center',
  });
  const ta = (color = '#374151'): React.CSSProperties => ({
    width: '100%', background: 'transparent', border: 'none', outline: 'none',
    resize: 'none', fontSize: 8.5, textAlign: 'center', lineHeight: 1.4,
    minHeight: 26, color, fontFamily: 'inherit',
  });

  // Right-side feedback wall x-coordinates (staggered so they don't overlap)
  const wallC = W - 12;   // outer wall for E→C (long loop)
  const wallD = W - 30;   // inner wall for E→D (short loop)

  return (
    <div className="overflow-x-auto -mx-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 720 }}>
        <defs>
          {/* Standard grey arrow */}
          <marker id="pk-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
          </marker>
          {/* Red feedback arrow */}
          <marker id="pk-r" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
          </marker>
          {/* Amber/orange arrow for E→C */}
          <marker id="pk-o" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
          </marker>
        </defs>

        {/* ── Forward arrows (drawn first, behind boxes) ───────────────────── */}

        {/* A → B */}
        <line x1={bCx(A)} y1={A.y+A.h} x2={bCx(B)} y2={B.y}
          stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#pk-a)" />
        {/* B → C */}
        <line x1={bCx(B)} y1={B.y+B.h} x2={bCx(C)} y2={C.y}
          stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#pk-a)" />
        {/* C → D */}
        <line x1={bCx(C)} y1={C.y+C.h} x2={bCx(D)} y2={D.y}
          stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#pk-a)" />
        {/* D → E */}
        <line x1={bCx(D)} y1={D.y+D.h} x2={bCx(E)} y2={E.y}
          stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#pk-a)" />

        {/* ANS dashed connector: ANS.left ↔ D.right */}
        <line
          x1={D.x+D.w} y1={bCy(D)}
          x2={ANS.x}   y2={bCy(ANS)}
          stroke="#f97316" strokeWidth="1.2" strokeDasharray="4,3" />

        {/* ── Feedback arrows: E → D and E → C (right-side loops) ─────────── */}

        {/* E → D  (short right-side loop, red solid) */}
        <path
          d={`M ${E.x+E.w},${bCy(E)}
              L ${wallD},${bCy(E)}
              L ${wallD},${bCy(D)}
              L ${D.x+D.w},${bCy(D)}`}
          fill="none" stroke="#ef4444" strokeWidth="1.8" markerEnd="url(#pk-r)" />

        {/* E → C  (long right-side loop, orange dashed) */}
        <path
          d={`M ${E.x+E.w},${bCy(E)+10}
              L ${wallC},${bCy(E)+10}
              L ${wallC},${bCy(C)}
              L ${C.x+C.w},${bCy(C)}`}
          fill="none" stroke="#f97316" strokeWidth="1.8"
          strokeDasharray="5,3" markerEnd="url(#pk-o)" />

        {/* ── ANS annotation box ──────────────────────────────────────────── */}
        <rect x={ANS.x} y={ANS.y} width={ANS.w} height={ANS.h} rx="10"
          fill="#fff7ed" stroke="#fed7aa" strokeWidth="1.5" />
        <foreignObject x={ANS.x+6} y={ANS.y+6} width={ANS.w-12} height={ANS.h-12}>
          <div style={{ ...foInner, gap: 3 }}>
            <div style={{ fontSize: 14, lineHeight: 1 }}>⚡</div>
            <div style={{ fontSize: 7.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c2410c', textAlign: 'center', lineHeight: 1.25 }}>
              Savaş-Kaç-Don
            </div>
            <div style={{ fontSize: 7, color: '#9a3412', textAlign: 'center', lineHeight: 1.3 }}>
              Sempatik sinir sistemi aktivasyonu — ANS
            </div>
          </div>
        </foreignObject>

        {/* ── Nodes (drawn on top of arrows) ──────────────────────────────── */}

        {/* A: Tetikleyici — cyan oval */}
        <rect x={A.x} y={A.y} width={A.w} height={A.h} rx="29"
          fill="#ecfeff" stroke="#22d3ee" strokeWidth="1.8" />
        <foreignObject x={A.x+10} y={A.y+6} width={A.w-20} height={A.h-12}>
          <div style={foInner}>
            <div style={lbl('#164e63')}>Spontan Tetikleyici</div>
            <textarea value={fields['panic_trigger']||''} onChange={e=>onChange('panic_trigger',e.target.value)}
              style={ta('#0e7490')} placeholder="İç / dış uyaran (kalp çarpıntısı, stres…)" />
          </div>
        </foreignObject>

        {/* B: Otomatik Düşünce */}
        <rect x={B.x} y={B.y} width={B.w} height={B.h} rx="8"
          fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1.5" />
        <foreignObject x={B.x+10} y={B.y+6} width={B.w-20} height={B.h-12}>
          <div style={foInner}>
            <div style={lbl()}>Otomatik Düşünce</div>
            <textarea value={fields['panic_thought']||''} onChange={e=>onChange('panic_thought',e.target.value)}
              style={ta()} placeholder='"Öleceğim / delireceğim / kontrolümü kaybediyorum"' />
          </div>
        </foreignObject>

        {/* C: Duygu */}
        <rect x={C.x} y={C.y} width={C.w} height={C.h} rx="8"
          fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1.5" />
        <foreignObject x={C.x+10} y={C.y+6} width={C.w-20} height={C.h-12}>
          <div style={foInner}>
            <div style={lbl()}>Duygu</div>
            <textarea value={fields['panic_emotion']||''} onChange={e=>onChange('panic_emotion',e.target.value)}
              style={ta()} placeholder="Yoğun korku, panik, çaresizlik…" />
          </div>
        </foreignObject>

        {/* D: Bedensel Duyumlar — red */}
        <rect x={D.x} y={D.y} width={D.w} height={D.h} rx="8"
          fill="#fff1f2" stroke="#fca5a5" strokeWidth="1.8" />
        <foreignObject x={D.x+10} y={D.y+6} width={D.w-20} height={D.h-12}>
          <div style={foInner}>
            <div style={lbl('#991b1b')}>Bedensel Duyumlar</div>
            <textarea value={fields['panic_body']||''} onChange={e=>onChange('panic_body',e.target.value)}
              style={ta('#b91c1c')} placeholder="Çarpıntı, nefes darlığı, uyuşma, baş dönmesi…" />
          </div>
        </foreignObject>

        {/* E: Katastrofik Yorumlama — amber pill */}
        <rect x={E.x} y={E.y} width={E.w} height={E.h} rx="37"
          fill="#fffbeb" stroke="#fbbf24" strokeWidth="2" />
        <foreignObject x={E.x+16} y={E.y+8} width={E.w-32} height={E.h-16}>
          <div style={foInner}>
            <div style={lbl('#92400e', 9)}>Katastrofik Yorumlama</div>
            <div style={{ fontSize: 7.5, color: '#b45309', marginBottom: 3, fontStyle: 'italic' }}>(felaketleştirme)</div>
            <textarea value={fields['panic_catastrophe']||''} onChange={e=>onChange('panic_catastrophe',e.target.value)}
              style={ta('#78350f')} placeholder='"Bu kalp krizi" / "Bayılacağım" / "Herkes görecek"…' />
          </div>
        </foreignObject>

      </svg>

      {/* Bottom legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#9ca3af" strokeWidth="1.5" markerEnd="none" /></svg>
          İleri döngü
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#ef4444" strokeWidth="1.8" /></svg>
          Felaketleştirme → Bedensel
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#f97316" strokeWidth="1.8" strokeDasharray="4,2" /></svg>
          Felaketleştirme → Duygu
        </span>
        <span className="flex items-center gap-1.5">
          <span>⚡</span>
          Savaş-Kaç-Don: ANS aktivasyonu ile bedensel tepkileri güçlendirir
        </span>
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">
        Clark (1986) — Panik Bozukluğu Bilişsel Modeli
      </p>
    </div>
  );
}

// ─── Çocuk Depresyon — Pentagon circular (5 coloured circles) ────────────────
function CocukDepresyonDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 720, H = 600, r = 66;
  const nodes = [
    { cx: 360, cy: 112, fill: '#fed7aa', stroke: '#f97316', key: 'cd_dep',  lines: ['Depresyon'],                                        tc: '#7c2d12' },
    { cx: 534, cy: 252, fill: '#e5e7eb', stroke: '#6b7280', key: 'cd_enrj', lines: ['Düşük Enerji', 'Yorgunluk', 'Düşük Motivasyon'],    tc: '#374151' },
    { cx: 468, cy: 456, fill: '#fef08a', stroke: '#ca8a04', key: 'cd_dnc',  lines: ['Olumsuz Düşünce', '/ İnançlar'],                   tc: '#713f12' },
    { cx: 252, cy: 456, fill: '#bfdbfe', stroke: '#3b82f6', key: 'cd_cklm', lines: ['Sosyal Çekilme', 'Kış Uykusu', 'Düşük Aktivasyon'], tc: '#1e3a8a' },
    { cx: 186, cy: 252, fill: '#bbf7d0', stroke: '#16a34a', key: 'cd_uznt', lines: ['Üzüntü', 'Suçluluk', 'Umutsuzluk'],               tc: '#14532d' },
  ];
  const arrowCols = ['#f97316', '#6b7280', '#ca8a04', '#3b82f6', '#16a34a'];
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 720 }}>
        <defs>
          {arrowCols.map((c, i) => (
            <marker key={i} id={`cda-${i}`} markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <polygon points="0 0, 9 3.5, 0 7" fill={c} />
            </marker>
          ))}
        </defs>
        {/* Arrows behind circles */}
        {nodes.map((src, i) => {
          const dst = nodes[(i + 1) % nodes.length];
          const dx = dst.cx - src.cx, dy = dst.cy - src.cy;
          const len = Math.sqrt(dx*dx + dy*dy);
          const ux = dx/len, uy = dy/len;
          return <line key={i}
            x1={src.cx + r*ux} y1={src.cy + r*uy}
            x2={dst.cx - (r+10)*ux} y2={dst.cy - (r+10)*uy}
            stroke={arrowCols[i]} strokeWidth="4" markerEnd={`url(#cda-${i})`} />;
        })}
        {/* Circles */}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.cx} cy={n.cy} r={r} fill={n.fill} stroke={n.stroke} strokeWidth="2.5" />
            <foreignObject x={n.cx-r+10} y={n.cy-r+8} width={(r-10)*2} height={(r-8)*2}>
              <div style={fi}>
                {n.lines.map((l, j) => <div key={j} style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:n.tc, textAlign:'center', lineHeight:1.3 }}>{l}</div>)}
                <textarea value={fields[n.key]||''} onChange={e=>onChange(n.key,e.target.value)}
                  style={{ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8, textAlign:'center', lineHeight:1.3, color:n.tc, fontFamily:'inherit', minHeight:16 }}
                  placeholder="…" />
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Depresyonun İnaktivasyon Kısır Döngüsü</p>
    </div>
  );
}

// ─── AKB — Üç kutu (Çocuk + Ebeveyn → Sonuçlar) ─────────────────────────────
function AkbDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 700, H = 480;
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', height:'100%' };
  const lbl = (c: string): React.CSSProperties => ({ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', color:c, marginBottom:4, textDecoration:'underline' });
  const ta = (c: string): React.CSSProperties => ({ width:'100%', flex:1, background:'transparent', border:'none', outline:'none', resize:'none', fontSize:9, lineHeight:1.5, color:c, fontFamily:'inherit' });
  // Boxes
  const child  = { x:20,  y:20, w:260, h:200 };
  const parent = { x:420, y:20, w:260, h:200 };
  const result = { x:165, y:295, w:370, h:165 };
  // Arrow points: bottom-center of child/parent → top of result
  const cBotX = child.x  + child.w/2,  cBotY = child.y  + child.h;
  const pBotX = parent.x + parent.w/2, pBotY = parent.y + parent.h;
  const rTopL = result.x + result.w*0.3, rTopR = result.x + result.w*0.7, rTopY = result.y;
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 700 }}>
        <defs>
          <marker id="akb-r" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <polygon points="0 0, 10 4, 0 8" fill="#dc2626" />
          </marker>
        </defs>
        {/* Arrows */}
        <line x1={cBotX} y1={cBotY} x2={rTopL} y2={rTopY} stroke="#dc2626" strokeWidth="10" markerEnd="url(#akb-r)" />
        <line x1={pBotX} y1={pBotY} x2={rTopR} y2={rTopY} stroke="#dc2626" strokeWidth="10" markerEnd="url(#akb-r)" />
        {/* Çocuk box */}
        <rect x={child.x}  y={child.y}  width={child.w}  height={child.h}  rx="6" fill="#f5f0e8" stroke="#3b82f6" strokeWidth="2" />
        <foreignObject x={child.x+10} y={child.y+8} width={child.w-20} height={child.h-16}>
          <div style={fi}>
            <div style={lbl('#dc2626')}>Çocuk</div>
            <textarea value={fields['akb_cocuk']||''} onChange={e=>onChange('akb_cocuk',e.target.value)}
              style={ta('#dc2626')} placeholder={'Aşırı talepkâr\nBunaltıcı\nTatminsiz\nKolayca yatıştırılamaz'} />
          </div>
        </foreignObject>
        {/* Ebeveyn box */}
        <rect x={parent.x} y={parent.y} width={parent.w} height={parent.h} rx="6" fill="#f5f0e8" stroke="#3b82f6" strokeWidth="2" />
        <foreignObject x={parent.x+10} y={parent.y+8} width={parent.w-20} height={parent.h-16}>
          <div style={fi}>
            <div style={lbl('#dc2626')}>Ebeveyn</div>
            <textarea value={fields['akb_ebeveyn']||''} onChange={e=>onChange('akb_ebeveyn',e.target.value)}
              style={ta('#dc2626')} placeholder={'Aşırı düşkün\nAşırı koruyucu\nTutarsız\nAyrı ebeveyn tutumları'} />
          </div>
        </foreignObject>
        {/* Sonuçlar box */}
        <rect x={result.x} y={result.y} width={result.w} height={result.h} rx="6" fill="#f5f0e8" stroke="#3b82f6" strokeWidth="2" />
        <foreignObject x={result.x+10} y={result.y+8} width={result.w-20} height={result.h-16}>
          <div style={fi}>
            <div style={lbl('#dc2626')}>Sonuçlar</div>
            <textarea value={fields['akb_sonuc']||''} onChange={e=>onChange('akb_sonuc',e.target.value)}
              style={ta('#dc2626')} placeholder={'Öfke patlamaları · Şiddet\nÇatışma · Suçluluk\nSorunlar devam eder'} />
          </div>
        </foreignObject>
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Ayrılık Kaygısı Bozukluğu (AKB) — Çocuk-Ebeveyn Etkileşim Modeli</p>
    </div>
  );
}

// ─── Anksiyete Formülü — Matematiksel görsel ─────────────────────────────────
function AnksiyeteFormulDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 680, H = 290;
  const box: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const blbl: React.CSSProperties = { fontSize:8.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#1c1917', marginBottom:2, textAlign:'center' };
  const bta: React.CSSProperties = { width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8.5, textAlign:'center', lineHeight:1.4, color:'#292524', fontFamily:'inherit', minHeight:22 };
  return (
    <div className="overflow-x-auto rounded-2xl" style={{ background:'#f59e0b' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 680 }}>
        {/* Background */}
        <rect x="0" y="0" width={W} height={H} fill="#f59e0b" />
        {/* "Anksiyete" rotated label */}
        <text x="42" y="185" fontSize="15" fontWeight="800" fill="white"
          transform="rotate(-90 42 185)" textAnchor="middle" letterSpacing="2">ANKSİYETE</text>
        {/* "=" sign */}
        <text x="115" y="160" fontSize="32" fontWeight="300" fill="white" textAnchor="middle">=</text>
        {/* Fraction bar */}
        <line x1="132" y1="148" x2="650" y2="148" stroke="black" strokeWidth="3" />
        {/* × symbol */}
        <text x="350" y="118" fontSize="22" fontWeight="700" fill="black" textAnchor="middle">×</text>
        {/* + symbol */}
        <text x="350" y="225" fontSize="22" fontWeight="700" fill="black" textAnchor="middle">+</text>
        {/* Numerator boxes */}
        <rect x="140" y="35" width="190" height="100" rx="4" fill="white" />
        <foreignObject x="140" y="35" width="190" height="100">
          <div style={box}>
            <div style={blbl}>Tehlikenin Büyüklüğü</div>
            <textarea value={fields['ank_buyukluk']||''} onChange={e=>onChange('ank_buyukluk',e.target.value)}
              style={bta} placeholder="Tehdidin algılanan şiddeti…" />
          </div>
        </foreignObject>
        <rect x="370" y="35" width="270" height="100" rx="4" fill="white" />
        <foreignObject x="370" y="35" width="270" height="100">
          <div style={box}>
            <div style={blbl}>Tehlikenin Olasılığı</div>
            <textarea value={fields['ank_olasilik']||''} onChange={e=>onChange('ank_olasilik',e.target.value)}
              style={bta} placeholder="Tehdidin gerçekleşme olasılığı…" />
          </div>
        </foreignObject>
        {/* Denominator boxes */}
        <rect x="140" y="158" width="190" height="100" rx="4" fill="white" />
        <foreignObject x="140" y="158" width="190" height="100">
          <div style={box}>
            <div style={blbl}>Başa Çıkma Becerisi</div>
            <textarea value={fields['ank_bascikma']||''} onChange={e=>onChange('ank_bascikma',e.target.value)}
              style={bta} placeholder="Danışanın kaynakları…" />
          </div>
        </foreignObject>
        <rect x="370" y="158" width="270" height="100" rx="4" fill="white" />
        <foreignObject x="370" y="158" width="270" height="100">
          <div style={box}>
            <div style={blbl}>İmkânlar / Destek</div>
            <textarea value={fields['ank_imkan']||''} onChange={e=>onChange('ank_imkan',e.target.value)}
              style={bta} placeholder="Sosyal destek, çevre…" />
          </div>
        </foreignObject>
      </svg>
      <p className="text-[10px] text-center pb-2 italic" style={{ color:'rgba(255,255,255,0.7)' }}>
        Anksiyete = (Tehlikenin Büyüklüğü × Olasılığı) / (Başa Çıkma + İmkânlar)
      </p>
    </div>
  );
}

// ─── Özgül Fobi Modeli — Dikey akış (Davis, Ollendick & Öst) ─────────────────
function OzgulFobiDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const svgW = 680, svgH = 730;
  type Bx = { x:number; y:number; w:number; h:number; rx?:number };
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const lbl = (c='#1f2937'): React.CSSProperties => ({ fontSize:8.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:c, marginBottom:2, textAlign:'center', lineHeight:1.3 });
  const ta = (c='#374151'): React.CSSProperties => ({ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8.5, textAlign:'center', lineHeight:1.4, color:c, fontFamily:'inherit', minHeight:20 });

  // Main column boxes (center)
  const nA: Bx = { x:200, y:15,  w:280, h:52 }; // Tehlikeli nesne/durum
  const nB: Bx = { x:16,  y:15,  w:145, h:52 }; // Kaçınma (left)
  const nC: Bx = { x:200, y:120, w:280, h:52 }; // Fobik nesne ile karşılaşma
  const nD: Bx = { x:144, y:236, w:172, h:52 }; // Felaket düşünceleri (left branch)
  const nE: Bx = { x:362, y:236, w:172, h:52 }; // Fiziksel uyarılma (right branch)
  const nF: Bx = { x:10,  y:225, w:112, h:74, rx:37 }; // Güçlü inanma (oval)
  const nG: Bx = { x:172, y:353, w:310, h:52 }; // Kaçma / güvenlik davranışları
  const nH: Bx = { x:502, y:342, w:162, h:74, rx:37 }; // Çürütme engellenir (oval)
  const nI: Bx = { x:172, y:462, w:310, h:52 }; // Felaket oluşmaz
  const nJ: Bx = { x:172, y:572, w:310, h:60 }; // Çıkarılan sonuç
  const nK: Bx = { x:172, y:688, w:310, h:52 }; // Fobi devam ediyor

  const bCx = (b: Bx) => b.x + b.w/2;
  const bCy = (b: Bx) => b.y + b.h/2;

  // Node renderer (rect)
  const Node = ({ b, fkey, title, placeholder, fill='#f9fafb', stroke='#9ca3af', tc='#374151' }:
    { b: Bx; fkey: string; title: string; placeholder: string; fill?: string; stroke?: string; tc?: string }) => (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.rx ?? 8} fill={fill} stroke={stroke} strokeWidth="1.5" />
      <foreignObject x={b.x+8} y={b.y+4} width={b.w-16} height={b.h-8}>
        <div style={fi}><div style={lbl(tc)}>{title}</div>
          <textarea value={fields[fkey]||''} onChange={e=>onChange(fkey,e.target.value)} style={ta(tc)} placeholder={placeholder} />
        </div>
      </foreignObject>
    </g>
  );

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full mx-auto" style={{ maxWidth: 680 }}>
        <defs>
          <marker id="of-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
          </marker>
        </defs>

        {/* Arrows (drawn first) */}
        <line x1={nA.x}        y1={bCy(nA)} x2={nB.x+nB.w+8}   y2={bCy(nB)} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#of-a)" />
        <line x1={bCx(nA)}     y1={nA.y+nA.h} x2={bCx(nC)}     y2={nC.y}   stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#of-a)" />
        <line x1={bCx(nC)-20}  y1={nC.y+nC.h} x2={bCx(nD)+10}  y2={nD.y}   stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#of-a)" />
        <line x1={bCx(nC)+20}  y1={nC.y+nC.h} x2={bCx(nE)-10}  y2={nE.y}   stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#of-a)" />
        <line x1={nD.x}        y1={bCy(nD)} x2={nF.x+nF.w+8}   y2={bCy(nF)} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#of-a)" />
        <line x1={bCx(nD)}     y1={nD.y+nD.h} x2={bCx(nG)-40}  y2={nG.y}   stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#of-a)" />
        <line x1={bCx(nE)}     y1={nE.y+nE.h} x2={bCx(nG)+40}  y2={nG.y}   stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#of-a)" />
        <line x1={nG.x+nG.w+8} y1={bCy(nG)} x2={nH.x}          y2={bCy(nH)} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#of-a)" />
        <line x1={bCx(nG)}     y1={nG.y+nG.h} x2={bCx(nI)}     y2={nI.y}   stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#of-a)" />
        <line x1={bCx(nI)}     y1={nI.y+nI.h} x2={bCx(nJ)}     y2={nJ.y}   stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#of-a)" />
        <line x1={bCx(nJ)}     y1={nJ.y+nJ.h} x2={bCx(nK)}     y2={nK.y}   stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#of-a)" />
        <path d={`M ${nH.x+nH.w},${bCy(nH)} L 660,${bCy(nH)} L 660,${bCy(nK)} L ${nK.x+nK.w},${bCy(nK)}`}
          fill="none" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#of-a)" />

        {/* Nodes */}
        <Node b={nA} fkey="of_nesne"      title="Tehlikeli Algılanan Nesne / Durum"            placeholder="Fobi nesnesi veya durumu…"              fill="white"    stroke="#9ca3af" />
        <Node b={nB} fkey="of_kacinma"    title="Kaçınma"                                      placeholder="Kaçınma davranışları…"                   fill="#f0fdf4"  stroke="#4ade80"  tc="#15803d" />
        <Node b={nC} fkey="of_karsilasma" title="Fobik Nesne ile Karşılaşma"                   placeholder="Kaçma mümkün değil…"                     fill="white"    stroke="#9ca3af" />
        <Node b={nD} fkey="of_felaket"    title="Felaket Düşünceleri"                          placeholder='"Saldıracak / Öleceğim"…'               fill="#fef2f2"  stroke="#fca5a5"  tc="#991b1b" />
        <Node b={nE} fkey="of_fiziksel"   title="Fiziksel Uyarılma"                            placeholder="Çarpıntı, terleme…"                      fill="#f0fdf4"  stroke="#86efac"  tc="#166534" />
        <Node b={nF} fkey="of_inanma"     title="Güçlü Biçimde İnanma"                        placeholder="Felaketin gerçekleşeceğine dair inanç…"  fill="#f3f4f6"  stroke="#9ca3af" />
        <Node b={nG} fkey="of_guvdav"     title="Kaçma veya Güvenlik Davranışları"             placeholder="Güvenlik sinyalleri, kaçma…"             fill="#fafafa"  stroke="#6b7280" />
        <Node b={nH} fkey="of_curutme"    title="Felaket Çürütülmesi Engellenir"               placeholder="İnanç pekişir…"                          fill="#fef9c3"  stroke="#ca8a04"  tc="#713f12" />
        <Node b={nI} fkey="of_felaket2"   title="Felaket Oluşmaz · Kaygı Azalır"              placeholder="Kısa vadeli rahatlama…"                  fill="#f0fdf4"  stroke="#86efac"  tc="#166534" />
        <Node b={nJ} fkey="of_sonuc"      title="Çıkarılan Sonuç: Kaçma Felaketi Önledi"      placeholder="Yanlış atıf…"                            fill="#fff7ed"  stroke="#fb923c"  tc="#7c2d12" />
        <Node b={nK} fkey="of_fobi"       title="Fobi Devam Ediyor"                           placeholder="Döngü pekişir…"                          fill="#fef2f2"  stroke="#fca5a5"  tc="#991b1b" />
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">
        Özgül Fobi Modeli — Davis, Ollendick &amp; Öst
      </p>
    </div>
  );
}

// ─── Yeme Sorunları Modeli ─────────────────────────────────────────────────────
function YemeSorunlariDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 680, H = 560;
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const lbl: React.CSSProperties = { fontSize:8.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#1f2937', marginBottom:2, textAlign:'center', lineHeight:1.3 };
  const ta: React.CSSProperties = { width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8.5, textAlign:'center', lineHeight:1.4, color:'#374151', fontFamily:'inherit', minHeight:22 };

  const A  = { x:190, y:15,  w:300, h:62 }; // Şekil/kilo aşırı değerlendirme
  const B  = { x:190, y:140, w:300, h:72 }; // Katı diyet
  const C  = { x:190, y:278, w:300, h:58 }; // Tıkınırcasına yeme
  const D  = { x:190, y:410, w:300, h:58 }; // Telafi edici kusma
  const E  = { x:16,  y:265, w:148, h:84 }; // Olaylar (dashed, left)

  const bCx = (b: typeof A) => b.x + b.w/2;
  const bCy = (b: typeof A) => b.y + b.h/2;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 680 }}>
        <defs>
          <marker id="ys-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#374151" />
          </marker>
          <marker id="ys-au" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#374151" />
          </marker>
        </defs>

        {/* Forward arrows */}
        <line x1={bCx(A)} y1={A.y+A.h} x2={bCx(B)} y2={B.y}   stroke="#374151" strokeWidth="1.5" markerEnd="url(#ys-a)" />
        <line x1={bCx(B)} y1={B.y+B.h} x2={bCx(C)} y2={C.y}   stroke="#374151" strokeWidth="1.5" markerEnd="url(#ys-a)" />
        {/* C ↔ D bidirectional */}
        <line x1={bCx(C)-10} y1={C.y+C.h} x2={bCx(D)-10} y2={D.y} stroke="#374151" strokeWidth="1.5" markerEnd="url(#ys-a)" />
        <line x1={bCx(D)+10} y1={D.y}     x2={bCx(C)+10} y2={C.y+C.h} stroke="#374151" strokeWidth="1.5" markerEnd="url(#ys-au)" />
        {/* E → C (horizontal) */}
        <line x1={E.x+E.w} y1={bCy(E)} x2={C.x} y2={bCy(C)} stroke="#374151" strokeWidth="1.5" markerEnd="url(#ys-a)" />
        {/* D → B (right side short feedback) */}
        <path d={`M ${D.x+D.w},${bCy(D)} L 560,${bCy(D)} L 560,${bCy(B)} L ${B.x+B.w},${bCy(B)}`}
          fill="none" stroke="#374151" strokeWidth="1.5" markerEnd="url(#ys-a)" />
        {/* D → A (right side long feedback) */}
        <path d={`M ${D.x+D.w},${bCy(D)+8} L 578,${bCy(D)+8} L 578,${bCy(A)} L ${A.x+A.w},${bCy(A)}`}
          fill="none" stroke="#374151" strokeWidth="1.5" markerEnd="url(#ys-a)" />

        {/* Main boxes */}
        <rect x={A.x} y={A.y} width={A.w} height={A.h} rx="6" fill="white" stroke="#374151" strokeWidth="1.5" />
        <foreignObject x={A.x+10} y={A.y+6} width={A.w-20} height={A.h-12}>
          <div style={fi}><div style={lbl}>Şekil, Kilo ve Kontrolün Aşırı Değerlendirilmesi</div>
            <textarea value={fields['ys_deger']||''} onChange={e=>onChange('ys_deger',e.target.value)} style={ta} placeholder="Beden imgesi ile özdeğer…" /></div>
        </foreignObject>

        <rect x={B.x} y={B.y} width={B.w} height={B.h} rx="6" fill="white" stroke="#374151" strokeWidth="1.5" />
        <foreignObject x={B.x+10} y={B.y+6} width={B.w-20} height={B.h-12}>
          <div style={fi}><div style={lbl}>Katı Diyet / Telafi Edici Olmayan Kilo Kontrolü</div>
            <textarea value={fields['ys_diyet']||''} onChange={e=>onChange('ys_diyet',e.target.value)} style={ta} placeholder="Aşırı diyet, yiyecek takibi…" /></div>
        </foreignObject>

        <rect x={C.x} y={C.y} width={C.w} height={C.h} rx="6" fill="white" stroke="#374151" strokeWidth="1.5" />
        <foreignObject x={C.x+10} y={C.y+6} width={C.w-20} height={C.h-12}>
          <div style={fi}><div style={lbl}>Tıkınırcasına Yeme</div>
            <textarea value={fields['ys_tikin']||''} onChange={e=>onChange('ys_tikin',e.target.value)} style={ta} placeholder="Binge epizodlar, kontrol kaybı…" /></div>
        </foreignObject>

        <rect x={D.x} y={D.y} width={D.w} height={D.h} rx="6" fill="white" stroke="#374151" strokeWidth="1.5" />
        <foreignObject x={D.x+10} y={D.y+6} width={D.w-20} height={D.h-12}>
          <div style={fi}><div style={lbl}>Telafi Edici Kusma / Laksatif Kullanımı</div>
            <textarea value={fields['ys_telafi']||''} onChange={e=>onChange('ys_telafi',e.target.value)} style={ta} placeholder="Purging davranışları…" /></div>
        </foreignObject>

        {/* Olaylar — dashed box */}
        <rect x={E.x} y={E.y} width={E.w} height={E.h} rx="6" fill="#f9fafb" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="5,3" />
        <foreignObject x={E.x+6} y={E.y+4} width={E.w-12} height={E.h-8}>
          <div style={fi}>
            <div style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#6b7280', textAlign:'center', lineHeight:1.3, marginBottom:2 }}>Olaylar & Duygu Durum Değişikliği</div>
            <textarea value={fields['ys_olay']||''} onChange={e=>onChange('ys_olay',e.target.value)}
              style={{ ...ta, color:'#6b7280' }} placeholder="Tetikleyici olaylar…" />
          </div>
        </foreignObject>
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">
        Yeme Bozukluğu — Tanı Üstü Bilişsel Model (Fairburn vd.)
      </p>
    </div>
  );
}

// ─── İstek / Mutluluk Döngüsü — Triangle with 3 oval nodes ──────────────────
function IstekMutlulukDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 680, H = 520;
  // Triangle vertices (center = 340,265)
  // Top-left, Top-right, Bottom-center
  const nodes = [
    { cx: 170, cy: 130, key: 'im_yapmak',   lines: ['Bir Şey', 'Yapma'],          tc: '#7c2d12' },
    { cx: 510, cy: 130, key: 'im_mutluluk', lines: ['Mutluluk', 'Hoşlanma'],       tc: '#14532d' },
    { cx: 340, cy: 390, key: 'im_istek',    lines: ['İstek'],                      tc: '#1e3a8a' },
  ];
  const rx = 100, ry = 55;
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const ta = (c: string): React.CSSProperties => ({ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:9, textAlign:'center', lineHeight:1.4, color:c, fontFamily:'inherit', minHeight:22 });

  // Curved arrows (quadratic bezier, clockwise)
  // A→B (top-left to top-right): control point above center
  // B→C (top-right to bottom): control point right
  // C→A (bottom to top-left): control point left
  const arrows = [
    { d: `M ${nodes[0].cx+rx},${nodes[0].cy} Q 340,${nodes[0].cy-90} ${nodes[1].cx-rx},${nodes[1].cy}` },
    { d: `M ${nodes[1].cx+20},${nodes[1].cy+ry} Q ${nodes[1].cx+130},${nodes[2].cy-20} ${nodes[2].cx+rx*0.7},${nodes[2].cy-ry+10}` },
    { d: `M ${nodes[2].cx-rx*0.7},${nodes[2].cy-ry+10} Q ${nodes[0].cx-130},${nodes[2].cy-20} ${nodes[0].cx-20},${nodes[0].cy+ry}` },
  ];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 680 }}>
        <defs>
          <marker id="im-a" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 9 3.5, 0 7" fill="#f97316" />
          </marker>
        </defs>
        {arrows.map((a, i) => (
          <path key={i} d={a.d} fill="none" stroke="#f97316" strokeWidth="3.5" markerEnd="url(#im-a)" />
        ))}
        {nodes.map((n, i) => {
          const fills  = ['#fed7aa', '#bbf7d0', '#bfdbfe'];
          const strokes = ['#f97316', '#16a34a', '#3b82f6'];
          return (
            <g key={i}>
              <ellipse cx={n.cx} cy={n.cy} rx={rx} ry={ry} fill={fills[i]} stroke={strokes[i]} strokeWidth="2.5" />
              <foreignObject x={n.cx-rx+8} y={n.cy-ry+8} width={(rx-8)*2} height={(ry-8)*2}>
                <div style={fi}>
                  {n.lines.map((l, j) => (
                    <div key={j} style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:n.tc, textAlign:'center', lineHeight:1.3 }}>{l}</div>
                  ))}
                  <textarea value={fields[n.key]||''} onChange={e=>onChange(n.key,e.target.value)}
                    style={ta(n.tc)} placeholder="…" />
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">İstek / Mutluluk Döngüsü — Davranışsal Aktivasyon</p>
    </div>
  );
}

// ─── Basit Düşünce-Duygu-Davranış — Triangle ovals with annotation boxes ─────
function DddBasitDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 680, H = 560;
  // Triangle ovals: top-center, bottom-right, bottom-left
  const nodes = [
    { cx: 340, cy: 110, rx: 120, ry: 58, key: 'ddd_dusunce',  label: 'Düşünce',  fill: '#fef9c3', stroke: '#ca8a04', tc: '#713f12' },
    { cx: 530, cy: 370, rx: 120, ry: 58, key: 'ddd_duygu',    label: 'Duygu',    fill: '#fee2e2', stroke: '#ef4444', tc: '#991b1b' },
    { cx: 150, cy: 370, rx: 120, ry: 58, key: 'ddd_davranis', label: 'Davranış', fill: '#dbeafe', stroke: '#3b82f6', tc: '#1e3a8a' },
  ];
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const ta = (c: string): React.CSSProperties => ({ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:9, textAlign:'center', lineHeight:1.4, color:c, fontFamily:'inherit', minHeight:22 });
  // Annotation boxes (yellow): beside each node
  const annots = [
    { x: 408, y: 70,  w: 200, h: 64, key: 'ddd_ann_dusunce',  label: 'Örn. Düşünce', placeholder: '"Beceremiyorum, değersizim…"' },
    { x: 470, y: 435, w: 200, h: 64, key: 'ddd_ann_duygu',    label: 'Örn. Duygu',   placeholder: 'Üzüntü, kaygı, öfke…' },
    { x: 10,  y: 435, w: 200, h: 64, key: 'ddd_ann_davranis', label: 'Örn. Davranış', placeholder: 'Çekilme, kaçınma…' },
  ];
  // Bidirectional curved arrows between nodes (sides of triangle)
  const pairs = [
    // D→Du (top to bottom-right, right side)
    { d: `M ${nodes[0].cx+nodes[0].rx*0.6},${nodes[0].cy+nodes[0].ry*0.6} Q 500,240 ${nodes[1].cx-nodes[1].rx*0.4},${nodes[1].cy-nodes[1].ry}`, col: '#ca8a04' },
    { d: `M ${nodes[1].cx-nodes[1].rx*0.6},${nodes[1].cy-nodes[1].ry*0.4} Q 430,260 ${nodes[0].cx+nodes[0].rx*0.4},${nodes[0].cy+nodes[0].ry}`, col: '#ef4444' },
    // Du↔Da (bottom-right to bottom-left)
    { d: `M ${nodes[1].cx-nodes[1].rx},${nodes[1].cy-15} Q 340,310 ${nodes[2].cx+nodes[2].rx},${nodes[2].cy-15}`, col: '#ef4444' },
    { d: `M ${nodes[2].cx+nodes[2].rx},${nodes[2].cy+15} Q 340,440 ${nodes[1].cx-nodes[1].rx},${nodes[1].cy+15}`, col: '#3b82f6' },
    // Da→D (bottom-left to top, left side)
    { d: `M ${nodes[2].cx+nodes[2].rx*0.4},${nodes[2].cy-nodes[2].ry} Q 240,260 ${nodes[0].cx-nodes[0].rx*0.6},${nodes[0].cy+nodes[0].ry*0.6}`, col: '#3b82f6' },
    { d: `M ${nodes[0].cx-nodes[0].rx*0.4},${nodes[0].cy+nodes[0].ry} Q 180,250 ${nodes[2].cx+nodes[2].rx*0.6},${nodes[2].cy-nodes[2].ry*0.6}`, col: '#ca8a04' },
  ];
  const arrowCols = ['#ca8a04','#ef4444','#ef4444','#3b82f6','#3b82f6','#ca8a04'];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 680 }}>
        <defs>
          {arrowCols.filter((c,i,a)=>a.indexOf(c)===i).map(c => (
            <marker key={c} id={`ddd-${c.replace('#','')}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={c} />
            </marker>
          ))}
        </defs>
        {pairs.map((p, i) => (
          <path key={i} d={p.d} fill="none" stroke={p.col} strokeWidth="2" markerEnd={`url(#ddd-${p.col.replace('#','')})`} />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <ellipse cx={n.cx} cy={n.cy} rx={n.rx} ry={n.ry} fill={n.fill} stroke={n.stroke} strokeWidth="2.5" />
            <foreignObject x={n.cx-n.rx+10} y={n.cy-n.ry+8} width={(n.rx-10)*2} height={(n.ry-8)*2}>
              <div style={fi}>
                <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:n.tc, textAlign:'center', lineHeight:1.2, marginBottom:2 }}>{n.label}</div>
                <textarea value={fields[n.key]||''} onChange={e=>onChange(n.key,e.target.value)} style={ta(n.tc)} placeholder="…" />
              </div>
            </foreignObject>
          </g>
        ))}
        {annots.map((a, i) => (
          <g key={i}>
            <rect x={a.x} y={a.y} width={a.w} height={a.h} rx="6" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.2" />
            <foreignObject x={a.x+6} y={a.y+4} width={a.w-12} height={a.h-8}>
              <div style={fi}>
                <div style={{ fontSize:8, fontWeight:700, color:'#713f12', textAlign:'center', marginBottom:2 }}>{a.label}</div>
                <textarea value={fields[a.key]||''} onChange={e=>onChange(a.key,e.target.value)}
                  style={{ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8, textAlign:'center', lineHeight:1.4, color:'#78350f', fontFamily:'inherit', minHeight:18 }}
                  placeholder={a.placeholder} />
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Bilişsel Üçgen — Düşünce, Duygu ve Davranış Etkileşimi</p>
    </div>
  );
}

// ─── AKB/Okul Reddi Komplex — Hub-and-spoke ───────────────────────────────────
function AkbKomplexDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 700, H = 620;
  const cx = 350, cy = 270;
  // Center box
  const ctr = { x: cx-130, y: cy-50, w: 260, h: 100 };
  // Spoke nodes (angle degrees: top=270, clockwise)
  const spokes = [
    { angle: 270, key: 'akbk_algi',   label: 'Algı',               fill: '#fef9c3', stroke: '#ca8a04', tc: '#713f12' },
    { angle: 330, key: 'akbk_bilis',  label: 'Biliş',              fill: '#fee2e2', stroke: '#ef4444', tc: '#991b1b' },
    { angle: 30,  key: 'akbk_duygu',  label: 'Duygu',              fill: '#fce7f3', stroke: '#ec4899', tc: '#9d174d' },
    { angle: 90,  key: 'akbk_beden',  label: 'Beden',              fill: '#dbeafe', stroke: '#3b82f6', tc: '#1e3a8a' },
    { angle: 150, key: 'akbk_dav',    label: 'Davranış',           fill: '#d1fae5', stroke: '#10b981', tc: '#065f46' },
    { angle: 210, key: 'akbk_kisilr', label: 'Kişilerarası Uyum',  fill: '#ede9fe', stroke: '#8b5cf6', tc: '#4c1d95' },
  ];
  const dist = 195; // distance from center to spoke cx
  const spokeW = 140, spokeH = 68;
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const ta = (c: string): React.CSSProperties => ({ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8.5, textAlign:'center', lineHeight:1.4, color:c, fontFamily:'inherit', minHeight:18 });

  // Oval: Sekonder kazançlar (below center)
  const oval = { cx: 350, cy: 555, rx: 145, ry: 38 };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 700 }}>
        <defs>
          <marker id="akbk-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
          </marker>
          <marker id="akbk-r" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#dc2626" />
          </marker>
        </defs>

        {/* Spoke arrows center ↔ nodes */}
        {spokes.map((s, i) => {
          const rad = (s.angle * Math.PI) / 180;
          const nx = cx + dist * Math.cos(rad);
          const ny = cy + dist * Math.sin(rad);
          // Arrow from center box edge toward node
          const ex = cx + 130 * Math.cos(rad);
          const ey = cy + 50  * Math.sin(rad);
          const nx2 = nx - (spokeW/2+4) * Math.cos(rad);
          const ny2 = ny - (spokeH/2+4) * Math.sin(rad);
          return <line key={i} x1={ex} y1={ey} x2={nx2} y2={ny2} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#akbk-a)" />;
        })}
        {/* Arrow center → oval */}
        <line x1={cx} y1={ctr.y+ctr.h} x2={oval.cx} y2={oval.cy-oval.ry} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#akbk-r)" />

        {/* Spoke boxes */}
        {spokes.map((s, i) => {
          const rad = (s.angle * Math.PI) / 180;
          const nx = cx + dist * Math.cos(rad);
          const ny = cy + dist * Math.sin(rad);
          return (
            <g key={i}>
              <rect x={nx-spokeW/2} y={ny-spokeH/2} width={spokeW} height={spokeH} rx="8" fill={s.fill} stroke={s.stroke} strokeWidth="1.8" />
              <foreignObject x={nx-spokeW/2+6} y={ny-spokeH/2+4} width={spokeW-12} height={spokeH-8}>
                <div style={fi}>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:s.tc, textAlign:'center', marginBottom:2 }}>{s.label}</div>
                  <textarea value={fields[s.key]||''} onChange={e=>onChange(s.key,e.target.value)} style={ta(s.tc)} placeholder="…" />
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Center box */}
        <rect x={ctr.x} y={ctr.y} width={ctr.w} height={ctr.h} rx="10" fill="white" stroke="#374151" strokeWidth="2" />
        <foreignObject x={ctr.x+8} y={ctr.y+4} width={ctr.w-16} height={ctr.h-8}>
          <div style={fi}>
            <div style={{ fontSize:8.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#1f2937', textAlign:'center', lineHeight:1.3, marginBottom:3 }}>Ayrılık Kaygısı<br />Okul Reddi Problem Alanları</div>
            <textarea value={fields['akbk_merkez']||''} onChange={e=>onChange('akbk_merkez',e.target.value)}
              style={ta('#374151')} placeholder="Problem özeti…" />
          </div>
        </foreignObject>

        {/* Sekonder kazançlar oval */}
        <ellipse cx={oval.cx} cy={oval.cy} rx={oval.rx} ry={oval.ry} fill="#fee2e2" stroke="#dc2626" strokeWidth="1.8" />
        <foreignObject x={oval.cx-oval.rx+8} y={oval.cy-oval.ry+6} width={(oval.rx-8)*2} height={(oval.ry-6)*2}>
          <div style={fi}>
            <div style={{ fontSize:8.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#991b1b', textAlign:'center' }}>Sekonder Kazançlar Belirginleşir</div>
          </div>
        </foreignObject>
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Ayrılık Kaygısı / Okul Reddi — Komplex Formülasyon</p>
    </div>
  );
}

// ─── Kaçınma & Öğrenme Modeli — Chevron flow + U-shaped feedback ──────────────
function KacinmaOgrenmeDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 680, H = 420;
  // Bubble (trigger) + 4 chevron/rect nodes + 1 oval (dashed)
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const ta = (c: string): React.CSSProperties => ({ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8, textAlign:'center', lineHeight:1.4, color:c, fontFamily:'inherit', minHeight:18 });
  const lbl = (c: string): React.CSSProperties => ({ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:c, textAlign:'center', lineHeight:1.3, marginBottom:2 });

  // Trigger bubble (circle)
  const trig = { cx: 55, cy: 180, r: 48 };
  // Chevron/rect nodes (horizontal row)
  const boxes = [
    { x: 118, y: 130, w: 130, h: 100, key: 'ko_yorumlama', label: 'Tehdidin Yanlış Yorumlanması', fill: '#f3f4f6', stroke: '#6b7280', tc: '#374151' },
    { x: 265, y: 130, w: 130, h: 100, key: 'ko_kaygi',     label: 'Kaygı / Korku',               fill: '#fef2f2', stroke: '#ef4444', tc: '#991b1b' },
    { x: 412, y: 130, w: 130, h: 100, key: 'ko_kacinma',   label: 'Kaçınma ile Baş Etme',        fill: '#eff6ff', stroke: '#3b82f6', tc: '#1e3a8a' },
  ];
  // Dashed oval (last step)
  const ovalNode = { cx: 603, cy: 180, rx: 68, ry: 48 };

  // U-shaped feedback arrow: from oval bottom → curve down → back to box[0] bottom
  const uY = 330; // bottom of U
  const u1x = ovalNode.cx, u1y = ovalNode.cy + ovalNode.ry;
  const u2x = boxes[0].x + 20, u2y = boxes[0].y + boxes[0].h;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 680 }}>
        <defs>
          <marker id="ko-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
          </marker>
          <marker id="ko-p" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#7c3aed" />
          </marker>
        </defs>

        {/* Trigger → first box */}
        <line x1={trig.cx+trig.r} y1={trig.cy} x2={boxes[0].x} y2={boxes[0].y+boxes[0].h/2} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#ko-a)" />
        {/* Box→box arrows */}
        {boxes.slice(0,-1).map((b, i) => (
          <line key={i} x1={b.x+b.w} y1={b.y+b.h/2} x2={boxes[i+1].x} y2={boxes[i+1].y+boxes[i+1].h/2} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#ko-a)" />
        ))}
        {/* Last box → oval */}
        <line x1={boxes[2].x+boxes[2].w} y1={boxes[2].y+boxes[2].h/2} x2={ovalNode.cx-ovalNode.rx} y2={ovalNode.cy} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#ko-a)" />

        {/* U-shaped feedback (purple) */}
        <path d={`M ${u1x},${u1y} L ${u1x},${uY} L ${u2x},${uY} L ${u2x},${u2y}`}
          fill="none" stroke="#7c3aed" strokeWidth="2.5" markerEnd="url(#ko-p)" />

        {/* Trigger bubble */}
        <circle cx={trig.cx} cy={trig.cy} r={trig.r} fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
        <foreignObject x={trig.cx-trig.r+6} y={trig.cy-trig.r+6} width={(trig.r-6)*2} height={(trig.r-6)*2}>
          <div style={fi}>
            <div style={lbl('#15803d')}>Tetikleyici Olay</div>
            <textarea value={fields['ko_tetik']||''} onChange={e=>onChange('ko_tetik',e.target.value)} style={ta('#166534')} placeholder="…" />
          </div>
        </foreignObject>

        {/* Boxes */}
        {boxes.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="8" fill={b.fill} stroke={b.stroke} strokeWidth="1.8" />
            <foreignObject x={b.x+7} y={b.y+6} width={b.w-14} height={b.h-12}>
              <div style={fi}><div style={lbl(b.tc)}>{b.label}</div>
                <textarea value={fields[b.key]||''} onChange={e=>onChange(b.key,e.target.value)} style={ta(b.tc)} placeholder="…" />
              </div>
            </foreignObject>
          </g>
        ))}

        {/* Dashed oval */}
        <ellipse cx={ovalNode.cx} cy={ovalNode.cy} rx={ovalNode.rx} ry={ovalNode.ry} fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="1.8" strokeDasharray="5,3" />
        <foreignObject x={ovalNode.cx-ovalNode.rx+6} y={ovalNode.cy-ovalNode.ry+6} width={(ovalNode.rx-6)*2} height={(ovalNode.ry-6)*2}>
          <div style={fi}>
            <div style={lbl('#5b21b6')}>Düzeltici Deneyim Edinilemiyor</div>
          </div>
        </foreignObject>

        {/* Purple arrow label */}
        <text x={(u1x+u2x)/2} y={uY+14} textAnchor="middle" fontSize="8" fill="#7c3aed" fontWeight="700">Yanlış yorumlama pekişir</text>
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Kaçınmanın Öğrenmeyi Baskılaması — McGrath &amp; Walsh (2007)</p>
    </div>
  );
}

// ─── YAB Basit Model — Vertical dashed ovals + rects + 3-col bottom ──────────
function YabBasitDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 680, H = 640;
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const ta = (c='#374151'): React.CSSProperties => ({ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8.5, textAlign:'center', lineHeight:1.4, color:c, fontFamily:'inherit', minHeight:18 });
  const lbl = (c='#1f2937'): React.CSSProperties => ({ fontSize:8.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:c, textAlign:'center', marginBottom:2, lineHeight:1.3 });

  // Nodes (vertical center column)
  const oA = { cx:340, cy:65, rx:200, ry:42 };   // dashed oval
  const rB = { x:170, y:158, w:340, h:70 };       // rect
  const oC = { cx:340, cy:295, rx:200, ry:42 };   // dashed oval
  const rD = { x:170, y:390, w:340, h:70 };       // rect
  // 3 bottom boxes
  const bot = [
    { x:20,  y:510, w:190, h:110, key:'yabb_dav',   label:'Davranış',     fill:'#dbeafe', stroke:'#3b82f6', tc:'#1e3a8a' },
    { x:245, y:510, w:190, h:110, key:'yabb_dusunce',label:'Düşünce Kontrolü', fill:'#fef9c3', stroke:'#ca8a04', tc:'#713f12' },
    { x:470, y:510, w:190, h:110, key:'yabb_duygu',  label:'Duygu & Beden',fill:'#fee2e2', stroke:'#ef4444', tc:'#991b1b' },
  ];

  // Right-side dashed feedback: from bottom of rD → wall → side of rB
  const wallX = 640;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 680 }}>
        <defs>
          <marker id="yabb-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
          </marker>
          <marker id="yabb-d" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
          </marker>
        </defs>

        {/* Arrows */}
        <line x1={340} y1={oA.cy+oA.ry} x2={340} y2={rB.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#yabb-a)" />
        <line x1={340} y1={rB.y+rB.h}   x2={340} y2={oC.cy-oC.ry} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#yabb-a)" />
        <line x1={340} y1={oC.cy+oC.ry} x2={340} y2={rD.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#yabb-a)" />
        {/* rD → 3 bottom boxes */}
        {bot.map((b, i) => (
          <line key={i} x1={b.x+b.w/2} y1={rD.y+rD.h} x2={b.x+b.w/2} y2={b.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#yabb-a)" />
        ))}
        {/* Right-side feedback (dashed orange): from bot right edge → wall → rB right */}
        <path d={`M ${bot[2].x+bot[2].w},${bot[2].y+bot[2].h/2} L ${wallX},${bot[2].y+bot[2].h/2} L ${wallX},${rB.y+rB.h/2} L ${rB.x+rB.w},${rB.y+rB.h/2}`}
          fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#yabb-d)" />

        {/* Dashed oval A */}
        <ellipse cx={oA.cx} cy={oA.cy} rx={oA.rx} ry={oA.ry} fill="#fff7ed" stroke="#f97316" strokeWidth="1.5" strokeDasharray="5,3" />
        <foreignObject x={oA.cx-oA.rx+8} y={oA.cy-oA.ry+6} width={(oA.rx-8)*2} height={(oA.ry-6)*2}>
          <div style={fi}><div style={lbl('#c2410c')}>Kaygılanmazsam bununla baş edemem</div></div>
        </foreignObject>

        {/* Rect B */}
        <rect x={rB.x} y={rB.y} width={rB.w} height={rB.h} rx="8" fill="#f9fafb" stroke="#6b7280" strokeWidth="1.5" />
        <foreignObject x={rB.x+8} y={rB.y+4} width={rB.w-16} height={rB.h-8}>
          <div style={fi}><div style={lbl()}>Felaket Sonuçları</div>
            <textarea value={fields['yabb_felaket']||''} onChange={e=>onChange('yabb_felaket',e.target.value)} style={ta()} placeholder="Olası felaket senaryoları…" /></div>
        </foreignObject>

        {/* Dashed oval C */}
        <ellipse cx={oC.cx} cy={oC.cy} rx={oC.rx} ry={oC.ry} fill="#fff7ed" stroke="#f97316" strokeWidth="1.5" strokeDasharray="5,3" />
        <foreignObject x={oC.cx-oC.rx+8} y={oC.cy-oC.ry+6} width={(oC.rx-8)*2} height={(oC.ry-6)*2}>
          <div style={fi}><div style={lbl('#c2410c')}>Düşüncelerimi kontrol edemezsem…</div></div>
        </foreignObject>

        {/* Rect D */}
        <rect x={rD.x} y={rD.y} width={rD.w} height={rD.h} rx="8" fill="#f9fafb" stroke="#6b7280" strokeWidth="1.5" />
        <foreignObject x={rD.x+8} y={rD.y+4} width={rD.w-16} height={rD.h-8}>
          <div style={fi}><div style={lbl()}>Kontrolümü Kaybediyorum / Delireceğim</div>
            <textarea value={fields['yabb_kontrol']||''} onChange={e=>onChange('yabb_kontrol',e.target.value)} style={ta()} placeholder="Kontrol kaybı inançları…" /></div>
        </foreignObject>

        {/* 3 bottom boxes */}
        {bot.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="8" fill={b.fill} stroke={b.stroke} strokeWidth="1.8" />
            <foreignObject x={b.x+6} y={b.y+4} width={b.w-12} height={b.h-8}>
              <div style={fi}><div style={lbl(b.tc)}>{b.label}</div>
                <textarea value={fields[b.key]||''} onChange={e=>onChange(b.key,e.target.value)} style={ta(b.tc)} placeholder="…" /></div>
            </foreignObject>
          </g>
        ))}
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Yaygın Anksiyete Bozukluğu — Basit Model</p>
    </div>
  );
}

// ─── Hastalık Anksiyetesi Basit (Warwick & Salkovskis 1990) ───────────────────
function HastalıkAnksiyeteDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 680, H = 510;
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const ta = (c='#374151'): React.CSSProperties => ({ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8.5, textAlign:'center', lineHeight:1.4, color:c, fontFamily:'inherit', minHeight:18 });
  const lbl = (c='#1f2937'): React.CSSProperties => ({ fontSize:8.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:c, textAlign:'center', marginBottom:2, lineHeight:1.3 });

  const rA = { x:140, y:15,  w:400, h:70 }; // Önceki varsayım aktive
  const rB = { x:140, y:140, w:400, h:70 }; // Olumsuz düşünce & imgeler
  const rC = { x:140, y:265, w:400, h:70 }; // Kaygı artışı
  const bot = [
    { x:15,  y:390, w:145, h:100, key:'ha_dav',  label:'Davranış',    fill:'#dbeafe', stroke:'#3b82f6', tc:'#1e3a8a' },
    { x:180, y:390, w:145, h:100, key:'ha_duygu', label:'Duygu',       fill:'#fce7f3', stroke:'#ec4899', tc:'#9d174d' },
    { x:345, y:390, w:145, h:100, key:'ha_kog',   label:'Kognitif',    fill:'#fef9c3', stroke:'#ca8a04', tc:'#713f12' },
    { x:510, y:390, w:145, h:100, key:'ha_fiz',   label:'Fizyolojik',  fill:'#d1fae5', stroke:'#10b981', tc:'#065f46' },
  ];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 680 }}>
        <defs>
          <marker id="ha-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
          </marker>
        </defs>
        <line x1={340} y1={rA.y+rA.h} x2={340} y2={rB.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#ha-a)" />
        <line x1={340} y1={rB.y+rB.h} x2={340} y2={rC.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#ha-a)" />
        {bot.map((b, i) => (
          <line key={i} x1={b.x+b.w/2} y1={rC.y+rC.h} x2={b.x+b.w/2} y2={b.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#ha-a)" />
        ))}
        {[rA,rB,rC].map((r, i) => {
          const keys = ['ha_varsayim','ha_dusunce','ha_kaygi'];
          const labels = ['Önceki Varsayım-İnanç Aktive Olur','Artan Olumsuz Düşünce ve İmgeler','Kaygı Artışı'];
          return (
            <g key={i}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="8" fill="#f9fafb" stroke="#6b7280" strokeWidth="1.5" />
              <foreignObject x={r.x+8} y={r.y+4} width={r.w-16} height={r.h-8}>
                <div style={fi}><div style={lbl()}>{labels[i]}</div>
                  <textarea value={fields[keys[i]]||''} onChange={e=>onChange(keys[i],e.target.value)} style={ta()} placeholder="…" /></div>
              </foreignObject>
            </g>
          );
        })}
        {bot.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="8" fill={b.fill} stroke={b.stroke} strokeWidth="1.8" />
            <foreignObject x={b.x+6} y={b.y+4} width={b.w-12} height={b.h-8}>
              <div style={fi}><div style={lbl(b.tc)}>{b.label}</div>
                <textarea value={fields[b.key]||''} onChange={e=>onChange(b.key,e.target.value)} style={ta(b.tc)} placeholder="…" /></div>
            </foreignObject>
          </g>
        ))}
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Hastalık Anksiyetesi — Warwick &amp; Salkovskis (1990)</p>
    </div>
  );
}

// ─── Hastalık Anksiyetesi Detaylı ────────────────────────────────────────────
function HastalıkAnksiyeteDetayDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 680, H = 730;
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const ta = (c='#374151'): React.CSSProperties => ({ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8.5, textAlign:'center', lineHeight:1.4, color:c, fontFamily:'inherit', minHeight:18 });
  const lbl = (c='#1f2937'): React.CSSProperties => ({ fontSize:8.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:c, textAlign:'center', marginBottom:2, lineHeight:1.3 });

  // Developmental top section (green)
  const dA = { x:140, y:12,  w:400, h:62 }; // Geçmiş Yaşantı
  const dB = { x:140, y:120, w:400, h:62 }; // İşlevsiz Varsayımlar
  const dC = { x:140, y:228, w:400, h:62 }; // Kritik Olay
  // Main model
  const rA = { x:140, y:338, w:400, h:62 }; // Önceki varsayım aktive
  const rB = { x:140, y:448, w:400, h:62 }; // Olumsuz düşünce & imgeler
  const rC = { x:140, y:558, w:400, h:62 }; // Kaygı artışı
  const bot = [
    { x:15,  y:670, w:145, h:50, key:'had_dav',  label:'Davranış',   fill:'#dbeafe', stroke:'#3b82f6', tc:'#1e3a8a' },
    { x:180, y:670, w:145, h:50, key:'had_duygu', label:'Duygu',      fill:'#fce7f3', stroke:'#ec4899', tc:'#9d174d' },
    { x:345, y:670, w:145, h:50, key:'had_kog',   label:'Kognitif',   fill:'#fef9c3', stroke:'#ca8a04', tc:'#713f12' },
    { x:510, y:670, w:145, h:50, key:'had_fiz',   label:'Fizyolojik', fill:'#d1fae5', stroke:'#10b981', tc:'#065f46' },
  ];

  const devNodes = [dA,dB,dC];
  const devKeys = ['had_gecmis','had_varsayim','had_kritik'];
  const devLabels = ['Geçmiş Yaşantı / Deneyim','İşlevsiz Varsayımlar','Kritik Olay'];
  const mainNodes = [rA,rB,rC];
  const mainKeys = ['had_onc','had_dusunce','had_kaygi'];
  const mainLabels = ['Önceki Varsayım-İnanç Aktive Olur','Artan Olumsuz Düşünce ve İmgeler','Kaygı Artışı'];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 680 }}>
        <defs>
          <marker id="had-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
          </marker>
          <marker id="had-g" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#16a34a" />
          </marker>
        </defs>
        {/* Dev section arrows (green) */}
        <line x1={340} y1={dA.y+dA.h} x2={340} y2={dB.y} stroke="#16a34a" strokeWidth="1.5" markerEnd="url(#had-g)" />
        <line x1={340} y1={dB.y+dB.h} x2={340} y2={dC.y} stroke="#16a34a" strokeWidth="1.5" markerEnd="url(#had-g)" />
        <line x1={340} y1={dC.y+dC.h} x2={340} y2={rA.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#had-a)" />
        {/* Main arrows */}
        <line x1={340} y1={rA.y+rA.h} x2={340} y2={rB.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#had-a)" />
        <line x1={340} y1={rB.y+rB.h} x2={340} y2={rC.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#had-a)" />
        {bot.map((b, i) => (
          <line key={i} x1={b.x+b.w/2} y1={rC.y+rC.h} x2={b.x+b.w/2} y2={b.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#had-a)" />
        ))}
        {/* Dev nodes (green border) */}
        {devNodes.map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.5" />
            <foreignObject x={r.x+8} y={r.y+4} width={r.w-16} height={r.h-8}>
              <div style={fi}><div style={lbl('#15803d')}>{devLabels[i]}</div>
                <textarea value={fields[devKeys[i]]||''} onChange={e=>onChange(devKeys[i],e.target.value)} style={ta('#166534')} placeholder="…" /></div>
            </foreignObject>
          </g>
        ))}
        {/* Main nodes */}
        {mainNodes.map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="8" fill="#f9fafb" stroke="#6b7280" strokeWidth="1.5" />
            <foreignObject x={r.x+8} y={r.y+4} width={r.w-16} height={r.h-8}>
              <div style={fi}><div style={lbl()}>{mainLabels[i]}</div>
                <textarea value={fields[mainKeys[i]]||''} onChange={e=>onChange(mainKeys[i],e.target.value)} style={ta()} placeholder="…" /></div>
            </foreignObject>
          </g>
        ))}
        {/* Bottom boxes */}
        {bot.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="8" fill={b.fill} stroke={b.stroke} strokeWidth="1.8" />
            <foreignObject x={b.x+6} y={b.y+4} width={b.w-12} height={b.h-8}>
              <div style={fi}><div style={lbl(b.tc)}>{b.label}</div></div>
            </foreignObject>
          </g>
        ))}
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Hastalık Anksiyetesi — Detaylı Model (Warwick &amp; Salkovskis 1990)</p>
    </div>
  );
}

// YAB
// ─── Ruminasyon Döngüsü — ABCD yatay model ───────────────────────────────────
function RuminasyonDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 720, H = 480;

  // ABCD node x-centers
  const ax = 82, bx = 258, cx2 = 452, dx = 638;
  const ny = 185; // node label y
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const ta = (c = '#4c1d95'): React.CSSProperties => ({ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8.5, textAlign:'center', lineHeight:1.4, color:c, fontFamily:'inherit', minHeight:22 });

  // Sub-thought box below B
  const subH = 90;
  const subY = ny + 60;

  return (
    <div className="overflow-x-auto -mx-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 720 }}>
        <defs>
          <marker id="rum-p" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <polygon points="0 0,10 4,0 8" fill="#7c3aed" />
          </marker>
          <marker id="rum-pg" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <polygon points="0 0,10 4,0 8" fill="#6d28d9" />
          </marker>
        </defs>

        {/* ── Forward arrows (thick purple) ── */}
        <line x1={ax+38} y1={ny} x2={bx-38} y2={ny} stroke="#7c3aed" strokeWidth="6" markerEnd="url(#rum-p)" />
        <line x1={bx+38} y1={ny} x2={cx2-38} y2={ny} stroke="#7c3aed" strokeWidth="6" markerEnd="url(#rum-p)" />
        <line x1={cx2+38} y1={ny} x2={dx-38} y2={ny} stroke="#7c3aed" strokeWidth="6" markerEnd="url(#rum-p)" />

        {/* ── Top arc: D → B (large) ── */}
        <path d={`M ${dx},${ny-20} C ${dx},60 ${bx},60 ${bx},${ny-20}`}
          fill="none" stroke="#7c3aed" strokeWidth="6" markerEnd="url(#rum-p)" />

        {/* ── Bottom arcs from C: C → B and C → D ── */}
        <path d={`M ${cx2-10},${ny+22} C ${cx2-10},${H-55} ${bx+10},${H-55} ${bx+10},${ny+22}`}
          fill="none" stroke="#6d28d9" strokeWidth="6" markerEnd="url(#rum-pg)" />
        <path d={`M ${cx2+10},${ny+22} C ${cx2+10},${H-40} ${dx-10},${H-40} ${dx-10},${ny+22}`}
          fill="none" stroke="#6d28d9" strokeWidth="6" markerEnd="url(#rum-pg)" />

        {/* ── Node labels ── */}
        {[
          { x: ax,  letter:'A', color:'#7c3aed' },
          { x: bx,  letter:'B', color:'#7c3aed' },
          { x: cx2, letter:'C', color:'#7c3aed' },
          { x: dx,  letter:'D', color:'#7c3aed' },
        ].map(n => (
          <text key={n.letter} x={n.x} y={ny+8} textAnchor="middle"
            fontSize="48" fontWeight="800" fontStyle="italic" fill={n.color} opacity={0.85}>
            {n.letter}
          </text>
        ))}

        {/* ── Editable content below each letter ── */}
        {/* A */}
        <foreignObject x={ax-60} y={ny+28} width={120} height={80}>
          <div style={fi}>
            <div style={{ fontSize:8, fontWeight:700, color:'#6d28d9', textAlign:'center', marginBottom:2 }}>Tetikleyici Olay</div>
            <textarea value={fields['rum_a']||''} onChange={e=>onChange('rum_a',e.target.value)} style={ta()} placeholder="Olayı belirtin…" />
          </div>
        </foreignObject>

        {/* B — iki alan: anlık düşünce + alt düşünceler */}
        <foreignObject x={bx-72} y={ny+28} width={144} height={60}>
          <div style={fi}>
            <div style={{ fontSize:8, fontWeight:700, color:'#6d28d9', textAlign:'center', marginBottom:2 }}>Ruminatif Düşünce</div>
            <textarea value={fields['rum_b']||''} onChange={e=>onChange('rum_b',e.target.value)} style={ta()} placeholder="Ne düşündünüz?" />
          </div>
        </foreignObject>
        {/* Alt düşünceler kutusu */}
        <rect x={bx-80} y={subY} width={160} height={subH} rx="6" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="1.2" strokeDasharray="4,2" />
        <foreignObject x={bx-74} y={subY+4} width={148} height={subH-8}>
          <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            <div style={{ fontSize:7, fontWeight:700, color:'#7c3aed', marginBottom:2, textAlign:'center' }}>Alt Düşünceler</div>
            <textarea value={fields['rum_b_alt']||''} onChange={e=>onChange('rum_b_alt',e.target.value)}
              style={{ flex:1, background:'transparent', border:'none', outline:'none', resize:'none', fontSize:7.5, lineHeight:1.5, color:'#6d28d9', fontFamily:'inherit' }}
              placeholder={'Aptal olduğumu düşünmüştür…\nBelki haklıydım ama…\nTam ne demişti acaba…'} />
          </div>
        </foreignObject>

        {/* C */}
        <foreignObject x={cx2-65} y={ny+28} width={130} height={80}>
          <div style={fi}>
            <div style={{ fontSize:8, fontWeight:700, color:'#6d28d9', textAlign:'center', marginBottom:2 }}>Duygu</div>
            <textarea value={fields['rum_c']||''} onChange={e=>onChange('rum_c',e.target.value)} style={ta()} placeholder="Mutsuzluk, huzursuzluk…" />
          </div>
        </foreignObject>

        {/* D */}
        <foreignObject x={dx-65} y={ny+28} width={130} height={80}>
          <div style={fi}>
            <div style={{ fontSize:8, fontWeight:700, color:'#6d28d9', textAlign:'center', marginBottom:2 }}>Davranış</div>
            <textarea value={fields['rum_d']||''} onChange={e=>onChange('rum_d',e.target.value)} style={ta()} placeholder="Odasına çekilme, telefona cevap vermeme…" />
          </div>
        </foreignObject>

      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Ruminasyon Döngüsü — ABCD Modeli</p>
    </div>
  );
}

// ─── Ruminasyon — Üst-Biliş Modeli (Watkins 2008 / Wells 1999) ───────────────
function RuminasyonUstBilisDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 720, H = 680;
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const lbl = (c='#1f2937'): React.CSSProperties => ({ fontSize:8.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:c, textAlign:'center', marginBottom:2, lineHeight:1.3 });
  const ta = (c='#374151'): React.CSSProperties => ({ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8.5, textAlign:'center', lineHeight:1.4, color:c, fontFamily:'inherit', minHeight:20 });

  const A = { x: 220, y: 16,  w: 280, h: 58, rx: 29 };  // Tetikleyici — oval
  const B = { x: 160, y: 134, w: 400, h: 68, rx: 10 };  // Ruminatif düşünce
  const C = { x: 24,  y: 272, w: 214, h: 78, rx: 10 };  // Duygusal yoğunlaşma
  const D = { x: 482, y: 272, w: 214, h: 78, rx: 10 };  // Çözümsüzlük
  const E = { x: 24,  y: 418, w: 214, h: 78, rx: 10 };  // Pasif baş etme
  const F = { x: 482, y: 418, w: 214, h: 78, rx: 10 };  // Belirti artışı
  const G = { x: 175, y: 556, w: 370, h: 68, rx: 10 };  // Dikkat daralması
  const M = { x: 534, y: 28,  w: 174, h: 78, rx: 10 };  // Meta-inanç (noktalı)

  const bCx = (b: typeof A) => b.x + b.w/2;
  const bCy = (b: typeof A) => b.y + b.h/2;

  return (
    <div className="overflow-x-auto -mx-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 720 }}>
        <defs>
          <marker id="rub-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0,8 3,0 6" fill="#6b7280" />
          </marker>
          <marker id="rub-r" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0,8 3,0 6" fill="#dc2626" />
          </marker>
          <marker id="rub-v" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0,8 3,0 6" fill="#7c3aed" />
          </marker>
        </defs>

        {/* Forward arrows */}
        <line x1={bCx(A)} y1={A.y+A.h} x2={bCx(B)} y2={B.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#rub-a)" />
        <line x1={B.x} y1={bCy(B)} x2={C.x+C.w} y2={bCy(C)} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#rub-a)" />
        <line x1={B.x+B.w} y1={bCy(B)} x2={D.x} y2={bCy(D)} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#rub-a)" />
        <line x1={bCx(C)} y1={C.y+C.h} x2={bCx(E)} y2={E.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#rub-a)" />
        <line x1={bCx(D)} y1={D.y+D.h} x2={bCx(F)} y2={F.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#rub-a)" />
        <line x1={bCx(E)} y1={E.y+E.h} x2={G.x+30} y2={G.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#rub-a)" />
        <line x1={bCx(F)} y1={F.y+F.h} x2={G.x+G.w-30} y2={G.y} stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#rub-a)" />

        {/* Red feedback: E→B (sol duvar) */}
        <path d={`M ${E.x},${bCy(E)} L 8,${bCy(E)} L 8,${bCy(B)} L ${B.x},${bCy(B)}`}
          fill="none" stroke="#dc2626" strokeWidth="1.8" markerEnd="url(#rub-r)" />
        {/* Red feedback: F→B (sağ duvar) */}
        <path d={`M ${F.x+F.w},${bCy(F)} L ${W-8},${bCy(F)} L ${W-8},${bCy(B)} L ${B.x+B.w},${bCy(B)}`}
          fill="none" stroke="#dc2626" strokeWidth="1.8" markerEnd="url(#rub-r)" />
        {/* Purple dashed: G→B (dikkat saplanma) */}
        <path d={`M ${bCx(G)},${G.y+G.h} C ${bCx(G)},${G.y+G.h+50} ${bCx(B)},${G.y+G.h+50} ${bCx(B)},${B.y+B.h}`}
          fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="5,3" markerEnd="url(#rub-v)" />
        {/* Meta-inanç → B */}
        <line x1={M.x} y1={bCy(M)} x2={B.x+B.w} y2={B.y+16}
          stroke="#9ca3af" strokeWidth="1.2" strokeDasharray="4,3" markerEnd="url(#rub-a)" />

        {/* A: Tetikleyici */}
        <rect x={A.x} y={A.y} width={A.w} height={A.h} rx={A.rx} fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.8" />
        <foreignObject x={A.x+10} y={A.y+6} width={A.w-20} height={A.h-12}>
          <div style={fi}><div style={lbl('#1e40af')}>Tetikleyici Olay / Düşünce</div>
            <textarea value={fields['rub_tetik']||''} onChange={e=>onChange('rub_tetik',e.target.value)} style={ta('#1d4ed8')} placeholder="Kaybetme, başarısızlık, reddedilme…" /></div>
        </foreignObject>

        {/* B: Ruminatif düşünce */}
        <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={B.rx} fill="#fdf4ff" stroke="#c084fc" strokeWidth="2" />
        <foreignObject x={B.x+12} y={B.y+6} width={B.w-24} height={B.h-12}>
          <div style={fi}><div style={lbl('#7e22ce')}>Ruminatif Düşünce Süreci</div>
            <textarea value={fields['rub_sureci']||''} onChange={e=>onChange('rub_sureci',e.target.value)} style={ta('#6d28d9')} placeholder='"Neden böyle oldu?" — tekrarlayan analizler' /></div>
        </foreignObject>

        {/* C: Duygusal yoğunlaşma */}
        <rect x={C.x} y={C.y} width={C.w} height={C.h} rx={C.rx} fill="#fef2f2" stroke="#fca5a5" strokeWidth="1.5" />
        <foreignObject x={C.x+8} y={C.y+6} width={C.w-16} height={C.h-12}>
          <div style={fi}><div style={lbl('#991b1b')}>Duygusal Yoğunlaşma</div>
            <textarea value={fields['rub_duygu']||''} onChange={e=>onChange('rub_duygu',e.target.value)} style={ta('#b91c1c')} placeholder="Üzüntü, utanç, öfke artar" /></div>
        </foreignObject>

        {/* D: Çözümsüzlük */}
        <rect x={D.x} y={D.y} width={D.w} height={D.h} rx={D.rx} fill="#fff7ed" stroke="#fb923c" strokeWidth="1.5" />
        <foreignObject x={D.x+8} y={D.y+6} width={D.w-16} height={D.h-12}>
          <div style={fi}><div style={lbl('#9a3412')}>Çözümsüzlük Hissi</div>
            <textarea value={fields['rub_cozumsuz']||''} onChange={e=>onChange('rub_cozumsuz',e.target.value)} style={ta('#c2410c')} placeholder="Çaresizlik, kontrol kaybı, umutsuzluk" /></div>
        </foreignObject>

        {/* E: Pasif baş etme */}
        <rect x={E.x} y={E.y} width={E.w} height={E.h} rx={E.rx} fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />
        <foreignObject x={E.x+8} y={E.y+6} width={E.w-16} height={E.h-12}>
          <div style={fi}><div style={lbl('#166534')}>Pasif Baş Etme / Kaçınma</div>
            <textarea value={fields['rub_kacinma']||''} onChange={e=>onChange('rub_kacinma',e.target.value)} style={ta('#15803d')} placeholder="Çekilme, uyku, sosyal izolasyon" /></div>
        </foreignObject>

        {/* F: Belirti artışı */}
        <rect x={F.x} y={F.y} width={F.w} height={F.h} rx={F.rx} fill="#fef2f2" stroke="#fca5a5" strokeWidth="1.5" />
        <foreignObject x={F.x+8} y={F.y+6} width={F.w-16} height={F.h-12}>
          <div style={fi}><div style={lbl('#991b1b')}>Depresif Belirti Artışı</div>
            <textarea value={fields['rub_belirti']||''} onChange={e=>onChange('rub_belirti',e.target.value)} style={ta('#b91c1c')} placeholder="Enerji kaybı, ağlama, umutsuzluk" /></div>
        </foreignObject>

        {/* G: Dikkat daralması */}
        <rect x={G.x} y={G.y} width={G.w} height={G.h} rx={G.rx} fill="#fdf4ff" stroke="#a855f7" strokeWidth="2" />
        <foreignObject x={G.x+10} y={G.y+6} width={G.w-20} height={G.h-12}>
          <div style={fi}><div style={lbl('#6b21a8')}>Dikkat Daralması &amp; Saplanma</div>
            <textarea value={fields['rub_dikkat']||''} onChange={e=>onChange('rub_dikkat',e.target.value)} style={ta('#7e22ce')} placeholder="Olumsuz anılara odaklanma, esnek düşünememe" /></div>
        </foreignObject>

        {/* M: Meta-inanç */}
        <rect x={M.x} y={M.y} width={M.w} height={M.h} rx={M.rx} fill="#fafaf9" stroke="#9ca3af" strokeWidth="1.2" strokeDasharray="5,3" />
        <foreignObject x={M.x+8} y={M.y+5} width={M.w-16} height={M.h-10}>
          <div style={fi}>
            <div style={{ fontSize:7.5, fontWeight:700, color:'#6b7280', textAlign:'center', textTransform:'uppercase', letterSpacing:'0.07em', lineHeight:1.3, marginBottom:2 }}>Meta-İnanç</div>
            <textarea value={fields['rub_meta']||''} onChange={e=>onChange('rub_meta',e.target.value)}
              style={{ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8, textAlign:'center', lineHeight:1.4, color:'#6b7280', fontFamily:'inherit', minHeight:20 }}
              placeholder={'"Düşünmek sorunu çözer"\n"Endişelenmek beni hazırlar"'} />
          </div>
        </foreignObject>
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5"><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#6b7280" strokeWidth="1.5"/></svg>İleri akış</span>
        <span className="flex items-center gap-1.5"><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#dc2626" strokeWidth="1.8"/></svg>Döngüsel geri besleme</span>
        <span className="flex items-center gap-1.5"><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#7c3aed" strokeWidth="1.8" strokeDasharray="4,2"/></svg>Dikkat saplanma döngüsü</span>
        <span className="flex items-center gap-1.5"><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#9ca3af" strokeWidth="1.2" strokeDasharray="4,2"/></svg>Meta-inanç etkisi</span>
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Ruminasyon — Watkins (2008) / Wells (1999) Üst-Biliş Modeli</p>
    </div>
  );
}

// ─── Çekingenlik (Geri Durma) Deseni ─────────────────────────────────────────
function CekingenlikDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 680, H = 580;
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const lbl = (c='#4c1d95'): React.CSSProperties => ({ fontSize:9, fontWeight:700, color:c, textAlign:'center', marginBottom:2, lineHeight:1.3 });
  const ta = (c='#5b21b6'): React.CSSProperties => ({ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8.5, textAlign:'center', lineHeight:1.4, color:c, fontFamily:'inherit', minHeight:18 });

  const cx = 340;
  const boxes = [
    { y: 20,  h: 58, key:'cek_durum',   label:'Durum',                                              fill:'#ede9fe', stroke:'#8b5cf6' },
    { y: 128, h: 58, key:'cek_oto',     label:'Otomatik (Anlık) Düşünce',                           fill:'#ede9fe', stroke:'#8b5cf6' },
    { y: 236, h: 58, key:'cek_duygu',   label:'Olumsuz (Disforik) Duygu',                           fill:'#ede9fe', stroke:'#8b5cf6' },
    { y: 344, h: 68, key:'cek_davranis',label:'Olumsuz Duyguya Yönelik Düşünce ve İlişkili Davranış', fill:'#ddd6fe', stroke:'#7c3aed' },
  ];
  const bW = 320;

  // Bottom two results
  const resL = { x: 40,  y: 472, w: 240, h: 80 };
  const resR = { x: 400, y: 472, w: 240, h: 80 };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 680 }}>
        <defs>
          <marker id="cek-p" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <polygon points="0 0,10 4,0 8" fill="#7c3aed" />
          </marker>
        </defs>

        {/* Vertical arrows */}
        {boxes.slice(0,-1).map((b,i) => (
          <line key={i} x1={cx} y1={b.y+b.h} x2={cx} y2={boxes[i+1].y}
            stroke="#7c3aed" strokeWidth="6" markerEnd="url(#cek-p)" />
        ))}

        {/* Fork arrows from last box to two results */}
        <line x1={cx-20} y1={boxes[3].y+boxes[3].h} x2={resL.x+resL.w/2} y2={resL.y}
          stroke="#7c3aed" strokeWidth="6" markerEnd="url(#cek-p)" />
        <line x1={cx+20} y1={boxes[3].y+boxes[3].h} x2={resR.x+resR.w/2} y2={resR.y}
          stroke="#7c3aed" strokeWidth="6" markerEnd="url(#cek-p)" />

        {/* Main boxes */}
        {boxes.map(b => (
          <g key={b.key}>
            <rect x={cx-bW/2} y={b.y} width={bW} height={b.h} rx="8" fill={b.fill} stroke={b.stroke} strokeWidth="1.8" />
            <foreignObject x={cx-bW/2+10} y={b.y+5} width={bW-20} height={b.h-10}>
              <div style={fi}><div style={lbl()}>{b.label}</div>
                <textarea value={fields[b.key]||''} onChange={e=>onChange(b.key,e.target.value)} style={ta()} placeholder="…" /></div>
            </foreignObject>
          </g>
        ))}

        {/* Result boxes */}
        {[
          { ...resL, key:'cek_duyg_sonuc', label:'Duygusal Sonuç' },
          { ...resR, key:'cek_somut_sonuc', label:'Somut Sonuç' },
        ].map(r => (
          <g key={r.key}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="8" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="1.5" />
            <foreignObject x={r.x+8} y={r.y+5} width={r.w-16} height={r.h-10}>
              <div style={fi}><div style={lbl('#6d28d9')}>{r.label}</div>
                <textarea value={fields[r.key]||''} onChange={e=>onChange(r.key,e.target.value)} style={ta('#5b21b6')} placeholder="…" /></div>
            </foreignObject>
          </g>
        ))}
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Çekingenlik (Geri Durma) Deseni</p>
    </div>
  );
}

// ─── Basit Obsesyon Döngüsü — 5 renkli daire (pentagon) ──────────────────────
function BasitObsesyonDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 680, H = 600, r = 72;
  const cx = W/2, cy = H/2 + 10;
  const dist = 200;

  // Pentagon nodes clockwise from top
  const angles = [-90, -18, 54, 126, 198]; // degrees, top=Tetikleyici
  const nodes = [
    { label:'Tetikleyici\nUyaran', key:'obs_tetik',  fill:'#fed7aa', stroke:'#f97316', tc:'#7c2d12' },
    { label:'Obsesyon',            key:'obs_obs',    fill:'#e5e7eb', stroke:'#6b7280', tc:'#1f2937' },
    { label:'Sıkıntı',             key:'obs_sikinti',fill:'#fef08a', stroke:'#ca8a04', tc:'#713f12' },
    { label:'Kompulsiyon',         key:'obs_komp',   fill:'#bfdbfe', stroke:'#3b82f6', tc:'#1e3a8a' },
    { label:'Rahatlama',           key:'obs_rahat',  fill:'#bbf7d0', stroke:'#16a34a', tc:'#14532d' },
  ];
  const nxy = angles.map(a => ({
    x: cx + dist * Math.cos((a * Math.PI) / 180),
    y: cy + dist * Math.sin((a * Math.PI) / 180),
  }));
  const arrowCols = ['#f97316','#6b7280','#ca8a04','#3b82f6','#16a34a'];
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 680 }}>
        <defs>
          {arrowCols.map((c, i) => (
            <marker key={i} id={`bo-${i}`} markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
              <polygon points="0 0,10 4,0 8" fill={c} />
            </marker>
          ))}
        </defs>

        {/* Arrows between nodes (clockwise) */}
        {nodes.map((_, i) => {
          const src = nxy[i], dst = nxy[(i+1) % nodes.length];
          const dx = dst.x - src.x, dy = dst.y - src.y;
          const len = Math.sqrt(dx*dx+dy*dy);
          const ux = dx/len, uy = dy/len;
          return <line key={i}
            x1={src.x + (r+4)*ux} y1={src.y + (r+4)*uy}
            x2={dst.x - (r+14)*ux} y2={dst.y - (r+14)*uy}
            stroke={arrowCols[i]} strokeWidth="7" markerEnd={`url(#bo-${i})`} />;
        })}

        {/* Circles */}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={nxy[i].x} cy={nxy[i].y} r={r} fill={n.fill} stroke={n.stroke} strokeWidth="3" />
            <foreignObject x={nxy[i].x-r+8} y={nxy[i].y-r+10} width={(r-8)*2} height={(r-10)*2}>
              <div style={fi}>
                {n.label.split('\n').map((l,j) => (
                  <div key={j} style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em', color:n.tc, textAlign:'center', lineHeight:1.25 }}>{l}</div>
                ))}
                <textarea value={fields[n.key]||''} onChange={e=>onChange(n.key,e.target.value)}
                  style={{ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8, textAlign:'center', lineHeight:1.3, color:n.tc, fontFamily:'inherit', minHeight:16, marginTop:2 }}
                  placeholder="…" />
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Basit Obsesyon Döngüsü — OKB Kısır Döngü Modeli</p>
    </div>
  );
}

// ─── Travma Modeli ────────────────────────────────────────────────────────────
function TravmaDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  const W = 720, H = 560;
  const fi: React.CSSProperties = { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' };
  const ta = (c='#374151'): React.CSSProperties => ({ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:8.5, textAlign:'center', lineHeight:1.4, color:c, fontFamily:'inherit', minHeight:20 });

  // Circle center and radius for the 4-node ring
  const ringCx = 430, ringCy = 295, ringR = 175;
  // 4 nodes on ring: top=Anlam, right=KAYGI, bottom=Kaçınma, left=İzolasyon
  const ringAngles = [-80, 10, 100, 190]; // degrees
  const ringNodes = [
    { label:'Anlam / Yeniden Yaşama', key:'tr_anlam',    fill:'#fff7ed', stroke:'#f97316', tc:'#9a3412', sub:'- Yeniden yaşama\n- İşlevsiz anlamlandırma' },
    { label:'KAYGI',                  key:'tr_kaygi',    fill:'#fef2f2', stroke:'#ef4444', tc:'#991b1b', sub:'', star:true },
    { label:'Kaçınma',                key:'tr_kacinma',  fill:'#fff7ed', stroke:'#f97316', tc:'#9a3412', sub:'' },
    { label:'İzolasyon',              key:'tr_izolasyon',fill:'#fff7ed', stroke:'#f97316', tc:'#9a3412', sub:'- Yeni bilgi girişine engel' },
  ];
  const rxy = ringAngles.map(a => ({
    x: ringCx + ringR * Math.cos((a * Math.PI)/180),
    y: ringCy + ringR * Math.sin((a * Math.PI)/180),
  }));
  const nr = 68; // node radius

  // Travma Anısı box (top-center of ring area)
  const taBox = { x: 295, y: 30, w: 270, h: 65 };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 720 }}>
        <defs>
          <marker id="tr-o" markerWidth="11" markerHeight="9" refX="10" refY="4.5" orient="auto">
            <polygon points="0 0,11 4.5,0 9" fill="#f97316" />
          </marker>
          <marker id="tr-b" markerWidth="11" markerHeight="9" refX="10" refY="4.5" orient="auto">
            <polygon points="0 0,11 4.5,0 9" fill="#3b82f6" />
          </marker>
        </defs>

        {/* TRAVMA label (left) + blue arrow → Travma Anısı */}
        <text x="22" y="68" fontSize="22" fontWeight="900" fill="#dc2626" fontFamily="inherit">TRAVMA</text>
        <line x1={145} y1={62} x2={taBox.x-6} y2={taBox.y+taBox.h/2}
          stroke="#3b82f6" strokeWidth="10" markerEnd="url(#tr-b)" />

        {/* Travma Anısı box */}
        <rect x={taBox.x} y={taBox.y} width={taBox.w} height={taBox.h} rx="8" fill="white" stroke="#6b7280" strokeWidth="2" />
        <foreignObject x={taBox.x+10} y={taBox.y+5} width={taBox.w-20} height={taBox.h-10}>
          <div style={fi}>
            <div style={{ fontSize:10, fontWeight:800, color:'#1f2937', textAlign:'center', marginBottom:3 }}>Travma Anısı</div>
            <textarea value={fields['tr_ani']||''} onChange={e=>onChange('tr_ani',e.target.value)} style={ta()} placeholder="Travma içeriği…" />
          </div>
        </foreignObject>

        {/* Arrow: Travma Anısı → top ring node (Anlam) */}
        {(() => {
          const dst = rxy[0];
          const dx2 = dst.x - (taBox.x+taBox.w/2), dy2 = dst.y - (taBox.y+taBox.h);
          const len = Math.sqrt(dx2*dx2+dy2*dy2);
          return <line
            x1={taBox.x+taBox.w/2} y1={taBox.y+taBox.h}
            x2={dst.x - (nr+6)*dx2/len} y2={dst.y - (nr+6)*dy2/len}
            stroke="#f97316" strokeWidth="7" markerEnd="url(#tr-o)" />;
        })()}

        {/* Ring arrows (clockwise): node[i] → node[i+1] */}
        {ringNodes.map((_, i) => {
          const src = rxy[i], dst = rxy[(i+1)%4];
          // curved arc between adjacent ring nodes
          const mx = (src.x+dst.x)/2, my = (src.y+dst.y)/2;
          const nx2 = ringCx - mx, ny2 = ringCy - my;
          const nl = Math.sqrt(nx2*nx2+ny2*ny2);
          const cpx = mx - nx2/nl*50, cpy = my - ny2/nl*50;
          const dx2 = dst.x-src.x, dy2 = dst.y-src.y;
          const len = Math.sqrt(dx2*dx2+dy2*dy2);
          const ux = dx2/len, uy = dy2/len;
          const x1 = src.x + (nr+4)*ux, y1 = src.y + (nr+4)*uy;
          const x2 = dst.x - (nr+14)*ux, y2 = dst.y - (nr+14)*uy;
          return <path key={i} d={`M ${x1},${y1} Q ${cpx},${cpy} ${x2},${y2}`}
            fill="none" stroke="#f97316" strokeWidth="7" markerEnd="url(#tr-o)" />;
        })}

        {/* Ring nodes */}
        {ringNodes.map((n, i) => (
          <g key={i}>
            {n.star ? (
              // Starburst for KAYGI
              <>
                {Array.from({length:10},(_,k)=>{
                  const a1 = (k*36-90)*Math.PI/180, a2 = (k*36-90+18)*Math.PI/180;
                  return <polygon key={k}
                    points={`${rxy[i].x},${rxy[i].y} ${rxy[i].x+(nr+14)*Math.cos(a1)},${rxy[i].y+(nr+14)*Math.sin(a1)} ${rxy[i].x+(nr+4)*Math.cos(a2)},${rxy[i].y+(nr+4)*Math.sin(a2)}`}
                    fill="#fef2f2" stroke="#ef4444" strokeWidth="1" />;
                })}
                <circle cx={rxy[i].x} cy={rxy[i].y} r={nr} fill="#fef2f2" stroke="#ef4444" strokeWidth="2.5" />
              </>
            ) : (
              <circle cx={rxy[i].x} cy={rxy[i].y} r={nr} fill={n.fill} stroke={n.stroke} strokeWidth="2.5" />
            )}
            <foreignObject x={rxy[i].x-nr+6} y={rxy[i].y-nr+12} width={(nr-6)*2} height={(nr-12)*2}>
              <div style={fi}>
                <div style={{ fontSize: n.star ? 12 : 9, fontWeight:800, color:n.tc, textAlign:'center', lineHeight:1.2, marginBottom:2 }}>{n.label}</div>
                {n.sub && <div style={{ fontSize:7, color:n.tc, textAlign:'center', lineHeight:1.4, whiteSpace:'pre-line', opacity:0.8 }}>{n.sub}</div>}
                <textarea value={fields[n.key]||''} onChange={e=>onChange(n.key,e.target.value)}
                  style={{ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:7.5, textAlign:'center', lineHeight:1.3, color:n.tc, fontFamily:'inherit', minHeight:14 }}
                  placeholder="…" />
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1 italic">Travma ve TSSB Bilişsel Modeli — Ehlers &amp; Clark (2000)</p>
    </div>
  );
}

function YabDiagram({ fields, onChange }: { fields: FieldsState; onChange: (k: string, v: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto py-4">
      <div className="grid grid-cols-3 gap-4 items-center">
        <div className="space-y-3">
          <EditableNode label="Güncel Kaygılar / Kişisel Hedefler" fieldKey="yab_worry_topics" fields={fields} onChange={onChange}
            className="border-orange-400 bg-orange-50 text-orange-900"
          />
          <EditableNode label="Endişeyi Tetikleyen İçsel ve Dışsal Faktörler" fieldKey="yab_triggers" fields={fields} onChange={onChange}
            className="border-orange-400 bg-orange-50 text-orange-900"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-orange-500 text-2xl font-bold">→</span>
          <EditableNode label="Esas Endişe İçeriği ve Kaygı Belirtileri" fieldKey="yab_core_worry" fields={fields} onChange={onChange}
            className="border-orange-600 bg-orange-500 text-white w-full"
          />
          <span className="text-orange-500 text-2xl font-bold">→</span>
        </div>
        <div className="space-y-3">
          <EditableNode label="Üst-bilişsel Değerlendirme Profili" fieldKey="yab_meta_cognition" fields={fields} onChange={onChange}
            className="border-orange-400 bg-orange-50 text-orange-900"
          />
          <EditableNode label="Endişeyi Kontrol Etme Stratejisi" fieldKey="yab_control_strategy" fields={fields} onChange={onChange}
            className="border-orange-400 bg-orange-50 text-orange-900"
          />
          <EditableNode label="Olumsuz Sorun Yönelimi ve Güvence Arama" fieldKey="yab_negative_orientation" fields={fields} onChange={onChange}
            className="border-orange-400 bg-orange-50 text-orange-900"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Dışa aktarılan tekil diyagram görüntüleyici ─────────────────────────────
export function DiagramViewer({ type }: { type: DiagramType }) {
  const [fields, setFields] = useState<FieldsState>({});
  const onChange = (k: string, v: string) => setFields(prev => ({ ...prev, [k]: v }));

  const render = () => {
    switch (type) {
      case 'sosyal-kaygi':              return <SosyalKaygiDiagram              fields={fields} onChange={onChange} />;
      case 'okb':                       return <OkbDiagram                      fields={fields} onChange={onChange} />;
      case 'depresyon-gelisimsel':      return <DepresyonGelisimselDiagram      fields={fields} onChange={onChange} />;
      case 'depresyon-dongu':           return <DepresyonDonguDiagram           fields={fields} onChange={onChange} />;
      case 'panik':                     return <PanikDiagram                    fields={fields} onChange={onChange} />;
      case 'yab':                       return <YabDiagram                      fields={fields} onChange={onChange} />;
      case 'cocuk-depresyon':           return <CocukDepresyonDiagram           fields={fields} onChange={onChange} />;
      case 'akb':                       return <AkbDiagram                      fields={fields} onChange={onChange} />;
      case 'anksiyete-formul':          return <AnksiyeteFormulDiagram          fields={fields} onChange={onChange} />;
      case 'ozgul-fobi':                return <OzgulFobiDiagram                fields={fields} onChange={onChange} />;
      case 'yeme-sorunlari':            return <YemeSorunlariDiagram            fields={fields} onChange={onChange} />;
      case 'istek-mutluluk':            return <IstekMutlulukDiagram            fields={fields} onChange={onChange} />;
      case 'ddd-basit':                 return <DddBasitDiagram                 fields={fields} onChange={onChange} />;
      case 'akb-komplex':               return <AkbKomplexDiagram               fields={fields} onChange={onChange} />;
      case 'kacinma-ogrenme':           return <KacinmaOgrenmeDiagram           fields={fields} onChange={onChange} />;
      case 'yab-basit':                 return <YabBasitDiagram                 fields={fields} onChange={onChange} />;
      case 'hastalik-anksiyete':        return <HastalıkAnksiyeteDiagram        fields={fields} onChange={onChange} />;
      case 'hastalik-anksiyete-detay':  return <HastalıkAnksiyeteDetayDiagram   fields={fields} onChange={onChange} />;
      case 'ruminasyon':                return <RuminasyonDiagram               fields={fields} onChange={onChange} />;
      case 'ruminasyon-ust-bilis':      return <RuminasyonUstBilisDiagram       fields={fields} onChange={onChange} />;
      case 'cekingenlik':               return <CekingenlikDiagram              fields={fields} onChange={onChange} />;
      case 'basit-obsesyon':            return <BasitObsesyonDiagram            fields={fields} onChange={onChange} />;
      case 'travma':                    return <TravmaDiagram                   fields={fields} onChange={onChange} />;
      default:                          return null;
    }
  };

  return <div className="w-full">{render()}</div>;
}

export default function BozuklukDongusu() {
  const [active, setActive] = useState<DiagramType | null>(null);
  const [fields, setFields] = useState<FieldsState>({});
  const [enabled, setEnabled] = useState<Set<DiagramType>>(new Set());

  const toggle = (id: DiagramType) => {
    setEnabled(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); if (active === id) setActive(null); }
      else { next.add(id); setActive(id); }
      return next;
    });
  };

  const onChange = (k: string, v: string) => setFields(prev => ({ ...prev, [k]: v }));

  const renderDiagram = (id: DiagramType) => {
    switch (id) {
      case 'sosyal-kaygi': return <SosyalKaygiDiagram fields={fields} onChange={onChange} />;
      case 'okb': return <OkbDiagram fields={fields} onChange={onChange} />;
      case 'depresyon-gelisimsel': return <DepresyonGelisimselDiagram fields={fields} onChange={onChange} />;
      case 'depresyon-dongu': return <DepresyonDonguDiagram fields={fields} onChange={onChange} />;
      case 'panik': return <PanikDiagram fields={fields} onChange={onChange} />;
      case 'yab': return <YabDiagram fields={fields} onChange={onChange} />;
      case 'cocuk-depresyon':  return <CocukDepresyonDiagram  fields={fields} onChange={onChange} />;
      case 'akb':              return <AkbDiagram             fields={fields} onChange={onChange} />;
      case 'anksiyete-formul': return <AnksiyeteFormulDiagram fields={fields} onChange={onChange} />;
      case 'ozgul-fobi':                return <OzgulFobiDiagram              fields={fields} onChange={onChange} />;
      case 'yeme-sorunlari':            return <YemeSorunlariDiagram           fields={fields} onChange={onChange} />;
      case 'istek-mutluluk':            return <IstekMutlulukDiagram           fields={fields} onChange={onChange} />;
      case 'ddd-basit':                 return <DddBasitDiagram                fields={fields} onChange={onChange} />;
      case 'akb-komplex':               return <AkbKomplexDiagram              fields={fields} onChange={onChange} />;
      case 'kacinma-ogrenme':           return <KacinmaOgrenmeDiagram          fields={fields} onChange={onChange} />;
      case 'yab-basit':                 return <YabBasitDiagram                fields={fields} onChange={onChange} />;
      case 'hastalik-anksiyete':        return <HastalıkAnksiyeteDiagram       fields={fields} onChange={onChange} />;
      case 'hastalik-anksiyete-detay':  return <HastalıkAnksiyeteDetayDiagram  fields={fields} onChange={onChange} />;
      case 'ruminasyon':                return <RuminasyonDiagram              fields={fields} onChange={onChange} />;
      case 'ruminasyon-ust-bilis':     return <RuminasyonUstBilisDiagram      fields={fields} onChange={onChange} />;
      case 'cekingenlik':               return <CekingenlikDiagram             fields={fields} onChange={onChange} />;
      case 'basit-obsesyon':            return <BasitObsesyonDiagram           fields={fields} onChange={onChange} />;
      case 'travma':                    return <TravmaDiagram                  fields={fields} onChange={onChange} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="text-base font-semibold text-[#0E0F12] mb-1">İleri Düzey Görselleştirilmiş Formülasyonlar</h2>
        <p className="text-xs text-gray-500 mb-3">Danışana özel grafiksel formülasyon şablonlarını aktif edin.</p>
        <div className="flex flex-wrap gap-2">
          {DIAGRAMS.map(d => (
            <label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={enabled.has(d.id)}
                onChange={() => toggle(d.id)}
                className="rounded accent-gray-800"
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      {/* Tab buttons for enabled diagrams */}
      {enabled.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from(enabled).map(id => {
            const d = DIAGRAMS.find(x => x.id === id)!;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cx(
                  'text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
                  active === id ? 'bg-[#0E0F12] text-white border-[#0E0F12]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Active diagram */}
      {active && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-[#0E0F12]">{DIAGRAMS.find(d => d.id === active)?.label}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">BDT</span>
            <span className="text-[11px] text-gray-400">Alanları danışan bilgisiyle doldurun</span>
          </div>
          {renderDiagram(active)}
        </div>
      )}

      {enabled.size === 0 && (
        <div className="card p-6 text-center text-sm text-gray-500">
          Yukarıdan görselleştirme şablonlarını aktif edin.
        </div>
      )}
    </div>
  );
}
