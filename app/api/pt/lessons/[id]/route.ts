import { NextRequest } from 'next/server';
import { updateLesson, deleteLesson } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  updateLesson(id, await req.json().catch(() => ({})));
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteLesson(id);
  return Response.json({ ok: true });
}
