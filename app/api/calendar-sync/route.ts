import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { NextResponse } from 'next/server';

// Route handler her istekte canlı çalışsın (Next statik cache'lemesin) — kendi cache'imizi yönetiyoruz.
export const dynamic = 'force-dynamic';

const pExecFile = promisify(execFile);

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
  set calEvents to (events of targetCal whose start date >= startRange and start date <= endRange)
  set output to ""
  repeat with anEvent in calEvents
    set s to start date of anEvent
    set e to end date of anEvent
    set sYear to year of s as string
    set sMon to my padNum(month of s as integer)
    set sDay to my padNum(day of s)
    set sHour to my padNum(hours of s)
    set sMin to my padNum(minutes of s)
    set eYear to year of e as string
    set eMon to my padNum(month of e as integer)
    set eDay to my padNum(day of e)
    set eHour to my padNum(hours of e)
    set eMin to my padNum(minutes of e)
    set evTitle to summary of anEvent
    set output to output & evTitle & "|" & sYear & "-" & sMon & "-" & sDay & "T" & sHour & ":" & sMin & "|" & eYear & "-" & eMon & "-" & eDay & "T" & eHour & ":" & eMin & "\\n"
  end repeat
  return output
end tell

on padNum(n)
  if n < 10 then return "0" & (n as string)
  return n as string
end padNum`;

type CalEvent = { id: string; title: string; start: string; end?: string };

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
      const [title, start, end] = line.split('|');
      return {
        id: `cal_${i}_${stamp}`,
        title: title?.trim() ?? '',
        start: start?.trim() ?? '',
        end: end?.trim() || undefined,
      };
    })
    .filter((e) => e.title && e.start);
}

// Gerçek osascript senkronu — eşzamanlı çağrılar tek promise'i paylaşır.
function runSync(): Promise<CalEvent[]> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const tmpFile = join(tmpdir(), `cal_sync_${Date.now()}.applescript`);
    try {
      writeFileSync(tmpFile, SCRIPT, 'utf8');
      const { stdout } = await pExecFile('osascript', [tmpFile], {
        encoding: 'utf8',
        timeout: 60000,
        maxBuffer: 8 * 1024 * 1024,
      });
      if (stdout.trim().startsWith('ERROR:NOT_FOUND')) {
        throw new Error('Randevular calendar not found');
      }
      const events = parse(stdout);
      memCache = { data: events, ts: Date.now() };
      try { writeFileSync(CACHE_FILE, JSON.stringify(memCache), 'utf8'); } catch { /* yoksay */ }
      return events;
    } finally {
      try { unlinkSync(tmpFile); } catch { /* yoksay */ }
    }
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
