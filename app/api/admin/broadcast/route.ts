import { NextRequest, NextResponse } from 'next/server';
import { isAuthed } from '@/lib/admin-auth';
import { currentUserId } from '@/lib/tenant';
import { listUsers, updateUser, logAudit } from '@/lib/admin';
import { sendNetgsmSms } from '@/lib/netgsm';
import { getAllSettings, createSms, updateSms } from '@/lib/queries';

export const dynamic = 'force-dynamic';

// Toplu SMS — tüm (ya da role/duruma göre filtrelenmiş) hesaplara gönderir.
// Mevcut Netgsm hattını (lib/netgsm + sms_log) yeniden kullanır.
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 });
  const uid = currentUserId(req);
  if (!uid) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 });
  const { message, roles, statuses } = await req.json();
  if (!message || !String(message).trim()) {
    return NextResponse.json({ ok: false, error: 'Mesaj boş olamaz.' }, { status: 400 });
  }

  const settings = getAllSettings();
  const usercode = process.env.NETGSM_USERCODE || settings['netgsmUser'] || '';
  const password = process.env.NETGSM_PASSWORD || settings['netgsmPassword'] || '';
  const header = process.env.NETGSM_HEADER || settings['netgsmHeader'] || '';
  if (!usercode || !password || !header) {
    return NextResponse.json({ ok: false, error: 'Netgsm bilgileri ayarlı değil (Ayarlar → Bildirim & SMS).' }, { status: 400 });
  }

  let targets = listUsers().filter((u) => u.phone && String(u.phone).trim());
  if (Array.isArray(roles) && roles.length) targets = targets.filter((u) => roles.includes(u.role));
  if (Array.isArray(statuses) && statuses.length) targets = targets.filter((u) => statuses.includes(u.status));

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || req.headers.get('x-real-ip') || 'local';
  let sent = 0;
  let failed = 0;
  const results: { id: string; name: string; ok: boolean; error?: string }[] = [];
  for (const u of targets) {
    const smsId = createSms({ phone: u.phone!, name: u.name, message, trigger_type: 'manual' }, uid, ip);
    const res = await sendNetgsmSms({ usercode, password, header, to: u.phone!, message });
    if (res.ok) {
      sent++;
      updateSms(smsId, { status: 'sent', sent_at: new Date().toISOString() }, uid);
      updateUser(u.id, { last_sms_at: new Date().toISOString() });
      results.push({ id: u.id, name: u.name, ok: true });
    } else {
      failed++;
      updateSms(smsId, { status: 'failed', error: res.error ?? 'Gönderilemedi' }, uid);
      results.push({ id: u.id, name: u.name, ok: false, error: res.error });
    }
  }

  logAudit('broadcast.send', null, { count: targets.length, sent, failed, message: String(message).slice(0, 80) });
  return NextResponse.json({ ok: true, total: targets.length, sent, failed, results });
}
