'use client';
import { useState, useEffect } from 'react';
import { Clock, BarChart2, GitBranch, Brain, Users, FileBarChart, Activity, CheckCircle2, Circle, GraduationCap, CalendarDays, FolderOpen, BookOpenCheck, ClipboardList, TrendingUp, Layers, UserCog, FilePen, Library, Home } from 'lucide-react';

type Feature = {
  id: string;
  title: string;
  description: string;
  why: string;
  icon: React.ComponentType<any>;
  complexity: 'orta' | 'yüksek';
  deps?: string;
};

const FEATURES: Feature[] = [
  {
    id: 'olcek',
    title: 'Ölçüm Araçları (PHQ-9, GAD-7, BDI-II, BAI, AAQ-II…)',
    description: '13 klinik ölçek (PHQ-9, GAD-7, BDI-II, BAI, AAQ-II, PCL-5, YBOCS, SPIN, DASS-21, PSWQ, RRS, VQ, KEFLS) için danışan bazlı puan takibi, zaman serisi grafiği ve otomatik şiddet sınıflandırması.',
    why: 'Danışana özel puan geçmişi tablosu ve seans sayısıyla karşılaştırma olmadan anlamlı görselleştirme yapılamaz. Veri birikimi gerektirir.',
    icon: BarChart2,
    complexity: 'yüksek',
    deps: 'Yeni DB tablosu (olcekler), danışan bazlı veri girişi ekranı',
  },
  {
    id: 'bdt-dongu',
    title: 'BDT Döngüsü Görselleştirme',
    description: 'Tetikleyici → Otomatik Düşünce → Duygu/Beden → Davranış → Maliyet döngüsünü SVG ile interaktif diyagram olarak render etme; danışana özel doldurulabilir alanlar.',
    why: 'Formülasyon verisinin bu şemaya nasıl eşleşeceği klinik içerik doğrulandıktan sonra daha sağlıklı tasarlanabilir.',
    icon: GitBranch,
    complexity: 'orta',
    deps: 'Formülasyon alanlarının BDT döngüsü şemasına haritalanması',
  },
  {
    id: 'act-matriks',
    title: 'ACT Matriks Görselleştirme',
    description: '4-kadrantlı ACT matrisi (Uzaklaştıran / Yaklaştıran × İç/Dış) danışanın belirttiği içerik ile otomatik doldurulan SVG plot.',
    why: 'Quadrant içerikleri henüz formülasyon alanlarına tam entegre edilmemiş; önce metin alanları dolduruldukça iyileştirilecek.',
    icon: Brain,
    complexity: 'orta',
    deps: 'ACT hexaflex alanlarının matriks koordinatlarına dönüştürülmesi',
  },
  {
    id: 'radar',
    title: 'Radar Chart & Heatmap Dashboard',
    description: 'ACT hexaflex ve ölçek puanlarını birleştiren radar chart; ölçek bazında madde-madde heatmap ile klinik profil görselleştirmesi.',
    why: 'Anlamlı veriden beslenen radar chart için en az 3–5 seans verisi ve ölçek puanı gerekiyor.',
    icon: Activity,
    complexity: 'yüksek',
    deps: 'Ölçüm araçları modülünün tamamlanması',
  },
  {
    id: 'rapor',
    title: 'Otomatik Klinik Rapor Taslağı',
    description: 'Formülasyon, seans notları ve ölçek puanlarından tek tıkla Türkçe klinik rapor taslağı oluşturma; PDF / Word çıktısı.',
    why: 'Rapor kalitesi girilen veri zenginliğiyle doğru orantılı. Şablon daha fazla vaka üzerinde test edildikten sonra netleşecek.',
    icon: FileBarChart,
    complexity: 'yüksek',
    deps: 'Ölçüm araçları + tüm formülasyon alanlarının dolu olması',
  },
  {
    id: 'profil',
    title: 'Terapist Profil & Yeterlilik Takibi',
    description: 'Uzmanlık alanları, eğitim zaman çizelgesi, süpervizyon saati özeti, yeterlilik metrikleri ve profesyonel gelişim günlüğü.',
    why: 'Süpervizyon modülünden gelen tamamlanmış kayıt sayısı biriktikçe anlamlı bir profil oluşacak.',
    icon: Users,
    complexity: 'orta',
    deps: 'En az 5–10 süpervizyon kaydı',
  },
  {
    id: 'davranis',
    title: 'Deficit/Excess Davranış Takibi',
    description: 'Davranışsal hedefler için 10 haftalık nokta-bazlı takip (davranışı yaptım/yapmadım); trend görselleştirme.',
    why: 'Davranış alanlarının BDT seans notu ile ilişkilendirilmesi için veri modeli netleştirilmeli.',
    icon: Clock,
    complexity: 'orta',
    deps: 'Seans notu yapısına davranış hedefi alanı eklenmesi',
  },
  {
    id: 'kariyer-okul',
    title: 'Kariyer Danışmanlığı & Okul Ortak Sistemi',
    description: 'Kariyer danışmanlığı süreçlerini (ilgi/yetkinlik envanteri, meslek eşleştirme, hedef planı) danışan dosyasıyla entegre eden modül. Okul/kurum ortaklıklarını kayıt altına alma, yönlendirme (referal) takibi ve ortak danışmanlık protokollerini yönetme.',
    why: 'Kariyer ve okul iş birliği modülü; danışan profiline mesleki alan ve eğitim düzeyi alanları eklendikten sonra anlamlı veri üretecek. Ortak kurum listesinin de sisteme tanımlanması gerekiyor.',
    icon: GraduationCap,
    complexity: 'yüksek',
    deps: 'Danışan profiline okul/kurum ve kariyer alanı eklenmesi; kurum rehber sistemi entegrasyonu',
  },
  {
    id: 'ders-programi',
    title: 'Ders Programı Hazırlama',
    description: 'Danışana özel haftalık/aylık müdahale programı oluşturma; seans konuları, ev ödevleri ve psikoeğitim modüllerini takvimle entegre eden sürükle-bırak ders planı şablonu. PDF olarak danışanla paylaşılabilir çıktı.',
    why: 'Seans planlaması için takvim modülündeki veri birikimi ve seans notu şablonlarının netleşmesi bekleniyor. Grup terapisi veya psikoeğitim seansları eklenince öncelik artacak.',
    icon: CalendarDays,
    complexity: 'orta',
    deps: 'Takvim & Randevular modülüyle çift yönlü senkronizasyon; seans notu şablonlarının tamamlanması',
  },
  {
    id: 'etkinlik-dosyasi',
    title: 'Etkinlik Dosyası Oluşturma',
    description: 'Grup terapisi, atölye ve psikoeğitim etkinlikleri için yapılandırılmış dosya sistemi: katılımcı listesi, oturum planı, materyal eki ve katılım formu tek çatı altında. Etkinlik bazlı raporlama ve danışan bazlı etkinlik geçmişi.',
    why: 'Grup seansları ve etkinlik yönetimi bireysel danışanlardan ayrı bir kayıt modeli gerektiriyor. Takvim entegrasyonu ve en az birkaç grup terapisi pratiği sonrası şablon netleşecek.',
    icon: FolderOpen,
    complexity: 'orta',
    deps: 'Grup / bireysel ayrımını destekleyen danışan modeli; takvim modülü grup oturumu desteği',
  },
  {
    id: 'anlasmalı-egitimler',
    title: 'Anlaşmalı Eğitimler',
    description: 'Danışanla müzakere edilen psikoeğitim ve beceri kazanımı planları: eğitim konusu, hedef, tamamlanma tarihi ve değerlendirme kriteri içeren anlaşma formu. Tamamlanan eğitimlerin seans kaydıyla ilişkilendirilmesi ve danışan ilerleme panelinde görüntülenmesi.',
    why: 'Eğitim anlaşması modülü anlam kazanabilmesi için önce standart seans notu yapısı ve psikoeğitim kütüphanesi oturmuş olmalı. Danışan bazlı eğitim geçmişi birkaç aktif vakadan sonra netleşecek.',
    icon: BookOpenCheck,
    complexity: 'orta',
    deps: 'Müdahale kütüphanesi psikoeğitim içerikleri; seans notuna eğitim referansı alanı eklenmesi',
  },
  {
    id: 'maruziyet-rasyoneli',
    title: 'Maruziyet Rasyoneli Formu',
    description: 'ERP / maruziyet protokolü başlatılmadan önce danışana sunulan yapılandırılmış rasyonel formu: kaçınmanın işlevi, maruziyetin gerekçesi, olası korkular ve yanıt önleme açıklaması. Danışan onay imzasıyla birlikte vaka dosyasına eklenir.',
    why: 'Maruziyet modülünün tüm bileşenleri (rasyonel, çalışma formu, grafik) aynı anda tasarlanması gerekiyor; parça parça eklenmesi klinik akışı bozar. Önce çalışma formu şablonu netleşmeli.',
    icon: ClipboardList,
    complexity: 'orta',
    deps: 'Maruziyet çalışma formu şablonunun tamamlanması; danışan onay/onam sistemi entegrasyonu',
  },
  {
    id: 'maruziyet-calisma',
    title: 'Maruziyet Çalışma Formu',
    description: 'Seans içi ve ev ödevi maruziyetleri için yapılandırılmış kayıt: durum tanımı, kaçınılan uyaranlar, SUDS başlangıç/zirve/bitiş puanları, süre, gözlemler ve bir sonraki adım. Formülasyon verisindeki tetikleyicilerden otomatik uyaran önerisi.',
    why: 'SUDS puanlama altyapısı (slider bileşeni) hazır; ancak maruziyet hiyerarşisi (korku merdiveni) ve seans bazlı veri modeli tamamlanmadan form anlamlı veri üretemez.',
    icon: Layers,
    complexity: 'yüksek',
    deps: 'SUDS slider entegrasyonu (tamamlandı); maruziyet hiyerarşisi veri modeli; seans kaydına maruziyet alanı eklenmesi',
  },
  {
    id: 'kisilik-bilgilendirme',
    title: 'Kişilik Tipleri Bilgilendirme Formları',
    description: 'DSM-5 / ICD-11 kişilik örüntülerine göre hazırlanmış danışan odaklı psikoeğitim formları: paranoid, şizoid, antisosyal, borderline, histrionik, narsisistik, kaçıngan, bağımlı ve obsesif-kompulsif kişilik örüntüleri için ayrı ayrı bilgilendirme metni, temel inançlar özeti ve terapi sürecine dair beklenti yönetimi. Danışan dosyasına eklenebilir PDF çıktısı.',
    why: 'Form içerikleri klinik olarak doğrulandıktan ve formülasyon şablonlarıyla hizalandıktan sonra üretime alınacak. Her kişilik örüntüsü için ayrı içerik havuzu oluşturulması gerekiyor.',
    icon: UserCog,
    complexity: 'yüksek',
    deps: 'Klinik içerik yazımı (her örüntü için ayrı); danışan profiline kişilik örüntüsü alanı eklenmesi; PDF çıktı sistemi',
  },
  {
    id: 'ornek-formulasyon',
    title: 'Örnek Formülasyon (Kişilik Tiplerine Göre)',
    description: 'Her kişilik örüntüsü için önceden doldurulmuş, klinik açıdan temsili formülasyon şablonları: 4P modeli (yatkınlaştıran, tetikleyici, sürdürücü, koruyucu), çekirdek inançlar, ara inançlar ve telafi stratejileri dolu gelir. Terapist yeni vaka açarken "örnek formülasyonu şablon olarak kullan" seçeneğiyle boş alanlara kopyalayabilir.',
    why: 'Örnek formülasyonların klinik kalitesi birden fazla terapist gözünden geçirilmeli. Şablon yapısı formülasyon modülünün son haline göre uyarlanacağından önce mevcut alanların sabitlenmesi bekleniyor.',
    icon: FilePen,
    complexity: 'yüksek',
    deps: 'Kişilik tipleri bilgilendirme formları içerik havuzu; formülasyon modülü alan yapısının sabitlenmesi; klinik gözden geçirme süreci',
  },
  {
    id: 'aile-bilgilendirme',
    title: 'Aile Bilgilendirme Formları',
    description: 'Danışanın ailesiyle paylaşılmak üzere hazırlanmış psikoeğitim formları: tanı/bozukluk hakkında genel bilgi, aile üyelerinin destekleyici rolü, kaçınılması gereken tutum ve davranışlar, terapi sürecine katılım rehberi. Çocuk/ergen danışanlar için ayrı aile formu seti; yetişkin danışanlar için eş/ebeveyn odaklı form seti. Danışan dosyasına eklenebilir ve teslim kaydı tutulur.',
    why: 'Form içerikleri her bozukluk/örüntü için ayrı ayrı yazılmalı ve klinik olarak doğrulanmalı. Çocuk değerlendirme modülü ve kişilik bilgilendirme formları şablonları netleştikten sonra aile formlarının yapısı daha tutarlı tasarlanabilecek.',
    icon: Home,
    complexity: 'yüksek',
    deps: 'Kişilik tipleri bilgilendirme formları içerik havuzu; çocuk/ergen danışan modeli; bozukluk bazlı içerik yazım ve klinik doğrulama süreci; PDF çıktı sistemi',
  },
  {
    id: 'kisilik-icerikler',
    title: 'Kişilik Örüntüsü İçerik Kütüphanesi',
    description: 'Her kişilik örüntüsüne özel müdahale stratejileri, yaygın otomatik düşünceler, şema listesi, önerilen ev ödevleri ve psikoeğitim materyallerini bir arada sunan yapılandırılmış içerik kütüphanesi. Terapist seans sırasında danışanın kişilik örüntüsüne göre filtrelenmiş önerilere tek tıkla ulaşır.',
    why: 'İçerik kütüphanesi hem klinik hem de editorial açıdan kapsamlı bir çalışma gerektiriyor. Müdahale kütüphanesinin mevcut kategorileriyle çakışma olmadan entegre edilebilmesi için mevcut etiket ve kategori yapısı önce gözden geçirilmeli.',
    icon: Library,
    complexity: 'yüksek',
    deps: 'Müdahale kütüphanesi kategori yapısı; kişilik örüntüsü alan tanımı; içerik yazım ve klinik doğrulama süreci',
  },
  {
    id: 'maruziyet-grafik',
    title: 'Maruziyet Karşılaştırma Grafikleri',
    description: 'Tek bir maruziyet seansındaki SUDS zaman serisini (dakika × puan) çizen çizgi grafik ve birden fazla seans arasındaki zirve/bitiş SUDS değişimini karşılaştıran çubuk grafik. Habitüasyon eğrisini otomatik hesaplar ve terapiste görsel geri bildirim sağlar.',
    why: 'Grafik anlamlı olabilmesi için en az 3–5 tamamlanmış maruziyet oturumu kaydı gerekiyor. Maruziyet çalışma formunun veri üretmesi önkoşul.',
    icon: TrendingUp,
    complexity: 'yüksek',
    deps: 'Maruziyet çalışma formu (birden fazla tamamlanmış kayıt); recharts veya benzeri grafik kütüphanesi entegrasyonu',
  },
  {
    id: 'yaratici-caresizlik',
    title: 'Yaratıcı Çaresizlik Formu (ACT)',
    description: 'Üç bölümlü yapılandırılmış form: (1) Davranış temeli — bu kaçınma/kontrol stratejisi ne zaman keşfedildi, hangi koşulda ortaya çıktı, o dönemde ne amaca hizmet etti; (2) Mevcut işlev — davranış bugün hâlâ ne için kullanılıyor, kısa vadede ne sağlıyor; (3) Anlam maliyeti — bu strateji sürdükçe hayat neyle anlamsızlaşıyor, hangi değerlerden uzaklaşıyor, yaşanmayan ne var. Her bölüm seans notuna ve ACT formülasyonuna bağlanır.',
    why: 'Yaratıcı çaresizlik ACT\'in temel müdahalelerinden biri; danışanın kontrol gündemi ile değerler arasındaki çelişkiyi somutlaştırır. Yapılandırılmış form olmadan bu süreç seans notunda kaybolabiliyor.',
    icon: Brain,
    complexity: 'orta',
    deps: 'ACT formülasyon alanı (act_yaratici_caresizlik kolonu zaten mevcut); seans notu entegrasyonu',
  },
];

const STORAGE_KEY = 'tasarim_tamamlandi';

export default function TasarimArsivi() {
  const [done, setDone] = useState<string[]>([]);
  const [filter, setFilter] = useState<'tumu' | 'bekleyen' | 'tamamlandi'>('tumu');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setDone(saved);
    } catch { /* ignore */ }
  }, []);

  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter(d => d !== id) : [...done, id];
    setDone(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const visible = FEATURES.filter(f => {
    if (filter === 'bekleyen') return !done.includes(f.id);
    if (filter === 'tamamlandi') return done.includes(f.id);
    return true;
  });

  const doneCount = done.filter(id => FEATURES.some(f => f.id === id)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-gray-400">Yol Haritası</p>
          <h1 className="text-2xl font-medium mt-1 text-[#0E0F12]">Tasarım Aşamasındaki Özellikler</h1>
          <p className="text-sm text-gray-500 mt-2 max-w-xl leading-relaxed">
            Altyapısı hazır ama veri birikimi veya ek geliştirme gerektiren özellikler. Tamamlananları işaretleyin.
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-3xl font-bold text-[#0E0F12]">{doneCount}<span className="text-lg text-gray-400">/{FEATURES.length}</span></p>
          <p className="text-xs text-gray-400 mt-0.5">tamamlandı</p>
        </div>
      </div>

      {/* İlerleme çubuğu */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-700"
          style={{ width: `${Math.round((doneCount / FEATURES.length) * 100)}%` }}
        />
      </div>

      {/* Filtre */}
      <div className="flex gap-1 bg-[#F4F5F8] p-1 rounded-2xl w-fit">
        {([
          { k: 'tumu',        l: `Tümü (${FEATURES.length})`             },
          { k: 'bekleyen',    l: `Bekleyen (${FEATURES.length - doneCount})` },
          { k: 'tamamlandi',  l: `Tamamlandı (${doneCount})`              },
        ] as const).map(t => (
          <button key={t.k} onClick={() => setFilter(t.k)}
            className={`text-xs px-4 py-1.5 rounded-xl font-medium transition-colors ${
              filter === t.k ? 'bg-white text-[#0E0F12] shadow-sm' : 'text-gray-500 hover:text-[#0E0F12]'
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {visible.map(f => {
          const Icon = f.icon;
          const isDone = done.includes(f.id);
          return (
            <div key={f.id} className={`card p-5 transition-all duration-300 ${isDone ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                {/* Tamamlandı butonu */}
                <button
                  onClick={() => toggle(f.id)}
                  className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
                  title={isDone ? 'Tamamlandı işaretini kaldır' : 'Tamamlandı olarak işaretle'}
                >
                  {isDone
                    ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    : <Circle className="w-6 h-6 text-gray-300 hover:text-gray-400" />}
                </button>

                <div className="w-9 h-9 rounded-xl bg-[#F4F5F8] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={`text-sm font-semibold leading-snug transition-all ${isDone ? 'line-through text-gray-400' : 'text-[#0E0F12]'}`}>
                      {f.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isDone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          ✓ Tamamlandı
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.complexity === 'yüksek' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {f.complexity} karmaşıklık
                      </span>
                    </div>
                  </div>
                  {!isDone && (
                    <>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{f.description}</p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Neden bekliyor?</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{f.why}</p>
                        </div>
                        {f.deps && (
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Bağımlılık</p>
                            <p className="text-xs text-gray-500 leading-relaxed">{f.deps}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-5 bg-gradient-to-r from-[#0E0F12] to-[#1A1B22] text-white">
        <p className="text-xs tracking-widest uppercase text-white/40">Not</p>
        <p className="text-sm text-white/70 mt-2 leading-relaxed">
          Bu özelliklerin önceliklendirilmesi için sistem üzerinde 2–3 aktif vaka ve birkaç haftalık kullanım verisi yeterlidir.
          Her geliştirme turu için bu sayfaya döneceğiz.
        </p>
      </div>
    </div>
  );
}
