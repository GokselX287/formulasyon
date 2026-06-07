import { getAllPending, createPending } from '@/lib/queries';
import { NextRequest } from 'next/server';

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

export async function GET() {
  return Response.json(getAllPending().map(toAdminShape));
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  createPending(data);
  return Response.json({ ok: true });
}
