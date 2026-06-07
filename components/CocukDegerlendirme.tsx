'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Save, CheckCircle2, Baby, School, Heart, Shield, ClipboardList, Lightbulb } from 'lucide-react';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CocukDegerlendirmeData {
  // Demografik
  tarih: string;
  protokolNo: string;
  dogumTarihi: string;
  yas: string;
  okul: string;
  sinif: string;
  babaTel: string;
  anneTel: string;
  referans: string;
  ikamet: string;
  aileBilgileri: string;

  // Başvuru
  basvuruHikayes: string;
  baskaKonu: string;
  tarama: {
    tirnakYeme: string;
    altIslatma: string;
    nesneEmme: string;
    korkular: string;
    tikler: string;
    takıntilar: string;
    ozguven: string;
    ozbakim: string;
    kaygılar: string;
    iliskiler: string;
    uyku: string;
    yemeDuzeni: string;
    kisilik: string;
  };

  // Doğum / Bebeklik
  gebelik: string;
  dogum: string;
  emme: string;
  yurumKonusma: string;
  tuvaletAliskanlik: string;
  birincilBakici: string;
  bebeklikHuylari: string;

  // Aile
  baba: string;
  anne: string;
  aileOrtami: string;

  // Eğitim
  anaokulu: string;
  ilkokul: string;
  ortaokul: string;
  lise: string;

  // Sağlık / Travma
  ameliyat: string;
  kaza: string;
  sunnet: string;
  afet: string;
  aileTravmasi: string;
  uzunAyrılik: string;
  vefat: string;
  kronikHastalik: string;
  psikologGecmisi: string;

  // Yapılabilecekler
  ilkGozlem: string;
  onTani: string;
  oncelikliSorunlar: string;
  aileyeOneriler: string;
}

const EMPTY: CocukDegerlendirmeData = {
  tarih: '', protokolNo: '', dogumTarihi: '', yas: '', okul: '', sinif: '',
  babaTel: '', anneTel: '', referans: '', ikamet: '', aileBilgileri: '',
  basvuruHikayes: '', baskaKonu: '',
  tarama: {
    tirnakYeme: '', altIslatma: '', nesneEmme: '', korkular: '', tikler: '',
    takıntilar: '', ozguven: '', ozbakim: '', kaygılar: '', iliskiler: '',
    uyku: '', yemeDuzeni: '', kisilik: '',
  },
  gebelik: '', dogum: '', emme: '', yurumKonusma: '', tuvaletAliskanlik: '',
  birincilBakici: '', bebeklikHuylari: '',
  baba: '', anne: '', aileOrtami: '',
  anaokulu: '', ilkokul: '', ortaokul: '', lise: '',
  ameliyat: '', kaza: '', sunnet: '', afet: '', aileTravmasi: '',
  uzunAyrılik: '', vefat: '', kronikHastalik: '', psikologGecmisi: '',
  ilkGozlem: '', onTani: '', oncelikliSorunlar: '', aileyeOneriler: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, title, subtitle, color, open, onToggle,
}: {
  icon: React.ElementType<{ className?: string }>; title: string; subtitle?: string;
  color: string; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cx(
        'w-full flex items-center justify-between px-5 py-3.5 rounded-t-2xl text-left transition-colors',
        color,
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold tracking-wide uppercase">{title}</p>
          {subtitle && <p className="text-[11px] opacity-75 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {open
        ? <ChevronDown className="w-4 h-4 opacity-60" />
        : <ChevronRight className="w-4 h-4 opacity-60" />}
    </button>
  );
}

function Field({
  label, hint, value, onChange, rows = 3,
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-xs font-semibold text-[#0E0F12]">{label}</span>
        {hint && <span className="text-[10px] text-gray-400 leading-tight">{hint}</span>}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none outline-none focus:border-[#8B6F5E] text-gray-700 placeholder:text-gray-300 transition-colors"
        placeholder="…"
      />
    </div>
  );
}

function InlineInput({
  label, value, onChange, type = 'text', placeholder = '…',
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#8B6F5E] text-gray-700 transition-colors"
      />
    </div>
  );
}

function TaramaItem({
  label, hint, value, onChange,
}: {
  label: string; hint: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
        <p className="text-xs font-semibold text-[#8B6F5E]">{label}</p>
        <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{hint}</p>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        className="w-full text-xs border-0 px-3 py-2 resize-none outline-none text-gray-700 placeholder:text-gray-300"
        placeholder="Notlar…"
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  patientId: string;
  patientName: string;
  onSave?: (data: CocukDegerlendirmeData) => void;
}

export default function CocukDegerlendirme({ patientId, patientName, onSave }: Props) {
  const storageKey = `cocuk_degerlendirme_${patientId}`;

  const [data, setData] = useState<CocukDegerlendirmeData>(() => {
    if (typeof window === 'undefined') return EMPTY;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? { ...EMPTY, ...JSON.parse(stored) } : { ...EMPTY, tarih: new Date().toISOString().slice(0, 10) };
    } catch { return { ...EMPTY, tarih: new Date().toISOString().slice(0, 10) }; }
  });

  const [open, setOpen] = useState<Record<string, boolean>>({
    demo: true, basvuru: true, tarama: false,
    bebeklik: false, aile: false, egitim: false, saglik: false, sonuc: false,
  });
  const [saved, setSaved] = useState(false);

  const set = useCallback(<K extends keyof CocukDegerlendirmeData>(
    key: K, val: CocukDegerlendirmeData[K],
  ) => setData(prev => ({ ...prev, [key]: val })), []);

  const setTarama = useCallback((key: keyof CocukDegerlendirmeData['tarama'], val: string) =>
    setData(prev => ({ ...prev, tarama: { ...prev.tarama, [key]: val } })), []);

  const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* ignore */ }
    onSave?.(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Auto-save to localStorage on change
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* ignore */ }
  }, [data, storageKey]);

  const SECTION_COLOR = 'bg-[#8B6F5E] text-white hover:bg-[#7A5E4D]';

  return (
    <div className="space-y-4 pb-6">
      {/* Page header */}
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#8B6F5E] font-semibold mb-0.5">Çocuk Psikolojik Değerlendirme Formu</p>
          <h2 className="text-base font-bold text-[#0E0F12]">{patientName}</h2>
        </div>
        <button
          onClick={handleSave}
          className={cx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all',
            saved
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-[#8B6F5E] text-white hover:bg-[#7A5E4D]',
          )}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      {/* ── Demografik Bilgiler ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={ClipboardList} title="Demografik Bilgiler"
          subtitle="Tarih · Protokol · İletişim" color={SECTION_COLOR}
          open={open.demo} onToggle={() => toggle('demo')} />
        {open.demo && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InlineInput label="Tarih" value={data.tarih} onChange={v => set('tarih', v)} type="date" />
              <InlineInput label="Protokol No" value={data.protokolNo} onChange={v => set('protokolNo', v)} placeholder="2024-001" />
              <InlineInput label="Doğum Tarihi" value={data.dogumTarihi} onChange={v => set('dogumTarihi', v)} type="date" />
              <InlineInput label="Yaş" value={data.yas} onChange={v => set('yas', v)} placeholder="7 yaş 4 ay" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InlineInput label="Okul" value={data.okul} onChange={v => set('okul', v)} />
              <InlineInput label="Sınıf" value={data.sinif} onChange={v => set('sinif', v)} placeholder="3. sınıf" />
              <InlineInput label="Baba Tel" value={data.babaTel} onChange={v => set('babaTel', v)} type="tel" />
              <InlineInput label="Anne Tel" value={data.anneTel} onChange={v => set('anneTel', v)} type="tel" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InlineInput label="Referans" value={data.referans} onChange={v => set('referans', v)} />
              <InlineInput label="İkamet" value={data.ikamet} onChange={v => set('ikamet', v)} />
            </div>
            <Field
              label="Aile Tanışma Notları"
              hint="Önce sizden bazı aile bilgileri alacağım, sonra da niçin geldiğinizi konuşacağız."
              value={data.aileBilgileri}
              onChange={v => set('aileBilgileri', v)}
              rows={4}
            />
          </div>
        )}
      </div>

      {/* ── Başvuru Öyküsü ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={ClipboardList} title="Başvuru Öyküsü"
          subtitle="Sizi buraya getiren nedeni öğrenebilir miyim?" color={SECTION_COLOR}
          open={open.basvuru} onToggle={() => toggle('basvuru')} />
        {open.basvuru && (
          <div className="p-5 space-y-4">
            <Field
              label="Başvuru Hikayesi"
              hint="Ne zamandır var? Ne sıklıkta? Şiddeti nedir? Aile nedeni hakkında ne düşünüyor?"
              value={data.basvuruHikayes}
              onChange={v => set('basvuruHikayes', v)}
              rows={4}
            />
            <Field
              label="Buraya gelirken düşündüğünüz başka bir konu var mı?"
              value={data.baskaKonu}
              onChange={v => set('baskaKonu', v)}
              rows={2}
            />

            {/* Tarama toggle */}
            <div className="border border-[#8B6F5E]/20 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggle('tarama')}
                className="w-full flex items-center justify-between bg-[#8B6F5E]/8 px-4 py-3 text-left hover:bg-[#8B6F5E]/12 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-[#8B6F5E] uppercase tracking-wide">Tarama Kontrol Listesi</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Şimdi bir tarama yapacağım</p>
                </div>
                {open.tarama ? <ChevronDown className="w-4 h-4 text-[#8B6F5E]" /> : <ChevronRight className="w-4 h-4 text-[#8B6F5E]" />}
              </button>
              {open.tarama && (
                <div className="p-4 grid gap-2">
                  <TaramaItem label="Tırnak Yeme" hint="Makasla keser misiniz?" value={data.tarama.tirnakYeme} onChange={v => setTarama('tirnakYeme', v)} />
                  <TaramaItem label="Alt Islatma" hint="Çiş/kaka kaçırma-tutma var mı?" value={data.tarama.altIslatma} onChange={v => setTarama('altIslatma', v)} />
                  <TaramaItem label="Nesne Emme" hint="Parmak emme, eşya ağzına sokma, kıyafet kenarlarını kemirme var mı?" value={data.tarama.nesneEmme} onChange={v => setTarama('nesneEmme', v)} />
                  <TaramaItem label="Korkular" hint="Bariz bir şeyden korkar mı? (Kedi, karanlık, hayalet, doktor, iğne, ölüm, ses)" value={data.tarama.korkular} onChange={v => setTarama('korkular', v)} />
                  <TaramaItem label="Tikler" hint="Çeşitli yüz-göz işaretleri ve tikleri var mı?" value={data.tarama.tikler} onChange={v => setTarama('tikler', v)} />
                  <TaramaItem label="Takıntılar" hint="Etiketler, üstüne bir şey damlasa değiştirin der mi?, koku hassasiyeti, çorabın dikiş yerleri, elinin kirlenmesi, ayakkabı/kıyafet sıktı der mi?, oyuncaklarını düzer başkası dağıtmasından rahatsız olur mu?, açık çekmeceleri kapar mı?, başkasının çatalını kullanır mı?, 'bir şey olmaz değil mi?' diye sorar mı?" value={data.tarama.takıntilar} onChange={v => setTarama('takıntilar', v)} />
                  <TaramaItem label="Özgüven" hint="Özgüveni nasıl? Hakkını savunur mu? Eline para versek 'şu amcadan dondurma al' desek alır mı?" value={data.tarama.ozguven} onChange={v => setTarama('ozguven', v)} />
                  <TaramaItem label="Öz-Bakım" hint="Yeme, giyinme, tuvalet temizliği, banyo, tırnak kesme — kendisi yapabilir mi?" value={data.tarama.ozbakim} onChange={v => setTarama('ozbakim', v)} />
                  <TaramaItem label="Kaygılar" hint="Kaygılı mı? 'Anne sana bir şey olur mu?', 'Öğretmenim kızar mı?', Hareketli çocuklardan korkar mı? Deprem-sel-yangın-hırsız gibi kaygıları oldu mu? TV'deki olumsuz olaylardan etkilenir mi? 'Servis beni unutur mu?', 'Geldiğimde evde olacak mısın?', kardeşlerini aşırı koruma?" value={data.tarama.kaygılar} onChange={v => setTarama('kaygılar', v)} />
                  <TaramaItem label="Kardeş & Arkadaş İlişkileri" hint="Kardeş/arkadaş ilişkileri nasıl? Parkta çocuklarla kaynaşır mı? Grup içinde aktif mi? Pasif mi? Sevilir mi?" value={data.tarama.iliskiler} onChange={v => setTarama('iliskiler', v)} />
                  <TaramaItem label="Uyku" hint="Nerede yatar? Kendi başına uyur mu? Diş gıcırdatması? Sık kabus görür mü? Sık uyanır mı?" value={data.tarama.uyku} onChange={v => setTarama('uyku', v)} />
                  <TaramaItem label="Yeme Düzeni" hint="Nerede yer? Kendi yer mi? Seçici mi? Bu ara iştahında artış/azalma var mı?" value={data.tarama.yemeDuzeni} onChange={v => setTarama('yemeDuzeni', v)} />
                  <TaramaItem label="Kişilik Özellikleri" hint="Nasıl bir çocuktur? Kişilik özellikleri neler?" value={data.tarama.kisilik} onChange={v => setTarama('kisilik', v)} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Doğum / Bebeklik ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={Baby} title="Doğum / Bebeklik Öyküsü"
          subtitle="Burada yaşanan sorunlar gelecek hayatı etkileyebiliyor."
          color={SECTION_COLOR} open={open.bebeklik} onToggle={() => toggle('bebeklik')} />
        {open.bebeklik && (
          <div className="p-5 space-y-4">
            <Field label="Gebelik"
              hint="İstenen gebelik mi? Sürprizse ne zaman benimsendi? Gebelik nasıl geçti? (stresli / normal / sakin) Stres ne ile ilgiliydi?"
              value={data.gebelik} onChange={v => set('gebelik', v)} />
            <Field label="Doğum"
              hint="Normal mi, sezaryen mi? Sezaryen sizin seçiminiz miydi? Doğum nasıldı? (zor/kolay) Hayati risk, nefessiz kalma, kordon dolanması, mekoniyum içme oldu mu? Kuvözde kalma gerekti mi?"
              value={data.dogum} onChange={v => set('dogum', v)} />
            <Field label="Emme"
              hint="Ne kadar emdi? Neden erken bıraktı? Memeyi kolay bıraktı mı?"
              value={data.emme} onChange={v => set('emme', v)} rows={2} />
            <Field label="Yürüme & Konuşma"
              hint="Yürüme ve konuşma zamanında mıydı?"
              value={data.yurumKonusma} onChange={v => set('yurumKonusma', v)} rows={2} />
            <Field label="Tuvalet Alışkanlığı"
              hint="Kaç yaşında kazandı? Kolay oldu mu?"
              value={data.tuvaletAliskanlik} onChange={v => set('tuvaletAliskanlik', v)} rows={2} />
            <Field label="Birincil Bakıcılar"
              hint="Hep siz mi baktınız? Ne kadar yanındaydınız? Sonra kim baktı? Bakımveren nasıl biriydi?"
              value={data.birincilBakici} onChange={v => set('birincilBakici', v)} />
            <Field label="Bebeklik Huyları"
              hint="Nasıl bir bebekti? (sakin / huysuz / uykusuz / gazlı / neşeli) Siz bu dönemde nasıldınız? Yabancılara karşı nasıldı?"
              value={data.bebeklikHuylari} onChange={v => set('bebeklikHuylari', v)} />
          </div>
        )}
      </div>

      {/* ── Aile Öyküsü ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={Heart} title="Aile Öyküsü"
          subtitle="Sizler ve aileniz hakkında bilgi alacağım."
          color={SECTION_COLOR} open={open.aile} onToggle={() => toggle('aile')} />
        {open.aile && (
          <div className="p-5 space-y-4">
            <div className="text-[10px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
              <strong>Baba için:</strong> Kaç kardeşsiniz? Anne-babanız hayatta mı? Kaç gibi evde oluyorsunuz? Kişiliğiniz? (İnsanlar sizi nasıl bilir) Nasıl bir babasınız? Çocuğunuzla bağınız? Sınır koyar mısınız? Ailenizde kaygı, takıntı, depresyon, intihar gibi psikolojik problemler var mı?
            </div>
            <Field label="Baba" value={data.baba} onChange={v => set('baba', v)} rows={4} />

            <div className="text-[10px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
              <strong>Anne için:</strong> Kaç kardeşsiniz? Anne-babanız hayatta mı? Kaç gibi evde oluyorsunuz? Kişiliğiniz? Nasıl bir annesiniz? Çocuğunuzla bağınız? Sınır koyar mısınız? Ailenizde psikolojik problemler var mı?
            </div>
            <Field label="Anne" value={data.anne} onChange={v => set('anne', v)} rows={4} />

            <div className="text-[10px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
              <strong>Aile Ortamı:</strong> Eşinizle aranız nasıl? En çok tartışma çıkan konu? Sizce aile bağlarınız nasıl? Evde akşamları nasıl bir ortam var?
            </div>
            <Field label="Aile Ortamı" value={data.aileOrtami} onChange={v => set('aileOrtami', v)} rows={3} />
          </div>
        )}
      </div>

      {/* ── Eğitim / Okul ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={School} title="Eğitim / Okul Öyküsü"
          subtitle="Okulda nasıl? — X'i anlamaya çalışacağım."
          color={SECTION_COLOR} open={open.egitim} onToggle={() => toggle('egitim')} />
        {open.egitim && (
          <div className="p-5 space-y-4">
            <div className="text-[10px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
              <strong>Anaokulu:</strong> Kaç yıl gitti? İlk defa başlarken kolay ayrıldı mı? Arkadaş ilişkileri? Öğretmenler nasıl bir çocuk derdi? &nbsp;|&nbsp;
              <strong>İlkokul:</strong> Kolay alıştı mı? Öğretmen değişimi oldu mu? Arkadaş ilişkileri? Akademik başarısı? &nbsp;|&nbsp;
              <strong>Ortaokul:</strong> Akademik başarısı? Arkadaş ilişkileri? Öğretmeniyle ilişkisi nasıldı?
            </div>
            <Field label="Anaokulu" value={data.anaokulu} onChange={v => set('anaokulu', v)} rows={3} />
            <Field label="İlkokul" value={data.ilkokul} onChange={v => set('ilkokul', v)} rows={3} />
            <Field label="Ortaokul" value={data.ortaokul} onChange={v => set('ortaokul', v)} rows={3} />
            <Field label="Lise" value={data.lise} onChange={v => set('lise', v)} rows={3} />
          </div>
        )}
      </div>

      {/* ── Sağlık / Travma ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={Shield} title="Sağlık / Travma Öyküsü"
          subtitle="Sağlık öyküsü ve onu etkileyen önemli olaylar — yaşa göre kodla."
          color={SECTION_COLOR} open={open.saglik} onToggle={() => toggle('saglik')} />
        {open.saglik && (
          <div className="p-5 grid md:grid-cols-2 gap-4">
            <Field label="Ameliyat" hint="Geçirdi mi? Çok etkilendi mi?" value={data.ameliyat} onChange={v => set('ameliyat', v)} rows={2} />
            <Field label="Kaza" hint="Yanmalı/yaralanmalı kaza? Kırık-çıkık-dikiş? Çok etkilendi mi?" value={data.kaza} onChange={v => set('kaza', v)} rows={2} />
            <Field label="Sünnet" hint="Travmatik, ağrılı, sancılı sünnet oldu mu? Çok etkilendi mi?" value={data.sunnet} onChange={v => set('sunnet', v)} rows={2} />
            <Field label="Afet" hint="Deprem, sel, yangın gibi afet yaşadı mı? Tanıklık etti mi? Çok etkilendi mi?" value={data.afet} onChange={v => set('afet', v)} rows={2} />
            <Field label="Aile Travması" hint="Aile içi şiddet/kavga gördü mü? Haciz, iflas, boşanmaya şahitlik etti mi?" value={data.aileTravmasi} onChange={v => set('aileTravmasi', v)} rows={2} />
            <Field label="Uzun Ayrılık" hint="Anne-babadan 5 gün ve üzeri uzun süreli ayrılık yaşadı mı?" value={data.uzunAyrılik} onChange={v => set('uzunAyrılik', v)} rows={2} />
            <Field label="Vefat" hint="Ailede birisi vefat etti mi? Böyle bir duruma tanıklık etti mi?" value={data.vefat} onChange={v => set('vefat', v)} rows={2} />
            <Field label="Kronik Hastalıklar" hint="Sürekli doktor gezen / müdahale gerektiren rahatsızlığı oldu mu?" value={data.kronikHastalik} onChange={v => set('kronikHastalik', v)} rows={2} />
            <div className="md:col-span-2">
              <Field label="Psikolog Geçmişi" hint="Pedagog, psikolog, psikiyatrist gördü mü?" value={data.psikologGecmisi} onChange={v => set('psikologGecmisi', v)} rows={2} />
            </div>
          </div>
        )}
      </div>

      {/* ── Yapılabilecekler ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionHeader icon={Lightbulb} title="Yapılabilecekler"
          subtitle="Ön tanı · Öncelikli Sorunlar · Aileye Öneriler"
          color={SECTION_COLOR} open={open.sonuc} onToggle={() => toggle('sonuc')} />
        {open.sonuc && (
          <div className="p-5 space-y-4">
            <Field label="İlk Gözlem" value={data.ilkGozlem} onChange={v => set('ilkGozlem', v)} rows={4} />
            <Field label="Ön Tanı / Değerlendirme" value={data.onTani} onChange={v => set('onTani', v)} rows={3} />
            <Field label="Öncelikli Sorunlar" value={data.oncelikliSorunlar} onChange={v => set('oncelikliSorunlar', v)} rows={3} />
            <Field label="Aileye Öneriler" value={data.aileyeOneriler} onChange={v => set('aileyeOneriler', v)} rows={4} />
          </div>
        )}
      </div>

      {/* Bottom save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={cx(
            'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all',
            saved ? 'bg-emerald-100 text-emerald-700' : 'bg-[#8B6F5E] text-white hover:bg-[#7A5E4D]',
          )}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Kaydedildi' : 'Formu Kaydet'}
        </button>
      </div>
    </div>
  );
}
