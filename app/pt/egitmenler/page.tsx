'use client';

/* Eğitmenler — liste + yeni eğitmen. */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/pt/pt.css';

const BACK = '/uygulama?tab=calisma-alani&room=antrenor';
type Trainer = { id: string; ad_soyad: string; uzmanlik?: string; brans?: string; telefon?: string; durum: string };

export default function PtEgitmenler() {
  const router = useRouter();
  const [rows, setRows] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const load = () => fetch('/api/pt/trainers').then((r) => r.json()).then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  return (
    <div className="pt pt-stage">
      <div className="pt-wrap">
        <button className="pt-back" onClick={() => router.push(BACK)}><span className="chev">‹</span> Kişisel Antrenör</button>
        <div className="pt-head" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div><div className="pt-eyebrow">Kişisel Antrenör</div><h1 className="pt-title">Eğitmenler <i>({rows.length})</i></h1></div>
          <button className="pt-btn" onClick={() => setModal(true)}><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Yeni eğitmen</button>
        </div>
        <div className="pt-card" style={{ padding: '6px 18px' }}>
          {loading ? <div className="pt-empty">Yükleniyor…</div>
            : rows.length === 0 ? <div className="pt-empty"><h3>Henüz eğitmen yok</h3><p>İlk eğitmeni ekle.</p><button className="pt-btn" onClick={() => setModal(true)}>Yeni eğitmen</button></div>
              : <div className="pt-list">{rows.map((t) => (
                <div key={t.id} className="pt-row" onClick={() => router.push(`/pt/egitmen/${t.id}`)}>
                  <div style={{ flex: 1 }}><div className="nm">{t.ad_soyad}</div><div className="meta">{[t.uzmanlik, t.brans].filter(Boolean).join(' · ') || 'Uzmanlık girilmedi'}</div></div>
                  <span className={`pt-badge ${t.durum === 'aktif' ? 'ok' : 'mute'}`}><span className="dot" />{t.durum === 'aktif' ? 'Aktif' : 'Pasif'}</span>
                </div>
              ))}</div>}
        </div>
      </div>
      {modal && <NewTrainerModal onClose={() => setModal(false)} onCreated={(id) => router.push(`/pt/egitmen/${id}`)} />}
    </div>
  );
}

function NewTrainerModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [f, setF] = useState({ ad_soyad: '', telefon: '', email: '', uzmanlik: '', brans: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    if (!f.ad_soyad.trim() || busy) return; setBusy(true);
    const r = await fetch('/api/pt/trainers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }).then((x) => x.json()).catch(() => null);
    setBusy(false); if (r?.ok) onCreated(r.trainer.id);
  };
  return (
    <div className="pt-scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pt-modal" style={{ width: 'min(500px,100%)' }}>
        <button className="pt-x" onClick={onClose}>×</button>
        <div className="pt-eyebrow">Yeni eğitmen</div>
        <h3 className="pt-title" style={{ fontSize: 20, marginBottom: 14 }}>Eğitmen kaydı</h3>
        <div className="pt-grid2">
          <label className="pt-field"><span className="pt-label">Ad soyad *</span><input className="pt-input" value={f.ad_soyad} onChange={(e) => set('ad_soyad', e.target.value)} autoFocus /></label>
          <label className="pt-field"><span className="pt-label">Telefon</span><input className="pt-input" value={f.telefon} onChange={(e) => set('telefon', e.target.value)} /></label>
          <label className="pt-field"><span className="pt-label">Uzmanlık</span><input className="pt-input" value={f.uzmanlik} onChange={(e) => set('uzmanlik', e.target.value)} placeholder="örn. fonksiyonel antrenman" /></label>
          <label className="pt-field"><span className="pt-label">Branş</span><input className="pt-input" value={f.brans} onChange={(e) => set('brans', e.target.value)} placeholder="örn. pilates" /></label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button className="pt-btn ghost" onClick={onClose}>Vazgeç</button>
          <button className="pt-btn" disabled={!f.ad_soyad.trim() || busy} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet & aç'}</button>
        </div>
      </div>
    </div>
  );
}
