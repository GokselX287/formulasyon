export interface AnamnezData {
  basvuruNedeni: string; nasilBuldu: string; oncekiTerapi: boolean | null; oncekiTerapiDetay: string;
  anaGikayet: string; baslangicTarihi: string; tetikleyiciOlay: string;
  seyir: 'surekli' | 'donemsek' | 'giderek-kotulesme' | 'dalgali' | '';
  yogunluk: number; gunlukYasamaEtkisi: string;
  otomatikDusunceler: string; benInanci: string; dunyaInanci: string; gelecekInanci: string; bilisselHatalar: string[];
  kacinanDurumlar: string; guvenlikDavranislari: string;
  islevselBozulma: { isOkul: boolean; sosyal: boolean; aile: boolean; ozBakim: boolean; baskaDurumlar: string };
  baskinDuygular: string[]; duyguTetikleyicileri: string; duyguDuzenlemeBecerisi: string;
  aileDinamikleri: string; cocuklukDeneyimleri: string; onemliYasamOlaylari: string;
  tibbTanilar: string; kullanilanIlaclar: string; maddeKullanimi: string;
  oncekiPsikiyatrikTani: string; intiharGecmis: boolean | null; intiharSuanki: boolean | null; intiharDetay: string;
  medeniDurum: string; calismaYasam: string; sosyalDestek: string; gucluYonler: string;
  fp_yatkinlastirici: string; fp_tetikleyici: string; fp_surdurucu: string; fp_koruyucu: string; fp_sunan: string;
}

export interface SeansNotuData {
  ruhHali: number; gundemMaddeleri: string; evOdeviTakibi: string; evOdeviTamamlandi: boolean | null;
  seansOdagi: string; kullanilanTeknikler: string[]; danisanTepkisi: string; gelisimGozlemi: string;
  sonrakiSeansPlani: string; evOdevi: string; riskDegerlendirme: 'yok' | 'dusuk' | 'orta' | 'yuksek' | '';
  riskNotu: string; terapistNotu: string;
}

export type SeansType = 'anamnez' | 'seans';

export interface OlcekSkor {
  id: string; olcekId: string; ad: string; skor: number; tarih: string;
}

// ── Hexaflex (ACT Psikolojik Esneklik) ─────────────────────────────────
export interface HexaflexScores {
  defuzyon: number;       // 0-10  Bilişsel defuzyon
  kabul: number;          // 0-10  Kabul / yaşantısal açıklık
  andaOlma: number;       // 0-10  Şimdiki ana temas
  baglamBenlik: number;   // 0-10  Bağlamsal benlik (gözlemleyen benlik)
  degerNetligi: number;   // 0-10  Değer netliği
  bagliEylem: number;     // 0-10  Bağlı eylem
}

export interface HexaflexHistoryEntry {
  no: number;
  tarih: string;
  scores: HexaflexScores;
}

export const DEFAULT_HEXAFLEX: HexaflexScores = {
  defuzyon: 5, kabul: 5, andaOlma: 5,
  baglamBenlik: 5, degerNetligi: 5, bagliEylem: 5,
};

export interface SeansDetayVerisi {
  olcekler: OlcekSkor[];
  danisanIzlenimi: string;
  haftalikCalismalar: string;
  haftalikZorluklar: string;
  mudahaleOzeti: string;
  basitFormulasyon: { tetikleyici: string; dusunce: string; duygu: string; davranis: string; sonuc: string };
  formulasyonGuncellemeleri: string;
  seansOzeti: string;
  odev: string;
  terapistIyiYanlar: string;
  terapistGelisilebilirYanlar: string;
  brief: string;
  // Hexaflex V3
  hexaflex?: HexaflexScores;
  hexaflexNot?: string;
}

export interface BdtSeans {
  id: string; patientId: string; no: number; tarih: string; tip: SeansType;
  anamnez?: AnamnezData; seansNotu?: SeansNotuData; detay?: SeansDetayVerisi;
  olusturmaTarihi: string; guncellemeTarihi: string;
}

export const BDT_TEKNIKLER = [
  'Bilişsel Yeniden Yapılandırma', 'Düşünce Kaydı', 'Davranışsal Aktivasyon',
  'Maruz Bırakma', 'Problem Çözme', 'Mindfulness / Farkındalık', 'Duygu Düzenleme',
  'Sosyal Beceri', 'Şema Çalışması', 'Rol Yapma', 'Psikoeğitim', 'Gevşeme Teknikleri', 'Ev Ödevi İnceleme',
];

export const BDT_BILISSSEL_HATALAR = [
  'Felaketleştirme', 'Zihin Okuma', 'Falcılık', 'Olumluyu Görmezden Gelme',
  'Ya Hep Ya Hiç Düşüncesi', 'Duygusal Muhakeme', 'Etiketleme', 'Kişiselleştirme',
  'Seçici Soyutlama', '"Olmalı/Gerekir" İfadeleri', 'Büyütme / Küçümseme',
];

export const BASKIN_DUYGULAR = [
  'Kaygı', 'Üzüntü', 'Öfke', 'Korku', 'Suçluluk', 'Utanç', 'Kıskançlık', 'Yalnızlık',
  'Umutsuzluk', 'Panik', 'İsteksizlik', 'Boşluk',
];

export const EMPTY_ANAMNEZ: AnamnezData = {
  basvuruNedeni: '', nasilBuldu: '', oncekiTerapi: null, oncekiTerapiDetay: '',
  anaGikayet: '', baslangicTarihi: '', tetikleyiciOlay: '', seyir: '', yogunluk: 5,
  gunlukYasamaEtkisi: '', otomatikDusunceler: '', benInanci: '', dunyaInanci: '',
  gelecekInanci: '', bilisselHatalar: [], kacinanDurumlar: '', guvenlikDavranislari: '',
  islevselBozulma: { isOkul: false, sosyal: false, aile: false, ozBakim: false, baskaDurumlar: '' },
  baskinDuygular: [], duyguTetikleyicileri: '', duyguDuzenlemeBecerisi: '',
  aileDinamikleri: '', cocuklukDeneyimleri: '', onemliYasamOlaylari: '',
  tibbTanilar: '', kullanilanIlaclar: '', maddeKullanimi: '', oncekiPsikiyatrikTani: '',
  intiharGecmis: null, intiharSuanki: null, intiharDetay: '',
  medeniDurum: '', calismaYasam: '', sosyalDestek: '', gucluYonler: '',
  fp_yatkinlastirici: '', fp_tetikleyici: '', fp_surdurucu: '', fp_koruyucu: '', fp_sunan: '',
};

export const EMPTY_SEANS_NOTU: SeansNotuData = {
  ruhHali: 5, gundemMaddeleri: '', evOdeviTakibi: '', evOdeviTamamlandi: null,
  seansOdagi: '', kullanilanTeknikler: [], danisanTepkisi: '', gelisimGozlemi: '',
  sonrakiSeansPlani: '', evOdevi: '', riskDegerlendirme: '', riskNotu: '', terapistNotu: '',
};

// ════════════════════════════════════════════════════════════════════════
// Tek kaynak tipler — component'ler V2'ye geçtiği için eski panel dosyaları
// (DanisanlarPanel / FormulasyonPanel / TakvimPanel) silindi; yalnızca tip
// için tutuldukları bu tanımlar buraya taşındı.
// ════════════════════════════════════════════════════════════════════════

// ── Danışan (eski DanisanlarPanel) ─────────────────────────────────────────
export type ClientModality =
  | 'BDT' | 'ACT' | 'EFT' | 'CFT' | 'EMDR' | 'Şema' | 'Diğer';

export type ClientStatus = 'active' | 'passive' | 'follow';

export type Client = {
  id: string;
  name: string;
  age?: number;
  issue: string;
  modality: ClientModality;
  sessionCount: number;
  lastSession?: string;
  nextAppointment?: string;
  continuityPct: number;
  dropRisk?: 'low' | 'medium' | 'high';
  tags?: string[];
  telefon?: string;
  email?: string;
  status?: ClientStatus;
  exitReason?: 'completed' | 'dropout' | 'financial';
  takipSikligi?: 'haftalik' | 'iki_haftalik' | 'aylik';
};

// ── Formülasyon (eski FormulasyonPanel) ────────────────────────────────────
export type FormulationViewMode = 'focus' | 'gaps' | 'bdt' | 'act';
export type FormulationVizMode  = 'harita' | 'radar' | 'dongu' | 'vaka' | 'sema';

export type FourP = {
  predisposing:  string[];
  precipitating: string[];
  perpetuating:  string[];
  protective:    string[];
};

export type BeckChain = {
  earlyLife:           string;
  coreBelief:          string;
  rules:               string;
  automaticThoughts:   string[];
};

export type Hexaflex = {
  fusion:           number;
  avoidance:        number;
  selfAsContent:    number;
  presentMoment:    number;
  values:           number;
  committedAction:  number;
};

export type SelectedNode = {
  id?:               string;
  type:              string;
  label:             string;
  content:           string;
  relatedSessions?:  { ix: string; date: string; quote: string }[];
  gaps?:             string[];
};

// ── Takvim (eski TakvimPanel) ──────────────────────────────────────────────
export type TakvimSubTab = 'takvim' | 'hazirlik' | 'musaitlik' | 'gecmis' | 'sms' | 'gelisim';

export type GelisimEvent = {
  id: string;
  title: string;
  date: string;      // "YYYY-MM-DD"
  time: string;      // "HH:MM"
  durationMin: number;
  done?: boolean;
};

// ── Müdahale / Kütüphane (eski MudahalePanel) ──────────────────────────────
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
  durationMinutes?: number;
  evidence: Evidence;
  description: string;
  protocol?: string[];
  materials?: string[];
  contraindications?: string[];
  variants?:    { age: AgeGroup; label: string; notes: string }[];
  references?:  { title: string; doi?: string; url?: string }[];
  personalNotes?: string;
  homeworkVariant?: string;
  usageHistory?:  { clientName: string; date: string; outcome: Outcome; note?: string }[];
  favorite?:  boolean;
  useCount?:  number;
};

export type AssignTarget = {
  clientId: string;
  when: 'bugun' | 'sonraki-seans' | 'tarih';
  date?: string;
  durationMinutes?: number;
  asHomework?: boolean;
  note?: string;
};
