/* =====================================================================
   AI ÖZET → İNCELEME & ONAY — veri modeli + örnek veri
   "AI Özet İnceleme.html" içindeki const EXTRACT bloğundan birebir.
   Gerçek veri /api/ozet-cikar'dan bu şekle birebir uymalı (API anahtarı gelince).
   ===================================================================== */
export type Conf = 'hi' | 'mid' | 'lo';

export interface Field {
  key: string;
  value?: string;
  chips?: string[];
  conf: Conf;
  src: string;
  accepted?: boolean;
  edited?: boolean;
}
export interface Group { title: string; fields: Field[]; }
export interface ExtractResult {
  eyebrow: string;
  summary: string;
  groups: Group[];
  gaps: string[];
  gapsNote: string;
}
export type Mode = 'seans' | 'anamnez';
export type Extract = Record<Mode, ExtractResult>;

export const CONF_TXT: Record<Conf, string> = { hi: 'YÜKSEK', mid: 'ORTA', lo: 'DÜŞÜK' };
export const CONF_DOTS: Record<Conf, number> = { hi: 3, mid: 2, lo: 1 };

export const EXTRACT: Extract = {
  seans: {
    eyebrow: 'danışan: Elif Y. · 7. seans · 2026.06.02',
    summary:
      'Bugün Elif\'le 7. seanstı. Toplantıda söz alma ödevini yapmış, kısa cümle söyleyebilmiş ama sonra yüz kızarması kaygısı yükselmiş (SUDS≈7). Yine “herkes beni beceriksiz görüyor” düşüncesi devreye girmiş. Defüzyon çalıştık — “bu bir düşünce” etiketleme ve yaprak-dere metaforu. Ruh hali 6 gibi. Otantiklik onun için önemli. Toplantı öncesi aşırı hazırlık sürüyor. Ödev: hazırlık yapmadan tek cümle. İntihar düşüncesi yok, risk düşük.',
    groups: [
      {
        title: 'Seans Notu',
        fields: [
          { key: 'Seans odağı', value: 'Defüzyon — düşünceyle araya mesafe', conf: 'hi', src: 'defüzyon çalıştık — “bu bir düşünce” etiketleme' },
          { key: 'Kullanılan teknikler', chips: ['Defüzyon — “bu bir düşünce”', 'Yaprak-dere metaforu'], conf: 'hi', src: '“bu bir düşünce” etiketleme ve yaprak-dere metaforu' },
          { key: 'Gelişim gözlemi', value: 'Söz alma ödevini yaptı; kısa cümle söyleyebildi', conf: 'mid', src: 'söz alma ödevini yapmış, kısa cümle söyleyebilmiş' },
          { key: 'Ruh hali (1–10)', value: '6', conf: 'mid', src: 'ruh hali 6 gibi' },
          { key: 'Ev ödevi', value: 'Bir toplantıda hazırlık yapmadan tek cümle söylemek', conf: 'hi', src: 'Ödev: hazırlık yapmadan tek cümle' },
          { key: 'Risk değerlendirme', value: 'Yok · düşük', conf: 'hi', src: 'İntihar düşüncesi yok, risk düşük' },
        ],
      },
      {
        title: 'Formülasyon önerileri · mevcuda eklenecek',
        fields: [
          { key: 'Otomatik düşünce / engel', value: '“Herkes beni beceriksiz görüyor”', conf: 'hi', src: 'yine “herkes beni beceriksiz görüyor” düşüncesi devreye girmiş' },
          { key: 'Kontrol stratejisi', value: 'Toplantı öncesi aşırı hazırlık / kontrol etme', conf: 'hi', src: 'toplantı öncesi aşırı hazırlık sürüyor' },
          { key: 'Değer', value: 'Otantiklik', conf: 'hi', src: 'otantiklik onun için önemli' },
          { key: 'Planlanan müdahale', value: 'Maruziyet hiyerarşisinde bir basamak yukarı', conf: 'lo', src: 'zayıf ipucu — terapist teyit etmeli' },
        ],
      },
    ],
    gaps: ['4P (yatkınlaştıran / tetikleyici…)', 'Çekirdek inanç', 'SUDS (şemada ayrı alan yok → gözleme işlendi)'],
    gapsNote: 'AI bu alanları metinde bulamadı; <b>uydurmadı</b>, boş bıraktı. Gerekirse sen gir.',
  },
  anamnez: {
    eyebrow: 'yeni kayıt · intake · 2026.06.02',
    summary:
      '34 yaşında, kadın, yazılım mühendisi, evli, İstanbul\'da yaşıyor. Yaklaşık iki yıldır artan toplum içinde konuşma kaygısı ve toplantılarda söz alamama nedeniyle başvurdu. Çarpıntı, yüz kızarması ve kaçınma var. Daha önce psikiyatrik başvurusu olmamış, ilaç kullanmıyor. Bilinen kronik hastalığı yok. Annede kaygı öyküsü var. Düzenli alkol/madde kullanımı yok. İntihar düşüncesi yok. Hedefi toplantılarda rahatça konuşabilmek.',
    groups: [
      {
        title: 'Künye',
        fields: [
          { key: 'Yaş', value: '34', conf: 'hi', src: '34 yaşında' },
          { key: 'Cinsiyet', value: 'Kadın', conf: 'hi', src: 'kadın' },
          { key: 'Meslek', value: 'Yazılım mühendisi', conf: 'hi', src: 'yazılım mühendisi' },
          { key: 'Medeni durum', value: 'Evli', conf: 'hi', src: 'evli' },
          { key: 'Şehir', value: 'İstanbul', conf: 'hi', src: 'İstanbul\'da yaşıyor' },
          { key: 'Sunum sorunu', value: 'Toplum içinde konuşma / söz alma kaygısı', conf: 'hi', src: 'konuşma kaygısı ve toplantılarda söz alamama' },
        ],
      },
      {
        title: 'Anamnez bölümleri',
        fields: [
          { key: 'Başvuru nedeni', value: '~2 yıldır artan sosyal kaygı, toplantılarda söz alamama', conf: 'hi', src: 'iki yıldır artan toplum içinde konuşma kaygısı' },
          { key: 'Şikayetler', chips: ['Çarpıntı', 'Yüz kızarması', 'Kaçınma'], conf: 'hi', src: 'çarpıntı, yüz kızarması ve kaçınma var' },
          { key: 'Psikiyatrik geçmiş', value: 'Önceki başvuru yok · ilaç kullanmıyor', conf: 'hi', src: 'daha önce psikiyatrik başvurusu olmamış, ilaç kullanmıyor' },
          { key: 'Tıbbi geçmiş', value: 'Bilinen kronik hastalık yok', conf: 'mid', src: 'bilinen kronik hastalığı yok' },
          { key: 'Aile öyküsü', value: 'Annede kaygı öyküsü', conf: 'hi', src: 'annede kaygı öyküsü var' },
          { key: 'Madde kullanımı', value: 'Düzenli alkol / madde yok', conf: 'hi', src: 'düzenli alkol/madde kullanımı yok' },
          { key: 'Risk', value: 'İntihar düşüncesi yok · düşük', conf: 'hi', src: 'intihar düşüncesi yok' },
          { key: 'Hedefler', value: 'Toplantılarda rahatça konuşabilmek', conf: 'mid', src: 'hedefi toplantılarda rahatça konuşabilmek' },
        ],
      },
    ],
    gaps: ['Gelişimsel öykü', 'Ölçekler (LSAS / BDI)', 'Travma öyküsü', 'Mevcut destek sistemi'],
    gapsNote: 'Bu alanlar intake metninde geçmedi; AI <b>uydurmadı</b>. İlk seansta sen tamamla.',
  },
};

export default EXTRACT;
