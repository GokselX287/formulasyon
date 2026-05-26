'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, ChevronDown, ChevronUp, BookOpen, Clock, Tag, Trash2 } from 'lucide-react';
import SemaTerapisi from './SemaTerapisi';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

type LibEntry = {
  id: string;
  title: string;
  approach: string;
  process: string;
  duration: number;
  source?: string;
  tags: string[];
  body: string;
  isCustom?: boolean;
};

// Built-in intervention library entries
const BUILTIN_INTERVENTIONS: LibEntry[] = [
  // BDT
  {
    id: 'b1', title: 'Düşünce Kaydı (ABC Formu)', approach: 'BDT', process: 'yeniden-yapılandırma',
    duration: 30, source: 'Beck, 1979',
    tags: ['depresyon', 'kaygı', 'bilişsel'],
    body: 'Danışana aktivatör olay (A), otomatik düşünce (B) ve duygu/davranış sonucu (C) üçlüsünü kaydetmesini öğretin. Her haftaki düşünce kayıt formunu gözden geçirin, kanıt incelemesi yapın. Alternatif düşünce üretin ve duygusal rahatlama oranını karşılaştırın.',
  },
  {
    id: 'b2', title: 'Davranışsal Aktivasyon', approach: 'BDT', process: 'aktivasyon',
    duration: 45, source: 'Lewinsohn, 1974; Martell, 2001',
    tags: ['depresyon', 'motivasyon', 'kaçınma'],
    body: 'Aktivite izleme ile başlayın: danışan 1 hafta boyunca yaptığı aktiviteleri ve o anki ruh halini 0-10 arası puanlasın. Keyif (P) ve Ustalık (M) aktivitelerini kategorize edin. Keyif/ustalık aktivite planlaması yapın, küçük ve ulaşılabilir adımlarla başlayın. Sosyal geri çekilmeyi kademeli olarak azaltın.',
  },
  {
    id: 'b3', title: 'Maruz Bırakma Hiyerarşisi (ERP/Sistematik)', approach: 'BDT', process: 'maruz-bırakma',
    duration: 60, source: 'Wolpe, 1958; Foa & Kozak, 1986',
    tags: ['kaygı', 'OKB', 'fobi', 'TSSB'],
    body: '1. Kaçınılan durumların listesini çıkarın. 2. Her durumu anksiyete puanına (0-100 SUDs) göre sıralayın. 3. En düşük puanlıdan başlayarak sırayla maruz bırakma yapın. 4. Anksiyete habitüasyon eğrisini danışana gösterin. 5. Ev ödevi olarak günlük maruz bırakma pratiği verin.',
  },
  {
    id: 'b4', title: 'Sokratik Sorgulama', approach: 'BDT', process: 'yeniden-yapılandırma',
    duration: 20, source: 'Beck & Emery, 1985',
    tags: ['bilişsel', 'inançlar', 'depresyon', 'kaygı'],
    body: 'Güdümlü keşif yöntemi: danışanın inanışlarını doğrudan sorgulamak yerine merak dolu sorularla kendi çözümüne ulaşmasını sağlayın. "Bu düşünceyi destekleyen kanıtlar neler?" "Bu düşünceye karşı kanıtlar?" "Bu durumu farklı bakan biri nasıl yorumlar?" "Sonucun gerçekleşmesi ne kadar olasılık?" gibi sorular kullanın.',
  },
  {
    id: 'b5', title: 'Problem Çözme Eğitimi', approach: 'BDT', process: 'yeniden-yapılandırma',
    duration: 40, source: "D'Zurilla & Goldfried, 1971",
    tags: ['stres', 'uyum', 'depresyon', 'kaygı'],
    body: 'Adımlar: 1. Sorunu tanımlama (spesifik ve gözlemlenebilir). 2. Alternatif çözümler üretme (beyin fırtınası, yargılamadan). 3. Her çözümün olumlu/olumsuz sonuçlarını değerlendirme. 4. En iyi çözümü seçme ve uygulama planı. 5. Sonucu değerlendirme. Ev ödevi olarak problem çözme tablosu verin.',
  },
  {
    id: 'b6', title: 'Güvenlik Davranışlarını Bırakma', approach: 'BDT', process: 'maruz-bırakma',
    duration: 35, source: 'Salkovskis, 1991',
    tags: ['kaygı', 'sosyal kaygı', 'OKB', 'panik'],
    body: 'Danışanın güvenlik davranışlarını listeleyin (ör. sosyal ortamlarda çıkış yolunu kontrol etme, tehlike düşünürken ritüel). Bu davranışların kısa vadede nasıl rahatlama sağladığını, uzun vadede anksiyeteyi nasıl beslediğini psikoeğitimle açıklayın. Maruz bırakma egzersizlerinde güvenlik davranışını kademeli olarak azaltın.',
  },
  // ACT
  {
    id: 'a1', title: 'Yapraklar Üzerinde Düşünceler (Defüzyon)', approach: 'ACT', process: 'defüzyon',
    duration: 15, source: 'Hayes, Strosahl & Wilson, 2011',
    tags: ['ACT', 'defüzyon', 'ruminasyon', 'kaygı'],
    body: 'Danışana zihnini bir akarsu, düşüncelerini ise yapraklar olarak hayal etmesini söyleyin. Her düşünce bir yaprağa konur ve akarsu ile sürüklenir. Görev düşünceyle tartışmak ya da tutmak değil, sadece geçip gitmesini izlemek. 5-10 dakika uygulatın. Ardından "düşünceye yapıştığınızda ne oldu?" sorusuyla bağlam kurun.',
  },
  {
    id: 'a2', title: 'Değer Tespiti Egzersizi', approach: 'ACT', process: 'değerler',
    duration: 45, source: 'Russ Harris, ACT Kolaylaştırılmış',
    tags: ['ACT', 'değerler', 'anlam', 'motivasyon'],
    body: '"80 yaşında cenazende insanların senin hakkında ne söylemesini isterdin?" metaforunu kullanın. Ardından 10 değer alanında (aile, iş, sağlık, toplum, vb.) "Benim için önemli olan nedir?" sorusunu cevaplatın. Her alan için 1-10 arası önem ve şimdiki tutarlılık puanı verin. Boşluk analizini çalışma hedefi yapın.',
  },
  {
    id: 'a3', title: 'ACT Matriks Çalışması', approach: 'ACT', process: 'kabul',
    duration: 40, source: 'Polk & Schoendorff, 2014',
    tags: ['ACT', 'matriks', 'değerler', 'kaçınma'],
    body: 'Kağıda 4 kadranlı bir matris çizin. Dikey eksen: İç deneyim — Davranış. Yatay eksen: Uzaklaşma — Yaklaşma. Sol üst: Kaçınılan duygular/düşünceler. Sağ üst: Önemli olan değerler. Sol alt: Kaçınma davranışları. Sağ alt: Değer yönüne eylemler. Danışanın günlük örneklerini dört kadranda konumlandırın.',
  },
  {
    id: 'a4', title: 'Yaratıcı Çaresizlik (Creative Hopelessness)', approach: 'ACT', process: 'kabul',
    duration: 30, source: 'Hayes et al., 2011',
    tags: ['ACT', 'kontrol', 'kaçınma', 'başlangıç'],
    body: 'Danışana şimdiye dek kullandığı kaçınma/kontrol stratejilerini listeletin. Her stratejinin kısa vadeli ve uzun vadeli işlevselliğini değerlendirin. "Bu stratejiler size uzun vadede ne getirdi? Değerlere yaklaşmanıza yardım etti mi?" sorularıyla kontrol gündeminin işlevsizliğini fark ettirin. Alternatif olarak kabul yönelimini sunun.',
  },
  {
    id: 'a5', title: 'Bağlam Olarak Benlik (Gözlemci Ben)', approach: 'ACT', process: 'defüzyon',
    duration: 25, source: 'Hayes et al., 2011',
    tags: ['ACT', 'benlik', 'farkındalık', 'travma'],
    body: 'Satranç tahtası metaforu: Danışana "Siz satranç tahtasısınız, taşlar değil. Taşlar (düşünce, duygu) değişir; tahta her zaman aynı kalır." Ardından "Şu an düşünceni fark eden kim?" sorusuyla gözlemci benlik noktasına geçişi kolaylaştırın. "Ben X" yerine "Ben X düşüncesini fark ediyorum" cümle yapısını pratiğe alın.',
  },
  {
    id: 'a6', title: 'Şimdiki Ana Temas (Mindful Breathing)', approach: 'ACT', process: 'şimdiki-an',
    duration: 10, source: 'Segal, Williams & Teasdale, 2002',
    tags: ['ACT', 'mindfulness', 'farkındalık', 'kaygı', 'stres'],
    body: 'Danışana nefes odaklı farkındalık egzersizini öğretin: Gözleri kapatarak ya da belirli bir noktaya bakarak nefes alıp verişi takip etsin. Dikkat dağıldığında yargılamadan nefese geri dönsün. Seans içinde 5 dakika, ev ödevi olarak günde 2x10 dakika önerin. İleri düzeyde beden taraması (body scan) ekleyin.',
  },
  // DBT
  {
    id: 'd1', title: 'TIPP (Duygu Düzenleme) — DBT', approach: 'DBT', process: 'kabul',
    duration: 20, source: 'Linehan, 1993',
    tags: ['DBT', 'kriz', 'duygu', 'impulsivite'],
    body: 'T — Temperature: Soğuk suya yüz dalmak (dalma refleksi, parasempatik aktivasyon). I — Intense Exercise: Yoğun egzersiz. P — Paced Breathing: Nefes ritmi yavaşlatma (4 alış, 6 veriş). P — Paired Muscle Relaxation: Kas gevşetme. Kriz anında sırayla uygulayın. Hangi tekniğin işe yaradığını danışanla kaydedin.',
  },
  {
    id: 'd2', title: 'Diyalektik Denge — DBT', approach: 'DBT', process: 'kabul',
    duration: 30, source: 'Linehan, 2014',
    tags: ['DBT', 'diyalektik', 'kabullenme', 'değişim'],
    body: 'Danışana kabullenme ve değişim gerilimini açıklayın. "Hem şu an olduğunuz gibi kabul ediliyorsunuz, hem de değişmeniz gerekiyor" diyalektiği. Özgeçmişindeki "her şey ya iyi ya kötü" kalıplarını radyosal kabul (radical acceptance) ve değişim stratejileriyle dengeleyin.',
  },
  // Şema
  {
    id: 's1', title: 'Şema Tespiti — Soru Mektubu', approach: 'Şema Terapi', process: 'yeniden-yapılandırma',
    duration: 50, source: 'Young, Klosko & Weishaar, 2003',
    tags: ['şema', 'temel inanç', 'erken dönem', 'karakter'],
    body: 'Danışana şema envanteri (Young Schema Questionnaire) uygulayın. Yüksek puan aldığı şemaları önem sırasına göre listeleyin. Her şema için: 1. Erken dönem anılar/deneyimler. 2. Şimadaki tetikleyiciler. 3. Teslim olma, kaçınma veya aşırı telafi modları. 4. Sağlıklı yetişkin mektubu yazma egzersizi.',
  },
  {
    id: 's2', title: 'Sınırlı Yeniden Ebeveynlik', approach: 'Şema Terapi', process: 'yeniden-yapılandırma',
    duration: 60, source: 'Young et al., 2003',
    tags: ['şema', 'terapötik ilişki', 'bağlanma', 'travma'],
    body: 'Terapist, danışanın ihtiyaç duyduğu fakat erken dönemde almadığı sağlıklı ebeveynsel yanıtları sınırlı çerçevede sağlar. Cezalandırıcı ebeveyn moduna karşı sağlıklı yetişkin modunu güçlendirin. İçe atım (internalization) yoluyla danışanın zamanla kendi kendisine o yanıtı verebilmesini destekleyin.',
  },
  // Genel
  {
    id: 'g1', title: 'Psikoeğitim — Kaygı Modeli', approach: 'Genel', process: 'psikoeğitim',
    duration: 20, source: 'Clark & Beck, 2010',
    tags: ['kaygı', 'psikoeğitim', 'başlangıç', 'panik'],
    body: 'Kaygının evrimsel işlevini (savaş/kaç/don) açıklayın. Yanlış alarm sistemi metaforunu kullanın. Gerçek tehlike ve algılanan tehlike arasındaki farkı gösterin. Anksiyetenin zararlı olmadığını, fakat kısa sürede azalacağını kanıtlarla açıklayın. Aşırı nefes almayı kaçınmak yerine neden devam etmenin gerektiğini açıklayın.',
  },
  {
    id: 'g2', title: 'Derin Kas Gevşemesi (Jacobson)', approach: 'Genel', process: 'gevşeme-somatik',
    duration: 25, source: 'Jacobson, 1938; Bernstein & Borkovec, 1973',
    tags: ['gevşeme', 'kaygı', 'somatik', 'stres'],
    body: '16 kas grubunu sırayla kas-gevşe yapın. Süreç: 5-7 saniye germe, 20-30 saniye gevşeme. Başlangıç için: el-kol, yüz-boyun, gövde, bacak-ayak. İleri düzeyde 4 bölgeye indirin. Danışana ev ödevi olarak günlük 20 dakika önerin. Kaygı düşerse kademeli olarak kısaltın.',
  },
  {
    id: 'g3', title: 'Duygu Günlüğü', approach: 'Genel', process: 'aktivasyon',
    duration: 15, source: 'Pennebaker, 1997',
    tags: ['duygu', 'farkındalık', 'psikolojik esneklik'],
    body: 'Danışana her akşam 15 dakika yapısal duygu yazımı önerin. Formatı: 1. Bugün en yoğun yaşadığım duygu. 2. Bu duyguyu tetikleyen olay. 3. Bedenimde nerede hissettim. 4. Ne yapmak istedim (dürtü). 5. Ne yaptım. Haftada bir seansta birlikte inceleyin. Örüntüleri fark edin.',
  },
  {
    id: 'g4', title: 'İki Sandalye Tekniği', approach: 'Genel', process: 'yeniden-yapılandırma',
    duration: 40, source: 'Gestalt / Diyalog Tekniği',
    tags: ['çatışma', 'karar', 'iç çatışma', 'duygu'],
    body: 'İki sandalyeyi birbirine karşı yerleştirin. Danışan sırayla her sandalyede oturarak çatışmanın iki tarafını (ör. eleştiren iç ses vs. savunulan ben) seslendirir. Terapist her iki tarafın ihtiyaçlarını keşfetmesine yardım eder. Sonunda entegrasyon için sağlıklı bir diyalog kurmaya çalışın.',
  },

  // ─── NEFES EGZERSİZLERİ ──────────────────────────────────────────────────────
  {
    id: 'n1', title: '4-7-8 Nefes Tekniği', approach: 'Nefes', process: 'nefes-egzersizi',
    duration: 5, source: 'Dr. Andrew Weil, 2015',
    tags: ['nefes', 'kaygı', 'uyku', 'parasempatik', 'panik'],
    body: `Oturun veya uzanın, dil damağın gerisine değsin. Adımlar (4 tekrar yapın):\n\n1. Ağzı tamamen boşaltarak nefes verin.\n2. Burından sessizce 4 saniye nefes alın.\n3. Nefesi tutun: 7 saniye.\n4. Ağzınızdan "vvvff" sesiyle 8 saniye nefes verin.\n\nRasyo: alış (4) — tutma (7) — veriş (8). Tutma süresi en kritik kısım; parasempatik sinir sistemini aktive eder. Kaygı, öfke veya uyku sorunlarında günde 2 kez 4 tekrar uygulayın.\n\nÖnemli: Başlangıçta baş dönmesi hissedilebilir — normaldir. 4 tekrarla başlayın, ilerleme yoksa süreleri kısaltın (2-3.5-4 olarak).`,
  },
  {
    id: 'n2', title: 'Kutu Nefesi (Box Breathing)', approach: 'Nefes', process: 'nefes-egzersizi',
    duration: 5, source: 'U.S. Navy SEALs; Mark Divine, 2013',
    tags: ['nefes', 'stres', 'konsantrasyon', 'performans', 'kaygı'],
    body: `Eşit süreli 4 aşamalı nefes döngüsü — yüksek stres performans ortamlarında kanıtlanmış.\n\nDöngü:\n1. ALIN → 4 saniye (burundan)\n2. TUTUN → 4 saniye (akciğerleri dolu)\n3. VERİN → 4 saniye (ağızdan)\n4. TUTUN → 4 saniye (akciğerleri boş)\n\nToplam: 16 sn/döngü ≈ yaklaşık 4 nefes/dakika. 4-6 döngü yapın (~1-2 dakika).\n\nUygulama zamanları: Seans öncesi merkezi odak sağlamak, panik başlamadan önce "erken uyarı" olarak, sınav/konuşma öncesi.\n\nDanışana kutu (■) görselini kağıda çizip her kenarda sıradaki aşamayı yazmasını önerin.`,
  },
  {
    id: 'n3', title: 'Diyafragmatik Nefes (Karın Nefesi)', approach: 'Nefes', process: 'nefes-egzersizi',
    duration: 10, source: 'Diaphragmatic Breathing — Cleveland Clinic; Fried, 1987',
    tags: ['nefes', 'kaygı', 'panik', 'stres', 'hiperventilasyon'],
    body: `Göğüs yerine diyafragmayı kullanarak nefes alma — kronik kaygıda en temel egzersiz.\n\nBaşlangıç pozisyonu: Sırt üstü yatın veya sandalyede rahat oturun. Bir eli göğsüne, diğerini karnınıza koyun.\n\nUygulama:\n1. Burından yavaşça nefes alın (4 san). Karın eli yükselmeli, göğüs eli sabit kalmalı.\n2. Dudakları büzerek (ıslık gibi) yavaşça nefes verin (6 san). Karın içeri çekilmeli.\n3. Her nefeste ellerin hareketini gözlemleyin.\n\nEv ödevi: Günde 3 kez, 5-10 dakika. İlk hafta yatarak, ilerleyen haftalarda oturarak, ardından ayakta.\n\nHiperventilasyon için: Veriş süresini alışın 2 katına çıkarmak (3 al, 6 ver) semptomları hızla azaltır.`,
  },
  {
    id: 'n4', title: 'Koherent Nefes (5-5 Rezonans)', approach: 'Nefes', process: 'nefes-egzersizi',
    duration: 10, source: 'Lehrer & Gevirtz, 2014; Coherent Breathing — Elliott, 2005',
    tags: ['nefes', 'HRV', 'kaygı', 'depresyon', 'stres', 'otonomik denge'],
    body: `Dakikada ~5.5 nefes ritmi kalp hızı değişkenliğini (HRV) maksimize eder — baroresseptör rezonansı.\n\nUygulama:\n- ALIN: 5 saniye (burundan, yumuşak)\n- VERİN: 5 saniye (ağızdan veya burundan, sessiz)\n- Ara vermeden, tutmadan sürdürün\n- 10-20 dakika yapın\n\nİpuçları:\n• Nefes sesini duymamalısınız — akış çok ince olmalı\n• Göğüs ve karın birlikte genişleyebilir\n• Dikkati nefes sayısına değil akışın hissine yöneltin\n\nKanıt tabanı: Depresyon (özellikle ilaç yetersizliğinde), TSSB, kronik ağrı, hipertansiyon. Haftalar içinde kalıcı HRV artışı.\n\nBiofeedback cihazı ile birleştirilebilir (Inner Balance, HeartMath).`,
  },
  {
    id: 'n5', title: '4-2-6 Sakinleştirici Nefes', approach: 'Nefes', process: 'nefes-egzersizi',
    duration: 5, source: 'Hazlett-Stevens & Borkovec, 2001; uzatılmış veriş protokolü',
    tags: ['nefes', 'kaygı', 'panik', 'öfke', 'uykusuzluk'],
    body: `Uzatılmış veriş parasempatik sistemi alış süresinden daha etkili aktive eder — basit ve hızlı.\n\nDöngü:\n1. ALIN → 4 saniye (burundan)\n2. TUTUN → 2 saniye\n3. VERİN → 6 saniye (ağızdan, yavaşça)\n\nNeden işe yarar: Veriş süresi alışın 1.5-2 katı olunca vagal ton artar, kalp ritmi yavaşlar.\n\nKullanım senaryoları:\n• Panik hissi başlarken (ilk uyarı işareti)\n• Öfke yönetimi — kızgınlık hissinde 6 döngü yapın\n• Uykuya geçmeden önce 10 dakika\n• Zor seanslardan önce terapist için\n\nDanışana hatırlatıcı: Telefon arka plan fotoğrafı olarak "4-2-6" yazısını koyabilir.`,
  },
  {
    id: 'n6', title: 'Vücudu Tarama Nefesi (Body Scan Breathing)', approach: 'Nefes', process: 'gevşeme-somatik',
    duration: 15, source: 'Kabat-Zinn, 1990; MBSR Body Scan protokolü',
    tags: ['nefes', 'beden farkındalığı', 'mindfulness', 'kronik ağrı', 'stres', 'dissosiyasyon'],
    body: `Nefes ile beden taramasını birleştiren MBSR temel egzersizi.\n\nUygulama (15 dk):\n1. Sırt üstü yatın, gözleri kapatın (veya yumuşak bakış)\n2. 3 derin nefes ile bedeni yerleştirin\n3. Sol ayak başparmaklarına odaklanın — nefes alınca o bölgeye ışık gönderir gibi hayal edin\n4. Veriş ile bölgedeki gerginliği bırakın\n5. Sırayla: sol/sağ ayak — bacaklar — kalçalar — bel — karın — göğüs — eller — kollar — omuzlar — boyun — yüz — baş tepe\n\nHer bölgede 3-5 nefes kalın. Sıkışma veya ağrı bölgelerinde daha uzun durun.\n\nAmaç: Yargılamadan gözlemlemek. Bedeni "düzeltmeye" çalışmak değil, "tanımlamak".\n\nKullanım: Dissosiyatif belirtiler, kronik ağrı, uyku öncesi, TSSB stabilizasyon.`,
  },
  {
    id: 'n7', title: 'Sıralı Burun Nefesi (Nadi Shodhana)', approach: 'Nefes', process: 'nefes-egzersizi',
    duration: 8, source: 'Yoga geleneği; Brown & Gerbarg, 2012',
    tags: ['nefes', 'denge', 'kaygı', 'odak', 'hemisfer'],
    body: `Sağ ve sol burun deliklerini dönüşümlü kullanma — sinir sistemi dengeleme.\n\nEl pozisyonu: Sağ elin işaret ve orta parmakları alnına; başparmak sağ, yüzük parmak sol burun deliğini kapatmak için.\n\nDöngü:\n1. Sağ burun deliğini başparmakla kapatın. Sol delikten 4 san alın.\n2. Her iki deliği kapatın. 4 san tutun.\n3. Sol deliği kapatın. Sağdan 4 san verin.\n4. Sağdan 4 san alın.\n5. Her iki deliği kapatın. 4 san tutun.\n6. Sağı kapatın. Soldan 4 san verin. → Bir tur tamamlandı.\n\n5-10 tur yapın.\n\nBilim: Sağ burun aktivasyonu sempatik, sol burun parasempatik ağırlıklı; dönüşümlü kullanım otonomik dengeyi destekler.`,
  },
  {
    id: 'n8', title: 'Fizyolojik İç Çekiş (Çift Alış — Double Inhale)', approach: 'Nefes', process: 'nefes-egzersizi',
    duration: 2, source: 'Huberman Lab; Balban et al., Science 2023',
    tags: ['nefes', 'ani stres', 'kaygı', 'anlık düzenleme', 'hızlı müdahale'],
    body: `En hızlı stresin etkisini kıran tek nefes tekniği — Science dergisinde yayınlandı.\n\nUygulama (30 saniye yeterli):\n1. Burından kısa bir nefes alın\n2. Alışın sonunda, akciğerler doluyken tek kısa alış daha yapın (çift alış)\n3. Uzun, yavaş bir veriş yapın (ağızdan)\n4. 1-3 kez tekrarlayın\n\nNeden işe yarar: Çift alış sönmüş alveolleri yeniden açar, CO₂/O₂ oranını hızla dengeler, fizyolojik anlamda en hızlı parasempatik tetik.\n\nIdeal kullanım:\n• Toplantı öncesi 30 saniye\n• Kaygı dalgası bastığında\n• Seans başında hem danışan hem terapist için\n• Panik atak başlangıcında ilk adım\n\nDanışana öğretmek: "Bir alış, üstüne bir alış daha, sonra uzun bir veriş — hepsi bu."`,
  },

  // ─── YENI ACT EGZERSİZLERİ ───────────────────────────────────────────────────
  {
    id: 'a7', title: 'Genişleme Egzersizi (Expansion — Zor Duygulara Alan Açma)', approach: 'ACT', process: 'kabul',
    duration: 15, source: 'Russ Harris, The Happiness Trap, 2008',
    tags: ['ACT', 'kabul', 'duygu düzenleme', 'kaygı', 'üzüntü', 'öfke'],
    body: `Zor duyguya savaşmak yerine ona yeterince alan açmak — kaçınmanın tersi.\n\nAdımlar:\n1. GÖZLEMLE: "Şu an bedende bu duyguyu nerede hissediyorum?" Göğüs, karın, boğaz… Tam yeri bulun.\n2. NEFES ET: O bölgeye doğru nefes alın, sanki nefes direkt oraya gidiyor gibi.\n3. AÇ: "Bu duygunun büyümesine izin versem ne olur?" O bölge etrafında alan açıyormuş gibi hayal edin.\n4. İZİN VER: "Bu duygu şu an burada olabilir. Onunla savaşmama gerek yok."\n5. İZLE: Duyguyu düzeltmeye ya da uzaklaştırmaya çalışmadan, sadece gözleyin.\n\nSeans içi uygulama: Danışan duygusal yükselişte iken adımları sesli yürütün. "Şu an içinizde ne var? Onu nerede hissediyorsunuz?"\n\nEv ödevi: Günün 1 zor duygusunda 5 dakika uygulatın.`,
  },
  {
    id: 'a8', title: 'Zihin Adlandırma (Cognitive Defusion — İsimlendirme)', approach: 'ACT', process: 'defüzyon',
    duration: 10, source: 'Hayes et al., 2011; Harris, 2009',
    tags: ['ACT', 'defüzyon', 'ruminasyon', 'endişe', 'iç ses'],
    body: `Düşünceyi olduğu gibi yaşamak yerine onu bir düşünce olarak etiketlemek.\n\nTemel yapı:\n"Ben başarısızım" → "Zihin bana 'başarısızım' diyor"\n"Bu asla düzelmeyecek" → "Başarısızlık hikayesi tekrar oynuyor"\n\nUygulama adımları:\n1. Danışana son haftanın tekrarlayan düşüncelerini yazdırın\n2. Her düşünce için: "Bu düşünce şu an aklınızda nasıl geliyor?" sorun\n3. Birlikte şu yapıyı deneyin: "Zihinim bana X diyor… Ve şu an ben bunu fark ediyorum."\n4. "Fark etmek" ile "inanmak" arasındaki farkı konuşun\n\nMetafor: "Düşünceler radyodur. Radyo çalmaya devam edebilir; siz aynı anda araba kullanabilirsiniz."\n\nEv ödevi: Tetikleyici bir düşünce gelince 3 kez "Zihin bana X söylüyor" diye etiketleyin, sonra değerlere yönelin.`,
  },
  {
    id: 'a9', title: 'Çin Parmak Tuzağı Metaforu (Kontrol Gündemi)', approach: 'ACT', process: 'kabul',
    duration: 10, source: 'Hayes et al., 2011 — Creative Hopelessness',
    tags: ['ACT', 'yaratıcı çaresizlik', 'kontrol', 'kaçınma', 'psikoeğitim'],
    body: `Kontrol gündeminin paradoksunu somutlaştıran ACT psikoeğitimi.\n\nMetafor anlatımı:\n"Çin parmak tuzağını biliyor musunuz? İki parmağı sokarsınız, kurtulmak için çekersiniz — ama tuzak sıkar. Tek çözüm içe doğru itmek, yani tuzakla yüzleşmek."\n\nDanışana uygulama:\n1. "Şimdiye kadar bu duygu/düşünceden kurtulmak için ne yaptınız?" listesi çıkarın.\n2. Her strateji için: "Bu kısa vadede işe yaradı mı?" ve "Uzun vadede ne getirdi?" sorun.\n3. Listedeki tüm kontrol stratejilerinin ortaklaşa sonucunu birlikte görün.\n4. Alternatif sunum: "Peki duyguyla savaşmak yerine ona yer açsaydınız?"\n\nÖnemli: Bu egzersizin amacı çaresiz hissettirmek değil, mevcut stratejilerin işlevsizliğini keşfederek farklı bir yön açmak.`,
  },
  {
    id: 'a10', title: 'Otobüs Şoförü Metaforu (Değer Yönlü Eylem)', approach: 'ACT', process: 'değerler',
    duration: 15, source: 'Hayes et al., 2011',
    tags: ['ACT', 'değerler', 'defüzyon', 'kararlı eylem', 'kaçınma'],
    body: `Değer yönlü eylemi engelleyen düşüncelerle ilişkiyi yeniden çerçeveleyen metafor.\n\nAnlatı:\n"Siz bir otobüs şoförüsünüz, yolculukta gidecek bir yeriniz var. Yolcularınız (düşünceler ve duygular) farklı taleplerde bulunuyor: 'Git oraya!', 'Dur!', 'Geri dön!' Şoför olarak bu yolculara kapıyı açarsınız, binerler — ama onlar sürüş yönünü belirlemez."\n\nSeans uygulaması:\n1. Danışanın değer yönüne giden yolunu belirleyin (hedef).\n2. Hangi yolcular (düşünceler) şoförü durdurmaya çalışıyor?\n3. "Bu yolcular burada olabilir mi, sen yine de sürebilir misin?" sorun.\n4. Bir adım alın — yolcular otobüste iken.\n\nUygulama: Kaçınma örüntüsü güçlü danışanlarda, değer maruz bırakmasının öncesinde.`,
  },
  {
    id: 'a11', title: 'Boğa Gözü Egzersizi (Bull\'s Eye)', approach: 'ACT', process: 'değerler',
    duration: 30, source: 'Tobias Lundgren, 2012; Villatte et al.',
    tags: ['ACT', 'değerler', 'öz-değerlendirme', 'hedef', 'müdahale planlaması'],
    body: `Değer–eylem tutarlılığını görselleştiren pratik ACT değerlendirme aracı.\n\nKağıda uygulama:\n1. Kağıda dört eşit alan oluşturun: Aile/İlişkiler — İş/Eğitim — Kişisel Gelişim — Sağlık/Eğlence\n2. Her alanda içiçe 3 çember çizin: merkez = tam tutarlı, dış = çok uzak\n3. Danışana: "Şu an değerlerinize ne kadar yakın yaşıyorsunuz? X koyun."\n4. "İdeal olarak olmak istediğiniz yer nerede? O koyun."\n5. Uzaklıkları fark edin — hangisi en acil müdahale alanı?\n\nHaftalık kullanım: Her seans başında kısa kontrol olarak. "Geçen haftaya kıyasla hangi alanda daha yaklaştınız?"\n\nTerapötik kullanım: Tedavi odağı belirleme, motivasyon düşüşünde, sonlandırma değerlendirmesi.`,
  },
  {
    id: 'a12', title: 'Sağlıklı Yetişkin Mektubu (Gözlemci Benlik + Değerler)', approach: 'ACT', process: 'defüzyon',
    duration: 40, source: 'Harris, 2019; şema terapi ile ACT entegrasyonu',
    tags: ['ACT', 'benlik', 'şefkat', 'travma', 'özeleştiri'],
    body: `Gözlemci benlik perspektifinden kendine yazılan şefkatli mektup.\n\nUygulama:\n1. Danışanın şu an zorlandığı bir duygu veya durumu tanımlayın.\n2. "Şu an izlediğiniz taraf — gözlemci ben — burada. O taraftan, bu zorluğu yaşayan tarafınıza ne söylerdi?"\n3. Danışana 10-15 dakika mektup yazdırın. Notlar:\n   - Yargılamadan başlayın: "Şu an çok zor bir dönemdesin."\n   - İnsan ortak paylaşımını hatırlatın: "Bu acı yalnızca sende değil."\n   - Bir yön gösterin: "Şu an değerlerin seni nereye çağırıyor?"\n4. Mektubu yüksek sesle okutun (isteğe bağlı).\n5. Sohbet: Yazarken ne hissettiler? Hangi kısım en zordu?\n\nTerapötik etki: İç eleştiri ve öz-şefkat iç içe geçmiş danışanlarda güçlü.`,
  },
  {
    id: 'a13', title: 'Kararlı Eylem SMART Planı (Değer → Adım)', approach: 'ACT', process: 'değerler',
    duration: 20, source: 'Harris, 2009; Luoma et al., 2007',
    tags: ['ACT', 'kararlı eylem', 'hedef', 'değerler', 'planlama'],
    body: `Değerleri somut eylemlere dönüştüren yapılandırılmış plan.\n\nYapı (kağıda çalışın):\n1. DEĞER: "Bu hafta hangi değer alanında adım atmak istiyorsunuz?"\n2. AKSİYON: "Bu değer doğrultusunda ne yapabilirsiniz?" (fiil + nesne formatı)\n3. ZAMAN: "Ne zaman? (gün/saat)"\n4. ENGELLERİ ÖN GÖR: "Hangi düşünceler/duygular yolunuza çıkabilir?"\n5. DEFÜZİF YANIT: "O düşünce geldiğinde ne hatırlayacaksınız?"\n6. GÖZLEMLE: "Eylemi yaptıktan sonra değerlere yakınlığı 0-10 puanlayın."\n\nHaftalık kontrol formatı:\n• Geçen haftaki plan yapıldı mı? (evet/kısmen/hayır)\n• Engel ne oldu?\n• Bu hafta plan: …\n\nNot: Hedef koyarken "değer yönlü" davranış seçmek kritik — sonuç değil süreç.`,
  },
  {
    id: 'a14', title: 'Kamp Ateşi / Okyanus Mindfulness (Şimdiki An Meditasyonu)', approach: 'ACT', process: 'şimdiki-an',
    duration: 12, source: 'Harris, 2019; ACT Made Simple',
    tags: ['ACT', 'mindfulness', 'şimdiki an', 'beden farkındalığı', 'stres'],
    body: `Danışanın doğa imgelerini kullandığı rehberli şimdiki an meditasyonu.\n\nVersiyon A — Kamp Ateşi (kaygı/endişe için):\n"Gözleri kapatın. Kamp ateşinin önünde oturduğunuzu hayal edin. Ateşi izleyin — alevler değişiyor, çatırdıyor. Şu an bedeninizdeki her duyumu fark edin. Zihin bir düşünce getirirse, onu aleve atın, izleyin, dağılsın. Siz sadece ateşe bakıyorsunuz."\n\nVersiyon B — Okyanus (depresyon/uyuşukluk için):\n"Okyanus kenarındasınız. Dalga geliyor, şişiyor, kırılıyor, çekiliyor. Şu an bedeninizde ne hissediyorsunuz? Bir duygu gelirse onu dalgaya koyun, birlikte izleyin."\n\nSeans içi: 8-12 dakika. Sonrası: "Ne fark ettiniz? Hangi an en zordu?" tartışması.\n\nEv ödevi: Sabah 5-10 dakika, telefon duvarına bir kamp ateşi veya okyanus fotoğrafı koyarak.`,
  },

  // ─── YENİ BDT EGZERSİZLERİ ──────────────────────────────────────────────────
  {
    id: 'b7', title: 'Bilişsel Çarpıtmalar Tespiti ve Yeniden Çerçeveleme', approach: 'BDT', process: 'yeniden-yapılandırma',
    duration: 25, source: 'Burns, 1980; Beck, 1979',
    tags: ['BDT', 'bilişsel', 'otomatik düşünce', 'depresyon', 'kaygı'],
    body: `10 temel bilişsel çarpıtmayı danışana öğretip kendi düşüncelerinde tanımasını sağlayın.\n\n10 Çarpıtma (Burns):\n1. Hep-ya-da-hiç düşüncesi: "Ya mükemmel ya da sıfır"\n2. Aşırı genelleme: "Bu her zaman böyle olur"\n3. Zihin süzgeci: Olumluyu dışlayıp olumsuzu büyütmek\n4. Olumluyu reddetme: "Bu zaten bir şey değil"\n5. Zihin okuma: "Kesinlikle beni aptal sanıyorlar"\n6. Kehanet hatası: "Bu asla düzelmeyecek"\n7. Felaketleştirme / Küçümseme\n8. Duygusal akıl yürütme: "Çok kötü hissediyorum, demek ki kötüyüm"\n9. Yapmalı cümleleri: "Yapmalıydım, etmeliyim"\n10. Etiketleme: "Ben bir kaybedenim"\n\nUygulama:\n1. Danışanla birlikte geçen haftadan 1-2 örnek düşünce seçin.\n2. Hangi çarpıtma(lar) var? Listeden işaretleyin.\n3. Çarpıtmayı fark etmek tek başına nasıl bir etki yarattı?\n4. Daha dengeli bir düşünce formüle edin.`,
  },
  {
    id: 'b8', title: 'Aşağı Ok Tekniği (Downward Arrow — Çekirdek İnanca Ulaşma)', approach: 'BDT', process: 'yeniden-yapılandırma',
    duration: 30, source: 'Burns, 1980; Beck, 1979',
    tags: ['BDT', 'çekirdek inanç', 'şema', 'bilişsel', 'depresyon'],
    body: `Otomatik düşünceden çekirdek inanca adım adım inen teknik.\n\nUygulama:\n1. Tetikleyici bir otomatik düşünce seçin. (ör. "Sınava giremedim")\n2. "Bu doğru olsaydı, ne anlama gelirdi?" sorun.\n3. Yanıtı yazın. Tekrar sorun: "Bu doğru olsaydı…?\n4. Yanıt tekrarlanmaya veya ağırlaşmaya başlayana dek devam edin.\n\nÖrnek zincir:\n"Sınava giremedim"\n→ "Başarısız olacağım"\n→ "İnsanlar beni yetersiz görecek"\n→ "Ben değersizim"\n→ ÇEKİRDEK İNANÇ\n\nSonrası:\n5. Bu çekirdek inancın hayatında kaç yıldır var?\n6. Bu inancı destekleyen kanıtlar? Çürüten kanıtlar?\n7. Alternatif çekirdek inanç üretin: "Bazen başarısız olabilirim ve yine de değerliyim."\n\nUyarı: Bu teknik güçlü şema aktivasyonu yaratabilir — güvenli terapötik ilişki şart.`,
  },
  {
    id: 'b9', title: 'Olasılık Pastası (Pie Chart — Sorumluluk Dağılımı)', approach: 'BDT', process: 'yeniden-yapılandırma',
    duration: 20, source: 'Greenberger & Padesky, 1995',
    tags: ['BDT', 'bilişsel', 'OKB', 'travma', 'suçluluk', 'felaketleştirme'],
    body: `Aşırı sorumluluk alma veya felaketleştirmede gerçekçi olasılık dağılımını görselleştirmek.\n\nUygulama:\n1. Danışanın aşırı sorumlu hissettiği bir olayı seçin. (ör. "Kaza benim yüzümden oldu")\n2. "Bu olaya katkıda bulunan TÜM faktörleri listeleyin" — sizi dahil etmeden önce.\n3. Her faktör için %0-100 arası katkı oranı biçin.\n4. Sonunda kendinize ne kalıyor?\n5. Pasta grafiği çizin — gerçek pay görünür hale gelir.\n\nDefaletleştirme versiyonu:\n1. "Bu durum gerçekleşirse sonucun %100 felaket olduğunu düşünüyorsunuz."\n2. "Tüm olası sonuçları, en kötüden en iyiye listeleyin."\n3. Her sonuca olasılık % biçin.\n4. En kötü sonucun gerçek olasılığı kaç?\n\nTerapötik not: OKB (aşırı sorumluluk), travma (kendini suçlama), sosyal kaygı (utanç senaryosu) için güçlü.`,
  },
  {
    id: 'b10', title: 'İmgesel Yeniden Yazma (Imagery Rescripting)', approach: 'BDT', process: 'imgesel',
    duration: 50, source: 'Smucker & Dancu, 1999; Arntz & Weertman, 1999',
    tags: ['BDT', 'travma', 'şema', 'imge', 'çocukluk', 'TSSB'],
    body: `Acı verici bellek veya imgede anlamı yeniden işleme — şema terapi ile BDT kesişimi.\n\nAşamalar:\n1. HAZIRLIK: Güvenli alan imgesi oluşturun. İşlemin her an durdurabileceğini hatırlatın.\n2. TANTIMLAMA: "Şimdiye dek tekrar eden ya da sizi zorlayan bir imgeden/anıdan söz eder misiniz?" → Çok ayrıntı istemeden.\n3. CANLANDIRMA: "O anı hayal ederken içinde bulunun — ne görüyor, ne hissediyorsunuz?"\n4. İHTİYAÇ: "O anda ne ihtiyacı vardı?" (güvenlik, ses, koruma, kabul)\n5. YENİDEN YAZMA: "Şimdi o sahneye girebilir miyim? Sizi o anda koruyabilir miyim?" → Terapist koruyucu figür olarak dahil olur, danışan yönlendirir.\n6. BÜTÜNLEŞTIRME: Yeni imgeyi 2-3 kez geçirin. "Şimdi o anda ne hissettiniz?"\n\nUyarı: Disosiyatif belirtiler varsa önce stabilizasyon gerekli. Tek seansta tamamlanmak zorunda değil.`,
  },
  {
    id: 'b11', title: 'Güçlendirici Başa Çıkma Kartları', approach: 'BDT', process: 'yeniden-yapılandırma',
    duration: 20, source: 'Beck, 1995; Judith Beck',
    tags: ['BDT', 'ödev', 'bilişsel', 'kriz', 'nüksü önleme'],
    body: `Seans içinde üretilen alternatif düşünceleri taşınabilir karta dönüştürme.\n\nUygulama:\n1. Seansta güçlü bir bilişsel yeniden yapılandırma yapıldıysa karta aktarın.\n2. Kart formatı (küçük karton veya telefon notu):\n   ÜST (eski düşünce): "Kimse beni sevmiyor"\n   ALT (yeni yanıt): "Bazı insanlar benden uzaklaşmış olabilir ve hâlâ beni seven insanlar var — örneğin…"\n3. Danışanı hangi zamanlarda okuyacağını planlayın: sabah, tetikleyici önce, yatmadan önce.\n4. Her hafta kartları güncelleyin — çözülmüş korkular için yeni kartlar ekleyin.\n\nDijital versiyon: Telefon kilidi ekranı, hatırlatıcı mesajlar, favori uygulama bildirimi.\n\nNeden işe yarar: Seans içi kazanımlar genellikle seans dışı kaybolur; kart köprü işlevi görür.`,
  },
  {
    id: 'b12', title: 'Aktivite-Ruh Hali İzleme Formu', approach: 'BDT', process: 'aktivasyon',
    duration: 15, source: 'Martell, Dimidjian & Herman-Dunn, 2010',
    tags: ['BDT', 'depresyon', 'davranışsal aktivasyon', 'ödev', 'izleme'],
    body: `Davranış-duygu bağlantısını somutlaştıran ev ödevi formu.\n\nForm yapısı (haftalık çizelge):\n• Satırlar: Saat dilimleri (sabah/öğle/ikindi/akşam/gece)\n• Sütunlar: Her gün\n• Her hücre: Aktivite + Ruh hali puanı (0-10) + P (pleasure/keyif) veya M (mastery/ustalık) etiketi\n\nSeans uygulaması:\n1. Formu birlikte doldurmayı öğretin, geçmiş 2 günü doldurun\n2. En düşük ruh hali anlarındaki aktivitelere bakın\n3. Yüksek ruh halini öngören aktiviteleri tespit edin\n4. Gelecek hafta için keyif/ustalık aktiviteleri planlayın\n\nAktivite planlaması ipuçları:\n• Keyif aktiviteleri: Pasif de olabilir (müzik, banyo)\n• Ustalık aktiviteleri: Küçük ve somut başlayın\n• Sosyal aktiviteler her iki kategoride de güçlü etki yaratır\n\nSeans başı rutini: Her hafta formu birlikte incelemek.`,
  },
  {
    id: 'b13', title: 'Özgecil / Kendine Şefkat Egzersizi (Self-Compassion)', approach: 'BDT', process: 'yeniden-yapılandırma',
    duration: 20, source: 'Neff, 2003; Gilbert, 2009 — CFT entegrasyonu',
    tags: ['BDT', 'öz-şefkat', 'özeleştiri', 'depresyon', 'utanç', 'mükemmeliyetçilik'],
    body: `Aşırı öz-eleştiriyi şefkatle dengeleme — BDT ve şefkat odaklı terapinin kesişimi.\n\nMindful öz-şefkat 3 adımı (Neff):\n1. FARKINDALIK: "Bu an acı verici." (inkar etmeden kabul)\n2. ORTAK İNSANLIK: "Acı çekmek insan olmanın bir parçası. Başkaları da böyle hissetti."\n3. ŞEFKAт: "Bu zor anda kendime nazik olabilir miyim?"\n\nSeansta uygulama — "İyi Dost" egzersizi:\n1. Danışana şu an zorlandığı bir durumu düşündürün.\n2. "Bu durumda en iyi dostunuz ne söylerdi?" yazdırın.\n3. "Şimdi aynısını kendinize söyleyin."\n4. İki tepki arasındaki farkı inceleyin: "Kendinize neden dostuğunuza söylediğinizden farklı davranıyorsunuz?"\n\nEv ödevi: Zorlu anlarda "iyi dost mektubu" yazmak.`,
  },

  // ─── MBCT ────────────────────────────────────────────────────────────────────
  {
    id: 'm1', title: 'Raisin Egzersizi (Kuru Üzüm — Mindful Yeme)', approach: 'MBCT', process: 'şimdiki-an',
    duration: 10, source: 'Kabat-Zinn, 1990; MBSR/MBCT 8-haftalık program',
    tags: ['MBCT', 'mindfulness', 'şimdiki an', 'beden farkındalığı', 'başlangıç'],
    body: `MBSR/MBCT programının ilk haftasında kullanılan temel mindfulness egzersizi.\n\nHazırlık: Bir kuru üzüm (veya çikolata, fındık).\n\nAdımlar (yavaş tempoda, her adım 1-2 dk):\n1. BAKMA: Üzümü sanki hiç görmemişsiniz gibi inceleyin. Rengi, şekli, dokusu.\n2. DOKUNMA: Parmaklarınızda nasıl hissettiriyor? Pürüzsüz/pürüzlü?\n3. KOKLAMA: Kokusu var mı? Beklentileriniz ne?\n4. AĞIZA ALMA: Yutmadan ağzınıza koyun. Dilinizdeki hissi fark edin.\n5. ÇIĞNEME: Yavaşça, her çiğnemeyi fark edin. Tat değişiyor mu?\n6. YUTMA: Yutma eylemini fark edin. Midenize ulaştığını hissedin.\n\nDebriefing: "Bu egzersizi yaparken neler fark ettiniz? Zihin nereye gitti? Bunu yemekle günlük hayata nasıl taşıyabilirsiniz?"\n\nNeden kritik: Autopilot'ı kırmanın somut demonstrasyonu.`,
  },
  {
    id: 'm2', title: '3 Dakikalık Nefes Alanı (3-Minute Breathing Space)', approach: 'MBCT', process: 'şimdiki-an',
    duration: 3, source: 'Segal, Williams & Teasdale, 2002 — MBCT protokolü',
    tags: ['MBCT', 'mindfulness', 'kısa', 'günlük', 'stres', 'depresyon nüks'],
    body: `MBCT programının günlük pratiği — kum saati şeklinde 3 aşama.\n\nKum saati yapısı:\n\n① GENİŞ (1 dk) — Şimdiki an farkındalığı:\n"Şu an ne hissediyorum? Düşünceler, duygular, bedensel duyumlar." Gözlemleyin, yargılamayın.\n\n② DAR (1 dk) — Nefese odak:\n"Dikkati nefese getirin — karındaki her alış ve verişi fark edin." Zihin kaçarsa yargılamadan geri döndürün.\n\n③ GENİŞ (1 dk) — Bedenin tamamına yayılma:\n"Nefes farkındalığını tüm bedene yayın — oturma, nefes alma, varlık." Huzuruyla bu ana hazır olarak gündelik hayata dönün.\n\nKullanım zamanları:\n• Günde 3 kez rutin (saat belirleyin)\n• Zor duygu/düşünce geldiğinde (reaktif kullanım)\n• Tetikleyici durumların hemen öncesinde\n\nEv ödevi kartı: Saat 09:00 / 13:00 / 18:00 — telefon hatırlatıcısı.`,
  },
];

// ─── Ölçekler ─────────────────────────────────────────────────────────────────

type Scale = {
  id: string; name: string; abbr: string; purpose: string;
  itemCount: number; scoreRange: string; source: string;
  cutoffs: { label: string; range: string; tone: 'green' | 'yellow' | 'orange' | 'red' }[];
  notes: string; whenToUse: string;
};

const SCALES: Scale[] = [
  {
    id: 'phq9', name: 'Hasta Sağlığı Anketi', abbr: 'PHQ-9',
    purpose: 'Majör depresif bozukluğu taramak ve şiddeti izlemek için en yaygın kullanılan kısa ölçek.',
    itemCount: 9, scoreRange: '0–27', source: 'Kroenke et al., 2001',
    cutoffs: [
      { label: 'Minimal', range: '0–4', tone: 'green' },
      { label: 'Hafif', range: '5–9', tone: 'yellow' },
      { label: 'Orta', range: '10–14', tone: 'orange' },
      { label: 'Orta-Ağır', range: '15–19', tone: 'orange' },
      { label: 'Ağır', range: '20–27', tone: 'red' },
    ],
    notes: '5+ puan klinik anlamlı değişim. İntihar maddesi (9. madde) her seans kontrol edilmeli.',
    whenToUse: 'Başlangıç değerlendirmesi, her 2–4 seansta bir ilerleme izleme, sonlandırma.',
  },
  {
    id: 'gad7', name: 'Yaygın Anksiyete Bozukluğu Ölçeği', abbr: 'GAD-7',
    purpose: 'Yaygın anksiyete bozukluğunu taramak ve anksiyete şiddetini ölçmek.',
    itemCount: 7, scoreRange: '0–21', source: 'Spitzer et al., 2006',
    cutoffs: [
      { label: 'Minimal', range: '0–4', tone: 'green' },
      { label: 'Hafif', range: '5–9', tone: 'yellow' },
      { label: 'Orta', range: '10–14', tone: 'orange' },
      { label: 'Ağır', range: '15–21', tone: 'red' },
    ],
    notes: 'PHQ-9 ile birlikte kullanımı önerilir. 10+ eşiği tanısal görüşmeyi gerektirir.',
    whenToUse: 'Kaygı şikayetlerinde tarama, OKB/sosyal kaygı/TSSB komorbid değerlendirme.',
  },
  {
    id: 'bdi2', name: 'Beck Depresyon Envanteri II', abbr: 'BDI-II',
    purpose: 'Depresyon semptom şiddetini kapsamlı biçimde değerlendiren standart klinik ölçek.',
    itemCount: 21, scoreRange: '0–63', source: 'Beck, Steer & Brown, 1996',
    cutoffs: [
      { label: 'Minimal', range: '0–13', tone: 'green' },
      { label: 'Hafif', range: '14–19', tone: 'yellow' },
      { label: 'Orta', range: '20–28', tone: 'orange' },
      { label: 'Ağır', range: '29–63', tone: 'red' },
    ],
    notes: 'BDT sürecinde seans başı rutin olarak uygulanması etkinliği artırır.',
    whenToUse: 'İlk değerlendirme, BDT seans başı ölçümü, ilaç tedavisine ek izleme.',
  },
  {
    id: 'bai', name: 'Beck Anksiyete Envanteri', abbr: 'BAI',
    purpose: 'Anksiyetenin bedensel ve bilişsel semptomlarını ölçen, depresyondan bağımsız anksiyete ölçeği.',
    itemCount: 21, scoreRange: '0–63', source: 'Beck & Steer, 1993',
    cutoffs: [
      { label: 'Minimal', range: '0–7', tone: 'green' },
      { label: 'Hafif', range: '8–15', tone: 'yellow' },
      { label: 'Orta', range: '16–25', tone: 'orange' },
      { label: 'Ağır', range: '26–63', tone: 'red' },
    ],
    notes: 'BDI-II ile birlikte kullanım depresyon–anksiyete ayrımını güçlendirir.',
    whenToUse: 'Panik bozukluğu, sosyal anksiyete, TSSB kaygı bileşeni değerlendirmesi.',
  },
  {
    id: 'pcl5', name: 'TSSB Kontrol Listesi', abbr: 'PCL-5',
    purpose: 'DSM-5 TSSB tanı kriterlerine göre belirti şiddetini ölçen kendi bildirimi ölçeği.',
    itemCount: 20, scoreRange: '0–80', source: 'Weathers et al., 2013',
    cutoffs: [
      { label: 'TSSB yok', range: '0–32', tone: 'green' },
      { label: 'Olası TSSB', range: '33–49', tone: 'orange' },
      { label: 'Klinik TSSB', range: '50+', tone: 'red' },
    ],
    notes: '10 puanlık düşüş klinik anlamlı iyileşme kabul edilir. Tanı için yapılandırılmış görüşme şart.',
    whenToUse: 'Travma odaklı çalışma öncesi şiddet değerlendirmesi, tedavi süreci izleme.',
  },
  {
    id: 'ocir', name: 'OKB Belirti Listesi – Revize', abbr: 'OCI-R',
    purpose: 'Obsesif kompulsif belirtilerin alt tiplerini (yıkama, kontrol, sıralama…) ayırt ederek ölçer.',
    itemCount: 18, scoreRange: '0–72', source: 'Foa et al., 2002',
    cutoffs: [
      { label: 'Normal', range: '0–20', tone: 'green' },
      { label: 'OKB şüphesi', range: '21+', tone: 'orange' },
    ],
    notes: '6 alt ölçek: yıkama, obsesyon, biriktirme, sıralama, kontrol, nötralizasyon.',
    whenToUse: 'OKB alt tip belirleme, ERP hedeflerinin önceliklendirilmesi.',
  },
  {
    id: 'dass21', name: 'Depresyon Anksiyete Stres Ölçeği', abbr: 'DASS-21',
    purpose: 'Depresyon, anksiyete ve stresi eş zamanlı, bağımsız ölçen 3-faktörlü ölçek.',
    itemCount: 21, scoreRange: '3 alt ölçek × 0–42', source: 'Lovibond & Lovibond, 1995',
    cutoffs: [
      { label: 'Normal (D/A/S)', range: '0–9 / 0–7 / 0–14', tone: 'green' },
      { label: 'Hafif', range: '10–13 / 8–9 / 15–18', tone: 'yellow' },
      { label: 'Orta', range: '14–20 / 10–14 / 19–25', tone: 'orange' },
      { label: 'Ağır+', range: '21+ / 15+ / 26+', tone: 'red' },
    ],
    notes: 'Stres boyutu OKB veya anksiyetenin ayırt edilmesine yardımcı olur.',
    whenToUse: 'Genel psikolojik iyilik taraması, araştırma ortamı, çoklu komorbidite değerlendirmesi.',
  },
  {
    id: 'ysqsf', name: 'Young Şema Ölçeği – Kısa Form', abbr: 'YSQ-SF3',
    purpose: '18 erken dönem uyumsuz şemayı 5 alan altında değerlendiren öz bildirim ölçeği.',
    itemCount: 90, scoreRange: '1–6 (her madde)', source: 'Young, Klosko & Weishaar, 2003',
    cutoffs: [
      { label: 'Yüksek (birincil şema)', range: '≥ 3.5 ortalama', tone: 'orange' },
      { label: 'Çok yüksek', range: '≥ 4.5 ortalama', tone: 'red' },
    ],
    notes: '5 şema alanı: Kopukluk/Red, Zedelenmiş Özerklik, Zedelenmiş Sınırlar, Diğer Yönelim, Aşırı Tetikte Olma.',
    whenToUse: 'Şema terapi başlangıcı, kişilik bozukluğu şüphesi, kronik depresyon/kaygı formulasyonu.',
  },
  {
    id: 'iesr', name: 'Travma Olay Etkisi Ölçeği – Revize', abbr: 'IES-R',
    purpose: 'Belirli bir olayın yol açtığı yeniden yaşantılama, kaçınma ve aşırı uyarılma düzeyini ölçer.',
    itemCount: 22, scoreRange: '0–88', source: 'Weiss & Marmar, 1997',
    cutoffs: [
      { label: 'Düşük etki', range: '0–23', tone: 'green' },
      { label: 'Orta etki', range: '24–32', tone: 'yellow' },
      { label: 'Yüksek / TSSB riski', range: '33–88', tone: 'red' },
    ],
    notes: '3 alt ölçek: Yeniden Yaşantılama, Kaçınma, Aşırı Uyarılma. Tanısal değil, semptom yükü ölçer.',
    whenToUse: 'Travma odaklı çalışma öncesi/sonrası, belirli olaya bağlı TSSB izleme.',
  },
  {
    id: 'scs', name: 'Öz-Şefkat Ölçeği – Kısa Form', abbr: 'SCS-SF',
    purpose: 'Öz-yargı, izolasyon ve aşırı özdeşleşmeye karşı öz-şefkat, insanlık paylaşımı ve farkındalığı ölçer.',
    itemCount: 12, scoreRange: '1–5', source: 'Neff, 2003; Raes et al., 2011',
    cutoffs: [
      { label: 'Düşük öz-şefkat', range: '< 2.5', tone: 'red' },
      { label: 'Orta', range: '2.5–3.5', tone: 'yellow' },
      { label: 'Yüksek öz-şefkat', range: '> 3.5', tone: 'green' },
    ],
    notes: 'Negatif alt ölçekler ters puanlanır. Depresyon, utanç, mükemmeliyetçilik çalışmalarında temel ölçüm.',
    whenToUse: 'CFT/ACT öz-şefkat müdahalesi öncesi ve sonrası, özeleştiri odaklı vakalarda.',
  },
];

// ─── Kayıt tutma form ID'leri ──────────────────────────────────────────────────
const FORM_IDS = ['b1', 'b12', 'g3', 'a11', 'b11', 'a13', 'a3'];

// ─── Teknik yönerge grupları ───────────────────────────────────────────────────
const TEKNIK_GRUPLARI: { baslik: string; emoji: string; ids: string[]; aciklama: string }[] = [
  {
    baslik: 'Nefes Teknikleri', emoji: '🫁',
    aciklama: 'Parasempatik sistemi aktive eden, kaygı ve paniği düzenleyen nefes protokolleri.',
    ids: ['n1', 'n2', 'n3', 'n4', 'n5', 'n7', 'n8'],
  },
  {
    baslik: 'Beden Farkındalığı & Mindfulness', emoji: '🧘',
    aciklama: 'Bedensel duyumları, nefesi ve şimdiki anı fark etmeye yönelik teknikler.',
    ids: ['n6', 'a6', 'm1', 'm2', 'a14'],
  },
  {
    baslik: 'Bilişsel Yeniden Yapılandırma', emoji: '💡',
    aciklama: 'Otomatik düşünceleri ve çekirdek inançları tanımlayıp yeniden çerçeveleme teknikleri.',
    ids: ['b4', 'b7', 'b8', 'b9', 'b1'],
  },
  {
    baslik: 'Davranışsal Aktivasyon & İzleme', emoji: '📅',
    aciklama: 'Ruh hali–davranış döngüsünü kırmaya yönelik aktivasyon ve ödev teknikleri.',
    ids: ['b2', 'b12', 'g3', 'b11'],
  },
  {
    baslik: 'Maruz Bırakma Protokolleri', emoji: '⚡',
    aciklama: 'Kaçınmayı azaltmak için sistematik maruz bırakma ve güvenlik davranışı müdahaleleri.',
    ids: ['b3', 'b6'],
  },
  {
    baslik: 'ACT Defüzyon & Kabul', emoji: '🌊',
    aciklama: 'Düşüncelerle ilişkiyi değiştirme (defüzyon) ve zor deneyimlere alan açma teknikleri.',
    ids: ['a1', 'a4', 'a5', 'a7', 'a8', 'a9'],
  },
  {
    baslik: 'ACT Değerler & Kararlı Eylem', emoji: '🧭',
    aciklama: 'Değerleri netleştirme, değer yönlü adım planlama ve boğa gözü egzersizleri.',
    ids: ['a2', 'a3', 'a10', 'a11', 'a13'],
  },
  {
    baslik: 'İmgesel Çalışma & Diyalog', emoji: '🎨',
    aciklama: 'İmgesel yeniden yazma, sandalye tekniği ve sembolik çalışmalar.',
    ids: ['b10', 'g4', 'a12'],
  },
  {
    baslik: 'Duygu Düzenleme & Öz-Şefkat', emoji: '❤️',
    aciklama: 'DBT duygu düzenleme becerileri ve öz-şefkat temelli müdahaleler.',
    ids: ['d1', 'd2', 'b13'],
  },
  {
    baslik: 'Psikoeğitim & Gevşeme', emoji: '📚',
    aciklama: 'Kaygı modeli, derin kas gevşemesi ve diğer psikoeğitim müdahaleleri.',
    ids: ['g1', 'g2'],
  },
];

type Props = { patientId?: string };

const APPROACHES = ['Tümü', 'BDT', 'ACT', 'DBT', 'MBCT', 'Nefes', 'Şema Terapi', 'Genel'];
const PROCESSES = [
  { value: 'tumu',                  label: 'Tümü' },
  { value: 'nefes-egzersizi',       label: '🫁 Nefes Egzersizleri' },
  { value: 'gevşeme-somatik',       label: '🧘 Gevşeme / Somatik' },
  { value: 'şimdiki-an',            label: '🔵 Şimdiki An' },
  { value: 'yeniden-yapılandırma',  label: '💡 Bilişsel Yeniden Yapılandırma' },
  { value: 'imgesel',               label: '🎨 İmgesel Çalışma' },
  { value: 'maruz-bırakma',         label: '⚡ Maruz Bırakma' },
  { value: 'aktivasyon',            label: '🏃 Davranışsal Aktivasyon' },
  { value: 'defüzyon',              label: '🌊 Bilişsel Defüzyon' },
  { value: 'kabul',                 label: '🤲 Kabul / Kriz' },
  { value: 'değerler',              label: '🧭 Değerler' },
  { value: 'psikoeğitim',           label: '📚 Psikoeğitim' },
];

const TONE_COLORS = {
  green:  'bg-green-50 border-green-200 text-green-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  red:    'bg-red-50 border-red-200 text-red-700',
};

export default function MudahaleKutuphanesi({ patientId }: Props) {
  const [mainTab, setMainTab] = useState<'kutuphanesi' | 'sema'>('kutuphanesi');
  const [libSubTab, setLibSubTab] = useState<'egzersizler' | 'olcekler' | 'kayit-formlar' | 'yonergeler'>('egzersizler');
  const [expandedScale, setExpandedScale] = useState<string | null>(null);
  const [expandedGrup, setExpandedGrup] = useState<string | null>(null);
  const [activeApproach, setActiveApproach] = useState('Tümü');
  const [activeProcess, setActiveProcess] = useState('tumu');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [customEntries, setCustomEntries] = useState<LibEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Partial<LibEntry>>({ tags: [], approach: 'BDT', process: 'yeniden-yapılandırma', duration: 30 });
  const [activeView, setActiveView] = useState<'library' | 'add'>('library');

  const allEntries = useMemo(() => [...BUILTIN_INTERVENTIONS, ...customEntries], [customEntries]);

  const filtered = useMemo(() => {
    return allEntries.filter(e => {
      if (activeApproach !== 'Tümü' && e.approach !== activeApproach) return false;
      if (activeProcess !== 'tumu' && e.process !== activeProcess) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q) || e.tags.some(t => t.includes(q));
      }
      return true;
    });
  }, [allEntries, activeApproach, activeProcess, search]);

  const saveCustom = () => {
    if (!draft.title?.trim() || !draft.body?.trim()) return;
    const entry: LibEntry = {
      id: `custom_${Date.now()}`,
      title: draft.title!,
      approach: draft.approach || 'Genel',
      process: draft.process || 'yeniden-yapılandırma',
      duration: draft.duration || 30,
      source: draft.source,
      tags: typeof draft.tags === 'string' ? (draft.tags as unknown as string).split(',').map((t: string) => t.trim()).filter(Boolean) : (draft.tags || []),
      body: draft.body!,
      isCustom: true,
    };
    setCustomEntries(prev => [entry, ...prev]);
    setDraft({ tags: [], approach: 'BDT', process: 'yeniden-yapılandırma', duration: 30 });
    setActiveView('library');
  };

  const removeCustom = (id: string) => {
    setCustomEntries(prev => prev.filter(e => e.id !== id));
  };

  const approachColor: Record<string, string> = {
    'BDT':         'bg-blue-100 text-blue-700',
    'ACT':         'bg-purple-100 text-purple-700',
    'DBT':         'bg-emerald-100 text-emerald-700',
    'Şema Terapi': 'bg-amber-100 text-amber-700',
    'Genel':       'bg-gray-100 text-gray-600',
    'MBCT':        'bg-teal-100 text-teal-700',
    'Nefes':       'bg-sky-100 text-sky-700',
  };

  return (
    <div className="space-y-4">
      {/* Top-level tab: Kütüphane vs Şema Terapisi */}
      <div className="flex gap-1 bg-[#F4F5F8] dark:bg-gray-800 p-1 rounded-2xl w-fit">
        {([
          { k: 'kutuphanesi', l: 'Müdahale Kütüphanesi' },
          { k: 'sema',        l: 'Şema Terapisi'        },
        ] as const).map(t => (
          <button
            key={t.k}
            onClick={() => setMainTab(t.k)}
            className={`text-xs px-5 py-1.5 rounded-xl font-medium transition-colors ${
              mainTab === t.k
                ? 'bg-white dark:bg-gray-900 text-[#0E0F12] dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-[#0E0F12] dark:hover:text-white'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Şema Terapisi view */}
      {mainTab === 'sema' && <SemaTerapisi />}

      {/* Kütüphane view */}
      {mainTab === 'kutuphanesi' && <>

      {/* ── İkincil sekme çubuğu ── */}
      <div className="flex gap-1 bg-[#F4F5F8] p-1 rounded-2xl overflow-x-auto">
        {([
          { k: 'egzersizler',   l: '💪 Egzersizler & Teknikler' },
          { k: 'olcekler',      l: '📊 Ölçekler'                },
          { k: 'kayit-formlar', l: '📋 Kayıt Tutma Formları'    },
          { k: 'yonergeler',    l: '📖 Teknikler Hakkında'      },
        ] as const).map(t => (
          <button key={t.k} onClick={() => setLibSubTab(t.k)}
            className={`flex-shrink-0 text-xs px-4 py-1.5 rounded-xl font-medium transition-colors ${
              libSubTab === t.k
                ? 'bg-white text-[#0E0F12] shadow-sm'
                : 'text-gray-500 hover:text-[#0E0F12]'
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── Ölçekler ── */}
      {libSubTab === 'olcekler' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 px-1">
            Klinik uygulamada yaygın kullanılan standardize değerlendirme araçları. Her ölçeği açmak için tıklayın.
          </p>
          {SCALES.map(s => (
            <div key={s.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedScale(expandedScale === s.id ? null : s.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold bg-[#0E0F12] text-white rounded-lg px-2 py-1 flex-shrink-0 font-mono">
                    {s.abbr}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0E0F12]">{s.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.itemCount} madde · {s.scoreRange} · {s.source}</p>
                  </div>
                </div>
                {expandedScale === s.id
                  ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>
              {expandedScale === s.id && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  <p className="text-sm text-gray-700">{s.purpose}</p>
                  {/* Cut-off scores */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">Kesme Puanları</p>
                    <div className="flex flex-wrap gap-2">
                      {s.cutoffs.map(c => (
                        <div key={c.label} className={cx('rounded-xl border px-3 py-1.5 text-center', TONE_COLORS[c.tone])}>
                          <p className="text-xs font-bold">{c.range}</p>
                          <p className="text-[10px]">{c.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold mb-1">Ne Zaman Kullanılır?</p>
                      <p className="text-xs text-blue-800">{s.whenToUse}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-amber-500 font-semibold mb-1">Klinik Not</p>
                      <p className="text-xs text-amber-800">{s.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Kayıt Tutma Formları ── */}
      {libSubTab === 'kayit-formlar' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 px-1">
            Seans arası ev ödevi, izleme ve özdeğerlendirme amaçlı kullanılan yapılandırılmış formlar.
          </p>
          {BUILTIN_INTERVENTIONS.filter(e => FORM_IDS.includes(e.id)).map(e => (
            <div key={e.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg flex-shrink-0">
                    {e.id === 'b1' ? '📝' : e.id === 'b12' ? '📅' : e.id === 'g3' ? '📔' : e.id === 'a11' ? '🎯' : e.id === 'b11' ? '🃏' : e.id === 'a13' ? '🧭' : '📋'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0E0F12]">{e.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cx('text-[10px] font-semibold px-2 py-0.5 rounded-full', approachColor[e.approach] || 'bg-gray-100 text-gray-600')}>{e.approach}</span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" />{e.duration} dk</span>
                      {e.source && <span className="text-[11px] text-gray-400 italic truncate">{e.source}</span>}
                    </div>
                  </div>
                </div>
                {expanded === e.id
                  ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>
              {expanded === e.id && (
                <div className="border-t border-gray-100 p-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{e.body}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {e.tags.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Teknikler Hakkında Yönergeler ── */}
      {libSubTab === 'yonergeler' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 px-1">
            Teknik gruplarına göre düzenlenmiş uygulama rehberleri. Bir grubu açmak için tıklayın.
          </p>
          {TEKNIK_GRUPLARI.map(grup => {
            const entries = BUILTIN_INTERVENTIONS.filter(e => grup.ids.includes(e.id));
            const isOpen = expandedGrup === grup.baslik;
            return (
              <div key={grup.baslik} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedGrup(isOpen ? null : grup.baslik)}
                  className={cx('w-full flex items-center justify-between p-4 text-left transition-colors', isOpen ? 'bg-[#F4F5F8]' : 'hover:bg-[#F9FAFB]')}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none flex-shrink-0">{grup.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-[#0E0F12]">{grup.baslik}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{entries.length} teknik · {grup.aciklama}</p>
                    </div>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {entries.map(e => (
                      <div key={e.id} className="p-4">
                        <button
                          onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[#0E0F12] hover:text-blue-600 transition-colors">{e.title}</span>
                            <span className={cx('text-[10px] font-semibold px-2 py-0.5 rounded-full', approachColor[e.approach] || 'bg-gray-100 text-gray-600')}>{e.approach}</span>
                            <span className="text-[11px] text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" />{e.duration} dk</span>
                          </div>
                          {expanded === e.id
                            ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            : <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                        </button>
                        {expanded === e.id && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{e.body}</p>
                            {e.source && <p className="text-xs text-gray-400 italic mt-2">{e.source}</p>}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {e.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{t}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Egzersizler & Teknikler (mevcut kütüphane) ── */}
      {libSubTab === 'egzersizler' && <>
      {/* Header tabs */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <h2 className="text-base font-semibold text-[#0E0F12]">Müdahale Kütüphanesi</h2>
            <span className="text-xs text-gray-400">({filtered.length} müdahale)</span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveView('library')}
              className={cx('text-xs px-3 py-1.5 rounded-xl font-medium transition-colors', activeView === 'library' ? 'bg-[#0E0F12] text-white' : 'text-gray-500 hover:bg-gray-100')}
            >Kütüphane</button>
            <button
              onClick={() => setActiveView('add')}
              className={cx('text-xs px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1', activeView === 'add' ? 'bg-[#0E0F12] text-white' : 'text-gray-500 hover:bg-gray-100')}
            ><Plus className="h-3 w-3" /> Ekle</button>
          </div>
        </div>

        {activeView === 'library' && (
          <>
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Müdahale ara…"
                className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#0E0F12] transition-colors"
              />
            </div>

            {/* Approach filter */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {APPROACHES.map(a => (
                <button
                  key={a}
                  onClick={() => setActiveApproach(a)}
                  className={cx('text-xs px-2.5 py-1 rounded-full border transition-colors', activeApproach === a ? 'bg-[#0E0F12] text-white border-[#0E0F12]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400')}
                >{a}</button>
              ))}
            </div>

            {/* Process filter */}
            <div className="flex flex-wrap gap-1.5">
              {PROCESSES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setActiveProcess(p.value)}
                  className={cx('text-[11px] px-2 py-0.5 rounded-full border transition-colors', activeProcess === p.value ? 'bg-gray-700 text-white border-gray-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400')}
                >{p.label}</button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Library entries */}
      {activeView === 'library' && (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="card p-6 text-center text-sm text-gray-500">Kriter ile eşleşen müdahale yok.</div>
          )}
          {filtered.map(e => (
            <div key={e.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                      className="text-sm font-semibold text-[#0E0F12] text-left hover:text-blue-600 transition-colors"
                    >{e.title}</button>
                    <span className={cx('text-[10px] font-semibold px-2 py-0.5 rounded-full', approachColor[e.approach] || 'bg-gray-100 text-gray-600')}>{e.approach}</span>
                    {e.isCustom && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Özel</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {e.duration > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Clock className="h-3 w-3" />{e.duration} dk
                      </span>
                    )}
                    {e.source && <span className="text-[11px] text-gray-400 italic">{e.source}</span>}
                  </div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {e.tags.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{t}</span>
                    ))}
                  </div>
                  {/* Body */}
                  {expanded === e.id && (
                    <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{e.body}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {e.isCustom && (
                    <button onClick={() => removeCustom(e.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                    className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {expanded === e.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {activeView === 'add' && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[#0E0F12] mb-4">Yeni Müdahale Notu Ekle</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Başlık *</label>
              <input
                value={draft.title || ''}
                onChange={e => setDraft({ ...draft, title: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#0E0F12] transition-colors"
                placeholder="Müdahale adı"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Yaklaşım</label>
              <select
                value={draft.approach || 'BDT'}
                onChange={e => setDraft({ ...draft, approach: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#0E0F12] transition-colors"
              >
                {['BDT', 'ACT', 'DBT', 'Şema Terapi', 'MBCT', 'Genel'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Süre (dk)</label>
              <input
                type="number"
                value={draft.duration || 30}
                onChange={e => setDraft({ ...draft, duration: Number(e.target.value) })}
                className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#0E0F12] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Etiketler (virgülle)</label>
              <input
                value={Array.isArray(draft.tags) ? draft.tags.join(', ') : (draft.tags || '')}
                onChange={e => setDraft({ ...draft, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#0E0F12] transition-colors"
                placeholder="kaygı, BDT, ödev"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kaynak</label>
              <input
                value={draft.source || ''}
                onChange={e => setDraft({ ...draft, source: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#0E0F12] transition-colors"
                placeholder="Kitap, yazar, sayfa…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">İçerik *</label>
              <textarea
                value={draft.body || ''}
                onChange={e => setDraft({ ...draft, body: e.target.value })}
                className="mt-1 min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0E0F12] transition-colors"
                placeholder="Müdahale adımları, protokol, notlar…"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setActiveView('library')} className="h-8 px-3 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors">Vazgeç</button>
            <button onClick={saveCustom} disabled={!draft.title?.trim() || !draft.body?.trim()} className="h-8 px-4 text-xs rounded-xl bg-[#0E0F12] text-white hover:bg-[#1A1B22] transition-colors disabled:opacity-50">Kaydet</button>
          </div>
        </div>
      )}
      </>}  {/* end egzersizler sub-tab */}

      </>}  {/* end kutuphanesi mainTab */}
    </div>
  );
}
