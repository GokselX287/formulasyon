import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { NextResponse } from 'next/server';

// Route handler her istekte canlı çalışsın (Next statik cache'lemesin) — kendi cache'imizi yönetiyoruz.
export const dynamic = 'force-dynamic';

const pExecFile = promisify(execFile);

// NOT: `events ... whose start date >= ...` filtresi iCloud takviminde ~18sn sürüyor,
// üstüne per-event özellik erişimi (summary/description/uid) her olay için ayrı Apple
// event round-trip'i yapıp toplamı ~67sn'ye çıkarıyordu → 60sn timeout'u aşıp her sync
// 500 dönüyordu ("takvimden veri çekmiyor"). Çözüm: `whose` YOK; tüm olayların
// özelliklerini TEK bileşik round-trip'te liste olarak çek, tarih aralığını script
// içinde (yerel, hızlı) filtrele. ~34sn'ye düşüyor.
const SCRIPT = `tell application "Calendar"
  set targetCal to missing value
  repeat with aCal in calendars
    if name of aCal is "Randevular" then
      set targetCal to aCal
      exit repeat
    end if
  end repeat
  if targetCal is missing value then return "ERROR:NOT_FOUND"

  set startRange to (current date) - (14 * days)
  set endRange to (current date) + (60 * days)
  set {evTitles, evStarts, evEnds, evUids, evNotes} to {summary, start date, end date, uid, description} of every event of targetCal
end tell

set output to ""
set n to count of evStarts
repeat with i from 1 to n
  set s to item i of evStarts
  if s >= startRange and s <= endRange then
    set e to item i of evEnds
    if e is missing value then set e to s
    set rawTitle to item i of evTitles
    if rawTitle is missing value then
      set evTitle to ""
    else
      set evTitle to my clean(rawTitle)
    end if
    set evNote to ""
    set rawNotes to item i of evNotes
    if rawNotes is not missing value then set evNote to my clean(rawNotes as string)
    set evUid to ""
    set rawUid to item i of evUids
    if rawUid is not missing value then set evUid to rawUid as string
    set output to output & evTitle & "|" & my stamp(s) & "|" & my stamp(e) & "|" & evNote & "|" & evUid & "\\n"
  end if
end repeat
return output

on stamp(d)
  return (year of d as string) & "-" & my padNum(month of d as integer) & "-" & my padNum(day of d) & "T" & my padNum(hours of d) & ":" & my padNum(minutes of d)
end stamp

on padNum(nn)
  if nn < 10 then return "0" & (nn as string)
  return nn as string
end padNum

on clean(t)
  set t to t as string
  set t to my replaceText(t, (ASCII character 10), " ")
  set t to my replaceText(t, (ASCII character 13), " ")
  set t to my replaceText(t, "|", " ")
  return t
end clean

on replaceText(t, f, r)
  set astid to AppleScript's text item delimiters
  set AppleScript's text item delimiters to f
  set parts to text items of t
  set AppleScript's text item delimiters to r
  set t to (parts as string)
  set AppleScript's text item delimiters to astid
  return t
end replaceText`;

type CalEvent = { id: string; title: string; start: string; end?: string; notes?: string; phone?: string; uid?: string };

// ── Önbellek: osascript ~20sn sürüyor; boş takvim "çekmiyor" gibi görünür ──
const TTL = 5 * 60 * 1000;        // 5 dk taze say
const CACHE_FILE = join(tmpdir(), 'formulasyon_calendar_cache.json');
let memCache: { data: CalEvent[]; ts: number } | null = null;
let inFlight: Promise<CalEvent[]> | null = null;

function loadCache(): { data: CalEvent[]; ts: number } | null {
  if (memCache) return memCache;
  try {
    if (existsSync(CACHE_FILE)) {
      const j = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
      if (j && Array.isArray(j.data)) { memCache = j; return memCache; }
    }
  } catch { /* yoksay */ }
  return null;
}

function parse(raw: string): CalEvent[] {
  const stamp = Date.now();
  return raw
    .trim()
    .split('\n')
    .filter((line) => line.includes('|'))
    .map((line, i) => {
      const [title, start, end, notes, uidRaw] = line.split('|');
      const noteStr = (notes ?? '').trim();
      const uid = (uidRaw ?? '').trim() || undefined;
      // Notlar alanından TR cep telefonu çıkar (5XXXXXXXXX; 0/90 önekleri yok sayılır)
      const pm = noteStr.replace(/[^\d+]/g, '').match(/(?:\+?90|0)?(5\d{9})/);
      return {
        // uid varsa kararlı kimlik (senkronlar arası sabit) — güncelleme/silme için
        id: uid ? `cal_${uid}` : `cal_${i}_${stamp}`,
        title: title?.trim() ?? '',
        start: start?.trim() ?? '',
        end: end?.trim() || undefined,
        notes: noteStr || undefined,
        phone: pm ? pm[1] : undefined,
        uid,
      };
    })
    .filter((e) => e.title && e.start);
}

// Calendar.app kapalıyken osascript -600 ("Uygulama çalışmıyor") döndürür → takvim boş
// görünür ("veri çekmiyor"). Sorgudan önce uygulamanın ayakta olduğundan emin ol.
async function ensureCalendarRunning(): Promise<void> {
  try {
    await pExecFile('pgrep', ['-x', 'Calendar']);
    return; // zaten çalışıyor
  } catch { /* kapalı → arka planda başlat */ }
  try { await pExecFile('open', ['-g', '-a', 'Calendar']); } catch { /* yoksay */ }
  // Süreç ayağa kalkana kadar bekle (~6sn üst sınır)
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try { await pExecFile('pgrep', ['-x', 'Calendar']); return; } catch { /* devam */ }
  }
}

// Tek osascript çalıştırması (tmp dosyası yaz → çalıştır → temizle).
async function execScript(): Promise<string> {
  const tmpFile = join(tmpdir(), `cal_sync_${Date.now()}.applescript`);
  try {
    writeFileSync(tmpFile, SCRIPT, 'utf8');
    const { stdout } = await pExecFile('osascript', [tmpFile], {
      encoding: 'utf8',
      timeout: 90000, // ~34sn sürer; iCloud ağ değişkenliğine marj
      maxBuffer: 8 * 1024 * 1024,
    });
    return stdout;
  } finally {
    try { unlinkSync(tmpFile); } catch { /* yoksay */ }
  }
}

// Gerçek osascript senkronu — eşzamanlı çağrılar tek promise'i paylaşır.
function runSync(): Promise<CalEvent[]> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    await ensureCalendarRunning();
    let stdout: string;
    try {
      stdout = await execScript();
    } catch (e: unknown) {
      // -600 yarışı (süreç var ama Apple event'lere henüz hazır değil) → bir kez tazele+yeniden dene
      const msg = e instanceof Error ? e.message : String(e);
      if (/-600|çalışmıyor|isn'?t running|not running/i.test(msg)) {
        try { await pExecFile('open', ['-g', '-a', 'Calendar']); } catch { /* yoksay */ }
        await new Promise((r) => setTimeout(r, 1500));
        stdout = await execScript();
      } else {
        throw e;
      }
    }
    if (stdout.trim().startsWith('ERROR:NOT_FOUND')) {
      throw new Error('Randevular calendar not found');
    }
    const events = parse(stdout);
    memCache = { data: events, ts: Date.now() };
    try { writeFileSync(CACHE_FILE, JSON.stringify(memCache), 'utf8'); } catch { /* yoksay */ }
    return events;
  })().finally(() => { inFlight = null; });
  return inFlight;
}

// GET — cache varsa anında dön; bayatsa arka planda tazele (stale-while-revalidate).
export async function GET() {
  const cache = loadCache();
  if (cache) {
    const stale = Date.now() - cache.ts >= TTL;
    if (stale && !inFlight) { runSync().catch(() => {}); } // arka planda tazele, bekleme
    return NextResponse.json(cache.data);
  }
  // Hiç cache yok → ilk senkronu beklemek zorundayız (tek seferlik yavaşlık).
  try {
    const data = await runSync();
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// POST — manuel senkron: taze veri bekle (cache'i tazeler).
export async function POST() {
  try {
    const data = await runSync();
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
