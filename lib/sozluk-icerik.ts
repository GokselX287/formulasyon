// ──────────────────────────────────────────────────────────────────────────
// Psikoloji Sözlüğü — ekole göre bülten içeriği
//
// Editöryel içerik koduyla birlikte gelir. Terapistin çalıştığı ekol(ler)e
// göre filtrelenir (bkz. DEFAULT_APPROACHES → primary). Yeni terim eklemek
// için ilgili ekolün `girdiler` dizisine bir nesne ekleyin.
// ──────────────────────────────────────────────────────────────────────────

export type Ekol = 'bdt' | 'act' | 'mkt' | 'cft';

export type SozlukKategori = 'Kavram' | 'Teknik' | 'Protokol' | 'Süreç' | 'Araç';

export type SozlukGirdi = {
  id: string;
  terim: string;
  kisaTanim: string;   // tek cümle — önizleme ve kart için
  govde: string;       // 2–4 cümle — tam sayfa için
  kategori: SozlukKategori;
  etiketler?: string[];
};

export type EkolBulten = {
  ekol: Ekol;
  abbr: string;        // "BDT"
  ad: string;          // "Bilişsel Davranışçı Terapi"
  sayi: number;        // bülten sayısı
  tarih: string;       // "Mayıs 2026"
  ozet: string;        // bültenin kısa tanıtımı
  girdiler: SozlukGirdi[];
};

export const SOZLUK: Record<Ekol, EkolBulten> = {
  bdt: {
    ekol: 'bdt',
    abbr: 'BDT',
    ad: 'Bilişsel Davranışçı Terapi',
    sayi: 1,
    tarih: 'Mayıs 2026',
    ozet: 'Bilişsel modelin temel kavramları, sorgulama teknikleri ve kanıta dayalı protokoller.',
    girdiler: [
      {
        id: 'bdt-bilissel-carpitmalar',
        terim: 'Bilişsel Çarpıtmalar',
        kategori: 'Kavram',
        kisaTanim: 'Gerçeği sistematik olarak çarpıtan, otomatik ve işlevsiz düşünme kalıpları.',
        govde: 'Beck\'in tanımladığı bu kalıplar arasında felaketleştirme, ya hep ya hiç düşüncesi, aşırı genelleme, zihin okuma ve etiketleme yer alır. Danışana çarpıtmayı adlandırmayı öğretmek, otomatik düşünceyle arasına mesafe koymanın ilk adımıdır.',
        etiketler: ['Beck', 'otomatik düşünce', 'şema'],
      },
      {
        id: 'bdt-sokratik-sorgulama',
        terim: 'Sokratik Sorgulama',
        kategori: 'Teknik',
        kisaTanim: 'Danışanı yönlendirmek yerine sorularla kendi düşüncesini sınamaya davet etme.',
        govde: '"Bu düşünceyi destekleyen kanıt ne? Aksini gösteren ne var? En kötü, en iyi ve en olası senaryo nedir?" gibi sorularla danışan kendi sonucuna ulaşır. Amaç düşünceyi çürütmek değil, esnekliğini artırmaktır.',
        etiketler: ['rehberli keşif', 'kanıt'],
      },
      {
        id: 'bdt-davranis-deneyi',
        terim: 'Davranış Deneyi',
        kategori: 'Teknik',
        kisaTanim: 'Bir inancı gerçek dünyada test etmek için planlanan yapılandırılmış deney.',
        govde: 'Danışanın "Ellerim titrerse herkes anlar ve beni küçümser" gibi bir tahminini kontrollü bir durumda sınamasıdır. Tahmin, sonuç ve öğrenilen birlikte kaydedilir; deneyim, sözel iknanın sağlayamadığı değişimi getirir.',
        etiketler: ['maruziyet', 'kanıt'],
      },
      {
        id: 'bdt-dusunce-kaydi',
        terim: 'Otomatik Düşünce Kaydı',
        kategori: 'Araç',
        kisaTanim: 'Durum–düşünce–duygu–davranış zincirini yazılı izleyen temel BDT formu.',
        govde: 'Danışan tetikleyici durumu, aklından geçen otomatik düşünceyi, eşlik eden duyguyu (0–100 şiddetle) ve davranışı kaydeder. Sonraki sütunlarda alternatif/dengeli düşünce ve yeniden değerlendirme eklenir.',
        etiketler: ['öz-izlem', 'ev ödevi'],
      },
      {
        id: 'bdt-erp',
        terim: 'ERP — Maruz Bırakma ve Tepki Önleme',
        kategori: 'Protokol',
        kisaTanim: 'OKB\'de kaygı uyaranına kademeli maruz kalıp kompulsiyonu yapmama.',
        govde: 'Danışan bir kaygı hiyerarşisi oluşturur ve en düşük basamaktan başlayarak tetikleyiciyle kalır, ritüeli (ör. yıkama) ertelemez. Tekrarlı maruziyetle kaygı kendiliğinden düşer (alışma) ve felaket beklentisi çürür.',
        etiketler: ['OKB', 'kaygı hiyerarşisi', 'alışma'],
      },
      {
        id: 'bdt-bilissel-uclu',
        terim: 'Bilişsel Üçlü',
        kategori: 'Kavram',
        kisaTanim: 'Beck\'in depresyon modeli: benlik, dünya ve gelecekle ilgili olumsuz görüş.',
        govde: 'Depresif danışan kendini değersiz, dünyayı aşırı talepkâr ve geleceği umutsuz olarak görür. Bu üç alandaki olumsuz şemalar otomatik düşünceleri besler; tedavi bu şemaları hedef alır.',
        etiketler: ['Beck', 'depresyon', 'şema'],
      },
      {
        id: 'bdt-4p-formulasyon',
        terim: '4P Vaka Formülasyonu',
        kategori: 'Kavram',
        kisaTanim: 'Sorunu dört eksende anlamlandıran çerçeve: zemin, tetikleyici, sürdüren ve koruyucu etkenler.',
        govde: 'Predispozan (yatkınlık yaratan geçmiş etkenler), presipitan (sorunu tetikleyen yakın olay), perpetuan (sorunu sürdüren kısır döngüler) ve protektif (danışanın güçlü yanları ve kaynakları). Bu dört "P", dağınık bilgiyi tedavi planına bağlanabilir bir bütüne dönüştürür.',
        etiketler: ['formülasyon', 'predispozan', 'perpetuan'],
      },
      {
        id: 'bdt-guvenlik-davranisi',
        terim: 'Güvenlik Davranışı',
        kategori: 'Kavram',
        kisaTanim: 'Kaygıyı anlık azaltmak için yapılan, ama korkulan inancın çürümesini engelleyerek korkuyu sürdüren davranış.',
        govde: 'Sunum yaparken notlara sıkıca tutunmak ya da panik anında bir yere yaslanmak kısa vadede rahatlatır; fakat danışan "felaket yalnızca bu önlem sayesinde olmadı" diye düşündüğü için korku sürer. Tedavide bu davranışlar fark edilip kademeli olarak bırakılır.',
        etiketler: ['kaygı', 'maruziyet', 'sürdüren etken'],
      },
      {
        id: 'bdt-davranissal-aktivasyon',
        terim: 'Davranışsal Aktivasyon',
        kategori: 'Teknik',
        kisaTanim: 'Depresyonda, ruh hali iyileşene kadar beklemeden değer ve haz veren etkinlikleri planlı biçimde artırma.',
        govde: 'Depresyon kaçınma ve geri çekilmeyle kendini besler. Danışan "canım isteyince" değil, programa göre küçük ve ulaşılabilir etkinlikler (yürüyüş, bir arkadaşı arama) ekler; eylem çoğu zaman motivasyondan önce gelir ve ruh halini yukarı çeker.',
        etiketler: ['depresyon', 'haz-ustalık', 'etkinlik planı'],
      },
      {
        id: 'bdt-psikoegitim',
        terim: 'Psikoeğitim',
        kategori: 'Teknik',
        kisaTanim: 'Danışana bozukluğun ve tedavinin işleyişini sade, normalleştirici bir dille anlatma.',
        govde: 'Panikteki bedensel belirtilerin tehlikeli olmadığını ya da kaygının yükselip sonra kendiliğinden düştüğünü anlatmak danışanı tedavinin ekip arkadaşı yapar. İyi psikoeğitim suçlamadan bilgilendirir, umut verir ve tedavi mantığını şeffaflaştırır.',
        etiketler: ['normalleştirme', 'işbirliği', 'tedavi mantığı'],
      },
    ],
  },

  act: {
    ekol: 'act',
    abbr: 'ACT',
    ad: 'Kabul ve Kararlılık Terapisi',
    sayi: 1,
    tarih: 'Mayıs 2026',
    ozet: 'Psikolojik esnekliğin altı temel süreci ve değer yönelimli müdahaleler.',
    girdiler: [
      {
        id: 'act-defuzyon',
        terim: 'Bilişsel Defüzyon',
        kategori: 'Süreç',
        kisaTanim: 'Düşünceleri gerçek olarak görmek yerine yalnızca düşünce olarak gözlemleme.',
        govde: 'Füzyon, "Ben yetersizim" düşüncesine onu bir gerçekmiş gibi kapılmaktır. Defüzyon teknikleri — düşünceyi yavaşça yüksek sesle söylemek, "Aklıma … düşüncesi geldi" biçiminde çerçevelemek — düşünceyle eylem arasındaki otomatik bağı gevşetir.',
        etiketler: ['Hexaflex', 'füzyon', 'dil'],
      },
      {
        id: 'act-kabul',
        terim: 'Kabul',
        kategori: 'Süreç',
        kisaTanim: 'İstenmeyen iç deneyimlerle mücadeleyi bırakıp onlara yer açma.',
        govde: 'Deneyimsel kaçınma çoğu zaman acıyı büyütür. Kabul, kaygı veya üzüntü gibi duyguları bastırmak yerine değer yönünde ilerlerken onları taşımaya isteklilik anlamına gelir — teslimiyet ya da hoşlanma değil.',
        etiketler: ['Hexaflex', 'deneyimsel kaçınma', 'isteklilik'],
      },
      {
        id: 'act-degerler',
        terim: 'Değerler',
        kategori: 'Süreç',
        kisaTanim: 'Kişiye anlamlı yönü gösteren, seçilmiş ve sürekli yaşam pusulaları.',
        govde: 'Hedeflerin aksine değerler ulaşılıp bitmez; bir yön belirtir (ör. "sevecen bir ebeveyn olmak"). ACT\'de değer netliği, kabul ve kararlı eylemi besleyen temel motivasyon kaynağıdır.',
        etiketler: ['Hexaflex', 'pusula', 'anlam'],
      },
      {
        id: 'act-kararli-eylem',
        terim: 'Kararlı Eylem',
        kategori: 'Süreç',
        kisaTanim: 'Değerler doğrultusunda, engellere rağmen sürdürülen somut davranış.',
        govde: 'Değerleri ölçülebilir hedeflere ve adımlara dönüştürmektir. Kaygı geldiğinde eylemi durdurmak yerine, değere bağlı kalarak küçük ve sürdürülebilir adımlar atılır.',
        etiketler: ['Hexaflex', 'davranış', 'hedef'],
      },
      {
        id: 'act-baglamsal-benlik',
        terim: 'Bağlamsal Benlik',
        kategori: 'Süreç',
        kisaTanim: 'Deneyimlerin içeriği değil, onları izleyen değişmez bakış açısı olarak benlik.',
        govde: '"Kavramsallaştırılmış benlik" (hikâyelerimiz, etiketlerimiz) yerine, tüm düşünce ve duyguların gelip geçtiği sabit gözlem noktasıdır. Gözlemleyen benlik de denir; satranç tahtası metaforu bu ayrımı anlatmak için kullanılır.',
        etiketler: ['Hexaflex', 'gözlemleyen benlik', 'metafor'],
      },
      {
        id: 'act-yaratici-umutsuzluk',
        terim: 'Yaratıcı Umutsuzluk',
        kategori: 'Teknik',
        kisaTanim: 'Kontrol ve kaçınma stratejilerinin işe yaramadığını fark ettiren açılış süreci.',
        govde: 'Terapi başında danışanın bugüne dek denediği kontrol çabalarının kısa vadede rahatlatıp uzun vadede sorunu büyüttüğünü birlikte gözden geçirmektir. "Belki sorun sen değil, kullandığın haritadır" içgörüsüne kapı açar.',
        etiketler: ['açılış', 'kontrol gündemi'],
      },
      {
        id: 'act-deneyimsel-kacinma',
        terim: 'Deneyimsel Kaçınma',
        kategori: 'Kavram',
        kisaTanim: 'İstenmeyen düşünce, duygu ve duyumlardan kaçma ya da onları bastırma çabası.',
        govde: 'ACT\'nin merkezindeki sorun kaynağı: kaygı, üzüntü ya da anıları kontrol etme ve uzaklaştırma çabası kısa vadede işe yarar, uzun vadede yaşamı daraltır ve acıyı büyütür. Kabul, bu kaçınmanın işlevsel alternatifidir.',
        etiketler: ['kaçınma', 'kontrol gündemi', 'isteklilik'],
      },
      {
        id: 'act-fuzyon',
        terim: 'Bilişsel Füzyon',
        kategori: 'Süreç',
        kisaTanim: 'Düşünceye, sanki birebir gerçekmiş gibi kapılıp onun davranışı yönetmesine izin verme.',
        govde: '"Ben başarısızım" düşüncesiyle füzyona geçen kişi sanki bu bir olguymuş gibi davranır ve geri çekilir. Füzyon, defüzyonun karşı kutbudur ve psikolojik esnekliğin önündeki temel engellerden biridir.',
        etiketler: ['Hexaflex', 'defüzyon', 'dil'],
      },
      {
        id: 'act-simdiki-an',
        terim: 'Şimdiki Anla Temas',
        kategori: 'Süreç',
        kisaTanim: 'Geçmiş ve geleceğe dalmak yerine, şu anda olup biteni esnek dikkatle fark etme.',
        govde: 'Hexaflex\'in altı sürecinden biridir. Ruminasyon (geçmiş) ve endişe (gelecek) dikkati daraltırken, şimdiki anla temas danışanın değerine uygun seçim yapabileceği "şimdi"yi açar. Nefes ve duyusal demirleme sık kullanılan araçlardır.',
        etiketler: ['Hexaflex', 'farkındalık', 'dikkat'],
      },
      {
        id: 'act-secim-noktasi',
        terim: 'Seçim Noktası',
        kategori: 'Araç',
        kisaTanim: 'Her anı, değere "yaklaştıran" ya da ondan "uzaklaştıran" bir davranış çatalı olarak gösteren basit şema.',
        govde: 'Russ Harris\'in yaygınlaştırdığı bu araç, tetikleyici karşısında danışanın kaçınmaya mı (uzaklaşma) yoksa değer yönünde adıma mı (yaklaşma) gittiğini görselleştirir. Seans içinde örüntüleri ve becerileri hızlıca haritalamak için kullanışlıdır.',
        etiketler: ['Harris', 'yaklaşma-uzaklaşma', 'görselleştirme'],
      },
    ],
  },

  mkt: {
    ekol: 'mkt',
    abbr: 'MKT',
    ad: 'Metakognitif Terapi',
    sayi: 1,
    tarih: 'Haziran 2026',
    ozet: 'Wells ve Matthews\'in modeli: sorun düşüncelerin içeriği değil, düşünme biçimimiz ve düşünceye dair üst-inançlarımızdır.',
    girdiler: [
      {
        id: 'mkt-metakognitif-inanclar',
        terim: 'Metakognitif İnançlar',
        kategori: 'Kavram',
        kisaTanim: 'Düşüncelerin kendisi hakkındaki inançlar — "Endişe beni hazırlar" ya da "Bu düşünceyi kontrol edemem" gibi.',
        govde: 'Olumlu üst-inançlar endişe ve ruminasyonu işe yarar görür; olumsuz üst-inançlar onları kontrol edilemez ve tehlikeli sayar. MKT, düşüncenin içeriğini sınamak yerine bu üst-inançları hedef alır.',
        etiketler: ['Wells', 'üst-inanç', 'endişe'],
      },
      {
        id: 'mkt-cas',
        terim: 'CAS — Bilişsel Dikkat Sendromu',
        kategori: 'Kavram',
        kisaTanim: 'Ruminasyon, endişe ve sürekli tehdit izlemenin oluşturduğu, sıkıntıyı sürdüren zihinsel örüntü.',
        govde: 'Cognitive Attentional Syndrome; danışan bir tetikleyiciye uzun süreli endişe/ruminasyon ve sürekli tehdit taramasıyla yanıt verir. Bu örüntü duyguyu işlenmeden tutar ve bozukluğu besler — MKT\'nin asıl tedavi hedefidir.',
        etiketler: ['Wells', 'ruminasyon', 'dikkat'],
      },
      {
        id: 'mkt-ayrik-farkindalik',
        terim: 'Ayrık Farkındalık',
        kategori: 'Teknik',
        kisaTanim: 'Bir düşünceyi fark edip ona tepki vermeden, onunla uğraşmadan geçmesine izin verme.',
        govde: 'Detached mindfulness; düşünceyi bastırmak ya da analiz etmek yerine, zihinde beliren ve geçen bir olay olarak gözlemlemektir. "Düşünce treni" ya da "geçen bulutlar" metaforlarıyla öğretilir; ruminasyon zincirini hiç başlatmamayı amaçlar.',
        etiketler: ['Wells', 'farkındalık', 'tepkisizlik'],
      },
      {
        id: 'mkt-endise-erteleme',
        terim: 'Endişe Erteleme',
        kategori: 'Teknik',
        kisaTanim: 'Gün içinde beliren endişeyi o an işlememe, belirli bir "endişe zamanına" erteleme deneyi.',
        govde: 'Danışan tetikleyici düşünceyi fark eder ama onunla hemen uğraşmaz; isterse günde 15 dakikalık ayrı bir zamana erteler. Çoğu zaman o zaman geldiğinde endişe önemini yitirir; bu, endişenin kontrol edilebilir olduğunu deneyimletir.',
        etiketler: ['Wells', 'endişe', 'kontrol deneyi'],
      },
      {
        id: 'mkt-att',
        terim: 'Dikkat Eğitimi Tekniği (ATT)',
        kategori: 'Protokol',
        kisaTanim: 'Dikkati esnek biçimde yönlendirmeyi öğreten, seslere dayalı yapılandırılmış egzersiz.',
        govde: 'Attention Training Technique; danışan farklı seslere sırayla odaklanır, dikkatini bölüştürür ve kaydırır. Amaç içe kilitlenmiş dikkati gevşetip CAS\'ı zayıflatmaktır. Düzenli pratikle bir beceri olarak gelişir.',
        etiketler: ['Wells', 'dikkat', 'egzersiz'],
      },
    ],
  },

  cft: {
    ekol: 'cft',
    abbr: 'CFT',
    ad: 'Şefkat Odaklı Terapi',
    sayi: 1,
    tarih: 'Haziran 2026',
    ozet: 'Paul Gilbert\'in modeli: yüksek utanç ve öz-eleştiriyi, yatıştırma sistemini güçlendirip öz-şefkat geliştirerek dengeleme.',
    girdiler: [
      {
        id: 'cft-uc-sistem',
        terim: 'Üç Duygu Düzenleme Sistemi',
        kategori: 'Kavram',
        kisaTanim: 'Tehdit, harekete geçiş ve yatıştırma sistemlerinin dengesi olarak duygusal yaşam.',
        govde: 'Tehdit sistemi (kaygı/öfke, koruma), harekete geçiş sistemi (arayış/başarı) ve yatıştırma sistemi (güvende hissetme, bağ). Çoğu danışanda tehdit ve harekete geçiş aşırı, yatıştırma zayıftır; CFT yatıştırma sistemini güçlendirmeyi hedefler.',
        etiketler: ['Gilbert', 'tehdit-yatıştırma', 'denge'],
      },
      {
        id: 'cft-yatistirma-sistemi',
        terim: 'Yatıştırma Sistemi',
        kategori: 'Kavram',
        kisaTanim: 'Güvende, bağlı ve sakin hissettiren; bağ kurma ve şefkatle etkinleşen duygu sistemi.',
        govde: 'Güvenli bağlanma ve dinginlikle ilişkilidir ve tehdit sistemini dengeler. Yavaş nefes, şefkatli imgelem ve nazik bir iç ses bu sistemi etkinleştirir. Klinik gelişimin temel hedeflerinden biridir.',
        etiketler: ['Gilbert', 'güvenlik', 'bağ'],
      },
      {
        id: 'cft-oz-sefkat',
        terim: 'Öz-Şefkat',
        kategori: 'Kavram',
        kisaTanim: 'Acı anında kendine, bir dosta davranır gibi anlayış ve nezaketle yaklaşma.',
        govde: 'Neff\'in tanımıyla üç bileşeni vardır: öz-nezaket (öz-eleştiri yerine), ortak insanlık (acının paylaşılan bir deneyim olduğunu görmek) ve dengeli farkındalık. Öz-acıma ya da kendini kayırmayla karıştırılmamalıdır.',
        etiketler: ['Neff', 'öz-nezaket', 'ortak insanlık'],
      },
      {
        id: 'cft-sefkatli-imgelem',
        terim: 'Şefkatli İmgelem',
        kategori: 'Teknik',
        kisaTanim: 'Şefkatli bir benlik ya da figür imgesi kullanarak yatıştırma sistemini çalıştırma.',
        govde: 'Danışan bilgece ve yargısız bir şefkatli figürü ya da kendi en şefkatli halini canlandırır ve zorlu bir ana bu perspektiften bakar. Tehdit temelli öz-eleştiriye karşı sıcak, cesaretlendiren bir iç ses geliştirmeyi amaçlar.',
        etiketler: ['Gilbert', 'imgelem', 'iç ses'],
      },
      {
        id: 'cft-utanc-oz-elestiri',
        terim: 'Utanç ve Öz-Eleştiri',
        kategori: 'Kavram',
        kisaTanim: 'CFT\'nin asıl hedefi: kişiyi kendi içinden tehdit eden sert, küçümseyen iç ses.',
        govde: 'Öz-eleştiri tehdit sistemini sürekli tetikleyerek depresyon, kaygı ve travmayı besler. CFT, eleştiriyi zorla susturmak yerine ardındaki korku ve koruma niyetini anlar; yerine şefkatli, cesaret veren bir iç ilişki kurar.',
        etiketler: ['Gilbert', 'utanç', 'iç ilişki'],
      },
    ],
  },
};

// Terapistin ana ekolleri belirlenene kadar varsayılan.
export const VARSAYILAN_EKOLLER: Ekol[] = ['bdt', 'act'];

export const EKOL_SIRASI: Ekol[] = ['bdt', 'act', 'mkt', 'cft'];

export type SozlukOnizlemeGirdi = {
  ekol: Ekol;
  abbr: string;
  girdi: SozlukGirdi;
};

// Anasayfa önizlemesi: verilen ekoller arasından dönüşümlü ilk N girdi.
export function sozlukOnizleme(ekoller: Ekol[], adet = 3): SozlukOnizlemeGirdi[] {
  const aktif = ekoller.filter((e) => SOZLUK[e]);
  if (aktif.length === 0) return [];
  const sonuc: SozlukOnizlemeGirdi[] = [];
  let i = 0;
  while (sonuc.length < adet) {
    let eklendi = false;
    for (const ekol of aktif) {
      const girdi = SOZLUK[ekol].girdiler[i];
      if (girdi) {
        sonuc.push({ ekol, abbr: SOZLUK[ekol].abbr, girdi });
        eklendi = true;
        if (sonuc.length >= adet) break;
      }
    }
    if (!eklendi) break;
    i++;
  }
  return sonuc;
}
