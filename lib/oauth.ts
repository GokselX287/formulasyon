// ──────────────────────────────────────────────────────────────────────────
// OAuth 2.0 / OIDC — Google + Microsoft. CREDENTIAL-READY: anahtarlar .env.local'a
// konulunca aktifleşir; yokken provider "kapalı" sayılır ve UI butonu görünmez.
// Apple BİLEREK yok (Apple Developer $99/yıl + public HTTPS gerekir, localhost'ta
// test edilemez). Microsoft "common" tenant'ı kişisel + iş hesaplarını kapsar ve
// localhost'ta test edilebilir.
// ──────────────────────────────────────────────────────────────────────────

export type ProviderId = 'google' | 'microsoft';

export type OAuthProfile = {
  providerUid: string;
  email?: string;
  name?: string;
  avatar?: string;
};

type ProviderCfg = {
  id: ProviderId;
  label: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  clientId: () => string;
  clientSecret: () => string;
};

const PROVIDERS: Record<ProviderId, ProviderCfg> = {
  google: {
    id: 'google',
    label: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
    clientId: () => process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET || '',
  },
  microsoft: {
    id: 'microsoft',
    label: 'Microsoft',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
    scope: 'openid email profile',
    clientId: () => process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: () => process.env.MICROSOFT_CLIENT_SECRET || '',
  },
};

export function isProvider(x: string): x is ProviderId {
  return x === 'google' || x === 'microsoft';
}

export function isProviderEnabled(p: ProviderId): boolean {
  const c = PROVIDERS[p];
  return !!c && !!c.clientId() && !!c.clientSecret();
}

// UI'nin gösterebileceği aktif sağlayıcılar (etiketleriyle).
export function enabledProviders(): { id: ProviderId; label: string }[] {
  return (Object.keys(PROVIDERS) as ProviderId[])
    .filter(isProviderEnabled)
    .map((id) => ({ id, label: PROVIDERS[id].label }));
}

export function buildAuthUrl(p: ProviderId, redirectUri: string, state: string): string {
  const c = PROVIDERS[p];
  const params = new URLSearchParams({
    client_id: c.clientId(),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: c.scope,
    state,
    prompt: 'select_account',
  });
  if (p === 'google') params.set('access_type', 'online');
  return `${c.authUrl}?${params.toString()}`;
}

// Yetki kodunu profile çevir (token exchange + userinfo). Hata → exception.
export async function exchangeCodeForProfile(
  p: ProviderId, code: string, redirectUri: string,
): Promise<OAuthProfile> {
  const c = PROVIDERS[p];
  const tokRes = await fetch(c.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: c.clientId(),
      client_secret: c.clientSecret(),
    }).toString(),
  });
  if (!tokRes.ok) {
    const t = await tokRes.text().catch(() => '');
    throw new Error(`token_exchange_failed: ${tokRes.status} ${t.slice(0, 200)}`);
  }
  const tok = await tokRes.json() as { access_token?: string };
  if (!tok.access_token) throw new Error('no_access_token');

  const uiRes = await fetch(c.userInfoUrl, {
    headers: { Authorization: `Bearer ${tok.access_token}`, Accept: 'application/json' },
  });
  if (!uiRes.ok) {
    const t = await uiRes.text().catch(() => '');
    throw new Error(`userinfo_failed: ${uiRes.status} ${t.slice(0, 200)}`);
  }
  const u = await uiRes.json() as Record<string, unknown>;
  const sub = (u.sub ?? u.oid ?? u.id) as string | undefined;
  if (!sub) throw new Error('no_subject');
  return {
    providerUid: String(sub),
    email: (u.email as string) || undefined,
    name: (u.name as string) || (u.given_name as string) || undefined,
    avatar: (u.picture as string) || undefined,
  };
}
