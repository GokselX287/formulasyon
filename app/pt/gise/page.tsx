'use client';

/* ★ PUBLIC ★ QR Gişe kiosku — kamerayla üye QR'ını okur, yoklama düşer.
   proxy.ts'te muaf (giriş gerektirmez). Kamera yoksa/desteklenmiyorsa manuel token. */
import { useEffect, useRef, useState } from 'react';
import '@/components/pt/pt.css';

export default function PtGise() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [greeting, setGreeting] = useState<{ name: string; dup?: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const [camOk, setCamOk] = useState<boolean | null>(null);
  const busyRef = useRef(false);

  const checkin = async (token: string) => {
    if (!token || busyRef.current) return;
    busyRef.current = true;
    try {
      const r = await fetch('/api/pt/gise', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      const d = await r.json().catch(() => ({}));
      if (d?.ok) { setGreeting({ name: d.name, dup: d.duplicate }); setErr(null); }
      else setErr(d?.error || 'Geçersiz kod.');
    } catch { setErr('Bağlantı hatası.'); }
    setTimeout(() => { busyRef.current = false; setGreeting(null); setErr(null); }, 3500);
  };

  // Kamera + BarcodeDetector (varsa)
  useEffect(() => {
    let stream: MediaStream | null = null; let raf = 0; let stop = false;
    const BD = (typeof window !== 'undefined' && (window as any).BarcodeDetector) || null;
    (async () => {
      if (!BD || !navigator.mediaDevices?.getUserMedia) { setCamOk(false); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setCamOk(true);
        const detector = new BD({ formats: ['qr_code'] });
        const loop = async () => {
          if (stop) return;
          try {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              const codes = await detector.detect(videoRef.current);
              if (codes?.[0]?.rawValue && !busyRef.current) {
                const raw = String(codes[0].rawValue);
                const token = raw.includes('/') ? raw.split('/').pop()! : raw; // URL ya da düz token
                checkin(token.trim());
              }
            }
          } catch { /* yok */ }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch { setCamOk(false); }
    })();
    return () => { stop = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  return (
    <div className="pt pt-stage" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh', display: 'flex' }}>
      <div className="pt-wrap" style={{ maxWidth: 460, textAlign: 'center' }}>
        <div className="pt-eyebrow">QR Gişe</div>
        <h1 className="pt-title" style={{ marginBottom: 16 }}>Üye girişi</h1>

        <div className="pt-card" style={{ padding: 18 }}>
          {greeting ? (
            <div style={{ padding: '40px 12px' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>Hoş geldin, {greeting.name}!</div>
              <div style={{ color: 'var(--ink-mute)', fontSize: 13, marginTop: 6 }}>{greeting.dup ? 'Girişin zaten kaydedilmişti.' : 'Girişin kaydedildi.'}</div>
            </div>
          ) : (
            <>
              <video ref={videoRef} muted playsInline style={{ width: '100%', borderRadius: 14, background: '#000', aspectRatio: '4/3', objectFit: 'cover', display: camOk ? 'block' : 'none' }} />
              {camOk === false && <p style={{ fontSize: 13, color: 'var(--ink-mute)', padding: '20px 0' }}>Kamera kullanılamıyor (HTTPS/destek gerekir). Aşağıdan kodu elle girebilirsin.</p>}
              {camOk && <p style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginTop: 10 }}>QR kodunu kameraya gösterin.</p>}
              {err && <div className="pt-badge risk" style={{ marginTop: 10 }}><span className="dot" />{err}</div>}
            </>
          )}
        </div>

        {!greeting && (
          <form className="pt-card" style={{ padding: 16, marginTop: 12, display: 'flex', gap: 8 }} onSubmit={(e) => { e.preventDefault(); checkin(manual.trim()); setManual(''); }}>
            <input className="pt-input" placeholder="QR token (elle giriş)" value={manual} onChange={(e) => setManual(e.target.value)} />
            <button className="pt-btn" type="submit">Giriş</button>
          </form>
        )}
      </div>
    </div>
  );
}
