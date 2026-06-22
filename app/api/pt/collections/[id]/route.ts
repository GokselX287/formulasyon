import { NextRequest } from 'next/server';
import { updateCollection, deleteCollection } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  updateCollection(id, await req.json().catch(() => ({})));
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteCollection(id);
  return Response.json({ ok: true });
}
