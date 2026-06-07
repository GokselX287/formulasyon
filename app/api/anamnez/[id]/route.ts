import { getDb } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const row = db
    .prepare(`SELECT anamnez_json FROM clients WHERE id = ?`)
    .get(id) as { anamnez_json: string | null } | undefined;

  return Response.json(
    row?.anamnez_json ? JSON.parse(row.anamnez_json) : {}
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patch = await req.json();
  const db = getDb();

  const cur = db
    .prepare(`SELECT anamnez_json FROM clients WHERE id = ?`)
    .get(id) as { anamnez_json: string | null } | undefined;

  const merged = {
    ...(cur?.anamnez_json ? JSON.parse(cur.anamnez_json) : {}),
    ...patch,
  };

  db.prepare(
    `UPDATE clients
     SET anamnez_json = ?, anamnez_updated_at = datetime('now')
     WHERE id = ?`
  ).run(JSON.stringify(merged), id);

  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  getDb()
    .prepare(`UPDATE clients SET anamnez_json = NULL WHERE id = ?`)
    .run(id);

  return Response.json({ ok: true });
}
