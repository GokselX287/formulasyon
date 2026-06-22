import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

// macOS "Randevular" takvimindeki bir olayı uid ile bulup günceller:
// başlangıç/bitiş (yeniden planlama) + opsiyonel başlık. takvim-yaz ile aynı desen.
function buildScript(uid: string, calName: string, title: string | null,
  sy: number, smo: number, sd: number, sh: number, smin: number,
  eh: number, emin: number
): string {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const titleProp = title != null ? `, summary:"${esc(title)}"` : '';
  return `tell application "Calendar"
  set targetCal to missing value
  repeat with aCal in calendars
    if name of aCal is "${esc(calName)}" then
      set targetCal to aCal
      exit repeat
    end if
  end repeat
  if targetCal is missing value then return "ERROR:CAL_NOT_FOUND"

  set evs to (every event of targetCal whose uid is "${esc(uid)}")
  if (count of evs) is 0 then return "ERROR:NOT_FOUND"
  set theEvent to item 1 of evs

  set sDate to current date
  set year of sDate to ${sy}
  set month of sDate to ${smo}
  set day of sDate to ${sd}
  set hours of sDate to ${sh}
  set minutes of sDate to ${smin}
  set seconds of sDate to 0

  set eDate to current date
  set year of eDate to ${sy}
  set month of eDate to ${smo}
  set day of eDate to ${sd}
  set hours of eDate to ${eh}
  set minutes of eDate to ${emin}
  set seconds of eDate to 0

  -- ATOMİK: start+end birlikte set edilir; aksi halde ileri taşımada
  -- ara durumda start>end olur ve macOS "-10025" ile reddeder.
  set properties of theEvent to {start date:sDate, end date:eDate${titleProp}}
  return "OK"
end tell`;
}

export async function POST(req: NextRequest) {
  const { uid, tarih, saat, sure, title, calName } = await req.json();
  if (!uid || !tarih || !saat) {
    return NextResponse.json({ error: 'uid, tarih ve saat gerekli' }, { status: 400 });
  }
  const [sy, smo, sd] = (tarih as string).split('-').map(Number);
  const [sh, smin] = (saat as string).split(':').map(Number);
  const startMs = new Date(sy, smo - 1, sd, sh, smin).getTime();
  const endMs = startMs + ((sure ?? 50) as number) * 60 * 1000;
  const eDate = new Date(endMs);
  const eh = eDate.getHours();
  const emin = eDate.getMinutes();

  const script = buildScript(
    String(uid), calName ?? 'Randevular',
    typeof title === 'string' && title.trim() ? title.trim() : null,
    sy, smo, sd, sh, smin, eh, emin
  );

  const tmpFile = join(tmpdir(), `cal_update_${Date.now()}.applescript`);
  try {
    writeFileSync(tmpFile, script, 'utf8');
    const result = execSync(`osascript "${tmpFile}"`, { encoding: 'utf8', timeout: 30000 }).trim();
    if (result.startsWith('ERROR:')) {
      return NextResponse.json({ error: result }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}
