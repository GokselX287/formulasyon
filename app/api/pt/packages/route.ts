import { NextRequest } from 'next/server';
import { listPackages, createPackage } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const memberId = new URL(req.url).searchParams.get('memberId');
  if (!memberId) return Response.json({ ok: false, error: 'memberId gerekli.' }, { status: 400 });
  return Response.json(listPackages(memberId));
}

export async function POST(req: NextRequest) {
  const d = await req.json().catch(() => ({}));
  if (!d?.member_id || d?.tutar == null) return Response.json({ ok: false, error: 'member_id ve tutar gerekli.' }, { status: 400 });
  return Response.json({ ok: true, package: createPackage(d) });
}
