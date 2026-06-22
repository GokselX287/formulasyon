import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ownerOr401 } from '@/lib/tenant';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  const db = getDb();
  const b = await req.json();
  db.prepare(`UPDATE randevu SET done=?, not_text=?, saat=?, sure=?, tarih=? WHERE id=? AND owner_id=?`).run(
    b.done ? 1 : 0, b.not ?? null, b.saat ?? null, b.sure ?? null, b.tarih ?? null, id, uid
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM randevu WHERE id=? AND owner_id=?').run(id, uid);
  return NextResponse.json({ ok: true });
}
