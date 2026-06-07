'use client';

import { useEffect, useRef, useState } from 'react';
import './AnaSayfa.css';
import type { HomeDashboardProps } from './HomeDashboardPanel';

// ──────────────────────────────────────────────────────────────────────────
// Ana Sayfa — "Klinik Editöryel Dosya" (ana-sayfa-v2.html birebir port)
// HomeDashboardProps ile beslenir (gerçek veri); onNav dock için eklendi.
// ──────────────────────────────────────────────────────────────────────────

export type IntensityBar = { label: string; sessions: number; today?: boolean };
export type IntensitySeries = { week: IntensityBar[]; month: IntensityBar[]; year: IntensityBar[] };

export type AnaSayfaProps = HomeDashboardProps & {
  onNav?(target: string): void;
  /** Kendi iyilik hali check-in'i: 0-10 skor + birkaç duygu/içgörü notu (max 200) */
  onSaveWellbeing?(score: number, note: string): void | Promise<void>;
  /** Yoğunluk grafiği — hafta/ay/yıl serileri (gerçek seans+takvim verisi) */
  intensity?: IntensitySeries;
};

const WB_MAX_CHARS = 200;

const DOCK = [
  { label: 'Ana Sayfa', target: 'home', active: true },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

const initials = (name: string) => {
  const p = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '—';
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
};
const sevBars = (n: number) => Array.from({ length: 5 }, (_, i) => (
  <i key={i} className={i < n ? '' : 'off'} style={{ height: 4 + i * 3 }} />
));

export default function AnaSayfa(props: AnaSayfaProps) {
  const {
    therapist, stats, nextSession, todaySessions, weekly, dropRisk, continuity,
    reflection, onNav,
    onOpenBriefing, onOpenPatient, onOpenPatientSessions, onWriteReflection, onSaveWellbeing, intensity,
  } = props;

  // Yoğunluk görünümü: hafta / ay / yıl
  const [intView, setIntView] = useState<'week' | 'month' | 'year'>('week');
  const intSeries: IntensityBar[] =
    (intensity?.[intView])
    ?? (intView === 'week' ? (weekly?.days ?? []).map((d) => ({ label: d.label, sessions: d.sessions, today: d.today })) : []);
  const intMax = Math.max(1, ...intSeries.map((d) => d.sessions));
  const intTotal = intSeries.reduce((s, d) => s + d.sessions, 0);
  const intTitle = intView === 'week' ? 'Bu hafta ne kadar yoğunsun?' : intView === 'month' ? 'Bu ay ne kadar yoğunsun?' : 'Bu yıl ne kadar yoğunsun?';

  const [mounted, setMounted] = useState(false);
  const [greet, setGreet] = useState('Merhaba');
  const [activeRail, setActiveRail] = useState('bugun');

  // Kendi iyilik hali check-in'i
  const [wbScore, setWbScore] = useState<number | null>(null);
  const [wbNote, setWbNote] = useState('');
  const [wbSaving, setWbSaving] = useState(false);
  const [wbSaved, setWbSaved] = useState(false);

  const saveWellbeing = async () => {
    if (wbScore == null || wbSaving) return;
    setWbSaving(true);
    try {
      await onSaveWellbeing?.(wbScore, wbNote.trim());
      setWbSaved(true);
      setWbNote('');
      setWbScore(null);
    } catch {} finally {
      setWbSaving(false);
    }
  };
  // Bugün yapılacaklar (check-off + localStorage)
  const [todoDone, setTodoDone] = useState<Record<string, boolean>>({});
  const [customTodos, setCustomTodos] = useState<{ id: string; text: string }[]>([]);
  const [newTodo, setNewTodo] = useState('');

  const modalBodyRef = useRef<HTMLDivElement>(null);
  const secRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    setMounted(true);
    const h = new Date().getHours();
    setGreet(h < 11 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar');
  }, []);

  const name = therapist?.firstName ?? 'Terapist';
  const today = todaySessions ?? [];
  const next = today.find((s) => s.status === 'next') ?? today[0];
  const sessionCount = therapist?.sessionCountToday ?? today.length;

  // ── Bugün yapılacaklar — gerçek veriden türet + localStorage ──
  const dayKey = () => new Date().toISOString().slice(0, 10);
  useEffect(() => {
    if (!mounted) return;
    try {
      setTodoDone(JSON.parse(localStorage.getItem(`home-todo-done-${dayKey()}`) || '{}'));
      setCustomTodos(JSON.parse(localStorage.getItem(`home-todo-custom-${dayKey()}`) || '[]'));
    } catch {}
  }, [mounted]);
  const derivedTodos = [
    ...today.map((s, i) => ({ id: `seans-${s.clientId ?? i}`, text: `${s.time} · ${s.clientName} seansı`, sub: s.topic as string | undefined, kind: 'seans' as const, clientId: s.clientId })),
    ...((dropRisk?.count ?? 0) > 0 ? [{ id: 'drop', text: `Drop riski: ${dropRisk!.count} danışanı izle / ara`, sub: undefined, kind: 'drop' as const, clientId: undefined }] : []),
    { id: 'brief', text: 'Günü özetle — günlük randevu briefing’ini incele', sub: undefined, kind: 'brief' as const, clientId: undefined },
  ];
  const allTodos = [...derivedTodos, ...customTodos.map((c) => ({ ...c, sub: undefined, kind: 'custom' as const, clientId: undefined }))];
  const todoDoneCount = allTodos.filter((t) => todoDone[t.id]).length;
  const toggleTodo = (id: string) => setTodoDone((prev) => { const nx = { ...prev, [id]: !prev[id] }; try { localStorage.setItem(`home-todo-done-${dayKey()}`, JSON.stringify(nx)); } catch {} return nx; });
  const addTodo = () => {
    const t = newTodo.trim(); if (!t) return;
    const nc = [...customTodos, { id: `c-${Date.now()}`, text: t }];
    setCustomTodos(nc); setNewTodo('');
    try { localStorage.setItem(`home-todo-custom-${dayKey()}`, JSON.stringify(nc)); } catch {}
  };
  const removeCustom = (id: string) => {
    const nc = customTodos.filter((c) => c.id !== id);
    setCustomTodos(nc);
    try { localStorage.setItem(`home-todo-custom-${dayKey()}`, JSON.stringify(nc)); } catch {}
  };

  // Şık tarih göstergesi — bugünün seansları (Yarın etiketinde +1 gün). Saat etiketten/zamandan.
  const TR_AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const TR_GUN = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];
  const dateParts = (label?: string, fallbackTime?: string) => {
    const d = new Date();
    if (/yar[ıi]n/i.test(label ?? '')) d.setDate(d.getDate() + 1);
    const tm = (label ?? '').match(/(\d{1,2}:\d{2})/) ?? (fallbackTime ?? '').match(/(\d{1,2}:\d{2})/);
    return { day: d.getDate(), monthShort: TR_AY[d.getMonth()].slice(0, 3), monthYear: `${TR_AY[d.getMonth()]} ${d.getFullYear()}`, weekday: TR_GUN[d.getDay()], time: tm ? tm[1] : (fallbackTime ?? label ?? '') };
  };

  // clientId yoksa da çağır — sayfa handler'ı eşleşmeyende danışan listesine yönlendirir
  const openSession = (clientId?: string) => (onOpenPatientSessions ?? onOpenPatient)?.(clientId);

  // Scroll-spy
  useEffect(() => {
    const root = modalBodyRef.current; if (!root) return;
    const secs = Object.values(secRefs.current).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => { if (e.isIntersecting) setActiveRail((e.target as HTMLElement).id); }),
      { root, rootMargin: '-12% 0px -78% 0px', threshold: 0 },
    );
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [today.length, !!continuity, !!dropRisk]);

  const scrollTo = (id: string) => {
    const el = secRefs.current[id]; const mb = modalBodyRef.current;
    if (el && mb) mb.scrollTo({ top: el.getBoundingClientRect().top - mb.getBoundingClientRect().top + mb.scrollTop - 4, behavior: 'smooth' });
  };

  const RAIL = [
    { id: 'bugun', label: 'Bugün' }, { id: 'checkin', label: 'İyilik hali' }, { id: 'akis', label: 'Akış' },
    { id: 'icgoru', label: 'İçgörü' },
    ...(continuity?.clients?.length ? [{ id: 'sureklilik', label: 'Süreklilik' }] : []),
    ...(reflection ? [{ id: 'yansima', label: 'Yansıma' }] : []),
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="as">
        <div className="shell">

          {/* ÜST BAR */}
          <div className="topbar">
            <div className="brand">
              <span className="mark">KA</span>
              <span className="wm"><b>Klinik Asistan</b><span>Klinik Yönetim</span></span>
            </div>
            <div className="topbar-right">
              <span className="tb-date">{therapist?.dateLabel ?? ''}</span>
              <button className="tb-prof" type="button" onClick={() => onNav?.('terapist')}>
                <span className="av">{initials(name)}</span>
                <span className="nm">{name}</span>
              </button>
            </div>
          </div>

          <div className="modal-body" ref={modalBodyRef}>

            {/* HERO */}
            <section className="hero" id="bugun" ref={(el) => { secRefs.current['bugun'] = el; }} data-screen-label="Ana Sayfa — Karşılama">
              <div className="hero-inner">
                <div className="hero-head-wrap">
                  <div className="hero-eyebrow">{therapist?.dateLabel ?? ''}</div>
                  <h1 className="hero-head">
                    <span className="thin">{greet}, {name}.</span>
                    <span className="med">{sessionCount > 0 ? `${sessionCount} seans, bir bütün gün.` : 'Bugün planlı seans yok.'}</span>
                  </h1>
                  <p className="hero-lead">
                    {next
                      ? <>Sıradaki: <b>{next.time}</b>'da <b>{next.clientName}</b> ile. Önce briefing'i gözden geçir.</>
                      : <>Bugün için takvimde randevu görünmüyor. Haftanı planlamak için takvime göz at.</>}
                  </p>
                  <div className="todo">
                    <div className="todo-head">
                      <span className="todo-title">Bugün yapılacaklar</span>
                      <span className="todo-count num">{todoDoneCount}/{allTodos.length}</span>
                    </div>
                    <ul className="todo-list">
                      {allTodos.map((t) => (
                        <li key={t.id} className={todoDone[t.id] ? 'done' : ''}>
                          <button className="todo-check" type="button" aria-pressed={!!todoDone[t.id]} aria-label="Tamamlandı" onClick={() => toggleTodo(t.id)}>
                            <svg viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" /></svg>
                          </button>
                          <span className="todo-text"
                            onClick={() => { if (t.kind === 'brief') onOpenBriefing?.(); else if (t.kind === 'seans' && t.clientId) openSession(t.clientId); else toggleTodo(t.id); }}>
                            {t.text}{t.sub ? <em> · {t.sub}</em> : null}
                          </span>
                          {t.kind === 'custom' && <button className="todo-del" type="button" aria-label="Sil" onClick={() => removeCustom(t.id)}>×</button>}
                        </li>
                      ))}
                      {allTodos.length === 0 && <li className="todo-empty">Bugün için planlı iş yok.</li>}
                    </ul>
                    <div className="todo-add">
                      <input className="todo-input" type="text" value={newTodo} placeholder="Yeni iş ekle…"
                        onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTodo(); }} />
                      <button className="todo-addbtn" type="button" aria-label="Ekle" onClick={addTodo}>＋</button>
                    </div>
                  </div>
                </div>

                <aside className="next-card">
                  {next ? (
                    <>
                      <div className="nc-top"><span className="lbl">Sıradaki seans</span></div>
                      {mounted ? (() => { const dp = dateParts(next.nextLabel, next.time); return (
                        <div className="nc-datetime">
                          <div className="nc-datebadge"><b className="num">{dp.day}</b><span>{dp.monthYear}</span><span>{dp.weekday}</span></div>
                          {dp.time && <div className="nc-time"><span className="t-lbl">saat</span><span className="t-val num">{dp.time}</span></div>}
                        </div>
                      ); })() : <div className="nc-datetime"><span className="when">{next.nextLabel || next.time}</span></div>}
                      <button className="nc-open" type="button" onClick={() => openSession(next.clientId)} title="Dosyayı aç — seans kayıtları">
                        <span className="nc-name">{next.clientName}</span>
                        <span className="nc-topic">{next.topic}</span>
                        {next.brief ? <span className="nc-brief">{next.brief}</span> : null}
                      </button>
                      <div className="nc-meta">{(next.modality ? next.modality.split('·').map((m) => m.trim()) : []).map((m, i) => <span key={i}>{m}</span>)}</div>
                      <div className="nc-foot">
                        <button className="brief" type="button" onClick={() => openSession(next.clientId)}>
                          <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></svg>
                          Briefing'e geç
                        </button>
                      </div>
                    </>
                  ) : (
                    <><div className="nc-top"><span className="lbl">Sıradaki seans</span></div><div className="nc-topic" style={{ marginTop: 14 }}>Bugün için randevu yok.</div></>
                  )}
                </aside>
              </div>

              <div className="hero-stats">
                <div className="hstat"><div className="l">Toplam seans</div><div className="r"><div className="v num">{stats?.totalSessions ?? 0}</div></div></div>
                <div className="hstat"><div className="l">Aktif danışan</div><div className="r"><div className="v num">{stats?.activeClients ?? 0}</div></div></div>
                <div className="hstat"><div className="l">Süreklilik</div><div className="r"><div className="v num">{stats?.continuityPct != null ? `${stats.continuityPct}%` : '—'}</div></div></div>
              </div>
            </section>

            <main className="main">

              {/* KENDİ İYİLİK HALİNİ İZLE */}
              <section className="section" id="checkin" ref={(el) => { secRefs.current['checkin'] = el; }} data-screen-label="Kendi iyilik halini izle">
                <div className="wb-card">
                  <div className="wb-head">
                    <span className="eyebrow">kendi iyilik halini izle</span>
                    <span className="wb-hint">0 = çok zor · 10 = çok iyi</span>
                  </div>

                  <div className="wb-scale" role="group" aria-label="İyilik hali puanı (0-10)">
                    {Array.from({ length: 11 }, (_, n) => (
                      <button key={n} type="button" className={`wb-dot${wbScore === n ? ' on' : ''}`}
                        aria-pressed={wbScore === n} onClick={() => { setWbScore(n); setWbSaved(false); }}>
                        <span className="num">{n}</span>
                      </button>
                    ))}
                  </div>

                  <label className="wb-note-label" htmlFor="wb-note">
                    Bu duyguyu birkaç duyguyla tanımla ve neden olduğuna dair içgörünü belirt
                  </label>
                  <div className="wb-note-wrap">
                    <textarea id="wb-note" className="wb-note" rows={3} maxLength={WB_MAX_CHARS}
                      placeholder="örn. yorgun ama umutlu — sabahki seans iyi geçtiği için…"
                      value={wbNote}
                      onChange={(e) => { setWbNote(e.target.value.slice(0, WB_MAX_CHARS)); setWbSaved(false); }} />
                    <span className="wb-count num">{wbNote.length}/{WB_MAX_CHARS}</span>
                  </div>

                  <div className="wb-foot">
                    {wbSaved && <span className="wb-ok">Kaydedildi ✓</span>}
                    <button type="button" className="wb-save" disabled={wbScore == null || wbSaving} onClick={saveWellbeing}>
                      {wbSaving ? 'Kaydediliyor…' : 'İyilik halini kaydet'}
                    </button>
                  </div>
                </div>
              </section>

              {/* BUGÜNÜN AKIŞI */}
              <section className="section" id="akis" ref={(el) => { secRefs.current['akis'] = el; }} data-screen-label="Bugünün akışı">
                <div className="sec-head">
                  <div className="l"><span className="eyebrow">müdahale / çalışma planları</span><h2 className="sec-title">Bugünün <i>seans</i> akışı</h2></div>
                  <p className="sec-aside">{today.length ? `${today.length} seans, her birinin arasında nefes payı.` : 'Bugün için planlı seans yok.'}</p>
                </div>
                {today.length === 0 ? (
                  <div className="flow-empty">Bugün için takvimde randevu yok.</div>
                ) : (
                  <div className="flow">
                    {today.map((f, i) => (
                      <button key={f.clientId ?? i} type="button" className={`frow${f.status === 'next' ? ' next' : ''}${f.status === 'past' ? ' past' : ''}`} onClick={() => openSession(f.clientId)}>
                        <span className="ix"><span className="dot" />{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i] ?? i + 1}</span>
                        <div className="who"><strong>{f.clientName}</strong><span>{f.modality}</span></div>
                        <div className="topic">{f.topic}{f.brief ? <span className="fbrief">{f.brief}</span> : null}</div>
                        <div className="end">
                          <span className="sev">{sevBars(f.sev)}</span>
                          <span className="no">{f.sessionNo}.</span>
                          {mounted ? (() => { const dp = dateParts(f.nextLabel, f.time); return (
                            <span className="when"><b>{dp.day} {dp.monthShort}</b> · {dp.weekday} · {dp.time}</span>
                          ); })() : <span className="when">{f.nextLabel || f.time}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* HAFTALIK İÇGÖRÜ */}
              <section className="section" id="icgoru" ref={(el) => { secRefs.current['icgoru'] = el; }} data-screen-label="Haftalık içgörü">
                <div className="sec-head">
                  <div className="l"><span className="eyebrow">haftalık içgörü</span><h2 className="sec-title">Yoğunluk ve <i>drop</i> riski</h2></div>
                  <p className="sec-aside">İki gösterge, tek bakış.</p>
                </div>
                <div className="insights insights-2">
                  <article className="icard">
                    <div className="week-top">
                      <span className="eyebrow">{intTitle}</span>
                      <div className="int-seg" role="group" aria-label="Yoğunluk dönemi">
                        {([['week', 'Hafta'], ['month', 'Ay'], ['year', 'Yıl']] as const).map(([k, lbl]) => (
                          <button key={k} type="button" className={`int-opt${intView === k ? ' on' : ''}`}
                            aria-pressed={intView === k} onClick={() => setIntView(k)}>{lbl}</button>
                        ))}
                      </div>
                    </div>
                    <div className="week-total"><b className="num">{intTotal} seans</b><span>{intView === 'week' ? 'bu hafta' : intView === 'month' ? 'bu ay' : 'bu yıl'}</span></div>
                    {intSeries.length === 0 ? (
                      <div className="int-empty">Bu dönem için kayıt yok.</div>
                    ) : (
                      <div className={`week-bars${intView !== 'week' ? ' compact' : ''}`}>
                        {intSeries.map((d, i) => (
                          <div key={i} className={`wcol${d.today ? ' today' : ''}`}>
                            <span className="v num">{d.sessions}</span>
                            <span className="bar" style={{ height: `${Math.round((d.sessions / intMax) * 100)}%` }} />
                            <span className="l">{d.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                  <article className="icard">
                    <div className="drop-top"><span className="eyebrow">drop riski</span><span className="tag">izle</span></div>
                    <div className="drop-big num">{dropRisk?.count ?? 0}<em>danışan</em></div>
                    <p className="drop-copy">{dropRisk?.copy ?? '14 günde 1+ iptal / sessizlik'}</p>
                    <ul className="drop-list">
                      {(dropRisk?.list ?? []).map((x, i) => <li key={i}><strong>{x.name}</strong><span>{x.reason}</span></li>)}
                      {!(dropRisk?.list?.length) && <li><span>İzlenecek danışan yok.</span></li>}
                    </ul>
                  </article>
                </div>
              </section>

              {/* SÜREKLİLİK & DEĞERLER */}
              {continuity?.clients?.length ? (
                <section className="section matrix" id="sureklilik" ref={(el) => { secRefs.current['sureklilik'] = el; }} data-screen-label="Süreklilik ve değerler">
                  <div className="sec-head">
                    <div className="l"><span className="eyebrow">{continuity.headline ?? 'son 30 gün'}</span><h2 className="sec-title">Süreklilik <i>haritası</i></h2></div>
                    <p className="sec-aside">Üst üste 3 seansını tamamlayanlar koyu.</p>
                  </div>
                  <div className="cont">
                    <div className="cont-left">
                      <p>{continuity.copy ?? 'Geçen ayın seans katılım oranı.'}</p>
                      {!!continuity.values?.length && (
                        <div className="values">{continuity.values.map((v, i) => <span key={i} className={`vchip${v.lead ? ' lead' : ''}`}>{v.label}<span className="lv">{v.level}</span></span>)}</div>
                      )}
                    </div>
                    <div className="cont-right">
                      {continuity.clients.map((b, i) => (
                        <div className="cbar" key={i}><span className="nm">{b.name}</span><span className="track"><span className={`fill${b.accent ? ' lead' : ''}`} style={{ width: `${b.pct}%` }} /></span><span className="pct num">{b.pct}%</span></div>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}

              {/* SON YANSIMA — yansıma yoksa da görünür (yazma kısayolu kaybolmasın) */}
              <section className="section" id="yansima" ref={(el) => { secRefs.current['yansima'] = el; }} data-screen-label="Son yansıma">
                <article className="reflect">
                  <div className="reflect-top">
                    <span className="badge">son yansıma</span>
                    <button className="add" type="button" onClick={() => onWriteReflection?.()}><svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" /></svg>yeni yansıma</button>
                  </div>
                  {reflection ? (
                    <>
                      <span className="reflect-meta">{reflection.meta ?? `günlük yansıma · ${reflection.date}`}</span>
                      <p className="reflect-body">
                        {reflection.accentItalicPhrase
                          ? <>{reflection.excerpt}{' '}<em>{reflection.accentItalicPhrase}</em></>
                          : reflection.excerpt}
                      </p>
                    </>
                  ) : (
                    <p className="reflect-body"><em>Henüz yansıma yok — günün üzerine kısa bir not bırakmak için “yeni yansıma”ya dokun.</em></p>
                  )}
                </article>
              </section>

            </main>
          </div>

          <nav className="railnav" aria-label="Bölümler">
            {RAIL.map((it) => (
              <a key={it.id} className={`rn-item${activeRail === it.id ? ' active' : ''}`} href={`#${it.id}`} onClick={(e) => { e.preventDefault(); scrollTo(it.id); }}>
                <span className="rn-label">{it.label}</span><span className="rn-tick" />
              </a>
            ))}
          </nav>

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
