export interface OlcekTanim {
  id: string;
  ad: string;
  tam: string;
  max: number;
  higherBetter: boolean;
  sinif: { s: number; e: number; l: string; c: string }[];
}

export const OLCEKLER: OlcekTanim[] = [
  {
    id: 'phq9', ad: 'PHQ-9', tam: 'PHQ-9 (Depresyon)', max: 27, higherBetter: false,
    sinif: [{ s: 0, e: 4, l: 'Minimal', c: '#22c55e' }, { s: 5, e: 9, l: 'Hafif', c: '#84cc16' }, { s: 10, e: 14, l: 'Orta', c: '#eab308' }, { s: 15, e: 19, l: 'Orta-Ağır', c: '#f97316' }, { s: 20, e: 27, l: 'Ağır', c: '#ef4444' }],
  },
  {
    id: 'gad7', ad: 'GAD-7', tam: 'GAD-7 (Anksiyete)', max: 21, higherBetter: false,
    sinif: [{ s: 0, e: 4, l: 'Minimal', c: '#22c55e' }, { s: 5, e: 9, l: 'Hafif', c: '#84cc16' }, { s: 10, e: 14, l: 'Orta', c: '#eab308' }, { s: 15, e: 21, l: 'Ağır', c: '#ef4444' }],
  },
  {
    id: 'bai', ad: 'BAI', tam: 'BAI (Beck Anksiyete)', max: 63, higherBetter: false,
    sinif: [{ s: 0, e: 7, l: 'Minimal', c: '#22c55e' }, { s: 8, e: 15, l: 'Hafif', c: '#84cc16' }, { s: 16, e: 25, l: 'Orta', c: '#eab308' }, { s: 26, e: 63, l: 'Ağır', c: '#ef4444' }],
  },
  {
    id: 'bdi2', ad: 'BDI-II', tam: 'BDI-II (Beck Depresyon)', max: 63, higherBetter: false,
    sinif: [{ s: 0, e: 13, l: 'Minimal', c: '#22c55e' }, { s: 14, e: 19, l: 'Hafif', c: '#84cc16' }, { s: 20, e: 28, l: 'Orta', c: '#eab308' }, { s: 29, e: 63, l: 'Ağır', c: '#ef4444' }],
  },
  {
    id: 'spin', ad: 'SPIN', tam: 'SPIN (Sosyal Anksiyete)', max: 68, higherBetter: false,
    sinif: [{ s: 0, e: 20, l: 'Eşik Altı', c: '#22c55e' }, { s: 21, e: 30, l: 'Hafif', c: '#84cc16' }, { s: 31, e: 40, l: 'Orta', c: '#eab308' }, { s: 41, e: 68, l: 'Ağır', c: '#ef4444' }],
  },
  {
    id: 'pcl5', ad: 'PCL-5', tam: 'PCL-5 (TSSB)', max: 80, higherBetter: false,
    sinif: [{ s: 0, e: 31, l: 'Eşik Altı', c: '#22c55e' }, { s: 32, e: 80, l: 'Eşik Üstü', c: '#ef4444' }],
  },
  {
    id: 'ocir', ad: 'OCI-R', tam: 'OCI-R (OKB)', max: 72, higherBetter: false,
    sinif: [{ s: 0, e: 20, l: 'Normal', c: '#22c55e' }, { s: 21, e: 72, l: 'Klinik', c: '#ef4444' }],
  },
  {
    id: 'who5', ad: 'WHO-5', tam: 'WHO-5 (İyi Oluş)', max: 25, higherBetter: true,
    sinif: [{ s: 0, e: 12, l: 'Düşük', c: '#ef4444' }, { s: 13, e: 25, l: 'İyi', c: '#22c55e' }],
  },
  {
    id: 'rses', ad: 'RSES', tam: 'RSES (Öz Saygı)', max: 30, higherBetter: true,
    sinif: [{ s: 0, e: 14, l: 'Düşük', c: '#ef4444' }, { s: 15, e: 25, l: 'Orta', c: '#eab308' }, { s: 26, e: 30, l: 'Yüksek', c: '#22c55e' }],
  },
  {
    id: 'psqi', ad: 'PSQI', tam: 'PSQI (Uyku Kalitesi)', max: 21, higherBetter: false,
    sinif: [{ s: 0, e: 5, l: 'İyi', c: '#22c55e' }, { s: 6, e: 21, l: 'Kötü', c: '#ef4444' }],
  },
  {
    id: 'suds', ad: 'SUDS', tam: 'SUDS (Sıkıntı Düzeyi 0-10)', max: 10, higherBetter: false,
    sinif: [{ s: 0, e: 2, l: 'Minimal', c: '#22c55e' }, { s: 3, e: 4, l: 'Hafif', c: '#84cc16' }, { s: 5, e: 6, l: 'Orta', c: '#eab308' }, { s: 7, e: 8, l: 'Yüksek', c: '#f97316' }, { s: 9, e: 10, l: 'Çok Yüksek', c: '#ef4444' }],
  },
  {
    id: 'mood', ad: 'Ruh Hali', tam: 'Ruh Hali (0-10)', max: 10, higherBetter: true,
    sinif: [{ s: 0, e: 2, l: 'Çok Kötü', c: '#ef4444' }, { s: 3, e: 4, l: 'Kötü', c: '#f97316' }, { s: 5, e: 6, l: 'Orta', c: '#eab308' }, { s: 7, e: 8, l: 'İyi', c: '#84cc16' }, { s: 9, e: 10, l: 'Çok İyi', c: '#22c55e' }],
  },
  {
    id: 'custom', ad: 'Diğer', tam: 'Diğer / Özel Ölçek', max: 100, higherBetter: false,
    sinif: [],
  },
];

export function getSinif(olcekId: string, skor: number) {
  const o = OLCEKLER.find(x => x.id === olcekId);
  return o?.sinif.find(s => skor >= s.s && skor <= s.e) ?? null;
}

export const OLCEK_RENKLER = [
  '#6366f1', '#f97316', '#22c55e', '#ec4899',
  '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#84cc16',
];
