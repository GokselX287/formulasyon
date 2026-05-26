import { getDb } from '@/lib/db';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const row = db.prepare(`SELECT favorite FROM interventions WHERE id = ?`).get(Number(id)) as { favorite: number } | undefined;
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
  const newVal = row.favorite ? 0 : 1;
  db.prepare(`UPDATE interventions SET favorite = ? WHERE id = ?`).run(newVal, Number(id));
  return Response.json({ ok: true, favorite: Boolean(newVal) });
}
