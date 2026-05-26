'use client';

import React, { useState } from 'react';
import { Check, Plus, Trash2, ChevronDown, ChevronRight, Leaf } from 'lucide-react';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

type SessionStep = { week: string; title: string; focus: string; done: boolean };

const PROTOCOL_TEMPLATES: Record<string, SessionStep[]> = {
  'panik-10w': [
    { week: '1', title: 'Psikoeğitim & Nefes', focus: 'Panik modeli, diyafragmatik nefes tekniği', done: false },
    { week: '2', title: 'Beden Farkındalığı', focus: 'Interoceptive exposure girişi, bedensel ipuçları', done: false },
    { week: '3', title: 'Bilişsel Yeniden Yapılandırma 1', focus: 'Felaket düşünceleri, olasılık değerlendirme', done: false },
    { week: '4', title: 'Bilişsel Yeniden Yapılandırma 2', focus: 'Güvenlik davranışları, güvenlik sinyalleri', done: false },
    { week: '5', title: 'Interoceptive Exposure', focus: 'Kalp çarpıntısı, nefes tutma egzersizleri', done: false },
    { week: '6', title: 'Durumsal Maruz Bırakma 1', focus: 'Kaçınılan tetikleyiciler, hiyerarşi oluşturma', done: false },
    { week: '7', title: 'Durumsal Maruz Bırakma 2', focus: 'Hiyerarşide orta düzey egzersizler', done: false },
    { week: '8', title: 'Durumsal Maruz Bırakma 3', focus: 'Zor tetikleyicilerle çalışma', done: false },
    { week: '9', title: 'Nüksü Önleme', focus: 'Kazanımları pekiştirme, erken uyarı planı', done: false },
    { week: '10', title: 'Sonlandırma & İzlem Planı', focus: 'Gelecek hedefler, kriz planı', done: false },
  ],
  'ocd-12w': [
    { week: '1', title: 'Psikoeğitim', focus: 'OKB modeli, düşünce-eylem füzyonu', done: false },
    { week: '2', title: 'Belirti Haritası', focus: 'Obsesyon & kompülsiyon envanteri, zincir analizi', done: false },
    { week: '3', title: 'ERP Girişi', focus: 'ERP prensibi, hiyerarşi oluşturma', done: false },
    { week: '4', title: 'ERP — Hafif Tetikleyiciler', focus: 'Düşük anksiyete düzeyinde maruz bırakma', done: false },
    { week: '5', title: 'ERP — Orta Tetikleyiciler', focus: 'Orta anksiyete; kompülsiyon erteleme', done: false },
    { week: '6', title: 'ERP — Orta/Zor', focus: 'Zaman sınırlı kompülsiyon azaltma', done: false },
    { week: '7', title: 'Bilişsel Çalışma', focus: 'Sorumluluk aşırı yükleme, belirsizlik toleransı', done: false },
    { week: '8', title: 'ERP — Zor Tetikleyiciler', focus: 'En kaçınılan durumlar', done: false },
    { week: '9', title: 'Metabilişsel Çalışma', focus: 'Düşünce kontrolü inanışları', done: false },
    { week: '10', title: 'Aile/Çevre Düzenlemeleri', focus: 'Ailenin kompülsiyon desteklemesini azaltma', done: false },
    { week: '11', title: 'Nüksü Önleme', focus: 'Tehlike işaretleri, erken müdahale', done: false },
    { week: '12', title: 'Sonlandırma', focus: 'Kazanımlar, yaşam kalitesi hedefleri', done: false },
  ],
  'depresyon-16w': [
    { week: '1', title: 'Psikoeğitim & Aktivasyon', focus: 'Depresyon modeli, davranışsal aktivasyon temelleri', done: false },
    { week: '2', title: 'Aktivite İzleme', focus: 'Günlük aktivite ve ruh hali kaydı', done: false },
    { week: '3', title: 'Aktivite Planlaması', focus: 'Keyif & ustalık aktiviteleri çizelgesi', done: false },
    { week: '4', title: 'Sosyal Aktivasyon', focus: 'Sosyal geri çekilmeyi azaltma', done: false },
    { week: '5', title: 'Otomatik Düşünceler 1', focus: 'Düşünce günlüğü, ABC modeli', done: false },
    { week: '6', title: 'Otomatik Düşünceler 2', focus: 'Bilişsel çarpıtmalar, kanıt inceleme', done: false },
    { week: '7', title: 'Sokratik Sorgulama', focus: 'Güdümlü keşif, alternatif perspektifler', done: false },
    { week: '8', title: 'Orta İnançlar', focus: 'Kurallar ve varsayımlar, koşullu inançlar', done: false },
    { week: '9', title: 'Çekirdek İnançlar', focus: 'Derin inanış kalıpları, tarihsel test', done: false },
    { week: '10', title: 'Şema Çalışması', focus: 'Erken deneyimler, telafi stratejileri', done: false },
    { week: '11', title: 'Problem Çözme', focus: 'Yapılandırılmış problem çözme adımları', done: false },
    { week: '12', title: 'İletişim Becerileri', focus: 'Atılganlık, ilişki örüntüleri', done: false },
    { week: '13', title: 'Ruminasyon Çalışması', focus: 'Endişe/ruminasyon ayrımı, dikkat odağı', done: false },
    { week: '14', title: 'Nüksü Önleme 1', focus: 'Tetikleyiciler, erken belirti farkındalığı', done: false },
    { week: '15', title: 'Nüksü Önleme 2', focus: 'Baş etme planı, destek ağı', done: false },
    { week: '16', title: 'Sonlandırma', focus: 'Kazanımlar, gelecek hedefler, izlem planı', done: false },
  ],
  'sosyal-anksiyete-12w': [
    { week: '1', title: 'Psikoeğitim', focus: 'Sosyal anksiyete modeli, güvenlik davranışları', done: false },
    { week: '2', title: 'Dikkatin Dışa Yöneltilmesi', focus: 'Öz-odak vs dış odak egzersizleri', done: false },
    { week: '3', title: 'Video Geri Bildirimi', focus: 'Olumsuz imge kırma, nesnel öz-imge', done: false },
    { week: '4', title: 'Bilişsel Yeniden Yapılandırma', focus: 'Sosyal tehdit inançları, olasılık değerlendirme', done: false },
    { week: '5', title: 'Maruz Bırakma Hiyerarşisi', focus: 'Hiyerarşi oluşturma, güvenlik dvr. bırakma', done: false },
    { week: '6', title: 'Maruz Bırakma 1', focus: 'Düşük anksiyete tetikleyicileri', done: false },
    { week: '7', title: 'Maruz Bırakma 2', focus: 'Orta düzey sosyal durumlar', done: false },
    { week: '8', title: 'Maruz Bırakma 3', focus: 'Zor sosyal durumlar', done: false },
    { week: '9', title: 'Sosyal Beceriler', focus: 'Konuşma başlatma, aktif dinleme', done: false },
    { week: '10', title: 'Utanç Saldırıları', focus: 'Utanç toleransı egzersizleri', done: false },
    { week: '11', title: 'Nüksü Önleme', focus: 'Tehlike işaretleri, idame planı', done: false },
    { week: '12', title: 'Sonlandırma', focus: 'Kazanımlar, uzun vadeli hedefler', done: false },
  ],
  'yab-10w': [
    { week: '1', title: 'Psikoeğitim & Endişe Analizi', focus: 'YAB modeli, endişe işlevi, anksiyete döngüsü', done: false },
    { week: '2', title: 'Endişe Günlüğü', focus: 'Endişe içeriği, tetikleyiciler, sıklık', done: false },
    { week: '3', title: 'Belirsizlik Toleransı', focus: 'Belirsizlik intoleransı inançları, test etme', done: false },
    { week: '4', title: 'Pozitif Endişe İnançları', focus: 'Endişenin yararlılığı inancını sorgulama', done: false },
    { week: '5', title: 'Problem Çözme Eğitimi', focus: 'Çözülebilir vs çözülemez sorunlar', done: false },
    { week: '6', title: 'Bilişsel Kaçınma', focus: 'Görüntü tabanlı endişeye geçiş', done: false },
    { week: '7', title: 'Endişe Zamanı', focus: 'Yapılandırılmış endişe zamanı uygulaması', done: false },
    { week: '8', title: 'Gevşeme & Farkındalık', focus: 'Kas gevşemesi, dikkat çekme egzersizleri', done: false },
    { week: '9', title: 'Nüksü Önleme', focus: 'Uyarı işaretleri, baş etme planı', done: false },
    { week: '10', title: 'Sonlandırma', focus: 'Kazanımlar, yaşam kalitesi hedefleri', done: false },
  ],
  'travma-12w': [
    { week: '1', title: 'Psikoeğitim & Güvenlik', focus: 'TSSB modeli, duygu düzenleme temelleri', done: false },
    { week: '2', title: 'Travma Geçmişi', focus: 'Travma envanteri, güvenli olmayan bellek', done: false },
    { week: '3', title: 'Bilişsel Çarpıtmalar', focus: 'Travmaya özgü inanışlar, sorumluluk', done: false },
    { week: '4', title: 'Travma Anlatısı Hazırlığı', focus: 'Anlatı çalışmasına giriş, güvenlik sağlama', done: false },
    { week: '5', title: 'Travma Anlatısı 1', focus: 'Detaylı anlatı yazımı', done: false },
    { week: '6', title: 'Travma Anlatısı 2', focus: 'Anlatı gözden geçirme, yeniden yapılandırma', done: false },
    { week: '7', title: 'Bilişsel Yeniden Yapılandırma', focus: 'Kırık dünya ve güvenlik inançları', done: false },
    { week: '8', title: 'Duygu İşleme', focus: 'Utanç, suçluluk, öfke', done: false },
    { week: '9', title: 'Tetikleyici Yönetimi', focus: 'Dissosiyatif yanıtlar, grounding', done: false },
    { week: '10', title: 'Acı & Anlam', focus: 'Anlam bulma, gelecek yönelimi', done: false },
    { week: '11', title: 'Nüksü Önleme', focus: 'Uyarı işaretleri, baş etme planı', done: false },
    { week: '12', title: 'Sonlandırma', focus: 'Büyüme, yeni kimlik, izlem planı', done: false },
  ],
  'act-8w': [
    { week: '1', title: 'Yaratıcı Çaresizlik', focus: 'Kontrol gündemi, işlevsiz stratejiler', done: false },
    { week: '2', title: 'Kabul & Defüzyon', focus: 'Kabul egzersizleri, metafor tanıtımı', done: false },
    { week: '3', title: 'Şimdiki Ana Temas', focus: 'Mindfulness temelleri, beden farkındalığı', done: false },
    { week: '4', title: 'Gözlemci Benlik', focus: 'Bağlam olarak benlik, satranç tahtası metaforu', done: false },
    { week: '5', title: 'Değerler Tespiti', focus: 'Değer alanları, değer vs hedef ayrımı', done: false },
    { week: '6', title: 'Kararlı Eylem 1', focus: 'Değer yönüne ilk adımlar, SMART eylem', done: false },
    { week: '7', title: 'Kararlı Eylem 2', focus: 'Engelleri aşma, esneklik pratiği', done: false },
    { week: '8', title: 'Sonlandırma', focus: 'Psikolojik esneklik özeti, devam planı', done: false },
  ],
};

// ─── ACT Hexaflex süreç etiketleri ───────────────────────────────────────────
// K=Kabul  D=Defüzyon  Ş=Şimdiki An  G=Gözlemci Benlik  V=Değerler  KE=Kararlı Eylem  YÇ=Yaratıcı Çaresizlik

type ActProcess = 'YÇ' | 'K' | 'D' | 'Ş' | 'G' | 'V' | 'KE';
type ActStep = SessionStep & { process?: ActProcess };

const ACT_PROCESS_LABELS: Record<ActProcess, { label: string; color: string }> = {
  YÇ: { label: 'Yaratıcı Çaresizlik', color: 'bg-rose-100 text-rose-700' },
  K:  { label: 'Kabul',               color: 'bg-sky-100 text-sky-700' },
  D:  { label: 'Defüzyon',            color: 'bg-violet-100 text-violet-700' },
  Ş:  { label: 'Şimdiki An',          color: 'bg-teal-100 text-teal-700' },
  G:  { label: 'Gözlemci Benlik',     color: 'bg-amber-100 text-amber-700' },
  V:  { label: 'Değerler',            color: 'bg-emerald-100 text-emerald-700' },
  KE: { label: 'Kararlı Eylem',       color: 'bg-orange-100 text-orange-700' },
};

const ACT_TEMPLATES: Record<string, ActStep[]> = {
  'act-genel-8w': [
    { week: '1', title: 'Yaratıcı Çaresizlik & Psikoeğitim', focus: 'ACT rationale, kontrol gündeminin maliyeti, "Batağa Saplanma" metaforu', done: false, process: 'YÇ' },
    { week: '2', title: 'Kabul — Duygulara Yer Açma', focus: 'Yolcu metaforu, genişleme egzersizleri, deneyimsel kaçınmanın tanımlanması', done: false, process: 'K' },
    { week: '3', title: 'Bilişsel Defüzyon', focus: '"Yapraklar akıyor" egzersizi, "Zihin adlandırma", düşünceleri gözlemleme', done: false, process: 'D' },
    { week: '4', title: 'Şimdiki Ana Temas', focus: 'Nefes farkındalığı, 5-duyu tarama, "radyo" metaforu, esnek dikkat', done: false, process: 'Ş' },
    { week: '5', title: 'Gözlemci Benlik', focus: 'Satranç tahtası metaforu, "Ben kimim?" sorusu, perspektif alma egzersizleri', done: false, process: 'G' },
    { week: '6', title: 'Değerler Tespiti', focus: 'Bull\'s Eye (Boğa Gözü) egzersizi, 9 değer alanı, değer vs hedef ayrımı', done: false, process: 'V' },
    { week: '7', title: 'Kararlı Eylem', focus: 'SMART eylem adımları, "Psikolojik Esneklik Matrisi", engel belirleme', done: false, process: 'KE' },
    { week: '8', title: 'Sonlandırma & Devam Planı', focus: 'Hexaflex özeti, "Hayatımın Kitabı" metaforu, kriz planı', done: false, process: 'KE' },
  ],
  'act-depresyon-10w': [
    { week: '1',  title: 'Psikoeğitim & Yaratıcı Çaresizlik', focus: 'Depresyon-kaçınma döngüsü, mevcut stratejilerin işlevselliğini sorgulama, "Bataklık" metaforu', done: false, process: 'YÇ' },
    { week: '2',  title: 'Davranışsal Aktivasyon Temeli',       focus: 'Değer yönelimli aktivasyon (BDT aktivasyonundan farkı), ruh hali-aktivite bağlantısı', done: false, process: 'KE' },
    { week: '3',  title: 'Kabul — Depresif Duygulara Alan Açma', focus: 'Genişleme & izin verme, "Kavuşma" egzersizi, kaçınma maliyeti', done: false, process: 'K' },
    { week: '4',  title: 'Bilişsel Defüzyon',                   focus: '"Zihin çamuru", depresif otomatik düşünceleri etiketleme, "değerlendirme makinesi"', done: false, process: 'D' },
    { week: '5',  title: 'Şimdiki Ana Temas',                   focus: 'Ruminasyondan farkındalığa geçiş, "şimdiki an egzersizleri", 10 nefes pratiği', done: false, process: 'Ş' },
    { week: '6',  title: 'Gözlemci Benlik',                     focus: '"Ben depresyon değilim" ayrımı, bağlam olarak benlik, süreklilik hissi', done: false, process: 'G' },
    { week: '7',  title: 'Değerler — Anlam Kaynakları',         focus: 'Bull\'s Eye egzersizi, değer yönlü yaşamın önündeki engeller, "Cenaze Konuşması" egzersizi', done: false, process: 'V' },
    { week: '8',  title: 'Kararlı Eylem 1',                     focus: 'Küçük adımlar, değer aktivasyonu, depresif engellerle çalışma', done: false, process: 'KE' },
    { week: '9',  title: 'Kararlı Eylem 2 & Entegrasyon',       focus: 'Psikolojik esneklik matrisi, kaçınma örüntülerine geri dönüşlerle çalışma', done: false, process: 'KE' },
    { week: '10', title: 'Sonlandırma',                         focus: 'Hexaflex kişisel özeti, "Pusula" metaforu, gelecek yönelimi', done: false, process: 'V' },
  ],
  'act-anksiyete-10w': [
    { week: '1',  title: 'Anksiyete ile Savaşmanın Maliyeti',   focus: '"Çin Parmak Tuzağı" metaforu, kontrol stratejilerinin listesi, yaratıcı çaresizlik', done: false, process: 'YÇ' },
    { week: '2',  title: 'Anksiyete Psikoeğitimi & ACT Modeli', focus: 'Anksiyetenin işlevi, hayatta kalma beynine ACT bakışı, "Bataklık" metaforu', done: false, process: 'YÇ' },
    { week: '3',  title: 'Kabul — Anksiyeteye Alan Açma',       focus: 'Beden tarama, anksiyeteye izin verme, "Sörf" metaforu — dalgaya binme', done: false, process: 'K' },
    { week: '4',  title: 'Bilişsel Defüzyon',                   focus: '"Endişe makinesi" adlandırma, "yapraklar akıyor", kaygı düşüncelerini gözlemleme', done: false, process: 'D' },
    { week: '5',  title: 'Şimdiki Ana Temas',                   focus: '"Radyo" metaforu, 5-duyu egzersizleri, anksiyete zirvesinde farkındalık', done: false, process: 'Ş' },
    { week: '6',  title: 'Gözlemci Benlik',                     focus: 'Satranç tahtası metaforu, "Ben anksiyete değilim", ayna egzersizi', done: false, process: 'G' },
    { week: '7',  title: 'Değerler & Kaçınmanın Hedefi',        focus: 'Anksiyete yüzünden vazgeçilenler, değer alanları haritalama', done: false, process: 'V' },
    { week: '8',  title: 'Kararlı Eylem — Değer Yönlü Maruz Bırakma', focus: 'ACT-tabanlı değer yönlü exposure (control-based değil), hiyerarşi', done: false, process: 'KE' },
    { week: '9',  title: 'Engeller & Geri Dönüşlerle Çalışma',  focus: 'Psikolojik esneklik matrisi, kaçınma tetikleyicileri, esneklik egzersizleri', done: false, process: 'KE' },
    { week: '10', title: 'Sonlandırma',                         focus: '"Pusula" — değer yönlü hayat, hexaflex özeti, devam planı', done: false, process: 'V' },
  ],
  'act-travma-12w': [
    { week: '1',  title: 'Güvenlik & Psikoeğitim',              focus: 'Travma tepkilerinin normalleştirilmesi, ACT rationale, güvenlik zemini oluşturma', done: false, process: 'YÇ' },
    { week: '2',  title: 'Yaratıcı Çaresizlik',                 focus: 'Kaçınma maliyetleri, travmayı "yönetme" çabalarının işlevselliği', done: false, process: 'YÇ' },
    { week: '3',  title: 'Kabul — Travmayla İlgili Duygulara Alan', focus: 'Genişleme egzersizleri, utanç-suçluluk kabulü, "alan açma" nüansları', done: false, process: 'K' },
    { week: '4',  title: 'Bilişsel Defüzyon — Travma Anlatısı', focus: '"Şimdi değil, geçmiş" defüzyonu, travma hikayesini gözlemleme', done: false, process: 'D' },
    { week: '5',  title: 'Şimdiki Ana Temas',                   focus: 'Grounding teknikleri ACT çerçevesinde, güvenli şimdiki an', done: false, process: 'Ş' },
    { week: '6',  title: 'Gözlemci Benlik',                     focus: '"Ben travma değilim" ayrımı, perspektif alma, kim olduğum sorusu', done: false, process: 'G' },
    { week: '7',  title: 'Değerler — Travma Sonrası Hayat',     focus: 'Travma öncesi değerler ile şimdiki hayat karşılaştırması, anlam çalışması', done: false, process: 'V' },
    { week: '8',  title: 'Kararlı Eylem 1',                     focus: 'Değer yönlü küçük adımlar, kaçınılan durumlarla çalışma', done: false, process: 'KE' },
    { week: '9',  title: 'Travma Anlatısına ACT Yaklaşımı',     focus: 'Anlatının bütünleştirilmesi, defüzyon ve kabul içinde anlatı', done: false, process: 'D' },
    { week: '10', title: 'Acı & Anlam — Travma Sonrası Büyüme', focus: 'PTG perspektifi, anlam bulma, yeni kimlik', done: false, process: 'V' },
    { week: '11', title: 'Kararlı Eylem 2 & Entegrasyon',       focus: 'Psikolojik esneklik matrisi, sürdürülebilir adımlar', done: false, process: 'KE' },
    { week: '12', title: 'Sonlandırma',                         focus: 'Hexaflex özeti, "Pusula" egzersizi, devam planı', done: false, process: 'KE' },
  ],
  'act-okb-10w': [
    { week: '1',  title: 'OKB & ACT Modeli',                    focus: 'OKB döngüsü ACT perspektifinden, kompülsiyonların işlevi, psikoeğitim', done: false, process: 'YÇ' },
    { week: '2',  title: 'Yaratıcı Çaresizlik',                 focus: 'Kompülsiyonların kısa vadeli rahatlama — uzun vadeli maliyet dengesi', done: false, process: 'YÇ' },
    { week: '3',  title: 'Kabul — Obsesif Düşüncele Duygulara Alan', focus: 'Anksiyeteyi "taşıma" egzersizleri, belirsizliğe alan açma', done: false, process: 'K' },
    { week: '4',  title: 'Bilişsel Defüzyon',                   focus: '"Sadece bir düşünce" etiketleme, "zihin müziği", düşünce-eylem füzyonundan ayrışma', done: false, process: 'D' },
    { week: '5',  title: 'Şimdiki Ana Temas',                   focus: 'Ruminasyon-mindfulness ayrımı, "şimdiye demirleme", 5-duyu pratiği', done: false, process: 'Ş' },
    { week: '6',  title: 'Gözlemci Benlik',                     focus: '"Ben OKB değilim", bağlam benliği, obsesif içerikten mesafe', done: false, process: 'G' },
    { week: '7',  title: 'Değerler & OKB\'nin Engeli',          focus: 'OKB\'nin ne engellediği, değer haritası, "değer yönlü exposure"', done: false, process: 'V' },
    { week: '8',  title: 'Kararlı Eylem — ACT-Tabanlı ERP',     focus: 'Değer yönlü maruz bırakma, kompülsiyon bırakma değil bıçak sırtı', done: false, process: 'KE' },
    { week: '9',  title: 'Entegrasyon & İleri Çalışma',         focus: 'Psikolojik esneklik matrisi, tetikleyici-değer-eylem döngüsü', done: false, process: 'KE' },
    { week: '10', title: 'Sonlandırma',                         focus: 'Hexaflex kişisel özeti, "Pusula" metaforu, idame planı', done: false, process: 'V' },
  ],
  'act-kronik-agri-8w': [
    { week: '1',  title: 'Kronik Ağrı & ACT Modeli',            focus: 'Ağrı-acı-ıstırap ayrımı, "temiz acı / kirli acı" kavramı, ACT rationale', done: false, process: 'YÇ' },
    { week: '2',  title: 'Yaratıcı Çaresizlik',                 focus: 'Ağrıyı kontrol etme çabalarının bedeli, işlevsiz baş etme stratejileri', done: false, process: 'YÇ' },
    { week: '3',  title: 'Kabul — Ağrıya Alan Açma',            focus: 'Ağrı ile savaşmak yerine taşımak, "büyük hayat küçük ağrı" modeli', done: false, process: 'K' },
    { week: '4',  title: 'Defüzyon & Şimdiki An',               focus: '"Ağrım var ama ben ağrım değilim", beden farkındalığı mindfulness\'ı', done: false, process: 'D' },
    { week: '5',  title: 'Gözlemci Benlik',                     focus: 'Ağrının ötesinde süregelen benlik, hastalık kimliğinden ayrışma', done: false, process: 'G' },
    { week: '6',  title: 'Değerler — Ağrıya Rağmen Hayat',      focus: 'Sınırlılıklara rağmen değer yönelimi, önceliklendirme, anlam çalışması', done: false, process: 'V' },
    { week: '7',  title: 'Kararlı Eylem',                       focus: 'Aktivite seviyelendirme (pacing) değer çerçevesinde, SMART eylem adımları', done: false, process: 'KE' },
    { week: '8',  title: 'Sonlandırma',                         focus: 'Hexaflex özeti, "Pusula" egzersizi, ağrı idame planı', done: false, process: 'KE' },
  ],
};

const ACT_TEMPLATE_OPTIONS = [
  { value: '', label: '— ACT Şablonu Seç —' },
  { value: 'act-genel-8w',      label: 'ACT Genel Protokol (8 seans)' },
  { value: 'act-depresyon-10w', label: 'ACT — Depresyon (10 seans)' },
  { value: 'act-anksiyete-10w', label: 'ACT — Anksiyete (10 seans)' },
  { value: 'act-travma-12w',    label: 'ACT — Travma (12 seans)' },
  { value: 'act-okb-10w',       label: 'ACT — OKB (10 seans)' },
  { value: 'act-kronik-agri-8w',label: 'ACT — Kronik Ağrı (8 seans)' },
];

const TEMPLATE_OPTIONS = [
  { value: '', label: '— Şablon Seç —' },
  { value: 'panik-10w', label: 'Panik Bozukluğu — BDT (10 seans)' },
  { value: 'ocd-12w', label: 'OKB — ERP (12 seans)' },
  { value: 'depresyon-16w', label: 'Depresyon — BDT Tam (16 seans)' },
  { value: 'sosyal-anksiyete-12w', label: 'Sosyal Anksiyete (12 seans)' },
  { value: 'yab-10w', label: 'Yaygın Anksiyete Bozukluğu (10 seans)' },
  { value: 'travma-12w', label: 'TSSB — Travma Odaklı BDT (12 seans)' },
  { value: 'act-8w', label: 'ACT Genel (8 seans)' },
];

type SmartGoal = { id: string; goal: string; specific: string; measurable: string; achievable: string; relevant: string; timeBound: string };

export default function SeansPlanlayici() {
  const [templateId, setTemplateId] = useState('');
  const [plan, setPlan] = useState<SessionStep[]>([]);
  const [smartGoals, setSmartGoals] = useState<SmartGoal[]>([]);
  const [expandedSmart, setExpandedSmart] = useState<string | null>(null);

  // ACT plan state
  const [actTemplateId, setActTemplateId] = useState('');
  const [actPlan, setActPlan] = useState<ActStep[]>([]);
  const [actShowProcessInfo, setActShowProcessInfo] = useState(false);

  const completedCount = plan.filter(s => s.done).length;
  const progress = plan.length > 0 ? Math.round((completedCount / plan.length) * 100) : 0;

  const loadTemplate = (id: string) => {
    setTemplateId(id);
    if (id && PROTOCOL_TEMPLATES[id]) {
      if (plan.length === 0 || confirm('Mevcut plan silinecek. Devam edilsin mi?')) {
        setPlan(PROTOCOL_TEMPLATES[id].map(s => ({ ...s })));
      }
    }
  };

  const toggleDone = (i: number) => {
    setPlan(prev => prev.map((s, idx) => idx === i ? { ...s, done: !s.done } : s));
  };

  const addSession = () => {
    setPlan(prev => [...prev, { week: String(prev.length + 1), title: 'Yeni Seans', focus: '', done: false }]);
  };

  const removeSession = (i: number) => {
    setPlan(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateSession = (i: number, field: keyof SessionStep, value: string | boolean) => {
    setPlan(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const addSmartGoal = () => {
    setSmartGoals(prev => [...prev, { id: `sg_${Date.now()}`, goal: '', specific: '', measurable: '', achievable: '', relevant: '', timeBound: '' }]);
  };

  const updateSmartGoal = (id: string, field: keyof SmartGoal, value: string) => {
    setSmartGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const removeSmartGoal = (id: string) => {
    setSmartGoals(prev => prev.filter(g => g.id !== id));
  };

  // ── ACT plan helpers ────────────────────────────────────────────────────────
  const actCompletedCount = actPlan.filter(s => s.done).length;
  const actProgress = actPlan.length > 0 ? Math.round((actCompletedCount / actPlan.length) * 100) : 0;

  const loadActTemplate = (id: string) => {
    setActTemplateId(id);
    if (id && ACT_TEMPLATES[id]) {
      if (actPlan.length === 0 || confirm('Mevcut ACT planı silinecek. Devam edilsin mi?')) {
        setActPlan(ACT_TEMPLATES[id].map(s => ({ ...s })));
      }
    }
  };

  const toggleActDone = (i: number) => {
    setActPlan(prev => prev.map((s, idx) => idx === i ? { ...s, done: !s.done } : s));
  };

  const addActSession = () => {
    setActPlan(prev => [...prev, { week: String(prev.length + 1), title: 'Yeni Seans', focus: '', done: false }]);
  };

  const removeActSession = (i: number) => {
    setActPlan(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateActSession = (i: number, field: keyof ActStep, value: string | boolean) => {
    setActPlan(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  return (
    <div className="space-y-4">
      {/* Protocol selector */}
      <div className="card p-4">
        <h2 className="text-base font-semibold text-[#0E0F12] mb-3">BDT Protokol Planı</h2>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <select
            value={templateId}
            onChange={e => loadTemplate(e.target.value)}
            className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#0E0F12] transition-colors"
          >
            {TEMPLATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={addSession}
            className="h-9 px-3 text-xs rounded-xl bg-[#0E0F12] text-white hover:bg-[#1A1B22] transition-colors flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Seans Ekle
          </button>
          {plan.length > 0 && (
            <button
              onClick={() => { if (confirm('Planı sıfırlamak istiyor musunuz?')) { setPlan([]); setTemplateId(''); } }}
              className="h-9 px-3 text-xs rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >Sıfırla</button>
          )}
        </div>

        {/* Progress bar */}
        {plan.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>İlerleme: {completedCount}/{plan.length} seans</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0E0F12] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Session plan list */}
        {plan.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">Üstten protokol şablonu seçin veya manuel seans ekleyin.</p>
        ) : (
          <div className="space-y-1.5">
            {plan.map((s, i) => (
              <div
                key={i}
                className={cx('flex items-start gap-3 rounded-xl border p-3 transition-all', s.done ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-200 bg-white')}
              >
                <button
                  onClick={() => toggleDone(i)}
                  className={cx(
                    'mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                    s.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-400'
                  )}
                >
                  {s.done && <Check className="h-3 w-3" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-600 min-w-[48px]">Hafta {s.week}</span>
                    <input
                      value={s.title}
                      onChange={e => updateSession(i, 'title', e.target.value)}
                      className={cx('flex-1 text-sm font-medium bg-transparent border-none outline-none', s.done ? 'line-through text-gray-400' : 'text-[#0E0F12]')}
                    />
                  </div>
                  <input
                    value={s.focus}
                    onChange={e => updateSession(i, 'focus', e.target.value)}
                    className="mt-0.5 w-full text-xs text-gray-500 bg-transparent border-none outline-none"
                    placeholder="Odak noktaları…"
                  />
                </div>
                <button onClick={() => removeSession(i)} className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ACT Protokol Planı ── */}
      <div className="card p-4 border-l-4 border-l-teal-400">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-teal-600" />
            <h2 className="text-base font-semibold text-[#0E0F12]">ACT Protokol Planı</h2>
          </div>
          <button
            onClick={() => setActShowProcessInfo(v => !v)}
            className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors"
          >
            <span>Hexaflex Süreçleri</span>
            {actShowProcessInfo ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Hexaflex process legend */}
        {actShowProcessInfo && (
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {(Object.entries(ACT_PROCESS_LABELS) as [ActProcess, { label: string; color: string }][]).map(([key, val]) => (
              <div key={key} className={cx('rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5', val.color)}>
                <span className="font-bold text-[11px]">{key}</span>
                <span className="truncate">{val.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <select
            value={actTemplateId}
            onChange={e => loadActTemplate(e.target.value)}
            className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-teal-500 transition-colors"
          >
            {ACT_TEMPLATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={addActSession}
            className="h-9 px-3 text-xs rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Seans Ekle
          </button>
          {actPlan.length > 0 && (
            <button
              onClick={() => { if (confirm('ACT planını sıfırlamak istiyor musunuz?')) { setActPlan([]); setActTemplateId(''); } }}
              className="h-9 px-3 text-xs rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >Sıfırla</button>
          )}
        </div>

        {/* ACT progress bar */}
        {actPlan.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>İlerleme: {actCompletedCount}/{actPlan.length} seans</span>
              <span className="font-semibold">{actProgress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${actProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ACT session list */}
        {actPlan.length === 0 ? (
          <div className="text-center py-6 space-y-1">
            <Leaf className="w-8 h-8 text-teal-200 mx-auto" />
            <p className="text-sm text-gray-500">Üstten ACT şablonu seçin veya manuel seans ekleyin.</p>
            <p className="text-xs text-gray-400">Kabul, Defüzyon, Değerler ve Kararlı Eylem süreçleri otomatik etiketlenir.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {actPlan.map((s, i) => {
              const proc = s.process ? ACT_PROCESS_LABELS[s.process] : null;
              return (
                <div
                  key={i}
                  className={cx('flex items-start gap-3 rounded-xl border p-3 transition-all', s.done ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-teal-100 bg-white')}
                >
                  <button
                    onClick={() => toggleActDone(i)}
                    className={cx(
                      'mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                      s.done ? 'bg-teal-500 border-teal-500 text-white' : 'border-teal-300 hover:border-teal-500'
                    )}
                  >
                    {s.done && <Check className="h-3 w-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-teal-600 min-w-[48px]">Hafta {s.week}</span>
                      <input
                        value={s.title}
                        onChange={e => updateActSession(i, 'title', e.target.value)}
                        className={cx('flex-1 text-sm font-medium bg-transparent border-none outline-none min-w-0', s.done ? 'line-through text-gray-400' : 'text-[#0E0F12]')}
                      />
                      {proc && (
                        <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0', proc.color)}>
                          {s.process}
                        </span>
                      )}
                    </div>
                    <input
                      value={s.focus}
                      onChange={e => updateActSession(i, 'focus', e.target.value)}
                      className="mt-0.5 w-full text-xs text-gray-500 bg-transparent border-none outline-none"
                      placeholder="Odak noktaları…"
                    />
                  </div>
                  <button onClick={() => removeActSession(i)} className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SMART Goals */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#0E0F12]">SMART Hedefler</h3>
          <button
            onClick={addSmartGoal}
            className="h-8 px-3 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Hedef Ekle
          </button>
        </div>

        {smartGoals.length === 0 ? (
          <p className="text-sm text-gray-500">SMART formatında tedavi hedefleri ekleyin.</p>
        ) : (
          <div className="space-y-2">
            {smartGoals.map(g => (
              <div key={g.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-gray-50">
                  <input
                    value={g.goal}
                    onChange={e => updateSmartGoal(g.id, 'goal', e.target.value)}
                    className="flex-1 text-sm font-medium bg-transparent border-none outline-none text-[#0E0F12]"
                    placeholder="Hedef açıklaması…"
                  />
                  <button
                    onClick={() => setExpandedSmart(expandedSmart === g.id ? null : g.id)}
                    className="p-1 text-gray-400 hover:text-gray-700"
                  >
                    {expandedSmart === g.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <button onClick={() => removeSmartGoal(g.id)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {expandedSmart === g.id && (
                  <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y divide-gray-100">
                    {[
                      { field: 'specific' as const, label: 'Spesifik' },
                      { field: 'measurable' as const, label: 'Ölçülebilir' },
                      { field: 'achievable' as const, label: 'Ulaşılabilir' },
                      { field: 'relevant' as const, label: 'İlgili' },
                      { field: 'timeBound' as const, label: 'Zaman Sınırlı' },
                    ].map(f => (
                      <div key={f.field} className="p-2">
                        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1">{f.label}</div>
                        <textarea
                          value={g[f.field]}
                          onChange={e => updateSmartGoal(g.id, f.field, e.target.value)}
                          className="w-full text-xs bg-transparent border-none outline-none resize-none min-h-[48px] text-gray-700"
                          placeholder="…"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
