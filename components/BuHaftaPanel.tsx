'use client';

import { useEffect, useRef, useState } from 'react';
import './CalmieChrome.css';
import './BuHaftaPanel.css';

// ──────────────────────────────────────────────────────────────────────────
// Bu hafta — Çalışma Alanı "Bu hafta" kutucuğundan açılan haftalık panorama.
// 4 bölüm: haftalık seans grafiği · danışan seans hazırlık · haftalık kazanç ·
// bu hafta yapılacaklar. Bölümler ana sayfa/takvimde de durur (kopya).
// Tema mesh zemin + üst menü + kabartılı beyaz nöromorfik kartlar.
// ──────────────────────────────────────────────────────────────────────────

export type BuHaftaData = {
  weekBars: { l: string; v: number; today?: boolean }[];
  weekTotal: number;
  rangeLabel: string;
  earn: { total: string; avg: string; paid: number; free: number; has: boolean };
  missingFeeCount: number;
  prepToday: { id?: string; name: string; time: string; topic: string; matched: boolean }[];
  weekAppts: { id?: string; name: string; dateLabel: string; time: string; matched: boolean }[];
  incomplete: { id: string; name: string; topic: string; missingCount: number }[];
};

export type BuHaftaPanelProps = {
  data: BuHaftaData;
  onNav?: (t: string) => void;
  onBack?: () => void;
  onOpenClient?: (idOrName: string) => void;
  onOpenTakvim?: () => void;
  onEditMissingFees?: () => void;
  onOpenDanisanlar?: () => void;
};

const DEFAULT_BG = '/calmie-hero-default.jpg';
const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };
const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const initials = (n: string) => n.trim().split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase();

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Ayarlar', target: 'ayarlar' },
];

export default function BuHaftaPanel({ data, onNav, onBack, onOpenClient, onOpenTakvim, onEditMissingFees, onOpenDanisanlar }: BuHaftaPanelProps) {
  const [theme] = useState<string>(() => lsGet('calmie-theme') || 'sage');
  const [bgPhoto] = useState<string | null>(() => lsGet('siyi_home_bg_v1'));

  const intMax = Math.max(1, ...data.weekBars.map((b) => b.v));

  // ── menü glider ──
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

  // ── yapılacaklar (ana sayfa ile aynı localStorage: home-todos-<gün>) ──
  type TodoStatus = 'done' | 'late' | 'skip';
  const [status, setStatus] = useState<Record<string, TodoStatus>>({});
  const [custom, setCustom] = useState<{ id: string; text: string }[]>([]);
  const [newTodo, setNewTodo] = useState('');
  useEffect(() => {
    try {
      const raw = JSON.parse(lsGet('home-todos-' + dayKey()) || '{}');
      const { custom: c, _total, ...rest } = raw;
      const st: Record<string, TodoStatus> = {};
      Object.entries(rest).forEach(([k, v]) => { st[k] = (v === 'late' || v === 'skip') ? (v as TodoStatus) : 'done'; });
      setStatus(st); setCustom(Array.isArray(c) ? c : []);
    } catch {}
  }, []);
  const baseTodos = data.weekAppts.map((a) => ({ id: 's-' + (a.id || a.name), text: `${a.name} · ${a.dateLabel} ${a.time} — seans hazırlığı`, tag: 'Seans', who: a.id || a.name }));
  const allTodos = [...baseTodos, ...custom.map((c) => ({ id: c.id, text: c.text, tag: 'Serbest', who: undefined as string | undefined }))];
  const doneCount = allTodos.filter((t) => status[t.id] === 'done').length;
  const persist = (st: Record<string, TodoStatus>, cs: { id: string; text: string }[]) => {
    try {
      const raw = JSON.parse(lsGet('home-todos-' + dayKey()) || '{}');
      const clean: Record<string, TodoStatus> = {};
      Object.entries(st).forEach(([k, v]) => { if (v) clean[k] = v; });
      // _total ana sayfanın metriği — varsa koru, yoksa kabaca hesapla
      const _total = typeof raw._total === 'number' ? raw._total : baseTodos.length + cs.length;
      localStorage.setItem('home-todos-' + dayKey(), JSON.stringify({ ...clean, custom: cs, _total }));
    } catch {}
  };
  const toggle = (id: string) => setStatus((p) => { const nx = { ...p }; if (nx[id] === 'done') delete nx[id]; else nx[id] = 'done'; persist(nx, custom); return nx; });
  const addTodo = () => { const v = newTodo.trim(); if (!v) return; const nc = [...custom, { id: 'c-' + Date.now(), text: v }]; setCustom(nc); persist(status, nc); setNewTodo(''); };

  const prepNext = data.prepToday[0];
  const prepOthers = data.prepToday.slice(1);

  return (
    <div className="bhf cchrome" data-theme={theme}>
      {/* tema mesh/foto zemin */}
      <div className="app-bg" aria-hidden="true">
        <span className="hb-mesh" />
        <img className="hb-photo" alt="" src={bgPhoto || DEFAULT_BG} />
        <img className="hb-cherry" alt="" src="/tema-cherry.jpg" /><span className="hb-cherry-scrim" />
        <img className="hb-fur" alt="" src="/tema-kurk.jpg" /><span className="hb-fur-scrim" />
        <span className="hb-tint" /><span className="hb-veil" /><span className="hb-grain" />
      </div>

      {/* üst menü */}
      <header className="page-menu">
        <span className="pm-brand"><b>Calmie</b><i>.</i></span>
        <nav className="pm-nav" aria-label="Sayfa menüsü" ref={menuRef} onMouseLeave={() => moveGlider(activeLink())}>
          <span className="pm-glider" ref={gliderRef} aria-hidden="true" />
          {DOCK.map((d) => (
            <a key={d.target} href="#" className={d.active ? 'active' : ''} onMouseEnter={(e) => moveGlider(e.currentTarget)}
              onClick={(e) => { e.preventDefault(); if (!d.active) onNav?.(d.target); }}>{d.label}</a>
          ))}
        </nav>
      </header>

      <div className="bhf-scroll">
        <div className="bhf-inner">
          <header className="bhf-head">
            <button className="bhf-back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Çalışma Alanı</button>
            <span className="eyebrow">Haftalık panorama</span>
            <h1>Bu <i>hafta</i></h1>
            <p className="bhf-lead">Haftanın seans yoğunluğu, hazırlık, kazanç ve yapılacakları tek ekranda.</p>
          </header>

          <div className="bhf-grid">
            {/* 1 — HAFTALIK SEANS SAYISI GRAFİĞİ */}
            <section className="bhf-card span2">
              <div className="bhf-card-head"><span className="bhf-no">01</span><h2>Haftalık seans sayısı</h2>
                <span className="bhf-total num">{data.weekTotal} seans <em>{data.rangeLabel}</em></span></div>
              <div className="week-bars">
                {data.weekBars.map((b, i) => (
                  <div key={i} className={`wcol${b.today ? ' today' : ''}`}>
                    <span className="v num">{b.v}</span>
                    <span className="bar" style={{ height: `${Math.round((b.v / intMax) * 100)}%` }} />
                    <span className="l">{b.l}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 3 — HAFTALIK KAZANÇ */}
            <section className="bhf-card">
              <div className="bhf-card-head"><span className="bhf-no">02</span><h2>Haftalık kazanç</h2></div>
              {data.earn.has ? (
                <>
                  <div className="earn-num num">{data.earn.total}</div>
                  <div className="earn-sub">
                    <div><b className="num">{data.earn.avg}</b> ort. / seans</div>
                    <div><b className="num">{data.earn.paid}</b> ücretli seans · bu hafta</div>
                  </div>
                  {data.earn.free > 0 && <div className="earn-note">{data.earn.free} fiyatsız seans hesaba katılmadı.</div>}
                </>
              ) : (
                <p className="earn-note">Bu hafta için fiyatlı seans yok — danışan dosyasındaki "seans ücreti" doldurulunca burada hesaplanır.</p>
              )}
              {data.missingFeeCount > 0 && (
                <button className="earn-warn" type="button" onClick={() => onEditMissingFees?.()}>
                  <svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                  <span>{data.missingFeeCount} danışanın fiyatı eksik. Düzenle.</span>
                </button>
              )}
            </section>

            {/* 2 — DANIŞAN SEANS HAZIRLIK */}
            <section className="bhf-card span2">
              <div className="bhf-card-head"><span className="bhf-no">03</span><h2>Bugünün seans hazırlığı</h2>
                <button className="bhf-link" type="button" onClick={() => onOpenTakvim?.()}>Takvim →</button></div>
              {data.prepToday.length === 0 ? (
                <p className="bhf-empty">Bugün için randevu yok — hazırlanacak seans bulunmuyor.</p>
              ) : (
                <div className="prep-wrap">
                  <div className="prep-next">
                    <div className="pn-top"><span className="pn-badge">Sıradaki</span><span className="pn-eta">{prepNext.time}</span></div>
                    <h3 className="pn-name">{prepNext.name}</h3>
                    <div className="pn-topic">{prepNext.matched ? (prepNext.topic || 'Sunum sorunu kayıtlı') : 'Bu isim danışan kaydıyla eşleşmiyor.'}</div>
                    <button className="bhf-btn primary sm" type="button" onClick={() => onOpenClient?.(prepNext.id || prepNext.name)}>{prepNext.matched ? 'Dosyayı aç →' : 'Danışan eşleştir'}</button>
                  </div>
                  {prepOthers.length > 0 && (
                    <div className="prep-pool">
                      {prepOthers.map((a, i) => (
                        <button key={i} className="pcard" type="button" onClick={() => onOpenClient?.(a.id || a.name)}>
                          <span className="pc-time num">{a.time}</span>
                          <span className="pc-name">{a.name}</span>
                          <span className="pc-topic">{a.matched ? (a.topic || '—') : <span className="nomatch">eşleşme yok</span>}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 4 — BU HAFTA YAPILACAKLAR */}
            <section className="bhf-card span2">
              <div className="bhf-card-head"><span className="bhf-no">04</span><h2>Bu hafta yapılacaklar</h2>
                <span className="bhf-sub">{doneCount}/{allTodos.length} tamamlandı</span></div>
              {allTodos.length === 0 ? (
                <p className="bhf-empty">Bu hafta için planlı iş yok.</p>
              ) : (
                <div className="todo-list">
                  {allTodos.map((t) => {
                    const done = status[t.id] === 'done';
                    return (
                      <div key={t.id} className={`todo-card${done ? ' done' : ''}`} role="button" tabIndex={0}
                        onClick={() => toggle(t.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(t.id); } }}>
                        <span className="tc-check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" /></svg></span>
                        <span className="tc-body"><span className="tc-text">{t.text}</span><span className="tc-tag">{t.tag}</span></span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="todo-add">
                <input type="text" placeholder="yeni iş ekle…" value={newTodo} onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTodo(); } }} />
                <button type="button" aria-label="İş ekle" onClick={addTodo}>+</button>
              </div>
            </section>

            {/* 5 — TAMAMLANMAMIŞ DOSYALAR */}
            <section className="bhf-card span2">
              <div className="bhf-card-head"><span className="bhf-no">05</span><h2>Tamamlanmamış dosyalar</h2>
                {data.incomplete.length > 0 && <span className="inc-cnt num">{data.incomplete.length} dosya</span>}
                <button className="bhf-link" type="button" onClick={() => onOpenDanisanlar?.()}>Tüm danışanlar →</button></div>
              {data.incomplete.length === 0 ? (
                <p className="bhf-empty">Tüm danışan dosyaları tamamlanmış görünüyor.</p>
              ) : (
                <div className="inc-grid">
                  {data.incomplete.map((p) => (
                    <button key={p.id} className="inccard" type="button" onClick={() => onOpenClient?.(p.id)}>
                      <span className="inc-av">{initials(p.name)}</span>
                      <span className="inc-who"><b>{p.name}</b><span>{p.topic}</span></span>
                      <span className="inc-miss">{p.missingCount} eksik</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div style={{ height: 40 }} />
        </div>
      </div>
    </div>
  );
}
