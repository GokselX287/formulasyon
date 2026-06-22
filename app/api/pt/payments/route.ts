import { NextRequest } from 'next/server';
import { listPayments, createPayment, markPaymentSms, getMember, listCollections, updateCollection } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const memberId = new URL(req.url).searchParams.get('memberId') || undefined;
  return Response.json(listPayments(memberId));
}

// Ödeme kaydı + "kaçıncı paket" SMS'i (mevcut /api/sms hattını kullanır) + eşleşen tahsilat sözünü kapatır.
export async function POST(req: NextRequest) {
  const d = await req.json().catch(() => ({}));
  if (!d?.member_id || d?.tutar == null) return Response.json({ ok: false, error: 'member_id ve tutar gerekli.' }, { status: 400 });

  const payment = createPayment(d);
  const member = getMember(d.member_id);

  // Eşleşen bekleyen tahsilat sözünü "ödendi" yap (üye + en eski söz).
  try {
    const pending = listCollections(false)
      .filter((c) => c.member_id === d.member_id && c.durum === 'bekleyen')
      .sort((a, b) => a.soz_tarihi.localeCompare(b.soz_tarihi));
    if (pending[0]) updateCollection(pending[0].id, { durum: 'odendi', odeme_id: payment.id } as any);
  } catch { /* yok */ }

  // SMS — paket numarasıyla. Telefon varsa mevcut SMS hattına (cookie forward → auth) POST et.
  let sms: any = null;
  if (member?.telefon && payment.paket_no != null) {
    const message = `Sayın ${member.ad_soyad}, ${payment.paket_no}. paket ödemeniz (${payment.tutar} TL) alınmıştır. Teşekkür ederiz.`;
    try {
      const origin = new URL(req.url).origin;
      const r = await fetch(`${origin}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: req.headers.get('cookie') ?? '' },
        body: JSON.stringify({ phone: member.telefon, name: member.ad_soyad, message, trigger_type: 'pt_payment' }),
      });
      sms = await r.json().catch(() => ({}));
      if (sms?.ok) markPaymentSms(payment.id);
    } catch (e: any) { sms = { ok: false, error: e?.message ?? 'SMS hatası' }; }
  }

  return Response.json({ ok: true, payment, sms });
}
