import { getDb } from '@/lib/db';
import { ownerOr401, ownsClient, notFound } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  const db = getDb();
  const row = db
    .prepare(`SELECT anamnez_json FROM clients WHERE id = ? AND owner_id = ?`)
    .get(id, uid) as { anamnez_json: string | null } | undefined;

  return Response.json(
    row?.anamnez_json ? JSON.parse(row.anamnez_json) : {}
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  if (!ownsClient(uid, id)) return notFound();
  const patch = await req.json();
  const db = getDb();

  const cur = db
    .prepare(`SELECT anamnez_json FROM clients WHERE id = ? AND owner_id = ?`)
    .get(id, uid) as { anamnez_json: string | null } | undefined;

  const merged = {
    ...(cur?.anamnez_json ? JSON.parse(cur.anamnez_json) : {}),
    ...patch,
  };

  db.prepare(
    `UPDATE clients
     SET anamnez_json = ?, anamnez_updated_at = datetime('now')
     WHERE id = ? AND owner_id = ?`
  ).run(JSON.stringify(merged), id, uid);

  return Response.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  if (!ownsClient(uid, id)) return notFound();
  getDb()
    .prepare(`UPDATE clients SET anamnez_json = NULL WHERE id = ? AND owner_id = ?`)
    .run(id, uid);

  return Response.json({ ok: true });
}
