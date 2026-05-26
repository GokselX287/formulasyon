import { getDb } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { notes } = await request.json();
  getDb().prepare(`UPDATE interventions SET personal_notes = ? WHERE id = ?`).run(notes ?? null, Number(id));
  return Response.json({ ok: true });
}
