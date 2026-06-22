'use client';

import { useEffect, useRef, useState } from 'react';
import './OrtakCalisma.css';

// ──────────────────────────────────────────────────────────────────────────
// Ortak Çalışma — "Projeni ortak yürüt" (.oc2 scope).
// Başka terapistlere istek gönder, kabul edilenlerle ortak şablon çalış,
// iki formülasyonu yan yana karşılaştır, yorum iste/ver. Veriler /api/collab
// (yerel JSON) ile kalıcı; gerçek çok-kullanıcı senkronu ileride sunucuya bağlanır.
// ──────────────────────────────────────────────────────────────────────────

export type OrtakCalismaProps = {
  therapistName?: string;
  onBack?(): void;
  onNav?(target: string): void;
};

type Partner = { id: string; name: string; email?: string; status: 'pending' | 'accepted'; dir: 'out' | 'in' };
type Work = { id: string; partnerId: string; title: string; template: string; status: 'open' | 'review' | 'done'; mine: string; theirs: string; createdAt: number };
type CComment = { id: string; workId: string; author: string; body: string; createdAt: number };
type Doc = { partners: Partner[]; works: Work[]; comments: CComment[] };

const EMPTY: Doc = { partners: [], works: [], comments: [] };

const TEMPLATES = [
  { key: 'panik', t: 'Panik atak formülasyonu' },
  { key: 'sosyal', t: 'Sosyal kaygı — 4P' },
  { key: 'okb', t: 'OKB — ERP planı' },
  { key: 'yas', t: 'Yas süreci — CFT' },
  { key: 'depresyon', t: 'Depresyon — bilişsel model' },
  { key: 'act', t: 'ACT vaka kavramsallaştırma' },
];

const STATUS_LABEL: Record<Work['status'], string> = { open: 'Taslak', review: 'Yorum bekliyor', done: 'Tamamlandı' };
const FONTS = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&display=swap';
const uid = (p: string) => p + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
const fmtDate = (ms: number) => { try { return new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }); } catch { return ''; } };
const initials = (s: string) => (s || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export default function OrtakCalisma({ therapistName = 'Sen', onBack, onNav }: OrtakCalismaProps) {
  const [doc, setDoc] = useState<Doc>(EMPTY);
  const [selWork, setSelWork] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pName, setPName] = useState(''); const [pMail, setPMail] = useState('');
  const [wTemplate, setWTemplate] = useState(TEMPLATES[0].key);
  const [wPartner, setWPartner] = useState('');
  const [cText, setCText] = useState('');
  const [cAsPartner, setCAsPartner] = useState(false);

  useEffect(() => {
    fetch('/api/collab').then((r) => (r.ok ? r.json() : EMPTY))
      .then((d: Doc) => setDoc({ partners: d.partners ?? [], works: d.works ?? [], comments: d.comments ?? [] }))
      .catch(() => {});
  }, []);

  const persist = (next: Doc) => {
    setDoc(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/collab', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) }).catch(() => {});
    }, 350);
  };

  const addPartner = () => {
    const name = pName.trim(); if (!name) return;
    const p: Partner = { id: uid('p_'), name, email: pMail.trim() || undefined, status: 'pending', dir: 'out' };
    persist({ ...doc, partners: [p, ...doc.partners] });
    setPName(''); setPMail('');
  };
  const acceptPartner = (id: string) => persist({ ...doc, partners: doc.partners.map((p) => p.id === id ? { ...p, status: 'accepted' } : p) });
  const removePartner = (id: string) => persist({ ...doc, partners: doc.partners.filter((p) => p.id !== id), works: doc.works.filter((w) => w.partnerId !== id) });
  const accepted = doc.partners.filter((p) => p.status === 'accepted');

  const addWork = () => {
    const tpl = TEMPLATES.find((t) => t.key === wTemplate); if (!tpl) return;
    const partnerId = wPartner || accepted[0]?.id || '';
    if (!partnerId) return;
    const w: Work = { id: uid('w_'), partnerId, title: tpl.t, template: tpl.key, status: 'open', mine: '', theirs: '', createdAt: Date.now() };
    persist({ ...doc, works: [w, ...doc.works] });
    setSelWork(w.id);
  };
  const updateWork = (id: string, patch: Partial<Work>) => persist({ ...doc, works: doc.works.map((w) => w.id === id ? { ...w, ...patch } : w) });
  const removeWork = (id: string) => { persist({ ...doc, works: doc.works.filter((w) => w.id !== id), comments: doc.comments.filter((c) => c.workId !== id) }); if (selWork === id) setSelWork(null); };

  const addComment = () => {
    const body = cText.trim(); if (!body || !selWork) return;
    const author = cAsPartner ? partnerName(work?.partnerId ?? '') : therapistName;
    const c: CComment = { id: uid('c_'), workId: selWork, author, body, createdAt: Date.now() };
    persist({ ...doc, comments: [...doc.comments, c] });
    setCText('');
  };

  const partnerName = (id: string) => doc.partners.find((p) => p.id === id)?.name ?? '—';
  const work = doc.works.find((w) => w.id === selWork) ?? null;
  const workComments = work ? doc.comments.filter((c) => c.workId === work.id) : [];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={FONTS} rel="stylesheet" />

      <div className="oc2">
        <div className="shell">
          <div className="topbar">
            <div className="tb-left">
              <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Çalışma Alanı</button>
              <div className="tb-title"><span className="e">Ortak Çalışma</span><b>Projeni ortak yürüt</b></div>
            </div>
            <span className="tb-note">yerel · senkron yakında</span>
          </div>

          <div className="modal-body">
            <p className="oc-lead">Başka terapistlerle aynı şablonu ayrı ayrı çalışın, sonra <i>yan yana karşılaştırıp</i> birbirinizden yorum isteyin. İstek gönder, kabul edilince ortak çalışma açılır.</p>

            {/* 01 — Ortak çalıştığın terapistler */}
            <section className="oc-sec">
              <div className="oc-head"><span className="eyebrow">iş arkadaşların</span><h2>Ortak çalıştığın <i>terapistler</i></h2></div>
              <div className="oc-invite">
                <input type="text" placeholder="Terapist adı" value={pName} onChange={(e) => setPName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addPartner(); }} />
                <input type="email" placeholder="E-posta / kod (opsiyonel)" value={pMail} onChange={(e) => setPMail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addPartner(); }} />
                <button type="button" className="oc-btn solid" onClick={addPartner} disabled={!pName.trim()}>İstek gönder</button>
              </div>
              {doc.partners.length ? (
                <div className="oc-partners">
                  {doc.partners.map((p) => (
                    <div className={`oc-partner${p.status === 'accepted' ? ' ok' : ''}`} key={p.id}>
                      <span className="av">{initials(p.name)}</span>
                      <span className="pinfo"><b>{p.name}</b>{p.email && <span>{p.email}</span>}</span>
                      <span className={`pst ${p.status}`}>{p.status === 'accepted' ? 'kabul edildi' : 'istek gönderildi'}</span>
                      {p.status === 'pending' && <button type="button" className="oc-mini" onClick={() => acceptPartner(p.id)} title="Kabul (demo)">Kabul</button>}
                      <button type="button" className="oc-mini ghost" onClick={() => removePartner(p.id)} aria-label="Kaldır">✕</button>
                    </div>
                  ))}
                </div>
              ) : <p className="oc-empty">Henüz kimseyle ortak çalışmıyorsun. Yukarıdan bir terapiste istek gönder.</p>}
            </section>

            {/* 02 — Ortak çalışmalar */}
            <section className="oc-sec">
              <div className="oc-head"><span className="eyebrow">ortak şablonlar</span><h2>Ortak <i>çalışmalar</i></h2></div>
              <div className="oc-new">
                <select value={wTemplate} onChange={(e) => setWTemplate(e.target.value)} aria-label="Şablon">
                  {TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.t}</option>)}
                </select>
                <select value={wPartner} onChange={(e) => setWPartner(e.target.value)} aria-label="Terapist" disabled={!accepted.length}>
                  <option value="">{accepted.length ? 'Terapist seç…' : 'Önce bir terapist kabul edilmeli'}</option>
                  {accepted.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button type="button" className="oc-btn solid" onClick={addWork} disabled={!accepted.length}>Ortak çalışma aç</button>
              </div>
              {doc.works.length ? (
                <div className="oc-works">
                  {doc.works.map((w) => (
                    <button type="button" key={w.id} className={`oc-work${selWork === w.id ? ' on' : ''}`} onClick={() => setSelWork(w.id)}>
                      <span className="ww-top"><b>{w.title}</b><span className={`ww-st s-${w.status}`}>{STATUS_LABEL[w.status]}</span></span>
                      <span className="ww-meta">{partnerName(w.partnerId)} ile · {fmtDate(w.createdAt)}</span>
                    </button>
                  ))}
                </div>
              ) : <p className="oc-empty">Ortak çalışma yok. Bir şablon + terapist seçip “Ortak çalışma aç”a bas — örn. ikiniz de “Panik atak formülasyonu” doldurup karşılaştırın.</p>}
            </section>

            {/* 03 — Karşılaştırma + yorumlar */}
            {work && (
              <section className="oc-sec oc-compare">
                <div className="oc-head">
                  <span className="eyebrow">karşılaştırma · {partnerName(work.partnerId)}</span>
                  <h2>{work.title}</h2>
                </div>
                <div className="cmp-actions">
                  <span className={`ww-st s-${work.status}`}>{STATUS_LABEL[work.status]}</span>
                  <button type="button" className="oc-mini" onClick={() => updateWork(work.id, { status: 'review' })}>Yorum iste</button>
                  <button type="button" className="oc-mini" onClick={() => updateWork(work.id, { status: 'done' })}>Tamamlandı</button>
                  <button type="button" className="oc-mini ghost" onClick={() => removeWork(work.id)}>Çalışmayı sil</button>
                </div>
                <div className="cmp-grid">
                  <div className="cmp-col">
                    <div className="cmp-h"><span className="av me">{initials(therapistName)}</span>Senin formülasyonun</div>
                    <textarea value={work.mine} placeholder={`${work.title} — kendi formülasyonunu yaz…`} onChange={(e) => updateWork(work.id, { mine: e.target.value })} />
                  </div>
                  <div className="cmp-col">
                    <div className="cmp-h"><span className="av">{initials(partnerName(work.partnerId))}</span>{partnerName(work.partnerId)} formülasyonu</div>
                    <textarea value={work.theirs} placeholder="Partnerin formülasyonu (geldiğinde buraya işlenir; şimdilik elle de girebilirsin)…" onChange={(e) => updateWork(work.id, { theirs: e.target.value })} />
                  </div>
                </div>

                <div className="cmp-comments">
                  <div className="cmp-ch">Yorumlar</div>
                  {workComments.length ? workComments.map((c) => (
                    <div className={`cmt${c.author === therapistName ? ' me' : ''}`} key={c.id}>
                      <span className="cmt-av">{initials(c.author)}</span>
                      <div className="cmt-b"><span className="cmt-who">{c.author} · {fmtDate(c.createdAt)}</span><p>{c.body}</p></div>
                    </div>
                  )) : <p className="oc-empty sm">Henüz yorum yok. Aşağıdan bir not bırak ya da partnerden yorum iste.</p>}
                  <div className="cmt-add">
                    <input type="text" placeholder="Yorum yaz…" value={cText} onChange={(e) => setCText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }} />
                    <label className="cmt-as"><input type="checkbox" checked={cAsPartner} onChange={(e) => setCAsPartner(e.target.checked)} />{partnerName(work.partnerId)} olarak</label>
                    <button type="button" className="oc-btn solid" onClick={addComment} disabled={!cText.trim()}>Gönder</button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
