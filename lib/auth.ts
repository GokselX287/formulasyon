import { getDb } from './db';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSessionUid, SESSION_COOKIE } from './session';

// ──────────────────────────────────────────────────────────────────────────
// Çok-kullanıcılı kimlik (Faz 1). HESAP tablosu = app_users (db v34). Şifre
// scrypt ile "salt:hash" formatında saklanır (eski tek-kullanıcı formatıyla
// AYNI → taşınan sahibin şifresi geçerli kalır). OAuth bağları user_identities,
// doğrulama/sıfırlama jetonları auth_tokens. Oturum imzası lib/session.ts'te
// (DB'siz, ENV sırrı) ve artık uid taşır; proxy.ts yalnız geçerliliği kontrol eder.
// ──────────────────────────────────────────────────────────────────────────

export {
  SESSION_COOKIE, SESSION_MAX_AGE, SESSION_MAX_AGE_REMEMBER,
  signSession, verifySessionToken, getSessionUid,
} from './session';

export type AppUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  plan: string;
  title: string | null;
  avatar_url: string | null;
  email_verified: number;
  password_hash: string | null;
  created_via: string | null;
  last_login_at: string | null;
  created_at: string;
};

export type SafeUser = Omit<AppUser, 'password_hash'>;
export function toSafe(u: AppUser): SafeUser {
  const { password_hash, ...rest } = u;
  void password_hash;
  return rest;
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;
export const isValidEmail = (e: string): boolean => EMAIL_RE.test(e);
const norm = (e: string): string => e.trim().toLowerCase();

// ── şifre hash ───────────────────────────────────────────────────────────
function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(pw: string, stored: string | null): boolean {
  if (!pw || !stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const test = scryptSync(pw, salt, 64);
  const ref = Buffer.from(hash, 'hex');
  return test.length === ref.length && timingSafeEqual(test, ref);
}

// ── kullanıcı sorguları ────────────────────────────────────────────────────
export function getUserById(id: string): AppUser | null {
  return (getDb().prepare('SELECT * FROM app_users WHERE id = ?').get(id) as AppUser | undefined) ?? null;
}
export function findUserByEmail(email: string): AppUser | null {
  if (!email) return null;
  return (getDb().prepare('SELECT * FROM app_users WHERE lower(email) = ?').get(norm(email)) as AppUser | undefined) ?? null;
}
export function emailExists(email: string): boolean {
  return !!findUserByEmail(email);
}
export function hasAnyUser(): boolean {
  const r = getDb().prepare('SELECT COUNT(*) AS n FROM app_users').get() as { n: number };
  return r.n > 0;
}

// ── hesap oluştur ──────────────────────────────────────────────────────────
export function createAccount(input: {
  email: string;
  name: string;
  password?: string;            // OAuth kayıtlarında olmayabilir
  title?: string;
  via?: string;                 // email | google | microsoft
  emailVerified?: boolean;
  avatarUrl?: string;
}): AppUser {
  const email = norm(input.email);
  if (!isValidEmail(email)) throw new Error('Geçerli bir e-posta gerekli.');
  if (emailExists(email)) throw new Error('Bu e-posta ile bir hesap zaten var.');
  const id = randomUUID();
  getDb().prepare(
    `INSERT INTO app_users (id, name, email, role, status, plan, password_hash, email_verified, created_via, title, avatar_url)
     VALUES (@id, @name, @email, 'terapist', 'aktif', 'deneme', @password_hash, @email_verified, @via, @title, @avatar_url)`
  ).run({
    id,
    name: (input.name || '').trim() || 'Terapist',
    email,
    password_hash: input.password ? hashPassword(input.password) : null,
    email_verified: input.emailVerified ? 1 : 0,
    via: input.via ?? 'email',
    title: input.title?.trim() || null,
    avatar_url: input.avatarUrl || null,
  });
  return getUserById(id)!;
}

// E-posta + şifre doğrulaması → kullanıcı veya null.
export function verifyLogin(email: string, pw: string): AppUser | null {
  const u = findUserByEmail(email);
  if (!u || !verifyPassword(pw, u.password_hash)) return null;
  return u;
}

export function setUserPassword(userId: string, pw: string): void {
  getDb().prepare('UPDATE app_users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(hashPassword(pw), userId);
}
export function markEmailVerified(userId: string): void {
  getDb().prepare('UPDATE app_users SET email_verified = 1, updated_at = datetime(\'now\') WHERE id = ?').run(userId);
}
export function recordLogin(userId: string): void {
  getDb().prepare('UPDATE app_users SET last_login_at = datetime(\'now\') WHERE id = ?').run(userId);
}

// ── OAuth bağları ──────────────────────────────────────────────────────────
export function findUserByIdentity(provider: string, providerUid: string): AppUser | null {
  const row = getDb().prepare(
    'SELECT user_id FROM user_identities WHERE provider = ? AND provider_uid = ?'
  ).get(provider, providerUid) as { user_id: string } | undefined;
  return row ? getUserById(row.user_id) : null;
}
export function linkIdentity(userId: string, provider: string, providerUid: string, email?: string): void {
  getDb().prepare(
    `INSERT OR IGNORE INTO user_identities (id, user_id, provider, provider_uid, email)
     VALUES (?, ?, ?, ?, ?)`
  ).run(randomUUID(), userId, provider, providerUid, email ?? null);
}

// OAuth giriş: kimlik bağlıysa o kullanıcı; değilse e-posta eşleşen kullanıcıya
// bağla; o da yoksa yeni hesap aç (e-posta doğrulanmış sayılır — sağlayıcı doğrular).
export function findOrCreateOAuthUser(p: {
  provider: string; providerUid: string; email?: string; name?: string; avatar?: string;
}): AppUser {
  const existing = findUserByIdentity(p.provider, p.providerUid);
  if (existing) { recordLogin(existing.id); return existing; }

  let user = p.email ? findUserByEmail(p.email) : null;
  if (!user) {
    user = createAccount({
      email: p.email || `${p.provider}_${p.providerUid}@oauth.local`,
      name: p.name || 'Terapist',
      via: p.provider,
      emailVerified: !!p.email,
      avatarUrl: p.avatar,
    });
  }
  linkIdentity(user.id, p.provider, p.providerUid, p.email);
  recordLogin(user.id);
  return user;
}

// ── e-posta doğrulama / şifre sıfırlama jetonları ───────────────────────────
const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

// Ham jeton döndürür (yalnız bir kez görünür); DB'de sha256'sı saklanır.
export function createAuthToken(userId: string, kind: 'verify' | 'reset', ttlSeconds: number): string {
  const raw = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  // Aynı türden eski/kullanılmamış jetonları geçersiz kıl (tek aktif jeton).
  getDb().prepare('DELETE FROM auth_tokens WHERE user_id = ? AND kind = ? AND used_at IS NULL').run(userId, kind);
  getDb().prepare(
    'INSERT INTO auth_tokens (id, user_id, kind, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(randomUUID(), userId, kind, sha256(raw), expires);
  return raw;
}

// Geçerliyse user_id döndürür ve jetonu tüketir (used_at); değilse null.
export function consumeAuthToken(raw: string, kind: 'verify' | 'reset'): string | null {
  if (!raw) return null;
  const row = getDb().prepare(
    `SELECT id, user_id FROM auth_tokens
     WHERE token_hash = ? AND kind = ? AND used_at IS NULL AND expires_at > datetime('now')`
  ).get(sha256(raw), kind) as { id: string; user_id: string } | undefined;
  if (!row) return null;
  getDb().prepare('UPDATE auth_tokens SET used_at = datetime(\'now\') WHERE id = ?').run(row.id);
  return row.user_id;
}

// ── oturumdan kullanıcı çözme ───────────────────────────────────────────────
export function currentUserId(req: NextRequest): string | null {
  return getSessionUid(req.cookies.get(SESSION_COOKIE)?.value);
}
export function currentUser(req: NextRequest): AppUser | null {
  const id = currentUserId(req);
  return id ? getUserById(id) : null;
}
export function isAuthed(req: NextRequest): boolean {
  return !!currentUserId(req);
}
// Route handler'larda ikinci kat savunma: kullanıcı yoksa 401, varsa null.
export function requireAuth(req: NextRequest): NextResponse | null {
  if (isAuthed(req)) return null;
  return NextResponse.json({ ok: false, error: 'Yetkisiz.' }, { status: 401 });
}
