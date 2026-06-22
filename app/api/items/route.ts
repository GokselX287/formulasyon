import { addItem, deleteItem } from '@/lib/queries';
import { ownerOr401, ownsFormulation, notFound } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const { formulation_id, category, content } = await request.json();
  if (!ownsFormulation(uid, formulation_id)) return notFound();
  const id = addItem(formulation_id, category, content, uid);
  return Response.json({ id });
}

export async function DELETE(request: NextRequest) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get('id') ?? '0');
  deleteItem(id, uid);
  return Response.json({ ok: true });
}
