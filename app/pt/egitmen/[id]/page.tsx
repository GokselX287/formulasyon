'use client';

/* Eğitmen — genel bilgi (düzenlenebilir) + bu ay satış özeti + program kısayolu. */
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/pt/pt.css';

const tl = (n: number) => `${Number(n || 0).toLocaleString('tr-TR')} TL`;
const ymNow = () => new Date().toISOString().slice(0, 7);
const monthOptions = () => Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - i); return d.toISOString().slice(0, 7); });

export default function PtEgitmen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [t, setT] = useState<any>(null);
  const [month, setMonth] = useState(ymNow());
  const [sales, setSales] = useState<{ total: number; packages: any[] }>({ total: 0, packages: [] });
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetch(`/api/pt/trainers/${id}`).then((r) => r.ok ? r.json() : null).then(setT).catch(() => {}); }, [id]);
  useEffect(() => { fetch(`/api/pt/trainers/${id}/sales?month=${month}`).then((r) => r.json()).then(setSales).catch(() => {}); }, [id, month]);

  if (!t) return <div className="pt pt-stage"><div className="pt-wrap"><div className="pt-empty">Yükleniyor…</div></div></div>;
  const set = (k: string, v: string) => setT((p: any) => ({ ...p, [k]: v }));
  const save = async () => {
    await fetch(`/api/pt/trainers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ad_soyad: t.ad_soyad, telefon: t.telefon, email: t.email, uzmanlik: t.uzmanlik, brans: t.brans, bio: t.bio, durum: t.durum }) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="pt pt-stage">
      <div className="pt-wrap">
        <button className="pt-back" onClick={() => router.push('/pt/egitmenler')}><span className="chev">‹</span> Eğitmenler</button>
        <div className="pt-head" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div><div className="pt-eyebrow">Eğitmen</div><h1 className="pt-title">{t.ad_soyad}</h1></div>
          <button className="pt-btn ghost" onClick={() => router.push(`/pt/egitmen/${id}/program`)}>Haftalık program →</button>
        </div>

        <div className="pt-card" style={{ padding: '18px 22px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <b style={{ fontSize: 15 }}>Genel bilgiler</b>
            <button className="pt-btn" onClick={save}>{saved ? 'Kaydedildi ✓' : 'Kaydet'}</button>
          </div>
          <div className="pt-grid2">
            <label className="pt-field"><span className="pt-label">Ad soyad</span><input className="pt-input" value={t.ad_soyad ?? ''} onChange={(e) => set('ad_soyad', e.target.value)} /></label>
            <label className="pt-field"><span className="pt-label">Telefon</span><input className="pt-input" value={t.telefon ?? ''} onChange={(e) => set('telefon', e.target.value)} /></label>
            <label className="pt-field"><span className="pt-label">E-posta</span><input className="pt-input" value={t.email ?? ''} onChange={(e) => set('email', e.target.value)} /></label>
            <label className="pt-field"><span className="pt-label">Uzmanlık</span><input className="pt-input" value={t.uzmanlik ?? ''} onChange={(e) => set('uzmanlik', e.target.value)} /></label>
            <label className="pt-field"><span className="pt-label">Branş</span><input className="pt-input" value={t.brans ?? ''} onChange={(e) => set('brans', e.target.value)} /></label>
            <label className="pt-field"><span className="pt-label">Durum</span>
              <select className="pt-select" value={t.durum ?? 'aktif'} onChange={(e) => set('durum', e.target.value)}><option value="aktif">Aktif</option><option value="pasif">Pasif</option></select>
            </label>
          </div>
          <label className="pt-field" style={{ marginTop: 12 }}><span className="pt-label">Biyografi / not</span><textarea className="pt-textarea" value={t.bio ?? ''} onChange={(e) => set('bio', e.target.value)} /></label>
        </div>

        <div className="pt-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <b style={{ fontSize: 15 }}>Satış raporu</b>
            <select className="pt-select" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(e.target.value)}>
              {monthOptions().map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="pt-stat pt-tray" style={{ display: 'inline-block', minWidth: 200, marginBottom: 12 }}>
            <div className="v">{tl(sales.total)}</div><div className="k">Bu ay açılan paketler</div><div className="ss">{sales.packages.length} paket</div>
          </div>
          {sales.packages.length === 0 ? <p style={{ color: 'var(--ink-mute)', fontSize: 13 }}>Bu ay bu eğitmenin üyelerine açılmış paket yok.</p>
            : <div className="pt-list">{sales.packages.map((p) => <div key={p.id} className="pt-row" style={{ cursor: 'default' }}><div style={{ flex: 1 }}><div className="nm">{p.member_ad ?? '—'}</div><div className="meta">{p.paket_no}. {p.ad || 'paket'} · {p.baslangic}</div></div><b>{tl(p.tutar)}</b></div>)}</div>}
        </div>
      </div>
    </div>
  );
}
