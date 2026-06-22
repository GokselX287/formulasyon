'use client';

import { useEffect, useState } from 'react';
import './FormulasyonV2.css';
import type { FourP, Hexaflex } from '@/lib/types';
import DanisanSayfasiModal from './DanisanSayfasiModal';
import { DEFAULT_HEX_SCALE, type HexGroup } from '@/lib/hexaflexScale';

// ──────────────────────────────────────────────────────────────────────────
// Klinik Formülasyon — "Klinik Editöryel Dosya" · Klinik Formülasyon v2.html port.
// 6 sekme: 4P · ACT Hexaflex (radar) · Bozukluk Döngüsü · Vaka Haritası ·
// Değer Kartları · Şablonlar & Ekler. Gerçek veriye bağlı: 4P + Hexaflex +
// summary + maturity (yoksa tasarım örneği — mevcut panelle aynı davranış).
// SVG koordinatları yuvarlanır (hidrasyon hijyeni).
// ──────────────────────────────────────────────────────────────────────────

export type FormulasyonV2Props = {
  client?: { id?: string; name?: string; issue?: string };
  clientPhone?: string;
  fourP?: FourP;
  hexaflex?: Hexaflex;
  summary?: string;
  maturity?: number;
  onBack?(): void;
  onNav?(target: string): void;
  onSave?(): void;
  onOpenLibrary?(): void;
  onApplyTemplate?(key: 'p4' | 'hex' | 'cycle'): void;
  interventionsPlanned?: string[];
};

type TabId = 'p4' | 'hex' | 'cycle' | 'map' | 'values' | 'tmpl';

const TABS: { id: TabId; label: string }[] = [
  { id: 'p4', label: 'Sorunun kökleri ve sürdürücüleri' }, { id: 'hex', label: 'Psikolojik esneklik' }, { id: 'cycle', label: 'Düşünce–duygu–davranış döngüsü' },
  { id: 'map', label: 'Bütünleşik harita' }, { id: 'values', label: 'Danışan için önemli olanlar' }, { id: 'tmpl', label: 'Şablonlar & ekler' },
];

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

// Tasarım örnek verisi (gerçek kaynağı olmayan sekmeler için fallback)
const EX_FOURP: FourP = {
  predisposing: ['Aile desteğinin azlığı', 'Belirgin travma öyküsü', 'Hassas / kaygılı mizaç'],
  precipitating: ['Boşanma süreci', 'İş değişikliği (2 yıl önce)', 'Toplantıda eleştiri anısı'],
  perpetuating: ['Deneyimsel kaçınma', 'Güvenlik davranışları', 'Aşırı hazırlık / kontrol'],
  protective: ['Güçlü sosyallik', 'Destekleyici arkadaşlık', 'Maddi olarak güçlü olmak'],
};
const EX_HEX: Hexaflex = { fusion: 3, avoidance: 5, presentMoment: 6, selfAsContent: 5, values: 8, committedAction: 6 };
const EX_CYCLE = [
  { t: 'Durum', m: 'Toplantıda söz alma anı' },
  { t: 'Düşünce', m: '“Herkes beni beceriksiz görüyor”' },
  { t: 'Duygu', m: 'Kaygı, utanç (SUDS 7)' },
  { t: 'Beden', m: 'Yüz kızarması, çarpıntı' },
  { t: 'Davranış', m: 'Susma / kaçınma → kısa rahatlama' },
];
const EX_VALUES = [
  { n: 'Otantiklik', imp: 9, act: 5, a: 'Toplantıda hazırlıksız da olsa gerçek fikrini söylemek.' },
  { n: 'Bağ kurma', imp: 8, act: 6, a: 'Eşiyle günlük açık paylaşım ritmi.' },
  { n: 'Gelişim', imp: 7, act: 7, a: 'Yeni alan öğrenme; konfor dışına çıkma.' },
  { n: 'Dürüstlük', imp: 8, act: 6, a: 'Hayır diyebilmek; sınır koymak.' },
];
const EX_TEMPLATES = [
  { t: '4P Formülasyon şablonu', s: '4P alanlarına başlangıç maddeleri ekler', tab: 'p4' as const },
  { t: 'ACT Vaka Kavramsallaştırma', s: 'Hexaflex sekmesini açar', tab: 'hex' as const },
  { t: 'Bozukluk döngüsü (Beck)', s: 'Döngü sekmesini açar', tab: 'cycle' as const },
];
const EX_ATTACH = [
  { t: 'Maruziyet hiyerarşisi.pdf', s: 'Eklendi · 2 gün önce' },
  { t: 'Değerler çalışması.png', s: 'Seans 5 · görsel' },
];

const r2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number) => Math.max(0, Math.min(10, n));

// Hexaflex modeli → tasarımın 6 ekseni
function hexAxes(h: Hexaflex) {
  return [
    { ax: 'Şimdiki an', val: clamp(h.presentMoment) },
    { ax: 'Kabul', val: clamp(10 - h.avoidance) },
    { ax: 'Defüzyon', val: clamp(10 - h.fusion) },
    { ax: 'Bağlamsal benlik', val: clamp(10 - h.selfAsContent) },
    { ax: 'Değerler', val: clamp(h.values) },
    { ax: 'Kararlı eylem', val: clamp(h.committedAction) },
  ];
}

const PHead = ({ eyebrow, title, desc }: { eyebrow: string; title: React.ReactNode; desc?: string }) => (
  <div className="phead"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{desc && <p>{desc}</p>}</div>
);

function HexRadar({ axes }: { axes: { ax: string; val: number }[] }) {
  const W = 440, H = 380, cx = W / 2, cy = H / 2 + 6, R = 130, N = axes.length, max = 10;
  const ang = (i: number) => (-90 + i * 360 / N) * Math.PI / 180;
  const pt = (i: number, rad: number): [number, number] => [r2(cx + Math.cos(ang(i)) * rad), r2(cy + Math.sin(ang(i)) * rad)];
  const rings = [0.25, 0.5, 0.75, 1].map((f, k) => (
    <polygon key={k} points={axes.map((_, i) => pt(i, R * f).join(',')).join(' ')} fill="none" stroke="rgba(42,41,38,.09)" strokeWidth="1" />
  ));
  const spokes = axes.map((_, i) => { const [o, oy] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={o} y2={oy} stroke="rgba(42,41,38,.1)" strokeWidth="1" />; });
  const valsP = axes.map((a, i) => pt(i, R * (a.val / max)).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="ACT Hexaflex radar">
      <defs>
        <linearGradient id="fm2vg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF9A86" /><stop offset="0.55" stopColor="#FB6F8E" /><stop offset="1" stopColor="#8E72C2" /></linearGradient>
        <linearGradient id="fm2vgf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF9A86" stopOpacity="0.28" /><stop offset="1" stopColor="#8E72C2" stopOpacity="0.22" /></linearGradient>
      </defs>
      {rings}{spokes}
      <polygon points={valsP} fill="url(#fm2vgf)" stroke="url(#fm2vg)" strokeWidth="2.5" strokeLinejoin="round" />
      {axes.map((a, i) => { const [x, y] = pt(i, R * (a.val / max)); return <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="url(#fm2vg)" strokeWidth="2.5" />; })}
      {axes.map((a, i) => {
        const [lx, ly] = pt(i, R + 24);
        const anchor = Math.abs(lx - cx) < 8 ? 'middle' : (lx > cx ? 'start' : 'end');
        return <text key={i} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="10.5" fontWeight="700" fill="#57554F">{a.ax}</text>;
      })}
    </svg>
  );
}

function CycleDiagram({ nodes }: { nodes: { t: string; m: string }[] }) {
  const N = nodes.length;
  const pos = nodes.map((_, i) => { const a = (-90 + i * 360 / N) * Math.PI / 180; return [r2(50 + Math.cos(a) * 38), r2(50 + Math.sin(a) * 36)]; });
  return (
    <div className="diagram">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs><marker id="fm2ah" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#B5654A" /></marker></defs>
        {nodes.map((_, i) => {
          const a = pos[i], b = pos[(i + 1) % N];
          const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
          const cxp = r2(mx - dy * 0.18), cyp = r2(my + dx * 0.18);
          return <path key={i} d={`M${a[0]} ${a[1]} Q ${cxp} ${cyp} ${b[0]} ${b[1]}`} fill="none" stroke="#B5654A" strokeWidth="0.5" opacity="0.5" markerEnd="url(#fm2ah)" />;
        })}
      </svg>
      {nodes.map((n, i) => (
        <div className="node" key={i} style={{ left: `${pos[i][0]}%`, top: `${pos[i][1]}%` }}>
          <div className="nb"><div className="nt">{String(i + 1).padStart(2, '0')} · {n.t}</div><div className="nm">{n.m}</div></div>
        </div>
      ))}
    </div>
  );
}

function MapDiagram({ center, branches }: { center: string; branches: { t: string; m: string }[] }) {
  const N = branches.length, c = [50, 50];
  const pos = branches.map((_, i) => { const a = (-90 + i * 360 / N) * Math.PI / 180; return [r2(50 + Math.cos(a) * 36), r2(50 + Math.sin(a) * 34)]; });
  return (
    <div className="diagram">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        {pos.map((p, i) => { const mx = r2((c[0] + p[0]) / 2); return <path key={i} d={`M${c[0]} ${c[1]} C ${mx} ${c[1]}, ${mx} ${p[1]}, ${p[0]} ${p[1]}`} fill="none" stroke="rgba(42,41,38,.18)" strokeWidth="0.5" />; })}
      </svg>
      <div className="node center" style={{ left: '50%', top: '50%' }}><div className="nb"><div className="nt">vaka</div><div className="nm">{center}</div></div></div>
      {branches.map((n, i) => (
        <div className="node" key={i} style={{ left: `${pos[i][0]}%`, top: `${pos[i][1]}%` }}><div className="nb"><div className="nt">{n.t}</div><div className="nm">{n.m}</div></div></div>
      ))}
    </div>
  );
}

const FileIcon = () => (<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>);

export default function FormulasyonV2(props: FormulasyonV2Props) {
  const { client, clientPhone, onBack, onNav, onSave, onOpenLibrary } = props;
  const [tab, setTab] = useState<TabId>('p4');
  const [saved, setSaved] = useState(false);
  const [clientPageOpen, setClientPageOpen] = useState(false);
  const [cycleInVaka, setCycleInVaka] = useState(false);
  useEffect(() => {
    try { setCycleInVaka(!!client?.id && !!localStorage.getItem(`vaka_cycle_${client.id}`)); } catch { /* yok */ }
  }, [client?.id]);
  const toggleCycleVaka = () => {
    if (!client?.id) return;
    const key = `vaka_cycle_${client.id}`;
    try {
      if (cycleInVaka) { localStorage.removeItem(key); setCycleInVaka(false); }
      else { localStorage.setItem(key, JSON.stringify(EX_CYCLE)); setCycleInVaka(true); }
    } catch { /* sessizce geç */ }
  };
  const [eduOpen, setEduOpen] = useState(false);     // 4P öğretici intro açık mı
  const [openQ, setOpenQ] = useState<string | null>(null); // hangi pencere kartının "nedir?"i açık

  // ── Hexaflex esneklik anketi (düzenlenebilir ölçek + danışana gönder) ──
  const [scaleOpen, setScaleOpen] = useState(false);
  const [hexScale, setHexScale] = useState<HexGroup[]>(DEFAULT_HEX_SCALE);
  const [sendState, setSendState] = useState<'' | 'sending' | 'sent' | 'error'>('');
  const [sentLink, setSentLink] = useState('');
  useEffect(() => {
    try { const s = localStorage.getItem('hex-scale'); if (s) setHexScale(JSON.parse(s)); } catch {}
  }, []);
  const persistScale = (s: HexGroup[]) => { setHexScale(s); try { localStorage.setItem('hex-scale', JSON.stringify(s)); } catch {} };
  const editQ = (gi: number, qi: number, text: string) => persistScale(hexScale.map((g, i) => i !== gi ? g : { ...g, questions: g.questions.map((q, j) => j !== qi ? q : { ...q, text }) }));
  const addQ = (gi: number) => persistScale(hexScale.map((g, i) => i !== gi ? g : { ...g, questions: [...g.questions, { id: `${g.key}-${Date.now()}`, text: '' }] }));
  const removeQ = (gi: number, qi: number) => persistScale(hexScale.map((g, i) => i !== gi ? g : { ...g, questions: g.questions.filter((_, j) => j !== qi) }));
  const totalQ = hexScale.reduce((s, g) => s + g.questions.length, 0);
  const sendScale = async () => {
    const cid = props.client?.id; const cname = props.client?.name;
    if (!cid || !cname || sendState === 'sending') return;
    setSendState('sending');
    try {
      const clean = hexScale.map((g) => ({ ...g, questions: g.questions.filter((q) => q.text.trim()) })).filter((g) => g.questions.length);
      const res = await fetch('/api/form-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: cid, clientName: cname, formTipi: 'esneklik', olcekAd: 'Psikolojik Esneklik (Hexaflex)', payload: clean }),
      });
      const row = await res.json();
      const link = `${window.location.origin}/form/${row.token}`;
      setSentLink(link);
      try { await navigator.clipboard.writeText(link); } catch {}
      setSendState('sent');
    } catch { setSendState('error'); }
  };

  // ── Danışana özel SMS — telefon takvim notlarından gelir, Netgsm ile gönderilir ──
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsText, setSmsText] = useState('');
  const [smsState, setSmsState] = useState<'' | 'sending' | 'sent' | 'error'>('');
  const [smsErr, setSmsErr] = useState('');
  const openSms = () => { setSmsPhone(clientPhone ?? ''); setSmsText(''); setSmsState(''); setSmsErr(''); setSmsOpen(true); };
  useEffect(() => {
    if (!smsOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSmsOpen(false); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [smsOpen]);
  const sendSms = async () => {
    const phone = smsPhone.trim(); const message = smsText.trim();
    if (!phone || !message || smsState === 'sending') return;
    setSmsState('sending'); setSmsErr('');
    try {
      const res = await fetch('/api/sms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: client?.name ?? '', message, trigger_type: 'manual' }),
      });
      const row = await res.json().catch(() => ({} as any));
      if (res.ok && row.ok) setSmsState('sent');
      else { setSmsState('error'); setSmsErr(row.error || 'Gönderilemedi'); }
    } catch (e: any) { setSmsState('error'); setSmsErr(e?.message || 'Ağ hatası'); }
  };

  const fourP = props.fourP ?? EX_FOURP;
  const hex = props.hexaflex ?? EX_HEX;
  const axes = hexAxes(hex);
  const avg = (axes.reduce((n, a) => n + a.val, 0) / axes.length).toFixed(1).replace('.', ',');
  const mapCenter = client?.name ? `${client.name}${client?.issue && client.issue !== '—' ? ` — ${client.issue}` : ''}` : 'Vaka';
  const mapBranches = [
    { t: 'Çekirdek inanç', m: 'Yetersizlik' }, { t: 'Değer', m: 'Otantiklik' }, { t: 'Sürdürücü', m: 'Aşırı hazırlık' },
    { t: 'Müdahale', m: 'Maruziyet + defüzyon' }, { t: 'Hedef', m: 'Hazırlıksız tek cümle' },
  ];

  const doSave = () => { onSave?.(); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const QUADS: { cls: string; e: string; t: string; clar: string; d: string; items: string[]; q: string; covers: string; simple: string }[] = [
    {
      cls: 'q1', e: 'Predisposing', t: 'Hazırlayıcı Faktörler', clar: 'Zemin Hazırlayanlar',
      d: 'Zemin hazırlayanlar — aile desteğinin azlığı, belirgin travmalar, boşanma, hassas kişilik gibi yatkınlık yaratan etmenler.',
      items: fourP.predisposing,
      q: 'Sorun neden bu kişide ortaya çıktı? Sorunun çok eskiden gelen köklerini inceler.',
      covers: 'Ailedeki genetik yatkınlıklar, çocukluktaki yetiştirilme tarzı (aşırı koruyuculuk gibi), kişilik özellikleri (mükemmeliyetçilik) veya geçmişte yaşanmış üzücü olaylar.',
      simple: 'Sorunun üzerine inşa edildiği “toprak” ya da “zemin” gibidir.',
    },
    {
      cls: 'q2', e: 'Precipitating', t: 'Tetikleyici Faktörler', clar: 'Bardağı Taşıran Son Damla',
      d: 'Bardağı taşıran son damla — sorunu başlatan ya da alevlendiren olay.',
      items: fourP.precipitating,
      q: 'Neden şimdi? Uzun süredir sessiz duran sorunu birdenbire uyandıran olaylardır.',
      covers: 'Yakın zamanda yaşanan iş kaybı, bir yakının ölümü, taşınma, okul değişikliği veya bir sınav gibi stresli yaşam olayları.',
      simple: 'Hazır duran baruta değen o “ilk kıvılcım”dır.',
    },
    {
      cls: 'q3', e: 'Perpetuating', t: 'Sürdürücü Etkenler', clar: 'Kısırdöngü Yaratanlar',
      d: 'ACT kaçınma sınıfı — sorunu canlı tutan deneyimsel kaçınma ve baş etme döngüleri.',
      items: fourP.perpetuating,
      q: 'Sorun neden hâlâ devam ediyor? Kişinin farkında olmadan sorunu besleyen alışkanlıklarıdır.',
      covers: 'Korkulan durumlardan kaçınmak, aşırı uyanıklık hâli (sürekli tetikte beklemek) ya da olayları hep en kötü senaryoya göre yorumlamak. Örn. sosyal kaygısı olan birinin ortamlara girmemesi, “insanlar beni yargılar” inancını test etmesini engelleyerek sorunu sürdürür.',
      simple: 'Ateşin sönmesini engelleyen, onu sürekli besleyen “rüzgâr” ya da “odun” gibidir.',
    },
    {
      cls: 'q4', e: 'Protective', t: 'Koruyucu Faktörler', clar: 'Güçlü Yanlar ve Kalkanlar',
      d: 'Güçlü yanlar ve kaynaklar — sosyallik, arkadaşlık, maddi olarak güçlü olmak gibi koruyucu etmenler.',
      items: fourP.protective,
      q: 'Kişinin elindeki imkânlar neler? İyileşme sürecinde terapistin ve danışanın en büyük yardımcılarıdır.',
      covers: 'Kişinin yüksek zekâsı, mizah yeteneği, ona destek olan iyi dostları, hobileri veya geçmişteki başarıları; sosyallik ve maddi güç gibi kaynaklar.',
      simple: 'Fırtınada kişiyi ayakta tutan “sağlam halatlar” ya da “şemsiye” gibidir.',
    },
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&display=swap" rel="stylesheet" />

      <div className="fm2" data-tab={tab}>
        <div className="shell">

          <div className="topbar">
            <div className="tb-left">
              <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Dosya</button>
              <div className="tb-title"><span className="e">Klinik Formülasyon</span><b>{client?.name ?? '—'}</b></div>
            </div>
            <div className="tb-actions">
              <button className="tb-sms" type="button" onClick={() => setClientPageOpen(true)} title="Danışana sunulacak vaka sunumu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>Vaka sunumu
              </button>
              <button className="tb-sms" type="button" onClick={openSms} title="Danışana SMS gönder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>SMS gönder
              </button>
              <button className={`tb-save${saved ? ' done' : ''}`} type="button" onClick={doSave}>
                {saved
                  ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6 9 17l-5-5" /></svg>Kaydedildi</>
                  : <><svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>Kaydet</>}
              </button>
            </div>
          </div>

          {smsOpen && (
            <div className="fm-sms-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSmsOpen(false); }}>
              <div className="fm-sms" role="dialog" aria-modal="true" aria-label="Danışana SMS gönder">
                <div className="fm-sms-head">
                  <div className="fm-sms-h"><span className="s">Danışana SMS</span><span className="h">{client?.name ?? '—'}</span></div>
                  <button type="button" className="fm-sms-x" aria-label="Kapat" onClick={() => setSmsOpen(false)}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                </div>
                <div className="fm-sms-body">
                  <label className="fm-sms-lbl">Telefon</label>
                  <input className="fm-sms-phone num" type="tel" value={smsPhone} placeholder="5XX XXX XX XX" onChange={(e) => { setSmsPhone(e.target.value); setSmsState(''); }} />
                  <p className="fm-sms-note">{clientPhone ? 'Numara takvim notlarından alındı.' : 'Takvim notlarında numara bulunamadı — elle girebilirsin.'}</p>
                  <label className="fm-sms-lbl">Mesaj</label>
                  <textarea className="fm-sms-text" maxLength={500} value={smsText} placeholder="Danışana iletmek istediğin mesaj…" onChange={(e) => { setSmsText(e.target.value); setSmsState(''); }} />
                  <span className="fm-sms-count">{smsText.length} / 500</span>
                </div>
                <div className="fm-sms-foot">
                  <button type="button" className="fm-sms-send" disabled={!smsPhone.trim() || !smsText.trim() || smsState === 'sending'} onClick={sendSms}>
                    {smsState === 'sending' ? 'Gönderiliyor…' : 'Gönder'}
                  </button>
                  {smsState === 'sent' && <span className="fm-sms-ok">Gönderildi · teşekkürler</span>}
                  {smsState === 'error' && <span className="fm-sms-fail">{smsErr || 'Gönderilemedi'}</span>}
                </div>
              </div>
            </div>
          )}

          <div className="modal-body">

            <div className="tabbar">
              <div className="tabs">
                {TABS.map((t, i) => (
                  <button key={t.id} className={`tab${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>
                    <span className="ti">{String(i + 1).padStart(2, '0')}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="wrap">
              <div className="panel on">

                {tab === 'p4' && (<>
                  <PHead eyebrow="değerlendirme" title={<>Sorunun <i>kökleri</i></>} desc="Sorunu hazırlayan, tetikleyen, sürdüren ve koruyan etkenlerle çerçeveler." />

                  {/* Öğretici intro — açılır/kapanır */}
                  <div className={`edu${eduOpen ? ' open' : ''}`}>
                    <button className="edu-head" type="button" aria-expanded={eduOpen} onClick={() => setEduOpen((v) => !v)}>
                      <span className="edu-ic" aria-hidden>?</span>
                      <span className="edu-h">4P Formülasyonu nedir, nasıl kullanılır?</span>
                      <span className="edu-chev" aria-hidden>{eduOpen ? '−' : '+'}</span>
                    </button>
                    {eduOpen && (
                      <div className="edu-body">
                        <p>4P Formülasyonu, bir kişinin yaşadığı zorlukları tıpkı bir <b>harita gibi kuş bakışı</b> görmemizi sağlayan bir yöntemdir. BDT (Bilişsel Davranışçı Terapi) uzmanları bu yöntemi, sorunun <b>neden başladığını</b> ve <b>neden bir türlü bitmediğini</b> anlamak için kullanır.</p>
                        <p className="edu-note">Aşağıdaki her pencerede <b>“nedir?”</b>e dokunarak o faktörün ne anlama geldiğini ve örneklerini görebilirsin.</p>
                        <p className="edu-sum"><b>Özetle:</b> kişinin geçmişi (Hazırlayıcı), yakın zamandaki kırılma noktası (Tetikleyici), şu anki sürdüren alışkanlıkları (Sürdürücü) ve sahip olduğu güçler (Koruyucu) netleşir. Bu harita, terapiste hangi yöne gideceği konusunda rehberlik eder.</p>
                      </div>
                    )}
                  </div>

                  <div className="quad">
                    {QUADS.map((q) => {
                      const open = openQ === q.cls;
                      return (
                      <div className={`qcard ${q.cls}${open ? ' info' : ''}`} key={q.cls}>
                        <div className="qtop">
                          <div className="qe">{q.e}</div>
                          <button className="qinfo" type="button" aria-expanded={open}
                            onClick={() => setOpenQ(open ? null : q.cls)}>{open ? 'kapat' : 'nedir?'}</button>
                        </div>
                        <h3>{q.t}</h3>
                        <div className="qclar">{q.clar}</div>
                        {open ? (
                          <div className="qedu">
                            <div className="qedu-row"><span className="qedu-l">Soru</span><p>{q.q}</p></div>
                            <div className="qedu-row"><span className="qedu-l">Neleri kapsar</span><p>{q.covers}</p></div>
                            <div className="qedu-row simple"><span className="qedu-l">Basitçe</span><p>{q.simple}</p></div>
                          </div>
                        ) : (
                          <div className="qd">{q.d}</div>
                        )}
                        <div className="qitems">
                          {q.items.map((it, j) => <span className="it" key={j}>{it}</span>)}
                          <button className="qadd" type="button">+ ekle</button>
                        </div>
                      </div>
                    );})}
                  </div>
                </>)}

                {tab === 'hex' && (<>
                  <PHead eyebrow="değerlendirme" title={<>Psikolojik <i>esneklik</i></>} desc="Danışanın esneklik profili; ortalama esneklik skoru." />
                  <div className="hex-wrap">
                    <div className="hex-card"><HexRadar axes={axes} /></div>
                    <div className="hex-side">
                      <div className="flex-score"><div className="l">Ortalama esneklik</div><div className="v num">{avg}<em>/10</em></div><div className="d">Defüzyon ve değer netliği güçlü; kabul ve gözlemleyen benlik gelişime açık.</div></div>
                      <div className="axlist">
                        {axes.map((a, i) => (
                          <div className="axrow" key={i}><span className="an">{a.ax}</span><span className="av num">{Math.round(a.val)}</span><span className="at"><span className="af" style={{ width: `${a.val * 10}%` }} /></span></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Esneklik anketi — düzenlenebilir ölçek + danışana gönder */}
                  <div className={`hsurvey${scaleOpen ? ' open' : ''}`}>
                    <div className="hsurvey-bar">
                      <div className="hsurvey-lead">
                        <span className="eyebrow">psikolojik esneklik anketi</span>
                        <p>{totalQ} soru · 6 süreç · danışan doldurunca radar gerçek veriyle güncellenir.</p>
                      </div>
                      <div className="hsurvey-actions">
                        <button className="hs-btn ghost" type="button" onClick={() => setScaleOpen((v) => !v)}>{scaleOpen ? 'Kapat' : 'Yeni ölçek gönder'}</button>
                        {scaleOpen && (
                          <button className="hs-btn solid" type="button" disabled={!props.client?.id || sendState === 'sending'} onClick={sendScale}>
                            {sendState === 'sending' ? 'Gönderiliyor…' : 'Danışana gönder'}
                          </button>
                        )}
                      </div>
                    </div>

                    {scaleOpen && (<>
                      {!props.client?.id && <p className="hs-warn">Önce bir danışan dosyası açın — anket o danışana gönderilir.</p>}
                      {sendState === 'sent' && <p className="hs-ok">Gönderildi ✓ Link panoya kopyalandı: <a href={sentLink} target="_blank" rel="noreferrer">{sentLink}</a></p>}
                      {sendState === 'error' && <p className="hs-warn">Gönderilemedi, tekrar deneyin.</p>}
                      <div className="hs-groups">
                        {hexScale.map((g, gi) => (
                          <div className="hs-group" key={g.key}>
                            <div className="hs-ghead"><b>{g.label}</b><span>{g.sade} · {g.questions.length} soru</span></div>
                            {g.questions.map((q, qi) => (
                              <div className="hs-q" key={q.id}>
                                <span className="hs-qn">{qi + 1}</span>
                                <input className="hs-qinput" type="text" value={q.text} placeholder="Soru metni…" onChange={(e) => editQ(gi, qi, e.target.value)} />
                                <button className="hs-qdel" type="button" aria-label="Sil" onClick={() => removeQ(gi, qi)}>×</button>
                              </div>
                            ))}
                            <button className="hs-qadd" type="button" onClick={() => addQ(gi)}>+ soru ekle</button>
                          </div>
                        ))}
                      </div>
                    </>)}
                  </div>
                </>)}

                {tab === 'cycle' && (<>
                  <PHead eyebrow="değerlendirme" title={<>Kısır <i>döngü</i></>} desc="Durum → düşünce → duygu → beden → davranış; kısa rahatlama döngüyü pekiştirir." />
                  <CycleDiagram nodes={EX_CYCLE} />
                  <div className="legend"><span>↻ saat yönünde akış</span><span>kısa rahatlama → uzun vadede sürdürür</span></div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
                    <button type="button" onClick={toggleCycleVaka} disabled={!client?.id}
                      style={{ border: '1px solid #E5E7EB', background: cycleInVaka ? '#0E0F12' : '#fff', color: cycleInVaka ? '#fff' : '#0E0F12', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: client?.id ? 'pointer' : 'not-allowed' }}>
                      {cycleInVaka ? '✓ Vaka sunumunda — çıkar' : '+ Vaka sunumuna ekle'}
                    </button>
                  </div>
                </>)}

                {tab === 'map' && (<>
                  <PHead eyebrow="değerlendirme" title={<>Bütünleşik <i>harita</i></>} desc="Çekirdek inanç, değer, sürdürücü, müdahale ve hedef arasındaki bağlar." />
                  <MapDiagram center={mapCenter} branches={mapBranches} />
                </>)}

                {tab === 'values' && (<>
                  <PHead eyebrow="danışan için önemli olanlar" title={<>Değerler &amp; <i>eylem</i></>} desc="Önem ve mevcut eylem uyumu; aradaki fark çalışılacak alanı gösterir." />
                  <div className="vals">
                    {EX_VALUES.map((v, i) => (
                      <div className="vcard" key={i}>
                        <div className="vn">{v.n}</div>
                        <div className="vlbl" style={{ marginTop: 14 }}>Önem</div>
                        <div className="vbarwrap"><span className="vbar"><span className="vfill" style={{ width: `${v.imp * 10}%` }} /></span><span className="vp num">{v.imp}</span></div>
                        <div className="vlbl" style={{ marginTop: 10 }}>Mevcut eylem</div>
                        <div className="vbarwrap"><span className="vbar"><span className="vfill" style={{ width: `${v.act * 10}%`, background: 'var(--accent-gray)' }} /></span><span className="vp num">{v.act}</span></div>
                        <p className="va">{v.a}</p>
                      </div>
                    ))}
                  </div>
                </>)}

                {tab === 'tmpl' && (<>
                  <PHead eyebrow="şablonlar & ekler" title={<>Şablon &amp; <i>belge</i></>} desc="Hazır formülasyon şablonları ve vakaya eklenen materyaller." />
                  <div className="tmpl">
                    <div className="tcol">
                      <span className="eyebrow">Şablonlar</span>
                      {EX_TEMPLATES.map((t, i) => (
                        <div className="trow" key={i} role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => { setTab(t.tab); props.onApplyTemplate?.(t.tab); }}><span className="ic"><FileIcon /></span><div className="tx"><b>{t.t}</b><span>{t.s}</span></div><span className="go">Kullan →</span></div>
                      ))}
                      <button className="tadd" type="button" onClick={() => onOpenLibrary?.()}><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Müdahale kütüphanesinden ekle</button>
                      {(props.interventionsPlanned ?? []).length > 0 && (
                        <span className="eyebrow" style={{ marginTop: 14 }}>Kütüphaneden eklenenler</span>
                      )}
                      {(props.interventionsPlanned ?? []).map((m, i) => (
                        <div className="trow" key={`iv-${i}`}><span className="ic"><FileIcon /></span><div className="tx"><b>{m}</b><span>Müdahale · kütüphaneden</span></div></div>
                      ))}
                    </div>
                    <div className="tcol">
                      <span className="eyebrow">Ekler</span>
                      {EX_ATTACH.map((t, i) => (
                        <div className="trow" key={i}><span className="ic"><FileIcon /></span><div className="tx"><b>{t.t}</b><span>{t.s}</span></div><span className="go">Aç →</span></div>
                      ))}
                      <button className="tadd" type="button"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Dosya ekle</button>
                    </div>
                  </div>
                </>)}

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

      <DanisanSayfasiModal
        open={clientPageOpen}
        onClose={() => setClientPageOpen(false)}
        clientName={client?.name}
        clientId={client?.id}
        clientPhone={clientPhone}
        fourP={props.fourP}
        summary={props.summary}
        interventionsPlanned={props.interventionsPlanned}
      />
    </>
  );
}
