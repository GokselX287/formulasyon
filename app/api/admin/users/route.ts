import { NextRequest, NextResponse } from 'next/server';
import { isAuthed } from '@/lib/admin-auth';
import { listUsers, createUser, overview, netPrice, logAudit } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 });
  const users = listUsers().map((u) => ({ ...u, net_price: netPrice(u) }));
  return NextResponse.json({ users, overview: overview() });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 });
  const d = await req.json();
  if (!d?.name || !String(d.name).trim()) {
    return NextResponse.json({ ok: false, error: 'İsim gerekli.' }, { status: 400 });
  }
  const u = createUser(d);
  logAudit('user.create', u.id, { name: u.name, role: u.role });
  return NextResponse.json({ ok: true, user: { ...u, net_price: netPrice(u) } });
}
