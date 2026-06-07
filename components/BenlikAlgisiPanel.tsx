'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Plus, X, Save, ChevronDown, ChevronUp, Info } from 'lucide-react';
import './BenlikAlgisiPanel.css';

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const KIPLER = [
  { id: 'kirilgan_cocuk',    label: 'Kırılgan Çocuk',     tur: 'cocuk',     emoji: '🫧', desc: 'Acı veren duyguları — yalnızlık, korku, üzüntü — doğrudan yaşar' },
  { id: 'ofkeli_cocuk',      label: 'Öfkeli Çocuk',       tur: 'cocuk',     emoji: '🔥', desc: 'Temel ihtiyaçları karşılanmadığında öfke ve sinirle tepki verir' },
  { id: 'durtusal_cocuk',    label: 'Dürtüsel Çocuk',     tur: 'cocuk',     emoji: '⚡', desc: 'Sonuçlarını düşünmeden anlık ihtiyaçlarını karşılar' },
  { id: 'mutlu_cocuk',       label: 'Mutlu Çocuk',        tur: 'cocuk',     emoji: '🌱', desc: 'Güvenli, sevilmiş, bağlı; merak ve oyunla dünyayla ilişki kurar' },
  { id: 'kopuk_koruyucu',    label: 'Kopuk Koruyucu',     tur: 'bas_etme',  emoji: '🧱', desc: 'Duyguları keser, ilişkiden çekilir, neden önem verdiğini bilmez' },
  { id: 'boyun_egen',        label: 'Boyun Eğen Teslimci',tur: 'bas_etme',  emoji: '🌊', desc: 'Kontrolü başkasına bırakır; çatışmayı engellemek için itaat eder' },
  { id: 'zorba_saldirgan',   label: 'Zorba & Saldırgan',  tur: 'bas_etme',  emoji: '⚔️', desc: 'Güç, tehdit ya da manipülasyonla ihtiyaçlarını elde eder' },
  { id: 'onayi_arayan',      label: 'Onay Arayan',        tur: 'bas_etme',  emoji: '🪞', desc: 'Kabul için kendini sürekli ayarlar; iç sesi dışsal onaya tabi' },
  { id: 'cezalandirici_eb',  label: 'Cezalandırıcı Ebeveyn', tur: 'ebeveyn', emoji: '⛓', desc: 'İç ses: "Hata yaptın, cezayı hak ediyorsun, yeterli değilsin"' },
  { id: 'talepkar_eb',       label: 'Talepkâr Ebeveyn',   tur: 'ebeveyn',   emoji: '📏', desc: 'İç ses: "Daha fazlasını yapmalısın; asla yeterince iyi değilsin"' },
  { id: 'saglikli_yetiskin', label: 'Sağlıklı Yetişkin',  tur: 'saglikli',  emoji: '⚖️', desc: 'Kendi ihtiyaçlarını karşılar, sınır koyar, duygularını düzenler' },
] as const;

type KipId = typeof KIPLER[number]['id'];

const SEMALAR = [
  { id: 'terk_edilme',          label: 'Terk Edilme',           alan: 'Kopukluk & Reddedilme' },
  { id: 'guvensizlik',          label: 'Güvensizlik / İstismar',alan: 'Kopukluk & Reddedilme' },
  { id: 'duygusal_yoksunluk',   label: 'Duygusal Yoksunluk',    alan: 'Kopukluk & Reddedilme' },
  { id: 'yetersizlik_utanc',    label: 'Yetersizlik / Utanç',   alan: 'Kopukluk & Reddedilme' },
  { id: 'sosyal_izolasyon',     label: 'Sosyal İzolasyon',      alan: 'Kopukluk & Reddedilme' },
  { id: 'bagimlilik',           label: 'Bağımlılık / Acizlik',  alan: 'Özerklik Bozulması' },
  { id: 'zarar_kirılganligi',   label: 'Zarar Görme Korkusu',   alan: 'Özerklik Bozulması' },
  { id: 'yapisiklik',           label: 'Yapışıklık / Kaynaşma', alan: 'Özerklik Bozulması' },
  { id: 'basarisizlik',         label: 'Başarısızlık',          alan: 'Özerklik Bozulması' },
  { id: 'hak_kazanma',          label: 'Hak Kazanma',           alan: 'Diğer Yönelim' },
  { id: 'yetersiz_oz_denetim',  label: 'Yetersiz Öz-Denetim',  alan: 'Diğer Yönelim' },
  { id: 'boyun_egme',           label: 'Boyun Eğme',            alan: 'Diğer Yönelim' },
  { id: 'fedakarlik',           label: 'Fedakârlık',            alan: 'Diğer Yönelim' },
  { id: 'onay_arayisi',         label: 'Onay Arayışı',          alan: 'Diğer Yönelim' },
  { id: 'olumsuzluk',           label: 'Olumsuzluk / Karamserlik', alan: 'Aşırı Uyanıklık' },
  { id: 'duygusal_bastirma',    label: 'Duygusal Bastırma',     alan: 'Aşırı Uyanıklık' },
  { id: 'yuksek_standartlar',   label: 'Yüksek Standartlar',    alan: 'Aşırı Uyanıklık' },
  { id: 'cezalandiricilik',     label: 'Cezalandırıcılık',      alan: 'Aşırı Uyanıklık' },
] as const;

type SemaId = typeof SEMALAR[number]['id'];

const TUR_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  cocuk:     { label: 'Çocuk Kipleri',      bg: '#EEF4FF', color: '#3B5BDB', border: '#C5D8FA' },
  bas_etme:  { label: 'Baş Etme Kipleri',   bg: '#FFF4E6', color: '#B45309', border: '#FFD8A8' },
  ebeveyn:   { label: 'Ebeveyn Kipleri',    bg: '#FFF0F0', color: '#B91C1C', border: '#FFC9C9' },
  saglikli:  { label: 'Sağlıklı Kip',       bg: '#EFFFF3', color: '#166534', border: '#BBF7D0' },
};

const SIDDET_LABEL = ['—', 'Hafif', 'Orta', 'Şiddetli'] as const;
const SIDDET_COLOR = ['#CBD5E1', '#F59E0B', '#F97316', '#EF4444'] as const;

// ─── Eklentiler ──────────────────────────────────────────────────────────────

type ExtensionKey = 'kipKarsilastirma' | 'erkenDonemSemalar';

const EXTENSIONS: { key: ExtensionKey; title: string; desc: string; icon: string }[] = [
  {
    key: 'kipKarsilastirma',
    title: 'Şema Kip Karşılaştırması',
    desc: 'İçsel aktiflik (kendi deneyimi) vs. dışsal yansıma (başkalarına görünüm) — 11 kip',
    icon: '⚖️',
  },
  {
    key: 'erkenDonemSemalar',
    title: 'Erken Dönem Uyumsuz Şemalar',
    desc: '18 şema arasından aktif olanları işaretle, şiddet düzeyini belirle',
    icon: '🧩',
  },
];

// ─── Yardımcı Types ──────────────────────────────────────────────────────────

export type BenlikAlgisiData = {
  kendiEtiketleri: string[];
  disEtiketler: string[];
  kendiAciklamasi: string;
  disAciklamasi: string;
  bolunmeNotu: string;
  ozdeger: number;         // 0–100
  duygusalZihin: number;   // 0–100 (0=Akıl, 100=Duygu)
  duygusalDuyarlilik: number;
  sosyalSunumu: number;
  kipAktiflik: Record<KipId, { ic: number; dis: number }>;   // 0–4
  secilenSemalar: Array<{ id: SemaId; siddet: 1 | 2 | 3 }>;
};

const DEFAULT_KIP_AKTIFLIK: BenlikAlgisiData['kipAktiflik'] = {
  kirilgan_cocuk:    { ic: 3, dis: 1 },
  ofkeli_cocuk:      { ic: 2, dis: 1 },
  durtusal_cocuk:    { ic: 1, dis: 0 },
  mutlu_cocuk:       { ic: 1, dis: 2 },
  kopuk_koruyucu:    { ic: 2, dis: 3 },
  boyun_egen:        { ic: 1, dis: 3 },
  zorba_saldirgan:   { ic: 0, dis: 0 },
  onayi_arayan:      { ic: 2, dis: 2 },
  cezalandirici_eb:  { ic: 3, dis: 0 },
  talepkar_eb:       { ic: 2, dis: 0 },
  saglikli_yetiskin: { ic: 1, dis: 2 },
};

const DEFAULT_DATA: BenlikAlgisiData = {
  kendiEtiketleri:    ['Yetersizim', 'Sevilmiyorum', 'Bir yükten ibareti'],
  disEtiketler:       ['Çok anlayışlı', 'Güçlü görünüyor', 'Bağımsız'],
  kendiAciklamasi:    '',
  disAciklamasi:      '',
  bolunmeNotu:        '',
  ozdeger:            28,
  duygusalZihin:      72,
  duygusalDuyarlilik: 80,
  sosyalSunumu:       64,
  kipAktiflik:        DEFAULT_KIP_AKTIFLIK,
  secilenSemalar:     [
    { id: 'yetersizlik_utanc',   siddet: 3 },
    { id: 'terk_edilme',         siddet: 2 },
    { id: 'duygusal_yoksunluk',  siddet: 2 },
    { id: 'yuksek_standartlar',  siddet: 2 },
  ],
};

// ─── Sub-bileşenler ──────────────────────────────────────────────────────────

function TagInput({
  tags, onChange, placeholder, colorClass,
}: {
  tags: string[]; onChange(t: string[]): void; placeholder: string; colorClass: string;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  return (
    <div className="ba-tag-area">
      <div className="ba-tags">
        {tags.map(t => (
          <span key={t} className={`ba-tag ${colorClass}`}>
            {t}
            <button onClick={() => onChange(tags.filter(x => x !== t))} className="ba-tag-del">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <input
          className="ba-tag-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function SliderRow({
  label, value, onChange, leftLabel, rightLabel, gradient,
}: {
  label: string; value: number; onChange(v: number): void;
  leftLabel: string; rightLabel: string; gradient: string;
}) {
  return (
    <div className="ba-slider-row">
      <div className="ba-slider-label">{label}</div>
      <div className="ba-slider-track-wrap">
        <span className="ba-slider-side-label left">{leftLabel}</span>
        <div className="ba-slider-track" style={{ background: gradient }}>
          <input
            type="range" min={0} max={100} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="ba-range"
          />
          <div className="ba-slider-thumb" style={{ left: `${value}%` }}>
            <span className="ba-slider-val">{value}</span>
          </div>
        </div>
        <span className="ba-slider-side-label right">{rightLabel}</span>
      </div>
    </div>
  );
}

function DotRating({
  value, onChange, max = 4, color,
}: {
  value: number; onChange(v: number): void; max?: number; color: string;
}) {
  return (
    <div className="ba-dots">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          className="ba-dot"
          style={{ background: i < value ? color : '#E2E8F0' }}
          onClick={() => onChange(i < value ? i : i + 1)}
          title={`${i + 1}/${max}`}
        />
      ))}
    </div>
  );
}

// Wise Mind SVG — iki daire kesişimi
function WiseMindDiagram({ emotionPct }: { emotionPct: number }) {
  // emotionPct 0–100: 0 = tam Akıl Zihni, 100 = tam Duygu Zihni
  const pos = emotionPct / 100; // 0..1
  // marker x: sol daire merkezi ~72, sağ daire merkezi ~128; işaret [72..128]
  const mx = 72 + pos * 56;

  return (
    <svg viewBox="0 0 200 110" className="ba-wise-svg" aria-label="Zihin modları">
      {/* Sol daire — Duygu Zihni */}
      <circle cx="72" cy="55" r="42" fill="#DBEAFE" fillOpacity="0.7" stroke="#93C5FD" strokeWidth="1.5" />
      {/* Sağ daire — Akıl Zihni */}
      <circle cx="128" cy="55" r="42" fill="#D1FAE5" fillOpacity="0.7" stroke="#6EE7B7" strokeWidth="1.5" />
      {/* Kesişim — Akıllı Zihin */}
      <clipPath id="ba-clip-l"><circle cx="72" cy="55" r="42" /></clipPath>
      <circle cx="128" cy="55" r="42" fill="#A5F3FC" fillOpacity="0.6" clipPath="url(#ba-clip-l)" />
      {/* Etiketler */}
      <text x="45" y="28" fontSize="7" fill="#1E40AF" fontWeight="600" textAnchor="middle">Duygu</text>
      <text x="45" y="37" fontSize="7" fill="#1E40AF" textAnchor="middle">Zihni</text>
      <text x="155" y="28" fontSize="7" fill="#065F46" fontWeight="600" textAnchor="middle">Akıl</text>
      <text x="155" y="37" fontSize="7" fill="#065F46" textAnchor="middle">Zihni</text>
      <text x="100" y="52" fontSize="6.5" fill="#155E75" fontWeight="700" textAnchor="middle">Akıllı</text>
      <text x="100" y="61" fontSize="6.5" fill="#155E75" fontWeight="700" textAnchor="middle">Zihin</text>
      {/* Mevcut pozisyon */}
      <circle cx={mx} cy="80" r="5" fill="#0E0F12" opacity="0.85" />
      <line x1={mx} y1="74" x2={mx} y2="68" stroke="#0E0F12" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

// ─── Ana bileşen ─────────────────────────────────────────────────────────────

export type BenlikAlgisiPanelProps = {
  initialData?: Partial<BenlikAlgisiData>;
  onSave?(data: BenlikAlgisiData): Promise<void>;
  patientName?: string;
  audience?: 'terapist' | 'danisan';
};

export default function BenlikAlgisiPanel({
  initialData,
  onSave,
  patientName,
  audience = 'terapist',
}: BenlikAlgisiPanelProps) {
  const [data, setData] = useState<BenlikAlgisiData>({
    ...DEFAULT_DATA,
    ...initialData,
    kipAktiflik: { ...DEFAULT_KIP_AKTIFLIK, ...(initialData?.kipAktiflik ?? {}) },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [modeOpen, setModeOpen] = useState(true);
  const [semaOpen, setSemaOpen] = useState(true);
  const [tooltip, setTooltip]   = useState<string | null>(null);
  const [enabledExt, setEnabledExt] = useState<Set<ExtensionKey>>(new Set());
  const [extPickerOpen, setExtPickerOpen] = useState(false);

  const patch = useCallback(<K extends keyof BenlikAlgisiData>(key: K, val: BenlikAlgisiData[K]) =>
    setData(d => ({ ...d, [key]: val })), []);

  const toggleExt = (key: ExtensionKey) =>
    setEnabledExt(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  const patchKip = (id: KipId, side: 'ic' | 'dis', v: number) =>
    setData(d => ({
      ...d,
      kipAktiflik: { ...d.kipAktiflik, [id]: { ...d.kipAktiflik[id], [side]: v } },
    }));

  const toggleSema = (id: SemaId) => {
    setData(d => {
      const exists = d.secilenSemalar.find(s => s.id === id);
      if (exists) return { ...d, secilenSemalar: d.secilenSemalar.filter(s => s.id !== id) };
      return { ...d, secilenSemalar: [...d.secilenSemalar, { id, siddet: 1 }] };
    });
  };

  const setSemaSiddet = (id: SemaId, siddet: 1 | 2 | 3) => {
    setData(d => ({
      ...d,
      secilenSemalar: d.secilenSemalar.map(s => s.id === id ? { ...s, siddet } : s),
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    await onSave(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Bölünme skoru hesapla — öz-değer ile sosyal sunumu arasındaki fark
  const bolunmePct = Math.abs(data.ozdeger - data.sosyalSunumu);

  // Gruplu kipler
  const turOrder = ['cocuk', 'bas_etme', 'ebeveyn', 'saglikli'] as const;

  const isClient = audience === 'danisan';

  return (
    <div className={`ba-root${isClient ? ' ba-root--client' : ''}`}>
      {/* ─── Başlık ─────────────────────────────────────────────────────── */}
      <div className="ba-header">
        <div>
          <h2 className="ba-title">Benlik & Algı Haritası</h2>
          <p className="ba-subtitle">
            {patientName ? `${patientName} · ` : ''}
            {isClient ? 'Kendini nasıl görüyorsun · Zihin modu' : 'DBT Zihin Modları · Şema Kipları · Diyalektik Aralık'}
          </p>
        </div>
        {onSave && !isClient && (
          <button
            className={`ba-save-btn ${saved ? 'ba-save-btn--saved' : ''}`}
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Kaydediliyor…' : saved ? 'Kaydedildi ✓' : 'Kaydet'}
          </button>
        )}
      </div>

      {/* ─── Ayna Bölümü ────────────────────────────────────────────────── */}
      <div className={`ba-mirror${isClient ? ' ba-mirror--solo' : ''}`}>
        {/* ── Sol: Kendi gözünden ───────────────────────── */}
        <div className="ba-side ba-side--self">
          <div className="ba-side-header">
            <span className="ba-side-icon">🪞</span>
            <div>
              <p className="ba-side-title">Kendi Gözünden</p>
              <p className="ba-side-meta">İç dünya · öz-algı · gizli gerçeklik</p>
            </div>
          </div>

          <div className="ba-field">
            <label className="ba-label">Öz-etiketler <span className="ba-label-hint">Enter ile ekle</span></label>
            <TagInput
              tags={data.kendiEtiketleri}
              onChange={v => patch('kendiEtiketleri', v)}
              placeholder="Nasıl görüyor kendini…"
              colorClass="ba-tag--self"
            />
          </div>

          <SliderRow
            label="Öz-değer"
            value={data.ozdeger}
            onChange={v => patch('ozdeger', v)}
            leftLabel="Çökmüş"
            rightLabel="Sağlam"
            gradient="linear-gradient(to right, #F87171, #FCD34D, #4ADE80)"
          />
          <SliderRow
            label="Duygusal duyarlılık"
            value={data.duygusalDuyarlilik}
            onChange={v => patch('duygusalDuyarlilik', v)}
            leftLabel="Düşük"
            rightLabel="Çok yüksek"
            gradient="linear-gradient(to right, #93C5FD, #818CF8, #C084FC)"
          />

          {!isClient && (
            <div className="ba-field">
              <label className="ba-label">Klinik not</label>
              <textarea
                className="ba-textarea"
                rows={3}
                value={data.kendiAciklamasi}
                onChange={e => patch('kendiAciklamasi', e.target.value)}
                placeholder="Danışanın kendi hakkındaki temel anlatısı, tekrarlayan düşünceler…"
              />
            </div>
          )}
        </div>

        {/* ── Orta: DBT Wise Mind ───────────────────────── */}
        <div className="ba-center">
          <div className="ba-wise">
            <WiseMindDiagram emotionPct={data.duygusalZihin} />
            <div className="ba-wise-slider-wrap">
              <span className="ba-wise-label left">Akıl</span>
              <input
                type="range" min={0} max={100} value={data.duygusalZihin}
                onChange={e => patch('duygusalZihin', Number(e.target.value))}
                className="ba-range ba-range--wise"
              />
              <span className="ba-wise-label right">Duygu</span>
            </div>
            <p className="ba-wise-caption">Zihin modu dağılımı</p>
          </div>

          {/* Bölünme / uyumsuzluk göstergesi — terapist modunda */}
          {!isClient && <div className="ba-split">
            <p className="ba-split-label">Diyalektik Aralık</p>
            <div className="ba-split-bar-wrap">
              <div
                className="ba-split-bar"
                style={{
                  width: `${bolunmePct}%`,
                  background: bolunmePct > 60
                    ? '#EF4444'
                    : bolunmePct > 35
                    ? '#F97316'
                    : '#22C55E',
                }}
              />
            </div>
            <p className="ba-split-val">
              <span style={{ color: bolunmePct > 60 ? '#DC2626' : bolunmePct > 35 ? '#EA580C' : '#16A34A' }}>
                {bolunmePct > 60 ? 'Belirgin bölünme' : bolunmePct > 35 ? 'Orta düzey aralık' : 'Tutarlı algı'}
              </span>
              {' '}({bolunmePct} puan)
            </p>
          </div>}
        </div>

        {/* ── Sağ: Dış gözden — terapist modunda ──────── */}
        {!isClient && <div className="ba-side ba-side--ext">
          <div className="ba-side-header">
            <span className="ba-side-icon">👥</span>
            <div>
              <p className="ba-side-title">Dış Gözden</p>
              <p className="ba-side-meta">Sosyal sunumu · başkalarının izlenimi</p>
            </div>
          </div>

          <div className="ba-field">
            <label className="ba-label">Dış etiketler <span className="ba-label-hint">başkalarının söyledikleri</span></label>
            <TagInput
              tags={data.disEtiketler}
              onChange={v => patch('disEtiketler', v)}
              placeholder="Başkaları nasıl görüyor…"
              colorClass="ba-tag--ext"
            />
          </div>

          <SliderRow
            label="Sosyal sunumu"
            value={data.sosyalSunumu}
            onChange={v => patch('sosyalSunumu', v)}
            leftLabel="İçe kapalı"
            rightLabel="Yetkin"
            gradient="linear-gradient(to right, #FCD34D, #34D399, #0EA5E9)"
          />
          <SliderRow
            label="Sosyal etki / yük"
            value={data.duygusalDuyarlilik}
            onChange={v => patch('duygusalDuyarlilik', v)}
            leftLabel="Silik"
            rightLabel="Baskın"
            gradient="linear-gradient(to right, #E2E8F0, #818CF8, #4F46E5)"
          />

          <div className="ba-field">
            <label className="ba-label">Klinik not</label>
            <textarea
              className="ba-textarea"
              rows={3}
              value={data.disAciklamasi}
              onChange={e => patch('disAciklamasi', e.target.value)}
              placeholder="Seans içi gözlemler, yakınların anlatıları, sosyal işlevsellik…"
            />
          </div>
        </div>}
      </div>

      {/* ─── Eklentiler ve Detaylandırma — terapist modunda ─────────────── */}
      {!isClient && <div className="ba-ext-section">
        <button
          className="ba-ext-toggle-btn"
          onClick={() => setExtPickerOpen(o => !o)}
        >
          <Plus className="w-3.5 h-3.5" />
          Eklentiler ve detaylandırma
          {enabledExt.size > 0 && (
            <span className="ba-ext-count">{enabledExt.size} aktif</span>
          )}
          <ChevronDown
            className="w-3.5 h-3.5"
            style={{
              marginLeft: 'auto',
              transition: 'transform .2s',
              transform: extPickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {extPickerOpen && (
          <div className="ba-ext-picker">
            {EXTENSIONS.map(ext => {
              const on = enabledExt.has(ext.key);
              return (
                <button
                  key={ext.key}
                  className={`ba-ext-card ${on ? 'ba-ext-card--on' : ''}`}
                  onClick={() => toggleExt(ext.key)}
                >
                  <span className="ba-ext-icon">{ext.icon}</span>
                  <div className="ba-ext-info">
                    <span className="ba-ext-title">{ext.title}</span>
                    <span className="ba-ext-desc">{ext.desc}</span>
                  </div>
                  <span className={`ba-ext-check ${on ? 'on' : ''}`}>
                    {on ? '✓' : '+'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>}

      {/* ─── Kip Karşılaştırma — eklenti (terapist modunda) ─────────────── */}
      {!isClient && enabledExt.has('kipKarsilastirma') && (
        <div className="ba-card ba-card--ext">
          <button
            className="ba-section-toggle"
            onClick={() => setModeOpen(o => !o)}
          >
            <div>
              <p className="ba-section-title">Şema Kip Karşılaştırması</p>
              <p className="ba-section-meta">İçsel aktiflik (kendi deneyimi) vs. dışsal yansıma (başkalarına görünüm)</p>
            </div>
            {modeOpen ? <ChevronUp className="w-4 h-4 text-[#7B7C82]" /> : <ChevronDown className="w-4 h-4 text-[#7B7C82]" />}
          </button>

          {modeOpen && (
            <div className="ba-mode-table">
              <div className="ba-mode-header-row">
                <div />
                <div className="ba-mode-col-label ba-mode-col-label--ic">İÇ DÜNYA</div>
                <div className="ba-mode-col-label ba-mode-col-label--dis">DIŞ GÖRÜNÜM</div>
              </div>

              {turOrder.map(tur => {
                const grp = KIPLER.filter(k => k.tur === tur);
                const meta = TUR_META[tur];
                return (
                  <div key={tur} className="ba-mode-group">
                    <div
                      className="ba-mode-group-label"
                      style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
                    >
                      {meta.label}
                    </div>
                    {grp.map(kip => {
                      const vals = data.kipAktiflik[kip.id] ?? { ic: 0, dis: 0 };
                      const gap  = Math.abs(vals.ic - vals.dis);
                      return (
                        <div key={kip.id} className="ba-mode-row">
                          <div className="ba-mode-name">
                            <span className="ba-mode-emoji">{kip.emoji}</span>
                            <span className="ba-mode-label">{kip.label}</span>
                            <button
                              className="ba-mode-info"
                              onMouseEnter={() => setTooltip(kip.id)}
                              onMouseLeave={() => setTooltip(null)}
                            >
                              <Info className="w-3 h-3" />
                              {tooltip === kip.id && (
                                <div className="ba-tooltip">{kip.desc}</div>
                              )}
                            </button>
                            {gap >= 2 && (
                              <span className="ba-gap-badge" title="Belirgin iç/dış uyumsuzluk">
                                Δ{gap}
                              </span>
                            )}
                          </div>
                          <div className="ba-mode-ic">
                            <DotRating
                              value={vals.ic}
                              onChange={v => patchKip(kip.id, 'ic', v)}
                              color={meta.color}
                            />
                          </div>
                          <div className="ba-mode-dis">
                            <DotRating
                              value={vals.dis}
                              onChange={v => patchKip(kip.id, 'dis', v)}
                              color="#64748B"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              <div className="ba-mode-legend">
                <span className="ba-legend-dot" style={{ background: '#3B5BDB' }} /> İç dünya aktiflik
                <span className="ba-legend-dot" style={{ background: '#64748B', marginLeft: 12 }} /> Dış görünüm aktiflik
                <span style={{ marginLeft: 12, color: '#9333EA', fontWeight: 600 }}>Δ</span> = belirgin iç/dış fark
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Erken Dönem Uyumsuz Şemalar — eklenti (terapist modunda) ──── */}
      {!isClient && enabledExt.has('erkenDonemSemalar') && (
        <div className="ba-card ba-card--ext">
          <button
            className="ba-section-toggle"
            onClick={() => setSemaOpen(o => !o)}
          >
            <div>
              <p className="ba-section-title">Erken Dönem Uyumsuz Şemalar</p>
              <p className="ba-section-meta">Aktif şemaları işaretle, şiddetini belirle</p>
            </div>
            {semaOpen ? <ChevronUp className="w-4 h-4 text-[#7B7C82]" /> : <ChevronDown className="w-4 h-4 text-[#7B7C82]" />}
          </button>

          {semaOpen && (() => {
            const alanlar = [...new Set(SEMALAR.map(s => s.alan))];
            return (
              <div className="ba-sema-grid">
                {alanlar.map(alan => (
                  <div key={alan} className="ba-sema-group">
                    <p className="ba-sema-group-title">{alan}</p>
                    <div className="ba-sema-chips">
                      {SEMALAR.filter(s => s.alan === alan).map(sema => {
                        const sel = data.secilenSemalar.find(s => s.id === sema.id);
                        return (
                          <div key={sema.id} className={`ba-sema-chip ${sel ? 'ba-sema-chip--on' : ''}`}>
                            <button
                              className="ba-sema-toggle"
                              onClick={() => toggleSema(sema.id as SemaId)}
                            >
                              {sel && <span className="ba-sema-check">✓</span>}
                              {sema.label}
                            </button>
                            {sel && (
                              <div className="ba-sema-siddet">
                                {([1, 2, 3] as const).map(s => (
                                  <button
                                    key={s}
                                    className={`ba-siddet-btn ${sel.siddet === s ? 'ba-siddet-btn--on' : ''}`}
                                    style={sel.siddet === s ? { background: SIDDET_COLOR[s], color: '#fff', borderColor: SIDDET_COLOR[s] } : {}}
                                    onClick={() => setSemaSiddet(sema.id as SemaId, s)}
                                    title={SIDDET_LABEL[s]}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}
