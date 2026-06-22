'use client';

/* Üye dosyası — profil/ölçüm kısayolları + paket/ödeme + tahsilat + yoklama + QR. */
import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/pt/pt.css';

const BACK = '/pt/uyeler';
const ym = () => new Date().toISOString().slice(0, 7);
const tl = (n: number) => `${Number(n || 0).toLocaleString('tr-TR')} TL`;
type Member = { id: string; ad_soyad: string; telefon?: string; email?: string; yas?: number; meslek?: string; durum: string; trainer_id?: string; hedefler?: string; qr_token: string };
type Pkg = { id: string; paket_no: number; ad?: string; tutar: number; seans_adedi?: number; kalan_seans?: number; baslangic: string; bitis?: string; durum: string };
type Pay = { id: string; paket_no?: number; tutar: number; tarih: string; yontem?: string; sms_gonderildi: number };
type Att = { id: string; tarih: string; giris_at?: string; kaynak: string };

export default function PtUyeDosya({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [m, setM] = useState<Member | null>(null);
  const [pkgs, setPkgs] = useState<Pkg[]>([]);
  const [pays, setPays] = useState<Pay[]>([]);
  const [att, setAtt] = useState<Att[]>([]);
  const [olcumVar, setOlcumVar] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (s: string) => { setToast(s); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(() => {
    fetch(`/api/pt/members/${id}`).then((r) => r.ok ? r.json() : null).then(setM).catch(() => {});
    fetch(`/api/pt/packages?memberId=${id}`).then((r) => r.json()).then((d) => setPkgs(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`/api/pt/payments?memberId=${id}`).then((r) => r.json()).then((d) => setPays(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`/api/pt/attendance?memberId=${id}`).then((r) => r.json()).then((d) => setAtt(Array.isArray(d) ? d.slice(0, 8) : [])).catch(() => {});
    fetch(`/api/pt/members/${id}/measurements`).then((r) => r.json()).then((d) => setOlcumVar(Array.isArray(d) && d.some((x: any) => x.ay === ym()))).catch(() => {});
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (!m) return <div className="pt pt-stage"><div className="pt-wrap"><div className="pt-empty">Yükleniyor…</div></div></div>;

  const initials = m.ad_soyad.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toLocaleUpperCase('tr');

  const addPackage = async () => {
    const ad = prompt('Paket adı (örn. 12 ders paketi):', `${pkgs.length + 1}. paket`);
    if (ad == null) return;
    const tutarS = prompt('Tutar (TL):', '');
    if (!tutarS) return;
    const seans = prompt('Seans adedi (boş = süreli):', '');
    const bitis = prompt('Bitiş tarihi YYYY-MM-DD (boş geçilebilir):', '');
    const r = await fetch('/api/pt/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: id, ad, tutar: Number(tutarS), seans_adedi: seans ? Number(seans) : null, bitis: bitis || null }) }).then((x) => x.json());
    if (r?.ok) { flash(`${r.package.paket_no}. paket açıldı`); load(); }
  };
  const recordPayment = async (pkg: Pkg) => {
    const tutarS = prompt(`${pkg.paket_no}. paket için ödeme tutarı (TL):`, String(pkg.tutar));
    if (!tutarS) return;
    const r = await fetch('/api/pt/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: id, package_id: pkg.id, tutar: Number(tutarS), yontem: 'nakit' }) }).then((x) => x.json());
    if (r?.ok) { flash(r.sms?.ok ? `Ödeme alındı · SMS gönderildi` : `Ödeme alındı${m.telefon ? ' · SMS gönderilemedi' : ' (telefon yok)'}`); load(); }
  };
  const addCollection = async () => {
    const tutarS = prompt('Söz verilen tutar (TL, boş geçilebilir):', '');
    const soz = prompt('Ödeme sözü tarihi (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));
    if (!soz) return;
    const r = await fetch('/api/pt/collections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: id, tutar: tutarS ? Number(tutarS) : null, soz_tarihi: soz }) }).then((x) => x.json());
    if (r?.ok) flash('Tahsilat sözü eklendi');
  };
  const manualCheckin = async () => {
    const r = await fetch('/api/pt/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: id, kaynak: 'manuel' }) }).then((x) => x.json());
    if (r?.ok) { flash('Giriş kaydedildi'); load(); }
  };
  const DURUM: Record<string, { l: string; c: string }> = { aktif: { l: 'Aktif', c: 'ok' }, dondurulmus: { l: 'Dondurulmuş', c: 'warn' }, ayrildi: { l: 'Ayrıldı', c: 'mute' } };
  const d = DURUM[m.durum] ?? { l: m.durum, c: 'mute' };

  return (
    <div className="pt pt-stage">
      <div className="pt-wrap">
        <button className="pt-back" onClick={() => router.push(BACK)}><span className="chev">‹</span> Üyeler</button>

        {/* kimlik */}
        <div className="pt-tray" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: 15, display: 'grid', placeItems: 'center', background: '#161616', color: '#F2F1ED', fontWeight: 700, flex: 'none' }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pt-eyebrow" style={{ color: 'rgba(20,33,35,.58)' }}>Üye dosyası</div>
            <h1 className="pt-title" style={{ color: '#16201f' }}>{m.ad_soyad}{m.yas ? <i> · {m.yas} yaş</i> : null}</h1>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
              <span className={`pt-badge ${d.c}`}><span className="dot" />{d.l}</span>
              {m.telefon ? <span className="pt-badge mute"><span className="dot" />{m.telefon}</span> : null}
              {m.hedefler ? <span className="pt-badge mute"><span className="dot" />{m.hedefler}</span> : null}
            </div>
          </div>
        </div>

        {/* kısayollar */}
        <div className="pt-tiles" style={{ marginBottom: 16 }}>
          <button className="pt-tile" onClick={() => router.push(`/pt/uyeler/${id}/profil`)}>
            <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></svg></span>
            <span><span className="t">Bilgi formu</span><span className="s" style={{ display: 'block' }}>PAR-Q, postür, sağlık, hedef</span></span>
          </button>
          <button className="pt-tile" onClick={() => router.push(`/pt/uyeler/${id}/olcum`)}>
            {!olcumVar && <span className="cnt warn" style={{ fontSize: 11, top: 18 }}>● bu ay eksik</span>}
            <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h18M12 3v18" /><circle cx="12" cy="12" r="9" /></svg></span>
            <span><span className="t">Aylık ölçüm</span><span className="s" style={{ display: 'block' }}>Mezura + makine</span></span>
          </button>
        </div>

        {/* paketler + ödeme */}
        <div className="pt-card" style={{ padding: '18px 20px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <b style={{ fontSize: 15 }}>Paketler & ödemeler</b>
            <button className="pt-btn ghost" onClick={addPackage}>+ Paket aç</button>
          </div>
          {pkgs.length === 0 ? <p style={{ color: 'var(--ink-mute)', fontSize: 13 }}>Henüz paket yok.</p>
            : <div className="pt-list">{pkgs.map((p) => (
              <div key={p.id} className="pt-row" style={{ cursor: 'default' }}>
                <div style={{ flex: 1 }}>
                  <div className="nm">{p.paket_no}. {p.ad || 'paket'} · {tl(p.tutar)}</div>
                  <div className="meta">{p.baslangic}{p.bitis ? ` → ${p.bitis}` : ''}{p.seans_adedi ? ` · ${p.kalan_seans}/${p.seans_adedi} seans` : ''}</div>
                </div>
                <span className={`pt-badge ${p.durum === 'aktif' ? 'ok' : 'mute'}`}><span className="dot" />{p.durum}</span>
                <button className="pt-btn" style={{ padding: '7px 12px' }} onClick={() => recordPayment(p)}>Ödeme al</button>
              </div>
            ))}</div>}
          {pays.length > 0 && (
            <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
              <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginBottom: 6 }}>Ödeme geçmişi</div>
              {pays.map((p) => <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}><span>{p.tarih} · {p.paket_no ? `${p.paket_no}. paket` : '—'}</span><span>{tl(p.tutar)} {p.sms_gonderildi ? '· SMS✓' : ''}</span></div>)}
            </div>
          )}
        </div>

        {/* tahsilat + yoklama */}
        <div className="pt-grid2">
          <div className="pt-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><b style={{ fontSize: 14 }}>Tahsilat sözü</b><button className="pt-btn ghost" onClick={addCollection}>+ Söz ekle</button></div>
            <p style={{ color: 'var(--ink-mute)', fontSize: 12.5 }}>Ödeme sözü tarihi geçerse Bildirimler'de uyarı çıkar.</p>
          </div>
          <div className="pt-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><b style={{ fontSize: 14 }}>Son girişler</b><button className="pt-btn ghost" onClick={manualCheckin}>+ Manuel giriş</button></div>
            {att.length === 0 ? <p style={{ color: 'var(--ink-mute)', fontSize: 12.5 }}>Henüz giriş yok.</p>
              : att.map((a) => <div key={a.id} style={{ fontSize: 13, padding: '2px 0' }}>{a.tarih} {a.giris_at ? `· ${new Date(a.giris_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : ''} <span style={{ color: 'var(--ink-mute)' }}>({a.kaynak})</span></div>)}
          </div>
        </div>

        {/* QR */}
        <div className="pt-card" style={{ padding: '14px 20px', marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div><b style={{ fontSize: 13 }}>QR gişe kodu</b><div style={{ fontSize: 11.5, color: 'var(--ink-mute)', fontFamily: 'monospace', marginTop: 2 }}>{m.qr_token}</div></div>
          <button className="pt-btn ghost" onClick={() => { navigator.clipboard?.writeText(m.qr_token); flash('Token kopyalandı'); }}>Token kopyala</button>
        </div>
      </div>
      {toast && <div className="pt-toast"><span className="tdot" /><span>{toast}</span></div>}
    </div>
  );
}
