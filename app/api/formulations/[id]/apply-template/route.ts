import { getDb } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { templateId } = await req.json();
  const db = getDb();

  const tpl = db.prepare(
    `SELECT template_json FROM formulation_templates WHERE id = ?`
  ).get(templateId) as { template_json: string } | undefined;

  if (!tpl) {
    return Response.json({ error: 'Template not found' }, { status: 404 });
  }

  let data: { items?: Record<string, string[]> };
  try {
    data = JSON.parse(tpl.template_json);
  } catch {
    return Response.json({ error: 'Invalid template JSON' }, { status: 400 });
  }

  // Write only to empty fields — never overwrite existing data
  for (const [category, labels] of Object.entries(data.items ?? {})) {
    for (const label of labels as string[]) {
      db.prepare(`
        INSERT INTO items (formulation_id, category, label)
        SELECT ?, ?, ?
        WHERE NOT EXISTS (
          SELECT 1 FROM items WHERE formulation_id = ? AND category = ? AND label = ?
        )
      `).run(id, category, label, id, category, label);
    }
  }

  return Response.json({ ok: true });
}
