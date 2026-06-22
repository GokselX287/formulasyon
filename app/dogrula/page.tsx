'use client';

import { useEffect, useState } from 'react';
import AuthChrome from '@/components/AuthChrome';

// /dogrula?token=… — e-posta doğrulama bağlantısının indiği sayfa. Jeton tüketilir,
// sonuç gösterilir. Başarıda uygulamaya geçiş / girişe yönlendirme sunulur.

export default function DogrulaPage() {
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading');

  useEffect(() => {
    (async () => {
      let token: string | null = null;
      try { token = new URLSearchParams(window.location.search).get('token'); } catch { /* yok */ }
      if (!token) { setState('fail'); return; }
      const r = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token }),
      }).then((x) => x.json()).catch(() => ({}));
      setState(r.ok ? 'ok' : 'fail');
    })();
  }, []);

  return (
    <AuthChrome>
      <div className="gate-card center">
        {state === 'loading' && <p style={{ margin: 0 }}>Doğrulanıyor…</p>}

        {state === 'ok' && (
          <>
            <div className="lock" aria-hidden="true" style={{ background: '#2F5D50' }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h2>E-posta doğrulandı</h2>
            <p>Teşekkürler — hesabın artık doğrulandı.</p>
            <button className="btn primary" type="button" onClick={() => window.location.assign('/uygulama')}>Uygulamaya geç</button>
          </>
        )}

        {state === 'fail' && (
          <>
            <div className="lock" aria-hidden="true" style={{ background: '#B23B3B' }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </div>
            <h2>Bağlantı geçersiz</h2>
            <p>Doğrulama bağlantısı geçersiz ya da süresi dolmuş. Uygulamaya girip yeni bir doğrulama e-postası isteyebilirsin.</p>
            <button className="btn primary" type="button" onClick={() => window.location.assign('/giris')}>Girişe git</button>
          </>
        )}
      </div>
    </AuthChrome>
  );
}
