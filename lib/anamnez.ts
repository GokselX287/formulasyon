import type { AnamnezData } from '@/components/AnamnezPanel';

export interface PreFormResponse {
  question: string;
  answer: string;
}

export function mergePreForm(
  data: AnamnezData,
  preForm: PreFormResponse[]
): AnamnezData {
  // PHQ-9 (sorular phq9_1 ... phq9_9 formatında varsayılır)
  const phq9Items = preForm
    .filter((r) => r.question.startsWith('phq9_'))
    .map((r) => parseInt(r.answer) || 0);
  const phq9Score = phq9Items.reduce((s, n) => s + n, 0);

  // GAD-7 (sorular gad7_1 ... gad7_7 formatında varsayılır)
  const gad7Items = preForm
    .filter((r) => r.question.startsWith('gad7_'))
    .map((r) => parseInt(r.answer) || 0);
  const gad7Score = gad7Items.reduce((s, n) => s + n, 0);

  return {
    ...data,
    olcekler: {
      ...data.olcekler,
      otherScores: data.olcekler?.otherScores ?? [],
      phq9:
        phq9Items.length === 9
          ? {
              skor: phq9Score,
              sinif: phq9Class(phq9Score),
              tarih: today(),
              importedFromPreForm: true,
            }
          : data.olcekler?.phq9,
      gad7:
        gad7Items.length === 7
          ? {
              skor: gad7Score,
              sinif: gad7Class(gad7Score),
              tarih: today(),
              importedFromPreForm: true,
            }
          : data.olcekler?.gad7,
    },
    basvuru: {
      ...data.basvuru,
      sebep:
        data.basvuru?.sebep ??
        preForm.find((r) => r.question.toLowerCase().includes('yardım'))
          ?.answer,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Türetilmiş klinik boyut: AİLE YAPISI.
// Rigid "genel aile yapısı" alanı yerine; aile sinyalleri (anne/baba/kardeş
// tarifleri, ebeveyn-rol, genogram, istismar) anamnezin neresinde belirirse
// oradan OKUMA ANINDA derlenir. Hiçbir üretilmiş metin SAKLANMAZ — yalnızca
// terapistin "baktım ve sahiplendim" damgası (derived.aile = {status,at,snapshotHash})
// ayrıca saklanır. snapshotHash ham alanların imzasıdır; sinyaller değişince
// damga "bayat" olur ve yeniden onay istenir. Aynı kalıp başka boyutlara genellenir.
// ──────────────────────────────────────────────────────────────────────────
export type DerivedRow = { l: string; v: string };
const dtx = (s: any): string => (typeof s === 'string' ? s.trim() : '');

// Ham aile sinyallerinin deterministik imzası (FNV-1a · 32-bit). istismar dahil:
// rapora girmese de değişirse yeniden onay istensin.
export function aileSnapshotHash(aile: any): string {
  const a = aile || {};
  const joined = [
    a.genogram, a.anneTarif, a.babaTarif, a.anneBabaIliski,
    a.kardesDurum, a.kardesTarif, a.ebeveynRolKardes, a.istismarVar, a.istismarNot,
  ].map(dtx).join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < joined.length; i++) { h ^= joined.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16);
}

// Aile sinyallerini özet satırlarına derler + imzayı döndürür. (Bugünkü
// DanisanRaporu aileRows mantığının tek, saf kaynağı.)
export function compileAile(aile: any): { rows: DerivedRow[]; hash: string } {
  const a = aile || {};
  const rows: DerivedRow[] = [
    { l: 'Ailede psikiyatrik öykü', v: dtx(a.genogram) },
    { l: 'Anne', v: dtx(a.anneTarif) },
    { l: 'Baba', v: dtx(a.babaTarif) },
    { l: 'Anne–baba ilişkisi', v: dtx(a.anneBabaIliski) },
    { l: 'Kardeşler', v: dtx(a.kardesTarif) || dtx(a.kardesDurum) },
    { l: 'Ebeveyn rolü üstlenen kardeş', v: dtx(a.ebeveynRolKardes) },
  ].filter((x) => x.v);
  return { rows, hash: aileSnapshotHash(a) };
}

function phq9Class(s: number): string {
  if (s < 5) return 'Minimal';
  if (s < 10) return 'Hafif';
  if (s < 15) return 'Orta';
  if (s < 20) return 'Orta-şiddetli';
  return 'Şiddetli';
}

function gad7Class(s: number): string {
  if (s < 5) return 'Minimal';
  if (s < 10) return 'Hafif';
  if (s < 15) return 'Orta';
  return 'Şiddetli';
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
