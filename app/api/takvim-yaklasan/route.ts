import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { NextResponse } from 'next/server';

const SCRIPT = `tell application "Calendar"
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

  set startRange to current date
  set hours of startRange to 0
  set minutes of startRange to 0
  set seconds of startRange to 0
  set endRange to startRange + (8 * days)

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

export async function GET() {
  const tmpFile = join(tmpdir(), `cal_yaklasan_${Date.now()}.applescript`);
  try {
    try { execSync('open -a Calendar', { timeout: 4000 }); execSync('sleep 1.5', { timeout: 4000 }); } catch {}
    writeFileSync(tmpFile, SCRIPT, 'utf8');
    const raw = execSync(`osascript "${tmpFile}"`, { encoding: 'utf8', timeout: 30000 });

    if (raw.trim().startsWith('ERROR:')) {
      return NextResponse.json({ error: raw.trim() }, { status: 404 });
    }

    const lines = raw.trim().split('\n').filter(l => l.includes('|'));
    const events = lines.map((line, i) => {
      const [title, startDt, endSaat] = line.split('|');
      const cleanTitle = title?.trim() ?? '';
      const cleanStart = startDt?.trim() ?? '';
      const tarih = cleanStart.includes('T') ? cleanStart.split('T')[0] : '';
      const saat  = cleanStart.includes('T') ? cleanStart.split('T')[1] : '';
      const [eh, em] = (endSaat?.trim() ?? '').split(':').map(Number);
      const [sh, sm] = saat.split(':').map(Number);
      const sure = (!isNaN(eh) && !isNaN(sh)) ? (eh * 60 + em) - (sh * 60 + sm) : 50;
      return {
        id: `cal_${i}_${Date.now()}`,
        clientName: cleanTitle,
        clientId: null,
        tarih,
        saat,
        sure: sure > 0 ? sure : 50,
        not: '',
        done: false,
        source: 'calendar' as const,
      };
    }).filter(e => e.clientName && e.tarih && e.saat);

    return NextResponse.json(events);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}
