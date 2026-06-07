import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

function buildScript(title: string, calName: string,
  sy: number, smo: number, sd: number, sh: number, smin: number,
  ey: number, emo: number, ed: number, eh: number, emin: number,
  desc: string
): string {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `tell application "Calendar"
  activate
  delay 1
  set targetCal to missing value
  repeat with aCal in calendars
    if name of aCal is "${esc(calName)}" then
      set targetCal to aCal
      exit repeat
    end if
  end repeat
  if targetCal is missing value then return "ERROR:CAL_NOT_FOUND"

  set sDate to current date
  set year of sDate to ${sy}
  set month of sDate to ${smo}
  set day of sDate to ${sd}
  set hours of sDate to ${sh}
  set minutes of sDate to ${smin}
  set seconds of sDate to 0

  set eDate to current date
  set year of eDate to ${ey}
  set month of eDate to ${emo}
  set day of eDate to ${ed}
  set hours of eDate to ${eh}
  set minutes of eDate to ${emin}
  set seconds of eDate to 0

  tell targetCal
    set newEvent to make new event with properties {summary:"${esc(title)}", start date:sDate, end date:eDate, description:"${esc(desc)}"}
  end tell
  return "OK:" & (uid of newEvent as string)
end tell`;
}

export async function POST(req: NextRequest) {
  const { title, tarih, saat, sure, calName, desc } = await req.json();
  // tarih: "2026-05-27", saat: "10:00", sure: 50 (dakika)
  const [sy, smo, sd] = (tarih as string).split('-').map(Number);
  const [sh, smin] = (saat as string).split(':').map(Number);

  const startMs = new Date(sy, smo - 1, sd, sh, smin).getTime();
  const endMs = startMs + (sure ?? 50) * 60 * 1000;
  const eDate = new Date(endMs);
  const eh = eDate.getHours();
  const emin = eDate.getMinutes();

  const calendarName = calName ?? 'Randevular';
  const script = buildScript(
    title, calendarName,
    sy, smo, sd, sh, smin,
    sy, smo, sd, eh, emin,
    desc ?? ''
  );

  const tmpFile = join(tmpdir(), `cal_write_${Date.now()}.applescript`);
  try {
    try { execSync('open -a Calendar', { timeout: 4000 }); } catch {}
    writeFileSync(tmpFile, script, 'utf8');
    const result = execSync(`osascript "${tmpFile}"`, { encoding: 'utf8', timeout: 30000 }).trim();
    if (result.startsWith('ERROR:')) {
      return NextResponse.json({ error: result }, { status: 400 });
    }
    return NextResponse.json({ ok: true, uid: result.replace('OK:', '') });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}
