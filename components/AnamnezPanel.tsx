'use client';

import { useMemo, useState, useEffect, useCallback, type ReactNode, type ChangeEvent } from 'react';
import {
  ArrowLeft, ArrowRight, Check, MoreHorizontal, FileDown, Share2, Trash2,
  Save, Sparkles, AlertTriangle, ShieldAlert, ChevronRight, ChevronLeft,
  Plus, X, Download, FileText,
  User, MessageSquare, Activity, Pill, Stethoscope, Users, Wine,
  GraduationCap, Briefcase, Heart, Skull, ClipboardCheck, Target,
  Gauge, Eye, NotebookPen,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

export type AnamnezSection =
  | 'demografik' | 'basvuru' | 'sikayet' | 'psikiyatrik' | 'tibbi'
  | 'aile' | 'madde' | 'gelisim' | 'is-sosyal' | 'iliskiler'
  | 'travma' | 'risk' | 'hedefler' | 'olcekler' | 'gozlem';

export type RiskLevel = 'dusuk' | 'orta' | 'yuksek';

export type AnamnezData = {
  demografik?: {
    adSoyad?: string; yas?: number; cinsiyet?: string; egitim?: string;
    meslek?: string; medeniDurum?: string; cocukSayisi?: number; sehir?: string;
  };
  basvuru?: { sebep?: string; yonlendiren?: string; hedef?: string; gorusmeSekli?: 'Yüz yüze' | 'Online' | 'Hibrit' };
  sikayet?: {
    baslangic?: string; seyir?: string;
    siddet?: number;             // şikayet yoğunluğu 1–10 (BDT formundan taşındı)
    siddetSerisi?: number[];
    tetikleyiciler?: string[];
    vurucuOlay?: string; tetikleyicilerNot?: string;
  };
  // BDT bilişsel-davranışsal-duygusal profil (eski AnamnezForm'dan birleştirildi).
  bdt?: {
    otomatikDusunce?: string;
    benInanci?: string; dunyaInanci?: string; gelecekInanci?: string;
    bilisselHatalar?: string[];
    kacinanDurumlar?: string; guvenlikDavranislari?: string;
    baskinDuygular?: string[]; duyguTetikleyicileri?: string; duyguDuzenleme?: string;
    gunlukEtki?: string;
  };
  psikiyatrik?: {
    tanilar?: string[];
    yatis?: { var: boolean; detay?: string };
    ilaclar?: { ad: string; doz: string; sure: string }[];
    gecmisTerapi?: string;
  };
  tibbi?:    { kronik?: string[]; ameliyat?: string; ilac?: string; alerji?: string };
  aile?:     { genogram?: string; psikopatoloji?: string[]; maddeAile?: string };
  madde?:    { sigara?: string; alkol?: string; madde?: string; auditSkor?: number; dastSkor?: number };
  gelisim?:  { erkenYasam?: string; okul?: string; sosyal?: string; travmaBelirti?: string };
  isSosyal?: { isDurumu?: string; memnuniyet?: number; destekAgi?: { kisi: string; iliski: string }[] };
  iliskiler?:{ romantik?: string; cocuklar?: string; baglanma?: string };
  travma?:   { tipler?: string[]; yas?: string; tekrar?: string; aceSkor?: number; aceItems?: boolean[] };
  risk?: {
    intihar?: 'yok' | 'var' | 'plan' | 'girisim';
    zarar?:   'yok' | 'gecmis' | 'aktif';
    baskasi?: 'yok' | 'risk';
    seviye?:  RiskLevel;
    notu?:    string;
  };
  hedefler?: { beklenti?: string; hedefler3?: string[]; birYil?: string; gucluYonler?: string };
  olcekler?: {
    phq9?: { skor: number; sinif: string; tarih: string; importedFromPreForm?: boolean };
    gad7?: { skor: number; sinif: string; tarih: string; importedFromPreForm?: boolean };
    bai?:  { skor: number; sinif: string; tarih: string };
    bdi?:  { skor: number; sinif: string; tarih: string };
    otherScores?: { ad: string; skor: number; tarih: string }[];
  };
  gozlem?: {
    gorunus?: { not?: string; abnormal?: boolean };
    davranis?: { not?: string; abnormal?: boolean };
    konusma?: { not?: string; abnormal?: boolean };
    duygu?: { not?: string; abnormal?: boolean };
    dusunce?: { not?: string; abnormal?: boolean };
    bilis?: { not?: string; abnormal?: boolean };
    icgoru?: { not?: string; abnormal?: boolean };
    ilkIntibal?: string;
  };
  klinisyenNotu?: string;
};

export type PreFormResponse = { question: string; answer: string };

export type AnamnezPanelProps = {
  client?:        { id: string; name: string; age?: number; issue?: string };
  data?:          AnamnezData;
  activeSection?: AnamnezSection;
  onChangeSection?: (s: AnamnezSection) => void;
  onChange?:        <K extends keyof AnamnezData>(section: K, value: AnamnezData[K]) => void;
  onSaveDraft?:     () => void;
  lastSavedAt?:     string;            // "2 dk önce"
  preFormResponses?: PreFormResponse[];
  onImportPreForm?:        () => void;
  onProceedToFormulation?: () => void;
  onExportPdf?:  () => void;
  onShare?:      () => void;
  onDelete?:     () => void;
  onOpenScale?:  (which: 'phq9' | 'gad7' | 'bai' | 'bdi') => void;
  onOpenEmergencyProtocol?: () => void;
};

// ─── Section metadata ─────────────────────────────────────────────────────

const SECTIONS: {
  key:       AnamnezSection;
  title:     string;
  short:     string;
  icon:      typeof User;
  required?: boolean;
}[] = [
  { key: 'demografik',  title: 'Demografik Bilgiler',          short: 'Demografik',  icon: User },
  { key: 'basvuru',     title: 'Başvuru ve Ana Yakınma',       short: 'Başvuru',     icon: MessageSquare },
  { key: 'sikayet',     title: 'Şikayet Öyküsü',                short: 'Şikayet',     icon: Activity },
  { key: 'psikiyatrik', title: 'Psikiyatrik Öykü',              short: 'Psikiyatrik', icon: Pill },
  { key: 'tibbi',       title: 'Tıbbi Öykü',                    short: 'Tıbbi',       icon: Stethoscope },
  { key: 'aile',        title: 'Aile Öyküsü',                   short: 'Aile',        icon: Users },
  { key: 'madde',       title: 'Madde Kullanımı',               short: 'Madde',       icon: Wine },
  { key: 'gelisim',     title: 'Gelişim ve Eğitim',             short: 'Gelişim',     icon: GraduationCap },
  { key: 'is-sosyal',   title: 'İş ve Sosyal Yaşam',            short: 'İş & Sosyal', icon: Briefcase },
  { key: 'iliskiler',   title: 'İlişkiler ve Aile',             short: 'İlişkiler',   icon: Heart },
  { key: 'travma',      title: 'Travma Öyküsü',                 short: 'Travma',      icon: Skull },
  { key: 'risk',        title: 'Risk Değerlendirmesi',          short: 'Risk',        icon: ShieldAlert, required: true },
  { key: 'hedefler',    title: 'Hedefler ve Beklentiler',       short: 'Hedefler',    icon: Target },
  { key: 'olcekler',    title: 'Ölçekler',                      short: 'Ölçekler',    icon: Gauge },
  { key: 'gozlem',      title: 'Klinisyen Gözlemi',             short: 'Gözlem',      icon: Eye },
];

// ─── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_CLIENT = { id: '142', name: 'Elif Yıldız', age: 28, issue: 'Sosyal kaygı — sunum ve toplantılarda donma' };

const DEFAULT_DATA: AnamnezData = {
  demografik: {
    adSoyad: 'Elif Yıldız', yas: 28, cinsiyet: 'Kadın',
    egitim: 'Lisans', meslek: 'Grafik tasarımcı',
    medeniDurum: 'Bekar', cocukSayisi: 0, sehir: 'İstanbul',
  },
  basvuru: {
    sebep: 'Son 9 aydır iş yerinde sunumlar sırasında donuyorum, sonrasında günlerce kendimi yargılıyorum. Artık toplantılardan da kaçınmaya başladım.',
    yonlendiren: 'Aile hekimi — Dr. Ayhan T.',
    hedef: 'Maruziyet protokolü için iskelet kurma',
  },
  sikayet: {
    baslangic: '2025 Eylül · ekip toplantısında sunum sırasında donma',
    seyir: 'İlk olayın ardından kademeli kötüleşme; toplantı, kalabalık ortam, hatta sosyal yemekler kaçınılıyor. SUDS başlangıçta 4/10 idi, 9 aya kadar 9/10\'a çıktı; son 3 haftada terapiyle 5\'e indi.',
    siddetSerisi: [3, 5, 7, 8, 9, 7, 6, 5],
    tetikleyiciler: ['Ekip sunumu', 'Kalabalık asansör', 'Tanımadığı insanlarla yemek', 'Kamera açık toplantı'],
  },
  psikiyatrik: {
    tanilar:     ['Sosyal anksiyete bozukluğu (2025)'],
    yatis:       { var: false },
    ilaclar:     [{ ad: 'Sertralin', doz: '50 mg', sure: '3 ay' }],
    gecmisTerapi:'2022\'de 4 seans BDT — taşınma nedeniyle sonlandı.',
  },
  tibbi:   { kronik: [], ameliyat: '—', ilac: '—', alerji: '—' },
  aile:    { genogram: 'Anne 58, baba 62, kardeş 24. Anne eleştirel-mesafeli, baba sıcak ama uzaklaşmış.', psikopatoloji: ['Anne — depresyon (50 yaş)'], maddeAile: 'Baba sosyal içicilik.' },
  madde:   { sigara: 'Yok', alkol: 'Sosyal — ayda 1-2', madde: 'Yok' },
  gelisim: { erkenYasam: 'Sağlıklı; bebeklik fotoğrafları sıcak.', okul: 'Yüksek başarı, sosyal olarak çekingen.', sosyal: 'Az ama derin arkadaşlık.', travmaBelirti: '12 yaşında orta okulda dışlanma.' },
  isSosyal:{ isDurumu: 'Tam zamanlı grafik tasarımcı, 3 yıldır', memnuniyet: 7, destekAgi: [{ kisi: 'Selin', iliski: 'Yakın arkadaş' }, { kisi: 'Mert', iliski: 'Eş düzey iş arkadaşı' }] },
  iliskiler:{ romantik: 'Bekar, 2 yıldır ilişki yok.', cocuklar: '—', baglanma: 'Anne — eleştirel; arkadaş Selin — güvenli.' },
  travma:  { tipler: ['Duygusal'], yas: '12, sürekli', tekrar: 'Çocukluk boyunca', aceSkor: 3, aceItems: [false, true, false, false, false, true, false, false, true, false] },
  risk:    { intihar: 'yok', zarar: 'yok', baskasi: 'yok', seviye: 'dusuk' },
  hedefler:{ beklenti: 'Toplantılarda susmadan konuşabilmek, sunum yapabilmek.', hedefler3: ['Aylık 1 toplantıda söz almak', 'Sergi açılışına gitmek', '"Hata yaparsam kaybolurum" inancıyla çalışmak'], birYil: 'Sunumlar zorlamasız akar; sosyal hayat genişlemiş; yaratıcılık değerini daha çok yaşıyorum.' },
  olcekler:{
    phq9: { skor: 8,  sinif: 'Hafif',   tarih: '2025.11.04', importedFromPreForm: true },
    gad7: { skor: 14, sinif: 'Orta',    tarih: '2025.11.04', importedFromPreForm: true },
    bai:  { skor: 18, sinif: 'Orta',    tarih: '2026.02.15' },
    otherScores: [{ ad: 'LSAS', skor: 64, tarih: '2025.11.18' }],
  },
  gozlem: {
    gorunus:  { not: 'Yaşına uygun, bakımlı.',                                 abnormal: false },
    davranis: { not: 'Göz teması düşük, eller titriyor.',                       abnormal: true  },
    konusma:  { not: 'Hızlı, ara ara duraklama.',                               abnormal: false },
    duygu:    { not: 'Kaygılı; affect daralmış.',                               abnormal: true  },
    dusunce:  { not: '"Beni yargılıyorlar" tekrar eden tema; içgörü mevcut.',  abnormal: false },
    bilis:    { not: 'Oryantasyon, dikkat, bellek korunmuş.',                   abnormal: false },
    icgoru:   { not: 'Yüksek — kaçınma örüntüsünü kendisi adlandırıyor.',     abnormal: false },
    ilkIntibal:'Yaratıcılığını arayan, kendine fazla yüklenmiş, terapiye hazır bir danışan. Yüksek motivasyon. ACT + kademeli maruziyet protokolü uygun görünüyor.',
  },
  klinisyenNotu: '',
};

const DEFAULT_PREFORM: PreFormResponse[] = [
  { question: 'Hangi konuda yardım almak istiyorsunuz?',  answer: 'Sunum / toplantı kaygısı, kaçınma davranışları.' },
  { question: 'Daha önce terapi aldınız mı?',              answer: 'Evet, 2022\'de 4 seans BDT.' },
  { question: 'PHQ-9 toplam puan',                          answer: '8 (hafif)' },
  { question: 'GAD-7 toplam puan',                          answer: '14 (orta)' },
  { question: 'İntihar düşüncesi son 2 hafta',              answer: 'Hayır.' },
  { question: 'Beklentiniz nedir?',                          answer: 'Toplantılarda susmadan konuşabilmek.' },
];

const ACE_QUESTIONS = [
  'Aile içinde sözel istismar', 'Aile içinde fiziksel istismar', 'Aile içinde cinsel istismar',
  'Duygusal ihmal', 'Fiziksel ihmal', 'Ebeveyn ayrılığı/boşanma',
  'Annenin şiddet görmesi', 'Aile içinde madde kullanımı', 'Aile içinde ruhsal hastalık',
  'Aile bireyinin hapse girmesi',
];

const MMSE_FIELDS: { key: keyof NonNullable<AnamnezData['gozlem']>; label: string }[] = [
  { key: 'gorunus',  label: 'Görünüş' },
  { key: 'davranis', label: 'Davranış' },
  { key: 'konusma',  label: 'Konuşma' },
  { key: 'duygu',    label: 'Duygu / Affect' },
  { key: 'dusunce',  label: 'Düşünce içeriği' },
  { key: 'bilis',    label: 'Bilişsel işlevler' },
  { key: 'icgoru',   label: 'İçgörü' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function calcCompleteness(section: AnamnezSection, data: AnamnezData): number {
  const v = data[sectionKey(section)] as Record<string, unknown> | undefined;
  if (!v) return 0;
  const keys = Object.keys(v);
  if (keys.length === 0) return 0;
  let filled = 0;
  for (const k of keys) {
    const val = (v as Record<string, unknown>)[k];
    if (val == null) continue;
    if (Array.isArray(val) && val.length === 0) continue;
    if (typeof val === 'string' && val.trim() === '') continue;
    if (typeof val === 'object' && Object.keys(val as object).length === 0) continue;
    filled += 1;
  }
  return Math.round((filled / keys.length) * 100);
}

function sectionKey(s: AnamnezSection): keyof AnamnezData {
  if (s === 'is-sosyal') return 'isSosyal';
  return s as keyof AnamnezData;
}

function computeRiskLevel(risk: NonNullable<AnamnezData['risk']>): RiskLevel {
  if (risk.intihar === 'plan' || risk.intihar === 'girisim') return 'yuksek';
  if (risk.intihar === 'var' || risk.zarar === 'aktif' || risk.baskasi === 'risk') return 'orta';
  return 'dusuk';
}

// ─── Component ────────────────────────────────────────────────────────────

export default function AnamnezPanel({
  client = DEFAULT_CLIENT,
  data: dataProp,
  activeSection: activeSectionProp,
  onChangeSection,
  onChange,
  onSaveDraft,
  lastSavedAt = '2 dk önce',
  preFormResponses = DEFAULT_PREFORM,
  onImportPreForm,
  onProceedToFormulation,
  onExportPdf, onShare, onDelete,
  onOpenScale,
  onOpenEmergencyProtocol,
}: AnamnezPanelProps) {
  const [dataState, setDataState] = useState<AnamnezData>(dataProp ?? DEFAULT_DATA);
  const [activeState, setActiveState] = useState<AnamnezSection>(activeSectionProp ?? 'demografik');
  const [sideOpen, setSideOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync prop → state when parent re-supplies data
  useEffect(() => { if (dataProp) setDataState(dataProp); }, [dataProp]);
  useEffect(() => { if (activeSectionProp) setActiveState(activeSectionProp); }, [activeSectionProp]);

  const data = dataState;
  const active = activeState;

  const setActive = (s: AnamnezSection) => {
    setActiveState(s);
    onChangeSection?.(s);
  };

  const update = useCallback(<K extends keyof AnamnezData>(section: K, value: AnamnezData[K]) => {
    setDataState((prev) => ({ ...prev, [section]: { ...(prev[section] as object), ...(value as object) } }));
    onChange?.(section, value);
  }, [onChange]);

  // Per-section completeness (memoized)
  const completeness = useMemo(() => {
    const out: Record<AnamnezSection, number> = {} as Record<AnamnezSection, number>;
    for (const s of SECTIONS) out[s.key] = calcCompleteness(s.key, data);
    return out;
  }, [data]);

  const overallPct = useMemo(() => {
    const sum = SECTIONS.reduce((a, s) => a + completeness[s.key], 0);
    return Math.round(sum / SECTIONS.length);
  }, [completeness]);

  const completedCount = useMemo(
    () => SECTIONS.filter((s) => completeness[s.key] >= 80).length,
    [completeness],
  );

  const riskLevel: RiskLevel = data.risk ? (data.risk.seviye ?? computeRiskLevel(data.risk)) : 'dusuk';
  const riskOpen = active === 'risk' || riskLevel === 'yuksek';

  // Esc closes the more-menu
  useEffect(() => {
    if (!menuOpen) return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [menuOpen]);

  // Prev/next navigation
  const idx = SECTIONS.findIndex((s) => s.key === active);
  const prev = idx > 0 ? SECTIONS[idx - 1] : null;
  const next = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;
  const activeMeta = SECTIONS[idx];

  const canProceed = completeness['risk'] >= 70 && completeness['basvuru'] >= 50;

  return (
    <div className="an" data-screen-label="07 Anamnez" data-section={active}>
      {/* ── TOP BAR ────────────────────────────────────── */}
      <header className="an-top">
        <div className="an-top-left">
          <button type="button" className="an-icon-btn" aria-label="Geri">
            <ArrowLeft size={14} strokeWidth={1.8} />
          </button>
          <div className="an-top-title">
            <span className="an-eyebrow">anamnez · v1 taslak</span>
            <h1>
              {client.name.split(' ').slice(0, -1).join(' ')}{' '}
              <em>{client.name.split(' ').slice(-1)[0]}</em>
            </h1>
          </div>
        </div>

        <div className="an-top-mid">
          <div className="an-progress">
            <span className="an-progress-bar">
              <span style={{ width: `${overallPct}%` }} />
            </span>
            <span className="an-progress-num">%{overallPct}</span>
          </div>
          <span className="an-saved">
            <Save size={11} strokeWidth={1.8} />
            Otomatik kaydedildi · {lastSavedAt}
          </span>
        </div>

        <div className="an-top-right">
          <button type="button" className="an-btn an-btn-ghost" onClick={onImportPreForm}>
            <FileText size={13} strokeWidth={1.8} />
            Ön-formdan içe aktar
          </button>
          <button
            type="button"
            className="an-btn an-btn-primary"
            disabled={!canProceed}
            onClick={onProceedToFormulation}
            title={canProceed ? 'Formülasyona geç' : 'Risk ve Başvuru bölümlerini tamamlayın'}
          >
            Formülasyona geç
            <ArrowRight size={13} strokeWidth={1.8} />
          </button>
          <div className="an-more-wrap">
            <button
              type="button"
              className={`an-icon-btn ${menuOpen ? 'active' : ''}`}
              aria-label="Daha fazla"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal size={15} strokeWidth={1.8} />
            </button>
            {menuOpen && (
              <div className="an-more-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => { onExportPdf?.(); setMenuOpen(false); }}>
                  <FileDown size={13} strokeWidth={1.8} /> PDF al
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

      {/* ── BODY ───────────────────────────────────────── */}
      <div className="an-body">
        {/* LEFT NAV */}
        <aside className="an-nav">
          <div className="an-nav-summary">
            <div>
              <span className="an-eyebrow">tamamlanma</span>
              <div className="an-nav-summary-num">
                {completedCount}<em>/{SECTIONS.length}</em>
              </div>
            </div>
            <div>
              <span className="an-eyebrow">risk</span>
              <span className={`an-risk-pill r-${riskLevel}`}>
                {riskLevel === 'dusuk'  ? 'Düşük' :
                 riskLevel === 'orta'   ? 'Orta'  : 'Yüksek'}
              </span>
            </div>
          </div>

          <ul className="an-nav-list">
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
                    className={`an-nav-item ${active === s.key ? 'on' : ''} ${s.required ? 'required' : ''}`}
                    onClick={() => setActive(s.key)}
                  >
                    <span className="an-nav-ix">{String(i + 1).padStart(2, '0')}</span>
                    <span className="an-nav-icon"><Icon size={14} strokeWidth={1.6} /></span>
                    <span className="an-nav-name">{s.short}</span>
                    <span className="an-nav-status">
                      {done && <Check size={11} strokeWidth={2.4} className="ok" />}
                      {missing && <AlertTriangle size={11} strokeWidth={2} className="warn" />}
                      {partial && <span className="an-nav-pct">{pct}%</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="an-nav-foot">
            <button
              type="button"
              className="an-nav-item ghost"
              onClick={() => setActive('gozlem')}
            >
              <NotebookPen size={14} strokeWidth={1.6} />
              <span>Klinisyen notları</span>
            </button>
          </div>
        </aside>

        {/* CENTER */}
        <main className="an-form">
          <div className="an-form-head">
            <span className="an-eyebrow">bölüm {idx + 1} / {SECTIONS.length}{activeMeta.required ? ' · zorunlu' : ''}</span>
            <h2 className="an-form-title">
              {activeMeta.title.split(' ').slice(0, -1).join(' ')}{' '}
              <em>{activeMeta.title.split(' ').slice(-1)[0]}</em>
            </h2>
          </div>

          <div className="an-form-body">
            {active === 'demografik'  && <DemografikForm  v={data.demografik}  set={(p) => update('demografik',  { ...data.demografik,  ...p })} />}
            {active === 'basvuru'     && <BasvuruForm     v={data.basvuru}     set={(p) => update('basvuru',     { ...data.basvuru,     ...p })} />}
            {active === 'sikayet'     && <SikayetForm     v={data.sikayet}     set={(p) => update('sikayet',     { ...data.sikayet,     ...p })} />}
            {active === 'psikiyatrik' && <PsikiyatrikForm v={data.psikiyatrik} set={(p) => update('psikiyatrik', { ...data.psikiyatrik, ...p })} />}
            {active === 'tibbi'       && <TibbiForm       v={data.tibbi}       set={(p) => update('tibbi',       { ...data.tibbi,       ...p })} />}
            {active === 'aile'        && <AileForm        v={data.aile}        set={(p) => update('aile',        { ...data.aile,        ...p })} />}
            {active === 'madde'       && <MaddeForm       v={data.madde}       set={(p) => update('madde',       { ...data.madde,       ...p })} />}
            {active === 'gelisim'     && <GelisimForm     v={data.gelisim}     set={(p) => update('gelisim',     { ...data.gelisim,     ...p })} />}
            {active === 'is-sosyal'   && <IsSosyalForm    v={data.isSosyal}    set={(p) => update('isSosyal',    { ...data.isSosyal,    ...p })} />}
            {active === 'iliskiler'   && <IliskilerForm   v={data.iliskiler}   set={(p) => update('iliskiler',   { ...data.iliskiler,   ...p })} />}
            {active === 'travma'      && <TravmaForm      v={data.travma}      set={(p) => update('travma',      { ...data.travma,      ...p })} />}
            {active === 'risk'        && (
              <RiskForm
                v={data.risk}
                set={(p) => {
                  const merged = { ...data.risk, ...p };
                  update('risk', { ...merged, seviye: computeRiskLevel(merged) });
                }}
                onOpenEmergencyProtocol={onOpenEmergencyProtocol}
              />
            )}
            {active === 'hedefler'    && <HedeflerForm    v={data.hedefler}    set={(p) => update('hedefler',    { ...data.hedefler,    ...p })} />}
            {active === 'olcekler'    && <OlceklerForm    v={data.olcekler}    set={(p) => update('olcekler',    { ...data.olcekler,    ...p })} onOpenScale={onOpenScale} />}
            {active === 'gozlem'      && <GozlemForm      v={data.gozlem}      set={(p) => update('gozlem',      { ...data.gozlem,      ...p })} />}
          </div>
        </main>

        {/* RIGHT CONTEXT PANEL */}
        <aside className={`an-side ${sideOpen ? '' : 'col'}`}>
          <button
            type="button" className="an-side-collapse"
            onClick={() => setSideOpen((v) => !v)}
            aria-label={sideOpen ? 'Bağlam panelini kapat' : 'Bağlam panelini aç'}
            aria-expanded={sideOpen}
          >
            {sideOpen ? <ChevronRight size={14} strokeWidth={1.8} /> : <ChevronLeft size={14} strokeWidth={1.8} />}
          </button>
          {sideOpen ? (
            <div className="an-side-body">
              {preFormResponses.length > 0 && (
                <SideCard title="Ön-form yanıtları" eyebrow="token form">
                  <ul className="an-preform">
                    {preFormResponses.slice(0, 4).map((r, i) => (
                      <li key={i}>
                        <span className="an-eyebrow">{r.question}</span>
                        <p>{r.answer}</p>
                      </li>
                    ))}
                  </ul>
                  {preFormResponses.length > 4 && (
                    <span className="an-side-more">+{preFormResponses.length - 4} daha</span>
                  )}
                  <button type="button" className="an-btn an-btn-ghost an-btn-block" onClick={onImportPreForm}>
                    <Download size={13} strokeWidth={1.8} /> İçe aktar
                  </button>
                </SideCard>
              )}

              <SideCard title="Önerilen ölçekler" eyebrow="ai · yakınma + yaş" tone="accent">
                <ul className="an-scale-suggest">
                  <li>
                    <strong>LSAS</strong>
                    <span>Sosyal kaygıya özel — sunum kaçınması ile uyumlu.</span>
                  </li>
                  <li>
                    <strong>PHQ-9</strong>
                    <span>Eşlik eden depresyon taraması · zaten dolu.</span>
                  </li>
                  <li>
                    <strong>AAQ-II</strong>
                    <span>Psikolojik esneklik ölçümü — ACT için baseline.</span>
                  </li>
                </ul>
              </SideCard>

              {riskOpen && (
                <SideCard title="Risk durumu" eyebrow="dinamik" tone={riskLevel === 'yuksek' ? 'risk' : 'warn'}>
                  <p className="an-side-risk">
                    <strong>{
                      riskLevel === 'yuksek' ? 'Yüksek risk' :
                      riskLevel === 'orta'   ? 'Orta risk'   : 'Düşük risk'
                    }</strong>
                    {' '}— Risk bölümündeki yanıtlara göre güncellendi.
                  </p>
                  {riskLevel === 'yuksek' && (
                    <button type="button" className="an-btn an-btn-primary an-btn-block" onClick={onOpenEmergencyProtocol}>
                      <ShieldAlert size={13} strokeWidth={1.8} /> Acil müdahale protokolü
                      <ArrowRight size={13} strokeWidth={1.8} style={{ marginLeft: 'auto' }} />
                    </button>
                  )}
                </SideCard>
              )}

              <SideCard title="Şablon bul" eyebrow="benzer vakalar">
                <ul className="an-tpl-suggest">
                  <li>
                    <div>
                      <strong>Sosyal kaygı / ACT</strong>
                      <span>4 alan eşleşmesi — başvuru, yaş aralığı, yakınma</span>
                    </div>
                    <button type="button" className="an-btn an-btn-ghost">Uygula</button>
                  </li>
                  <li>
                    <div>
                      <strong>Performans kaygısı / BDT</strong>
                      <span>3 alan eşleşmesi — yakınma + meslek</span>
                    </div>
                    <button type="button" className="an-btn an-btn-ghost">Uygula</button>
                  </li>
                </ul>
              </SideCard>
            </div>
          ) : (
            <span className="an-side-rail">Bağlam</span>
          )}
        </aside>
      </div>

      {/* ── BOTTOM BAR ─────────────────────────────────── */}
      <footer className="an-bottom">
        <button
          type="button" className="an-btn an-btn-ghost"
          disabled={!prev}
          onClick={() => prev && setActive(prev.key)}
        >
          <ArrowLeft size={13} strokeWidth={1.8} /> Önceki
          {prev && <span className="an-bottom-name">· {prev.short}</span>}
        </button>
        <span className="an-bottom-mid">
          <span className="an-eyebrow">{idx + 1} / {SECTIONS.length}</span>
          <strong>{activeMeta.title}</strong>
        </span>
        <div className="an-bottom-right">
          <button type="button" className="an-btn an-btn-ghost" onClick={onSaveDraft}>
            <Save size={13} strokeWidth={1.8} /> Taslağı kaydet
          </button>
          <button
            type="button" className="an-btn an-btn-primary"
            disabled={!next}
            onClick={() => next && setActive(next.key)}
          >
            Sonraki
            {next && <span className="an-bottom-name">· {next.short}</span>}
            <ArrowRight size={13} strokeWidth={1.8} />
          </button>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Atoms — form primitives
// ─────────────────────────────────────────────────────────────────────────

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="an-field">
      <label>
        <span className="an-field-label">
          {label}
          {required && <em className="an-req">·</em>}
        </span>
        {hint && <span className="an-field-hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ cols = 2, children }: { cols?: 2 | 3 | 4; children: ReactNode }) {
  return <div className={`an-row an-row-${cols}`}>{children}</div>;
}

function TextInput({
  value, onChange, placeholder, type = 'text',
}: {
  value: string | number | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'date';
}) {
  return (
    <input
      type={type}
      className="an-input"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
    />
  );
}

function TextArea({
  value, onChange, placeholder, rows = 4, italic,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  italic?: boolean;
}) {
  return (
    <textarea
      className={`an-textarea ${italic ? 'italic' : ''}`}
      value={value ?? ''}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Select({
  value, onChange, options,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select className="an-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>Seçin…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Segment<T extends string>({
  value, options, onChange,
}: {
  value: T | undefined;
  options: { value: T; label: string; tone?: 'good' | 'warn' | 'risk' }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="an-segment" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button" role="radio"
          aria-checked={value === o.value}
          className={`an-segment-btn t-${o.tone ?? 'ink'} ${value === o.value ? 'on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ChipList({
  items, onChange, placeholder = 'Ekle…',
}: {
  items: string[] | undefined;
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const list = items ?? [];
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...list, v]);
    setDraft('');
  };
  return (
    <div className="an-chiplist">
      {list.map((it, i) => (
        <span key={i} className="an-chip">
          {it}
          <button type="button" aria-label="Kaldır" onClick={() => onChange(list.filter((_, j) => j !== i))}>
            <X size={10} strokeWidth={2} />
          </button>
        </span>
      ))}
      <span className="an-chip-input">
        <input
          type="text" value={draft} placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" onClick={add} aria-label="Ekle"><Plus size={11} strokeWidth={2} /></button>
      </span>
    </div>
  );
}

function YesNo({
  value, onChange,
}: { value: boolean | undefined; onChange: (v: boolean) => void }) {
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

// ─────────────────────────────────────────────────────────────────────────
// Form sections
// ─────────────────────────────────────────────────────────────────────────

function DemografikForm({ v, set }: { v?: AnamnezData['demografik']; set: (p: Partial<NonNullable<AnamnezData['demografik']>>) => void }) {
  return (
    <>
      <Row cols={2}>
        <Field label="Ad Soyad" required>
          <TextInput value={v?.adSoyad} onChange={(x) => set({ adSoyad: x })} placeholder="Tam ad" />
        </Field>
        <Field label="Yaş">
          <TextInput type="number" value={v?.yas} onChange={(x) => set({ yas: Number(x) })} placeholder="28" />
        </Field>
      </Row>
      <Row cols={3}>
        <Field label="Cinsiyet">
          <Select value={v?.cinsiyet} onChange={(x) => set({ cinsiyet: x })} options={['Kadın', 'Erkek', 'Non-binary', 'Diğer', 'Belirtmek istemiyor']} />
        </Field>
        <Field label="Eğitim">
          <Select value={v?.egitim} onChange={(x) => set({ egitim: x })} options={['İlkokul', 'Ortaokul', 'Lise', 'Önlisans', 'Lisans', 'Yüksek lisans', 'Doktora']} />
        </Field>
        <Field label="Medeni durum">
          <Select value={v?.medeniDurum} onChange={(x) => set({ medeniDurum: x })} options={['Bekar', 'Birlikte yaşıyor', 'Evli', 'Boşanmış', 'Dul']} />
        </Field>
      </Row>
      <Row cols={3}>
        <Field label="Meslek">
          <TextInput value={v?.meslek} onChange={(x) => set({ meslek: x })} placeholder="Grafik tasarımcı" />
        </Field>
        <Field label="Çocuk sayısı">
          <TextInput type="number" value={v?.cocukSayisi} onChange={(x) => set({ cocukSayisi: Number(x) })} placeholder="0" />
        </Field>
        <Field label="Yaşadığı şehir">
          <TextInput value={v?.sehir} onChange={(x) => set({ sehir: x })} placeholder="İstanbul" />
        </Field>
      </Row>
    </>
  );
}

function BasvuruForm({ v, set }: { v?: AnamnezData['basvuru']; set: (p: Partial<NonNullable<AnamnezData['basvuru']>>) => void }) {
  return (
    <>
      <Field label="Başvuru sebebi (yakınma)" required hint="Danışanın kendi cümleleriyle olduğu gibi alıntılayın.">
        <TextArea italic rows={4} value={v?.sebep}
          onChange={(x) => set({ sebep: x })}
          placeholder='"Son 9 aydır toplantılarda donuyorum…"' />
      </Field>
      <Row cols={2}>
        <Field label="Başvuru yolu" hint="Kim/ne yönlendirdi">
          <TextInput value={v?.yonlendiren} onChange={(x) => set({ yonlendiren: x })} placeholder="Aile hekimi · Dr." />
        </Field>
        <Field label="Bu seansta hedefim">
          <TextInput value={v?.hedef} onChange={(x) => set({ hedef: x })} placeholder="Maruziyet protokolünün iskeleti" />
        </Field>
      </Row>
    </>
  );
}

function SikayetForm({ v, set }: { v?: AnamnezData['sikayet']; set: (p: Partial<NonNullable<AnamnezData['sikayet']>>) => void }) {
  const series = v?.siddetSerisi ?? [];
  const updateSeries = (i: number, val: number) => {
    const next = [...series];
    next[i] = Math.max(0, Math.min(10, val));
    set({ siddetSerisi: next });
  };
  return (
    <>
      <Field label="Şikayetin başlangıcı" hint="Tarih + tetikleyici olay">
        <TextInput value={v?.baslangic} onChange={(x) => set({ baslangic: x })} placeholder="2025 Eylül · ekip toplantısında donma" />
      </Field>
      <Field label="Seyir">
        <TextArea rows={5} value={v?.seyir} onChange={(x) => set({ seyir: x })} placeholder="Şikayetin zaman içindeki gidişatı…" />
      </Field>
      <Field label="Şiddet zaman çizgisi" hint="Çubukları sürükleyerek değiştir · 0-10 SUDS">
        <SeverityTimeline series={series} onChange={updateSeries} />
      </Field>
      <Field label="Tetikleyici durumlar">
        <ChipList items={v?.tetikleyiciler} onChange={(x) => set({ tetikleyiciler: x })} placeholder="Yeni tetikleyici…" />
      </Field>
    </>
  );
}

function SeverityTimeline({ series, onChange }: { series: number[]; onChange: (i: number, v: number) => void }) {
  const onPointerDown = (i: number, e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startVal = series[i];
    const move = (ev: PointerEvent) => {
      const dy = startY - ev.clientY;
      const delta = Math.round(dy / 8);
      onChange(i, Math.max(0, Math.min(10, startVal + delta)));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const len = series.length || 1;
  return (
    <div className="an-timeline">
      <div className="an-timeline-bars">
        {(series.length ? series : [0]).map((v, i) => (
          <button
            key={i} type="button" className="an-timeline-bar"
            onPointerDown={(e) => onPointerDown(i, e)}
            aria-label={`Nokta ${i + 1}: ${v}/10`}
          >
            <span className="track" />
            <span className="fill" style={{ height: `${(v / 10) * 100}%` }} />
            <span className="value">{v}</span>
          </button>
        ))}
      </div>
      <div className="an-timeline-axis">
        <span>başlangıç</span>
        <span>bugün</span>
      </div>
      <div className="an-timeline-actions">
        <button type="button" className="an-btn an-btn-ghost sm" onClick={() => onChange(len, 0)}>
          <Plus size={11} strokeWidth={2} /> Nokta ekle
        </button>
      </div>
    </div>
  );
}

function PsikiyatrikForm({ v, set }: { v?: AnamnezData['psikiyatrik']; set: (p: Partial<NonNullable<AnamnezData['psikiyatrik']>>) => void }) {
  const ilaclar = v?.ilaclar ?? [];
  const updateIlac = (i: number, patch: Partial<typeof ilaclar[number]>) => {
    const next = [...ilaclar];
    next[i] = { ...next[i], ...patch };
    set({ ilaclar: next });
  };
  return (
    <>
      <Field label="Geçmiş tanılar">
        <ChipList items={v?.tanilar} onChange={(x) => set({ tanilar: x })} placeholder="Tanı + yıl…" />
      </Field>
      <Field label="Hastane yatışı">
        <YesNo value={v?.yatis?.var} onChange={(yes) => set({ yatis: { var: yes, detay: v?.yatis?.detay } })} />
        {v?.yatis?.var && (
          <div style={{ marginTop: 10 }}>
            <TextArea rows={2} value={v.yatis.detay}
              onChange={(x) => set({ yatis: { var: true, detay: x } })}
              placeholder="Tarih, neden, süre" />
          </div>
        )}
      </Field>
      <Field label="İlaç kullanımı" hint="Halen ve geçmiş psikiyatrik ilaçlar">
        <div className="an-medlist">
          {ilaclar.map((m, i) => (
            <div key={i} className="an-medrow">
              <input className="an-input" placeholder="İlaç adı" value={m.ad}  onChange={(e) => updateIlac(i, { ad: e.target.value })} />
              <input className="an-input" placeholder="Doz"      value={m.doz} onChange={(e) => updateIlac(i, { doz: e.target.value })} />
              <input className="an-input" placeholder="Süre"     value={m.sure} onChange={(e) => updateIlac(i, { sure: e.target.value })} />
              <button type="button" className="an-icon-btn sm" aria-label="Sil" onClick={() => set({ ilaclar: ilaclar.filter((_, j) => j !== i) })}>
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          ))}
          <button type="button" className="an-btn an-btn-ghost sm" onClick={() => set({ ilaclar: [...ilaclar, { ad: '', doz: '', sure: '' }] })}>
            <Plus size={11} strokeWidth={2} /> Yeni ilaç
          </button>
        </div>
      </Field>
      <Field label="Geçmiş terapi" hint="Kim, ne kadar, sonlanma sebebi">
        <TextArea rows={3} value={v?.gecmisTerapi} onChange={(x) => set({ gecmisTerapi: x })} placeholder="2022 · 4 seans BDT · taşınma nedeniyle son" />
      </Field>
    </>
  );
}

function TibbiForm({ v, set }: { v?: AnamnezData['tibbi']; set: (p: Partial<NonNullable<AnamnezData['tibbi']>>) => void }) {
  return (
    <>
      <Field label="Kronik hastalık">
        <ChipList items={v?.kronik} onChange={(x) => set({ kronik: x })} placeholder="Kronik tanı…" />
      </Field>
      <Row cols={2}>
        <Field label="Ameliyat öyküsü">
          <TextArea rows={2} value={v?.ameliyat} onChange={(x) => set({ ameliyat: x })} placeholder="Tip + yıl" />
        </Field>
        <Field label="Kullanılan ilaç (psikiyatri dışı)">
          <TextArea rows={2} value={v?.ilac} onChange={(x) => set({ ilac: x })} placeholder="Sürekli kullanılan ilaçlar" />
        </Field>
      </Row>
      <Field label="Alerji">
        <TextInput value={v?.alerji} onChange={(x) => set({ alerji: x })} placeholder="—" />
      </Field>
    </>
  );
}

function AileForm({ v, set }: { v?: AnamnezData['aile']; set: (p: Partial<NonNullable<AnamnezData['aile']>>) => void }) {
  return (
    <>
      <Field label="Aile genogramı" hint="Kısa metinsel açıklama — figürler arası ilişki ve mesafe">
        <TextArea rows={5} value={v?.genogram} onChange={(x) => set({ genogram: x })} placeholder="Anne 58 — eleştirel; baba 62 — sıcak ama uzaklaşmış; kardeş…" />
      </Field>
      <Field label="Ailede psikopatoloji">
        <ChipList items={v?.psikopatoloji} onChange={(x) => set({ psikopatoloji: x })} placeholder="Yakın + tanı…" />
      </Field>
      <Field label="Alkol/madde aile öyküsü">
        <TextInput value={v?.maddeAile} onChange={(x) => set({ maddeAile: x })} placeholder="Yakın derecesi + madde" />
      </Field>
    </>
  );
}

function MaddeForm({ v, set }: { v?: AnamnezData['madde']; set: (p: Partial<NonNullable<AnamnezData['madde']>>) => void }) {
  return (
    <>
      <Row cols={3}>
        <Field label="Sigara">
          <TextInput value={v?.sigara} onChange={(x) => set({ sigara: x })} placeholder="Yok / 5/gün · 3 yıl" />
        </Field>
        <Field label="Alkol">
          <TextInput value={v?.alkol} onChange={(x) => set({ alkol: x })} placeholder="Sosyal · ayda 1-2" />
        </Field>
        <Field label="Diğer madde">
          <TextInput value={v?.madde} onChange={(x) => set({ madde: x })} placeholder="Yok / Tip · sıklık" />
        </Field>
      </Row>
      <Row cols={2}>
        <Field label="AUDIT skoru" hint="Alkol kullanımı tarama">
          <TextInput type="number" value={v?.auditSkor} onChange={(x) => set({ auditSkor: Number(x) })} placeholder="0-40" />
        </Field>
        <Field label="DAST skoru" hint="Madde kullanımı tarama">
          <TextInput type="number" value={v?.dastSkor} onChange={(x) => set({ dastSkor: Number(x) })} placeholder="0-10" />
        </Field>
      </Row>
    </>
  );
}

function GelisimForm({ v, set }: { v?: AnamnezData['gelisim']; set: (p: Partial<NonNullable<AnamnezData['gelisim']>>) => void }) {
  return (
    <>
      <Field label="Erken yaşam" hint="0-6 yaş · doğum öyküsü, bakım veren ilişkisi">
        <TextArea rows={4} value={v?.erkenYasam} onChange={(x) => set({ erkenYasam: x })} placeholder="Sağlıklı doğum; emzirme süresi…" />
      </Field>
      <Row cols={2}>
        <Field label="Okul başarısı">
          <TextInput value={v?.okul} onChange={(x) => set({ okul: x })} placeholder="Yüksek başarı / akademik zorluk" />
        </Field>
        <Field label="Sosyal uyum">
          <TextInput value={v?.sosyal} onChange={(x) => set({ sosyal: x })} placeholder="Çevre ile ilişki" />
        </Field>
      </Row>
      <Field label="Erken travma belirti / dönüm noktası">
        <TextArea rows={3} value={v?.travmaBelirti} onChange={(x) => set({ travmaBelirti: x })} placeholder="12 yaşında okulda dışlanma…" />
      </Field>
    </>
  );
}

function IsSosyalForm({ v, set }: { v?: AnamnezData['isSosyal']; set: (p: Partial<NonNullable<AnamnezData['isSosyal']>>) => void }) {
  const destek = v?.destekAgi ?? [];
  return (
    <>
      <Field label="İş durumu">
        <TextArea rows={2} value={v?.isDurumu} onChange={(x) => set({ isDurumu: x })} placeholder="Tam zamanlı · grafik tasarımcı · 3 yıldır" />
      </Field>
      <Field label="İş memnuniyeti" hint="0-10 skala">
        <div className="an-slider-wrap">
          <input
            type="range" min={0} max={10} step={1}
            className="an-slider"
            value={v?.memnuniyet ?? 5}
            onChange={(e) => set({ memnuniyet: Number(e.target.value) })}
          />
          <span className="an-slider-val">{v?.memnuniyet ?? 5}<em>/10</em></span>
        </div>
      </Field>
      <Field label="Sosyal destek ağı" hint="Yakın kişiler + ilişki tipi">
        <div className="an-destek">
          {destek.map((d, i) => (
            <div key={i} className="an-destek-row">
              <input className="an-input" placeholder="Kişi" value={d.kisi} onChange={(e) => {
                const next = [...destek]; next[i] = { ...next[i], kisi: e.target.value };
                set({ destekAgi: next });
              }} />
              <input className="an-input" placeholder="İlişki tipi" value={d.iliski} onChange={(e) => {
                const next = [...destek]; next[i] = { ...next[i], iliski: e.target.value };
                set({ destekAgi: next });
              }} />
              <button type="button" className="an-icon-btn sm" aria-label="Sil" onClick={() => set({ destekAgi: destek.filter((_, j) => j !== i) })}>
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          ))}
          <button type="button" className="an-btn an-btn-ghost sm" onClick={() => set({ destekAgi: [...destek, { kisi: '', iliski: '' }] })}>
            <Plus size={11} strokeWidth={2} /> Kişi ekle
          </button>
        </div>
      </Field>
    </>
  );
}

function IliskilerForm({ v, set }: { v?: AnamnezData['iliskiler']; set: (p: Partial<NonNullable<AnamnezData['iliskiler']>>) => void }) {
  return (
    <>
      <Field label="Romantik ilişki">
        <TextArea rows={2} value={v?.romantik} onChange={(x) => set({ romantik: x })} placeholder="Mevcut durum, süre, kalite" />
      </Field>
      <Field label="Çocuklarla ilişki">
        <TextArea rows={2} value={v?.cocuklar} onChange={(x) => set({ cocuklar: x })} placeholder="Çocuk yoksa — geçin" />
      </Field>
      <Field label="Birincil bağlanma figürleri" hint="Geçmiş + bugün — yakın hissedilen, güvenli/güvensiz">
        <TextArea rows={3} value={v?.baglanma} onChange={(x) => set({ baglanma: x })} placeholder="Anne — eleştirel; Selin — güvenli…" />
      </Field>
    </>
  );
}

function TravmaForm({ v, set }: { v?: AnamnezData['travma']; set: (p: Partial<NonNullable<AnamnezData['travma']>>) => void }) {
  const items = v?.aceItems ?? Array(10).fill(false);
  const aceSkor = items.filter(Boolean).length;
  return (
    <>
      <Field label="Travma tipleri" hint="Çoklu seçim">
        <div className="an-chip-options">
          {['Fiziksel', 'Cinsel', 'Duygusal', 'İhmal', 'Kayıp', 'Savaş', 'Diğer'].map((t) => {
            const on = (v?.tipler ?? []).includes(t);
            return (
              <button
                key={t} type="button"
                className={`an-chip-opt ${on ? 'on' : ''}`}
                onClick={() => {
                  const cur = v?.tipler ?? [];
                  set({ tipler: on ? cur.filter((x) => x !== t) : [...cur, t] });
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </Field>
      <Row cols={2}>
        <Field label="Yaş / dönem">
          <TextInput value={v?.yas} onChange={(x) => set({ yas: x })} placeholder="12 · sürekli" />
        </Field>
        <Field label="Tekrarlama">
          <TextInput value={v?.tekrar} onChange={(x) => set({ tekrar: x })} placeholder="Tek seferlik / kronik / aralıklı" />
        </Field>
      </Row>
      <Field label="ACE skoru" hint={`Aşağıdaki 10 sorudan kaçı "Evet" — ${aceSkor}/10`}>
        <ul className="an-ace">
          {ACE_QUESTIONS.map((q, i) => (
            <li key={i}>
              <button
                type="button"
                className={`an-ace-check ${items[i] ? 'on' : ''}`}
                aria-pressed={items[i]}
                onClick={() => {
                  const next = [...items];
                  next[i] = !next[i];
                  set({ aceItems: next, aceSkor: next.filter(Boolean).length });
                }}
              >
                {items[i] && <Check size={11} strokeWidth={2.4} />}
              </button>
              <span>{i + 1}. {q}</span>
            </li>
          ))}
        </ul>
        <div className="an-ace-total">
          <span className="an-eyebrow">ace toplam</span>
          <strong>{aceSkor}<em>/10</em></strong>
        </div>
      </Field>
    </>
  );
}

function RiskForm({
  v, set, onOpenEmergencyProtocol,
}: {
  v?: AnamnezData['risk'];
  set: (p: Partial<NonNullable<AnamnezData['risk']>>) => void;
  onOpenEmergencyProtocol?: () => void;
}) {
  const seviye = v?.seviye ?? (v ? computeRiskLevel(v) : 'dusuk');
  return (
    <>
      <div className="an-risk-banner">
        <ShieldAlert size={14} strokeWidth={2} />
        <p>
          <strong>Zorunlu bölüm.</strong> Yanıtlar formülasyona ve müdahale planına doğrudan
          girer. Lütfen yanıtları danışanın ifadelerine sadık şekilde işaretleyin.
        </p>
      </div>
      <Field label="İntihar düşüncesi" required>
        <Segment<'yok' | 'var' | 'plan' | 'girisim'>
          value={v?.intihar}
          onChange={(x) => set({ intihar: x })}
          options={[
            { value: 'yok',     label: 'Yok',          tone: 'good' },
            { value: 'var',     label: 'Var',          tone: 'warn' },
            { value: 'plan',    label: 'Plan var',     tone: 'risk' },
            { value: 'girisim', label: 'Girişim öyküsü', tone: 'risk' },
          ]}
        />
      </Field>
      <Row cols={2}>
        <Field label="Kendine zarar verme">
          <Segment<'yok' | 'gecmis' | 'aktif'>
            value={v?.zarar}
            onChange={(x) => set({ zarar: x })}
            options={[
              { value: 'yok',    label: 'Yok',     tone: 'good' },
              { value: 'gecmis', label: 'Geçmiş',  tone: 'warn' },
              { value: 'aktif',  label: 'Aktif',   tone: 'risk' },
            ]}
          />
        </Field>
        <Field label="Başkasına zarar riski">
          <Segment<'yok' | 'risk'>
            value={v?.baskasi}
            onChange={(x) => set({ baskasi: x })}
            options={[
              { value: 'yok',  label: 'Yok',     tone: 'good' },
              { value: 'risk', label: 'Risk var', tone: 'risk' },
            ]}
          />
        </Field>
      </Row>

      <div className={`an-risk-summary r-${seviye}`}>
        <div>
          <span className="an-eyebrow">otomatik risk değerlendirmesi</span>
          <h3>{seviye === 'dusuk' ? 'Düşük' : seviye === 'orta' ? 'Orta' : 'Yüksek'} risk</h3>
        </div>
        {seviye === 'yuksek' && (
          <button type="button" className="an-btn an-btn-primary" onClick={onOpenEmergencyProtocol}>
            <ShieldAlert size={13} strokeWidth={1.8} />
            Acil müdahale protokolü
            <ArrowRight size={13} strokeWidth={1.8} />
          </button>
        )}
      </div>

      <Field label="Klinisyen notu" hint="Risk değerlendirmesi için ek kontekst, müdahale seçimleri">
        <TextArea rows={4} italic value={v?.notu} onChange={(x) => set({ notu: x })}
          placeholder="Yakın çevredeki destek, güvenlik planı, güvence mekanizmaları…" />
      </Field>
    </>
  );
}

function HedeflerForm({ v, set }: { v?: AnamnezData['hedefler']; set: (p: Partial<NonNullable<AnamnezData['hedefler']>>) => void }) {
  const hedefler = v?.hedefler3 ?? ['', '', ''];
  return (
    <>
      <Field label="Bu terapiden bekliyorum…">
        <TextArea italic rows={3} value={v?.beklenti} onChange={(x) => set({ beklenti: x })}
          placeholder="Toplantılarda susmadan konuşabilmek…" />
      </Field>
      <Field label="3 somut hedef" hint="Ölçülebilir ve gözlemlenebilir">
        <div className="an-goals">
          {[0, 1, 2].map((i) => (
            <div key={i} className="an-goal">
              <span className="an-goal-ix">{i + 1}.</span>
              <input className="an-input" placeholder="Hedef" value={hedefler[i] ?? ''}
                onChange={(e) => {
                  const next = [...hedefler];
                  next[i] = e.target.value;
                  set({ hedefler3: next });
                }} />
            </div>
          ))}
        </div>
      </Field>
      <Field label="Bir yıl sonra hayatım nasıl olsun?" hint="Değer odaklı / vizyon">
        <TextArea italic rows={4} value={v?.birYil} onChange={(x) => set({ birYil: x })}
          placeholder="Sunumlar zorlamasız akar; sosyal hayat genişlemiş…" />
      </Field>
    </>
  );
}

function OlceklerForm({
  v, set, onOpenScale,
}: {
  v?: AnamnezData['olcekler'];
  set: (p: Partial<NonNullable<AnamnezData['olcekler']>>) => void;
  onOpenScale?: (which: 'phq9' | 'gad7' | 'bai' | 'bdi') => void;
}) {
  const items = [
    { k: 'phq9' as const, name: 'PHQ-9',  desc: 'Depresyon · 9 madde',  v: v?.phq9 },
    { k: 'gad7' as const, name: 'GAD-7',  desc: 'Yaygın anksiyete · 7 madde', v: v?.gad7 },
    { k: 'bai'  as const, name: 'BAI',     desc: 'Beck Anksiyete · 21 madde',  v: v?.bai },
    { k: 'bdi'  as const, name: 'BDI-II',  desc: 'Beck Depresyon · 21 madde',  v: v?.bdi },
  ];
  return (
    <>
      <p className="an-section-intro">
        Klinik ölçekler. Ön-form yanıtlarından gelen sonuçlar otomatik
        rozetli görünür. Tekrar ölçmek için &quot;Başlat&quot;.
      </p>
      <ul className="an-scales">
        {items.map((it) => (
          <li key={it.k} className="an-scale">
            <div className="an-scale-left">
              <h3>{it.name}</h3>
              <span>{it.desc}</span>
            </div>
            <div className="an-scale-mid">
              {it.v ? (
                <>
                  <div className="an-scale-score">
                    {it.v.skor}<em>· {it.v.sinif}</em>
                  </div>
                  <span className="an-scale-date">{it.v.tarih}</span>
                  {(it.v as { importedFromPreForm?: boolean }).importedFromPreForm && (
                    <span className="an-scale-badge">ön-formdan içe aktarıldı</span>
                  )}
                </>
              ) : (
                <span className="an-scale-empty">Henüz ölçülmedi.</span>
              )}
            </div>
            <button type="button" className="an-btn an-btn-ghost" onClick={() => onOpenScale?.(it.k)}>
              {it.v ? 'Tekrar ölç' : 'Başlat'}
              <ArrowRight size={12} strokeWidth={1.8} />
            </button>
          </li>
        ))}
      </ul>
      <Field label="Diğer ölçekler" hint="LSAS, AAQ-II, Y-BOCS gibi özel ölçekler">
        <div className="an-otherscales">
          {(v?.otherScores ?? []).map((s, i) => (
            <div key={i} className="an-otherscale-row">
              <input className="an-input" value={s.ad} placeholder="Ölçek adı" onChange={(e) => {
                const next = [...(v?.otherScores ?? [])]; next[i] = { ...next[i], ad: e.target.value };
                set({ otherScores: next });
              }} />
              <input className="an-input" type="number" value={s.skor} placeholder="Skor" onChange={(e) => {
                const next = [...(v?.otherScores ?? [])]; next[i] = { ...next[i], skor: Number(e.target.value) };
                set({ otherScores: next });
              }} />
              <input className="an-input" value={s.tarih} placeholder="Tarih" onChange={(e) => {
                const next = [...(v?.otherScores ?? [])]; next[i] = { ...next[i], tarih: e.target.value };
                set({ otherScores: next });
              }} />
              <button type="button" className="an-icon-btn sm" aria-label="Sil" onClick={() => set({ otherScores: (v?.otherScores ?? []).filter((_, j) => j !== i) })}>
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          ))}
          <button type="button" className="an-btn an-btn-ghost sm" onClick={() => set({ otherScores: [...(v?.otherScores ?? []), { ad: '', skor: 0, tarih: '' }] })}>
            <Plus size={11} strokeWidth={2} /> Ölçek ekle
          </button>
        </div>
      </Field>
    </>
  );
}

function GozlemForm({ v, set }: { v?: AnamnezData['gozlem']; set: (p: Partial<NonNullable<AnamnezData['gozlem']>>) => void }) {
  return (
    <>
      <p className="an-section-intro">
        Mental durum muayenesi (MMSE) maddeleri. Her madde için kısa serbest metin +
        anormal işaretleme. Anormaller risk panosuna düşer.
      </p>
      <ul className="an-mmse">
        {MMSE_FIELDS.map((f) => {
          const cur = (v?.[f.key] ?? {}) as { not?: string; abnormal?: boolean };
          return (
            <li key={String(f.key)} className={cur.abnormal ? 'abnormal' : ''}>
              <div className="an-mmse-top">
                <span className="an-mmse-name">{f.label}</span>
                <label className="an-checkbox">
                  <input
                    type="checkbox"
                    checked={!!cur.abnormal}
                    onChange={(e) => set({ [f.key]: { ...cur, abnormal: e.target.checked } } as Partial<NonNullable<AnamnezData['gozlem']>>)}
                  />
                  <span>Anormal</span>
                </label>
              </div>
              <input
                className="an-input"
                value={cur.not ?? ''}
                placeholder="Kısa not…"
                onChange={(e) => set({ [f.key]: { ...cur, not: e.target.value } } as Partial<NonNullable<AnamnezData['gozlem']>>)}
              />
            </li>
          );
        })}
      </ul>

      <Field label="İlk izlenim notu" hint="Serbest, klinik, üst-bakış">
        <TextArea italic rows={5} value={v?.ilkIntibal} onChange={(x) => set({ ilkIntibal: x })}
          placeholder="Yaratıcılığını arayan, motive bir danışan…" />
      </Field>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Side card
// ─────────────────────────────────────────────────────────────────────────

function SideCard({
  title, eyebrow, tone, children,
}: { title: string; eyebrow?: string; tone?: 'accent' | 'warn' | 'risk'; children: ReactNode }) {
  return (
    <section className={`an-side-card t-${tone ?? 'ink'}`}>
      <header>
        {eyebrow && <span className="an-eyebrow">{eyebrow}</span>}
        <h3>{title}</h3>
      </header>
      {children}
    </section>
  );
}

// Suppress unused import warning — ClipboardCheck is available for future use
void ClipboardCheck;
void Sparkles;
