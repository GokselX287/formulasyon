'use client';

import { useEffect, useRef, useState } from 'react';
import './CalismaAlaniV3.css';
import DanisanKonumHaritasi from './DanisanKonumHaritasi';

// ──────────────────────────────────────────────────────────────────────────
// Çalışma Alanı v4 — "Calmie / Selv" rooms hub (design_handoff_calisma_alani).
// .cav3 köküne scope'lu; mesh + frosted panel + yüzen oda kartları.
// Tema + arkaplan görseli Ana Sayfa ile paylaşılır (localStorage).
// ──────────────────────────────────────────────────────────────────────────

type RoomKey = 'takvim' | 'danisanlar' | 'tasarimlar' | 'kutuphane' | 'muhasebe' | 'ortak' | 'yolharitasi' | 'act' | 'sms' | 'supervizyon' | 'websitesi' | 'gelisim' | 'pratik' | 'antrenor';
export type RoomMeta = { count?: string; team?: string[] };

export type CalismaAlaniV3Props = {
  therapistName?: string;
  roomMeta?: Partial<Record<RoomKey, RoomMeta>>;
  weekBars?: number[];                 // insights "Bu hafta" mini grafik (gerçek haftalık seans)
  onBack?(): void;
  onNav?(target: string): void;
  onNewClient?(): void;
  onOpenProfile?(): void;
  onOpenTakvim?(): void;
  onOpenDanisanlar?(): void;
  onOpenTasarimlar?(): void;
  onOpenLibrary?(): void;
  onOpenMuhasebe?(): void;
  onOpenOrtak?(): void;
  onOpenInsights?(): void;
  onOpenYolHaritasi?(): void;
  onOpenAct?(): void;
  onOpenSms?(): void;
  onOpenSupervizyon?(): void;
  onOpenWebsitesi?(): void;
  onOpenGelisim?(): void;
  onOpenPratik?(): void;
  onOpenAntrenor?(): void;
};

const FONTS = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&display=swap';
const DEFAULT_BG = '/calmie-hero-default.jpg';
const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };

const ICONS: Record<RoomKey, string> = {
  takvim: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/><path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2"/>',
  danisanlar: '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3.4"/><path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.5a4 4 0 0 1 0 7"/>',
  tasarimlar: '<rect x="3" y="3.5" width="18" height="17" rx="2.5"/><circle cx="8.5" cy="9" r="1.7"/><path d="m21 15-4.5-4.5L6 21"/>',
  muhasebe: '<path d="M6 2.5h12a1 1 0 0 1 1 1v18l-3-2-2 2-2-2-2 2-2-2-3 2v-18a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  kutuphane: '<path d="M4 4.5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4z"/><path d="M20 4.5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>',
  ortak: '<rect x="3" y="4.5" width="7.5" height="15" rx="1.6"/><rect x="13.5" y="4.5" width="7.5" height="15" rx="1.6"/><path d="M12 9.5v5"/>',
  yolharitasi: '<path d="M9 4.5 3 7v13l6-2.5 6 2.5 6-2.5V4.5L15 7 9 4.5z"/><path d="M9 4.5V17M15 7v12.5"/>',
  act: '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z"/>',
  sms: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>',
  supervizyon: '<rect x="3" y="3.5" width="18" height="13" rx="2"/><path d="M12 16.5v4.5M8.5 21h7"/><path d="M7.5 11l2.5-2.5 2 2 3.5-3.5"/>',
  websitesi: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3 9h18"/><circle cx="6.2" cy="6.7" r=".55" fill="currentColor"/><circle cx="8.4" cy="6.7" r=".55" fill="currentColor"/>',
  gelisim: '<path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v5h-5"/>',
  pratik: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
  antrenor: '<path d="M6.5 12h11"/><path d="M4 9v6M7 7.5v9M17 7.5v9M20 9v6"/>',
};
const SUBS: Record<RoomKey, string> = {
  takvim: 'Bu hafta · seans akışı', danisanlar: 'Aktif danışanlar', tasarimlar: 'Galeri & materyaller',
  kutuphane: 'Teknik & protokol', muhasebe: 'Fatura & belgeler', ortak: 'Ortak yürütülen',
  yolharitasi: 'Süreç & planlama', act: 'Esneklik çalışmaları', sms: 'Hatırlatma & bildirim',
  supervizyon: 'Notlar & vaka sunumları', websitesi: 'Klinik web siten', gelisim: 'Eğitim & mesleki yatırım',
  pratik: 'Örnek formülasyon doldur', antrenor: 'Eğitmen · üye · ölçüm · gişe',
};
const TITLES: Record<RoomKey, string> = {
  takvim: 'Takvim & Randevular', danisanlar: 'Danışan Listesi', tasarimlar: 'Tasarım Dosyaları',
  kutuphane: 'Müdahale Kütüphanesi', muhasebe: 'Muhasebe İçerikleri', ortak: 'Projeni ortak yürüt',
  yolharitasi: 'Yol Haritası', act: 'ACT Geliştirme', sms: 'SMS Gönderimi',
  supervizyon: 'Süpervizyon', websitesi: 'Web Siten', gelisim: 'Gelişim Planı',
  pratik: 'Pratik Yap', antrenor: 'Kişisel Antrenör',
};
const GLASS: Partial<Record<RoomKey, boolean>> = { muhasebe: true, ortak: true };

const AV_TONES = [
  { bg: '#E4E6FB', ink: '#36409E' }, { bg: '#DCF1E7', ink: '#1A6E50' }, { bg: '#F8EBCC', ink: '#8C5C0E' },
  { bg: '#D8EEF1', ink: '#176B7B' }, { bg: '#EBE2F8', ink: '#5C3D9C' }, { bg: '#F9DEE6', ink: '#A23D57' },
];
const toneFor = (name: string) => { let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return AV_TONES[h % AV_TONES.length]; };
const initials = (n: string) => n.trim().split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase();

const THEMES: { k: string; sw: string; t: string }[] = [
  { k: 'default', sw: 'linear-gradient(135deg,#EE5870 0%,#FED6A0 52%,#6086CE 100%)', t: 'Varsayılan' },
  { k: 'mavi', sw: 'linear-gradient(135deg,#1E2C5E,#7E3A66 62%,#B23E66)', t: 'Cherry · gece mavisi' },
  { k: 'gri', sw: 'linear-gradient(135deg,#A6B2C0,#DEE3E8)', t: 'Kürk · soft blue' },
  { k: 'su', sw: 'linear-gradient(135deg,#289694,#B8EADE)', t: 'Su yeşili' },
  { k: 'koyu', sw: 'linear-gradient(135deg,#1E543A,#6EAF82)', t: 'Koyu yeşil' },
];
const DOCK = [
  { l: 'Ana Sayfa', t: 'home' },
  { l: 'Çalışma Alanı', t: 'calisma-alani', active: true },
  { l: 'Profil', t: 'terapist' },
  { l: 'Ayarlar', t: 'ayarlar' },
];

export default function CalismaAlaniV3(props: CalismaAlaniV3Props) {
  const { therapistName = 'Göksel Akkaya', roomMeta = {}, weekBars = [],
    onNav, onNewClient, onOpenProfile, onOpenTakvim, onOpenDanisanlar, onOpenTasarimlar,
    onOpenLibrary, onOpenMuhasebe, onOpenOrtak, onOpenInsights, onOpenYolHaritasi, onOpenAct, onOpenSms,
    onOpenSupervizyon, onOpenWebsitesi, onOpenGelisim, onOpenPratik, onOpenAntrenor } = props;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Dock glider (Ana Sayfa ile aynı — aktif/hover sekmeye kayan beyaz pill) ──
  const dockRef = useRef<HTMLElement>(null);
  const gliderRef = useRef<HTMLSpanElement>(null);
  const activeLink = () => (dockRef.current?.querySelector('a.active') || dockRef.current?.querySelector('a')) as HTMLElement | null;
  const moveGlider = (a: HTMLElement | null, instant = false) => {
    const g = gliderRef.current; if (!g || !a) return;
    if (instant) g.style.transition = 'none';
    g.style.width = a.offsetWidth + 'px';
    g.style.transform = `translateX(${a.offsetLeft}px)`;
    g.classList.add('on');
    dockRef.current?.querySelectorAll('a').forEach((l) => l.classList.toggle('lit', l === a));
    if (instant) { void g.offsetWidth; g.style.transition = ''; }
  };
  useEffect(() => {
    moveGlider(activeLink(), true);
    const onR = () => moveGlider(activeLink(), true);
    window.addEventListener('resize', onR);
    (document as any).fonts?.ready?.then(() => moveGlider(activeLink(), true));
    return () => window.removeEventListener('resize', onR);
  }, [mounted]);

  // Tema + arkaplan görseli — Ana Sayfa ile paylaşımlı (localStorage)
  const [theme, setTheme] = useState<string>(() => lsGet('calmie_home_bgtheme') || 'default');
  const [themePreview, setThemePreview] = useState<string | null>(null);
  const effTheme = themePreview ?? theme;
  const commitTheme = (v: string) => { setTheme(v); setThemePreview(null); try { localStorage.setItem('calmie_home_bgtheme', v); } catch {} };
  const bgPhoto = lsGet('siyi_home_bg_v1');

  // Oda tıklama hedefleri
  const roomClick: Record<RoomKey, (() => void) | undefined> = {
    takvim: onOpenTakvim, danisanlar: onOpenDanisanlar, tasarimlar: onOpenTasarimlar,
    kutuphane: onOpenLibrary, muhasebe: onOpenMuhasebe, ortak: onOpenOrtak,
    yolharitasi: onOpenYolHaritasi, act: onOpenAct, sms: onOpenSms,
    supervizyon: onOpenSupervizyon, websitesi: onOpenWebsitesi, gelisim: onOpenGelisim,
    pratik: onOpenPratik, antrenor: onOpenAntrenor,
  };

  const avstack = (names: string[] | undefined, max = 3) => {
    if (!names || !names.length) return null;
    return (
      <span className="avstack">
        {names.slice(0, max).map((n, i) => { const t = toneFor(n); return <span className="a" key={i} style={{ background: t.bg, color: t.ink }}>{initials(n)}</span>; })}
      </span>
    );
  };

  const RoomCard = ({ k, delay }: { k: RoomKey; delay: number }) => {
    const m = roomMeta[k] ?? {};
    const sub = k === 'takvim' && m.count ? `Bu hafta · ${m.count} seans` : SUBS[k];
    return (
      <a className={`room reveal${GLASS[k] ? ' glass' : ''}`} href="#" data-screen-label={TITLES[k]} style={{ animationDelay: `${delay}ms` }}
        onClick={(e) => { e.preventDefault(); roomClick[k]?.(); }}>
        <div className="room-head"><span className="room-ic"><svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: ICONS[k] }} /></span><span className="room-more" aria-hidden="true">⋯</span></div>
        <div className="room-body"><div className="room-title">{TITLES[k]}</div><div className="room-sub">{sub}</div></div>
        <div className="room-foot">{avstack(m.team)}{m.count ? <span className="room-count num">{m.count}</span> : <span />}</div>
      </a>
    );
  };

  const bars = weekBars.length ? weekBars : [];
  const barMax = Math.max(1, ...bars);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={FONTS} rel="stylesheet" />

      <div className="cav3" data-bg={effTheme === 'default' ? undefined : effTheme}>
        <div className="shell">

          {/* ÜST BAR */}
          <div className="topbar">
            <div className="brand"><span className="logo"><b>Calmie</b><i>.</i></span></div>
            <nav className="dock" aria-label="Bölümler" ref={dockRef} onMouseLeave={() => moveGlider(activeLink())}>
              <span className="dock-glider" ref={gliderRef} aria-hidden="true" />
              {DOCK.map((d) => (
                <a key={d.t} href="#" className={d.active ? 'active' : ''} onMouseEnter={(e) => moveGlider(e.currentTarget)} onClick={(e) => { e.preventDefault(); if (!d.active) onNav?.(d.t); }}>{d.l}</a>
              ))}
            </nav>
            <div className="topbar-right">
              <button className="tb-new" type="button" onClick={() => onNewClient?.()}><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Yeni danışan</button>
              <div className="tb-prof">
                <div className="nm-col">
                  <span className="pro-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.3L21 9l-4.8 4.3L17.6 22 12 18.4 6.4 22l1.4-8.7L3 9l6.4-.7z" /></svg>PRO</span>
                  <button type="button" className="nm" onClick={() => onOpenProfile?.()}>{therapistName}</button>
                </div>
                <button type="button" className="av" onClick={() => onOpenProfile?.()} aria-label="Profil">{initials(therapistName)}</button>
              </div>
            </div>
          </div>

          {/* sabit mesh zemin — shell'e sabit; içerik üstünde kayar */}
          <div className="app-bg" aria-hidden="true">
              <span className="hb-mesh" />
              <svg className="hb-lines" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <g fill="none" strokeLinecap="round">
                  <path d="M-120,640 C260,520 520,468 800,372 1120,262 1360,214 1780,128" stroke="rgba(255,255,255,.34)" strokeWidth="3.4" />
                  <path d="M-120,772 C300,648 580,556 880,470 1180,384 1420,318 1780,250" stroke="rgba(255,255,255,.24)" strokeWidth="5.5" />
                  <path d="M-120,884 C340,760 640,672 940,584 1220,500 1460,432 1780,372" stroke="rgba(255,255,255,.16)" strokeWidth="8" />
                  <path d="M-120,556 C240,452 520,408 820,316 1100,232 1380,196 1780,96" stroke="rgba(96,26,62,.3)" strokeWidth="3" />
                </g>
              </svg>
              <img className="hb-photo" alt="" src={bgPhoto || DEFAULT_BG} />
              <img className="hb-cherry" alt="" src="/tema-cherry.jpg" /><span className="hb-cherry-scrim" />
              <img className="hb-fur" alt="" src="/tema-kurk.jpg" /><span className="hb-fur-scrim" />
              <span className="hb-tint" /><span className="hb-crest" /><span className="hb-grade" /><span className="hb-vignette" /><span className="hb-grain" />
            </div>

            {/* tema seçici */}
            <div className="bg-pick" role="group" aria-label="Arka plan rengi" onMouseLeave={() => setThemePreview(null)}>
              {THEMES.map((t) => (
                <button key={t.k} type="button" className={`bgsw${theme === t.k ? ' on' : ''}`} style={{ ['--sw' as any]: t.sw }} title={t.t} aria-label={t.t}
                  onMouseEnter={() => setThemePreview(t.k)} onClick={() => commitTheme(t.k)} />
              ))}
            </div>

            <div className="modal-body" ref={scrollRef}>
            <main className="main">
              {/* §01 HUB */}
              <section className="section" id="bolumler" data-screen-label="Çalışma Alanı — Bölümler">
                <div className="sec-head">
                  <div className="l"><span className="eyebrow">Hub</span><h2 className="sec-title">Nereden <i>başlamak</i> istersin?</h2></div>
                  <p className="sec-aside">Altı bölüm — her biri vaka çalışmasının bir parçasını yönetir.</p>
                </div>
                <div className="rooms">
                  {/* 01 Oluştur */}
                  <a className="room create reveal" href="#" data-screen-label="Yeni danışan" style={{ animationDelay: '0ms' }} onClick={(e) => { e.preventDefault(); onNewClient?.(); }}>
                    <span className="plus"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></span><span className="ct">Yeni danışan ekle</span>
                  </a>
                  {/* 02 Takvim */}
                  <RoomCard k="takvim" delay={55} />
                  {/* 03 Insights — Bu hafta */}
                  <a className="room reveal" href="#" data-screen-label="Bu hafta" style={{ animationDelay: '110ms' }}
                    onClick={(e) => { e.preventDefault(); (onOpenInsights ?? (() => onNav?.('home')))(); }}>
                    <div className="room-head"><span className="room-tag2">Bu hafta</span><span className="room-more" aria-hidden="true">⋯</span></div>
                    <div className="room-chart">
                      {(bars.length ? bars : [0, 0, 0, 0, 0, 0, 0]).map((b, i) => <i key={i} style={{ height: `${Math.round((b / barMax) * 100)}%` }} />)}
                    </div>
                    <div className="room-foot"><span /><span className="room-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></span></div>
                  </a>
                  {/* 04 Danışanlar */}
                  <RoomCard k="danisanlar" delay={165} />
                  {/* 05 Tasarımlar */}
                  <RoomCard k="tasarimlar" delay={220} />
                  {/* 06 Kütüphane */}
                  <RoomCard k="kutuphane" delay={275} />
                  {/* 07 Muhasebe (glass) */}
                  <RoomCard k="muhasebe" delay={330} />
                  {/* 08 Ortak (glass) */}
                  <RoomCard k="ortak" delay={385} />
                  {/* 09 Yol Haritası */}
                  <RoomCard k="yolharitasi" delay={440} />
                  {/* 10 ACT Geliştirme */}
                  <RoomCard k="act" delay={495} />
                  {/* 11 SMS Gönderimi */}
                  <RoomCard k="sms" delay={550} />
                  {/* 12 Süpervizyon */}
                  <RoomCard k="supervizyon" delay={605} />
                  {/* 13 Web Siten */}
                  <RoomCard k="websitesi" delay={660} />
                  {/* 14 Gelişim Planı */}
                  <RoomCard k="gelisim" delay={715} />
                  {/* 15 Pratik Yap — örnek formülasyon doldurma */}
                  <RoomCard k="pratik" delay={770} />
                  {/* 16 Kişisel Antrenör — fitness alt uygulaması */}
                  <RoomCard k="antrenor" delay={825} />
                </div>
              </section>

              {/* Danışan konum dağılımı — şematik Türkiye haritası + il/ilçe kırılımı */}
              <section className="section" id="konumlar" data-screen-label="Çalışma Alanı — Danışan konumları">
                <DanisanKonumHaritasi />
              </section>

            </main>
          </div>
        </div>
      </div>
    </>
  );
}
