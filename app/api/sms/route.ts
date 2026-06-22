import { getAllSms, createSms, updateSms, getAllSettings } from '@/lib/queries';
import { sendNetgsmSms } from '@/lib/netgsm';
import { ownerOr401 } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

function toAdminShape(m: ReturnType<typeof getAllSms>[number]) {
  return {
    id: m.id,
    phone: m.phone,
    name: m.name,
    message: m.message,
    trigger: m.trigger_type as 'manual' | 'appointment_reminder' | 'workshop_signup',
    status: m.status as 'queued' | 'sent' | 'failed',
    error: m.error,
    createdAt: m.created_at,
    sentAt: m.sent_at,
    deliveryStatus: (m as any).delivery_status as string | undefined,
    deliveredAt: (m as any).delivered_at as string | undefined,
  };
}

export async function GET(request: NextRequest) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  return Response.json(getAllSms(uid).map(toAdminShape));
}

export async function POST(request: NextRequest) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const data = await request.json();
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || request.headers.get('x-real-ip') || 'local';
  const id = createSms(data, uid, ip);
  const settings = getAllSettings();

  // 1) Netgsm doğrudan API (öncelikli). Bilgiler env veya yerel ayarlardan okunur.
  const usercode = process.env.NETGSM_USERCODE || settings['netgsmUser'] || '';
  const password = process.env.NETGSM_PASSWORD || settings['netgsmPassword'] || '';
  const header = process.env.NETGSM_HEADER || settings['netgsmHeader'] || '';
  if (usercode && password && header) {
    const res = await sendNetgsmSms({ usercode, password, header, to: data.phone, message: data.message });
    if (res.ok) {
      updateSms(id, { status: 'sent', sent_at: new Date().toISOString() }, uid);
      return Response.json({ ok: true, status: 'sent', jobid: res.jobid });
    }
    updateSms(id, { status: 'failed', error: res.error ?? 'Netgsm gönderim hatası' }, uid);
    return Response.json({ ok: false, status: 'failed', error: res.error, code: res.code });
  }

  // 2) Webhook (geriye dönük uyumluluk — Netgsm bilgileri girilmemişse).
  const webhookUrl = settings['smsWebhookUrl'] ?? '';
  if (webhookUrl) {
    try {
      const r = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: data.phone, text: data.message, name: data.name }),
      });
      if (r.ok) {
        updateSms(id, { status: 'sent', sent_at: new Date().toISOString() }, uid);
        return Response.json({ ok: true, status: 'sent' });
      } else {
        updateSms(id, { status: 'failed', error: `HTTP ${r.status}` }, uid);
        return Response.json({ ok: false, status: 'failed', error: `HTTP ${r.status}` });
      }
    } catch (e: any) {
      updateSms(id, { status: 'failed', error: e?.message ?? 'Hata' }, uid);
      return Response.json({ ok: false, status: 'failed', error: e?.message });
    }
  }

  // 3) Hiçbir gönderim yöntemi yapılandırılmamış.
  updateSms(id, { status: 'failed', error: 'Netgsm bilgileri girilmemiş (Profil → Bildirim & SMS)' }, uid);
  return Response.json({ ok: false, status: 'failed', error: 'Netgsm bilgileri girilmemiş (Profil → Bildirim & SMS)' });
}
