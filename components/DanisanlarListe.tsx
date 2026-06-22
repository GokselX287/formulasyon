'use client';

/* =====================================================================
   DanisanlarListe.tsx — "Klinik Premium / Plastik" danışan dizini
   Kök element <div className="dlst"> (CSS .dlst altında kapsüllü).
   Görsel kaynak: "Danışanlar Listesi (yeni).html" (Cv görsel-32).
   Veri uygulamanın gerçek Client modelinden gelir; uydurma yok.
   ===================================================================== */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './DanisanlarListe.css';
import {
  Client, Status, statusLabel, mapStatus, category, detectKeys, tagText, noteText,
  fmt, relNext, computeStats, CANON_LABEL,
} from './danisanlarListe.helpers';

export type DanisanlarListeProps = {
  clients: Client[];
  onBack?(): void;
  onNav?(target: string): void;            // 'home' | 'profil' | 'ayarlar'
  onNewClient?(): void;
  onOpenClient?(id: string): void;         // → /danisan/[id]
  onPrefetchClient?(id: string): void;
  onMail?(id: string): void;
  onSms?(id: string): void;
};

type View = 'rows' | 'grid';
type StatusFilter = 'all' | Status;
type CatFilter = 'all' | 'ergen' | 'yetiskin' | 'cocuk';
type Sort = 'next' | 'recent' | 'name' | 'progress';

/* ─── İkonlar ─────────────────────────────────────────────────────────── */
const Ico = {
  search: <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>,
  rows: <svg viewBox="0 0 24 24" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>,
  grid: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  plus: <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>,
  mail: <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M4 7l8 6 8-6" /></svg>,
  sms: <svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9 9 0 0 1-3.5-.7L3 21l1.7-5A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" /></svg>,
};

const DOCK = [
  { key: 'home', label: 'Ana Sayfa' },
  { key: 'calisma', label: 'Çalışma Alanı', active: true },
  { key: 'profil', label: 'Profil' },
  { key: 'ayarlar', label: 'Ayarlar' },
];

export default function DanisanlarListe(props: DanisanlarListeProps) {
  const { clients } = props;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [cat, setCat] = useState<CatFilter>('all');
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('next');
  const [view, setView] = useState<View>(() => {
    try { const v = localStorage.getItem('dlst_view'); return v === 'grid' || v === 'rows' ? (v as View) : 'rows'; } catch { return 'rows'; }
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; warn?: boolean } | null>(null);
  const [sms, setSms] = useState<Client | null>(null);

  const today = useMemo(() => new Date(), []);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 420); return () => clearTimeout(t); }, []);

  const stats = useMemo(() => computeStats(clients), [clients]);

  /* Etikete sahip kanonik anahtarlar (veriden türer; yoksa çubuk gizli) */
  const tagOptions = useMemo(() => {
    const seen = new Map<string, string>();
    clients.forEach((c) => detectKeys(c).forEach((k) => { if (!seen.has(k)) seen.set(k, CANON_LABEL[k] || k); }));
    return [...seen];
  }, [clients]);

  const filtered = !!(q || tag || status !== 'all' || cat !== 'all');

  const visible = useMemo(() => {
    let rows = clients.slice();
    if (q.trim()) {
      const needle = q.toLocaleLowerCase('tr');
      rows = rows.filter((c) =>
        c.name.toLocaleLowerCase('tr').includes(needle) ||
        noteText(c).toLocaleLowerCase('tr').includes(needle) ||
        tagText(c).toLocaleLowerCase('tr').includes(needle));
    }
    if (status !== 'all') rows = rows.filter((c) => mapStatus(c) === status);
    if (cat !== 'all') rows = rows.filter((c) => category(c.age) === cat);
    if (tag) rows = rows.filter((c) => detectKeys(c).includes(tag));
    rows.sort((a, b) => {
      switch (sort) {
        case 'name': return a.name.localeCompare(b.name, 'tr');
        case 'recent': return new Date(b.lastSession || 0).getTime() - new Date(a.lastSession || 0).getTime();
        case 'progress': return b.continuityPct - a.continuityPct;
        default: {
          const an = a.nextAppointment ? new Date(a.nextAppointment).getTime() : null;
          const bn = b.nextAppointment ? new Date(b.nextAppointment).getTime() : null;
          if (an == null && bn == null) return 0; if (an == null) return 1; if (bn == null) return -1; return an - bn;
        }
      }
    });
    return rows;
  }, [clients, q, status, cat, tag, sort]);

  /* ─── Toast ───────────────────────────────────────────────────────── */
  const toastTimer = useRef<number | undefined>(undefined);
  function showToast(msg: string, warn?: boolean) {
    setToast({ msg, warn });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }

  /* ─── Aksiyonlar ──────────────────────────────────────────────────── */
  const open = (id: string) => props.onOpenClient?.(id);
  const prefetch = (id: string) => props.onPrefetchClient?.(id);
  function doMail(e: React.MouseEvent, c: Client) {
    e.stopPropagation();
    if (props.onMail) return props.onMail(c.id);
    if (c.email?.trim()) { window.location.href = 'mailto:' + c.email.trim(); }
    else showToast('Bu danışanın e-postası kayıtlı değil — danışan kaydına (anamnez) ekleyebilirsin.', true);
  }
  function doSms(e: React.MouseEvent, c: Client) {
    e.stopPropagation();
    if (props.onSms) return props.onSms(c.id);
    if (c.telefon?.trim()) setSms(c);
    else showToast('Bu danışanın telefonu kayıtlı değil — danışan kaydına (anamnez) ekleyebilirsin.', true);
  }
  function resetFilters() { setQ(''); setStatus('all'); setCat('all'); setTag(null); }
  function setViewPersist(v: View) { setView(v); try { localStorage.setItem('dlst_view', v); } catch { /* yok */ } }

  /* ─── Dock glider ─────────────────────────────────────────────────── */
  const dockRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [glider, setGlider] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [lit, setLit] = useState(DOCK.findIndex((d) => d.active));
  const moveGlider = (el: HTMLAnchorElement) => setGlider({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
  const settle = () => { const el = itemRefs.current[DOCK.findIndex((d) => d.active)]; if (el) { moveGlider(el); setLit(DOCK.findIndex((d) => d.active)); } };
  useLayoutEffect(() => {
    settle();
    window.addEventListener('resize', settle);
    (document as any).fonts?.ready?.then(settle);
    return () => window.removeEventListener('resize', settle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&display=swap" rel="stylesheet" />

      <div className="dlst">
        <div className="shell" data-screen-label="Danışanlar Listesi">

          {/* ÜST BAR */}
          <div className="topbar">
            <div className="brand"><span className="logo"><b>Calmie</b><i>.</i></span></div>
            <nav className="dock" ref={dockRef} aria-label="Bölümler" onMouseLeave={settle}>
              <span className="glider" style={{ left: glider.left, top: glider.top, width: glider.width, height: glider.height }} />
              {DOCK.map((d, i) => (
                <a key={d.key} href="#" ref={(el) => { itemRefs.current[i] = el; }}
                  className={i === lit ? 'lit' : undefined}
                  onMouseEnter={(e) => { moveGlider(e.currentTarget); setLit(i); }}
                  onClick={(e) => { e.preventDefault(); if (d.active) props.onBack?.(); else props.onNav?.(d.key); }}>
                  {d.label}
                </a>
              ))}
            </nav>
            <div className="topbar-right">
              <button className="tb-new" type="button" onClick={() => props.onNewClient?.()}>{Ico.plus}Yeni danışan</button>
              <div className="tb-prof" title="Göksel Akkaya">GA</div>
            </div>
          </div>

          <div className="modal-body">
            <div className="wrap">

              {/* BAŞLIK + İSTATİSTİK */}
              <section className="intro">
                <div>
                  <a className="back" href="#" onClick={(e) => { e.preventDefault(); props.onBack?.(); }}>
                    <span className="chev">‹</span><span>Çalışma Alanı</span>
                  </a>
                  <h1 className="page-title">Danışanlar <span>({clients.length})</span></h1>
                  <p className="lead">Tüm danışanlarını tek bakışta gör; duruma, etikete ya da sıradaki seansa göre süz. Süreklilik ve risk göstergeleri her kartta.</p>
                </div>
                <div className="stats">
                  <div className="stat is-aktif"><div className="sv num">{stats.active}</div><div className="sl">Aktif</div><div className="ss">takip ediliyor</div></div>
                  <div className="stat is-riskli"><div className="sv num">{stats.risk}</div><div className="sl">Riskli</div><div className="ss">öncelikli</div></div>
                  <div className="stat is-gorulmus"><div className="sv num">{stats.total}</div><div className="sl">Bugüne kadar görülen</div><div className="ss">farklı danışan</div></div>
                </div>
              </section>

              {/* ARAÇ ÇUBUĞU */}
              <div className="toolbar">
                <div className="tb-row">
                  <label className="search">{Ico.search}
                    <input type="search" placeholder="İsim, etiket veya not ara…" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
                  </label>
                  <select className="sort" aria-label="Sıralama" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                    <option value="next">Sıradaki seansa göre</option>
                    <option value="recent">Son seansa göre</option>
                    <option value="name">İsme göre (A–Z)</option>
                    <option value="progress">Süreç haritalandırması</option>
                  </select>
                  <div className="view-toggle" role="group" aria-label="Görünüm">
                    <button type="button" aria-pressed={view === 'rows'} title="Liste görünümü" aria-label="Liste görünümü" onClick={() => setViewPersist('rows')}>{Ico.rows}</button>
                    <button type="button" aria-pressed={view === 'grid'} title="Kart görünümü" aria-label="Kart görünümü" onClick={() => setViewPersist('grid')}>{Ico.grid}</button>
                  </div>
                </div>
                <div className="tb-row">
                  <div className="seg" role="group" aria-label="Yaş grubu filtresi">
                    <span className="sl">Yaş</span>
                    {(['all', 'ergen', 'yetiskin', 'cocuk'] as CatFilter[]).map((k) => (
                      <button type="button" key={k} aria-pressed={cat === k} onClick={() => setCat(k)}>{{ all: 'Tümü', ergen: 'Ergen', yetiskin: 'Yetişkin', cocuk: 'Çocuk' }[k]}</button>
                    ))}
                  </div>
                  <div className="seg" role="group" aria-label="Durum filtresi">
                    <span className="sl">Durum</span>
                    {(['all', 'active', 'passive', 'risk'] as StatusFilter[]).map((k) => (
                      <button type="button" key={k} aria-pressed={status === k} onClick={() => setStatus(k)}>{{ all: 'Tümü', active: 'Aktif', passive: 'Pasif', risk: 'Riskli' }[k]}</button>
                    ))}
                  </div>
                  {tagOptions.length > 0 && (
                    <div className="tagbar" aria-label="Etikete göre filtrele">
                      <span className="tb-lbl">Etiket</span>
                      {tagOptions.map(([key, label]) => (
                        <button type="button" key={key} className="chip" aria-pressed={tag === key} onClick={() => setTag(tag === key ? null : key)}>
                          <span className="dot" style={{ background: `var(--tag-${key})` }} />{label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <p className="count-line">{loading ? 'Yükleniyor…' : `${visible.length} danışan${filtered ? ' · filtreli' : ''}`}</p>

              {loading ? (
                <div className={`list ${view === 'rows' ? 'is-rows' : 'is-grid'} skeleton`}>
                  {Array.from({ length: view === 'rows' ? 7 : 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : visible.length === 0 ? (
                <div className="empty">
                  <div className="ic">{Ico.search}</div>
                  <h3>{filtered ? 'Sonuç bulunamadı' : 'Henüz danışan yok'}</h3>
                  <p>{filtered ? 'Arama veya filtreleri değiştirmeyi dene.' : 'İlk danışanını ekleyerek başla.'}</p>
                  <button type="button" className="empty-btn" onClick={() => (filtered ? resetFilters() : props.onNewClient?.())}>
                    {filtered ? 'Filtreleri temizle' : 'Yeni danışan'}
                  </button>
                </div>
              ) : (
                <div className={`list ${view === 'rows' ? 'is-rows' : 'is-grid'}`} aria-live="polite">
                  {visible.map((c) => (
                    <CardRow key={c.id} c={c} today={today} onOpen={open} onPrefetch={prefetch} onMail={doMail} onSms={doSms} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SMS MODAL */}
          {sms && (
            <SmsModal
              client={sms}
              onClose={() => setSms(null)}
              onSent={(n) => { showToast('SMS gönderildi → ' + n); setSms(null); }}
              onError={(m) => showToast(m, true)}
            />
          )}

          {/* TOAST */}
          {toast && (
            <div className={`toast show${toast.warn ? ' warn' : ''}`}><span className="tdot" /><span>{toast.msg}</span></div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Kart / satır ────────────────────────────────────────────────────── */
function CardRow({ c, today, onOpen, onPrefetch, onMail, onSms }: {
  c: Client; today: Date; onOpen: (id: string) => void; onPrefetch: (id: string) => void;
  onMail: (e: React.MouseEvent, c: Client) => void; onSms: (e: React.MouseEvent, c: Client) => void;
}) {
  const st = mapStatus(c);
  const nx = relNext(c.nextAppointment, today);
  const keys = detectKeys(c);
  const dotVar = keys.length ? `var(--tag-${keys[0]})` : 'var(--tag-default)';
  const prog = Math.max(0, Math.min(100, Math.round(c.continuityPct || 0)));
  const hasMail = !!c.email?.trim();
  const hasPhone = !!c.telefon?.trim();
  const badge = <span className={`status status--${st}`}><span className="dot" />{statusLabel[st]}</span>;
  return (
    <article className="card" tabIndex={0} role="button" aria-label={`${c.name} dosyasını aç`}
      onClick={(e) => { if ((e.target as HTMLElement).closest('[data-stop]')) return; onOpen(c.id); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(c.id); } }}
      onMouseEnter={() => onPrefetch(c.id)}>
      <div className="c-head">
        <div className="c-id">
          <div className="c-name">{c.name}</div>
          <div className="c-meta">V-{1000 + Number(c.id) || c.id}</div>
        </div>
        {badge}
      </div>
      <div className="c-tags" title={tagText(c)}><span className="tg-dot" style={{ background: dotVar }} /><span className="tg-txt">{tagText(c)}</span></div>
      <div className="c-sessions">
        <div><span className="lbl">Son görüşme</span><span className="val">{fmt(c.lastSession)}</span></div>
        <div><span className="lbl">Sıradaki</span><span className={`val ${nx.up ? '' : 'muted'}`}>{nx.text}</span></div>
      </div>
      <div className="c-progress">
        <div className="row"><span className="pl">Süreç haritalandırması</span><span className="pv num">%{prog}</span></div>
        <div className="bar"><i style={{ width: `${prog}%` }} /></div>
      </div>
      <div className="c-status-cell">{badge}</div>
      <div className="c-foot">
        <button type="button" className={`act ${hasMail ? '' : 'off'}`} data-stop title={hasMail ? 'E-posta gönder' : 'E-posta kayıtlı değil'} onClick={(e) => onMail(e, c)}>{Ico.mail}<span className="act-label">E-posta</span></button>
        <button type="button" className={`act primary ${hasPhone ? '' : 'off'}`} data-stop title={hasPhone ? 'SMS gönder' : 'Telefon kayıtlı değil'} onClick={(e) => onSms(e, c)}>{Ico.sms}<span className="act-label">SMS</span></button>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <article className="card">
      <div className="c-head"><div style={{ flex: 1 }}><div className="sk line" style={{ width: '55%' }} /><div className="sk line" style={{ width: '32%', marginTop: 9, height: 9 }} /></div>
        <div className="sk line" style={{ width: 64, height: 22, borderRadius: 999 }} /></div>
      <div className="sk line" style={{ width: '60%' }} />
      <div className="sk line" style={{ width: '48%' }} />
      <div className="sk line" style={{ width: '100%', height: 6 }} />
      <div className="sk line" style={{ width: '100%', height: 34, borderRadius: 12 }} />
    </article>
  );
}

/* ─── SMS modal — gerçek /api/sms ile ─────────────────────────────────── */
function SmsModal({ client, onClose, onSent, onError }: {
  client: Client; onClose: () => void; onSent: (name: string) => void; onError: (msg: string) => void;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { taRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const r = await fetch('/api/sms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: client.telefon, name: client.name, message: text.trim(), trigger_type: 'manual' }),
      });
      const d = await r.json().catch(() => ({}));
      if (d?.ok) onSent(client.name);
      else { setSending(false); onError(d?.error || 'SMS gönderilemedi.'); }
    } catch (e: any) { setSending(false); onError(e?.message ?? 'Ağ hatası.'); }
  }
  return (
    <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sms-modal" role="dialog" aria-modal="true" aria-labelledby="smsName">
        <button type="button" className="sms-x" aria-label="Kapat" onClick={onClose}>×</button>
        <div className="sms-head">
          <span className="eyebrow">SMS gönder</span>
          <h3 id="smsName">{client.name}</h3>
          <span className="ph mono">{client.telefon}</span>
        </div>
        <textarea ref={taRef} maxLength={400} placeholder="Mesajını yaz…" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="sms-foot">
          <span className="counter mono">{text.length}/400</span>
          <button type="button" className="sms-send" disabled={text.trim().length === 0 || sending} onClick={send}>{sending ? 'Gönderiliyor…' : 'SMS gönder'}</button>
        </div>
      </div>
    </div>
  );
}
