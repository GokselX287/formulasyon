'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, TableProperties, Brain, Activity, Zap } from 'lucide-react';
import './actMotion.css';

/* ─────────────────────────────────────────────────────────────
   Veri
───────────────────────────────────────────────────────────── */

type Dalga = 'koken' | 'birinci' | 'ikinci' | 'ucuncu';

interface Ekol {
  id: string;
  ad: string;
  donem: string;
  kurucular: string;
  dalga: Dalga;
  renk: string;         // tailwind bg token
  acikRenk: string;     // hafif bg
  kenarlık: string;     // border color
  slogan: string;       // tek cümle öz
  zihinModeli: string;
  patolojiGorusu: string;
  terapotikHedef: string;
  teknikler: string[];
  terapistRolu: string;
  katki: string;
  sinirlilik: string;
  sonrakiKatmanaKopru?: string; // bir sonraki ekole nasıl zemin hazırladı
}

const DALGALAR: Record<Dalga, { label: string; aciklama: string; renk: string }> = {
  koken:    { label: 'Kök',         aciklama: 'Derinlik psikolojisi ve hümanistik gelenek — ruhun haritasını çizmek',         renk: 'text-purple-300' },
  birinci:  { label: '1. Dalga',    aciklama: 'Davranışçı devrim — gözlemlenebilir olanı değiştirmek',                         renk: 'text-blue-300'   },
  ikinci:   { label: '2. Dalga',    aciklama: 'Bilişsel devrim — düşüncenin duygu üzerindeki etkisini hedeflemek',             renk: 'text-green-300'  },
  ucuncu:   { label: '3. Dalga',    aciklama: 'Kabul & farkındalık devrimi — içeriği değil ilişkiyi dönüştürmek',              renk: 'text-amber-300'  },
};

const EKOLLER: Ekol[] = [
  {
    id: 'psikanaliz',
    ad: 'Psikanaliz',
    donem: '1895 – 1930',
    kurucular: 'Sigmund Freud',
    dalga: 'koken',
    renk: 'bg-purple-900/40',
    acikRenk: 'bg-purple-950/30',
    kenarlık: 'border-purple-700/50',
    slogan: 'Bilinçdışı çatışmalar semptomları üretir; aydınlatılmadan iyileşme olmaz.',
    zihinModeli: `Zihin üç katmanlıdır: Bilinçdışı (id'in baskılanmış malzeme deposu), Ön-bilinçli ve Bilinçli. Yapısal modelde id (dürtü), ego (gerçeklik ilkesi) ve süperego (ahlak) çatışır. Libidinal enerji bu çatışmayı besler.`,
    patolojiGorusu: 'Semptomlar bastırılmış bilinçdışı çatışmaların sembolik dışavurumudur. Erken dönem nesne ilişkileri ve oidipal çatışmalar nevrozun zeminini oluşturur.',
    terapotikHedef: `Bilinçdışı malzemeyi bilince çıkarmak; transferansı analiz etmek; ego'yu güçlendirmek. "Olduğu yerde id, olacak ego."`,
    teknikler: ['Serbest çağrışım', 'Rüya analizi', 'Transferans analizi', 'Yorumlama (interpretation)', 'Karşı-transferans farkındalığı', 'Direniş analizi'],
    terapistRolu: 'Yansıtma ekranı (blank screen); nötr, yorumlayan; gizli gözlemci.',
    katki: 'Bilinçdışı süreçlerin varlığını, savunma mekanizmalarını ve erken ilişkilerin yetişkinlik üzerindeki etkisini kalıcı olarak psikoloji literatürüne soktu.',
    sinirlilik: 'Deneysel test edilebilirliği düşük; uzun ve pahalı; kültürel önyargı; cinsiyet ve normativite sorunları.',
    sonrakiKatmanaKopru: 'Öğrenme kuramcıları "neden bilinçdışını aradık ki, gözlemlenebileni değiştireyim" diye yanıt verdi → Davranışçılık.',
  },
  {
    id: 'analitik',
    ad: 'Analitik & Bireysel Psikoloji',
    donem: '1910 – 1940',
    kurucular: 'C.G. Jung / Alfred Adler',
    dalga: 'koken',
    renk: 'bg-purple-900/40',
    acikRenk: 'bg-purple-950/30',
    kenarlık: 'border-purple-700/50',
    slogan: 'Kolektif miras ve sosyal aidiyet, bireysel psikolojinin merkezidir.',
    zihinModeli: 'Jung: Kişisel + kolektif bilinçdışı; arketipler (Gölge, Anima, Animus, Kendilik); bireyselleşme süreci. Adler: Aşağılık-üstünlük çatışması; sosyal ilgi; yaşam tarzı; erken anılar.',
    patolojiGorusu: 'Jung: Bilinç ile bilinçdışı arasındaki kopukluk; archetypal dengesizlik. Adler: Sosyal ilginin yoksunluğu; hatalı hedefler; yanlış oluşturulmuş yaşam tarzı.',
    terapotikHedef: `Jung: Bireyselleşme — tüm parçaları Kendilik'te bütünlemek. Adler: Sosyal duygunun geliştirilmesi; yeniden çerçeveleme; yaşam tarzını yeniden yapılandırmak.`,
    teknikler: ['Amplifikasyon (Jung)', 'Aktif imgelem', 'Erken anı analizi (Adler)', 'Yeniden çerçeveleme', 'Cesaretlendirme', '"Sanki" tekniği'],
    terapistRolu: 'İşbirlikçi kılavuz; eşit ilişki (Adler özellikle).',
    katki: 'Psikolojide anlamı, amacı ve sosyal boyutu merkezileştirdi. Pozitif psikoloji ve anlam terapisine zemin hazırladı.',
    sinirlilik: 'Jung: Test edilemez metaforlar. Adler: Sistematik teknik açığı.',
    sonrakiKatmanaKopru: `Rogers ve Maslow hümanistik kolu geliştirdi; Adler'in sosyal vurgusu CBT'nin istemci odaklı yanını besledi.`,
  },
  {
    id: 'humanistik',
    ad: 'Hümanistik / Varoluşçu Terapi',
    donem: '1940 – 1970',
    kurucular: 'Carl Rogers · Abraham Maslow · Viktor Frankl · Fritz Perls',
    dalga: 'koken',
    renk: 'bg-violet-900/40',
    acikRenk: 'bg-violet-950/30',
    kenarlık: 'border-violet-700/50',
    slogan: 'İnsan özünde büyümeye meyillidir; anlam yaratmak ve otantik olmak iyileştirir.',
    zihinModeli: 'Benliğin kendini gerçekleştirme eğilimi (Rogers); ihtiyaçlar hiyerarşisi (Maslow); anlam arayışı (Frankl); şimdi-an deneyimi ve farkındalık (Gestalt/Perls).',
    patolojiGorusu: 'Koşullu değer verilmesi nedeniyle büyüme potansiyelinin bloke edilmesi; anlamsızlık, otantiklikten kopukluk, eksik farkındalık.',
    terapotikHedef: `Koşulsuz kabul ortamı ile büyümeyi desteklemek; anlam bulmak; şimdi-an'da tam olarak var olmak.`,
    teknikler: ['Koşulsuz olumlu kabul', 'Empatik yansıtma', 'Farkındalık egzersizleri', 'Boş sandalye tekniği (Gestalt)', 'Logo-terapi (anlam günlüğü)', 'Fenomenolojik keşif'],
    terapistRolu: 'Otantik varlık; şeffaf; güçlendirici ortak.',
    katki: 'Terapötik ilişkiyi birincil iyileştirici güç olarak konumlandırdı. Danışan merkezli yaklaşım modern ittifak araştırmalarının temeli.',
    sinirlilik: 'Yapılandırılmış teknik repertuvarı sınırlı; şiddetli patolojilerde yetersiz kalabilir.',
    sonrakiKatmanaKopru: '"Düşünce duyguyu etkiler" hipotezine kapı araladı — Beck ve Ellis buradan hareket etti.',
  },
  {
    id: 'davranisci',
    ad: 'Davranışçı Terapi',
    donem: '1950 – 1970',
    kurucular: 'John B. Watson · B.F. Skinner · Joseph Wolpe · Hans Eysenck',
    dalga: 'birinci',
    renk: 'bg-blue-900/40',
    acikRenk: 'bg-blue-950/30',
    kenarlık: 'border-blue-700/50',
    slogan: 'Öğrenilen her şey öğrenilebilir-silebilir; davranışı değiştirmek yeterlidir.',
    zihinModeli: 'Zihin "kara kutu"dur — gözlemlenemeyen içeriğe odaklanmak bilim dışıdır. Klasik koşullanma (Pavlov), edimsel koşullanma (Skinner) ve sosyal öğrenme (Bandura) tüm davranışı açıklar.',
    patolojiGorusu: 'Patoloji, uyumsuz koşullanma tarihi olan öğrenilmiş davranış örüntüleridir. Fobi, yanlış koşullanmanın ürünüdür.',
    terapotikHedef: 'Uyumsuz davranışın söndürülmesi; uyumlu yeni davranışın kazandırılması.',
    teknikler: ['Sistematik duyarsızlaştırma', 'Maruz bırakma (flooding)', 'Token ekonomisi', 'Davranış deneyler', 'Beceri eğitimi', 'Modelleme (Bandura)', 'Olumlu pekiştirme'],
    terapistRolu: 'Teknik uzman; öğretmen; değişim mühendisi.',
    katki: 'Psikoterapi araştırmasını bilimsel zemine taşıdı. Fobi, OKB ve davranış bozukluklarında hâlâ altın standart teknikler üretti (maruz bırakma).',
    sinirlilik: 'Bilişsel süreçleri ve dili görmezden gelir; semptom değiştirme kalıcı olmayabilir; anlamı, değerleri ve içgörüyü dışlar.',
    sonrakiKatmanaKopru: '"Sadece davranış değil, düşünce de değişmeli" → Bilişsel devrim başladı.',
  },
  {
    id: 'bilissel',
    ad: 'Bilişsel Terapi',
    donem: '1960 – 1980',
    kurucular: 'Aaron Beck · Albert Ellis (REBT)',
    dalga: 'ikinci',
    renk: 'bg-green-900/40',
    acikRenk: 'bg-green-950/30',
    kenarlık: 'border-green-700/50',
    slogan: 'Olay değil, olaya yüklenen anlam duyguyu belirler.',
    zihinModeli: 'Bilişsel üçlü (Beck): Benlik · Dünya · Gelecek hakkındaki olumsuz şemalar otomatik düşünceleri tetikler. Bilişsel çarpıtmalar (felaketleştirme, tünel görme, etiketleme…) duygusal acının kaynağıdır.',
    patolojiGorusu: 'Depresyon ve kaygı, çarpık bilişsel işlemenin ürünüdür. Erken şemalar, otomatik düşünce örüntülerini besler.',
    terapotikHedef: 'Çarpık otomatik düşünceleri tespit etmek, sorgulamak ve işlevsel alternatiflerle değiştirmek.',
    teknikler: ['Düşünce kaydı', 'Sokratik sorgulama', 'Bilişsel yeniden yapılandırma', 'Davranışsal deney', 'ABC kaydı (Ellis)', 'Çarpıtma listesi', 'Şema çalışması'],
    terapistRolu: 'İşbirlikçi empirisist; sokrates gibi sorgulayan; psikoeğitimci.',
    katki: 'Depresyon tedavisinde ilaçla eşdeğer etkinliği kanıtladı. Bilişsel kavramlar (şema, otomatik düşünce) evrensel klinik dil haline geldi.',
    sinirlilik: '"İçeriği değiştir" odağı — düşünceden uzaklaşmayı öğretmez; bazen bilişsel tartışma kaygıyı artırır; bilişsel süpresyon paradoksal etki yaratabilir.',
    sonrakiKatmanaKopru: '"Düşüncenin içeriğini değiştirmek zorunda mıyız, yoksa düşünceyle ilişkimizi mi?" sorusu 3. dalgayı doğurdu.',
  },
  {
    id: 'bdt',
    ad: 'Bilişsel Davranışçı Terapi (BDT)',
    donem: '1980 – günümüz',
    kurucular: 'Aaron Beck · Donald Meichenbaum · Christine Padeski',
    dalga: 'ikinci',
    renk: 'bg-emerald-900/40',
    acikRenk: 'bg-emerald-950/30',
    kenarlık: 'border-emerald-700/50',
    slogan: 'Düşünce ve davranışın eş zamanlı dönüşümü kalıcı iyileşme sağlar.',
    zihinModeli: '1. ve 2. dalgayı birleştirir. Koşullanma tarihi + bilişsel şemalar birlikte işlenir. Bilişsel ve davranışsal müdahaleler tek protokolde entegre edilir.',
    patolojiGorusu: 'Uyumsuz şemalar → çarpık otomatik düşünceler → kaçınma davranışları → döngü. Her bileşen diğerini besler.',
    terapotikHedef: 'Hem bilişsel hem davranışsal döngüyü kırmak; yeni alışkanlık ve düşünce örüntüleri yerleştirmek.',
    teknikler: ['Maruz bırakma + bilişsel yeniden yapılandırma', 'Problem çözme', 'Sosyal beceri eğitimi', 'Relaks teknikler', 'Ev ödevi', 'Protokol bazlı tedavi', 'Vaka formülasyonu'],
    terapistRolu: 'Yapılandırılmış, protokole dayalı, hedef odaklı uzman.',
    katki: 'En geniş RCT literatürüne sahip psikoterapi modalitesi. Kaygı bozuklukları, depresyon, OKB, yeme bozukluklarında kanıta dayalı altın standart.',
    sinirlilik: 'Katı protokoller esnekliği azaltabilir; "uyum ve kabul" boyutunu sınırlı ele alır; yüksek relaps oranları kronik vakalarda.',
    sonrakiKatmanaKopru: '"İçeriği değiştirmek her zaman işe yaramıyor — kabul, farkındalık ve değer temelli eylem gerekiyor." → 3. Dalga.',
  },
  {
    id: 'act',
    ad: 'Kabul ve Kararlılık Terapisi (ACT)',
    donem: '1986 – günümüz',
    kurucular: 'Steven C. Hayes · Kirk Strosahl · Kelly Wilson',
    dalga: 'ucuncu',
    renk: 'bg-amber-900/40',
    acikRenk: 'bg-amber-950/30',
    kenarlık: 'border-amber-700/50',
    slogan: 'Düşüncenin içeriğini değil, düşünceyle ilişkini değiştir; değerlere doğru hareket et.',
    zihinModeli: 'İlişkisel Çerçeve Teorisi (RFT): Dil ve biliş, acıyı içselleştirir. Psikolojik esneklik altı süreçle gelişir: Kabul · Bilişsel defüzyon · Şimdiye tam temas · Bağlamsal benlik · Değerler · Kararlı eylem.',
    patolojiGorusu: 'Psikolojik katılık — yaşantısal kaçınma, bilişsel füzyon, değerlerden kopukluk, "şimdi"den uzaklık acıyı kronikleştirir.',
    terapotikHedef: 'Psikolojik esnekliği artırmak; değer temelli yaşamı mümkün kılmak. Semptom azalması yan ürün, hedef değil.',
    teknikler: ['Defüzyon egzersizleri', 'ACT metaforları (yolcu-otobüs, çamur-cam)', 'Değer belirleme çalışmaları', 'Kararlı eylem planı', 'Kabul egzersizleri', 'Farkındalık pratiği', 'Yaratıcı çaresizlik', 'Bağlamsal benlik egzersizleri'],
    terapistRolu: 'Dürüstçe açık, deneyimsel kılavuz; değerleri hastaya değil, onunla birlikte keşfeder.',
    katki: 'Semptomdan ziyade işlevselliği hedefler. Transdiagnostik protokol — tüm bozukluklar için tek çerçeve. Kronik ağrı, kaygı, depresyon, bağımlılıkta güçlü kanıt.',
    sinirlilik: 'Defüzyon tekniklerinin içselleştirilmesi zaman alır; yoğun metafor kullanımı bazı danışanlar için soyut kalabilir.',
    sonrakiKatmanaKopru: `ACT'nin şefkat vurgusunu geliştiren CFT ve farkındalık boyutunu derinleştiren MBCT paralel gelişti.`,
  },
  {
    id: 'dbt',
    ad: 'Diyalektik Davranış Terapisi (DBT)',
    donem: '1991 – günümüz',
    kurucular: 'Marsha M. Linehan',
    dalga: 'ucuncu',
    renk: 'bg-orange-900/40',
    acikRenk: 'bg-orange-950/30',
    kenarlık: 'border-orange-700/50',
    slogan: 'Değişim ile kabulü dengelemek — "Ben olduğum gibiyim VE değişebilirim."',
    zihinModeli: 'Biyososyal model: Duygusal hassasiyet (biyolojik) + geçersiz kılıcı çevre (sosyal) = duygu düzensizliği. Diyalektik: Tez (kabul) ve antitez (değişim) sentezi.',
    patolojiGorusu: 'Sınır kişilik örüntüsü ve kronik intihar riski, duygu düzensizliğinin ifadesidir — ahlak problemi değil, beceri açığı.',
    terapotikHedef: 'Yaşama değer katmak: duygu düzenleme · sıkıntı toleransı · kişilerarası etkinlik · farkındalık becerilerini kazandırmak.',
    teknikler: ['Bireysel terapi', 'Beceri eğitim grupları', 'Telefon koçluğu (kriz)', 'TKT (terapist konsültasyon ekibi)', 'DEAR MAN · GIVE · FAST becerileri', 'Dalga sörfü (duygu)', 'TIP becerisi (buz / egzersiz)'],
    terapistRolu: 'Aktif, destekleyici, validasyon odaklı; danışanla diyalektik denge kurar.',
    katki: `İntihar davranışını azaltan ilk kanıtlanmış terapi. Kronik, yüksek riskli vakalarda BDT'yi geçer. Geçersiz kılma kavramını klinik dile kazandırdı.`,
    sinirlilik: 'Yoğun kaynak gerektirir (grup + bireysel + telefon). Eğitim süreci uzun ve maliyetli.',
  },
  {
    id: 'mbct',
    ad: 'Farkındalık Temelli BT (MBCT)',
    donem: '2000 – günümüz',
    kurucular: 'Zindel Segal · Mark Williams · John Teasdale',
    dalga: 'ucuncu',
    renk: 'bg-teal-900/40',
    acikRenk: 'bg-teal-950/30',
    kenarlık: 'border-teal-700/50',
    slogan: 'Depresyonun nüksetmesini farkındalıkla kes — düşünce moduyla değil, varlık moduyla.',
    zihinModeli: 'Ruminasyon (yapma modu) depresyonu besler. Farkındalık (varlık modu) ruminasyonu keser. MBSR + BDT kavramsalını birleştirir.',
    patolojiGorusu: 'Nükleer relaps: olumsuz ruh hali + eski bilişsel örüntüler → kascading depresyon dönemi. Farkındalık bu döngüyü erken yakalar.',
    terapotikHedef: 'Tekrarlayan depresyonda relaps önleme; "şimdi" ile sağlıklı ilişki.',
    teknikler: ['Beden tarama', 'Oturma meditasyonu', 'Farkındalıklı yürüyüş', 'Düşünce duygu farkı egzersizleri', '3 dakikalık nefes alanı', 'Hoşagelmeyen deneyimle oturma'],
    terapistRolu: 'Grup kolaylaştırıcısı; kendi farkındalık pratiği zorunlu.',
    katki: '3 veya daha fazla depresyon atağı geçirenlerde relapsı %40–50 azaltıyor. Mindfulness uygulamalarını klinik protokole entegre etti.',
    sinirlilik: 'Aktif depresyon döneminde etkisi sınırlı. Yoğun pratik bağlılığı gerektirir.',
  },
  {
    id: 'schema',
    ad: 'Şema Terapi',
    donem: '1990 – günümüz',
    kurucular: 'Jeffrey Young',
    dalga: 'ucuncu',
    renk: 'bg-rose-900/40',
    acikRenk: 'bg-rose-950/30',
    kenarlık: 'border-rose-700/50',
    slogan: 'Çocuklukta karşılanmamış temel ihtiyaçlar şemaları üretir; şemalar yetişkinliği biçimlendirir.',
    zihinModeli: '18 erken dönem uyumsuz şema (EDŞ) → Şema modları (açık çocuk, cezalandırıcı ebeveyn, sağlıklı yetişkin…) → Başa çıkma biçimleri (teslim, kaçınma, aşırı telafi).',
    patolojiGorusu: 'Kişilik bozuklukları ve kronik Aks I sorunları, karşılanmamış temel çocukluk ihtiyaçlarının ürünüdür.',
    terapotikHedef: 'Sınırlı yeniden ebeveynlik yoluyla şemaların yumuşatılması; sağlıklı yetişkin modunun güçlendirilmesi.',
    teknikler: ['Şema belirleme ölçekleri (YSQ)', 'Sınırlı yeniden ebeveynlik', 'İmgelem ile yeniden yazma', 'Sandalye çalışması (mod diyaloğu)', 'Mod haritası', 'Empatik yüzleşme'],
    terapistRolu: 'Sınırlı yeniden ebeveyn; otantik, ısrarlı ve sınır koyan.',
    katki: `BDT'nin yetersiz kaldığı kişilik bozukluklarında güçlü kanıt. Çocukluk travmasını doğrudan ele alan ilk BDT-türevi model.`,
    sinirlilik: 'Uzun soluklu (2–4 yıl). Yoğun terapist özifşası riskleri.',
  },
  {
    id: 'cft',
    ad: 'Şefkat Odaklı Terapi (CFT)',
    donem: '2000 – günümüz',
    kurucular: 'Paul Gilbert',
    dalga: 'ucuncu',
    renk: 'bg-pink-900/40',
    acikRenk: 'bg-pink-950/30',
    kenarlık: 'border-pink-700/50',
    slogan: 'Evrimsel miras utanç ve özeleştiriyi besler; şefkat antidotudur.',
    zihinModeli: 'Üç duygu düzenleme sistemi: Tehdit (amigdala, savaş-kaç), Sürücü (dopamin, kazanım), Sakinlik/İlişki (oksitosin, bağlanma). Utanç, tehdit sistemini kronik aktive eder.',
    patolojiGorusu: 'Yüksek utanç + özeleştiri → kronik tehdit aktivasyonu → depresyon/kaygı/kişilik sorunları. Bağlanma yaralanması şefkat kapasitesini engeller.',
    terapotikHedef: 'Şefkat temelli zihinsel ortam yaratmak; tehdit sistemini sakinlik sistemiyle dengelemek; öz-şefkat geliştirmek.',
    teknikler: ['Şefkatli zihin eğitimi', 'Sakinleştirici ritim nefes', 'Şefkatli benlik imgesi', 'Utanç–suçluluk ayrımı', 'Şefkat odaklı mektup yazma', 'ACT + CFT entegrasyonu'],
    terapistRolu: 'Isınlık ve sıcaklık taşıyan, sınır içinde cesaretlendirici.',
    katki: 'Psikolojik sorunu evrimsel, biyolojik temele oturturarak damgalamayı azaltır. Öz-eleştiri ve utanç üzerinde güçlü etki.',
    sinirlilik: 'Şefkat egzersizleri bazı danışanlarda başlangıçta yoğun duygu yüküne yol açabilir ("compassion-phobia").',
  },
];

/* ─────────────────────────────────────────────────────────────
   Karşılaştırma eksenleri
───────────────────────────────────────────────────────────── */

type Eksen = 'patoloji' | 'hedef' | 'terapist' | 'teknik';
const EKSENLER: { id: Eksen; label: string }[] = [
  { id: 'patoloji', label: 'Patoloji Görüşü' },
  { id: 'hedef',    label: 'Terapötik Hedef' },
  { id: 'terapist', label: 'Terapist Rolü'   },
  { id: 'teknik',   label: 'Öne Çıkan Teknik' },
];

function eksenDegeri(e: Ekol, eksen: Eksen): string {
  switch (eksen) {
    case 'patoloji': return e.patolojiGorusu.slice(0, 90) + '…';
    case 'hedef':    return e.terapotikHedef.slice(0, 90) + '…';
    case 'terapist': return e.terapistRolu;
    case 'teknik':   return e.teknikler.slice(0, 3).join(' · ');
  }
}

/* ─────────────────────────────────────────────────────────────
   Zaman çizelgesi bileşeni
───────────────────────────────────────────────────────────── */

function EkolKart({ ekol, open, onToggle }: { ekol: Ekol; open: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-xl border ${ekol.kenarlık} ${ekol.renk} transition-all`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 px-5 py-4 text-left"
      >
        {/* Sol çizgi / nokta */}
        <div className="flex flex-col items-center pt-1 flex-shrink-0">
          <div className={`w-3 h-3 rounded-full border-2 ${ekol.kenarlık} bg-white/20`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-white/40">{ekol.donem}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ekol.kenarlık} text-white/60`}>
              {DALGALAR[ekol.dalga].label}
            </span>
          </div>
          <h3 className="text-base font-semibold text-white">{ekol.ad}</h3>
          <p className="text-xs text-white/50 mt-0.5">{ekol.kurucular}</p>
          <p className="text-sm text-white/70 mt-2 italic">"{ekol.slogan}"</p>
        </div>
        <div className="flex-shrink-0 text-white/40 mt-1">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className={`border-t ${ekol.kenarlık} px-5 py-4 space-y-4`}>
          <Grid label="Zihin Modeli"       value={ekol.zihinModeli} />
          <Grid label="Patoloji Görüşü"    value={ekol.patolojiGorusu} />
          <Grid label="Terapötik Hedef"    value={ekol.terapotikHedef} />
          <Grid label="Terapist Rolü"      value={ekol.terapistRolu} />

          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">Teknikler</p>
            <div className="flex flex-wrap gap-1.5">
              {ekol.teknikler.map(t => (
                <span key={t} className={`text-xs px-2.5 py-1 rounded-full border ${ekol.kenarlık} text-white/70 ${ekol.acikRenk}`}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-1">✦ Katkı</p>
              <p className="text-xs text-white/70 leading-relaxed">{ekol.katki}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">⚠ Sınırlılık</p>
              <p className="text-xs text-white/70 leading-relaxed">{ekol.sinirlilik}</p>
            </div>
          </div>

          {ekol.sonrakiKatmanaKopru && (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 flex gap-2 items-start">
              <span className="text-white/30 mt-0.5">→</span>
              <p className="text-xs text-white/50 italic leading-relaxed">{ekol.sonrakiKatmanaKopru}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Grid({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-white/75 leading-relaxed">{value}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Karşılaştırma tablosu
───────────────────────────────────────────────────────────── */

function KarsilastirmaTablosu({ secili }: { secili: string[] }) {
  const [eksen, setEksen] = useState<Eksen>('patoloji');
  const ekoller = EKOLLER.filter(e => secili.length === 0 || secili.includes(e.id));

  return (
    <div className="space-y-4">
      {/* Eksen seçici */}
      <div className="flex flex-wrap gap-2">
        {EKSENLER.map(ex => (
          <button
            key={ex.id}
            onClick={() => setEksen(ex.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              eksen === ex.id
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/10 text-white/40 hover:text-white/70'
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto rounded-xl border border-white/8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider w-44">Ekol</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">
                {EKSENLER.find(ex => ex.id === eksen)?.label}
              </th>
            </tr>
          </thead>
          <tbody>
            {ekoller.map((e, i) => (
              <tr key={e.id} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.renk.replace('/40', '')}`} />
                    <div>
                      <p className="text-xs font-medium text-white/80">{e.ad}</p>
                      <p className="text-[10px] text-white/30">{e.donem}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="text-xs text-white/60 leading-relaxed">{eksenDegeri(e, eksen)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Katman Görünümü — dalga başlıkları + geçiş köprüleri
───────────────────────────────────────────────────────────── */

// Her ekol için "önceki ekole kıyasla ne ekledi" özeti
const KATKI_OZETI: Record<string, string> = {
  psikanaliz:  'Bilinçdışı kavramını, savunma mekanizmalarını ve erken ilişkilerin yaşam boyu etkisini psikoloji literatürüne kattı.',
  analitik:    'Kolektif bilinçdışı, anlam arayışı ve sosyal ilgiyi tedavinin merkezine taşıdı.',
  humanistik:  'Terapötik ilişkiyi birincil iyileştirici güç olarak tanımladı; danışan merkezli yaklaşımı kurdu.',
  davranisci:  'Psikoterapi yöntemlerini bilimsel teste açtı; fobi, OKB ve davranış sorunlarında altın standart teknikler üretti.',
  bilissel:    'Düşüncenin duygu ve davranış üzerindeki belirleyici rolünü kanıtladı; "şema" ve "otomatik düşünce" evrensel klinik dil oldu.',
  bdt:         'Bilişsel ve davranışsal müdahaleleri tek protokolde birleştirdi; en geniş RCT literatürüne sahip modalite oldu.',
  act:         'Semptom yerine işlevselliği hedefleyen ilk transdiagnostik çerçeveyi kurdu; psikolojik esneklik kavramını klinik pratiğe soktu.',
  dbt:         'İntihar davranışını azaltan ilk kanıtlanmış terapi; duygu düzensizliği için diyalektik model ve beceri eğitimini sistematize etti.',
  mbct:        'Farkındalık meditasyonunu klinik protokole entegre etti; tekrarlayan depresyonda relapsı %40–50 azalttı.',
  schema:      'Kişilik bozukluklarında BDT\'nin sınırlı kaldığı boşluğu doldurdu; çocukluk ihtiyaçlarını tedavinin merkezine aldı.',
  cft:         'Psikopatolojiye evrimsel biyolojik bakışı getirdi; utanç ve özeleştiri üzerinde hedefli müdahale geliştirdi.',
};

// Dalga geçiş köprüsü — "Bu dalgayı doğuran paradigma sorusu"
const DALGA_KOPRUSU: Partial<Record<Dalga, string>> = {
  birinci: '❓ "Bilinçdışını test edemiyoruz — gözlemlenebilir davranışı bilimsel olarak değiştiremez miyiz?"',
  ikinci:  '❓ "Sadece davranışı değiştirmek yeterli değil — düşünceler de duyguyu belirliyor, onları da değiştirmeliyiz."',
  ucuncu:  '❓ "Düşüncenin içeriğini değiştirmek her zaman işe yaramıyor — belki içerikle değil, düşünceyle ilişkimizi değiştirmeliyiz."',
};

function KatmanGorunumu({ filtre }: { filtre: Dalga | 'hepsi' }) {
  const [aciklar, setAciklar] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setAciklar(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // Grupla: önce dalgaya göre sırala, her dalga geçişinde köprü göster
  const sirali = filtre === 'hepsi' ? EKOLLER : EKOLLER.filter(e => e.dalga === filtre);

  // Dalga değişimlerini bul
  const elemanlar: Array<{ type: 'ekol'; ekol: Ekol } | { type: 'kopru'; dalga: Dalga; label: string }> = [];
  let oncekiDalga: Dalga | null = null;
  for (const ekol of sirali) {
    if (ekol.dalga !== oncekiDalga) {
      if (oncekiDalga !== null && DALGA_KOPRUSU[ekol.dalga]) {
        elemanlar.push({ type: 'kopru', dalga: ekol.dalga, label: DALGA_KOPRUSU[ekol.dalga]! });
      }
      oncekiDalga = ekol.dalga;
    }
    elemanlar.push({ type: 'ekol', ekol });
  }

  // Dalga renk şeması
  const DALGA_BAR: Record<Dalga, { bar: string; label: string; dot: string }> = {
    koken:   { bar: 'bg-purple-900/30 border-purple-700/30', label: 'Kök', dot: 'bg-purple-500' },
    birinci: { bar: 'bg-blue-900/30   border-blue-700/30',   label: '1. Dalga', dot: 'bg-blue-500' },
    ikinci:  { bar: 'bg-green-900/30  border-green-700/30',  label: '2. Dalga', dot: 'bg-green-500' },
    ucuncu:  { bar: 'bg-amber-900/30  border-amber-700/30',  label: '3. Dalga', dot: 'bg-amber-500' },
  };

  let suankiDalga: Dalga | null = null;

  return (
    <div className="space-y-0">
      {elemanlar.map((item, idx) => {
        if (item.type === 'kopru') {
          return (
            <div key={`kopru-${item.dalga}`} className="relative py-4 flex flex-col items-center">
              {/* Dikey çizgi yukarı */}
              <div className="w-px h-5 bg-white/10" />
              {/* Pivot kutusu */}
              <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 max-w-xl text-center">
                <p className="text-xs text-white/50 leading-relaxed italic">{item.label}</p>
              </div>
              {/* Dikey çizgi aşağı */}
              <div className="w-px h-5 bg-white/10" />
            </div>
          );
        }

        const { ekol } = item;
        const dalgaDegisti = ekol.dalga !== suankiDalga;
        if (dalgaDegisti) suankiDalga = ekol.dalga;
        const db = DALGA_BAR[ekol.dalga];
        const open = aciklar.has(ekol.id);

        return (
          <div key={ekol.id}>
            {/* Dalga başlığı — ilk kez görüldüğünde */}
            {dalgaDegisti && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-x border-t ${db.bar} mt-1`}>
                <div className={`w-2 h-2 rounded-full ${db.dot}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  {db.label} — {DALGALAR[ekol.dalga].aciklama}
                </span>
              </div>
            )}

            {/* Ekol kartı */}
            <div className={`border ${ekol.kenarlık} ${dalgaDegisti ? 'rounded-b-xl border-t-0' : 'rounded-xl mt-1'} ${ekol.renk} transition-all`}>
              <button onClick={() => toggle(ekol.id)} className="w-full flex items-start gap-4 px-5 py-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono text-white/40">{ekol.donem}</span>
                    <h3 className="text-sm font-semibold text-white">{ekol.ad}</h3>
                    <span className="text-[10px] text-white/40">— {ekol.kurucular}</span>
                  </div>
                  <p className="text-xs text-white/60 mt-1 italic">"{ekol.slogan}"</p>
                </div>
                <div className="flex-shrink-0 text-white/30 mt-1">
                  {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Katki özeti — her zaman görünür */}
              <div className={`px-5 pb-3 flex gap-2 items-start`}>
                <span className="text-green-400 text-xs mt-0.5 flex-shrink-0">✦</span>
                <p className="text-xs text-white/50 leading-relaxed">{KATKI_OZETI[ekol.id]}</p>
              </div>

              {/* Genişletilmiş detaylar */}
              {open && (
                <div className={`border-t ${ekol.kenarlık} px-5 py-4 space-y-3`}>
                  <Grid label="Zihin Modeli"    value={ekol.zihinModeli} />
                  <Grid label="Patoloji Görüşü" value={ekol.patolojiGorusu} />
                  <Grid label="Terapötik Hedef" value={ekol.terapotikHedef} />
                  <Grid label="Terapist Rolü"   value={ekol.terapistRolu} />
                  <div>
                    <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Teknikler</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ekol.teknikler.map(t => (
                        <span key={t} className={`text-xs px-2 py-0.5 rounded-full border ${ekol.kenarlık} text-white/60 ${ekol.acikRenk}`}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white/5 p-3">
                      <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-1">✦ Katkı</p>
                      <p className="text-xs text-white/70 leading-relaxed">{ekol.katki}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">⚠ Sınırlılık</p>
                      <p className="text-xs text-white/70 leading-relaxed">{ekol.sinirlilik}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Ana bileşen
───────────────────────────────────────────────────────────── */

type Gorunu = 'katman' | 'zaman' | 'karsilastir';

export default function EkolKarsilastirma() {
  const [gorunu, setGorunu] = useState<Gorunu>('katman');
  const [aciklar, setAciklar] = useState<Set<string>>(new Set());
  const [filtreDalga, setFiltreDalga] = useState<Dalga | 'hepsi'>('hepsi');
  const [secili, setSecili] = useState<string[]>([]);

  const toggle = (id: string) => {
    setAciklar(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSecili = (id: string) => {
    setSecili(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const gosterilenEkoller = filtreDalga === 'hepsi'
    ? EKOLLER
    : EKOLLER.filter(e => e.dalga === filtreDalga);

  const tumunuAc = () => setAciklar(new Set(gosterilenEkoller.map(e => e.id)));
  const tumunuKapat = () => setAciklar(new Set());

  return (
    <div className="act-fade-in min-h-screen bg-[#1B1A18] text-white">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Başlık */}
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-white/50" />
            Terapi Ekolü Karşılaştırma Katmanları
          </h2>
          <p className="text-sm text-white/40 mt-1">
            Psikanaliz'den 3. dalgaya — her ekolün üzerine inşa ettiği zemini ve getirdiği kırılmayı görün.
          </p>
        </div>

        {/* Dalga özeti */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(DALGALAR) as [Dalga, typeof DALGALAR['koken']][]).map(([key, d]) => (
            <button
              key={key}
              onClick={() => setFiltreDalga(filtreDalga === key ? 'hepsi' : key)}
              className={`rounded-xl border p-3 text-left transition-all ${
                filtreDalga === key
                  ? 'border-white/30 bg-white/10'
                  : 'border-white/8 bg-white/3 hover:bg-white/6'
              }`}
            >
              <p className={`text-xs font-semibold mb-1 ${d.renk}`}>{d.label}</p>
              <p className="text-[10px] text-white/40 leading-snug">{d.aciklama}</p>
            </button>
          ))}
        </div>

        {/* Görünüm & aksiyonlar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 rounded-lg border border-white/10 p-1">
            <button
              onClick={() => setGorunu('katman')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                gorunu === 'katman' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Katman Görünümü
            </button>
            <button
              onClick={() => setGorunu('zaman')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                gorunu === 'zaman' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Zaman Çizelgesi
            </button>
            <button
              onClick={() => setGorunu('karsilastir')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                gorunu === 'karsilastir' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" /> Karşılaştır
            </button>
          </div>

          {gorunu === 'zaman' && (
            <div className="flex gap-2">
              <button onClick={tumunuAc}    className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2">Tümünü aç</button>
              <button onClick={tumunuKapat} className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2">Tümünü kapat</button>
            </div>
          )}

          {gorunu === 'karsilastir' && (
            <p className="text-xs text-white/30">
              {secili.length === 0 ? 'Tüm ekoller gösteriliyor' : `${secili.length} ekol seçili`}
            </p>
          )}
        </div>

        {/* Katman görünümü */}
        {gorunu === 'katman' && <KatmanGorunumu filtre={filtreDalga} />}

        {/* Zaman çizelgesi görünümü */}
        {gorunu === 'zaman' && (
          <div className="relative space-y-3">
            {/* Dikey çizgi */}
            <div className="absolute left-[28px] top-3 bottom-3 w-px bg-white/8 pointer-events-none" />

            {gosterilenEkoller.map(e => (
              <div key={e.id} className="relative pl-14">
                {/* Dalga başlığı değişiminde */}
                <EkolKart
                  ekol={e}
                  open={aciklar.has(e.id)}
                  onToggle={() => toggle(e.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Karşılaştırma görünümü */}
        {gorunu === 'karsilastir' && (
          <div className="space-y-4">
            {/* Ekol seçici */}
            <div className="rounded-xl border border-white/8 p-4">
              <p className="text-xs text-white/40 mb-3">Karşılaştırmak istediğin ekoller (boş = hepsi):</p>
              <div className="flex flex-wrap gap-2">
                {EKOLLER.map(e => (
                  <button
                    key={e.id}
                    onClick={() => toggleSecili(e.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      secili.includes(e.id)
                        ? `${e.kenarlık} ${e.renk} text-white`
                        : 'border-white/10 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {e.ad}
                  </button>
                ))}
              </div>
            </div>

            <KarsilastirmaTablosu secili={secili} />
          </div>
        )}

        {/* Evrimsel özet */}
        <div className="rounded-xl border border-white/8 bg-white/3 p-5 space-y-3">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-3.5 h-3.5" /> Evrimsel Kırılma Noktaları
          </p>
          {[
            { yil: '~1950', metin: 'Psikanaliz → Davranışçılık: "Bilinçdışını değil, davranışı ölç ve değiştir."' },
            { yil: '~1960', metin: 'Davranışçılık → Bilişsel: "Düşünceler gözlemlenemez ama ölçülebilir; onlar da değişmeli."' },
            { yil: '~1980', metin: 'Bilişsel + Davranışçı → BDT: Her iki katmanı birleştiren entegre protokol.' },
            { yil: '~1990', metin: 'BDT → 3. Dalga: "İçeriği değiştirmeye çalışmak bazen işe yaramıyor; kabul ve ilişkiyi değiştir."' },
            { yil: '2000+', metin: 'ACT · DBT · MBCT · CFT · Şema: Her biri farklı bir boyutu (değer, duygu, farkındalık, şefkat, ihtiyaç) derinleştirdi.' },
          ].map(item => (
            <div key={item.yil} className="flex gap-3">
              <span className="text-[11px] font-mono text-white/30 w-12 flex-shrink-0 pt-0.5">{item.yil}</span>
              <p className="text-xs text-white/60 leading-relaxed">{item.metin}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
