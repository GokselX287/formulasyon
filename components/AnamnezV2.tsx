'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './AnamnezV2.css';
import type { AnamnezData } from './AnamnezPanel';

// ──────────────────────────────────────────────────────────────────────────
// Anamnez — "Klinik Editöryel Dosya" · Anamnez v2.html birebir port.
// 16 bölüm · sol nav + tamamlanma % + risk vurgusu + AI/ön-form/kaydet.
// Gerçek AnamnezData'ya bağlı: skaler anahtarlar yeniden kullanılır (mevcut
// veri görünür); dizi/nesne tipli alanlar bozulmaz, ayrı not anahtarı kullanılır.
// ──────────────────────────────────────────────────────────────────────────

type SecKey = keyof AnamnezData;
type FieldType = 'text' | 'num' | 'textarea' | 'select' | 'radio' | 'chips' | 'scale';

type Field = {
  label: string;
  type: FieldType;
  sec: SecKey | '__top';
  key: string;          // bölüm nesnesi içindeki saklama anahtarı (top için klinisyenNotu)
  sub?: string;         // iç içe alan (ör. yatis.var, olcekler.phq9.skor, gozlem.gorunus.not)
  opt?: string[];
  half?: boolean;
  max?: number;
  bands?: string;
  enc?: (v: any) => any;  // UI değeri → saklanan değer
  dec?: (v: any) => any;  // saklanan değer → UI değeri
};

type Section = { id: string; t: string; risk?: boolean; fields: Field[] };

const boolVarYok = { enc: (v: string) => v === 'Var', dec: (v: any) => (v === true ? 'Var' : v === false ? 'Yok' : '') };

const SECTIONS: Section[] = [
  { id: 'demografik', t: 'Demografik', fields: [
    { label: 'Ad Soyad', type: 'text', sec: 'demografik', key: 'adSoyad', half: true },
    { label: 'Yaş', type: 'num', sec: 'demografik', key: 'yas', half: true },
    { label: 'Cinsiyet', type: 'select', sec: 'demografik', key: 'cinsiyet', opt: ['', 'Kadın', 'Erkek', 'Diğer'], half: true },
    { label: 'Medeni durum', type: 'select', sec: 'demografik', key: 'medeniDurum', opt: ['', 'Bekâr', 'Evli', 'Boşanmış', 'Dul'], half: true },
    { label: 'Meslek', type: 'text', sec: 'demografik', key: 'meslek', half: true },
    { label: 'Şehir', type: 'text', sec: 'demografik', key: 'sehir', half: true },
  ] },
  { id: 'basvuru', t: 'Başvuru & Ana Yakınma', fields: [
    { label: 'Başvuru nedeni', type: 'textarea', sec: 'basvuru', key: 'sebep' },
    { label: 'Ana yakınma', type: 'text', sec: 'basvuru', key: 'anaYakinma' },
    { label: 'Başvuru şekli', type: 'select', sec: 'basvuru', key: 'yonlendiren', opt: ['', 'Kendi isteği', 'Yönlendirme', 'Aile'] },
  ] },
  { id: 'oyku', t: 'Şikayet Öyküsü', fields: [
    { label: 'Başlangıç & seyir', type: 'textarea', sec: 'sikayet', key: 'baslangic' },
    { label: 'Tetikleyiciler', type: 'textarea', sec: 'sikayet', key: 'tetikleyicilerNot' },
  ] },
  { id: 'psikiyatrik', t: 'Psikiyatrik Geçmiş', fields: [
    { label: 'Önceki psikiyatrik başvuru', type: 'radio', sec: 'psikiyatrik', key: 'oncekiBasvuru', opt: ['Var', 'Yok'] },
    { label: 'Kullandığı ilaç', type: 'text', sec: 'psikiyatrik', key: 'ilacNot' },
    { label: 'Yatış öyküsü', type: 'radio', sec: 'psikiyatrik', key: 'yatis', sub: 'var', opt: ['Var', 'Yok'], ...boolVarYok },
  ] },
  { id: 'tibbi', t: 'Tıbbi Geçmiş', fields: [
    { label: 'Kronik hastalık', type: 'text', sec: 'tibbi', key: 'kronikNot' },
    { label: 'Kullanılan ilaçlar', type: 'text', sec: 'tibbi', key: 'ilac' },
    { label: 'Alerji', type: 'text', sec: 'tibbi', key: 'alerji' },
  ] },
  { id: 'aile', t: 'Aile Öyküsü', fields: [
    { label: 'Ailede psikiyatrik öykü', type: 'textarea', sec: 'aile', key: 'genogram' },
    { label: 'Aile yapısı', type: 'text', sec: 'aile', key: 'aileYapisi' },
  ] },
  { id: 'madde', t: 'Madde Kullanımı', fields: [
    { label: 'Alkol', type: 'radio', sec: 'madde', key: 'alkol', opt: ['Düzenli', 'Ara sıra', 'Yok'] },
    { label: 'Sigara', type: 'radio', sec: 'madde', key: 'sigara', opt: ['Var', 'Yok'] },
    { label: 'Madde', type: 'radio', sec: 'madde', key: 'madde', opt: ['Var', 'Yok'] },
  ] },
  { id: 'gelisim', t: 'Gelişim Öyküsü', fields: [
    { label: 'Doğum & erken gelişim', type: 'textarea', sec: 'gelisim', key: 'erkenYasam' },
    { label: 'Önemli yaşam olayları', type: 'textarea', sec: 'gelisim', key: 'yasamOlaylari' },
  ] },
  { id: 'sosyal', t: 'İş / Sosyal İşlevsellik', fields: [
    { label: 'İş durumu', type: 'text', sec: 'isSosyal', key: 'isDurumu' },
    { label: 'Sosyal destek sistemi', type: 'textarea', sec: 'isSosyal', key: 'destekNot' },
  ] },
  { id: 'iliskiler', t: 'İlişkiler', fields: [
    { label: 'İlişki durumu', type: 'text', sec: 'iliskiler', key: 'romantik' },
    { label: 'İlişki örüntüleri', type: 'textarea', sec: 'iliskiler', key: 'baglanma' },
  ] },
  { id: 'travma', t: 'Travma Öyküsü', fields: [
    { label: 'Travma öyküsü', type: 'radio', sec: 'travma', key: 'travmaVar', opt: ['Var', 'Yok', 'Belirsiz'] },
    { label: 'Açıklama', type: 'textarea', sec: 'travma', key: 'travmaNot' },
  ] },
  { id: 'risk', t: 'Risk Değerlendirme', risk: true, fields: [
    { label: 'İntihar düşüncesi', type: 'radio', sec: 'risk', key: 'intihar', opt: ['Var', 'Yok'], enc: (v) => (v === 'Var' ? 'var' : 'yok'), dec: (v) => (v === 'var' || v === 'plan' || v === 'girisim' ? 'Var' : v === 'yok' ? 'Yok' : '') },
    { label: 'Plan / niyet', type: 'radio', sec: 'risk', key: 'planNiyet', opt: ['Var', 'Yok'] },
    { label: 'Kendine zarar verme', type: 'radio', sec: 'risk', key: 'zarar', opt: ['Var', 'Yok'], enc: (v) => (v === 'Var' ? 'aktif' : 'yok'), dec: (v) => (v === 'aktif' || v === 'gecmis' ? 'Var' : v === 'yok' ? 'Yok' : '') },
    { label: 'Başkasına zarar riski', type: 'radio', sec: 'risk', key: 'baskasi', opt: ['Var', 'Yok'], enc: (v) => (v === 'Var' ? 'risk' : 'yok'), dec: (v) => (v === 'risk' ? 'Var' : v === 'yok' ? 'Yok' : '') },
    { label: 'Genel risk düzeyi', type: 'select', sec: 'risk', key: 'seviye', opt: ['', 'Düşük', 'Orta', 'Yüksek'], enc: (v) => ({ 'Düşük': 'dusuk', 'Orta': 'orta', 'Yüksek': 'yuksek', '': '' } as any)[v], dec: (v) => ({ 'dusuk': 'Düşük', 'orta': 'Orta', 'yuksek': 'Yüksek' } as any)[v] ?? '' },
  ] },
  { id: 'hedefler', t: 'Hedefler', fields: [
    { label: 'Terapi hedefleri', type: 'textarea', sec: 'hedefler', key: 'hedeflerNot' },
    { label: 'Beklenti / motivasyon', type: 'text', sec: 'hedefler', key: 'beklenti' },
  ] },
  { id: 'olcekler', t: 'Ölçekler', fields: [
    { label: 'PHQ-9 (depresyon)', type: 'scale', sec: 'olcekler', key: 'phq9', sub: 'skor', max: 27, bands: '0–27' },
    { label: 'GAD-7 (anksiyete)', type: 'scale', sec: 'olcekler', key: 'gad7', sub: 'skor', max: 21, bands: '0–21' },
  ] },
  { id: 'mse', t: 'Gözlem (MSE)', fields: [
    { label: 'Görünüm & davranış', type: 'chips', sec: 'gozlem', key: 'gorunus', sub: 'not', opt: ['Bakımlı', 'İşbirlikçi', 'Gergin', 'Kaçıngan', 'Huzursuz'] },
    { label: 'Duygulanım', type: 'select', sec: 'gozlem', key: 'duygu', sub: 'not', opt: ['', 'Öteki', 'Anksiyöz', 'Depresif', 'Künt', 'Uygun'] },
    { label: 'Düşünce & biliş', type: 'text', sec: 'gozlem', key: 'dusunce', sub: 'not' },
  ] },
  { id: 'not', t: 'Klinisyen Notu', fields: [
    { label: 'Formülasyon ön-notu', type: 'textarea', sec: '__top', key: 'klinisyenNotu' },
  ] },
];

// ── değer oku/yaz ───────────────────────────────────────────────────────────
function readField(data: AnamnezData, f: Field): any {
  if (f.sec === '__top') return (data as any)[f.key] ?? '';
  const secObj = (data as any)[f.sec] ?? {};
  let raw = f.sub ? secObj[f.key]?.[f.sub] : secObj[f.key];
  if (f.dec) raw = f.dec(raw);
  if (f.type === 'chips') return Array.isArray(raw) ? raw : (typeof raw === 'string' && raw ? raw.split(', ') : []);
  return raw ?? (f.type === 'num' || f.type === 'scale' ? '' : '');
}

function writeField(data: AnamnezData, f: Field, uiVal: any): { sec: SecKey | '__top'; value: any } {
  let stored = f.enc ? f.enc(uiVal) : uiVal;
  if (f.type === 'num') stored = uiVal === '' ? undefined : Number(uiVal);
  if (f.type === 'scale') stored = uiVal === '' ? undefined : Number(uiVal);
  if (f.type === 'chips') stored = Array.isArray(uiVal) ? uiVal.join(', ') : uiVal;

  if (f.sec === '__top') return { sec: '__top', value: stored };
  const secObj = { ...((data as any)[f.sec] ?? {}) };
  if (f.sub) secObj[f.key] = { ...(secObj[f.key] ?? {}), [f.sub]: stored };
  else secObj[f.key] = stored;
  return { sec: f.sec, value: secObj };
}

const isFilled = (data: AnamnezData, f: Field): boolean => {
  const v = readField(data, f);
  if (f.type === 'chips') return Array.isArray(v) && v.length > 0;
  if (f.type === 'scale' || f.type === 'num') return v !== '' && v != null;
  return String(v ?? '').trim() !== '';
};

export type AnamnezV2Props = {
  data: AnamnezData;
  clientName?: string;
  clientNo?: string;
  hasPreForm?: boolean;
  onChange<K extends keyof AnamnezData>(section: K, value: AnamnezData[K]): void;
  onBack?(): void;
  onNav?(target: string): void;
  onAiFill?(): void;
  onImportPreForm?(): void;
  onSave?(): void;
};

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

export default function AnamnezV2(props: AnamnezV2Props) {
  const { data, clientName, clientNo, hasPreForm, onChange, onBack, onNav, onAiFill, onImportPreForm, onSave } = props;
  const [active, setActive] = useState('demografik');
  const [saved, setSaved] = useState(false);
  const formColRef = useRef<HTMLDivElement>(null);
  const secRefs = useRef<Record<string, HTMLElement | null>>({});

  const set = (f: Field, uiVal: any) => {
    const { sec, value } = writeField(data, f, uiVal);
    onChange(sec as any, value);
  };

  // tamamlanma
  const { pct, secState } = useMemo(() => {
    const all = SECTIONS.flatMap((s) => s.fields);
    const n = all.filter((f) => isFilled(data, f)).length;
    const secState: Record<string, '' | 'part' | 'done'> = {};
    SECTIONS.forEach((s) => {
      const c = s.fields.filter((f) => isFilled(data, f)).length;
      secState[s.id] = c === 0 ? '' : c === s.fields.length ? 'done' : 'part';
    });
    return { pct: Math.round((n / all.length) * 100), secState };
  }, [data]);

  // scroll-spy
  useEffect(() => {
    const root = formColRef.current; if (!root) return;
    const secs = Object.values(secRefs.current).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => { if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.sid!); }),
      { root, rootMargin: '-8% 0px -80% 0px', threshold: 0 },
    );
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = secRefs.current[id]; const fc = formColRef.current;
    if (el && fc) fc.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
  };

  const doSave = () => { onSave?.(); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const renderControl = (f: Field, si: number, fi: number) => {
    const v = readField(data, f);
    const id = `f-${si}-${fi}`;
    switch (f.type) {
      case 'text': case 'num':
        return <input className="inp" id={id} value={v} placeholder="—" inputMode={f.type === 'num' ? 'numeric' : undefined} onChange={(e) => set(f, e.target.value)} />;
      case 'textarea':
        return <textarea className="ta" id={id} value={v} placeholder="—" onChange={(e) => set(f, e.target.value)} />;
      case 'select':
        return <select className="sel" id={id} value={v} onChange={(e) => set(f, e.target.value)}>{f.opt!.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
      case 'radio':
        return <div className="radio">{f.opt!.map((o) => <button key={o} type="button" className={o === v ? 'on' : ''} onClick={() => set(f, o)}>{o}</button>)}</div>;
      case 'chips':
        return <div className="chips-in">{f.opt!.map((o) => {
          const on = Array.isArray(v) && v.includes(o);
          return <button key={o} type="button" className={on ? 'on' : ''} onClick={() => { const next = on ? v.filter((x: string) => x !== o) : [...v, o]; set(f, next); }}>{o}</button>;
        })}</div>;
      case 'scale': {
        const cur = v === '' ? -1 : Number(v);
        const segs = Array.from({ length: 11 }, (_, i) => i); // 0–10 gösterim
        return (
          <div className="scale">
            <div className="sh"><b>{f.label}</b><span className="sc">{v === '' ? '–' : v}<em>/{f.max}</em></span></div>
            <div className="seg">{segs.map((i) => <button key={i} type="button" className={i === cur ? 'on' : ''} onClick={() => set(f, i)}>{i}</button>)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.06em', color: 'var(--ink-faint)', marginTop: 8 }}>aralık {f.bands} · 0–10 gösteriliyor</div>
          </div>
        );
      }
    }
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="an2">
        <div className="shell">

          <div className="topbar">
            <div className="tb-left">
              <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Dosya</button>
              <div className="tb-title"><span className="e">Anamnez · ilk değerlendirme</span><b>{clientName || '—'}{clientNo ? ` · ${clientNo}` : ''}</b></div>
            </div>
            <div className="tb-right">
              <button className="tb-act ai" type="button" onClick={() => onAiFill?.()}><svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></svg>AI ile doldur</button>
              <button className="tb-act" type="button" disabled={!hasPreForm} onClick={() => onImportPreForm?.()}><svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>Ön-form içe aktar</button>
              <button className={`tb-save${saved ? ' done' : ''}`} type="button" onClick={doSave}>
                {saved
                  ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6 9 17l-5-5" /></svg>Kaydedildi</>
                  : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>Kaydet</>}
              </button>
            </div>
          </div>

          <div className="layout">
            <aside className="navcol">
              <div className="prog">
                <div className="pt"><span className="e">Tamamlanma</span><span className="pc num">{pct}%</span></div>
                <div className="track"><span className="fill" style={{ width: `${pct}%` }} /></div>
              </div>
              <nav className="navlist">
                {SECTIONS.map((s, si) => (
                  <a key={s.id} className={`navitem${s.risk ? ' risk' : ''}${active === s.id ? ' active' : ''}`} href={`#sec-${s.id}`} onClick={(e) => { e.preventDefault(); scrollTo(s.id); }}>
                    <span className="no">{String(si + 1).padStart(2, '0')}</span>
                    <span className="nm">{s.t}</span>
                    <span className={`st ${secState[s.id]}`} />
                  </a>
                ))}
              </nav>
            </aside>

            <div className="formcol" ref={formColRef}>
              <div className="form-inner">
                <div className="banner">
                  <span className="ic"><svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></svg></span>
                  <span className="bt"><b>AI ile hızlı doldur.</b> Serbest intake metnini yapıştır; AI alanları çıkarsın, sen <a href="#" onClick={(e) => { e.preventDefault(); onAiFill?.(); }}>incele &amp; onayla</a>. Yalnız onayladığın alanlar forma yazılır — uydurma yok.</span>
                </div>
                <form onSubmit={(e) => e.preventDefault()}>
                  {SECTIONS.map((s, si) => (
                    <section key={s.id} className={`fsec${s.risk ? ' risk' : ''}`} id={`sec-${s.id}`} data-sid={s.id} ref={(el) => { secRefs.current[s.id] = el; }}>
                      <div className="fsec-head"><span className="no">{String(si + 1).padStart(2, '0')}</span><h2>{s.t}</h2>{s.risk && <span className="risk-flag">risk</span>}</div>
                      {s.fields.map((f, fi) => (
                        f.type === 'scale'
                          ? <div className={`field${f.half ? ' half' : ''}`} key={fi}>{renderControl(f, si, fi)}</div>
                          : <div className={`field${f.half ? ' half' : ''}`} key={fi}><label htmlFor={`f-${si}-${fi}`}>{f.label}</label>{renderControl(f, si, fi)}</div>
                      ))}
                    </section>
                  ))}
                </form>
              </div>
            </div>
          </div>

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
