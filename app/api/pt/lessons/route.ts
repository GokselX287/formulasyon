import { NextRequest } from 'next/server';
import { listLessons, createLesson } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  return Response.json(listLessons({ trainerId: sp.get('trainerId') || undefined, from: sp.get('from') || undefined, to: sp.get('to') || undefined }));
}

export async function POST(req: NextRequest) {
  const d = await req.json().catch(() => ({}));
  if (!d?.tarih || !d?.baslangic) return Response.json({ ok: false, error: 'tarih ve baslangic gerekli.' }, { status: 400 });
  return Response.json({ ok: true, lesson: createLesson(d) });
}
