'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, ArrowRight, ChevronDown, MoreVertical, Edit3, RefreshCw, CalendarPlus, X, Check,
  Users, Link2, Copy, Send, Star, MessageSquare, Lightbulb, AlertCircle,
} from 'lucide-react';
import OnamMetinleri from './OnamMetinleri';

// Deterministik TR kısa tarih (locale/ICU'ya bağlı değil → SSR/client hydration uyumlu)
const TR_AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
function trGunAy(s: string): string {
  if (!s) return '';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? s + 'T12:00:00' : s);
  return isNaN(d.getTime()) ? s : `${d.getDate()} ${TR_AY_KISA[d.getMonth()]}`;
}

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

export type TerapistSection =
  | 'hakkinda' | 'kimlik' | 'manifesto' | 'uzmanlik' | 'ilke'
  | 'saatler' | 'seans-ayar' | 'bildirim' | 'veri'
  | 'supervizor' | 'sup-notlari'
  | 'gelisim' | 'beceri' | 'oz-bakim' | 'yansima'
  | 'onam-formlari' | 'mudahale' | 'duygudurum'
  | 'danisan-degerlendirme' | 'instagram';

export type SectionStatus = 'tamam' | 'aktif' | 'taslak' | 'uyari' | 'count';

export type TerapistSidebarItem = {
  num: string;
  key: TerapistSection;
  label: string;
  status?: SectionStatus;
  count?: number;
};

export type TerapistHero = {
  name: string;
  lastName: string;
  title: string;             // "Klinik Psikolog"
  years: number;             // 12
  modalities: string[];      // ["ACT","CFT","BDT"]
  specs: string[];           // ["Sosyal kaygı","OKB"]
};

export type GoalItem = {
  label: string;
  done?: boolean;         // kısa vadeli: tamamlandı mı
  progress?: number;      // uzun vadeli: 0–100
};

export type MonthlyGoals = {
  month: string;          // "Mayıs 2026"
  mission: string;        // aylık misyon — kısa, etkileyici cümle
  vision: string;         // aylık vizyon — nereye ulaşmak istiyoruz
  shortTerm: GoalItem[];  // 2–5 madde, bu ay tamamlanabilir
  longTerm: GoalItem[];   // 3–6 madde, süregelen / dönemlik
};

export type MoodEntry = {
  date: string;    // "YYYY-MM-DD"
  score: number;   // 1–10
  note?: string;   // kısa not
};

export type DevCalendarEvent = {
  title: string;          // hedef/yatırım başlığı
  date: string;           // "YYYY-MM-DD"
  time: string;           // "HH:MM"
  durationMin: number;    // dakika
  notes?: string;
};

export type CompletedMonthTag = 'eğitim' | 'klinik' | 'öz-bakım' | 'süpervizyon' | 'araştırma';

export type CompletedMonth = {
  month: string;                  // "Nisan 2026"
  completedGoals: string[];       // kısa vadeli tamamlananlar
  solvedProblems: string[];       // çözülen sorunlar / üstesinden gelinilen engeller
  investments: string[];          // kendine yapılan yatırımlar (eğitim, süpervizyon, vb.)
  tags: CompletedMonthTag[];      // kategoriler
  score?: number;                 // 1–10 genel ay değerlendirmesi (opsiyonel)
};

// ── Uzmanlık & Akademik Geçmiş ─────────────────────────────────────────────

export type CvCategory = 'egitim' | 'sertifika' | 'deneyim' | 'yayin' | 'uzmanlik';

export type CvItem = {
  id?: string;
  category: CvCategory;
  group?: string;         // gruplandırma etiketi: "ACT Eğitimleri", "BDT Eğitimleri" vb.
  year: string;           // "2014–2017" veya "2023"
  title: string;          // "Klinik Psikoloji Yüksek Lisans"
  institution: string;    // "Boğaziçi Üniversitesi"
  detail?: string;        // ek bilgi, tez başlığı, akreditasyon vb.
  highlight?: boolean;    // öne çıkan madde (accent renk)
};

export type AcademicProfile = {
  items: CvItem[];
};

// ── WorkingPrinciple ────────────────────────────────────────────────────────

export type TherapyApproach = {
  key: string;
  abbr: string;        // "BDT", "ACT", "MKT"
  fullName: string;    // "Bilişsel Davranışçı Terapi"
  description: string; // kısa açıklama
  tags?: string[];     // yaklaşıma özgü kavramlar
  primary?: boolean;   // ana ekol → accent renk
};

export type SkillAxis = { name: string; value: number };  // 0-10
export type SkillMap = {
  headline: string;
  score: number;
  description: string;
  axes: SkillAxis[];          // 6
};

export type YearlyGrowth = {
  yearGoalHours: number;       // 60
  completedHours: number;      // 32
  headline?: string;           // kısa başlık — "Yıl tamamlanmasına yetişiyor."
  description: string;
  recent: { title: string; hours: number; date: string }[];
};

export type SupervisionNote = {
  id?: string | number;        // navigasyon için
  romanNum: string;
  topic: string;
  date: string;
  difficulty: number;          // 1-10 accent
  learning: number;            // 1-10 green
  upcoming?: boolean;
};

export type OzBakimCard = {
  num: string;
  label: string;               // "Seans yükü"
  headline: string;            // "Tam dolu hafta"
  target: number;
  actual: number;
  unit: string;                // "seans"
  status: 'good' | 'warn' | 'risk';
};

export type Reflection = {
  status: string;              // "taslak · 12 dk önce"
  pre: string;
  accentItalicPhrase: string;
  post: string;
  meta: string;                // "haftalık · 26.05.2026"
  metaTail?: string;
};

export type Supervisor = {
  name: string;
  title: string;
  weeklySlot: string;          // "Salı, 19:00"
};

export type TerapistProfilPanelProps = {
  hero: TerapistHero;
  sidebar?: TerapistSidebarItem[];
  activeSection?: TerapistSection;
  initialSection?: TerapistSection;
  onChangeSection?(s: TerapistSection): void;

  moodHistory?: MoodEntry[];           // günlük duygudurum grafiği (en üst)
  mudahaleSlot?: React.ReactNode;      // müdahale kütüphanesi içeriği (accordion mod)
  onOpenMudahale?(): void;             // yeni sayfaya aç

  monthlyGoals?: MonthlyGoals;
  completedMonths?: CompletedMonth[];
  academicProfile?: AcademicProfile;
  approaches?: TherapyApproach[];
  skillMap?: SkillMap;
  growth?: YearlyGrowth;
  supervisor?: Supervisor;
  supervisionNotes?: SupervisionNote[];
  ozBakim?: OzBakimCard[];
  weeklyReflection?: Reflection;

  isEditing?: boolean;
  onToggleEdit?(): void;
  onBack?(): void;
  onPublicPreview?(): void;
  onMessageSupervisor?(): void;
  onAddSupervisionNote?(): void;
  onOpenSupervisionNote?(id: string | number): void;
  onMeasureBurnout?(): void;
  onSaveReflection?(text: string): void;
  onAddToCalendar?(event: DevCalendarEvent): void;
  onOpenOnamForm?(formId: string): void;
};

// ──────────────────────────────────────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_HERO: TerapistHero = {
  name: 'Göksel',
  lastName: 'Akkaya',
  title: 'Psikolojik Danışman',
  years: 10,
  modalities: ['BDT', 'ACT', 'MKT'],
  specs: ['Kaygı Bozuklukları', 'OKB', 'Depresyon', 'Travma'],
};

const DEFAULT_SIDEBAR: TerapistSidebarItem[] = [
  { num: '01', key: 'kimlik',       label: 'Kimlik özeti',        status: 'tamam' },
  { num: '02', key: 'manifesto',    label: 'Aylık Hedefler',      status: 'aktif' },
  { num: '04', key: 'ilke',         label: 'Terapi Ekolleri' },
  { num: '05', key: 'saatler',      label: 'Çalışma saatleri',    status: 'tamam' },
  { num: '06', key: 'seans-ayar',   label: 'Seans ayarları',      status: 'tamam' },
  { num: '07', key: 'bildirim',     label: 'Bildirim & SMS',      status: 'taslak' },
  { num: '08', key: 'veri',         label: 'Takvim & Veri',       status: 'aktif' },
  { num: '11', key: 'gelisim',      label: 'Yılın Özeti',         status: 'aktif' },
  { num: '15', key: 'onam-formlari', label: 'Onam Formları',      status: 'tamam' },
  { num: '16', key: 'mudahale',      label: 'Müdahale Kütüphanesi' },
  { num: '17', key: 'danisan-degerlendirme', label: 'Danışan Değerlendirmesi', status: 'aktif' },
  { num: '18', key: 'instagram',             label: 'Instagram' },
];

const DEFAULT_MOOD_HISTORY: MoodEntry[] = [
  { date: '2026-05-01', score: 7, note: 'Yeni aya iyi başladım' },
  { date: '2026-05-05', score: 6 },
  { date: '2026-05-08', score: 8, note: 'Süpervizyon sonrası netlik' },
  { date: '2026-05-12', score: 5, note: 'Yoğun hafta' },
  { date: '2026-05-15', score: 7 },
  { date: '2026-05-19', score: 9, note: 'CFT atölyesi çok iyi geçti' },
  { date: '2026-05-22', score: 6, note: 'Yorgunluk belirgin' },
  { date: '2026-05-26', score: 8 },
  { date: '2026-05-28', score: 7, note: 'Denge iyi' },
  { date: '2026-05-30', score: 8 },
];

const DEFAULT_MONTHLY_GOALS: MonthlyGoals = {
  month: 'Mayıs 2026',
  mission: 'Bu ay her danışanda en az bir değer yönelimli adım planlamak.',
  vision: 'Süreç odaklı ACT ve MKT entegrasyonuyla Türkiye\'de akredite süpervizör kimliğine ulaşmak.',
  shortTerm: [
    { label: 'ACT süreç odaklı terapi notlarını arşivle', done: true },
    { label: 'OKB vakalarında maruziyet protokol güncellemesi yap', done: false },
    { label: 'Mayıs süpervizyon notlarını arşivle', done: false },
    { label: 'Burnout ölçeğini doldur', done: false },
  ],
  longTerm: [
    { label: 'EABCT akreditasyonunu 2030\'a taşı', progress: 100 },
    { label: 'Grup terapi programı geliştir — Tekirdağ', progress: 15 },
    { label: 'Klinik vaka kitabı yaz — 10 vaka hedefi', progress: 20 },
    { label: 'MKT ileri uygulayıcı eğitimi', progress: 0 },
  ],
};

const DEFAULT_COMPLETED_MONTHS: CompletedMonth[] = [
  {
    month: 'Nisan 2026',
    completedGoals: [
      'Üç danışan için ACT formülasyonu tamamlandı',
      'Süpervizyon notları arşivlendi',
      'Burnout ölçeği dolduruldu',
    ],
    solvedProblems: [
      'Karmaşık yas vakasında sınır çalışması netleştirildi',
      'Maruziyet protokolünde dirençli danışanla hedef yeniden belirlendi',
    ],
    investments: [
      'ACT ileri uygulayıcı eğitimi — 2. modül tamamlandı (8 saat)',
      'Haftalık süpervizyon sürekliliği korundu',
    ],
    tags: ['eğitim', 'klinik', 'süpervizyon'],
    score: 8,
  },
  {
    month: 'Mart 2026',
    completedGoals: [
      'Grup terapi program taslağı hazırlandı',
      'Hexaflex seans takibi sesli kayıtla denendi',
      'Yeni danışan değerlendirme süreci güncellendi',
    ],
    solvedProblems: [
      'İntihar riski yönetimi protokolü gözden geçirildi',
      'Zaman yönetimi: seans arası not alma süresi kısaltıldı',
    ],
    investments: [
      'CFT süpervizyon görüşmesi — 3 vaka',
      'Araştırma okuma: 4 makale (ACT + OKB)',
    ],
    tags: ['klinik', 'araştırma', 'öz-bakım'],
    score: 7,
  },
  {
    month: 'Şubat 2026',
    completedGoals: [
      'EMDR temel eğitimi tamamlandı (16 saat)',
      'Danışan takip formu yenilendi',
    ],
    solvedProblems: [
      'Erken sonlandırma örüntüsü fark edildi, bağlanma çalışması planlandı',
    ],
    investments: [
      'EMDR klinik uygulama eğitimi',
      'Klinik kimlik yazma çalışması başlatıldı',
    ],
    tags: ['eğitim', 'klinik'],
    score: 9,
  },
  {
    month: 'Ocak 2026',
    completedGoals: [
      'Yıllık hedef planı oluşturuldu',
      'CFT atölye çalışması tamamlandı (4 saat)',
      'Öz-bakım rutini gözden geçirildi',
    ],
    solvedProblems: [
      'Tükenmişlik belirtileri erkenden fark edildi, seans yükü dengelendi',
    ],
    investments: [
      'CFT atölye — öz-şefkat pratiği',
      'Kişisel terapi seansına devam',
    ],
    tags: ['öz-bakım', 'eğitim', 'süpervizyon'],
    score: 8,
  },
];

const DEFAULT_ACADEMIC: AcademicProfile = {
  items: [
    // ── Akademik Eğitim ──────────────────────────────────────────────────
    { category: 'egitim',    group: 'Akademik Eğitim',          year: '–2014',     title: 'PDR Lisans (İngilizce)',                              institution: 'Orta Doğu Teknik Üniversitesi (ODTÜ)',             highlight: true },
    { category: 'egitim',    group: 'Akademik Eğitim',          year: '–2016',     title: 'Yönetim ve Organizasyon (MBA)',                       institution: 'Marmara Üniversitesi',                             highlight: false },
    // ── Mesleki Deneyim ──────────────────────────────────────────────────
    { category: 'deneyim',   group: 'Mesleki Deneyim',          year: '2016–',     title: 'Psikolojik Danışman',                                institution: 'Tekirdağ',                     detail: '5.000+ bireysel görüşme · BDT, ACT, MKT', highlight: true },
    // ── BDT Eğitimleri ───────────────────────────────────────────────────
    { category: 'sertifika', group: 'BDT Eğitimleri',           year: '2020',      title: 'BDT Teorik Eğitim',                                 institution: 'M. Hakan TÜRKÇAPAR — BDT Derneği, İstanbul',       detail: 'Depresyon, Panik, OKB, Sosyal Anksiyete, TSSB, YAB', highlight: false },
    { category: 'sertifika', group: 'BDT Eğitimleri',           year: '2021',      title: 'BDT Beceri Kazandırma Eğitimi',                     institution: 'M. Hakan TÜRKÇAPAR — BDT Derneği, İstanbul',       highlight: false },
    { category: 'sertifika', group: 'BDT Eğitimleri',           year: '2021',      title: 'BDT Süpervizyon — 1. Süpervizyon',                  institution: 'M. Hakan TÜRKÇAPAR — BDT Derneği, Antalya',        highlight: false },
    { category: 'sertifika', group: 'BDT Eğitimleri',           year: '2022',      title: 'BDT İleri Düzey 2. Modül',                          institution: 'M. Hakan TÜRKÇAPAR — BDT Derneği, Ankara',         detail: 'Yeme Bozuklukları, Bağımlılık, Psikoz, TSSB Oxford, ACT, Farkındalık, OKB, Şema, CFT', highlight: true },
    { category: 'sertifika', group: 'BDT Eğitimleri',           year: '2022–2023', title: 'BDT Süpervizyon — 2. Süpervizyon',                  institution: 'M. Hakan TÜRKÇAPAR — BDT Derneği, İstanbul',       highlight: false },
    { category: 'sertifika', group: 'BDT Eğitimleri',           year: '2023–2024', title: 'BDT Süpervizyon — 3. Süpervizyon',                  institution: 'M. Hakan TÜRKÇAPAR — BDT Derneği, İstanbul',       highlight: false },
    { category: 'sertifika', group: 'BDT Eğitimleri',           year: '2023–2024', title: 'Çocuk & Ergenlere Yönelik BDT',                     institution: 'Vahdet GÖRMEZ — BDT Derneği, İstanbul',            highlight: false },
    // ── ACT Eğitimleri ───────────────────────────────────────────────────
    { category: 'sertifika', group: 'ACT Eğitimleri',           year: '2025',      title: 'ACT Temel Eğitim',                                  institution: 'Dr. İbrahim BİLGEN — ACT TÜRKİYE',                highlight: false },
    { category: 'sertifika', group: 'ACT Eğitimleri',           year: '2025',      title: 'ACT Temel Eğitim',                                  institution: 'Fatih YAVUZ — TÜRBAD',                             highlight: false },
    { category: 'sertifika', group: 'ACT Eğitimleri',           year: '2025',      title: 'ACT Orta Seviye Eğitimi',                           institution: 'Dr. İbrahim BİLGEN — ACT TÜRKİYE',                highlight: false },
    { category: 'sertifika', group: 'ACT Eğitimleri',           year: '2026',      title: 'ACT İleri Düzey Eğitimi',                           institution: 'Dr. İbrahim BİLGEN — ACT TÜRKİYE',                highlight: true },
    { category: 'sertifika', group: 'ACT Eğitimleri',           year: '2026',      title: 'ACT Süreç Odaklı Terapi Eğitimi',                   institution: 'Dr. İbrahim BİLGEN — ACT TÜRKİYE',                highlight: false },
    // ── Diğer Eğitimler ──────────────────────────────────────────────────
    { category: 'sertifika', group: 'Diğer Eğitimler',          year: '2016',      title: 'İletişim & Müşteri Deneyimi Sertifikaları',          institution: 'TelephoneDoctor, İstanbul',                         highlight: false },
    { category: 'sertifika', group: 'Diğer Eğitimler',          year: '2019',      title: 'Uygulayıcı Test Sertifikaları',                     institution: 'Bilgelik Enstitüsü & BDT Derneği, İstanbul',        detail: 'WISC-R, D2, Burdon, Raven, Peabody, Catell 2-A, Metropolitan, AGTE', highlight: false },
    { category: 'sertifika', group: 'Diğer Eğitimler',          year: '2019',      title: 'Hipnoterapi & Cinsel Terapide Hipnoterapi',          institution: 'Bülent URAN — Cinsel Sağlık Enstitüsü, İstanbul',  highlight: false },
    // ── Akreditasyon ─────────────────────────────────────────────────────
    { category: 'sertifika', group: 'Akreditasyon',             year: '2025–2030', title: 'EABCT Akredite Üye',                                institution: 'European Association for Behavioural & Cognitive Therapies', highlight: true },
    // ── Uzmanlık Alanları ────────────────────────────────────────────────
    { category: 'uzmanlik',  group: 'Uzmanlık Alanları',        year: '',          title: 'Kaygı Bozuklukları & OKB',                          institution: 'Ana Uzmanlık',                                      highlight: true },
    { category: 'uzmanlik',  group: 'Uzmanlık Alanları',        year: '',          title: 'Depresyon',                                         institution: 'Uzmanlık Alanı',                                    highlight: false },
    { category: 'uzmanlik',  group: 'Uzmanlık Alanları',        year: '',          title: 'Travma & TSSB',                                     institution: 'Uzmanlık Alanı',                                    highlight: false },
    { category: 'uzmanlik',  group: 'Uzmanlık Alanları',        year: '',          title: 'Yeme Bozuklukları & Bağımlılık',                    institution: 'Uzmanlık Alanı',                                    highlight: false },
    { category: 'uzmanlik',  group: 'Uzmanlık Alanları',        year: '',          title: 'Ergen & Yetişkin Danışmanlığı',                     institution: 'Uzmanlık Alanı',                                    highlight: false },
  ],
};

// ── Instagram ──────────────────────────────────────────────────────────────

type IgPostType = 'post' | 'reel' | 'carousel';

type IgPost = {
  id: string;
  gradient: [string, string]; // CSS gradient stops
  type: IgPostType;
  caption: string;
  likes: number;
  comments: number;
  date: string;
};

const MOCK_IG_POSTS: IgPost[] = [
  { id: 'p1', gradient: ['#a8c8f0','#5a8fd4'], type: 'reel',     caption: 'ACT\'te kabul ne demek? Düşünceleri geçip gitmesine izin vermek, onlarla savaşmak değil. 🔷', likes: 312, comments: 28, date: '2026-05-27' },
  { id: 'p2', gradient: ['#c8e6c9','#66bb6a'], type: 'post',     caption: 'Kaygı bir tehlike sinyali değil, zihnin aşırı çalışmasıdır. BDT perspektifinden bakınca...', likes: 218, comments: 15, date: '2026-05-24' },
  { id: 'p3', gradient: ['#f8bbd0','#e91e8c'], type: 'carousel', caption: 'OKB\'de maruziyet protokolü: 5 adımda nasıl çalışır? (kaydır →)', likes: 487, comments: 61, date: '2026-05-21' },
  { id: 'p4', gradient: ['#ffe0b2','#ff9800'], type: 'reel',     caption: 'Terapi odamdan bir gün: Not almak, bağlantı kurmak, sessizliği taşımak.', likes: 156, comments: 9,  date: '2026-05-18' },
  { id: 'p5', gradient: ['#e8d5f5','#9c27b0'], type: 'post',     caption: 'Değer yönelimli yaşam nedir? ACT Hexaflex\'in en güçlü kolundan bugün konuştuk.', likes: 274, comments: 33, date: '2026-05-14' },
  { id: 'p6', gradient: ['#b2dfdb','#009688'], type: 'carousel', caption: 'Süpervizyon bittikten sonra ne hissettim: büyüme hiç rahat değil ama hep doğru. (kaydır →)', likes: 193, comments: 22, date: '2026-05-10' },
];

export const DEFAULT_APPROACHES: TherapyApproach[] = [
  {
    key: 'bdt',
    abbr: 'BDT',
    fullName: 'Bilişsel Davranışçı Terapi',
    description:
      'Düşünce, duygu ve davranış döngüsünü hedefler. Otomatik düşünceler ve çekirdek inançların yeniden yapılandırılması, maruziyet protokolleri ve sistematik ev ödevi yapısıyla çalışır.',
    tags: ['Bilişsel yeniden yapılandırma', 'Maruziyet', 'Düşünce kaydı', 'Ev ödevi'],
    primary: true,
  },
  {
    key: 'act',
    abbr: 'ACT',
    fullName: 'Kabul ve Kararlılık Terapisi',
    description:
      'Psikolojik esnekliği artırır; kabul, bilişsel defüzyon, şimdiki ana temas ve değer temelli eylem üzerine kurulur. Acıyla savaşmak yerine değerler yönünde hareket etmeyi öğretir.',
    tags: ['Hexaflex', 'Kabul', 'Defüzyon', 'Değerler', 'Bağlı eylem'],
    primary: true,
  },
  {
    key: 'mkt',
    abbr: 'MKT',
    fullName: 'Metakognitif Terapi',
    description:
      'Endişe ve ruminasyonu sürdüren metabilişsel inançları hedefler. Dikkat kontrolü ve ayrık farkındalık modunu geliştirerek bilişsel dikkat sendromunun (CAS) önüne geçer.',
    tags: ['Metabilişler', 'CAS', 'Dikkat eğitimi', 'Ayrık farkındalık'],
    primary: false,
  },
  {
    key: 'mindfulness-bdt',
    abbr: 'MBDT',
    fullName: 'Mindfulness Bazlı BDT',
    description:
      'Bilinçli farkındalık pratiklerini BDT yapısıyla birleştirir. Ruminasyon ve kaçınma döngülerini kesintiye uğratmak için şimdiki ana dönük farkındalık egzersizleri kullanır.',
    tags: ['Mindfulness', 'Farkındalık egzersizleri', 'Ruminasyon', 'Gevşeme'],
    primary: false,
  },
];

const DEFAULT_SKILL: SkillMap = {
  headline: 'BDT protokol uygulaması ve süpervizyon güçlü; grup terapi deneyimi geliştirilecek.',
  score: 8.0,
  description:
    '700+ saat akredite eğitim ve 300+ saat süpervizyon ile BDT/ACT protokol uygulaması güçlü. Grup terapi programı geliştirme sürecinde.',
  axes: [
    { name: 'BDT Protokol', value: 9 },
    { name: 'ACT/MKT',      value: 8 },
    { name: 'Süpervizyon',  value: 9 },
    { name: 'Krize müd.',   value: 8 },
    { name: 'Ergen & Çocuk', value: 7 },
    { name: 'Grup terapi',  value: 4 },
  ],
};

const DEFAULT_GROWTH: YearlyGrowth = {
  yearGoalHours: 80,
  completedHours: 52,
  description:
    '700+ saat akredite eğitim birikimi üzerine 2026\'da ACT ileri ve süreç odaklı terapi eğitimleri tamamlandı. Yıl hedefinin %65\'i aşıldı.',
  recent: [
    { title: 'ACT Süreç Odaklı Terapi Eğitimi',  hours: 16, date: '2026.04.10' },
    { title: 'ACT İleri Düzey Eğitimi',           hours: 20, date: '2026.02.15' },
    { title: 'ACT Orta Seviye Eğitimi',           hours: 16, date: '2025.11.08' },
  ],
};

const DEFAULT_SUPERVISOR: Supervisor = {
  name: 'Prof. M. Hakan Türkçapar',
  title: 'BDT süpervizörü · BDT Derneği',
  weeklySlot: 'Perşembe, 18:00',
};

const DEFAULT_SUP_NOTES: SupervisionNote[] = [
  { romanNum: 'I',   topic: 'Karmaşık yas vakası — sınır',         date: '2026.04.02', difficulty: 8, learning: 9 },
  { romanNum: 'II',  topic: 'Maruziyet — etik çatışma',             date: '2026.04.16', difficulty: 7, learning: 8 },
  { romanNum: 'III', topic: 'Karşı-aktarım örüntüsü',               date: '2026.04.30', difficulty: 9, learning: 9 },
  { romanNum: 'IV',  topic: 'İntihar düşüncesi — risk planı',       date: '2026.05.14', difficulty: 8, learning: 7 },
  { romanNum: 'V',   topic: 'Çift terapisi — taraf tutmama',        date: '2026.05.21', difficulty: 6, learning: 8 },
  { romanNum: 'VI',  topic: 'Bu hafta — kendi yorgunluğum',         date: '2026.05.28', difficulty: 0, learning: 0, upcoming: true },
];

const DEFAULT_OZ_BAKIM: OzBakimCard[] = [
  { num: '01', label: 'Seans yükü', headline: 'Tam dolu hafta', target: 18, actual: 22, unit: 'seans', status: 'warn' },
  { num: '02', label: 'Süpervizyon', headline: 'Düzenli', target: 1, actual: 1, unit: 'saat', status: 'good' },
  { num: '03', label: 'Hareket', headline: 'Eksik', target: 4, actual: 1, unit: 'kez', status: 'risk' },
  { num: '04', label: 'Uyku', headline: 'Stabil', target: 7, actual: 7, unit: 'saat/gece', status: 'good' },
];

const DEFAULT_REFLECTION: Reflection = {
  status: 'taslak · 12 dk önce',
  pre: '"Bugün Elif\'le çalışırken kendi',
  accentItalicPhrase: ' kayboluşumu',
  post: ' fark ettim. Onun susmasında kendi suskunluğumu tanıdım — ve bu beni rahatlattı çünkü artık ikimiz de oradaydık."',
  meta: 'haftalık · 26.05.2026',
  metaTail: 'çağrılan duygu',
};

// ──────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────

export default function TerapistProfilPanel(props: TerapistProfilPanelProps) {
  const hero = props.hero ?? DEFAULT_HERO;
  const sidebar = props.sidebar ?? DEFAULT_SIDEBAR;
  const [internalSection, setInternalSection] = useState<TerapistSection>(props.initialSection ?? 'hakkinda');

  // Eğitim geçmişi — CV modal
  const [cvOpen, setCvOpen] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  // Gelişim değerlendirme modalı
  type FbPeriod = '1ay' | '3ay' | '6ay' | 'ozel';
  const [fbOpen,    setFbOpen]    = useState(false);
  const [fbPeriod,  setFbPeriod]  = useState<FbPeriod>('3ay');
  const [fbLink,    setFbLink]    = useState<string | null>(null);
  const [fbCopied,  setFbCopied]  = useState(false);
  const [fbStep,    setFbStep]    = useState<'setup' | 'preview'>('setup');

  const generateFbLink = () => {
    const token = Math.random().toString(36).slice(2, 10);
    setFbLink(`${typeof window !== 'undefined' ? window.location.origin : ''}/feedback/${token}`);
    setFbStep('preview');
  };
  const copyFbLink = () => {
    if (!fbLink) return;
    navigator.clipboard.writeText(fbLink).then(() => {
      setFbCopied(true);
      setTimeout(() => setFbCopied(false), 2000);
    });
  };
  const closeFbModal = () => { setFbOpen(false); setFbStep('setup'); setFbLink(null); };

  // Danışan değerlendirme modalı
  type DanFbStep = 'setup' | 'link';
  type DanFbRating = { id: string; patient: string; date: string; overall: number; progress: number; approach: number; comment?: string };
  const MOCK_DAN_RATINGS: DanFbRating[] = [
    { id: 'r1', patient: 'A.K.', date: '2026-05-18', overall: 5, progress: 4, approach: 5, comment: 'Seans ortamı güvenliydi, kendimi ifade edebildim.' },
    { id: 'r2', patient: 'M.Y.', date: '2026-05-10', overall: 4, progress: 4, approach: 5 },
    { id: 'r3', patient: 'E.S.', date: '2026-04-28', overall: 5, progress: 5, approach: 5, comment: 'Teknikler günlük hayatımda işe yaradı.' },
    { id: 'r4', patient: 'B.Ç.', date: '2026-04-15', overall: 4, progress: 3, approach: 4 },
  ];
  const [danFbOpen,    setDanFbOpen]    = useState(false);
  const [danFbStep,    setDanFbStep]    = useState<DanFbStep>('setup');
  const [danFbLink,    setDanFbLink]    = useState<string | null>(null);
  const [danFbCopied,  setDanFbCopied]  = useState(false);
  const [danFbPatient, setDanFbPatient] = useState('');
  const [danFbQuestions, setDanFbQuestions] = useState<string[]>(['overall', 'progress', 'approach']);
  const DAN_QUESTION_OPTIONS = [
    { id: 'overall',    label: 'Genel memnuniyet',    desc: '1–5 puan' },
    { id: 'progress',   label: 'İlerleme hissi',      desc: '1–5 puan' },
    { id: 'approach',   label: 'Terapist yaklaşımı',  desc: '1–5 puan' },
    { id: 'safety',     label: 'Güven & emniyet hissi', desc: '1–5 puan' },
    { id: 'comment',    label: 'Açık yorum alanı',    desc: 'Serbest metin' },
  ];
  const toggleDanQ = (id: string) =>
    setDanFbQuestions(prev => prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]);
  const generateDanLink = () => {
    const token = Math.random().toString(36).slice(2, 10);
    setDanFbLink(`${typeof window !== 'undefined' ? window.location.origin : ''}/danisan-form/${token}`);
    setDanFbStep('link');
  };
  const copyDanLink = () => {
    if (!danFbLink) return;
    navigator.clipboard.writeText(danFbLink).then(() => {
      setDanFbCopied(true);
      setTimeout(() => setDanFbCopied(false), 2200);
    });
  };
  const closeDanFbModal = () => { setDanFbOpen(false); setDanFbStep('setup'); setDanFbLink(null); setDanFbPatient(''); };

  // Profil fotoğrafı
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Onam form modal
  const [onamModalOpen, setOnamModalOpen] = useState(false);
  const [activeOnamId,  setActiveOnamId]  = useState('aydinlatma');
  const openOnamForm = (id: string) => { setActiveOnamId(id); setOnamModalOpen(true); };

  // Geçmiş aylar modal
  const [archiveOpen, setArchiveOpen] = useState(false);

  // Instagram bağlantı state
  const [igHandleInput, setIgHandleInput] = useState('');
  const [igHandle, setIgHandle] = useState('');
  const connectIg = () => {
    const h = igHandleInput.trim().replace(/^@/, '');
    if (h) setIgHandle(h);
  };

  // Mini takvim modal state
  type CalModal = { title: string; open: boolean; date: string; time: string; durationMin: number };
  const [calModal, setCalModal] = useState<CalModal>({
    open: false, title: '', date: '', time: '09:00', durationMin: 60,
  });
  const openCalModal = (title: string) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm   = String(today.getMonth() + 1).padStart(2, '0');
    const dd   = String(today.getDate()).padStart(2, '0');
    setCalModal({ open: true, title, date: `${yyyy}-${mm}-${dd}`, time: '09:00', durationMin: 60 });
  };
  const confirmCalModal = () => {
    if (!calModal.date) return;
    props.onAddToCalendar?.({
      title: calModal.title,
      date: calModal.date,
      time: calModal.time,
      durationMin: calModal.durationMin,
      notes: '__gelisim__',
    });
    setCalModal(m => ({ ...m, open: false }));
  };
  const activeSection = props.activeSection ?? internalSection;
  const mainRef = useRef<HTMLElement>(null);

  const scrollToSection = useCallback((key: TerapistSection) => {
    const el = mainRef.current?.querySelector<HTMLElement>(`[data-section="${key}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Deep-link: ?section ile gelindiyse o bölüme kaydır (prop client'ta geldiğinde tetiklenir).
  // Anlık kaydırma + birkaç deneme — async veri yüklenince oluşan reflow'a karşı dayanıklı.
  useEffect(() => {
    if (!props.initialSection) return;
    const key = props.initialSection;
    setInternalSection(key);
    const doScroll = () => {
      const el = mainRef.current?.querySelector<HTMLElement>(`[data-section="${key}"]`);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    };
    const timers = [200, 500, 900].map((ms) => setTimeout(doScroll, ms));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialSection]);

  const setActiveSection = (s: TerapistSection) => {
    setInternalSection(s);
    props.onChangeSection?.(s);
    scrollToSection(s);
  };

  // Profil fotoğrafı localStorage yükle
  useEffect(() => {
    const saved = localStorage.getItem('tp-profile-photo');
    if (saved) setProfilePhoto(saved);
  }, []);

  // Profil sayfasına özgü body arka planı (#07090f — referans rengi)
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = '#07090f';
    return () => { document.body.style.background = prev; };
  }, []);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setProfilePhoto(url);
      localStorage.setItem('tp-profile-photo', url);
    };
    reader.readAsDataURL(file);
  }, []);

  // IntersectionObserver — update active section while scrolling
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const key = visible[0].target.getAttribute('data-section') as TerapistSection | null;
          if (key) setInternalSection(key);
        }
      },
      { root: null, threshold: 0.35 },
    );
    main.querySelectorAll<HTMLElement>('[data-section]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const moodHistory  = props.moodHistory ?? DEFAULT_MOOD_HISTORY;
  const goals = props.monthlyGoals ?? DEFAULT_MONTHLY_GOALS;
  const completedMonths = props.completedMonths ?? DEFAULT_COMPLETED_MONTHS;
  const academic = props.academicProfile ?? DEFAULT_ACADEMIC;
  const approaches = props.approaches ?? DEFAULT_APPROACHES;
  const skill = props.skillMap ?? DEFAULT_SKILL;
  const growth = props.growth ?? DEFAULT_GROWTH;
  const supervisor = props.supervisor ?? DEFAULT_SUPERVISOR;
  const supNotes = props.supervisionNotes ?? DEFAULT_SUP_NOTES;
  const ozBakim = props.ozBakim ?? DEFAULT_OZ_BAKIM;
  const reflection = props.weeklyReflection ?? DEFAULT_REFLECTION;

  // ── Hero bento: iyilik chart (polyline + stems + skor etiketleri) ────────
  const { chartPts, chartPolyline, chartFill, weekAvg } = useMemo(() => {
    const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const last7 = moodHistory.slice(-7);
    const entries = Array.from({ length: 7 }, (_, i) => ({
      score: last7[i]?.score ?? 7,
      day: DAY_LABELS[i],
    }));
    const avg = entries.reduce((s, e) => s + e.score, 0) / 7;
    const pts = entries.map((e, i) => ({
      x: Math.round((i + 0.5) / 7 * 600),
      y: Math.round(150 - e.score * 12),
      score: e.score,
      day: e.day,
    }));
    const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
    const fill =
      `M${pts[0].x},${pts[0].y} ` +
      pts.slice(1).map(p => `L${p.x},${p.y}`).join(' ') +
      ` L${pts[6].x},160 L${pts[0].x},160 Z`;
    return { chartPts: pts, chartPolyline: polyline, chartFill: fill, weekAvg: avg };
  }, [moodHistory]);

  const growthPct = Math.min(100, Math.round((growth.completedHours / growth.yearGoalHours) * 100));

  // ── Hero bento: gauge çubukları ───────────────────────────────────────────
  const gaugeLines = useMemo(() => {
    const N = 26, cx = 100, cy = 100, rin = 64, rout = 90;
    const filled = Math.round(N * (growthPct / 100));
    const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
    const r3 = (v: number) => Math.round(v * 1000) / 1000; // SSR/client serileşme uyumu için sabit hassasiyet
    return Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1);
      const ang = Math.PI * (1 - t);
      return {
        x1: r3(cx + rin * Math.cos(ang)),
        y1: r3(cy - rin * Math.sin(ang)),
        x2: r3(cx + rout * Math.cos(ang)),
        y2: r3(cy - rout * Math.sin(ang)),
        stroke: i < filled
          ? `rgb(${lerp(255, 255, t)},${lerp(138, 94, t)},${lerp(60, 156, t)})`
          : 'rgba(20,30,55,0.10)',
      };
    });
  }, [growthPct]);

  // CV gruplama — modal ve accordion için ortak
  const CV_GROUP_META: Record<string, { color: string; bg: string; icon: string }> = {
    'Akademik Eğitim':   { color: '#3B6EA5', bg: 'rgba(59,110,165,0.06)',  icon: '🎓' },
    'Mesleki Deneyim':   { color: '#C2522A', bg: 'rgba(194,82,42,0.06)',   icon: '🏥' },
    'BDT Eğitimleri':    { color: '#1a6b4a', bg: 'rgba(26,107,74,0.06)',   icon: '🧩' },
    'ACT Eğitimleri':    { color: '#5a3e9b', bg: 'rgba(90,62,155,0.06)',   icon: '🔷' },
    'Diğer Eğitimler':   { color: '#7A6A3F', bg: 'rgba(122,106,63,0.06)', icon: '📚' },
    'Akreditasyon':      { color: '#b8860b', bg: 'rgba(184,134,11,0.07)',  icon: '🏅' },
    'Uzmanlık Alanları': { color: '#4a4a6a', bg: 'rgba(74,74,106,0.05)',   icon: '🎯' },
  };
  const CV_GROUP_ORDER = [
    'Akademik Eğitim', 'Mesleki Deneyim',
    'BDT Eğitimleri', 'ACT Eğitimleri', 'Diğer Eğitimler',
    'Akreditasyon', 'Uzmanlık Alanları',
  ];
  const cvGrouped: Record<string, CvItem[]> = {};
  academic.items.forEach(item => {
    const g = item.group || item.category;
    if (!cvGrouped[g]) cvGrouped[g] = [];
    cvGrouped[g].push(item);
  });
  const cvGroups = CV_GROUP_ORDER.filter(g => cvGrouped[g]);
  const cvTotalCount = academic.items.length;

  return (
    <div className="tp" data-active={activeSection}>
      {/* ── Dark glassmorphism arka plan ─── */}
      <div className="tp-scene" />

      <main className="tp-main" ref={mainRef}>

        {/* ══════════════════════════════════════════════════════════
            HERO — Glassmorphism Bento (yeni tasarım)
        ══════════════════════════════════════════════════════════ */}
        <section className="tp-about-section" data-section="hakkinda">
          <div className="tp-about-inner">

            {/* Dikey sidebar navigasyon */}
            <nav className="tp-hero-nav" aria-label="Sayfa navigasyonu">
              {([
                { key: 'hakkinda',      label: 'Ana Sayfa' },
                { key: 'manifesto',     label: 'Hedefler' },
                { key: 'kimlik',        label: 'Öz Geçmiş' },
                { key: 'gelisim',       label: 'Gelişimsel Büyüme' },
                { key: 'onam-formlari', label: 'Bilgilendirme & Onam' },
              ] as { key: TerapistSection; label: string }[]).map(item => (
                <button
                  key={item.key}
                  type="button"
                  className={`tp-hero-nav-item${activeSection === item.key ? ' active' : ''}`}
                  onClick={() => setActiveSection(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Sol sütun — başlık bloğu */}
            <div className="tp-ab-left">
              <h1 className="tp-ben-head">
                <span className="tp-thin">Senin Alanın,</span>
                <br />
                <span className="tp-med">Senin Gelişim<br />Sürecin</span>
              </h1>
              <p className="tp-ab-bio">
                Kişiye özel, kanıta dayalı bir terapötik süreç. İlerlemeni izle, hedeflerini belirle ve gerçek değişimi adım adım deneyimle.
              </p>
            </div>

            {/* Sağ: Asimetrik bento grid (3 sütun, grid-template-areas) */}
            <div className="tp-ben">

              {/* Card 1: İyilik hali — üst, 2 sütun geniş */}
              <article className="tp-ben-card tp-c-iyilik">
                <div className="tp-iy-headrow">
                  <h3 className="tp-ben-big">iyilik hali</h3>
                  <div className="tp-iy-meta">
                    <span className="tp-ben-badge tp-glass-dark">bu hafta</span>
                    <span className="tp-iy-avg">
                      {weekAvg.toFixed(1)}<small>/10</small>
                    </span>
                  </div>
                </div>
                <div className="tp-iy-bg">
                  <svg viewBox="0 0 600 160" preserveAspectRatio="none" aria-hidden>
                    <defs>
                      <linearGradient id="tp-iyColor" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stopColor="#FFC74C" />
                        <stop offset="42%"  stopColor="#FF8A3C" />
                        <stop offset="100%" stopColor="#FF5E9C" />
                      </linearGradient>
                      <linearGradient id="tp-iyMaskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#fff" stopOpacity="0.10" />
                        <stop offset="55%"  stopColor="#fff" stopOpacity="0.50" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0.95" />
                      </linearGradient>
                      <mask id="tp-iyMask">
                        <rect x="0" y="0" width="600" height="160" fill="url(#tp-iyMaskGrad)" />
                      </mask>
                    </defs>
                    {/* Alan dolgusu */}
                    <path d={chartFill} fill="url(#tp-iyColor)" mask="url(#tp-iyMask)" />
                    {/* Stem çizgileri */}
                    <g stroke="rgba(255,255,255,0.30)" strokeWidth="1">
                      {chartPts.map((p, i) => (
                        <line key={i} x1={p.x} y1={152} x2={p.x} y2={p.y} />
                      ))}
                    </g>
                    {/* Polyline */}
                    <polyline points={chartPolyline}
                      fill="none" stroke="#fff"
                      strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    {/* Noktalar */}
                    <g fill="#fff">
                      {chartPts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r={i === chartPts.length - 1 ? 3.6 : 3} />
                      ))}
                    </g>
                  </svg>
                  {/* Skor sayıları — div.iy-scores, absolute span'lar */}
                  <div className="tp-iy-scores">
                    {chartPts.map((p, i) => (
                      <span key={i} style={{
                        left: `${(p.x / 600 * 100).toFixed(1)}%`,
                        top:  `${(p.y / 160 * 100).toFixed(1)}%`,
                      }}>
                        {p.score % 1 === 0 ? String(p.score) : p.score.toFixed(1)}
                      </span>
                    ))}
                  </div>
                  {/* Gün etiketleri — iy-bg içinde, mutlak alt */}
                  <div className="tp-iy-days">
                    {chartPts.map(p => (
                      <span key={p.day}>{p.day}</span>
                    ))}
                  </div>
                </div>
                {/* iy-foot: nav butonları sağ-alt */}
                <div className="tp-iy-foot">
                  <div className="tp-ben-navs">
                    <button type="button" aria-label="Önceki hafta">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M11 6l-6 6 6 6" />
                      </svg>
                    </button>
                    <button type="button" aria-label="Sonraki hafta">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </article>

              {/* Card 2: Gelişim Raporu — GAUGE (görev listesi değil) */}
              <article className="tp-ben-card tp-c-rapor">
                <div className="tp-rapor-head">
                  <span className="tp-rapor-head-title">gelişim raporu</span>
                  <span className="tp-rapor-head-delta">+{Math.max(0, growthPct - 65)}% ↗</span>
                </div>
                <div className="tp-gauge-wrap">
                  <svg className="tp-gauge-svg" viewBox="0 0 200 116" aria-hidden>
                    {gaugeLines.map((l, i) => (
                      <line key={i}
                        x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                        stroke={l.stroke} strokeWidth="6" strokeLinecap="round" />
                    ))}
                  </svg>
                  <div className="tp-gauge-center">
                    <span className="tp-gauge-score">{growth.completedHours}</span>
                    <span className="tp-gauge-unit">puan</span>
                  </div>
                </div>
                <div className="tp-rapor-pill">
                  <span className="tp-rapor-pill-dot" />
                  Hedeflerinin %{growthPct}'ini tamamladın
                </div>
              </article>

              {/* Card 4: Onam Formları — katmanlı pastel yığın (c-terapist) */}
              <article className="tp-ben-card tp-c-terapist">
                <span className="tp-onam-back tp-onam-back-2" />
                <span className="tp-onam-back tp-onam-back-1" />
                <div className="tp-onam-front">
                  <div className="tp-onam-top">
                    <span className="tp-onam-kicker">ONAM FORMLARI</span>
                    <span className="tp-onam-count">4 belge</span>
                  </div>
                  <ul className="tp-onam-list">
                    <li>Aydınlatma Metni <span>KVKK m.10</span></li>
                    <li>Açık Rıza Beyanı <span>KVKK m.6/3</span></li>
                    <li>Hizmet Sözleşmesi <span>Çerçeve</span></li>
                    <li>Ses / Görüntü Onamı <span>Kayıt izni</span></li>
                  </ul>
                </div>
              </article>

              {/* Card 3: Profil fotoğrafı — gerçek fotoğraf, gear ile upload */}
              <article className="tp-ben-card tp-c-profil">
                <button
                  type="button"
                  className="tp-profil-settings"
                  onClick={() => photoInputRef.current?.click()}
                  aria-label="Profil fotoğrafını değiştir"
                  title="Fotoğrafı değiştir"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profil fotoğrafı" className="tp-profil-photo" />
                ) : (
                  <div className="tp-profil-placeholder">
                    <span>{hero.name[0]}{hero.lastName?.[0] ?? ''}</span>
                  </div>
                )}
                <div className="tp-ben-foot">
                  <span>{hero.name} {hero.lastName}</span>
                  <span className="tp-ben-foot-sub">Tekirdağ</span>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="tp-profil-file-input"
                  onChange={handlePhotoChange}
                />
              </article>

              {/* Card 5: İçgörü / Notlar — görsel + tek floating badge */}
              <article className="tp-ben-card tp-c-aylik">
                <span className="tp-ben-badge tp-badge-floating">içgörü / notlar</span>
              </article>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            ESKİ BÖLÜMLER — veri ve düzenleme alanı korunuyor
        ══════════════════════════════════════════════════════════ */}
        <div className="tp-legacy-wrap">

        {/* 01 · KİMLİK ÖZETİ */}
        <section className="tp-section tp-kimlik-section" data-section="kimlik">
          <span className="tp-eyebrow">01 · kimlik özeti</span>

          {/* Eğitim & Kariyer — CV modal açan kart */}
          <div className="tp-cv-accordion">
            <button
              type="button"
              className="tp-cv-accordion-trigger"
              onClick={() => setCvModalOpen(true)}
            >
              <div className="tp-cv-accordion-left">
                <span className="tp-cv-accordion-icon">📋</span>
                <div>
                  <span className="tp-cv-accordion-title">Eğitim & Kariyer Geçmişi</span>
                  <span className="tp-cv-accordion-sub">{cvTotalCount} kayıt · {cvGroups.length} kategori</span>
                </div>
              </div>
              <ArrowRight size={15} strokeWidth={1.8} className="tp-cv-accordion-chevron" />
            </button>
          </div>
        </section>

        {/* 00 · GÜNLÜK DUYGUDURUM */}
        {moodHistory.length > 0 && (
          <section className="tp-section tp-mood-section" data-section="duygudurum">
            <MoodChart entries={moodHistory} />
          </section>
        )}

        {/* 02 · AYLIK HEDEFLER */}
        <section className="tp-section tp-goals-section" data-section="manifesto">
          <div className="tp-goals-header">
            <div>
              <span className="tp-eyebrow">02 · aylık hedefler</span>
              <span className="tp-goals-month">{goals.month}</span>
            </div>
            <div className="tp-goals-header-actions">
              <button
                type="button"
                className="tp-btn ghost tp-feedback-btn"
                onClick={() => setFbOpen(true)}
              >
                <Users size={13} strokeWidth={1.8} />
                Gelişimimi değerlendirmesini iste
              </button>
              <button type="button" className="tp-btn primary" onClick={props.onToggleEdit}>
                <Edit3 size={14} /> {props.isEditing ? 'Bitir' : 'Düzenle'}
              </button>
            </div>
          </div>

          {/* Misyon & Vizyon */}
          <div className="tp-mv-row">
            <div className="tp-mv-card tp-mv-card--mission">
              <span className="tp-eyebrow">misyon · bu ay</span>
              <p className="tp-mv-text"><em>{goals.mission}</em></p>
            </div>
            <div className="tp-mv-card tp-mv-card--vision">
              <span className="tp-eyebrow">vizyon · uzak hedef</span>
              <p className="tp-mv-text">{goals.vision}</p>
            </div>
          </div>

          {/* Hedef listeleri */}
          <div className="tp-goals-lists">
            {/* Kısa vadeli */}
            <div className="tp-goals-col">
              <h3 className="tp-goals-col-title">
                <span className="tp-goals-col-dot tp-goals-col-dot--short" />
                Kısa <em>vadeli</em>
              </h3>
              <ul className="tp-goal-list">
                {goals.shortTerm.map((g, i) => (
                  <li key={i} className={`tp-goal-item ${g.done ? 'tp-goal-item--done' : ''}`}>
                    <span className="tp-goal-check" aria-hidden>
                      {g.done ? '✓' : '○'}
                    </span>
                    <span className="tp-goal-label">{g.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Uzun vadeli */}
            <div className="tp-goals-col">
              <h3 className="tp-goals-col-title">
                <span className="tp-goals-col-dot tp-goals-col-dot--long" />
                Uzun <em>vadeli</em>
              </h3>
              <ul className="tp-goal-list">
                {goals.longTerm.map((g, i) => (
                  <li key={i} className="tp-goal-item tp-goal-item--progress">
                    <div className="tp-goal-label-row">
                      <span className="tp-goal-label">{g.label}</span>
                      {props.onAddToCalendar && (
                        <button
                          type="button"
                          className="tp-cal-add-btn"
                          onClick={() => openCalModal(g.label)}
                          title="Takvime ekle"
                        >
                          <CalendarPlus size={12} strokeWidth={1.8} />
                        </button>
                      )}
                    </div>
                    <div className="tp-goal-bar-wrap">
                      <div className="tp-goal-bar">
                        <span
                          className="tp-goal-bar-fill"
                          style={{ width: `${g.progress ?? 0}%` }}
                        />
                      </div>
                      <span className="tp-goal-pct">{g.progress ?? 0}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 11 · YILIN ÖZETİ — gelişim · beceri · öz-bakım · yansıma */}
        <section className="tp-section tp-yilin-ozeti-section" data-section="gelisim">

          <div className="tp-gelisim-header">
            <div>
              <span className="tp-eyebrow">11 · yılın özeti</span>
              <h2 className="tp-gelisim-title">
                Gelişimsel <em>büyüme</em> & yıl içi yatırımlar
              </h2>
            </div>
          </div>

          {/* ── Blok A: Yıllık ilerleme + Beceri haritası ── */}
          <div className="tp-yo-top">

            {/* Yıllık ilerleme */}
            <div className="tp-yo-card tp-yo-card--growth">
              <span className="tp-yo-card-label">Bu yıl eğitim ilerlemesi</span>
              <div className="tp-gelisim-year">
                <div className="tp-gelisim-ring-col">
                  <YearRing pct={growthPct} />
                  <div className="tp-gelisim-ring-label">
                    <span className="tp-gelisim-hours">
                      <strong>{growth.completedHours}</strong>
                      <em>/{growth.yearGoalHours} saat</em>
                    </span>
                    <span className="tp-gelisim-headline">{growth.headline ?? 'Yıl tamamlanmasına yetişiyor.'}</span>
                  </div>
                </div>
                <div className="tp-gelisim-year-detail">
                  <p className="tp-gelisim-desc">{growth.description}</p>
                  <ul className="tp-gelisim-list">
                    {growth.recent.map((e, i) => (
                      <li key={i} className="tp-gelisim-list-item">
                        <strong>{e.title}</strong>
                        <span>{e.hours} sa · {e.date}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Geçmiş aylar özet kartı */}
              {completedMonths.length > 0 && (() => {
                const totalGoals = completedMonths.reduce((s, m) => s + m.completedGoals.length, 0);
                const totalInv   = completedMonths.reduce((s, m) => s + m.investments.length, 0);
                const latest     = completedMonths[0];
                return (
                  <button
                    type="button"
                    className="tp-archive-entry-card"
                    onClick={() => setArchiveOpen(true)}
                  >
                    <div className="tp-archive-entry-left">
                      <span className="tp-archive-entry-icon">📅</span>
                      <div>
                        <span className="tp-archive-entry-title">Geçmiş Aylar</span>
                        <span className="tp-archive-entry-sub">
                          {completedMonths.length} ay · {totalGoals} hedef · {totalInv} yatırım
                        </span>
                      </div>
                    </div>
                    <div className="tp-archive-entry-right">
                      {latest.score !== undefined && (
                        <span className="tp-archive-entry-score">{latest.score}<em>/10</em></span>
                      )}
                      <ArrowRight size={14} strokeWidth={1.8} className="tp-archive-entry-arrow" />
                    </div>
                  </button>
                );
              })()}
            </div>

            {/* Beceri haritası */}
            <div className="tp-yo-card tp-yo-card--skill">
              <span className="tp-yo-card-label">Beceri haritası</span>
              <div className="tp-flex-body" style={{ justifyContent: 'center' }}>
                <SkillRadar axes={skill.axes} />
                <div className="tp-flex-score">
                  <span className="big">{skill.score.toFixed(1).replace('.', ',')}</span>
                  <em>/10</em>
                </div>
              </div>
              <p className="tp-flex-desc" style={{ marginTop: 8 }}>{skill.headline}</p>
            </div>
          </div>

          {/* ── Blok B: Öz-bakım ── */}
          <div className="tp-yo-divider">
            <span className="tp-eyebrow">bu hafta · öz-bakım durumu</span>
          </div>
          <div className="tp-care">
            {ozBakim.map((c) => {
              const pct = Math.min(100, Math.round((c.actual / Math.max(1, c.target)) * 100));
              return (
                <article key={c.num} className={`tp-care-card status-${c.status}`}>
                  <span className="tp-eyebrow">{c.num} · <span className="cap">{c.label.toUpperCase()}</span></span>
                  <h3 className="tp-care-title">{c.headline}</h3>
                  <div className="tp-care-bar">
                    <span className="fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="tp-care-foot">
                    <span><strong>{c.actual}</strong> / {c.target} {c.unit}</span>
                    <span className={`tp-care-status ${c.status}`}>
                      {c.status === 'good' && '✓ iyi'}
                      {c.status === 'warn' && '! izle'}
                      {c.status === 'risk' && '× öncelik'}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>


          {/* ── Blok D: Yansıma ── */}
          <div className="tp-yo-divider">
            <span className="tp-eyebrow">kısa notlarım · içgörü</span>
          </div>
          <article className="tp-story" role="region" aria-label="Kısa Notlarım / İçgörü">
            <header className="tp-story-head">
              <span className="tp-eyebrow muted">kısa notlarım / içgörü</span>
              <span className="tp-story-status">{reflection.status}</span>
            </header>
            <p className="tp-story-quote">
              {reflection.pre}
              <em className="accent">{reflection.accentItalicPhrase}</em>
              {reflection.post}
            </p>
            <footer className="tp-story-meta">
              <span>{reflection.meta}</span>
              {reflection.metaTail && (
                <button type="button" className="tp-story-meta-tail">
                  {reflection.metaTail} <ChevronDown size={12} />
                </button>
              )}
            </footer>
          </article>

        </section>





        {/* 15 · ONAM FORMLARI */}
        {(() => {
          const FORMS = [
            { id: 'aydinlatma',        title: 'Aydınlatma Metni',              sub: 'KVKK m.10',            icon: '📄' },
            { id: 'acik-riza',         title: 'Açık Rıza Beyanı',              sub: 'KVKK m.6/3',           icon: '✍️' },
            { id: 'hizmet-sozlesmesi', title: 'Hizmet Sözleşmesi',             sub: 'Çerçeve sözleşme',     icon: '🤝' },
            { id: 'online',            title: 'Online Görüşme Protokolü',       sub: 'Ek protokol',          icon: '💻' },
            { id: 'kayit',             title: 'Ses/Görüntü Kaydı Onamı',       sub: 'Kayıt izni',           icon: '🎙️' },
            { id: 'cocuk',             title: 'Çocuk & Ergen Onam Formu',      sub: 'Vasi onayı',           icon: '👶' },
            { id: 'acil',              title: 'Acil Durum Protokolü',          sub: 'Kriz hatları',          icon: '🚨' },
            { id: 'sonlandirma',       title: 'Sonlandırma & Çekilme',         sub: 'Politika belgesi',      icon: '📋' },
          ];
          return (
            <section className="tp-section tp-onam-section" data-section="onam-formlari">
              <div className="tp-onam-header">
                <div>
                  <span className="tp-eyebrow">15 · onam formları</span>
                  <h2 className="tp-onam-title">Bilgilendirme <em>& Onam</em></h2>
                  <p className="tp-onam-subtitle">
                    Klinik çalışmada kullanılan standart form şablonları. Tıklayarak düzenle veya yazdır.
                  </p>
                </div>
              </div>
              <div className="tp-onam-grid">
                {FORMS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    className="tp-onam-card"
                    onClick={() => { openOnamForm(f.id); props.onOpenOnamForm?.(f.id); }}
                  >
                    <span className="tp-onam-icon" aria-hidden>{f.icon}</span>
                    <div className="tp-onam-info">
                      <span className="tp-onam-card-title">{f.title}</span>
                      <span className="tp-onam-card-sub">{f.sub}</span>
                    </div>
                    <ArrowRight size={14} strokeWidth={1.8} className="tp-onam-arrow" />
                  </button>
                ))}
              </div>
            </section>
          );
        })()}

        {/* 16 · MÜDAHALE KÜTÜPHANESİ */}
        <section className="tp-section tp-mudahale-section" data-section="mudahale">
          <button
            type="button"
            className="tp-mudahale-nav-card"
            onClick={props.onOpenMudahale}
          >
            <div className="tp-mudahale-trigger-left">
              <span className="tp-mudahale-trigger-icon">🗂️</span>
              <div className="tp-mudahale-trigger-text">
                <span className="tp-eyebrow">16 · müdahale kütüphanesi</span>
                <span className="tp-mudahale-trigger-title">Klinik <em>Araç Seti</em></span>
                <span className="tp-mudahale-trigger-sub">
                  Protokol, egzersiz ve psikoeğitim materyalleri — filtrele, favorile, seansa ekle.
                </span>
              </div>
            </div>
            <ArrowRight size={16} strokeWidth={1.8} className="tp-mudahale-nav-arrow" />
          </button>
        </section>

        {/* 17 · DANIŞAN DEĞERLENDİRMESİ */}
        <section className="tp-section tp-danfb-section" data-section="danisan-degerlendirme">
          <div className="tp-section-head">
            <span className="tp-eyebrow">17 · danışan değerlendirmesi</span>
            <h2 className="tp-section-title">Danışan <em>geri bildirimi</em></h2>
            <p className="tp-section-aside">
              Anonim değerlendirme formu gönderin. Memnuniyet, ilerleme ve yaklaşım skorlarını takip edin.
            </p>
          </div>

          {/* Özet istatistikler */}
          {(() => {
            const ratings = MOCK_DAN_RATINGS;
            const avgOverall = (ratings.reduce((a, r) => a + r.overall, 0) / ratings.length).toFixed(1);
            const avgProgress = (ratings.reduce((a, r) => a + r.progress, 0) / ratings.length).toFixed(1);
            const avgApproach = (ratings.reduce((a, r) => a + r.approach, 0) / ratings.length).toFixed(1);
            return (
              <>
                <div className="tp-danfb-stats">
                  <div className="tp-danfb-stat">
                    <span className="tp-danfb-stat-val">{avgOverall}</span>
                    <span className="tp-danfb-stat-label">Genel<br/>Memnuniyet</span>
                  </div>
                  <div className="tp-danfb-stat">
                    <span className="tp-danfb-stat-val">{avgProgress}</span>
                    <span className="tp-danfb-stat-label">İlerleme<br/>Hissi</span>
                  </div>
                  <div className="tp-danfb-stat">
                    <span className="tp-danfb-stat-val">{avgApproach}</span>
                    <span className="tp-danfb-stat-label">Terapist<br/>Yaklaşımı</span>
                  </div>
                  <div className="tp-danfb-stat tp-danfb-stat--count">
                    <span className="tp-danfb-stat-val">{ratings.length}</span>
                    <span className="tp-danfb-stat-label">Gelen<br/>Yorum</span>
                  </div>
                </div>

                {/* Son yorumlar */}
                <div className="tp-danfb-reviews">
                  {ratings.filter(r => r.comment).slice(0, 2).map(r => (
                    <div key={r.id} className="tp-danfb-review-card">
                      <div className="tp-danfb-review-head">
                        <span className="tp-danfb-review-patient">{r.patient}</span>
                        <div className="tp-danfb-stars">
                          {[1,2,3,4,5].map(n => (
                            <span key={n} className={`tp-danfb-star ${n <= r.overall ? 'filled' : ''}`}>★</span>
                          ))}
                        </div>
                        <span className="tp-danfb-review-date">{trGunAy(r.date)}</span>
                      </div>
                      {r.comment && <p className="tp-danfb-review-text">"{r.comment}"</p>}
                    </div>
                  ))}
                </div>
              </>
            );
          })()}

          {/* CTA */}
          <button
            type="button"
            className="tp-danfb-cta"
            onClick={() => setDanFbOpen(true)}
          >
            <span className="tp-danfb-cta-icon">📋</span>
            <div className="tp-danfb-cta-text">
              <span className="tp-danfb-cta-title">Yeni Değerlendirme İste</span>
              <span className="tp-danfb-cta-sub">Danışana anonim form linki gönder</span>
            </div>
            <ArrowRight size={15} strokeWidth={1.8} className="tp-danfb-cta-arrow" />
          </button>
        </section>

        {/* 18 · INSTAGRAM */}
        <section className="tp-section tp-ig-section" data-section="instagram">
          <div className="tp-section-head">
            <span className="tp-eyebrow">18 · instagram</span>
            <h2 className="tp-section-title">Sosyal <em>medya</em> profili</h2>
            <p className="tp-section-aside">
              Instagram hesabını bağla, başlıca içeriklerini profil sayfanda sergile.
            </p>
          </div>

          {!igHandle ? (
            /* ── Bağlantı kurulmamış ── */
            <div className="tp-ig-connect">
              <div className="tp-ig-connect-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <defs>
                    <linearGradient id="ig-grad" x1="0" y1="32" x2="32" y2="0">
                      <stop offset="0%" stopColor="#f9ce34"/>
                      <stop offset="30%" stopColor="#ee2a7b"/>
                      <stop offset="70%" stopColor="#6228d7"/>
                    </linearGradient>
                  </defs>
                  <rect width="32" height="32" rx="9" fill="url(#ig-grad)"/>
                  <rect x="9" y="9" width="14" height="14" rx="4" stroke="white" strokeWidth="1.8" fill="none"/>
                  <circle cx="16" cy="16" r="3.8" stroke="white" strokeWidth="1.8" fill="none"/>
                  <circle cx="21.2" cy="10.8" r="1.1" fill="white"/>
                </svg>
              </div>
              <h3 className="tp-ig-connect-title">Instagram hesabını bağla</h3>
              <p className="tp-ig-connect-desc">
                Kullanıcı adını gir, son paylaşımların ve içerik istatistiklerin burada görünsün.
              </p>
              <div className="tp-ig-connect-row">
                <span className="tp-ig-connect-at">@</span>
                <input
                  type="text"
                  className="tp-ig-connect-input"
                  placeholder="kullanici_adi"
                  value={igHandleInput}
                  onChange={e => setIgHandleInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && connectIg()}
                />
                <button type="button" className="tp-ig-connect-btn" onClick={connectIg}>
                  Bağla
                </button>
              </div>
            </div>
          ) : (
            /* ── Bağlı profil ── */
            <div className="tp-ig-connected">

              {/* Profil başlığı */}
              <div className="tp-ig-profile">
                <div className="tp-ig-avatar">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <defs>
                      <linearGradient id="ig-av" x1="0" y1="44" x2="44" y2="0">
                        <stop offset="0%" stopColor="#f9ce34"/>
                        <stop offset="50%" stopColor="#ee2a7b"/>
                        <stop offset="100%" stopColor="#6228d7"/>
                      </linearGradient>
                    </defs>
                    <circle cx="22" cy="22" r="21" fill="none" stroke="url(#ig-av)" strokeWidth="2"/>
                    <circle cx="22" cy="22" r="18" fill="rgba(194,82,42,0.08)"/>
                    <text x="22" y="27" textAnchor="middle" fontSize="14" fontWeight="600" fill="#C2522A" fontFamily="system-ui">
                      {igHandle[0].toUpperCase()}
                    </text>
                  </svg>
                </div>
                <div className="tp-ig-profile-info">
                  <div className="tp-ig-handle-row">
                    <span className="tp-ig-handle">@{igHandle}</span>
                    <button
                      type="button"
                      className="tp-ig-disconnect"
                      onClick={() => { setIgHandle(''); setIgHandleInput(''); }}
                    >
                      Bağlantıyı kes
                    </button>
                  </div>
                  <p className="tp-ig-bio">Psikolojik Danışman · BDT & ACT · Kaygı · OKB · Travma · {hero.title}</p>
                </div>
                <div className="tp-ig-stats">
                  <div className="tp-ig-stat">
                    <span className="tp-ig-stat-num">6</span>
                    <span className="tp-ig-stat-label">paylaşım</span>
                  </div>
                  <div className="tp-ig-stat">
                    <span className="tp-ig-stat-num">2.4B</span>
                    <span className="tp-ig-stat-label">takipçi</span>
                  </div>
                  <div className="tp-ig-stat">
                    <span className="tp-ig-stat-num">318</span>
                    <span className="tp-ig-stat-label">takip</span>
                  </div>
                </div>
              </div>

              {/* İçerik grid */}
              <div className="tp-ig-grid">
                {MOCK_IG_POSTS.map(post => (
                  <div key={post.id} className="tp-ig-post">
                    <div
                      className="tp-ig-post-thumb"
                      style={{ background: `linear-gradient(135deg, ${post.gradient[0]}, ${post.gradient[1]})` }}
                    >
                      {post.type === 'reel'     && <span className="tp-ig-post-badge tp-ig-post-badge--reel">▶ Reels</span>}
                      {post.type === 'carousel' && <span className="tp-ig-post-badge tp-ig-post-badge--carousel">⧉ Karusel</span>}
                    </div>
                    <div className="tp-ig-post-meta">
                      <p className="tp-ig-post-caption">{post.caption}</p>
                      <div className="tp-ig-post-counts">
                        <span>♥ {post.likes}</span>
                        <span>💬 {post.comments}</span>
                        <span className="tp-ig-post-date">{trGunAy(post.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Profili aç */}
              <a
                href={`https://instagram.com/${igHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tp-ig-open-btn"
              >
                <svg width="14" height="14" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
                  <defs><linearGradient id="ig-btn" x1="0" y1="32" x2="32" y2="0"><stop offset="0%" stopColor="#f9ce34"/><stop offset="50%" stopColor="#ee2a7b"/><stop offset="100%" stopColor="#6228d7"/></linearGradient></defs>
                  <rect width="32" height="32" rx="9" fill="url(#ig-btn)"/>
                  <rect x="9" y="9" width="14" height="14" rx="4" stroke="white" strokeWidth="1.8" fill="none"/>
                  <circle cx="16" cy="16" r="3.8" stroke="white" strokeWidth="1.8" fill="none"/>
                  <circle cx="21.2" cy="10.8" r="1.1" fill="white"/>
                </svg>
                instagram.com/{igHandle}
                <ArrowRight size={13} strokeWidth={1.8} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </a>
            </div>
          )}
        </section>
        </div>{/* /tp-legacy-wrap */}
      </main>

      {/* Dock kaldırıldı — navigasyon hero içindeki tp-hero-nav'a taşındı */}

      {/* ── Onam Form Modal ──────────────────────────────── */}
      {onamModalOpen && (
        <div className="tp-onam-overlay" onClick={() => setOnamModalOpen(false)}>
          <div className="tp-onam-modal" onClick={e => e.stopPropagation()}>
            <div className="tp-onam-modal-head">
              <span className="tp-eyebrow">onam formları</span>
              <button
                type="button"
                className="tp-cal-modal-close"
                onClick={() => setOnamModalOpen(false)}
                aria-label="Kapat"
              >
                <X size={14} />
              </button>
            </div>
            <div className="tp-onam-modal-body">
              <OnamMetinleri initialActive={activeOnamId} />
            </div>
          </div>
        </div>
      )}

      {/* ── Takvime Ekle Mini Modal ─────────────────────── */}
      {calModal.open && (
        <div className="tp-cal-overlay" onClick={() => setCalModal(m => ({ ...m, open: false }))}>
          <div className="tp-cal-modal" onClick={e => e.stopPropagation()}>
            <div className="tp-cal-modal-head">
              <span className="tp-eyebrow">takvime ekle</span>
              <button
                type="button"
                className="tp-cal-modal-close"
                onClick={() => setCalModal(m => ({ ...m, open: false }))}
              >
                <X size={14} />
              </button>
            </div>

            <p className="tp-cal-modal-title">{calModal.title}</p>

            <div className="tp-cal-modal-fields">
              <label className="tp-cal-field">
                <span>Tarih</span>
                <input
                  type="date"
                  value={calModal.date}
                  onChange={e => setCalModal(m => ({ ...m, date: e.target.value }))}
                  className="tp-cal-input"
                />
              </label>
              <label className="tp-cal-field">
                <span>Saat</span>
                <input
                  type="time"
                  value={calModal.time}
                  onChange={e => setCalModal(m => ({ ...m, time: e.target.value }))}
                  className="tp-cal-input"
                />
              </label>
              <label className="tp-cal-field">
                <span>Süre (dk)</span>
                <select
                  value={calModal.durationMin}
                  onChange={e => setCalModal(m => ({ ...m, durationMin: Number(e.target.value) }))}
                  className="tp-cal-input"
                >
                  {[30, 60, 90, 120, 180, 240].map(d => (
                    <option key={d} value={d}>{d} dk</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="tp-cal-modal-actions">
              <button
                type="button"
                className="tp-btn ghost"
                onClick={() => setCalModal(m => ({ ...m, open: false }))}
              >
                İptal
              </button>
              <button
                type="button"
                className="tp-btn primary"
                onClick={confirmCalModal}
                disabled={!calModal.date}
              >
                <Check size={13} /> Takvime Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Gelişim Değerlendirme Modalı ─────────────────── */}
      {fbOpen && createPortal(
        <div className="tp-fb-overlay" onClick={closeFbModal}>
          <div className="tp-fb-modal" onClick={e => e.stopPropagation()}>

            {/* Modal başlık */}
            <div className="tp-fb-modal-head">
              <div className="tp-fb-modal-headleft">
                <Users size={16} strokeWidth={1.8} className="tp-fb-head-icon" />
                <div>
                  <span className="tp-eyebrow">gelişim değerlendirmesi</span>
                  <h3 className="tp-fb-modal-title">Meslektaşlardan Geri Bildirim</h3>
                </div>
              </div>
              <button type="button" className="tp-cal-modal-close" onClick={closeFbModal}>
                <X size={14} />
              </button>
            </div>

            {fbStep === 'setup' ? (
              /* ── Adım 1: Dönem seç & özet ── */
              <div className="tp-fb-body">
                <div className="tp-fb-section">
                  <span className="tp-fb-label">Değerlendirilecek dönem</span>
                  <div className="tp-fb-period-grid">
                    {([
                      { k: '1ay', l: 'Son 1 Ay' },
                      { k: '3ay', l: 'Son 3 Ay' },
                      { k: '6ay', l: 'Son 6 Ay' },
                      { k: 'ozel', l: 'Özel Aralık' },
                    ] as { k: FbPeriod; l: string }[]).map(opt => (
                      <button
                        key={opt.k}
                        type="button"
                        className={`tp-fb-period-btn ${fbPeriod === opt.k ? 'tp-fb-period-btn--on' : ''}`}
                        onClick={() => setFbPeriod(opt.k)}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Özet önizleme */}
                <div className="tp-fb-section">
                  <span className="tp-fb-label">Paylaşılacak özet</span>
                  <div className="tp-fb-summary">
                    <div className="tp-fb-summary-row">
                      <span className="tp-fb-summary-key">Dönem</span>
                      <span className="tp-fb-summary-val">
                        {fbPeriod === '1ay' ? 'Son 1 ay' : fbPeriod === '3ay' ? 'Son 3 ay' : fbPeriod === '6ay' ? 'Son 6 ay' : 'Özel aralık'}
                        {' '}· {goals.month}
                      </span>
                    </div>
                    <div className="tp-fb-summary-row">
                      <span className="tp-fb-summary-key">Tamamlanan hedefler</span>
                      <span className="tp-fb-summary-val">
                        {goals.shortTerm.filter(g => g.done).length} / {goals.shortTerm.length}
                      </span>
                    </div>
                    <div className="tp-fb-summary-row">
                      <span className="tp-fb-summary-key">Misyon</span>
                      <span className="tp-fb-summary-val tp-fb-summary-val--italic">{goals.mission}</span>
                    </div>
                    <div className="tp-fb-summary-row">
                      <span className="tp-fb-summary-key">Geçmiş ay sayısı</span>
                      <span className="tp-fb-summary-val">{completedMonths.length} ay arşiv</span>
                    </div>
                  </div>
                  <p className="tp-fb-privacy-note">
                    Kişisel notlar ve danışan verileri paylaşılmaz. Yalnızca hedef özeti ve yatırım başlıkları görünür.
                  </p>
                </div>

                <div className="tp-fb-actions">
                  <button type="button" className="tp-btn ghost" onClick={closeFbModal}>İptal</button>
                  <button type="button" className="tp-btn primary" onClick={generateFbLink}>
                    <Link2 size={13} /> Değerlendirme Linki Oluştur
                  </button>
                </div>
              </div>
            ) : (
              /* ── Adım 2: Link + anket önizlemesi ── */
              <div className="tp-fb-body">
                {/* Link kutusu */}
                <div className="tp-fb-section">
                  <span className="tp-fb-label">Paylaşım linki hazır</span>
                  <div className="tp-fb-link-row">
                    <span className="tp-fb-link-text">{fbLink}</span>
                    <button type="button" className={`tp-fb-copy-btn ${fbCopied ? 'tp-fb-copy-btn--done' : ''}`} onClick={copyFbLink}>
                      {fbCopied ? <><Check size={12} /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
                    </button>
                  </div>
                  <div className="tp-fb-share-row">
                    <button type="button" className="tp-btn ghost" onClick={copyFbLink}>
                      <Send size={13} /> E-posta ile gönder
                    </button>
                    <button type="button" className="tp-btn ghost" onClick={() => setFbStep('setup')}>
                      ← Geri dön
                    </button>
                  </div>
                </div>

                {/* Anket önizlemesi */}
                <div className="tp-fb-section">
                  <span className="tp-fb-label">Alıcının göreceği anket formu</span>
                  <div className="tp-fb-survey-preview">
                    <div className="tp-fb-survey-head">
                      <span className="tp-fb-survey-badge">Önizleme</span>
                      <p className="tp-fb-survey-intro">
                        {hero.name} {hero.lastName} — {goals.month} dönemi gelişim değerlendirmesi
                      </p>
                    </div>

                    {/* Genel puan */}
                    <div className="tp-fb-survey-field">
                      <div className="tp-fb-survey-field-label">
                        <Star size={13} />
                        Genel gelişim değerlendirmesi
                      </div>
                      <div className="tp-fb-stars">
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <span key={n} className="tp-fb-star-num">{n}</span>
                        ))}
                        <span className="tp-fb-star-scale">1 = Çok yetersiz · 10 = Mükemmel</span>
                      </div>
                    </div>

                    {/* Hızlı işaretler */}
                    <div className="tp-fb-survey-field">
                      <div className="tp-fb-survey-field-label">
                        <Check size={13} />
                        Bu dönemde öne çıkan güçlü yönler (birden fazla seçilebilir)
                      </div>
                      <div className="tp-fb-check-grid">
                        {['Klinik yetkinlik', 'Öz-farkındalık', 'Süpervizyon katılımı',
                          'Yenilikçi yaklaşım', 'Sınır koyma', 'Öz-bakım', 'Teorik derinlik',
                          'Danışan ilişkisi'].map(item => (
                          <label key={item} className="tp-fb-check-item">
                            <input type="checkbox" disabled />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Metin alanları */}
                    <div className="tp-fb-survey-field">
                      <div className="tp-fb-survey-field-label">
                        <MessageSquare size={13} />
                        Yorumlar / Genel izlenim
                      </div>
                      <div className="tp-fb-textarea-preview" aria-label="Yorum alanı (önizleme)">
                        Bu döneme dair genel izlenimlerinizi paylaşın…
                      </div>
                    </div>

                    <div className="tp-fb-survey-field">
                      <div className="tp-fb-survey-field-label">
                        <AlertCircle size={13} />
                        Eleştiriler / Dikkat edilmesi gerekenler
                      </div>
                      <div className="tp-fb-textarea-preview" aria-label="Eleştiri alanı (önizleme)">
                        Geliştirilmesi önerilen alanlar, dikkat çeken örüntüler…
                      </div>
                    </div>

                    <div className="tp-fb-survey-field">
                      <div className="tp-fb-survey-field-label">
                        <Lightbulb size={13} />
                        Öneriler / Sonraki adımlar
                      </div>
                      <div className="tp-fb-textarea-preview" aria-label="Öneri alanı (önizleme)">
                        Önereceğiniz kaynaklar, eğitimler veya pratik adımlar…
                      </div>
                    </div>

                    <div className="tp-fb-survey-footer">
                      Yanıtlar anonim olarak iletilir.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── Danışan Değerlendirme Modalı ─────────────────── */}
      {danFbOpen && createPortal(
        <div className="tp-danfb-overlay" onClick={closeDanFbModal}>
          <div className="tp-danfb-modal" onClick={e => e.stopPropagation()}>

            {/* Başlık */}
            <div className="tp-danfb-modal-head">
              <div className="tp-danfb-modal-headleft">
                <span className="tp-danfb-modal-icon">⭐</span>
                <div>
                  <span className="tp-eyebrow">danışan değerlendirmesi</span>
                  <h3 className="tp-danfb-modal-title">Değerlendirme Formu Gönder</h3>
                </div>
              </div>
              <button type="button" className="tp-cal-modal-close" onClick={closeDanFbModal}>
                <X size={14} />
              </button>
            </div>

            {danFbStep === 'setup' ? (
              <div className="tp-danfb-modal-body">

                {/* Danışan seçimi */}
                <div className="tp-danfb-field">
                  <span className="tp-danfb-field-label">Danışan (opsiyonel)</span>
                  <input
                    type="text"
                    className="tp-danfb-input"
                    placeholder="Ad veya baş harfler (ör: A.K.) — boş bırakırsanız anonim"
                    value={danFbPatient}
                    onChange={e => setDanFbPatient(e.target.value)}
                  />
                  <span className="tp-danfb-hint">Danışan adı forma yansımaz, sadece takibiniz için kaydedilir.</span>
                </div>

                {/* Soru seçimi */}
                <div className="tp-danfb-field">
                  <span className="tp-danfb-field-label">Formda yer alacak sorular</span>
                  <div className="tp-danfb-q-list">
                    {DAN_QUESTION_OPTIONS.map(q => (
                      <label key={q.id} className={`tp-danfb-q-item ${danFbQuestions.includes(q.id) ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={danFbQuestions.includes(q.id)}
                          onChange={() => toggleDanQ(q.id)}
                          className="tp-danfb-q-checkbox"
                        />
                        <span className="tp-danfb-q-name">{q.label}</span>
                        <span className="tp-danfb-q-desc">{q.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Form önizlemesi */}
                <div className="tp-danfb-preview">
                  <span className="tp-danfb-preview-label">Form önizlemesi</span>
                  <div className="tp-danfb-preview-card">
                    <p className="tp-danfb-preview-intro">
                      Terapistinizin gelişimine katkı sağlamak için bu anonim değerlendirme formunu doldurmanızı rica ederiz.
                    </p>
                    {danFbQuestions.includes('overall') && (
                      <div className="tp-danfb-preview-row">
                        <span>Genel memnuniyetiniz nedir?</span>
                        <div className="tp-danfb-preview-stars">{'★'.repeat(5)}</div>
                      </div>
                    )}
                    {danFbQuestions.includes('progress') && (
                      <div className="tp-danfb-preview-row">
                        <span>Kendinizde ne kadar ilerleme hissediyorsunuz?</span>
                        <div className="tp-danfb-preview-stars">{'★'.repeat(5)}</div>
                      </div>
                    )}
                    {danFbQuestions.includes('approach') && (
                      <div className="tp-danfb-preview-row">
                        <span>Terapistinizin yaklaşımını nasıl değerlendirirsiniz?</span>
                        <div className="tp-danfb-preview-stars">{'★'.repeat(5)}</div>
                      </div>
                    )}
                    {danFbQuestions.includes('safety') && (
                      <div className="tp-danfb-preview-row">
                        <span>Seans ortamında kendinizi ne kadar güvende hissediyorsunuz?</span>
                        <div className="tp-danfb-preview-stars">{'★'.repeat(5)}</div>
                      </div>
                    )}
                    {danFbQuestions.includes('comment') && (
                      <div className="tp-danfb-preview-row tp-danfb-preview-row--text">
                        <span>Eklemek istediğiniz görüş veya öneriler…</span>
                        <div className="tp-danfb-preview-textarea" />
                      </div>
                    )}
                    <p className="tp-danfb-preview-footer">Yanıtlarınız anonim tutulacaktır.</p>
                  </div>
                </div>

                <div className="tp-danfb-modal-actions">
                  <button type="button" className="tp-btn ghost" onClick={closeDanFbModal}>İptal</button>
                  <button
                    type="button"
                    className="tp-btn primary"
                    onClick={generateDanLink}
                    disabled={danFbQuestions.length === 0}
                  >
                    <Link2 size={13} /> Form Linki Oluştur
                  </button>
                </div>
              </div>
            ) : (
              <div className="tp-danfb-modal-body">
                <div className="tp-danfb-link-success">
                  <span className="tp-danfb-link-success-icon">✓</span>
                  <p>Form linki oluşturuldu. Danışanınızla paylaşabilirsiniz.</p>
                </div>

                <div className="tp-danfb-field">
                  <span className="tp-danfb-field-label">Paylaşım linki</span>
                  <div className="tp-danfb-link-row">
                    <span className="tp-danfb-link-text">{danFbLink}</span>
                    <button
                      type="button"
                      className={`tp-fb-copy-btn ${danFbCopied ? 'tp-fb-copy-btn--done' : ''}`}
                      onClick={copyDanLink}
                    >
                      {danFbCopied ? <><Check size={12} /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
                    </button>
                  </div>
                </div>

                <div className="tp-danfb-share-options">
                  <button type="button" className="tp-btn ghost" onClick={copyDanLink}>
                    <Send size={13} /> SMS / E-posta ile gönder
                  </button>
                  <button type="button" className="tp-btn ghost" onClick={() => setDanFbStep('setup')}>
                    ← Geri dön
                  </button>
                </div>

                <p className="tp-danfb-disclaimer">
                  Yanıtlar anonim iletilir. Kişisel veriler formda toplanmaz.
                </p>

                <div className="tp-danfb-modal-actions">
                  <button type="button" className="tp-btn primary" onClick={closeDanFbModal}>Tamam</button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── Geçmiş Aylar Modal ───────────────────────────────────────── */}
      {archiveOpen && createPortal(
        <div className="tp-archive-modal-overlay" onClick={() => setArchiveOpen(false)}>
          <div className="tp-archive-modal" onClick={e => e.stopPropagation()}>

            <div className="tp-archive-modal-head">
              <div className="tp-archive-modal-head-left">
                <span className="tp-archive-modal-icon">📅</span>
                <div>
                  <span className="tp-eyebrow">geçmiş aylar · ilerleme verisi</span>
                  <h3 className="tp-archive-modal-title">Tamamlanan Hedefler <em>&</em> Yatırımlar</h3>
                </div>
              </div>
              <button type="button" className="tp-cv-modal-close" onClick={() => setArchiveOpen(false)}>
                <X size={14} />
              </button>
            </div>

            {/* Özet şerit */}
            <div className="tp-cvi-stats" style={{ borderBottom: '1px solid var(--tp-line-2)' }}>
              {[
                { num: String(completedMonths.length), label: 'ay' },
                { num: String(completedMonths.reduce((s, m) => s + m.completedGoals.length, 0)), label: 'hedef tamamlandı' },
                { num: String(completedMonths.reduce((s, m) => s + m.investments.length, 0)), label: 'yatırım yapıldı' },
                { num: (completedMonths.reduce((s, m) => s + (m.score ?? 0), 0) / completedMonths.filter(m => m.score !== undefined).length).toFixed(1), label: 'ort. ay puanı' },
              ].map((s, i, arr) => (
                <>
                  <div key={s.label} className="tp-cvi-stat">
                    <span className="tp-cvi-stat-num">{s.num}</span>
                    <span className="tp-cvi-stat-label">{s.label}</span>
                  </div>
                  {i < arr.length - 1 && <div key={`d${i}`} className="tp-cvi-stat-divider" />}
                </>
              ))}
            </div>

            {/* Ay kartları */}
            <div className="tp-archive-modal-body">
              {completedMonths.map((cm, idx) => {
                const TAG_COLOR: Record<CompletedMonthTag, string> = {
                  'eğitim':      '#3B6EA5',
                  'klinik':      '#C2522A',
                  'öz-bakım':    '#2F7A4E',
                  'süpervizyon': '#6D4EA5',
                  'araştırma':   '#7A4A2F',
                };
                return (
                  <article key={idx} className="tp-archive-modal-card">
                    <header className="tp-archive-modal-card-head">
                      <div className="tp-archive-modal-card-month-row">
                        <span className="tp-archive-month">{cm.month}</span>
                        <div className="tp-archive-tags" style={{ marginTop: 0 }}>
                          {cm.tags.map(t => (
                            <span key={t} className="tp-archive-tag"
                              style={{ color: TAG_COLOR[t], borderColor: TAG_COLOR[t] + '40', background: TAG_COLOR[t] + '12' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      {cm.score !== undefined && (
                        <span className="tp-archive-score">{cm.score}<em>/10</em></span>
                      )}
                    </header>

                    <div className="tp-archive-modal-card-body">
                      {cm.completedGoals.length > 0 && (
                        <div className="tp-archive-block">
                          <span className="tp-archive-block-label">tamamlandı</span>
                          <ul className="tp-archive-list">
                            {cm.completedGoals.map((g, i) => (
                              <li key={i} className="tp-archive-list-item tp-archive-list-item--done">
                                <span aria-hidden>✓</span>{g}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {cm.investments.length > 0 && (
                        <div className="tp-archive-block">
                          <span className="tp-archive-block-label">yatırım</span>
                          <ul className="tp-archive-list">
                            {cm.investments.map((inv, i) => (
                              <li key={i} className="tp-archive-list-item tp-archive-list-item--invest">
                                <span aria-hidden>↑</span>
                                <span style={{ flex: 1 }}>{inv}</span>
                                {props.onAddToCalendar && (
                                  <button type="button" className="tp-cal-add-btn"
                                    onClick={() => openCalModal(inv)} title="Takvime ekle">
                                    <CalendarPlus size={10} strokeWidth={1.8} />
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {cm.solvedProblems.length > 0 && (
                        <div className="tp-archive-block">
                          <span className="tp-archive-block-label">çözüldü</span>
                          <ul className="tp-archive-list">
                            {cm.solvedProblems.map((s, i) => (
                              <li key={i} className="tp-archive-list-item tp-archive-list-item--solved">
                                <span aria-hidden>◆</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ── CV Modal — infographic ────────────────────────────────────── */}
      {cvModalOpen && createPortal(
        <div className="tp-cv-modal-overlay" onClick={() => setCvModalOpen(false)}>
          <div className="tp-cv-modal" onClick={e => e.stopPropagation()}>

            {/* Başlık */}
            <div className="tp-cv-modal-head">
              <div className="tp-cv-modal-head-left">
                <span className="tp-cv-modal-head-icon">📋</span>
                <div>
                  <span className="tp-eyebrow">eğitim & kariyer geçmişi</span>
                  <h3 className="tp-cv-modal-name">{hero.name} {hero.lastName}</h3>
                  <p className="tp-cv-modal-meta">{hero.title} · {hero.modalities.join(' · ')}</p>
                </div>
              </div>
              <button type="button" className="tp-cv-modal-close" onClick={() => setCvModalOpen(false)}>
                <X size={14} />
              </button>
            </div>

            {/* Stats bandı */}
            <div className="tp-cvi-stats">
              {[
                { num: `${hero.years}`, label: 'yıl pratik' },
                { num: `${(cvGrouped['BDT Eğitimleri']?.length ?? 0) + (cvGrouped['ACT Eğitimleri']?.length ?? 0)}`, label: 'terapi eğitimi' },
                { num: '5K+', label: 'bireysel görüşme' },
                { num: 'EABCT', label: 'akredite' },
              ].map((s, i, arr) => (
                <>
                  <div key={s.label} className="tp-cvi-stat">
                    <span className="tp-cvi-stat-num">{s.num}</span>
                    <span className="tp-cvi-stat-label">{s.label}</span>
                  </div>
                  {i < arr.length - 1 && <div key={`div-${i}`} className="tp-cvi-stat-divider" />}
                </>
              ))}
            </div>

            {/* Gövde */}
            <div className="tp-cvi-body">

              {/* Temel bloklar — 2 sütun */}
              <div className="tp-cvi-foundation">
                {/* Akademik */}
                <div className="tp-cvi-block" style={{ '--cvi-color': '#3B6EA5' } as React.CSSProperties}>
                  <div className="tp-cvi-block-head">
                    <span>🎓</span><span>Akademik Eğitim</span>
                  </div>
                  {(cvGrouped['Akademik Eğitim'] ?? []).map((item, i) => (
                    <div key={i} className="tp-cvi-block-row">
                      <span className="tp-cvi-block-year">{item.year}</span>
                      <div>
                        <span className="tp-cvi-block-title">{item.title}</span>
                        <span className="tp-cvi-block-inst">{item.institution}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Deneyim */}
                <div className="tp-cvi-block" style={{ '--cvi-color': '#C2522A' } as React.CSSProperties}>
                  <div className="tp-cvi-block-head">
                    <span>🏥</span><span>Mesleki Deneyim</span>
                  </div>
                  {(cvGrouped['Mesleki Deneyim'] ?? []).map((item, i) => (
                    <div key={i} className="tp-cvi-block-row">
                      <span className="tp-cvi-block-year">{item.year}</span>
                      <div>
                        <span className="tp-cvi-block-title">{item.title}</span>
                        <span className="tp-cvi-block-inst">{item.institution}</span>
                        {item.detail && <span className="tp-cvi-block-detail">{item.detail}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eğitim zaman çizelgesi */}
              <div className="tp-cvi-tl-section">
                <span className="tp-cvi-section-label">Eğitim Kronolojisi</span>
                <div className="tp-cvi-tl">
                  {[
                    ...(cvGrouped['BDT Eğitimleri'] ?? []),
                    ...(cvGrouped['ACT Eğitimleri'] ?? []),
                    ...(cvGrouped['Diğer Eğitimler'] ?? []),
                  ]
                    .sort((a, b) => (a.year.slice(0, 4) || '0').localeCompare(b.year.slice(0, 4) || '0'))
                    .map((item, idx, arr) => {
                      const meta = CV_GROUP_META[item.group ?? ''] ?? { color: '#666', icon: '📌' };
                      const nextMeta = CV_GROUP_META[arr[idx + 1]?.group ?? ''] ?? meta;
                      return (
                        <div key={idx} className="tp-cvi-tl-row">
                          <span className="tp-cvi-tl-year">{item.year}</span>
                          <div className="tp-cvi-tl-spine">
                            <span className="tp-cvi-tl-dot" style={{ background: meta.color }} />
                            {idx < arr.length - 1 && (
                              <span className="tp-cvi-tl-line" style={{ background: `linear-gradient(to bottom, ${meta.color}55, ${nextMeta.color}55)` }} />
                            )}
                          </div>
                          <div className="tp-cvi-tl-content">
                            <span className="tp-cvi-tl-group" style={{ color: meta.color }}>{item.group}</span>
                            <span className="tp-cvi-tl-title">{item.title}</span>
                            <span className="tp-cvi-tl-inst">{item.institution}</span>
                            {item.detail && <span className="tp-cvi-tl-detail">{item.detail}</span>}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Alt bant — Akreditasyon + Uzmanlıklar */}
              <div className="tp-cvi-bottom">
                {/* Akreditasyon rozeti */}
                {(cvGrouped['Akreditasyon'] ?? []).map((item, i) => (
                  <div key={i} className="tp-cvi-badge">
                    <span className="tp-cvi-badge-icon">🏅</span>
                    <div>
                      <span className="tp-cvi-badge-title">{item.title}</span>
                      <span className="tp-cvi-badge-inst">{item.institution}</span>
                      <span className="tp-cvi-badge-year">{item.year}</span>
                    </div>
                  </div>
                ))}

                {/* Uzmanlık pill'leri */}
                <div className="tp-cvi-specs">
                  <span className="tp-cvi-section-label">🎯 Uzmanlık Alanları</span>
                  <div className="tp-cvi-spec-pills">
                    {(cvGrouped['Uzmanlık Alanları'] ?? []).map((item, i) => (
                      <span key={i} className={`tp-cvi-spec-pill${item.highlight ? ' tp-cvi-spec-pill--hi' : ''}`}>
                        {item.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SkillRadar — hexagon SVG
// ──────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────
// MoodChart — günlük duygudurum zaman serisi
// ──────────────────────────────────────────────────────────────────────────

function MoodChart({ entries }: { entries: MoodEntry[] }) {
  const W = 100, H = 60, PAD = { t: 8, r: 4, b: 20, l: 24 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const n = entries.length;
  if (n === 0) return null;

  const minScore = Math.min(...entries.map(e => e.score));
  const maxScore = Math.max(...entries.map(e => e.score));
  const range = Math.max(maxScore - minScore, 2);

  const xOf = (i: number) => Math.round((PAD.l + (i / (n - 1)) * innerW) * 100) / 100;
  const yOf = (s: number) => Math.round((PAD.t + innerH - ((s - minScore) / range) * innerH) * 100) / 100;

  const polyline = entries.map((e, i) => `${xOf(i).toFixed(1)},${yOf(e.score).toFixed(1)}`).join(' ');
  const areaPath = [
    `M ${xOf(0).toFixed(1)},${(PAD.t + innerH).toFixed(1)}`,
    ...entries.map((e, i) => `L ${xOf(i).toFixed(1)},${yOf(e.score).toFixed(1)}`),
    `L ${xOf(n - 1).toFixed(1)},${(PAD.t + innerH).toFixed(1)}`,
    'Z',
  ].join(' ');

  const avg = Math.round(entries.reduce((s, e) => s + e.score, 0) / n * 10) / 10;
  const last = entries[entries.length - 1];
  const trend = n > 1 ? last.score - entries[entries.length - 2].score : 0;

  // Ay kısaltması (deterministik → hydration uyumlu)
  const fmtDate = (d: string) => trGunAy(d);

  return (
    <div className="tp-mood-wrap">
      <div className="tp-mood-meta">
        <div className="tp-mood-heading">
          <span className="tp-eyebrow">kendi iyilik haline ne kadar önem veriyorsun?</span>
          <h3 className="tp-mood-title">
            Son <em>{n} kayıt</em>
          </h3>
        </div>
        <div className="tp-mood-stats">
          <div className="tp-mood-stat">
            <span className="tp-mood-stat-val">{avg.toFixed(1).replace('.', ',')}</span>
            <span className="tp-mood-stat-label">ortalama</span>
          </div>
          <div className="tp-mood-stat">
            <span className={`tp-mood-stat-val ${trend > 0 ? 'pos' : trend < 0 ? 'neg' : ''}`}>
              {trend > 0 ? `+${trend}` : trend === 0 ? '—' : trend}
            </span>
            <span className="tp-mood-stat-label">son değişim</span>
          </div>
          <div className="tp-mood-stat">
            <span className="tp-mood-stat-val">{last.score}</span>
            <span className="tp-mood-stat-label">bugün</span>
          </div>
        </div>
      </div>

      <div className="tp-mood-chart-wrap">
        {/* Y ekseni işaretleri */}
        <div className="tp-mood-y-axis">
          {[10, 7, 4, 1].map(v => (
            <span key={v} className="tp-mood-y-tick">{v}</span>
          ))}
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="tp-mood-svg"
          preserveAspectRatio="none"
          aria-label="Duygudurum grafiği"
        >
          <defs>
            <linearGradient id="tp-mood-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#C2522A" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#C2522A" stopOpacity="0.01" />
            </linearGradient>
            {/* Yatay kılavuz çizgileri */}
          </defs>
          {/* Alan dolgusu */}
          <path d={areaPath} fill="url(#tp-mood-grad)" />
          {/* Çizgi */}
          <polyline
            points={polyline}
            fill="none"
            stroke="#C2522A"
            strokeWidth="0.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Nokta + tooltip */}
          {entries.map((e, i) => (
            <g key={i}>
              <circle
                cx={xOf(i)}
                cy={yOf(e.score)}
                r={i === n - 1 ? 1.4 : 0.9}
                fill={i === n - 1 ? '#C2522A' : '#C2522A'}
                opacity={i === n - 1 ? 1 : 0.6}
              />
              {/* Tarih etiketi — 3'te birinde */}
              {(i === 0 || i === n - 1 || i % Math.ceil(n / 4) === 0) && (
                <text
                  x={xOf(i)}
                  y={H - 4}
                  textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                  fontSize="3.5"
                  fill="#7B7C82"
                  fontFamily="monospace"
                >
                  {fmtDate(e.date)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Son notlar bandı */}
      {entries.some(e => e.note) && (
        <div className="tp-mood-notes">
          {entries.filter(e => e.note).slice(-3).map((e, i) => (
            <span key={i} className="tp-mood-note">
              <span className="tp-mood-note-date">{fmtDate(e.date)}</span>
              <span className="tp-mood-note-score">{e.score}</span>
              <span className="tp-mood-note-text">{e.note}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillRadar({ axes }: { axes: SkillAxis[] }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;
  const n = Math.max(3, axes.length);

  const r2 = (v: number) => Math.round(v * 100) / 100; // SSR/client serileşme uyumu
  const pointAt = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (value / 10) * r;
    return [r2(cx + rr * Math.cos(angle)), r2(cy + rr * Math.sin(angle))] as const;
  };
  const labelAt = (i: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const lr = r + 18;
    return [r2(cx + lr * Math.cos(angle)), r2(cy + lr * Math.sin(angle))] as const;
  };
  const polyAt = (level: number) =>
    Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return `${cx + level * r * Math.cos(angle)},${cy + level * r * Math.sin(angle)}`;
    }).join(' ');
  const dataPoly = axes.map((a, i) => pointAt(i, a.value).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="tp-radar" aria-hidden>
      {[0.25, 0.5, 0.75, 1.0].map((lv, i) => (
        <polygon key={i} points={polyAt(lv)} fill="none" stroke="rgba(14,15,18,0.08)" strokeWidth={1} />
      ))}
      <polygon points={dataPoly} fill="rgba(194,82,42,0.18)" stroke="#C2522A" strokeWidth={1.5} />
      {axes.map((a, i) => {
        const [px, py] = pointAt(i, a.value);
        return <circle key={i} cx={px} cy={py} r={3.5} fill="#C2522A" />;
      })}
      {axes.map((a, i) => {
        const [lx, ly] = labelAt(i);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="tp-radar-label">
            {a.name.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// YearRing — dairesel progress (CE saatleri)
// ──────────────────────────────────────────────────────────────────────────

function YearRing({ pct }: { pct: number }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;
  const C = 2 * Math.PI * r;
  const offset = C - (pct / 100) * C;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="tp-ring" aria-hidden>
      <defs>
        <linearGradient id="tp-ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C2522A" />
          <stop offset="100%" stopColor="#E8A87C" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(14,15,18,0.08)" strokeWidth={10} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="url(#tp-ring-grad)"
        strokeWidth={10}
        strokeDasharray={C}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="tp-ring-pct">
        {pct}%
      </text>
    </svg>
  );
}
