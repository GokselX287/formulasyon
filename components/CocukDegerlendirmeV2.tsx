'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './CocukDegerlendirmeV2.css';
import type { CocukData } from './CocukPanel';

// ──────────────────────────────────────────────────────────────────────────
// Çocuk Değerlendirme — "Klinik Editöryel Dosya" · Çocuk Değerlendirme v2.html.
// Anamnez ile aynı form şasisi/motoru. 11 bölüm · gerçek CocukData (JSON).
// demografik adSoyad/yas/cinsiyet gerçek anahtar; diğerleri section.id + slug
// (self-tutarlı, JSON'da kalıcı, round-trip). Uydurma yok → boş başlar.
// ──────────────────────────────────────────────────────────────────────────

type SecKey = string;
type FieldType = 'text' | 'num' | 'textarea' | 'select' | 'radio' | 'chips' | 'scale';
type Field = { label: string; type: FieldType; sec: SecKey | '__top'; key: string; sub?: string; opt?: string[]; half?: boolean; max?: number; bands?: string };
type Section = { id: string; t: string; risk?: boolean; fields: Field[] };

const SECTIONS: Section[] = [
  { id: 'demografik', t: 'Demografik', fields: [
    { label: 'Ad Soyad', type: 'text', sec: 'demografik', key: 'adSoyad', half: true },
    { label: 'Yaş', type: 'num', sec: 'demografik', key: 'yas', half: true },
    { label: 'Cinsiyet', type: 'select', sec: 'demografik', key: 'cinsiyet', opt: ['', 'Kız', 'Erkek', 'Diğer'], half: true },
    { label: 'Sınıf / okul', type: 'text', sec: 'demografik', key: 'sinif', half: true },
    { label: 'Birlikte yaşadığı kişiler', type: 'text', sec: 'demografik', key: 'birlikteYasayan' },
    { label: 'Başvuran', type: 'select', sec: 'demografik', key: 'basvuran', opt: ['', 'Anne', 'Baba', 'Her iki ebeveyn', 'Okul yönlendirmesi'], half: true },
  ] },
  { id: 'yakinma', t: 'Mevcut Yakınma', fields: [
    { label: 'Başvuru nedeni (ebeveyn ifadesi)', type: 'textarea', sec: 'yakinma', key: 'metin' },
    { label: 'Ana yakınma', type: 'text', sec: 'yakinma', key: 'anaYakinma' },
    { label: 'Başlangıç / süre', type: 'text', sec: 'yakinma', key: 'baslangic', half: true },
    { label: 'Şiddet (ebeveyn)', type: 'select', sec: 'yakinma', key: 'siddet', opt: ['', 'Hafif', 'Orta', 'İleri'], half: true },
  ] },
  { id: 'aile', t: 'Aile Sistemi', fields: [
    { label: 'Anne — yaş / meslek', type: 'text', sec: 'aile', key: 'anneNot', half: true },
    { label: 'Baba — yaş / meslek', type: 'text', sec: 'aile', key: 'babaNot', half: true },
    { label: 'Ebeveyn birlikteliği', type: 'select', sec: 'aile', key: 'birliktelik', opt: ['', 'Evli', 'Ayrı', 'Boşanmış', 'Diğer'], half: true },
    { label: 'Kardeş sayısı / sıra', type: 'text', sec: 'aile', key: 'kardesNot', half: true },
    { label: 'Aile içi ilişki / dinamik', type: 'textarea', sec: 'aile', key: 'genogram' },
    { label: 'Ailede psikiyatrik öykü', type: 'radio', sec: 'aile', key: 'psikiyatrikOyku', opt: ['Var', 'Yok', 'Bilinmiyor'] },
  ] },
  { id: 'gelisim', t: 'Gelişim Öyküsü', fields: [
    { label: 'Gebelik & doğum', type: 'textarea', sec: 'gelisim', key: 'gebelik' },
    { label: 'Gelişimsel kilometre taşları', type: 'text', sec: 'gelisim', key: 'motor', half: true },
    { label: 'Gelişimsel gecikme', type: 'radio', sec: 'gelisim', key: 'gecikme', opt: ['Var', 'Yok'], half: true },
    { label: 'Tuvalet / uyku / beslenme', type: 'text', sec: 'gelisim', key: 'tuvaletUykuBesi' },
    { label: 'Önemli tıbbi öykü', type: 'textarea', sec: 'gelisim', key: 'tibbiOyku' },
  ] },
  { id: 'okul', t: 'Okul & Akademik', fields: [
    { label: 'Akademik başarı', type: 'select', sec: 'okul', key: 'akademik', opt: ['', 'İyi', 'Orta', 'Düşük'], half: true },
    { label: 'Öğretmen şikayeti', type: 'radio', sec: 'okul', key: 'ogretmenSikayet', opt: ['Var', 'Yok'], half: true },
    { label: 'Okul içi gözlem', type: 'chips', sec: 'okul', key: 'gozlem', opt: ['Çekingen', 'Dikkat dağınık', 'Hareketli', 'Yalnız kalıyor', 'Uyumlu'] },
    { label: 'Akran ilişkileri', type: 'textarea', sec: 'okul', key: 'akranNot' },
  ] },
  { id: 'cocukbdt', t: 'Çocuk BDT Formu', fields: [
    { label: 'Tetikleyen durum', type: 'text', sec: 'cocukbdt', key: 'tetikleyen' },
    { label: 'Otomatik düşünce (çocuk)', type: 'textarea', sec: 'cocukbdt', key: 'otomatikDusunce' },
    { label: 'Duygu', type: 'text', sec: 'cocukbdt', key: 'duygu', half: true },
    { label: 'Duygu şiddeti (termometre)', type: 'scale', sec: 'cocukbdt', key: 'duyguSiddeti', max: 10, bands: '0–10', half: true },
    { label: 'Davranış', type: 'text', sec: 'cocukbdt', key: 'davranis' },
    { label: 'Alternatif / baş etme', type: 'textarea', sec: 'cocukbdt', key: 'alternatif' },
  ] },
  { id: 'oyun', t: 'Oyun Terapisi', fields: [
    { label: 'Tercih edilen materyal', type: 'chips', sec: 'oyun', key: 'materyal', opt: ['Kum tepsisi', 'Kukla', 'Çizim', 'Blok', 'Rol oyunu'] },
    { label: 'Oyun temaları / gözlem', type: 'textarea', sec: 'oyun', key: 'temalar' },
    { label: 'İlişki kurma / sınır', type: 'textarea', sec: 'oyun', key: 'iliskiSinir' },
  ] },
  { id: 'ebeveyn', t: 'Ebeveyn Tarzı', fields: [
    { label: 'Baskın ebeveyn tutumu', type: 'select', sec: 'ebeveyn', key: 'tutum', opt: ['', 'Demokratik', 'Koruyucu', 'Otoriter', 'İzin verici', 'Tutarsız'] },
    { label: 'Disiplin yöntemi', type: 'textarea', sec: 'ebeveyn', key: 'disiplin' },
    { label: 'Ebeveynler arası tutarlılık', type: 'radio', sec: 'ebeveyn', key: 'tutarlilik', opt: ['Tutarlı', 'Kısmen', 'Tutarsız'] },
  ] },
  { id: 'risk', t: 'Risk & Koruma', risk: true, fields: [
    { label: 'İhmal / istismar şüphesi', type: 'radio', sec: 'risk', key: 'abuse', opt: ['Var', 'Yok', 'Şüphe'] },
    { label: 'Kendine zarar / riskli davranış', type: 'radio', sec: 'risk', key: 'kendineZararVar', opt: ['Var', 'Yok'] },
    { label: 'Genel risk düzeyi', type: 'select', sec: 'risk', key: 'seviyeLabel', opt: ['', 'Düşük', 'Orta', 'Yüksek'] },
    { label: 'Koruma notu / yönlendirme', type: 'textarea', sec: 'risk', key: 'korumaNotu' },
  ] },
  { id: 'hedefler', t: 'Hedefler', fields: [
    { label: 'Terapi hedefleri', type: 'textarea', sec: 'hedefler', key: 'hedefler' },
    { label: 'Ebeveyn beklentisi', type: 'text', sec: 'hedefler', key: 'beklenti' },
  ] },
  { id: 'not', t: 'Klinisyen Notu', fields: [
    { label: 'Formülasyon ön-notu', type: 'textarea', sec: '__top', key: 'klinikNotu' },
  ] },
];

function readField(data: any, f: Field): any {
  if (f.sec === '__top') return data[f.key] ?? '';
  const secObj = data[f.sec] ?? {};
  const raw = f.sub ? secObj[f.key]?.[f.sub] : secObj[f.key];
  if (f.type === 'chips') return Array.isArray(raw) ? raw : (typeof raw === 'string' && raw ? raw.split(', ') : []);
  return raw ?? '';
}
function writeField(data: any, f: Field, uiVal: any): { sec: string; value: any } {
  let stored = uiVal;
  if (f.type === 'num' || f.type === 'scale') stored = uiVal === '' ? undefined : Number(uiVal);
  if (f.type === 'chips') stored = Array.isArray(uiVal) ? uiVal.join(', ') : uiVal;
  if (f.sec === '__top') return { sec: '__top', value: stored };
  const secObj = { ...(data[f.sec] ?? {}) };
  if (f.sub) secObj[f.key] = { ...(secObj[f.key] ?? {}), [f.sub]: stored };
  else secObj[f.key] = stored;
  return { sec: f.sec, value: secObj };
}
const isFilled = (data: any, f: Field): boolean => {
  const v = readField(data, f);
  if (f.type === 'chips') return Array.isArray(v) && v.length > 0;
  if (f.type === 'scale' || f.type === 'num') return v !== '' && v != null;
  return String(v ?? '').trim() !== '';
};

export type CocukDegerlendirmeV2Props = {
  data: CocukData;
  clientName?: string;
  clientNo?: string;
  hasPreForm?: boolean;
  onChange(section: string, value: any): void;
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

export default function CocukDegerlendirmeV2(props: CocukDegerlendirmeV2Props) {
  const { data, clientName, clientNo, hasPreForm, onChange, onBack, onNav, onAiFill, onImportPreForm, onSave } = props;
  const [active, setActive] = useState('demografik');
  const [saved, setSaved] = useState(false);
  const formColRef = useRef<HTMLDivElement>(null);
  const secRefs = useRef<Record<string, HTMLElement | null>>({});

  const set = (f: Field, uiVal: any) => { const { sec, value } = writeField(data, f, uiVal); onChange(sec, value); };

  const { pct, secState } = useMemo(() => {
    const all = SECTIONS.flatMap((s) => s.fields);
    const n = all.filter((f) => isFilled(data, f)).length;
    const secState: Record<string, '' | 'part' | 'done'> = {};
    SECTIONS.forEach((s) => { const c = s.fields.filter((f) => isFilled(data, f)).length; secState[s.id] = c === 0 ? '' : c === s.fields.length ? 'done' : 'part'; });
    return { pct: Math.round((n / all.length) * 100), secState };
  }, [data]);

  useEffect(() => {
    const root = formColRef.current; if (!root) return;
    const secs = Object.values(secRefs.current).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.sid!); }), { root, rootMargin: '-8% 0px -80% 0px', threshold: 0 });
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: string) => { const el = secRefs.current[id]; const fc = formColRef.current; if (el && fc) fc.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' }); };
  const doSave = () => { onSave?.(); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const renderControl = (f: Field, si: number, fi: number) => {
    const v = readField(data, f);
    const id = `cf-${si}-${fi}`;
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
        return <div className="chips-in">{f.opt!.map((o) => { const on = Array.isArray(v) && v.includes(o); return <button key={o} type="button" className={on ? 'on' : ''} onClick={() => set(f, on ? v.filter((x: string) => x !== o) : [...v, o])}>{o}</button>; })}</div>;
      case 'scale': {
        const cur = v === '' ? -1 : Number(v);
        return (
          <div className="scale">
            <div className="sh"><b>{f.label}</b><span className="sc">{v === '' ? '–' : v}<em>/{f.max}</em></span></div>
            <div className="seg">{Array.from({ length: 11 }, (_, i) => i).map((i) => <button key={i} type="button" className={i === cur ? 'on' : ''} onClick={() => set(f, i)}>{i}</button>)}</div>
          </div>
        );
      }
    }
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&display=swap" rel="stylesheet" />

      <div className="cd2">
        <div className="shell">
          <div className="topbar">
            <div className="tb-left">
              <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Dosya</button>
              <div className="tb-title"><span className="e">Çocuk / ergen · ilk değerlendirme</span><b>{clientName || '—'}{clientNo ? ` · ${clientNo}` : ''}</b></div>
            </div>
            <div className="tb-right">
              <button className="tb-act ai" type="button" onClick={() => onAiFill?.()}><svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></svg>AI ile doldur</button>
              <button className="tb-act" type="button" disabled={!hasPreForm} onClick={() => onImportPreForm?.()}><svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>Ön-form içe aktar</button>
              <button className={`tb-save${saved ? ' done' : ''}`} type="button" onClick={doSave}>
                {saved ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6 9 17l-5-5" /></svg>Kaydedildi</> : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>Kaydet</>}
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
                    <span className="no">{String(si + 1).padStart(2, '0')}</span><span className="nm">{s.t}</span><span className={`st ${secState[s.id]}`} />
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
                          : <div className={`field${f.half ? ' half' : ''}`} key={fi}><label htmlFor={`cf-${si}-${fi}`}>{f.label}</label>{renderControl(f, si, fi)}</div>
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
