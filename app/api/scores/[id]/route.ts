import { updateScores } from '@/lib/queries';
import { ownerOr401 } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  const data = await request.json();
  updateScores(parseInt(id), data, uid);
  return Response.json({ ok: true });
}
