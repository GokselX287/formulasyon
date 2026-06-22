'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './CalmieChrome.css';
import './AnamnezV2.css';
import type { AnamnezData } from './AnamnezPanel';

// ──────────────────────────────────────────────────────────────────────────
// Anamnez — "Klinik Editöryel Dosya" · Anamnez v2.html birebir port.
// Bölümler (SECTIONS) · sol nav + tamamlanma % + risk vurgusu + AI/ön-form/kaydet.
// Gerçek AnamnezData'ya bağlı: skaler anahtarlar yeniden kullanılır (mevcut
// veri görünür); dizi/nesne tipli alanlar bozulmaz, ayrı not anahtarı kullanılır.
// ──────────────────────────────────────────────────────────────────────────

type SecKey = keyof AnamnezData;
type FieldType = 'text' | 'num' | 'textarea' | 'select' | 'radio' | 'chips' | 'chipsadd' | 'scale' | 'scaleimport';

type Field = {
  label: string;
  type: FieldType;
  sec: SecKey | '__top';
  key: string;          // bölüm nesnesi içindeki saklama anahtarı (top için klinisyenNotu)
  sub?: string;         // iç içe alan (ör. yatis.var, olcekler.phq9.skor, gozlem.gorunus.not)
  opt?: string[];
  half?: boolean;
  max?: number;
  bands?: string;
  suggest?: boolean;    // yazarken öğrenilen + sık kullanılan terimleri öner (otomatik tamamlama)
  suggestSingle?: boolean; // tek-değerli alan (virgülle çoklu DEĞİL) — ör. meslek, şehir
  suggestSeed?: string[];  // bu alana özel tohum öneri listesi (örn. iller, meslekler)
  ph?: string;          // soluk yol-gösterici örnek metin (placeholder) — terapisti yönlendirir
  required?: boolean;   // doldurulmadan dosya KAYDEDİLEMEZ (Kaydet engellenir)
  enc?: (v: any) => any;  // UI değeri → saklanan değer
  dec?: (v: any) => any;  // saklanan değer → UI değeri
};

type Section = { id: string; t: string; risk?: boolean; info?: string; fields: Field[] };

const boolVarYok = { enc: (v: string) => v === 'Var', dec: (v: any) => (v === true ? 'Var' : v === false ? 'Yok' : '') };

// Şehir alanı tohumu — 81 il (yazarken "t" → Tekirdağ, Tokat, Trabzon… önerilir).
const SEED_SEHIR = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin',
  'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur',
  'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis', 'Kırıkkale', 'Kırklareli',
  'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas',
  'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
];

// Ana yakınma tohumu — terapistin düşündüğü sorunlar (öğrenilen + tohum birleşir).
const SEED_YAKINMA = [
  'Kaygı', 'Depresif duygudurum', 'Uykusuzluk', 'Panik atak', 'Sosyal kaygı', 'Yaygın anksiyete',
  'Obsesif düşünceler', 'Kompulsiyonlar', 'Öfke kontrolü', 'İlişki sorunları', 'Boşanma süreci',
  'Yas', 'Travma sonrası belirtiler', 'Mükemmeliyetçilik', 'Erteleme', 'Dikkat dağınıklığı',
  'Özgüven eksikliği', 'Performans kaygısı', 'Sınav kaygısı', 'Yeme sorunları', 'Beden imgesi',
  'Tükenmişlik', 'Kronik stres', 'Motivasyon kaybı', 'Suçluluk hissi', 'Değersizlik hissi',
  'Sağlık kaygısı', 'Özgül fobi', 'Kayıp ve keder', 'Aile içi çatışma', 'Çocukluk travması',
  'Bağlanma sorunları', 'Yalnızlık', 'Karar verememe', 'Madde kullanımı',
];

// Sosyal destek + arkadaş ilişkileri tohumu — tek alanda seçilebilir öneriler
// (terapist "ne yazacağımı bilemedim" demesin; yeni girilenler ayrıca öğrenilir).
const SEED_DESTEK = [
  'Yakın arkadaş çevresi var', 'Sınırlı arkadaş çevresi', 'Aile desteği güçlü', 'Aile desteği zayıf',
  'Partner / eş desteği var', 'İş / okul ortamında destek görüyor', 'Grup / topluluk desteği',
  'Online / sosyal medya desteği', 'Profesyonel destek alıyor', 'Çoğunlukla yalnız', 'Destek sistemi yok denecek kadar az',
  'Güven sorunu yaşıyor', 'Yüzeysel ilişkiler', 'Derin birkaç ilişki', 'Geniş sosyal çevre', 'Yeni taşındı / çevresi dar',
];

// Meslek alanı tohumu — sık girilen meslekler (yeni girilenler ayrıca öğrenilir).
const SEED_MESLEK = [
  'Öğretmen', 'Öğrenci', 'Mühendis', 'Doktor', 'Hemşire', 'Avukat', 'Mimar', 'Muhasebeci', 'Memur', 'Polis',
  'Asker', 'Esnaf', 'Bankacı', 'Psikolog', 'Psikolojik Danışman', 'Yazılım Geliştirici', 'Grafik Tasarımcı',
  'Editör', 'Gazeteci', 'Akademisyen', 'Diş Hekimi', 'Eczacı', 'Veteriner', 'Fizyoterapist', 'Diyetisyen', 'Ebe',
  'Sosyal Hizmet Uzmanı', 'Satış Temsilcisi', 'Pazarlama Uzmanı', 'Aşçı', 'Garson', 'Şoför', 'Teknisyen',
  'Elektrikçi', 'Tesisatçı', 'Marangoz', 'Terzi', 'Kuaför', 'Berber', 'Çiftçi', 'İşletmeci',
  'Ev Hanımı', 'Emekli', 'Serbest Meslek', 'İşsiz',
];

const SECTIONS: Section[] = [
  { id: 'demografik', t: 'Kişisel bilgiler', fields: [
    { label: 'Ad Soyad', type: 'text', sec: 'demografik', key: 'adSoyad', half: true },
    { label: 'Yaş', type: 'num', sec: 'demografik', key: 'yas', half: true },
    { label: 'Cinsiyet', type: 'select', sec: 'demografik', key: 'cinsiyet', opt: ['', 'Kadın', 'Erkek', 'Diğer'], half: true },
    { label: 'Medeni durum', type: 'select', sec: 'demografik', key: 'medeniDurum', opt: ['', 'Bekâr', 'Evli', 'Boşanmış', 'Dul'], half: true },
    { label: 'Meslek', type: 'text', sec: 'demografik', key: 'meslek', half: true, suggest: true, suggestSingle: true, suggestSeed: SEED_MESLEK, ph: 'örn. Öğretmen, Mühendis, Psikolojik Danışman…' },
    { label: 'Şehir', type: 'text', sec: 'demografik', key: 'sehir', half: true, suggest: true, suggestSingle: true, suggestSeed: SEED_SEHIR, ph: 'örn. Tekirdağ, İstanbul…' },
    { label: 'İlçe', type: 'text', sec: 'demografik', key: 'ilce', half: true, suggest: true, suggestSingle: true, suggestSeed: [], ph: 'örn. Çerkezköy, Kadıköy…' },
    { label: 'İş durumu', type: 'select', sec: 'isSosyal', key: 'isDurumu', half: true, opt: ['', 'Çalışıyor (ücretli)', 'Kendi işi / serbest', 'Çalışmıyor', 'İş arıyor', 'Öğrenci', 'Emekli', 'Ev içi'] },
    { label: 'Kendini hangi sıfatlarla tanımlıyor?', type: 'chipsadd', sec: 'demografik', key: 'kendiSifatlar', opt: ['Kaygılı', 'Kaçıngan', 'Öfkeli', 'Sürekli mutsuz', 'Eleştirel', 'Memnuniyetsiz', 'Sevgi dolu', 'Mükemmeliyetçi', 'İçe kapanık', 'Suçluluk duyan', 'Kararsız', 'Hassas'] },
  ] },
  { id: 'basvuru', t: 'Başvuru Sebepleri / Temel Sorunlar', fields: [
    { label: 'Başvuru nedeni', type: 'textarea', sec: 'basvuru', key: 'sebep' },
    { label: 'Terapistin düşündüğü sorunlar', type: 'chipsadd', sec: 'basvuru', key: 'anaYakinma', suggest: true, suggestSeed: SEED_YAKINMA, opt: [] },
    { label: 'Başvuru şekli', type: 'select', sec: 'basvuru', key: 'yonlendiren', opt: ['', 'Kendi isteği', 'Yönlendirme', 'Aile'] },
    { label: 'Görüşme şekli', type: 'radio', sec: 'basvuru', key: 'gorusmeSekli', opt: ['Yüz yüze', 'Online', 'Hibrit'] },
    // — Şikayet öyküsü buraya dahil edildi (ayrı bölüm kaldırıldı) —
    { label: 'Şikayetler ne zamandır sürüyor?', type: 'textarea', sec: 'sikayet', key: 'baslangic', ph: 'örn. 6 aydır, 2 yıldır, çocukluktan beri; giderek artıyor / dalgalı seyrediyor…' },
    { label: 'Şikayeti başlatan vurucu bir olay var mı?', type: 'textarea', sec: 'sikayet', key: 'vurucuOlay', ph: 'örn. kayıp, ayrılık, taşınma, iş değişikliği, travmatik bir olay; yoksa belirsiz…' },
    { label: 'Tetikleyiciler', type: 'textarea', sec: 'sikayet', key: 'tetikleyicilerNot', required: true, ph: 'danışan hangi olay, düşünce ya da duygularla tetikleniyor? (kaydetmek için zorunlu)' },
  ] },
  { id: 'psikiyatrik', t: 'Psikiyatrik & Tıbbi Geçmiş', fields: [
    { label: 'Önceki psikiyatrik başvuru', type: 'radio', sec: 'psikiyatrik', key: 'oncekiBasvuru', opt: ['Var', 'Yok'] },
    { label: 'Kullandığı psikiyatrik ilaç', type: 'text', sec: 'psikiyatrik', key: 'ilacNot' },
    { label: 'Yatış öyküsü', type: 'radio', sec: 'psikiyatrik', key: 'yatis', sub: 'var', opt: ['Var', 'Yok'], ...boolVarYok },
    // — Tıbbi geçmiş buraya dahil edildi (alerji çıkarıldı) —
    { label: 'Kronik hastalık', type: 'text', sec: 'tibbi', key: 'kronikNot' },
    { label: 'Kullanılan ilaçlar (tıbbi)', type: 'text', sec: 'tibbi', key: 'ilac' },
  ] },
  { id: 'aile', t: 'Aile Öyküsü', fields: [
    { label: 'Ailede psikiyatrik öykü', type: 'textarea', sec: 'aile', key: 'genogram' },
    // — Anne —
    { label: 'Anne yaşıyor mu?', type: 'radio', sec: 'aile', key: 'anneSag', opt: ['Yaşıyor', 'Vefat etti'] },
    { label: 'Anneyi tarifle', type: 'textarea', sec: 'aile', key: 'anneTarif', ph: 'örn. kaygılı, çekingen, öfkeli, sessiz, kontrolcü, eleştirel, aşırı koruyucu…' },
    // — Baba —
    { label: 'Baba yaşıyor mu?', type: 'radio', sec: 'aile', key: 'babaSag', opt: ['Yaşıyor', 'Vefat etti'] },
    { label: 'Babayı tarifle', type: 'textarea', sec: 'aile', key: 'babaTarif', ph: 'örn. otoriter, mesafeli, sıcak, öfkeli, pasif, yokluğu hissedilen, eleştirel…' },
    // — Anne-baba ilişkisi —
    { label: 'Anne ve baba arasındaki ilişki', type: 'textarea', sec: 'aile', key: 'anneBabaIliski', ph: 'örn. çatışmalı, mesafeli, uyumlu, baskın–boyun eğen, ayrı yaşıyor, şiddet…' },
    // — Kardeşler —
    { label: 'Kardeşler (sayı, yaş, yaşıyor mu?)', type: 'text', sec: 'aile', key: 'kardesDurum', ph: 'örn. 2 kardeş — abla 34 (yaşıyor), erkek kardeş 28 (yaşıyor)…' },
    { label: 'Kardeşleri tarifle', type: 'textarea', sec: 'aile', key: 'kardesTarif', ph: 'örn. rekabetçi, koruyucu, model alınan, çatışmalı, uzak, kıyaslanan…' },
    { label: 'Anne/baba gibi davranan kardeş var mı?', type: 'textarea', sec: 'aile', key: 'ebeveynRolKardes', ph: 'örn. abla anne rolünü üstlenmiş; ağabey baba gibi otorite kuruyor…' },
    { label: 'Ailede eşitsizlik, adaletsizlik veya istismar var mı?', type: 'radio', sec: 'aile', key: 'istismarVar', opt: ['Var', 'Yok', 'Belirsiz'] },
    { label: 'Varsa belirt', type: 'textarea', sec: 'aile', key: 'istismarNot', ph: 'örn. kardeşler arası kayırma; fiziksel / duygusal / cinsel istismar; ihmal; adaletsiz davranış…' },
  ] },
  { id: 'madde', t: 'Madde Kullanımı', fields: [
    { label: 'Alkol', type: 'radio', sec: 'madde', key: 'alkol', opt: ['Düzenli', 'Ara sıra', 'Yok'] },
    { label: 'Sigara', type: 'radio', sec: 'madde', key: 'sigara', opt: ['Var', 'Yok'] },
    { label: 'Madde', type: 'radio', sec: 'madde', key: 'madde', opt: ['Var', 'Yok'] },
  ] },
  { id: 'gelisim', t: 'Danışanın Hikayesi', fields: [
    { label: 'Çocukluğunu nasıl tarifliyor?', type: 'textarea', sec: 'gelisim', key: 'cocuklukTarif', ph: 'örn. mutlu, yalnız, korkulu, baskı altında, güvende, kaygılı, sevgi gören/görmeyen…' },
    { label: 'Ergenliğini nasıl tarifliyor?', type: 'textarea', sec: 'gelisim', key: 'ergenlikTarif', ph: 'örn. çatışmalı, içe kapanık, asi, uyumlu, yalnız, arayış içinde…' },
    { label: 'O dönemlerde kendini nasıl hissetti / destek gördü mü?', type: 'textarea', sec: 'gelisim', key: 'erkenDestek', ph: 'örn. anne-babadan destek gördü/görmedi, değerli/değersiz hissetti, güvenli/güvensiz ortam…' },
    { label: 'Önemli yaşam olayları', type: 'textarea', sec: 'gelisim', key: 'yasamOlaylari' },
  ] },
  { id: 'iliskiler', t: 'İlişkiler ve Hayat Bağları', fields: [
    { label: 'İlişki durumu', type: 'text', sec: 'iliskiler', key: 'romantik' },
    { label: 'İlişki örüntüleri', type: 'textarea', sec: 'iliskiler', key: 'baglanma', ph: 'örn. sürekli terk edilmeyle biten ilişkiler, sürekli aldatılma, ilgiden boğulup kaçma, kaygılı bağlanma, bağ kuramama, yakınlık kurmaktan kaçınma, aşırı ilgi bekleme, kırılgan olduğu için terk edilme…' },
    // — İş / Sosyal İşlevsellik buraya taşındı (iş durumu Kişisel bilgilere alındı) —
    { label: 'Sosyal destek ve arkadaş ilişkileri', type: 'chipsadd', sec: 'isSosyal', key: 'destekNot', suggest: true, suggestSeed: SEED_DESTEK, opt: [] },
    { label: 'İlişkilerinde sık sık sorun yaşıyor mu?', type: 'scale', sec: 'isSosyal', key: 'iliskiSorunPuan', max: 10, bands: '1–10 · yüksek = sık sorun' },
    { label: 'Danışanın bağlanma stilini en iyi hangisi tarifliyor?', type: 'radio', sec: 'iliskiler', key: 'baglanmaStili', opt: ['Güvenli bağlanma', 'Kaygılı bağlanma', 'Kaçıngan bağlanma'] },
  ] },
  { id: 'travma', t: 'Travma Öyküsü', fields: [
    { label: 'Travma öyküsü', type: 'radio', sec: 'travma', key: 'travmaVar', opt: ['Var', 'Yok', 'Belirsiz'] },
    { label: 'Açıklama', type: 'textarea', sec: 'travma', key: 'travmaNot' },
  ] },
  { id: 'risk', t: 'Risk Değerlendirme', risk: true, fields: [
    { label: 'İntihar düşüncesi', type: 'radio', sec: 'risk', key: 'intihar', opt: ['Var', 'Yok'], enc: (v) => (v === 'Var' ? 'var' : 'yok'), dec: (v) => (v === 'var' || v === 'plan' || v === 'girisim' ? 'Var' : v === 'yok' ? 'Yok' : '') },
    { label: 'Plan / niyet', type: 'radio', sec: 'risk', key: 'planNiyet', opt: ['Var', 'Yok'] },
    { label: 'Kendine zarar verme', type: 'radio', sec: 'risk', key: 'zarar', opt: ['Var', 'Yok'], enc: (v) => (v === 'Var' ? 'aktif' : 'yok'), dec: (v) => (v === 'aktif' || v === 'gecmis' ? 'Var' : v === 'yok' ? 'Yok' : '') },
    { label: 'Başkasına zarar riski', type: 'radio', sec: 'risk', key: 'baskasi', opt: ['Var', 'Yok'], enc: (v) => (v === 'Var' ? 'risk' : 'yok'), dec: (v) => (v === 'risk' ? 'Var' : v === 'yok' ? 'Yok' : '') },
    { label: 'Genel risk düzeyi', type: 'select', sec: 'risk', key: 'seviye', opt: ['', 'Düşük', 'Orta', 'Yüksek'], enc: (v) => ({ 'Düşük': 'dusuk', 'Orta': 'orta', 'Yüksek': 'yuksek', '': '' } as any)[v], dec: (v) => ({ 'dusuk': 'Düşük', 'orta': 'Orta', 'yuksek': 'Yüksek' } as any)[v] ?? '' },
  ] },
  { id: 'hedefler', t: 'Hedefler', fields: [
    { label: 'Terapi hedefleri', type: 'textarea', sec: 'hedefler', key: 'hedeflerNot' },
    { label: 'Beklenti / motivasyon', type: 'textarea', sec: 'hedefler', key: 'beklenti', ph: 'Danışanın terapiden beklentisi ve motivasyonu — en fazla 5 cümle…' },
  ] },
  { id: 'olcekler', t: 'Ölçekler',
    info: 'Ölçek puanları elle girilmez — danışana seans öncesi gönderilen formdan otomatik gelir. Form yanıtı geldiyse aşağıdan tek tıkla içe aktar.',
    fields: [
      { label: 'Ölçek verileri', type: 'scaleimport', sec: 'olcekler', key: '__scales' },
    ] },
  { id: 'not', t: 'Danışanın sürecinde neleri çalışacağını planla',
    info: 'Danışanın sürecini önceden planlamak, terapistin kafa karışıklığını ve hedeften uzaklaşmasını önler. Bu danışana neleri öğretmek, onunla hangi konuları çalışmak istiyorsun? Seans seans dağılmamak için önce bunları netleştir. Buraya yazdıkların kesin değil — süreç ilerledikçe güncellenen, müdahaleleri ve sorun döngüsü seçimini yönlendiren esnek bir yol haritasıdır.',
    fields: [
      { label: 'Çalışılacak konular — madde madde', type: 'textarea', sec: '__top', key: 'klinisyenNotu', ph: 'Her satıra bir madde:\n• Değersizlik / yetersizlik inancını fark etme ve sınama\n• Kaçınma davranışlarını azaltma — kademeli maruz bırakma\n• Duygu düzenleme becerileri kazandırma\n• İlişkide sınır koyma ve ihtiyaç ifade etme\n• Erteleme ve mükemmeliyetçilikle çalışma' },
    ] },
];

// ── değer oku/yaz ───────────────────────────────────────────────────────────
function readField(data: AnamnezData, f: Field): any {
  if (f.sec === '__top') return (data as any)[f.key] ?? '';
  const secObj = (data as any)[f.sec] ?? {};
  let raw = f.sub ? secObj[f.key]?.[f.sub] : secObj[f.key];
  if (f.dec) raw = f.dec(raw);
  if (f.type === 'chips' || f.type === 'chipsadd') return Array.isArray(raw) ? raw : (typeof raw === 'string' && raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : []);
  return raw ?? (f.type === 'num' || f.type === 'scale' ? '' : '');
}

function writeField(data: AnamnezData, f: Field, uiVal: any): { sec: SecKey | '__top'; value: any } {
  let stored = f.enc ? f.enc(uiVal) : uiVal;
  if (f.type === 'num') stored = uiVal === '' ? undefined : Number(uiVal);
  if (f.type === 'scale') stored = uiVal === '' ? undefined : Number(uiVal);
  if (f.type === 'chips') stored = Array.isArray(uiVal) ? uiVal.join(', ') : uiVal;

  // __top: değer doğrudan üst düzey anahtara (ör. klinisyenNotu) yazılmalı.
  // (Eskiden sec='__top' dönüyordu → data.__top'a yazıyordu, readField data.klinisyenNotu
  //  okuyordu → yazı görünmüyordu. BUG fix.)
  if (f.sec === '__top') return { sec: f.key as SecKey, value: stored };
  const secObj = { ...((data as any)[f.sec] ?? {}) };
  if (f.sub) secObj[f.key] = { ...(secObj[f.key] ?? {}), [f.sub]: stored };
  else secObj[f.key] = stored;
  return { sec: f.sec, value: secObj };
}

const isFilled = (data: AnamnezData, f: Field): boolean => {
  // Ölçek içe-aktarma: ön-formdan en az bir skor geldiyse "dolu" sayılır.
  if (f.type === 'scaleimport') { const ol = (data as any).olcekler || {}; return ol.phq9?.skor != null || ol.gad7?.skor != null; }
  const v = readField(data, f);
  if (f.type === 'chips' || f.type === 'chipsadd') return Array.isArray(v) && v.length > 0;
  if (f.type === 'scale' || f.type === 'num') return v !== '' && v != null;
  return String(v ?? '').trim() !== '';
};

export type AnamnezV2Props = {
  data: AnamnezData;
  clientName?: string;
  clientNo?: string;
  hasPreForm?: boolean;
  onChange<K extends keyof AnamnezData>(section: K, value: AnamnezData[K]): void;
  onBack?(): void;
  onNav?(target: string): void;
  onAiFill?(): void;
  onImportPreForm?(): void;
  onSave?(): void;
  onOpenDongu?(): void;   // Sorun döngüleri ekranı (/clients/[id]/dongu)
  onValidityChange?(ok: boolean): void;   // zorunlu alanlar tam mı? — route otomatik-kaydı bunu kapılar
};

// Sayfa menüsü — Ana Sayfa dock'u ile BİREBİR aynı (öge + sıra).
// Anamnez, Çalışma Alanı → Dosya altından açıldığı için aktif = calisma-alani.
const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Ayarlar', target: 'ayarlar' },
];

// Tema + arkaplan görseli — Ana Sayfa & Çalışma Alanı ile paylaşımlı (localStorage)
const DEFAULT_BG = '/calmie-hero-default.jpg';
const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };

const lcTr = (s: string) => s.toLocaleLowerCase('tr-TR');
// Kayıt tutarlılığı — her kelimenin İLK harfi büyük, kalanı küçük (TR-locale).
// "psikolojik danışman" / "PSİKOLOG" → "Psikolojik Danışman" / "Psikolog".
const titleTr = (s: string) =>
  s.replace(/\s+/g, ' ').trim().split(' ')
    .map((w) => (w ? w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1).toLocaleLowerCase('tr-TR') : w))
    .join(' ');
function loadSuggestTerms(key: string, seed: string[] = SEED_YAKINMA): string[] {
  let saved: string[] = [];
  try { const a = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(a)) saved = a.filter((x) => typeof x === 'string'); } catch { /* yok say */ }
  const seen = new Set<string>(); const out: string[] = [];
  for (const t of [...saved, ...seed]) { const k = lcTr(t); if (!seen.has(k)) { seen.add(k); out.push(t); } }
  return out;
}
function rememberSuggestTerm(key: string, raw: string) {
  const t = raw.trim(); if (t.length < 2) return;
  try {
    const a = JSON.parse(localStorage.getItem(key) || '[]');
    const list = Array.isArray(a) ? a.filter((x: any) => typeof x === 'string') : [];
    const k = lcTr(t);
    const filtered = list.filter((x: string) => lcTr(x) !== k);
    filtered.unshift(t);
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, 300)));
  } catch { /* yok say */ }
}

// Öneri kutusu — virgülle çok-terimli (ana yakınma) VEYA tek-değerli (meslek/şehir).
// Tek-değerli modda öneriler önce baştan-eşleşen ("t" → Tekirdağ…) sıralanır ve
// seçilen/yazılan değer kayıtlarda Title Case'e (titleTr) çevrilir.
function SuggestInput({ id, value, onChange, storeKey, seed = SEED_YAKINMA, single = false, ph }:
  { id: string; value: string; onChange: (v: string) => void; storeKey: string; seed?: string[]; single?: boolean; ph?: string }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [terms, setTerms] = useState<string[]>([]);
  const blurT = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setTerms(loadSuggestTerms(storeKey, seed)); }, [storeKey, seed]);

  const segs = single ? [value] : value.split(',');
  const cur = (segs[segs.length - 1] || '').trim();
  let matches: string[] = [];
  if (cur.length >= 1) {
    const c = lcTr(cur);
    if (single) {
      // baştan eşleşenler önce, sonra içeride geçenler — "t" → Tekirdağ, Tokat…
      const starts = terms.filter((t) => { const k = lcTr(t); return k.startsWith(c) && k !== c; });
      const inside = terms.filter((t) => { const k = lcTr(t); return !k.startsWith(c) && k.includes(c); });
      matches = [...starts, ...inside].slice(0, 8);
    } else {
      matches = terms.filter((t) => { const k = lcTr(t); return k.includes(c) && k !== c; }).slice(0, 8);
    }
  }

  const commitToken = (t: string) => {
    if (single) {
      const val = titleTr(t);
      onChange(val);
      rememberSuggestTerm(storeKey, val);
    } else {
      const head = segs.slice(0, -1).map((s) => s.trim()).filter(Boolean);
      onChange([...head, t].join(', '));
      rememberSuggestTerm(storeKey, t);
    }
    setTerms(loadSuggestTerms(storeKey, seed));
    setOpen(false);
  };
  const rememberAll = () => {
    if (single) {
      const val = titleTr(value);
      if (val !== value) onChange(val);   // kaydı tutarlı kıl: Title Case'e normalize et
      rememberSuggestTerm(storeKey, val);
    } else {
      value.split(',').forEach((s) => rememberSuggestTerm(storeKey, s));
    }
    setTerms(loadSuggestTerms(storeKey, seed));
  };

  return (
    <div className="sugg-wrap">
      <input className="inp" id={id} value={value} placeholder={ph ?? 'örn. kaygı, uykusuzluk…'} autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHi(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurT.current = setTimeout(() => { setOpen(false); rememberAll(); }, 140); }}
        onKeyDown={(e) => {
          if (!open || !matches.length) { return; }
          if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, matches.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
          else if (e.key === 'Enter') { e.preventDefault(); commitToken(matches[hi] ?? matches[0]); }
          else if (e.key === 'Escape') { setOpen(false); }
        }} />
      {open && matches.length > 0 && (
        <ul className="sugg-list" role="listbox">
          {matches.map((m, i) => (
            <li key={m} role="option" aria-selected={i === hi} className={i === hi ? 'on' : ''}
              onMouseDown={(e) => { e.preventDefault(); if (blurT.current) clearTimeout(blurT.current); commitToken(m); }}
              onMouseEnter={() => setHi(i)}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Çoklu seçici (premium): kutuya gelince/odaklanınca altta öneri paleti açılır;
// seçilenler kutu içinde çıkarılabilir etiket olur; serbest yeni terim eklenebilir.
// storeKey verilirse öneriler öğrenilen + tohum havuzundan gelir ve eklenenler öğrenilir
// (ör. "Terapistin düşündüğü sorunlar": açık listeden tek tek tıklayıp çoklu ekleme).
function ChipAddInput({ value, onChange, opt, storeKey, seed }:
  { value: any; onChange: (v: string[]) => void; opt: string[]; storeKey?: string; seed?: string[] }) {
  const sel: string[] = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [learned, setLearned] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  // Öğrenilen + tohum terimler (yalnız storeKey'li alanlarda; ör. ana yakınma).
  useEffect(() => { if (storeKey) setLearned(loadSuggestTerms(storeKey, seed ?? [])); }, [storeKey, seed]);
  // Öneri havuzu = preset opt ∪ öğrenilen/tohum (lcTr ile tekilleştirilmiş).
  const pool = useMemo(() => {
    const seen = new Set<string>(); const out: string[] = [];
    for (const t of [...opt, ...learned]) { const k = lcTr(t); if (!seen.has(k)) { seen.add(k); out.push(t); } }
    return out;
  }, [opt, learned]);
  // Tek, iptal-edilebilir kapanma zamanlayıcısı — dropdown'a girince kapanma iptal
  // olur, böylece "hızlı inmezsem kapanıyor" sorunu kalkar.
  const closeT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => { if (closeT.current) { clearTimeout(closeT.current); closeT.current = null; } };
  const scheduleClose = () => { cancelClose(); closeT.current = setTimeout(() => setOpen(false), 280); };
  // Kayıt tutarlılığı: küçük/büyük nasıl yazılırsa yazılsın her terim Title Case'e çevrilir.
  const add = (raw: string) => {
    const t = titleTr(raw); if (!t) return;
    if (sel.some((x) => lcTr(x) === lcTr(t))) return;
    onChange([...sel, t]);
    if (storeKey) { rememberSuggestTerm(storeKey, t); setLearned(loadSuggestTerms(storeKey, seed ?? [])); }
  };
  const remove = (t: string) => onChange(sel.filter((x) => x !== t));
  const d = draft.trim();
  const suggestions = pool.filter((o) => !sel.some((x) => lcTr(x) === lcTr(o)) && (!d || lcTr(o).includes(lcTr(d))));
  const canAddNew = !!d && !pool.some((o) => lcTr(o) === lcTr(d)) && !sel.some((x) => lcTr(x) === lcTr(d));
  return (
    <div className="chipadd"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={() => { if (document.activeElement !== inputRef.current) scheduleClose(); }}>
      <div className="ca-box" onClick={() => { cancelClose(); inputRef.current?.focus(); setOpen(true); }}>
        {sel.map((t) => (
          <span key={t} className="ca-tag">{t}<button type="button" className="ca-x" aria-label="Kaldır" onClick={(e) => { e.stopPropagation(); remove(t); }}>×</button></span>
        ))}
        <input ref={inputRef} className="ca-input" value={draft} placeholder={sel.length ? 'ekle…' : 'Sıfat seç ya da yaz…'} autoComplete="off"
          onChange={(e) => { setDraft(e.target.value); cancelClose(); setOpen(true); }}
          onFocus={() => { cancelClose(); setOpen(true); }}
          onBlur={scheduleClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); if (d) { add(draft); setDraft(''); } }
            else if (e.key === 'Backspace' && !draft && sel.length) { remove(sel[sel.length - 1]); }
            else if (e.key === 'Escape') { setOpen(false); }
          }} />
      </div>
      {open && (suggestions.length > 0 || canAddNew) && (
        <div className="ca-drop" onMouseEnter={cancelClose} onMouseLeave={() => { if (document.activeElement !== inputRef.current) scheduleClose(); }}>
          {suggestions.map((o) => (
            <button key={o} type="button" className="ca-opt" onMouseDown={(e) => { e.preventDefault(); cancelClose(); add(o); }}>{o}</button>
          ))}
          {canAddNew && (
            <button type="button" className="ca-opt ca-opt-new" onMouseDown={(e) => { e.preventDefault(); cancelClose(); add(draft); setDraft(''); }}>+ “{d}” ekle</button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnamnezV2(props: AnamnezV2Props) {
  const { data, clientName, clientNo, hasPreForm, onChange, onBack, onNav, onAiFill, onImportPreForm, onSave, onOpenDongu, onValidityChange } = props;
  const [active, setActive] = useState('demografik');
  const [saved, setSaved] = useState(false);
  const [reqErr, setReqErr] = useState<string | null>(null);   // zorunlu alan eksik uyarısı
  // paylaşımlı tema + arkaplan görseli (Çalışma Alanı / Ana Sayfa ile aynı)
  const [theme] = useState<string>(() => lsGet('calmie_home_bgtheme') || 'default');
  const [bgPhoto] = useState<string | null>(() => lsGet('siyi_home_bg_v1'));

  // ── Sayfa menüsü glider (Ana Sayfa ile aynı) — aktif/hover sekmeye kayan beyaz pill ──
  const menuRef = useRef<HTMLElement>(null);
  const gliderRef = useRef<HTMLSpanElement>(null);
  const activeLink = () => (menuRef.current?.querySelector('a.active') || menuRef.current?.querySelector('a')) as HTMLElement | null;
  const moveGlider = (a: HTMLElement | null, instant = false) => {
    const g = gliderRef.current; if (!g || !a) return;
    if (instant) g.style.transition = 'none';
    g.style.width = a.offsetWidth + 'px';
    g.style.transform = `translateX(${a.offsetLeft}px)`;
    g.classList.add('on');
    menuRef.current?.querySelectorAll('a').forEach((l) => l.classList.toggle('lit', l === a));
    if (instant) { void g.offsetWidth; g.style.transition = ''; }
  };
  useEffect(() => {
    moveGlider(activeLink(), true);
    const onR = () => moveGlider(activeLink(), true);
    window.addEventListener('resize', onR);
    (document as any).fonts?.ready?.then(() => moveGlider(activeLink(), true));
    return () => window.removeEventListener('resize', onR);
  }, []);
  const formColRef = useRef<HTMLDivElement>(null);
  const secRefs = useRef<Record<string, HTMLElement | null>>({});

  const set = (f: Field, uiVal: any) => {
    const { sec, value } = writeField(data, f, uiVal);
    onChange(sec as any, value);
  };

  // tamamlanma
  const { pct, secState } = useMemo(() => {
    const all = SECTIONS.flatMap((s) => s.fields);
    const n = all.filter((f) => isFilled(data, f)).length;
    const secState: Record<string, '' | 'part' | 'done'> = {};
    SECTIONS.forEach((s) => {
      const c = s.fields.filter((f) => isFilled(data, f)).length;
      secState[s.id] = c === 0 ? '' : c === s.fields.length ? 'done' : 'part';
    });
    return { pct: Math.round((n / all.length) * 100), secState };
  }, [data]);

  // scroll-spy
  useEffect(() => {
    const root = formColRef.current; if (!root) return;
    const secs = Object.values(secRefs.current).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => { if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.sid!); }),
      { root, rootMargin: '-8% 0px -80% 0px', threshold: 0 },
    );
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = secRefs.current[id]; const fc = formColRef.current;
    if (el && fc) fc.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
  };

  // ── Zorunlu alanlar (required:true) — doldurulmadan KAYDEDİLEMEZ ──
  const isFieldEmpty = (f: Field) => {
    const v = readField(data, f);
    if (Array.isArray(v)) return v.length === 0;
    return !(v != null && String(v).trim());
  };
  const requiredMissing = SECTIONS
    .flatMap((s, si) => s.fields.map((f, fi) => ({ f, s, si, fi })))
    .filter(({ f }) => f.required && isFieldEmpty(f));

  const doSave = () => {
    // Eksik zorunlu alan varsa HATIRLAT ama kaydı engelleme — veri her zaman kaydedilir.
    if (requiredMissing.length) {
      const first = requiredMissing[0];
      setReqErr(requiredMissing.map((m) => m.f.label).join(', '));
      setActive(first.s.id);
      scrollTo(first.s.id);
      setTimeout(() => document.getElementById(`f-${first.si}-${first.fi}`)?.focus(), 320);
    } else {
      setReqErr(null);
    }
    onSave?.(); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };
  // zorunlu alan doldurulunca uyarıyı temizle
  useEffect(() => { if (reqErr && requiredMissing.length === 0) setReqErr(null); }, [reqErr, requiredMissing.length]);
  // route otomatik-kaydı zorunlu alanlar tamamlanmadan PATCH etmesin diye geçerliliği bildir
  useEffect(() => { onValidityChange?.(requiredMissing.length === 0); }, [requiredMissing.length, onValidityChange]);

  const renderControl = (f: Field, si: number, fi: number) => {
    const v = readField(data, f);
    const id = `f-${si}-${fi}`;
    switch (f.type) {
      case 'text':
        if (f.suggest) return <SuggestInput id={id} value={v} onChange={(val) => set(f, val)} storeKey={`calmie_suggest_${f.sec}_${f.key}`} seed={f.suggestSeed ?? SEED_YAKINMA} single={!!f.suggestSingle} ph={f.ph} />;
        return <input className="inp" id={id} value={v} placeholder={f.ph ?? '—'} onChange={(e) => set(f, e.target.value)} />;
      case 'num':
        return <input className="inp" id={id} value={v} placeholder="—" inputMode="numeric" onChange={(e) => set(f, e.target.value)} />;
      case 'textarea':
        return <textarea className="ta" id={id} value={v} placeholder={f.ph ?? '—'} onChange={(e) => set(f, e.target.value)} />;
      case 'select':
        return <select className="sel" id={id} value={v} onChange={(e) => set(f, e.target.value)}>{f.opt!.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
      case 'radio':
        return <div className="radio">{f.opt!.map((o) => <button key={o} type="button" className={o === v ? 'on' : ''} onClick={() => set(f, o)}>{o}</button>)}</div>;
      case 'chips':
        return <div className="chips-in">{f.opt!.map((o) => {
          const on = Array.isArray(v) && v.includes(o);
          return <button key={o} type="button" className={on ? 'on' : ''} onClick={() => { const next = on ? v.filter((x: string) => x !== o) : [...v, o]; set(f, next); }}>{o}</button>;
        })}</div>;
      case 'chipsadd':
        return <ChipAddInput value={v} onChange={(arr) => set(f, arr)} opt={f.opt ?? []}
          storeKey={f.suggest ? `calmie_suggest_${f.sec}_${f.key}` : undefined} seed={f.suggestSeed} />;
      case 'scaleimport': {
        const ol = (data as any).olcekler || {};
        const has = ol.phq9?.skor != null || ol.gad7?.skor != null;
        const card = (name: string, sc: any, max: number) => (
          <div className="olc-card">
            <span className="olc-name">{name}</span>
            {sc?.skor != null
              ? <span className="olc-val"><b>{sc.skor}</b><em>/{max}</em>{sc.sinif ? <i className="olc-band">{sc.sinif}</i> : null}{sc.tarih ? <i className="olc-date">{sc.tarih}</i> : null}</span>
              : <span className="olc-empty">—</span>}
          </div>
        );
        return (
          <div className="olc-import">
            <div className="olc-grid">
              {card('PHQ-9 · depresyon', ol.phq9, 27)}
              {card('GAD-7 · anksiyete', ol.gad7, 21)}
            </div>
            <button type="button" className="olc-pull" disabled={!hasPreForm} onClick={() => onImportPreForm?.()}>
              {hasPreForm ? 'Ölçek verilerini ön-formdan çek' : 'Seans öncesi form / ölçek yanıtı yok'}
            </button>
            <p className="olc-hint">
              {has
                ? 'Skorlar seans öncesi formdan çekildi. Yeni yanıt geldiyse tekrar çekebilirsin.'
                : hasPreForm
                  ? 'Danışanın seans öncesi formundaki PHQ-9 / GAD-7 yanıtları buraya işlenecek.'
                  : 'Danışana henüz ölçekli bir form ulaşmamış. Form yanıtı geldiğinde burada içe aktarabilirsin.'}
            </p>
          </div>
        );
      }
      case 'scale': {
        const cur = v === '' ? -1 : Number(v);
        const segs = Array.from({ length: 11 }, (_, i) => i); // 0–10 gösterim
        return (
          <div className="scale">
            <div className="sh"><b>{f.label}</b><span className="sc">{v === '' ? '–' : v}<em>/{f.max}</em></span></div>
            <div className="seg">{segs.map((i) => <button key={i} type="button" className={i === cur ? 'on' : ''} onClick={() => set(f, i)}>{i}</button>)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.06em', color: 'var(--ink-faint)', marginTop: 8 }}>aralık {f.bands} · 0–10 gösteriliyor</div>
          </div>
        );
      }
    }
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&display=swap" rel="stylesheet" />

      <div className="an2 cchrome" data-bg={theme === 'default' ? undefined : theme}>

        {/* 1) tema mesh/foto zemin — Çalışma Alanı ile paylaşımlı */}
        <div className="app-bg" aria-hidden="true">
          <span className="hb-mesh" />
          <img className="hb-photo" alt="" src={bgPhoto || DEFAULT_BG} />
          <img className="hb-cherry" alt="" src="/tema-cherry.jpg" /><span className="hb-cherry-scrim" />
          <img className="hb-fur" alt="" src="/tema-kurk.jpg" /><span className="hb-fur-scrim" />
          <span className="hb-tint" /><span className="hb-crest" /><span className="hb-grade" /><span className="hb-vignette" /><span className="hb-grain" />
        </div>

        {/* 2) frosted-glass scrim */}
        <div className="scrim" aria-hidden="true" />

        {/* sayfa menüsü — Ana Sayfa dock'u ile aynı (kayan glider + aktif seçim) */}
        <header className="page-menu">
          <span className="pm-brand"><b>Calmie</b><i>.</i></span>
          <nav className="pm-nav" aria-label="Sayfa menüsü" ref={menuRef} onMouseLeave={() => moveGlider(activeLink())}>
            <span className="pm-glider" ref={gliderRef} aria-hidden="true" />
            {DOCK.map((d) => (
              <a key={d.target} href="#" className={d.active ? 'active' : ''} onMouseEnter={(e) => moveGlider(e.currentTarget)} onClick={(e) => { e.preventDefault(); if (!d.active) onNav?.(d.target); }}>{d.label}</a>
            ))}
          </nav>
        </header>

        {/* 3) ortada yüzen modal kart */}
        <div className="modal-wrap">
          <div className="shell" role="dialog" aria-modal="true" aria-label="Anamnez">

            <div className="topbar">
              <div className="tb-left">
                <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Danışanlar</button>
                <div className="tb-title"><span className="e">Anamnez · ilk değerlendirme</span><b>{clientName || '—'}{clientNo ? ` · ${clientNo}` : ''}</b></div>
              </div>
              <div className="tb-right">
                {reqErr && <span className="save-err" role="alert">⚠ Zorunlu: {reqErr}</span>}
                <button className="tb-act ai" type="button" onClick={() => onAiFill?.()}><svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></svg><span>AI ile doldur</span></button>
                <button className="tb-act" type="button" disabled={!hasPreForm} onClick={() => onImportPreForm?.()}><svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></svg><span>Ön-form içe aktar</span></button>
                <button className={`tb-save${saved ? ' done' : ''}`} type="button" onClick={doSave}>
                  {saved
                    ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6 9 17l-5-5" /></svg>Kaydedildi</>
                    : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>Kaydet</>}
                </button>
              </div>
            </div>

            <div className="layout">
              <aside className="navcol">
                <div className="prog">
                  <div className="pt"><span className="e">Tamamlanma</span><span className="pc num">{pct}%</span></div>
                  <div className="track"><span className="fill" style={{ width: `${pct}%` }} /></div>
                </div>
                <nav className="navlist">
                  {SECTIONS.map((s, si) => (
                    <a key={s.id} className={`navitem${s.risk ? ' risk' : ''}${active === s.id ? ' active' : ''}`} href={`#sec-${s.id}`} onClick={(e) => { e.preventDefault(); scrollTo(s.id); }}>
                      <span className="no">{String(si + 1).padStart(2, '0')}</span>
                      <span className="nm">{s.t}</span>
                      <span className={`st ${secState[s.id]}`} />
                    </a>
                  ))}
                </nav>

                {onOpenDongu && (
                  <>
                    <div className="navsep"><span className="navsep-l">Formülasyon</span></div>
                    <nav className="navlist">
                      <a className="navitem go" href="#dongu" onClick={(e) => { e.preventDefault(); onOpenDongu(); }}>
                        <span className="no">↗</span>
                        <span className="nm">Sorun Döngüleri</span>
                        <span className="go-arrow" aria-hidden>→</span>
                      </a>
                    </nav>
                  </>
                )}
              </aside>

              <div className="formcol" ref={formColRef}>
                <div className="form-inner">
                  <div className="banner">
                    <span className="ic"><svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></svg></span>
                    <span className="bt"><b>AI ile hızlı doldur.</b> Serbest intake metnini yapıştır; AI alanları çıkarsın, sen <a href="#" onClick={(e) => { e.preventDefault(); onAiFill?.(); }}>incele &amp; onayla</a>. Yalnız onayladığın alanlar forma yazılır — uydurma yok.</span>
                  </div>
                  <form onSubmit={(e) => e.preventDefault()}>
                    {SECTIONS.map((s, si) => (
                      <section key={s.id} className={`fsec${s.risk ? ' risk' : ''}`} id={`sec-${s.id}`} data-sid={s.id} ref={(el) => { secRefs.current[s.id] = el; }}>
                        <div className="fsec-head"><span className="no">{String(si + 1).padStart(2, '0')}</span><h2>{s.t}</h2>{s.risk && <span className="risk-flag">risk</span>}</div>
                        {s.info && <p className="fsec-info">{s.info}</p>}
                        {s.fields.map((f, fi) => {
                          const reqMiss = !!reqErr && !!f.required && isFieldEmpty(f);
                          const cls = `field${f.half ? ' half' : ''}${reqMiss ? ' req-miss' : ''}`;
                          return f.type === 'scale' || f.type === 'scaleimport'
                            ? <div className={cls} key={fi}>{renderControl(f, si, fi)}</div>
                            : <div className={cls} key={fi}><label htmlFor={`f-${si}-${fi}`}>{f.label}{f.required && <span className="req-badge">zorunlu</span>}</label>{renderControl(f, si, fi)}</div>;
                        })}
                      </section>
                    ))}
                  </form>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
