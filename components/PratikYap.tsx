'use client';

import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle2, ChevronRight, Lightbulb, Star, Trophy, BookOpen, Pencil, BarChart2, RotateCcw, ArrowRight } from 'lucide-react';
import { DiagramViewer } from '@/components/BozuklukDongusu';

// ─── Types ──────────────────────────────────────────────────────────────────

type Field = { key: string; label: string; hint: string; rows?: number };

type DiagramType =
  | 'sosyal-kaygi' | 'okb' | 'depresyon-gelisimsel' | 'depresyon-dongu' | 'panik' | 'yab'
  | 'cocuk-depresyon' | 'akb' | 'anksiyete-formul' | 'ozgul-fobi' | 'yeme-sorunlari'
  | 'istek-mutluluk' | 'ddd-basit' | 'akb-komplex' | 'kacinma-ogrenme'
  | 'yab-basit' | 'hastalik-anksiyete' | 'hastalik-anksiyete-detay'
  | 'ruminasyon' | 'ruminasyon-ust-bilis' | 'cekingenlik' | 'basit-obsesyon' | 'travma';

type LevelDef = {
  id: number;
  title: string;
  subtitle: string;
  difficulty: 'Başlangıç' | 'Temel' | 'Orta' | 'İleri' | 'Uzman';
  diffColor: string;
  bgColor: string;
  theory: string[];
  scenario: string;
  fields: Field[];
  example: Record<string, string>;
  tip?: string;
  diagramType?: DiagramType;
  diagramLabel?: string;
};

type Progress = {
  completed: number[];
  answers: Record<number, Record<string, string>>;
};

type Phase = 'learn' | 'practice' | 'compare';

// ─── Level Definitions ───────────────────────────────────────────────────────

const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: 'Temel Döngü',
    subtitle: 'Düşünce → Duygu → Davranış',
    difficulty: 'Başlangıç',
    diffColor: 'bg-emerald-100 text-emerald-700',
    bgColor: 'bg-emerald-50',
    theory: [
      'Bilişsel Davranışçı Terapi\'nin temelinde üç unsur yatar: düşünce, duygu ve davranış. Bu üç unsur birbirini sürekli etkiler ve besler.',
      'Bir durum karşısında aklımıza gelen otomatik düşünceler duygularımızı şekillendirir; duygularımız ise nasıl davranacağımızı belirler. Davranışlarımız da yeni durumlar yaratarak döngüyü sürdürür.',
      'Formülasyonun amacı bu döngünün hangi halkasında ve nasıl müdahale edileceğini anlamaktır.',
    ],
    scenario: '📖 Senaryo: Ahmet, patronundan beklenmedik bir e-posta aldı. E-posta şöyle başlıyordu: "Yarın sabah görüşmemiz gerekiyor." Başka bir şey yazmıyordu.',
    fields: [
      { key: 'dusunce', label: 'Düşünce', hint: 'Ahmet\'in aklına ilk ne gelmiş olabilir? (Otomatik düşünce)', rows: 2 },
      { key: 'duygu', label: 'Duygu', hint: 'Bu düşünce Ahmet\'te nasıl bir duygu yarattı? (Yoğunluk?)', rows: 2 },
      { key: 'davranis', label: 'Davranış', hint: 'Bu duygu etkisiyle Ahmet ne yaptı ya da yapmadı?', rows: 2 },
    ],
    example: {
      dusunce: '"Bir şey yanlış gitti, işten çıkarılacağım." / "Bir hata yaptım ve bunun hesabını soracak."',
      duygu: 'Kaygı (75/100), Korku (60/100). Mide bölgesinde sıkışma hissi, göğüste gerginlik.',
      davranis: 'O gün işe konsantre olamadı, sürekli patronunun kapısından bakındı, geceyi uykusuz geçirdi, konuyu internette araştırdı.',
    },
    tip: '💡 İpucu: "Duygu" alanına yalnızca duygu adı yazın (kaygı, üzüntü, öfke…). "Sanki işten atılacakmış gibi hissetti" bir duygu değil, düşüncedir.',
    diagramType: 'ddd-basit' as DiagramType,
    diagramLabel: 'DDD Temel Üçgeni — klinik şablon',
  },
  {
    id: 2,
    title: 'Tetikleyicili Döngü',
    subtitle: 'Tetikleyici → Düşünce → Duygu → Davranış',
    difficulty: 'Temel',
    diffColor: 'bg-sky-100 text-sky-700',
    bgColor: 'bg-sky-50',
    theory: [
      'Döngünün başladığı noktaya "tetikleyici" denir. Tetikleyici bir durum, bir nesne, bir kişi, bir düşünce ya da bedensel bir his olabilir.',
      'Tetikleyiciyi tanımlamak formülasyonun ilk adımıdır. Aynı dış olay farklı kişilerde farklı düşüncelere yol açabilir — bu nedenle tetikleyici ile düşünce mutlaka birbirinden ayrı tutulmalıdır.',
      'Danışana "tam o anda aklınıza ne geldi?" sorusu, otomatik düşünceye ulaşmanın en kısa yoludur.',
    ],
    scenario: '📖 Senaryo: Zeynep bir iş toplantısında bir soruya yanlış yanıt verdi ve grubun önünde düzeltildi.',
    fields: [
      { key: 'tetikleyici', label: 'Tetikleyici', hint: 'Döngüyü başlatan dışsal olay ya da durum neydi?', rows: 2 },
      { key: 'dusunce', label: 'Otomatik Düşünce', hint: 'Zeynep\'in aklına ilk ne geldi? ("…" formatında)', rows: 2 },
      { key: 'duygu', label: 'Duygu', hint: 'Bu düşünce hangi duyguyu tetikledi? Yoğunluğu (0–100)?', rows: 2 },
      { key: 'davranis', label: 'Davranış', hint: 'Zeynep ne yaptı?', rows: 2 },
    ],
    example: {
      tetikleyici: 'Toplantıda yanlış yanıt verme ve grubun önünde düzeltilme.',
      dusunce: '"Herkes ne kadar yetersiz olduğumu gördü." / "Aptalım." / "Bir daha toplantıda konuşmayacağım."',
      duygu: 'Utanç (85/100), Mahcubiyet (70/100), Kendine Öfke (60/100).',
      davranis: 'Toplantının geri kalanında hiç konuşmadı; bitince hemen çıktı, öğle yemeğini tek başına yedi, akşam olayı tekrar tekrar zihninde canlandırdı.',
    },
    tip: '💡 İpucu: Tetikleyici her zaman dışsal olmak zorunda değildir. "Dişçi randevusu aklıma geldi" de bir tetikleyici olabilir.',
    diagramType: 'ddd-basit' as DiagramType,
    diagramLabel: 'DDD Temel Üçgeni — tetikleyici ile birlikte',
  },
  {
    id: 3,
    title: 'Geri Bildirim Döngüsü',
    subtitle: 'Döngünün kendi kendini nasıl beslediği',
    difficulty: 'Temel',
    diffColor: 'bg-sky-100 text-sky-700',
    bgColor: 'bg-sky-50',
    theory: [
      'Davranışlar çoğu zaman kısa vadede rahatlatıcı, uzun vadede sorunu pekiştirici sonuçlar doğurur. Bu geri bildirim döngüsü problemi kronik hale getirir.',
      'Kaçınma bir problemi çözmez; aksine kaçılan şeyin "tehlikeli olduğu" inancını güçlendirir. Güvenlik davranışları da aynı mantıkla işler — kişiyi asla gerçekten sınar etmez.',
      'Kısa vade rahatlatma = Uzun vade pekiştirme. Bu mekanizma formülasyonun kalbidir.',
    ],
    scenario: '📖 Senaryo: Can sosyal ortamlarda çok kaygılanıyor. Bu yüzden davetleri reddediyor ve arkadaşlarıyla artık nadiren görüşüyor.',
    fields: [
      { key: 'tetikleyici', label: 'Tetikleyici', hint: 'Döngüyü başlatan nedir?', rows: 2 },
      { key: 'dusunce', label: 'Otomatik Düşünce', hint: 'Can\'ın inancı / düşüncesi nedir?', rows: 2 },
      { key: 'duygu', label: 'Duygu', hint: 'Ne hissediyor?', rows: 2 },
      { key: 'davranis', label: 'Kaçınma Davranışı', hint: 'Kısa vadede rahatlatan davranış nedir?', rows: 2 },
      { key: 'kisa_vade', label: 'Kısa Vadeli Etki', hint: 'Bu davranış hemen ne sağlıyor?', rows: 2 },
      { key: 'uzun_vade', label: 'Uzun Vadeli Etki', hint: 'Aynı davranış zamanla ne yapıyor?', rows: 2 },
    ],
    example: {
      tetikleyici: 'Sosyal ortam daveti ya da sosyal durumu hayal etmek.',
      dusunce: '"Aptal görüneceğim." / "Herkes beni yargılayacak." / "Söyleyecek ilginç bir şeyim yok."',
      duygu: 'Kaygı (80/100), Utanç (60/100).',
      davranis: 'Davetleri reddediyor; "başım ağrıyor" gibi bahaneler üretiyor.',
      kisa_vade: 'Kaygı anında azalıyor, rahatlamış hissediyor.',
      uzun_vade: 'Sosyal becerisi köreltiliyor, yalnızlaşıyor, "sosyal ortamlar tehlikelidir" inancı güçleniyor.',
    },
    tip: '💡 İpucu: Danışana kısa–uzun vade farkını açıklarken şunu sorun: "Bu strateji işe yarıyor mu, yoksa sadece iyi mi hissettiriyor?"',
    diagramType: 'kacinma-ogrenme' as DiagramType,
    diagramLabel: 'Kaçınma / Öğrenme Modeli — klinik şablon',
  },
  {
    id: 4,
    title: 'Panik Atak Formülasyonu',
    subtitle: 'Clark\'ın Bilişsel Modeli (1986)',
    difficulty: 'Orta',
    diffColor: 'bg-amber-100 text-amber-700',
    bgColor: 'bg-amber-50',
    theory: [
      'Panik atak, bedensel belirtileri tehlikeli olarak yorumlamaktan kaynaklanır (Clark, 1986). Bu yanlış yorum kaygıyı artırır; artan kaygı yeni bedensel belirtiler üretir ve döngü tırmanır.',
      '"Kalp krizi geçiriyorum" veya "deliriyorum" gibi felaket yorumları, panik atağın sürmesini sağlayan temel bilişsel çarpıtmalardır.',
      'Güvenlik davranışları kısa vadede rahatlatıcı görünse de "bu davranış olmasaydı ne olurdu?" sorusunu asla yanıtsız bırakır ve inancı sürdürür.',
    ],
    scenario: '📖 Senaryo: Merve markette alışveriş yaparken aniden kalp çarpıntısı hissetti.',
    fields: [
      { key: 'tetikleyici', label: 'Tetikleyici', hint: 'Döngüyü başlatan uyaran neydi?', rows: 2 },
      { key: 'bedensel', label: 'Bedensel Belirti', hint: 'Hangi fiziksel hisler oluştu?', rows: 2 },
      { key: 'yorum', label: 'Felaket Yorumu', hint: 'Merve bu belirtiyi nasıl yorumladı? ("…" formatında)', rows: 2 },
      { key: 'tirmanma', label: 'Kaygının Tırmanması', hint: 'Döngü nasıl ivmelendi? (Belirti → Yorum → Kaygı → Yeni Belirti)', rows: 3 },
      { key: 'guvenlik', label: 'Güvenlik Davranışı', hint: 'Merve kendini "korumak" için ne yaptı?', rows: 2 },
      { key: 'sonuc', label: 'Döngünün Sürmesi', hint: 'Bu davranış inancı uzun vadede nasıl pekiştiriyor?', rows: 2 },
    ],
    example: {
      tetikleyici: 'Kalabalık markette kalp çarpıntısı hissi.',
      bedensel: 'Kalp çarpıntısı, nefes darlığı, baş dönmesi, ellerde uyuşma, terleme.',
      yorum: '"Kalp krizi geçiriyorum." / "Bayılacağım." / "Buradan çıkamazsam ölürüm."',
      tirmanma: 'Çarpıntı (40 kaygı) → "Kalp krizi" yorumu → Kaygı 80 → Nefes darlığı → "Gerçekten ölüyorum" → Kaygı 95 → Tüm bedensel belirtiler şiddetleniyor.',
      guvenlik: 'Hemen dışarı çıktı, yere oturdu, eşini aradı, bir daha markete girmeyeceğine karar verdi.',
      sonuc: '"Çıkmasaydım daha kötü olurdu" inancı güçlendi → Markete girmek giderek zorlaştı → Kaçınma genişledi.',
    },
    tip: '💡 İpucu: Panik atakta yorum kritiktir. "Bunlar panik belirtisi" yorumuyla başlayan biri aynı çarpıntıda panik yaşamaz.',
    diagramType: 'panik' as DiagramType,
    diagramLabel: 'Panik Atak Döngüsü — Clark Modeli',
  },
  {
    id: 5,
    title: 'Sosyal Kaygı Modeli',
    subtitle: 'Clark & Wells (1995)',
    difficulty: 'Orta',
    diffColor: 'bg-amber-100 text-amber-700',
    bgColor: 'bg-amber-50',
    theory: [
      'Clark & Wells modelinde sosyal kaygılı kişi tehlike moduna geçince dikkatini içe çevirir: başkasının tepkisini değil, kendi titremesini/kızarmasını izler. Bu "gözlemci bakış" olumsuz bir benlik imgesi oluşturur.',
      'Güvenlik davranışları (az konuşmak, göz temasından kaçmak, hazırlıklı cümleler kurmak) kısa vadede güvenli hissettirse de sosyal ipuçlarını değerlendirme fırsatını yok eder ve tuhaf görünmeyi artırır.',
      'Olay sonrası işlem (post-event processing): Kişi yaşananları kötüleştirerek tekrar gözden geçirir ve bir sonraki sosyal duruma duyulan kaygıyı artırır.',
    ],
    scenario: '📖 Senaryo: Selin bir iş toplantısında sunum yapacak. Masaya oturur oturmaz kaygılanmaya başlıyor.',
    fields: [
      { key: 'tetikleyici', label: 'Tetikleyici Durum', hint: 'Sosyal durumu tanımlayın.', rows: 2 },
      { key: 'varsayim', label: 'İşlevsiz Varsayım', hint: '"Eğer … olursa …" biçiminde çekirdek inanç', rows: 2 },
      { key: 'ice_cekim', label: 'Dikkat İçe Dönme', hint: 'Selin dikkatini neye yöneltiyor? (Dışarıya değil içeriye)', rows: 2 },
      { key: 'imge', label: 'Olumsuz Benlik İmgesi', hint: 'Kendini nasıl görüyor / hissediyor?', rows: 2 },
      { key: 'guvenlik', label: 'Güvenlik Davranışları', hint: 'Kendini "korumak" için ne yapıyor?', rows: 2 },
      { key: 'olay_sonrasi', label: 'Olay Sonrası İşlem', hint: 'Toplantı bittikten sonra ne düşünüyor?', rows: 2 },
    ],
    example: {
      tetikleyici: 'İş toplantısında 10 kişiye sunum yapma.',
      varsayim: '"Eğer insanlar titrememi fark ederse, beni tamamen yetersiz bulurlar ve bu kesinlikle felaket olur."',
      ice_cekim: 'Sesinin titreip titremediğine, ellerinin görünüp görünmediğine, yüzünün kızarıp kızarmadığına odaklanıyor.',
      imge: 'Kendini kızarmış, titreyen, aptalca görünen biri olarak hayal ediyor; sanki dinleyiciler bunu yakın çekimde izliyor.',
      guvenlik: 'Olabildiğince az konuşuyor, oturmaya devam ediyor, suyu bardak yerine şişeden içiyor, not kağıdına bakıyor.',
      olay_sonrasi: '"Mutlaka fark ettiler." "Sesim titredi, kesin kötü bir izlenim bıraktım." "Bir daha toplantıya girmeyeceğim."',
    },
    tip: '💡 İpucu: Güvenlik davranışlarını sorarken "bunu yapmasan ne olurdu?" sorusu hem tanı hem müdahale için değerlidir.',
    diagramType: 'sosyal-kaygi' as DiagramType,
    diagramLabel: 'Sosyal Kaygı Modeli — Clark & Wells (1995)',
  },
  {
    id: 6,
    title: 'OKB Formülasyonu',
    subtitle: 'Obsesyon → Kompulsiyon → Pekiştirme',
    difficulty: 'İleri',
    diffColor: 'bg-orange-100 text-orange-700',
    bgColor: 'bg-orange-50',
    theory: [
      'OKB\'de tetikleyici bir düşünce/imge/dürtü (obsesyon) ortaya çıkar. Kişi bu düşünceyi anlamlı ve tehlikeli bulur; bu da yoğun sıkıntıya yol açar.',
      'Sıkıntıyı gidermek için kompulsiyonlar devreye girer. Kısa vadede rahatlatır; uzun vadede "obsesyon tehlikeliydi, kompulsiyon olmasa felaket olurdu" inancını pekiştirir.',
      'OKB\'nin bilişsel teorisine göre sorun obsesyonun kendisi değil, kişinin ona atfettiği anlam ve sorumluluk yüküdür. Müdahalenin odağı da burasıdır.',
    ],
    scenario: '📖 Senaryo: Ozan, kapıyı kilitlemeden çıktığını düşünerek işine gidemez hale geldi.',
    fields: [
      { key: 'tetikleyici', label: 'Tetikleyici', hint: 'Obsesyonu başlatan uyaran nedir?', rows: 2 },
      { key: 'obsesyon', label: 'Obsesyon', hint: 'İstenmeden gelen düşünce / imge / dürtü nedir?', rows: 2 },
      { key: 'yorum', label: 'Anlam Yükleme', hint: 'Ozan bu düşünceyi nasıl yorumluyor? (Sorumluluk?)', rows: 2 },
      { key: 'sikintiyi', label: 'Sıkıntı', hint: 'Hangi duygular yaşandı? (0–100)', rows: 2 },
      { key: 'kompulsiyon', label: 'Kompulsiyon', hint: 'Sıkıntıyı azaltmak için ne yaptı?', rows: 2 },
      { key: 'pekisme', label: 'Döngünün Pekişmesi', hint: 'Kompulsiyon kısa ve uzun vadede ne yapıyor?', rows: 3 },
    ],
    example: {
      tetikleyici: 'Ofise giderken kapıyı kapattığı an ya da "kapıyı kilitledim mi?" düşüncesi.',
      obsesyon: '"Kapıyı kilitlemedim, hırsız girebilir, her şeyim çalınabilir, bunun sorumluluğu bende."',
      yorum: '"Bu düşünce geliyorsa bir şeyler olabilir." / "Eğer kontrol etmezsem ve bir şey olursa, suçlu ben olurum."',
      sikintiyi: 'Yoğun kaygı (90/100), ağır sorumluluk duygusu, huzursuzluk, konsantrasyon bozulması.',
      kompulsiyon: 'Geri döndü ve kapıyı 7 kez kontrol etti; her seferinde "tamam mı?" diye kendi kendine sordu.',
      pekisme: 'Kısa vade: Kaygı azaldı. Uzun vade: "Kontrol etmezsem felaket olur" inancı güçlendi; kontrol ritüelinin sayısı ve süresi arttı.',
    },
    tip: '💡 İpucu: "Sorumluluk abartma ölçeği" OKB\'nin bilişsel çekirdeğidir. "Bunu sen mi yaptın, yoksa olmasına izin mi verdiniz?" sorusu ayrımı netleştirir.',
    diagramType: 'basit-obsesyon' as DiagramType,
    diagramLabel: 'Basit OKB Döngüsü — klinik şablon',
  },
  {
    id: 7,
    title: 'Depresyon Formülasyonu',
    subtitle: 'Gelişimsel + Sürdürücü Faktörler',
    difficulty: 'İleri',
    diffColor: 'bg-orange-100 text-orange-700',
    bgColor: 'bg-orange-50',
    theory: [
      'Depresyonun bilişsel modeli iki katmana bakar: (1) Gelişimsel — temel inançların nasıl oluştuğu; (2) Sürdürücü — şimdiki düşünce–duygu–davranış döngüsü.',
      'Temel inançlar ("Sevilmeye değer değilim", "Yetersizim") erken deneyimlerle şekillenir. Kritik bir olay bu inançları aktive eder ve depresyon başlar.',
      'Sürdürücü faktörler: inaktivite, sosyal çekilme, ruminasyon ve öz-eleştiri. Bunlar birbirini besler. Tedavide genellikle davranışsal aktivasyonla başlanır çünkü inaktivite diğer tüm faktörleri besler.',
    ],
    scenario: '📖 Senaryo: Elif, ilişkisi bittikten sonra 3 aydır yataktan çıkamıyor ve kendini "başarısız ve sevilemez" hissediyor.',
    fields: [
      { key: 'erken_deneyim', label: 'Erken Yaşantı', hint: 'Temel inancı besleyen geçmiş deneyimler neler olabilir?', rows: 3 },
      { key: 'temel_inanc', label: 'Temel İnanç', hint: 'Kendine, dünyaya ve geleceğe dair çekirdek inanç nedir?', rows: 2 },
      { key: 'kritik_olay', label: 'Kritik Olay', hint: 'Depresyonu tetikleyen olay neydi?', rows: 2 },
      { key: 'surdurucu', label: 'Sürdürücü Faktörler', hint: 'Depresyonu devam ettiren düşünce / duygu / davranış neler?', rows: 3 },
      { key: 'kognitif_uclu', label: 'Bilişsel Üçlü (Beck)', hint: 'Elif kendine, dünyaya ve geleceğe ne düşünüyor?', rows: 3 },
      { key: 'hedef', label: 'Müdahale Hedefi', hint: 'Bu formülasyona dayanarak önce neyi hedeflerdiniz?', rows: 2 },
    ],
    example: {
      erken_deneyim: 'Duygusal açıdan mesafeli ebeveyn; başarı için koşullu sevgi; kardeşiyle sürekli karşılaştırılma.',
      temel_inanc: '"Sevilmek için mükemmel olmam gerekir." / "Sevilmeye değer değilim." / "Bir ilişkim bitmek zorundaysa yetersizim demektir."',
      kritik_olay: 'Uzun süreli ilişkinin aniden bitmesi; partnerinin "sen yeterli değilsin" demesi.',
      surdurucu: 'Gün boyu yatma (inaktivite), arkadaşları reddetme (sosyal çekilme), "neden böyleyim" ruminasyonu, yoğun öz-eleştiri.',
      kognitif_uclu: 'Kendine: "Başarısız ve sevilemez biri." Dünya: "Hiç kimse gerçekten umursamıyor." Gelecek: "Hiçbir zaman mutlu olamayacağım."',
      hedef: 'Davranışsal aktivasyon (yataktan kalkma rutinleri) → Ruminasyon tanıma ve erteleme → Temel inanç çalışması.',
    },
    tip: '💡 İpucu: Depresyonda erken müdahale noktası davranıştır (kalkma, hareket, bağlantı), çünkü bilişsel çalışma için enerjiye ihtiyaç vardır.',
    diagramType: 'depresyon-gelisimsel' as DiagramType,
    diagramLabel: 'Depresyon Gelişimsel Modeli — Beck',
  },
  {
    id: 8,
    title: 'Bütünleşik Formülasyon',
    subtitle: '5P Modeli — Tam Vaka Kavramsallaştırması',
    difficulty: 'Uzman',
    diffColor: 'bg-purple-100 text-purple-700',
    bgColor: 'bg-purple-50',
    theory: [
      '5P Modeli bir danışanın sorununu beş boyutta ele alır: Predispozan (yatkınlık), Presipitan (tetikleyen), Perpetuan (sürdürücü), Protektif (koruyucu) ve Presenting problem (sunum sorunu).',
      'Bu model farklı teorik yönelimlere uyarlanabilir ve vaka kavramsallaştırmasını bütünleşik biçimde sunar. Süpervizyon ve konsültasyon süreçlerinde yaygın olarak kullanılır.',
      'Formülasyon bir hipotez olarak sunulur ve danışanla birlikte gözden geçirilir. İyi bir formülasyon "Bu kişi neden bu sorunu şu anda yaşıyor?" sorusuna tutarlı bir yanıt verir.',
    ],
    scenario: '📖 Senaryo: 34 yaşında Mert, son 6 aydır iş hayatında yoğun kaygı, uykusuzluk ve konsantrasyon güçlüğü yaşıyor. Şirkette yönetici oldu; belirtiler bu geçişin ardından başladı. Babası otoriter ve eleştirici; annesini çok erken kaybetti.',
    fields: [
      { key: 'presenting', label: 'Sunum Sorunu', hint: 'Danışanın getirdiği ana şikayet ve bağlamı nedir?', rows: 3 },
      { key: 'predispozan', label: 'Predispozan Faktörler', hint: 'Soruna yatkınlık yaratan geçmiş etkenler neler?', rows: 3 },
      { key: 'presipitan', label: 'Presipitan Faktörler', hint: 'Sorunu tetikleyen olay ya da değişiklik neydi?', rows: 2 },
      { key: 'perpetuan', label: 'Perpetuan Faktörler', hint: 'Sorunu sürdüren düşünce, duygu ve davranışlar neler?', rows: 3 },
      { key: 'protektif', label: 'Protektif Faktörler', hint: 'Danışanın güçlü yanları ve koruyucu kaynakları neler?', rows: 2 },
      { key: 'hipotez', label: 'Bütünleşik Hipotez', hint: 'Tüm bu bilgileri birleştirerek bir paragraf formülasyon yazın.', rows: 4 },
    ],
    example: {
      presenting: 'Kaygı, uykusuzluk ve konsantrasyon güçlüğü. Son 6 ay, yöneticilik pozisyonuna geçişle başlamış. İş arkadaşlarının onu yargılayacağından, yetkin görünmeyeceğinden korkuyor.',
      predispozan: 'Eleştirici ve otoriter baba; erken anne kaybı (kayıp ve terk edilme temaları); "başarı = sevgi" koşullu inanç kalıbı; mükemmeliyetçi kişilik örüntüsü.',
      presipitan: 'Yöneticiliğe geçiş → Performans beklentilerinin artması → Hata yapma / yetersiz görünme riskinin yükselmesi.',
      perpetuan: 'Ruminasyon ("acaba yanlış mı yaptım?"), aşırı iş saatleri (mükemmeliyetçilik), zor kararları erteleme (kaçınma), uyku bozukluğu (konsantrasyonu düşürüyor).',
      protektif: 'Yüksek içgörü, terapiye açıklık, sosyal destek (eşi), mesleki başarı geçmişi, iyi problem çözme becerileri.',
      hipotez: 'Mert, erken anne kaybı ve otoriter babanın etkisiyle "sevilmek için başarılı olmam gerekir" temel inancını geliştirmiş görünmektedir. Yöneticiliğe geçiş bu inancı aktive etmiştir. Kaygı → ruminasyon → uyku bozukluğu → konsantrasyon azalması → performans endişesi döngüsü sorunu sürdürmektedir.',
    },
    tip: '💡 İpucu: Formülasyonu danışanla paylaşırken "Bu size doğru geliyor mu?" diye sorun. Danışanın doğrulaması terapötik ittifakı güçlendirir.',
    diagramType: 'depresyon-gelisimsel' as DiagramType,
    diagramLabel: 'Gelişimsel Formülasyon Şeması (örnek)',
  },
];

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'pratik_yap_v1';

function loadProgress(): Progress {
  if (typeof window === 'undefined') return { completed: [], answers: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completed: [], answers: {} };
}

function saveProgress(p: Progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DiffBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>
      {label}
    </span>
  );
}

function PhaseTab({ label, icon: Icon, active, done, onClick }: {
  label: string; icon: React.ComponentType<{ className?: string }>;
  active: boolean; done: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
        active
          ? 'bg-[#0E0F12] text-white'
          : done
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {done && !active && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
    </button>
  );
}

// ─── Diagram Block ────────────────────────────────────────────────────────────

function DiagramBlock({ type, label }: { type: DiagramType; label: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left bg-indigo-50 hover:bg-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-indigo-700">Klinik Şablon: {label}</span>
        </div>
        {open
          ? <ChevronRight className="w-4 h-4 text-indigo-400 rotate-90 transition-transform" />
          : <ChevronRight className="w-4 h-4 text-indigo-400 transition-transform" />
        }
      </button>
      {open && (
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-3 italic">
            Bu, az önce öğrendiğiniz modelin klinik formülasyon şablonudur. Danışanlarınızla çalışırken bu şablonu kullanacaksınız.
          </p>
          <DiagramViewer type={type} />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PratikYap() {
  const [progress, setProgress] = useState<Progress>({ completed: [], answers: {} });
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [phase, setPhase] = useState<Phase>('learn');
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const updateProgress = (p: Progress) => {
    setProgress(p);
    saveProgress(p);
  };

  const isUnlocked = (id: number) => id === 1 || progress.completed.includes(id - 1);
  const isCompleted = (id: number) => progress.completed.includes(id);

  const level = LEVELS.find(l => l.id === selectedLevel)!;
  const answers = progress.answers[selectedLevel] ?? {};
  const allFilled = level.fields.every(f => (answers[f.key] ?? '').trim().length > 0);
  const completedCount = progress.completed.length;

  const setAnswer = (key: string, value: string) => {
    const newAnswers = {
      ...progress.answers,
      [selectedLevel]: { ...(progress.answers[selectedLevel] ?? {}), [key]: value },
    };
    updateProgress({ ...progress, answers: newAnswers });
  };

  const completeLevel = () => {
    const newCompleted = progress.completed.includes(selectedLevel)
      ? progress.completed
      : [...progress.completed, selectedLevel];
    updateProgress({ ...progress, completed: newCompleted });
    setPhase('compare');
    setShowExample(true);
  };

  const resetLevel = () => {
    const newAnswers = { ...progress.answers };
    delete newAnswers[selectedLevel];
    const newCompleted = progress.completed.filter(id => id !== selectedLevel);
    updateProgress({ ...progress, answers: newAnswers, completed: newCompleted });
    setPhase('practice');
    setShowExample(false);
  };

  const handleSelectLevel = (id: number) => {
    if (!isUnlocked(id)) return;
    setSelectedLevel(id);
    setPhase(isCompleted(id) ? 'compare' : 'learn');
    setShowExample(isCompleted(id));
  };

  return (
    <div className="flex gap-4 min-h-[600px]">

      {/* ── Left: Level List ── */}
      <div className="w-56 flex-shrink-0 space-y-1.5">
        {/* Progress header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">İlerleme</span>
            <span className="text-xs text-gray-500">{completedCount}/{LEVELS.length}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / LEVELS.length) * 100}%` }}
            />
          </div>
          {completedCount === LEVELS.length && (
            <div className="mt-2 flex items-center gap-1 text-amber-600 text-[10px] font-semibold">
              <Trophy className="w-3 h-3" /> Tüm seviyeler tamamlandı!
            </div>
          )}
        </div>

        {LEVELS.map(l => {
          const unlocked = isUnlocked(l.id);
          const completed = isCompleted(l.id);
          const active = selectedLevel === l.id;

          return (
            <button
              key={l.id}
              onClick={() => handleSelectLevel(l.id)}
              disabled={!unlocked}
              className={`w-full text-left rounded-2xl border px-3 py-2.5 transition-all ${
                !unlocked
                  ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                  : active
                  ? 'bg-[#0E0F12] border-[#0E0F12] text-white shadow-sm'
                  : completed
                  ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                  : 'bg-white border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[10px] font-bold ${active ? 'text-white/60' : 'text-gray-400'}`}>
                  SEVİYE {l.id}
                </span>
                {!unlocked && <Lock className="w-3 h-3 text-gray-400" />}
                {completed && !active && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                {active && !completed && <ChevronRight className="w-3.5 h-3.5 text-white/60" />}
              </div>
              <p className={`text-xs font-semibold leading-tight ${active ? 'text-white' : 'text-[#0E0F12]'}`}>
                {l.title}
              </p>
              <div className="mt-1">
                <DiffBadge
                  label={l.difficulty}
                  color={active ? 'bg-white/20 text-white' : l.diffColor}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Right: Level Content ── */}
      <div className="flex-1 min-w-0">
        {/* Level header */}
        <div className={`rounded-2xl border border-gray-100 p-5 mb-4 ${level.bgColor}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Seviye {level.id}</span>
                <DiffBadge label={level.difficulty} color={level.diffColor} />
                {isCompleted(level.id) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Tamamlandı
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-[#0E0F12]">{level.title}</h2>
              <p className="text-sm text-gray-600">{level.subtitle}</p>
            </div>
            {isCompleted(level.id) && (
              <button
                onClick={resetLevel}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                title="Cevapları sıfırla"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
              </button>
            )}
          </div>

          {/* Phase selector */}
          <div className="flex gap-2 mt-4">
            <PhaseTab label="Öğren" icon={BookOpen} active={phase === 'learn'} done={phase !== 'learn'} onClick={() => setPhase('learn')} />
            <PhaseTab label="Pratik" icon={Pencil} active={phase === 'practice'} done={isCompleted(level.id)} onClick={() => setPhase('practice')} />
            <PhaseTab label="Karşılaştır" icon={BarChart2} active={phase === 'compare'} done={false} onClick={() => { if (isCompleted(level.id)) setPhase('compare'); }} />
          </div>
        </div>

        {/* ── Phase: Öğren ── */}
        {phase === 'learn' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-[#0E0F12]">Kuramsal Temel</h3>
              </div>
              <div className="space-y-3">
                {level.theory.map((para, i) => (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed">{para}</p>
                ))}
              </div>
            </div>

            {level.tip && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">{level.tip}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-[#0E0F12] mb-2">Bu Seviyede Ne Yapacaksınız?</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Aşağıdaki senaryo için{' '}
                <strong className="text-[#0E0F12]">{level.fields.length} alan</strong> dolduracaksınız.
                Tüm alanlar doldurulduğunda seviyeyi tamamlayıp örnek cevapla karşılaştırabileceksiniz.
              </p>
              <button
                onClick={() => setPhase('practice')}
                className="inline-flex items-center gap-2 bg-[#0E0F12] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#1A1B22] transition-colors"
              >
                <Pencil className="w-4 h-4" /> Pratiğe Başla
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Phase: Pratik ── */}
        {phase === 'practice' && (
          <div className="space-y-4">
            {/* Scenario */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm text-gray-800 leading-relaxed">{level.scenario}</p>
            </div>

            {/* Fields */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#0E0F12] mb-1">Alanları Doldurun</h3>
              {level.fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{f.label}</label>
                  <p className="text-[11px] text-gray-400 mb-1.5">{f.hint}</p>
                  <textarea
                    value={answers[f.key] ?? ''}
                    onChange={e => setAnswer(f.key, e.target.value)}
                    rows={f.rows ?? 2}
                    className="w-full rounded-xl border border-gray-200 bg-[#F4F5F8] px-3 py-2 text-sm text-[#0E0F12] resize-none focus:outline-none focus:ring-2 focus:ring-[#0E0F12]/20 transition"
                    placeholder="Yanıtınızı yazın…"
                  />
                </div>
              ))}
            </div>

            {level.tip && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">{level.tip}</p>
              </div>
            )}

            <button
              onClick={completeLevel}
              disabled={!allFilled}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {allFilled ? 'Tamamla & Karşılaştır' : `${level.fields.filter(f => (answers[f.key] ?? '').trim().length > 0).length}/${level.fields.length} alan dolduruldu`}
            </button>
          </div>
        )}

        {/* ── Phase: Karşılaştır ── */}
        {phase === 'compare' && (
          <div className="space-y-4">
            {!isCompleted(level.id) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
                Bu seviyeyi tamamlamak için önce "Pratik" sekmesinden tüm alanları doldurun.
              </div>
            )}

            {isCompleted(level.id) && (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[#0E0F12]">Yanıt Karşılaştırması</h3>
                    <button
                      onClick={() => setShowExample(!showExample)}
                      className="text-xs text-gray-500 hover:text-[#0E0F12] flex items-center gap-1 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                      {showExample ? 'Örneği Gizle' : 'Örnek Cevabı Göster'}
                    </button>
                  </div>

                  <div className="space-y-5">
                    {level.fields.map(f => (
                      <div key={f.key} className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                          <span className="text-xs font-semibold text-gray-700">{f.label}</span>
                        </div>
                        <div className={`grid ${showExample ? 'md:grid-cols-2' : 'grid-cols-1'} divide-x divide-gray-100`}>
                          {/* My answer */}
                          <div className="p-3">
                            <p className="text-[10px] font-semibold text-indigo-600 mb-1.5 uppercase tracking-wide">Benim Yanıtım</p>
                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {(answers[f.key] ?? '').trim() || <span className="text-gray-400 italic">Yanıt girilmemiş</span>}
                            </p>
                          </div>
                          {/* Example answer */}
                          {showExample && (
                            <div className="p-3 bg-emerald-50/40">
                              <p className="text-[10px] font-semibold text-emerald-600 mb-1.5 uppercase tracking-wide">Örnek Yanıt</p>
                              <p className="text-xs text-gray-700 leading-relaxed">{level.example[f.key]}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {level.tip && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                    <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">{level.tip}</p>
                  </div>
                )}

                {/* ── Klinik Formülasyon Şablonu ── */}
                {level.diagramType && (
                  <DiagramBlock type={level.diagramType} label={level.diagramLabel ?? 'Klinik Formülasyon Şablonu'} />
                )}

                {/* Next level button */}
                {selectedLevel < LEVELS.length && (
                  <button
                    onClick={() => {
                      const next = selectedLevel + 1;
                      setSelectedLevel(next);
                      setPhase('learn');
                      setShowExample(false);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#0E0F12] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#1A1B22] transition-colors"
                  >
                    Sonraki Seviye: {LEVELS[selectedLevel]?.title}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {selectedLevel === LEVELS.length && (
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-5 text-center">
                    <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-amber-800 mb-1">Tebrikler!</h3>
                    <p className="text-xs text-amber-700">Tüm seviyeleri başarıyla tamamladınız. Artık bütünleşik formülasyon yapabilecek düzeyde bilgi ve pratiğe sahipsiniz.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
