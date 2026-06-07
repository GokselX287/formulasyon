/* =====================================================================
   Danışan Raporu — Örnek Veri Modeli (ProfilData)
   "Danışan Raporu.html" içindeki window.PROFIL_DATA'dan birebir çıkarıldı.
   Server'dan gelecek gerçek veri bu şekle birebir uymalı.
   (Tip tanımı için README.md → "Veri Modeli" bölümüne bakın.)
   ===================================================================== */
export const PROFIL_DATA = {

  client: {
    vakaNo: 8,
    sessionCount: 12,
    firstName: "Elif",
    lastName: "Yıldırım",
    age: 29,
    gender: "Kadın",
    occupation: "Grafik Tasarımcı",
    tags: ["Sosyal kaygı", "Maruziyet", "Mükemmeliyetçilik"],
    nextSessionLabel: "2026.05.31 · 10:00"
  },

  // Giriş bağlamı: 'havuz' → geri = "Günün seansları"; aksi → "Danışanlar"
  from: "havuz",
  focus: null,                 // 'seanslar' → açılışta #seans-kayitlari'na kaydır
  activeSection: "sorun",

  sidebar: [
    { num: "01", key: "profil",      label: "Profil",          status: "tamam", anchor: "idCard" },
    { num: "02", key: "sorun",       label: "Sorun & Hedef",   status: "aktif", anchor: "sorun" },
    { num: "03", key: "bariyerler",  label: "Bariyerler",      status: "3 öğe", anchor: "bariyerler" },
    { num: "04", key: "esneklik",    label: "Esneklik",        status: "taslak", anchor: "esneklik" },
    { num: "05", key: "degerler",    label: "Değerler",        status: "tamam", anchor: "degerler" },
    { num: "06", key: "gucluler",    label: "Güçlü yanlar",    status: "tamam", anchor: "bariyerler" },
    { num: "07", key: "hikaye",      label: "Hikaye",          status: "taslak", anchor: "hikaye" },
    { num: "08", key: "mudahaleler", label: "Müdahaleler",     status: "5 öğe", anchor: "mudahaleler" },
    { num: "09", key: "iliski",      label: "İlişki",          status: "yeni",  anchor: "iliski" },
    { num: "10", key: "formulasyon", label: "4P Formülasyon",  status: "aktif", anchor: "formulasyon" }
  ],

  // Danışan Hikayesi — öne çıkan alıntı
  story: {
    status: "taslak · 4 dk önce",
    preQuote: "Sunum sırasında eli titrediğinde, ",
    accentItalicPhrase: "“herkesin onu bir sahtekâr olarak gördüğüne”",
    postQuote: " dair eski bir sahne yeniden canlanıyor; oysa odadaki kimse fark etmemişti.",
    meta: "elif y. · 7. seans · 2026.05.17",
    metaTail: "aktarılan içgörü"
  },

  // Temel Varsayım / hero quote
  heroQuote: {
    eyebrowTerapist: "danışanın sürecini kolaylaştırmak için · temel varsayım",
    eyebrowDanisan: "üzerinde birlikte çalıştığımız düşünce",
    preQuote: "“Eğer hata yaparsam, ",
    accentPhrase: "değersiz olduğum",
    postQuote: " ortaya çıkar.”",
    description: "Bu temel varsayım performans, ilişki ve öz-değer alanlarını birbirine bağlıyor. Çalışma hedefi: düşünceyi bir gerçeklik değil, zihnin ürettiği bir kural olarak görebilmek (defüzyon) ve değerli eylemleri hatadan bağımsız sürdürebilmek.",
    primaryCta: "Brief oluştur",
    secondaryCta: "Formülasyon hub"
  },

  // Temel sorunlar ve terapi hedefleri (hero kart) — sorun → hedef
  problemsGoals: {
    head: { terapist: "Temel sorunlar ve terapi hedefleri", danisan: "Üzerinde birlikte çalıştıklarımız" },
    problemsLabel: { terapist: "Temel sorunlar", danisan: "Zorlandığın konular" },
    goalsLabel:    { terapist: "Terapi hedefleri", danisan: "Birlikte hedeflerimiz" },
    problems: [
      { label: "Sosyal kaygı",
        note: "Değerlendirilme ve fark edilme korkusu" },
      { label: "Mükemmeliyetçilik",
        note: "“Hatasız olmalıyım” kuralı ve sert öz-eleştiri" },
      { label: { terapist: "Deneyimsel kaçınma", danisan: "Kaçınma" },
        note: { terapist: "Kaygı yükselince ortamdan ve temastan geri çekilme", danisan: "Zorlanınca geri çekilme eğilimi" } }
    ],
    goals: [
      { label: { terapist: "Defüzyon", danisan: "Düşünceyle araya mesafe" },
        note: { terapist: "Düşünceyi gerçeklik değil, zihnin ürettiği bir kural olarak görmek", danisan: "Bir düşünceyi gerçek değil, sadece bir düşünce olarak görebilmek" } },
      { label: { terapist: "Kabul", danisan: "Duyguya alan açmak" },
        note: { terapist: "Deneyimsel kaçınmayı azaltıp duyguya alan açmak", danisan: "Zor duygulara alan açıp onlardan kaçmamak" } },
      { label: "Değerli eylem",
        note: { terapist: "Kaygıyla birlikte değerli yönde adım atmayı sürdürmek", danisan: "Kaygıyla birlikte senin için önemli olanı yapmak" } }
    ]
  },

  // Seans Kayıtları (detaylı; en yeni üstte)
  sessionRecords: [
    {
      seansNo: 12, date: "2026.05.24", title: "Sahne provası — küçük maruziyet",
      modality: "ACT · Maruziyet", durationMin: 50,
      summary: "Toplantıda fikir sunma senaryosu canlı provayla çalışıldı. Kaygı yükselirken değer (otantiklik) yönünde kalma denendi; defüzyon ifadesi (“…düşüncesine sahibim”) seans içinde tutarlı kullanıldı.",
      interventions: ["Defüzyon", "Değer merdiveni", "Dereceli maruziyet"],
      homework: ["Haftada 1 kez ekip toplantısında fikir paylaş", "Kaygı yükselince 3 dk şimdiki an demiri"],
      suds: 4, mood: 7
    },
    {
      seansNo: 11, date: "2026.05.17", title: "Mükemmeliyetçilik kuralının haritalanması",
      modality: "BDT · Formülasyon", durationMin: 50,
      summary: "“Hatasız olmalıyım” kuralının maliyet–kazanç dengesi çıkarıldı. Kuralın koruyucu işlevi kabul edildi, esnek alternatif birlikte yazıldı.",
      interventions: ["Sokratik sorgulama", "Kural kartı"],
      homework: ["Günlük 1 ‘yeterince iyi’ örneği not et"],
      suds: 5, mood: 6
    },
    {
      seansNo: 10, date: "2026.05.10", title: "Değerler pusulası",
      modality: "ACT · Değerler", durationMin: 50,
      summary: "Yaşam alanları üzerinden değer açıklığı çalışıldı; otantiklik, yakınlık ve ustalık öne çıktı. Değer–eylem boşluğu belirlendi.",
      interventions: ["Değerler kartı", "Yaşam pastası"],
      homework: ["Bir değerli eylemi takvime koy"],
      suds: 5, mood: 6
    },
    {
      seansNo: 9, date: "2026.05.03", title: "Şimdiki an & ayrışmanın pekiştirilmesi",
      modality: "ACT · Farkındalık", durationMin: 50,
      summary: "Tetiklenme anında bedene ve nefese dönme pratiği yapıldı. Düşünceyle özdeşleşme azaldığında seçim alanının genişlediği fark edildi.",
      interventions: ["Demirleme (5-4-3-2-1)", "Nefes farkındalığı"],
      homework: ["Günde 2 kez 3 dk demirleme"],
      suds: 5, mood: 6
    },
    {
      seansNo: 8, date: "2026.04.26", title: "Kırılma & onarım",
      modality: "Süreç · İttifak", durationMin: 50,
      summary: "Bir önceki seanstaki yanlış anlaşılma açıkça konuşuldu. İlişkide onarım deneyimi, ‘hata sonrası terk edilme’ şemasına canlı bir karşı-kanıt oldu.",
      interventions: ["İttifak onarımı", "Şema köprüsü"],
      homework: ["Onarım anını günlüğe yaz"],
      suds: 6, mood: 5
    },
    {
      seansNo: 7, date: "2026.04.19", title: "İlk maruziyet provası",
      modality: "BDT · Maruziyet", durationMin: 50,
      summary: "Düşük yoğunluklu sosyal senaryo (kısa söz alma) hayalde kademeli çalışıldı. Güvenlik davranışları (prova etme, göz kaçırma) belirlenip azaltıldı.",
      interventions: ["Maruziyet hiyerarşisi", "Güvenlik davranışı analizi"],
      homework: ["Bir toplantıda tek cümle söyle"],
      suds: 7, mood: 5
    },
    {
      seansNo: 6, date: "2026.04.12", title: "Defüzyon — düşünceden ayrışma",
      modality: "ACT · Defüzyon", durationMin: 50,
      summary: "“Yetersizim” düşüncesiyle çalışmak için ayrışma teknikleri denendi; düşüncenin bir gerçeklik değil zihin ürünü olduğu deneyimsel olarak görüldü.",
      interventions: ["“…düşüncesine sahibim”", "Yaprak-dere imgelemi"],
      homework: ["Sert öz-eleştiri anında etiketleme: ‘bu bir düşünce’"],
      suds: 6, mood: 5
    },
    {
      seansNo: 5, date: "2026.04.05", title: "Kabul & deneyimsel kaçınma",
      modality: "ACT · Kabul", durationMin: 50,
      summary: "Kaygıdan kaçınmanın kısa vadeli rahatlama, uzun vadeli daralma yarattığı haritalandı. Duyguya alan açma metaforuyla çalışıldı.",
      interventions: ["Yaratıcı umutsuzluk", "Konuk metaforu"],
      homework: ["Kaçındığın 1 durumu fark et ve not al"],
      suds: 7, mood: 4
    },
    {
      seansNo: 4, date: "2026.03.29", title: "Bilişsel çarpıtmalar & yeniden çerçeveleme",
      modality: "BDT", durationMin: 50,
      summary: "Siyah-beyaz düşünce ve aşırı genelleme örnekleri belirlendi. Tek hatadan ‘her şey berbat’ çıkarımı sınandı, dengeli alternatif üretildi.",
      interventions: ["Çarpıtma listesi", "Kanıt sorgulama"],
      homework: ["Haftada 3 dengeli alternatif düşünce yaz"],
      suds: 6, mood: 5
    },
    {
      seansNo: 3, date: "2026.03.22", title: "Düşünce–duygu–davranış kaydı",
      modality: "BDT · İzlem", durationMin: 50,
      summary: "Kaygı döngüsü somut bir örnekle çözümlendi. Tetikleyen, otomatik düşünce, beden duyumu ve kaçınma zinciri birlikte çıkarıldı.",
      interventions: ["ABC kaydı", "Psikoeğitim"],
      homework: ["Günlük 1 ABC kaydı tut"],
      suds: 7, mood: 4
    },
    {
      seansNo: 2, date: "2026.03.15", title: "Vaka formülasyonu & psikoeğitim",
      modality: "Formülasyon", durationMin: 50,
      summary: "Sosyal kaygının sürdürücü mekanizmaları (kaçınma, onay arama) paylaşıldı. Ortak hedefler ve tedavi planı üzerinde anlaşıldı.",
      interventions: ["4P formülasyon", "Hedef belirleme"],
      homework: ["Hedef listesini gözden geçir"],
      suds: 7, mood: 4
    },
    {
      seansNo: 1, date: "2026.03.08", title: "İlk görüşme & değerlendirme",
      modality: "Değerlendirme", durationMin: 60,
      summary: "Başvuru nedeni, öykü ve işlevsellik değerlendirildi; sosyal değerlendirilme korkusu ön planda. Ölçek bataryası uygulandı, ittifak kuruldu.",
      interventions: ["Klinik görüşme", "Ölçek bataryası"],
      homework: ["İlk hafta kaygı günlüğü"],
      suds: 8, mood: 3
    }
  ],

  // Güçlü & Zayıf (bariyerler)
  strengthsWeaknesses: {
    strengths: [
      { label: "Yüksek içgörü", detail: "Düşünce–duygu–davranış zincirini hızlı fark ediyor; seans dışı gözlem yapabiliyor." },
      { label: "Değer netliği", detail: "Otantiklik ve yakınlık güçlü pusula; değerli eylemlere istekli." },
      { label: "Ev ödevi uyumu", detail: "Verilen ödevleri düzenli getiriyor, üzerine düşünüyor." }
    ],
    weaknesses: [
      { label: "Deneyimsel kaçınma", detail: "Kaygı yükseldiğinde ortamdan/temastan geri çekilme eğilimi." },
      { label: "Aşırı genelleme", detail: "Tek bir hatayı ‘her şey berbat’ olarak okuma; siyah-beyaz değerlendirme." },
      { label: "Onay arama", detail: "Karar verirken dış onaya yüksek bağımlılık." }
    ]
  },

  // 4P Formülasyon
  fourP: [
    { key: "predispozan", num: "01", label: "Travmalar, Olumsuz Deneyimler", sub: "predispozan",
      body: "Eleştirel ve yüksek beklentili aile ortamı; erken dönemde koşullu değer öğrenmesi.",
      chips: ["Koşullu sevgi", "Yüksek standart"] },
    { key: "presipitan", num: "02", label: "Tetikleyici", sub: "presipitan", accent: true,
      body: "Yeni pozisyonda ilk büyük sunum ve ardından gelen kamusal görünürlük artışı.",
      chips: ["Terfi", "Sunum"] },
    { key: "perpetuan", num: "03", label: "Sürdürücü", sub: "perpetuan",
      body: "Kaçınma ve onay arama davranışları kısa vadede rahatlatıp inancı uzun vadede besliyor.",
      chips: ["Kaçınma", "Güvence arama"] },
    { key: "protektif", num: "04", label: "Koruyucu", sub: "protektif", good: true,
      body: "Güçlü değer pusulası, destekleyici partner ilişkisi ve yüksek terapi uyumu.",
      chips: ["Değerler", "Sosyal destek"] }
  ],

  // Esneklik (ACT Hexaflex) — eksen adları sade dil ile birlikte
  flexibility: {
    headline: "Psikolojik esneklik profili",
    score: 6.2,
    description: "Defüzyon ve şimdiki an gelişiyor; en zorlanılan alan kabul (deneyimsel kaçınma). Değerler güçlü bir kaldıraç.",
    axes: [
      { name: "Defüzyon",      sade: "Düşüncelerden ayrışma", value: 6 },
      { name: "Kabul",         sade: "Duyguya alan açma",      value: 4 },
      { name: "Şimdiki an",    sade: "Ana dönme",              value: 7 },
      { name: "Bağlam-benlik", sade: "Gözlemleyen benlik",     value: 5 },
      { name: "Değerler",      sade: "Senin için önemli olan", value: 8 },
      { name: "Eylem",         sade: "Değerlere göre adım",    value: 6 }
    ]
  },

  // Değerler
  values: [
    { label: "Otantiklik", level: "Çok güçlü", strength: 90, note: "Olduğu gibi görünebilme; rol yapmadan var olma." },
    { label: "Yakınlık",   level: "Güçlü",     strength: 78, note: "Yakın ilişkilerde derin temas ve açıklık." },
    { label: "Ustalık",    level: "Gelişiyor", strength: 64, note: "İşinde derinleşme ve öğrenme arzusu." },
    { label: "Katkı",      level: "Orta",      strength: 52, note: "Başkalarının gelişimine destek olma isteği." }
  ],

  // ACT Matrix (Pusula & ACT matrisi — eksenli serbest yerleşim)
  actMatrix: {
    centerLabel: "Ben — fark ediyorum",
    centerSub: "gözlemleyen benlik",
    axes: {
      left:  { tr: "Uzağa", en: "Away" },
      right: { tr: "Yöne",  en: "Toward" },
      top:    { terapist: "Gözlenebilir davranış", danisan: "Dışarıdan görülebilen — yaptıkların" },
      bottom: { terapist: "İçsel deneyim",          danisan: "İçeride olup biten — düşünce ve duygular" }
    },
    // pos: grid yerleşimi · side: away/toward · num: Polk referans numarası
    quadrants: [
      { pos: "br", num: "01", side: "toward", sideLabel: "Yöne", layerLabel: "İçsel deneyim: Hayatı Anlamlı Kılan Değerler",
        q_terapist: "Senin için kim ya da ne önemli?",
        q_danisan:  "Senin için kim ya da ne önemli?",
        items: [
          "Olduğu gibi, rol yapmadan görünebilmek",
          "Partneriyle açık ve yakın bir ilişki",
          "İşinde derinleşmek, ustalaşmak",
          "Yakın arkadaşlıklarını sürdürmek"
        ] },
      { pos: "bl", num: "02", side: "away", sideLabel: "Uzağa", layerLabel: "İçsel deneyim: Düşünce, His, Olay (Tetikleyenler)",
        q_terapist: "İçeride yolunu kesen ne? (istenmeyen düşünce ve duygular)",
        q_danisan:  "İçeride yolunu kesen ne oluyor?",
        items: [
          "“Herkes beni sahtekâr olarak görüyor” düşüncesi",
          "“Hata yaparsam değersizim” kuralı",
          "Sunum öncesi mide kasılması, el titremesi",
          "Yüz kızarması ve fark edilme korkusu"
        ] },
      { pos: "tl", num: "03", side: "away", sideLabel: "Uzağa", layerLabel: "Davranış: Hayatı Anlamsızlaştıran Alışkanlıklar/Tepkiler",
        q_terapist: "Şimdiye dek bunlardan uzaklaşmak için ne yaptın?",
        q_danisan:  "Zorlanınca genelde ne yapıyorsun?",
        items: [
          "Toplantıda fikrini söylememek",
          "Göz temasından ve sahne almaktan kaçınmak",
          { label: "İşi defalarca kontrol edip teslimi ertelemek", sade: "İşi defalarca kontrol edip teslimi ertelemek" },
          "Sosyal davetleri geri çevirmek"
        ] },
      { pos: "tr", num: "04", side: "toward", sideLabel: "Yöne", layerLabel: "Davranış: Hayatı Anlamlı Hale Getiren Alışkanlık ve Tepkiler",
        q_terapist: "Önemli olana doğru, bu içsel deneyimlerle birlikte hangi davranışları yapabilirsin?",
        q_danisan:  "Senin için önemli olana doğru hangi adımları atabilirsin?",
        items: [
          { label: "Haftada 1 kez toplantıda fikir paylaşmak", sade: "Haftada bir kez toplantıda fikrini söylemek" },
          { label: "Kaygı yükselince 3 dk şimdiki an demiri", sade: "Kaygı yükselince birkaç dakika ana dönmek" },
          { label: "“…düşüncesine sahibim” defüzyon ifadesi", sade: "“Bu yalnızca bir düşünce” deyip araya mesafe koymak" },
          { label: "Bir değerli eylemi takvime koymak", sade: "Önemsediğin bir şeyi takvime koymak" }
        ] }
    ],
    homework: {
      terapist: "Hafta boyunca kısa anlarda dur ve fark et: şu an uzağa mı, yöne mi hareket ediyorum? Hangi davranış, hangi içsel deneyimle birlikte?",
      danisan:  "Bu hafta gün içinde durup fark et: şu an senin için önemli olandan uzağa mı, ona doğru mu gidiyorsun?"
    }
  },

  // Benlik & Algı Haritası — karşılaştırma (düzenlenebilir → onSaveBenlikAlgisi)
  benlikAlgisi: {
    bar: { title: "Benlik & Algı Haritası", meta: "İç öz-algı · Dış sosyal sunum · Algı farkı" },
    self: {
      title: "Kendi Gözünden",
      sub: "İç dünya · öz-algı · gizli gerçeklik",
      labels: ["Yetersizim", "Sevilmiyorum", "Bir yükten ibaret"],
      scales: [
        { name: "Öz-değer", lo: "Çökmüş", hi: "Sağlam", value: 28 },
        { name: "Duygusal duyarlılık", lo: "Düşük", hi: "Çok yüksek", value: 80 }
      ],
      note: "Kendini sürekli ölçülen, yetersiz ve sevilmeye değmeyen biri olarak anlatıyor; başarılarını küçümsüyor, hatalarını kanıt gibi topluyor. Gözlemleyen benlik anlarında bunun bir ‘hikâye’ olduğunu fark edebiliyor."
    },
    outer: {
      title: "Dış Gözden",
      sub: "Sosyal sunum · başkalarının izlenimi",
      labels: ["Çok anlayışlı", "Güçlü görünüyor", "Bağımsız"],
      scales: [
        { name: "Sosyal sunum", lo: "İçe kapalı", hi: "Yetkin", value: 64 },
        { name: "Sosyal etki / yük", lo: "Silik", hi: "Baskın", value: 80 }
      ],
      note: "Yakınları ve seans gözlemleri onu sıcak, yetkin ve güvenilir olarak tanımlıyor; zorlandığını dışarıdan belli etmiyor. Bu olumlu izlenim içsel yetersizlik anlatısıyla zıt — asıl klinik çalışma bu farkta."
    }
  },

  // Müdahaleler
  interventions: [
    { romanNum: "I",   title: "Yaprak metaforu (defüzyon)", modality: "ACT",  durationMin: 12, outcome: "yararli" },
    { romanNum: "II",  title: "Dereceli maruziyet hiyerarşisi", modality: "BDT", durationMin: 20, outcome: "yararli" },
    { romanNum: "III", title: "Maliyet–kazanç analizi", modality: "BDT", durationMin: 15, outcome: "notr" },
    { romanNum: "IV",  title: "Boş sandalye", modality: "Şema", durationMin: 18, outcome: "yararsiz" },
    { romanNum: "V",   title: "Değerler pusulası kartı", modality: "ACT", durationMin: 10, outcome: "yararli" }
  ],

  // İlişki / Klinik notlar
  relationship: {
    rupture: "8. seansta ödev üzerine gelen geri bildirimi eleştiri olarak algıladı; seans sonunda adlandırılıp onarıldı, ittifak güçlendi.",
    supervision: [
      "Maruziyet temposu danışanın değer hızıyla uyumlu mu?",
      "Terapist onay-verme davranışı, danışanın onay aramasını besliyor olabilir mi?"
    ],
    note: "İttifak güçlü. Kırılma-onarım deneyimi terapötik olarak verimli kullanılabilir. Bir sonraki blok: kabul ekseni."
  },

  // Ölçek skorları (seans bazlı)
  scaleScores: [
    { seansNo: 8, score: 6 }, { seansNo: 9, score: 5 }, { seansNo: 10, score: 5 },
    { seansNo: 11, score: 5 }, { seansNo: 12, score: 4 }
  ],

  // Yan ray — Seans Tarihçesi (kompakt; SUDS turuncu / Ruh hali yeşil)
  sessionHistory: [
    { romanNum: "VII",  seansNo: 7,  title: "İlk maruziyet provası",       date: "2026.05.17", suds: 6, mood: 6 },
    { romanNum: "VIII", seansNo: 8,  title: "Kırılma & onarım",            date: "2026.05.10", suds: 7, mood: 5 },
    { romanNum: "IX",   seansNo: 9,  title: "Değerler pusulası",           date: "2026.05.03", suds: 5, mood: 6 },
    { romanNum: "X",    seansNo: 10, title: "Mükemmeliyetçilik kuralı",    date: "2026.05.10", suds: 5, mood: 6 },
    { romanNum: "XI",   seansNo: 11, title: "Sahne provası",               date: "2026.05.17", suds: 5, mood: 6 },
    { romanNum: "XII",  seansNo: 12, title: "Küçük maruziyet",             date: "2026.05.24", suds: 4, mood: 7 },
    { romanNum: "XIII", seansNo: 13, title: "Toplantıda fikir sunma",      date: "2026.05.31", suds: null, mood: null, upcoming: true }
  ],

  railNote: "Kabul ekseni en düşük (4/10). Önümüzdeki blokta deneyimsel kaçınmayı azaltacak kısa maruziyetler + duyguya alan açma egzersizleri önceliklendirilebilir.",

  // Kitle modu kuralları
  SECTION_POLICY: {
    hikaye: "gizli", sorun: "sade", bariyerler: "kismi",
    esneklik: "sade", degerler: "acik", matrix: "acik", iliski: "kismi", formulasyon: "acik"
  }
};

/* =====================================================================
   EMPTY_PROFIL_DATA — gerçek danışanlar için boş iskelet.
   PROFIL_DATA ile AYNI ŞEKİL ama Elif'e ait kişisel içerik boşaltılmış.
   Klinik çerçeve etiketleri (4P, Hexaflex eksenleri, matris soruları,
   bölüm başlıkları, CTA'lar) korunur — bunlar kimlik değil, modeldir.
   app/profil/[id]/page.tsx bunu temel alıp üstüne GERÇEK veriyi biner;
   veri yoksa alan boş kalır (artık Elif'e düşmez).
   ===================================================================== */
export const EMPTY_PROFIL_DATA = {
  client: {
    vakaNo: 0,
    sessionCount: 0,
    firstName: "",
    lastName: "",
    age: null as number | null,
    gender: "",
    occupation: "",
    tags: [] as string[],
    nextSessionLabel: ""
  },

  from: "danisanlar",
  focus: null,
  activeSection: "sorun",

  // Bölüm iskelesi korunur; durum etiketleri nötr
  sidebar: PROFIL_DATA.sidebar.map((it) => ({ ...it, status: "" })),

  story: {
    status: "",
    preQuote: "",
    accentItalicPhrase: "",
    postQuote: "",
    meta: "",
    metaTail: ""
  },

  heroQuote: {
    // eyebrow + CTA = arayüz metni (kimlik değil) → korunur
    eyebrowTerapist: PROFIL_DATA.heroQuote.eyebrowTerapist,
    eyebrowDanisan: PROFIL_DATA.heroQuote.eyebrowDanisan,
    preQuote: "",
    accentPhrase: "",
    postQuote: "",
    description: "",
    primaryCta: PROFIL_DATA.heroQuote.primaryCta,
    secondaryCta: PROFIL_DATA.heroQuote.secondaryCta
  },

  problemsGoals: {
    head: PROFIL_DATA.problemsGoals.head,
    problemsLabel: PROFIL_DATA.problemsGoals.problemsLabel,
    goalsLabel: PROFIL_DATA.problemsGoals.goalsLabel,
    problems: [] as any[],
    goals: [] as any[]
  },

  sessionRecords: [] as any[],

  strengthsWeaknesses: {
    strengths: [] as any[],
    weaknesses: [] as any[]
  },

  // 4P kare etiketleri (model) korunur; içerik boş
  fourP: PROFIL_DATA.fourP.map((p) => ({ ...p, body: "", chips: [] as string[] })),

  // Hexaflex eksen adları (model) korunur; değerler nötr
  flexibility: {
    headline: PROFIL_DATA.flexibility.headline,
    score: 0,
    description: "",
    axes: PROFIL_DATA.flexibility.axes.map((a) => ({ ...a, value: 0 }))
  },

  values: [] as any[],

  // Matris ekseni + sorular (model) korunur; karelerin item'ları boş
  actMatrix: {
    ...PROFIL_DATA.actMatrix,
    quadrants: PROFIL_DATA.actMatrix.quadrants.map((q) => ({ ...q, items: [] as any[] }))
  },

  benlikAlgisi: {
    bar: PROFIL_DATA.benlikAlgisi.bar,
    self: {
      ...PROFIL_DATA.benlikAlgisi.self,
      labels: [] as string[],
      scales: PROFIL_DATA.benlikAlgisi.self.scales.map((s) => ({ ...s, value: 0 })),
      note: ""
    },
    outer: {
      ...PROFIL_DATA.benlikAlgisi.outer,
      labels: [] as string[],
      scales: PROFIL_DATA.benlikAlgisi.outer.scales.map((s) => ({ ...s, value: 0 })),
      note: ""
    }
  },

  interventions: [] as any[],

  relationship: {
    rupture: "",
    supervision: [] as string[],
    note: ""
  },

  scaleScores: [] as any[],

  sessionHistory: [] as any[],

  railNote: "",

  SECTION_POLICY: PROFIL_DATA.SECTION_POLICY
};

export default PROFIL_DATA;
