'use client';

// ──────────────────────────────────────────────────────────────────────────
// ÖNİZLEME ROUTE'U — /preview/takvim
// Amaç: GERÇEK <TakvimRandevular /> bileşenini (gerçek TSX + gerçek CSS) VERİTABANI
// OLMADAN, örnek veriyle render etmek. Repo'yu bağlayan design ortamı bu sayfayı
// açtığında uygulamanın asıl takvimini birebir görür; renk/yapı değişikliği gerçek
// components/TakvimRandevular.tsx + .css üzerinde yapılır ve burada anında yansır.
//
// Bu route DB'ye DOKUNMAZ (better-sqlite3 yüklenmez) → her ortamda çalışır.
// Üretimde kullanılmaz; yalnızca tasarım önizlemesi içindir.
// ──────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import TakvimRandevular, {
  type RawCalEvent,
} from '@/components/TakvimRandevular';

const pad = (n: number) => String(n).padStart(2, '0');

// Bu haftanın Pazartesi'si (yerel saat) — örnek randevular buna göre üretilir.
function mondayOfThisWeek(): Date {
  const d = new Date();
  const dow = (d.getDay() + 6) % 7; // 0 = Pazartesi
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
}

// gün ofseti + saat → 'YYYY-MM-DDTHH:MM:00' (bileşenin beklediği yerel ISO biçimi)
function slot(monday: Date, dayOffset: number, h: number, m: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + dayOffset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}:00`;
}

// Örnek danışan eşlemesi (sahte) — gerçek resolveClient'ın döndürdüğü şekil.
const SAMPLE: Record<string, { topic: string; fee: number; phone: string; reviewed: boolean }> = {
  'Elif K.': { topic: 'İlk görüşme', fee: 1500, phone: '0500 000 00 01', reviewed: true },
  'Mert A.': { topic: 'Takip · BDT', fee: 1200, phone: '0500 000 00 02', reviewed: true },
  'Zeynep D.': { topic: 'Online', fee: 1200, phone: '0500 000 00 03', reviewed: false },
  'Can Y.': { topic: 'Çift terapisi', fee: 1800, phone: '0500 000 00 04', reviewed: true },
  'A. Yılmaz': { topic: 'Takip · BDT', fee: 1200, phone: '0500 000 00 05', reviewed: true },
  'Selin T.': { topic: 'Takip', fee: 1200, phone: '0500 000 00 06', reviewed: true },
  'B. Aydın': { topic: 'Şema', fee: 1400, phone: '0500 000 00 07', reviewed: false },
  'S. Kaya': { topic: 'Süreklilik', fee: 1200, phone: '0500 000 00 08', reviewed: true },
  'E. Şahin': { topic: 'Panik · seans 3', fee: 1300, phone: '0500 000 00 09', reviewed: true },
};

export default function TakvimPreviewPage() {
  const events = useMemo<RawCalEvent[]>(() => {
    const mon = mondayOfThisWeek();
    const mk = (id: string, name: string, day: number, h: number, m: number): RawCalEvent => ({
      id,
      uid: id,
      title: name,
      start: slot(mon, day, h, m),
      end: slot(mon, day, h, m + 50),
    });
    return [
      mk('e1', 'Elif K.', 0, 9, 0),
      mk('e2', 'Mert A.', 0, 13, 30),
      mk('e3', 'Zeynep D.', 1, 10, 30),
      mk('e4', 'Can Y.', 1, 15, 0),
      mk('e5', 'A. Yılmaz', 2, 9, 0),
      mk('e6', 'Selin T.', 2, 16, 30),
      mk('e7', 'B. Aydın', 3, 12, 0),
      mk('e8', 'S. Kaya', 4, 10, 30),
      mk('e9', 'E. Şahin', 4, 15, 0),
    ];
  }, []);

  const resolveClient = (name: string) => {
    const s = SAMPLE[name];
    if (!s) return undefined;
    return { id: name, topic: s.topic, phone: s.phone, reviewed: s.reviewed, fee: s.fee };
  };

  return (
    <TakvimRandevular
      events={events}
      resolveClient={resolveClient}
      avgFee={1300}
      missingFeeCount={1}
      availability={{ sablon: [], bloklar: [] }}
      gelisimEvents={[]}
    />
  );
}
