'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './SupervizyonV2.css';

// ──────────────────────────────────────────────────────────────────────────
// Süpervizyon — "Klinik Editöryel Dosya" · Süpervizyon v2.html port.
// Not zaman çizelgesi + form (liste/form pane). Gerçek /api/supervizyon.
// Eşleme: date↔tarih, topic↔goal, case↔caseLabel, body↔notes, challenge/learning yeni kolon.
// ──────────────────────────────────────────────────────────────────────────

export type SupervizyonV2Props = { onBack?(): void; onNav?(target: string): void };

type Rec = { id: string; tarih: string; supervisor: string; goal: string; notes: string; caseLabel: string | null; challenge: number | null; learning: number | null };

const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const fmtDate = (iso?: string) => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${+d} ${AY[+m - 1]} ${y}`; };

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
  { label: 'Profil', target: 'terapist', active: true },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function SupervizyonV2(props: SupervizyonV2Props) {
  const { onBack, onNav } = props;
  const router = useRouter();
  const [theme, setTheme] = useState('sage');
  useEffect(() => { try { setTheme(localStorage.getItem('calmie-theme') || 'sage'); } catch {} }, []);
  const [pane, setPane] = useState<'liste' | 'form'>('liste');
  const [recs, setRecs] = useState<Rec[]>([]);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ tarih: todayISO(), supervisor: '', goal: '', caseLabel: '', challenge: 5, learning: 7, notes: '' });

  const load = async () => { try { const r = await fetch('/api/supervizyon'); if (r.ok) setRecs(await r.json()); } catch {} };
  useEffect(() => { load(); }, []);

  const reset = () => setForm({ tarih: todayISO(), supervisor: '', goal: '', caseLabel: '', challenge: 5, learning: 7, notes: '' });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/supervizyon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, format: 'bireysel', status: 'tamamlandı' }) });
    setSaved(true); setTimeout(() => setSaved(false), 1500);
    await load(); reset(); setPane('liste');
  };

  const sorted = [...recs].sort((a, b) => (b.tarih ?? '').localeCompare(a.tarih ?? ''));
  const n = recs.length;
  const learns = recs.map((r) => r.learning).filter((x): x is number => typeof x === 'number');
  const avgL = learns.length ? (Math.round(learns.reduce((s, x) => s + x, 0) / learns.length * 10) / 10).toString().replace('.', ',') : '—';
  const last = sorted.length ? fmtDate(sorted[0].tarih) : '—';

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&display=swap" rel="stylesheet" />

      <div className="sp2" data-pane={pane} data-theme={theme}>
        <div className="scene" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <div className="shell">

          <div className="topbar">
            <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Geri</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="tb-new ghost" type="button" onClick={() => router.push('/supervizyon/yeni')}><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Yeni vaka sunumu oluştur</button>
              <button className={`tb-new${pane === 'form' ? ' ghost' : ''}`} type="button" onClick={() => setPane((p) => (p === 'form' ? 'liste' : 'form'))}>
                {pane === 'form' ? 'Listeye dön' : <><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Yeni süpervizyon notu</>}
              </button>
            </div>
          </div>

          <div className="modal-body">
            <div className="hero">
              <span className="eyebrow">Profil · Mesleki Gelişim</span>
              <h1>Süpervizyon <i>notları</i></h1>
              <p>Süpervizyon oturumlarından çıkardığın konu, zorlanma ve öğrenmeler. Her not bir oturum; profil kartlarıyla bağlı.</p>
              <div className="summary">
                <span className="sm"><b className="num">{n}</b><span>oturum</span></span>
                <span className="sm"><b className="num">{avgL}</b><span>ort. öğrenme</span></span>
                <span className="sm"><b>{last}</b><span>son oturum</span></span>
              </div>
            </div>

            <div className="wrap">
              {pane === 'liste' ? (
                <div id="listPane">
                  <div className="tl">
                    {sorted.length === 0 ? (
                      <div className="empty"><span className="ring">∅</span><span className="t">Henüz süpervizyon notu yok</span><span>Sağ üstten ilk notu ekle.</span></div>
                    ) : sorted.map((nrec) => {
                      const flag = (nrec.challenge ?? 0) >= 7;
                      return (
                        <div className={`note${flag ? ' flag' : ''}`} key={nrec.id}>
                          <div className="card">
                            <div className="note-head">
                              <div className="l">
                                <div className="date">{fmtDate(nrec.tarih)}</div>
                                <h3>{nrec.goal || '—'}</h3>
                                <div className="sup">{nrec.supervisor || 'Süpervizör belirtilmedi'}</div>
                              </div>
                              {flag ? <span className="tag flag">yoğun oturum</span> : <span className="tag ok">tamamlandı</span>}
                            </div>
                            {nrec.notes && <p className="excerpt">{nrec.notes}</p>}
                            {nrec.caseLabel && <div className="case">İlgili vaka · {nrec.caseLabel}</div>}
                            <div className="scores">
                              <div className="score chal"><div className="sl">Zorlanma</div><div className="sb"><span className="track"><span className="fill" style={{ width: `${(nrec.challenge ?? 0) * 10}%` }} /></span><span className="v num">{nrec.challenge ?? '–'}/10</span></div></div>
                              <div className="score"><div className="sl">Öğrenme</div><div className="sb"><span className="track"><span className="fill" style={{ width: `${(nrec.learning ?? 0) * 10}%` }} /></span><span className="v num">{nrec.learning ?? '–'}/10</span></div></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div id="formPane">
                  <form className="form-card" autoComplete="off" onSubmit={save}>
                    <div className="fgrid">
                      <div className="field"><label>Tarih</label><input type="date" value={form.tarih} onChange={(e) => setForm((f) => ({ ...f, tarih: e.target.value }))} /></div>
                      <div className="field"><label>Süpervizör</label><input type="text" value={form.supervisor} onChange={(e) => setForm((f) => ({ ...f, supervisor: e.target.value }))} placeholder="Ad / unvan" /></div>
                      <div className="field full"><label>Konu / başlık</label><input type="text" value={form.goal} onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))} placeholder="Örn. Rüptür-onarım; aktarım dinamikleri" /></div>
                      <div className="field full"><label>İlgili vaka (opsiyonel)</label><input type="text" value={form.caseLabel} onChange={(e) => setForm((f) => ({ ...f, caseLabel: e.target.value }))} placeholder="Danışan adı ya da vaka no — boş bırakılırsa gösterilmez" /></div>
                      <div className="field"><label>Zorlanma düzeyi · {form.challenge}/10</label><div className="slider-row"><input type="range" min={0} max={10} value={form.challenge} onChange={(e) => setForm((f) => ({ ...f, challenge: +e.target.value }))} /><span className="out">{form.challenge}</span></div><span className="hint">Oturumda ne kadar zorlandın</span></div>
                      <div className="field"><label>Öğrenme değeri · {form.learning}/10</label><div className="slider-row"><input type="range" min={0} max={10} value={form.learning} onChange={(e) => setForm((f) => ({ ...f, learning: +e.target.value }))} /><span className="out">{form.learning}</span></div><span className="hint">Bu oturumdan ne kadar kazandın</span></div>
                      <div className="field full"><label>İçerik / çıkarımlar</label><textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Tartışılan vaka, geri bildirim, denenecek müdahaleler, kişisel reaksiyonlar…" /><span className="hint">Yalnızca senin kaydın — danışan dosyasına yazılmaz.</span></div>
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn-ghost" onClick={() => { reset(); setPane('liste'); }}>Vazgeç</button>
                      <button type="submit" className={`btn-save${saved ? ' done' : ''}`}><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg><span>{saved ? 'Kaydedildi ✓' : 'Notu kaydet'}</span></button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          <nav className="dock" aria-label="Bölümler">
            {DOCK.map((d) => (
              <a key={d.target} href="#" className={d.active ? 'active' : ''} onClick={(e) => { e.preventDefault(); if (!d.active) onNav?.(d.target); }}>{d.label}</a>
            ))}
          </nav>

        </div>
      </div>
    </>
  );
}
