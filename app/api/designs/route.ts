import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ownerOr401 } from '@/lib/tenant';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'designs');
const ALLOWED_MIME = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'image/heic', 'image/heif',
]);
const MAX_SIZE = 30 * 1024 * 1024; // 30 MB

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// GET — tüm tasarım dosyalarını listele
export async function GET(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM design_files WHERE owner_id = ? ORDER BY created_at DESC'
  ).all(uid);
  return Response.json(rows);
}

// POST — dosya yükle
export async function POST(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  ensureDir();

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const notes = formData.get('notes') as string | null;

  if (!file) return Response.json({ error: 'Dosya eksik.' }, { status: 400 });
  if (!ALLOWED_MIME.has(file.type)) {
    return Response.json(
      { error: `Desteklenmeyen format: ${file.type}. PNG, JPG, PDF, SVG, GIF, WEBP kabul edilir.` },
      { status: 415 },
    );
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'Dosya 30 MB sınırını aşıyor.' }, { status: 413 });
  }

  const id  = randomUUID();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const fileName = `${id}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const publicPath = `/uploads/designs/${fileName}`;
  const now = new Date().toISOString();

  getDb().prepare(`
    INSERT INTO design_files (id, name, original_name, mime_type, size_bytes, source, path, notes, created_at, owner_id)
    VALUES (?, ?, ?, ?, ?, 'upload', ?, ?, ?, ?)
  `).run(id, file.name, file.name, file.type, file.size, publicPath, notes ?? null, now, uid);

  return Response.json({ ok: true, id, path: publicPath });
}
