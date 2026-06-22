import { getAllPending, createPending } from '@/lib/queries';
import { ownerOr401 } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

function toAdminShape(p: ReturnType<typeof getAllPending>[number]) {
  return {
    id: p.id,
    adSoyad: p.ad_soyad,
    randevuTarihi: p.randevu_tarihi,
    not: p.not_text,
    status: p.status as 'pending' | 'dropped',
    dropReason: p.drop_reason,
    droppedAt: p.dropped_at,
    createdAt: p.created_at,
  };
}

export async function GET(request: NextRequest) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  return Response.json(getAllPending(uid).map(toAdminShape));
}

export async function POST(request: NextRequest) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const data = await request.json();
  createPending(data, uid);
  return Response.json({ ok: true });
}
