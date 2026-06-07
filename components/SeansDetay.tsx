'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Plus, Copy, Check, ChevronDown, ChevronRight,
  Sparkles, BarChart2, ExternalLink, Trash2,
} from 'lucide-react';
import { BdtSeans, SeansDetayVerisi, OlcekSkor, HexaflexHistoryEntry } from '@/lib/types';
import { OLCEKLER, OLCEK_RENKLER, getSinif } from '@/lib/olcekler';
import HexaflexSeansPanel from '@/components/HexaflexSeansPanel';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const FORMULASYON_SABLONLARI = [
  { id: 'boylamsal',     label: 'Boylamsal\nFormülasyon',  emoji: '📋', color: '#6366f1' },
  { id: 'sosyal-kaygi',  label: 'Sosyal Kaygı\nŞablonu',   emoji: '😰', color: '#f97316' },
  { id: 'panik',         label: 'Panik Atak\nŞablonu',     emoji: '💓', color: '#ef4444' },
  { id: 'okb',           label: 'OKB\nŞablonu',            emoji: '🔄', color: '#8b5cf6' },
  { id: 'depresyon',     label: 'Depresyon\nŞablonu',      emoji: '🌧️', color: '#64748b' },
  { id: 'yab',           label: 'YAB\nŞablonu',            emoji: '😟', color: '#0891b2' },
];

const EMPTY_DETAY: SeansDetayVerisi = {
  olcekler: [],
  danisanIzlenimi: '',
  haftalikCalismalar: '',
  haftalikZorluklar: '',
  mudahaleOzeti: '',
  basitFormulasyon: { tetikleyici: '', dusunce: '', duygu: '', davranis: '', sonuc: '' },
  formulasyonGuncellemeleri: '',
  seansOzeti: '',
  odev: '',
  terapistIyiYanlar: '',
  terapistGelisilebilirYanlar: '',
  brief: '',
};

// ─── SkorSlider (0-10 ölçekler için) ─────────────────────────────────────────

const SUDS_LABELS: Record<number, string> = {
  0: 'Hiç', 1: 'Çok Az', 2: 'Az', 3: 'Hafif', 4: 'Orta-Hafif',
  5: 'Orta', 6: 'Orta-Fazla', 7: 'Fazla', 8: 'Çok Fazla', 9: 'Aşırı', 10: 'Dayanılmaz',
};

const SLIDER_COLOR = (v: number) => {
  if (v <= 2) return '#22c55e';
  if (v <= 4) return '#84cc16';
  if (v <= 6) return '#eab308';
  if (v <= 8) return '#f97316';
  return '#ef4444';
};

function SkorSlider({
  value, onChange, isDistress = true,
}: { value: number; onChange: (v: number) => void; isDistress?: boolean }) {
  const ticks = Array.from({ length: 11 }, (_, i) => i);
  const color  = SLIDER_COLOR(value);

  return (
    <div className="space-y-3">
      {/* Current value badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {isDistress ? 'Sıkıntı Düzeyi' : 'Puan'}
        </span>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white transition-all"
          style={{ background: color }}
        >
          <span className="text-base font-black leading-none">{value}</span>
          <span className="opacity-80">/10</span>
          <span className="opacity-90">{SUDS_LABELS[value]}</span>
        </span>
      </div>

      {/* Slider */}
      <div
        className="px-1"
        style={{ '--slider-color': color } as React.CSSProperties}
      >
        <style>{`
          [data-radix-slider-thumb] { border-color: var(--slider-color) !important; }
          [data-radix-slider-range] { background: var(--slider-color) !important; }
        `}</style>
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={0}
          max={10}
          step={1}
          showTooltip
          tooltipContent={v => `${v} — ${SUDS_LABELS[v]}`}
        />
      </div>

      {/* Tick marks */}
      <span
        className="flex w-full items-center justify-between px-2.5 text-[10px] font-medium text-muted-foreground"
        aria-hidden="true"
      >
        {ticks.map(i => (
          <span key={i} className="flex w-0 flex-col items-center gap-1">
            <span className={cn('h-1 w-px bg-gray-300', i % 2 !== 0 && 'h-0.5 opacity-50')} />
            <span className={cn('tabular-nums', i % 2 !== 0 && 'opacity-0')}>{i}</span>
          </span>
        ))}
      </span>
    </div>
  );
}

// ─── Yardımcı bileşenler ──────────────────────────────────────────────────────

function Section({
  title, color = '#6366f1', children, defaultOpen = true,
}: { title: string; color?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50/70 transition"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <span className="text-sm font-semibold text-[#0E0F12]">{title}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-400" />
          : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 py-4 space-y-4">{children}</div>}
    </div>
  );
}

function TA({
  label, value, onChange, rows = 3, placeholder = '…',
}: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] px-3 py-2.5 text-[13px] text-gray-800 leading-relaxed resize-none focus:outline-none focus:border-indigo-300 focus:bg-white transition-colors"
      />
    </div>
  );
}

// ─── Ölçek skoru karşılaştırma grafiği ───────────────────────────────────────

function OlcekGrafik({ allSeanslar }: { allSeanslar: BdtSeans[] }) {
  const { olcekAdlari, chartData } = useMemo(() => {
    const adSet = new Set<string>();
    const sorted = [...allSeanslar]
      .filter(s => s.tip === 'seans')
      .sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime());

    sorted.forEach(s => s.detay?.olcekler?.forEach(o => adSet.add(o.ad)));

    const chartData = sorted.map(s => {
      const point: Record<string, number | string> = { label: `S${s.no}` };
      s.detay?.olcekler?.forEach(o => { point[o.ad] = o.skor; });
      return point;
    });

    return { olcekAdlari: Array.from(adSet), chartData };
  }, [allSeanslar]);

  if (olcekAdlari.length === 0) return (
    <p className="text-xs text-gray-400 italic text-center py-4">
      Henüz ölçek skoru eklenmedi. Seans boyunca değişimi görmek için ölçek ekleyin.
    </p>
  );

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#F1F2F5" />
          <XAxis dataKey="label" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} width={28} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #F1F2F5', fontSize: 12 }}
            cursor={{ stroke: '#E5E7EB' }}
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
          {olcekAdlari.map((ad, i) => (
            <Line
              key={ad} type="monotone" dataKey={ad}
              stroke={OLCEK_RENKLER[i % OLCEK_RENKLER.length]}
              strokeWidth={2.5} dot={{ r: 4 }} connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Basit durum formülasyonu ─────────────────────────────────────────────────

function BasitFormulasyon({
  data, onChange,
}: {
  data: SeansDetayVerisi['basitFormulasyon'];
  onChange: (k: keyof SeansDetayVerisi['basitFormulasyon'], v: string) => void;
}) {
  const boxes = [
    { key: 'tetikleyici' as const, label: 'Tetikleyici', color: '#6366f1', bg: '#eef2ff' },
    { key: 'dusunce'     as const, label: 'Düşünce',     color: '#f97316', bg: '#fff7ed' },
    { key: 'duygu'       as const, label: 'Duygu',       color: '#ec4899', bg: '#fdf2f8' },
    { key: 'davranis'    as const, label: 'Davranış',    color: '#14b8a6', bg: '#f0fdfa' },
    { key: 'sonuc'       as const, label: 'Sonuç',       color: '#64748b', bg: '#f8fafc' },
  ];

  return (
    <div className="flex items-start gap-1.5 overflow-x-auto pb-1">
      {boxes.map((box, i) => (
        <React.Fragment key={box.key}>
          <div
            className="flex-1 min-w-[120px] rounded-xl border-2 p-3"
            style={{ borderColor: box.color + '80', background: box.bg }}
          >
            <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: box.color }}>
              {box.label}
            </div>
            <textarea
              rows={3}
              value={data[box.key]}
              onChange={e => onChange(box.key, e.target.value)}
              placeholder={`${box.label}…`}
              className="w-full bg-transparent border-none outline-none resize-none text-xs text-gray-700 leading-relaxed placeholder-gray-300"
            />
          </div>
          {i < boxes.length - 1 && (
            <div className="flex-shrink-0 flex items-center justify-center mt-8 text-gray-300 text-lg font-light">→</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────────

export default function SeansDetay({
  seans,
  allSeanslar,
  patientName,
  onBack,
  onSave,
  onNavigate,
}: {
  seans: BdtSeans;
  allSeanslar: BdtSeans[];
  patientName: string;
  onBack: () => void;
  onSave: (id: string, detay: SeansDetayVerisi) => Promise<void>;
  onNavigate?: (tab: string) => void;
}) {
  const initDetay: SeansDetayVerisi = {
    ...EMPTY_DETAY,
    ...(seans.detay ?? {}),
    // Pre-fill from seansNotu where available
    seansOzeti: seans.detay?.seansOzeti || seans.seansNotu?.seansOdagi || '',
    odev:       seans.detay?.odev       || seans.seansNotu?.evOdevi    || '',
  };

  const [detay, setDetay] = useState<SeansDetayVerisi>(initDetay);
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Hexaflex geçmişi — bu seans hariç, tarihe göre sıralı önceki seanslar
  const hexaflexHistory = useMemo<HexaflexHistoryEntry[]>(() =>
    allSeanslar
      .filter(s => s.tip === 'seans' && s.id !== seans.id && s.detay?.hexaflex != null)
      .sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime())
      .map(s => ({ no: s.no, tarih: s.tarih, scores: s.detay!.hexaflex! })),
    [allSeanslar, seans.id],
  );

  // Ölçek ekleme
  const [selOlcekId,    setSelOlcekId]    = useState('phq9');
  const [olcekSkorStr,  setOlcekSkorStr]  = useState('');
  const [customOlcekAd, setCustomOlcekAd] = useState('');

  const update = useCallback((patch: Partial<SeansDetayVerisi>) => {
    setDetay(prev => ({ ...prev, ...patch }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await onSave(seans.id, detay);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // ─── Ölçek işlemleri ────────────────────────────────────────────────────────

  const selOlcek = OLCEKLER.find(o => o.id === selOlcekId)!;

  const addOlcek = () => {
    const skor = Number(olcekSkorStr);
    if (isNaN(skor) || olcekSkorStr === '') return;
    const ad = selOlcekId === 'custom' ? (customOlcekAd || 'Özel Ölçek') : selOlcek.ad;
    const yeni: OlcekSkor = {
      id: Math.random().toString(36).slice(2, 9),
      olcekId: selOlcekId,
      ad,
      skor,
      tarih: seans.tarih,
    };
    update({ olcekler: [...detay.olcekler, yeni] });
    setOlcekSkorStr('');
  };

  const removeOlcek = (id: string) =>
    update({ olcekler: detay.olcekler.filter(o => o.id !== id) });

  const copyLink = async () => {
    const token = btoa(`${seans.id}-${selOlcekId}`).replace(/=/g, '').slice(0, 18);
    const link = `${window.location.origin}/o/${token}`;
    try { await navigator.clipboard.writeText(link); } catch { /* fallback */ }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  // ─── Brief otomatik oluşturma ────────────────────────────────────────────────

  const generateBrief = () => {
    const lines: string[] = [];
    if (detay.seansOzeti) lines.push(`🎯 Bu seans: ${detay.seansOzeti.slice(0, 100)}`);
    if (detay.haftalikZorluklar) lines.push(`⚠️  Zorluklar: ${detay.haftalikZorluklar.slice(0, 80)}`);
    if (detay.basitFormulasyon.dusunce) lines.push(`💭 Odak düşünce: "${detay.basitFormulasyon.dusunce.slice(0, 70)}"`);
    if (detay.odev) lines.push(`📌 Ödev: ${detay.odev.slice(0, 80)}`);
    if (detay.terapistGelisilebilirYanlar) lines.push(`🔍 Dikkat: ${detay.terapistGelisilebilirYanlar.slice(0, 80)}`);
    const text = lines.length
      ? `📋 Sonraki Seans — ${patientName}\n\n${lines.join('\n\n')}\n\n→ Devam edilecek:`
      : '📋 Sonraki seans için notlarınızı buraya ekleyin.';
    update({ brief: text });
  };

  const isAnamnez = seans.tip === 'anamnez';

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10">

      {/* ── Başlık ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-[#0E0F12]">
              {patientName} — {isAnamnez ? 'İlk Görüşme' : `Seans ${seans.no}`}
            </h2>
            <p className="text-xs text-gray-500">
              {new Date(seans.tarih).toLocaleDateString('tr-TR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
              {seans.seansNotu?.riskDegerlendirme && seans.seansNotu.riskDegerlendirme !== 'yok' && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                  Risk: {seans.seansNotu.riskDegerlendirme}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
            saved
              ? 'bg-green-100 text-green-700'
              : 'bg-[#0E0F12] text-white hover:bg-[#1A1B22]'
          }`}
        >
          {saved ? <><Check className="w-4 h-4" /> Kaydedildi</> : saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>

      {/* ── 1. Ölçek Yönetimi ────────────────────────────────────────────── */}
      <Section title="📊 Ölçek Skoru & Seyir" color="#6366f1">
        {/* Grafik */}
        <OlcekGrafik allSeanslar={allSeanslar} />

        {/* Bu seans skorları */}
        {detay.olcekler.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
            <p className="w-full text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Bu Seans Skorları</p>
            {detay.olcekler.map(o => {
              const sinif = getSinif(o.olcekId, o.skor);
              return (
                <div
                  key={o.id}
                  className="flex items-center gap-2 rounded-xl border px-3 py-1.5"
                  style={{ borderColor: (sinif?.c ?? '#94a3b8') + '50', background: (sinif?.c ?? '#94a3b8') + '12' }}
                >
                  <span className="text-xs font-semibold text-gray-700">{o.ad}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: sinif?.c ?? '#374151' }}>{o.skor}</span>
                  {sinif && <span className="text-[10px] text-gray-400">{sinif.l}</span>}
                  <button onClick={() => removeOlcek(o.id)} className="text-gray-300 hover:text-red-400 ml-0.5 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Skor ekleme */}
        <div className="bg-[#F8F9FB] rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Skor Ekle</p>
          <div className="flex gap-2 flex-wrap">
            <select
              value={selOlcekId}
              onChange={e => { setSelOlcekId(e.target.value); setOlcekSkorStr(''); }}
              className="flex-1 min-w-[180px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-300"
            >
              {OLCEKLER.map(o => <option key={o.id} value={o.id}>{o.tam}</option>)}
            </select>
            {selOlcekId === 'custom' && (
              <input
                type="text" value={customOlcekAd} onChange={e => setCustomOlcekAd(e.target.value)}
                placeholder="Ölçek adı…"
                className="w-36 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:border-indigo-300"
              />
            )}
            {selOlcek.max > 10 ? (
              /* Geniş aralıklı ölçekler: sayı giriş kutusu */
              <input
                type="number" value={olcekSkorStr} onChange={e => setOlcekSkorStr(e.target.value)}
                placeholder={`0–${selOlcek.max}`} min={0} max={selOlcek.max}
                className="w-24 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:border-indigo-300"
              />
            ) : null}
            <button
              onClick={addOlcek}
              disabled={!olcekSkorStr}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-40 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Ekle
            </button>
          </div>

          {/* 0-10 ölçekler için slider */}
          {selOlcek.max <= 10 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <SkorSlider
                value={olcekSkorStr === '' ? 5 : Number(olcekSkorStr)}
                onChange={v => setOlcekSkorStr(String(v))}
                isDistress={selOlcekId === 'suds'}
              />
            </div>
          )}

          {/* Link gönder */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] text-gray-400 whitespace-nowrap">ya da danışana link gönder</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-indigo-200 text-xs text-indigo-600 hover:bg-indigo-50 transition"
          >
            {linkCopied
              ? <><Check className="w-3.5 h-3.5 text-green-500" /> Link kopyalandı!</>
              : <><Copy className="w-3.5 h-3.5" /> {selOlcek.tam} linkini kopyala</>}
          </button>
        </div>
      </Section>

      {/* ── 2. Danışan Durumu ─────────────────────────────────────────────── */}
      <Section title="🧍 Danışan Durumu" color="#f97316">
        <TA
          label="Seanstaki Genel İzlenim"
          value={detay.danisanIzlenimi}
          onChange={v => update({ danisanIzlenimi: v })}
          rows={3}
          placeholder="Genel ruh hali, enerji, iletişim biçimi, motivasyon, beden dili…"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TA
            label="Bu Hafta Üzerinde Çalıştıkları"
            value={detay.haftalikCalismalar}
            onChange={v => update({ haftalikCalismalar: v })}
            rows={3}
            placeholder="Danışan bu hafta kendisiyle ilgili neler keşfetti, neler denedi?"
          />
          <TA
            label="Zorlandığı Alanlar"
            value={detay.haftalikZorluklar}
            onChange={v => update({ haftalikZorluklar: v })}
            rows={3}
            placeholder="Ne güçleştirdi, neye takıldı, hangi durumlar tetikledi?"
          />
        </div>
      </Section>

      {/* ── 3. Psikolojik Esneklik (ACT Hexaflex V3) ────────────────────── */}
      <Section title="🔷 Psikolojik Esneklik · ACT Hexaflex" color="#6366f1">
        <HexaflexSeansPanel
          scores={detay.hexaflex}
          note={detay.hexaflexNot ?? ''}
          history={hexaflexHistory}
          onChange={hexaflex => update({ hexaflex })}
          onNoteChange={hexaflexNot => update({ hexaflexNot })}
        />
      </Section>

      {/* ── 4. Seans İçeriği ──────────────────────────────────────────────── */}
      <Section title="🎯 Seans İçeriği" color="#14b8a6">
        <TA
          label="Seans Gündemi"
          value={seans.seansNotu?.gundemMaddeleri || ''}
          onChange={() => {}}
          rows={2}
          placeholder="(SeansNotu'ndan okunur — düzenlemek için Düzenle butonunu kullanın)"
        />
        {seans.seansNotu?.kullanilanTeknikler && seans.seansNotu.kullanilanTeknikler.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Kullanılan Teknikler</p>
            <div className="flex flex-wrap gap-1.5">
              {seans.seansNotu.kullanilanTeknikler.map(t => (
                <span key={t} className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] text-teal-700">{t}</span>
              ))}
            </div>
          </div>
        )}
        <TA
          label="Müdahalelerin Özeti"
          value={detay.mudahaleOzeti}
          onChange={v => update({ mudahaleOzeti: v })}
          rows={4}
          placeholder="Hangi teknikler / müdahaleler kullanıldı, danışan nasıl karşıladı, ne işe yaradı?"
        />
      </Section>

      {/* ── 4. Durum Formülasyonu ─────────────────────────────────────────── */}
      <Section title="🔄 Durum Düzeyinde Formülasyon" color="#ec4899">
        <p className="text-xs text-gray-500 -mt-1">Bu seans odağındaki tetikleyici – düşünce – duygu – davranış – sonuç zinciri.</p>
        <BasitFormulasyon
          data={detay.basitFormulasyon}
          onChange={(k, v) => update({ basitFormulasyon: { ...detay.basitFormulasyon, [k]: v } })}
        />
        <TA
          label="Boylamsal / Şablon Formülasyona Eklenecekler"
          value={detay.formulasyonGuncellemeleri}
          onChange={v => update({ formulasyonGuncellemeleri: v })}
          rows={2}
          placeholder="Bu seansın formülasyona katkısı: yeni tetikleyici, inanç, kalıp…"
        />

        {/* Şablon linkleri */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Formülasyon Şablonlarını Güncelle</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {FORMULASYON_SABLONLARI.map(s => (
              <button
                key={s.id}
                onClick={() => onNavigate?.('formulation')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-dashed transition-all hover:shadow-sm group"
                style={{ borderColor: s.color + '50' }}
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-[9px] font-semibold text-center leading-tight whitespace-pre-line" style={{ color: s.color }}>{s.label}</span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white opacity-80 group-hover:opacity-100 transition"
                  style={{ background: s.color }}
                >
                  Güncelle →
                </span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 5. Özet & Ödev ────────────────────────────────────────────────── */}
      <Section title="📝 Seans Özeti & Ödev" color="#22c55e">
        <TA
          label="Seans Özeti"
          value={detay.seansOzeti}
          onChange={v => update({ seansOzeti: v })}
          rows={3}
          placeholder="Bu seans ne getirdi? Danışan ne aldı, ne yeni bir şey ortaya çıktı?"
        />
        <TA
          label="Ödev"
          value={detay.odev}
          onChange={v => update({ odev: v })}
          rows={2}
          placeholder="Bir sonraki seansa kadar danışanın yapacakları…"
        />
      </Section>

      {/* ── 6. Terapist Öz Değerlendirmesi ───────────────────────────────── */}
      <Section title="🪞 Terapist Öz Değerlendirmesi" color="#8b5cf6" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TA
            label="İyi Gittiğini Düşündüklerim"
            value={detay.terapistIyiYanlar}
            onChange={v => update({ terapistIyiYanlar: v })}
            rows={4}
            placeholder="Bu seansta neyi iyi yaptım? Hangi müdahale doğru zamanlandı? Danışanla ne güçlü kuruldu?"
          />
          <TA
            label="Geliştirilebilecek Yanlar"
            value={detay.terapistGelisilebilirYanlar}
            onChange={v => update({ terapistGelisilebilirYanlar: v })}
            rows={4}
            placeholder="Neyi farklı yapardım? Hangi an beni zorladı? Süpervizyon için not?"
          />
        </div>
      </Section>

      {/* ── 7. Sonraki Seans Brief ────────────────────────────────────────── */}
      <Section title="✨ Sonraki Seans Brief" color="#f59e0b" defaultOpen={false}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Sonraki seans için odak noktaları, dikkat notları ve hazırlık özeti.</p>
          <button
            onClick={generateBrief}
            className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 border border-amber-200 rounded-xl px-3 py-1.5 hover:bg-amber-50 transition whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" /> Otomatik Oluştur
          </button>
        </div>
        <TA
          label="Brief"
          value={detay.brief}
          onChange={v => update({ brief: v })}
          rows={6}
          placeholder="Bir sonraki seans için odak, dikkat noktaları, danışana özel hatırlatmalar…"
        />
      </Section>
    </div>
  );
}
