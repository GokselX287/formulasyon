import { updateEvent, deleteEvent } from '@/lib/queries';
import { NextRequest } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  updateEvent(id, data);
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteEvent(id);
  return Response.json({ ok: true });
}
