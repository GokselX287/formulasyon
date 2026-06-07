'use client';
import { useState, useCallback } from 'react';
import { Printer, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Fields = Record<string, string>;

// ─── Shared styles ────────────────────────────────────────────────────────────
const fi: React.CSSProperties = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', height: '100%',
};
const baseTa: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none', outline: 'none',
  resize: 'none', fontSize: 12, lineHeight: 1.6, fontFamily: 'inherit',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label, fkey, fields, onChange, placeholder = '…', rows = 2, accent = '#6366f1',
}: {
  label: string; fkey: string; fields: Fields; onChange: (k: string, v: string) => void;
  placeholder?: string; rows?: number; accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: accent }}>
        {label}
      </label>
      <textarea
        rows={rows}
        value={fields[fkey] || ''}
        onChange={e => onChange(fkey, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-[#FAFAFA] px-3 py-2 text-[13px] text-gray-800 leading-relaxed resize-none focus:outline-none focus:border-indigo-300 focus:bg-white transition-colors"
      />
    </div>
  );
}

function SectionCard({
  title, color = '#6366f1', children, defaultOpen = true,
}: {
  title: string; color?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        style={{ background: color + '12' }}
      >
        <span className="text-sm font-semibold" style={{ color }}>{title}</span>
        {open
          ? <ChevronUp className="w-4 h-4" style={{ color }} />
          : <ChevronDown className="w-4 h-4" style={{ color }} />}
      </button>
      {open && <div className="px-5 py-4 space-y-4 bg-white">{children}</div>}
    </div>
  );
}

// ─── ACT Hexaflex SVG ─────────────────────────────────────────────────────────
// Altı süreç, psikolojik esneksizlik (sorun) tarafı
function HexaflexSVG({ fields, onChange }: { fields: Fields; onChange: (k: string, v: string) => void }) {
  const W = 680, H = 600;
  const cx = W / 2, cy = H / 2 + 10;
  const outerR = 220, innerR = 72;

  // 6 nodes at 60° intervals, top = Deneyimsel Kaçınma (top)
  const angles = [-90, -30, 30, 90, 150, 210];
  const hexNodes = [
    { key: 'act_kacınma',   label: 'Deneyimsel\nKaçınma',        color: '#dc2626', bg: '#fef2f2', desc: 'Rahatsız edici iç deneyimlerden kaçınma' },
    { key: 'act_fuzyon',    label: 'Bilişsel\nFüzyon',            color: '#ea580c', bg: '#fff7ed', desc: 'Düşüncelere yapışma, gerçek gibi yaşama' },
    { key: 'act_kav_ben',   label: 'Kavramlaştırılmış\nBenlik',   color: '#ca8a04', bg: '#fefce8', desc: 'Benliği hikâye olarak yaşama, katı öz-kimlik' },
    { key: 'act_eylemsiz',  label: 'Eylemsizlik /\nKaçınma Eylemi', color: '#16a34a', bg: '#f0fdf4', desc: 'Değer uyumlu eylem eksikliği' },
    { key: 'act_deger_yok', label: 'Değerlerle\nTemas Eksikliği', color: '#0891b2', bg: '#ecfeff', desc: 'Ne önemli olduğuna dair belirsizlik' },
    { key: 'act_gez_gec',   label: 'Geçmiş/Gelecek\nTakılma',    color: '#7c3aed', bg: '#f5f3ff', desc: 'Şimdiki ana temas eksikliği' },
  ];

  const nodePos = angles.map(a => ({
    x: cx + outerR * Math.cos((a * Math.PI) / 180),
    y: cy + outerR * Math.sin((a * Math.PI) / 180),
  }));

  // Hexagon path
  const hexPath = nodePos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';

  const taStyle = (color: string): React.CSSProperties => ({
    ...baseTa, fontSize: 9, color, textAlign: 'center', minHeight: 28,
  });
  const nodeR = 62;

  return (
    <div className="overflow-x-auto rounded-xl" style={{ background: '#f8f7ff' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: 680 }}>
        {/* Hexagon outline */}
        <path d={hexPath} fill="rgba(99,102,241,0.04)" stroke="#c7d2fe" strokeWidth="1.5" />

        {/* Spokes from center to nodes */}
        {nodePos.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
            stroke={hexNodes[i].color} strokeWidth="1" opacity={0.25} />
        ))}

        {/* Center circle — Psikolojik Esneksizlik */}
        <circle cx={cx} cy={cy} r={innerR} fill="white" stroke="#6366f1" strokeWidth="2" />
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize="9" fontWeight="800"
          fill="#4338ca" letterSpacing="0.5">PSİKOLOJİK</text>
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="9" fontWeight="800"
          fill="#4338ca" letterSpacing="0.5">ESNEKSİZLİK</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="8" fill="#6b7280"
          letterSpacing="0.3">(sorun alanı)</text>

        {/* Outer nodes */}
        {hexNodes.map((n, i) => (
          <g key={i}>
            <circle cx={nodePos[i].x} cy={nodePos[i].y} r={nodeR}
              fill={n.bg} stroke={n.color} strokeWidth="2" />
            <foreignObject
              x={nodePos[i].x - nodeR + 6}
              y={nodePos[i].y - nodeR + 8}
              width={(nodeR - 6) * 2}
              height={(nodeR - 8) * 2}
            >
              <div style={{ ...fi, gap: 2 }}>
                {n.label.split('\n').map((l, j) => (
                  <div key={j} style={{
                    fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: n.color, textAlign: 'center', lineHeight: 1.25,
                  }}>{l}</div>
                ))}
                <textarea
                  value={fields[n.key] || ''}
                  onChange={e => onChange(n.key, e.target.value)}
                  style={taStyle(n.color)}
                  placeholder={n.desc}
                />
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
      <p className="text-[10px] text-indigo-400 text-center pb-2 italic">
        ACT Psikolojik Esneksizlik Haritası — Hayes, Strosahl &amp; Wilson
      </p>
    </div>
  );
}

// ─── ACT Matrix SVG ──────────────────────────────────────────────────────────
function MatrixSVG({ fields, onChange }: { fields: Fields; onChange: (k: string, v: string) => void }) {
  const W = 700, H = 530;

  // Grid boundary
  const lx = 88, rx = 678, ty = 68, by = 482;
  const cx = (lx + rx) / 2; // 383
  const cy = (ty + by) / 2; // 275
  const pad = 14;
  const centerR = 24;

  const quadrants = [
    {
      key: 'mat_ic_uzak',
      label: 'Hoş Olmayan İç Yaşantılar',
      hint: 'Zihinde beliren düşünceler, duygular,\nanılar, bedensel hisler, imajlar…',
      x: lx, y: ty, w: cx - lx, h: cy - ty,
      color: '#dc2626', bg: '#fef2f2',
    },
    {
      key: 'mat_ic_yaklin',
      label: 'Önem Verilen Kişiler & Şeyler',
      hint: 'Kim ve ne önemli?\nNasıl bir insan olmak istiyorsunuz?\n(Değerler)',
      x: cx, y: ty, w: rx - cx, h: cy - ty,
      color: '#16a34a', bg: '#f0fdf4',
    },
    {
      key: 'mat_dis_uzak',
      label: 'Uzaklaşma Davranışları',
      hint: 'Hoş olmayan iç yaşantılardan uzaklaşmak\niçin ne yapıyorsunuz?\n(kaçınma, kontrol, bastırma…)',
      x: lx, y: cy, w: cx - lx, h: by - cy,
      color: '#ea580c', bg: '#fff7ed',
    },
    {
      key: 'mat_dis_yaklin',
      label: 'Yaklaşma Davranışları',
      hint: 'Önem verdiklerinize doğru atmak\nistediğiniz adımlar neler?\n(değer yönelimli eylemler)',
      x: cx, y: cy, w: rx - cx, h: by - cy,
      color: '#0891b2', bg: '#ecfeff',
    },
  ];

  const taStyle: React.CSSProperties = {
    ...baseTa, fontSize: 11, color: '#374151',
  };

  return (
    <div className="overflow-x-auto rounded-xl" style={{ background: '#f8fafc' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mx-auto" style={{ maxWidth: W }}>
        <defs>
          <marker id="mxArrowRed" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 Z" fill="#dc262688" />
          </marker>
          <marker id="mxArrowGreen" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 Z" fill="#16a34a88" />
          </marker>
          <marker id="mxArrowUp" markerWidth="7" markerHeight="7" refX="3.5" refY="5" orient="auto">
            <path d="M0,7 L7,7 L3.5,0 Z" fill="#6366f188" />
          </marker>
          <marker id="mxArrowDown" markerWidth="7" markerHeight="7" refX="3.5" refY="2" orient="auto">
            <path d="M0,0 L7,0 L3.5,7 Z" fill="#6366f188" />
          </marker>
        </defs>

        {/* Axis labels — top */}
        <text x={cx} y={20} textAnchor="middle" fontSize="11" fontWeight="800" fill="#374151" letterSpacing="1">İÇ DÜNYA</text>
        <text x={cx} y={36} textAnchor="middle" fontSize="9" fill="#9ca3af">(düşünce · duygu · anı · beden · imaj)</text>

        {/* Axis labels — bottom */}
        <text x={cx} y={H - 26} textAnchor="middle" fontSize="11" fontWeight="800" fill="#374151" letterSpacing="1">DIŞ DÜNYA</text>
        <text x={cx} y={H - 12} textAnchor="middle" fontSize="9" fill="#9ca3af">(gözlemlenebilir davranış)</text>

        {/* Axis labels — left */}
        <text
          x={16} y={cy} textAnchor="middle"
          fontSize="10" fontWeight="800" fill="#dc2626" letterSpacing="0.5"
          transform={`rotate(-90,16,${cy})`}
        >← UZAKLAŞMA</text>

        {/* Axis labels — right */}
        <text
          x={W - 14} y={cy} textAnchor="middle"
          fontSize="10" fontWeight="800" fill="#16a34a" letterSpacing="0.5"
          transform={`rotate(90,${W - 14},${cy})`}
        >YAKLAŞMA →</text>

        {/* Outer border */}
        <rect x={lx} y={ty} width={rx - lx} height={by - ty}
          fill="none" stroke="#cbd5e1" strokeWidth="1.5" rx="4" />

        {/* Quadrant fills & content */}
        {quadrants.map(q => (
          <g key={q.key}>
            <rect x={q.x + 1} y={q.y + 1} width={q.w - 2} height={q.h - 2}
              fill={q.bg} />
            <foreignObject
              x={q.x + pad} y={q.y + pad}
              width={q.w - pad * 2} height={q.h - pad * 2}
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 5 }}>
                <div style={{
                  fontSize: 9, fontWeight: 800, color: q.color,
                  textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3,
                }}>
                  {q.label}
                </div>
                <textarea
                  value={fields[q.key] || ''}
                  onChange={e => onChange(q.key, e.target.value)}
                  placeholder={q.hint}
                  style={{ ...taStyle, flex: 1 }}
                />
              </div>
            </foreignObject>
          </g>
        ))}

        {/* Cross lines */}
        <line x1={lx} y1={cy} x2={cx - centerR} y2={cy} stroke="#94a3b8" strokeWidth="1.5" />
        <line x1={cx + centerR} y1={cy} x2={rx} y2={cy} stroke="#94a3b8" strokeWidth="1.5" />
        <line x1={cx} y1={ty} x2={cx} y2={cy - centerR} stroke="#94a3b8" strokeWidth="1.5" />
        <line x1={cx} y1={cy + centerR} x2={cx} y2={by} stroke="#94a3b8" strokeWidth="1.5" />

        {/* Axis arrows from center */}
        <line x1={cx - centerR - 2} y1={cy} x2={lx + 6} y2={cy}
          stroke="#dc262660" strokeWidth="1.5" markerEnd="url(#mxArrowRed)" />
        <line x1={cx + centerR + 2} y1={cy} x2={rx - 6} y2={cy}
          stroke="#16a34a60" strokeWidth="1.5" markerEnd="url(#mxArrowGreen)" />
        <line x1={cx} y1={cy - centerR - 2} x2={cx} y2={ty + 6}
          stroke="#6366f160" strokeWidth="1.5" markerEnd="url(#mxArrowUp)" />
        <line x1={cx} y1={cy + centerR + 2} x2={cx} y2={by - 6}
          stroke="#6366f160" strokeWidth="1.5" markerEnd="url(#mxArrowDown)" />

        {/* Center circle */}
        <circle cx={cx} cy={cy} r={centerR} fill="white" stroke="#64748b" strokeWidth="2" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#334155">Ben</text>
      </svg>
      <p className="text-[10px] text-slate-400 text-center pb-2 italic">
        ACT Matrix — Polk &amp; Schoendorff (2014)
      </p>
    </div>
  );
}

// ─── Values Grid ──────────────────────────────────────────────────────────────
const VALUE_DOMAINS = [
  { key: 'val_aile',    label: 'Aile',              emoji: '👨‍👩‍👧', color: '#dc2626' },
  { key: 'val_iliski',  label: 'Sosyal İlişkiler',  emoji: '🤝', color: '#ea580c' },
  { key: 'val_is',      label: 'İş / Kariyer',      emoji: '💼', color: '#ca8a04' },
  { key: 'val_egitim',  label: 'Eğitim / Gelişim',  emoji: '📚', color: '#16a34a' },
  { key: 'val_saglik',  label: 'Sağlık / Beden',    emoji: '🏃', color: '#0891b2' },
  { key: 'val_manevi',  label: 'Maneviyat / Anlam',  emoji: '🌿', color: '#7c3aed' },
  { key: 'val_toplum',  label: 'Toplum / Vatandaşlık', emoji: '🌍', color: '#0e7490' },
  { key: 'val_eglence', label: 'Eğlence / Hobiler',  emoji: '🎨', color: '#b45309' },
];

function ValuesGrid({ fields, onChange }: { fields: Fields; onChange: (k: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {VALUE_DOMAINS.map(d => (
        <div key={d.key} className="rounded-xl border p-3 flex flex-col gap-1.5"
          style={{ borderColor: d.color + '40', background: d.color + '08' }}>
          <div className="flex items-center gap-1.5">
            <span className="text-base">{d.emoji}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: d.color }}>{d.label}</span>
          </div>
          <textarea
            rows={2}
            value={fields[d.key] || ''}
            onChange={e => onChange(d.key, e.target.value)}
            placeholder="Bu alanda ne önemli?"
            className="w-full bg-transparent border-none outline-none resize-none text-[12px] leading-relaxed"
            style={{ color: d.color + 'cc' }}
          />
          {/* Önem & Eylem rating */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-gray-400">Önem</span>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(v => (
                <button
                  key={v}
                  onClick={() => onChange(d.key + '_onem', String(v))}
                  className="w-4 h-4 rounded-full border text-[8px] flex items-center justify-center transition-all"
                  style={{
                    borderColor: d.color,
                    background: Number(fields[d.key + '_onem'] || 0) >= v ? d.color : 'transparent',
                    color: Number(fields[d.key + '_onem'] || 0) >= v ? 'white' : d.color,
                  }}
                >{v}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-400">Şimdiki eylem</span>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(v => (
                <button
                  key={v}
                  onClick={() => onChange(d.key + '_eylem', String(v))}
                  className="w-4 h-4 rounded-full border text-[8px] flex items-center justify-center transition-all"
                  style={{
                    borderColor: d.color + '80',
                    background: Number(fields[d.key + '_eylem'] || 0) >= v ? d.color + '80' : 'transparent',
                    color: Number(fields[d.key + '_eylem'] || 0) >= v ? 'white' : d.color + '80',
                  }}
                >{v}</button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ActFormulasyon({
  patientName = '', patientAge = '',
}: {
  patientName?: string; patientAge?: string;
}) {
  const [fields, setFields] = useState<Fields>({});
  const onChange = useCallback((k: string, v: string) => setFields(p => ({ ...p, [k]: v })), []);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 tracking-wide">ACT</span>
            <h2 className="text-lg font-semibold text-[#0E0F12]">Temel Formülasyon</h2>
          </div>
          <p className="text-xs text-gray-500">Kabul ve Kararlılık Terapisi — Vaka Kavramsallaştırması</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition"
        >
          <Printer className="w-3.5 h-3.5" />
          Yazdır
        </button>
      </div>

      {/* 1. Hasta & Başvuru Bilgileri */}
      <SectionCard title="1. Hasta & Başvuru Bilgileri" color="#6366f1">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Ad Soyad" fkey="act_ad" fields={fields} onChange={onChange}
            placeholder={patientName || 'Ad Soyad'} rows={1} accent="#6366f1" />
          <Field label="Yaş / Cinsiyet" fkey="act_yas" fields={fields} onChange={onChange}
            placeholder={patientAge || 'Yaş, C/E'} rows={1} accent="#6366f1" />
          <Field label="Meslek / Eğitim" fkey="act_meslek" fields={fields} onChange={onChange}
            placeholder="Meslek…" rows={1} accent="#6366f1" />
          <Field label="Medeni Durum" fkey="act_medeni" fields={fields} onChange={onChange}
            placeholder="Bekar / Evli…" rows={1} accent="#6366f1" />
        </div>
        <Field label="Başvuru Şikayeti" fkey="act_sikayet" fields={fields} onChange={onChange}
          placeholder="Hastanın kendi ifadesiyle başvuru nedeni…" rows={3} accent="#6366f1" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Semptom Süresi" fkey="act_sure" fields={fields} onChange={onChange}
            placeholder="Ne zamandan beri?" rows={1} accent="#6366f1" />
          <Field label="Önceki Tedavi" fkey="act_tedavi" fields={fields} onChange={onChange}
            placeholder="Daha önce terapi / ilaç aldı mı?" rows={1} accent="#6366f1" />
        </div>
      </SectionCard>

      {/* 2. İşlevsel Analiz */}
      <SectionCard title="2. İşlevsel Analiz — Kaçınma Döngüsü" color="#dc2626">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tetikleyici Durumlar (dış)" fkey="fa_dis_tetik" fields={fields} onChange={onChange}
            placeholder="Hangi durumlar, ortamlar, kişiler tetikliyor?" rows={3} accent="#dc2626" />
          <Field label="Tetikleyici Durumlar (iç)" fkey="fa_ic_tetik" fields={fields} onChange={onChange}
            placeholder="Hangi düşünceler, bedensel hisler, anılar?" rows={3} accent="#dc2626" />
          <Field label="Füzyona Girilen Düşünceler" fkey="fa_dusunce" fields={fields} onChange={onChange}
            placeholder='"Ben başarısızım." "Bunu hak ediyorum." — yapışık inançlar…' rows={3} accent="#ea580c" />
          <Field label="Duygular & Bedensel Tepkiler" fkey="fa_duygu" fields={fields} onChange={onChange}
            placeholder="Kaçınılan duygular, bedensel duyumlar…" rows={3} accent="#ea580c" />
          <Field label="Kaçınma / Kontrol Stratejileri" fkey="fa_kacinma" fields={fields} onChange={onChange}
            placeholder="Ne yapıyor? (bastırma, dikkat dağıtma, madde, çekilme…)" rows={3} accent="#dc2626" />
          <Field label="Kısa Vadeli Etki" fkey="fa_kv_etki" fields={fields} onChange={onChange}
            placeholder="Kaçınma kısa vadede ne sağlıyor? (geçici rahatlama…)" rows={3} accent="#dc2626" />
        </div>
        <Field label="Uzun Vadeli Maliyet — Değerlerden Uzaklaşma" fkey="fa_uv_maliyet" fields={fields} onChange={onChange}
          placeholder="Kaçınma uzun vadede ne kaybettiriyor? Yaşam nasıl daralıyor?" rows={2} accent="#991b1b" />
      </SectionCard>

      {/* 3. Psikolojik Esneksizlik Hexaflex */}
      <SectionCard title="3. Psikolojik Esneksizlik Haritası (Hexaflex)" color="#6366f1">
        <HexaflexSVG fields={fields} onChange={onChange} />
        <div className="mt-3 grid grid-cols-2 gap-4">
          <Field label="En Belirgin Süreç (1-2 adet)" fkey="hex_belirgin" fields={fields} onChange={onChange}
            placeholder="Hangi süreç bu danışanda en çok öne çıkıyor?" rows={2} accent="#6366f1" />
          <Field label="Klinisyen Notu" fkey="hex_not" fields={fields} onChange={onChange}
            placeholder="Gözlemler, örnekler, seanslardan öne çıkan…" rows={2} accent="#6366f1" />
        </div>
      </SectionCard>

      {/* 4. ACT Matrix */}
      <SectionCard title="4. ACT Matrix Formülasyonu" color="#475569">
        <p className="text-xs text-gray-500 -mt-1 mb-3">
          Danışanın iç yaşantı ve davranışlarını dört kadrana yerleştirin. Uzaklaşma (away) solda, yaklaşma (toward) sağda; iç dünya üstte, dış dünya altta.
        </p>
        <MatrixSVG fields={fields} onChange={onChange} />
        <div className="grid grid-cols-2 gap-4 mt-3">
          <Field label="Uzaklaşma Döngüsünün Maliyeti" fkey="mat_maliyet" fields={fields} onChange={onChange}
            placeholder="Sol taraftaki davranışlar yaşamı nasıl daraltıyor?" rows={2} accent="#dc2626" />
          <Field label="Fark Edilmesi Gereken An" fkey="mat_fark" fields={fields} onChange={onChange}
            placeholder="Danışan ne zaman uzaklaşmaya başladığını fark edebilir?" rows={2} accent="#0891b2" />
        </div>
      </SectionCard>

      {/* 5. Değerler Haritası */}
      <SectionCard title="5. Değerler Haritası" color="#0891b2">
        <p className="text-xs text-gray-500 -mt-1 mb-2">
          Her alanda önem (1–5) ve şimdiki eylemi (1–5) değerlendirin. Boşluk = müdahale hedefi.
        </p>
        <ValuesGrid fields={fields} onChange={onChange} />
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Field label="En Öncelikli Değer Alanı" fkey="val_oncelik" fields={fields} onChange={onChange}
            placeholder="Danışanın en önem verdiği, en boşluklu alan…" rows={2} accent="#0891b2" />
          <Field label="Değer İfadesi (danışanın sözleriyle)" fkey="val_ifade" fields={fields} onChange={onChange}
            placeholder='"İyi bir baba olmak istiyorum…" gibi somut değer cümleleri' rows={2} accent="#0891b2" />
        </div>
      </SectionCard>

      {/* 6. Kararlı Eylem Hedefleri */}
      <SectionCard title="6. Kararlı Eylem Hedefleri" color="#16a34a">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kısa Vadeli Hedef (bu hafta / ay)" fkey="keh_kv" fields={fields} onChange={onChange}
            placeholder="Somut, küçük, değer yönelimli bir adım…" rows={3} accent="#16a34a" />
          <Field label="Orta Vadeli Hedef (3 ay)" fkey="keh_ov" fields={fields} onChange={onChange}
            placeholder="Değer doğrultusunda büyüyen eylemler…" rows={3} accent="#16a34a" />
          <Field label="Olası Engeller" fkey="keh_engel" fields={fields} onChange={onChange}
            placeholder="Hangi düşünceler, duygular, durumlar engel olabilir?" rows={3} accent="#ca8a04" />
          <Field label="Engeli Aşma Stratejileri" fkey="keh_strateji" fields={fields} onChange={onChange}
            placeholder="Defüzyon, kabul, değer hatırlatma stratejileri…" rows={3} accent="#16a34a" />
        </div>
      </SectionCard>

      {/* 7. Müdahale Planı */}
      <SectionCard title="7. ACT Müdahale Planı & Seans Odağı" color="#7c3aed">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Öncelikli ACT Süreci" fkey="mup_surec" fields={fields} onChange={onChange}
            placeholder="Kabul / Defüzyon / Değerler / Kararlı Eylem / Şimdiki An / Bağlam Olarak Benlik" rows={2} accent="#7c3aed" />
          <Field label="Kullanılacak Metaforlar / Egzersizler" fkey="mup_metafor" fields={fields} onChange={onChange}
            placeholder="Balçık arazisi, yolcular otobüste, gözlemci benlik, nefes…" rows={2} accent="#7c3aed" />
          <Field label="Ev Ödevi / Pratik" fkey="mup_odevis" fields={fields} onChange={onChange}
            placeholder="Değerler günlüğü, kabul egzersizi, davranışsal deney…" rows={2} accent="#7c3aed" />
        </div>
        <Field label="Süpervizyon Notu / Terapötik İlişki" fkey="mup_suprv" fields={fields} onChange={onChange}
          placeholder="Terapiste dair gözlemler, aktarım/karşı-aktarım, zorlanan alan…" rows={3} accent="#7c3aed" />
        <Field label="Genel Formülasyon Özeti" fkey="mup_ozet" fields={fields} onChange={onChange}
          placeholder="Danışanın hikayesini ACT perspektifinden tek paragrafla özetle…" rows={4} accent="#6366f1" />
      </SectionCard>
    </div>
  );
}
