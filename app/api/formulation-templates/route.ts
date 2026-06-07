import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();

  // Ensure the table exists
  db.prepare(`
    CREATE TABLE IF NOT EXISTS formulation_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      modality TEXT,
      template_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const rows = db.prepare(`
    SELECT id, title, description, modality
    FROM formulation_templates
    ORDER BY created_at DESC
  `).all();

  return Response.json(rows);
}
