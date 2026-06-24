import { NextRequest, NextResponse } from 'next/server';
import {
  createAccount, verifyLogin, recordLogin, currentUser, getUserById,
  setUserPassword, createAuthToken, consumeAuthToken, markEmailVerified,
  findUserByEmail, isValidEmail, toSafe, signSession,
  SESSION_COOKIE, SESSION_MAX_AGE, SESSION_MAX_AGE_REMEMBER, type AppUser,
} from '@/lib/auth';
import { enabledProviders } from '@/lib/oauth';
import { sendMail, verificationEmail, resetEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const cookieOpts = (maxAge: number) => ({
  httpOnly: true as const,
  sameSite: 'lax' as const,   // OAuth dönüşünde (cross-site redirect) çerez gönderilebilsin
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge,
});

function baseUrl(req: NextRequest): string {
  const env = process.env.APP_URL;
  if (env) return env.replace(/\/$/, '');
  const proto = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

function setSession(res: NextResponse, user: AppUser, remember: boolean): void {
  const maxAge = remember ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE;
  res.cookies.set(SESSION_COOKIE, signSession(user.id, maxAge), cookieOpts(maxAge));
}

// ── Brute-force koruması — IP başına 15 dk'da 5 hatalı login → 15 dk kilit ──
const WINDOW = 15 * 60 * 1000;
const MAX_FAILS = 5;
const fails = new Map<string, { count: number; firstAt: number }>();
const clientIp = (req: NextRequest) => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
function isLocked(ip: string): boolean {
  const r = fails.get(ip);
  if (!r) return false;
  if (Date.now() - r.firstAt > WINDOW) { fails.delete(ip); return false; }
  return r.count >= MAX_FAILS;
}
function noteFail(ip: string): void {
  const r = fails.get(ip);
  if (!r || Date.now() - r.firstAt > WINDOW) fails.set(ip, { count: 1, firstAt: Date.now() });
  else r.count += 1;
}

export async function GET(req: NextRequest) {
  const user = currentUser(req);
  return NextResponse.json({
    authed: !!user,
    user: user ? toSafe(user) : null,
    providers: enabledProviders(),
    // Geçici: AUTH_PASSWORDLESS=1 iken /giris e-posta-only çalışır (canlı test kolaylığı).
    passwordless: process.env.AUTH_PASSWORDLESS === '1',
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || 'login');

  if (action === 'logout') {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, '', cookieOpts(0));
    return res;
  }

  // ── KAYIT (signup) — hesap aç, doğrulama e-postası gönder, oturum aç ──
  if (action === 'signup') {
    const email = String(body.email ?? '').trim();
    const password = String(body.password ?? '');
    const name = String(body.name ?? '').trim();
    if (!name) return NextResponse.json({ ok: false, error: 'Ad gerekli.' }, { status: 400 });
    if (!isValidEmail(email)) return NextResponse.json({ ok: false, error: 'Geçerli bir e-posta gir.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ ok: false, error: 'Şifre en az 8 karakter olmalı.' }, { status: 400 });

    let user: AppUser;
    try {
      user = createAccount({ email, name, password, title: body.title ? String(body.title) : undefined, via: 'email' });
    } catch (e) {
      return NextResponse.json({ ok: false, error: (e as Error).message || 'Kayıt başarısız.' }, { status: 409 });
    }

    const raw = createAuthToken(user.id, 'verify', 60 * 60 * 24); // 24 saat
    const link = `${baseUrl(req)}/dogrula?token=${raw}`;
    const mail = await sendMail({ to: email, ...verificationEmail(link) });

    const res = NextResponse.json({
      ok: true,
      user: toSafe(user),
      // Dev modunda (gerçek e-posta yokken) linki UI gösterebilsin diye döndür.
      devVerifyLink: mail.dev && process.env.NODE_ENV !== 'production' ? link : undefined,
    });
    setSession(res, user, true);
    return res;
  }

  // ── GİRİŞ (login) ──
  if (action === 'login') {
    const ip = clientIp(req);
    if (isLocked(ip)) {
      return NextResponse.json({ ok: false, error: 'Çok fazla hatalı deneme. 15 dakika sonra tekrar dene.' }, { status: 429 });
    }
    const user = verifyLogin(String(body.email ?? ''), String(body.password ?? ''));
    if (!user) {
      noteFail(ip);
      return NextResponse.json({ ok: false, error: 'E-posta veya şifre hatalı.' }, { status: 401 });
    }
    fails.delete(ip);
    recordLogin(user.id);
    const res = NextResponse.json({ ok: true, user: toSafe(user) });
    setSession(res, user, !!body.remember);
    return res;
  }

  // ── ŞİFRESİZ GİRİŞ (GEÇİCİ — canlı test) — AUTH_PASSWORDLESS=1 ile etkin ──
  // E-posta ile bul-ya-da-oluştur, şifre sorulmaz, oturum aç. Beta öncesi kapatılmalı.
  if (action === 'passwordless') {
    if (process.env.AUTH_PASSWORDLESS !== '1') {
      return NextResponse.json({ ok: false, error: 'Şifresiz giriş kapalı.' }, { status: 403 });
    }
    const email = String(body.email ?? '').trim();
    if (!isValidEmail(email)) return NextResponse.json({ ok: false, error: 'Geçerli bir e-posta gir.' }, { status: 400 });
    let user = findUserByEmail(email);
    if (!user) {
      const name = String(body.name ?? '').trim() || email.split('@')[0];
      try {
        user = createAccount({ email, name, via: 'email', emailVerified: true });
      } catch (e) {
        return NextResponse.json({ ok: false, error: (e as Error).message || 'Hesap oluşturulamadı.' }, { status: 409 });
      }
    }
    recordLogin(user.id);
    const res = NextResponse.json({ ok: true, user: toSafe(user) });
    setSession(res, user, body.remember !== false);
    return res;
  }

  // ── E-POSTA DOĞRULAMA ──
  if (action === 'verify') {
    const uid = consumeAuthToken(String(body.token ?? ''), 'verify');
    if (!uid) return NextResponse.json({ ok: false, error: 'Bağlantı geçersiz ya da süresi dolmuş.' }, { status: 400 });
    markEmailVerified(uid);
    return NextResponse.json({ ok: true });
  }

  // Giriş yapmış kullanıcı için doğrulama e-postasını yeniden gönder.
  if (action === 'request-verify') {
    const user = currentUser(req);
    if (!user || !user.email) return NextResponse.json({ ok: false, error: 'Yetkisiz.' }, { status: 401 });
    if (user.email_verified) return NextResponse.json({ ok: true, already: true });
    const raw = createAuthToken(user.id, 'verify', 60 * 60 * 24);
    const link = `${baseUrl(req)}/dogrula?token=${raw}`;
    const mail = await sendMail({ to: user.email, ...verificationEmail(link) });
    return NextResponse.json({ ok: true, devVerifyLink: mail.dev && process.env.NODE_ENV !== 'production' ? link : undefined });
  }

  // ── ŞİFRE SIFIRLAMA İSTEĞİ — varlığı sızdırma, her zaman ok ──
  if (action === 'request-reset') {
    const email = String(body.email ?? '').trim();
    const user = isValidEmail(email) ? findUserByEmail(email) : null;
    let devResetLink: string | undefined;
    if (user && user.email) {
      const raw = createAuthToken(user.id, 'reset', 60 * 60); // 1 saat
      const link = `${baseUrl(req)}/sifre-sifirla?token=${raw}`;
      const mail = await sendMail({ to: user.email, ...resetEmail(link) });
      if (mail.dev && process.env.NODE_ENV !== 'production') devResetLink = link;
    }
    return NextResponse.json({ ok: true, devResetLink });
  }

  // ── ŞİFRE SIFIRLAMA (jeton + yeni şifre) ──
  if (action === 'reset') {
    const newPassword = String(body.newPassword ?? '');
    if (newPassword.length < 8) return NextResponse.json({ ok: false, error: 'Yeni şifre en az 8 karakter olmalı.' }, { status: 400 });
    const uid = consumeAuthToken(String(body.token ?? ''), 'reset');
    if (!uid) return NextResponse.json({ ok: false, error: 'Bağlantı geçersiz ya da süresi dolmuş.' }, { status: 400 });
    setUserPassword(uid, newPassword);
    const user = getUserById(uid);
    const res = NextResponse.json({ ok: true });
    if (user) setSession(res, user, false); // sıfırlama sonrası otomatik giriş
    return res;
  }

  // ── ŞİFRE DEĞİŞTİR (giriş yapmışken) ──
  if (action === 'change-password') {
    const user = currentUser(req);
    if (!user) return NextResponse.json({ ok: false, error: 'Yetkisiz.' }, { status: 401 });
    const newPassword = String(body.newPassword ?? '');
    if (newPassword.length < 8) return NextResponse.json({ ok: false, error: 'Yeni şifre en az 8 karakter olmalı.' }, { status: 400 });
    if (!verifyLogin(user.email ?? '', String(body.password ?? ''))) {
      return NextResponse.json({ ok: false, error: 'Mevcut şifre hatalı.' }, { status: 401 });
    }
    setUserPassword(user.id, newPassword);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: 'Bilinmeyen işlem.' }, { status: 400 });
}
