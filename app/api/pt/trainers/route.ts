import { NextRequest } from 'next/server';
import { listTrainers, createTrainer } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(listTrainers());
}

export async function POST(req: NextRequest) {
  const d = await req.json().catch(() => ({}));
  if (!d?.ad_soyad) return Response.json({ ok: false, error: 'ad_soyad gerekli.' }, { status: 400 });
  return Response.json({ ok: true, trainer: createTrainer(d) });
}
