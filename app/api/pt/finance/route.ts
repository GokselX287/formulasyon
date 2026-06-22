import { NextRequest } from 'next/server';
import { financeForMonth, salesForMonth } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const month = new URL(req.url).searchParams.get('month') || new Date().toISOString().slice(0, 7);
  return Response.json({ ...financeForMonth(month), sales: salesForMonth(month) });
}
