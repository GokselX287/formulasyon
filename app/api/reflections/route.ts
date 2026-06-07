import { getDb } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const type  = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);

  const rows = type
    ? (db
        .prepare('SELECT * FROM reflections WHERE type = ? ORDER BY created_at DESC, id DESC LIMIT ?')
        .all(type, limit) as Record<string, unknown>[])
    : (db
        .prepare('SELECT * FROM reflections ORDER BY created_at DESC, id DESC LIMIT ?')
        .all(limit) as Record<string, unknown>[]);

  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const db   = getDb();
  const body = await req.json();

  const result = db
    .prepare(
      `INSERT INTO reflections (therapist_id, type, emotion, body, accent_word, meta, emotions, score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      body.therapist_id ?? null,
      body.type ?? 'daily',
      body.emotion ?? null,
      body.text ?? body.body ?? '',
      body.accent_word ?? null,
      body.meta ?? null,
      body.emotions ? JSON.stringify(body.emotions) : null,
      body.score != null && body.score !== '' ? Number(body.score) : null,
    );

  return Response.json({ id: result.lastInsertRowid });
}
