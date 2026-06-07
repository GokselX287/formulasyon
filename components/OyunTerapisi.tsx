'use client';

import React, { useEffect, useState } from 'react';
import {
  Save, ChevronDown, ChevronUp, Plus, Trash2, CheckCircle2, Circle,
  Star, Sparkles, Smile, Heart, Palette, Shield, Users, BookOpen, Target
} from 'lucide-react';

// ─── Renkler ────────────────────────────────────────────────────────────────
const BRAND = '#5B4A8A'; // mor — oyun terapisi rengi

// ─── Tipler ─────────────────────────────────────────────────────────────────
interface OyunNotuRow {
  tarih: string;
  oturum: string;
  tema: string;
  kullanılanMateryal: string;
  gozlemler: string;
  terapotikHedef: string;
  cocukReaksiyonu: string;
  sonrakiPlan: string;
}

interface FilogenikDurum {
  gucluYonler: string;
  zorluYonler: string;
  baglanmaCalismasi: string;
  ozguven: string;
}

interface OyunTerapisiData {
  // Temel Bilgiler
  seansNo: string;
  terapist: string;
  model: 'directive' | 'nondirective' | 'integrative';
  yaklasim: string;

  // Oturum Yapısı
  oturumAmaci: string;
  kullanılanTeknikler: string[];
  ortamDuzeni: string;

  // Gözlemler
  duygusalDurum: string;
  davranisGozlemleri: string;
  oyunTeması: string;
  sembolikIcerik: string;

  // Terapotik İlerleme
  hedefler: string[];
  ilerlemeDurumu: string;
  onemliAnlar: string;

  // Ebeveyn Çalışması
  ebeveynCalisma: string;
  ebeveynGeri: string;

  // Gelişimsel Notlar
  filogenikDurum: FilogenikDurum;

  // Seçimli Ölçüm Araçları
  kaygiSkoru: number | null;
  ozguvenSkoru: number | null;
  uyumSkoru: number | null;

  // Ek Notlar
  supervizyon: string;
  gelecekPlan: string;

  // Seans Günlüğü (çoklu oturum)
  seansGunlugu: OyunNotuRow[];

  // Kontrol Listesi
  kontrol: {
    guvenliBagStein: boolean;
    benlikSaygiCalismasi: boolean;
    duygulariFarket: boolean;
    sosyalBeceri: boolean;
    travmaIsle: boolean;
    ebeveyneDestek: boolean;
  };
}

const BOSH: OyunTerapisiData = {
  seansNo: '',
  terapist: '',
  model: 'nondirective',
  yaklasim: '',

  oturumAmaci: '',
  kullanılanTeknikler: [],
  ortamDuzeni: '',

  duygusalDurum: '',
  davranisGozlemleri: '',
  oyunTeması: '',
  sembolikIcerik: '',

  hedefler: [],
  ilerlemeDurumu: '',
  onemliAnlar: '',

  ebeveynCalisma: '',
  ebeveynGeri: '',

  filogenikDurum: {
    gucluYonler: '',
    zorluYonler: '',
    baglanmaCalismasi: '',
    ozguven: '',
  },

  kaygiSkoru: null,
  ozguvenSkoru: null,
  uyumSkoru: null,

  supervizyon: '',
  gelecekPlan: '',

  seansGunlugu: [],

  kontrol: {
    guvenliBagStein: false,
    benlikSaygiCalismasi: false,
    duygulariFarket: false,
    sosyalBeceri: false,
    travmaIsle: false,
    ebeveyneDestek: false,
  },
};

const TEKNIKLER = [
  'Kum Tepsisi',
  'Kukla Oyunu',
  'Rol Yapma / Canlandırma',
  'Resim & Boyama',
  'Kil / Plastilin',
  'Hikâye Anlatımı',
  'Müzik & Ritim',
  'Doğa Materyalleri',
  'Masa Oyunları',
  'Bibliyo-terapi',
  'Hareket & Dans',
  'Nefes & Gevşeme',
];

const KONTROL_LABELS: Record<keyof OyunTerapisiData['kontrol'], string> = {
  guvenliBagStein: 'Güvenli bağ ve güvenli alan oluşturuldu',
  benlikSaygiCalismasi: 'Benlik saygısı çalışması yapıldı',
  duygulariFarket: 'Duyguları fark etme / tanımlama desteklendi',
  sosyalBeceri: 'Sosyal beceri gelişimine yönelik aktivite içerildi',
  travmaIsle: 'Travmatik içerik güvenli biçimde işlendi',
  ebeveyneDestek: 'Ebeveyne rehberlik / psikoeğitim verildi',
};

// ─── Alt Bileşenler ──────────────────────────────────────────────────────────

function Section({ title, icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        style={{ backgroundColor: open ? '#F3F0FA' : '#FAFAFA' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: BRAND }}>{icon}</span>
          <span className="text-sm font-semibold" style={{ color: BRAND }}>{title}</span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-purple-400" />
          : <ChevronDown className="w-4 h-4 text-purple-400" />}
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function TA({ value, onChange, rows = 3, placeholder = '' }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
    />
  );
}

function Input({ value, onChange, placeholder = '', type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
    />
  );
}

function ScoreSlider({ label, value, onChange }: {
  label: string; value: number | null; onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        <span className="text-xs font-bold" style={{ color: BRAND }}>
          {value !== null ? `${value}/10` : '—'}
        </span>
      </div>
      <input
        type="range" min={0} max={10} step={1}
        value={value ?? 5}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-purple-500"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
        <span>0 — Çok Düşük</span>
        <span>10 — Çok Yüksek</span>
      </div>
    </div>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────
export default function OyunTerapisi({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const storageKey = `oyun_terapisi_${patientId}`;
  const [data, setData] = useState<OyunTerapisiData>(() => {
    if (typeof window === 'undefined') return BOSH;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? { ...BOSH, ...JSON.parse(raw) } : BOSH;
    } catch {
      return BOSH;
    }
  });
  const [saved, setSaved] = useState(false);

  // Auto-save
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, storageKey]);

  const set = <K extends keyof OyunTerapisiData>(key: K, val: OyunTerapisiData[K]) =>
    setData(d => ({ ...d, [key]: val }));

  const setFilo = (k: keyof FilogenikDurum, v: string) =>
    setData(d => ({ ...d, filogenikDurum: { ...d.filogenikDurum, [k]: v } }));

  const setKontrol = (k: keyof OyunTerapisiData['kontrol'], v: boolean) =>
    setData(d => ({ ...d, kontrol: { ...d.kontrol, [k]: v } }));

  const toggleTeknik = (t: string) =>
    setData(d => ({
      ...d,
      kullanılanTeknikler: d.kullanılanTeknikler.includes(t)
        ? d.kullanılanTeknikler.filter(x => x !== t)
        : [...d.kullanılanTeknikler, t],
    }));

  // Hedefler listesi
  const addHedef = () => setData(d => ({ ...d, hedefler: [...d.hedefler, ''] }));
  const updateHedef = (i: number, v: string) =>
    setData(d => { const h = [...d.hedefler]; h[i] = v; return { ...d, hedefler: h }; });
  const removeHedef = (i: number) =>
    setData(d => ({ ...d, hedefler: d.hedefler.filter((_, j) => j !== i) }));

  // Seans günlüğü
  const addSeans = () =>
    setData(d => ({
      ...d,
      seansGunlugu: [...d.seansGunlugu, {
        tarih: '', oturum: '', tema: '', kullanılanMateryal: '',
        gozlemler: '', terapotikHedef: '', cocukReaksiyonu: '', sonrakiPlan: '',
      }],
    }));
  const updateSeans = (i: number, k: keyof OyunNotuRow, v: string) =>
    setData(d => {
      const rows = [...d.seansGunlugu];
      rows[i] = { ...rows[i], [k]: v };
      return { ...d, seansGunlugu: rows };
    });
  const removeSeans = (i: number) =>
    setData(d => ({ ...d, seansGunlugu: d.seansGunlugu.filter((_, j) => j !== i) }));

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const kontrolKeys = Object.keys(data.kontrol) as Array<keyof OyunTerapisiData['kontrol']>;
  const done = kontrolKeys.filter(k => data.kontrol[k]).length;
  const pct = Math.round((done / kontrolKeys.length) * 100);

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="bg-white rounded-2xl border border-purple-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#F3F0FA' }}>
              <Smile className="w-5 h-5" style={{ color: BRAND }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: BRAND }}>Oyun Terapisi</h2>
              <p className="text-xs text-gray-500">{patientName} · Çocuk Terapisi Seans Formu</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition"
            style={{ backgroundColor: BRAND }}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Kaydedildi ✓' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* 1. Temel Bilgiler */}
      <Section title="Temel Bilgiler" icon={<BookOpen className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Seans Numarası">
            <Input value={data.seansNo} onChange={v => set('seansNo', v)} placeholder="örn. 3" />
          </Field>
          <Field label="Terapist">
            <Input value={data.terapist} onChange={v => set('terapist', v)} placeholder="Ad Soyad" />
          </Field>
        </div>
        <Field label="Terapi Modeli">
          <div className="flex gap-2 flex-wrap">
            {([
              { v: 'nondirective', l: 'Yönsüz (Non-directive)' },
              { v: 'directive',    l: 'Yönlü (Directive)'      },
              { v: 'integrative',  l: 'Bütünleşik'             },
            ] as const).map(opt => (
              <button
                key={opt.v}
                onClick={() => set('model', opt.v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  data.model === opt.v
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                }`}
                style={data.model === opt.v ? { backgroundColor: BRAND } : {}}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Teorik Yaklaşım / Ek Not">
          <TA value={data.yaklasim} onChange={v => set('yaklasim', v)} rows={2}
            placeholder="Örn. Filial terapi, Gestalt oyun terapisi, Adlerian yaklaşım…" />
        </Field>
      </Section>

      {/* 2. Oturum Yapısı */}
      <Section title="Oturum Yapısı" icon={<Palette className="w-4 h-4" />}>
        <Field label="Oturum Amacı">
          <TA value={data.oturumAmaci} onChange={v => set('oturumAmaci', v)} rows={2}
            placeholder="Bu seans için belirlenen ana terapötik amaç…" />
        </Field>
        <Field label="Kullanılan Teknikler & Materyaller">
          <div className="flex flex-wrap gap-2">
            {TEKNIKLER.map(t => {
              const selected = data.kullanılanTeknikler.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTeknik(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    selected
                      ? 'text-white border-transparent'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                  }`}
                  style={selected ? { backgroundColor: BRAND } : {}}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Oyun Odası / Ortam Düzeni Notları">
          <TA value={data.ortamDuzeni} onChange={v => set('ortamDuzeni', v)} rows={2}
            placeholder="Oda düzenlemesi, malzeme seçimi, güvenli alan kurulumu…" />
        </Field>
      </Section>

      {/* 3. Seans Gözlemleri */}
      <Section title="Seans Gözlemleri" icon={<Sparkles className="w-4 h-4" />}>
        <Field label="Çocuğun Duygusal Durumu (Seans Başı → Sonu)">
          <TA value={data.duygusalDurum} onChange={v => set('duygusalDurum', v)} rows={2}
            placeholder="Seansa geldiğinde gergin, sonunda sakin ve açık…" />
        </Field>
        <Field label="Davranış Gözlemleri">
          <TA value={data.davranisGozlemleri} onChange={v => set('davranisGozlemleri', v)} rows={3}
            placeholder="Göz teması, iletişim, sınır koyma, saldırganlık, çekilme vb." />
        </Field>
        <Field label="Oyun Teması / Ana Motif">
          <TA value={data.oyunTeması} onChange={v => set('oyunTeması', v)} rows={2}
            placeholder="Güç & kontrol, kayıp & ayrılık, kahraman & kurtarıcı, ailenin yeniden birleşmesi…" />
        </Field>
        <Field label="Sembolik İçerik / Metafor Analizi">
          <TA value={data.sembolikIcerik} onChange={v => set('sembolikIcerik', v)} rows={3}
            placeholder="Kum tepsisindeki figürler, seçilen kuklalar, çizilen imgeler ve bunların potansiyel anlamları…" />
        </Field>
        <Field label="Dikkat Çeken / Önemli Anlar">
          <TA value={data.onemliAnlar} onChange={v => set('onemliAnlar', v)} rows={2}
            placeholder="Ani ağlama, gülümseme, korku tepkisi, açılma momenti…" />
        </Field>
      </Section>

      {/* 4. Terapötik İlerleme */}
      <Section title="Terapötik Hedefler & İlerleme" icon={<Target className="w-4 h-4" />}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-600">Hedefler</label>
            <button onClick={addHedef}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
              style={{ color: BRAND, backgroundColor: '#F3F0FA' }}>
              <Plus className="w-3.5 h-3.5" /> Hedef Ekle
            </button>
          </div>
          {data.hedefler.map((h, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={h}
                onChange={e => updateHedef(i, e.target.value)}
                placeholder={`Hedef ${i + 1}`}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <button onClick={() => removeHedef(i)}
                className="text-gray-400 hover:text-red-500 transition px-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {data.hedefler.length === 0 && (
            <p className="text-xs text-gray-400 italic">Henüz hedef eklenmedi.</p>
          )}
        </div>
        <Field label="Bu Seans İlerleme Durumu">
          <TA value={data.ilerlemeDurumu} onChange={v => set('ilerlemeDurumu', v)} rows={3}
            placeholder="Hedeflere ne ölçüde ulaşıldı? Hangi terapötik kırılımlar yaşandı?" />
        </Field>
      </Section>

      {/* 5. Ölçüm Araçları */}
      <Section title="Ölçüm Araçları (Terapist Değerlendirmesi)" icon={<Star className="w-4 h-4" />} defaultOpen={false}>
        <p className="text-xs text-gray-500 italic -mt-1">
          Aşağıdaki puanlar terapistin klinik gözlemine dayalı tahminidir, standart bir test değildir.
        </p>
        <div className="space-y-5">
          <ScoreSlider label="Kaygı Düzeyi (seans içi)" value={data.kaygiSkoru} onChange={v => set('kaygiSkoru', v)} />
          <ScoreSlider label="Öz-güven / Öz-yeterlik" value={data.ozguvenSkoru} onChange={v => set('ozguvenSkoru', v)} />
          <ScoreSlider label="Sosyal Uyum / İletişim" value={data.uyumSkoru} onChange={v => set('uyumSkoru', v)} />
        </div>
      </Section>

      {/* 6. Ebeveyn Çalışması */}
      <Section title="Ebeveyn / Aile Çalışması" icon={<Users className="w-4 h-4" />} defaultOpen={false}>
        <Field label="Ebeveynle Yapılan Çalışma">
          <TA value={data.ebeveynCalisma} onChange={v => set('ebeveynCalisma', v)} rows={3}
            placeholder="Filial terapi rehberi, ev ödevleri, psikoeğitim konusu…" />
        </Field>
        <Field label="Ebeveyn Geri Bildirimi">
          <TA value={data.ebeveynGeri} onChange={v => set('ebeveynGeri', v)} rows={2}
            placeholder="Ebeveynin ev ortamındaki gözlemleri, kaygıları, güçlükleri…" />
        </Field>
      </Section>

      {/* 7. Gelişimsel Profil */}
      <Section title="Gelişimsel Profil & Bağlanma" icon={<Heart className="w-4 h-4" />} defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Güçlü Yönler">
            <TA value={data.filogenikDurum.gucluYonler}
              onChange={v => setFilo('gucluYonler', v)} rows={3}
              placeholder="Yaratıcılık, merak, empati, mizah…" />
          </Field>
          <Field label="Zorlu Yönler / Risk Faktörleri">
            <TA value={data.filogenikDurum.zorluYonler}
              onChange={v => setFilo('zorluYonler', v)} rows={3}
              placeholder="Düzensizleşme, kaçınma, saldırganlık patlakları…" />
          </Field>
          <Field label="Bağlanma Örüntüsü & Çalışma">
            <TA value={data.filogenikDurum.baglanmaCalismasi}
              onChange={v => setFilo('baglanmaCalismasi', v)} rows={3}
              placeholder="Güvenli / kaçıngan / kararsız / dağınık — terapötik bağlanma çalışması…" />
          </Field>
          <Field label="Öz-Saygı & Benlik Algısı">
            <TA value={data.filogenikDurum.ozguven}
              onChange={v => setFilo('ozguven', v)} rows={3}
              placeholder="Çocuğun kendine dair söylemleri, benlik figürleri…" />
          </Field>
        </div>
      </Section>

      {/* 8. Seans Günlüğü */}
      <Section title="Seans Günlüğü" icon={<BookOpen className="w-4 h-4" />} defaultOpen={false}>
        <p className="text-xs text-gray-500 -mt-1 italic">Her oturum için ayrı satır ekleyin.</p>
        {data.seansGunlugu.map((row, i) => (
          <div key={i} className="border border-purple-100 rounded-2xl p-4 space-y-3 bg-purple-50/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: BRAND }}>Oturum {i + 1}</span>
              <button onClick={() => removeSeans(i)} className="text-gray-400 hover:text-red-500 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tarih">
                <input type="date" value={row.tarih} onChange={e => updateSeans(i, 'tarih', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
              </Field>
              <Field label="Oturum #">
                <input type="text" value={row.oturum} placeholder="3." onChange={e => updateSeans(i, 'oturum', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
              </Field>
            </div>
            <Field label="Ana Tema">
              <input type="text" value={row.tema} placeholder="Güç & kontrol" onChange={e => updateSeans(i, 'tema', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
            </Field>
            <Field label="Kullanılan Materyal">
              <input type="text" value={row.kullanılanMateryal} placeholder="Kum tepsisi, figürler" onChange={e => updateSeans(i, 'kullanılanMateryal', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
            </Field>
            <Field label="Terapötik Hedef">
              <input type="text" value={row.terapotikHedef} onChange={e => updateSeans(i, 'terapotikHedef', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
            </Field>
            <Field label="Gözlemler">
              <textarea value={row.gozlemler} onChange={e => updateSeans(i, 'gozlemler', e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none" />
            </Field>
            <Field label="Çocuğun Tepkisi">
              <textarea value={row.cocukReaksiyonu} onChange={e => updateSeans(i, 'cocukReaksiyonu', e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none" />
            </Field>
            <Field label="Sonraki Seans Planı">
              <input type="text" value={row.sonrakiPlan} onChange={e => updateSeans(i, 'sonrakiPlan', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
            </Field>
          </div>
        ))}
        <button
          onClick={addSeans}
          className="w-full border-2 border-dashed border-purple-200 rounded-2xl py-3 text-sm font-semibold transition hover:border-purple-400 flex items-center justify-center gap-2"
          style={{ color: BRAND }}
        >
          <Plus className="w-4 h-4" /> Seans Satırı Ekle
        </button>
      </Section>

      {/* 9. Süpervizyon & Sonraki Plan */}
      <Section title="Süpervizyon Notları & Sonraki Seans Planı" icon={<Shield className="w-4 h-4" />} defaultOpen={false}>
        <Field label="Süpervizyon Notları">
          <TA value={data.supervizyon} onChange={v => set('supervizyon', v)} rows={3}
            placeholder="Supervizörle paylaşılacak noktalar, kendi refleksiyonlarınız…" />
        </Field>
        <Field label="Sonraki Seans Planı">
          <TA value={data.gelecekPlan} onChange={v => set('gelecekPlan', v)} rows={3}
            placeholder="Bir sonraki oturumda kullanılacak materyal, tema, teknik…" />
        </Field>
      </Section>

      {/* 10. Kontrol Listesi */}
      <div className="bg-white rounded-2xl border border-purple-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: BRAND }}>Seans Kontrol Listesi</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F3F0FA', color: BRAND }}>
            {done}/{kontrolKeys.length}
          </span>
        </div>
        {/* İlerleme çubuğu */}
        <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: BRAND }}
          />
        </div>
        <div className="space-y-2">
          {kontrolKeys.map(k => (
            <button
              key={k}
              onClick={() => setKontrol(k, !data.kontrol[k])}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition hover:bg-purple-50/50"
              style={{ borderColor: data.kontrol[k] ? BRAND : '#E5E7EB' }}
            >
              {data.kontrol[k]
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: BRAND }} />
                : <Circle className="w-4 h-4 flex-shrink-0 text-gray-300" />}
              <span className={`text-sm ${data.kontrol[k] ? 'font-semibold' : 'text-gray-600'}`}
                style={data.kontrol[k] ? { color: BRAND } : {}}>
                {KONTROL_LABELS[k]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
