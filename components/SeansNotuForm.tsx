'use client';

import React, { useState } from 'react';
import { SeansNotuData, EMPTY_SEANS_NOTU, BDT_TEKNIKLER } from '../lib/types';
import DictationButton from './DictationButton';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-[#555] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

/** Dikte butonu + textarea birleşimi — transkript metni sonuna eklenir */
function DictField({
  label,
  value,
  onChange,
  placeholder,
  minH = 80,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minH?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-[#555] uppercase tracking-wide">{label}</label>
        <DictationButton
          size="sm"
          onTranscript={(text) => onChange(value ? value + ' ' + text : text)}
        />
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight: minH }}
        className="min-h-[80px] w-full rounded-lg border border-[#ddd] bg-[#faf9f7] px-3 py-2 text-sm outline-none focus:border-[#1a1a1a] resize-y transition-colors"
      />
    </div>
  );
}

function Inp({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...p}
      className={cx(
        'h-10 w-full rounded-lg border border-[#ddd] bg-[#faf9f7] px-3 text-sm outline-none focus:border-[#1a1a1a] transition-colors',
        className,
      )}
    />
  );
}

function Txt({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...p}
      className={cx(
        'min-h-[80px] w-full rounded-lg border border-[#ddd] bg-[#faf9f7] px-3 py-2 text-sm outline-none focus:border-[#1a1a1a] resize-y transition-colors',
        className,
      )}
    />
  );
}

function ChipGroup({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={cx(
            'rounded-full px-3 py-1 text-xs border transition-colors',
            selected.includes(o)
              ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
              : 'bg-[#ece9e3] text-[#333] border-[#ddd] hover:border-[#1a1a1a]',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function RadioGroup({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-lg px-3 py-1.5 text-xs border transition-colors',
            value === o.value
              ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
              : 'bg-[#faf9f7] text-[#333] border-[#ddd] hover:border-[#1a1a1a]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-[#1a1a1a] border-b border-[#ece9e3] pb-2 mb-4 mt-6 first:mt-0">
      {children}
    </h3>
  );
}

interface SeansNotuFormProps {
  seansNo: number;
  initial?: SeansNotuData;
  initialTarih?: string;
  onSave: (tarih: string, data: SeansNotuData) => Promise<void>;
  onCancel: () => void;
}

export function SeansNotuForm({ seansNo, initial, initialTarih, onSave, onCancel }: SeansNotuFormProps) {
  const [data, setData] = useState<SeansNotuData>(initial ?? EMPTY_SEANS_NOTU);
  const [tarih, setTarih] = useState(initialTarih ? toLocal(initialTarih) : toLocal(new Date().toISOString()));
  const [saving, setSaving] = useState(false);

  function toLocal(iso: string) {
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  const set = <K extends keyof SeansNotuData>(k: K, v: SeansNotuData[K]) =>
    setData(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(new Date(tarih).toISOString(), data);
    } finally {
      setSaving(false);
    }
  };

  const riskTone: Record<string, string> = {
    yok: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    dusuk: 'text-yellow-700 bg-yellow-50 border-yellow-300',
    orta: 'text-orange-700 bg-orange-50 border-orange-300',
    yuksek: 'text-red-700 bg-red-50 border-red-300',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      {/* Header */}
      <div className="rounded-2xl border border-[#ece9e3] bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-[#1a1a1a]">Seans {seansNo} Notu</h2>
          <button onClick={onCancel} className="text-xs text-[#888] hover:text-[#1a1a1a] underline">
            Vazgeç
          </button>
        </div>
        <div className="mt-3">
          <Field label="Seans Tarihi">
            <Inp type="datetime-local" value={tarih} onChange={e => setTarih(e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Form body */}
      <div className="rounded-2xl border border-[#ece9e3] bg-white/90 p-5 shadow-sm space-y-4">
        <SectionTitle>Seans Başlangıcı</SectionTitle>
        <Field label={`Ruh Hali (1-10) — ${data.ruhHali}`}>
          <input
            type="range" min={1} max={10} value={data.ruhHali}
            onChange={e => set('ruhHali', Number(e.target.value))}
            className="w-full accent-[#1a1a1a]"
          />
        </Field>
        <DictField
          label="Gündem Maddeleri"
          value={data.gundemMaddeleri}
          onChange={v => set('gundemMaddeleri', v)}
          placeholder="Danışanın bu seans için belirlediği gündem…"
        />

        <SectionTitle>Ev Ödevi Takibi</SectionTitle>
        <Field label="Ev Ödevi Tamamlandı mı?">
          <RadioGroup
            options={[
              { label: 'Evet', value: 'true' },
              { label: 'Kısmen', value: 'false' },
              { label: 'Hayır', value: 'no' },
            ]}
            value={data.evOdeviTamamlandi === null ? '' : data.evOdeviTamamlandi ? 'true' : 'false'}
            onChange={v => set('evOdeviTamamlandi', v === 'true' ? true : v === 'false' ? false : null)}
          />
        </Field>
        <Field label="Ev Ödevi Takip Notu">
          <Txt value={data.evOdeviTakibi} onChange={e => set('evOdeviTakibi', e.target.value)} />
        </Field>

        <SectionTitle>Seans İçeriği</SectionTitle>
        <DictField
          label="Seans Odağı"
          value={data.seansOdagi}
          onChange={v => set('seansOdagi', v)}
          placeholder="Bu seansın temel çalışma konusu…"
        />
        <Field label="Kullanılan Teknikler">
          <ChipGroup
            options={BDT_TEKNIKLER}
            selected={data.kullanilanTeknikler}
            onChange={v => set('kullanilanTeknikler', v)}
          />
        </Field>

        <SectionTitle>Gözlemler</SectionTitle>
        <DictField
          label="Danışan Tepkisi"
          value={data.danisanTepkisi}
          onChange={v => set('danisanTepkisi', v)}
        />
        <DictField
          label="Gelişim Gözlemi"
          value={data.gelisimGozlemi}
          onChange={v => set('gelisimGozlemi', v)}
        />

        <SectionTitle>Sonraki Seans & Ödev</SectionTitle>
        <Field label="Sonraki Seans Planı">
          <Txt value={data.sonrakiSeansPlani} onChange={e => set('sonrakiSeansPlani', e.target.value)} />
        </Field>
        <Field label="Ev Ödevi">
          <Txt
            value={data.evOdevi}
            onChange={e => set('evOdevi', e.target.value)}
            placeholder="Bu seans için verilen ev ödevi…"
          />
        </Field>

        <SectionTitle>Risk Değerlendirmesi</SectionTitle>
        <Field label="Risk Düzeyi">
          <RadioGroup
            options={[
              { label: 'Yok', value: 'yok' },
              { label: 'Düşük', value: 'dusuk' },
              { label: 'Orta', value: 'orta' },
              { label: 'Yüksek', value: 'yuksek' },
            ]}
            value={data.riskDegerlendirme}
            onChange={v => set('riskDegerlendirme', v as SeansNotuData['riskDegerlendirme'])}
          />
        </Field>
        {data.riskDegerlendirme && data.riskDegerlendirme !== 'yok' && (
          <div className={cx('rounded-lg border p-3', riskTone[data.riskDegerlendirme] ?? '')}>
            <Field label="Risk Notu">
              <Txt
                value={data.riskNotu}
                onChange={e => set('riskNotu', e.target.value)}
                className="bg-transparent border-current"
              />
            </Field>
          </div>
        )}

        <SectionTitle>Terapist Notu</SectionTitle>
        <DictField
          label="Dahili Not (danışana gösterilmez)"
          value={data.terapistNotu}
          onChange={v => set('terapistNotu', v)}
          placeholder="Süpervizyon, vaka yorumu, kişisel gözlem…"
          minH={100}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pb-6">
        <button onClick={onCancel} className="h-10 px-4 rounded-lg border border-[#ddd] text-sm text-[#555] hover:bg-[#faf9f7]">
          Vazgeç
        </button>
        <button onClick={handleSave} disabled={saving} className="h-10 px-6 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] disabled:opacity-50">
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
