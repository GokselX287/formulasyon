import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ownerOr401, ownsClient, notFound } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  const db = getDb();
  if (patientId) {
    const row = db.prepare('SELECT * FROM brief_notu WHERE patient_id=? AND owner_id=?').get(patientId, uid) as Record<string, any> | undefined;
    return NextResponse.json({ not: row?.not_text ?? '', guncelleme: row?.guncelleme ?? null });
  }
  const rows = db.prepare('SELECT * FROM brief_notu WHERE owner_id=?').all(uid) as Record<string, any>[];
  return NextResponse.json(rows.map(r => ({ patientId: r.patient_id, not: r.not_text, guncelleme: r.guncelleme })));
}

export async function POST(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const b = await req.json();
  if (!ownsClient(uid, b.patientId)) return notFound();
  db.prepare(`INSERT OR REPLACE INTO brief_notu (patient_id, owner_id, not_text, guncelleme) VALUES (?,?,?,datetime('now'))`).run(
    b.patientId, uid, b.not ?? ''
  );
  return NextResponse.json({ ok: true });
}
