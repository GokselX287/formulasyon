import { NextRequest, NextResponse } from 'next/server';
import { isAuthed } from '@/lib/admin-auth';
import { getUser, updateUser, deleteUser, netPrice, logAudit } from '@/lib/admin';

export const dynamic = 'force-dynamic';
type P = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: P) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 });
  const { id } = await params;
  const before = getUser(id);
  if (!before) return NextResponse.json({ ok: false, error: 'Kullanıcı bulunamadı.' }, { status: 404 });
  const patch = await req.json();
  const u = updateUser(id, patch)!;
  const priceChanged = ['base_price', 'discount_pct', 'price_adjust'].some((k) => k in patch);
  if (priceChanged) {
    logAudit('price.change', id, {
      before: { base_price: before.base_price, discount_pct: before.discount_pct, price_adjust: before.price_adjust, net: netPrice(before) },
      after: { base_price: u.base_price, discount_pct: u.discount_pct, price_adjust: u.price_adjust, net: netPrice(u) },
    });
  } else {
    logAudit('user.update', id, Object.keys(patch));
  }
  return NextResponse.json({ ok: true, user: { ...u, net_price: netPrice(u) } });
}

export async function DELETE(req: NextRequest, { params }: P) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 });
  const { id } = await params;
  const u = getUser(id);
  deleteUser(id);
  logAudit('user.delete', id, { name: u?.name });
  return NextResponse.json({ ok: true });
}
