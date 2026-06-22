import { NextRequest } from 'next/server';
import { salesForMonth } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const month = new URL(req.url).searchParams.get('month') || new Date().toISOString().slice(0, 7);
  return Response.json(salesForMonth(month, id));
}
