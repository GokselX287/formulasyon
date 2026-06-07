'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './OzetInceleme.css';
import {
  EXTRACT as DEFAULT_EXTRACT, CONF_TXT, CONF_DOTS,
  type Extract, type ExtractResult, type Mode, type Field,
} from './ozetData';

// ──────────────────────────────────────────────────────────────────────────
// AI Özet → İnceleme & Onay — "Klinik Editöryel Dosya"
// "AI Özet İnceleme.html" birebir port; davranış orijinal JS'ten, .oz scope'lu.
// ──────────────────────────────────────────────────────────────────────────

export type OzetIncelemeProps = {
  data?: Extract;                 // gerçek çıkarım (yoksa örnek EXTRACT)
  initialMode?: Mode;
  onBack?(): void;
  onNav?(target: string): void;
  onSave?(payload: { mode: Mode; fields: Field[] }): void;
  onReExtract?(mode: Mode): Promise<Extract | null> | void;
};

const DOCK: { label: string; target: string; active?: boolean }[] = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

const clone = (r: ExtractResult): ExtractResult => {
  const c: ExtractResult = JSON.parse(JSON.stringify(r));
  c.groups.forEach((g) => g.fields.forEach((f) => { if (f.accepted === undefined) f.accepted = true; }));
  return c;
};

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);

export default function OzetInceleme(props: OzetIncelemeProps) {
  const source = props.data ?? DEFAULT_EXTRACT;
  const [mode, setMode] = useState<Mode>(props.initialMode ?? 'seans');
  const [result, setResult] = useState<ExtractResult>(() => clone(source[props.initialMode ?? 'seans']));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);
  const [activeRail, setActiveRail] = useState<string>('grp-0');
  const [thumb, setThumb] = useState<{ left: number; width: number }>({ left: 4, width: 0 });

  const modalBodyRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const valRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const optRefs = useRef<Record<Mode, HTMLButtonElement | null>>({ seans: null, anamnez: null });

  // Mod değişince çalışma kopyasını yeniden yükle
  const load = (m: Mode) => { setResult(clone(source[m])); setEditingId(null); setSaved(null); };
  const switchMode = (m: Mode) => { if (m === mode) return; setMode(m); load(m); };

  // Segmented thumb konumu
  useLayoutEffect(() => {
    const el = optRefs.current[mode];
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
  }, [mode, result]);
  useEffect(() => {
    const onResize = () => { const el = optRefs.current[mode]; if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth }); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mode]);

  // Scroll-spy (root = modal-body)
  useEffect(() => {
    const root = modalBodyRef.current;
    if (!root) return;
    const secs = Object.values(sectionRefs.current).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => { if (e.isIntersecting) setActiveRail((e.target as HTMLElement).id); }),
      { root, rootMargin: '-15% 0px -75% 0px', threshold: 0 },
    );
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [result]);

  // Düzenlemeye geçince odakla + içeriği seç
  useEffect(() => {
    if (!editingId) return;
    const el = valRefs.current[editingId];
    if (!el) return;
    el.focus();
    const r = document.createRange(); r.selectNodeContents(el);
    const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r);
  }, [editingId]);

  // ── türetilen sayaçlar ──
  const { acc, rej, edt } = useMemo(() => {
    let acc = 0, rej = 0, edt = 0;
    result.groups.forEach((g) => g.fields.forEach((f) => { f.accepted ? acc++ : rej++; if (f.edited) edt++; }));
    return { acc, rej, edt };
  }, [result]);

  // ── mutasyonlar ──
  const mutate = (fn: (draft: ExtractResult) => void) => {
    setResult((prev) => { const d = JSON.parse(JSON.stringify(prev)) as ExtractResult; fn(d); return d; });
    setSaved(null);
  };
  const toggleAccept = (gi: number, fi: number) => mutate((d) => { const f = d.groups[gi].fields[fi]; f.accepted = !f.accepted; });
  const bulk = (gi: number) => mutate((d) => { const g = d.groups[gi]; const allOn = g.fields.every((f) => f.accepted); g.fields.forEach((f) => (f.accepted = !allOn)); });

  const fid = (gi: number, fi: number) => `${gi}-${fi}`;
  const startEdit = (gi: number, fi: number) => {
    const id = fid(gi, fi);
    if (editingId === id) { valRefs.current[id]?.blur(); } else { setEditingId(id); }
  };
  const finishEdit = (gi: number, fi: number) => {
    const id = fid(gi, fi);
    if (editingId !== id) return;
    const el = valRefs.current[id];
    const newVal = (el?.textContent ?? '').trim();
    setEditingId(null);
    mutate((d) => { const f = d.groups[gi].fields[fi]; if (newVal !== f.value) { f.value = newVal; f.edited = true; } });
  };

  const reRun = async () => {
    if (busy) return;
    setBusy(true);
    if (props.onReExtract) {
      const fresh = await props.onReExtract(mode);
      if (fresh) setResult(clone(fresh[mode]));
      else load(mode);
    } else {
      await new Promise((r) => setTimeout(r, 650));
      load(mode);
    }
    setBusy(false);
  };

  const save = () => {
    const accepted = result.groups.flatMap((g) => g.fields).filter((f) => f.accepted);
    setSaved(accepted.length);
    props.onSave?.({ mode, fields: accepted });
  };

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id]; const mb = modalBodyRef.current;
    if (el && mb) mb.scrollTo({ top: el.getBoundingClientRect().top - mb.getBoundingClientRect().top + mb.scrollTop - 4, behavior: 'smooth' });
  };

  // ── rail öğeleri ──
  const railItems = [
    ...result.groups.map((g, i) => ({ id: `grp-${i}`, label: g.title.split(' · ')[0] })),
    { id: 'gaps-sec', label: 'Çıkarılamadı' },
  ];

  return (
    <>
      {/* Tasarım fontları (React head'e hoist eder) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="oz">
        <div className="shell">

          {/* ÜST BAR */}
          <div className="topbar">
            <button className="back" type="button" onClick={() => props.onBack?.()}>
              <span className="chev">‹</span><span>Çalışma Alanı</span>
            </button>
            <div className="topbar-right">
              <a className="print-link" href="#" onClick={(e) => { e.preventDefault(); if (typeof window !== 'undefined') window.print(); }}>Yazdır / PDF</a>
              <div className="audience" role="group" aria-label="Çıkarım modu">
                <span className="thumb" style={{ left: thumb.left, width: thumb.width }} />
                {(['seans', 'anamnez'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    ref={(el) => { optRefs.current[m] = el; }}
                    className="opt"
                    aria-pressed={mode === m}
                    onClick={() => switchMode(m)}
                    type="button"
                  >
                    {m === 'seans' ? 'Seans' : 'Anamnez'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-body" ref={modalBodyRef}>

            {/* HERO */}
            <div className="hero-banner">
              <div className="hero-inner">
                <div className="hero-eyebrow">{result.eyebrow}</div>
                <h1 className="hero-title">Özetten <i>çıkarıldı</i> — incele &amp; onayla</h1>
                <p className="hero-lead">AI serbest özetini alanlara çıkardı. Her öneri <b>güven skoru</b> ve <b>kaynak cümlesiyle</b> birlikte gelir. Düzenle, kabul ya da reddet — <b>yalnızca onayladıkların</b> kaydedilir.</p>

                <div className="privacy">
                  <span className="lk"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></span>
                  <span className="pt"><b>Kimliksizleştirildi</b> — gönderimden önce isim “Danışan” ile değiştirildi, şehir/kurum çıkarıldı. KVKK onamı: <span className="ok">ALINDI</span></span>
                </div>

                <div className="src-input">
                  <div className="si-head">
                    <span className="lbl">Serbest özet · kaynak metin</span>
                    <span className="live">{busy ? 'çıkarılıyor…' : 'AI çıkarımı tamamlandı'}</span>
                  </div>
                  <div className="si-text" key={mode} contentEditable suppressContentEditableWarning spellCheck={false}>{result.summary}</div>
                  <div className="si-bar">
                    <button className="si-mic" type="button"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>Dikte</button>
                    <button className={`si-run${busy ? ' busy' : ''}`} type="button" onClick={reRun}>{busy ? 'Çıkarılıyor…' : 'Yeniden çıkar ↻'}</button>
                  </div>
                </div>
              </div>
            </div>

            {/* ÇIKARILAN GRUPLAR */}
            <main className="main">
              {result.groups.map((g, gi) => {
                const parts = g.title.split(' · ');
                const total = g.fields.length;
                const on = g.fields.filter((f) => f.accepted).length;
                return (
                  <section className="section" id={`grp-${gi}`} key={gi} ref={(el) => { sectionRefs.current[`grp-${gi}`] = el; }} data-screen-label={g.title}>
                    <div className="sec-head">
                      <div className="l">
                        <span className="eyebrow">{parts[0]}</span>
                        <h2 className="sec-title">{parts[1] ? <>{parts[0]} <i>{parts[1]}</i></> : g.title}</h2>
                      </div>
                      <div className="sec-meta">
                        <span className="ct">{on}/{total} alan</span>
                        <button className="bulk" type="button" onClick={() => bulk(gi)}>{on === total ? 'Tümünü bırak' : 'Tümünü seç'}</button>
                      </div>
                    </div>
                    <div className="fld-grid">
                      {g.fields.map((f, fi) => {
                        const id = fid(gi, fi);
                        const cls = ['fld', f.accepted ? '' : 'off', f.conf === 'lo' ? 'lo' : '', f.edited ? 'edited' : ''].filter(Boolean).join(' ');
                        return (
                          <div className={cls} key={fi}>
                            <button className="chk" type="button" aria-label="kabul" onClick={() => toggleAccept(gi, fi)}><Check /></button>
                            <div className="fld-body">
                              <div className="fld-key">{f.key}</div>
                              <div
                                className="fld-val"
                                ref={(el) => { valRefs.current[id] = el; }}
                                contentEditable={editingId === id}
                                suppressContentEditableWarning
                                onBlur={() => finishEdit(gi, fi)}
                              >
                                {f.chips ? f.chips.map((c, i) => <span className="pill" key={i}>{c}</span>) : f.value}
                              </div>
                              <div className="fld-src"><span className="sl">kaynak</span><span className="sq">{f.src}</span></div>
                            </div>
                            <div className="fld-right">
                              <span className="edited-badge">düzenlendi</span>
                              <span className={`conf ${f.conf}`}>{CONF_TXT[f.conf]}<span className="dots">{Array.from({ length: 3 }, (_, i) => <i key={i} className={i < CONF_DOTS[f.conf] ? 'on' : ''} />)}</span></span>
                              {!f.chips && <button className={`edit-btn${editingId === id ? ' editing' : ''}`} type="button" onClick={() => startEdit(gi, fi)}>{editingId === id ? 'Bitti' : 'Düzenle'}</button>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {/* ÇIKARILAMADI */}
              <section className="section" id="gaps-sec" ref={(el) => { sectionRefs.current['gaps-sec'] = el; }} data-screen-label="Çıkarılamadı">
                <div className="sec-head">
                  <div className="l">
                    <span className="eyebrow">Çıkarılamadı</span>
                    <h2 className="sec-title">Terapist <i>girsin</i></h2>
                  </div>
                </div>
                <div className="gaps">
                  <div className="gaps-chips">{result.gaps.map((c, i) => <span className="chip" key={i}>{c}</span>)}</div>
                  <p className="gaps-note" dangerouslySetInnerHTML={{ __html: result.gapsNote }} />
                </div>
              </section>
            </main>

            {/* STICKY ONAY BARI */}
            <div className="approve">
              <div className="approve-inner">
                <div className="ap-summary">
                  <span className="ap-stat"><b>{acc}</b><span className="k">kabul</span></span>
                  <span className="ap-div" />
                  <span className={`ap-stat${rej ? ' lo' : ''}`}><b>{rej}</b><span className="k">reddedildi</span></span>
                  <span className="ap-div" />
                  <span className="ap-stat"><b>{edt}</b><span className="k">düzenlendi</span></span>
                </div>
                <div className="ap-acts">
                  <button className="ghost" type="button" onClick={() => load(mode)}>Sıfırla</button>
                  <button className={`save${saved !== null ? ' done' : ''}`} type="button" onClick={save}>
                    <Check />
                    <span>{saved !== null ? `${saved} alan kaydedildi ✓` : 'Onayla & kaydet'}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>{/* /modal-body */}

          <nav className="railnav" aria-label="Bölümler">
            {railItems.map((it) => (
              <a key={it.id} className={`rn-item${activeRail === it.id ? ' active' : ''}`} href={`#${it.id}`} onClick={(e) => { e.preventDefault(); scrollTo(it.id); }}>
                <span className="rn-label">{it.label}</span>
                <span className="rn-tick" />
              </a>
            ))}
          </nav>

          <nav className="dock">
            {DOCK.map((d) => (
              <a key={d.target} href="#" className={d.active ? 'active' : ''} onClick={(e) => { e.preventDefault(); props.onNav?.(d.target); }}>{d.label}</a>
            ))}
          </nav>

        </div>
      </div>
    </>
  );
}
