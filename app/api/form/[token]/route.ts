import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';
import { getFormulationByClient, updateScores } from '@/lib/queries';
import { scoreHexGroups, type HexGroup } from '@/lib/hexaflexScale';

type Params = { params: Promise<{ token: string }> };

// GET — public: get form metadata by token
export async function GET(_req: NextRequest, { params }: Params) {
  const db = getDb();
  const { token } = await params;

  const link = db.prepare(
    `SELECT * FROM form_linkleri WHERE token = ? AND aktif = 1`
  ).get(token) as any;

  if (!link) {
    return NextResponse.json({ error: 'Form bulunamadı veya artık aktif değil.' }, { status: 404 });
  }

  // Check if already submitted today (prevent double submit)
  const today = new Date().toISOString().split('T')[0];
  const existing = db.prepare(
    `SELECT id FROM form_yanitlari WHERE token = ? AND substr(submitted_at, 1, 10) = ?`
  ).get(token, today) as any;

  let payload: unknown = null;
  if (link.payload) { try { payload = JSON.parse(link.payload); } catch {} }

  return NextResponse.json({
    token: link.token,
    clientName: link.client_name,
    formTipi: link.form_tipi,
    olcekId: link.olcek_id,
    olcekAd: link.olcek_ad,
    payload,
    alreadySubmitted: !!existing,
  });
}

// POST — public: submit form response
export async function POST(req: NextRequest, { params }: Params) {
  const db = getDb();
  const { token } = await params;

  const link = db.prepare(
    `SELECT * FROM form_linkleri WHERE token = ? AND aktif = 1`
  ).get(token) as any;

  if (!link) {
    return NextResponse.json({ error: 'Form bulunamadı veya artık aktif değil.' }, { status: 404 });
  }

  const body = await req.json();
  const { yanitData } = body;

  if (!yanitData) {
    return NextResponse.json({ error: 'yanitData zorunlu' }, { status: 400 });
  }

  const id = randomUUID();
  db.prepare(`
    INSERT INTO form_yanitlari (id, token, client_id, form_tipi, olcek_id, yanit_data)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    token,
    link.client_id,
    link.form_tipi,
    link.olcek_id ?? null,
    typeof yanitData === 'string' ? yanitData : JSON.stringify(yanitData),
  );

  // ── Hexaflex esneklik anketi → skorları flexibility_scores'a yaz (radar güncellenir) ──
  if (link.form_tipi === 'esneklik') {
    try {
      const data = typeof yanitData === 'string' ? JSON.parse(yanitData) : yanitData;
      const answers: Record<string, number> = data?.answers ?? {};
      const scale: HexGroup[] = link.payload ? JSON.parse(link.payload) : [];
      const scores = scoreHexGroups(scale, answers);
      const fml = getFormulationByClient(parseInt(String(link.client_id), 10));
      if (fml && Object.keys(scores).length) updateScores(fml.id, scores);
    } catch { /* skor yazılamadıysa yanıt yine de kaydedildi */ }
  }

  return NextResponse.json({ ok: true, id });
}
