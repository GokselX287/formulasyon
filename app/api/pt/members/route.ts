import { NextRequest } from 'next/server';
import { listMembers, createMember } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(listMembers());
}

export async function POST(req: NextRequest) {
  const d = await req.json().catch(() => ({}));
  if (!d?.ad_soyad) return Response.json({ ok: false, error: 'ad_soyad gerekli.' }, { status: 400 });
  return Response.json({ ok: true, member: createMember(d) });
}
