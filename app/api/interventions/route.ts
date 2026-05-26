import { getDb } from '@/lib/db';
import { NextRequest } from 'next/server';

type DbRow = Record<string, unknown>;

function parseRow(r: DbRow) {
  const tryJ = (v: unknown) => {
    if (!v) return [];
    try { return JSON.parse(v as string); } catch { return []; }
  };
  return {
    id: String(r.id),
    title: r.title,
    modality: r.modality,
    problems: tryJ(r.problems),
    ageGroups: tryJ(r.age_groups),
    format: r.format,
    duration: r.duration,
    durationMinutes: r.duration_minutes != null ? Number(r.duration_minutes) : undefined,
    evidence: r.evidence,
    description: r.description,
    protocol: tryJ(r.protocol),
    materials: tryJ(r.materials),
    contraindications: tryJ(r.contraindications),
    variants: tryJ(r.variants),
    references: tryJ(r.references_json),
    homeworkVariant: r.homework_variant ?? undefined,
    personalNotes: r.personal_notes ?? undefined,
    favorite: Boolean(r.favorite),
    useCount: Number(r.use_count ?? 0),
  };
}

export async function GET() {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM interventions ORDER BY use_count DESC, id ASC`).all() as DbRow[];
  return Response.json(rows.map(parseRow));
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const db = getDb();
  const J = (v: unknown) => v != null ? JSON.stringify(v) : null;
  const result = db.prepare(`
    INSERT INTO interventions
      (title, modality, problems, age_groups, format, duration, duration_minutes,
       evidence, description, protocol, materials, contraindications, variants,
       references_json, homework_variant, personal_notes, favorite, use_count)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    data.title, data.modality,
    J(data.problems), J(data.ageGroups),
    data.format, data.duration,
    data.durationMinutes ?? null,
    data.evidence, data.description,
    J(data.protocol), J(data.materials), J(data.contraindications),
    J(data.variants), J(data.references),
    data.homeworkVariant ?? null,
    data.personalNotes ?? null,
    data.favorite ? 1 : 0,
    data.useCount ?? 0,
  );
  const row = db.prepare(`SELECT * FROM interventions WHERE id = ?`).get(result.lastInsertRowid) as DbRow;
  return Response.json(parseRow(row), { status: 201 });
}
