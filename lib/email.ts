// ──────────────────────────────────────────────────────────────────────────
// E-posta gönderimi — CREDENTIAL-READY. RESEND_API_KEY varsa Resend ile gönderir;
// yoksa DEV modunda içeriği/linki konsola yazar ve {dev:true} döner — böylece
// e-posta doğrulama ve şifre sıfırlama localde (gerçek gönderim olmadan) çalışır.
// Resend yerine başka bir SMTP/servis eklenecekse yalnız sendMail değişir.
// ──────────────────────────────────────────────────────────────────────────

type MailInput = { to: string; subject: string; html: string; text?: string };
export type MailResult = { delivered: boolean; dev: boolean; id?: string; error?: string };

const FROM = process.env.MAIL_FROM || 'Calmie <onboarding@resend.dev>';

export async function sendMail({ to, subject, html, text }: MailInput): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Dev/credential-ready: gerçek gönderim yok — içerik konsola.
    console.log(`\n──────── [DEV E-POSTA] ────────\nKime:  ${to}\nKonu:  ${subject}\n${text || stripHtml(html)}\n───────────────────────────────\n`);
    return { delivered: false, dev: true };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html, text: text || stripHtml(html) }),
    });
    if (!res.ok) {
      const e = await res.text().catch(() => '');
      return { delivered: false, dev: false, error: `${res.status} ${e.slice(0, 200)}` };
    }
    const d = await res.json().catch(() => ({})) as { id?: string };
    return { delivered: true, dev: false, id: d.id };
  } catch (e) {
    return { delivered: false, dev: false, error: String(e) };
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── şablonlar ───────────────────────────────────────────────────────────────
const shell = (heading: string, body: string, cta: { href: string; label: string }) => `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1C1B19">
    <div style="font-size:22px;font-weight:700;letter-spacing:-.02em;margin-bottom:24px">Calmie<span style="color:#2F5D50">.</span></div>
    <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
    <p style="font-size:15px;line-height:1.55;color:#5C584F;margin:0 0 24px">${body}</p>
    <a href="${cta.href}" style="display:inline-block;background:#2F5D50;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:999px">${cta.label}</a>
    <p style="font-size:12.5px;color:#8B867B;margin:24px 0 0">Bağlantı çalışmazsa şu adresi tarayıcına yapıştır:<br><span style="word-break:break-all">${cta.href}</span></p>
  </div>`;

export function verificationEmail(link: string): { subject: string; html: string } {
  return {
    subject: 'Calmie · E-posta adresini doğrula',
    html: shell('E-posta adresini doğrula', 'Hesabını etkinleştirmek ve danışan dosyalarını güvene almak için e-posta adresini doğrula. Bu bağlantı 24 saat geçerlidir.', { href: link, label: 'E-postamı doğrula' }),
  };
}
export function resetEmail(link: string): { subject: string; html: string } {
  return {
    subject: 'Calmie · Şifre sıfırlama',
    html: shell('Şifreni sıfırla', 'Şifreni sıfırlamak için aşağıdaki butona tıkla. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin. Bağlantı 1 saat geçerlidir.', { href: link, label: 'Şifremi sıfırla' }),
  };
}
