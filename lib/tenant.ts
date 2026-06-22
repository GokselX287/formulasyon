import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from './db';
import { currentUserId } from './auth';
import { getSessionUid, SESSION_COOKIE } from './session';

// ──────────────────────────────────────────────────────────────────────────
// Çok-kiracılı sahiplik kapısı (Faz 2). Her klinik route'un başında kullanıcı
// kimliği çözülür ve verinin o kullanıcıya ait olduğu doğrulanır. Sahip değilse
// 404 (varlığı sızdırma). Kullanım deseni:
//   const uid = ownerOr401(req); if (uid instanceof NextResponse) return uid;
//   if (!ownsClient(uid, clientId)) return notFound();
// ──────────────────────────────────────────────────────────────────────────

export { currentUserId } from './auth';

export function currentOwnerId(req: NextRequest): string | null {
  return currentUserId(req);
}

// Server Component / sayfa yükleyicileri için (req yok) — çerezden çözer.
export async function currentOwnerIdRSC(): Promise<string | null> {
  const store = await cookies();
  return getSessionUid(store.get(SESSION_COOKIE)?.value);
}

// Giriş yoksa 401 Response; varsa uid (string).
export function ownerOr401(req: NextRequest): string | NextResponse {
  const uid = currentUserId(req);
  if (!uid) return NextResponse.json({ ok: false, error: 'Yetkisiz. Giriş gerekli.' }, { status: 401 });
  return uid;
}

// Bu danışan bu kullanıcının mı? (CAST → id/parametre tip affinity tuzağını önler)
export function ownsClient(ownerId: string, clientId: string | number): boolean {
  return !!getDb()
    .prepare('SELECT 1 FROM clients WHERE CAST(id AS TEXT) = CAST(? AS TEXT) AND owner_id = ?')
    .get(String(clientId), ownerId);
}

// Bu formülasyon (→ danışanı) bu kullanıcının mı?
export function ownsFormulation(ownerId: string, formulationId: string | number): boolean {
  return !!getDb()
    .prepare('SELECT 1 FROM formulations WHERE CAST(id AS TEXT) = CAST(? AS TEXT) AND owner_id = ?')
    .get(String(formulationId), ownerId);
}

// Sahip değil / yok — varlığı sızdırmamak için 404.
export function notFound(): NextResponse {
  return NextResponse.json({ ok: false, error: 'Bulunamadı.' }, { status: 404 });
}
