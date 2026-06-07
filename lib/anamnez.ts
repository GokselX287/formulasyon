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
