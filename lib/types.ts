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
  baglamBenlik: number;   // 0-10  Bağlam olarak benlik
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
