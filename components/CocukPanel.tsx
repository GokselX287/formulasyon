'use client';

import { useMemo, useState, useEffect, useCallback, type ReactNode, type ChangeEvent } from 'react';
import {
  ArrowLeft, ArrowRight, Check, MoreHorizontal, FileDown, Share2, Trash2,
  Save, AlertTriangle, ShieldAlert, ChevronRight, ChevronLeft,
  Plus, X, FileText, Users as UsersIcon, Phone,
  User, Home, Baby, GraduationCap, MessageSquare, Activity,
  Puzzle, Brain, ClipboardList, Heart, Target,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

export type CocukSection =
  | 'demografik' | 'aile' | 'gelisim' | 'okul' | 'yakinma'
  | 'davranis'   | 'oyun' | 'cbt'    | 'klinik' | 'veli' | 'risk' | 'hedefler';

export type YasBandi = '0-3' | '4-6' | '7-11' | '12-17';
export type RiskLevel = 'izleme' | 'orta' | 'acil';
export type ParentKey = 'anne' | 'baba';

export type AbuseFlag = {
  fiziksel?: boolean;
  cinsel?:   boolean;
  duygusal?: boolean;
  ihmal?:    boolean;
};

export type VeliData = {
  tarih?: string;
  guclu?: string;
  endise?: string;
  son6Ay?: string;
  tarz?: 'otoriter' | 'demokratik' | 'izin-verici' | 'ihmalkar';
  stres?: string[];
  sosyalDestek?: { var?: boolean; kaynak?: string };
};

export type CocukData = {
  demografik?: {
    adSoyad?: string; yas?: number; cinsiyet?: string; sinif?: string;
    okul?: string; ogretmen?: string;
    kardesSayisi?: number; kardesSira?: string;
    evlatEdinme?: boolean; evlatNot?: string;
  };
  aile?: {
    anne?: { ad?: string; yas?: number; is?: string; egitim?: string; saglik?: string };
    baba?: { ad?: string; yas?: number; is?: string; egitim?: string; saglik?: string };
    birlikte?: boolean;
    ayrilikTarihi?: string;
    ziyaretDuzeni?: string;
    genogram?: string;
    birincilBakim?: string;
  };
  gelisim?: {
    gebelik?: string; dogum?: string; agirlik?: string;
    bebeklik?: string; motor?: string; dil?: string;
    tuvalet?: string; uyku?: string; yeme?: string;
  };
  okul?: {
    matematik?: number; turkce?: number; diger?: number;
    disiplin?: 'yok' | 'az' | 'sik';
    akran?: 'yalniz' | 'azinlik' | 'takim' | 'populer';
    ogretmen?: string;
    devamsizlik?: number;
    devamsizlikSebep?: string;
    rehberlikRaporu?: boolean;
  };
  yakinma?: {
    metin?: string;
    farkEden?: ('anne' | 'baba' | 'ogretmen' | 'cocuk')[];
    baslangic?: string;
    tetikleyici?: string;
    cocukFarkindalik?: number;     // 0-5
    aileFarkindalik?: number;
    oncekiYardim?: string;
  };
  davranis?: {
    anksiyete?: 0 | 1 | 2;
    depresyon?: 0 | 1 | 2;
    somatik?:   0 | 1 | 2;
    geriCekilme?: 0 | 1 | 2;
    agresyon?:  0 | 1 | 2;
    kuralIhlali?: 0 | 1 | 2;
    dikkat?:    0 | 1 | 2;
    sosyal?:    0 | 1 | 2;
    dusunce?:   0 | 1 | 2;
  };
  oyunNotu?:   string;
  cbtNotu?:    string;
  klinikNotu?: string;
  veli?: { anne?: VeliData; baba?: VeliData };
  risk?: {
    kendineZarar?: 'yok' | 'fikir' | 'davranis' | 'aktif';
    intihar?:      'yok' | 'fikir' | 'plan';
    abuse?:        AbuseFlag;
    aileSiddeti?:  boolean;
    seviye?:       RiskLevel;
    notu?:         string;
  };
  hedefler?: {
    hedefler3?: string[];
    mudahaleler?: ('oyun' | 'aile' | 'okul' | 'emdr')[];
    frekans?: 'haftalik' | 'iki-haftalik' | 'aylik';
    sure?:    'kisa' | 'orta' | 'uzun';
  };
};

export type CocukPanelProps = {
  client?: {
    id: string; name: string; age: number;
    issue?: string; sinif?: string; okul?: string;
  };
  data?: CocukData;
  activeSection?: CocukSection;
  onChangeSection?: (s: CocukSection) => void;
  onChange?: <K extends keyof CocukData>(section: K, value: CocukData[K]) => void;
  lastSavedAt?: string;
  yasBandi?: YasBandi;
  onChangeYasBandi?: (y: YasBandi) => void;

  oyunSlot?:   ReactNode;
  cbtSlot?:    ReactNode;
  klinikSlot?: ReactNode;

  onScheduleParentInterview?: (parent: ParentKey) => void;
  onOpenAbuseProtocol?:       () => void;
  onCallEmergency?:           () => void;
  onSwitchToAdultFlow?:       () => void;
  onProceedToTreatmentPlan?:  () => void;

  onExportParentPdf?:    () => void;
  onExportSchoolReport?: () => void;
  onExportPdf?: () => void;
  onShare?:     () => void;
  onDelete?:    () => void;
};

// ─── Section metadata ─────────────────────────────────────────────────────

const SECTIONS: {
  key:   CocukSection;
  title: string;
  short: string;
  icon:  typeof User;
  required?: boolean;
}[] = [
  { key: 'demografik', title: 'Demografik Bilgiler',         short: 'Demografik', icon: User },
  { key: 'aile',       title: 'Aile Sistemi',                short: 'Aile',       icon: Home },
  { key: 'gelisim',    title: 'Gelişim Öyküsü',              short: 'Gelişim',    icon: Baby },
  { key: 'okul',       title: 'Okul ve Akademik',            short: 'Okul',       icon: GraduationCap },
  { key: 'yakinma',    title: 'Mevcut Yakınma',              short: 'Yakınma',    icon: MessageSquare },
  { key: 'davranis',   title: 'Davranış Değerlendirmesi',    short: 'Davranış',   icon: Activity },
  { key: 'oyun',       title: 'Oyun Değerlendirmesi',        short: 'Oyun',       icon: Puzzle },
  { key: 'cbt',        title: 'Çocuk BDT Formu',             short: 'BDT',        icon: Brain },
  { key: 'klinik',     title: 'Geniş Klinik Değerlendirme',  short: 'Klinik',     icon: ClipboardList },
  { key: 'veli',       title: 'Veli Görüşmesi',              short: 'Veli',       icon: Heart },
  { key: 'risk',       title: 'Risk Değerlendirmesi',        short: 'Risk',       icon: ShieldAlert, required: true },
  { key: 'hedefler',   title: 'Hedefler ve Eğitim Planı',    short: 'Hedefler',   icon: Target },
];

const YAS_BANDLARI: { k: YasBandi; l: string; sub: string; range: [number, number] }[] = [
  { k: '0-3',   l: 'Bebeklik',    sub: '0-3 yaş',   range: [0, 3]   },
  { k: '4-6',   l: 'Okul öncesi', sub: '4-6 yaş',   range: [4, 6]   },
  { k: '7-11',  l: 'Latency',     sub: '7-11 yaş',  range: [7, 11]  },
  { k: '12-17', l: 'Ergenlik',    sub: '12-17 yaş', range: [12, 17] },
];

function autoYasBandi(age: number): YasBandi {
  return YAS_BANDLARI.find((b) => age >= b.range[0] && age <= b.range[1])?.k ?? '7-11';
}

const YAS_BAND_INFO: Record<YasBandi, { headline: string; copy: string }> = {
  '0-3': {
    headline: 'Bağlanma + duyusal entegrasyon',
    copy:
      'Bu yaş bandında değerlendirme büyük ölçüde gözlem + ebeveyn ' +
      'aktarımıyla yapılır. Bağlanma örüntüsü, ayrılık tepkisi, uyku ' +
      'düzeni ve beslenme öne çıkar.',
  },
  '4-6': {
    headline: 'Sembolik oyun + öz-düzenleme',
    copy:
      'Oyun yoluyla değerlendirme uygun. Dürtü kontrolü, kural anlama, ' +
      'duygu kelime dağarcığı ve sosyal etkileşim önemli göstergeler.',
  },
  '7-11': {
    headline: 'Yapısal yetkinlik · akran ilişkileri',
    copy:
      'Yapılandırılmış görüşme + çizim/oyun karması iyi sonuç verir. ' +
      'Okul performansı, kuralcılık, "iyi öğrenci" baskısı sık görülür.',
  },
  '12-17': {
    headline: 'Kimlik · özerklik · akran kümeleri',
    copy:
      'Yetişkin görüşmesine daha yakın. Gizlilik kuralları net konuşulmalı; ' +
      'risk değerlendirmesinde intihar düşüncesi sorgulamasına geçilir.',
  },
};

// ─── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_CLIENT = {
  id: '212', name: 'Ela Korkmaz', age: 11,
  issue: 'Okul reddi · 4. sınıf', sinif: '5. sınıf', okul: 'Mevlana İO',
};

const DEFAULT_DATA: CocukData = {
  demografik: {
    adSoyad: 'Ela Korkmaz', yas: 11, cinsiyet: 'Kız',
    sinif: '5. sınıf', okul: 'Mevlana İlkokulu', ogretmen: 'Banu Hanım',
    kardesSayisi: 1, kardesSira: 'Büyük', evlatEdinme: false,
  },
  aile: {
    anne: { ad: 'Pınar K.', yas: 39, is: 'Muhasebeci', egitim: 'Lisans', saglik: 'Normal' },
    baba: { ad: 'Tolga K.', yas: 42, is: 'Mühendis',    egitim: 'Yüksek lisans', saglik: 'Normal' },
    birlikte: false,
    ayrilikTarihi: '2024 Mart',
    ziyaretDuzeni: '2 haftada bir, hafta sonu baba evinde',
    genogram: 'Anne ailesi 3 nesil İstanbul, baba ailesi Eskişehir kökenli. Anneanne (68) yakın.',
    birincilBakim: 'Anne · hafta içi tam',
  },
  gelisim: {
    gebelik: 'Komplikasyonsuz', dogum: 'Normal · 39. hafta', agirlik: '3.2 kg',
    bebeklik: 'Anne sütü 8 ay, sakin bebeklik',
    motor: 'Oturma 6 ay, yürüme 13 ay, koşma 22 ay — yaşa uygun',
    dil: 'İlk kelime 11 ay, 2 kelime 20 ay, akıcı 3 yaş — hızlı',
    tuvalet: '2.5 yaş, sorunsuz',
    uyku: 'Son 8 ayda dalış güçlüğü; gece 1-2 kez uyanma',
    yeme: 'Sebzeye seçici; öğün miktarı düşük',
  },
  okul: {
    matematik: 4, turkce: 5, diger: 4,
    disiplin: 'yok',
    akran: 'yalniz',
    ogretmen: '"Ela çok zeki ama son aylarda derslerde sessizleşti. Teneffüse çıkmıyor."',
    devamsizlik: 8,
    devamsizlikSebep: 'Karın ağrısı şikayetiyle anneden devamsızlık talebi',
    rehberlikRaporu: false,
  },
  yakinma: {
    metin: 'Son 4 aydır okul sabahları karın ağrısı, ağlama, gitmek istememe. Hafta sonları sosyal hayatı azaldı.',
    farkEden: ['anne', 'ogretmen'],
    baslangic: '2026 Ocak — sınıf değişikliği sonrası',
    tetikleyici: 'Yakın arkadaşının başka bir sınıfa geçmesi',
    cocukFarkindalik: 3,
    aileFarkindalik: 4,
    oncekiYardim: 'Aile hekimi · taranma normal; pediatri "psikosomatik" değerlendirmesi.',
  },
  davranis: {
    anksiyete: 2, depresyon: 1, somatik: 2, geriCekilme: 2,
    agresyon: 0, kuralIhlali: 0, dikkat: 1,
    sosyal: 1, dusunce: 0,
  },
  oyunNotu: 'Sembolik oyunda tekrar eden "okula gitmek istemeyen tavşan" teması. Sonu hep okul yerine eve dönüş.',
  cbtNotu: 'Duygu termometresi: okul kelimesi → 8/10 kaygı. "Geç kalırım" otomatik düşüncesi sık.',
  klinikNotu: 'Ayrılma kaygısı + sosyal değişimle tetiklenen okul reddi. DEHB komorbiditesi düşük olasılık. Aile sistemi destekleyici, müdahaleye açık.',
  veli: {
    anne: {
      tarih: '2026.05.18',
      guclu: 'Yaratıcı, empatik, kitap okumayı çok seven bir çocuk.',
      endise: 'Sabahlar kabusa döndü. Karın ağrılarının fizyolojik mi psikolojik mi olduğunu artık ayırt edemiyorum.',
      son6Ay: 'Boşanma sonrası baba ile daha az görüşmeye başladık. Sınıf değişikliği aynı dönemde.',
      tarz: 'demokratik',
      stres: ['İş', 'İlişki'],
      sosyalDestek: { var: true, kaynak: 'Anneannem + yakın 2 arkadaş.' },
    },
    baba: {
      tarih: '2026.05.22',
      guclu: 'Sorumluluk duygusu yüksek, çok kitap okuyor.',
      endise: 'Boşanmanın etkisi şimdi yüzeye çıkıyor olabilir.',
      son6Ay: 'Hafta sonu görüşmeleri devam ediyor; uzaklık zorluyor.',
      tarz: 'demokratik',
      stres: ['İş'],
      sosyalDestek: { var: true, kaynak: 'Erkek kardeş + iş arkadaşları.' },
    },
  },
  risk: {
    kendineZarar: 'yok',
    intihar: 'yok',
    abuse: { fiziksel: false, cinsel: false, duygusal: false, ihmal: false },
    aileSiddeti: false,
    seviye: 'izleme',
  },
  hedefler: {
    hedefler3: [
      'Haftalık 1 tam okul günü (kademeli maruziyet)',
      'Sabah rutininde anneyle "endişe minutes" pratiği · 10 dk',
      'Sınıf öğretmeniyle 2 haftada bir geri bildirim',
    ],
    mudahaleler: ['oyun', 'aile', 'okul'],
    frekans: 'haftalik',
    sure: 'orta',
  },
};

function calcCompleteness(section: CocukSection, data: CocukData): number {
  const map: Record<CocukSection, keyof CocukData | null> = {
    demografik: 'demografik', aile: 'aile', gelisim: 'gelisim',
    okul: 'okul', yakinma: 'yakinma', davranis: 'davranis',
    oyun: 'oyunNotu' as keyof CocukData, cbt: 'cbtNotu' as keyof CocukData,
    klinik: 'klinikNotu' as keyof CocukData, veli: 'veli', risk: 'risk',
    hedefler: 'hedefler',
  };
  const key = map[section];
  if (!key) return 0;
  const v = data[key];
  if (v == null) return 0;
  if (typeof v === 'string') return v.trim() ? 100 : 0;
  if (Array.isArray(v))     return v.length > 0 ? 100 : 0;
  if (typeof v === 'object') {
    const keys = Object.keys(v);
    if (keys.length === 0) return 0;
    let filled = 0;
    for (const k of keys) {
      const x = (v as Record<string, unknown>)[k];
      if (x == null) continue;
      if (Array.isArray(x) && x.length === 0) continue;
      if (typeof x === 'string' && x.trim() === '') continue;
      if (typeof x === 'object' && Object.keys(x as object).length === 0) continue;
      filled += 1;
    }
    return Math.round((filled / keys.length) * 100);
  }
  return 0;
}

function computeRiskLevel(risk: NonNullable<CocukData['risk']>): RiskLevel {
  const abuse = risk.abuse ?? {};
  const anyAbuse = !!(abuse.fiziksel || abuse.cinsel || abuse.duygusal || abuse.ihmal);
  if (anyAbuse || risk.intihar === 'plan' || risk.kendineZarar === 'aktif') return 'acil';
  if (risk.aileSiddeti || risk.kendineZarar === 'davranis' || risk.intihar === 'fikir' || risk.kendineZarar === 'fikir') return 'orta';
  return 'izleme';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────

export default function CocukPanel({
  client = DEFAULT_CLIENT,
  data: dataProp,
  activeSection: activeSectionProp,
  onChangeSection,
  onChange,
  lastSavedAt = '2 dk önce',
  yasBandi: yasBandiProp,
  onChangeYasBandi,
  oyunSlot, cbtSlot, klinikSlot,
  onScheduleParentInterview,
  onOpenAbuseProtocol, onCallEmergency,
  onSwitchToAdultFlow, onProceedToTreatmentPlan,
  onExportParentPdf, onExportSchoolReport,
  onExportPdf, onShare, onDelete,
}: CocukPanelProps) {
  const [dataState,     setDataState]     = useState<CocukData>(dataProp ?? DEFAULT_DATA);
  const [activeState,   setActiveState]   = useState<CocukSection>(activeSectionProp ?? 'demografik');
  const [yasState,      setYasState]      = useState<YasBandi>(yasBandiProp ?? autoYasBandi(client.age));
  const [sideOpen,      setSideOpen]      = useState(true);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [parentTab,     setParentTab]     = useState<ParentKey>('anne');

  useEffect(() => { if (dataProp) setDataState(dataProp); }, [dataProp]);
  useEffect(() => { if (activeSectionProp) setActiveState(activeSectionProp); }, [activeSectionProp]);
  useEffect(() => { if (yasBandiProp)      setYasState(yasBandiProp); },      [yasBandiProp]);

  const data = dataState;
  const active = activeState;
  const yas = yasState;

  const setActive = (s: CocukSection) => {
    setActiveState(s);
    onChangeSection?.(s);
  };
  const setYas = (y: YasBandi) => {
    setYasState(y);
    onChangeYasBandi?.(y);
  };

  const update = useCallback(<K extends keyof CocukData>(section: K, value: CocukData[K]) => {
    setDataState((prev) => {
      const cur = prev[section];
      const next = (typeof value === 'object' && value !== null && typeof cur === 'object' && cur !== null && !Array.isArray(value))
        ? { ...(cur as object), ...(value as object) } as CocukData[K]
        : value;
      return { ...prev, [section]: next };
    });
    onChange?.(section, value);
  }, [onChange]);

  const completeness = useMemo(() => {
    const out: Record<CocukSection, number> = {} as Record<CocukSection, number>;
    for (const s of SECTIONS) out[s.key] = calcCompleteness(s.key, data);
    return out;
  }, [data]);

  const overallPct = Math.round(
    SECTIONS.reduce((a, s) => a + completeness[s.key], 0) / SECTIONS.length
  );
  const completedCount = SECTIONS.filter((s) => completeness[s.key] >= 80).length;

  const riskLevel: RiskLevel = data.risk ? (data.risk.seviye ?? computeRiskLevel(data.risk)) : 'izleme';

  const idx = SECTIONS.findIndex((s) => s.key === active);
  const prev = idx > 0 ? SECTIONS[idx - 1] : null;
  const next = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;
  const activeMeta = SECTIONS[idx];

  // Adolescent → adult flow hint at 16+
  const adultHint = client.age >= 16;

  useEffect(() => {
    if (!menuOpen) return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [menuOpen]);

  return (
    <div className="cc" data-screen-label={`08 Çocuk · ${active}`} data-section={active} data-yas={yas} data-risk={riskLevel}>
      {/* ── TOP BAR ────────────────────────────────────── */}
      <header className="cc-top">
        <div className="cc-top-left">
          <button type="button" className="cc-icon-btn" aria-label="Geri">
            <ArrowLeft size={14} strokeWidth={1.8} />
          </button>
          <div className="cc-avatar">{initials(client.name)}</div>
          <div className="cc-top-title">
            <span className="cc-eyebrow">çocuk değerlendirme · v1 taslak</span>
            <h1>
              {client.name.split(' ').slice(0, -1).join(' ')}{' '}
              <em>{client.name.split(' ').slice(-1)[0]}</em>
            </h1>
            <span className="cc-age-chip">
              <span className="cc-age-chip-dot" />
              {client.age} yaş{client.sinif ? ` · ${client.sinif}` : ''}
            </span>
          </div>
        </div>

        <nav className="cc-yas" role="tablist" aria-label="Yaş bandı">
          {YAS_BANDLARI.map((b) => (
            <button
              key={b.k} role="tab" type="button"
              aria-selected={yas === b.k}
              className={`cc-yas-btn ${yas === b.k ? 'on' : ''}`}
              onClick={() => setYas(b.k)}
            >
              <span className="cc-yas-l">{b.l}</span>
              <span className="cc-yas-r">{b.sub}</span>
            </button>
          ))}
        </nav>

        <div className="cc-top-right">
          <div className="cc-progress">
            <span className="cc-progress-bar"><span style={{ width: `${overallPct}%` }} /></span>
            <span className="cc-progress-num">%{overallPct}</span>
          </div>
          <span className="cc-saved">
            <Save size={11} strokeWidth={1.8} />
            Kaydedildi · {lastSavedAt}
          </span>
          <button
            type="button" className="cc-btn cc-btn-primary"
            onClick={() => onScheduleParentInterview?.(parentTab)}
          >
            <UsersIcon size={13} strokeWidth={1.8} />
            Veli görüşmesi
          </button>
          <div className="cc-more-wrap">
            <button
              type="button"
              className={`cc-icon-btn ${menuOpen ? 'active' : ''}`}
              aria-label="Daha fazla"
              aria-haspopup="true" aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal size={15} strokeWidth={1.8} />
            </button>
            {menuOpen && (
              <div className="cc-more-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => { onExportParentPdf?.(); setMenuOpen(false); }}>
                  <FileDown size={13} strokeWidth={1.8} /> Veli için PDF
                </button>
                <button type="button" role="menuitem" onClick={() => { onExportSchoolReport?.(); setMenuOpen(false); }}>
                  <FileDown size={13} strokeWidth={1.8} /> Okul raporu
                </button>
                <button type="button" role="menuitem" onClick={() => { onExportPdf?.(); setMenuOpen(false); }}>
                  <FileDown size={13} strokeWidth={1.8} /> Tam değerlendirme PDF
                </button>
                <button type="button" role="menuitem" onClick={() => { onShare?.(); setMenuOpen(false); }}>
                  <Share2 size={13} strokeWidth={1.8} /> Paylaş
                </button>
                <button type="button" role="menuitem" className="danger" onClick={() => { onDelete?.(); setMenuOpen(false); }}>
                  <Trash2 size={13} strokeWidth={1.8} /> Sil
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Adolescent → adult-flow hint */}
      {adultHint && (
        <div className="cc-adult-hint">
          <span className="cc-adult-hint-dot" />
          <p>
            <strong>{client.age} yaşında</strong> — yetişkin formülasyon akışına geçiş yakında uygun olabilir.
            Risk değerlendirmesinde intihar düşüncesi sorgulamasına geçildiğinden emin olun.
          </p>
          <button type="button" className="cc-btn cc-btn-ghost" onClick={onSwitchToAdultFlow}>
            Yetişkin akışına geç
            <ArrowRight size={13} strokeWidth={1.8} />
          </button>
        </div>
      )}

      {/* ── BODY ───────────────────────────────────────── */}
      <div className="cc-body">
        {/* LEFT NAV */}
        <aside className="cc-nav">
          <div className="cc-nav-summary">
            <div>
              <span className="cc-eyebrow">tamamlanma</span>
              <div className="cc-nav-num">{completedCount}<em>/{SECTIONS.length}</em></div>
            </div>
            <div>
              <span className="cc-eyebrow">risk</span>
              <span className={`cc-risk-pill r-${riskLevel}`}>
                {riskLevel === 'izleme' ? 'İzleme' : riskLevel === 'orta' ? 'Orta' : 'Acil'}
              </span>
            </div>
            <div>
              <span className="cc-eyebrow">yaş bandı</span>
              <span className="cc-yas-tag">{YAS_BANDLARI.find((b) => b.k === yas)?.l}</span>
            </div>
          </div>

          <ul className="cc-nav-list">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              const pct = completeness[s.key];
              const done = pct >= 80;
              const partial = pct > 0 && !done;
              const missing = pct === 0 && s.required;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    className={`cc-nav-item ${active === s.key ? 'on' : ''} ${s.required ? 'required' : ''}`}
                    onClick={() => setActive(s.key)}
                  >
                    <span className="cc-nav-ix">{String(i + 1).padStart(2, '0')}</span>
                    <span className="cc-nav-icon"><Icon size={14} strokeWidth={1.6} /></span>
                    <span className="cc-nav-name">{s.short}</span>
                    <span className="cc-nav-status">
                      {done && <Check size={11} strokeWidth={2.4} className="ok" />}
                      {missing && <AlertTriangle size={11} strokeWidth={2} className="warn" />}
                      {partial && <span className="cc-nav-pct">{pct}%</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* CENTER */}
        <main className="cc-form">
          <div className="cc-form-head">
            <span className="cc-eyebrow">
              bölüm {idx + 1} / {SECTIONS.length}
              {activeMeta.required ? ' · zorunlu' : ''}
            </span>
            <h2 className="cc-form-title">
              {activeMeta.title.split(' ').slice(0, -1).join(' ')}{' '}
              <em>{activeMeta.title.split(' ').slice(-1)[0]}</em>
            </h2>
          </div>

          <div className="cc-form-body">
            {active === 'demografik' && <DemografikForm v={data.demografik} set={(p) => update('demografik', { ...data.demografik, ...p })} />}
            {active === 'aile'       && <AileForm       v={data.aile}       set={(p) => update('aile',       { ...data.aile,       ...p })} />}
            {active === 'gelisim'    && <GelisimForm    v={data.gelisim}    set={(p) => update('gelisim',    { ...data.gelisim,    ...p })} />}
            {active === 'okul'       && <OkulForm       v={data.okul}       set={(p) => update('okul',       { ...data.okul,       ...p })} />}
            {active === 'yakinma'    && <YakinmaForm    v={data.yakinma}    set={(p) => update('yakinma',    { ...data.yakinma,    ...p })} />}
            {active === 'davranis'   && <DavranisForm   v={data.davranis}   set={(p) => update('davranis',   { ...data.davranis,   ...p })} />}
            {active === 'oyun'       && <OyunForm       slot={oyunSlot}     yas={yas} note={data.oyunNotu}  set={(x) => update('oyunNotu', x)} />}
            {active === 'cbt'        && <CbtForm        slot={cbtSlot}      yas={yas} note={data.cbtNotu}   set={(x) => update('cbtNotu',  x)} />}
            {active === 'klinik'     && <KlinikForm     slot={klinikSlot}   note={data.klinikNotu}          set={(x) => update('klinikNotu', x)} />}
            {active === 'veli'       && (
              <VeliForm
                veli={data.veli}
                set={(p) => update('veli', { ...data.veli, ...p })}
                tab={parentTab} onChangeTab={setParentTab}
                onSchedule={onScheduleParentInterview}
              />
            )}
            {active === 'risk'       && (
              <RiskForm
                v={data.risk}
                set={(p) => {
                  const merged = { ...data.risk, ...p };
                  update('risk', { ...merged, seviye: computeRiskLevel(merged) });
                }}
                onOpenAbuseProtocol={onOpenAbuseProtocol}
                onCallEmergency={onCallEmergency}
                yas={yas}
              />
            )}
            {active === 'hedefler' && (
              <HedeflerForm
                v={data.hedefler}
                set={(p) => update('hedefler', { ...data.hedefler, ...p })}
                onProceed={onProceedToTreatmentPlan}
                onExportParentPdf={onExportParentPdf}
              />
            )}
          </div>
        </main>

        {/* RIGHT */}
        <aside className={`cc-side ${sideOpen ? '' : 'col'}`}>
          <button
            type="button" className="cc-side-collapse"
            onClick={() => setSideOpen((v) => !v)}
            aria-label={sideOpen ? 'Bağlamı kapat' : 'Bağlamı aç'}
            aria-expanded={sideOpen}
          >
            {sideOpen ? <ChevronRight size={14} strokeWidth={1.8} /> : <ChevronLeft size={14} strokeWidth={1.8} />}
          </button>
          {sideOpen ? (
            <div className="cc-side-body">
              <SideCard title={YAS_BAND_INFO[yas].headline} eyebrow={`yaş bandı · ${yas}`}>
                <p>{YAS_BAND_INFO[yas].copy}</p>
              </SideCard>

              {riskLevel !== 'izleme' && (
                <SideCard
                  title={riskLevel === 'acil' ? 'Acil müdahale gerekli' : 'Orta düzey risk'}
                  eyebrow="dinamik"
                  tone={riskLevel === 'acil' ? 'risk' : 'warn'}
                >
                  <p className="cc-side-risk">
                    Risk bölümündeki yanıtlar otomatik olarak güncellendi.
                    {riskLevel === 'acil' && ' Çocuk koruma protokolü ve 183 hattı seçenekleri risk bölümünde mevcut.'}
                  </p>
                  {riskLevel === 'acil' && (
                    <button type="button" className="cc-btn cc-btn-primary cc-btn-block" onClick={onCallEmergency}>
                      <Phone size={13} strokeWidth={1.8} />
                      183 acil yardım hattı
                    </button>
                  )}
                </SideCard>
              )}

              <SideCard title="Şablon önerisi" eyebrow="benzer vakalar">
                <ul className="cc-tpl-suggest">
                  <li>
                    <div>
                      <strong>Okul reddi / 8-11 yaş</strong>
                      <span>Yakınma + yaş + akademik uyum</span>
                    </div>
                    <button type="button" className="cc-btn cc-btn-ghost">Uygula</button>
                  </li>
                  <li>
                    <div>
                      <strong>Ayrılma kaygısı / latency</strong>
                      <span>Boşanma sonrası + sosyal değişim</span>
                    </div>
                    <button type="button" className="cc-btn cc-btn-ghost">Uygula</button>
                  </li>
                </ul>
              </SideCard>

              {adultHint && (
                <SideCard title="Yetişkin formülasyona geçiş" eyebrow="ergen · 16+" tone="accent">
                  <p>
                    {client.age} yaşındaki danışan için yetişkin akışı uygun olabilir.
                    Risk değerlendirmesi ve özerklik soruları yetişkin standardında.
                  </p>
                  <button type="button" className="cc-btn cc-btn-primary cc-btn-block" onClick={onSwitchToAdultFlow}>
                    Yetişkin akışına geç
                    <ArrowRight size={13} strokeWidth={1.8} />
                  </button>
                </SideCard>
              )}
            </div>
          ) : (
            <span className="cc-side-rail">Bağlam</span>
          )}
        </aside>
      </div>

      {/* ── BOTTOM BAR ─────────────────────────────────── */}
      <footer className="cc-bottom">
        <button
          type="button" className="cc-btn cc-btn-ghost"
          disabled={!prev}
          onClick={() => prev && setActive(prev.key)}
        >
          <ArrowLeft size={13} strokeWidth={1.8} /> Önceki
          {prev && <span className="cc-bottom-name">· {prev.short}</span>}
        </button>
        <span className="cc-bottom-mid">
          <span className="cc-eyebrow">{idx + 1} / {SECTIONS.length}</span>
          <strong>{activeMeta.title}</strong>
        </span>
        <div className="cc-bottom-right">
          <button type="button" className="cc-btn cc-btn-ghost" onClick={() => onScheduleParentInterview?.(parentTab)}>
            <UsersIcon size={13} strokeWidth={1.8} /> Veli görüşmesi planla
          </button>
          <button
            type="button" className="cc-btn cc-btn-primary"
            disabled={!next}
            onClick={() => next && setActive(next.key)}
          >
            Sonraki
            {next && <span className="cc-bottom-name">· {next.short}</span>}
            <ArrowRight size={13} strokeWidth={1.8} />
          </button>
        </div>
      </footer>
    </div>
  );
}

// ─── Atom components ──────────────────────────────────────────────────────

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="cc-field">
      <label>
        <span className="cc-field-label">
          {label}
          {required && <em className="cc-req">·</em>}
        </span>
        {hint && <span className="cc-field-hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ cols = 2, children }: { cols?: 2 | 3 | 4; children: ReactNode }) {
  return <div className={`cc-row cc-row-${cols}`}>{children}</div>;
}

function TextInput({
  value, onChange, placeholder, type = 'text',
}: { value: string | number | undefined; onChange: (v: string) => void; placeholder?: string; type?: 'text' | 'number' }) {
  return (
    <input type={type} className="cc-input"
      value={value ?? ''} placeholder={placeholder}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} />
  );
}

function TextArea({
  value, onChange, placeholder, rows = 4, italic,
}: { value: string | undefined; onChange: (v: string) => void; placeholder?: string; rows?: number; italic?: boolean }) {
  return (
    <textarea
      className={`cc-textarea ${italic ? 'italic' : ''}`}
      value={value ?? ''} placeholder={placeholder} rows={rows}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Select({
  value, onChange, options,
}: { value: string | undefined; onChange: (v: string) => void; options: string[] }) {
  return (
    <select className="cc-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>Seçin…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Segment<T extends string>({
  value, options, onChange,
}: { value: T | undefined; options: { value: T; label: string; tone?: 'good' | 'warn' | 'risk' }[]; onChange: (v: T) => void }) {
  return (
    <div className="cc-segment" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value} type="button" role="radio"
          aria-checked={value === o.value}
          className={`cc-segment-btn t-${o.tone ?? 'ink'} ${value === o.value ? 'on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function YesNo({ value, onChange }: { value: boolean | undefined; onChange: (v: boolean) => void }) {
  return (
    <Segment<'yes' | 'no'>
      value={value === undefined ? undefined : value ? 'yes' : 'no'}
      onChange={(v) => onChange(v === 'yes')}
      options={[
        { value: 'no',  label: 'Hayır' },
        { value: 'yes', label: 'Evet'  },
      ]}
    />
  );
}

function ChipList({
  items, onChange, placeholder = 'Ekle…',
}: { items: string[] | undefined; onChange: (next: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('');
  const list = items ?? [];
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...list, v]);
    setDraft('');
  };
  return (
    <div className="cc-chiplist">
      {list.map((it, i) => (
        <span key={i} className="cc-chip">
          {it}
          <button type="button" aria-label="Kaldır" onClick={() => onChange(list.filter((_, j) => j !== i))}>
            <X size={10} strokeWidth={2} />
          </button>
        </span>
      ))}
      <span className="cc-chip-input">
        <input type="text" value={draft} placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add} aria-label="Ekle"><Plus size={11} strokeWidth={2} /></button>
      </span>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────

function DemografikForm({ v, set }: { v?: CocukData['demografik']; set: (p: Partial<NonNullable<CocukData['demografik']>>) => void }) {
  return (
    <>
      <Row cols={2}>
        <Field label="Ad Soyad" required>
          <TextInput value={v?.adSoyad} onChange={(x) => set({ adSoyad: x })} placeholder="Tam ad" />
        </Field>
        <Field label="Yaş">
          <TextInput type="number" value={v?.yas} onChange={(x) => set({ yas: Number(x) })} placeholder="11" />
        </Field>
      </Row>
      <Row cols={3}>
        <Field label="Cinsiyet">
          <Select value={v?.cinsiyet} onChange={(x) => set({ cinsiyet: x })} options={['Kız', 'Erkek', 'Diğer', 'Belirtmedi']} />
        </Field>
        <Field label="Sınıf">
          <TextInput value={v?.sinif} onChange={(x) => set({ sinif: x })} placeholder="5. sınıf" />
        </Field>
        <Field label="Okul">
          <TextInput value={v?.okul} onChange={(x) => set({ okul: x })} placeholder="Okul adı" />
        </Field>
      </Row>
      <Row cols={3}>
        <Field label="Öğretmen">
          <TextInput value={v?.ogretmen} onChange={(x) => set({ ogretmen: x })} placeholder="Sınıf öğretmeni" />
        </Field>
        <Field label="Kardeş sayısı">
          <TextInput type="number" value={v?.kardesSayisi} onChange={(x) => set({ kardesSayisi: Number(x) })} placeholder="0" />
        </Field>
        <Field label="Kardeş sırası">
          <Select value={v?.kardesSira} onChange={(x) => set({ kardesSira: x })} options={['Tek çocuk', 'Büyük', 'Orta', 'Küçük']} />
        </Field>
      </Row>
      <Field label="Evlat edinme / üvey aile" hint="Varsa kısa detay">
        <YesNo value={v?.evlatEdinme} onChange={(yes) => set({ evlatEdinme: yes })} />
        {v?.evlatEdinme && (
          <div style={{ marginTop: 10 }}>
            <TextArea rows={2} value={v.evlatNot} onChange={(x) => set({ evlatNot: x })} placeholder="Yaş, kaynak, çocuğun farkındalığı" />
          </div>
        )}
      </Field>
    </>
  );
}

function AileForm({ v, set }: { v?: CocukData['aile']; set: (p: Partial<NonNullable<CocukData['aile']>>) => void }) {
  return (
    <>
      <div className="cc-parents">
        {(['anne', 'baba'] as const).map((p) => {
          const cur = v?.[p];
          return (
            <div key={p} className="cc-parent-card">
              <span className="cc-eyebrow">{p === 'anne' ? 'anne' : 'baba'}</span>
              <Row cols={2}>
                <input className="cc-input" placeholder="Ad" value={cur?.ad ?? ''} onChange={(e) => set({ [p]: { ...cur, ad: e.target.value } } as Partial<NonNullable<CocukData['aile']>>)} />
                <input className="cc-input" type="number" placeholder="Yaş" value={cur?.yas ?? ''} onChange={(e) => set({ [p]: { ...cur, yas: Number(e.target.value) } } as Partial<NonNullable<CocukData['aile']>>)} />
              </Row>
              <Row cols={2}>
                <input className="cc-input" placeholder="İş" value={cur?.is ?? ''} onChange={(e) => set({ [p]: { ...cur, is: e.target.value } } as Partial<NonNullable<CocukData['aile']>>)} />
                <input className="cc-input" placeholder="Eğitim" value={cur?.egitim ?? ''} onChange={(e) => set({ [p]: { ...cur, egitim: e.target.value } } as Partial<NonNullable<CocukData['aile']>>)} />
              </Row>
              <input className="cc-input" placeholder="Sağlık durumu" value={cur?.saglik ?? ''} onChange={(e) => set({ [p]: { ...cur, saglik: e.target.value } } as Partial<NonNullable<CocukData['aile']>>)} />
            </div>
          );
        })}
      </div>

      <Field label="Birlikte / ayrı yaşıyor mu?">
        <YesNo value={v?.birlikte} onChange={(yes) => set({ birlikte: yes })} />
      </Field>
      {v?.birlikte === false && (
        <Row cols={2}>
          <Field label="Ayrılık tarihi">
            <TextInput value={v?.ayrilikTarihi} onChange={(x) => set({ ayrilikTarihi: x })} placeholder="2024 Mart" />
          </Field>
          <Field label="Ziyaret düzeni">
            <TextInput value={v?.ziyaretDuzeni} onChange={(x) => set({ ziyaretDuzeni: x })} placeholder="2 haftada bir hafta sonu" />
          </Field>
        </Row>
      )}
      <Field label="Aile genogramı" hint="Yakın ilişkiler, mesafe, üç nesil özet">
        <TextArea rows={4} value={v?.genogram} onChange={(x) => set({ genogram: x })} placeholder="Anne ailesi…" />
      </Field>
      <Field label="Birincil bakım veren">
        <TextInput value={v?.birincilBakim} onChange={(x) => set({ birincilBakim: x })} placeholder="Anne · hafta içi tam" />
      </Field>
    </>
  );
}

function GelisimForm({ v, set }: { v?: CocukData['gelisim']; set: (p: Partial<NonNullable<CocukData['gelisim']>>) => void }) {
  return (
    <>
      <div className="cc-dev-grid">
        <div>
          <span className="cc-eyebrow">prenatal / doğum</span>
          <Row cols={2}>
            <Field label="Gebelik"><TextInput value={v?.gebelik} onChange={(x) => set({ gebelik: x })} placeholder="Komplikasyonsuz" /></Field>
            <Field label="Doğum"><TextInput value={v?.dogum} onChange={(x) => set({ dogum: x })} placeholder="Normal / sezaryen · hafta" /></Field>
          </Row>
          <Field label="Doğum ağırlığı"><TextInput value={v?.agirlik} onChange={(x) => set({ agirlik: x })} placeholder="3.2 kg" /></Field>
        </div>
        <div>
          <span className="cc-eyebrow">bebeklik / motor</span>
          <Field label="Bebeklik dönemi"><TextArea rows={2} value={v?.bebeklik} onChange={(x) => set({ bebeklik: x })} placeholder="Emzirme, mama, ilk 6 ay" /></Field>
          <Field label="Motor gelişim" hint="Oturma, yürüme, koşma — yaş">
            <TextInput value={v?.motor} onChange={(x) => set({ motor: x })} placeholder="6/13/22 ay" />
          </Field>
        </div>
        <div>
          <span className="cc-eyebrow">dil + alışkanlık</span>
          <Field label="Dil gelişimi"><TextInput value={v?.dil} onChange={(x) => set({ dil: x })} placeholder="İlk kelime, cümle, akıcılık" /></Field>
          <Field label="Tuvalet eğitimi"><TextInput value={v?.tuvalet} onChange={(x) => set({ tuvalet: x })} placeholder="Yaş + zorluk" /></Field>
        </div>
        <div>
          <span className="cc-eyebrow">uyku + yeme</span>
          <Field label="Uyku düzeni"><TextArea rows={2} value={v?.uyku} onChange={(x) => set({ uyku: x })} placeholder="Dalış, gece uyanma, kabus, enürezis" /></Field>
          <Field label="Yeme alışkanlığı"><TextArea rows={2} value={v?.yeme} onChange={(x) => set({ yeme: x })} placeholder="Seçicilik, miktar" /></Field>
        </div>
      </div>
    </>
  );
}

function OkulForm({ v, set }: { v?: CocukData['okul']; set: (p: Partial<NonNullable<CocukData['okul']>>) => void }) {
  const Acad = ({ label, k }: { label: string; k: 'matematik' | 'turkce' | 'diger' }) => (
    <Field label={label} hint="1-5 skala (1 zayıf · 5 çok iyi)">
      <div className="cc-acad">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n} type="button"
            className={`cc-acad-btn ${(v?.[k] ?? 0) >= n ? 'on' : ''}`}
            onClick={() => set({ [k]: n } as Partial<NonNullable<CocukData['okul']>>)}
            aria-label={`${label}: ${n}`}
          >
            {n}
          </button>
        ))}
      </div>
    </Field>
  );
  return (
    <>
      <Row cols={3}>
        <Acad label="Matematik" k="matematik" />
        <Acad label="Türkçe"    k="turkce" />
        <Acad label="Diğer dersler" k="diger" />
      </Row>
      <Row cols={2}>
        <Field label="Disiplin sorunu">
          <Segment<'yok' | 'az' | 'sik'>
            value={v?.disiplin}
            onChange={(x) => set({ disiplin: x })}
            options={[
              { value: 'yok', label: 'Yok',     tone: 'good' },
              { value: 'az',  label: 'Az',      tone: 'warn' },
              { value: 'sik', label: 'Sık',     tone: 'risk' },
            ]}
          />
        </Field>
        <Field label="Akran ilişkileri">
          <Segment<'yalniz' | 'azinlik' | 'takim' | 'populer'>
            value={v?.akran}
            onChange={(x) => set({ akran: x })}
            options={[
              { value: 'yalniz',  label: 'Yalnız',   tone: 'risk' },
              { value: 'azinlik', label: '1-2 yakın', tone: 'warn' },
              { value: 'takim',   label: 'Takım',    tone: 'good' },
              { value: 'populer', label: 'Popüler',  tone: 'good' },
            ]}
          />
        </Field>
      </Row>
      <Field label="Öğretmen geri bildirimi">
        <TextArea italic rows={3} value={v?.ogretmen} onChange={(x) => set({ ogretmen: x })}
          placeholder='"Ela çok zeki ama son aylarda derslerde sessizleşti."' />
      </Field>
      <Row cols={2}>
        <Field label="Devamsızlık (gün)">
          <TextInput type="number" value={v?.devamsizlik} onChange={(x) => set({ devamsizlik: Number(x) })} placeholder="0" />
        </Field>
        <Field label="Sebep">
          <TextInput value={v?.devamsizlikSebep} onChange={(x) => set({ devamsizlikSebep: x })} placeholder="Karın ağrısı / kaçınma" />
        </Field>
      </Row>
      <Field label="Rehberlik / RAM raporu">
        <YesNo value={v?.rehberlikRaporu} onChange={(yes) => set({ rehberlikRaporu: yes })} />
      </Field>
    </>
  );
}

function YakinmaForm({ v, set }: { v?: CocukData['yakinma']; set: (p: Partial<NonNullable<CocukData['yakinma']>>) => void }) {
  const fark = v?.farkEden ?? [];
  return (
    <>
      <Field label="Yakınma metni" hint="Veli ve çocuğun kelimeleriyle, mümkünse alıntı">
        <TextArea italic rows={4} value={v?.metin} onChange={(x) => set({ metin: x })}
          placeholder='"Sabahları okula gitmek istemiyor, karnı ağrıyor diyor."' />
      </Field>
      <Field label="Kim fark etti?">
        <div className="cc-chip-options">
          {(['anne', 'baba', 'ogretmen', 'cocuk'] as const).map((p) => {
            const on = fark.includes(p);
            const label = p === 'anne' ? 'Anne' : p === 'baba' ? 'Baba' : p === 'ogretmen' ? 'Öğretmen' : 'Çocuğun kendisi';
            return (
              <button
                key={p} type="button"
                className={`cc-chip-opt ${on ? 'on' : ''}`}
                onClick={() => set({ farkEden: on ? fark.filter((x) => x !== p) : [...fark, p] })}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Field>
      <Row cols={2}>
        <Field label="Başlangıç tarihi"><TextInput value={v?.baslangic} onChange={(x) => set({ baslangic: x })} placeholder="2026 Ocak" /></Field>
        <Field label="Tetikleyici"><TextInput value={v?.tetikleyici} onChange={(x) => set({ tetikleyici: x })} placeholder="Yakın arkadaşın gitmesi" /></Field>
      </Row>
      <Row cols={2}>
        <Field label="Çocuğun farkındalığı" hint="0 hiç · 5 net">
          <div className="cc-stepper">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className={`cc-step ${(v?.cocukFarkindalik ?? 0) >= n ? 'on' : ''}`}
                onClick={() => set({ cocukFarkindalik: n })}>{n}</button>
            ))}
          </div>
        </Field>
        <Field label="Ailenin farkındalığı" hint="0 hiç · 5 net">
          <div className="cc-stepper">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className={`cc-step ${(v?.aileFarkindalik ?? 0) >= n ? 'on' : ''}`}
                onClick={() => set({ aileFarkindalik: n })}>{n}</button>
            ))}
          </div>
        </Field>
      </Row>
      <Field label="Önceki yardım arama denemeleri">
        <TextArea rows={3} value={v?.oncekiYardim} onChange={(x) => set({ oncekiYardim: x })}
          placeholder="Aile hekimi, pediatri, başka uzmanlar…" />
      </Field>
    </>
  );
}

const CBCL_INTERNAL: { k: 'anksiyete' | 'depresyon' | 'somatik' | 'geriCekilme'; l: string }[] = [
  { k: 'anksiyete',   l: 'Anksiyete' },
  { k: 'depresyon',   l: 'Depresyon' },
  { k: 'somatik',     l: 'Somatik şikayetler' },
  { k: 'geriCekilme', l: 'Geri çekilme' },
];
const CBCL_EXTERNAL: { k: 'agresyon' | 'kuralIhlali' | 'dikkat'; l: string }[] = [
  { k: 'agresyon',    l: 'Agresyon' },
  { k: 'kuralIhlali', l: 'Kural ihlali' },
  { k: 'dikkat',      l: 'Dikkat sorunu' },
];
const CBCL_OTHER: { k: 'sosyal' | 'dusunce'; l: string }[] = [
  { k: 'sosyal',  l: 'Sosyal sorunlar' },
  { k: 'dusunce', l: 'Düşünce sorunları' },
];

function DavranisForm({ v, set }: { v?: CocukData['davranis']; set: (p: Partial<NonNullable<CocukData['davranis']>>) => void }) {
  const Item = ({ k, l }: { k: keyof NonNullable<CocukData['davranis']>; l: string }) => {
    const cur = (v?.[k] ?? 0) as 0 | 1 | 2;
    return (
      <li>
        <span>{l}</span>
        <Segment<'0' | '1' | '2'>
          value={String(cur) as '0' | '1' | '2'}
          onChange={(x) => set({ [k]: Number(x) as 0 | 1 | 2 } as Partial<NonNullable<CocukData['davranis']>>)}
          options={[
            { value: '0', label: 'Hiç',  tone: 'good' },
            { value: '1', label: 'Bazen' },
            { value: '2', label: 'Sık', tone: 'risk' },
          ]}
        />
      </li>
    );
  };

  const total =
    (CBCL_INTERNAL.map((i) => v?.[i.k] ?? 0).reduce((a: number, b) => a + (b as number), 0)) +
    (CBCL_EXTERNAL.map((i) => v?.[i.k] ?? 0).reduce((a: number, b) => a + (b as number), 0)) +
    (CBCL_OTHER.map((i) => v?.[i.k] ?? 0).reduce((a: number, b) => a + (b as number), 0));
  const sinif = total <= 5 ? 'Klinik altı' : total <= 10 ? 'Sınırda' : 'Klinik';

  return (
    <>
      <div className="cc-cbcl-group">
        <span className="cc-eyebrow">içsel davranışlar</span>
        <ul className="cc-cbcl-list">{CBCL_INTERNAL.map((i) => <Item key={i.k} k={i.k} l={i.l} />)}</ul>
      </div>
      <div className="cc-cbcl-group">
        <span className="cc-eyebrow">dışsal davranışlar</span>
        <ul className="cc-cbcl-list">{CBCL_EXTERNAL.map((i) => <Item key={i.k} k={i.k} l={i.l} />)}</ul>
      </div>
      <div className="cc-cbcl-group">
        <span className="cc-eyebrow">diğer</span>
        <ul className="cc-cbcl-list">{CBCL_OTHER.map((i) => <Item key={i.k} k={i.k} l={i.l} />)}</ul>
      </div>
      <div className={`cc-cbcl-total t-${sinif === 'Klinik' ? 'risk' : sinif === 'Sınırda' ? 'warn' : 'good'}`}>
        <div>
          <span className="cc-eyebrow">cbcl benzeri toplam</span>
          <div className="cc-cbcl-num">{total}<em>/18</em></div>
        </div>
        <span className="cc-cbcl-sinif">{sinif}</span>
      </div>
    </>
  );
}

function SlotIntro({ title, body }: { title: string; body: string }) {
  return (
    <div className="cc-slot-intro">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function OyunForm({ slot, yas, note, set }: { slot?: ReactNode; yas: YasBandi; note?: string; set: (v: string) => void }) {
  const tip = yas === '0-3' ? 'Sembolik öncesi · keşif oyunu' :
              yas === '4-6' ? 'Sembolik oyun, rol yapma' :
              yas === '7-11' ? 'Kurallı oyun + çizim + sembolik tema' :
              'Yapılandırılmış görüşme + isteğe bağlı oyun ögesi';
  return (
    <>
      <SlotIntro title="Oyun gözlem" body={`Yaş bandına uygun oyun tipleri: ${tip}.`} />
      <div className="cc-slot">
        {slot ?? <SlotPlaceholder name="OYUN_TERAPISI" />}
      </div>
      <Field label="Oyun gözlem notu" hint="Tekrar eden temalar, çözüm/baş etme örüntüleri">
        <TextArea italic rows={5} value={note} onChange={set} placeholder='"Sembolik oyunda tekrar eden tema…"' />
      </Field>
    </>
  );
}

function CbtForm({ slot, yas, note, set }: { slot?: ReactNode; yas: YasBandi; note?: string; set: (v: string) => void }) {
  return (
    <>
      <SlotIntro
        title="BDT yaş uyarlamalı"
        body={`Çocuk BDT yaş bandına göre soyutluk düzeyini ayarlar; ${yas === '7-11' ? 'duygu termometresi + somut örnekler' : yas === '12-17' ? 'yetişkin BDT yapısına yakın' : 'görsel + oyun aracılığıyla'} kullanın.`}
      />
      <div className="cc-slot">
        {slot ?? <SlotPlaceholder name="COCUK_BDT_FORM" />}
      </div>
      <Field label="Duygu termometresi gözlemleri" hint="Hangi kelimeler hangi sıcaklığı tetikledi">
        <TextArea italic rows={4} value={note} onChange={set}
          placeholder='"Okul kelimesi → 8/10 kaygı. Geç kalırım düşüncesi sık."' />
      </Field>
    </>
  );
}

function KlinikForm({ slot, note, set }: { slot?: ReactNode; note?: string; set: (v: string) => void }) {
  return (
    <>
      <SlotIntro
        title="Geniş klinik değerlendirme"
        body="Mevcut Çocuk Değerlendirme bileşeniniz burada render edilir. Aşağıdaki not alanı, slot çıktısına klinik bakışınızı eklemeniz için."
      />
      <div className="cc-slot">
        {slot ?? <SlotPlaceholder name="COCUK_DEGERLENDIRME" />}
      </div>
      <Field label="Klinik izlenim notu">
        <TextArea italic rows={5} value={note} onChange={set}
          placeholder="Ayrılma kaygısı + sosyal değişimle tetiklenen okul reddi…" />
      </Field>
    </>
  );
}

function VeliForm({
  veli, set, tab, onChangeTab, onSchedule,
}: {
  veli?: CocukData['veli'];
  set: (p: Partial<NonNullable<CocukData['veli']>>) => void;
  tab: ParentKey;
  onChangeTab: (p: ParentKey) => void;
  onSchedule?: (p: ParentKey) => void;
}) {
  const cur: VeliData = (veli?.[tab]) ?? {};
  const update = (patch: Partial<VeliData>) => {
    set({ [tab]: { ...cur, ...patch } } as Partial<NonNullable<CocukData['veli']>>);
  };
  const stres = cur.stres ?? [];
  return (
    <>
      <div className="cc-veli-tabs" role="tablist" aria-label="Veli">
        {(['anne', 'baba'] as const).map((p) => (
          <button
            key={p} role="tab" type="button"
            aria-selected={tab === p}
            className={`cc-veli-tab ${tab === p ? 'on' : ''}`}
            onClick={() => onChangeTab(p)}
          >
            {p === 'anne' ? 'Anne' : 'Baba'}
            {veli?.[p]?.tarih && <span className="cc-veli-date">· {veli[p]!.tarih}</span>}
          </button>
        ))}
        <button type="button" className="cc-btn cc-btn-ghost sm" onClick={() => onSchedule?.(tab)} style={{ marginLeft: 'auto' }}>
          <UsersIcon size={12} strokeWidth={1.8} /> Görüşme planla
        </button>
      </div>

      <Field label="Görüşme tarihi"><TextInput value={cur.tarih} onChange={(x) => update({ tarih: x })} placeholder="2026.05.18" /></Field>
      <Field label="Çocuğun güçlü yönleri">
        <TextArea italic rows={3} value={cur.guclu} onChange={(x) => update({ guclu: x })} placeholder='"Yaratıcı, empatik…"' />
      </Field>
      <Field label="Endişeleriniz">
        <TextArea italic rows={3} value={cur.endise} onChange={(x) => update({ endise: x })} placeholder='"Sabahlar kabusa döndü…"' />
      </Field>
      <Field label="Aile içinde son 6 ayda ne değişti?">
        <TextArea rows={3} value={cur.son6Ay} onChange={(x) => update({ son6Ay: x })} placeholder="Boşanma, taşınma, kayıp, doğum…" />
      </Field>

      <Field label="Ebeveynlik tarzı">
        <div className="cc-parent-styles">
          {([
            { v: 'demokratik',    l: 'Demokratik',    s: 'Yüksek sıcaklık + yüksek beklenti' },
            { v: 'otoriter',      l: 'Otoriter',      s: 'Düşük sıcaklık + yüksek beklenti' },
            { v: 'izin-verici',   l: 'İzin verici',   s: 'Yüksek sıcaklık + düşük beklenti' },
            { v: 'ihmalkar',      l: 'İhmalkar',      s: 'Düşük sıcaklık + düşük beklenti' },
          ] as const).map((o) => (
            <button
              key={o.v} type="button"
              className={`cc-parent-style ${cur.tarz === o.v ? 'on' : ''}`}
              onClick={() => update({ tarz: o.v })}
            >
              <strong>{o.l}</strong>
              <span>{o.s}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Stres faktörleri">
        <div className="cc-chip-options">
          {['İş', 'Sağlık', 'Maddi', 'İlişki', 'Diğer'].map((s) => {
            const on = stres.includes(s);
            return (
              <button
                key={s} type="button"
                className={`cc-chip-opt ${on ? 'on' : ''}`}
                onClick={() => update({ stres: on ? stres.filter((x) => x !== s) : [...stres, s] })}
              >
                {s}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Sosyal destek">
        <YesNo value={cur.sosyalDestek?.var} onChange={(yes) => update({ sosyalDestek: { ...cur.sosyalDestek, var: yes } })} />
        {cur.sosyalDestek?.var && (
          <div style={{ marginTop: 10 }}>
            <TextInput value={cur.sosyalDestek?.kaynak} onChange={(x) => update({ sosyalDestek: { ...cur.sosyalDestek, kaynak: x } })} placeholder="Anneanne · 2 yakın arkadaş…" />
          </div>
        )}
      </Field>
    </>
  );
}

function RiskForm({
  v, set, onOpenAbuseProtocol, onCallEmergency, yas,
}: {
  v?: CocukData['risk'];
  set: (p: Partial<NonNullable<CocukData['risk']>>) => void;
  onOpenAbuseProtocol?: () => void;
  onCallEmergency?: () => void;
  yas: YasBandi;
}) {
  const seviye = v?.seviye ?? (v ? computeRiskLevel(v) : 'izleme');
  const abuse = v?.abuse ?? {};
  const anyAbuse = !!(abuse.fiziksel || abuse.cinsel || abuse.duygusal || abuse.ihmal);
  const showSuicide = yas !== '0-3'; // 0-3 too young; otherwise ask

  return (
    <>
      <div className="cc-risk-banner">
        <ShieldAlert size={14} strokeWidth={2} />
        <p>
          <strong>Zorunlu bölüm.</strong> Bildirim yükümlülüğü dahil çocuk koruma süreçleri buradan tetiklenir.
          Tüm sorulara — şüphede bile — yanıt verin.
        </p>
      </div>

      <Field label="Kendine zarar verme" required>
        <Segment<'yok' | 'fikir' | 'davranis' | 'aktif'>
          value={v?.kendineZarar}
          onChange={(x) => set({ kendineZarar: x })}
          options={[
            { value: 'yok',      label: 'Yok',           tone: 'good' },
            { value: 'fikir',    label: 'Fikir',         tone: 'warn' },
            { value: 'davranis', label: 'Geçmiş davranış', tone: 'risk' },
            { value: 'aktif',    label: 'Aktif',          tone: 'risk' },
          ]}
        />
      </Field>

      {showSuicide && (
        <Field label="İntihar düşüncesi" hint={yas === '4-6' ? '4-6 yaş — varlığı nadirdir, sorgulama doğrudan olmamalı' : undefined}>
          <Segment<'yok' | 'fikir' | 'plan'>
            value={v?.intihar}
            onChange={(x) => set({ intihar: x })}
            options={[
              { value: 'yok',   label: 'Yok',   tone: 'good' },
              { value: 'fikir', label: 'Fikir', tone: 'warn' },
              { value: 'plan',  label: 'Plan',  tone: 'risk' },
            ]}
          />
        </Field>
      )}

      <Field label="Kötü muamele şüphesi" hint="Şüphede bile işaretleyin — bildirim yükümlülüğü tetiklenir">
        <ul className="cc-abuse">
          {([
            { k: 'fiziksel', l: 'Fiziksel'  },
            { k: 'cinsel',   l: 'Cinsel'    },
            { k: 'duygusal', l: 'Duygusal'  },
            { k: 'ihmal',    l: 'İhmal'     },
          ] as const).map((a) => {
            const on = !!abuse[a.k];
            return (
              <li key={a.k}>
                <button
                  type="button"
                  className={`cc-abuse-check ${on ? 'on' : ''}`}
                  aria-pressed={on}
                  onClick={() => set({ abuse: { ...abuse, [a.k]: !on } })}
                >
                  {on && <Check size={11} strokeWidth={2.4} />}
                </button>
                <span>{a.l}</span>
              </li>
            );
          })}
        </ul>
      </Field>

      {anyAbuse && (
        <div className="cc-abuse-banner">
          <ShieldAlert size={14} strokeWidth={2} />
          <div>
            <strong>Çocuk koruma protokolü ve bildirim yükümlülüğü</strong>
            <p>Kötü muamele şüphesi olduğunda 24 saat içinde yetkili makama bildirim yapılmalıdır.</p>
          </div>
          <button type="button" className="cc-btn cc-btn-primary" onClick={onOpenAbuseProtocol}>
            Protokolü aç
            <ArrowRight size={13} strokeWidth={1.8} />
          </button>
        </div>
      )}

      <Field label="Aile içi şiddete tanıklık">
        <YesNo value={v?.aileSiddeti} onChange={(yes) => set({ aileSiddeti: yes })} />
      </Field>

      <div className={`cc-risk-summary r-${seviye}`}>
        <div>
          <span className="cc-eyebrow">otomatik risk değerlendirmesi</span>
          <h3>{seviye === 'izleme' ? 'İzleme' : seviye === 'orta' ? 'Orta' : 'Acil'}</h3>
        </div>
        {seviye === 'acil' && (
          <button type="button" className="cc-btn cc-btn-primary" onClick={onCallEmergency}>
            <Phone size={13} strokeWidth={1.8} />
            183 · SHÇEK acil yardım hattı
          </button>
        )}
      </div>

      <Field label="Klinisyen notu">
        <TextArea italic rows={4} value={v?.notu} onChange={(x) => set({ notu: x })}
          placeholder="Güvenlik planı, bakım veren güvenilirliği, koruma adımları…" />
      </Field>
    </>
  );
}

function HedeflerForm({
  v, set, onProceed, onExportParentPdf,
}: {
  v?: CocukData['hedefler'];
  set: (p: Partial<NonNullable<CocukData['hedefler']>>) => void;
  onProceed?: () => void;
  onExportParentPdf?: () => void;
}) {
  const hedefler = v?.hedefler3 ?? ['', '', ''];
  const mudahaleler = v?.mudahaleler ?? [];
  return (
    <>
      <Field label="3 somut hedef" hint="Çocuk + aile için, ölçülebilir">
        <div className="cc-goals">
          {[0, 1, 2].map((i) => (
            <div key={i} className="cc-goal">
              <span className="cc-goal-ix">{i + 1}.</span>
              <input className="cc-input" placeholder="Hedef" value={hedefler[i] ?? ''}
                onChange={(e) => {
                  const next = [...hedefler]; next[i] = e.target.value;
                  set({ hedefler3: next });
                }} />
            </div>
          ))}
        </div>
      </Field>

      <Field label="Müdahale tipi" hint="Çoklu seçim">
        <div className="cc-mudahale">
          {([
            { v: 'oyun', l: 'Oyun terapisi',         s: 'Sembolik + yapılandırılmış' },
            { v: 'aile', l: 'Aile danışmanlığı',     s: 'Veli sistemi ile çalışma' },
            { v: 'okul', l: 'Okul işbirliği',         s: 'Rehberlik + sınıf öğretmeni' },
            { v: 'emdr', l: 'EMDR (uyarlamalı)',     s: 'Travma odaklı, 8+ yaş' },
          ] as const).map((m) => {
            const on = mudahaleler.includes(m.v);
            return (
              <button
                key={m.v} type="button"
                className={`cc-mudahale-card ${on ? 'on' : ''}`}
                onClick={() => set({ mudahaleler: on ? mudahaleler.filter((x) => x !== m.v) : [...mudahaleler, m.v] })}
              >
                <strong>{m.l}</strong>
                <span>{m.s}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <Row cols={2}>
        <Field label="Frekans önerisi">
          <Segment<'haftalik' | 'iki-haftalik' | 'aylik'>
            value={v?.frekans}
            onChange={(x) => set({ frekans: x })}
            options={[
              { value: 'haftalik',     label: 'Haftalık' },
              { value: 'iki-haftalik', label: '15 günlük' },
              { value: 'aylik',        label: 'Aylık' },
            ]}
          />
        </Field>
        <Field label="Süre tahmini">
          <Segment<'kisa' | 'orta' | 'uzun'>
            value={v?.sure}
            onChange={(x) => set({ sure: x })}
            options={[
              { value: 'kisa', label: 'Kısa · 3-6 ay' },
              { value: 'orta', label: 'Orta · 6-12 ay' },
              { value: 'uzun', label: 'Uzun · 12+ ay' },
            ]}
          />
        </Field>
      </Row>

      <div className="cc-final-actions">
        <button type="button" className="cc-btn cc-btn-ghost" onClick={onExportParentPdf}>
          <FileDown size={13} strokeWidth={1.8} /> Veliye yazılı plan (PDF)
        </button>
        <button type="button" className="cc-btn cc-btn-primary" onClick={onProceed}>
          Tedavi planına geç
          <ArrowRight size={13} strokeWidth={1.8} />
        </button>
      </div>
    </>
  );
}

function SideCard({
  title, eyebrow, tone, children,
}: { title: string; eyebrow?: string; tone?: 'accent' | 'warn' | 'risk'; children: ReactNode }) {
  return (
    <section className={`cc-side-card t-${tone ?? 'ink'}`}>
      <header>
        {eyebrow && <span className="cc-eyebrow">{eyebrow}</span>}
        <h3>{title}</h3>
      </header>
      {children}
    </section>
  );
}

function SlotPlaceholder({ name }: { name: string }) {
  return (
    <div className="cc-slot-placeholder">
      <svg viewBox="0 0 600 320" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id={`cc-stripes-${name}`} patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(14,15,18,0.04)" strokeWidth="14" />
          </pattern>
        </defs>
        <rect width="600" height="320" fill={`url(#cc-stripes-${name})`} />
        <g transform="translate(300 160)">
          <rect x="-110" y="-22" width="220" height="44" rx="22"
            fill="var(--paper)" stroke="rgba(14,15,18,0.18)" strokeWidth="1.4" />
          <text textAnchor="middle" y="5" fontFamily="var(--mono, monospace)" fontSize="12" fill="var(--muted, #7B7C82)">
            {name}_SLOT
          </text>
        </g>
      </svg>
    </div>
  );
}
