import { updateSms } from '@/lib/queries';
import { NextRequest } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  updateSms(id, data);
  return Response.json({ ok: true });
}
