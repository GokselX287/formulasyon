import { NextRequest, NextResponse } from 'next/server';
import { isAuthed } from '@/lib/admin-auth';
import { listAudit } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 });
  const limit = Math.min(200, Math.max(1, Number(new URL(req.url).searchParams.get('limit')) || 60));
  return NextResponse.json({ audit: listAudit(limit) });
}
