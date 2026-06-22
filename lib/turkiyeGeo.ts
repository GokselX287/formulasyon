// ──────────────────────────────────────────────────────────────────────────
// Türkiye coğrafyası — 81 il merkez koordinatı (lon/lat) + basit projeksiyon +
// kaba sınır çizgisi. Danışan konum dağılımı haritası için (Çalışma Alanı).
// Koordinatlar yaklaşık il merkezleridir; harita şematiktir (kabuk + balon).
// ──────────────────────────────────────────────────────────────────────────

export type IlNokta = { ad: string; lon: number; lat: number };

export const ILLER: IlNokta[] = [
  { ad: 'Adana', lon: 35.32, lat: 37.00 }, { ad: 'Adıyaman', lon: 38.28, lat: 37.76 },
  { ad: 'Afyonkarahisar', lon: 30.54, lat: 38.76 }, { ad: 'Ağrı', lon: 43.05, lat: 39.72 },
  { ad: 'Amasya', lon: 35.83, lat: 40.65 }, { ad: 'Ankara', lon: 32.86, lat: 39.93 },
  { ad: 'Antalya', lon: 30.70, lat: 36.90 }, { ad: 'Artvin', lon: 41.82, lat: 41.18 },
  { ad: 'Aydın', lon: 27.85, lat: 37.85 }, { ad: 'Balıkesir', lon: 27.88, lat: 39.65 },
  { ad: 'Bilecik', lon: 29.98, lat: 40.14 }, { ad: 'Bingöl', lon: 40.50, lat: 38.88 },
  { ad: 'Bitlis', lon: 42.11, lat: 38.40 }, { ad: 'Bolu', lon: 31.61, lat: 40.74 },
  { ad: 'Burdur', lon: 30.29, lat: 37.46 }, { ad: 'Bursa', lon: 29.06, lat: 40.19 },
  { ad: 'Çanakkale', lon: 26.41, lat: 40.15 }, { ad: 'Çankırı', lon: 33.62, lat: 40.60 },
  { ad: 'Çorum', lon: 34.95, lat: 40.55 }, { ad: 'Denizli', lon: 29.10, lat: 37.78 },
  { ad: 'Diyarbakır', lon: 40.23, lat: 37.91 }, { ad: 'Edirne', lon: 26.56, lat: 41.68 },
  { ad: 'Elazığ', lon: 39.22, lat: 38.68 }, { ad: 'Erzincan', lon: 39.49, lat: 39.75 },
  { ad: 'Erzurum', lon: 41.27, lat: 39.91 }, { ad: 'Eskişehir', lon: 30.52, lat: 39.78 },
  { ad: 'Gaziantep', lon: 37.38, lat: 37.07 }, { ad: 'Giresun', lon: 38.39, lat: 40.91 },
  { ad: 'Gümüşhane', lon: 39.48, lat: 40.46 }, { ad: 'Hakkâri', lon: 43.74, lat: 37.58 },
  { ad: 'Hatay', lon: 36.20, lat: 36.40 }, { ad: 'Isparta', lon: 30.55, lat: 37.76 },
  { ad: 'Mersin', lon: 34.64, lat: 36.81 }, { ad: 'İstanbul', lon: 28.98, lat: 41.01 },
  { ad: 'İzmir', lon: 27.14, lat: 38.42 }, { ad: 'Kars', lon: 43.10, lat: 40.60 },
  { ad: 'Kastamonu', lon: 33.78, lat: 41.39 }, { ad: 'Kayseri', lon: 35.49, lat: 38.73 },
  { ad: 'Kırklareli', lon: 27.22, lat: 41.74 }, { ad: 'Kırşehir', lon: 34.16, lat: 39.15 },
  { ad: 'Kocaeli', lon: 29.92, lat: 40.77 }, { ad: 'Konya', lon: 32.49, lat: 37.87 },
  { ad: 'Kütahya', lon: 29.98, lat: 39.42 }, { ad: 'Malatya', lon: 38.31, lat: 38.36 },
  { ad: 'Manisa', lon: 27.43, lat: 38.62 }, { ad: 'Kahramanmaraş', lon: 36.92, lat: 37.58 },
  { ad: 'Mardin', lon: 40.74, lat: 37.31 }, { ad: 'Muğla', lon: 28.36, lat: 37.22 },
  { ad: 'Muş', lon: 41.49, lat: 38.74 }, { ad: 'Nevşehir', lon: 34.71, lat: 38.62 },
  { ad: 'Niğde', lon: 34.68, lat: 37.97 }, { ad: 'Ordu', lon: 37.88, lat: 40.98 },
  { ad: 'Rize', lon: 40.52, lat: 41.02 }, { ad: 'Sakarya', lon: 30.40, lat: 40.78 },
  { ad: 'Samsun', lon: 36.33, lat: 41.29 }, { ad: 'Siirt', lon: 41.94, lat: 37.93 },
  { ad: 'Sinop', lon: 35.15, lat: 42.03 }, { ad: 'Sivas', lon: 36.99, lat: 39.75 },
  { ad: 'Tekirdağ', lon: 27.51, lat: 40.98 }, { ad: 'Tokat', lon: 36.55, lat: 40.31 },
  { ad: 'Trabzon', lon: 39.72, lat: 41.00 }, { ad: 'Tunceli', lon: 39.55, lat: 39.11 },
  { ad: 'Şanlıurfa', lon: 38.79, lat: 37.16 }, { ad: 'Uşak', lon: 29.41, lat: 38.68 },
  { ad: 'Van', lon: 43.38, lat: 38.50 }, { ad: 'Yozgat', lon: 34.81, lat: 39.82 },
  { ad: 'Zonguldak', lon: 31.79, lat: 41.45 }, { ad: 'Aksaray', lon: 34.03, lat: 38.37 },
  { ad: 'Bayburt', lon: 40.22, lat: 40.26 }, { ad: 'Karaman', lon: 33.22, lat: 37.18 },
  { ad: 'Kırıkkale', lon: 33.51, lat: 39.85 }, { ad: 'Batman', lon: 41.13, lat: 37.88 },
  { ad: 'Şırnak', lon: 42.46, lat: 37.52 }, { ad: 'Bartın', lon: 32.34, lat: 41.63 },
  { ad: 'Ardahan', lon: 42.70, lat: 41.11 }, { ad: 'Iğdır', lon: 44.04, lat: 39.92 },
  { ad: 'Yalova', lon: 29.28, lat: 40.65 }, { ad: 'Karabük', lon: 32.63, lat: 41.20 },
  { ad: 'Kilis', lon: 37.12, lat: 36.72 }, { ad: 'Osmaniye', lon: 36.25, lat: 37.07 },
  { ad: 'Düzce', lon: 31.16, lat: 40.84 },
];

export const GEO = { minLon: 25.5, maxLon: 45.0, minLat: 35.6, maxLat: 42.3 } as const;
export const MAP_W = 1000;
export const MAP_H = Math.round(MAP_W * (GEO.maxLat - GEO.minLat) / (GEO.maxLon - GEO.minLon)); // ≈ 333

export function project(lon: number, lat: number): { x: number; y: number } {
  const x = ((lon - GEO.minLon) / (GEO.maxLon - GEO.minLon)) * MAP_W;
  const y = ((GEO.maxLat - lat) / (GEO.maxLat - GEO.minLat)) * MAP_H;
  return { x, y };
}

// Kaba Türkiye sınırı — saat yönünde sınır/kıyı çapaları (lon,lat). Şematik kabuk.
export const SINIR: [number, number][] = [
  [26.3, 41.8], [27.4, 41.9], [28.3, 41.3], [31.8, 41.6], [35.0, 42.1], [36.5, 41.4],
  [38.4, 41.1], [39.8, 41.1], [41.5, 41.5], [42.9, 41.2], [43.6, 40.6], [44.6, 40.0],
  [44.3, 39.5], [44.4, 38.6], [44.4, 37.4], [42.5, 37.2], [41.0, 37.1], [40.0, 36.9],
  [38.9, 36.7], [37.0, 36.6], [36.5, 36.2], [36.0, 36.0], [35.8, 36.6], [34.0, 36.3],
  [32.0, 36.2], [30.6, 36.3], [29.3, 36.2], [27.6, 36.6], [27.2, 37.1], [26.3, 38.4],
  [26.7, 39.3], [26.2, 40.0], [26.7, 40.4], [27.5, 40.9], [26.4, 41.2],
];

// "İstanbul" / "istanbul" / " İSTANBUL " → eşleşme için normalize (TR-locale).
export function normIl(s: string): string {
  return (s || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

const IL_BY_NORM = new Map(ILLER.map((i) => [normIl(i.ad), i]));
export function ilBul(sehir: string): IlNokta | undefined {
  return IL_BY_NORM.get(normIl(sehir));
}
