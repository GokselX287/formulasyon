'use client';

// ─────────────────────────────────────────────────────────────────────────────
// lib/benlik-algi.ts
//
// SAFI VERİ / HESAP KATMANI — hiçbir JSX/görsel yok.
// BenlikAlgisiPanel ve türevleri bu dosyayı import eder;
// glow rengini ve yoğunluğunu gerçek formülasyon verisinden türetir.
//
// Mimari sözleşme:
//  - lib/types.ts'deki (veya bileşen-yerel) Patient/Formulation/Seans DEĞİŞTİRİLMEZ.
//  - Dar (narrow) input tipleri sadece kullanılan alanları tanımlar.
//  - Tüm fonksiyonlar saf (pure) — yan etki yok, unit-test edilebilir.
//  - any yok. tsc --noEmit sıfır hata.
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// § 1 — Dar Giriş Tipleri
//        (lib/queries.Formulation'ın toAdminShape() sonrası camelCase hali ile
//         DanisanMindMap'in yerel Formulation tipiyle uyumlu)
// ══════════════════════════════════════════════════════════════════════════════

/** Sadece inanç/ACT alanlarını gerektiren dar Formulation tipi. */
export type FormulationInput = {
  /** Beck temel inançlar — "/" veya "," ile ayrılmış olabilir. */
  temelInanclar?: string | null;
  /** Beck ara inançlar — "/" veya "," ile ayrılmış olabilir. */
  araInanclar?: string | null;
  /** ACT değerler metni. */
  actDegerler?: string | null;
  /** ACT kabul / yaşantısal açıklık metni. */
  actKabul?: string | null;
  /** ACT bilişsel defüzyon metni. */
  actDefuzyon?: string | null;
};

/** lib/queries.Seans ile uyumlu dar Seans tipi — sadece metin alanları. */
export type SeansInput = {
  id: string;
  konu?: string | null;
  notlar?: string | null;
};

// ══════════════════════════════════════════════════════════════════════════════
// § 2 — Çıktı Tipleri
// ══════════════════════════════════════════════════════════════════════════════

export type Polarity = 'negatif' | 'notr' | 'pozitif';

export type BeliefSignal = {
  /** Ham inanç metni. */
  text: string;
  /** Otomatik sınıflandırılmış polarite. */
  polarity: Polarity;
  /**
   * Seanslar boyunca bu inancın ya da temasının geçme oranı.
   * 0 = hiçbir seansta geçmemiş, 1 = tüm seanslarda geçmiş.
   */
  frequency: number;
  /**
   * Kart içindeki göreli baskınlık (tüm sinyaller üzerinden normalize, toplam = 1).
   * Glow yoğunluğunu doğrudan besler.
   */
  dominance: number;
};

export type GlowSpec = {
  /** Serin (olumsuz baskın) vs. sıcak (olumlu baskın). */
  hue: 'cool' | 'warm';
  /** Glow parlaklığı — baskın sinyalin dominance'ına eşit (0–1). */
  intensity: number;
  /** Polarite ve yoğunluğa göre interpolasyon ile hesaplanan çekirdek hex rengi. */
  hexCore: string;
};

export type PerceptionAxis = {
  label: string;
  leftLabel: string;
  rightLabel: string;
  /** 0 = tam sol uç, 100 = tam sağ uç, 50 = nötr. */
  value: number;
};

export type PerceptionCard = {
  signals: BeliefSignal[];
  glow: GlowSpec;
  axes: PerceptionAxis[];
};

export type DialecticGap = {
  /** 0–100 arası aralık skoru. */
  score: number;
  label: 'düşük' | 'orta' | 'yüksek';
};

// ══════════════════════════════════════════════════════════════════════════════
// § 3 — Yardımcı Fonksiyonlar
// ══════════════════════════════════════════════════════════════════════════════

/** Türkçe karakterleri ASCII'ye indirger ve küçük harfe çevirir. */
const TR_MAP: Readonly<Record<string, string>> = {
  ç: 'c', Ç: 'c',
  ğ: 'g', Ğ: 'g',
  ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o',
  ş: 's', Ş: 's',
  ü: 'u', Ü: 'u',
};

export function normalizeTr(s: string): string {
  return s
    .toLowerCase()
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => TR_MAP[c] ?? c);
}

// ── Renk yardımcıları ──────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * İki hex renk arasında doğrusal interpolasyon.
 * t=0 → a, t=1 → b.
 */
export function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const clampT = Math.max(0, Math.min(1, t));
  return rgbToHex(
    ar + (br - ar) * clampT,
    ag + (bg - ag) * clampT,
    ab + (bb - ab) * clampT,
  );
}

// Glow interpolasyon sabitleri
const COOL_NEUTRAL = '#A9B8D8'; // nötr serin — mavi-gri
const COOL_CORE    = '#4A6FA8'; // baskın serin — koyu mavi (olumsuz)
const WARM_CORE    = '#C0512F'; // baskın sıcak — koyu turuncu-kırmızı → sağlıklı kutup

// ══════════════════════════════════════════════════════════════════════════════
// § 4 — Anahtar Kelime Sözlükleri (dışa export — genişletilebilir)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Negatif polariteye işaret eden normalleştirilmiş Türkçe kök/kelimeler.
 * normalizeTr() sonrası metin üzerinde includes() ile aranır.
 */
export const NEGATIVE_KEYWORDS: readonly string[] = [
  // Öz-değer / yetkinlik
  'yetersiz', 'degersiz', 'basarisiz', 'beceriksiz', 'aptal', 'zavalli',
  // Reddedilme / terk
  'sevilmiyorum', 'sevilmiyor', 'terk', 'reddediliyorum', 'kabul edilmiyorum',
  'kimse istemez', 'kimse umursamaz',
  // Utanç / suçluluk
  'utanc', 'suclu', 'hata yaptim', 'hicbir sey yapamam', 'bosum',
  // Tehdit / güvensizlik
  'guvenilmez', 'tehlikeli', 'korkunc', 'kontrolsuz',
  // Çaresizlik / umutsuzluk
  'caresiz', 'umutsuz', 'anlamsiz', 'bos', 'yuk', 'kayip',
  // Zayıflık
  'zayif', 'kirilgan', 'hassas', 'dayanamiyorum',
];

/**
 * Pozitif polariteye işaret eden normalleştirilmiş Türkçe kök/kelimeler.
 * ACT değer/kabul metinleri genellikle bu gruba girer.
 */
export const POSITIVE_KEYWORDS: readonly string[] = [
  // Yetkinlik / güç
  'guclu', 'yetkin', 'basarabilirim', 'ustesinden', 'cesur',
  // Kabul / açıklık
  'kabul', 'aciklik', 'ozgurluk', 'esnek', 'uyum',
  // Değerler
  'deger', 'anlam', 'amac', 'baglilik', 'onem',
  // İlişki / bağlantı
  'sevgi', 'bagli', 'guven', 'anlayis', 'empatik',
  // Büyüme / iyileşme
  'gelisim', 'iyilesme', 'umut', 'olumlu', 'saglikli',
  // Öz-saygı
  'ozguven', 'ozsaygi', 'ozbakim', 'degerli',
];

// ══════════════════════════════════════════════════════════════════════════════
// § 5 — Temel Saf Fonksiyonlar
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Ham inanç dizesini bireysel inanç cümlelerine böler.
 * Ayraçlar: "/" ve ",".  Boş/whitespace-only girişler atılır.
 *
 * @example
 * parseBeliefs("Ben yetersizim / İnsanlar beni küçümser")
 * // → ["Ben yetersizim", "İnsanlar beni küçümser"]
 */
export function parseBeliefs(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[/,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Metni anahtar kelime sözlüğüne göre sınıflandırır.
 * Beraberinde gelen NEGATIVE_/POSITIVE_KEYWORDS dizileri genişletilebilir.
 *
 * Karar kuralı:
 *  - negScore > posScore → 'negatif'
 *  - posScore > negScore → 'pozitif'
 *  - eşit veya sıfır   → 'notr'
 */
export function classifyPolarity(text: string): Polarity {
  const norm = normalizeTr(text);
  const negScore = NEGATIVE_KEYWORDS.filter((kw) => norm.includes(kw)).length;
  const posScore = POSITIVE_KEYWORDS.filter((kw) => norm.includes(kw)).length;
  if (negScore > posScore) return 'negatif';
  if (posScore > negScore) return 'pozitif';
  return 'notr';
}

/**
 * Bir inanç temasının seanslar boyunca geçme sıklığını hesaplar.
 *
 * Algoritma:
 *  1. İnanç metnini normalleştir ve 3+ karakter uzunluğundaki kelimelere böl.
 *  2. Her seansta konu + notlar alanlarında bu kelimelerden en az biri geçiyor mu?
 *  3. Eşleşen seans sayısı / toplam seans sayısı → [0, 1].
 *
 * LLM gerektirmez — saf keyword frekans analizi.
 */
export function computeFrequency(
  belief: string,
  seanslar: SeansInput[],
): number {
  if (seanslar.length === 0) return 0;

  const normBelief = normalizeTr(belief);
  // Kısa bağlaç/ek kelimelerini at (≤3 karakter), anlam taşıyan kökleri al
  const keywords = normBelief
    .split(/\s+/)
    .filter((w) => w.length >= 4);

  if (keywords.length === 0) return 0;

  const matchCount = seanslar.filter((s) => {
    const text = normalizeTr([s.konu ?? '', s.notlar ?? ''].join(' '));
    return keywords.some((kw) => text.includes(kw));
  }).length;

  return matchCount / seanslar.length;
}

/**
 * Bir inanç listesinden BeliefSignal dizisi oluşturur.
 * Dominance, frequency değerlerine göre normalize edilir (toplam = 1).
 * Seans verisi yoksa (tüm frequency = 0) uniform dağılım kullanılır.
 */
export function buildBeliefSignals(
  beliefs: string[],
  seanslar: SeansInput[],
): BeliefSignal[] {
  if (beliefs.length === 0) return [];

  const raw = beliefs.map((b) => ({
    text: b,
    polarity: classifyPolarity(b),
    frequency: computeFrequency(b, seanslar),
    dominance: 0,
  }));

  const totalFreq = raw.reduce((sum, s) => sum + s.frequency, 0);
  const uniformShare = 1 / raw.length;

  return raw.map((s) => ({
    ...s,
    dominance: totalFreq > 0 ? s.frequency / totalFreq : uniformShare,
  }));
}

/**
 * Sinyallerden kartın genel glow spesifikasyonunu türetir.
 *
 * - hue: negatif baskın → 'cool', pozitif baskın → 'warm'
 * - intensity: en baskın sinyalin dominance değeri
 * - hexCore: COOL_NEUTRAL'dan COOL_CORE / WARM_CORE'a polarite şiddetine göre interpolasyon
 */
export function deriveGlow(signals: BeliefSignal[]): GlowSpec {
  if (signals.length === 0) {
    return { hue: 'cool', intensity: 0.3, hexCore: COOL_NEUTRAL };
  }

  // Ağırlıklı polarite skoru: negatif=-1, notr=0, pozitif=+1
  const polarityScore = signals.reduce((sum, s) => {
    const weight =
      s.polarity === 'negatif' ? -1 : s.polarity === 'pozitif' ? 1 : 0;
    return sum + weight * s.dominance;
  }, 0);
  // polarityScore ∈ [-1, +1]

  const hue: GlowSpec['hue'] = polarityScore <= 0 ? 'cool' : 'warm';
  const intensity = Math.max(...signals.map((s) => s.dominance));
  const t = Math.abs(polarityScore); // interpolasyon katsayısı 0–1

  const hexCore =
    hue === 'cool'
      ? lerpHex(COOL_NEUTRAL, COOL_CORE, t)
      : lerpHex(COOL_NEUTRAL, WARM_CORE, t);

  return { hue, intensity, hexCore };
}

// ══════════════════════════════════════════════════════════════════════════════
// § 6 — Kart İnşaatçıları
// ══════════════════════════════════════════════════════════════════════════════

/**
 * İÇ DÜNYA KARTI (öz-algı).
 * Veri kaynağı: Beck temel inançlar (temelInanclar) + ara inançlar (araInanclar).
 * Bu inançlar genellikle olumsuz kutbu temsil eder.
 *
 * TODO: Eksen değerleri (0–100) formulation'da nümerik alan yoksa nötr (50)
 *       bırakılmıştır. İlerleyen versiyonda BenlikAlgisiData.ozdeger vs.
 *       eksen değerleriyle eşleştirilebilir.
 */
const SELF_AXES_DEFAULT: readonly PerceptionAxis[] = [
  {
    label: 'Öz-Değer',
    leftLabel: 'Değersiz',
    rightLabel: 'Değerli',
    value: 50,
  },
  {
    label: 'Duygusal Duyarlılık',
    leftLabel: 'Kırılgan',
    rightLabel: 'Dayanıklı',
    value: 50,
  },
  {
    label: 'Sosyal Bağlantı',
    leftLabel: 'İzole',
    rightLabel: 'Bağlı',
    value: 50,
  },
];

export function buildSelfPerception(
  f: FormulationInput,
  seanslar: SeansInput[],
): PerceptionCard {
  const beliefs = [
    ...parseBeliefs(f.temelInanclar),
    ...parseBeliefs(f.araInanclar),
  ];
  const signals = buildBeliefSignals(beliefs, seanslar);
  const glow = deriveGlow(signals);

  // TODO: Eksen değerlerini BenlikAlgisiData.ozdeger /
  //       duygusalDuyarlilik / duygusalZihin ile besle
  //       (şu an nötr 50 varsayılmaktadır).
  const axes: PerceptionAxis[] = SELF_AXES_DEFAULT.map((a) => ({ ...a }));

  return { signals, glow, axes };
}

/**
 * DIŞ DÜNYA KARTI (dış algı / sosyal sunum).
 * Veri kaynağı: ACT değerler (actDegerler) + kabul (actKabul) + defüzyon (actDefuzyon).
 * Bu metinler genellikle olumlu/sağlıklı kutbu temsil eder.
 *
 * TODO: Eksen değerleri nötr (50). BenlikAlgisiData.sosyalSunumu vs.
 *       ile eşleştirilebilir.
 */
const EXTERNAL_AXES_DEFAULT: readonly PerceptionAxis[] = [
  {
    label: 'Sosyal Sunum',
    leftLabel: 'Çekingen',
    rightLabel: 'Güvenli',
    value: 50,
  },
  {
    label: 'Duygusal Etki',
    leftLabel: 'Kopuk',
    rightLabel: 'Empatik',
    value: 50,
  },
  {
    label: 'Değer Netliği',
    leftLabel: 'Belirsiz',
    rightLabel: 'Net',
    value: 50,
  },
];

export function buildExternalPerception(
  f: FormulationInput,
  seanslar: SeansInput[],
): PerceptionCard {
  const beliefs = [
    ...parseBeliefs(f.actDegerler),
    ...parseBeliefs(f.actKabul),
    ...parseBeliefs(f.actDefuzyon),
  ];
  const signals = buildBeliefSignals(beliefs, seanslar);
  const glow = deriveGlow(signals);

  // TODO: Eksen değerlerini BenlikAlgisiData.sosyalSunumu /
  //       duygusalDuyarlilik ile besle (şu an nötr 50).
  const axes: PerceptionAxis[] = EXTERNAL_AXES_DEFAULT.map((a) => ({ ...a }));

  return { signals, glow, axes };
}

// ══════════════════════════════════════════════════════════════════════════════
// § 7 — Diyalektik Aralık Hesabı
// ══════════════════════════════════════════════════════════════════════════════

/** İç ağırlıklı polarite skoru hesaplamak için yardımcı (pure). */
function weightedPolarityScore(signals: BeliefSignal[]): number {
  return signals.reduce((sum, s) => {
    const w = s.polarity === 'negatif' ? -1 : s.polarity === 'pozitif' ? 1 : 0;
    return sum + w * s.dominance;
  }, 0);
}

/**
 * İki kart arasındaki diyalektik aralığı hesaplar.
 *
 * Bileşenler:
 *  1. Polarite farkı → 0–50 puan (|selfPol - extPol| * 50)
 *  2. Eksen farkı    → 0–50 puan (ortalama mutlak eksen farkı / 2)
 *
 * Toplam 0–100.  <25 = düşük, 25–50 = orta, >50 = yüksek.
 */
export function computeDialecticGap(
  self: PerceptionCard,
  external: PerceptionCard,
): DialecticGap {
  // Bileşen 1: polarite farkı
  const selfPol = weightedPolarityScore(self.signals);
  const extPol  = weightedPolarityScore(external.signals);
  const polDiff = Math.abs(extPol - selfPol) * 50; // 0–50

  // Bileşen 2: eksen farkı
  const axisPairs = Math.min(self.axes.length, external.axes.length);
  let axisSum = 0;
  for (let i = 0; i < axisPairs; i++) {
    axisSum += Math.abs(self.axes[i].value - external.axes[i].value);
  }
  // Ortalama fark (0–100) → 0–50 aralığına sıkıştır
  const axisDiff = axisPairs > 0 ? (axisSum / axisPairs) / 2 : 0;

  const raw = polDiff + axisDiff;
  const score = Math.min(100, Math.max(0, Math.round(raw)));

  const label: DialecticGap['label'] =
    score < 25 ? 'düşük' : score <= 50 ? 'orta' : 'yüksek';

  return { score, label };
}

// ══════════════════════════════════════════════════════════════════════════════
// § 8 — Örnek Çıktı (Elif Karaca vakası — sadece yorum)
// ══════════════════════════════════════════════════════════════════════════════
//
// const elifFormulation: FormulationInput = {
//   temelInanclar: "Ben yetersizim / Sevilmeye değmem / Bir gün her şeyi mahvedeceğim",
//   araInanclar:   "Hata yaparsam herkes benden soğur / Görünmek tehlikelidir",
//   actDegerler:   "Yaratıcılık, Yakınlık, Otantiklik",
//   actKabul:      "Kaygıyla oturup sanat yapabiliyorum",
//   actDefuzyon:   "Düşünce sadece düşüncedir, gerçek değil",
// };
//
// const elifSeanslar: SeansInput[] = [
//   { id: '1', konu: 'yetersizlik duygusu', notlar: 'Ben yetersizim inancı tekrar öne çıktı' },
//   { id: '2', konu: 'sosyal kaygı',         notlar: 'Sevilmeme korkusu işlendi' },
//   { id: '3', konu: 'değerler çalışması',   notlar: 'Yaratıcılık değeri güçlendi' },
//   { id: '4', konu: 'defüzyon egzersizi',   notlar: 'Düşünce sadece düşüncedir tekrarlandı' },
//   { id: '5', konu: 'kabul',                notlar: 'Kaygıyı fark edip sanat yaptı' },
// ];
//
// buildSelfPerception(elifFormulation, elifSeanslar) →
// {
//   signals: [
//     { text: "Ben yetersizim",                  polarity: 'negatif', frequency: 0.4, dominance: 0.40 },
//     { text: "Sevilmeye değmem",                polarity: 'negatif', frequency: 0.4, dominance: 0.40 },
//     { text: "Bir gün her şeyi mahvedeceğim",   polarity: 'negatif', frequency: 0.0, dominance: 0.00 },
//     { text: "Hata yaparsam herkes benden soğur", polarity: 'notr',  frequency: 0.0, dominance: 0.00 },
//     { text: "Görünmek tehlikelidir",            polarity: 'notr',   frequency: 0.0, dominance: 0.00 },
//   ],
//   glow: {
//     hue: 'cool',
//     intensity: 0.40,
//     hexCore: '#6B8BB8',   // COOL_NEUTRAL → COOL_CORE'a %80 interpolasyon
//   },
//   axes: [ { value: 50 }, { value: 50 }, { value: 50 } ],   // TODO bekliyor
// }
//
// deriveGlow([...elifSelfSignals]) →
// { hue: 'cool', intensity: 0.40, hexCore: '#6B8BB8' }
//  → Olumsuz baskın → serin mavi ton, orta yoğunluk.
