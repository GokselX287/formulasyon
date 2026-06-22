import { getSetting, setSetting } from './queries';
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'crypto';
import type { NextRequest } from 'next/server';
import { verifySessionToken as verifyUserSession, SESSION_COOKIE as USER_COOKIE } from './session';

// ──────────────────────────────────────────────────────────────────────────
// Admin oturumu — sunucu tarafında doğrulanan şifre + HMAC imzalı httpOnly
// çerez. Şifre app_settings'te scrypt hash olarak saklanır (ya da ADMIN_PASSWORD
// env'inden gelir). Oturum çerezi sunucu sırrı (admin_secret) ile imzalanır;
// istemci tarafında taklit edilemez.
// ──────────────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = 'adm_session';
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 saat

function envPassword(): string {
  return process.env.ADMIN_PASSWORD || '';
}

// Admin erişimi artık terapist (ilk kullanıcı) hesabına bağlı — ayrı admin
// şifresi yok. İlk kullanıcı /giris'te profilini oluşturup giriş yapınca admindir.
export function isPasswordConfigured(): boolean {
  return true;
}

export function setPassword(pw: string): void {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pw, salt, 64).toString('hex');
  setSetting('admin_pw_hash', `${salt}:${hash}`);
}

export function verifyPassword(pw: string): boolean {
  if (!pw) return false;
  const stored = getSetting('admin_pw_hash');
  if (stored) {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const test = scryptSync(pw, salt, 64);
    const ref = Buffer.from(hash, 'hex');
    return test.length === ref.length && timingSafeEqual(test, ref);
  }
  const env = envPassword();
  if (env) {
    const a = Buffer.from(pw);
    const b = Buffer.from(env);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  return false;
}

function secret(): string {
  let s = getSetting('admin_secret');
  if (!s) {
    s = randomBytes(32).toString('hex');
    setSetting('admin_secret', s);
  }
  return s;
}

export function signSession(): string {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

// Admin yetkisi = geçerli terapist oturumu (siyi_session). Tek kullanıcı (v1)
// olduğu için giriş yapan terapist = sahip = admin. Eski adm_session kullanılmaz.
export function isAuthed(req: NextRequest): boolean {
  return verifyUserSession(req.cookies.get(USER_COOKIE)?.value);
}
