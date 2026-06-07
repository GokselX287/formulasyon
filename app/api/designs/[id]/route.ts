import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';
import fs from 'fs';

// DELETE — dosyayı sil
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();
  const row = db.prepare('SELECT path FROM design_files WHERE id = ?').get(id) as
    { path: string } | undefined;

  if (!row) return Response.json({ error: 'Bulunamadı.' }, { status: 404 });

  // Disk dosyasını sil
  const diskPath = path.join(process.cwd(), 'public', row.path);
  if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);

  db.prepare('DELETE FROM design_files WHERE id = ?').run(id);
  return Response.json({ ok: true });
}

// PATCH — not güncelle
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { notes } = await req.json() as { notes?: string };
  getDb().prepare('UPDATE design_files SET notes = ? WHERE id = ?').run(notes ?? null, id);
  return Response.json({ ok: true });
}
