import { getDb } from '@/lib/db';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const item = db.prepare(
    `SELECT id, name, mime, file_path FROM items WHERE id = ? AND category = 'attachment'`
  ).get(id) as { id: number; name: string; mime?: string; file_path?: string } | undefined;

  if (!item) {
    return new Response('Attachment not found', { status: 404 });
  }

  // If a physical file path is stored, stream it
  if (item.file_path) {
    const absPath = path.isAbsolute(item.file_path)
      ? item.file_path
      : path.join(process.cwd(), item.file_path);

    if (fs.existsSync(absPath)) {
      const buffer = fs.readFileSync(absPath);
      return new Response(buffer, {
        headers: {
          'Content-Type': item.mime ?? 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(item.name)}"`,
        },
      });
    }
  }

  // Fallback — no file on disk yet
  return new Response('File not available', { status: 404 });
}
