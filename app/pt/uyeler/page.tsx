'use client';

/* Üyeler — liste + yeni üye. Plastik dil (.pt). Veri /api/pt/members. */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/pt/pt.css';

const BACK = '/uygulama?tab=calisma-alani&room=antrenor';
type Member = { id: string; ad_soyad: string; telefon?: string; yas?: number; durum: string; trainer_ad?: string | null; hedefler?: string };
type Trainer = { id: string; ad_soyad: string };

export default function PtUyeler() {
  const router = useRouter();
  const [rows, setRows] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [q, setQ] = useState('');
  const [durum, setDurum] = useState<'all' | 'aktif' | 'dondurulmus' | 'ayrildi'>('all');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = () => fetch('/api/pt/members').then((r) => r.json()).then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); fetch('/api/pt/trainers').then((r) => r.json()).then((d) => setTrainers(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const visible = useMemo(() => rows.filter((m) => {
    if (durum !== 'all' && m.durum !== durum) return false;
    if (q.trim()) { const n = q.toLocaleLowerCase('tr'); return m.ad_soyad.toLocaleLowerCase('tr').includes(n) || (m.hedefler || '').toLocaleLowerCase('tr').includes(n); }
    return true;
  }), [rows, q, durum]);

  const DURUM: Record<string, { l: string; c: string }> = { aktif: { l: 'Aktif', c: 'ok' }, dondurulmus: { l: 'Dondurulmuş', c: 'warn' }, ayrildi: { l: 'Ayrıldı', c: 'mute' } };

  return (
    <div className="pt pt-stage">
      <div className="pt-wrap">
        <button className="pt-back" onClick={() => router.push(BACK)}><span className="chev">‹</span> Kişisel Antrenör</button>
        <div className="pt-head" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div><div className="pt-eyebrow">Kişisel Antrenör</div><h1 className="pt-title">Üyeler <i>({rows.length})</i></h1></div>
          <button className="pt-btn" onClick={() => setModal(true)}><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Yeni üye</button>
        </div>

        <div className="pt-tray" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <input className="pt-input" style={{ flex: 1, minWidth: 200, background: '#fff' }} placeholder="İsim veya hedef ara…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="pt-seg">
            {(['all', 'aktif', 'dondurulmus', 'ayrildi'] as const).map((k) => (
              <button key={k} aria-pressed={durum === k} onClick={() => setDurum(k)}>{k === 'all' ? 'Tümü' : DURUM[k].l}</button>
            ))}
          </div>
        </div>

        <div className="pt-card" style={{ padding: '6px 18px' }}>
          {loading ? <div className="pt-empty">Yükleniyor…</div>
            : visible.length === 0 ? <div className="pt-empty"><h3>{rows.length ? 'Sonuç yok' : 'Henüz üye yok'}</h3><p>{rows.length ? 'Aramayı değiştir.' : 'İlk üyeni ekle.'}</p>{!rows.length && <button className="pt-btn" onClick={() => setModal(true)}>Yeni üye</button>}</div>
              : (
                <div className="pt-list">
                  {visible.map((m) => {
                    const d = DURUM[m.durum] ?? { l: m.durum, c: 'mute' };
                    return (
                      <div key={m.id} className="pt-row" onClick={() => router.push(`/pt/uyeler/${m.id}`)}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="nm">{m.ad_soyad}{m.yas ? <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}> · {m.yas}</span> : null}</div>
                          <div className="meta">{m.trainer_ad ? `Antrenör: ${m.trainer_ad}` : 'Antrenör atanmadı'}{m.hedefler ? ` · ${m.hedefler}` : ''}</div>
                        </div>
                        <span className={`pt-badge ${d.c}`}><span className="dot" />{d.l}</span>
                      </div>
                    );
                  })}
                </div>
              )}
        </div>
      </div>

      {modal && <NewMemberModal trainers={trainers} onClose={() => setModal(false)} onCreated={(id) => router.push(`/pt/uyeler/${id}`)} />}
    </div>
  );
}

function NewMemberModal({ trainers, onClose, onCreated }: { trainers: { id: string; ad_soyad: string }[]; onClose: () => void; onCreated: (id: string) => void }) {
  const [f, setF] = useState({ ad_soyad: '', telefon: '', yas: '', dogum_tarihi: '', meslek: '', trainer_id: '', hedefler: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    if (!f.ad_soyad.trim() || busy) return;
    setBusy(true);
    const r = await fetch('/api/pt/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, yas: f.yas ? Number(f.yas) : null, trainer_id: f.trainer_id || null }) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (r?.ok) onCreated(r.member.id);
  };
  return (
    <div className="pt-scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pt-modal" style={{ width: 'min(520px,100%)' }}>
        <button className="pt-x" onClick={onClose}>×</button>
        <div className="pt-eyebrow">Yeni üye</div>
        <h3 className="pt-title" style={{ fontSize: 20, marginBottom: 14 }}>Üye kaydı</h3>
        <div className="pt-grid2">
          <label className="pt-field"><span className="pt-label">Ad soyad *</span><input className="pt-input" value={f.ad_soyad} onChange={(e) => set('ad_soyad', e.target.value)} autoFocus /></label>
          <label className="pt-field"><span className="pt-label">Telefon</span><input className="pt-input" value={f.telefon} onChange={(e) => set('telefon', e.target.value)} placeholder="5XX…" /></label>
          <label className="pt-field"><span className="pt-label">Yaş</span><input className="pt-input" type="number" value={f.yas} onChange={(e) => set('yas', e.target.value)} /></label>
          <label className="pt-field"><span className="pt-label">Doğum tarihi</span><input className="pt-input" type="date" value={f.dogum_tarihi} onChange={(e) => set('dogum_tarihi', e.target.value)} /></label>
          <label className="pt-field"><span className="pt-label">Meslek</span><input className="pt-input" value={f.meslek} onChange={(e) => set('meslek', e.target.value)} /></label>
          <label className="pt-field"><span className="pt-label">Antrenör</span>
            <select className="pt-select" value={f.trainer_id} onChange={(e) => set('trainer_id', e.target.value)}>
              <option value="">— seç —</option>
              {trainers.map((t) => <option key={t.id} value={t.id}>{t.ad_soyad}</option>)}
            </select>
          </label>
        </div>
        <label className="pt-field" style={{ marginTop: 12 }}><span className="pt-label">Hedefler</span><input className="pt-input" value={f.hedefler} onChange={(e) => set('hedefler', e.target.value)} placeholder="örn. kilo verme, kas kazanımı" /></label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button className="pt-btn ghost" onClick={onClose}>Vazgeç</button>
          <button className="pt-btn" disabled={!f.ad_soyad.trim() || busy} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet & aç'}</button>
        </div>
      </div>
    </div>
  );
}
