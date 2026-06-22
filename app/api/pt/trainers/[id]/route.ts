import { NextRequest } from 'next/server';
import { getTrainer, updateTrainer, deleteTrainer } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = getTrainer(id);
  return t ? Response.json(t) : Response.json({ error: 'Bulunamadı' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  updateTrainer(id, await req.json().catch(() => ({})));
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteTrainer(id);
  return Response.json({ ok: true });
}
