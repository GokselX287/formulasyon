import { createHmac, timingSafeEqual } from 'crypto';

// ──────────────────────────────────────────────────────────────────────────
// Oturum imzası — SAF kripto + ENV. DB/better-sqlite3 importu YOK; böylece
// proxy.ts (Next 16 Node runtime) bu modülü native DB paketini yüklemeden
// kullanabilir. İmza sırrı process.env.AUTH_SECRET'ten gelir.
//
// v34: token artık kullanıcı kimliği (uid) taşır — çok-kullanıcılı üyelik.
// verifySessionToken hâlâ boolean döner (proxy + admin-auth aynı kalır);
// kullanıcı kimliği gereken yerler getSessionUid ile okur. Eski (uid'siz)
// tokenlar imza+exp geçerliyse hâlâ kabul edilir (geriye dönük uyum).
// ──────────────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = 'siyi_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;          // 7 gün
export const SESSION_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; // 30 gün

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET tanımlı değil — üretimde oturum imzalanamaz. .env.local içine güçlü bir değer ekleyin: openssl rand -base64 32');
  }
  return 'dev-insecure-secret-change-me'; // yalnızca geliştirme
}

type SessionPayload = { exp: number; uid?: string };

function decode(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionPayload;
    if (typeof obj.exp !== 'number' || Date.now() >= obj.exp) return null;
    return obj;
  } catch {
    return null;
  }
}

export function signSession(uid: string, maxAge: number = SESSION_MAX_AGE): string {
  const exp = Date.now() + maxAge * 1000;
  const payload = Buffer.from(JSON.stringify({ exp, uid })).toString('base64url');
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

// Geçerlilik = imza + süre + KULLANICI KİMLİĞİ. Çok-kiracılı dönemde uid taşımayan
// (Faz 1 öncesi) eski oturumlar GEÇERSİZ sayılır → proxy /giris'e yönlendirir, kullanıcı
// yeniden girince token uid kazanır ve verisi (owner_id eşleşmesiyle) yüklenir.
export function verifySessionToken(token: string | undefined): boolean {
  const p = decode(token);
  return !!p && typeof p.uid === 'string' && p.uid.length > 0;
}

// Geçerli oturumdaki kullanıcı kimliği — yoksa null (eski uid'siz token dahil).
export function getSessionUid(token: string | undefined): string | null {
  return decode(token)?.uid ?? null;
}
