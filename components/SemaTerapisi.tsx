'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

type ActivationLevel = 0 | 1 | 2 | 3;

const SCHEMAS = [
  {
    domain: 'I. Koparılma & Reddedilme',
    color: 'bg-red-50 border-red-200 text-red-900',
    badgeColor: 'bg-red-100 text-red-700',
    schemas: [
      { id: 'terk_edilme', name: 'Terk Edilme / İstikrarsızlık', desc: 'Mevcut bağlanma figürlerinin kararsız veya güvenilmez olduğu inanışı' },
      { id: 'guvensizklik', name: 'Güvensizlik / Kötüye Kullanılma', desc: "Başkalarının zarar vermeye, aşağılamaya veya kandırmaya çalıştığı beklentisi" },
      { id: 'duygusal_yoksunluk', name: 'Duygusal Yoksunluk', desc: 'Temel duygusal ihtiyaçların (bakım, empati, koruma) yeterince karşılanmayacağı beklentisi' },
      { id: 'kusurlu', name: 'Kusurluluk / Utanç', desc: "Temel olarak kusurlu, kötü, değersiz veya sevilmez hissetme" },
      { id: 'sosyal_izolasyon', name: 'Sosyal İzolasyon / Yabancılaşma', desc: 'Dünyadan izole edilmiş, toplumla bütünleşememe hissi' },
    ],
  },
  {
    domain: 'II. Zedelenmiş Özerklik & Performans',
    color: 'bg-amber-50 border-amber-200 text-amber-900',
    badgeColor: 'bg-amber-100 text-amber-700',
    schemas: [
      { id: 'yetersiz', name: 'Yetersizlik / Bağımlılık', desc: 'Dış yardım olmaksızın günlük sorumluluklarla başa çıkamama inanışı' },
      { id: 'hasar', name: 'Hasar / Hastalığa Yatkınlık', desc: 'Katastrofik bir olayın (hastalık, kaza, saldırı) önlenemez şekilde gerçekleşeceği inanışı' },
      { id: 'karisik_benlik', name: 'Karışık / Gelişmemiş Benlik', desc: 'Ebeveyn figürü olmaksızın var olma ve bireyselleşememe hissi' },
      { id: 'basarisizlik', name: 'Başarısızlık', desc: 'Geçmişte, şimdide veya gelecekte başarısız olunduğu inanışı' },
    ],
  },
  {
    domain: 'III. Zedelenmiş Sınırlar',
    color: 'bg-purple-50 border-purple-200 text-purple-900',
    badgeColor: 'bg-purple-100 text-purple-700',
    schemas: [
      { id: 'boyun_egme', name: 'Boyun Eğme', desc: 'Öfke ve terk edilme korkusuyla sürekli başkalarına boyun eğme' },
      { id: 'kendini_feda', name: 'Kendini Feda Etme', desc: "Başkalarının ihtiyaçlarını kendi ihtiyaçlarından önce gönüllü olarak karşılama" },
      { id: 'onay_arayisi', name: 'Onay Arayışı', desc: 'Sürekli başkalarının onayına ve dikkatine ihtiyaç duyma' },
      { id: 'ayricalilik', name: 'Ayrıcalıklılık / Büyüklenmecilik', desc: 'Üstün hissetme ve kuralların kendisi için geçerli olmadığı inanışı' },
      { id: 'yetersiz_oz_denetim', name: 'Yetersiz Öz-Denetim', desc: 'Duygu ve dürtüleri kısıtlamada aşırı zorluk yaşama' },
    ],
  },
  {
    domain: 'IV. Başka Yönelimlilik',
    color: 'bg-blue-50 border-blue-200 text-blue-900',
    badgeColor: 'bg-blue-100 text-blue-700',
    schemas: [
      { id: 'negativizm', name: 'Negativizm / Karamsarlık', desc: 'Yaşamın olumsuz yönlerine odaklanma ve olumluları küçümseme' },
      { id: 'duygusal_inhibisyon', name: 'Duygusal İnhibisyon', desc: 'Başkalarının onayını kaybetmemek için duygu ve düşünceleri bastırma' },
      { id: 'yuksek_standartlar', name: 'Yüksek Standartlar / Aşırı Eleştiri', desc: 'Yetersizlik ve utanç hissini önlemek için aşırı yüksek standartlar belirleme' },
    ],
  },
  {
    domain: 'V. Aşırı Tetikte Olma & Ketlenme',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    schemas: [
      { id: 'cezalandiricilik', name: 'Cezalandırıcılık', desc: "Hata yapan kişilerin, kendisi dahil, şiddetle cezalandırılması gerektiği inanışı" },
    ],
  },
];

const MODES = [
  { id: 'kid_savunmasiz', name: 'Savunmasız Çocuk', category: 'Çocuk Modları', color: 'bg-sky-50 border-sky-200 text-sky-900' },
  { id: 'kid_ofkeli', name: 'Öfkeli Çocuk', category: 'Çocuk Modları', color: 'bg-sky-50 border-sky-200 text-sky-900' },
  { id: 'kid_impulse', name: 'Dürtüsel / Disiplin Yitimi', category: 'Çocuk Modları', color: 'bg-sky-50 border-sky-200 text-sky-900' },
  { id: 'kid_mutlu', name: 'Mutlu Çocuk', category: 'Çocuk Modları', color: 'bg-sky-50 border-sky-200 text-sky-900' },
  { id: 'bas_teslimiyet', name: 'Teslim Olan Teslimiyet', category: 'Başa Çıkma Modları', color: 'bg-violet-50 border-violet-200 text-violet-900' },
  { id: 'bas_protect', name: 'Kopuk Kendini Koruyucu', category: 'Başa Çıkma Modları', color: 'bg-violet-50 border-violet-200 text-violet-900' },
  { id: 'bas_telafi', name: 'Aşırı Telafi Eden', category: 'Başa Çıkma Modları', color: 'bg-violet-50 border-violet-200 text-violet-900' },
  { id: 'eb_talep', name: 'Talep Eden Ebeveyn', category: 'İşlevsel Olmayan Ebeveyn Modları', color: 'bg-rose-50 border-rose-200 text-rose-900' },
  { id: 'eb_ceza', name: 'Cezalandıran Ebeveyn', category: 'İşlevsel Olmayan Ebeveyn Modları', color: 'bg-rose-50 border-rose-200 text-rose-900' },
  { id: 'saglikli_yetiskin', name: 'Sağlıklı Yetişkin', category: 'Sağlıklı Modlar', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
];

type SchemaState = { activation: ActivationLevel; mode: string; notes: string };
type SchemaData = Record<string, SchemaState>;
type ModeData = Record<string, string>;

const ACTIVATION_LABELS: Record<ActivationLevel, { label: string; color: string }> = {
  0: { label: 'Yok', color: 'text-gray-400' },
  1: { label: 'Hafif', color: 'text-yellow-500' },
  2: { label: 'Orta', color: 'text-orange-500' },
  3: { label: 'Yoğun', color: 'text-red-600' },
};

const ActivationPicker = ({ value, onChange }: { value: ActivationLevel; onChange: (v: ActivationLevel) => void }) => (
  <div className="flex gap-1">
    {([0, 1, 2, 3] as ActivationLevel[]).map(v => (
      <button
        key={v}
        onClick={() => onChange(v)}
        className={cx(
          'w-6 h-6 rounded-full border-2 text-[9px] font-bold transition-all',
          value === v
            ? v === 0 ? 'border-gray-400 bg-gray-200 text-gray-600'
            : v === 1 ? 'border-yellow-400 bg-yellow-100 text-yellow-700'
            : v === 2 ? 'border-orange-400 bg-orange-100 text-orange-700'
            : 'border-red-500 bg-red-100 text-red-700'
            : 'border-gray-200 bg-white text-gray-400 hover:border-gray-400'
        )}
      >{v}</button>
    ))}
  </div>
);

export default function SemaTerapisi() {
  const [schemaData, setSchemaData] = useState<SchemaData>({});
  const [modeData, setModeData] = useState<ModeData>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(SCHEMAS[0].domain);
  const [activeTab, setActiveTab] = useState<'schemas' | 'modes' | 'notes'>('schemas');

  const updateSchema = (id: string, field: keyof SchemaState, value: ActivationLevel | string) => {
    setSchemaData(prev => {
      const existing = prev[id] ?? { activation: 0 as ActivationLevel, mode: '', notes: '' };
      return { ...prev, [id]: { ...existing, [field]: value } };
    });
  };

  const activeSchemas = Object.entries(schemaData).filter(([, v]) => v.activation > 0).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-base font-semibold text-[#0E0F12]">Şema Terapisi</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Young, 2003</span>
          {activeSchemas > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{activeSchemas} aktif şema</span>
          )}
        </div>
        <div className="flex gap-1.5">
          {(['schemas', 'modes', 'notes'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cx(
                'text-xs px-3 py-1.5 rounded-xl font-medium transition-colors',
                activeTab === t ? 'bg-[#0E0F12] text-white' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {t === 'schemas' ? 'Erken Dönem Şemalar' : t === 'modes' ? 'Şema Modları' : 'Klinik Notlar'}
            </button>
          ))}
        </div>
      </div>

      {/* Schemas tab */}
      {activeTab === 'schemas' && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 px-1">Her şema için aktivasyon düzeyini (0-3) ve varsa baskın modu belirtin.</div>
          {SCHEMAS.map(domain => {
            const isOpen = expandedDomain === domain.domain;
            const domainActive = domain.schemas.filter(s => (schemaData[s.id]?.activation ?? 0) > 0).length;
            return (
              <div key={domain.domain} className={cx('card overflow-hidden', domain.color)}>
                <button
                  onClick={() => setExpandedDomain(isOpen ? null : domain.domain)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="text-sm font-semibold">{domain.domain}</span>
                    {domainActive > 0 && (
                      <span className={cx('text-[10px] font-bold px-2 py-0.5 rounded-full', domain.badgeColor)}>{domainActive} aktif</span>
                    )}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    {domain.schemas.map(schema => {
                      const data = schemaData[schema.id] || { activation: 0 as ActivationLevel, mode: '', notes: '' };
                      return (
                        <div key={schema.id} className="bg-white rounded-xl border border-white/60 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800">{schema.name}</span>
                                {data.activation > 0 && (
                                  <span className={cx('text-[10px] font-bold', ACTIVATION_LABELS[data.activation].color)}>
                                    {ACTIVATION_LABELS[data.activation].label}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5">{schema.desc}</p>
                            </div>
                            <div className="flex-shrink-0">
                              <ActivationPicker value={data.activation} onChange={v => updateSchema(schema.id, 'activation', v)} />
                            </div>
                          </div>
                          {data.activation > 0 && (
                            <div className="mt-2 grid sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Baskın Mod</label>
                                <input
                                  value={data.mode || ''}
                                  onChange={e => updateSchema(schema.id, 'mode', e.target.value)}
                                  placeholder="Teslim olma / Kaçınma / Aşırı telafi"
                                  className="mt-1 h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#0E0F12] transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Klinik Not</label>
                                <input
                                  value={data.notes || ''}
                                  onChange={e => updateSchema(schema.id, 'notes', e.target.value)}
                                  placeholder="Tetikleyiciler, örnekler…"
                                  className="mt-1 h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#0E0F12] transition-colors"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modes tab */}
      {activeTab === 'modes' && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 px-1">Her mod için danışanda gözlemlenen belirtileri ve tetikleyicileri not edin.</div>
          {['Çocuk Modları', 'Başa Çıkma Modları', 'İşlevsel Olmayan Ebeveyn Modları', 'Sağlıklı Modlar'].map(category => (
            <div key={category} className="card p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{category}</h3>
              <div className="space-y-2">
                {MODES.filter(m => m.category === category).map(mode => (
                  <div key={mode.id} className={cx('rounded-xl border p-3', mode.color)}>
                    <div className="text-sm font-medium mb-2">{mode.name}</div>
                    <textarea
                      value={modeData[mode.id] || ''}
                      onChange={e => setModeData(prev => ({ ...prev, [mode.id]: e.target.value }))}
                      placeholder="Bu modun danışandaki belirtileri, tetikleyicileri, sıklığı…"
                      className="w-full bg-white/70 border border-white/60 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-current transition-colors resize-none min-h-[56px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes tab */}
      {activeTab === 'notes' && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[#0E0F12] mb-3">Şema Terapi Formülasyon Notları</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Erken Dönem Uyumsuz Şemalar (Özet)</label>
              <textarea
                className="mt-1 min-h-[100px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0E0F12] transition-colors"
                placeholder="Terk edilme, güvensizlik, yetersizlik, başarısızlık…"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Şema Modları (Özet)</label>
              <textarea
                className="mt-1 min-h-[100px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0E0F12] transition-colors"
                placeholder="Çocuk modları, ebeveyn modları, başa çıkma modları…"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Genel Formülasyon Notları</label>
            <textarea
              value={generalNotes}
              onChange={e => setGeneralNotes(e.target.value)}
              className="mt-1 min-h-[140px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0E0F12] transition-colors"
              placeholder="Serbest notlar, hipotezler, şema bağlantıları, terapötik formülasyon…"
            />
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Şema Terapisi uygulaması için Young Şema Anketi (YSQ-S3) kullanılması önerilir. Ortak şemalar formülasyonun kalbini oluşturur; terapötik ilişki ve imge çalışması temel müdahale araçlarıdır.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
