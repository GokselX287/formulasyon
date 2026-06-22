import { NextRequest } from 'next/server';
import { updatePackage, deletePackage } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  updatePackage(id, await req.json().catch(() => ({})));
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deletePackage(id);
  return Response.json({ ok: true });
}
