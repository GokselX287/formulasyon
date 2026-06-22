import { updatePending, deletePending } from '@/lib/queries';
import { ownerOr401 } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  const data = await request.json();
  updatePending(id, data, uid);
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  deletePending(id, uid);
  return Response.json({ ok: true });
}
