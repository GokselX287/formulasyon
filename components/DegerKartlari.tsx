'use client';

import React, { useState, useMemo } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { Heart, Briefcase, BookOpen, Users, Smile, Leaf, Globe, Star, Sparkles, ChevronDown, ChevronRight, Plus, X, RotateCcw } from 'lucide-react';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ─── Types ────────────────────────────────────────────────────────────────────

type Domain = {
  id: string;
  label: string;
  icon: React.ElementType<{ className?: string }>;
  color: string;          // tailwind text+bg pair
  ringColor: string;      // border color
};

type ValueCard = {
  id: string;
  domainId: string;
  title: string;           // kısa başlık
  statement: string;       // birinci şahıs değer cümlesi
  exampleBehaviors: string[];
  obstacle?: string;       // tipik engel
};

type CardState = {
  onem: number;       // 0–5
  yasiyor: number;    // 0–5
  secildi: boolean;
  not: string;
};

type View = 'kartlar' | 'bogaGozu' | 'ozet';

// ─── Domain Definitions ───────────────────────────────────────────────────────

const DOMAINS: Domain[] = [
  { id: 'aile',      label: 'Aile',                   icon: Heart,    color: 'text-rose-600 bg-rose-50',       ringColor: 'border-rose-200' },
  { id: 'romantik',  label: 'Romantik İlişkiler',      icon: Heart,    color: 'text-pink-600 bg-pink-50',       ringColor: 'border-pink-200' },
  { id: 'sosyal',    label: 'Arkadaşlık / Sosyal',     icon: Users,    color: 'text-blue-600 bg-blue-50',       ringColor: 'border-blue-200' },
  { id: 'is',        label: 'İş / Kariyer',            icon: Briefcase,color: 'text-indigo-600 bg-indigo-50',   ringColor: 'border-indigo-200' },
  { id: 'gelisim',   label: 'Kişisel Gelişim',         icon: BookOpen, color: 'text-violet-600 bg-violet-50',   ringColor: 'border-violet-200' },
  { id: 'eglence',   label: 'Eğlence / Hobiler',       icon: Smile,    color: 'text-amber-600 bg-amber-50',     ringColor: 'border-amber-200' },
  { id: 'saglik',    label: 'Sağlık / Öz-Bakım',       icon: Leaf,     color: 'text-emerald-600 bg-emerald-50', ringColor: 'border-emerald-200' },
  { id: 'toplum',    label: 'Toplum / Vatandaşlık',    icon: Globe,    color: 'text-teal-600 bg-teal-50',       ringColor: 'border-teal-200' },
  { id: 'anlam',     label: 'Anlam / Maneviyat',       icon: Sparkles, color: 'text-orange-600 bg-orange-50',   ringColor: 'border-orange-200' },
];

// ─── Value Card Definitions ───────────────────────────────────────────────────

const VALUE_CARDS: ValueCard[] = [
  // AİLE
  {
    id: 'aile_1', domainId: 'aile',
    title: 'Destekleyici Ebeveyn',
    statement: 'Çocuklarımın güvenle büyüyebileceği, sevgi dolu ve tutarlı bir ebeveyn olmak istiyorum.',
    exampleBehaviors: ['Her gün düzenli zaman geçirmek', 'Çocuğumu gerçekten dinlemek', 'Sınırları sevgiyle uygulamak'],
    obstacle: 'İş stresi varlığımı zayıflatıyor.',
  },
  {
    id: 'aile_2', domainId: 'aile',
    title: 'Bağlantılı Aile Üyesi',
    statement: 'Ailemle anlamlı, dürüst ve derinlikli bir bağ sürdürmek istiyorum.',
    exampleBehaviors: ['Düzenli aile buluşmaları', 'Zor konuşmaları ertelemeden yapmak', 'Teşekkür ve takdir ifade etmek'],
    obstacle: 'Geçmişteki kırgınlıklar bağlanmayı zorlaştırıyor.',
  },
  {
    id: 'aile_3', domainId: 'aile',
    title: 'Şefkatli Kardeş',
    statement: 'Kardeşim/kardeşlerim için zor zamanlarda yanında olan, güvenilir bir figür olmak istiyorum.',
    exampleBehaviors: ['Önemli günleri hatırlamak', 'Çatışmalarda sabırlı olmak', 'Kendi hayatımı paylaşmak'],
  },

  // ROMANTİK
  {
    id: 'romantik_1', domainId: 'romantik',
    title: 'Dürüst Partner',
    statement: 'Partnerimle tam anlamıyla dürüst, savunmasız ve yakın bir ilişki yaşamak istiyorum.',
    exampleBehaviors: ['Gerçek duygularımı paylaşmak', 'Partnerimi aktif dinlemek', 'Eleştiri yerine istek ifade etmek'],
    obstacle: 'Redden korktuğumda kapatıyorum.',
  },
  {
    id: 'romantik_2', domainId: 'romantik',
    title: 'Büyümeye Açık Partner',
    statement: 'İlişkimizin çatışmaları da büyüme fırsatı olarak görerek birlikte gelişmek istiyorum.',
    exampleBehaviors: ['Çatışma sonrası yeniden bağlanmak', 'Birlikte yeni şeyler denemek', 'Şükran ifade etmek'],
  },
  {
    id: 'romantik_3', domainId: 'romantik',
    title: 'Anlayışlı Partner',
    statement: 'Partnerimin perspektifini gerçekten anlamak ve empatiyle yanında olmak istiyorum.',
    exampleBehaviors: ['Düzeltemeden önce dinlemek', 'Varsayım yerine soru sormak', 'Güç anlarda beraberliği seçmek'],
    obstacle: 'Anlaşılmak isterken anlatmaktan geri kalıyorum.',
  },

  // SOSYAL
  {
    id: 'sosyal_1', domainId: 'sosyal',
    title: 'Gerçek Dost',
    statement: 'Dostlarımın zor günlerinde yanında olan, güvenilir ve gerçek biri olmak istiyorum.',
    exampleBehaviors: ['Haberleşmeyi başlatmak', 'Söz verince yerine getirmek', 'Zor anlarda aramak'],
    obstacle: 'Yoğunluk ve kaçınma dostlukları zayıflattı.',
  },
  {
    id: 'sosyal_2', domainId: 'sosyal',
    title: 'Bağlantılı İnsan',
    statement: 'İnsanlarla yüzeysel değil, gerçek ve anlamlı bağlar kurmak istiyorum.',
    exampleBehaviors: ['Sosyal ortamlarda tamamen orada olmak', 'Savunmasızlık paylaşmak', 'Merak ve ilgiyle yaklaşmak'],
  },
  {
    id: 'sosyal_3', domainId: 'sosyal',
    title: 'Destekleyici Topluluk Üyesi',
    statement: 'Çevremdeki insanlara katkı sağlayan ve dayanışma içinde olan biri olmak istiyorum.',
    exampleBehaviors: ['Yardım eli uzatmak', 'Komşularla ilişki kurmak', 'Topluluğun organizasyonlarına katılmak'],
  },

  // İŞ / KARİYER
  {
    id: 'is_1', domainId: 'is',
    title: 'Özenli Profesyonel',
    statement: 'İşimde kaliteli, dürüst ve özenli bir şekilde çalışmak istiyorum.',
    exampleBehaviors: ['İşi son dakikaya bırakmamak', 'Hataları kabul etmek', 'Geri bildirime açık olmak'],
    obstacle: 'Mükemmeliyetçilik bazen felç ediyor.',
  },
  {
    id: 'is_2', domainId: 'is',
    title: 'Katkı Sağlayan Çalışan',
    statement: 'İşimin başkalarına fayda sağladığını hissetmek ve anlamlı katkılar sunmak istiyorum.',
    exampleBehaviors: ['Ekip arkadaşlarını desteklemek', 'Projelere sahip çıkmak', 'Sonuçların etkisini görmek'],
  },
  {
    id: 'is_3', domainId: 'is',
    title: 'Sürekli Gelişen Uzman',
    statement: 'Alanımda sürekli öğrenerek en iyiye ulaşmak için çaba göstermek istiyorum.',
    exampleBehaviors: ['Eğitim ve kurslara katılmak', 'Mentorluk almak / vermek', 'Sektör güncellemelerini takip etmek'],
  },

  // KİŞİSEL GELİŞİM
  {
    id: 'gelisim_1', domainId: 'gelisim',
    title: 'Meraklı Öğrenci',
    statement: 'Her gün öğrenmeye açık, meraklı ve büyümeye istekli biri olmak istiyorum.',
    exampleBehaviors: ['Kitap okumak', 'Yeni beceriler edinmek', 'Fikirleri sorgulamak'],
    obstacle: 'Zihin doluyken öğrenme kapıyı kapatıyor.',
  },
  {
    id: 'gelisim_2', domainId: 'gelisim',
    title: 'Özfarkındalığa Sahip Birey',
    statement: 'Kendi düşünce, duygu ve davranış kalıplarıma karşı dürüst ve farkında olmak istiyorum.',
    exampleBehaviors: ['Günlük tutmak', 'Terapiyi ciddiye almak', 'Geri bildirime açık olmak'],
  },
  {
    id: 'gelisim_3', domainId: 'gelisim',
    title: 'Yaratıcı Birey',
    statement: 'Yaratıcılığımı ifade edebileceğim alanlar açmak ve üretmekten zevk almak istiyorum.',
    exampleBehaviors: ['Sanatsal bir uğraş edinmek', 'Yeni formatlarda üretmek', 'Hata yapmaktan korkmadan denemek'],
  },

  // EĞLENCE / HOBİLER
  {
    id: 'eglence_1', domainId: 'eglence',
    title: 'Oyunbaz Birey',
    statement: 'Hayatıma keyif, neşe ve oyunu dahil etmek; bunlara değer vermek istiyorum.',
    exampleBehaviors: ['Haftalık hobi zamanı ayırmak', 'Spontan eğlenceye evet demek', 'Rekabetsiz aktivitelerde bulunmak'],
    obstacle: 'Eğlenmek "boşa zaman harcamak" gibi hissettiriyor.',
  },
  {
    id: 'eglence_2', domainId: 'eglence',
    title: 'Doğayla Bağlantılı Birey',
    statement: 'Doğada zaman geçirmek, doğanın ritmine uyum sağlamak istiyorum.',
    exampleBehaviors: ['Düzenli yürüyüşler', 'Hafta sonu doğa gezileri', 'Bahçecilik veya bitki yetiştirme'],
  },
  {
    id: 'eglence_3', domainId: 'eglence',
    title: 'Hareket Eden Birey',
    statement: 'Bedenimle neşe, özgürlük ve güç hissi yaratan aktivitelere yer açmak istiyorum.',
    exampleBehaviors: ['Dans, yüzme, spor', 'Rekabetsiz hareket etmek', 'Egzersizi ödül değil, keyif olarak görmek'],
  },

  // SAĞLIK / ÖZ-BAKIM
  {
    id: 'saglik_1', domainId: 'saglik',
    title: 'Bedenine Özen Gösteren Birey',
    statement: 'Bedenimin ihtiyaçlarına — uyku, beslenme, hareket — saygıyla yaklaşmak istiyorum.',
    exampleBehaviors: ['Düzenli uyku saati', 'Besleyici yemekler hazırlamak', 'Günlük hareket'],
    obstacle: 'Yorgunluk öz-bakımı en son sıraya itiyor.',
  },
  {
    id: 'saglik_2', domainId: 'saglik',
    title: 'Dinlenen ve Yenilenen Birey',
    statement: 'Yeterli dinlenme ve yenilenme fırsatlarını hayatıma dahil etmek istiyorum.',
    exampleBehaviors: ['Ekransız saatler', 'Meditasyon / nefes egzersizleri', 'Tatil ve mola planlamak'],
  },
  {
    id: 'saglik_3', domainId: 'saglik',
    title: 'Duygusal Sağlığına Değer Veren Birey',
    statement: 'Duygusal iyilik halime gerçek değer vermek ve destekleyen seçimler yapmak istiyorum.',
    exampleBehaviors: ['Terapiye devam etmek', 'Sınır koymak', 'Destek istemekten çekinmemek'],
  },

  // TOPLUM / VATANDAŞLIK
  {
    id: 'toplum_1', domainId: 'toplum',
    title: 'Katkıda Bulunan Vatandaş',
    statement: 'Yaşadığım topluma fayda sağlayan, aktif ve sorumlu bir vatandaş olmak istiyorum.',
    exampleBehaviors: ['Gönüllü çalışmalara katılmak', 'Yerel sorunlara ilgi göstermek', 'Oy hakkını kullanmak'],
    obstacle: 'Kaygı toplumsal katılımı azaltıyor.',
  },
  {
    id: 'toplum_2', domainId: 'toplum',
    title: 'Çevreye Duyarlı Birey',
    statement: 'Doğaya ve çevreye saygılı, bilinçli bir yaşam sürdürmek istiyorum.',
    exampleBehaviors: ['Tüketim alışkanlıklarını sorgulamak', 'Geri dönüşüm', 'Doğayla daha az zarar veren seçimler'],
  },
  {
    id: 'toplum_3', domainId: 'toplum',
    title: 'Adalet Arayan Birey',
    statement: 'Haksızlık gördüğümde ses çıkaran, adalete değer veren biri olmak istiyorum.',
    exampleBehaviors: ['Ayrımcılığa karşı durmak', 'Dezavantajlıları desteklemek', 'Kendi önyargılarını sorgulamak'],
  },

  // ANLAM / MANEVİYAT
  {
    id: 'anlam_1', domainId: 'anlam',
    title: 'Anlamlı Hayat Yaşayan Birey',
    statement: 'Hayatımda gerçekten önemli olan şeylerle bağlantılı, amaç duygusuyla yaşamak istiyorum.',
    exampleBehaviors: ['Değerlerimi düzenli gözden geçirmek', 'Anlamsız hissettiğimde kaynaklara dönmek', 'Mirasımı düşünmek'],
    obstacle: 'Rutinin içinde anlam kaybolabiliyor.',
  },
  {
    id: 'anlam_2', domainId: 'anlam',
    title: 'Şükran Duyan Birey',
    statement: 'Hayatımdaki güzellikleri fark eden, şükran ve minnetle yaklaşan biri olmak istiyorum.',
    exampleBehaviors: ['Şükran günlüğü tutmak', 'Günde 3 şey fark etmek', 'Takdirimizi sözel olarak ifade etmek'],
  },
  {
    id: 'anlam_3', domainId: 'anlam',
    title: 'İnançlarıyla Bütünleşik Birey',
    statement: 'İnançlarıma veya manevi değerlerime uygun, bütünleşik bir yaşam sürdürmek istiyorum.',
    exampleBehaviors: ['İbadet veya meditasyon pratiği', 'Toplulukla ruhsal bağ', 'Sessizlik ve içe yönelme zamanı'],
    obstacle: 'Yoğunluk maneviyata yer bırakmıyor.',
  },
];

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(value === n ? 0 : n)}
          className={cx('w-5 h-5 transition-colors', n <= value ? color : 'text-gray-200 hover:text-gray-300')}
        >
          <Star className="w-full h-full fill-current" />
        </button>
      ))}
    </div>
  );
}

// ─── Single Value Card ────────────────────────────────────────────────────────

function VCard({
  card, domain, state,
  onStateChange,
}: {
  card: ValueCard;
  domain: Domain;
  state: CardState;
  onStateChange: (s: CardState) => void;
}) {
  const [open, setOpen] = useState(false);
  const DomainIcon = domain.icon;
  const gap = state.onem - state.yasiyor;

  return (
    <div className={cx(
      'rounded-2xl border-2 transition-all bg-white',
      state.secildi ? domain.ringColor : 'border-gray-100',
    )}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cx('rounded-xl p-1.5 flex-shrink-0', domain.color)}>
              <DomainIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{domain.label}</p>
              <p className="text-sm font-semibold text-[#0E0F12] leading-tight">{card.title}</p>
            </div>
          </div>
          <button
            onClick={() => onStateChange({ ...state, secildi: !state.secildi })}
            className={cx(
              'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors',
              state.secildi
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300',
            )}
          >
            {state.secildi ? '✓ Seçildi' : 'Seç'}
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed italic mb-3">"{card.statement}"</p>

        {/* Ratings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-medium w-28">Benim için önemi</span>
            <StarRating value={state.onem} onChange={v => onStateChange({ ...state, onem: v })} color="text-amber-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-medium w-28">Şu an yaşıyorum</span>
            <StarRating value={state.yasiyor} onChange={v => onStateChange({ ...state, yasiyor: v })} color="text-emerald-500" />
          </div>
          {state.onem > 0 && state.yasiyor > 0 && gap > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cx('h-full rounded-full transition-all', gap >= 3 ? 'bg-red-400' : gap >= 2 ? 'bg-amber-400' : 'bg-yellow-300')}
                  style={{ width: `${(gap / 5) * 100}%` }}
                />
              </div>
              <span className={cx('text-[10px] font-semibold', gap >= 3 ? 'text-red-500' : gap >= 2 ? 'text-amber-500' : 'text-yellow-500')}>
                +{gap} açık
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setOpen(v => !v)}
          className="mt-3 flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {open ? 'Kapat' : 'Detay & Not'}
        </button>
      </div>

      {/* Expanded */}
      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Örnek Davranışlar</p>
            <ul className="space-y-1">
              {card.exampleBehaviors.map((b, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">→</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          {card.obstacle && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-2.5">
              <p className="text-[10px] font-semibold text-amber-600 mb-0.5">Tipik Engel</p>
              <p className="text-xs text-amber-800">{card.obstacle}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Danışan Notu</p>
            <textarea
              value={state.not}
              onChange={e => onStateChange({ ...state, not: e.target.value })}
              placeholder="Bu değer hakkında danışana özgü not…"
              rows={2}
              className="w-full text-xs border border-gray-200 rounded-xl p-2.5 resize-none outline-none focus:border-indigo-300 text-gray-700 placeholder:text-gray-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bull's Eye Radar ─────────────────────────────────────────────────────────

function BogaGozu({ cardStates }: { cardStates: Record<string, CardState> }) {
  const data = DOMAINS.map(d => {
    const domainCards = VALUE_CARDS.filter(c => c.domainId === d.id);
    const rated = domainCards.filter(c => cardStates[c.id]?.onem > 0);
    const avgOnem = rated.length
      ? rated.reduce((s, c) => s + (cardStates[c.id]?.onem ?? 0), 0) / rated.length
      : 0;
    const avgYasiyor = rated.length
      ? rated.reduce((s, c) => s + (cardStates[c.id]?.yasiyor ?? 0), 0) / rated.length
      : 0;
    return { domain: d.label.split(' /')[0], onem: +avgOnem.toFixed(1), yasiyor: +avgYasiyor.toFixed(1) };
  });

  const hasData = data.some(d => d.onem > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#0E0F12]">Boğa Gözü — Değer Haritası</h3>
        <p className="text-xs text-gray-400 mt-0.5">Her alanda ortalama önem ve yaşama puanları. Kartları puanladıkça grafik güncellenir.</p>
      </div>

      {!hasData ? (
        <div className="text-center py-12 text-sm text-gray-400">
          Haritayı görmek için kartlardan en az birini puanlayın.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Radar name="Önem" dataKey="onem" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.18} strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
              <Radar name="Yaşıyorum" dataKey="yasiyor" stroke="#10b981" fill="#10b981" fillOpacity={0.18} strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
              <Tooltip
                formatter={(v, name) => [`${v}/5`, String(name)]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-400 rounded inline-block" />Önem (1–5)</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 rounded inline-block" />Yaşıyorum (1–5)</div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Summary / Gap Analysis ───────────────────────────────────────────────────

function Ozet({ cardStates }: { cardStates: Record<string, CardState> }) {
  const selected = VALUE_CARDS.filter(c => cardStates[c.id]?.secildi || cardStates[c.id]?.onem > 0);
  const sorted = [...selected].sort((a, b) => {
    const gapA = (cardStates[a.id]?.onem ?? 0) - (cardStates[a.id]?.yasiyor ?? 0);
    const gapB = (cardStates[b.id]?.onem ?? 0) - (cardStates[b.id]?.yasiyor ?? 0);
    return gapB - gapA;
  });

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <Sparkles className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Özet görünümü için kartları puanlayın veya seçin.</p>
      </div>
    );
  }

  const selectedOnly = VALUE_CARDS.filter(c => cardStates[c.id]?.secildi);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Puanlanan Kart', value: selected.length, color: 'text-indigo-600' },
          { label: 'Seçilen Kart', value: selectedOnly.length, color: 'text-emerald-600' },
          { label: 'Açık Değer Alanı', value: sorted.filter(c => (cardStates[c.id]?.onem ?? 0) - (cardStates[c.id]?.yasiyor ?? 0) >= 2).length, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className={cx('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Gap list */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-[#0E0F12] mb-3">Öncelikli Çalışma Alanları</h3>
        <p className="text-[10px] text-gray-400 mb-3">Önem – Yaşıyorum farkına göre sıralanmış. Büyük fark = müdahale önceliği.</p>
        <div className="space-y-2">
          {sorted.map(card => {
            const domain = DOMAINS.find(d => d.id === card.domainId)!;
            const DomainIcon = domain.icon;
            const onem = cardStates[card.id]?.onem ?? 0;
            const yasiyor = cardStates[card.id]?.yasiyor ?? 0;
            const gap = onem - yasiyor;
            return (
              <div key={card.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                <div className={cx('rounded-lg p-1.5 flex-shrink-0', domain.color)}>
                  <DomainIcon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#0E0F12] truncate">{card.title}</p>
                  <p className="text-[10px] text-gray-400">{domain.label}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 text-[10px]">
                  <span className="text-amber-500 font-semibold">Ö:{onem}</span>
                  <span className="text-emerald-500 font-semibold">Y:{yasiyor}</span>
                  {gap > 0 && (
                    <span className={cx(
                      'rounded-full px-1.5 py-0.5 font-bold',
                      gap >= 3 ? 'bg-red-100 text-red-600' : gap >= 2 ? 'bg-amber-100 text-amber-600' : 'bg-yellow-100 text-yellow-600',
                    )}>Δ{gap}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes summary */}
      {sorted.some(c => cardStates[c.id]?.not?.trim()) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-[#0E0F12] mb-3">Danışan Notları</h3>
          <div className="space-y-2">
            {sorted.filter(c => cardStates[c.id]?.not?.trim()).map(card => (
              <div key={card.id} className="rounded-xl bg-gray-50 p-3">
                <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{card.title}</p>
                <p className="text-xs text-gray-700">{cardStates[card.id].not}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const defaultState = (): CardState => ({ onem: 0, yasiyor: 0, secildi: false, not: '' });

export default function DegerKartlari() {
  const [view, setView] = useState<View>('kartlar');
  const [activeDomain, setActiveDomain] = useState<string>('hepsi');
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const updateCard = (id: string, s: CardState) => setCardStates(prev => ({ ...prev, [id]: s }));
  const getState = (id: string): CardState => cardStates[id] ?? defaultState();

  const filteredCards = useMemo(() => {
    let cards = VALUE_CARDS;
    if (activeDomain !== 'hepsi') cards = cards.filter(c => c.domainId === activeDomain);
    if (showOnlySelected) cards = cards.filter(c => getState(c.id).secildi);
    return cards;
  }, [activeDomain, showOnlySelected, cardStates]);

  const selectedCount = VALUE_CARDS.filter(c => getState(c.id).secildi).length;
  const ratedCount = VALUE_CARDS.filter(c => getState(c.id).onem > 0).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-[#0E0F12] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              ACT Değer Kartları
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              27 hazır kart · 9 yaşam alanı · Puanlama, seçim ve boğa gözü haritası
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 font-medium">{ratedCount} puanlanan</span>
            <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 font-medium">{selectedCount} seçilen</span>
            {(ratedCount > 0 || selectedCount > 0) && (
              <button
                onClick={() => { if (confirm('Tüm puanlar ve seçimler sıfırlansın mı?')) setCardStates({}); }}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                title="Sıfırla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* View tabs */}
        <div className="flex gap-1.5 mt-4 border-b border-gray-100 pb-0">
          {([
            { id: 'kartlar',  label: 'Kartlar'       },
            { id: 'bogaGozu', label: 'Boğa Gözü'     },
            { id: 'ozet',     label: 'Özet & Öncelik' },
          ] as { id: View; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={cx(
                'px-3.5 py-1.5 text-xs font-medium rounded-t-xl -mb-px border-b-2 transition-colors',
                view === t.id
                  ? 'border-[#0E0F12] text-[#0E0F12] bg-white'
                  : 'border-transparent text-gray-400 hover:text-gray-600',
              )}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── Kartlar View ── */}
      {view === 'kartlar' && (
        <>
          {/* Domain filter + selected toggle */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <button
              onClick={() => setActiveDomain('hepsi')}
              className={cx(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                activeDomain === 'hepsi' ? 'bg-[#0E0F12] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50',
              )}
            >Tümü ({VALUE_CARDS.length})</button>
            {DOMAINS.map(d => {
              const count = VALUE_CARDS.filter(c => c.domainId === d.id).length;
              const DomainIcon = d.icon;
              return (
                <button
                  key={d.id}
                  onClick={() => setActiveDomain(d.id)}
                  className={cx(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1.5',
                    activeDomain === d.id ? d.color + ' border-2 ' + d.ringColor : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50',
                  )}
                >
                  <DomainIcon className="w-3 h-3" />
                  {d.label.split(' /')[0]} ({count})
                </button>
              );
            })}
            <button
              onClick={() => setShowOnlySelected(v => !v)}
              className={cx(
                'ml-auto rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                showOnlySelected ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50',
              )}
            >
              {showOnlySelected ? '✓ Seçilenler' : 'Seçilenleri Göster'}
            </button>
          </div>

          {filteredCards.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-sm text-gray-400">{showOnlySelected ? 'Henüz seçilmiş kart yok.' : 'Bu alanda kart bulunamadı.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredCards.map(card => {
                const domain = DOMAINS.find(d => d.id === card.domainId)!;
                return (
                  <VCard
                    key={card.id}
                    card={card}
                    domain={domain}
                    state={getState(card.id)}
                    onStateChange={s => updateCard(card.id, s)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Boğa Gözü View ── */}
      {view === 'bogaGozu' && <BogaGozu cardStates={cardStates} />}

      {/* ── Özet View ── */}
      {view === 'ozet' && <Ozet cardStates={cardStates} />}

      {/* Footer note */}
      <p className="text-[10px] text-gray-300 text-center pb-2">
        Russ Harris — ACT Değer Kartları · Polk & Schoendorff Matrix metodolojisi · Türkçe uyarlama
      </p>
    </div>
  );
}
