import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const b = await req.json();
  db.prepare(`UPDATE randevu SET done=?, not_text=?, saat=?, sure=?, tarih=? WHERE id=?`).run(
    b.done ? 1 : 0, b.not ?? null, b.saat ?? null, b.sure ?? null, b.tarih ?? null, id
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM randevu WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}
