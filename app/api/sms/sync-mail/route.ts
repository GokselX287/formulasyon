/**
 * GET /api/sms/sync-mail
 *
 * Gmail IMAP üzerinden SMS iletim raporu e-postalarını çeker,
 * sms_log tablosunu "delivered" / "failed" olarak günceller.
 *
 * Gerekli ayarlar (app_settings):
 *   gmailUser        — Gmail adresi (örn. klinik@gmail.com)
 *   gmailAppPassword — Google Uygulama Şifresi (16 karakter)
 *   gmailImapHost    — Varsayılan: imap.gmail.com
 *   gmailImapPort    — Varsayılan: 993
 */

import { getOwnerSettings, getAllSms, updateSms } from '@/lib/queries';
import { ownerOr401 } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';

// ── İletim raporu e-postasını ayrıştır ──────────────────────────────────────
// Netgsm, iletim bildirimlerini genellikle şu formatlardan biriyle gönderir:
//   Subject: "SMS Iletim Raporu" / "Delivery Report" / "SMS Report"
//   Body: telefon numarası + durum (delivered / failed / undelivered)
// Bu fonksiyon basit bir regex taraması yapar; sağlayıcıya göre güncellenebilir.
function parseDeliveryReport(subject: string, text: string): {
  phone?: string;
  status: 'delivered' | 'failed';
  at?: string;
} | null {
  const subjectLower = subject.toLowerCase();
  const isDeliveryMail =
    subjectLower.includes('iletim') ||
    subjectLower.includes('delivery') ||
    subjectLower.includes('rapor') ||
    subjectLower.includes('report') ||
    subjectLower.includes('sms');

  if (!isDeliveryMail) return null;

  // Telefon numarası: 10-13 haneli sayı (Türkiye: 905xxxxxxxxx veya 05xxxxxxxxx)
  const phoneMatch = text.match(/(?:\+?90|0)?[5][0-9]{9}/);
  const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, '') : undefined;

  // Başarı ifadeleri
  const successPattern = /iletildi|delivered|success|başarılı|teslim/i;
  // Başarısızlık ifadeleri
  const failPattern = /iletilmedi|failed|undelivered|hata|başarısız|error/i;

  let status: 'delivered' | 'failed' = 'delivered';
  if (failPattern.test(text)) {
    status = 'failed';
  } else if (successPattern.test(text)) {
    status = 'delivered';
  } else {
    // Belirsizse — varsayılan: teslim edildi sayarız, çünkü rapor geldi
    status = 'delivered';
  }

  // Tarih: e-posta tarihini kullanacağız, text'ten çıkarmaya gerek yok
  return { phone, status };
}

export async function GET(request: NextRequest) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const settings = getOwnerSettings(uid);
  const gmailUser = settings['gmailUser'] ?? '';
  const gmailAppPassword = settings['gmailAppPassword'] ?? '';
  const gmailImapHost = settings['gmailImapHost'] ?? 'imap.gmail.com';
  const gmailImapPort = Number(settings['gmailImapPort'] ?? '993');

  if (!gmailUser || !gmailAppPassword) {
    return Response.json(
      { ok: false, error: 'Gmail kullanıcı adı ve uygulama şifresi ayarlanmamış.' },
      { status: 400 },
    );
  }

  // Mevcut SMS kayıtları (son 200)
  const smsLogs = getAllSms(uid);
  // Telefon → son SMS id eşlemesi (en yakın zamanlı)
  const phoneToSms = new Map<string, typeof smsLogs[number]>();
  for (const m of smsLogs) {
    if (!m.phone) continue;
    const normalized = m.phone.replace(/\D/g, '');
    if (!phoneToSms.has(normalized)) {
      phoneToSms.set(normalized, m);
    }
  }

  const client = new ImapFlow({
    host: gmailImapHost,
    port: gmailImapPort,
    secure: true,
    auth: { user: gmailUser, pass: gmailAppPassword },
    logger: false,
  });

  let updated = 0;
  let checked = 0;
  const errors: string[] = [];

  try {
    await client.connect();

    // INBOX'ta son 7 günlük e-postalar
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    }); // "19-May-2025"

    await client.mailboxOpen('INBOX');

    for await (const msg of client.fetch(
      { since: since },
      { envelope: true, bodyStructure: true, source: true },
    )) {
      checked++;
      try {
        const subject = msg.envelope?.subject ?? '';
        const rawSource = msg.source?.toString('utf-8') ?? '';

        // Body'yi ham kaynaktan çıkar (MIME header'larını atla)
        const bodyStart = rawSource.indexOf('\r\n\r\n');
        const bodyText = bodyStart >= 0 ? rawSource.slice(bodyStart + 4) : rawSource;

        const parsed = parseDeliveryReport(subject, bodyText);
        if (!parsed) continue;

        // E-postanın geliş tarihini al
        const deliveredAt = msg.envelope?.date?.toISOString() ?? new Date().toISOString();

        if (parsed.phone) {
          // Normalize: başına 90 ekle
          const variants = [
            parsed.phone,
            '90' + parsed.phone.slice(-10),
            '0' + parsed.phone.slice(-10),
            parsed.phone.slice(-10),
          ];

          let matched: typeof smsLogs[number] | undefined;
          for (const v of variants) {
            if (phoneToSms.has(v)) { matched = phoneToSms.get(v); break; }
          }

          if (matched && matched.status !== 'delivered') {
            updateSms(matched.id, {
              status: parsed.status === 'delivered' ? 'sent' : 'failed',
              delivery_status: parsed.status,
              delivered_at: deliveredAt,
            } as Parameters<typeof updateSms>[1], uid);
            updated++;
          }
        } else {
          // Telefon çıkarılamadı — tüm "sent" SMS'leri güncelle (sağlayıcı raporu tek e-posta gönderiyorsa)
          // Güvenli değil; atla.
        }
      } catch (msgErr: any) {
        errors.push(String(msgErr?.message ?? msgErr));
      }
    }

    await client.logout();
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, checked, updated, errors });
}
