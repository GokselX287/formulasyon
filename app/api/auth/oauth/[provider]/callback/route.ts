import { NextRequest, NextResponse } from 'next/server';
import { isProvider, exchangeCodeForProfile } from '@/lib/oauth';
import {
  findOrCreateOAuthUser, signSession,
  SESSION_COOKIE, SESSION_MAX_AGE_REMEMBER,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

function baseUrl(req: NextRequest): string {
  const env = process.env.APP_URL;
  if (env) return env.replace(/\/$/, '');
  const proto = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

// /api/auth/oauth/google/callback — code → profil → kullanıcı → oturum → /
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const base = baseUrl(req);
  const fail = (code: string) => {
    const u = new URL('/giris', base);
    u.searchParams.set('error', code);
    const r = NextResponse.redirect(u);
    r.cookies.set('oauth_state', '', { path: '/', maxAge: 0 });
    return r;
  };

  if (!isProvider(provider)) return fail('bad_provider');

  const url = new URL(req.url);
  if (url.searchParams.get('error')) return fail('oauth_denied');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const [cProv, cState] = (req.cookies.get('oauth_state')?.value || '').split(':');
  if (!code || !state || cProv !== provider || cState !== state) return fail('state_mismatch');

  try {
    const redirectUri = `${base}/api/auth/oauth/${provider}/callback`;
    const profile = await exchangeCodeForProfile(provider, code, redirectUri);
    const user = findOrCreateOAuthUser({
      provider,
      providerUid: profile.providerUid,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
    });
    const res = NextResponse.redirect(new URL('/', base));
    res.cookies.set('oauth_state', '', { path: '/', maxAge: 0 });
    res.cookies.set(SESSION_COOKIE, signSession(user.id, SESSION_MAX_AGE_REMEMBER), {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: SESSION_MAX_AGE_REMEMBER,
    });
    return res;
  } catch {
    return fail('oauth_failed');
  }
}
