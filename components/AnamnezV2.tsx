'use client';

import { useEffect, useRef, useState } from 'react';
import './AnamnezV2.css';
import type { AnamnezData } from './AnamnezPanel';

// ──────────────────────────────────────────────────────────────────────────
// Anamnez editörü — landing uyumlu ("mesh + opal cam") tasarım.
// Cv görsel-42 / design_handoff_anamnez portu. AnaSayfaLanding/.aslx · Terapist/.tpx
// ile kardeş kabuk. SCHEMA statik (form tanımı), DATA props'tan gelir; her düzenleme
// onChange(section, value) ile parent'a yazılır (parent /api/anamnez'e autosave eder).
// 12 bölüm · text/num/textarea/select/radio/suggest/chipsadd/scale + ölçek paneli ·
// tamamlanma halkası · zorunlu-alan kapısı · sol ray scroll-spy · 5 temalı dock.
// ──────────────────────────────────────────────────────────────────────────

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
  onOpenDongu?(): void;
  onValidityChange?(ok: boolean): void;
};

type FieldType = 'text' | 'num' | 'textarea' | 'select' | 'radio' | 'suggest' | 'chipsadd' | 'scale';
type Field = { l: string; p: string; t: FieldType; o?: string[]; sug?: string; full?: boolean; req?: boolean; ph?: string };
type Section = { id: string; no: string; title: string; eye?: string; danger?: boolean; special?: 'olcek'; fields?: Field[] };

const NAV: { label: string; target: string }[] = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Takvim', target: 'calendar' },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
];
const THEMES: [string, string][] = [['rose', '#E59FB6'], ['sage', '#9FBE96'], ['ocean', '#9DC4D6'], ['dusk', '#AEB2CC'], ['clay', '#E3A982']];

const SUGG: Record<string, string[]> = {
  kendiSifatlar: ['Kaygılı', 'Kaçıngan', 'Öfkeli', 'Mükemmeliyetçi', 'İçe Dönük', 'Kontrolcü', 'Duyarlı'],
  anaYakinma: ['OKB', 'Yıkama Kompulsiyonu', 'Kontrol Etme', 'Bulaşma Obsesyonu', 'Yaygın Kaygı'],
  destekNot: ['Eş', 'Yakın Arkadaş', 'Aile', 'Meslektaş', 'Spor Grubu'],
  meslek: ['Yazılımcı', 'Öğretmen', 'Mühendis', 'Hemşire', 'Avukat', 'Esnaf', 'Öğrenci', 'Muhasebeci'],
  sehir: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep'],
  ilce: ['Kadıköy', 'Beşiktaş', 'Çankaya', 'Konak', 'Nilüfer', 'Muratpaşa'],
  bilisselHatalar: ['Felaketleştirme', 'Zihin Okuma', 'Falcılık', 'Olumluyu Görmezden Gelme', 'Ya Hep Ya Hiç Düşüncesi', 'Duygusal Muhakeme', 'Etiketleme', 'Kişiselleştirme', 'Seçici Soyutlama', '"Olmalı/Gerekir" İfadeleri', 'Büyütme / Küçümseme'],
  baskinDuygular: ['Kaygı', 'Üzüntü', 'Öfke', 'Korku', 'Suçluluk', 'Utanç', 'Kıskançlık', 'Yalnızlık', 'Umutsuzluk', 'Panik', 'İsteksizlik', 'Boşluk'],
};

const SCHEMA: Section[] = [
  { id: 'demografik', no: '01', title: 'Kişisel bilgiler', eye: 'kimlik', fields: [
    { l: 'Ad Soyad', p: 'demografik.adSoyad', t: 'text', full: true },
    { l: 'Yaş', p: 'demografik.yas', t: 'num' },
    { l: 'Cinsiyet', p: 'demografik.cinsiyet', t: 'select', o: ['Kadın', 'Erkek', 'Diğer'] },
    { l: 'Medeni durum', p: 'demografik.medeniDurum', t: 'select', o: ['Bekâr', 'Evli', 'Boşanmış', 'Dul'] },
    { l: 'Meslek', p: 'demografik.meslek', t: 'suggest', sug: 'meslek' },
    { l: 'Şehir', p: 'demografik.sehir', t: 'suggest', sug: 'sehir' },
    { l: 'İlçe', p: 'demografik.ilce', t: 'suggest', sug: 'ilce' },
    { l: 'İş durumu', p: 'isSosyal.isDurumu', t: 'select', o: ['Çalışıyor (ücretli)', 'Kendi işi / serbest', 'Çalışmıyor', 'İş arıyor', 'Öğrenci', 'Emekli', 'Ev içi'] },
    { l: 'Kendini hangi sıfatlarla tanımlıyor?', p: 'demografik.kendiSifatlar', t: 'chipsadd', sug: 'kendiSifatlar', full: true },
  ] },
  { id: 'basvuru', no: '02', title: 'Başvuru & şikâyet', eye: 'giriş', fields: [
    { l: 'Başvuru nedeni', p: 'basvuru.sebep', t: 'textarea', full: true },
    { l: 'Terapistin düşündüğü sorunlar', p: 'basvuru.anaYakinma', t: 'chipsadd', sug: 'anaYakinma', full: true },
    { l: 'Başvuru şekli', p: 'basvuru.yonlendiren', t: 'select', o: ['Kendi başvurdu', 'Hekim yönlendirmesi', 'Aile yönlendirmesi', 'Online'] },
    { l: 'Görüşme şekli', p: 'basvuru.gorusmeSekli', t: 'radio', o: ['Yüz yüze', 'Online', 'Hibrit'] },
    { l: 'Şikâyet süresi / başlangıcı', p: 'sikayet.baslangic', t: 'textarea', full: true },
    { l: 'Vurucu olay', p: 'sikayet.vurucuOlay', t: 'textarea', full: true },
    { l: 'Tetikleyiciler', p: 'sikayet.tetikleyicilerNot', t: 'textarea', full: true, req: true },
    { l: 'Şikâyet yoğunluğu', p: 'sikayet.siddet', t: 'scale', full: true },
  ] },
  { id: 'psikiyatrik', no: '03', title: 'Psikiyatrik & tıbbi', eye: 'öykü', fields: [
    { l: 'Önceki psikolojik başvuru', p: 'psikiyatrik.oncekiBasvuru', t: 'radio', o: ['Var', 'Yok'] },
    { l: 'Yatış öyküsü', p: 'psikiyatrik.yatis.var', t: 'radio', o: ['Var', 'Yok'] },
    { l: 'Psikiyatrik ilaç', p: 'psikiyatrik.ilacNot', t: 'textarea', full: true },
    { l: 'Kronik hastalık', p: 'tibbi.kronikNot', t: 'textarea', full: true },
    { l: 'Kullandığı tıbbi ilaçlar', p: 'tibbi.ilac', t: 'textarea', full: true },
  ] },
  { id: 'aile', no: '04', title: 'Aile öyküsü', eye: 'köken', fields: [
    { l: 'Ailede psikolojik öykü', p: 'aile.genogram', t: 'textarea', full: true },
    { l: 'Anne sağ mı?', p: 'aile.anneSag', t: 'radio', o: ['Sağ', 'Vefat'] },
    { l: 'Baba sağ mı?', p: 'aile.babaSag', t: 'radio', o: ['Sağ', 'Vefat'] },
    { l: 'Anneyi tarifle', p: 'aile.anneTarif', t: 'textarea', full: true },
    { l: 'Babayı tarifle', p: 'aile.babaTarif', t: 'textarea', full: true },
    { l: 'Anne–baba ilişkisi', p: 'aile.anneBabaIliski', t: 'textarea', full: true },
    { l: 'Kardeşler', p: 'aile.kardesDurum', t: 'text' },
    { l: 'İstismar / eşitsizlik', p: 'aile.istismarVar', t: 'radio', o: ['Var', 'Yok', 'Belirsiz'] },
    { l: 'Kardeşleri tarifle', p: 'aile.kardesTarif', t: 'textarea', full: true },
    { l: 'Ebeveyn rolü üstlenen kardeş', p: 'aile.ebeveynRolKardes', t: 'textarea', full: true },
    { l: 'Varsa istismarı belirt', p: 'aile.istismarNot', t: 'textarea', full: true },
  ] },
  { id: 'madde', no: '05', title: 'Madde kullanımı', eye: 'alışkanlık', fields: [
    { l: 'Alkol', p: 'madde.alkol', t: 'radio', o: ['Yok', 'Ara sıra', 'Düzenli'] },
    { l: 'Sigara', p: 'madde.sigara', t: 'radio', o: ['Yok', 'Ara sıra', 'Düzenli'] },
    { l: 'Madde', p: 'madde.madde', t: 'radio', o: ['Yok', 'Var'] },
  ] },
  { id: 'gelisim', no: '06', title: 'Danışanın hikâyesi', eye: 'gelişim', fields: [
    { l: 'Çocukluk dönemi', p: 'gelisim.cocuklukTarif', t: 'textarea', full: true },
    { l: 'Ergenlik dönemi', p: 'gelisim.ergenlikTarif', t: 'textarea', full: true },
    { l: 'O dönemki destek', p: 'gelisim.erkenDestek', t: 'textarea', full: true },
    { l: 'Önemli yaşam olayları', p: 'gelisim.yasamOlaylari', t: 'textarea', full: true },
  ] },
  { id: 'iliskiler', no: '07', title: 'İlişkiler', eye: 'bağ', fields: [
    { l: 'İlişki durumu', p: 'iliskiler.romantik', t: 'text' },
    { l: 'Bağlanma stili', p: 'iliskiler.baglanmaStili', t: 'radio', o: ['Güvenli', 'Kaygılı', 'Kaçıngan'] },
    { l: 'İlişki örüntüleri', p: 'iliskiler.baglanma', t: 'textarea', full: true },
    { l: 'Sosyal destek ve arkadaş ilişkileri', p: 'isSosyal.destekNot', t: 'chipsadd', sug: 'destekNot', full: true },
    { l: 'İlişkide sorun puanı', p: 'isSosyal.iliskiSorunPuan', t: 'scale', full: true },
  ] },
  { id: 'bilisdavranis', no: '08', title: 'Bilişsel-davranışsal profil', eye: 'biliş-davranış', fields: [
    { l: 'Otomatik düşünceler', p: 'bdt.otomatikDusunce', t: 'textarea', full: true },
    { l: 'Ben inancı', p: 'bdt.benInanci', t: 'text' },
    { l: 'Dünya inancı', p: 'bdt.dunyaInanci', t: 'text' },
    { l: 'Gelecek inancı', p: 'bdt.gelecekInanci', t: 'text' },
    { l: 'Bilişsel hatalar', p: 'bdt.bilisselHatalar', t: 'chipsadd', sug: 'bilisselHatalar', full: true },
    { l: 'Kaçınılan durumlar', p: 'bdt.kacinanDurumlar', t: 'textarea', full: true },
    { l: 'Güvenlik davranışları', p: 'bdt.guvenlikDavranislari', t: 'textarea', full: true },
    { l: 'Baskın duygular', p: 'bdt.baskinDuygular', t: 'chipsadd', sug: 'baskinDuygular', full: true },
    { l: 'Duygu tetikleyicileri', p: 'bdt.duyguTetikleyicileri', t: 'textarea', full: true },
    { l: 'Duygu düzenleme becerisi', p: 'bdt.duyguDuzenleme', t: 'textarea', full: true },
    { l: 'Günlük yaşama / işlevselliğe etkisi', p: 'bdt.gunlukEtki', t: 'textarea', full: true },
  ] },
  { id: 'travma', no: '09', title: 'Travma', eye: 'yük', fields: [
    { l: 'Travma öyküsü', p: 'travma.travmaVar', t: 'radio', o: ['Var', 'Yok'] },
    { l: 'Açıklama', p: 'travma.travmaNot', t: 'textarea', full: true },
  ] },
  { id: 'risk', no: '10', title: 'Risk değerlendirme', eye: 'güvenlik', danger: true, fields: [
    { l: 'İntihar düşüncesi', p: 'risk.intihar', t: 'radio', o: ['Var', 'Yok'] },
    { l: 'Plan / niyet', p: 'risk.planNiyet', t: 'radio', o: ['Var', 'Yok'] },
    { l: 'Kendine zarar verme', p: 'risk.zarar', t: 'radio', o: ['Aktif', 'Yok'] },
    { l: 'Başkasına zarar riski', p: 'risk.baskasi', t: 'radio', o: ['Risk', 'Yok'] },
    { l: 'Genel risk düzeyi', p: 'risk.seviye', t: 'select', o: ['Düşük', 'Orta', 'Yüksek'] },
  ] },
  { id: 'hedefler', no: '11', title: 'Hedefler', eye: 'yön', fields: [
    { l: 'Terapi hedefleri', p: 'hedefler.hedeflerNot', t: 'textarea', full: true },
    { l: 'Beklenti / motivasyon', p: 'hedefler.beklenti', t: 'textarea', full: true },
    { l: 'Güçlü yönler / kaynaklar', p: 'hedefler.gucluYonler', t: 'textarea', full: true },
  ] },
  { id: 'olcekler', no: '12', title: 'Ölçekler', eye: 'ön-form', special: 'olcek' },
  { id: 'klinisyen', no: '13', title: 'Klinisyen notu', eye: 'sentez', fields: [
    { l: 'Çalışılacak konular', p: 'klinisyenNotu', t: 'textarea', full: true, ph: 'Değersizlik inancını sınama\nKaçınmayı azaltma\nDuygu düzenleme' },
  ] },
];

const REQ: { sec: Section; f: Field }[] = [];
SCHEMA.forEach((s) => s.fields?.forEach((f) => { if (f.req) REQ.push({ sec: s, f }); }));
const OLC_MAX: Record<string, number> = { phq9: 27, gad7: 21 };
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
function loadSugg(sug?: string): string[] {
  const seed = (sug && SUGG[sug]) || [];
  if (!sug) return seed;
  let saved: string[] = [];
  try { const a = JSON.parse(localStorage.getItem(`anamnez-sugg-${sug}`) || '[]'); if (Array.isArray(a)) saved = a.filter((x) => typeof x === 'string'); } catch { /* yok */ }
  const seen = new Set<string>(); const out: string[] = [];
  for (const t of [...saved, ...seed]) { const k = lcTr(t); if (!seen.has(k)) { seen.add(k); out.push(t); } }
  return out;
}
function rememberSugg(sug: string | undefined, raw: string) {
  if (!sug) return; const t = raw.trim(); if (t.length < 2) return;
  try {
    const a = JSON.parse(localStorage.getItem(`anamnez-sugg-${sug}`) || '[]');
    const list = Array.isArray(a) ? a.filter((x: any) => typeof x === 'string') : [];
    const filtered = list.filter((x: string) => lcTr(x) !== lcTr(t));
    filtered.unshift(t);
    localStorage.setItem(`anamnez-sugg-${sug}`, JSON.stringify(filtered.slice(0, 300)));
  } catch { /* yok */ }
}

/* auto-grow textarea */
function AutoTextarea({ value, placeholder, onChange }: { value: string; placeholder?: string; onChange(v: string): void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const grow = () => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } };
  useEffect(grow, [value]);
  return <textarea ref={ref} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export default function AnamnezV2(props: AnamnezV2Props) {
  const { data, clientName, clientNo, hasPreForm, onChange, onBack, onNav, onAiFill, onImportPreForm, onSave, onOpenDongu, onValidityChange } = props;

  const [theme, setTheme] = useState('rose');
  const [active, setActive] = useState('demografik');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ p: string; val: string } | null>(null);
  const [pulled, setPulled] = useState(false);
  const saveT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try { const t = localStorage.getItem('calmie-theme'); if (t && THEMES.some(([x]) => x === t)) setTheme(t); } catch {}
  }, []);
  const applyTheme = (t: string) => { setTheme(t); try { localStorage.setItem('calmie-theme', t); } catch {} };

  /* veri yazımı — bölüm-bazlı onChange + autosave göstergesi */
  const markSaving = () => {
    setSaving(true);
    if (saveT.current) clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      setSaving(false);
      setSavedAt(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    }, 800);
  };
  const setV = (p: string, val: any) => {
    const keys = p.split('.');
    const topKey = keys[0] as keyof AnamnezData;
    const newTop = keys.length === 1 ? val : setIn((data as any)[topKey] ?? {}, keys.slice(1), val);
    onChange(topKey, newTop as AnamnezData[typeof topKey]);
    markSaving();
  };

  /* tamamlanma */
  const secStatus = (s: Section): '' | 'part' | 'done' => {
    if (s.special === 'olcek') return hasPreForm ? 'done' : '';
    const fields = s.fields ?? []; const total = fields.length;
    let n = 0; fields.forEach((f) => { if (filled(getV(data, f.p))) n++; });
    return n === 0 ? '' : n >= total ? 'done' : 'part';
  };
  const doneCount = SCHEMA.filter((s) => secStatus(s) === 'done').length;
  const pct = Math.round((doneCount / SCHEMA.length) * 100);
  const C = 2 * Math.PI * 31;

  /* zorunlu kapı */
  const missing = REQ.filter((r) => !filled(getV(data, r.f.p)));
  useEffect(() => { onValidityChange?.(missing.length === 0); }, [missing.length, onValidityChange]);

  /* scroll-spy + ray navigasyon (window scroll, 92px ofset) */
  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight * 0.34;
      let cur = SCHEMA[0].id;
      for (const s of SCHEMA) {
        const el = document.getElementById('anx-sec-' + s.id);
        if (el && el.getBoundingClientRect().top <= mid) cur = s.id;
      }
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const goTo = (id: string) => {
    const el = document.getElementById('anx-sec-' + id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 92, behavior: 'smooth' });
  };

  const name = (clientName ?? '').trim() || 'Danışan';
  const initials = name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR') || 'DA';

  /* chipsadd yardımcıları */
  const chipArr = (p: string): string[] => { const v = getV(data, p); return Array.isArray(v) ? v : []; };
  const chipRemove = (p: string, i: number) => { const a = chipArr(p).slice(); a.splice(i, 1); setV(p, a); };
  const chipPush = (p: string, sug: string | undefined, val: string) => { const t = val.trim(); if (!t) return; setV(p, [...chipArr(p), t]); rememberSugg(sug, t); };

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
      case 'suggest':
        return <input className="inp" type="text" value={v ?? ''} placeholder="Yaz veya seç…" list={`anx-dl-${f.sug}`} onChange={(e) => setV(f.p, e.target.value)} onBlur={(e) => rememberSugg(f.sug, e.target.value)} />;
      case 'chipsadd': {
        const arr = chipArr(f.p);
        const sug = loadSugg(f.sug).filter((s) => !arr.some((a) => lcTr(a) === lcTr(s)));
        const isAdding = adding?.p === f.p;
        return (
          <div className="chipsadd">
            <div className="chips">
              {arr.map((c, i) => (
                <span className="chip" key={c + i}>{c}<button type="button" aria-label="kaldır" onClick={() => chipRemove(f.p, i)}>×</button></span>
              ))}
              {isAdding ? (
                <input className="chip-inp" autoFocus placeholder="yaz + Enter" value={adding!.val}
                  onChange={(e) => setAdding({ p: f.p, val: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); chipPush(f.p, f.sug, adding!.val); setAdding(null); } if (e.key === 'Escape') setAdding(null); }}
                  onBlur={() => { chipPush(f.p, f.sug, adding!.val); setAdding(null); }} />
              ) : (
                <button type="button" className="chip-add" onClick={() => setAdding({ p: f.p, val: '' })}>+ ekle</button>
              )}
            </div>
            {sug.length > 0 && (
              <div className="sugg">
                <span className="sugg-lab">öneriler</span>
                {sug.map((s) => <button key={s} type="button" className="sugg-chip" onClick={() => chipPush(f.p, f.sug, s)}>{s}</button>)}
              </div>
            )}
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

  const renderField = (f: Field) => {
    const miss = !!f.req && !filled(getV(data, f.p));
    return (
      <div key={f.p} className={'fld' + (f.full ? ' full' : '') + (miss ? ' req-miss' : '')}>
        <label className="fld-lab">{f.l}{f.req && <span className="req">zorunlu</span>}</label>
        <div className="fld-ctrl">{renderCtrl(f)}</div>
      </div>
    );
  };

  const renderOlcek = () => {
    const o: any = (data as any).olcekler || {};
    const card = (key: string, nm: string, sub: string) => {
      const d = o[key]; if (!d) return null;
      const cls = d.cls || (d.sinif === 'Yüksek' ? 'yuksek' : d.sinif === 'Düşük' ? 'dusuk' : 'orta');
      return (
        <div className="olc-card" key={key}>
          <div className="olc-eye">{nm}</div>
          <div className="olc-name">{sub}</div>
          <div className="olc-score"><b>{d.skor}</b><small>/ {d.max || OLC_MAX[key] || 27}</small></div>
          <div className="olc-meta"><span className={'olc-cls ' + cls}>{d.sinif || '—'}</span><span className="olc-date">{d.tarih || ''}</span></div>
        </div>
      );
    };
    const cards = [card('phq9', 'PHQ-9', 'Depresyon ölçeği'), card('gad7', 'GAD-7', 'Anksiyete ölçeği')].filter(Boolean);
    const show = hasPreForm && cards.length > 0;
    return (
      <>
        <p className="olc-lead">Bu skorlar elle girilmez; danışanın doldurduğu ön-formdan otomatik aktarılır.</p>
        {show ? (
          <>
            <div className="olc">{cards}</div>
            <button className="btn btn-ghost olc-import" type="button" disabled={pulled} onClick={() => { setPulled(true); onImportPreForm?.(); }}>
              {pulled
                ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Ön-formdan güncel</>
                : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6" /></svg>Ölçek verilerini ön-formdan çek</>}
            </button>
          </>
        ) : (
          <div className="olc"><div className="olc-empty"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>Ön-form yanıtı yok — ölçek skorları otomatik çekilemiyor.</div></div>
        )}
      </>
    );
  };

  return (
    <div className="anx" data-theme={theme}>
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
          <button className="menu-btn" aria-label="Menü" onClick={() => setMobileMenu((v) => !v)}><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
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
            <b>Anamnez</b>
          </div>
          <div className="top-row">
            <div className="top-id">
              <div className="top-av">{initials}</div>
              <div className="top-meta">
                <div className="top-eye">İlk değerlendirme · Anamnez</div>
                <h1 className="top-name">{name}<span>{clientNo || ''}</span></h1>
                <div className="top-sub">Tüm bölümleri doldur — bittiğinde Sorun Döngüleri&apos;ne geç.</div>
              </div>
            </div>
            <div className="top-right">
              <div className="compl">
                <div className="compl-ring">
                  <svg width="74" height="74" viewBox="0 0 74 74">
                    <circle cx="37" cy="37" r="31" fill="none" stroke="rgba(35,34,42,.10)" strokeWidth="7" />
                    <circle cx="37" cy="37" r="31" fill="none" stroke="url(#anxcg)" strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - doneCount / SCHEMA.length)).toFixed(1)} style={{ transition: 'stroke-dashoffset .5s' }} />
                    <defs><linearGradient id="anxcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--viz-a)" /><stop offset="1" stopColor="var(--viz-b)" /></linearGradient></defs>
                  </svg>
                  <div className="pct">{pct}%</div>
                </div>
                <div className="compl-txt">
                  <b>{doneCount}/{SCHEMA.length} bölüm</b>
                  <span className={'compl-save' + (saving ? ' saving' : '')}><span className="dot" />{saving ? 'Kaydediliyor…' : savedAt ? `Kaydedildi · ${savedAt}` : 'Kaydedildi'}</span>
                </div>
              </div>
              <div className="top-actions">
                <button className="btn btn-ghost" type="button" onClick={() => onAiFill?.()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M5 12H2M22 12h-3M6 6l-2-2M20 20l-2-2M18 6l2-2M4 20l2-2" /><circle cx="12" cy="12" r="4" /></svg>AI ile doldur</button>
                <button className="btn btn-ghost" type="button" onClick={() => onImportPreForm?.()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M8 11l4 4 4-4M4 19h16" /></svg>Ön-form içe aktar</button>
                <button className="btn btn-primary" type="button" onClick={() => onSave?.()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
        <div className="gatebar">
          <div className={'gate' + (missing.length ? ' show' : '')}>
            <svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
            <span><b>Zorunlu:</b> {missing.map((r) => r.f.l).join(', ')} alanı boş.</span>
            <button type="button" onClick={() => missing[0] && goTo(missing[0].sec.id)}>Alana git</button>
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
              <section key={s.id} className={'acard' + (s.danger ? ' danger' : '')} id={'anx-sec-' + s.id}>
                <div className="ac-head">
                  <span className="ac-no">{s.no}</span>
                  <h2 className="ac-title">{s.title}</h2>
                  {s.danger
                    ? <span className="ac-danger-note"><svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>Güvenlik bölümü</span>
                    : <span className="ac-eye">{s.eye}</span>}
                </div>
                {s.special === 'olcek' ? renderOlcek() : <div className="fgrid">{s.fields!.map(renderField)}</div>}
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
            <h2 className="endcta-t">Anamnez tamam — <span className="ser">Sorun Döngüleri</span>&apos;ne geç.</h2>
            <p className="endcta-p">Topladığın bilgiyi formülasyona dönüştür; danışanın döngülerini birlikte haritalandırın.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => onOpenDongu?.()}>Sorun Döngüleri<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
        </div>
      </section>

      {/* FOOTER */}
      <div className="footwrap">
        <footer>
          <div className="foot-grid">
            <div className="foot-brand">
              <span className="logo" style={{ fontSize: 21, fontWeight: 600, color: '#fff' }}>Calmie<i style={{ fontStyle: 'italic', color: 'var(--txt-accent)' }}>.</i></span>
              <p>Sadece işini yapmak isteyenler için klinik asistan.</p>
            </div>
            <div className="foot-col">
              <h4>Panel</h4>
              <a onClick={() => onNav?.('home')}>Ana Sayfa</a>
              <a onClick={() => onNav?.('calendar')}>Takvim &amp; Randevular</a>
              <a onClick={() => onBack?.()}>Danışanlar</a>
            </div>
            <div className="foot-col">
              <h4>Dosya</h4>
              <a onClick={() => goTo('demografik')}>Anamnez</a>
              <a onClick={() => onOpenDongu?.()}>Sorun Döngüleri</a>
              <a onClick={() => onNav?.('terapist')}>Profil</a>
            </div>
          </div>
          <div className="foot-bottom"><small>© 2026 Calmie</small><div className="foot-legal"><a>{name}{clientNo ? ` · ${clientNo}` : ''}</a></div></div>
        </footer>
      </div>

      {/* DOCK */}
      <div className="dock" aria-label="Renk teması">
        {THEMES.map(([t, c]) => <button key={t} type="button" className={'dock-dot' + (theme === t ? ' on' : '')} style={{ background: c }} title={t} aria-label={`${t} tema`} onClick={() => applyTheme(t)} />)}
      </div>

      {/* datalists (suggest) */}
      {['meslek', 'sehir', 'ilce'].map((k) => (
        <datalist key={k} id={`anx-dl-${k}`}>{loadSugg(k).map((o) => <option key={o} value={o} />)}</datalist>
      ))}
    </div>
  );
}
