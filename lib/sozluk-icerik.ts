// ──────────────────────────────────────────────────────────────────────────
// Psikoloji Sözlüğü — ekole göre bülten içeriği
//
// Editöryel içerik koduyla birlikte gelir. Terapistin çalıştığı ekol(ler)e
// göre filtrelenir (bkz. DEFAULT_APPROACHES → primary). Yeni terim eklemek
// için ilgili ekolün `girdiler` dizisine bir nesne ekleyin.
// ──────────────────────────────────────────────────────────────────────────

export type Ekol = 'bdt' | 'act';

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
    ],
  },
};

// Terapistin ana ekolleri belirlenene kadar varsayılan.
export const VARSAYILAN_EKOLLER: Ekol[] = ['bdt', 'act'];

export const EKOL_SIRASI: Ekol[] = ['bdt', 'act'];

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
