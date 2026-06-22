import { NextRequest } from 'next/server';
import { listExpenses, createExpense } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const month = new URL(req.url).searchParams.get('month') || undefined;
  return Response.json(listExpenses(month));
}

export async function POST(req: NextRequest) {
  const d = await req.json().catch(() => ({}));
  if (d?.tutar == null) return Response.json({ ok: false, error: 'tutar gerekli.' }, { status: 400 });
  return Response.json({ ok: true, expense: createExpense(d) });
}
