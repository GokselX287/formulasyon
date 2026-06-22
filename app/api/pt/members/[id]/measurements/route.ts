import { NextRequest } from 'next/server';
import { listMeasurements, upsertMeasurement } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

// Aylık ölçümler — member+ay anahtarlı upsert (mezura + makine).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(listMeasurements(id));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const ay = b?.ay || new Date().toISOString().slice(0, 7);
  return Response.json({ ok: true, measurement: upsertMeasurement(id, ay, { mezura: b?.mezura, makine: b?.makine, notlar: b?.notlar }) });
}
