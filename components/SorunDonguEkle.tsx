'use client';

import { useEffect, useRef, useState } from 'react';
import { DIAGRAMS, DiagramViewer, type DiagramType } from '@/components/BozuklukDongusu';
import { BDX_DEFS } from '@/lib/bdxDefs';
import './CalmieChrome.css';
import './AnamnezV2.css';  // .sd-* döngü içerik stilleri burada (modül grafiğinde zaten var)

// ──────────────────────────────────────────────────────────────────────────
// Profesyonel Formülasyon Adımları → ADIM 01 · Sorun Döngüsü.
// Calmie "Klinik Dosya" kabuğu (Anamnez/Danışanlar ile aynı dil): tema mesh +
// frosted scrim + üst dock + ortada yüzen modal kart. Döngüler BozuklukDongusu
// kütüphanesinden (DIAGRAMS) listelenir; eklenen döngü SQLite'a (client_cycles)
// yazılır, doldurma (DiagramViewer kontrollü) otomatik kaydedilir.
// Döngü her an eklenebilir — anamnez tamamlanma şartı YOK (kullanıcı kararı).
// ──────────────────────────────────────────────────────────────────────────

type Cycle = { id: string; client_id: string; type: string; label: string | null; fields_json: string | null; created_at: string; updated_at: string };

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Ayarlar', target: 'ayarlar' },
];
const DEFAULT_BG = '/calmie-hero-default.jpg';
const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };

export default function SorunDonguEkle({ clientId, clientName, clientNo, onBack, onNav }: {
  clientId: string; clientName?: string; clientNo?: string; onBack?: () => void; onNav?: (target: string) => void;
}) {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [view, setView] = useState<'list' | 'pick' | 'fill'>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // paylaşımlı tema + arkaplan görseli (Çalışma Alanı / Ana Sayfa ile aynı)
  const [theme] = useState<string>(() => lsGet('calmie_home_bgtheme') || 'default');
  const [bgPhoto] = useState<string | null>(() => lsGet('siyi_home_bg_v1'));

  // ── dock glider (Ana Sayfa ile aynı) ──
  const menuRef = useRef<HTMLElement>(null);
  const gliderRef = useRef<HTMLSpanElement>(null);
  const activeLink = () => (menuRef.current?.querySelector('a.active') || menuRef.current?.querySelector('a')) as HTMLElement | null;
  const moveGlider = (a: HTMLElement | null, instant = false) => {
    const g = gliderRef.current; if (!g || !a) return;
    if (instant) g.style.transition = 'none';
    g.style.width = a.offsetWidth + 'px';
    g.style.transform = `translateX(${a.offsetLeft}px)`;
    g.classList.add('on');
    menuRef.current?.querySelectorAll('a').forEach((l) => l.classList.toggle('lit', l === a));
    if (instant) { void g.offsetWidth; g.style.transition = ''; }
  };
  useEffect(() => {
    moveGlider(activeLink(), true);
    const onR = () => moveGlider(activeLink(), true);
    window.addEventListener('resize', onR);
    (document as any).fonts?.ready?.then(() => moveGlider(activeLink(), true));
    return () => window.removeEventListener('resize', onR);
  }, []);

  const load = () => fetch(`/api/danisan-dongu?clientId=${encodeURIComponent(clientId)}`)
    .then((r) => (r.ok ? r.json() : []))
    .then((d) => setCycles(Array.isArray(d) ? d : []))
    .catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [clientId]);

  const active = cycles.find((c) => c.id === activeId) || null;
  const addedTypes = new Set(cycles.map((c) => c.type));

  const addCycle = async (d: { id: DiagramType; label: string }) => {
    if (busy) return;
    setBusy(true);
    const r = await fetch('/api/danisan-dongu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, type: d.id, label: d.label }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (j.ok && j.cycle) { setCycles((p) => [...p, j.cycle]); setActiveId(j.cycle.id); setView('fill'); }
  };
  const delCycle = async (id: string) => {
    await fetch(`/api/danisan-dongu?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    setCycles((p) => p.filter((c) => c.id !== id));
    if (activeId === id) { setActiveId(null); setView('list'); }
  };

  // ── doldurma state + otomatik kayıt ──
  const [fields, setFields] = useState<Record<string, string>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (active) { try { setFields(JSON.parse(active.fields_json || '{}')); } catch { setFields({}); } }
    // eslint-disable-next-line
  }, [activeId]);
  const persist = (f: Record<string, string>) => {
    if (!activeId) return;
    fetch('/api/danisan-dongu', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: activeId, fields: f }) }).catch(() => {});
  };
  const onField = (k: string, v: string) => {
    setFields((prev) => {
      const nx = { ...prev, [k]: v };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(nx), 600);
      return nx;
    });
  };
  const leaveFill = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    persist(fields);
    setActiveId(null); setView('list');
  };
  // Hangi çıkış yoluyla olursa olsun son düzenlemeyi yaz.
  const latest = useRef({ activeId, fields });
  latest.current = { activeId, fields };
  useEffect(() => () => {
    const { activeId: a, fields: f } = latest.current;
    if (a) fetch('/api/danisan-dongu', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a, fields: f }), keepalive: true }).catch(() => {});
  }, []);

  const fmt = (s?: string | null) => { if (!s) return ''; try { return new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }); } catch { return ''; } };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&display=swap" rel="stylesheet" />

      <div className="an2 cchrome" data-bg={theme === 'default' ? undefined : theme}>
        {/* 1) tema mesh/foto zemin */}
        <div className="app-bg" aria-hidden="true">
          <span className="hb-mesh" />
          <img className="hb-photo" alt="" src={bgPhoto || DEFAULT_BG} />
          <img className="hb-cherry" alt="" src="/tema-cherry.jpg" /><span className="hb-cherry-scrim" />
          <img className="hb-fur" alt="" src="/tema-kurk.jpg" /><span className="hb-fur-scrim" />
          <span className="hb-tint" /><span className="hb-crest" /><span className="hb-grade" /><span className="hb-vignette" /><span className="hb-grain" />
        </div>
        {/* 2) frosted-glass scrim */}
        <div className="scrim" aria-hidden="true" />

        {/* üst dock */}
        <header className="page-menu">
          <span className="pm-brand"><b>Calmie</b><i>.</i></span>
          <nav className="pm-nav" aria-label="Sayfa menüsü" ref={menuRef} onMouseLeave={() => moveGlider(activeLink())}>
            <span className="pm-glider" ref={gliderRef} aria-hidden="true" />
            {DOCK.map((d) => (
              <a key={d.target} href="#" className={d.active ? 'active' : ''} onMouseEnter={(e) => moveGlider(e.currentTarget)} onClick={(e) => { e.preventDefault(); if (!d.active) onNav?.(d.target); }}>{d.label}</a>
            ))}
          </nav>
        </header>

        {/* 3) ortada yüzen modal kart */}
        <div className="modal-wrap">
          <div className="shell" role="dialog" aria-modal="true" aria-label="Sorun döngüsü">

            <div className="topbar">
              <div className="tb-left">
                <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Dosya</button>
                <div className="tb-title">
                  <span className="e">Profesyonel Formülasyon · Adımlar</span>
                  <b>{clientName || '—'}{clientNo ? ` · ${clientNo}` : ''}</b>
                </div>
              </div>
              <div className="tb-right">
                {view === 'fill'
                  ? <span className="sd-auto">otomatik kaydedilir</span>
                  : view === 'pick'
                    ? <span className="sd-count">{DIAGRAMS.length} model</span>
                    : null /* liste görünümünde ekleme butonu sayfanın ortasında — üstte tekrar gösterme */}
              </div>
            </div>

            <div className="formcol">
              <div className="sd-inner">

                {/* FILL — döngü doldurma */}
                {view === 'fill' && active && (
                  <>
                    <div className="sd-subbar">
                      <button className="sd-back" type="button" onClick={leaveFill}><span className="chev">‹</span>Döngülere dön</button>
                      <span className="sd-fill-label">{active.label || active.type}</span>
                    </div>
                    <div className="sd-fillcard">
                      <DiagramViewer type={active.type as DiagramType} fields={fields} onChange={onField} suggest />
                    </div>
                  </>
                )}

                {/* PICK — model kataloğu */}
                {view === 'pick' && (
                  <>
                    <div className="sd-subbar">
                      <button className="sd-back" type="button" onClick={() => setView('list')}><span className="chev">‹</span>Geri</button>
                      <span className="sd-sub-d">Danışanın sorununa uygun bir model seç</span>
                    </div>
                    <div className="sd-grid pick">
                      {DIAGRAMS.map((d) => {
                        const added = addedTypes.has(d.id);
                        return (
                          <button key={d.id} type="button" disabled={added || busy} onClick={() => addCycle(d)} className={`sd-pick${added ? ' added' : ''}`}>
                            <div className="sd-pick-top">
                              <span className="sd-pick-name">{d.label}</span>
                              <span className={`sd-pick-badge${added ? ' on' : ''}`}>{added ? 'eklendi' : d.tag}</span>
                            </div>
                            <div className="sd-pick-sub">{added ? 'Bu döngü zaten dosyada' : 'Ekle ve doldur →'}</div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* LIST — eklenen döngüler */}
                {view === 'list' && (
                  <>
                    <div className="sd-step">
                      <span className="sd-step-no">ADIM 01</span>
                      <span className="sd-step-t">Sorun döngüsü</span>
                      <span className="sd-step-d">— danışanın sorununa uygun bozukluk döngüsü modeli</span>
                    </div>

                    {cycles.length === 0 ? (
                      <div className="sd-empty">
                        <div className="sd-empty-t">Danışanın sorununa uygun bir döngü modeli ekleyerek formülasyona başla.</div>
                        <button className="sd-add" type="button" onClick={() => setView('pick')}>+ Sorun döngüsü ekle</button>
                      </div>
                    ) : (
                      <>
                        <div className="sd-bar">
                          <span className="sd-bar-l">{cycles.length} döngü eklendi</span>
                          <button className="sd-add sm" type="button" onClick={() => setView('pick')}>+ Başka bir sorunun döngüsünü ekle</button>
                        </div>
                        <div className="sd-grid">
                          {cycles.map((c) => {
                            let filled = 0; try { filled = Object.values(JSON.parse(c.fields_json || '{}')).filter((v) => String(v).trim()).length; } catch {}
                            const total = (BDX_DEFS[c.type as DiagramType]?.nodes || []).filter((n) => n.key).length;
                            const state = filled === 0 ? 'empty' : (total > 0 && filled < total) ? 'partial' : 'done';
                            return (
                              <div key={c.id} className={`sd-card${state === 'partial' ? ' warn' : ''}`}>
                                <div className="sd-card-top">
                                  <span className="sd-card-name">{c.label || c.type}</span>
                                  <button className="sd-del" type="button" aria-label="Sil" onClick={() => delCycle(c.id)}>×</button>
                                </div>
                                {state === 'partial' && (
                                  <span className="sd-card-badge warn"><span className="sd-badge-ic" aria-hidden>!</span>Yarım kaldı · {filled}/{total} alan</span>
                                )}
                                <div className="sd-card-meta">{state === 'done' ? `Tamamlandı · ${total}/${total} alan` : state === 'empty' ? 'Henüz boş' : `${filled} alan dolduruldu`} · {fmt(c.created_at)}</div>
                                <button className="sd-card-open" type="button" onClick={() => { setActiveId(c.id); setView('fill'); }}>{state === 'empty' ? 'Doldur' : state === 'partial' ? 'Tamamla' : 'Aç / düzenle'} →</button>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
