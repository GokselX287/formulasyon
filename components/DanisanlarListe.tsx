'use client';

/* =====================================================================
   DanisanlarListe.tsx — "Danışanlar (landing uyumlu)" danışan dizini.
   Kök <div className="dlst"> (CSS .dlst altında kapsüllü). Görsel kaynak:
   REFERANS_birebir.html (Cv görsel-38) — Ana Sayfa landing diliyle aynı kabuk.
   Veri uygulamanın gerçek Client modelinden gelir; uydurma yok.
   ===================================================================== */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './DanisanlarListe.css';
import {
  Client, Status, statusLabel, mapStatus, category, detectKeys, tagText, noteText,
  fmt, relNext, computeStats, CANON_LABEL,
} from './danisanlarListe.helpers';

export type DanisanlarListeProps = {
  clients: Client[];
  onBack?(): void;
  onNav?(target: string): void;            // 'home' | 'calendar' | 'profil' | 'ayarlar'
  onNewClient?(): void;
  onOpenClient?(id: string): void;         // → /danisan/[id]
  onPrefetchClient?(id: string): void;
  onMail?(id: string): void;
  onSms?(id: string): void;
};

type StatusFilter = 'all' | Status;
type CatFilter = 'all' | 'ergen' | 'yetiskin' | 'cocuk';
type Sort = 'next' | 'recent' | 'name' | 'progress';

const FONTS = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap';

// Etiket renk noktaları (yeni palet) — danisanlarListe.helpers detectKeys anahtarlarıyla eşli
const TAG_HEX: Record<string, string> = {
  anksiyete: '#6E9E7E', depresyon: '#5E8E9E', okb: '#9A7FC0', travma: '#CC6E5C',
  iliski: '#D08FB0', panik: '#C2A45E', yas: '#8A8FA8', mukemmel: '#C97B5A',
};
const tagHex = (k: string) => TAG_HEX[k] || '#9FA89A';

const THEMES = [
  { id: 'sage', dot: '#8FB58C' }, { id: 'ocean', dot: '#5FA9C0' }, { id: 'dusk', dot: '#9A7FD0' },
  { id: 'clay', dot: '#D78C66' }, { id: 'rose', dot: '#C97FA0' },
];

const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* yoksay */ } };
const clientNo = (c: Client) => { const n = Number(c.id); return Number.isFinite(n) ? `V-${1000 + n}` : String(c.id); };

/* ─── İkonlar ─────────────────────────────────────────────────────────── */
const IcoSearch = () => <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>;
const IcoMail = () => <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M4 7l8 6 8-6" strokeLinecap="round" /></svg>;
const IcoSms = () => <svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-6A8.4 8.4 0 1 1 21 11.5z" strokeLinejoin="round" /></svg>;

type Toast = { id: number; msg: string; warn?: boolean };

export default function DanisanlarListe(props: DanisanlarListeProps) {
  const { clients } = props;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [cat, setCat] = useState<CatFilter>('all');
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('next');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sms, setSms] = useState<Client | null>(null);
  const [theme, setTheme] = useState('sage');
  const [mobileMenu, setMobileMenu] = useState(false);

  const today = useMemo(() => new Date(), []);
  const toastId = useRef(0);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 420); return () => clearTimeout(t); }, []);
  useEffect(() => { const saved = lsGet('calmie-theme'); if (saved && THEMES.some((t) => t.id === saved)) setTheme(saved); }, []);

  const applyTheme = (id: string) => { setTheme(id); lsSet('calmie-theme', id); };

  const stats = useMemo(() => computeStats(clients), [clients]);

  /* Etikete sahip kanonik anahtarlar (veriden türer; yoksa çubuk gizli) */
  const tagOptions = useMemo(() => {
    const seen = new Map<string, string>();
    clients.forEach((c) => detectKeys(c).forEach((k) => { if (!seen.has(k)) seen.set(k, CANON_LABEL[k] || k); }));
    return [...seen];
  }, [clients]);

  const hasFilter = !!(q || tag || status !== 'all' || cat !== 'all');

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
  function showToast(msg: string, warn?: boolean) {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, msg, warn }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }

  /* ─── Aksiyonlar ──────────────────────────────────────────────────── */
  const open = (id: string) => props.onOpenClient?.(id);
  function doMail(e: React.MouseEvent, c: Client) {
    e.stopPropagation();
    if (props.onMail) return props.onMail(c.id);
    if (c.email?.trim()) { window.location.href = 'mailto:' + c.email.trim(); }
    else showToast('Bu danışan için kayıtlı e-posta yok.', true);
  }
  function doSms(e: React.MouseEvent, c: Client) {
    e.stopPropagation();
    if (props.onSms) return props.onSms(c.id);
    if (c.telefon?.trim()) setSms(c);
    else showToast('Bu danışan için kayıtlı telefon yok.', true);
  }
  function clearFilters() { setQ(''); setStatus('all'); setCat('all'); setTag(null); }

  const AGE_SEG: { v: CatFilter; label: string }[] = [
    { v: 'all', label: 'Tümü' }, { v: 'ergen', label: 'Ergen' }, { v: 'yetiskin', label: 'Yetişkin' }, { v: 'cocuk', label: 'Çocuk' },
  ];
  const STATUS_SEG: { v: StatusFilter; label: string }[] = [
    { v: 'all', label: 'Tümü' }, { v: 'active', label: 'Aktif' }, { v: 'passive', label: 'Pasif' }, { v: 'risk', label: 'Riskli' },
  ];

  const skelCount = 7;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={FONTS} rel="stylesheet" />

      <div className="dlst" data-theme={theme === 'sage' ? undefined : theme} data-screen-label="Danışanlar — Calmie (liste)">
        <div className="scene" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        {/* ───────── NAV ───────── */}
        <div className="navwrap">
          <nav className="nav" aria-label="Birincil">
            <a className="logo" onClick={() => props.onNav?.('home')}>Calmie<i>.</i></a>
            <div className="nav-links">
              <a onClick={() => props.onNav?.('home')}>Ana Sayfa</a>
              <a onClick={() => props.onNav?.('calendar')}>Takvim</a>
              <a className="active" onClick={() => props.onBack?.()}>Çalışma Alanı</a>
              <a onClick={() => props.onNav?.('profil')}>Profil</a>
            </div>
            <div className="nav-actions">
              <button className="nav-new" type="button" onClick={() => props.onNewClient?.()}>
                <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg><span>Yeni danışan</span>
              </button>
              <a className="nav-av" onClick={() => props.onNav?.('profil')}>GA</a>
            </div>
            <button className="menu-btn" aria-label="Menü" onClick={() => setMobileMenu((v) => !v)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </nav>
          <div className={'mobile-menu' + (mobileMenu ? ' open' : '')}>
            <a onClick={() => { setMobileMenu(false); props.onNav?.('home'); }}>Ana Sayfa</a>
            <a onClick={() => { setMobileMenu(false); props.onNav?.('calendar'); }}>Takvim &amp; Randevular</a>
            <a onClick={() => { setMobileMenu(false); props.onBack?.(); }}>Çalışma Alanı</a>
            <a onClick={() => { setMobileMenu(false); props.onNav?.('profil'); }}>Profil</a>
          </div>
        </div>

        <main className="page">
          <div className="wrap">

            {/* ───────── HEAD ───────── */}
            <div className="head">
              <div className="head-l">
                <a className="back" onClick={() => props.onBack?.()}><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>Çalışma Alanı</a>
                <h1 className="head-title"><b>Danışanlar</b> <em>({clients.length})</em></h1>
                <p className="head-lead">Tüm danışanlarını tek bakışta gör; duruma, etikete ya da sıradaki seansa göre süz. Süreklilik ve risk göstergeleri her kartta.</p>
              </div>
              <div className="stats">
                <div className="stat active"><div className="stat-num">{stats.active}</div><div><div className="stat-lab">Aktif</div><div className="stat-sub">takip ediliyor</div></div></div>
                <div className="stat risk"><div className="stat-num">{stats.risk}</div><div><div className="stat-lab">Riskli</div><div className="stat-sub">öncelikli</div></div></div>
                <div className="stat dark"><div className="stat-num">{stats.total}</div><div><div className="stat-lab">Bugüne kadar görülen</div><div className="stat-sub">farklı danışan</div></div></div>
              </div>
            </div>

            {/* ───────── TOOLBAR ───────── */}
            <div className="toolbar">
              <div className="tb-row">
                <label className="search">
                  <IcoSearch />
                  <input type="text" placeholder="İsim, etiket veya not ara…" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
                </label>
                <div className="sortwrap">
                  <select className="sort" aria-label="Sıralama" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                    <option value="next">Sıradaki seansa göre</option>
                    <option value="recent">Son seansa göre</option>
                    <option value="name">İsme göre (A–Z)</option>
                    <option value="progress">Süreç haritalandırması</option>
                  </select>
                  <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
              <div className="tb-filters">
                <div className="fgroup">
                  <span className="flab">Yaş</span>
                  <div className="seg">
                    {AGE_SEG.map((s) => <button key={s.v} type="button" className={cat === s.v ? 'on' : ''} onClick={() => setCat(s.v)}>{s.label}</button>)}
                  </div>
                </div>
                <div className="fgroup">
                  <span className="flab">Durum</span>
                  <div className="seg">
                    {STATUS_SEG.map((s) => <button key={s.v} type="button" className={status === s.v ? 'on' : ''} onClick={() => setStatus(s.v)}>{s.label}</button>)}
                  </div>
                </div>
                {tagOptions.length > 0 && (
                  <div className="chips">
                    {tagOptions.map(([key, label]) => (
                      <button key={key} type="button" className={'chip' + (tag === key ? ' on' : '')} onClick={() => setTag(tag === key ? null : key)}>
                        <i style={{ background: tagHex(key) }} />{label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ───────── COUNT ───────── */}
            <div className="countline">
              {loading ? 'Yükleniyor…'
                : clients.length === 0 ? '0 danışan'
                : visible.length === 0 ? '0 sonuç · filtreli'
                : <>{visible.length} danışan{hasFilter && <> · filtreli<span className="clear" onClick={clearFilters}>temizle</span></>}</>}
            </div>

            {/* ───────── LIST / SKELETON / EMPTY ───────── */}
            {loading ? (
              <div className="skel show">
                {Array.from({ length: skelCount }).map((_, i) => <div key={i} className="skrow" />)}
              </div>
            ) : clients.length === 0 ? (
              <div className="empty show">
                <div className="empty-ic"><svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" strokeLinecap="round" /></svg></div>
                <h2 className="empty-t">Henüz danışan yok</h2>
                <p className="empty-d">İlk danışanını ekleyerek başla.</p>
                <button className="btn btn-primary" onClick={() => props.onNewClient?.()}>Yeni danışan</button>
              </div>
            ) : visible.length === 0 ? (
              <div className="empty show">
                <div className="empty-ic"><IcoSearch /></div>
                <h2 className="empty-t">Sonuç bulunamadı</h2>
                <p className="empty-d">Arama veya filtreleri değiştirmeyi dene.</p>
                <button className="btn btn-ghost" onClick={clearFilters}>Filtreleri temizle</button>
              </div>
            ) : (
              <div className="list" aria-live="polite">
                {visible.map((c) => (
                  <ClientCard key={c.id} c={c} today={today} onOpen={open} onPrefetch={props.onPrefetchClient} onMail={doMail} onSms={doSms} />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ───────── TEMA DOCK ───────── */}
        <div className="dock" aria-label="Renk teması">
          {THEMES.map((t) => (
            <button key={t.id} type="button" className={'dock-dot' + (theme === t.id ? ' on' : '')} style={{ background: t.dot }} aria-label={`${t.id} tema`} onClick={() => applyTheme(t.id)} />
          ))}
        </div>

        {/* ───────── SMS MODAL ───────── */}
        {sms && <SmsModal client={sms} onClose={() => setSms(null)}
          onSent={(n) => { showToast(n.split(' ')[0] + ' kişisine SMS gönderildi.'); setSms(null); }}
          onError={(m) => showToast(m, true)} />}

        {/* ───────── TOAST ───────── */}
        <div className="toast-wrap">
          {toasts.map((t) => (
            <div key={t.id} className={'toast show' + (t.warn ? ' warn' : '')}>
              {t.warn
                ? <svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              <span>{t.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── Danışan kartı / satırı ──────────────────────────────────────────── */
function ClientCard({ c, today, onOpen, onPrefetch, onMail, onSms }: {
  c: Client; today: Date; onOpen: (id: string) => void; onPrefetch?: (id: string) => void;
  onMail: (e: React.MouseEvent, c: Client) => void; onSms: (e: React.MouseEvent, c: Client) => void;
}) {
  const st = mapStatus(c);
  const keys = detectKeys(c);
  const rn = relNext(c.nextAppointment, today);
  const rnCls = !rn.up ? 'muted' : (/^(Bugün|Yarın)/.test(rn.text) ? 'next' : '');
  const prog = Math.max(0, Math.min(100, Math.round(c.continuityPct || 0)));
  const hasMail = !!c.email?.trim();
  const hasTel = !!c.telefon?.trim();
  const StatusBadge = () => (
    <span className={`cli-status ${st}`}><i />{statusLabel[st]}</span>
  );
  return (
    <article className="cli" role="button" tabIndex={0} aria-label={`${c.name} dosyasını aç`}
      onClick={(e) => { if ((e.target as HTMLElement).closest('.act')) return; onOpen(c.id); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(c.id); } }}
      onMouseEnter={() => onPrefetch?.(c.id)}>
      <div className="cli-head">
        <div className="cli-id">
          <span className="cli-name">{c.name} <span className="cli-no">{clientNo(c)}</span></span>
          <span className="cli-tags">
            {keys.length
              ? keys.map((k) => <span key={k} className="cli-tag"><i style={{ background: tagHex(k) }} />{CANON_LABEL[k] || k}</span>)
              : <span className="cli-issue">{tagText(c)}</span>}
          </span>
        </div>
      </div>

      <div className="cli-dates">
        <div className="cli-date"><span className="k">Son görüşme</span><span className={'v ' + (c.lastSession ? '' : 'muted')}>{fmt(c.lastSession)}</span></div>
        <div className="cli-date"><span className="k">Sıradaki</span><span className={'v ' + rnCls}>{rn.text}</span></div>
      </div>

      <div className="cli-prog">
        <div className="cli-prog-top"><span className="cli-prog-k">Süreç haritalandırması</span><span className="cli-prog-pct">%{prog}</span></div>
        <div className="cli-prog-track"><div className="cli-prog-fill" style={{ width: `${prog}%` }} /></div>
      </div>

      <StatusBadge />

      <div className="cli-foot">
        <div className="cli-acts">
          <button type="button" className={'act mail' + (hasMail ? '' : ' disabled')} aria-label="E-posta" title={hasMail ? 'E-posta gönder' : 'E-posta kayıtlı değil'} onClick={(e) => onMail(e, c)}><IcoMail /></button>
          <button type="button" className={'act sms' + (hasTel ? '' : ' disabled')} aria-label="SMS" title={hasTel ? 'SMS gönder' : 'Telefon kayıtlı değil'} onClick={(e) => onSms(e, c)}><IcoSms /></button>
        </div>
      </div>
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
  useEffect(() => { const t = setTimeout(() => taRef.current?.focus(), 60); return () => clearTimeout(t); }, []);
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
    <div className="modal-back show" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="smsName">
        <div className="modal-top">
          <div>
            <div className="modal-eye">SMS gönder</div>
            <div className="modal-name" id="smsName">{client.name}</div>
            <div className="modal-tel">{client.telefon}</div>
          </div>
          <button type="button" className="modal-x" aria-label="Kapat" onClick={onClose}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>
        <textarea ref={taRef} className="modal-ta" maxLength={400} placeholder="Mesajını yaz…" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="modal-count"><span>{text.length}</span> / 400</div>
        <div className="modal-acts">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Vazgeç</button>
          <button type="button" className="btn btn-primary" disabled={text.trim().length === 0 || sending} onClick={send}>{sending ? 'Gönderiliyor…' : 'SMS gönder'}</button>
        </div>
      </div>
    </div>
  );
}
