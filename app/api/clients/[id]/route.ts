import { updateClient, deleteClient } from '@/lib/queries';
import { getDb } from '@/lib/db';
import { ownerOr401 } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  const db = getDb();
  const clientId = parseInt(id);
  const row = db
    .prepare(`SELECT * FROM clients WHERE id = ? AND owner_id = ?`)
    .get(clientId, uid) as Record<string, unknown> | undefined;

  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });

  // En yakın gelecek seans (varsa) → "YYYY.MM.DD · HH:MM"
  const nextRow = db
    .prepare(
      `SELECT tarih FROM seanslar
       WHERE client_id = ? AND owner_id = ? AND tarih >= datetime('now')
       ORDER BY tarih ASC LIMIT 1`
    )
    .get(clientId, uid) as { tarih: string } | undefined;
  let nextSession: string | null = null;
  if (nextRow?.tarih) {
    const d = nextRow.tarih.slice(0, 10).replace(/-/g, '.');
    const t = nextRow.tarih.slice(11, 16);
    nextSession = t ? `${d} · ${t}` : d;
  }

  return Response.json({
    id: String(row.id),
    adSoyad: row.alias,
    name: row.alias,
    yas: row.age != null ? Number(row.age) : undefined,
    age: row.age != null ? Number(row.age) : undefined,
    cinsiyet: row.gender,
    meslek: row.occupation,
    occupation: row.occupation,
    medeniDurum: row.marital_status,
    telefon: row.telefon,
    email: row.email,
    sunumSorunu: row.sunum_sorunu,
    issue: row.sunum_sorunu,
    hedefler: row.hedefler,
    seansUcreti: row.seans_ucreti != null ? Number(row.seans_ucreti) : undefined,
    takipSikligi: row.takip_sikligi ?? undefined,
    kisilikTipi: row.kisilik_tipi ?? undefined,
    sinif: row.sinif,
    okul: row.okul,
    status: row.status ?? 'intake',
    referral: row.referral_source ?? null,
    nextSession,
    createdAt: row.created_at,
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  const data = await request.json();
  updateClient(parseInt(id), data, uid);
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  deleteClient(parseInt(id), uid);
  return Response.json({ ok: true });
}
