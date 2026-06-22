import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ownerOr401 } from '@/lib/tenant';

// GET — list form responses for a client (or all recent if no clientId)
export async function GET(req: NextRequest) {
  const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
  const db = getDb();
  const clientId = req.nextUrl.searchParams.get('clientId');

  if (clientId) {
    const rows = db.prepare(
      `SELECT fy.*, fl.olcek_ad, fl.form_tipi as link_form_tipi
       FROM form_yanitlari fy
       LEFT JOIN form_linkleri fl ON fl.token = fy.token AND fl.owner_id = ?
       WHERE fy.client_id = ?
         AND fy.owner_id = ?
       ORDER BY fy.submitted_at ASC`
    ).all(uid, clientId, uid) as any[];
    return NextResponse.json(rows);
  }

  // Tüm yanıtlar — son 14 gün
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const sinceStr = since.toISOString().slice(0, 10);
  const rows = db.prepare(
    `SELECT fy.id, fy.token, fy.client_id, fy.form_tipi, fy.olcek_id, fy.submitted_at,
            fl.olcek_ad
     FROM form_yanitlari fy
     LEFT JOIN form_linkleri fl ON fl.token = fy.token AND fl.owner_id = ?
     WHERE substr(fy.submitted_at, 1, 10) >= ?
       AND fy.owner_id = ?
     ORDER BY fy.submitted_at DESC`
  ).all(uid, sinceStr, uid) as any[];
  return NextResponse.json(rows);
}
