import { getAllSms, createSms, updateSms, getAllSettings } from '@/lib/queries';
import { NextRequest } from 'next/server';

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

export async function GET() {
  return Response.json(getAllSms().map(toAdminShape));
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const id = createSms(data);

  // Try to send via webhook
  const settings = getAllSettings();
  const webhookUrl = settings['smsWebhookUrl'] ?? '';
  if (webhookUrl) {
    try {
      const r = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: data.phone, text: data.message, name: data.name }),
      });
      if (r.ok) {
        updateSms(id, { status: 'sent', sent_at: new Date().toISOString() });
        return Response.json({ ok: true, status: 'sent' });
      } else {
        updateSms(id, { status: 'failed', error: `HTTP ${r.status}` });
        return Response.json({ ok: false, status: 'failed', error: `HTTP ${r.status}` });
      }
    } catch (e: any) {
      updateSms(id, { status: 'failed', error: e?.message ?? 'Hata' });
      return Response.json({ ok: false, status: 'failed', error: e?.message });
    }
  }

  // No webhook — stays queued
  updateSms(id, { status: 'failed', error: 'Netgsm webhook tanımlı değil (Ayarlar)' });
  return Response.json({ ok: false, status: 'failed', error: 'Netgsm webhook tanımlı değil' });
}
