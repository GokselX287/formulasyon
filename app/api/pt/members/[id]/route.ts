import { NextRequest } from 'next/server';
import { getMember, updateMember, deleteMember } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getMember(id);
  return m ? Response.json(m) : Response.json({ error: 'Bulunamadı' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  updateMember(id, await req.json().catch(() => ({})));
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteMember(id);
  return Response.json({ ok: true });
}
