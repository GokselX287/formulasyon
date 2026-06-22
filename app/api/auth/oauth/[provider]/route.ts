import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { isProvider, isProviderEnabled, buildAuthUrl } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

function baseUrl(req: NextRequest): string {
  const env = process.env.APP_URL;
  if (env) return env.replace(/\/$/, '');
  const proto = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

// /api/auth/oauth/google  → sağlayıcıya yönlendir (state CSRF çerezi kurarak).
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const giris = new URL('/giris', baseUrl(req));

  if (!isProvider(provider) || !isProviderEnabled(provider)) {
    giris.searchParams.set('error', 'provider_disabled');
    return NextResponse.redirect(giris);
  }

  const state = randomBytes(16).toString('base64url');
  const redirectUri = `${baseUrl(req)}/api/auth/oauth/${provider}/callback`;
  const res = NextResponse.redirect(buildAuthUrl(provider, redirectUri, state));
  res.cookies.set('oauth_state', `${provider}:${state}`, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 600,
  });
  return res;
}
