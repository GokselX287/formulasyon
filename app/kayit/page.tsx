'use client';

import { useEffect, useState } from 'react';
import AuthChrome, { OAuthButtons } from '@/components/AuthChrome';

// /kayit — yeni terapist hesabı oluşturma (landing "Ücretsiz dene" buraya gelir).
// E-posta + şifre VEYA Google/Microsoft ile. Başarıda doğrulama e-postası gider
// ve oturum açılır; gerçek e-posta yoksa (dev) doğrulama linki ekranda gösterilir.

type Provider = { id: string; label: string };

async function api(action: string, body: Record<string, unknown> = {}) {
  const r = await fetch('/api/auth', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, d };
}

export default function KayitPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/auth').then((x) => x.json()).catch(() => ({}));
      if (r.authed) { window.location.assign('/uygulama'); return; }
      setProviders(r.providers || []);
    })();
  }, []);

  const submit = async () => {
    if (!name.trim()) { setErr('Adını gir.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Geçerli bir e-posta gir.'); return; }
    if (pw.length < 8) { setErr('Şifre en az 8 karakter olmalı.'); return; }
    setBusy(true); setErr('');
    const { ok, d } = await api('signup', { name, email, password: pw });
    setBusy(false);
    if (ok) { setDone(true); setDevLink(d.devVerifyLink || null); }
    else setErr(d.error || 'Kayıt başarısız.');
  };

  if (done) {
    return (
      <AuthChrome>
        <div className="gate-card">
          <div className="lock" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></svg>
          </div>
          <h2>Hesabın hazır 🎉</h2>
          <p><b>{email}</b> adresine bir doğrulama bağlantısı gönderdik. Doğrulamayı sonra da yapabilirsin — şimdi uygulamaya geçebilirsin.</p>
          {devLink && (
            <div className="devbox">
              Geliştirme modu (gerçek e-posta gönderimi kapalı). Doğrulamak için:{' '}
              <a href={devLink}>doğrulama bağlantısı</a>
            </div>
          )}
          <button className="btn primary" type="button" style={{ marginTop: 16 }} onClick={() => window.location.assign('/uygulama')}>
            Uygulamaya geç
          </button>
        </div>
      </AuthChrome>
    );
  }

  return (
    <AuthChrome>
      <div className="gate-card">
        <div className="lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
        </div>
        <h2>Hesabını oluştur</h2>
        <p>Calmie'yi ücretsiz dene. Danışan dosyaların güvenle, yalnız sana açık şekilde saklanır.</p>

        <OAuthButtons providers={providers} />
        {providers.length > 0 && <div className="divider">veya e-posta ile</div>}

        <div className="field">
          <label>Ad Soyad</label>
          <input className="inp" type="text" value={name} autoFocus autoComplete="name"
            onChange={(e) => setName(e.target.value)} placeholder="Adın Soyadın" />
        </div>
        <div className="field">
          <label>E-posta</label>
          <input className="inp" type="email" value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)} placeholder="ornek@eposta.com" />
        </div>
        <div className="field">
          <label>Şifre</label>
          <input className="inp" type="password" value={pw} autoComplete="new-password"
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} placeholder="En az 8 karakter" />
          <p className="field-hint">En az 8 karakter. Güçlü bir şifre seç.</p>
        </div>

        {err && <div className="note err">{err}</div>}

        <button className="btn primary" type="button" disabled={busy} onClick={submit}>
          {busy ? <><span className="spin" /> Lütfen bekle…</> : 'Hesabı oluştur'}
        </button>

        <div className="gate-foot">
          Zaten hesabın var mı? <a href="/giris">Giriş yap</a>
        </div>
      </div>
    </AuthChrome>
  );
}
