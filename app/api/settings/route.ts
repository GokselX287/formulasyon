import { getOwnerSettings, setOwnerSetting } from '@/lib/queries';
import { getUserById } from '@/lib/auth';
import { ownerOr401 } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULTS = {
  therapistName: 'Terapist',
  // Terapist profili — düzenlenebilir alanlar (boşsa bileşen kendi varsayılan metnini gösterir)
  therapistTitle: '',
  therapistAbout: '',
  therapistLocation: '',
  therapistEmail: '',
  therapistPhone: '',
  therapistSchools: '',
  smsWebhookUrl: '',
  netgsmUser: '',
  netgsmPassword: '',
  netgsmHeader: '',
  smsAutoAppointmentReminder: 'true',
  smsAutoWorkshopSignup: 'true',
  smsDayOfReminder: 'true',
  noShowTracking: 'true',
  gmailUser: '',
  gmailAppPassword: '',
  gmailImapHost: 'imap.gmail.com',
  gmailImapPort: '993',
  todayIntent: '',
  therapistTrainings: '[]',
};

export async function GET(request: NextRequest) {
  const uid = ownerOr401(request);
  if (uid instanceof NextResponse) return uid;

  const raw = getOwnerSettings(uid);
  // therapistName boşsa hesabın adına düş — yeni kullanıcı kendi adını görsün, "Göksel"i değil.
  const therapistName = raw.therapistName || getUserById(uid)?.name || DEFAULTS.therapistName;
  const merged = { ...DEFAULTS, ...raw, therapistName };
  return Response.json({
    therapistName: merged.therapistName,
    therapistTitle: merged.therapistTitle,
    therapistAbout: merged.therapistAbout,
    therapistLocation: merged.therapistLocation,
    therapistEmail: merged.therapistEmail,
    therapistPhone: merged.therapistPhone,
    therapistSchools: merged.therapistSchools,
    smsWebhookUrl: merged.smsWebhookUrl,
    netgsmUser: merged.netgsmUser,
    netgsmPassword: merged.netgsmPassword,
    netgsmHeader: merged.netgsmHeader,
    smsAutoAppointmentReminder: merged.smsAutoAppointmentReminder === 'true',
    smsAutoWorkshopSignup: merged.smsAutoWorkshopSignup === 'true',
    smsDayOfReminder: merged.smsDayOfReminder === 'true',
    noShowTracking: merged.noShowTracking === 'true',
    gmailUser: merged.gmailUser,
    gmailAppPassword: merged.gmailAppPassword,
    gmailImapHost: merged.gmailImapHost,
    gmailImapPort: Number(merged.gmailImapPort) || 993,
    todayIntent: merged.todayIntent ?? '',
    therapistTrainings: merged.therapistTrainings ?? '[]',
  });
}

export async function PATCH(request: NextRequest) {
  const uid = ownerOr401(request);
  if (uid instanceof NextResponse) return uid;

  const data = await request.json();
  for (const [k, v] of Object.entries(data)) {
    setOwnerSetting(uid, k, typeof v === 'boolean' ? String(v) : String(v ?? ''));
  }
  return Response.json({ ok: true });
}
