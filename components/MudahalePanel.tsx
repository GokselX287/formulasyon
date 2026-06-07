'use client';

import { useMemo, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  Plus, Search, X, Star, StarOff, ArrowRight, ArrowUp, ArrowDown,
  Clock, FileText, Sparkles, Heart, Filter, ChevronDown,
  Users, Calendar as CalendarIcon, FileDown, ExternalLink,
  AlertTriangle, GripVertical, Trash2, BookOpen,
} from 'lucide-react';
import MudahaleDetayModal from './MudahaleDetayModal';
import './MudahaleDetayModal.css';

// ─── Types ────────────────────────────────────────────────────────────────

export type Modality = 'BDT' | 'ACT' | 'EFT' | 'CFT' | 'EMDR' | 'Şema' | 'Sistemik' | 'Diğer';
export type AgeGroup = 'yetiskin' | 'ergen' | 'cocuk-7-11' | 'cocuk-4-6' | 'cift';
export type Format   = 'seans-ici' | 'ev-odevi' | 'psikoegitim' | 'calisma-kagidi';
export type Duration = 'kisa' | 'orta' | 'uzun' | 'tam-seans';
export type Evidence = 'rkc' | 'sistematik-review' | 'klinik-kilavuz' | 'vaka-serisi';
export type Outcome  = 'yararli' | 'notr' | 'yararsiz';

export type Intervention = {
  id: string;
  title: string;
  modality: Modality;
  problems: string[];
  ageGroups: AgeGroup[];
  format: Format;
  duration: Duration;
  durationMinutes?: number;    // override for SeansPlanlayici
  evidence: Evidence;
  description: string;

  protocol?: string[];
  materials?: string[];
  contraindications?: string[];
  variants?:    { age: AgeGroup; label: string; notes: string }[];
  references?:  { title: string; doi?: string; url?: string }[];
  personalNotes?: string;
  homeworkVariant?: string;    // short homework instruction for SeansPlanlayici
  usageHistory?:  { clientName: string; date: string; outcome: Outcome; note?: string }[];
  favorite?:  boolean;
  useCount?:  number;
};

export type MudahalePanelTab = 'all' | 'favorites' | 'frequent' | 'evidence';

export type AssignTarget = {
  clientId: string;
  when: 'bugun' | 'sonraki-seans' | 'tarih';
  date?: string;
  durationMinutes?: number;
  asHomework?: boolean;
  note?: string;
};

export type MudahalePanelProps = {
  interventions?: Intervention[];
  activeClient?: { id: string; name: string; age?: number; formulation?: string };
  recentClients?: { id: string; name: string; meta?: string }[];

  filters?: {
    query?:       string;
    modalities?:  Modality[];
    problems?:    string[];
    ageGroups?:   AgeGroup[];
    formats?:     Format[];
    durations?:   Duration[];
    evidence?:    Evidence[];
  };
  onChangeFilters?: (f: NonNullable<MudahalePanelProps['filters']>) => void;

  tab?: MudahalePanelTab;
  onChangeTab?: (t: MudahalePanelTab) => void;

  basket?: string[];
  onAddToBasket?:      (id: string) => void;
  onRemoveFromBasket?: (id: string) => void;
  onReorderBasket?:    (ids: string[]) => void;

  onToggleFavorite?:     (id: string) => void;
  onOpenDetail?:         (id: string) => void;
  onCreateNew?:          () => void;
  onCreateSessionPlan?:  (ids: string[]) => void;
  onAssignToClient?:     (id: string, target: AssignTarget) => void;
  onSavePersonalNotes?:  (id: string, notes: string) => void;
  onExportPdf?:          (id: string) => void;
};

// ─── Defaults / metadata ──────────────────────────────────────────────────

const MODALITY_TONE: Record<Modality, string> = {
  BDT: 'mavi', ACT: 'accent', EFT: 'mor', CFT: 'yesil', EMDR: 'risk',
  Şema: 'amber', Sistemik: 'lacivert', Diğer: 'ink',
};

const DURATION_LABEL: Record<Duration, string> = {
  'kisa': '≤10 dk', 'orta': '10-25 dk', 'uzun': '25 dk+', 'tam-seans': 'Tam seans',
};

const FORMAT_LABEL: Record<Format, string> = {
  'seans-ici': 'Seans-içi', 'ev-odevi': 'Ev ödevi',
  'psikoegitim': 'Psikoeğitim', 'calisma-kagidi': 'Çalışma kâğıdı',
};

const EVIDENCE_LABEL: Record<Evidence, { l: string; stars: 5 | 4 | 3 | 2 }> = {
  'rkc':                { l: 'RKÇ',                stars: 5 },
  'sistematik-review':  { l: 'Sistematik review',  stars: 4 },
  'klinik-kilavuz':     { l: 'Klinik kılavuz',     stars: 3 },
  'vaka-serisi':        { l: 'Vaka serisi',        stars: 2 },
};

const AGE_LABEL: Record<AgeGroup, string> = {
  yetiskin: 'Yetişkin', ergen: 'Ergen',
  'cocuk-7-11': 'Çocuk 7-11', 'cocuk-4-6': 'Çocuk 4-6',
  cift: 'Çift',
};

const ALL_PROBLEMS = [
  'sosyal kaygı', 'panik', 'OKB', 'YAB', 'depresyon', 'travma', 'PTSD',
  'yas', 'madde', 'kişilik', 'çift', 'okul reddi', 'davranış', 'mükemmeliyetçilik',
  'kaçınma', 'rumination',
];

// 36 intervention mock — covers the key dimensions for visible filter combos
const DEFAULT_INTERVENTIONS: Intervention[] = [
  // ACT
  { id: 'i-1',  title: 'Defüzyon · "Yapraklar dalda" egzersizi',
    modality: 'ACT', problems: ['rumination', 'sosyal kaygı'],
    ageGroups: ['yetiskin', 'ergen'], format: 'seans-ici', duration: 'orta', evidence: 'rkc',
    description: 'Düşünceleri akıntıdaki yaprak gibi izleme — defüzyon temel pratiği.',
    protocol: ['Sessiz, gözler kapalı oturma.', 'Düşünce → yaprak metaforu.', '10-15 dk akış.', 'Çıkış + paylaşım.'],
    materials: ['Sessiz ortam', 'Opsiyonel arka plan sesi'],
    references: [{ title: 'Hayes et al. — ACT Manual', doi: '10.1037/14336-000' }],
    favorite: true, useCount: 24,
    usageHistory: [
      { clientName: 'Elif Y.', date: '2026.05.10', outcome: 'yararli', note: 'SUDS 7→4' },
      { clientName: 'Mert K.', date: '2026.04.22', outcome: 'notr' },
    ],
  },
  { id: 'i-2',  title: 'Değerler Pusulası', modality: 'ACT', problems: ['mükemmeliyetçilik', 'tükenmişlik'],
    ageGroups: ['yetiskin'], format: 'calisma-kagidi', duration: 'orta', evidence: 'rkc',
    description: '10 yaşam alanında değer-eylem boşluğunu haritalayan kart pratiği.',
    favorite: true, useCount: 18,
  },
  { id: 'i-3',  title: 'Şimdiki an demirleme', modality: 'ACT', problems: ['kaçınma', 'panik'],
    ageGroups: ['yetiskin', 'ergen'], format: 'seans-ici', duration: 'kisa', evidence: 'sistematik-review',
    description: '5-4-3-2-1 duyusal demirleme; dissosiyatif zemini iyileştirir.',
    useCount: 12,
  },

  // BDT
  { id: 'i-4',  title: 'Maruziyet hiyerarşisi (in vivo)', modality: 'BDT', problems: ['sosyal kaygı', 'panik', 'fobi'],
    ageGroups: ['yetiskin', 'ergen'], format: 'seans-ici', duration: 'uzun', evidence: 'rkc',
    description: 'SUDS skorlu kademeli maruz bırakma; 8-12 seans iskeleti.',
    protocol: [
      'Hiyerarşi listesi: 10 durum × SUDS.',
      'En düşük başlamak: 30+ dk maruziyet.',
      'Tekrar — SUDS yarıya iner.',
      'Sıradaki adıma geç.',
    ],
    contraindications: ['Aktif intihar düşüncesi', 'Madde intoksikasyonu'],
    favorite: true, useCount: 31,
  },
  { id: 'i-5',  title: 'ERP · Maruziyet + Tepki Önleme', modality: 'BDT', problems: ['OKB'],
    ageGroups: ['yetiskin', 'ergen'], format: 'seans-ici', duration: 'tam-seans', evidence: 'rkc',
    description: 'OKB altın standart protokolü — uyarıcı + kompulsiyon önleme.',
    useCount: 14,
  },
  { id: 'i-6',  title: 'Düşünce kaydı', modality: 'BDT', problems: ['depresyon', 'YAB'],
    ageGroups: ['yetiskin', 'ergen', 'cocuk-7-11'], format: 'ev-odevi', duration: 'orta', evidence: 'rkc',
    description: 'A-B-C kayıt + alternatif düşünce — klasik BDT temel pratiği.',
    favorite: false, useCount: 42,
  },
  { id: 'i-7',  title: 'Davranışsal aktivasyon · 7 gün',
    modality: 'BDT', problems: ['depresyon'],
    ageGroups: ['yetiskin', 'ergen'], format: 'ev-odevi', duration: 'uzun', evidence: 'rkc',
    description: 'Haz/ustalık çizelgeleri ile aktivite çoğaltma.', useCount: 19,
  },
  { id: 'i-8',  title: 'Panik çemberi psikoeğitimi',
    modality: 'BDT', problems: ['panik'],
    ageGroups: ['yetiskin', 'ergen'], format: 'psikoegitim', duration: 'orta', evidence: 'klinik-kilavuz',
    description: 'Beden duyumu → felaket yorumu → kaçınma çemberi.', useCount: 9,
  },

  // CFT
  { id: 'i-9',  title: 'Şefkatli imgelem', modality: 'CFT', problems: ['öz-eleştiri', 'yas', 'travma'],
    ageGroups: ['yetiskin', 'ergen'], format: 'seans-ici', duration: 'orta', evidence: 'sistematik-review',
    description: 'Sakinlik sistemini etkinleştiren şefkatli figür imgeleme.',
    favorite: true, useCount: 16,
  },
  { id: 'i-10', title: 'Korkmuş çocuğa mektup', modality: 'CFT', problems: ['travma', 'şema'],
    ageGroups: ['yetiskin'], format: 'ev-odevi', duration: 'uzun', evidence: 'vaka-serisi',
    description: 'İçsel eleştirmenin yerine şefkatli ses pratiği.', useCount: 7,
  },
  { id: 'i-11', title: 'Üç sistem psikoeğitimi',
    modality: 'CFT', problems: ['öz-eleştiri', 'tükenmişlik'],
    ageGroups: ['yetiskin', 'ergen'], format: 'psikoegitim', duration: 'orta', evidence: 'klinik-kilavuz',
    description: 'Tehdit / sürüş / sakinlik dengesinin görsel açıklaması.',
  },

  // EFT
  { id: 'i-12', title: 'Kovala-kaç döngüsü dışsallaştırma',
    modality: 'EFT', problems: ['çift'],
    ageGroups: ['cift'], format: 'seans-ici', duration: 'tam-seans', evidence: 'rkc',
    description: 'EFT 1. aşama — çiftin döngüsünü ortak düşman olarak çerçeveleme.',
    useCount: 11,
  },
  { id: 'i-13', title: 'Bağlanma yarası diyaloğu',
    modality: 'EFT', problems: ['çift', 'bağlanma'],
    ageGroups: ['cift'], format: 'seans-ici', duration: 'tam-seans', evidence: 'sistematik-review',
    description: 'EFT 2. aşama — yumuşatma + yeniden bağlanma seansı.',
  },

  // EMDR
  { id: 'i-14', title: 'EMDR · Standart 8 faz', modality: 'EMDR', problems: ['travma', 'PTSD'],
    ageGroups: ['yetiskin', 'ergen'], format: 'seans-ici', duration: 'tam-seans', evidence: 'rkc',
    description: 'PTSD altın standart — kaynak geliştirme + bilateral stim + entegrasyon.',
    contraindications: ['Aktif dissosiyatif kriz', 'Stabilize olmayan psikoz'],
    useCount: 22,
  },
  { id: 'i-15', title: 'Güvenli yer imgelemi',
    modality: 'EMDR', problems: ['travma'],
    ageGroups: ['yetiskin', 'ergen', 'cocuk-7-11'], format: 'seans-ici', duration: 'orta', evidence: 'klinik-kilavuz',
    description: 'EMDR ön-stabilizasyon — kaynak geliştirme.', useCount: 8,
  },

  // Şema
  { id: 'i-16', title: 'Mod diyaloğu (sandalye çalışması)',
    modality: 'Şema', problems: ['kişilik', 'şema'],
    ageGroups: ['yetiskin'], format: 'seans-ici', duration: 'tam-seans', evidence: 'sistematik-review',
    description: 'Sağlıklı yetişkin · savunmasız çocuk · içsel eleştirmen modları.',
    useCount: 5,
  },
  { id: 'i-17', title: 'Şema günlüğü', modality: 'Şema', problems: ['şema', 'depresyon'],
    ageGroups: ['yetiskin'], format: 'ev-odevi', duration: 'uzun', evidence: 'klinik-kilavuz',
    description: 'Tetik → şema → mod → işlevsiz davranış kaydı.', useCount: 6,
  },

  // Sistemik
  { id: 'i-18', title: 'Aile genogramı', modality: 'Sistemik',
    problems: ['aile', 'çocuk'], ageGroups: ['yetiskin', 'ergen', 'cocuk-7-11'],
    format: 'seans-ici', duration: 'uzun', evidence: 'klinik-kilavuz',
    description: '3 nesil sistem haritası; ilişki örüntüleri ve mesafe.',
  },
  { id: 'i-19', title: 'Boşanma sonrası uyum protokolü',
    modality: 'Sistemik', problems: ['aile', 'çocuk-davranış'],
    ageGroups: ['cocuk-7-11', 'ergen'], format: 'seans-ici', duration: 'tam-seans', evidence: 'vaka-serisi',
    description: 'Veli koordinasyonu + çocuk maruziyeti azaltma kombinasyonu.',
  },

  // Çocuk
  { id: 'i-20', title: 'Sembolik oyun gözlemi',
    modality: 'Diğer', problems: ['çocuk-davranış', 'travma'],
    ageGroups: ['cocuk-4-6', 'cocuk-7-11'], format: 'seans-ici', duration: 'tam-seans', evidence: 'klinik-kilavuz',
    description: 'Yapısal olmayan oyun + klinik gözlem notu — temalar, çözüm örüntüsü.',
    favorite: true, useCount: 13,
  },
  { id: 'i-21', title: 'Duygu termometresi',
    modality: 'BDT', problems: ['çocuk-davranış', 'kaygı'],
    ageGroups: ['cocuk-7-11', 'cocuk-4-6'], format: 'calisma-kagidi', duration: 'kisa', evidence: 'klinik-kilavuz',
    description: 'Çocukla 1-10 ölçek konuşması; somut görsel.',
    useCount: 17,
  },
  { id: 'i-22', title: 'Endişe canavarı', modality: 'BDT',
    problems: ['kaygı', 'çocuk-davranış'], ageGroups: ['cocuk-4-6', 'cocuk-7-11'],
    format: 'seans-ici', duration: 'orta', evidence: 'vaka-serisi',
    description: 'Endişeyi dışsallaştırma + çizim — çocuk-uyarlı eksternalizasyon.',
  },
  { id: 'i-23', title: 'Okul reddi maruziyet protokolü',
    modality: 'BDT', problems: ['okul reddi'],
    ageGroups: ['cocuk-7-11', 'ergen'], format: 'seans-ici', duration: 'tam-seans', evidence: 'sistematik-review',
    description: 'Veli + öğretmen koordinasyonuyla kademeli okul re-entry.',
    useCount: 4,
  },

  // Mindfulness / generic
  { id: 'i-24', title: 'Nefes farkındalığı · 8 dk',
    modality: 'ACT', problems: ['kaygı', 'rumination'],
    ageGroups: ['yetiskin', 'ergen'], format: 'ev-odevi', duration: 'kisa', evidence: 'sistematik-review',
    description: 'Kısa rehberli nefes pratiği; günlük tekrar.', useCount: 28,
  },
  { id: 'i-25', title: 'Body scan · 25 dk',
    modality: 'ACT', problems: ['kaygı', 'somatik'],
    ageGroups: ['yetiskin'], format: 'ev-odevi', duration: 'uzun', evidence: 'rkc',
    description: 'MBCT temelli vücut tarama; haftada 5 gün önerilir.',
  },

  // Daha fazla BDT
  { id: 'i-26', title: 'Davranış deneyi',
    modality: 'BDT', problems: ['sosyal kaygı', 'panik'],
    ageGroups: ['yetiskin', 'ergen'], format: 'ev-odevi', duration: 'orta', evidence: 'rkc',
    description: 'İnanca yönelik test deneyi; öncesi-sonrası tahmin.', useCount: 21,
  },
  { id: 'i-27', title: 'Uyku hijyeni psikoeğitimi',
    modality: 'BDT', problems: ['uyku', 'depresyon'],
    ageGroups: ['yetiskin', 'ergen'], format: 'psikoegitim', duration: 'orta', evidence: 'klinik-kilavuz',
    description: 'CBT-I temel ilkeler; uyaran kontrolü + stimülan kısıtlama.',
  },
  { id: 'i-28', title: 'Endişe zamanı',
    modality: 'BDT', problems: ['YAB', 'rumination'],
    ageGroups: ['yetiskin', 'ergen'], format: 'ev-odevi', duration: 'kisa', evidence: 'sistematik-review',
    description: 'Günde 20 dk yapılandırılmış endişe penceresi.', useCount: 10,
  },
  { id: 'i-29', title: 'Aktivite çizelgeleme',
    modality: 'BDT', problems: ['depresyon', 'tükenmişlik'],
    ageGroups: ['yetiskin', 'ergen'], format: 'ev-odevi', duration: 'uzun', evidence: 'rkc',
    description: 'Haz/ustalık skorlu 7-günlük çizelge.',
  },

  // CFT + diğer
  { id: 'i-30', title: 'Yumuşak kalp imgelemi',
    modality: 'CFT', problems: ['öz-eleştiri'],
    ageGroups: ['yetiskin'], format: 'seans-ici', duration: 'kisa', evidence: 'vaka-serisi',
    description: 'Şefkatli renk + nefes pratiği — 5 dk.',
  },
  { id: 'i-31', title: 'Madde-spesifik tetikleyici haritası',
    modality: 'BDT', problems: ['madde'],
    ageGroups: ['yetiskin', 'ergen'], format: 'calisma-kagidi', duration: 'orta', evidence: 'klinik-kilavuz',
    description: 'Yer/kişi/zaman/duygu boyutunda haritalama + kaçınma planı.',
  },
  { id: 'i-32', title: 'Sıçramayı önleme planı',
    modality: 'BDT', problems: ['madde'],
    ageGroups: ['yetiskin', 'ergen'], format: 'ev-odevi', duration: 'orta', evidence: 'rkc',
    description: 'Marlatt RP modeli — high-risk + coping kart.',
  },

  // Çift
  { id: 'i-33', title: '"Bizim" rituali',
    modality: 'EFT', problems: ['çift', 'iletişim'],
    ageGroups: ['cift'], format: 'ev-odevi', duration: 'kisa', evidence: 'vaka-serisi',
    description: 'Haftalık 30 dk yapılandırılmış paylaşım — Gottman uyarlamalı.',
  },
  { id: 'i-34', title: 'Aktif dinleme egzersizi',
    modality: 'Sistemik', problems: ['çift', 'iletişim'],
    ageGroups: ['cift', 'yetiskin'], format: 'seans-ici', duration: 'orta', evidence: 'klinik-kilavuz',
    description: 'Konuşan-dinleyen rolleriyle yapısal değişim.', useCount: 7,
  },

  // Yas
  { id: 'i-35', title: 'Çift süreç modeli psikoeğitimi',
    modality: 'CFT', problems: ['yas'],
    ageGroups: ['yetiskin', 'ergen'], format: 'psikoegitim', duration: 'orta', evidence: 'klinik-kilavuz',
    description: 'Kayıp-odaklı ↔ restorasyon-odaklı salınım modeli.',
  },
  { id: 'i-36', title: 'Boş sandalye diyaloğu',
    modality: 'Şema', problems: ['yas', 'çatışma'],
    ageGroups: ['yetiskin'], format: 'seans-ici', duration: 'orta', evidence: 'vaka-serisi',
    description: 'Geştalt klasiği; Şema mod çalışmasıyla uyarlamalı.',
  },
];

const DEFAULT_RECENT_CLIENTS = [
  { id: '142', name: 'Elif Yıldız',  meta: 'ACT · sosyal kaygı' },
  { id: '138', name: 'Mert Karaca',  meta: 'BDT · OKB' },
  { id: '129', name: 'Selin Aydın',  meta: 'CFT · yas' },
  { id: '125', name: 'Burak Demir',  meta: 'EFT · çift' },
  { id: '212', name: 'Ela Korkmaz',  meta: 'Çocuk · okul reddi' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function matchesFilters(it: Intervention, f: NonNullable<MudahalePanelProps['filters']>): boolean {
  const q = (f.query ?? '').trim().toLowerCase();
  if (q) {
    const hay = (it.title + ' ' + it.description + ' ' + it.problems.join(' ')).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.modalities?.length && !f.modalities.includes(it.modality)) return false;
  if (f.problems?.length   && !f.problems.some((p) => it.problems.includes(p))) return false;
  if (f.ageGroups?.length  && !f.ageGroups.some((a) => it.ageGroups.includes(a))) return false;
  if (f.formats?.length    && !f.formats.includes(it.format)) return false;
  if (f.durations?.length  && !f.durations.includes(it.duration)) return false;
  if (f.evidence?.length   && !f.evidence.includes(it.evidence)) return false;
  return true;
}

function activeFilterCount(f: NonNullable<MudahalePanelProps['filters']>): number {
  return [
    f.modalities?.length, f.problems?.length, f.ageGroups?.length,
    f.formats?.length, f.durations?.length, f.evidence?.length,
  ].filter((n) => (n ?? 0) > 0).length + (f.query?.trim() ? 1 : 0);
}

function estimateMinutes(d: Duration): number {
  return d === 'kisa' ? 8 : d === 'orta' ? 18 : d === 'uzun' ? 35 : 50;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function MudahalePanel({
  interventions = DEFAULT_INTERVENTIONS,
  activeClient,
  recentClients = DEFAULT_RECENT_CLIENTS,
  filters: filtersProp,
  onChangeFilters,
  tab: tabProp,
  onChangeTab,
  basket: basketProp,
  onAddToBasket, onRemoveFromBasket, onReorderBasket,
  onToggleFavorite, onOpenDetail, onCreateNew,
  onCreateSessionPlan, onAssignToClient, onSavePersonalNotes,
  onExportPdf,
}: MudahalePanelProps) {
  const [filtersState, setFiltersState] = useState<NonNullable<MudahalePanelProps['filters']>>(filtersProp ?? {});
  const [tabState, setTabState]         = useState<MudahalePanelTab>(tabProp ?? 'all');
  const [basketState, setBasketState]   = useState<string[]>(basketProp ?? []);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [detailOpen, setDetailOpen]     = useState(false);
  const [assignFor,  setAssignFor]      = useState<string | null>(null);
  const [sort, setSort]                 = useState<'relevans' | 'ekol' | 'yas' | 'sure' | 'kanit'>('relevans');
  const [favorites, setFavorites]       = useState<Set<string>>(
    new Set(interventions.filter((i) => i.favorite).map((i) => i.id))
  );
  const [showFilters, setShowFilters]   = useState(true);

  useEffect(() => { if (filtersProp) setFiltersState(filtersProp); }, [filtersProp]);
  useEffect(() => { if (tabProp)     setTabState(tabProp);         }, [tabProp]);
  useEffect(() => { if (basketProp)  setBasketState(basketProp);   }, [basketProp]);

  const filters = filtersState;
  const tab     = tabState;
  const basket  = basketState;

  const setFilters = (next: NonNullable<MudahalePanelProps['filters']>) => {
    setFiltersState(next);
    onChangeFilters?.(next);
  };
  const setTab = (t: MudahalePanelTab) => {
    setTabState(t);
    onChangeTab?.(t);
  };

  const list = useMemo(() => {
    let xs = interventions.filter((it) => matchesFilters(it, filters));
    if (tab === 'favorites') xs = xs.filter((it) => favorites.has(it.id));
    if (tab === 'frequent')  xs = [...xs].sort((a, b) => (b.useCount ?? 0) - (a.useCount ?? 0));
    if (tab === 'evidence')  xs = [...xs].sort((a, b) => EVIDENCE_LABEL[b.evidence].stars - EVIDENCE_LABEL[a.evidence].stars);
    if (sort === 'ekol')     xs = [...xs].sort((a, b) => a.modality.localeCompare(b.modality));
    if (sort === 'yas')      xs = [...xs].sort((a, b) => (a.ageGroups[0] ?? '').localeCompare(b.ageGroups[0] ?? ''));
    if (sort === 'sure')     xs = [...xs].sort((a, b) => estimateMinutes(a.duration) - estimateMinutes(b.duration));
    if (sort === 'kanit')    xs = [...xs].sort((a, b) => EVIDENCE_LABEL[b.evidence].stars - EVIDENCE_LABEL[a.evidence].stars);
    return xs;
  }, [interventions, filters, tab, favorites, sort]);

  const selected = useMemo(
    () => interventions.find((i) => i.id === selectedId) ?? null,
    [interventions, selectedId]
  );

  // Basket helpers
  const inBasket = (id: string) => basket.includes(id);
  const addBasket = (id: string) => {
    if (inBasket(id)) return;
    const next = [...basket, id];
    setBasketState(next);
    onAddToBasket?.(id);
  };
  const removeBasket = (id: string) => {
    const next = basket.filter((x) => x !== id);
    setBasketState(next);
    onRemoveFromBasket?.(id);
  };
  const moveBasket = (idx: number, dir: -1 | 1) => {
    const next = [...basket];
    const tgt = idx + dir;
    if (tgt < 0 || tgt >= next.length) return;
    [next[idx], next[tgt]] = [next[tgt], next[idx]];
    setBasketState(next);
    onReorderBasket?.(next);
  };

  const toggleFav = (id: string) => {
    setFavorites((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    onToggleFavorite?.(id);
  };

  const updatePersonalNotes = useCallback((id: string, notes: string) => {
    onSavePersonalNotes?.(id, notes);
  }, [onSavePersonalNotes]);

  const totalBasketMin = basket
    .map((id) => interventions.find((i) => i.id === id))
    .filter(Boolean)
    .map((i) => estimateMinutes(i!.duration))
    .reduce((a, b) => a + b, 0);

  // Suggested interventions based on activeClient.formulation keywords
  const suggested = useMemo(() => {
    if (!activeClient?.formulation) return interventions.filter((i) => i.favorite).slice(0, 3);
    const k = activeClient.formulation.toLowerCase();
    return interventions
      .filter((i) =>
        i.problems.some((p) => k.includes(p.toLowerCase())) ||
        i.modality.toLowerCase() === (k.includes('act') ? 'act' : '__')
      )
      .slice(0, 3);
  }, [activeClient, interventions]);

  // Esc closes modal / sheet
  useEffect(() => {
    if (!detailOpen && !assignFor) return;
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailOpen(false);
        setAssignFor(null);
      }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [detailOpen, assignFor]);

  const filterCount = activeFilterCount(filters);

  return (
    <div className="mk" data-screen-label="09 Müdahale Kütüphanesi">
      {/* ── TOP BAR ────────────────────────────────────── */}
      <header className="mk-top">
        <div className="mk-top-left">
          <span className="mk-eyebrow">klinik · müdahale bankası</span>
          <h1 className="mk-title">
            <em>Müdahale</em> Kütüphanesi
          </h1>
        </div>

        <nav className="mk-tabs" role="tablist" aria-label="Sekmeler">
          {([
            { k: 'all',        l: 'Tümü' },
            { k: 'favorites',  l: 'Favorilerim' },
            { k: 'frequent',   l: 'Sık Kullanılan' },
            { k: 'evidence',   l: 'Kanıt Düzeyi' },
          ] as const).map((t) => (
            <button
              key={t.k} role="tab" type="button"
              aria-selected={tab === t.k}
              className={`mk-tab ${tab === t.k ? 'on' : ''}`}
              onClick={() => setTab(t.k)}
            >
              {t.l}
            </button>
          ))}
        </nav>

        <div className="mk-top-right">
          <button type="button" className="mk-btn mk-btn-ghost" onClick={onCreateNew}>
            <Plus size={13} strokeWidth={2} /> Yeni müdahale
          </button>
          <button
            type="button"
            className="mk-btn mk-btn-primary"
            disabled={basket.length === 0}
            onClick={() => onCreateSessionPlan?.(basket)}
          >
            <Sparkles size={13} strokeWidth={1.8} />
            Seans planı oluştur
            {basket.length > 0 && <span className="mk-btn-badge">{basket.length}</span>}
          </button>
        </div>
      </header>

      {/* ── FILTER BAR ──────────────────────────────────── */}
      <div className="mk-filterbar">
        <div className="mk-search">
          <Search size={15} strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Müdahale ara — başlık, açıklama, problem etiketi…"
            value={filters.query ?? ''}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          />
          {filters.query && (
            <button type="button" className="mk-search-clear" onClick={() => setFilters({ ...filters, query: '' })}>
              <X size={12} strokeWidth={2} />
            </button>
          )}
        </div>

        <button
          type="button"
          className={`mk-btn mk-btn-ghost mk-filter-toggle ${showFilters ? 'on' : ''}`}
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter size={13} strokeWidth={1.8} />
          Filtreler
          {filterCount > 0 && <span className="mk-filter-count">{filterCount}</span>}
        </button>

        <select
          className="mk-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
        >
          <option value="relevans">Sırala · Relevans</option>
          <option value="ekol">Ekol</option>
          <option value="yas">Yaş</option>
          <option value="sure">Süre</option>
          <option value="kanit">Kanıt</option>
        </select>
      </div>

      {showFilters && (
        <div className="mk-filters">
          <FilterRow label="Ekol" options={['BDT', 'ACT', 'EFT', 'CFT', 'EMDR', 'Şema', 'Sistemik', 'Diğer'] as Modality[]}
            value={filters.modalities ?? []}
            onChange={(v) => setFilters({ ...filters, modalities: v as Modality[] })}
          />
          <FilterRow label="Problem" options={ALL_PROBLEMS}
            value={filters.problems ?? []}
            onChange={(v) => setFilters({ ...filters, problems: v })}
            wrap
          />
          <FilterRow
            label="Yaş grubu"
            options={(['yetiskin', 'ergen', 'cocuk-7-11', 'cocuk-4-6', 'cift'] as AgeGroup[]).map((v) => ({ value: v, label: AGE_LABEL[v] }))}
            value={filters.ageGroups ?? []}
            onChange={(v) => setFilters({ ...filters, ageGroups: v as AgeGroup[] })}
          />
          <FilterRow
            label="Format"
            options={(['seans-ici', 'ev-odevi', 'psikoegitim', 'calisma-kagidi'] as Format[]).map((v) => ({ value: v, label: FORMAT_LABEL[v] }))}
            value={filters.formats ?? []}
            onChange={(v) => setFilters({ ...filters, formats: v as Format[] })}
          />
          <FilterRow
            label="Süre"
            options={(['kisa', 'orta', 'uzun', 'tam-seans'] as Duration[]).map((v) => ({ value: v, label: DURATION_LABEL[v] }))}
            value={filters.durations ?? []}
            onChange={(v) => setFilters({ ...filters, durations: v as Duration[] })}
          />
          <FilterRow
            label="Kanıt düzeyi"
            options={(['rkc', 'sistematik-review', 'klinik-kilavuz', 'vaka-serisi'] as Evidence[]).map((v) => ({ value: v, label: EVIDENCE_LABEL[v].l }))}
            value={filters.evidence ?? []}
            onChange={(v) => setFilters({ ...filters, evidence: v as Evidence[] })}
          />

          <div className="mk-filters-meta">
            <span className="mk-eyebrow">
              {filterCount > 0 ? `${filterCount} aktif filtre · ` : ''}
              {list.length} sonuç
            </span>
            {filterCount > 0 && (
              <button type="button" className="mk-text-btn" onClick={() => setFilters({})}>
                Filtreleri temizle
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN ────────────────────────────────────────── */}
      <div className="mk-main">
        {/* Cards grid */}
        <div className="mk-grid">
          {list.length === 0 ? (
            <div className="mk-empty">
              <p>Bu filtreyle eşleşen müdahale yok.</p>
              <button type="button" className="mk-btn mk-btn-ghost" onClick={() => setFilters({})}>
                Filtreleri sıfırla
              </button>
            </div>
          ) : list.map((it) => (
            <Card
              key={it.id}
              it={it}
              selected={selectedId === it.id}
              inBasket={inBasket(it.id)}
              favorite={favorites.has(it.id)}
              onSelect={() => setSelectedId(it.id)}
              onOpenDetail={() => { setSelectedId(it.id); setDetailOpen(true); onOpenDetail?.(it.id); }}
              onToggleBasket={() => inBasket(it.id) ? removeBasket(it.id) : addBasket(it.id)}
              onToggleFavorite={() => toggleFav(it.id)}
            />
          ))}
        </div>

        {/* Right side: detail OR basket */}
        <aside className="mk-side">
          {selected && !detailOpen ? (
            <DetailPane
              it={selected}
              inBasket={inBasket(selected.id)}
              favorite={favorites.has(selected.id)}
              onAddToBasket={() => addBasket(selected.id)}
              onToggleFavorite={() => toggleFav(selected.id)}
              onAssign={() => setAssignFor(selected.id)}
              onSaveNotes={(n) => updatePersonalNotes(selected.id, n)}
              onClose={() => setSelectedId(null)}
              onOpenFull={() => setDetailOpen(true)}
            />
          ) : (
            <BasketPane
              basket={basket}
              interventions={interventions}
              totalMin={totalBasketMin}
              suggested={suggested}
              activeClient={activeClient}
              onRemove={removeBasket}
              onMove={moveBasket}
              onCreatePlan={() => onCreateSessionPlan?.(basket)}
              onAssign={(id) => setAssignFor(id)}
              onSelectSuggested={(id) => setSelectedId(id)}
            />
          )}
        </aside>
      </div>

      {/* ── DETAIL MODAL ────────────────────────────────── */}
      {selected && (
        <MudahaleDetayModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          id={selected.id}
          title={selected.title}
          modality={selected.modality}
          evidence={selected.evidence}
          short={selected.description}
          problems={selected.problems}
          durationMin={selected.durationMinutes ?? 15}
          favorite={favorites.has(selected.id)}
          protocol={selected.protocol?.map((step, i) =>
            typeof step === 'string'
              ? { num: String(i + 1).padStart(2, '0'), title: step, body: step }
              : step as any
          )}
          contraindications={selected.contraindications}
          materials={selected.materials}
          variants={selected.variants?.map((v) => ({
            id:    `${selected.id}-v${v.age}`,
            group: (v.age === 'yetiskin' ? 'yetişkin'
                  : v.age === 'ergen'    ? 'ergen'
                  : v.age === 'cocuk-7-11' || v.age === 'cocuk-4-6' ? 'çocuk'
                  : v.age === 'cift'     ? 'çift'
                  : 'yetişkin') as 'yetişkin'|'ergen'|'çocuk'|'çift'|'grup',
            label: v.label,
            body:  v.notes,
          }))}
          personalNotes={selected.personalNotes}
          references={selected.references?.map((r) => ({
            title:   r.title,
            authors: '',
            year:    0,
            doi:     r.doi,
            url:     r.url,
          }))}
          onSavePersonalNotes={(text) => updatePersonalNotes(selected.id, text)}
          onToggleFavorite={() => toggleFav(selected.id)}
          onAddToBasket={() => addBasket(selected.id)}
          onAssignToClient={() => setAssignFor(selected.id)}
          onExportPdf={() => onExportPdf?.(selected.id)}
        />
      )}

      {/* ── ASSIGN SHEET ────────────────────────────────── */}
      {assignFor && (
        <AssignSheet
          it={interventions.find((i) => i.id === assignFor)!}
          recentClients={recentClients}
          onClose={() => setAssignFor(null)}
          onAssign={(target) => {
            onAssignToClient?.(assignFor, target);
            setAssignFor(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────

function Card({
  it, selected, inBasket, favorite,
  onSelect, onOpenDetail, onToggleBasket, onToggleFavorite,
}: {
  it: Intervention;
  selected: boolean;
  inBasket: boolean;
  favorite: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
  onToggleBasket: () => void;
  onToggleFavorite: () => void;
}) {
  const ev = EVIDENCE_LABEL[it.evidence];
  return (
    <article className={`mk-card ${selected ? 'sel' : ''}`} onClick={onSelect}>
      <header className="mk-card-head">
        <span className={`mk-pill m-${MODALITY_TONE[it.modality]}`}>{it.modality}</span>
        <button
          type="button" className={`mk-fav ${favorite ? 'on' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          aria-label={favorite ? 'Favoriden çıkar' : 'Favorilere ekle'}
        >
          {favorite ? <Heart size={13} strokeWidth={2} fill="currentColor" /> : <Heart size={13} strokeWidth={1.8} />}
        </button>
      </header>
      <h3 className="mk-card-title">{it.title}</h3>
      <p className="mk-card-desc">{it.description}</p>
      <div className="mk-card-tags">
        {it.problems.slice(0, 3).map((p) => (
          <span key={p} className="mk-tag">{p}</span>
        ))}
      </div>
      <footer className="mk-card-foot">
        <span className="mk-meta"><Clock size={11} strokeWidth={1.8} />{DURATION_LABEL[it.duration]}</span>
        <span className="mk-meta"><FileText size={11} strokeWidth={1.8} />{FORMAT_LABEL[it.format]}</span>
        <Stars n={ev.stars} title={ev.l} />
        <button
          type="button"
          className={`mk-add ${inBasket ? 'in' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleBasket(); }}
          aria-label={inBasket ? 'Sepetten çıkar' : 'Sepete ekle'}
          aria-pressed={inBasket}
        >
          <Plus size={13} strokeWidth={2} />
        </button>
      </footer>
      <button type="button" className="mk-card-detail" onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}>
        Detayı aç <ArrowRight size={11} strokeWidth={1.8} />
      </button>
    </article>
  );
}

function Stars({ n, title }: { n: 2 | 3 | 4 | 5; title: string }) {
  return (
    <span className="mk-stars" title={title} aria-label={`${title} — ${n} yıldız`}>
      {[1, 2, 3, 4, 5].map((i) => (
        i <= n
          ? <Star  key={i} size={10} strokeWidth={1.8} fill="currentColor" />
          : <StarOff key={i} size={10} strokeWidth={1.8} />
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Filter row
// ─────────────────────────────────────────────────────────────────────────

function FilterRow({
  label, options, value, onChange, wrap,
}: {
  label: string;
  options: (string | { value: string; label: string })[];
  value: string[];
  onChange: (next: string[]) => void;
  wrap?: boolean;
}) {
  const opts = options.map((o) => typeof o === 'string' ? { value: o, label: o } : o);
  return (
    <div className={`mk-filter-row ${wrap ? 'wrap' : ''}`}>
      <span className="mk-filter-label">{label}</span>
      <div className="mk-filter-opts">
        {opts.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className={`mk-opt ${on ? 'on' : ''}`}
              onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Basket pane (right side — no selection)
// ─────────────────────────────────────────────────────────────────────────

function BasketPane({
  basket, interventions, totalMin, suggested, activeClient,
  onRemove, onMove, onCreatePlan, onAssign, onSelectSuggested,
}: {
  basket: string[];
  interventions: Intervention[];
  totalMin: number;
  suggested: Intervention[];
  activeClient?: { id: string; name: string; age?: number };
  onRemove: (id: string) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
  onCreatePlan: () => void;
  onAssign: (id: string) => void;
  onSelectSuggested: (id: string) => void;
}) {
  if (basket.length === 0) {
    return (
      <div className="mk-side-body">
        <SideCard
          title="Seans planı sepeti"
          eyebrow={`boş${activeClient ? ` · ${activeClient.name}` : ''}`}
        >
          <p className="mk-empty-note">
            Müdahale kartlarında <strong>+</strong> ikonuna tıklayarak ekleyin.
            Sıralama, süre toplama ve danışana atama buradan yapılır.
          </p>
        </SideCard>

        <SideCard title="Önerilen müdahaleler" eyebrow={activeClient ? 'aktif vaka' : 'favoriler'} tone="accent">
          {suggested.map((s) => (
            <button
              key={s.id} type="button"
              className="mk-suggest"
              onClick={() => onSelectSuggested(s.id)}
            >
              <div>
                <strong>{s.title}</strong>
                <span>{s.modality} · {DURATION_LABEL[s.duration]}</span>
              </div>
              <ArrowRight size={12} strokeWidth={1.8} />
            </button>
          ))}
        </SideCard>
      </div>
    );
  }

  return (
    <div className="mk-side-body">
      <SideCard
        title="Seans planı sepeti"
        eyebrow={`${basket.length} müdahale · ${totalMin} dk`}
      >
        <ol className="mk-basket">
          {basket.map((id, i) => {
            const it = interventions.find((x) => x.id === id);
            if (!it) return null;
            return (
              <li key={id}>
                <span className="mk-basket-grip"><GripVertical size={12} strokeWidth={1.6} /></span>
                <span className="mk-basket-ix">{i + 1}.</span>
                <div className="mk-basket-body">
                  <strong>{it.title}</strong>
                  <span>{it.modality} · {DURATION_LABEL[it.duration]}</span>
                </div>
                <div className="mk-basket-actions">
                  <button type="button" className="mk-icon-btn sm" aria-label="Yukarı" disabled={i === 0} onClick={() => onMove(i, -1)}>
                    <ArrowUp size={12} strokeWidth={1.8} />
                  </button>
                  <button type="button" className="mk-icon-btn sm" aria-label="Aşağı" disabled={i === basket.length - 1} onClick={() => onMove(i, 1)}>
                    <ArrowDown size={12} strokeWidth={1.8} />
                  </button>
                  <button type="button" className="mk-icon-btn sm" aria-label="Çıkar" onClick={() => onRemove(id)}>
                    <Trash2 size={12} strokeWidth={1.8} />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mk-basket-total">
          <span className="mk-eyebrow">toplam süre</span>
          <strong>{totalMin}<em>dk</em></strong>
        </div>
        <div className="mk-basket-actions-foot">
          <button type="button" className="mk-btn mk-btn-primary mk-btn-block" onClick={onCreatePlan}>
            <Sparkles size={13} strokeWidth={1.8} /> Bu planı kaydet
            <ArrowRight size={12} strokeWidth={1.8} className="mk-btn-arrow" />
          </button>
          <button type="button" className="mk-btn mk-btn-ghost mk-btn-block" onClick={() => onAssign(basket[0])}>
            <Users size={13} strokeWidth={1.8} /> Danışana ata
          </button>
        </div>
      </SideCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Detail pane (right side — single selection)
// ─────────────────────────────────────────────────────────────────────────

function DetailPane({
  it, inBasket, favorite,
  onAddToBasket, onToggleFavorite, onAssign, onSaveNotes, onClose, onOpenFull,
}: {
  it: Intervention;
  inBasket: boolean;
  favorite: boolean;
  onAddToBasket: () => void;
  onToggleFavorite: () => void;
  onAssign: () => void;
  onSaveNotes: (notes: string) => void;
  onClose: () => void;
  onOpenFull: () => void;
}) {
  const [notes, setNotes] = useState(it.personalNotes ?? '');
  useEffect(() => { setNotes(it.personalNotes ?? ''); }, [it.id, it.personalNotes]);

  return (
    <div className="mk-side-body">
      <div className="mk-detail-head">
        <div>
          <span className={`mk-pill m-${MODALITY_TONE[it.modality]}`}>{it.modality}</span>
          <h2 className="mk-detail-title">{it.title}</h2>
        </div>
        <div className="mk-detail-actions">
          <button type="button" className={`mk-icon-btn ${favorite ? 'fav' : ''}`} aria-label="Favori" onClick={onToggleFavorite}>
            <Heart size={14} strokeWidth={1.8} fill={favorite ? 'currentColor' : 'none'} />
          </button>
          <button type="button" className="mk-icon-btn" aria-label="Kapat" onClick={onClose}>
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="mk-detail-meta">
        <span className="mk-meta"><Clock size={11} strokeWidth={1.8} />{DURATION_LABEL[it.duration]}</span>
        <span className="mk-meta"><FileText size={11} strokeWidth={1.8} />{FORMAT_LABEL[it.format]}</span>
        <Stars n={EVIDENCE_LABEL[it.evidence].stars} title={EVIDENCE_LABEL[it.evidence].l} />
      </div>

      <div className="mk-detail-tags">
        {it.problems.map((p) => <span key={p} className="mk-tag">{p}</span>)}
      </div>

      <p className="mk-detail-desc"><em>"{it.description}"</em></p>

      {it.protocol && it.protocol.length > 0 && (
        <Block title="Protokol">
          <ol className="mk-num-list">
            {it.protocol.map((p, i) => <li key={i}>{p}</li>)}
          </ol>
        </Block>
      )}

      {it.materials && it.materials.length > 0 && (
        <Block title="Materyal">
          <ul className="mk-bullet">
            {it.materials.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </Block>
      )}

      {it.contraindications && it.contraindications.length > 0 && (
        <div className="mk-warn">
          <AlertTriangle size={13} strokeWidth={2} />
          <div>
            <strong>Kontrendikasyonlar</strong>
            <ul>{it.contraindications.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
        </div>
      )}

      <Block title="Klinik notlarım">
        <textarea
          className="mk-textarea italic"
          rows={4}
          value={notes}
          placeholder='"Bu danışanda yararlı çıktı; ev ödevi kısmı zorladı…"'
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onSaveNotes(notes)}
        />
      </Block>

      {it.usageHistory && it.usageHistory.length > 0 && (
        <Block title="Kullanım geçmişi">
          <ul className="mk-history">
            {it.usageHistory.slice(0, 5).map((h, i) => (
              <li key={i}>
                <span>
                  <strong>{h.clientName}</strong>
                  <span className="mk-history-date">{h.date}</span>
                </span>
                <span className={`mk-outcome o-${h.outcome}`}>
                  {h.outcome === 'yararli' ? 'yararlı' : h.outcome === 'notr' ? 'nötr' : 'yararsız'}
                </span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      <div className="mk-detail-foot">
        <button type="button" className="mk-btn mk-btn-primary mk-btn-block" onClick={onAddToBasket} disabled={inBasket}>
          {inBasket ? <><Plus size={13} strokeWidth={2} /> Sepette</> : <><Plus size={13} strokeWidth={2} /> Seans planına ekle</>}
        </button>
        <button type="button" className="mk-btn mk-btn-ghost mk-btn-block" onClick={onAssign}>
          <Users size={13} strokeWidth={1.8} /> Danışana ata
        </button>
        <button type="button" className="mk-text-btn mk-detail-open" onClick={onOpenFull}>
          Tam ekran aç <ArrowRight size={11} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mk-block">
      <span className="mk-eyebrow">{title}</span>
      {children}
    </section>
  );
}

function SideCard({
  title, eyebrow, tone, children,
}: { title: string; eyebrow?: string; tone?: 'accent' | 'warn'; children: ReactNode }) {
  return (
    <section className={`mk-side-card t-${tone ?? 'ink'}`}>
      <header>
        {eyebrow && <span className="mk-eyebrow">{eyebrow}</span>}
        <h3>{title}</h3>
      </header>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Detail modal (fullscreen)
// ─────────────────────────────────────────────────────────────────────────

type DetailTab = 'protokol' | 'materyal' | 'kanit';

function DetailModal({
  it, favorite,
  onClose, onToggleFavorite, onAddToBasket, onAssign, onExportPdf, onSaveNotes,
}: {
  it: Intervention;
  favorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onAddToBasket: () => void;
  onAssign: () => void;
  onExportPdf: () => void;
  onSaveNotes: (notes: string) => void;
}) {
  const [tab, setTab] = useState<DetailTab>('protokol');
  const [notes, setNotes] = useState(it.personalNotes ?? '');
  useEffect(() => { setNotes(it.personalNotes ?? ''); }, [it.id]);

  return (
    <div className="mk-overlay" role="dialog" aria-modal="true" aria-label={it.title}>
      <button type="button" className="mk-overlay-scrim" aria-label="Kapat" onClick={onClose} />
      <div className="mk-modal">
        <header className="mk-modal-head">
          <div>
            <div className="mk-modal-eyebrow">
              <span className={`mk-pill m-${MODALITY_TONE[it.modality]}`}>{it.modality}</span>
              <Stars n={EVIDENCE_LABEL[it.evidence].stars} title={EVIDENCE_LABEL[it.evidence].l} />
              <span className="mk-eyebrow">{EVIDENCE_LABEL[it.evidence].l}</span>
            </div>
            <h2 className="mk-modal-title">{it.title}</h2>
            <div className="mk-modal-tags">
              {it.problems.map((p) => <span key={p} className="mk-tag">{p}</span>)}
            </div>
          </div>
          <div className="mk-modal-actions">
            <button type="button" className={`mk-icon-btn ${favorite ? 'fav' : ''}`} aria-label="Favori" onClick={onToggleFavorite}>
              <Heart size={15} strokeWidth={1.8} fill={favorite ? 'currentColor' : 'none'} />
            </button>
            <button type="button" className="mk-icon-btn" aria-label="Kapat" onClick={onClose}>
              <X size={15} strokeWidth={1.8} />
            </button>
          </div>
        </header>

        <nav className="mk-modal-tabs" role="tablist">
          {([
            { k: 'protokol' as const, l: 'Protokol' },
            { k: 'materyal' as const, l: 'Materyal & Adaptasyon' },
            { k: 'kanit'    as const, l: 'Kullanım & Kanıt' },
          ]).map((t) => (
            <button
              key={t.k} role="tab" type="button"
              aria-selected={tab === t.k}
              className={`mk-modal-tab ${tab === t.k ? 'on' : ''}`}
              onClick={() => setTab(t.k)}
            >
              {t.l}
            </button>
          ))}
        </nav>

        <div className="mk-modal-body">
          {tab === 'protokol' && (
            <>
              <p className="mk-modal-desc">"{it.description}"</p>
              {it.protocol && it.protocol.length > 0 ? (
                <Block title="Adımlar"><ol className="mk-num-list lg">{it.protocol.map((p, i) => <li key={i}>{p}</li>)}</ol></Block>
              ) : <p className="mk-empty-note">Protokol henüz girilmemiş.</p>}
              {it.contraindications && it.contraindications.length > 0 && (
                <div className="mk-warn">
                  <AlertTriangle size={14} strokeWidth={2} />
                  <div>
                    <strong>Kontrendikasyonlar</strong>
                    <ul>{it.contraindications.map((c, i) => <li key={i}>{c}</li>)}</ul>
                  </div>
                </div>
              )}
            </>
          )}
          {tab === 'materyal' && (
            <>
              {it.materials && it.materials.length > 0 && (
                <Block title="Materyal"><ul className="mk-bullet">{it.materials.map((m, i) => <li key={i}>{m}</li>)}</ul></Block>
              )}
              {it.variants && it.variants.length > 0 && (
                <Block title="Varyantlar">
                  <ul className="mk-variants">
                    {it.variants.map((v, i) => (
                      <li key={i}>
                        <span className="mk-variant-label">{v.label}</span>
                        <span className="mk-variant-age">{AGE_LABEL[v.age]}</span>
                        <p>{v.notes}</p>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}
              <Block title="Klinik notlarım">
                <textarea
                  className="mk-textarea italic"
                  rows={6}
                  value={notes}
                  placeholder='"Bu danışanda yararlı çıktı; ev ödevi kısmı zorladı…"'
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => onSaveNotes(notes)}
                />
              </Block>
            </>
          )}
          {tab === 'kanit' && (
            <>
              {it.usageHistory && it.usageHistory.length > 0 && (
                <Block title="Bu klinikteki kullanım">
                  <ul className="mk-history">
                    {it.usageHistory.map((h, i) => (
                      <li key={i}>
                        <span>
                          <strong>{h.clientName}</strong>
                          <span className="mk-history-date">{h.date}</span>
                          {h.note && <span className="mk-history-note">— {h.note}</span>}
                        </span>
                        <span className={`mk-outcome o-${h.outcome}`}>
                          {h.outcome === 'yararli' ? 'yararlı' : h.outcome === 'notr' ? 'nötr' : 'yararsız'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}
              {it.references && it.references.length > 0 && (
                <Block title="Kaynaklar">
                  <ul className="mk-refs">
                    {it.references.map((r, i) => (
                      <li key={i}>
                        <BookOpen size={12} strokeWidth={1.8} />
                        <a href={r.url ?? `https://doi.org/${r.doi}`} target="_blank" rel="noopener noreferrer">
                          {r.title}
                          <ExternalLink size={11} strokeWidth={1.8} />
                        </a>
                        {r.doi && <span className="mk-doi">{r.doi}</span>}
                      </li>
                    ))}
                  </ul>
                </Block>
              )}
            </>
          )}
        </div>

        <footer className="mk-modal-foot">
          <button type="button" className="mk-btn mk-btn-ghost" onClick={onExportPdf}>
            <FileDown size={13} strokeWidth={1.8} /> PDF al
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="mk-btn mk-btn-ghost" onClick={onAssign}>
              <Users size={13} strokeWidth={1.8} /> Danışana ata
            </button>
            <button type="button" className="mk-btn mk-btn-primary" onClick={onAddToBasket}>
              <Plus size={13} strokeWidth={2} /> Seans planına ekle
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Assign sheet (right slide)
// ─────────────────────────────────────────────────────────────────────────

function AssignSheet({
  it, recentClients, onClose, onAssign,
}: {
  it: Intervention;
  recentClients: { id: string; name: string; meta?: string }[];
  onClose: () => void;
  onAssign: (target: AssignTarget) => void;
}) {
  const [query, setQuery]   = useState('');
  const [picked, setPicked] = useState<typeof recentClients[number] | null>(null);
  const [when, setWhen]     = useState<AssignTarget['when']>('sonraki-seans');
  const [date, setDate]     = useState('');
  const [duration, setDuration] = useState(estimateMinutes(it.duration));
  const [asHomework, setAsHomework] = useState(it.format === 'ev-odevi');
  const [note, setNote]     = useState('');

  const filtered = useMemo(
    () => recentClients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [recentClients, query]
  );

  const canAssign = !!picked;

  return (
    <div className="mk-overlay" role="dialog" aria-modal="true" aria-label="Danışana ata">
      <button type="button" className="mk-overlay-scrim" aria-label="Kapat" onClick={onClose} />
      <aside className="mk-sheet">
        <header className="mk-sheet-head">
          <div>
            <span className="mk-eyebrow">danışana ata</span>
            <h2>{it.title}</h2>
          </div>
          <button type="button" className="mk-icon-btn" aria-label="Kapat" onClick={onClose}>
            <X size={15} strokeWidth={1.8} />
          </button>
        </header>

        <div className="mk-sheet-body">
          <div className="mk-sheet-section">
            <span className="mk-eyebrow">danışan</span>
            <div className="mk-search">
              <Search size={14} strokeWidth={1.8} />
              <input
                type="text" placeholder="İsim ara…"
                value={query} onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <ul className="mk-client-list">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`mk-client ${picked?.id === c.id ? 'on' : ''}`}
                    onClick={() => setPicked(c)}
                  >
                    <strong>{c.name}</strong>
                    {c.meta && <span>{c.meta}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {picked && (
            <>
              <div className="mk-sheet-section">
                <span className="mk-eyebrow">ne zaman</span>
                <div className="mk-segment">
                  {([
                    { v: 'bugun',          l: 'Bugün' },
                    { v: 'sonraki-seans',  l: 'Sonraki seans' },
                    { v: 'tarih',          l: 'Belirli tarih' },
                  ] as const).map((o) => (
                    <button
                      key={o.v} type="button"
                      className={`mk-segment-btn ${when === o.v ? 'on' : ''}`}
                      onClick={() => setWhen(o.v)}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
                {when === 'tarih' && (
                  <input
                    type="text" className="mk-input"
                    placeholder="2026.05.30"
                    value={date} onChange={(e) => setDate(e.target.value)}
                  />
                )}
              </div>

              <div className="mk-sheet-section">
                <span className="mk-eyebrow">süre tahmini</span>
                <div className="mk-duration">
                  <input
                    type="number" className="mk-input"
                    value={duration} min={5} max={180} step={5}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                  <span className="mk-eyebrow">dakika</span>
                </div>
              </div>

              {(it.format === 'ev-odevi' || it.format === 'calisma-kagidi') && (
                <div className="mk-sheet-section row">
                  <label className="mk-checkbox">
                    <input type="checkbox" checked={asHomework} onChange={(e) => setAsHomework(e.target.checked)} />
                    <span>Ödev olarak gönder</span>
                  </label>
                </div>
              )}

              <div className="mk-sheet-section">
                <span className="mk-eyebrow">not bırak</span>
                <textarea
                  className="mk-textarea italic" rows={3}
                  value={note}
                  placeholder='"Bu hafta sadece 1. ve 2. adımı dene; üç gün ara ver."'
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <footer className="mk-sheet-foot">
          <button type="button" className="mk-btn mk-btn-ghost" onClick={onClose}>İptal</button>
          <button
            type="button" className="mk-btn mk-btn-primary"
            disabled={!canAssign}
            onClick={() => picked && onAssign({
              clientId: picked.id,
              when, date: when === 'tarih' ? date : undefined,
              durationMinutes: duration,
              asHomework, note,
            })}
          >
            <CalendarIcon size={13} strokeWidth={1.8} /> Ata
            <ArrowRight size={12} strokeWidth={1.8} />
          </button>
        </footer>
      </aside>
    </div>
  );
}
