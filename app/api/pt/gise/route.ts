import { NextRequest } from 'next/server';
import { getMemberByToken, recentCheckin, createAttendance } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

// ★ PUBLIC ★ QR gişe — proxy.ts matcher'ında muaf (üyeler giriş yapmış terapist değil).
// Yalnızca yoklama ekler; yanıt sadece isim döner (PII sızdırmaz).
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const token = String(b?.token ?? '').trim();
  if (!token) return Response.json({ ok: false, error: 'Token gerekli.' }, { status: 400 });

  const member = getMemberByToken(token);
  if (!member || member.durum !== 'aktif') return Response.json({ ok: false, error: 'Geçersiz veya pasif üye.' }, { status: 404 });

  // Aynı pencerede tekrar okuma → çift kayıt yapma.
  const recent = recentCheckin(member.id, 90);
  if (recent) return Response.json({ ok: true, name: member.ad_soyad, duplicate: true });

  createAttendance({ member_id: member.id, kaynak: 'qr' });
  return Response.json({ ok: true, name: member.ad_soyad });
}
