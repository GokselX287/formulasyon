import { NextRequest, NextResponse } from 'next/server';
import {
  isPasswordConfigured, setPassword, verifyPassword, signSession, isAuthed,
  SESSION_COOKIE, SESSION_MAX_AGE,
} from '@/lib/admin-auth';
import { logAudit } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const cookieOpts = (maxAge: number) => ({
  httpOnly: true as const,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge,
});

export async function GET(req: NextRequest) {
  return NextResponse.json({ configured: isPasswordConfigured(), authed: isAuthed(req) });
}

export async function POST(req: NextRequest) {
  const { action, password, newPassword } = await req.json().catch(() => ({}));

  if (action === 'logout') {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, '', cookieOpts(0));
    return res;
  }

  if (action === 'set-password') {
    if (isPasswordConfigured()) {
      return NextResponse.json({ ok: false, error: 'Şifre zaten ayarlı.' }, { status: 400 });
    }
    if (!password || String(password).length < 6) {
      return NextResponse.json({ ok: false, error: 'Şifre en az 6 karakter olmalı.' }, { status: 400 });
    }
    setPassword(String(password));
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, signSession(), cookieOpts(SESSION_MAX_AGE));
    return res;
  }

  if (action === 'change-password') {
    if (!isAuthed(req)) return NextResponse.json({ ok: false, error: 'Yetkisiz.' }, { status: 401 });
    if (!verifyPassword(String(password ?? ''))) {
      return NextResponse.json({ ok: false, error: 'Mevcut şifre hatalı.' }, { status: 401 });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return NextResponse.json({ ok: false, error: 'Yeni şifre en az 6 karakter olmalı.' }, { status: 400 });
    }
    setPassword(String(newPassword));
    return NextResponse.json({ ok: true });
  }

  // login
  if (!verifyPassword(String(password ?? ''))) {
    return NextResponse.json({ ok: false, error: 'Hatalı şifre.' }, { status: 401 });
  }
  logAudit('auth.login');
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, signSession(), cookieOpts(SESSION_MAX_AGE));
  return res;
}
