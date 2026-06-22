import { getAllClients, createClient } from '@/lib/queries';
import { ownerOr401 } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

function toAdminShape(c: ReturnType<typeof getAllClients>[number]) {
  return {
    id: String(c.id),
    adSoyad: c.alias,
    alias: c.alias,
    yas: c.age != null ? String(c.age) : undefined,
    cinsiyet: c.gender,
    telefon: c.telefon,
    email: c.email,
    basvuruTarihi: c.created_at,
    sunumSorunu: c.sunum_sorunu,
    hedefler: c.hedefler,
    seansUcreti: c.seans_ucreti != null ? Number(c.seans_ucreti) : undefined,
    takipSikligi: (c as any).takip_sikligi ?? undefined,
    kisilikTipi: (c as any).kisilik_tipi ?? undefined,
    status: (c.status as 'intake' | 'active' | 'archived') ?? 'intake',
    exitReason: (c.exit_reason as 'completed' | 'dropout' | 'financial' | null) ?? undefined,
    createdAt: c.created_at,
  };
}

export async function GET(request: NextRequest) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const clients = getAllClients(uid);
  return Response.json(clients.map(toAdminShape));
}

export async function POST(request: NextRequest) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const data = await request.json();
  const id = createClient(data, uid);
  const { getClient } = await import('@/lib/queries');
  const client = getClient(id, uid);
  return Response.json(client ? toAdminShape(client as any) : { id: String(id) });
}
