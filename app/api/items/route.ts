import { addItem, deleteItem } from '@/lib/queries';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { formulation_id, category, content } = await request.json();
  const id = addItem(formulation_id, category, content);
  return Response.json({ id });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get('id') ?? '0');
  deleteItem(id);
  return Response.json({ ok: true });
}
