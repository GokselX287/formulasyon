'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Sparkles, ChevronDown, ChevronUp, MoreVertical, X, Plus,
} from 'lucide-react';
import BenlikAlgisiPanel, { type BenlikAlgisiData } from './BenlikAlgisiPanel';
import './BenlikAlgisiPanel.css';

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

export type ProfilSection =
  | 'profil' | 'sorun' | 'bariyerler' | 'esneklik' | 'degerler'
  | 'gucluler' | 'hikaye' | 'mudahaleler' | 'iliski' | 'formulasyon';

// ── Kitle anahtarı — component-yerel, lib/types.ts'e dokunmaz ─────────────
type Kitle = 'terapist' | 'danisan';
type SharePolicy = 'paylasilir' | 'sade' | 'kismi' | 'gizli';

const SECTION_POLICY: Record<string, SharePolicy> = {
  hikaye:      'gizli',
  sorun:       'sade',
  bariyerler:  'kismi',
  esneklik:    'sade',
  iliski:      'kismi',
  formulasyon: 'paylasilir',
};

const SADE_DIL: Record<string, string> = {
  'Defüzyon':       'Düşüncelerden ayrışma',
  'Kabul':          'Duyguya alan açma',
  'Şimdiki an':     'Ana dönme',
  'Bağlam-benlik':  'Gözlemleyen benlik',
  'Değerler':       'Senin için önemli olan',
  'Eylem':          'Değerlere göre adım',
};

const sade = (kitle: Kitle, t: string): string =>
  kitle === 'danisan' ? (SADE_DIL[t] ?? t) : t;

export type SectionStatus = 'tamam' | 'aktif' | 'taslak' | 'yeni' | 'count';

export type ProfilSidebarItem = {
  num: string;             // "01", "02"
  key: ProfilSection;
  label: string;
  status?: SectionStatus;
  count?: number;
};

export type ClientHero = {
  vakaNo: string;          // "#142"
  sessionCount: number;
  firstName: string;
  lastName: string;
  age?: number;
  gender?: string;
  occupation?: string;
  tags: { label: string; accent?: boolean }[];
  nextSessionLabel?: string; // "Bugün, 10:00"
};

export type HeroQuote = {
  preQuote?: string;           // "Olumsuz değerlendirilirsem"
  accentPhrase: string;        // "kaybolurum"
  postQuote: string;           // "— temel inanç."
  description: string;
  primaryCta?: { label: string; onClick(): void };
  secondaryCta?: { label: string; onClick(): void };
};

export type FourPItem = {
  key: 'predispozan' | 'presipitan' | 'perpetuan' | 'protektif';
  num: string;
  label: string;
  body: string;
  chips?: string[];
  accent?: boolean;
  good?: boolean;
};

export type StrengthWeaknessItem = {
  label: string;
  detail?: string;
};

export type StrengthsWeaknesses = {
  strengths: StrengthWeaknessItem[];   // koruyucu / güçlü
  weaknesses: StrengthWeaknessItem[];  // risk / zayıf
};

export type HexaflexAxis = { name: string; value: number };  // 0-10

export type FlexSession = {
  seansNo: number;       // 1, 2, 3…
  date: string;          // "2025.11.04"
  score: number;         // 0-10 ortalama
  axes: HexaflexAxis[];
  note?: string;         // terapist notu
};

export type FlexibilityCard = {
  headline: string;
  score: number;
  description: string;
  axes: HexaflexAxis[];
  sessions?: FlexSession[];   // tüm seans geçmişi
};

export type ValueChip = {
  label: string;
  score: number;          // 1-10
  lead?: boolean;         // pasif/aktif
};

export type ValuesCard = {
  headline: string;
  values: ValueChip[];
  nextStep: string;
};

export type SessionHistoryItem = {
  romanNum: string;        // "I", "II", "III"
  title: string;
  date: string;            // "2025.11.04"
  suds: number;            // 0-10 accent
  mood: number;            // 0-10 green
  upcoming?: boolean;
};

export type SessionRecord = {
  seansNo: number;
  date: string;            // "2025.11.04"
  title: string;
  modality: string;        // "ACT · Maruziyet"
  durationMin: number;
  summary: string;         // o seansta ne yapıldı
  interventions?: string[]; // kullanılan teknikler
  homework?: string[];      // verilen ödevler
  suds?: number;           // 0-10
  mood?: number;           // 0-10
};

export type DarkStoryCard = {
  status: string;          // "taslak · 4 dk önce"
  preQuote: string;
  accentItalicPhrase: string;
  postQuote: string;
  meta: string;            // "elif y. · 7. seans · 2026.05.17"
  metaTail?: string;       // "aktarılan içgörü"
};

export type InterventionRowItem = {
  romanNum: string;
  title: string;
  modality: string;
  durationMin: number;
  outcome?: 'yararli' | 'notr' | 'yararsiz';
};

export type QuickClient = {
  id: string;
  firstName: string;
  lastName: string;
  vakaNo: string;
  mainTag?: string;
  sessionCount?: number;
  status?: 'aktif' | 'beklemede' | 'tamamlandi';
};

// Section content union — UI driven by `data` prop
export type DanisanProfilPanelProps = {
  client: ClientHero;
  activeSection?: ProfilSection;
  onChangeSection?(s: ProfilSection): void;

  sidebar?: ProfilSidebarItem[];

  // Section payloads — verilmezse mock fallback
  heroQuote?: HeroQuote;
  fourP?: FourPItem[];
  strengthsWeaknesses?: StrengthsWeaknesses;
  flexibility?: FlexibilityCard;
  values?: ValuesCard;
  story?: DarkStoryCard;
  sessionHistory?: SessionHistoryItem[];
  sessionRecords?: SessionRecord[];
  preSessionNote?: { text: string; updatedAt?: string };
  interventions?: InterventionRowItem[];

  // Benlik & Algı Haritası
  benlikAlgisi?: Partial<BenlikAlgisiData>;
  onSaveBenlikAlgisi?(data: BenlikAlgisiData): Promise<void>;

  // Ölçek skorları
  scaleScores?: ScaleScore[];

  // ACT Formülasyon modal
  actFormulation?: ActFormulation;

  // Other patients quick-access (sidebar collapsed state)
  quickClients?: QuickClient[];
  onOpenClient?(id: string): void;

  // Navigation
  onBack?(): void;
  backLabel?: string;
  onOpenFormulationHub?(): void;
  onCreateBriefing?(): void;
  onOpenSection?(s: ProfilSection): void;
};

// ──────────────────────────────────────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_CLIENT: ClientHero = {
  vakaNo: '#142',
  sessionCount: 7,
  firstName: 'Elif',
  lastName: 'Yıldız',
  age: 28,
  gender: 'Kadın',
  occupation: 'Grafik tasarımcı',
  tags: [
    { label: 'Sosyal kaygı', accent: true },
    { label: 'ACT' },
    { label: 'Maruziyet' },
  ],
  nextSessionLabel: 'Bugün, 10:00',
};

const DEFAULT_SIDEBAR: ProfilSidebarItem[] = [
  { num: '01', key: 'profil',       label: 'Profil',          status: 'tamam' },
  { num: '02', key: 'sorun',        label: 'Sorun & Hedef',   status: 'tamam' },
  { num: '03', key: 'bariyerler',   label: 'Bariyerler',      status: 'count', count: 4 },
  { num: '04', key: 'esneklik',     label: 'Esneklik',        status: 'aktif' },
  { num: '05', key: 'degerler',     label: 'Değerler',        status: 'count', count: 6 },
  { num: '06', key: 'gucluler',     label: 'Güçlü yanlar',    status: 'count', count: 5 },
  { num: '07', key: 'hikaye',       label: 'Hikaye',          status: 'taslak' },
  { num: '08', key: 'mudahaleler',  label: 'Müdahaleler',     status: 'count', count: 3 },
  { num: '09', key: 'iliski',       label: 'İlişki' },
  { num: '10', key: 'formulasyon',  label: '4P Formülasyon',  status: 'yeni' },
];

const DEFAULT_QUICK_CLIENTS: QuickClient[] = [
  { id: 'qc1', firstName: 'Mehmet',  lastName: 'Kaya',   vakaNo: '#3',  mainTag: 'Depresyon',     sessionCount: 8,  status: 'aktif' },
  { id: 'qc2', firstName: 'Zeynep',  lastName: 'Arslan', vakaNo: '#7',  mainTag: 'OKB',           sessionCount: 5,  status: 'aktif' },
  { id: 'qc3', firstName: 'Murat',   lastName: 'Şahin',  vakaNo: '#12', mainTag: 'Travma',        sessionCount: 14, status: 'beklemede' },
  { id: 'qc4', firstName: 'Selin',   lastName: 'Yıldız', vakaNo: '#15', mainTag: 'Panik bozukluğu', sessionCount: 3, status: 'aktif' },
  { id: 'qc5', firstName: 'Can',     lastName: 'Demir',  vakaNo: '#19', mainTag: 'Sosyal kaygı',  sessionCount: 11, status: 'aktif' },
];

const DEFAULT_HERO: HeroQuote = {
  preQuote: '"Olumsuz değerlendirilirsem',
  accentPhrase: 'kaybolurum',
  postQuote: '" — temel inanç.',
  description:
    'Elif\'in sosyal kaygı tablosunun arkasındaki örüntü, çocuklukta öğrenilen "her şeyi doğru yapmazsam sevilmem" varsayımına dayanıyor. Maruziyet protokolü ikinci aşamada.',
  primaryCta: { label: 'Briefing oluştur', onClick: () => {} },
  secondaryCta: { label: 'Formülasyon hub\'ı', onClick: () => {} },
};

const DEFAULT_FOURP: FourPItem[] = [
  {
    key: 'predispozan',
    num: '01',
    label: 'Yatkınlaştırıcı',
    body: 'Eleştirel anne figürü; akademik mükemmeliyetçilik; çocuklukta sosyal dışlanma deneyimi (orta okul, 12 yaş).',
    chips: ['aile öyküsü', 'gelişimsel'],
  },
  {
    key: 'presipitan',
    num: '02',
    label: 'Tetikleyici',
    body: '9 ay önce iş yerinde yapılan ekip sunumunda donma yaşaması; sonrasında benzer ortamlardan kaçınma başladı.',
    chips: ['kritik olay'],
    accent: true,
  },
  {
    key: 'perpetuan',
    num: '03',
    label: 'Sürdürücü',
    body: 'Kaçınma davranışı kısa vadeli rahatlama sağlıyor; güvenlik davranışları (toplantıda susma, kamerayı kapatma) inancı pekiştiriyor.',
    chips: ['kaçınma', 'güvenlik dvr.'],
  },
  {
    key: 'protektif',
    num: '04',
    label: 'Koruyucu',
    body: 'İki yakın arkadaş; düzenli egzersiz; mizah; yaratıcı işine olan bağlılık. Terapi motivasyonu yüksek.',
    chips: ['kaynak'],
    good: true,
  },
];

const DEFAULT_SW: StrengthsWeaknesses = {
  strengths: [
    { label: 'Terapi motivasyonu', detail: 'Seanslara düzenli katılım, ödev uyumu yüksek' },
    { label: 'Aile desteği', detail: 'Ebeveynlerle sağlıklı iletişim, sosyal ağ mevcut' },
    { label: 'Hayattan keyif alma çabası', detail: 'Müzik, doğa yürüyüşü gibi aktivitelere ilgi' },
    { label: 'Koruyucu davranışlar', detail: 'Stres altında fiziksel egzersize yönelme' },
    { label: 'İçgörü kapasitesi', detail: 'Duygularını tanımlayabilme, yansıtma becerisi' },
  ],
  weaknesses: [
    { label: 'Kaçınma örüntüsü', detail: 'Zorlu duygulardan uzaklaşmak için sosyal geri çekilme' },
    { label: 'Aşırı öz-eleştiri', detail: 'Başarısızlığa karşı yüksek cezalandırıcılık' },
    { label: 'Uyku düzensizliği', detail: 'Endişe döngüsünü besleyen kronik uyku bozukluğu' },
    { label: 'İlişkisel çatışma', detail: 'Yakın ilişkilerde sınır koyma güçlüğü' },
    { label: 'Düşünce-duygu karışıklığı', detail: 'Bilişsel füzyon, duygudan gerçekmiş gibi hareket etme' },
  ],
};

const DEFAULT_FLEX: FlexibilityCard = {
  headline: 'Değerler güçlü, bağlam-benlik zayıf.',
  score: 6.0,
  description:
    'Geçen seansa göre defüzyon ve değerler boyutunda iyileşme var. Bağlam-benlik üzerine egzersiz önerilir.',
  axes: [
    { name: 'Defüzyon',     value: 6 },
    { name: 'Kabul',        value: 5 },
    { name: 'Şimdiki an',   value: 6 },
    { name: 'Bağlam-benlik',value: 4 },
    { name: 'Değerler',     value: 8 },
    { name: 'Eylem',        value: 6 },
  ],
  sessions: [
    { seansNo: 1, date: '2025.11.04', score: 3.2,
      axes: [{ name:'Defüzyon', value:3 },{ name:'Kabul', value:2 },{ name:'Şimdiki an', value:4 },{ name:'Bağlam-benlik', value:2 },{ name:'Değerler', value:5 },{ name:'Eylem', value:3 }],
      note: 'Başlangıç ölçümü. Bilişsel füzyon belirgin, kabul çok düşük.' },
    { seansNo: 2, date: '2025.11.18', score: 3.8,
      axes: [{ name:'Defüzyon', value:4 },{ name:'Kabul', value:3 },{ name:'Şimdiki an', value:4 },{ name:'Bağlam-benlik', value:2 },{ name:'Değerler', value:5 },{ name:'Eylem', value:4 }],
      note: 'Yaprak egzersizi uygulandı. Defüzyon hafif arttı.' },
    { seansNo: 3, date: '2025.12.02', score: 4.5,
      axes: [{ name:'Defüzyon', value:5 },{ name:'Kabul', value:4 },{ name:'Şimdiki an', value:5 },{ name:'Bağlam-benlik', value:3 },{ name:'Değerler', value:6 },{ name:'Eylem', value:4 }],
      note: 'Değer çalışması başladı. Şimdiki ana temas belirgin iyileşme.' },
    { seansNo: 4, date: '2025.12.16', score: 5.2,
      axes: [{ name:'Defüzyon', value:5 },{ name:'Kabul', value:5 },{ name:'Şimdiki an', value:5 },{ name:'Bağlam-benlik', value:4 },{ name:'Değerler', value:7 },{ name:'Eylem', value:5 }],
      note: 'Kabul çalışması güçlendi. Bağlam-benlik hâlâ zayıf, odak noktası.' },
    { seansNo: 5, date: '2026.01.06', score: 5.7,
      axes: [{ name:'Defüzyon', value:6 },{ name:'Kabul', value:5 },{ name:'Şimdiki an', value:6 },{ name:'Bağlam-benlik', value:4 },{ name:'Değerler', value:7 },{ name:'Eylem', value:6 }],
      note: 'Gözlemci benlik egzersizleri eklendi. Eylem boyutu arttı.' },
    { seansNo: 6, date: '2026.01.20', score: 5.5,
      axes: [{ name:'Defüzyon', value:6 },{ name:'Kabul', value:4 },{ name:'Şimdiki an', value:6 },{ name:'Bağlam-benlik', value:4 },{ name:'Değerler', value:7 },{ name:'Eylem', value:6 }],
      note: 'Zor bir hafta. Kabul geriledi, diğerleri korundu.' },
    { seansNo: 7, date: '2026.02.03', score: 6.0,
      axes: [{ name:'Defüzyon', value:6 },{ name:'Kabul', value:5 },{ name:'Şimdiki an', value:6 },{ name:'Bağlam-benlik', value:4 },{ name:'Değerler', value:8 },{ name:'Eylem', value:6 }],
      note: 'Değerler en yüksek seviyede. Bağlam-benlik gelişimi için metafor çalışması planlandı.' },
  ],
};

const DEFAULT_VALUES: ValuesCard = {
  headline: 'Pusulayı kim tutuyor?',
  values: [
    { label: 'Yaratıcılık', score: 9, lead: true },
    { label: 'Otantiklik',  score: 9, lead: true },
    { label: 'Yakınlık',    score: 8 },
    { label: 'Özen',        score: 7 },
    { label: 'Öğrenme',     score: 7 },
    { label: 'Mizah',       score: 6 },
  ],
  nextStep:
    'Yaratıcılık değerini sosyal maruziyetle ilişkilendiren bir eylem planı (haftada 1 sergi etkinliği, 2 ay).',
};

const DEFAULT_STORY: DarkStoryCard = {
  status: 'taslak · 4 dk önce',
  preQuote: '"Sanki içimde iki ses var: biri herkesin önünde olmak istiyor, diğeri saklanıyor.',
  accentItalicPhrase: ' Onları susturmaya çalıştıkça',
  postQuote:
    ' ikisi de büyüyor. Belki ikisini de duyabilirim ama sadece birinin yönüne yürüyebilirim — yaratıcılığın yönüne."',
  meta: 'elif y. · 7. seans · 2026.05.17',
  metaTail: 'aktarılan içgörü',
};

const DEFAULT_HISTORY: SessionHistoryItem[] = [
  { romanNum: 'I',   title: 'Anamnez',              date: '2025.11.04', suds: 9, mood: 3 },
  { romanNum: 'II',  title: 'Formülasyon paylaşımı',date: '2025.11.18', suds: 8, mood: 4 },
  { romanNum: 'III', title: 'Defüzyon egzersizi',   date: '2025.12.05', suds: 7, mood: 5 },
  { romanNum: 'IV',  title: 'Değerler matrisi',     date: '2026.01.10', suds: 6, mood: 6 },
  { romanNum: 'V',   title: 'Maruziyet rasyoneli',  date: '2026.02.15', suds: 7, mood: 6 },
  { romanNum: 'VI',  title: 'Maruziyet — sunum',    date: '2026.04.20', suds: 5, mood: 7 },
  { romanNum: 'VII', title: 'Bugün · 7. seans',     date: '2026.05.24', suds: 0, mood: 0, upcoming: true },
];

const DEFAULT_SESSION_RECORDS: SessionRecord[] = [
  {
    seansNo: 1, date: '2025.11.04', title: 'Anamnez & ilk değerlendirme', modality: 'ACT · Değerlendirme', durationMin: 50,
    summary: 'İlk görüşme. Sosyal kaygının çıkış öyküsü ve yaşam alanlarına etkisi alındı. Sunum/toplantılarda donma ana yakınma; kaçınma örüntüsü belirgin. Terapi hedefleri ve çalışma çerçevesi konuşuldu.',
    interventions: ['Yarı yapılandırılmış görüşme', 'SUDS taban ölçümü'],
    homework: ['Haftalık kaygı günlüğü tutmak'],
    suds: 9, mood: 3,
  },
  {
    seansNo: 2, date: '2025.11.18', title: 'Formülasyon paylaşımı', modality: 'ACT · Formülasyon', durationMin: 50,
    summary: '4P formülasyonu danışanla paylaşıldı; "olumsuz değerlendirilirsem kaybolurum" temel inancı birlikte adlandırıldı. Kaçınmanın kısa vadeli rahatlama, uzun vadeli daralma döngüsü çizildi.',
    interventions: ['4P formülasyon paylaşımı', 'Psikoeğitim — kaçınma döngüsü'],
    homework: ['Kaçınılan 3 durumu listelemek'],
    suds: 8, mood: 4,
  },
  {
    seansNo: 3, date: '2025.12.05', title: 'Defüzyon egzersizi', modality: 'ACT · Defüzyon', durationMin: 50,
    summary: '"Yaprak metaforu" ile düşüncelerle aradan mesafe çalışıldı. "Kaybolurum" düşüncesi yüksek sesle yavaşlatılarak ve etiketlenerek esnetildi. Danışan düşünceyi gerçek değil olay olarak görmede ilerleme gösterdi.',
    interventions: ['Yaprak metaforu', '"Aklıma … düşüncesi geldi" çerçevelemesi'],
    homework: ['Sunum öncesi 5 dk defüzyon egzersizi'],
    suds: 7, mood: 5,
  },
  {
    seansNo: 4, date: '2026.01.10', title: 'Değerler matrisi', modality: 'ACT · Değerler', durationMin: 50,
    summary: 'Değer kartlarıyla çalışıldı; "yaratıcılık" ve "özgün ifade" baskın değerler olarak netleşti. Kaçınmanın bu değerlerden uzaklaştırdığı fark edildi; değer yönünde küçük adımlar planlandı.',
    interventions: ['Değer kartları', 'ACT matrisi'],
    homework: ['Haftalık 1 sergi açılışına gitmek'],
    suds: 6, mood: 6,
  },
  {
    seansNo: 5, date: '2026.02.15', title: 'Maruziyet rasyoneli', modality: 'ACT · Maruziyet', durationMin: 50,
    summary: 'Değer temelli maruziyetin gerekçesi paylaşıldı; isteklilik ile kontrol gündemi ayrıştırıldı. Kaygı hiyerarşisi birlikte oluşturuldu, ilk basamak için anlaşıldı.',
    interventions: ['Maruziyet rasyoneli', 'Kaygı hiyerarşisi oluşturma'],
    homework: ['Küçük grup içinde 1 fikir paylaşmak'],
    suds: 7, mood: 6,
  },
  {
    seansNo: 6, date: '2026.04.20', title: 'Maruziyet — sunum', modality: 'ACT · Maruziyet', durationMin: 50,
    summary: 'Seans içi maruziyet: kısa bir sunum canlandırması yapıldı. SUDS 7→4 düştü. "Donma" anında defüzyon ve şimdiki ana temas kullanıldı; danışan sürdürülebilir bir kazanım bildirdi.',
    interventions: ['Seans içi maruziyet', 'Şimdiki ana temas (nefes)'],
    homework: ['Kamerayı açık tutarak 1 toplantı'],
    suds: 5, mood: 7,
  },
];

const DEFAULT_INTERVENTIONS: InterventionRowItem[] = [
  { romanNum: 'I',   title: 'Yaprak metaforu',    modality: 'ACT', durationMin: 12, outcome: 'yararli' },
  { romanNum: 'II',  title: 'Değer kartları',     modality: 'ACT', durationMin: 18, outcome: 'yararli' },
  { romanNum: 'III', title: 'Sunum maruziyeti',   modality: 'BDT', durationMin: 25, outcome: 'notr' },
];

// ── Ölçek skorları ────────────────────────────────────────────────────────

export type ScaleSession = { seansNo: number; score: number };

export type ScaleScore = {
  name: string;
  fullName?: string;
  direction: 'lower' | 'higher';   // lower=better (çoğu klinik ölçek)
  baseline: number;
  current: number;
  max: number;
  cutoff?: number;                  // klinik eşik skoru
  sessions: ScaleSession[];
};

// ── ACT Formülasyon (modal) ──────────────────────────────────────────────

export type ActAvoidanceItem = { trigger: string; response: string; cost: string };
export type ActValueItem     = { domain: string; statement: string };
export type ActCommittedAction = { action: string; value: string; timeframe: string };

export type ActFormulation = {
  coreStory: string;
  hexaflexSummary: Record<
    'defusion' | 'acceptance' | 'presentMoment' | 'selfAsContext' | 'values' | 'committedAction',
    string
  >;
  fusedThoughts: string[];
  avoidancePatterns: ActAvoidanceItem[];
  values: ActValueItem[];
  committedActions: ActCommittedAction[];
  treatmentGoals: string[];
  terapistNotu?: string;
};

const DEFAULT_ACT_FORMULATION: ActFormulation = {
  coreStory:
    'Elif, 28 yaşında bir grafik tasarımcı. Sosyal performansa dair yoğun bir kaygı tablosu ve "yetersizim, beğenilmeyeceğim" şeklinde işleyen temel bir inançla geliyor. 9 ay önce iş yerinde yaşanan bir sunum donması mevcut kaçınma örüntüsünü pekiştirdi. Şu anda sosyal ortamlardan uzaklaşıyor, çalışma hayatında giderek küçülen bir alana çekilmiş durumda. Yaratıcılık ve otantiklik değerleri terapi için güçlü bir çekirdek oluşturuyor.',

  hexaflexSummary: {
    defusion:
      'Düşüncelerle yüksek düzeyde kaynaşıyor. "Beğenilmeyeceğim" düşüncesini olguymuş gibi işliyor. Yaprak egzersizi ile hafif bir mesafe başladı; füzyon döngüsü hâlâ baskın.',
    acceptance:
      'Kaygıyı düşman olarak görüyor; hissettiğinde hemen bastırmaya ya da dikkati dağıtmaya çalışıyor. Kabul çalışmaları erken aşamada, direniş sürüyor.',
    presentMoment:
      'Gelecek odaklı endişe hâkim. Sosyal ortamlarda "nasıl göründüğümü" izlemeyle şimdiki andan çıkıyor. Beden taraması ile kısmi iyileşme gözlemlendi.',
    selfAsContext:
      'Kendini sosyal performansıyla özdeşleştiriyor. "Başarısız sunum = ben" kaynaşması belirgin. Gözlemci benlik egzersizleri devam ediyor, fragil bir başlangıç var.',
    values:
      'Yaratıcılık ve otantiklik değerleri net biçimde ortaya çıktı. Bu değerler kaçınma örüntüsüyle doğrudan çelişiyor — tedavi için güçlü bir motivasyon kaynağı.',
    committedAction:
      'Kaçınma yüksek. Toplantılara kamera kapalı giriyor, sunum fırsatlarını reddediyor. İlk hiyerarşik maruziyet adımları planlandı, ilk adım küçük tutuldu.',
  },

  fusedThoughts: [
    '"Konuşursam aptal gibi görünürüm."',
    '"Herkes benim gergin olduğumu fark ediyor."',
    '"Bir kez mahcup olursam bitmiştir."',
    '"Susarsam en azından zarar vermem."',
  ],

  avoidancePatterns: [
    { trigger: 'Toplantı davetleri', response: 'Kamerayı kapatma, geç katılma', cost: 'Görünürlük kaybı, ilerleme duraksıyor' },
    { trigger: 'Sunum talepleri', response: 'Reddedip başkasını önerme', cost: 'Yaratıcılık değeriyle çatışma' },
    { trigger: 'Sosyal davetler', response: 'Yorgunluk bahanesiyle çekilme', cost: 'Yakınlık değeriyle çatışma' },
    { trigger: 'Kaygı hissi', response: 'Telefon, müzik ile dikkat dağıtma', cost: 'Kaçınma döngüsünü güçlendiriyor' },
  ],

  values: [
    { domain: 'Yaratıcılık', statement: 'Özgün işler üretmek ve bu üretimi cesurca paylaşmak istiyorum.' },
    { domain: 'Otantiklik', statement: 'Gerçek sesimle konuşmak — performans sergilemek değil.' },
    { domain: 'Yakınlık', statement: 'İnsanlarla gerçek bağlar kurmak, yüzeysel değil.' },
    { domain: 'Büyüme', statement: 'Her deneyimden öğrenmek; mükemmel olmak zorunda değilim.' },
  ],

  committedActions: [
    { action: 'Haftada bir toplantıda kamera açık katılım', value: 'Otantiklik', timeframe: '2 hafta' },
    { action: 'Küçük ekip içi sunuma gönüllü olma', value: 'Yaratıcılık', timeframe: '1 ay' },
    { action: 'Haftada bir sosyal etkinliğe katılım', value: 'Yakınlık', timeframe: '4 hafta' },
  ],

  treatmentGoals: [
    'Defüzyon: "yetersizim" düşüncesiyle kaynaşmayı azaltmak, düşünceyi düşünce olarak görmek',
    'Kabul: kaygıyla mücadele yerine kaygıyla birlikte hareket etmeyi öğrenmek',
    'Bağlam-benlik: performans dışı, sabit bir öz kavramı geliştirmek',
    'Değer temelli eylem: yaratıcılık ve otantiklik yönünde somut, ölçülebilir adımlar atmak',
  ],

  terapistNotu:
    'Elif\'in en güçlü kaynağı yaratıcı işine olan derin bağlılığı. Bu değeri maruziyet çalışmasının merkezine yerleştirmek tedavi motivasyonunu yüksek tutuyor. Defüzyon teknikleri için müzik ve görsel sanat metaforları etkili oluyor; soyut düşünme kapasitesi iyi.',
};

const DEFAULT_SCALES: ScaleScore[] = [
  {
    name: 'BDI-II',
    fullName: 'Beck Depresyon Envanteri',
    direction: 'lower',
    baseline: 32,
    current: 18,
    max: 63,
    cutoff: 28,
    sessions: [
      { seansNo: 1, score: 32 }, { seansNo: 2, score: 30 },
      { seansNo: 3, score: 26 }, { seansNo: 4, score: 22 },
      { seansNo: 5, score: 20 }, { seansNo: 6, score: 21 },
      { seansNo: 7, score: 18 },
    ],
  },
  {
    name: 'BAI',
    fullName: 'Beck Anksiyete Envanteri',
    direction: 'lower',
    baseline: 28,
    current: 14,
    max: 63,
    cutoff: 22,
    sessions: [
      { seansNo: 1, score: 28 }, { seansNo: 2, score: 25 },
      { seansNo: 3, score: 21 }, { seansNo: 4, score: 18 },
      { seansNo: 5, score: 15 }, { seansNo: 6, score: 16 },
      { seansNo: 7, score: 14 },
    ],
  },
  {
    name: 'DASS-21',
    fullName: 'Dep./Anksiyete/Stres Ölçeği',
    direction: 'lower',
    baseline: 24,
    current: 12,
    max: 42,
    cutoff: 18,
    sessions: [
      { seansNo: 1, score: 24 }, { seansNo: 3, score: 20 },
      { seansNo: 5, score: 16 }, { seansNo: 7, score: 12 },
    ],
  },
];

// ── Sayfa düzeyi eklentiler ──────────────────────────────────────────────

export type PageExtKey = 'bariyerler' | 'esneklik' | 'iliski';

const PAGE_EXTENSIONS: { key: PageExtKey; label: string; desc: string; icon: string }[] = [
  {
    key: 'bariyerler',
    label: 'Güçlü & Zayıf Yönler',
    desc: 'Koruyucu faktörler ve risk alanları karşılaştırması',
    icon: '⚡',
  },
  {
    key: 'esneklik',
    label: 'Ölçek / Değerlendirmeler',
    desc: 'ACT esneklik skoru, seans ilerlemesi ve klinik ölçek puanları',
    icon: '📊',
  },
  {
    key: 'iliski',
    label: 'Benlik & Algı Haritası',
    desc: 'DBT zihin modları, öz-algı ve dış algı karşılaştırması',
    icon: '🪞',
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────

export default function DanisanProfilPanel(props: DanisanProfilPanelProps) {
  const client = props.client ?? DEFAULT_CLIENT;
  const sidebar = props.sidebar ?? DEFAULT_SIDEBAR;

  const [internalSection, setInternalSection] = useState<ProfilSection>('profil');
  const [highlightedSection, setHighlightedSection] = useState<ProfilSection | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [kitle, setKitle] = useState<Kitle>('terapist');
  const [shareExceptions, setShareExceptions] = useState<Set<string>>(new Set());

  const isHidden = (section: string) =>
    kitle === 'danisan' && SECTION_POLICY[section] === 'gizli' && !shareExceptions.has(section);

  const toggleException = (section: string) =>
    setShareExceptions(prev => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  const quickClients = props.quickClients ?? DEFAULT_QUICK_CLIENTS;
  const [selectedSession, setSelectedSession] = useState<number | null>(null); // seansNo
  const [hikayeModalOpen, setHikayeModalOpen] = useState(false);
  const [activePageExt, setActivePageExt] = useState<Set<PageExtKey>>(
    new Set<PageExtKey>(['bariyerler', 'esneklik', 'iliski'])
  );
  const [pageExtPickerOpen, setPageExtPickerOpen] = useState(false);
  const activeSection = props.activeSection ?? internalSection;

  const togglePageExt = (key: PageExtKey) =>
    setActivePageExt(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  // Refs for each section element
  const sectionRefs = useRef<Map<ProfilSection, HTMLElement>>(new Map());
  const mainRef = useRef<HTMLElement>(null);

  // Register a section element
  const sectionRef = useCallback((key: ProfilSection) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(key, el);
    else sectionRefs.current.delete(key);
  }, []);

  // IntersectionObserver: update active section while scrolling
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the highest intersection ratio that is visible
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const key = visible[0].target.getAttribute('data-section') as ProfilSection;
          if (key) {
            setInternalSection(key);
            props.onChangeSection?.(key);
          }
        }
      },
      { root: main, threshold: [0.2, 0.5], rootMargin: '-10% 0px -50% 0px' }
    );
    sectionRefs.current.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveSection = (s: ProfilSection) => {
    setInternalSection(s);
    props.onChangeSection?.(s);
    // Scroll to section
    const el = sectionRefs.current.get(s);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Highlight flash
      setHighlightedSection(s);
      setTimeout(() => setHighlightedSection(null), 1600);
    }
  };

  const hero = props.heroQuote ?? DEFAULT_HERO;
  const fourP = props.fourP ?? DEFAULT_FOURP;
  const sw = props.strengthsWeaknesses ?? DEFAULT_SW;
  const flex = props.flexibility ?? DEFAULT_FLEX;
  const values = props.values ?? DEFAULT_VALUES;
  const story = props.story ?? DEFAULT_STORY;
  const history = props.sessionHistory ?? DEFAULT_HISTORY;
  const sessionRecords = props.sessionRecords ?? DEFAULT_SESSION_RECORDS;
  const interventions = props.interventions ?? DEFAULT_INTERVENTIONS;
  const scales = props.scaleScores ?? DEFAULT_SCALES;
  const actForm = props.actFormulation ?? DEFAULT_ACT_FORMULATION;

  return (
    <>
    <div className="dp" data-active={activeSection}>
      {/* ── Left numerik sidebar ─────────────────────────────────────── */}
      <aside className="dp-side">
        <div className="dp-side-top-row">
          <button type="button" className="dp-back" onClick={props.onBack}>
            <ArrowLeft size={14} strokeWidth={1.8} /> {props.backLabel ?? 'Danışanlar'}
          </button>
          <div className="dp-kitle-switch" role="group" aria-label="Görünüm kitlesi">
            <button
              type="button"
              className={kitle === 'terapist' ? 'active' : ''}
              onClick={() => setKitle('terapist')}
            >Terapist</button>
            <button
              type="button"
              className={kitle === 'danisan' ? 'active' : ''}
              onClick={() => setKitle('danisan')}
            >Danışanla paylaş</button>
          </div>
        </div>

        {/* ── Current patient compact card (always visible) ── */}
        <div className={`dp-client-card ${sidebarOpen ? 'dp-client-card--open' : ''}`}>
          <div className="dp-client-card-info">
            <span className="dp-eyebrow">vaka {client.vakaNo} · {client.sessionCount} seans</span>
            <h2 className="dp-client-card-name">
              {client.firstName} <em>{client.lastName}</em>
            </h2>
            {client.tags[0] && (
              <div className="dp-client-card-tags">
                {client.tags.slice(0, 2).map((t, i) => (
                  <span key={i} className={`dp-tag ${t.accent ? 'accent' : ''}`}>
                    {t.accent && <span className="dot" />}
                    {t.label}
                  </span>
                ))}
              </div>
            )}
            {!sidebarOpen && client.nextSessionLabel && (
              <span className="dp-client-card-session">{client.nextSessionLabel}</span>
            )}
          </div>
          <button
            type="button"
            className="dp-client-card-toggle"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? 'Kapat' : 'Genişlet'}
            title={sidebarOpen ? 'Kartı kapat' : 'Kartı genişlet'}
          >
            {sidebarOpen ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
          </button>
        </div>

        {/* ── Expanded: full hero + nav ── */}
        {sidebarOpen && (
          <>
            <header className="dp-hero">
              <p className="dp-meta">
                {[client.age && `${client.age} yaş`, client.gender, client.occupation].filter(Boolean).join(' · ')}
              </p>
              <div className="dp-tags">
                {client.tags.map((t, i) => (
                  <span key={i} className={`dp-tag ${t.accent ? 'accent' : ''}`}>
                    {t.accent && <span className="dot" />}
                    {t.label}
                  </span>
                ))}
              </div>
            </header>

            <nav className="dp-nav" aria-label="Profil bölümleri">
              {sidebar.map((s) => {
                // Bazı sidebar key'leri ayrı bir section ref'ine map edilir
                const scrollKey: ProfilSection =
                  s.key === 'profil'    ? 'sorun'      :
                  s.key === 'degerler'  ? 'esneklik'   :
                  s.key === 'gucluler'  ? 'hikaye'     :
                  s.key === 'formulasyon' ? 'formulasyon' :
                  s.key;
                const isActive = activeSection === s.key ||
                  (s.key === 'profil'   && activeSection === 'sorun') ||
                  (s.key === 'degerler' && activeSection === 'esneklik') ||
                  (s.key === 'gucluler' && activeSection === 'hikaye');
                return (
                  <button
                    key={s.key}
                    type="button"
                    className={`dp-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setInternalSection(s.key);
                      props.onChangeSection?.(s.key);
                      const el = sectionRefs.current.get(scrollKey);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setHighlightedSection(s.key);
                        setTimeout(() => setHighlightedSection(null), 1600);
                      }
                    }}
                  >
                    <span className="num">{s.num}</span>
                    <span className="label">{s.label}</span>
                    {s.status === 'yeni'   && <span className="badge yeni">yeni</span>}
                    {s.status === 'aktif'  && <span className="badge aktif">aktif</span>}
                    {s.status === 'tamam'  && <span className="badge tamam">tamam</span>}
                    {s.status === 'taslak' && <span className="badge taslak">taslak</span>}
                    {s.status === 'count'  && <span className="badge count">{s.count} öğe</span>}
                  </button>
                );
              })}
            </nav>

            {client.nextSessionLabel && (
              <footer className="dp-next">
                <span className="dp-eyebrow">sonraki seans</span>
                <span className="dp-next-time"><em>{client.nextSessionLabel}</em></span>
              </footer>
            )}
          </>
        )}

        {/* ── Collapsed: other patients quick-access ── */}
        {!sidebarOpen && (
          <div className="dp-quick-clients">
            <span className="dp-eyebrow dp-quick-heading">diğer danışanlar</span>
            {quickClients.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`dp-quick-card dp-quick-card--${c.status ?? 'aktif'}`}
                onClick={() => props.onOpenClient?.(c.id)}
              >
                <div className="dp-quick-info">
                  <span className="dp-quick-name">{c.firstName} {c.lastName}</span>
                  <span className="dp-quick-meta">{c.vakaNo} · {c.sessionCount ?? 0} seans</span>
                  {c.mainTag && <span className="dp-quick-tag">{c.mainTag}</span>}
                </div>
                <ArrowRight size={12} strokeWidth={1.8} className="dp-quick-arrow" />
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* ── Right storytelling main ───────────────────────────────────── */}
      <main className="dp-main" ref={mainRef}>

        {/* DARK STORY + SEANS TARİHÇESİ — sayfa başında — hikaye + gucluler */}
        {!isHidden('hikaye') && (
        <section
          ref={sectionRef('hikaye')}
          data-section="hikaye"
          className={`dp-section dp-two dp-section-dark-pair${highlightedSection === 'hikaye' || highlightedSection === 'gucluler' ? ' dp-section--highlight' : ''}`}
        >
          <article className="dp-story" role="region" aria-label="Hikaye taslağı">
            <header className="dp-story-head">
              <span className="dp-eyebrow muted">danışan hikayesi</span>
              <span className="dp-story-status">{story.status}</span>
            </header>
            <p className="dp-story-quote">
              {story.preQuote}
              <em className="accent">{story.accentItalicPhrase}</em>
              {story.postQuote}
            </p>
            <button
              type="button"
              className="dp-story-cta"
              onClick={() => setHikayeModalOpen(true)}
            >
              Detaylı hikayeyi gör <ArrowRight size={13} strokeWidth={1.8} />
            </button>
            <footer className="dp-story-meta">
              <span>{story.meta}</span>
              {story.metaTail && (
                <button type="button" className="dp-story-meta-tail">
                  {story.metaTail} <ChevronDown size={12} />
                </button>
              )}
            </footer>
          </article>

          <article className="dp-history" id="seans-tarihcesi" style={{ scrollMarginTop: 24 }}>
            <span className="dp-eyebrow">seans tarihçesi</span>
            <h3 className="dp-history-headline">Son 7 seans · <em>SUDS / Ruh hali</em></h3>
            <ul className="dp-history-list">
              {history.map((s) => (
                <li key={s.romanNum} className={`dp-history-row ${s.upcoming ? 'upcoming' : ''}`}>
                  <span className="dp-roman">{s.romanNum}</span>
                  <div className="dp-history-body">
                    <strong>{s.title}</strong>
                    <span>{s.date}</span>
                  </div>
                  {!s.upcoming ? (
                    <div className="dp-history-scores">
                      <span className="circle accent" title="SUDS">{s.suds}</span>
                      <span className="circle green" title="Ruh hali">{s.mood}</span>
                    </div>
                  ) : (
                    <span className="dp-upcoming-pill">sıradaki</span>
                  )}
                </li>
              ))}
            </ul>
          </article>
        </section>
        )}
        {/* Terapist modunda hikaye için istisna toggle */}
        {kitle === 'terapist' && (
          <div className="dp-share-toggle-row">
            <button className="dp-share-toggle" onClick={() => toggleException('hikaye')}>
              {shareExceptions.has('hikaye') ? '👁 Danışana açık' : '🔒 Danışandan gizli'}
            </button>
          </div>
        )}

        {/* SEANS ÖNCESİ NOTU — kayıtlı not varsa, seans kayıtlarının üstünde */}
        {props.preSessionNote?.text?.trim() && (
          <section className="dp-section dp-presession" style={{ scrollMarginTop: 24 }}>
            <div className="dp-section-head">
              <span className="dp-eyebrow">seans öncesi notu</span>
              <h2 className="dp-section-title">Bu seansa <em>hazırlık.</em></h2>
            </div>
            <article className="dp-presession-note">
              <p>{props.preSessionNote.text}</p>
              {props.preSessionNote.updatedAt && (
                <span className="dp-presession-meta">güncellendi · {props.preSessionNote.updatedAt}</span>
              )}
            </article>
          </section>
        )}

        {/* SEANS KAYITLARI — seans seans ne yapıldı */}
        <section id="seans-kayitlari" className="dp-section dp-srec-section" style={{ scrollMarginTop: 24 }}>
          <div className="dp-section-head">
            <span className="dp-eyebrow">seans kayıtları</span>
            <h2 className="dp-section-title">
              Bugüne dek <em>{sessionRecords.length} seans</em>.
            </h2>
          </div>
          <p className="dp-srec-intro">Her seansta ne çalışıldığının kısa özeti — kullanılan teknikler ve verilen ödevlerle.</p>
          <div className="dp-srec-list">
            {sessionRecords.slice().reverse().map((r) => (
              <article key={r.seansNo} className="dp-srec">
                <div className="dp-srec-no">
                  <span>{r.seansNo}.</span>
                  <small>seans</small>
                </div>
                <div className="dp-srec-body">
                  <div className="dp-srec-top">
                    <h3 className="dp-srec-title">{r.title}</h3>
                    <span className="dp-srec-date">{r.date}</span>
                  </div>
                  <div className="dp-srec-meta">
                    <span className="dp-srec-mod"><span className="dot" />{r.modality}</span>
                    <span className="dp-srec-dur">{r.durationMin} dk</span>
                    {typeof r.suds === 'number' && <span className="dp-srec-score suds">SUDS {r.suds}</span>}
                    {typeof r.mood === 'number' && <span className="dp-srec-score mood">Ruh hali {r.mood}</span>}
                  </div>
                  <p className="dp-srec-summary">{r.summary}</p>
                  {r.interventions && r.interventions.length > 0 && (
                    <div className="dp-srec-block">
                      <span className="dp-eyebrow muted">kullanılan teknikler</span>
                      <div className="dp-srec-chips">
                        {r.interventions.map((iv) => <span key={iv} className="dp-srec-chip">{iv}</span>)}
                      </div>
                    </div>
                  )}
                  {r.homework && r.homework.length > 0 && (
                    <div className="dp-srec-block">
                      <span className="dp-eyebrow muted">verilen ödev</span>
                      <ul className="dp-srec-hw">
                        {r.homework.map((h) => <li key={h}>{h}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* HERO QUOTE — bölüm 02 / sorun */}
        <section
          ref={sectionRef('sorun')}
          data-section="sorun"
          className={`dp-section dp-hero-section${highlightedSection === 'sorun' ? ' dp-section--highlight' : ''}`}
        >
          <span className="dp-eyebrow">
            {kitle === 'danisan'
              ? 'üzerinde birlikte çalıştığımız düşünce'
              : 'danışanın sürecini kolaylaştırmak için · temel varsayım'}
          </span>
          <h1 className="dp-hero-quote">
            {hero.preQuote} <em className="accent">{hero.accentPhrase}</em>
            {hero.postQuote}
          </h1>
          <p className="dp-hero-desc">{hero.description}</p>
          {kitle === 'terapist' && (
            <div className="dp-hero-cta">
              {hero.secondaryCta && (
                <button type="button" className="dp-btn ghost" onClick={hero.secondaryCta.onClick}>
                  {hero.secondaryCta.label}
                </button>
              )}
              {hero.primaryCta && (
                <button type="button" className="dp-btn primary" onClick={hero.primaryCta.onClick}>
                  <Sparkles size={14} strokeWidth={1.8} /> {hero.primaryCta.label}
                </button>
              )}
            </div>
          )}
        </section>

        {/* GÜÇLÜ & ZAYIF — bariyerler */}
        {activePageExt.has('bariyerler') && (
        <section
          ref={sectionRef('bariyerler')}
          data-section="bariyerler"
          className={`dp-section dp-section--managed${highlightedSection === 'bariyerler' ? ' dp-section--highlight' : ''}`}
        >
          <button className="dp-ext-remove-btn" onClick={() => togglePageExt('bariyerler')} title="Bölümü kaldır">
            <X size={12} strokeWidth={2} />
          </button>
          <div className="dp-section-head">
            <span className="dp-eyebrow">
              {kitle === 'danisan' ? 'güçlü yönler' : 'güçlü · zayıf'}
            </span>
            <h2 className="dp-section-title">
              {kitle === 'danisan'
                ? <>Güçlü <em>yönlerin.</em></>
                : <>Güçlü ve <em>zayıf</em> yönler.</>}
            </h2>
          </div>

          <div className="dp-sw">
            {/* ── Güçlü yönler ── */}
            <div className="dp-sw-col dp-sw-col--strong">
              <div className="dp-sw-header">
                <span className="dp-sw-icon">＋</span>
                <span className="dp-sw-col-label">Koruyucu &amp; Güçlü</span>
              </div>
              <ul className="dp-sw-list">
                {sw.strengths.map((item, i) => (
                  <li key={i} className="dp-sw-item">
                    <span className="dp-sw-dot dp-sw-dot--strong" />
                    <div>
                      <strong className="dp-sw-item-label">{item.label}</strong>
                      {item.detail && <p className="dp-sw-item-detail">{item.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Orta çizgi + Zayıf — sadece terapist modunda ── */}
            {kitle === 'terapist' && (
            <div className="dp-sw-divider">
              <div className="dp-sw-divider-line" />
              <span className="dp-sw-divider-vs">vs</span>
              <div className="dp-sw-divider-line" />
            </div>
            )}

            {kitle === 'terapist' && (
            <div className="dp-sw-col dp-sw-col--weak">
              <div className="dp-sw-header">
                <span className="dp-sw-icon">－</span>
                <span className="dp-sw-col-label">Risk &amp; Zayıf</span>
              </div>
              <ul className="dp-sw-list">
                {sw.weaknesses.map((item, i) => (
                  <li key={i} className="dp-sw-item">
                    <span className="dp-sw-dot dp-sw-dot--weak" />
                    <div>
                      <strong className="dp-sw-item-label">{item.label}</strong>
                      {item.detail && <p className="dp-sw-item-detail">{item.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            )}
          </div>
        </section>
        )}

        {/* ÖLÇEK / DEĞERLENDİRMELER — esneklik + degerler + ölçek skorları */}
        {activePageExt.has('esneklik') && (
        <section
          ref={sectionRef('esneklik')}
          data-section="esneklik"
          className={`dp-section dp-section--managed${highlightedSection === 'esneklik' || highlightedSection === 'degerler' ? ' dp-section--highlight' : ''}`}
        >
          <button className="dp-ext-remove-btn" onClick={() => togglePageExt('esneklik')} title="Bölümü kaldır">
            <X size={12} strokeWidth={2} />
          </button>
          <div className="dp-section-head">
            <span className="dp-eyebrow">ölçek · değerlendirme</span>
            <h2 className="dp-section-title">
              Ölçek ve <em>değerlendirmeler</em>.
            </h2>
          </div>

          {/* ACT Esnekliği */}
          <div className="dp-two dp-two--single">
            <article className="dp-flex">
              {(() => {
                const sessions = flex.sessions ?? [];
                const active = sessions.find(s => s.seansNo === selectedSession) ?? null;
                const displayAxes  = active?.axes  ?? flex.axes;
                const displayScore = active?.score  ?? flex.score;
                const displayNote  = active?.note   ?? flex.description;
                const displayLabel = active
                  ? `S${active.seansNo} · ${active.date}`
                  : 'Son görünüm';

                const scoreColor = (sc: number) =>
                  sc >= 7 ? '#2F5D3A' : sc >= 5 ? '#C2522A' : '#B83216';

                return (
                  <>
                    <div className="dp-flex-top">
                      <span className="dp-eyebrow">act esnekliği</span>
                      <span className="dp-flex-session-label">{displayLabel}</span>
                    </div>

                    <div className="dp-flex-body">
                      <FlexRadar axes={displayAxes} kitle={kitle} />
                      <div className="dp-flex-score-col">
                        <div className="dp-flex-score">
                          <span className="big" style={{ color: scoreColor(displayScore) }}>
                            {displayScore.toFixed(1).replace('.', ',')}
                          </span>
                          <em>/10</em>
                        </div>
                        {/* Mini aks listesi */}
                        <ul className="dp-flex-axes">
                          {displayAxes.map((a, i) => (
                            <li key={i} className="dp-flex-axis-row">
                              <span className="dp-flex-axis-name">{sade(kitle, a.name)}</span>
                              <div className="dp-flex-axis-bar-wrap">
                                <div
                                  className="dp-flex-axis-bar"
                                  style={{
                                    width: `${a.value * 10}%`,
                                    background: a.value >= 7 ? '#2F5D3A'
                                      : a.value >= 5 ? '#C2522A' : '#B83216',
                                  }}
                                />
                              </div>
                              <span className="dp-flex-axis-val">{a.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <p className="dp-flex-desc">{displayNote}</p>

                    {/* ── Seans zaman çizelgesi ── */}
                    {sessions.length > 0 && (
                      <div className="dp-flex-timeline">
                        <svg
                          className="dp-flex-sparkline"
                          viewBox={`0 0 ${(sessions.length - 1) * 44} 40`}
                          preserveAspectRatio="none"
                          aria-hidden
                        >
                          <polyline
                            points={sessions.map((s, i) =>
                              `${i * 44},${40 - (s.score / 10) * 36}`
                            ).join(' ')}
                            fill="none"
                            stroke="rgba(194,82,42,0.25)"
                            strokeWidth="1.5"
                          />
                        </svg>
                        <div className="dp-flex-sessions">
                          {sessions.map(s => {
                            const isActive = selectedSession === s.seansNo;
                            return (
                              <button
                                key={s.seansNo}
                                className={`dp-flex-sess-btn${isActive ? ' active' : ''}`}
                                onClick={() => setSelectedSession(isActive ? null : s.seansNo)}
                                title={`${s.date} — ${s.score.toFixed(1)}/10`}
                              >
                                <span
                                  className="dp-flex-sess-dot"
                                  style={{ background: scoreColor(s.score) }}
                                />
                                <span className="dp-flex-sess-num">S{s.seansNo}</span>
                                <span className="dp-flex-sess-score">{s.score.toFixed(1)}</span>
                              </button>
                            );
                          })}
                        </div>
                        {selectedSession && (
                          <button
                            className="dp-flex-clear"
                            onClick={() => setSelectedSession(null)}
                          >
                            ✕ son görünüme dön
                          </button>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </article>
          </div>

          {/* Ölçek skorları & ilerleme */}
          <div className="dp-scales">
            <div className="dp-scales-head">
              <span className="dp-eyebrow">uygulanan ölçekler · ilerleme</span>
              <div className="dp-scales-head-row">
                <h4 className="dp-scales-title">Klinik ölçek sonuçları</h4>
                <span className="dp-scales-freq-badge">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M5 3v2l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  haftalık
                </span>
              </div>
            </div>
            {scales.map((sc) => {
              const diff = sc.direction === 'lower'
                ? sc.baseline - sc.current
                : sc.current - sc.baseline;
              const improved = diff > 0;
              const pct = (v: number) => Math.min(100, Math.round((v / sc.max) * 100));
              const sn = sc.sessions;
              const minS = Math.min(...sn.map(s => s.score));
              const maxS = Math.max(...sn.map(s => s.score));
              const rng = Math.max(maxS - minS, 1);
              const sparkW = sn.length > 1 ? (sn.length - 1) * 20 : 20;
              return (
                <div key={sc.name} className="dp-scale-row">
                  <div className="dp-scale-name-col">
                    <span className="dp-scale-name">{sc.name}</span>
                    {sc.fullName && <span className="dp-scale-fullname">{sc.fullName}</span>}
                  </div>
                  <svg
                    className="dp-scale-spark"
                    viewBox={`0 0 ${sparkW} 28`}
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    {sc.cutoff !== undefined && (() => {
                      const cy = 26 - ((sc.cutoff - minS) / rng) * 22;
                      return (
                        <line
                          x1={0} y1={cy}
                          x2={sparkW} y2={cy}
                          stroke="rgba(194,82,42,0.35)"
                          strokeWidth={1}
                          strokeDasharray="3,2"
                        />
                      );
                    })()}
                    {sn.length > 1 && (
                      <polyline
                        points={sn.map((s, i) =>
                          `${i * 20},${26 - ((s.score - minS) / rng) * 22}`
                        ).join(' ')}
                        fill="none"
                        stroke={improved ? '#2F5D3A' : '#B83216'}
                        strokeWidth={1.5}
                        strokeLinejoin="round"
                      />
                    )}
                    {sn.map((s, i) => (
                      <circle
                        key={i}
                        cx={sn.length > 1 ? i * 20 : sparkW / 2}
                        cy={26 - ((s.score - minS) / rng) * 22}
                        r={2.5}
                        fill={improved ? '#2F5D3A' : '#B83216'}
                      />
                    ))}
                  </svg>
                  <div className="dp-scale-scores">
                    <span className="dp-scale-range">{sc.baseline} → {sc.current}</span>
                    <span className={`dp-scale-change ${improved ? 'better' : diff < 0 ? 'worse' : 'same'}`}>
                      {diff > 0 ? '↓' : diff < 0 ? '↑' : '–'}{Math.abs(diff)} puan
                    </span>
                  </div>
                  <div className="dp-scale-bar-col">
                    <div className="dp-scale-bar-wrap">
                      <div className="dp-scale-bar-base" style={{ width: `${pct(sc.baseline)}%` }} />
                      <div
                        className="dp-scale-bar-curr"
                        style={{
                          width: `${pct(sc.current)}%`,
                          background: improved ? '#2F5D3A' : '#B83216',
                        }}
                      />
                      {sc.cutoff !== undefined && (
                        <div
                          className="dp-scale-cutoff-line"
                          style={{ left: `${pct(sc.cutoff)}%` }}
                          title={`Klinik eşik: ${sc.cutoff}`}
                        />
                      )}
                    </div>
                    <div className="dp-scale-labels">
                      <span>0</span>
                      <span>{sc.max}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        )}

        {/* BENLİK & ALGI HARİTASI — iliski */}
        {activePageExt.has('iliski') && (
        <section
          ref={sectionRef('iliski')}
          data-section="iliski"
          className={`dp-section dp-section--managed${highlightedSection === 'iliski' ? ' dp-section--highlight' : ''}`}
        >
          <button className="dp-ext-remove-btn" onClick={() => togglePageExt('iliski')} title="Bölümü kaldır">
            <X size={12} strokeWidth={2} />
          </button>
          <div className="dp-section-head">
            <span className="dp-eyebrow">09 · benlik & algı</span>
            <h2 className="dp-section-title">
              Kendini nasıl görüyor — başkaları <em>nasıl görüyor</em>.
            </h2>
          </div>
          <BenlikAlgisiPanel
            audience={kitle}
            patientName={`${props.client.firstName} ${props.client.lastName}`.trim()}
            initialData={props.benlikAlgisi}
            onSave={props.onSaveBenlikAlgisi}
          />
        </section>
        )}

        {/* EKLENTI YÖNETİCİSİ — bölüm ekle / kaldır */}
        <div className="dp-ext-mgr">
          <button
            className="dp-ext-add-btn"
            onClick={() => setPageExtPickerOpen(o => !o)}
          >
            <Plus size={13} strokeWidth={1.8} />
            Bölüm ekle
            {activePageExt.size < PAGE_EXTENSIONS.length && (
              <span className="dp-ext-avail-badge">
                {PAGE_EXTENSIONS.length - activePageExt.size} mevcut
              </span>
            )}
            {pageExtPickerOpen
              ? <ChevronUp size={13} strokeWidth={1.8} style={{ marginLeft: 'auto' }} />
              : <ChevronDown size={13} strokeWidth={1.8} style={{ marginLeft: 'auto' }} />
            }
          </button>

          {pageExtPickerOpen && (
            <div className="dp-ext-picker-grid">
              {PAGE_EXTENSIONS.map(ext => {
                const on = activePageExt.has(ext.key);
                return (
                  <button
                    key={ext.key}
                    className={`dp-ext-picker-card ${on ? 'dp-ext-picker-card--on' : ''}`}
                    onClick={() => togglePageExt(ext.key)}
                  >
                    <span className="dp-ext-picker-icon">{ext.icon}</span>
                    <div className="dp-ext-picker-info">
                      <span className="dp-ext-picker-label">{ext.label}</span>
                      <span className="dp-ext-picker-desc">{ext.desc}</span>
                    </div>
                    <span className={`dp-ext-picker-check ${on ? 'on' : ''}`}>
                      {on ? <X size={11} strokeWidth={2.5} /> : <Plus size={11} strokeWidth={2.5} />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ALT FORMÜLASYON HUB CTA — formulasyon */}
        <section
          ref={sectionRef('formulasyon')}
          data-section="formulasyon"
          className={`dp-section dp-cta${highlightedSection === 'formulasyon' ? ' dp-section--highlight' : ''}`}
        >
          {kitle === 'terapist' ? (
            <>
              <div>
                <span className="dp-eyebrow">10 · 4p formülasyon</span>
                <h2 className="dp-cta-title">
                  Bu profili bir <em>klinik formülasyona</em> dönüştür.
                </h2>
                <p>Tüm bölümleri tek raporda topla, danışana yazılı versiyon ver.</p>
              </div>
              <div className="dp-cta-actions">
                <button type="button" className="dp-btn ghost" onClick={props.onOpenFormulationHub}>
                  Formülasyon hub'ı
                </button>
                <button type="button" className="dp-btn primary" onClick={props.onCreateBriefing}>
                  Briefing oluştur <ArrowRight size={14} strokeWidth={1.8} />
                </button>
              </div>
            </>
          ) : (
            <div className="dp-cta-danisan">
              <p className="dp-cta-danisan-text">
                Bu, üzerinde birlikte çalıştığımız haritanın özeti.
                Her bölüm, süreci daha net görmemize yardımcı oluyor.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
    {hikayeModalOpen && (
      <HikayeModal
        onClose={() => setHikayeModalOpen(false)}
        patient={client}
        formulation={actForm}
        flexAxes={flex.axes}
      />
    )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// HikayeModal — ACT formülasyon detay modalı
// ──────────────────────────────────────────────────────────────────────────

function HikayeModal({
  onClose, patient, formulation, flexAxes,
}: {
  onClose(): void;
  patient: ClientHero;
  formulation: ActFormulation;
  flexAxes: HexaflexAxis[];
}) {
  // Escape ile kapat
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const PROCESSES: { key: keyof ActFormulation['hexaflexSummary']; label: string; axisName: string }[] = [
    { key: 'defusion',        label: 'Defüzyon',         axisName: 'Defüzyon' },
    { key: 'acceptance',      label: 'Kabul',             axisName: 'Kabul' },
    { key: 'presentMoment',   label: 'Şimdiki An',        axisName: 'Şimdiki an' },
    { key: 'selfAsContext',   label: 'Bağlam-Benlik',     axisName: 'Bağlam-benlik' },
    { key: 'values',          label: 'Değerler',          axisName: 'Değerler' },
    { key: 'committedAction', label: 'Taahhütlü Eylem',   axisName: 'Eylem' },
  ];

  const scoreFor = (axisName: string) =>
    flexAxes.find(a => a.name.toLowerCase() === axisName.toLowerCase())?.value ?? 5;

  const scoreColor = (sc: number) =>
    sc >= 7 ? '#2F5D3A' : sc >= 5 ? '#C2522A' : '#B83216';

  return (
    <div
      className="dp-hm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dp-hm-panel" role="dialog" aria-modal="true" aria-label="ACT Formülasyonu">

        {/* Sticky başlık */}
        <header className="dp-hm-header">
          <div className="dp-hm-header-left">
            <span className="dp-eyebrow">ACT formülasyonu</span>
            <h2 className="dp-hm-title">{patient.firstName} {patient.lastName}</h2>
          </div>
          <button className="dp-hm-close" onClick={onClose} aria-label="Kapat">
            <X size={18} strokeWidth={1.8} />
          </button>
        </header>

        {/* Kaydırılabilir gövde */}
        <div className="dp-hm-body">

          {/* 01 · Klinik Özet */}
          <section className="dp-hm-section">
            <span className="dp-hm-section-num">01</span>
            <h3 className="dp-hm-section-title">Klinik Özet</h3>
            <p className="dp-hm-story">{formulation.coreStory}</p>
          </section>

          {/* 02 · Psikolojik Esneklik Haritası */}
          <section className="dp-hm-section">
            <span className="dp-hm-section-num">02</span>
            <h3 className="dp-hm-section-title">Psikolojik Esneklik Haritası</h3>
            <div className="dp-hm-hex-grid">
              {PROCESSES.map(p => {
                const score = scoreFor(p.axisName);
                const color = scoreColor(score);
                return (
                  <div key={p.key} className="dp-hm-hex-card">
                    <div className="dp-hm-hex-card-top">
                      <span className="dp-hm-hex-label">{p.label}</span>
                      <span className="dp-hm-hex-score" style={{ color }}>{score}/10</span>
                    </div>
                    <div className="dp-hm-hex-bar-wrap">
                      <div className="dp-hm-hex-bar" style={{ width: `${score * 10}%`, background: color }} />
                    </div>
                    <p className="dp-hm-hex-desc">{formulation.hexaflexSummary[p.key]}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 03 · Kaynaşan Düşünceler */}
          <section className="dp-hm-section">
            <span className="dp-hm-section-num">03</span>
            <h3 className="dp-hm-section-title">Kaynaşan Düşünceler</h3>
            <div className="dp-hm-fusion-grid">
              {formulation.fusedThoughts.map((t, i) => (
                <div key={i} className="dp-hm-fusion-card">
                  <span className="dp-hm-fusion-quote">{t}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 04 · Kaçınma Örüntüleri */}
          <section className="dp-hm-section">
            <span className="dp-hm-section-num">04</span>
            <h3 className="dp-hm-section-title">Kaçınma Örüntüleri</h3>
            <div className="dp-hm-avoid-table">
              <div className="dp-hm-avoid-header">
                <span>Tetikleyici</span>
                <span>Yanıt</span>
                <span>Maliyet</span>
              </div>
              {formulation.avoidancePatterns.map((a, i) => (
                <div key={i} className="dp-hm-avoid-row">
                  <span>{a.trigger}</span>
                  <span>{a.response}</span>
                  <span className="dp-hm-avoid-cost">{a.cost}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 05 · Değer Alanları */}
          <section className="dp-hm-section">
            <span className="dp-hm-section-num">05</span>
            <h3 className="dp-hm-section-title">Değer Alanları</h3>
            <div className="dp-hm-values-grid">
              {formulation.values.map((v, i) => (
                <div key={i} className="dp-hm-value-card">
                  <span className="dp-hm-value-domain">{v.domain}</span>
                  <p className="dp-hm-value-stmt">{v.statement}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 06 · Taahhüt Edilen Eylemler */}
          <section className="dp-hm-section">
            <span className="dp-hm-section-num">06</span>
            <h3 className="dp-hm-section-title">Taahhüt Edilen Eylemler</h3>
            <ul className="dp-hm-actions">
              {formulation.committedActions.map((a, i) => (
                <li key={i} className="dp-hm-action-row">
                  <div className="dp-hm-action-body">
                    <strong>{a.action}</strong>
                    <span>{a.value} değeri</span>
                  </div>
                  <span className="dp-hm-action-time">{a.timeframe}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 07 · Tedavi Hedefleri */}
          <section className="dp-hm-section">
            <span className="dp-hm-section-num">07</span>
            <h3 className="dp-hm-section-title">Tedavi Hedefleri</h3>
            <ul className="dp-hm-goals">
              {formulation.treatmentGoals.map((g, i) => (
                <li key={i} className="dp-hm-goal-row">
                  <span className="dp-hm-goal-num">0{i + 1}</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Terapist Notu */}
          {formulation.terapistNotu && (
            <section className="dp-hm-section dp-hm-section--note">
              <span className="dp-hm-section-num">not</span>
              <h3 className="dp-hm-section-title">Terapist Notu</h3>
              <p className="dp-hm-therapist-note">{formulation.terapistNotu}</p>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// FlexRadar — hexagon radar (saf SVG)
// ──────────────────────────────────────────────────────────────────────────

function FlexRadar({ axes, kitle = 'terapist' }: { axes: HexaflexAxis[]; kitle?: Kitle }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;
  const n = Math.max(3, axes.length);

  // 6 nokta hexagon — başlangıç tepe
  const pointAt = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (value / 10) * r;
    return [cx + rr * Math.cos(angle), cy + rr * Math.sin(angle)] as const;
  };
  const labelAt = (i: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const lr = r + 16;
    return [cx + lr * Math.cos(angle), cy + lr * Math.sin(angle)] as const;
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const polyAt = (level: number) =>
    Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return `${cx + level * r * Math.cos(angle)},${cy + level * r * Math.sin(angle)}`;
    }).join(' ');

  const dataPoly = axes.map((a, i) => pointAt(i, a.value).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="dp-radar" aria-hidden>
      {gridLevels.map((lv, i) => (
        <polygon
          key={i}
          points={polyAt(lv)}
          fill="none"
          stroke="rgba(14,15,18,0.08)"
          strokeWidth={1}
        />
      ))}
      <polygon
        points={dataPoly}
        fill="rgba(194,82,42,0.18)"
        stroke="#C2522A"
        strokeWidth={1.5}
      />
      {axes.map((a, i) => {
        const [px, py] = pointAt(i, a.value);
        return (
          <circle key={i} cx={px} cy={py} r={3.5} fill="#C2522A" />
        );
      })}
      {axes.map((a, i) => {
        const [lx, ly] = labelAt(i);
        return (
          <text
            key={i}
            x={lx} y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="dp-radar-label"
          >
            {sade(kitle, a.name).toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}
