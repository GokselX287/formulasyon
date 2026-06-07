'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown, ChevronRight, Save, CheckCircle2,
  Plus, Trash2, AlertCircle, ClipboardList, Users,
  BookOpen, Target, GitBranch, CheckSquare, Info,
} from 'lucide-react';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CocukBdtData {
  // Demografik
  cocukAdi: string;
  gorusmeTarihi: string;
  yasi: string;
  sinifi: string;
  telefonEposta: string;

  // Mevcut Problemler
  yonlendiren: string;
  yonlendirmeNedeni: string;
  sikayetler: string[];           // max 4+
  sikayetAyrintilar: string;      // tüm bullet sorular için serbest alan

  // Aile
  aile: string;
  cocukEvdeVakit: string;
  aileSaglik: string;

  // Gelişimsel
  gelisimselHikaye: string;
  onemliOlaylar: string;
  okulAkranIliskileri: string;

  // SMART Hedefler
  ebeveynTemelSorun: string;
  cocukTemelSorun: string;
  digerBeklentiler: string;
  ortakHedefler: string;
  smartHedefler: string;

  // Vaka Formülasyonu
  dortDDongusu: string;
  tetikleyiciBoyutlar: string;
  surduruculer: string;
  guvenlikDavranislari: string;

  // Kontrol Listesi
  kontrol: {
    yeterliBlgi: boolean;
    abcTanimli: boolean;
    olcekDolduruldu: boolean;
    smartBelirlendi: boolean;
    formulasyonYapildi: boolean;
    terapiPlaniNot: boolean;
  };

  // Terapi Planı
  terapiPlani: string;
}

const EMPTY: CocukBdtData = {
  cocukAdi: '', gorusmeTarihi: '', yasi: '', sinifi: '', telefonEposta: '',
  yonlendiren: '', yonlendirmeNedeni: '',
  sikayetler: ['', '', '', ''],
  sikayetAyrintilar: '',
  aile: '', cocukEvdeVakit: '', aileSaglik: '',
  gelisimselHikaye: '', onemliOlaylar: '', okulAkranIliskileri: '',
  ebeveynTemelSorun: '', cocukTemelSorun: '', digerBeklentiler: '',
  ortakHedefler: '', smartHedefler: '',
  dortDDongusu: '', tetikleyiciBoyutlar: '', surduruculer: '', guvenlikDavranislari: '',
  kontrol: {
    yeterliBlgi: false, abcTanimli: false, olcekDolduruldu: false,
    smartBelirlendi: false, formulasyonYapildi: false, terapiPlaniNot: false,
  },
  terapiPlani: '',
};

// ─── Yardımcı bileşenler ─────────────────────────────────────────────────────

const BLUE = 'bg-[#1A3A6B] text-white hover:bg-[#152F5A]';

function SectionHeader({
  icon: Icon, title, subtitle, open, onToggle,
}: {
  icon: React.ElementType<{ className?: string }>; title: string; subtitle?: string;
  open: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cx('w-full flex items-center justify-between px-5 py-3.5 rounded-t-2xl text-left transition-colors', BLUE)}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold tracking-wide uppercase">{title}</p>
          {subtitle && <p className="text-[11px] opacity-70 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {open ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
    </button>
  );
}

function HintBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
      <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
      <p className="text-[10px] text-blue-700 leading-relaxed">{children}</p>
    </div>
  );
}

function Field({
  label, hint, value, onChange, rows = 3, placeholder,
}: {
  label?: string; hint?: string; value: string;
  onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      {label && <p className="text-xs font-semibold text-[#0E0F12] mb-1">{label}</p>}
      {hint && <HintBox>{hint}</HintBox>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder ?? '…'}
        className={cx(
          'w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none outline-none',
          'focus:border-[#1A3A6B] text-gray-700 placeholder:text-gray-300 transition-colors',
          hint ? 'mt-2' : '',
        )}
      />
    </div>
  );
}

function InlineInput({
  label, value, onChange, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#1A3A6B] text-gray-700 transition-colors"
      />
    </div>
  );
}

function CheckItem({
  no, label, checked, onChange,
}: {
  no: number; label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cx(
        'w-full flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all',
        checked ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white hover:border-blue-200',
      )}
    >
      <div className={cx(
        'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors',
        checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300',
      )}>
        {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
      </div>
      <div>
        <span className={cx('text-[10px] font-bold mr-2', checked ? 'text-emerald-600' : 'text-gray-400')}>
          {no}.
        </span>
        <span className={cx('text-sm', checked ? 'text-emerald-700 font-medium' : 'text-gray-600')}>{label}</span>
      </div>
    </button>
  );
}

// Görsel 4D Kısır Döngüsü
function DortDDiagram({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [parts, setParts] = useState(() => {
    try { return JSON.parse(value) as Record<string, string>; }
    catch { return { tetikleyici: '', dusunce: '', duyguBeden: '', davranis: '' }; }
  });

  const update = (key: string, val: string) => {
    const next = { ...parts, [key]: val };
    setParts(next);
    onChange(JSON.stringify(next));
  };

  const box = (key: string, label: string, color: string, hint: string) => (
    <div className={cx('rounded-xl border-2 overflow-hidden', color)}>
      <div className={cx('px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide', color.replace('border-', 'bg-').replace('-200', '-100'))}>
        {label}
      </div>
      <textarea
        value={parts[key] ?? ''}
        onChange={e => update(key, e.target.value)}
        rows={3}
        placeholder={hint}
        className="w-full text-xs border-0 px-3 py-2 resize-none outline-none text-gray-700 placeholder:text-gray-300 bg-white"
      />
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {box('tetikleyici', '① Tetikleyici / Durum', 'border-blue-200', 'Hangi olay/durum tetikledi?')}
        {box('dusunce', '② Düşünce', 'border-violet-200', 'Ne düşündü? Otomatik düşünce?')}
        {box('duyguBeden', '③ Duygu & Beden', 'border-rose-200', 'Ne hissetti? Bedende ne oldu?')}
        {box('davranis', '④ Davranış / Tepki', 'border-amber-200', 'Ne yaptı? Ne yapmadı?')}
      </div>
      <p className="text-[10px] text-gray-400 text-center">4D Kısır Döngüsü — Danışan + Aile + Akran sistemi için örneklendir</p>
    </div>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

interface Props {
  patientId: string;
  patientName: string;
}

export default function CocukBdtForm({ patientId, patientName }: Props) {
  const storageKey = `cocuk_bdt_${patientId}`;

  const [data, setData] = useState<CocukBdtData>(() => {
    if (typeof window === 'undefined') return EMPTY;
    try {
      const stored = localStorage.getItem(storageKey);
      const base = stored ? JSON.parse(stored) : {};
      return {
        ...EMPTY,
        ...base,
        cocukAdi: base.cocukAdi ?? patientName,
        gorusmeTarihi: base.gorusmeTarihi ?? new Date().toISOString().slice(0, 10),
        kontrol: { ...EMPTY.kontrol, ...(base.kontrol ?? {}) },
        sikayetler: base.sikayetler ?? ['', '', '', ''],
      };
    } catch { return { ...EMPTY, cocukAdi: patientName, gorusmeTarihi: new Date().toISOString().slice(0, 10) }; }
  });

  const [open, setOpen] = useState<Record<string, boolean>>({
    demo: true, problem: true, aile: false,
    gelisim: false, smart: false, formul: false, kontrol: false,
  });
  const [saved, setSaved] = useState(false);

  const set = useCallback(<K extends keyof CocukBdtData>(key: K, val: CocukBdtData[K]) =>
    setData(prev => ({ ...prev, [key]: val })), []);

  const setKontrol = useCallback((key: keyof CocukBdtData['kontrol'], val: boolean) =>
    setData(prev => ({ ...prev, kontrol: { ...prev.kontrol, [key]: val } })), []);

  const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  // Auto-save
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /**/ }
  }, [data, storageKey]);

  const handleSave = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /**/ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateSikayet = (i: number, val: string) => {
    const arr = [...data.sikayetler];
    arr[i] = val;
    set('sikayetler', arr);
  };
  const addSikayet = () => set('sikayetler', [...data.sikayetler, '']);
  const removeSikayet = (i: number) => set('sikayetler', data.sikayetler.filter((_, idx) => idx !== i));

  const kontrolCount = Object.values(data.kontrol).filter(Boolean).length;
  const kontrolTotal = Object.keys(data.kontrol).length;

  return (
    <div className="space-y-4 pb-6">

      {/* Başlık */}
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#1A3A6B] font-semibold mb-0.5">
            Çocuk & Ergen BDT — Görüşme Formu
          </p>
          <h2 className="text-base font-bold text-[#0E0F12]">{patientName}</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Vahdet Görmez protokolü — ÇocukErgenBDT</p>
        </div>
        <button
          onClick={handleSave}
          className={cx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all',
            saved ? 'bg-emerald-100 text-emerald-700' : 'bg-[#1A3A6B] text-white hover:bg-[#152F5A]',
          )}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      {/* ── 1. Demografik ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={ClipboardList} title="Tanımlayıcı Bilgiler"
          open={open.demo} onToggle={() => toggle('demo')} />
        {open.demo && (
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <InlineInput label="Çocuğun Adı" value={data.cocukAdi} onChange={v => set('cocukAdi', v)} />
              <InlineInput label="Görüşme Tarihi" value={data.gorusmeTarihi} onChange={v => set('gorusmeTarihi', v)} type="date" />
              <InlineInput label="Yaşı" value={data.yasi} onChange={v => set('yasi', v)} />
              <InlineInput label="Sınıfı" value={data.sinifi} onChange={v => set('sinifi', v)} />
              <div className="md:col-span-2">
                <InlineInput label="Telefon / E-Posta" value={data.telefonEposta} onChange={v => set('telefonEposta', v)} />
              </div>
            </div>

            {/* BDT Görüşme Rehberi */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 space-y-1">
              <p className="text-[10px] font-bold text-[#1A3A6B] uppercase tracking-wide mb-1">Görüşme Rehberi</p>
              <p className="text-[10px] text-blue-700 leading-relaxed">
                İlk ve ortaokul çağındaki çocuklarda görüşme tercihen <strong>çocuk ve aile ile birlikte</strong> yapılmalıdır.
                Terapötik güven ilişkisi hem çocuk hem ebeveynlerle kurulmalıdır.
                Çocuğun bilgisi dışında aile ile "gizli görüşmeler" yapılmayacağı güveni danışana aktarılmalıdır.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Mevcut Problemler ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={AlertCircle} title="Mevcut Problemlerin Değerlendirilmesi"
          open={open.problem} onToggle={() => toggle('problem')} />
        {open.problem && (
          <div className="p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Çocuğu psikolojik değerlendirme için kim yönlendirdi?"
                value={data.yonlendiren} onChange={v => set('yonlendiren', v)} rows={2} />
              <Field label="Başkası yönlendirdi ise, neden yönlendirdi?"
                value={data.yonlendirmeNedeni} onChange={v => set('yonlendirmeNedeni', v)} rows={2} />
            </div>

            {/* Şikayet Listesi */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#0E0F12]">
                  Danışanla ilgili şikayetler <span className="text-gray-400 font-normal">(ayrıntıya girmeden, sadece liste)</span>
                </p>
                <button onClick={addSikayet}
                  className="flex items-center gap-1 text-[10px] text-[#1A3A6B] hover:text-blue-900 font-semibold transition-colors">
                  <Plus className="w-3 h-3" /> Ekle
                </button>
              </div>
              <div className="space-y-1.5">
                {data.sikayetler.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1A3A6B] w-5 flex-shrink-0">{i + 1}.</span>
                    <input
                      value={s}
                      onChange={e => updateSikayet(i, e.target.value)}
                      placeholder={`Şikayet ${i + 1}…`}
                      className="flex-1 h-9 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#1A3A6B] text-gray-700 transition-colors"
                    />
                    {data.sikayetler.length > 1 && (
                      <button onClick={() => removeSikayet(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ayrıntılı Hikaye */}
            <Field
              label="Şikayetlerin ayrıntılı hikayesi (her şikayet için)"
              hint="Ne zaman başladı? Nasıl ortaya çıktı? | Sorunlar sürekli mi? | Hafifletici faktörler (hangi durumlarda daha az?) | Kötüleştiren faktörler | Sadece evde mi? | Akraba/komşular ne söylüyor? | Okul ortamında belirgin mi? Öğretmen görüşü? | Profesyonel destek alınmış mı? Tanı/tedavi? | Muhtemel nedenler ve çözüm hakkında görüşler | Problemi inkâr eden kimse var mı? | Pekiştiren kişi ve durumlar | Sorundan beri hayatlarında ne değişti? | Sekonder kazançlar var mı?"
              value={data.sikayetAyrintilar}
              onChange={v => set('sikayetAyrintilar', v)}
              rows={8}
            />
          </div>
        )}
      </div>

      {/* ── 3. Aile ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={Users} title="Aile"
          open={open.aile} onToggle={() => toggle('aile')} />
        {open.aile && (
          <div className="p-5 space-y-4">
            <Field
              label="Aile Dinamikleri"
              hint="Anne-baba birlikte mi? Evde kimler var? Aile içi şiddet var mı? Ailenin başka stres faktörleri? Evde sorunlar nasıl çözülür? Ebeveyn-çocuk etkileşimi (baskıcı/zorlayıcı | aşırı müdahil | ihmalkâr/ilgisiz)? Aile içi dinamiklerde üçgenleşme, evlilik çatışması vs.? Ailenin güçlü yanları?"
              value={data.aile} onChange={v => set('aile', v)} rows={6} />
            <Field
              label="Çocuk Evde Vaktini Nasıl Geçiriyor?"
              hint="Ayrıntılı olarak: okuldan eve geldikten uyku saatine kadar. Ne kadar TV/bilgisayar/tablet/akıllı telefon kullanıyor?"
              value={data.cocukEvdeVakit} onChange={v => set('cocukEvdeVakit', v)} rows={4} />
            <Field
              label="Aile Fertlerinin Sağlık Öyküsü"
              hint="Fiziksel hastalık? Psikiyatrik hastalık, ilaç kullanımı ve psikiyatriye yatış öyküsü?"
              value={data.aileSaglik} onChange={v => set('aileSaglik', v)} rows={3} />
          </div>
        )}
      </div>

      {/* ── 4. Gelişimsel Hikaye ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={BookOpen} title="Gelişimsel Hikaye & Okul / Akran İlişkileri"
          open={open.gelisim} onToggle={() => toggle('gelisim')} />
        {open.gelisim && (
          <div className="p-5 space-y-4">
            <Field
              label="Gelişimsel Hikaye"
              hint="Mizaç (genelde nasıl bir çocuktur, arkadaşları onu nasıl tanımlar)? | Öğrenme güçlüğü var mı? | Okulda/akran çevresinde zorbalık yapar veya maruz kalır mı? | Geçiş süreçlerine/değişime nasıl uyum gösterir? (okula başlama, anneden ayrılma vs.)"
              value={data.gelisimselHikaye} onChange={v => set('gelisimselHikaye', v)} rows={5} />
            <Field
              label="Son Birkaç Yılda Aileyi Etkileyen Önemli Olaylar"
              hint="Taşınma, boşanma, anne-babanın ayrılması, ölüm, hastalık, öğretmen/okul değişikliği, istismar vs. — Yaşanmışsa çocuğu nasıl etkiledi?"
              value={data.onemliOlaylar} onChange={v => set('onemliOlaylar', v)} rows={4} />
            <Field
              label="Okul / Akran İlişkileri"
              hint="Arkadaşları var mı? En iyi arkadaşı var mı? Arkadaşlarıyla ilişki düzeyi? | Arkadaş edinmekte ve sürdürmekte sıkıntıları var mı? | Okul dışında görüşüyor mu?"
              value={data.okulAkranIliskileri} onChange={v => set('okulAkranIliskileri', v)} rows={4} />
          </div>
        )}
      </div>

      {/* ── 5. SMART Hedefler ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={Target} title="SMART Terapi Hedefleri"
          subtitle="Bu sorunun olmasaydı hayatında ne farklı olurdu?"
          open={open.smart} onToggle={() => toggle('smart')} />
        {open.smart && (
          <div className="p-5 space-y-4">
            <HintBox>
              "Bu sorunun olmasaydı hayatında ne farklı olurdu? Bu sorunumdan dolayı neleri yapamıyorum?"
            </HintBox>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Ebeveynlerin gözünde temel sorun"
                value={data.ebeveynTemelSorun} onChange={v => set('ebeveynTemelSorun', v)} rows={3} />
              <Field label="Çocuk için temel sorun"
                value={data.cocukTemelSorun} onChange={v => set('cocukTemelSorun', v)} rows={3} />
            </div>
            <Field
              label="Tedaviden beklentisi olan başka kimse var mı?"
              hint="Öğretmenler, diğer aile fertleri vs. — beklentileri neler?"
              value={data.digerBeklentiler} onChange={v => set('digerBeklentiler', v)} rows={2} />
            <Field
              label="Ortak Tedavi Hedefleri"
              hint="Ortak hedef belirlemek mümkün mü? Çocuk bu hedefleri sahipleniyor mu?"
              value={data.ortakHedefler} onChange={v => set('ortakHedefler', v)} rows={3} />
            <Field
              label="SMART Hedefler"
              hint="Spesifik · Ölçülebilir · Gerçekçi · Terapi süresi içinde başarılabilir"
              value={data.smartHedefler} onChange={v => set('smartHedefler', v)} rows={4}
              placeholder="1. Hedef: …&#10;2. Hedef: …&#10;3. Hedef: …" />
          </div>
        )}
      </div>

      {/* ── 6. Vaka Formülasyonu ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={GitBranch} title="Vaka Formülasyonu"
          subtitle="En az basit 4D dönüsü — tercihen 3 sistem: Danışan · Aile · Akran"
          open={open.formul} onToggle={() => toggle('formul')} />
        {open.formul && (
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#0E0F12] mb-2">
                4D Kısır Döngüsü <span className="text-gray-400 font-normal">(yakın zamanda oluşmuş, prototip örnek)</span>
              </p>
              <DortDDiagram value={data.dortDDongusu} onChange={v => set('dortDDongusu', v)} />
            </div>

            <Field
              label="Tetikleyici Faktörler & Problemin Boyutları"
              hint="Düşünce · Duygu durum · Bedensel tepkiler · Çevresel faktörler — her boyut için örneklendir"
              value={data.tetikleyiciBoyutlar} onChange={v => set('tetikleyiciBoyutlar', v)} rows={5} />

            <Field
              label="Her Sorun İçin Sürdürücü Faktörler"
              hint="Sorunun bu kadar süredir devam etmesini sağlayan faktörler nelerdir?"
              value={data.surduruculer} onChange={v => set('surduruculer', v)} rows={4} />

            <Field
              label="Güvenlik Davranışları"
              value={data.guvenlikDavranislari} onChange={v => set('guvenlikDavranislari', v)} rows={3} />
          </div>
        )}
      </div>

      {/* ── 7. Kontrol Listesi ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={CheckSquare}
          title={`Kontrol Listesi (${kontrolCount}/${kontrolTotal})`}
          subtitle="Değerlendirme görüşmesi tamamlama kriterleri"
          open={open.kontrol} onToggle={() => toggle('kontrol')} />
        {open.kontrol && (
          <div className="p-5 space-y-3">
            {/* Progress */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-[#1A3A6B] rounded-full transition-all duration-500"
                style={{ width: `${(kontrolCount / kontrolTotal) * 100}%` }}
              />
            </div>

            <CheckItem no={1}
              label="Değerlendirme görüşmesinde terapiye başlamak için yeterli bilgi elde edildi"
              checked={data.kontrol.yeterliBlgi}
              onChange={v => setKontrol('yeterliBlgi', v)} />
            <CheckItem no={2}
              label="Her bir sorunlu davranış için ABC (Sorunlu davranış — Öncesi ve Sonrası) net olarak tanımlanabildi"
              checked={data.kontrol.abcTanimli}
              onChange={v => setKontrol('abcTanimli', v)} />
            <CheckItem no={3}
              label="Semptom değerlendirme ölçekleri (ÇADÖ-Y) danışan ve ebeveyn tarafından dolduruldu"
              checked={data.kontrol.olcekDolduruldu}
              onChange={v => setKontrol('olcekDolduruldu', v)} />
            <CheckItem no={4}
              label="SMART terapi hedefleri belirlendi"
              checked={data.kontrol.smartBelirlendi}
              onChange={v => setKontrol('smartBelirlendi', v)} />
            <CheckItem no={5}
              label="Vaka formülasyonu danışan ile birlikte yapıldı"
              checked={data.kontrol.formulasyonYapildi}
              onChange={v => setKontrol('formulasyonYapildi', v)} />
            <CheckItem no={6}
              label="Terapi planını kabaca belirledim ve not ettim"
              checked={data.kontrol.terapiPlaniNot}
              onChange={v => setKontrol('terapiPlaniNot', v)} />

            {/* İlk 3 seans rehberi */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mt-2">
              <p className="text-[10px] font-bold text-[#1A3A6B] uppercase tracking-wide mb-1.5">İlk 3 Terapi Seansında:</p>
              <ul className="space-y-1">
                {[
                  'Vaka formülasyonu yapıp, danışan ile birçok yaşam olayı üzerinden BDT\'nin 4 faktör modeli ile aşinalık oluştur.',
                  'Danışan ile SMART vaka hedeflerini oluşturup bunu küçük parçalara böl.',
                  'Psikoeğitim ile kognitif modeli ve psikopatolojiyi anlat.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-blue-700">
                    <span className="text-blue-400 mt-0.5">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Terapi planı notu */}
            <Field
              label="Terapi Planı Notu"
              value={data.terapiPlani}
              onChange={v => set('terapiPlani', v)}
              rows={4}
              placeholder="Kaba terapi planı, ilk 3 seansın odak noktaları…"
            />
          </div>
        )}
      </div>

      {/* Alt kaydet */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={cx(
            'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all',
            saved ? 'bg-emerald-100 text-emerald-700' : 'bg-[#1A3A6B] text-white hover:bg-[#152F5A]',
          )}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Kaydedildi' : 'Formu Kaydet'}
        </button>
      </div>
    </div>
  );
}
