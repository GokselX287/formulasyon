import { NextRequest, NextResponse } from 'next/server';
import { isAuthed } from '@/lib/admin-auth';
import { listShares, createShare, deleteShare, getUser, logAudit } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 });
  return NextResponse.json({ shares: listShares() });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 });
  const d = await req.json();
  if (!d?.from_user_id || !d?.to_user_id) {
    return NextResponse.json({ ok: false, error: 'Paylaşan ve paylaşılan seçilmeli.' }, { status: 400 });
  }
  if (d.from_user_id === d.to_user_id) {
    return NextResponse.json({ ok: false, error: 'Kullanıcı kendisiyle paylaşamaz.' }, { status: 400 });
  }
  const s = createShare(d);
  logAudit('share.create', s.id, { from: getUser(d.from_user_id)?.name, to: getUser(d.to_user_id)?.name, permission: s.permission, scope: s.scope });
  return NextResponse.json({ ok: true, share: s });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id gerekli' }, { status: 400 });
  deleteShare(id);
  logAudit('share.delete', id);
  return NextResponse.json({ ok: true });
}
