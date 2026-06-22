import { NextRequest } from 'next/server';
import { getMember, updateMemberProfile } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

// Üye intake profili (PAR-Q, postür, sağlık, hedefler) — JSON-merge autosave (anamnez deseni).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getMember(id);
  if (!m) return Response.json({ error: 'Bulunamadı' }, { status: 404 });
  let profile = {};
  try { profile = m.profile_json ? JSON.parse(m.profile_json) : {}; } catch { profile = {}; }
  return Response.json(profile);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  updateMemberProfile(id, await req.json().catch(() => ({})));
  return Response.json({ ok: true });
}
