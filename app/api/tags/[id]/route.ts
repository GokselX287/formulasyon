import { deleteTag } from '@/lib/queries';
import { NextRequest } from 'next/server';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteTag(id);
  return Response.json({ ok: true });
}
