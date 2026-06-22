import { NextRequest } from 'next/server';
import { listCollections, createCollection } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const overdue = new URL(req.url).searchParams.get('overdue') === '1';
  return Response.json(listCollections(overdue));
}

export async function POST(req: NextRequest) {
  const d = await req.json().catch(() => ({}));
  if (!d?.member_id || !d?.soz_tarihi) return Response.json({ ok: false, error: 'member_id ve soz_tarihi gerekli.' }, { status: 400 });
  return Response.json({ ok: true, collection: createCollection(d) });
}
