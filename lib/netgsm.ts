// ─── Netgsm SMS — doğrudan REST v2 gönderimi ──────────────────────────────────
// POST https://api.netgsm.com.tr/sms/rest/v2/send  (Basic auth: usercode:password)
// Body: { msgheader, encoding:'TR', messages:[{ msg, no }] }  → Yanıt: { code, jobid, description }
// Randevu hatırlatmaları "bilgilendirme" mesajıdır; msgheader (gönderici adı) Netgsm'de
// bilgilendirme tipinde onaylı olmalıdır (aksi halde kod 40 döner).

export type NetgsmResult = { ok: boolean; code?: string; jobid?: string; error?: string };

// Netgsm yanıt kodları → okunur Türkçe açıklama
const NETGSM_CODES: Record<string, string> = {
  '00': 'Görev oluşturuldu',
  '01': 'Görev oluşturuldu (bazı numaralar hatalı olabilir)',
  '02': 'Görev oluşturuldu',
  '20': 'Mesaj metni hatası veya karakter sınırı aşıldı',
  '30': 'Geçersiz kullanıcı kodu/şifre, ya da API erişim izni yok (IP kısıtı olabilir)',
  '40': 'Mesaj başlığı (gönderici adı) sistemde onaylı değil',
  '50': 'İYS kontrollü gönderim — aboneliğiniz İYS’li değil',
  '51': 'İYS marka bilgisi bulunamadı',
  '70': 'Hatalı veya eksik parametre',
  '80': 'Gönderim sınır aşımı',
  '85': 'Mükerrer gönderim sınırı (aynı numaraya çok sık)',
};

/** Telefonu Netgsm'in beklediği 10 haneli (5XXXXXXXXX) biçime indirir. */
export function normalizePhoneTR(raw: string): string {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('90')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return d;
}

export async function sendNetgsmSms(opts: {
  usercode: string;
  password: string;
  header: string;
  to: string;
  message: string;
}): Promise<NetgsmResult> {
  const { usercode, password, header } = opts;
  if (!usercode || !password || !header) {
    return { ok: false, error: 'Netgsm bilgileri eksik (kullanıcı kodu / API şifresi / başlık)' };
  }
  const no = normalizePhoneTR(opts.to);
  if (no.length !== 10) {
    return { ok: false, error: `Geçersiz telefon numarası: "${opts.to}"` };
  }
  if (!opts.message?.trim()) {
    return { ok: false, error: 'Mesaj metni boş' };
  }

  const auth = Buffer.from(`${usercode}:${password}`).toString('base64');
  try {
    const r = await fetch('https://api.netgsm.com.tr/sms/rest/v2/send', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msgheader: header,
        encoding: 'TR',
        messages: [{ msg: opts.message, no }],
      }),
      cache: 'no-store',
    });
    const text = await r.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { /* JSON değilse text'i ham hata olarak kullan */ }

    const code = String(data?.code ?? '');
    const jobid = data?.jobid ?? data?.jobID ?? undefined;
    // 00/01/02 → görev kabul edildi
    if (code === '00' || code === '01' || code === '02') {
      return { ok: true, code, jobid: jobid ? String(jobid) : undefined };
    }
    const reason = NETGSM_CODES[code] || data?.description || text?.slice(0, 200) || `HTTP ${r.status}`;
    return { ok: false, code: code || undefined, error: reason };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Ağ hatası' };
  }
}
