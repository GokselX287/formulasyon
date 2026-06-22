'use client';

import { useEffect, useState } from 'react';
import AuthChrome from '@/components/AuthChrome';

// /sifre-sifirla — token YOKSA: sıfırlama bağlantısı iste. token VARSA: yeni şifre belirle.

async function api(action: string, body: Record<string, unknown> = {}) {
  const r = await fetch('/api/auth', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, d };
}

export default function SifreSifirlaPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  useEffect(() => {
    try { setToken(new URLSearchParams(window.location.search).get('token')); } catch { /* yok */ }
    setReady(true);
  }, []);

  const requestReset = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Geçerli bir e-posta gir.'); return; }
    setBusy(true); setErr('');
    const { d } = await api('request-reset', { email });
    setBusy(false);
    setSent(true);
    setDevLink(d.devResetLink || null);
  };

  const doReset = async () => {
    if (pw.length < 8) { setErr('Şifre en az 8 karakter olmalı.'); return; }
    if (pw !== pw2) { setErr('Şifreler eşleşmiyor.'); return; }
    setBusy(true); setErr('');
    const { ok, d } = await api('reset', { token, newPassword: pw });
    setBusy(false);
    if (ok) window.location.assign('/uygulama');
    else setErr(d.error || 'Sıfırlama başarısız.');
  };

  const lock = (
    <div className="lock" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
    </div>
  );

  if (!ready) return <AuthChrome><div className="gate-card"><p style={{ margin: 0 }}>Yükleniyor…</p></div></AuthChrome>;

  // ── token var → yeni şifre belirle ──
  if (token) {
    return (
      <AuthChrome>
        <div className="gate-card">
          {lock}
          <h2>Yeni şifre belirle</h2>
          <p>Yeni şifreni gir. Kaydedince otomatik giriş yapılır.</p>
          <div className="field">
            <label>Yeni şifre</label>
            <input className="inp" type="password" value={pw} autoFocus autoComplete="new-password"
              onChange={(e) => setPw(e.target.value)} placeholder="En az 8 karakter" />
          </div>
          <div className="field">
            <label>Yeni şifre (tekrar)</label>
            <input className="inp" type="password" value={pw2} autoComplete="new-password"
              onChange={(e) => setPw2(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doReset(); }} placeholder="••••••••" />
          </div>
          {err && <div className="note err">{err}</div>}
          <button className="btn primary" type="button" disabled={busy} onClick={doReset}>
            {busy ? <><span className="spin" /> Lütfen bekle…</> : 'Şifreyi güncelle ve gir'}
          </button>
          <div className="gate-foot"><a href="/giris">Girişe dön</a></div>
        </div>
      </AuthChrome>
    );
  }

  // ── token yok → sıfırlama bağlantısı iste ──
  return (
    <AuthChrome>
      <div className="gate-card">
        {lock}
        <h2>Şifreni sıfırla</h2>
        {sent ? (
          <>
            <p>Eğer <b>{email}</b> ile bir hesap varsa, sıfırlama bağlantısını gönderdik. Gelen kutunu kontrol et.</p>
            {devLink && (
              <div className="devbox">
                Geliştirme modu (gerçek e-posta gönderimi kapalı). Sıfırlamak için:{' '}
                <a href={devLink}>sıfırlama bağlantısı</a>
              </div>
            )}
            <div className="gate-foot" style={{ marginTop: 18 }}><a href="/giris">Girişe dön</a></div>
          </>
        ) : (
          <>
            <p>E-posta adresini gir; sana bir sıfırlama bağlantısı gönderelim.</p>
            <div className="field">
              <label>E-posta</label>
              <input className="inp" type="email" value={email} autoFocus autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') requestReset(); }}
                placeholder="ornek@eposta.com" />
            </div>
            {err && <div className="note err">{err}</div>}
            <button className="btn primary" type="button" disabled={busy} onClick={requestReset}>
              {busy ? <><span className="spin" /> Lütfen bekle…</> : 'Sıfırlama bağlantısı gönder'}
            </button>
            <div className="gate-foot">Hatırladın mı? <a href="/giris">Giriş yap</a></div>
          </>
        )}
      </div>
    </AuthChrome>
  );
}
