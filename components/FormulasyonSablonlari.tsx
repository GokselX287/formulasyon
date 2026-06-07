'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Sablon = {
  id: string;
  baslik: string;
  renk: string;          // Tailwind ring/badge colour token
  predispozan: string;
  presipitan: string;
  perpetuan: string;
  protektif: string;
  temelInanclar: string;
  araInanclar: string;
  otomatikDusunceler: string;
  duyguBedensel: string;
  davranislar: string;
  kaynak?: string;
};

// ─── Şablon Verisi ────────────────────────────────────────────────────────────

const SABLONLAR: Sablon[] = [
  {
    id: 'sosyal-kaygi',
    baslik: 'Sosyal Kaygı Bozukluğu',
    renk: 'blue',
    predispozan:
      'Mükemmeliyetçi aile tutumu; erken dönem utanma/alay edilme deneyimleri; çekingen mizaç; eleştirilmeye karşı yüksek hassasiyet; güvensiz bağlanma.',
    presipitan:
      'Yeni sosyal ortama geçiş (okul, iş); sunum veya performans görevi; kaygı anında dikkat çekme yaşantısı.',
    perpetuan:
      'Sosyal durumlardan kaçınma; güvenlik davranışları (az konuşma, kendini küçümseme); kaygı öncesi ruminasyon; olay-sonrası işleme (post-event processing).',
    protektif:
      'Değişim motivasyonu, güçlü değer sistemi, destekleyici yakın ilişkiler.',
    temelInanclar:
      '"Aptal görünürsem dayanılmaz olur." / "Beğenilmek için mükemmel performans sergilemem gerekir." / "İnsanlar beni sürekli değerlendiriyor."',
    araInanclar:
      '"Bir hata yaparsam herkes fark eder." / "Sessiz kalmak daha güvenli." / "Yüzüm kızarırsa herkes görür ve gülünçleşirim."',
    otomatikDusunceler:
      '"Yüzüm kızardı, herkes gördü." / "Saçmalık söyledim." / "Beni sevmiyorlar."',
    duyguBedensel:
      'Yoğun kaygı, utanç; yüz kızarması, titreme, ses titremesi, mide bulantısı, terleme.',
    davranislar:
      'Sosyal ortamlardan kaçınma; güvenlik sinyalleri kullanımı; az göz teması; konuşmayı kısaltma.',
    kaynak: 'Clark & Wells (1995); Heimberg & Becker (2002)',
  },
  {
    id: 'depresyon',
    baslik: 'Major Depresif Bozukluk',
    renk: 'indigo',
    predispozan:
      'Erken dönem kayıp/ihmal; eleştirel ebeveyn tutumu; karasız bağlanma; depresyon aile öyküsü; düşük benlik saygısı.',
    presipitan:
      'Önemli kayıp (ayrılık, yas, işten çıkarılma); kronik stres birikimi; fiziksel hastalık; yaşam geçişleri.',
    perpetuan:
      'Davranışsal inaktivasyon; sosyal geri çekilme; ruminasyon; olumsuz bilişsel üçlü (benlik/dünya/gelecek); uyku ve beslenme bozukluğu.',
    protektif:
      'Sosyal destek ağı, anlam–değer bağlantısı, problem çözme becerisi, değişim motivasyonu.',
    temelInanclar:
      '"Değersizim." / "Sevilmeye layık değilim." / "Hiçbir şey değişmeyecek." / "Dünya adaletsiz bir yer."',
    araInanclar:
      '"Bir işi bitiremezsem tamamen başarısızım." / "İnsanlar güçsüzlüğümü görürse beni terk eder."',
    otomatikDusunceler:
      '"Hiçbir şey yapmaya değmez." / "Yorgunum, kalkamam." / "Kimse umursamıyor." / "Zaten başaramam."',
    duyguBedensel:
      'Depresyon, suçluluk, utanç, ümitsizlik; yorgunluk, psikomotor yavaşlama, kronik ağrılar, iştah/uyku değişimi.',
    davranislar:
      'Aktivite ve hobilerden çekilme; sosyal izolasyon; görevleri erteleme; aşırı uyuma.',
    kaynak: 'Beck, Rush, Shaw & Emery (1979); Martell vd. (2010)',
  },
  {
    id: 'panik',
    baslik: 'Panik Bozukluğu',
    renk: 'red',
    predispozan:
      'Anksiyeteye yatkın mizaç; erken dönem ayrılma kaygısı; aile içi kaygı modelleri; bedensel belirtiler hakkında yanlış bilgi.',
    presipitan:
      'Beklenmedik fizyolojik uyarılma (egzersiz, kafein, hastalık); yoğun stres dönemi; ilk panik atağı deneyimi.',
    perpetuan:
      'Beden duyumlarını sürekli izleme (body scanning); durumsal ve interoceptive kaçınma; güvenlik davranışları; agorafobik kısıtlama.',
    protektif:
      'Psikoeğitime açıklık, maruz bırakma motivasyonu, güçlü destek sistemi.',
    temelInanclar:
      '"Bedensel belirtiler tehlikenin işaretidir." / "Kontrolü kaybedersem mahvolurum." / "Kalp krizi geçireceğim."',
    araInanclar:
      '"Panik hissettiğimde hemen oradan çıkmalıyım." / "Yalnız çıkmak tehlikeli." / "Güvende olduğumu hissedersem saldırı gelmez."',
    otomatikDusunceler:
      '"Kalbim çarpıyor, öleceğim." / "Başım dönüyor, bayılacağım." / "Delireceğim."',
    duyguBedensel:
      'Yoğun korku, çaresizlik; çarpıntı, nefes darlığı, baş dönmesi, uyuşma, terleme, titreme, depersonalizasyon.',
    davranislar:
      'Panik tetikleyicilerinden kaçınma; güvenlik nesnesi/kişisi kullanımı; acile koşma; aktiviteyi kısıtlama.',
    kaynak: 'Clark (1986); Barlow (2002)',
  },
  {
    id: 'okb',
    baslik: 'Obsesif-Kompulsif Bozukluk (OKB)',
    renk: 'amber',
    predispozan:
      'Aşırı sorumluluk inançları; mükemmeliyetçilik; düşünce–eylem kaynaşması; katı ahlaki/dini değer sistemi.',
    presipitan:
      'Artan sorumluluk (evlilik, bebek, yeni iş); yoğun yorgunluk/stres dönemi; obsesif içerikli tetikleyici düşünce.',
    perpetuan:
      'Kompulsif ritüeller (nötralizasyon); düşünce bastırma; güvence arama; sorumluluğu devreden kaçınma.',
    protektif:
      'Ritüellerin işlevsizliğini fark etme, ERP motivasyonu, sosyal destek.',
    temelInanclar:
      '"Kötü bir düşünce, kötü bir kişi olduğumun göstergesidir." / "Zarar verebilirim, bunu kontrol etmeliyim." / "Belirsizliğe tahammül edemem."',
    araInanclar:
      '"Ritüeli yapmazsam felaket olur." / "Emin olmadan bırakamazsın." / "Düşünmek = yapmak demektir."',
    otomatikDusunceler:
      '"Kapıyı kitlemedim." / "Dokundum, kirlenmiş olabilirim." / "Bu düşünceyi istedim, yani kötü biriyim."',
    duyguBedensel:
      'Kaygı, iğrenme, suçluluk, utanç; gerilim, mide bulantısı, kronik yorgunluk.',
    davranislar:
      'Kontrol etme, sayma, düzenleme, temizleme, güvence arama, zihinsel ritüeller, kaçınma.',
    kaynak: 'Salkovskis (1985); Foa & Kozak (1986)',
  },
  {
    id: 'yab',
    baslik: 'Yaygın Anksiyete Bozukluğu (YAB)',
    renk: 'teal',
    predispozan:
      'Erken dönem öngörülemeyen tehdit ortamı; aşırı koruyucu ebeveynlik; endişenin faydalı olduğuna dair inançlar; anksiyöz mizaç.',
    presipitan:
      'Kronik belirsizlik ortamı (ekonomik, ilişkisel); sağlık haberleri; iş/akademik baskı; sevilen birinin hastalığı.',
    perpetuan:
      'Endişe döngüleri; davranışsal kaçınma; güvence arama; belirsizliğe tahammülsüzlük; endişenin yararlı olduğuna inanç.',
    protektif:
      'Problem çözme becerisi, değer netliği, mindfulness pratiği, sosyal destek.',
    temelInanclar:
      '"Dünya tehlikeli ve öngörülemeyen bir yer." / "Endişelenirsem hazırlıklı olurum." / "Kontrolü kaybedersem her şey yıkılır."',
    araInanclar:
      '"En kötüsünü düşünürsem hazırlıklı olurum." / "Endişelenmek sorumluluk demektir." / "Bir şeyleri atlarsam felaket olur."',
    otomatikDusunceler:
      '"Ya hastalanırsam?" / "Ya işimi kaybedersem?" / "Ya bir şey ters giderse?"',
    duyguBedensel:
      'Sürekli kaygı, sinirlilik, konsantrasyon güçlüğü; kas gerginliği, baş ağrısı, yorgunluk, uyku bozukluğu.',
    davranislar:
      'Aşırı bilgi arama ve kontrol etme; karar vermeden kaçınma; erteleme; güvence arama.',
    kaynak: 'Borkovec & Roemer (1995); Dugas & Robichaud (2007)',
  },
  {
    id: 'tssb',
    baslik: 'Travma Sonrası Stres Bozukluğu (TSSB)',
    renk: 'purple',
    predispozan:
      'Önceki travma öyküsü; düşük sosyal destek; dissosiyatif eğilim; travmanın şiddeti ve yakınlığı.',
    presipitan:
      'Fiziksel veya cinsel saldırı; trafik kazası; doğal afet; savaş/çatışma; ağır tıbbi müdahale.',
    perpetuan:
      'Travma hatırlatıcılarından kaçınma; zihinsel baskılama; "dünya tehlikeli" ve "ben yetersizim" inançları; sosyal destek yokluğu.',
    protektif:
      'Güçlü sosyal bağlantı, travma ifşasına açıklık, hayatta kalma kaynakları.',
    temelInanclar:
      '"Dünya tehlikeli." / "Ben kırılganım / yetersizim." / "Güvenmek tehlikelidir." / "Bu benim suçum."',
    araInanclar:
      '"Hatırlarsam parçalanırım." / "Konuşmak daha da kötü yapar." / "Kontrol edemiyorsam tehlikedeyim."',
    otomatikDusunceler:
      '"Bu yine oluyor." / "Kaçmalıyım." / "Güvende değilim." / "Her şey benim hatamdı."',
    duyguBedensel:
      'Korku, utanç, suçluluk, öfke; flaşbekler, kabuslar, hipervigilans, irkilme tepkisi, uyuşukluk, dissosiyasyon.',
    davranislar:
      'Tetikleyicilerden kaçınma; izolasyon; madde kullanımı; öfke patlamaları; dissosiyatif kaçınma.',
    kaynak: 'Ehlers & Clark (2000); Foa, Hembree & Rothbaum (2007)',
  },
  {
    id: 'bpd',
    baslik: 'Borderline Kişilik Bozukluğu (BKB)',
    renk: 'rose',
    predispozan:
      'Erken dönem duygusal ihmal/istismar; geçersizleştirici çevre; biyolojik duygu yoğunluğu; güvensiz bağlanma örüntüleri.',
    presipitan:
      'Terk edilme algısı; ilişki krizleri; sınırların ihlali; yoğun duygusal tetikleyiciler.',
    perpetuan:
      'Duygu düzenleme güçlüğü; öfke patlaması → terk → yalnızlık döngüsü; kendine zarar verme (kısa vadeli rahatlama); terk edilme şemasını doğrulayan davranışlar.',
    protektif:
      'Terapötik ilişki, değer netliği, DBT becerileri, beden farkındalığı.',
    temelInanclar:
      '"Terk edileceğim." / "Sevilmeye değer değilim." / "İnsanlar ya tamamen iyi ya tamamen kötüdür." / "Duygularım beni yok eder."',
    araInanclar:
      '"Hissetmemek için bir şeyler yapmalıyım." / "Eğer biraz bile uzaklaşırsa gidecek."',
    otomatikDusunceler:
      '"Beni terk ediyor." / "Kimse anlamıyor." / "Kendime zarar vermeden durduramam."',
    duyguBedensel:
      'Yoğun öfke, kronik boşluk hissi, utanç; dissosiyasyon, kendine zarar verme dürtüsü.',
    davranislar:
      'İmpulsif davranışlar (harcama, madde); kendine zarar verme; idealizasyon–değersizleştirme döngüsü; kişileri test etme.',
    kaynak: 'Linehan (1993); Young, Klosko & Weishaar (2003)',
  },
  {
    id: 'ozgul-fobi',
    baslik: 'Özgül Fobi',
    renk: 'orange',
    predispozan:
      'Koşullanma deneyimi (doğrudan ya da gözlemsel); kaygıya yatkın mizaç; aile modelleme; bilgi aktarımı yoluyla öğrenilmiş tehdit.',
    presipitan:
      'Fobik uyaranla yoğun karşılaşma; yakın çevrede travmatik olay; medya aracılığıyla yoğun maruz kalma.',
    perpetuan:
      'Kaçınma ve güvenlik davranışları; tehdit abartma; kaygıya tahammülsüzlük; beklenti kaygısı.',
    protektif:
      'Maruz bırakma motivasyonu, psikoeğitime açıklık, fonksiyonel bozulma farkındalığı.',
    temelInanclar:
      '"Korku nesnesi/durumu gerçekten tehlikelidir." / "Kaçınamazsam başa çıkamam."',
    araInanclar:
      '"Sadece onu görsem bile bayılabilirim." / "Korku tepkim kontrolden çıkabilir."',
    otomatikDusunceler:
      '"Yılan var, öldürür." / "Enjeksiyon çok acı verir, bayılacağım." / "Uçaklar düşer."',
    duyguBedensel:
      'Yoğun korku/panik; vazovagal tepki (kan-enjeksiyon fobisinde); mide bulantısı, terleme, çarpıntı.',
    davranislar:
      'Fobik uyarandan kaçınma; güvenlik davranışları; aktivite kısıtlama.',
    kaynak: 'Öst (1989); Wolpe (1958)',
  },
];

// ─── Alan tanımları ───────────────────────────────────────────────────────────

const ALANLAR: { key: keyof Sablon; label: string }[] = [
  { key: 'predispozan',        label: '🌱 Predispozan (Zemin) Faktörler'       },
  { key: 'presipitan',         label: '⚡ Presipitan (Tetikleyici) Faktörler'  },
  { key: 'perpetuan',          label: '🔄 Perpetuan (Sürdürücü) Faktörler'      },
  { key: 'protektif',          label: '🛡️ Protektif (Koruyucu) Faktörler'       },
  { key: 'temelInanclar',      label: '🧠 Temel İnançlar'                       },
  { key: 'araInanclar',        label: '💬 Ara İnançlar / Varsayımlar'           },
  { key: 'otomatikDusunceler', label: '⚡ Otomatik Düşünceler'                  },
  { key: 'duyguBedensel',      label: '💛 Duygular & Bedensel Tepkiler'         },
  { key: 'davranislar',        label: '🚶 Davranışlar'                          },
];

// ─── Renk eşleme ─────────────────────────────────────────────────────────────

const RENK: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-700 border-blue-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  red:    'bg-red-100 text-red-700 border-red-200',
  amber:  'bg-amber-100 text-amber-700 border-amber-200',
  teal:   'bg-teal-100 text-teal-700 border-teal-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  rose:   'bg-rose-100 text-rose-700 border-rose-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
};

// ─── Bileşen ─────────────────────────────────────────────────────────────────

export default function FormulasyonSablonlari() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(prev => (prev === id ? null : id));

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="mb-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Kanıta Dayalı BDT Formülasyonları</p>
        <p className="text-xs text-gray-500 mt-0.5">Her kartı açarak predispozan, presipitan, perpetuan faktörleri ve bilişsel içerikleri inceleyin.</p>
      </div>

      {SABLONLAR.map(s => {
        const isOpen = expanded === s.id;
        const renkCls = RENK[s.renk] ?? 'bg-gray-100 text-gray-700 border-gray-200';

        return (
          <div key={s.id} className="card overflow-hidden">
            {/* Başlık satırı */}
            <button
              onClick={() => toggle(s.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F4F5F8] dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${renkCls}`}>
                  {s.baslik}
                </span>
                {s.kaynak && (
                  <span className="text-[11px] text-gray-400 hidden sm:inline italic">{s.kaynak}</span>
                )}
              </div>
              {isOpen
                ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
            </button>

            {/* İçerik */}
            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                {s.kaynak && (
                  <p className="text-[11px] text-gray-400 italic sm:hidden">{s.kaynak}</p>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  {ALANLAR.map(({ key, label }) => (
                    <div key={key} className={key === 'temelInanclar' || key === 'araInanclar' || key === 'otomatikDusunceler' ? 'sm:col-span-2' : ''}>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-sm text-[#0E0F12] dark:text-gray-200 leading-relaxed">{s[key] as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
