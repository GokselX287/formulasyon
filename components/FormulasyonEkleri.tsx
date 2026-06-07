'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Minus } from 'lucide-react';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ─────────────── 5P Formülasyon ───────────────
const FP_FIELDS = [
  { key: 'fp5_sunan', label: 'Sunan Sorun', placeholder: 'Danışanın tanımladığı ana sorun', color: 'border-blue-200 bg-blue-50' },
  { key: 'fp5_yatkin', label: 'Yatkınlaştırıcı', placeholder: 'Kişiliği, geçmiş deneyimleri, genetik', color: 'border-indigo-200 bg-indigo-50' },
  { key: 'fp5_tetik', label: 'Tetikleyici', placeholder: 'Başlatan yaşam olayları', color: 'border-amber-200 bg-amber-50' },
  { key: 'fp5_surdur', label: 'Sürdürücü', placeholder: 'Döngüyü besleyen faktörler', color: 'border-red-200 bg-red-50' },
  { key: 'fp5_koruy', label: 'Koruyucu', placeholder: 'Güçlü yanlar, destek kaynakları', color: 'border-emerald-200 bg-emerald-50' },
];

type FivePData = Record<string, string>;

export function FivePFormulasyon({ data, onChange }: { data: FivePData; onChange: (k: string, v: string) => void }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-[#0E0F12]">5P Formülasyon</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">BDT</span>
      </div>
      <div className="grid md:grid-cols-5 gap-3">
        {FP_FIELDS.map(f => (
          <div key={f.key} className={cx('rounded-xl border p-3', f.color)}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-600 mb-1">{f.label}</div>
            <textarea
              value={data[f.key] || ''}
              onChange={e => onChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full bg-transparent border-none outline-none resize-none text-xs leading-relaxed min-h-[72px] text-gray-700"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────── İşlevsel Analiz ───────────────
const FA_FIELDS = [
  { key: 'fa_trigger', bdt: 'Tetikleyici', act: 'Bağlam' },
  { key: 'fa_thoughts', bdt: 'Düşünce', act: 'Füzyon' },
  { key: 'fa_emotions', bdt: 'Duygu', act: 'Duygu' },
  { key: 'fa_bodily', bdt: 'Beden', act: 'Beden' },
  { key: 'fa_behavior', bdt: 'Davranış', act: 'Kaçınma Davranışı' },
  { key: 'fa_short_relief', bdt: 'Kısa Vadeli Rahatlama', act: 'Anlık Kazanç' },
  { key: 'fa_long_cost', bdt: 'Uzun Vadeli Bedel', act: 'Değer Bedeli' },
  { key: 'fa_value_violated', bdt: 'İhlal Edilen Değer', act: 'İhlal Edilen Değer' },
];

type FaData = Record<string, string>;

export function IslevselAnaliz({
  data, onChange, approach = 'BDT',
}: {
  data: FaData; onChange: (k: string, v: string) => void; approach?: 'BDT' | 'ACT';
}) {
  const [open, setOpen] = useState(false);

  const filled = FA_FIELDS.filter(f => (data[f.key] || '').trim().length > 0).length;

  return (
    <div className="card p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#0E0F12]">İşlevsel Analiz</h3>
          <span className={cx('text-[10px] font-bold px-2 py-0.5 rounded-full', approach === 'BDT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>{approach}</span>
          <span className={cx('text-[10px] px-2 py-0.5 rounded-full font-medium', filled > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
            {filled}/{FA_FIELDS.length}
          </span>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {FA_FIELDS.map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {approach === 'ACT' ? f.act : f.bdt}
              </label>
              <textarea
                value={data[f.key] || ''}
                onChange={e => onChange(f.key, e.target.value)}
                className="mt-1 min-h-[64px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0E0F12] transition-colors"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────── Eksiklikler ↔ Aşırılıklar ───────────────
type BehaviorItem = {
  id: string;
  label: string;
  weekChecks: boolean[];
};

const WEEK_DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];

function BehaviorList({
  title,
  items,
  onAdd,
  onRemove,
  onToggleDay,
}: {
  title: string;
  items: BehaviorItem[];
  onAdd: (label: string) => void;
  onRemove: (id: string) => void;
  onToggleDay: (id: string, day: number) => void;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    if (!input.trim()) return;
    onAdd(input.trim());
    setInput('');
  };

  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">{title}</div>
      <div className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Örn: atılganlık, sınır koyma…"
          className="flex-1 h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#0E0F12] transition-colors"
        />
        <button onClick={add} className="h-9 w-9 rounded-xl bg-[#0E0F12] text-white hover:bg-[#1A1B22] transition-colors flex items-center justify-center">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-start gap-2 py-2 border-b border-gray-100">
            <button onClick={() => onRemove(item.id)} className="mt-0.5 p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="flex-1">
              <div className="text-sm text-gray-700 mb-1.5">{item.label}</div>
              <div className="flex gap-1.5">
                {WEEK_DAYS.map((day, i) => (
                  <div key={day} className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => onToggleDay(item.id, i)}
                      className={cx(
                        'w-6 h-6 rounded-full border text-[9px] font-bold transition-all',
                        item.weekChecks[i]
                          ? 'bg-[#0E0F12] border-[#0E0F12] text-white'
                          : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400'
                      )}
                    >{day[0]}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-500 py-2">Henüz kayıt yok.</p>
        )}
      </div>
    </div>
  );
}

const uid = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;

type DefExcState = { deficits: BehaviorItem[]; excesses: BehaviorItem[] };

export function EksiklikAsirilik() {
  const [state, setState] = useState<DefExcState>({ deficits: [], excesses: [] });

  const addItem = (type: 'deficits' | 'excesses', label: string) => {
    const item: BehaviorItem = { id: uid(), label, weekChecks: Array(7).fill(false) };
    setState(prev => ({ ...prev, [type]: [...prev[type], item] }));
  };

  const removeItem = (type: 'deficits' | 'excesses', id: string) => {
    setState(prev => ({ ...prev, [type]: prev[type].filter(i => i.id !== id) }));
  };

  const toggleDay = (type: 'deficits' | 'excesses', id: string, day: number) => {
    setState(prev => ({
      ...prev,
      [type]: prev[type].map(i =>
        i.id === id
          ? { ...i, weekChecks: i.weekChecks.map((c, idx) => idx === day ? !c : c) }
          : i
      ),
    }));
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-[#0E0F12]">Eksiklikler ↔ Aşırılıklar</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Ortak</span>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <BehaviorList
          title="Eksiklikler"
          items={state.deficits}
          onAdd={l => addItem('deficits', l)}
          onRemove={id => removeItem('deficits', id)}
          onToggleDay={(id, day) => toggleDay('deficits', id, day)}
        />
        <div className="hidden md:block border-l border-gray-200" />
        <BehaviorList
          title="Aşırılıklar"
          items={state.excesses}
          onAdd={l => addItem('excesses', l)}
          onRemove={id => removeItem('excesses', id)}
          onToggleDay={(id, day) => toggleDay('excesses', id, day)}
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-4">Her satırda haftanın günlerini işaretleyerek haftalık takip yapın. Gün kısaltmaları: Pt=Pazartesi, Sa=Salı, Ça=Çarşamba, Pe=Perşembe, Cu=Cuma, Ct=Cumartesi, Pa=Pazar.</p>
    </div>
  );
}

// ─────────────── ACT Matriks Metin Kadranları ───────────────
const ACT_QUADS = [
  { key: 'am_away_inner', label: 'Uzaklaşma · İç Dünya', hint: 'Kaçınılan duygular, düşünceler, anılar…', color: 'bg-red-50 border-red-200' },
  { key: 'am_toward_inner', label: 'Yaklaşma · İç Dünya', hint: 'Önemli olan değerler, içsel motivasyon…', color: 'bg-blue-50 border-blue-200' },
  { key: 'am_away_outer', label: 'Uzaklaşma · Dış Dünya', hint: 'Kaçınılan durumlar, davranışlar…', color: 'bg-orange-50 border-orange-200' },
  { key: 'am_toward_outer', label: 'Yaklaşma · Dış Dünya', hint: 'Değerlere uygun eylemler…', color: 'bg-emerald-50 border-emerald-200' },
];

type ActMatrixData = Record<string, string>;

export function ActMatriksMetin({ data, onChange }: { data: ActMatrixData; onChange: (k: string, v: string) => void }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-[#0E0F12]">ACT Matriks — Metin Kadranları</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">ACT</span>
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-gray-200">
        {ACT_QUADS.map(q => (
          <div key={q.key} className={cx('p-4', q.color)}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-600 mb-2">{q.label}</div>
            <textarea
              value={data[q.key] || ''}
              onChange={e => onChange(q.key, e.target.value)}
              placeholder={q.hint}
              className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed min-h-[80px] text-gray-700"
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 mt-1 rounded-xl overflow-hidden border border-gray-200">
        <div className="py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-50 border-r border-gray-200">Uzaklaşma</div>
        <div className="py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-50">Yaklaşma</div>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Haftanın Kancası</label>
          <input
            value={data['am_hook'] || ''}
            onChange={e => onChange('am_hook', e.target.value)}
            placeholder="Bu hafta en çok yakalanan düşünce / duygu…"
            className="mt-1 h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#0E0F12] transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kararlı Eylem</label>
          <input
            value={data['am_action'] || ''}
            onChange={e => onChange('am_action', e.target.value)}
            placeholder="Bu hafta değerlere doğru somut adım…"
            className="mt-1 h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#0E0F12] transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────── Main export (tab wrapper) ───────────────
export default function FormulasyonEkleri() {
  const [tab, setTab] = useState<'5p' | 'fa' | 'defexc' | 'actmatrix'>('5p');
  const [fp5Data, setFp5Data] = useState<FivePData>({});
  const [faData, setFaData] = useState<FaData>({});
  const [actData, setActData] = useState<ActMatrixData>({});

  const TABS = [
    { id: '5p' as const, label: '5P Formülasyon' },
    { id: 'fa' as const, label: 'İşlevsel Analiz' },
    { id: 'defexc' as const, label: 'Eksiklikler ↔ Aşırılıklar' },
    { id: 'actmatrix' as const, label: 'ACT Matriks' },
  ];

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="text-base font-semibold text-[#0E0F12] mb-3">Formülasyon Ekleri</h2>
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                'text-xs px-3 py-1.5 rounded-xl font-medium transition-colors',
                tab === t.id ? 'bg-[#0E0F12] text-white' : 'text-gray-500 hover:bg-gray-100'
              )}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {tab === '5p' && <FivePFormulasyon data={fp5Data} onChange={(k, v) => setFp5Data(p => ({ ...p, [k]: v }))} />}
      {tab === 'fa' && <IslevselAnaliz data={faData} onChange={(k, v) => setFaData(p => ({ ...p, [k]: v }))} />}
      {tab === 'defexc' && <EksiklikAsirilik />}
      {tab === 'actmatrix' && <ActMatriksMetin data={actData} onChange={(k, v) => setActData(p => ({ ...p, [k]: v }))} />}
    </div>
  );
}
