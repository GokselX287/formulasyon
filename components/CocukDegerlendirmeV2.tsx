'use client';

import { useEffect, useRef, useState } from 'react';
import './CocukDegerlendirmeV2.css';
import type { CocukData } from './CocukPanel';

// ──────────────────────────────────────────────────────────────────────────
// Çocuk / ergen ilk değerlendirme editörü — landing uyumlu ("mesh + opal cam").
// Cv görsel-43 / design_handoff_cocuk_degerlendirme portu. AnamnezV2 (.anx) ile
// kardeş/ortak şasi. SCHEMA statik (form tanımı), DATA props'tan gelir; her
// düzenleme onChange(section, value) ile parent'a yazılır (parent /api/cocuk'a
// autosave eder). 11 bölüm · text/num/textarea/select/radio/chips/scale ·
// tamamlanma halkası · sol ray scroll-spy · 5 temalı dock. ZORUNLU ALAN YOK.
// Saklama: cocuk_json (tek alan); chips ", " ile birleşik string; scale number.
// ──────────────────────────────────────────────────────────────────────────

export type CocukDegerlendirmeV2Props = {
  data: CocukData;
  clientName?: string;
  clientNo?: string;
  onChange(section: string, value: any): void;
  onBack?(): void;
  onNav?(target: string): void;
  onAiFill?(): void;
  onSave?(): void;
  onFormul?(): void;
};

type FieldType = 'text' | 'num' | 'textarea' | 'select' | 'radio' | 'chips' | 'scale';
type Field = { l: string; p: string; t: FieldType; o?: string[]; full?: boolean; ph?: string };
type Section = { id: string; no: string; title: string; eye?: string; danger?: boolean; fields: Field[] };

const NAV: { label: string; target: string }[] = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Takvim', target: 'calendar' },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
  { label: 'Profil', target: 'terapist' },
];
const THEMES: [string, string][] = [['rose', '#E59FB6'], ['sage', '#9FBE96'], ['ocean', '#9DC4D6'], ['dusk', '#AEB2CC'], ['clay', '#E3A982']];

const SCHEMA: Section[] = [
  { id: 'demografik', no: '01', title: 'Demografik', eye: 'kimlik', fields: [
    { l: 'Ad Soyad', p: 'demografik.adSoyad', t: 'text', full: true },
    { l: 'Yaş', p: 'demografik.yas', t: 'num' },
    { l: 'Cinsiyet', p: 'demografik.cinsiyet', t: 'select', o: ['Kız', 'Erkek', 'Diğer'] },
    { l: 'Sınıf / okul', p: 'demografik.sinif', t: 'text' },
    { l: 'Birlikte yaşadığı kişiler', p: 'demografik.birlikteYasayan', t: 'text', full: true },
    { l: 'Başvuran', p: 'demografik.basvuran', t: 'select', o: ['Anne', 'Baba', 'Her iki ebeveyn', 'Okul yönlendirmesi'] },
  ] },
  { id: 'yakinma', no: '02', title: 'Mevcut yakınma', eye: 'giriş', fields: [
    { l: 'Başvuru nedeni (ebeveyn ifadesi)', p: 'yakinma.metin', t: 'textarea', full: true },
    { l: 'Ana yakınma', p: 'yakinma.anaYakinma', t: 'text', full: true },
    { l: 'Başlangıç / süre', p: 'yakinma.baslangic', t: 'text' },
    { l: 'Şiddet (ebeveyn)', p: 'yakinma.siddet', t: 'select', o: ['Hafif', 'Orta', 'İleri'] },
  ] },
  { id: 'aile', no: '03', title: 'Aile sistemi', eye: 'köken', fields: [
    { l: 'Anne — yaş / meslek', p: 'aile.anneNot', t: 'text' },
    { l: 'Baba — yaş / meslek', p: 'aile.babaNot', t: 'text' },
    { l: 'Ebeveyn birlikteliği', p: 'aile.birliktelik', t: 'select', o: ['Evli', 'Ayrı', 'Boşanmış', 'Diğer'] },
    { l: 'Kardeş sayısı / sıra', p: 'aile.kardesNot', t: 'text' },
    { l: 'Aile içi ilişki / dinamik', p: 'aile.genogram', t: 'textarea', full: true },
    { l: 'Ailede psikiyatrik öykü', p: 'aile.psikiyatrikOyku', t: 'radio', o: ['Var', 'Yok', 'Bilinmiyor'] },
  ] },
  { id: 'gelisim', no: '04', title: 'Gelişim öyküsü', eye: 'gelişim', fields: [
    { l: 'Gebelik & doğum', p: 'gelisim.gebelik', t: 'textarea', full: true },
    { l: 'Gelişimsel kilometre taşları', p: 'gelisim.motor', t: 'text' },
    { l: 'Gelişimsel gecikme', p: 'gelisim.gecikme', t: 'radio', o: ['Var', 'Yok'] },
    { l: 'Tuvalet / uyku / beslenme', p: 'gelisim.tuvaletUykuBesi', t: 'text', full: true },
    { l: 'Önemli tıbbi öykü', p: 'gelisim.tibbiOyku', t: 'textarea', full: true },
  ] },
  { id: 'okul', no: '05', title: 'Okul & akademik', eye: 'okul', fields: [
    { l: 'Akademik başarı', p: 'okul.akademik', t: 'select', o: ['İyi', 'Orta', 'Düşük'] },
    { l: 'Öğretmen şikâyeti', p: 'okul.ogretmenSikayet', t: 'radio', o: ['Var', 'Yok'] },
    { l: 'Okul içi gözlem', p: 'okul.gozlem', t: 'chips', o: ['Çekingen', 'Dikkat dağınık', 'Hareketli', 'Yalnız kalıyor', 'Uyumlu'], full: true },
    { l: 'Akran ilişkileri', p: 'okul.akranNot', t: 'textarea', full: true },
  ] },
  { id: 'cocukbdt', no: '06', title: 'Çocuk BDT formu', eye: 'bilişsel', fields: [
    { l: 'Tetikleyen durum', p: 'cocukbdt.tetikleyen', t: 'text' },
    { l: 'Duygu', p: 'cocukbdt.duygu', t: 'text' },
    { l: 'Otomatik düşünce (çocuk)', p: 'cocukbdt.otomatikDusunce', t: 'textarea', full: true },
    { l: 'Duygu şiddeti (termometre)', p: 'cocukbdt.duyguSiddeti', t: 'scale', full: true },
    { l: 'Davranış', p: 'cocukbdt.davranis', t: 'text' },
    { l: 'Alternatif', p: 'cocukbdt.alternatif', t: 'textarea', full: true },
  ] },
  { id: 'oyun', no: '07', title: 'Oyun terapisi', eye: 'süreç', fields: [
    { l: 'Kullanılan materyal', p: 'oyun.materyal', t: 'chips', o: ['Kum tepsisi', 'Kuklalar', 'Boyalar', 'Bloklar', 'Oyun hamuru', 'Kart oyunları', 'Figürler'], full: true },
    { l: 'Tekrarlayan temalar', p: 'oyun.temalar', t: 'textarea', full: true },
    { l: 'İlişki / sınır gözlemi', p: 'oyun.iliskiSinir', t: 'textarea', full: true },
  ] },
  { id: 'ebeveyn', no: '08', title: 'Ebeveyn tarzı', eye: 'tutum', fields: [
    { l: 'Tutum', p: 'ebeveyn.tutum', t: 'select', o: ['Demokratik', 'Koruyucu', 'Otoriter', 'İzin verici', 'Tutarsız'] },
    { l: 'Tutarlılık', p: 'ebeveyn.tutarlilik', t: 'radio', o: ['Tutarlı', 'Kısmen', 'Tutarsız'] },
    { l: 'Disiplin yaklaşımı', p: 'ebeveyn.disiplin', t: 'textarea', full: true },
  ] },
  { id: 'risk', no: '09', title: 'Risk & koruma', eye: 'güvenlik', danger: true, fields: [
    { l: 'İhmal / istismar', p: 'risk.abuse', t: 'radio', o: ['Var', 'Yok', 'Şüphe'] },
    { l: 'Kendine zarar', p: 'risk.kendineZararVar', t: 'radio', o: ['Var', 'Yok'] },
    { l: 'Risk düzeyi', p: 'risk.seviyeLabel', t: 'select', o: ['Düşük', 'Orta', 'Yüksek'] },
    { l: 'Koruma / yönlendirme notu', p: 'risk.korumaNotu', t: 'textarea', full: true },
  ] },
  { id: 'hedefler', no: '10', title: 'Hedefler', eye: 'yön', fields: [
    { l: 'Terapi hedefleri', p: 'hedefler.hedefler', t: 'textarea', full: true },
    { l: 'Ebeveyn beklentisi', p: 'hedefler.beklenti', t: 'text', full: true },
  ] },
  { id: 'klinisyen', no: '11', title: 'Klinisyen notu', eye: 'sentez', fields: [
    { l: 'Formülasyon ön-notu', p: 'klinikNotu', t: 'textarea', full: true,
      ph: 'Okul reddinin işlevini netleştir\nEbeveyn rehberliği planı\nKaygı için maruz bırakma basamakları' },
  ] },
];

const lcTr = (s: string) => s.toLocaleLowerCase('tr-TR');

function getV(data: any, p: string): any { return p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), data); }
function setIn(obj: any, keys: string[], val: any): any {
  if (keys.length === 0) return val;
  const [k, ...rest] = keys;
  const base = obj && typeof obj === 'object' ? obj : {};
  return { ...base, [k]: setIn(base[k], rest, val) };
}
function filled(v: any): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.trim() !== '';
  if (typeof v === 'number') return true;
  return !!v;
}
/* chips string → dizi (", " ile ayrılmış) */
function chipsArr(v: any): string[] { return (typeof v === 'string' ? v : '').split(',').map((s) => s.trim()).filter(Boolean); }

/* auto-grow textarea */
function AutoTextarea({ value, placeholder, onChange }: { value: string; placeholder?: string; onChange(v: string): void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const grow = () => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } };
  useEffect(grow, [value]);
  return <textarea ref={ref} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export default function CocukDegerlendirmeV2(props: CocukDegerlendirmeV2Props) {
  const { data, clientName, clientNo, onChange, onBack, onNav, onAiFill, onSave, onFormul } = props;

  const [theme, setTheme] = useState('rose');
  const [active, setActive] = useState('demografik');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const saveT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try { const t = localStorage.getItem('calmie-theme'); if (t && THEMES.some(([x]) => x === t)) setTheme(t); } catch {}
  }, []);
  const applyTheme = (t: string) => { setTheme(t); try { localStorage.setItem('calmie-theme', t); } catch {} };

  /* veri yazımı — bölüm-bazlı onChange + autosave göstergesi (1500ms) */
  const markSaving = () => {
    setSaving(true);
    if (saveT.current) clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      setSaving(false);
      setSavedAt(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    }, 1500);
  };
  const setV = (p: string, val: any) => {
    const keys = p.split('.');
    const topKey = keys[0];
    const newTop = keys.length === 1 ? val : setIn((data as any)[topKey] ?? {}, keys.slice(1), val);
    onChange(topKey, newTop);
    markSaving();
  };

  /* tamamlanma */
  const secStatus = (s: Section): '' | 'part' | 'done' => {
    const total = s.fields.length;
    let n = 0; s.fields.forEach((f) => { if (filled(getV(data, f.p))) n++; });
    return n === 0 ? '' : n >= total ? 'done' : 'part';
  };
  const doneCount = SCHEMA.filter((s) => secStatus(s) === 'done').length;
  const pct = Math.round((doneCount / SCHEMA.length) * 100);
  const C = 2 * Math.PI * 31;

  /* scroll-spy + ray navigasyon (window scroll, 92px ofset) */
  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight * 0.34;
      let cur = SCHEMA[0].id;
      for (const s of SCHEMA) {
        const el = document.getElementById('cdx-sec-' + s.id);
        if (el && el.getBoundingClientRect().top <= mid) cur = s.id;
      }
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const goTo = (id: string) => {
    const el = document.getElementById('cdx-sec-' + id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 92, behavior: 'smooth' });
  };

  const name = (clientName ?? '').trim() || 'Danışan';
  const initials = name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR') || 'DA';

  /* chips toggle yardımcısı — seçili etiketler ", " ile birleşik string */
  const chipToggle = (p: string, opt: string) => {
    const arr = chipsArr(getV(data, p));
    const has = arr.some((x) => lcTr(x) === lcTr(opt));
    const next = has ? arr.filter((x) => lcTr(x) !== lcTr(opt)) : [...arr, opt];
    setV(p, next.join(', '));
  };

  /* ── alan render ── */
  const renderCtrl = (f: Field) => {
    const v = getV(data, f.p);
    switch (f.t) {
      case 'text':
        return <input className="inp" type="text" value={v ?? ''} placeholder="Yaz…" onChange={(e) => setV(f.p, e.target.value)} />;
      case 'num':
        return <input className="inp" type="number" value={v ?? ''} placeholder="—" onChange={(e) => setV(f.p, e.target.value === '' ? null : +e.target.value)} />;
      case 'textarea':
        return <AutoTextarea value={v ?? ''} placeholder={f.ph || 'Yaz…'} onChange={(val) => setV(f.p, val)} />;
      case 'select':
        return (
          <div className="sel-wrap">
            <select className="sel" value={filled(v) ? v : ''} onChange={(e) => setV(f.p, e.target.value)}>
              <option value="">Seç…</option>
              {f.o!.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        );
      case 'radio':
        return (
          <div className="segd">
            {f.o!.map((o) => <button key={o} type="button" className={v === o ? 'on' : ''} onClick={() => setV(f.p, o)}>{o}</button>)}
          </div>
        );
      case 'chips': {
        const sel = chipsArr(v);
        return (
          <div className="chipset">
            {f.o!.map((o) => {
              const on = sel.some((x) => lcTr(x) === lcTr(o));
              return (
                <button key={o} type="button" className={'chipt' + (on ? ' on' : '')} onClick={() => chipToggle(f.p, o)}>
                  <span className="tick">✓</span>{o}
                </button>
              );
            })}
          </div>
        );
      }
      case 'scale': {
        const val = filled(v) ? +v : 0;
        return (
          <div className="scale">
            <div className="scale-track">
              {Array.from({ length: 10 }, (_, idx) => idx + 1).map((i) => (
                <div key={i} className={'scale-seg' + (i <= val ? ' fill' : '') + (i === val ? ' cur' : '')} onClick={() => setV(f.p, i)}>{i}</div>
              ))}
            </div>
            <div className="scale-cap"><span>Düşük</span><span>{val ? <>Seçili: <b>{val}/10</b></> : 'Henüz seçilmedi'}</span><span>Yüksek</span></div>
          </div>
        );
      }
    }
    return null;
  };

  const renderField = (f: Field) => (
    <div key={f.p} className={'fld' + (f.full ? ' full' : '')}>
      <label className="fld-lab">{f.l}</label>
      <div className="fld-ctrl">{renderCtrl(f)}</div>
    </div>
  );

  return (
    <div className="cdx" data-theme={theme}>
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
            {NAV.map((n) => <a key={n.target} className={n.target === 'calisma-alani' ? 'active' : ''} onClick={() => onNav?.(n.target)}>{n.label}</a>)}
          </div>
          <a className="nav-prof" onClick={() => onNav?.('terapist')}>
            <div className="np-col">
              <span className="pro-badge"><svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.3L21 9l-4.8 4.3L17.6 22 12 18.4 6.4 22l1.4-8.7L3 9l6.4-.7z" /></svg>PRO</span>
              <span className="np-name">Profil</span>
            </div>
            <span className="np-av">{initials}</span>
          </a>
          <button className="menu-btn" aria-label="Menü" onClick={() => setMobileMenu((v) => !v)}><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
        </nav>
        <div className={'mobile-menu' + (mobileMenu ? ' open' : '')}>
          {NAV.map((n) => <a key={n.target} onClick={() => { setMobileMenu(false); onNav?.(n.target); }}>{n.label}</a>)}
        </div>
      </div>

      {/* TOPBAR */}
      <section className="topbar">
        <div className="wrap">
          <nav className="crumb" aria-label="Konum">
            <a onClick={() => onBack?.()}><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>Profil</a>
            <span>/</span><a onClick={() => onBack?.()}>Dosya</a><span>/</span><b>Çocuk Değerlendirme</b>
          </nav>
          <div className="top-row">
            <div className="top-id">
              <div className="top-av">{initials}</div>
              <div className="top-meta">
                <div className="top-eye">İlk değerlendirme · Çocuk / ergen</div>
                <h1 className="top-name">{name}<span>{clientNo || ''}</span></h1>
                <div className="top-sub">Bölümleri serbestçe doldur — kayıt otomatik, zorunlu alan yok.</div>
              </div>
            </div>
            <div className="top-right">
              <div className="compl">
                <div className="compl-ring">
                  <svg width="74" height="74" viewBox="0 0 74 74">
                    <circle cx="37" cy="37" r="31" fill="none" stroke="rgba(35,34,42,.10)" strokeWidth="7" />
                    <circle cx="37" cy="37" r="31" fill="none" stroke="url(#cdxcg)" strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - doneCount / SCHEMA.length)).toFixed(1)} style={{ transition: 'stroke-dashoffset .5s' }} />
                    <defs><linearGradient id="cdxcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--viz-a)" /><stop offset="1" stopColor="var(--viz-b)" /></linearGradient></defs>
                  </svg>
                  <div className="pct">{pct}%</div>
                </div>
                <div className="compl-txt">
                  <b>{doneCount}/{SCHEMA.length} bölüm</b>
                  <span>tamamlandı</span>
                  <span className={'compl-save' + (saving ? ' saving' : '')}><span className="dot" />{saving ? 'Kaydediliyor…' : savedAt ? `Kaydedildi · ${savedAt}` : 'Kaydedildi'}</span>
                </div>
              </div>
              <div className="top-actions">
                <button className="btn btn-ghost" type="button" onClick={() => onAiFill?.()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M5 12H2M22 12h-3M6 6l-2-2M20 20l-2-2M18 6l2-2M4 20l2-2" /><circle cx="12" cy="12" r="4" /></svg>AI ile doldur</button>
                <button className="btn btn-primary" type="button" onClick={() => onSave?.()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ANA */}
      <section className="ana">
        <div className="wrap">
          <aside className="srail" aria-label="Bölümler">
            <div className="srail-h">Bölümler</div>
            {SCHEMA.map((s) => {
              const st = secStatus(s);
              return (
                <div key={s.id} className={'sr-item' + (s.danger ? ' danger' : '') + (active === s.id ? ' active' : '')} onClick={() => goTo(s.id)}>
                  <span className="sr-no">{s.no}</span>
                  <span className={'sr-dot' + (st ? ' ' + st : '')} />
                  <span className="sr-lab">{s.title}</span>
                </div>
              );
            })}
          </aside>
          <div className="secstack">
            {SCHEMA.map((s) => (
              <section key={s.id} className={'acard' + (s.danger ? ' danger' : '')} id={'cdx-sec-' + s.id}>
                <div className="ac-head">
                  <span className="ac-no">{s.no}</span>
                  <h2 className="ac-title">{s.title}</h2>
                  {s.danger
                    ? <span className="ac-danger-note"><svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>Güvenlik bölümü</span>
                    : <span className="ac-eye">{s.eye}</span>}
                </div>
                <div className="fgrid">{s.fields.map(renderField)}</div>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* END CTA */}
      <section className="endcta">
        <div className="wrap">
          <div className="endcta-l">
            <div className="endcta-eye">Sonraki adım</div>
            <h2 className="endcta-t">Değerlendirme tamam mı? <span className="ser">Klinik formülasyona</span> geç.</h2>
            <p className="endcta-p">Toplanan veriden çocuğun sürdürücü döngülerini ve müdahale planını birlikte oluştur.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => onFormul?.()}>Klinik Formülasyon<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
        </div>
      </section>

      {/* FOOTER */}
      <div className="footwrap">
        <footer>
          <div className="foot-grid">
            <div className="foot-brand">
              <span className="logo" style={{ fontSize: 21, fontWeight: 600, color: '#fff' }}>Calmie<i style={{ fontStyle: 'italic', color: 'var(--txt-accent)' }}>.</i></span>
              <p>İşini profesyonel boyutta yapmak isteyen herkes için dijital klinik asistanı — sade, güvenli, bütüncül.</p>
            </div>
            <div className="foot-col">
              <h4>Panel</h4>
              <a onClick={() => onNav?.('home')}>Ana Sayfa</a>
              <a onClick={() => onNav?.('calendar')}>Takvim &amp; Randevular</a>
              <a onClick={() => onNav?.('calisma-alani')}>Çalışma Alanı</a>
            </div>
            <div className="foot-col">
              <h4>Hesap</h4>
              <a onClick={() => onNav?.('terapist')}>Profil</a>
              <a onClick={() => onBack?.()}>Dosya</a>
              <a onClick={() => onFormul?.()}>Klinik Formülasyon</a>
            </div>
          </div>
          <div className="foot-bottom"><small>© 2026 Calmie</small><div className="foot-legal"><a>{name}{clientNo ? ` · ${clientNo}` : ''}</a></div></div>
        </footer>
      </div>

      {/* DOCK */}
      <div className="dock" aria-label="Renk teması">
        {THEMES.map(([t, c]) => <button key={t} type="button" className={'dock-dot' + (theme === t ? ' on' : '')} style={{ background: c }} title={t} aria-label={`${t} tema`} onClick={() => applyTheme(t)} />)}
      </div>
    </div>
  );
}
