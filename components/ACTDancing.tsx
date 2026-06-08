'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Minimize2, BookOpen, Lightbulb, ChevronRight } from 'lucide-react';
import './actMotion.css';
import './ACTDancing.css';

// ──────────────────────────────────────────────────────────────────────────
// ACT DANCING — "ACT TÜRKİYE logo dili" yeniden tasarım (Claude Design handoff)
// Glossy yuvarlatılmış-altıgen rozetler (gri düğüm + kırmızı merkez), marka
// kırmızısı #ED1C24, beyaz hexgrid zemin, premium eğitici paneli, tam ekran
// (native + fake) + ACT TÜRKİYE logosu. Figür tekniği Hexaflex.html'den,
// geometri/token'lar README'den (bağlayıcı hifi spec).
// ──────────────────────────────────────────────────────────────────────────

type Phase = 'setup' | 'running' | 'paused' | 'done';
type DancingMode = 'hexaflex' | 'triflex';
type Cat = 'farkinda' | 'aktif' | 'acik' | 'all';
interface Participant { name: string; role: string }
interface Config { dur: number; speed: number; seq: boolean; educatorName: string; therapistName: string; participants: Participant[] }

const CAT: Record<Cat, { label: string; hex: string }> = {
  farkinda: { label: 'FARKINDA',       hex: '#C0392B' },
  aktif:    { label: 'AKTİF (ANGAJE)', hex: '#1A5276' },
  acik:     { label: 'AÇIK',           hex: '#784212' },
  all:      { label: '',               hex: '#1E8449' },
};

// 6 ACT süreci — deg 0..300 (0=tepe, saat yönü). badge=rozet etiketi, nm/desc/iv=panel.
const NODES = [
  { deg: 0, badge: ['ŞİMDİKİ AN', 'TEMAS'], nm: 'Şimdiki Anla Temas', cat: 'farkinda' as Cat,
    desc: 'Şimdiki An Farkındalığı: Dikkati "Şimdi ve Burada"ya vermek; yargısız, açık ve esnek dikkat.',
    iv: ['Şu an ne fark ediyorsunuz?', 'Bu anda bedeninizde neler oluyor?', 'Tam olarak şu an ne yaşıyorsunuz?', 'Etrafınızda şu an neler görüyor, duyuyorsunuz?', 'Nefes alırken bedeninizde ne hissediyorsunuz?'] },
  { deg: 60, badge: ['DEĞERLER'], nm: 'Değerler', cat: 'aktif' as Cat,
    desc: 'Değerlere Temas: Hayatta sizin için neyin önemli olduğunu tanımak — hedef değil, pusula.',
    iv: ['Hayatınızda gerçekten önemli olan ne?', 'Nasıl bir insan olmak istiyorsunuz?', 'Bu alanda değerleriniz nelerdir?', 'Hayatınız tam istediğiniz gibi olsaydı ne farklı olurdu?', 'En önem verdiğiniz şey nedir?'] },
  { deg: 120, badge: ['ADANMIŞ', 'EYLEM'], nm: 'Adanmış Eylem', cat: 'aktif' as Cat,
    desc: 'Adanmış Eylem: Zor olsa bile değerler yönünde sürdürülen somut, kararlı adımlar.',
    iv: ['Değerlerinize doğru şimdi ne yapabilirsiniz?', 'Bu hafta ne deneyebilirsiniz?', 'En küçük adım ne olabilir?', 'Zor olsa bile nasıl sürdürürsünüz?', 'Bunu ne kolaylaştırır?'] },
  { deg: 180, badge: ['BAĞLAMSAL', 'BENLİK'], nm: 'Bağlamsal Benlik', cat: 'all' as Cat,
    desc: 'Bağlamsal Benlik: Gözlemleyen benlik; içeriğin değil onu fark edenin perspektifinden bakmak.',
    iv: ['Düşünceleri izleyen kim fark edebilir?', 'Düşüncenin kendisi misiniz, onu fark eden mi?', 'Kendinizi gözlemci gözüyle görebilir misiniz?', 'On yıl önceki sizden bakabilir misiniz?', 'Bu perspektiften ne görüyorsunuz?'] },
  { deg: 240, badge: ['BİLİŞSEL', 'AYRIŞMA'], nm: 'Bilişsel Ayrışma', cat: 'acik' as Cat,
    desc: 'Defüzyon (Bilişsel Ayrışma): Düşüncelere kapılmak yerine onları düşünce olarak görmek.',
    iv: ['"... diye düşünüyorum" diyebilir misiniz?', 'Zihniniz size ne söylüyor?', 'Bu düşünce gerçek mi, tahmin mi?', 'Bulut gibi geçerken izleyebilir misiniz?', 'Sizi ne kadar kontrol etmesine izin veriyorsunuz?'] },
  { deg: 300, badge: ['KABUL'], nm: 'Kabul', cat: 'acik' as Cat,
    desc: 'İsteklilik: Ortaya çıkan duygu ve duyumlara, onlarla savaşmadan yer açmak.',
    iv: ['Bu duyguya yer açabilir misiniz?', 'Kaçmak yerine kalabilir misiniz?', 'Tam olarak nerede olduğunu hissedebilir misiniz?', 'Savaşmak yerine gözlemleyebilir misiniz?', 'Sadece orada kalmasına izin verebilir misiniz?'] },
];

// Triflex — 6 Hexaflex süreci → 3 tepki stili. Her grup 2 düğüm + kendi müdahaleleri.
// nodes: NODES indeksleri (0 Şimdiki An, 1 Değerler, 2 Adanmış, 3 Bağlamsal, 4 Bilişsel, 5 Kabul)
const TRIFLEX = [
  { cat: 'acik' as Cat, nm: 'Açıklık', eyebrow: 'Aç & farkında ol', nodes: [5, 4],
    desc: 'Acıya ve zor düşüncelere alan açmak; onlarla savaşmadan yer vermek (Kabul + Bilişsel Ayrışma).',
    iv: ['Bu deneyime karşı savaşmak yerine ona yer açabilir misiniz?', 'Bu düşünceyi bir gerçek değil, bir düşünce olarak görebilir misiniz?', 'Zor duyguyu değiştirmeye çalışmadan olduğu gibi gözlemleyebilir misiniz?', 'Kaçınmak yerine bu hisle birlikte kalmak nasıl olurdu?', 'Zihninizin söylediğine kapılmadan onu fark edebilir misiniz?'] },
  { cat: 'farkinda' as Cat, nm: 'Merkezlenme · Farkında', eyebrow: 'Şimdi & burada', nodes: [0, 3],
    desc: 'Esnek dikkatle şu ana gelmek; gözlemleyen benlikte durmak (Şimdiki An + Bağlamsal Benlik).',
    iv: ['Şu an, bu odada, ne fark ediyorsunuz?', 'Dikkatinizi nefesinize ve bedeninize getirebilir misiniz?', 'Tüm bunları fark eden "siz" kimsiniz?', 'Düşünceleri izleyen gözlemci konumuna geçebilir misiniz?', 'Şimdiki ana dönmek için bir duyusal çapa bulabilir misiniz?'] },
  { cat: 'aktif' as Cat, nm: 'Adanmışlık · Angaje', eyebrow: 'Yap & yaşa', nodes: [1, 2],
    desc: 'Değerler yönünde, engellere rağmen sürdürülen somut ve kararlı eylem (Değerler + Adanmış Eylem).',
    iv: ['Bu değer doğrultusunda atabileceğiniz en küçük adım ne?', 'Bu hafta neyi farklı yapardınız?', 'Engel çıksa bile bu eylemi nasıl sürdürürsünüz?', 'Hangi değer bu eyleme rehberlik ediyor?', 'Bunu somut, ölçülebilir bir adıma nasıl çevirirsiniz?'] },
];

const ROLES = [
  { role: 'Terapist', c: '#C0392B' }, { role: 'Danışan', c: '#1A5276' },
  { role: 'Süpervizör', c: '#1E8449' }, { role: 'Yazıcı', c: '#6D3B8A' },
];
const DURS = [5, 10, 12, 15, 20];
const SPDS = [{ l: 'Yavaş', v: 20 }, { l: 'Orta', v: 12 }, { l: 'Hızlı', v: 7 }];
const DEFAULT_CONFIG: Config = { dur: 10, speed: 12, seq: true, educatorName: '', therapistName: '', participants: ROLES.map(r => ({ name: '', role: r.role })) };

// ─── Geometri (README) ─────────────────────────────────────────────────────
const VW = 600, VH = 620, CX = 300, CY = 308, RING = 216, NR = 46, COREr = 58;
const polar = (deg: number, r: number): [number, number] => { const a = (deg - 90) * Math.PI / 180; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; };

// ─── Yuvarlatılmış sivri-tepe altıgen path (Hexaflex.html) ──────────────────
type V = [number, number];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const mul = (a: V, s: number): V => [a[0] * s, a[1] * s];
const norm = (a: V): V => { const m = Math.hypot(a[0], a[1]) || 1; return [a[0] / m, a[1] / m]; };
const ff = (p: V) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
function rhex(cx: number, cy: number, R: number, rad: number) {
  const pts: V[] = Array.from({ length: 6 }, (_, i) => { const a = (60 * i - 90) * Math.PI / 180; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
  let d = '';
  for (let i = 0; i < 6; i++) {
    const cur = pts[i], prev = pts[(i + 5) % 6], next = pts[(i + 1) % 6];
    const p1 = add(cur, mul(norm(sub(prev, cur)), rad)), p2 = add(cur, mul(norm(sub(next, cur)), rad));
    d += (i === 0 ? `M${ff(p1)} ` : `L${ff(p1)} `) + `Q ${ff(cur)} ${ff(p2)} `;
  }
  return d + 'Z';
}

const GRAY = { top: '#FFFFFF', mid: '#F2F2F0', dark: '#DEDDDA', edge: '#C0BFBB', ring: '#ED1C24', text: '#36352F' };
const RED  = { top: '#FF3B2E', mid: '#ED1C24', dark: '#CE1118', edge: '#A50F14', ring: '#ED1C24', text: '#FFFFFF' };

// ─── Tek glossy düğüm ───────────────────────────────────────────────────────
function GlassNode({ x, y, R, lines, core, idx, active, ringColor = '#ED1C24', onClick }:
  { x: number; y: number; R: number; lines: string[]; core?: boolean; idx: number; active?: boolean; ringColor?: string; onClick?: () => void }) {
  const col = core ? RED : GRAY;
  const bez = rhex(x, y, R + (core ? 20 : 16), core ? 7 : 6);
  const bezIn = rhex(x, y, R + (core ? 14 : 10), core ? 6 : 5);
  const body = rhex(x, y, R, core ? 6 : 5);
  const ring = rhex(x, y, R + (core ? 30 : 26), core ? 9 : 7);
  const clipId = `acd-clip-${core ? 'core' : idx}`;
  const [l1, l2] = lines;
  let text: React.ReactNode;
  if (l2) {
    const f1 = core ? 14 : 10.5, f2 = core ? 9 : 8;
    text = (<>
      <text x={x} y={+(y - 3).toFixed(1)} textAnchor="middle" fontSize={f1} fontWeight="800" fill={col.text} letterSpacing={core ? 0 : -0.2}>{l1}</text>
      <text x={x} y={+(y + f2 + 5).toFixed(1)} textAnchor="middle" fontSize={f2} fontWeight="600" fill={col.text} letterSpacing={core ? 3 : 1.6}>{l2}</text>
    </>);
  } else {
    const f1 = 12.5;
    text = <text x={x} y={+(y + f1 * 0.34).toFixed(1)} textAnchor="middle" fontSize={f1} fontWeight="800" fill={col.text} letterSpacing={0.4}>{l1}</text>;
  }
  return (
    <g className={`gnode${core ? ' core' : ''}${active ? ' active' : ''}`} style={{ transformOrigin: `${x}px ${y}px`, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <path className="ring" d={ring} fill="none" stroke={ringColor} strokeWidth={core ? 7 : 6} filter="url(#acd-ringGlow)" style={{ transformOrigin: `${x}px ${y}px` }} />
      <path className="ring" d={ring} fill="none" stroke={ringColor} strokeWidth={2.2} opacity={0.9} style={{ transformOrigin: `${x}px ${y}px` }} />
      <path d={bez} fill="url(#acd-bezel)" filter="url(#acd-bezShadow)" />
      <path d={bezIn} fill="none" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={2} />
      <path className="redbody" d={body} fill={core ? 'url(#acd-bodyRed)' : 'url(#acd-bodyGray)'} />
      <clipPath id={clipId}><path d={body} /></clipPath>
      <g clipPath={`url(#${clipId})`}><ellipse cx={x} cy={+(y - R * 0.62).toFixed(1)} rx={+(R * 0.78).toFixed(1)} ry={+(R * 0.34).toFixed(1)} fill="url(#acd-topGloss)" /></g>
      <path d={body} fill="none" stroke={col.edge} strokeOpacity={0.4} strokeWidth={1.4} />
      {text}
    </g>
  );
}

// ─── Hexaflex figürü ────────────────────────────────────────────────────────
function HexaflexFigure({ activeSet, running, accent = '#ED1C24', onSelect }: { activeSet: number[]; running: boolean; accent?: string; onSelect?: (i: number) => void }) {
  const set = running ? activeSet : [];
  const isOn = (i: number) => set.includes(i);
  const P = NODES.map(n => polar(n.deg, RING));
  const order = [0, 1, 2, 3, 4, 5].filter(i => !isOn(i));
  return (
    <svg className="fig" viewBox={`0 0 ${VW} ${VH}`} aria-label="Hexaflex">
      <defs>
        <linearGradient id="acd-bezel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.5" stopColor="#F1F1EF" /><stop offset="1" stopColor="#D9D8D5" /></linearGradient>
        <linearGradient id="acd-bodyGray" x1="0" y1="0" x2="0.16" y2="1"><stop offset="0" stopColor={GRAY.top} /><stop offset="0.45" stopColor={GRAY.mid} /><stop offset="1" stopColor={GRAY.dark} /></linearGradient>
        <linearGradient id="acd-bodyRed" x1="0" y1="0" x2="0.16" y2="1"><stop offset="0" stopColor={RED.top} /><stop offset="0.45" stopColor={RED.mid} /><stop offset="1" stopColor={RED.dark} /></linearGradient>
        <linearGradient id="acd-topGloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <filter id="acd-bezShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="9" floodColor="#9a9a97" floodOpacity="0.45" /></filter>
        <filter id="acd-ringGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4.5" /></filter>
      </defs>
      {/* bağlantılar */}
      <g>
        {NODES.map((_, i) => { const a = P[i], b = P[(i + 1) % 6]; return <line key={'rg' + i} className="conn" x1={a[0].toFixed(1)} y1={a[1].toFixed(1)} x2={b[0].toFixed(1)} y2={b[1].toFixed(1)} stroke="#D4D2CE" strokeWidth={1.6} opacity={0.8} />; })}
        {NODES.map((_, i) => { const on = isOn(i); return <line key={'sp' + i} className="conn" x1={CX} y1={CY} x2={P[i][0].toFixed(1)} y2={P[i][1].toFixed(1)} stroke={on ? accent : '#C9C7C3'} strokeWidth={on ? 3.4 : 2.2} />; })}
      </g>
      {/* düğümler: aktif-olmayan dışlar → merkez → aktif (öne) */}
      <g>
        {order.map(i => { const [x, y] = P[i]; return <GlassNode key={'n' + i} x={x} y={y} R={NR} lines={NODES[i].badge} idx={i} onClick={onSelect ? () => onSelect(i) : undefined} />; })}
        <GlassNode key="core" x={CX} y={CY} R={COREr} lines={['PSİKOLOJİK', 'ESNEKLİK']} core idx={-1} />
        {set.map(i => { const [x, y] = P[i]; return <GlassNode key={'a' + i} x={x} y={y} R={NR} lines={NODES[i].badge} idx={i} active ringColor={accent} onClick={onSelect ? () => onSelect(i) : undefined} />; })}
      </g>
    </svg>
  );
}

const HexGridBg = () => (
  <div className="stage-bg" aria-hidden="true">
    <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="acd-hexgrid" width="84" height="146" patternUnits="userSpaceOnUse">
          <path d="M42 0 L84 24 L84 73 L42 97 L0 73 L0 24 Z" fill="none" stroke="#D6D5D1" strokeWidth="1.3" />
          <path d="M0 73 L0 122 L42 146 L84 122 L84 73" fill="none" stroke="#D6D5D1" strokeWidth="1.3" />
        </pattern>
      </defs>
      <rect width="1200" height="800" fill="url(#acd-hexgrid)" opacity="0.55" />
    </svg>
  </div>
);

// ACT TÜRKİYE logosu (tam ekranda sağ-alt)
const ActLogo = () => {
  const cx = 36, cy = 33, R = 30;
  return (
    <svg className="fs-logo" viewBox="0 0 72 86" aria-label="ACT TÜRKİYE">
      <defs>
        <linearGradient id="acd-lgRed" x1="0" y1="0" x2="0.16" y2="1"><stop offset="0" stopColor="#FF3B2E" /><stop offset="0.45" stopColor="#ED1C24" /><stop offset="1" stopColor="#CE1118" /></linearGradient>
        <linearGradient id="acd-lgGloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <filter id="acd-lgShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#9a3b3b" floodOpacity="0.4" /></filter>
        <clipPath id="acd-lgClip"><path d={rhex(cx, cy, R, 14)} /></clipPath>
      </defs>
      <path d={rhex(cx, cy, R + 3, 15)} fill="#FFFFFF" filter="url(#acd-lgShadow)" />
      <path d={rhex(cx, cy, R, 14)} fill="url(#acd-lgRed)" />
      <g clipPath="url(#acd-lgClip)"><ellipse cx={cx} cy={cy - R * 0.55} rx={R * 0.78} ry={R * 0.32} fill="url(#acd-lgGloss)" /></g>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="#FFFFFF" letterSpacing={0.5}>ACT</text>
      <text x={cx} y={cy + R + 16} textAnchor="middle" fontSize="9" fontWeight="600" fill="#B0282A" letterSpacing={3}>TÜRKİYE</text>
    </svg>
  );
};

// ─── Setup ──────────────────────────────────────────────────────────────────
function SetupScreen({ config, setConfig, mode, setMode, onStart }:
  { config: Config; setConfig: React.Dispatch<React.SetStateAction<Config>>; mode: DancingMode; setMode: (m: DancingMode) => void; onStart: () => void }) {
  const note = `${config.dur} dakika · ${config.seq ? 'Sıralı' : 'Rastgele'} · ${config.speed} sn/boyut`;
  return (
    <div className="fade-in">
      <div className="modesel">
        {(['hexaflex', 'triflex'] as DancingMode[]).map(m => (
          <button key={m} className={`mode-btn${mode === m ? ' on' : ''}`} onClick={() => setMode(m)}>
            {m === 'hexaflex' ? '⬡ Hexaflex Dancing' : '△ Triflex Dancing'}
            {m === 'triflex' && <span className="nw">Yeni</span>}
          </button>
        ))}
      </div>
      <div className="setup-grid">
        <div>
          <div className="scard">
            <h3><span className="no">1</span> Seans Süresi</h3>
            <div className="chips">{DURS.map(d => (
              <button key={d} className={`chip-btn${config.dur === d ? ' on' : ''}`} onClick={() => setConfig(c => ({ ...c, dur: d }))}>{d}<small>dk</small></button>
            ))}</div>
          </div>
          <div className="scard">
            <h3><span className="no">2</span> Geçiş Hızı</h3>
            <div className="chips">{SPDS.map(s => (
              <button key={s.v} className={`chip-btn${config.speed === s.v ? ' on' : ''}`} onClick={() => setConfig(c => ({ ...c, speed: s.v }))}>{s.l}<small>{s.v} sn/boyut</small></button>
            ))}</div>
          </div>
          <div className="scard">
            <h3><span className="no">3</span> Sıra</h3>
            <div className="chips">
              <button className={`chip-btn${config.seq ? ' on' : ''}`} onClick={() => setConfig(c => ({ ...c, seq: true }))}>→ Sıralı</button>
              <button className={`chip-btn${!config.seq ? ' on' : ''}`} onClick={() => setConfig(c => ({ ...c, seq: false }))}>⤫ Rastgele</button>
            </div>
          </div>
        </div>
        <div>
          <div className="scard">
            <h3>Oturum Bilgisi</h3>
            <label className="s-lbl">Eğitici</label>
            <input className="s-input" placeholder="Eğiticinin adı" value={config.educatorName} onChange={e => setConfig(c => ({ ...c, educatorName: e.target.value }))} style={{ marginBottom: 12 }} />
            <label className="s-lbl">Terapist Adayı</label>
            <input className="s-input" placeholder="Terapist adayının adı" value={config.therapistName} onChange={e => setConfig(c => ({ ...c, therapistName: e.target.value }))} />
          </div>
          <div className="scard">
            <h3>Katılımcılar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROLES.map((r, i) => (
                <div className="role" key={i}><div className="av" style={{ background: r.c }}>{r.role[0]}</div><div className="rn" style={{ color: r.c }}>{r.role}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button className="start" onClick={onStart}><Play size={18} /> Seansı Başlat <ChevronRight size={16} /></button>
        <p className="start-note">{note}</p>
      </div>
    </div>
  );
}

// ─── Running ────────────────────────────────────────────────────────────────
function DancingScreen({ config, mode, phase, setPhase, activeIdx, setActiveIdx, nodeLeft, setNodeLeft, sessLeft, setSessLeft, onReset }:
  { config: Config; mode: DancingMode; phase: Phase; setPhase: (p: Phase) => void;
    activeIdx: number; setActiveIdx: React.Dispatch<React.SetStateAction<number>>;
    nodeLeft: number; setNodeLeft: React.Dispatch<React.SetStateAction<number>>;
    sessLeft: number; setSessLeft: React.Dispatch<React.SetStateAction<number>>; onReset: () => void }) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nodeRef = useRef(nodeLeft); nodeRef.current = nodeLeft;
  const sessRef = useRef(sessLeft); sessRef.current = sessLeft;
  const cardRef = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(false);

  const triflex = mode === 'triflex';
  const tg = triflex ? TRIFLEX[activeIdx % 3] : null;
  const node = NODES[activeIdx % 6];
  const cs = CAT[tg ? tg.cat : node.cat];
  const panelNm = tg ? tg.nm : node.nm;
  const panelDesc = tg ? tg.desc : node.desc;
  const panelIv = tg ? tg.iv : node.iv;
  const activeSet = tg ? tg.nodes : [activeIdx % 6];
  const accent = triflex ? cs.hex : '#ED1C24';
  const paused = phase === 'paused';
  const selectNode = (i: number) => { if (triflex) { const gi = TRIFLEX.findIndex(g => g.nodes.includes(i)); if (gi >= 0) setActiveIdx(gi); } else setActiveIdx(i); };

  const advance = useCallback(() => {
    const N = mode === 'triflex' ? 3 : 6;
    setActiveIdx(prev => { const p = prev % N; return config.seq ? (p + 1) % N : (() => { const o = [...Array(N).keys()].filter(n => n !== p); return o[Math.floor(Math.random() * o.length)]; })(); });
    setNodeLeft(config.speed);
  }, [config.seq, config.speed, mode, setActiveIdx, setNodeLeft]);

  // Timer — updater'lar saf; üst-seviye setter'lar (setState-in-render YOK)
  useEffect(() => {
    if (phase !== 'running') { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      if (sessRef.current <= 1) { if (intervalRef.current) clearInterval(intervalRef.current); sessRef.current = 0; setSessLeft(0); setPhase('done'); return; }
      sessRef.current -= 1; setSessLeft(t => t - 1);
      if (nodeRef.current <= 1) { nodeRef.current = config.speed; advance(); } else { nodeRef.current -= 1; setNodeLeft(t => t - 1); }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, advance, config, setNodeLeft, setSessLeft, setPhase]);

  // Tam ekran (native + fake fallback) + Esc/F
  const enterFs = () => {
    const el = cardRef.current; if (!el) return;
    const req = el.requestFullscreen?.bind(el);
    if (req) { req().then(() => setFs(true)).catch(() => { setFs(true); document.body.style.overflow = 'hidden'; }); }
    else { setFs(true); document.body.style.overflow = 'hidden'; }
  };
  const exitFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    setFs(false); document.body.style.overflow = '';
  }, []);
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) { setFs(f => (f && !document.body.style.overflow ? false : f)); } };
    const onKey = (e: KeyboardEvent) => { if (fs && (e.key === 'Escape' || e.key === 'f' || e.key === 'F')) exitFs(); };
    document.addEventListener('fullscreenchange', onChange);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('fullscreenchange', onChange); window.removeEventListener('keydown', onKey); };
  }, [fs, exitFs]);

  const mm = String(Math.floor(sessLeft / 60)).padStart(2, '0');
  const ss = String(sessLeft % 60).padStart(2, '0');
  const sessPct = (1 - sessLeft / (config.dur * 60)) * 100;
  const modeLabel = mode === 'hexaflex' ? 'Hexaflex' : 'Triflex';

  if (phase === 'done') {
    return (
      <div className="acd"><div className="dance-card fade-in"><div className="done">
        <h2>Seans Tamamlandı</h2>
        <p>Boyutlar arasında iyi bir tur attınız. Yeni bir seansa hazır olduğunuzda başlayın.</p>
        <button className="start" onClick={onReset}><RotateCcw size={16} /> Yeni Seans</button>
      </div></div></div>
    );
  }

  return (
    <div className="acd">
      <div className={`dance-card fade-in${fs ? ' fs' : ''}`} ref={cardRef}>
        {/* Top bar */}
        <div className="dance-top">
          <div className="grp">
            <button className="mini-btn" onClick={onReset}><RotateCcw size={13} /> Sıfırla</button>
            <span style={{ color: 'var(--ink-faint)' }}>|</span>
            <span className="mlabel">{mode === 'hexaflex' ? '⬡' : '△'} {modeLabel} Dancing</span>
          </div>
          <div className="grp">
            <span className="pill-time"><span className="dot" /><span className="t">{mm}:{ss}</span></span>
            <span className="node-time">{nodeLeft}s</span>
          </div>
          <div className="grp">
            <button className="btn-dark" onClick={() => setPhase(phase === 'running' ? 'paused' : 'running')}>{phase === 'running' ? <Pause size={14} /> : <Play size={14} />}{phase === 'running' ? 'Duraklat' : 'Devam Et'}</button>
            <button className="btn-dark" onClick={() => (fs ? exitFs() : enterFs())}>{fs ? <Minimize2 size={14} /> : <Maximize2 size={14} />}{fs ? 'Çık' : 'Tam Ekran'}</button>
          </div>
        </div>
        <div className="sessbar"><i style={{ width: `${sessPct}%` }} /></div>

        <div className="dance-body">
          {/* Left */}
          <div className="side left">
            <span className="lbl">Katılımcılar</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {config.participants.map((p, i) => {
                const c = ROLES.find(r => r.role === p.role)?.c ?? '#888';
                return <div className="role" key={i}><div className="av" style={{ background: c }}>{(p.name || p.role)[0]}</div><div><div className="rn" style={{ color: c }}>{p.role}</div>{p.name && <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{p.name}</div>}</div></div>;
              })}
            </div>
          </div>

          {/* Stage */}
          <div className="stage">
            <HexGridBg />
            {/* Tam ekran başlığı + logo + eğitici adı */}
            <div className="fs-title">{mode === 'hexaflex' ? '⬡' : '△'} {modeLabel}<i>Dancing</i></div>
            <ActLogo />
            <div className={`fs-name${config.educatorName ? ' show' : ''}`}><span className="ey">Eğitici</span><span className="nm">{config.educatorName}</span></div>

            {paused && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 6, background: 'rgba(255,255,255,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button className="start" onClick={() => setPhase('running')}><Play size={18} /> Devam Et</button>
              </div>
            )}
            <HexaflexFigure activeSet={activeSet} running accent={accent} onSelect={selectNode} />
            <div className="info-strip">
              {cs.label && <span className="cat" style={{ background: cs.hex }}>{cs.label}</span>}
              <span className="nm">{panelNm}</span>
              <span className="ds">{panelDesc}</span>
            </div>
          </div>

          {/* Trainer panel */}
          <div className="edu">
            <div className="edu-h">
              <span className="ico"><BookOpen size={14} /></span>
              <span className="t">Eğitici Paneli</span>
              <span className="chip"><span className="cdot" style={{ background: cs.hex }} />{panelNm}</span>
            </div>
            <div className="edu-b">
              <div className="edu-desc fade-in" key={'d' + activeIdx} style={{ borderLeftColor: cs.hex }}>
                {cs.label && <span className="cat" style={{ background: cs.hex }}>{cs.label}</span>}
                <p>{panelDesc}</p>
              </div>
              <div>
                <div className="iv-h"><Lightbulb size={15} /> Müdahale Önerileri</div>
                <div className="iv-list stagger" key={'iv' + activeIdx} style={{ marginTop: 8 }}>
                  {panelIv.map((q, j) => (
                    <div className="iv" key={j} style={{ ['--i' as string]: j } as React.CSSProperties}><span className="badge">{j + 1}</span><span>{q}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Haftalık şerit (tam ekranda gizli) */}
      <div className="weekly">
        <div className="wh"><span className="e">Bu hafta · pratik dakikası</span><span className="tot">165 dk toplam</span></div>
        <div className="bars">
          {([['Pzt', 20], ['Sal', 35], ['Çar', 0], ['Per', 25], ['Cum', 40], ['Cmt', 15], ['Bgn', 30, true]] as [string, number, boolean?][]).map((d, i, arr) => {
            const max = Math.max(...arr.map(a => a[1]), 1);
            return <div className={`bar${d[2] ? ' cur' : ''}`} key={i}><div className="col" style={{ height: `${Math.max(4, d[1] / max * 100)}%` }} /><div className="d">{d[0]}</div></div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Kök ────────────────────────────────────────────────────────────────────
export default function ACTDancing({ initialMode = 'hexaflex' }: { initialMode?: DancingMode }) {
  const [mode, setMode] = useState<DancingMode>(initialMode);
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<Config>({ ...DEFAULT_CONFIG });
  const [activeIdx, setActiveIdx] = useState(0);
  const [nodeLeft, setNodeLeft] = useState(DEFAULT_CONFIG.speed);
  const [sessLeft, setSessLeft] = useState(DEFAULT_CONFIG.dur * 60);

  const handleStart = () => { setActiveIdx(0); setNodeLeft(config.speed); setSessLeft(config.dur * 60); setPhase('running'); };
  const handleReset = () => { setPhase('setup'); setActiveIdx(0); };

  if (phase === 'setup') {
    return <div className="acd"><SetupScreen config={config} setConfig={setConfig} mode={mode} setMode={setMode} onStart={handleStart} /></div>;
  }
  return (
    <DancingScreen config={config} mode={mode} phase={phase} setPhase={setPhase}
      activeIdx={activeIdx} setActiveIdx={setActiveIdx} nodeLeft={nodeLeft} setNodeLeft={setNodeLeft}
      sessLeft={sessLeft} setSessLeft={setSessLeft} onReset={handleReset} />
  );
}
