import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

// macOS "Randevular" takvimindeki bir olayı uid ile bulup siler.
function buildScript(uid: string, calName: string): string {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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
  delete (item 1 of evs)
  return "OK"
end tell`;
}

export async function POST(req: NextRequest) {
  const { uid, calName } = await req.json();
  if (!uid) return NextResponse.json({ error: 'uid gerekli' }, { status: 400 });

  const script = buildScript(String(uid), calName ?? 'Randevular');
  const tmpFile = join(tmpdir(), `cal_delete_${Date.now()}.applescript`);
  try {
    writeFileSync(tmpFile, script, 'utf8');
    const result = execSync(`osascript "${tmpFile}"`, { encoding: 'utf8', timeout: 30000 }).trim();
    if (result.startsWith('ERROR:')) {
      // NOT_FOUND = olay zaten yok say → başarı kabul et (idempotent)
      if (result.includes('NOT_FOUND')) return NextResponse.json({ ok: true, alreadyGone: true });
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
