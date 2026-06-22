import { NextRequest } from 'next/server';
import { listAttendance, createAttendance } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  return Response.json(listAttendance(sp.get('memberId') || undefined, sp.get('from') || undefined, sp.get('to') || undefined));
}

export async function POST(req: NextRequest) {
  const d = await req.json().catch(() => ({}));
  if (!d?.member_id) return Response.json({ ok: false, error: 'member_id gerekli.' }, { status: 400 });
  return Response.json({ ok: true, attendance: createAttendance({ member_id: d.member_id, kaynak: d.kaynak ?? 'manuel', lesson_id: d.lesson_id }) });
}
