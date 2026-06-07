import { getDb } from '@/lib/db';
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

// GET /api/mindmap?patientId=xxx
export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get('patientId');
  if (!patientId) return Response.json([]);
  const rows = getDb().prepare('SELECT * FROM mindmap_nodes WHERE patient_id = ? ORDER BY created_at').all(patientId);
  return Response.json(rows);
}

// POST /api/mindmap
export async function POST(req: NextRequest) {
  const { patientId, parentProcess, label, content } = await req.json() as {
    patientId: string;
    parentProcess: string;
    label: string;
    content?: string;
  };
  const id = randomUUID();
  getDb()
    .prepare('INSERT INTO mindmap_nodes (id, patient_id, parent_process, label, content) VALUES (?, ?, ?, ?, ?)')
    .run(id, patientId, parentProcess, label, content ?? '');
  return Response.json({ id });
}

// DELETE /api/mindmap?id=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return Response.json({ ok: false });
  getDb().prepare('DELETE FROM mindmap_nodes WHERE id = ?').run(id);
  return Response.json({ ok: true });
}
