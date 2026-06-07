import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// AppleScript: Randevular takvimindeki tüm geçmiş etkinlikler (son 10 yıl → bugün)
const HISTORY_SCRIPT = `tell application "Calendar"
  activate
  delay 1
  set targetCal to missing value
  repeat with aCal in calendars
    if name of aCal is "Randevular" then
      set targetCal to aCal
      exit repeat
    end if
  end repeat
  if targetCal is missing value then return "ERROR:NOT_FOUND"

  set startRange to (current date) - (3650 * days)
  set endRange to current date
  set calEvents to (events of targetCal whose start date >= startRange and start date <= endRange)
  set output to ""
  repeat with anEvent in calEvents
    set s to start date of anEvent
    set e to end date of anEvent
    set sYear  to year of s as string
    set sMon   to my padNum(month of s as integer)
    set sDay   to my padNum(day of s)
    set sHour  to my padNum(hours of s)
    set sMin   to my padNum(minutes of s)
    set eHour  to my padNum(hours of e)
    set eMin   to my padNum(minutes of e)
    set evTitle to summary of anEvent
    set output to output & evTitle & "|" & sYear & "-" & sMon & "-" & sDay & "T" & sHour & ":" & sMin & "|" & eHour & ":" & eMin & "\\n"
  end repeat
  return output
end tell

on padNum(n)
  if n < 10 then return "0" & (n as string)
  return n as string
end padNum`;

// 20:00 ve sonrasını iptal say
function isIptal(saat: string): boolean {
  const [h] = saat.split(':').map(Number);
  return h >= 20;
}

// Danışan adı normalize: baştaki/sondaki boşluk sil, büyük/küçük harf birleştir
function normName(title: string): string {
  return title.trim().replace(/\s+/g, ' ');
}

export async function GET() {
  const db = getDb();

  // Önce DB'deki mevcut verileri döndür (önbelleklenmiş)
  const existing = db.prepare(`SELECT * FROM takvim_gecmis ORDER BY start_dt ASC`).all() as any[];
  if (existing.length > 0) {
    return NextResponse.json(buildAnaliz(existing));
  }

  return NextResponse.json({ empty: true, message: 'Henüz senkronizasyon yapılmadı.' });
}

export async function POST() {
  const db = getDb();
  const tmpFile = join(tmpdir(), `cal_hist_${Date.now()}.applescript`);

  try {
    // Calendar uygulamasının çalışır durumda olduğundan emin ol
    try {
      execSync(`open -a Calendar`, { encoding: 'utf8', timeout: 5000 });
      execSync(`sleep 2`, { timeout: 5000 });
    } catch {}

    writeFileSync(tmpFile, HISTORY_SCRIPT, 'utf8');
    const raw = execSync(`osascript "${tmpFile}"`, { encoding: 'utf8', timeout: 90000 });

    if (raw.trim().startsWith('ERROR:NOT_FOUND')) {
      return NextResponse.json({ error: 'Randevular takvimi bulunamadı.' }, { status: 404 });
    }

    const lines = raw.trim().split('\n').filter(l => l.includes('|'));

    // Tabloyu temizle ve yeniden doldur
    db.prepare('DELETE FROM takvim_gecmis').run();

    const insert = db.prepare(`
      INSERT INTO takvim_gecmis (id, event_title, start_dt, end_dt, saat, is_cancelled)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((rows: any[]) => {
      rows.forEach(r => insert.run(r.id, r.title, r.start_dt, r.end_dt, r.saat, r.is_cancelled));
    });

    const rows = lines.map((line, i) => {
      const [title, startDt, endSaat] = line.split('|');
      const cleanTitle = normName(title ?? '');
      const cleanStart = startDt?.trim() ?? '';
      const saat = cleanStart.includes('T') ? cleanStart.split('T')[1] : '';
      const cancelled = isIptal(saat) ? 1 : 0;
      return {
        id: `tg_${i}_${Date.now()}`,
        title: cleanTitle,
        start_dt: cleanStart,
        end_dt: endSaat?.trim() ?? null,
        saat,
        is_cancelled: cancelled,
      };
    }).filter(r => r.title && r.start_dt);

    insertMany(rows);

    const all = db.prepare(`SELECT * FROM takvim_gecmis ORDER BY start_dt ASC`).all() as any[];
    return NextResponse.json(buildAnaliz(all));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

function buildAnaliz(rows: any[]) {
  // Danışan bazında gruplama
  const clientMap = new Map<string, {
    ad: string;
    toplamRandevu: number;
    gerceklesen: number;
    iptal: number;
    seanslar: { tarih: string; saat: string; iptal: boolean }[];
    ilkTarih: string;
    sonTarih: string;
  }>();

  for (const r of rows) {
    const ad = r.event_title as string;
    if (!ad) continue;
    const iptal = r.is_cancelled === 1;
    const tarih = (r.start_dt as string).split('T')[0] ?? '';
    const saat  = r.saat as string;

    if (!clientMap.has(ad)) {
      clientMap.set(ad, { ad, toplamRandevu: 0, gerceklesen: 0, iptal: 0, seanslar: [], ilkTarih: tarih, sonTarih: tarih });
    }
    const c = clientMap.get(ad)!;
    c.toplamRandevu++;
    if (iptal) c.iptal++; else c.gerceklesen++;
    c.seanslar.push({ tarih, saat, iptal });
    if (tarih < c.ilkTarih) c.ilkTarih = tarih;
    if (tarih > c.sonTarih) c.sonTarih = tarih;
  }

  const danisanlar = [...clientMap.values()].sort((a, b) => b.toplamRandevu - a.toplamRandevu);

  const ozet = {
    toplamEtkinlik:  rows.length,
    benzersizDanis:  danisanlar.length,
    toplamGercekles: danisanlar.reduce((s, c) => s + c.gerceklesen, 0),
    toplamIptal:     danisanlar.reduce((s, c) => s + c.iptal, 0),
    enErkenTarih:    rows[0]?.start_dt?.split('T')[0] ?? null,
    enGecTarih:      rows[rows.length - 1]?.start_dt?.split('T')[0] ?? null,
  };

  return { ozet, danisanlar };
}
