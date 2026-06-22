import { NextRequest } from 'next/server';
import { deleteExpense } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteExpense(id);
  return Response.json({ ok: true });
}
