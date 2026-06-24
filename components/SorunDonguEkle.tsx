'use client';

import { useEffect, useRef, useState } from 'react';
import { DIAGRAMS, DiagramViewer, type DiagramType } from '@/components/BozuklukDongusu';
import { BDX_DEFS } from '@/lib/bdxDefs';
import './SorunDonguEkle.css';

// ──────────────────────────────────────────────────────────────────────────
// Profesyonel Formülasyon Adımları → ADIM 01 · Sorun Döngüsü.
// Landing uyumlu ("mesh + opal cam") kabuk (Ana Sayfa / Anamnez ile kardeş):
// mesh sahne + siyah sticky nav + mesh üst-şerit + tam-sayfa scroll + tema dock.
// 3 görünüm (list / pick / fill). Döngüler client_cycles'a yazılır; doldurma
// (DiagramViewer kontrollü, SVG motoru korunur) 600ms debounce ile autosave.
// Fill odak overlay'i BozuklukDongusu.tsx içinde (createPortal). Anamnez şartı YOK.
// ──────────────────────────────────────────────────────────────────────────

type Cycle = { id: string; client_id: string; type: string; label: string | null; fields_json: string | null; created_at: string; updated_at: string };

const NAV: { label: string; target: string }[] = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Takvim', target: 'calendar' },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
];
const THEMES: [string, string][] = [['rose', '#E59FB6'], ['sage', '#9FBE96'], ['ocean', '#9DC4D6'], ['dusk', '#AEB2CC'], ['clay', '#E3A982']];
const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };

export default function SorunDonguEkle({ clientId, clientName, clientNo, onBack, onNav }: {
  clientId: string; clientName?: string; clientNo?: string; onBack?: () => void; onNav?: (target: string) => void;
}) {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [view, setView] = useState<'list' | 'pick' | 'fill'>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState('rose');

  useEffect(() => { const t = lsGet('calmie-theme'); if (t && THEMES.some(([x]) => x === t)) setTheme(t); }, []);
  const applyTheme = (t: string) => { setTheme(t); try { localStorage.setItem('calmie-theme', t); } catch {} };

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
  const name = (clientName ?? '').trim() || 'Danışan';
  const initials = name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR') || 'DA';

  return (
    <div className="sde" data-theme={theme}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&display=swap" rel="stylesheet" />

      <div className="scene" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {/* NAV */}
      <div className="navwrap">
        <nav className="nav" aria-label="Birincil">
          <a className="logo" onClick={() => onNav?.('home')}>Calmie<i>.</i></a>
          <div className="nav-links">
            {NAV.map((n) => <a key={n.target} onClick={() => onNav?.(n.target)}>{n.label}</a>)}
            <a className="active" onClick={() => onBack?.()}>Danışanlar</a>
          </div>
          <a className="nav-prof" onClick={() => onNav?.('terapist')}>
            <div className="np-col">
              <span className="pro-badge"><svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.3L21 9l-4.8 4.3L17.6 22 12 18.4 6.4 22l1.4-8.7L3 9l6.4-.7z" /></svg>PRO</span>
              <span className="np-name">Profil</span>
            </div>
            <span className="np-av">{initials}</span>
          </a>
        </nav>
      </div>

      {/* TOPBAR */}
      <section className="topbar">
        <div className="wrap">
          <div className="crumb">
            <a onClick={() => onBack?.()}>Danışanlar</a>
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
            <a onClick={() => onBack?.()}>Dosya</a>
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
            <b>Sorun döngüsü</b>
          </div>
          <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Dosya</button>
          <div className="top-row">
            <div className="top-id">
              <div className="top-av">{initials}</div>
              <div className="top-meta">
                <div className="top-eye"><b>ADIM 01</b> · Profesyonel Formülasyon</div>
                <h1 className="top-name">{name}<span>{clientNo || ''}</span></h1>
              </div>
            </div>
            {view === 'fill' ? <span className="tb-note">otomatik kaydedilir</span>
              : view === 'pick' ? <span className="tb-note">{DIAGRAMS.length} model</span> : null}
          </div>
        </div>
      </section>

      {/* GÖVDE */}
      <section className="body">
        <div className="wrap">

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
      </section>

      {/* DOCK */}
      <div className="dock" aria-label="Renk teması">
        {THEMES.map(([t, c]) => <button key={t} type="button" className={'dock-dot' + (theme === t ? ' on' : '')} style={{ background: c }} title={t} aria-label={`${t} tema`} onClick={() => applyTheme(t)} />)}
      </div>
    </div>
  );
}
