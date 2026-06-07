import { getAllSettings, setSetting } from '@/lib/queries';
import { NextRequest } from 'next/server';

const DEFAULTS = {
  therapistName: 'Terapist',
  smsWebhookUrl: '',
  smsAutoAppointmentReminder: 'true',
  smsAutoWorkshopSignup: 'true',
  smsDayOfReminder: 'true',
  noShowTracking: 'true',
  gmailUser: '',
  gmailAppPassword: '',
  gmailImapHost: 'imap.gmail.com',
  gmailImapPort: '993',
  todayIntent: '',
};

export async function GET() {
  const raw = getAllSettings();
  const merged = { ...DEFAULTS, ...raw };
  return Response.json({
    therapistName: merged.therapistName,
    smsWebhookUrl: merged.smsWebhookUrl,
    smsAutoAppointmentReminder: merged.smsAutoAppointmentReminder === 'true',
    smsAutoWorkshopSignup: merged.smsAutoWorkshopSignup === 'true',
    smsDayOfReminder: merged.smsDayOfReminder === 'true',
    noShowTracking: merged.noShowTracking === 'true',
    gmailUser: merged.gmailUser,
    gmailAppPassword: merged.gmailAppPassword,
    gmailImapHost: merged.gmailImapHost,
    gmailImapPort: Number(merged.gmailImapPort) || 993,
    todayIntent: merged.todayIntent ?? '',
  });
}

export async function PATCH(request: NextRequest) {
  const data = await request.json();
  for (const [k, v] of Object.entries(data)) {
    setSetting(k, typeof v === 'boolean' ? String(v) : String(v ?? ''));
  }
  return Response.json({ ok: true });
}
