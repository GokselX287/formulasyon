import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  const db = getDb();
  if (patientId) {
    const row = db.prepare('SELECT * FROM brief_notu WHERE patient_id=?').get(patientId) as Record<string, any> | undefined;
    return NextResponse.json({ not: row?.not_text ?? '', guncelleme: row?.guncelleme ?? null });
  }
  const rows = db.prepare('SELECT * FROM brief_notu').all() as Record<string, any>[];
  return NextResponse.json(rows.map(r => ({ patientId: r.patient_id, not: r.not_text, guncelleme: r.guncelleme })));
}

export async function POST(req: Request) {
  const db = getDb();
  const b = await req.json();
  db.prepare(`INSERT OR REPLACE INTO brief_notu (patient_id, not_text, guncelleme) VALUES (?,?,datetime('now'))`).run(
    b.patientId, b.not ?? ''
  );
  return NextResponse.json({ ok: true });
}
