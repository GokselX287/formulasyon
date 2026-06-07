'use client';

import React, { useState } from 'react';
import { AnamnezData, EMPTY_ANAMNEZ, BDT_BILISSSEL_HATALAR, BASKIN_DUYGULAR } from '../lib/types';

// ---- Internal primitives ----
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-[#555] uppercase tracking-wide">{label}</label>
      {children}
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

// ---- Section header ----
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-[#1a1a1a] border-b border-[#ece9e3] pb-2 mb-4 mt-6 first:mt-0">
      {children}
    </h3>
  );
}

// ---- Main component ----
interface AnamnezFormProps {
  patientName: string;
  initial?: AnamnezData;
  initialTarih?: string;
  onSave: (tarih: string, data: AnamnezData) => Promise<void>;
  onCancel: () => void;
}

export function AnamnezForm({ patientName, initial, initialTarih, onSave, onCancel }: AnamnezFormProps) {
  const [data, setData] = useState<AnamnezData>(initial ?? EMPTY_ANAMNEZ);
  const [tarih, setTarih] = useState(initialTarih ? toLocal(initialTarih) : toLocal(new Date().toISOString()));
  const [saving, setSaving] = useState(false);

  function toLocal(iso: string) {
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  const set = <K extends keyof AnamnezData>(k: K, v: AnamnezData[K]) => setData(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(new Date(tarih).toISOString(), data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      {/* Header */}
      <div className="rounded-2xl border border-[#ece9e3] bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-[#1a1a1a]">BDT İlk Görüşme — Anamnez</h2>
          <button onClick={onCancel} className="text-xs text-[#888] hover:text-[#1a1a1a] underline">
            Vazgeç
          </button>
        </div>
        <p className="text-sm text-[#666]">{patientName}</p>
        <div className="mt-3">
          <Field label="Görüşme Tarihi">
            <Inp type="datetime-local" value={tarih} onChange={e => setTarih(e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Form body */}
      <div className="rounded-2xl border border-[#ece9e3] bg-white/90 p-5 shadow-sm space-y-4">
        <SectionTitle>Başvuru Bilgileri</SectionTitle>
        <Field label="Başvuru Nedeni">
          <Txt value={data.basvuruNedeni} onChange={e => set('basvuruNedeni', e.target.value)} placeholder="Danışan neden başvurdu?" />
        </Field>
        <Field label="Bizi Nasıl Buldu?">
          <Inp value={data.nasilBuldu} onChange={e => set('nasilBuldu', e.target.value)} />
        </Field>
        <Field label="Önceki Terapi Deneyimi">
          <RadioGroup
            options={[{ label: 'Evet', value: 'true' }, { label: 'Hayır', value: 'false' }]}
            value={data.oncekiTerapi === null ? '' : String(data.oncekiTerapi)}
            onChange={v => set('oncekiTerapi', v === 'true')}
          />
        </Field>
        {data.oncekiTerapi && (
          <Field label="Önceki Terapi Detayı">
            <Txt value={data.oncekiTerapiDetay} onChange={e => set('oncekiTerapiDetay', e.target.value)} />
          </Field>
        )}

        <SectionTitle>Şikayet & Belirti Profili</SectionTitle>
        <Field label="Ana Şikayet">
          <Txt value={data.anaGikayet} onChange={e => set('anaGikayet', e.target.value)} placeholder="Temel şikayet ne?" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Başlangıç Tarihi">
            <Inp type="date" value={data.baslangicTarihi} onChange={e => set('baslangicTarihi', e.target.value)} />
          </Field>
          <Field label="Tetikleyici Olay">
            <Inp value={data.tetikleyiciOlay} onChange={e => set('tetikleyiciOlay', e.target.value)} />
          </Field>
        </div>
        <Field label="Seyir">
          <RadioGroup
            options={[
              { label: 'Sürekli', value: 'surekli' },
              { label: 'Dönemsel', value: 'donemsek' },
              { label: 'Giderek kötüleşme', value: 'giderek-kotulesme' },
              { label: 'Dalgalı', value: 'dalgali' },
            ]}
            value={data.seyir}
            onChange={v => set('seyir', v as AnamnezData['seyir'])}
          />
        </Field>
        <Field label={`Yoğunluk — ${data.yogunluk}/10`}>
          <input
            type="range" min={1} max={10} value={data.yogunluk}
            onChange={e => set('yogunluk', Number(e.target.value))}
            className="w-full accent-[#1a1a1a]"
          />
        </Field>
        <Field label="Günlük Yaşama Etkisi">
          <Txt value={data.gunlukYasamaEtkisi} onChange={e => set('gunlukYasamaEtkisi', e.target.value)} />
        </Field>

        <SectionTitle>Bilişsel Yapı</SectionTitle>
        <Field label="Otomatik Düşünceler">
          <Txt value={data.otomatikDusunceler} onChange={e => set('otomatikDusunceler', e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Ben İnancı">
            <Txt value={data.benInanci} onChange={e => set('benInanci', e.target.value)} className="min-h-[60px]" />
          </Field>
          <Field label="Dünya İnancı">
            <Txt value={data.dunyaInanci} onChange={e => set('dunyaInanci', e.target.value)} className="min-h-[60px]" />
          </Field>
          <Field label="Gelecek İnancı">
            <Txt value={data.gelecekInanci} onChange={e => set('gelecekInanci', e.target.value)} className="min-h-[60px]" />
          </Field>
        </div>
        <Field label="Bilişsel Hatalar">
          <ChipGroup options={BDT_BILISSSEL_HATALAR} selected={data.bilisselHatalar} onChange={v => set('bilisselHatalar', v)} />
        </Field>

        <SectionTitle>Davranışsal Örüntüler</SectionTitle>
        <Field label="Kaçınılan Durumlar">
          <Txt value={data.kacinanDurumlar} onChange={e => set('kacinanDurumlar', e.target.value)} />
        </Field>
        <Field label="Güvenlik Davranışları">
          <Txt value={data.guvenlikDavranislari} onChange={e => set('guvenlikDavranislari', e.target.value)} />
        </Field>

        <SectionTitle>İşlevsellik Bozulması</SectionTitle>
        <div className="flex flex-wrap gap-3">
          {([
            { key: 'isOkul', label: 'İş / Okul' },
            { key: 'sosyal', label: 'Sosyal' },
            { key: 'aile', label: 'Aile' },
            { key: 'ozBakim', label: 'Öz-bakım' },
          ] as const).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.islevselBozulma[key]}
                onChange={e => set('islevselBozulma', { ...data.islevselBozulma, [key]: e.target.checked })}
                className="accent-[#1a1a1a]"
              />
              <span className="text-sm text-[#333]">{label}</span>
            </label>
          ))}
        </div>
        <Field label="Diğer Durumlar">
          <Inp value={data.islevselBozulma.baskaDurumlar} onChange={e => set('islevselBozulma', { ...data.islevselBozulma, baskaDurumlar: e.target.value })} />
        </Field>

        <SectionTitle>Duygusal Profil</SectionTitle>
        <Field label="Baskın Duygular">
          <ChipGroup options={BASKIN_DUYGULAR} selected={data.baskinDuygular} onChange={v => set('baskinDuygular', v)} />
        </Field>
        <Field label="Duygu Tetikleyicileri">
          <Txt value={data.duyguTetikleyicileri} onChange={e => set('duyguTetikleyicileri', e.target.value)} />
        </Field>
        <Field label="Duygu Düzenleme Becerisi">
          <Txt value={data.duyguDuzenlemeBecerisi} onChange={e => set('duyguDuzenlemeBecerisi', e.target.value)} />
        </Field>

        <SectionTitle>Gelişimsel & Sosyal Geçmiş</SectionTitle>
        <Field label="Aile Dinamikleri">
          <Txt value={data.aileDinamikleri} onChange={e => set('aileDinamikleri', e.target.value)} />
        </Field>
        <Field label="Çocukluk Deneyimleri">
          <Txt value={data.cocuklukDeneyimleri} onChange={e => set('cocuklukDeneyimleri', e.target.value)} />
        </Field>
        <Field label="Önemli Yaşam Olayları">
          <Txt value={data.onemliYasamOlaylari} onChange={e => set('onemliYasamOlaylari', e.target.value)} />
        </Field>

        <SectionTitle>Tıbbi & Psikiyatrik Geçmiş</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Tıbbi Tanılar">
            <Txt value={data.tibbTanilar} onChange={e => set('tibbTanilar', e.target.value)} className="min-h-[60px]" />
          </Field>
          <Field label="Kullanılan İlaçlar">
            <Txt value={data.kullanilanIlaclar} onChange={e => set('kullanilanIlaclar', e.target.value)} className="min-h-[60px]" />
          </Field>
          <Field label="Madde Kullanımı">
            <Inp value={data.maddeKullanimi} onChange={e => set('maddeKullanimi', e.target.value)} />
          </Field>
          <Field label="Önceki Psikiyatrik Tanı">
            <Inp value={data.oncekiPsikiyatrikTani} onChange={e => set('oncekiPsikiyatrikTani', e.target.value)} />
          </Field>
        </div>
        <Field label="İntihar Geçmişi">
          <RadioGroup
            options={[{ label: 'Var', value: 'true' }, { label: 'Yok', value: 'false' }]}
            value={data.intiharGecmis === null ? '' : String(data.intiharGecmis)}
            onChange={v => set('intiharGecmis', v === 'true')}
          />
        </Field>
        <Field label="Mevcut İntihar Düşüncesi">
          <RadioGroup
            options={[{ label: 'Var', value: 'true' }, { label: 'Yok', value: 'false' }]}
            value={data.intiharSuanki === null ? '' : String(data.intiharSuanki)}
            onChange={v => set('intiharSuanki', v === 'true')}
          />
        </Field>
        {(data.intiharGecmis || data.intiharSuanki) && (
          <Field label="İntihar Detayı">
            <Txt value={data.intiharDetay} onChange={e => set('intiharDetay', e.target.value)} />
          </Field>
        )}

        <SectionTitle>Sosyal & Güçlü Yönler</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Medeni Durum">
            <Inp value={data.medeniDurum} onChange={e => set('medeniDurum', e.target.value)} />
          </Field>
          <Field label="Çalışma / Yaşam Durumu">
            <Inp value={data.calismaYasam} onChange={e => set('calismaYasam', e.target.value)} />
          </Field>
          <Field label="Sosyal Destek">
            <Txt value={data.sosyalDestek} onChange={e => set('sosyalDestek', e.target.value)} className="min-h-[60px]" />
          </Field>
          <Field label="Güçlü Yönler">
            <Txt value={data.gucluYonler} onChange={e => set('gucluYonler', e.target.value)} className="min-h-[60px]" />
          </Field>
        </div>

        <SectionTitle>5P Formülasyon</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Yatkınlaştırıcı (Predispozan)">
            <Txt value={data.fp_yatkinlastirici} onChange={e => set('fp_yatkinlastirici', e.target.value)} className="min-h-[60px]" />
          </Field>
          <Field label="Tetikleyici (Presipitan)">
            <Txt value={data.fp_tetikleyici} onChange={e => set('fp_tetikleyici', e.target.value)} className="min-h-[60px]" />
          </Field>
          <Field label="Sürdürücü (Perpetuan)">
            <Txt value={data.fp_surdurucu} onChange={e => set('fp_surdurucu', e.target.value)} className="min-h-[60px]" />
          </Field>
          <Field label="Koruyucu (Protektif)">
            <Txt value={data.fp_koruyucu} onChange={e => set('fp_koruyucu', e.target.value)} className="min-h-[60px]" />
          </Field>
          <Field label="Sunan (Presenting)">
            <Txt value={data.fp_sunan} onChange={e => set('fp_sunan', e.target.value)} className="min-h-[60px]" />
          </Field>
        </div>
      </div>

      {/* Footer actions */}
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
