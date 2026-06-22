'use client';

import { useEffect, useState } from 'react';
import AuthChrome, { OAuthButtons } from '@/components/AuthChrome';

// /giris — terapist girişi. E-posta + şifre VEYA Google/Microsoft. İlk kez gelen
// (hesabı olmayan) /kayit'a yönlenir. Kayıt akışı artık ayrı (/kayit) — bu ekran
// yalnız giriş + sosyal giriş + şifre sıfırlama bağlantısı sunar.

type Provider = { id: string; label: string };

const OAUTH_ERRORS: Record<string, string> = {
  provider_disabled: 'Bu giriş yöntemi şu an etkin değil.',
  state_mismatch: 'Oturum doğrulaması başarısız oldu. Lütfen tekrar dene.',
  oauth_denied: 'Giriş iptal edildi.',
  oauth_failed: 'Sağlayıcıyla giriş tamamlanamadı. Tekrar dene.',
  bad_provider: 'Geçersiz giriş sağlayıcısı.',
};

async function api(action: string, body: Record<string, unknown> = {}) {
  const r = await fetch('/api/auth', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, d };
}

export default function GirisPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const goNext = () => {
    let next = '/uygulama';
    try {
      const p = new URLSearchParams(window.location.search).get('next');
      if (p && p.startsWith('/') && !p.startsWith('//') && !p.startsWith('/giris')) next = p;
    } catch { /* yok */ }
    window.location.assign(next);
  };

  useEffect(() => {
    try {
      const e = new URLSearchParams(window.location.search).get('error');
      if (e) setErr(OAUTH_ERRORS[e] || 'Giriş başarısız.');
    } catch { /* yok */ }
    (async () => {
      const r = await fetch('/api/auth').then((x) => x.json()).catch(() => ({}));
      if (r.authed) { goNext(); return; }
      setProviders(r.providers || []);
      setReady(true);
    })();
  }, []);

  const doLogin = async () => {
    setBusy(true); setErr('');
    const { ok, d } = await api('login', { email, password: pw, remember });
    setBusy(false);
    if (ok) goNext(); else setErr(d.error || 'Giriş başarısız.');
  };

  return (
    <AuthChrome>
      <div className="gate-card">
        {!ready ? (
          <p style={{ margin: 0 }}>Yükleniyor…</p>
        ) : (
          <>
            <div className="lock" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            </div>
            <h2>Giriş yap</h2>
            <p>Danışan dosyalarına erişmek için giriş yap.</p>

            <OAuthButtons providers={providers} />
            {providers.length > 0 && <div className="divider">veya e-posta ile</div>}

            <div className="field">
              <label>E-posta</label>
              <input className="inp" type="email" value={email} autoFocus autoComplete="username"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') doLogin(); }}
                placeholder="ornek@eposta.com" />
            </div>
            <div className="field">
              <label>Şifre</label>
              <input className="inp" type="password" value={pw} autoComplete="current-password"
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') doLogin(); }}
                placeholder="••••••••" />
            </div>
            <a className="gate-link forgot" href="/sifre-sifirla">Şifreni mi unuttun?</a>

            <label className="remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Beni hatırla (30 gün)
            </label>

            {err && <div className="note err">{err}</div>}

            <button className="btn primary" type="button" disabled={busy} onClick={doLogin}>
              {busy ? <><span className="spin" /> Lütfen bekle…</> : 'Giriş yap'}
            </button>

            <div className="gate-foot">
              Hesabın yok mu? <a href="/kayit">Ücretsiz kayıt ol</a>
            </div>
          </>
        )}
      </div>
    </AuthChrome>
  );
}
