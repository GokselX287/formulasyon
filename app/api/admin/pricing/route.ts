import { NextRequest, NextResponse } from 'next/server';
import { isAuthed } from '@/lib/admin-auth';
import { listUsers, updateUser, netPrice, logAudit } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// Toplu fiyat değişikliği — seçili (ya da tüm) hesaplara zam veya indirim.
//   type: 'zam' | 'indirim'   mode: 'pct' (yüzde) | 'tl' (sabit tutar)
// Temel ücret (base_price) üzerinde çalışır; her değişiklik denetime yazılır.
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 });
  const { ids, type, mode, value, note } = await req.json();
  const v = Number(value);
  if (type !== 'zam' && type !== 'indirim') return NextResponse.json({ ok: false, error: 'Geçersiz işlem türü.' }, { status: 400 });
  if (mode !== 'pct' && mode !== 'tl') return NextResponse.json({ ok: false, error: 'Geçersiz mod.' }, { status: 400 });
  if (!isFinite(v) || v <= 0) return NextResponse.json({ ok: false, error: 'Geçerli bir değer gir.' }, { status: 400 });

  let targets = listUsers();
  if (Array.isArray(ids) && ids.length) targets = targets.filter((u) => ids.includes(u.id));
  if (!targets.length) return NextResponse.json({ ok: false, error: 'Hedef kullanıcı yok.' }, { status: 400 });

  let changed = 0;
  for (const u of targets) {
    let base = u.base_price || 0;
    if (mode === 'pct') {
      const factor = type === 'zam' ? 1 + v / 100 : 1 - v / 100;
      base = Math.max(0, Math.round(base * factor));
    } else {
      base = Math.max(0, base + (type === 'zam' ? v : -v));
    }
    const before = { base_price: u.base_price, net: netPrice(u) };
    const upd = updateUser(u.id, { base_price: base })!;
    logAudit('price.change', u.id, { bulk: true, type, mode, value: v, note: note ?? null, before, after: { base_price: upd.base_price, net: netPrice(upd) } });
    changed++;
  }
  return NextResponse.json({ ok: true, changed });
}
