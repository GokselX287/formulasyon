import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { ownerOr401 } from '@/lib/tenant';

// GET /api/mindmap?patientId=xxx
export async function GET(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const patientId = req.nextUrl.searchParams.get('patientId');
  if (!patientId) return Response.json([]);
  const rows = getDb().prepare('SELECT * FROM mindmap_nodes WHERE patient_id = ? AND owner_id = ? ORDER BY created_at').all(patientId, uid);
  return Response.json(rows);
}

// POST /api/mindmap
export async function POST(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const { patientId, parentProcess, label, content } = await req.json() as {
    patientId: string;
    parentProcess: string;
    label: string;
    content?: string;
  };
  const id = randomUUID();
  getDb()
    .prepare('INSERT INTO mindmap_nodes (id, patient_id, parent_process, label, content, owner_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, patientId, parentProcess, label, content ?? '', uid);
  return Response.json({ id });
}

// DELETE /api/mindmap?id=xxx
export async function DELETE(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return Response.json({ ok: false });
  getDb().prepare('DELETE FROM mindmap_nodes WHERE id = ? AND owner_id = ?').run(id, uid);
  return Response.json({ ok: true });
}
