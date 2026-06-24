'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './MudahaleV2.css';
import type { Intervention, AssignTarget } from '@/lib/types';

// ──────────────────────────────────────────────────────────────────────────
// Müdahale Kütüphanesi — landing uyumlu ("mesh + opal cam") tasarım.
// Cv görsel-45 / design_handoff_mudahale_kutuphanesi portu. Anamnez (.anx) /
// Çocuk (.cdx) / Özet (.ozx) ile kardeş kabuk. Çalışma Alanı odası
// (?tab=calisma-alani&room=mudahale-kutuphanesi). Teknik kartları + ekol
// filtresi (sayaçlı) + arama + favori + seans sepeti + detay modalı
// (adımlar/kaynak/kişisel not/ata/PDF) + 5 temalı dock (sepet açıkken kalkar).
// Gerçek interventions; prop sözleşmesi (handler'lar) korunur.
// ──────────────────────────────────────────────────────────────────────────

export type MudahaleV2Props = {
  interventions: Intervention[];
  basket: string[];
  clients?: { id: string; name: string }[];
  onBack?(): void;
  onNav?(target: string): void;
  onToggleFavorite?(id: string): void;
  onAddToBasket?(id: string): void;
  onRemoveFromBasket?(id: string): void;
  onCreateSessionPlan?(ids: string[]): void;
  onSavePersonalNotes?(id: string, notes: string): void;
  onAssignToClient?(id: string, target: AssignTarget): void;
  onExportPdf?(id: string): void;
};

const DURATION_LABEL: Record<string, string> = { 'kisa': '≤10 dk', 'orta': '10–25 dk', 'uzun': '25 dk+', 'tam-seans': 'Tam seans' };
const FORMAT_LABEL: Record<string, string> = { 'seans-ici': 'Seans-içi', 'ev-odevi': 'Ev ödevi', 'psikoegitim': 'Psikoeğitim', 'calisma-kagidi': 'Çalışma kâğıdı' };
const EVIDENCE_LABEL: Record<string, string> = { 'rkc': 'RKÇ', 'sistematik-review': 'Sistematik review', 'klinik-kilavuz': 'Klinik kılavuz', 'vaka-serisi': 'Vaka serisi' };

const THEMES: [string, string][] = [['rose', '#E59FB6'], ['sage', '#9FBE96'], ['ocean', '#9DC4D6'], ['dusk', '#AEB2CC'], ['clay', '#E3A982']];
const NAV: { label: string; target: string; back?: boolean }[] = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Takvim', target: 'calendar' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', back: true },
  { label: 'Danışanlar', target: 'calisma-alani', back: true },
];

const catText = (it: Intervention) => (it.problems ?? []).slice(0, 3).join(' · ') || '—';
const steps = (it: Intervention) => it.protocol ?? [];
const srcText = (it: Intervention) => it.references?.[0]?.title ?? '';
const lc = (s: string) => s.toLocaleLowerCase('tr');

const ICON = {
  dur: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  fmt: <svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5z" /><path d="M9 12h6M9 16h6" strokeLinecap="round" /></svg>,
  evi: <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" /><path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" strokeLinejoin="round" /></svg>,
  heart: <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.6-9.5-9C1 9 2.3 5.5 5.7 5.5c2 0 3.3 1.2 4.3 2.6 1-1.4 2.3-2.6 4.3-2.6 3.4 0 4.7 3.5 3.2 6.5C19 16.4 12 21 12 21z" /></svg>,
  plus: <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>,
  check: <svg viewBox="0 0 24 24"><path d="M5 12l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  pdf: <svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" strokeLinecap="round" /></svg>,
  book: <svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M4 19a2 2 0 0 1 2-2h12" /></svg>,
  close: <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>,
};

export default function MudahaleV2(props: MudahaleV2Props) {
  const { interventions, basket, clients, onBack, onNav, onToggleFavorite, onAddToBasket, onRemoveFromBasket, onCreateSessionPlan, onSavePersonalNotes, onAssignToClient, onExportPdf } = props;
  const [ekol, setEkol] = useState('');           // '' = Tümü
  const [query, setQuery] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [theme, setTheme] = useState('rose');
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    try { const t = localStorage.getItem('calmie-theme'); if (t && THEMES.some(([x]) => x === t)) setTheme(t); } catch {}
  }, []);
  const applyTheme = (t: string) => { setTheme(t); try { localStorage.setItem('calmie-theme', t); } catch {} };

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2200);
  };

  const ekolOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    interventions.forEach((it) => { if (it.modality) counts[it.modality] = (counts[it.modality] || 0) + 1; });
    return Object.keys(counts).map((e) => ({ e, n: counts[e] }));
  }, [interventions]);
  const favCount = useMemo(() => interventions.filter((i) => i.favorite).length, [interventions]);

  const inBasket = (id: string) => basket.includes(id);
  const toggleBasket = (id: string) => { if (inBasket(id)) { onRemoveFromBasket?.(id); } else { onAddToBasket?.(id); showToast('Seans sepetine eklendi'); } };

  const visible = (it: Intervention) => {
    if (ekol && it.modality !== ekol) return false;
    if (favOnly && !it.favorite) return false;
    if (query) {
      const hay = lc(`${it.title} ${it.modality} ${(it.problems ?? []).join(' ')} ${steps(it).join(' ')} ${it.description ?? ''}`);
      if (!hay.includes(lc(query))) return false;
    }
    return true;
  };
  const rows = interventions.filter(visible);
  const open = openId ? interventions.find((it) => it.id === openId) ?? null : null;

  // Esc → modal kapat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenId(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Detay açıldığında not alanını senkronla
  useEffect(() => {
    const cur = openId ? interventions.find((i) => i.id === openId) : null;
    setNoteDraft(cur?.personalNotes ?? '');
    setNoteSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  // reveal — hero + toolbar (statik) için giriş animasyonu
  useEffect(() => {
    const root = rootRef.current; if (!root) return;
    const els = root.querySelectorAll('.reveal');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const saveNote = () => { if (open) { onSavePersonalNotes?.(open.id, noteDraft); setNoteSaved(true); } };
  const doAssign = (clientId: string) => {
    if (!open || !clientId) return;
    onAssignToClient?.(open.id, { clientId, when: 'sonraki-seans' });
    const c = clients?.find((x) => x.id === clientId);
    showToast(`${open.title} · ${c ? c.name : 'danışan'} için atandı`);
  };
  const doPdf = () => { if (open) { onExportPdf?.(open.id); showToast(`PDF hazırlanıyor — ${open.title}`); } };

  const navClick = (n: { target: string; back?: boolean }) => { setMobileMenu(false); if (n.back) onBack?.(); else onNav?.(n.target); };

  return (
    <>
    <div className="mkx" data-theme={theme} ref={rootRef}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />

      <div className="scene" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {/* NAV */}
      <div className="navwrap">
        <nav className="nav" aria-label="Birincil">
          <a className="logo" onClick={() => onNav?.('home')}>Calmie<i>.</i></a>
          <div className="nav-links">
            {NAV.map((n, i) => <a key={i} className={n.label === 'Çalışma Alanı' ? 'active' : ''} onClick={() => navClick(n)}>{n.label}</a>)}
          </div>
          <a className="nav-prof" onClick={() => onNav?.('terapist')}>
            <div className="np-col">
              <span className="pro-badge"><svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.3L21 9l-4.8 4.3L17.6 22 12 18.4 6.4 22l1.4-8.7L3 9l6.4-.7z" /></svg>PRO</span>
              <span className="np-name">Profil</span>
            </div>
            <span className="np-av"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.9"><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" strokeLinecap="round" /></svg></span>
          </a>
          <button className="menu-btn" aria-label="Menü" onClick={() => setMobileMenu((v) => !v)}><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
        </nav>
        <div className={'mobile-menu' + (mobileMenu ? ' open' : '')}>
          {NAV.map((n, i) => <a key={i} onClick={() => navClick(n)}>{n.label}</a>)}
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <span className="eyebrow hero-eye reveal"><span className="pulse" />Çalışma Alanı · Teknik &amp; protokol kitaplığı</span>
          <h1 className="hero-title reveal">Teknik &amp; <span className="ser">protokol</span> kitaplığı</h1>
          <p className="hero-lead reveal">Ekole göre süzülmüş kanıta dayalı teknikler. Bir kartı aç — uygulama adımları ve kaynağıyla; favorile, seans sepetine ekleyip danışana ata.</p>
          <div className="hero-stats reveal">
            <div className="hs"><b>{interventions.length}</b><span>Teknik</span></div>
            <div className="hs"><b>{ekolOptions.length}</b><span>Ekol</span></div>
            <div className="hs"><b>{favCount}</b><span>Favori</span></div>
          </div>
        </div>
      </section>

      {/* TOOLBAR */}
      <div className="toolwrap">
        <div className="wrap">
          <div className="toolbar reveal">
            <div className="tb-z">
              <div className="tb-row">
                <label className="search">
                  <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Teknik adı veya içerik ara…" aria-label="Teknik ara" />
                </label>
                <button className={'fav-toggle' + (favOnly ? ' on' : '')} type="button" aria-pressed={favOnly} onClick={() => setFavOnly((v) => !v)}>
                  {ICON.heart}Yalnız favoriler
                </button>
              </div>
              {ekolOptions.length > 0 && (
                <div className="chips" role="group" aria-label="Ekol filtresi">
                  <button className={'chip' + (ekol === '' ? ' on' : '')} type="button" onClick={() => setEkol('')}>Tümü<span className="ct">{interventions.length}</span></button>
                  {ekolOptions.map(({ e, n }) => (
                    <button key={e} className={'chip' + (ekol === e ? ' on' : '')} type="button" onClick={() => setEkol(e)}>{e}<span className="ct">{n}</span></button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIBRARY */}
      <section className="libwrap">
        <div className="wrap">
          {rows.length === 0 ? (
            <div className="empty">
              <div className="empty-ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M8 12h8" strokeLinecap="round" /></svg></div>
              <h3>Eşleşen teknik yok</h3>
              <p>Arama, ekol ya da favori filtresini değiştir.</p>
            </div>
          ) : (
            <div className="grid">
              {rows.map((it) => {
                const added = inBasket(it.id);
                return (
                  <article className="iv" key={it.id} role="button" tabIndex={0} aria-label={`${it.title} detayını aç`}
                    onClick={() => setOpenId(it.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenId(it.id); } }}>
                    <div className="iv-top">
                      <span className="iv-mod">{it.modality}</span>
                      <button className={'heart' + (it.favorite ? ' on' : '')} type="button" aria-label="Favori" aria-pressed={!!it.favorite} onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(it.id); }}>{ICON.heart}</button>
                    </div>
                    <h3 className="iv-title">{it.title}</h3>
                    <p className="iv-cat">{catText(it)}</p>
                    <div className="iv-meta">
                      <span className="badge">{ICON.dur}{DURATION_LABEL[it.duration] ?? it.duration}</span>
                      <span className="badge">{ICON.fmt}{FORMAT_LABEL[it.format] ?? it.format}</span>
                      <span className="badge">{ICON.evi}{EVIDENCE_LABEL[it.evidence] ?? it.evidence}</span>
                    </div>
                    <button className={'iv-add' + (added ? ' in' : '')} type="button" aria-label={added ? 'Sepette' : 'Sepete ekle'} onClick={(e) => { e.stopPropagation(); toggleBasket(it.id); }}>
                      {added ? ICON.check : ICON.plus}{added ? 'Sepette' : 'Sepete ekle'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <div className="footwrap">
        <footer>
          <div className="foot-grid">
            <div className="foot-brand">
              <span className="logo" onClick={() => onNav?.('home')}>Calmie<i style={{ fontStyle: 'italic', color: 'var(--txt-accent)' }}>.</i></span>
              <p>İşini profesyonel boyutta yapmak isteyen herkes için dijital klinik asistanı — sade, güvenli, bütüncül.</p>
            </div>
            <div className="foot-col">
              <h4>Panel</h4>
              <a onClick={() => onNav?.('home')}>Ana Sayfa</a>
              <a onClick={() => onNav?.('calendar')}>Takvim &amp; Randevular</a>
              <a onClick={() => onBack?.()}>Çalışma Alanı</a>
              <a onClick={() => onBack?.()}>Danışanlar</a>
            </div>
            <div className="foot-col">
              <h4>Hesap</h4>
              <a onClick={() => onNav?.('terapist')}>Profil</a>
              <a onClick={() => onNav?.('ayarlar')}>Ayarlar</a>
              <a onClick={() => onNav?.('terapist')}>Yardım</a>
            </div>
          </div>
          <div className="foot-bottom">
            <small>© 2026 Calmie. Tüm hakları saklıdır.</small>
            <div className="foot-legal"><a>KVKK</a><a>Gizlilik Politikası</a><a>Kullanım Koşulları</a></div>
          </div>
        </footer>
      </div>
      </div>{/* /.mkx */}

      {/* Overlay'ler body'ye portal'lanır — uygulamanın `animate-fade-in` transform'u
          "fixed"i içerik kutusuna hapsediyor; portal ile gerçek viewport'a sabitlenir. */}
      {mounted && createPortal(
      <div className="mkx mkx-portal" data-theme={theme}>

      {/* SEPET ÇUBUĞU */}
      <div className={'basket' + (basket.length ? ' show' : '')} role="region" aria-label="Seans sepeti">
        <div className="basket-l">
          <span className="basket-ic"><svg viewBox="0 0 24 24"><path d="M5 8h14l-1 11a2 2 0 0 1-2 1.8H8A2 2 0 0 1 6 19L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg></span>
          <div className="basket-tx">
            <div className="basket-n"><b>{basket.length}</b> teknik sepette</div>
            <div className="basket-pills">
              {basket.map((id) => { const it = interventions.find((x) => x.id === id); if (!it) return null; return (
                <span className="bp" key={id}>{it.title}<button type="button" aria-label="Çıkar" onClick={() => onRemoveFromBasket?.(id)}>×</button></span>
              ); })}
            </div>
          </div>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => basket.length && onCreateSessionPlan?.(basket)}>Seans planı oluştur
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
      </div>

      {/* DETAY MODALI */}
      <div className={'modal-back' + (open ? ' show' : '')} onClick={(e) => { if (e.target === e.currentTarget) setOpenId(null); }}>
        {open && (
          <div className="modal" role="dialog" aria-modal="true" aria-label={open.title}>
            <div className="m-top">
              <span className="m-mod">{open.modality}</span>
              <button className="m-close" type="button" aria-label="Kapat" onClick={() => setOpenId(null)}>{ICON.close}</button>
            </div>
            <h2 className="m-title">{open.title}</h2>
            <p className="m-cat">{open.modality} · {(open.problems ?? []).join(' · ')}</p>
            {open.description && <p className="m-lede">{open.description}</p>}
            <div className="m-badges">
              <span className="badge">{ICON.dur}{DURATION_LABEL[open.duration] ?? open.duration}</span>
              <span className="badge">{ICON.fmt}{FORMAT_LABEL[open.format] ?? open.format}</span>
              <span className="badge">{ICON.evi}{EVIDENCE_LABEL[open.evidence] ?? open.evidence}</span>
            </div>

            {steps(open).length > 0 && (
              <>
                <p className="m-sec-h">Uygulama adımları</p>
                <ol className="steps">{steps(open).map((s, i) => <li key={i}><span>{s}</span></li>)}</ol>
              </>
            )}

            {srcText(open) && (
              <>
                <p className="m-sec-h">Kaynak</p>
                <div className="m-source">{ICON.book}<div className="m-source-tx"><span>Kanıt referansı</span><b>{srcText(open)}</b></div></div>
              </>
            )}

            {onSavePersonalNotes && (
              <>
                <p className="m-sec-h">Kişisel notlar</p>
                <textarea className="m-note" value={noteDraft} onChange={(e) => { setNoteDraft(e.target.value); setNoteSaved(false); }} placeholder="Bu teknikle ilgili kişisel notların…" />
                <div className="m-note-row"><button className={'m-save' + (noteSaved ? ' saved' : '')} type="button" onClick={saveNote}>{noteSaved ? 'Kaydedildi ✓' : 'Notu kaydet'}</button></div>
              </>
            )}

            <div className="m-actions">
              <button className={'m-icon-btn m-fav' + (open.favorite ? ' on' : '')} type="button" aria-label={open.favorite ? 'Favoride' : 'Favorile'} title={open.favorite ? 'Favoride' : 'Favorile'} onClick={() => onToggleFavorite?.(open.id)}>{ICON.heart}</button>
              <button className={'btn ' + (inBasket(open.id) ? 'btn-ghost' : 'btn-primary')} type="button" onClick={() => toggleBasket(open.id)}>
                {inBasket(open.id) ? ICON.check : ICON.plus}{inBasket(open.id) ? 'Sepetten çıkar' : 'Seans sepetine ekle'}
              </button>
              {onAssignToClient && clients && clients.length > 0 && (
                <span className="m-assign"><select aria-label="Danışana ata" value="" onChange={(e) => { doAssign(e.target.value); e.currentTarget.value = ''; }}>
                  <option value="">Danışana ata…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></span>
              )}
              {onExportPdf && <button className="m-icon-btn" type="button" aria-label="PDF olarak dışa aktar" title="PDF" onClick={doPdf}>{ICON.pdf}</button>}
            </div>
          </div>
        )}
      </div>

      {/* TOAST */}
      <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>

      {/* TEMA DOCK (sepet açıkken kalkar) */}
      <div className={'dock' + (basket.length ? ' lifted' : '')} aria-label="Renk teması">
        {THEMES.map(([t, col]) => <button key={t} type="button" className={'dock-dot' + (theme === t ? ' on' : '')} style={{ background: col }} title={t} aria-label={`${t} tema`} onClick={() => applyTheme(t)} />)}
      </div>

      </div>,
      document.body)}
    </>
  );
}
