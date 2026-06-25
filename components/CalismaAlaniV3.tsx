'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './CalismaAlaniV3.css';

// ──────────────────────────────────────────────────────────────────────────
// Çalışma Alanı v5 — "Cam / Editöryel" hub (Cv görsel-40 · REFERANS).
// Takvim & Randevular ile birebir kardeş kabuk: mor+pembe mesh + siyah nav
// (glider) + opal cam oda kartları + §02 konum listesi + §03 kazanım kanalı.
// Tek tema (tema seçici/foto-mesh YOK). Veri: /api/danisan-konum + /api/kazanim-kanali.
// .cav3 köküne scope'lu; props önceki sürümle aynı (page.tsx değişmez).
// ──────────────────────────────────────────────────────────────────────────

type RoomKey = 'takvim' | 'danisanlar' | 'tasarimlar' | 'kutuphane' | 'muhasebe' | 'ortak' | 'yolharitasi' | 'act' | 'sms' | 'supervizyon' | 'websitesi' | 'gelisim' | 'pratik' | 'antrenor';
export type RoomMeta = { count?: string; team?: string[] };

export type CalismaAlaniV3Props = {
  therapistName?: string;
  roomMeta?: Partial<Record<RoomKey, RoomMeta>>;
  weekBars?: number[];
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

const FONTS = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap';

const ICONS: Record<RoomKey, string> = {
  takvim: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  danisanlar: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6a3 3 0 0 1 0 6M16 14.2a5.5 5.5 0 0 1 4.5 5.8"/>',
  tasarimlar: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 14l5-4 4 3 3-2 6 4"/><circle cx="8.5" cy="8.5" r="1.4"/>',
  kutuphane: '<path d="M4 5v15M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2M20 5v15M20 5a2 2 0 0 0-2-2h-5"/>',
  muhasebe: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  ortak: '<path d="M7 11V5M12 17V5M17 14V5M4 21h16"/>',
  yolharitasi: '<path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2zM9 4v14M15 6v14"/>',
  act: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  sms: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
  supervizyon: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M8 9l3 2-3 2"/>',
  websitesi: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  gelisim: '<path d="M4 17l5-5 3 3 7-8M16 4h4v4"/>',
  pratik: '<path d="M5 3h11l4 4v14H5zM15 3v5h5"/><path d="M9 13h6M9 16h4"/>',
  antrenor: '<path d="M6.5 6.5 17.5 17.5M5 9 9 5M15 19l4-4M3 11l2 2M19 13l2-2M11 3l2 2M11 21l2-2"/>',
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
const DARK: Partial<Record<RoomKey, boolean>> = { muhasebe: true, ortak: true };

// Henüz yarım/gelişim aşamasındaki modüller — hub'da tek "Gelişim aşamasındakiler" kartında toplanır
const GELISIM_KEYS: RoomKey[] = ['act', 'yolharitasi', 'supervizyon', 'websitesi', 'pratik', 'antrenor', 'ortak'];
const WIP_ICON = '<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5"/>';

// danışan adından türeyen 6 stabil pastel ton (mor+pembe)
const AV_TONES = [
  { bg: '#F4D2DD', ink: '#8A3D5C' }, { bg: '#E9D6EC', ink: '#6E4878' }, { bg: '#F0DCEA', ink: '#84456E' },
  { bg: '#E6DAF0', ink: '#5E4878' }, { bg: '#F6D8D0', ink: '#9A5240' }, { bg: '#DEDAEE', ink: '#4A4870' },
];
const toneFor = (name: string) => { let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return AV_TONES[h % AV_TONES.length]; };
const initials = (n: string) => n.trim().split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase();

const RAIL = [{ id: 'ca-hub', l: 'Bölümler' }];


export default function CalismaAlaniV3(props: CalismaAlaniV3Props) {
  const { therapistName = 'Göksel Akkaya', roomMeta = {}, weekBars = [],
    onNav, onNewClient, onOpenProfile, onOpenTakvim, onOpenDanisanlar, onOpenTasarimlar,
    onOpenLibrary, onOpenMuhasebe, onOpenOrtak, onOpenInsights, onOpenYolHaritasi, onOpenAct, onOpenSms,
    onOpenSupervizyon, onOpenWebsitesi, onOpenGelisim, onOpenPratik, onOpenAntrenor } = props;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [gelisimOpen, setGelisimOpen] = useState(false);
  const showToast = (m: string) => { setToast(m); window.clearTimeout((showToast as any)._t); (showToast as any)._t = window.setTimeout(() => setToast(null), 2400); };

  // ── nav glider (hover'da imlecin altına kayan beyaz pill, mouseleave'de aktife döner) ──
  const navLinksRef = useRef<HTMLDivElement>(null);
  const gliderRef = useRef<HTMLSpanElement>(null);
  const moveGlider = (el: HTMLElement | null) => { const g = gliderRef.current; if (!g || !el) return; g.style.left = el.offsetLeft + 'px'; g.style.width = el.offsetWidth + 'px'; g.style.opacity = '1'; };
  const resetGlider = () => moveGlider(navLinksRef.current?.querySelector('a.active') as HTMLElement | null);
  useEffect(() => {
    resetGlider();
    const onR = () => resetGlider();
    window.addEventListener('resize', onR);
    (document as any).fonts?.ready?.then(resetGlider);
    return () => window.removeEventListener('resize', onR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // ── railnav scroll-spy ──
  const [activeSec, setActiveSec] = useState('ca-hub');
  useEffect(() => {
    if (!mounted) return;
    const root = rootRef.current; if (!root) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setActiveSec((e.target as HTMLElement).id); }),
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    ['ca-hub'].forEach((id) => { const el = root.querySelector('#' + id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [mounted]);
  const scrollTo = (id: string) => { const el = rootRef.current?.querySelector('#' + id) as HTMLElement | null; if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); };

  // Oda tıklama hedefleri
  const roomClick: Record<RoomKey, (() => void) | undefined> = {
    takvim: onOpenTakvim, danisanlar: onOpenDanisanlar, tasarimlar: onOpenTasarimlar,
    kutuphane: onOpenLibrary, muhasebe: onOpenMuhasebe, ortak: onOpenOrtak,
    yolharitasi: onOpenYolHaritasi, act: onOpenAct, sms: onOpenSms,
    supervizyon: onOpenSupervizyon, websitesi: onOpenWebsitesi, gelisim: onOpenGelisim,
    pratik: onOpenPratik, antrenor: onOpenAntrenor,
  };

  const avstack = (names: string[] | undefined, max = 3) => {
    if (!names || !names.length) return <span />;
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
      <a className={`room reveal${DARK[k] ? ' dark' : ''}`} href="#" data-screen-label={TITLES[k]} style={{ animationDelay: `${delay}ms` }}
        onClick={(e) => { e.preventDefault(); roomClick[k]?.(); }}>
        <div className="room-head"><span className="room-ic"><svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: ICONS[k] }} /></span><span className="room-more" aria-hidden="true">⋯</span></div>
        <div className="room-body"><div className="room-title">{TITLES[k]}</div><div className="room-sub">{sub}</div></div>
        {(m.team || m.count != null) ? <div className="room-foot">{avstack(m.team)}{m.count != null ? <span className="room-count num">{m.count}</span> : <span />}</div> : null}
      </a>
    );
  };

  const bars = weekBars.length ? weekBars : [0, 0, 0, 0, 0, 0, 0];
  const barMax = Math.max(1, ...bars);
  const allZero = bars.every((b) => b === 0);


  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={FONTS} rel="stylesheet" />

      <div className="cav3" ref={rootRef} data-screen-label="Çalışma Alanı — Calmie">
        <div className="scene" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        {/* ───────── NAV ───────── */}
        <div className="navwrap">
          <nav className="nav" aria-label="Birincil">
            <a className="logo" onClick={() => onNav?.('home')}>Calmie<i>.</i></a>
            <div className="nav-links" ref={navLinksRef} onMouseLeave={resetGlider}>
              <a onMouseEnter={(e) => moveGlider(e.currentTarget)} onClick={() => onNav?.('home')}>Ana Sayfa</a>
              <a onMouseEnter={(e) => moveGlider(e.currentTarget)} onClick={() => (onOpenTakvim ? onOpenTakvim() : onNav?.('calendar'))}>Takvim &amp; Randevular</a>
              <a className="active" onMouseEnter={(e) => moveGlider(e.currentTarget)} onClick={(e) => e.preventDefault()}>Çalışma Alanı</a>
              <a onMouseEnter={(e) => moveGlider(e.currentTarget)} onClick={() => onOpenProfile?.()}>Profil</a>
              <span className="nav-glider" ref={gliderRef} aria-hidden="true" />
            </div>
            <div className="nav-actions">
              <button className="nav-new" type="button" onClick={() => onNewClient?.()}><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg><span>Yeni danışan</span></button>
              <span className="pro"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.3L21 9l-4.8 4.3L17.6 22 12 18.4 6.4 22l1.4-8.7L3 9l6.4-.7z" /></svg>PRO</span>
              <a className="nav-nm" onClick={() => onOpenProfile?.()}>{therapistName}</a>
              <a className="nav-av" onClick={() => onOpenProfile?.()}>{initials(therapistName)}</a>
            </div>
            <button className="menu-btn" aria-label="Menü" onClick={() => setMobileMenu((v) => !v)}>
              <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </nav>
          <div className={'mobile-menu' + (mobileMenu ? ' open' : '')}>
            <a onClick={() => { setMobileMenu(false); onNav?.('home'); }}>Ana Sayfa</a>
            <a onClick={() => { setMobileMenu(false); (onOpenTakvim ? onOpenTakvim() : onNav?.('calendar')); }}>Takvim &amp; Randevular</a>
            <a onClick={() => setMobileMenu(false)}>Çalışma Alanı</a>
            <a onClick={() => { setMobileMenu(false); onOpenProfile?.(); }}>Profil</a>
          </div>
        </div>

        <main className="page">
          <div className="wrap">

            {/* ───────── §01 HUB ───────── */}
            <section id="ca-hub">
              <div className="hub-head">
                <div className="l"><span className="eyebrow" data-no="01">Hub</span><h1 className="hub-title">Nereden <em>başlamak</em> istersin?</h1></div>
                <p className="hub-aside">Her biri vaka çalışmasının bir parçasını yönetir.</p>
              </div>
              <div className="rooms">
                <a className="room create reveal" href="#" data-screen-label="Yeni danışan" style={{ animationDelay: '0ms' }} onClick={(e) => { e.preventDefault(); onNewClient?.(); }}>
                  <span className="plus"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></span><span className="ct">Yeni danışan ekle</span>
                </a>
                <RoomCard k="takvim" delay={55} />
                <a className="room reveal" href="#" data-screen-label="Bu hafta" style={{ animationDelay: '110ms' }}
                  onClick={(e) => { e.preventDefault(); (onOpenInsights ?? (() => showToast('Haftalık içgörüler açılıyor…')))(); }}>
                  <div className="room-head"><span className="room-tag">Bu hafta</span><span className="room-more" aria-hidden="true">⋯</span></div>
                  <div className="room-chart">{bars.map((b, i) => <i key={i} className={allZero ? 'flat' : ''} style={{ height: `${allZero ? 12 : Math.max(8, Math.round((b / barMax) * 100))}%` }} />)}</div>
                  <div className="room-foot"><span className="room-tag">Pzt — Paz</span><span className="room-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></span></div>
                </a>
                <RoomCard k="danisanlar" delay={165} />
                <RoomCard k="tasarimlar" delay={220} />
                <RoomCard k="kutuphane" delay={275} />
                <RoomCard k="muhasebe" delay={330} />
                <RoomCard k="sms" delay={385} />
                <RoomCard k="gelisim" delay={440} />
                {/* Yarım/gelişim aşamasındaki 7 modül tek kartta toplandı */}
                <a className="room reveal" href="#" data-screen-label="Gelişim aşamasındakiler" style={{ animationDelay: '495ms' }}
                  onClick={(e) => { e.preventDefault(); setGelisimOpen(true); }}>
                  <div className="room-head"><span className="room-ic"><svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: WIP_ICON }} /></span><span className="room-more" aria-hidden="true">⋯</span></div>
                  <div className="room-body"><div className="room-title">Gelişim aşamasındakiler</div><div className="room-sub">Yapım aşamasındaki modüller</div></div>
                  <div className="room-foot"><span className="room-tag">Yakında</span><span className="room-count num">{GELISIM_KEYS.length}</span></div>
                </a>
              </div>
            </section>

          </div>
        </main>

        {/* ───────── FOOTER ───────── */}
        <footer className="footer">
          <div className="footer-in">
            <div className="foot-brand"><span className="logo">Calmie<i>.</i></span><p>Sadece işini yapmak isteyenler için klinik asistan.</p></div>
            <div className="foot-col"><h4>Çalışma</h4>
              <a onClick={() => (onOpenTakvim ? onOpenTakvim() : onNav?.('calendar'))}>Takvim &amp; Randevular</a>
              <a onClick={() => onOpenDanisanlar?.()}>Danışan Listesi</a>
              <a onClick={() => onOpenLibrary?.()}>Müdahale Kütüphanesi</a>
            </div>
            <div className="foot-col"><h4>Hesap</h4>
              <a onClick={() => onOpenProfile?.()}>Profil</a>
              <a onClick={() => onOpenMuhasebe?.()}>Muhasebe</a>
              <a onClick={() => onNav?.('ayarlar')}>Ayarlar</a>
            </div>
            <div className="foot-col"><h4>Destek</h4>
              <a onClick={() => onOpenSupervizyon?.()}>Süpervizyon</a>
              <a onClick={() => onOpenGelisim?.()}>Gelişim Planı</a>
              <a onClick={() => showToast('İletişim yakında.')}>İletişim</a>
            </div>
          </div>
          <div className="foot-bottom"><div className="foot-bottom-in"><span>© 2026 Calmie</span><span>{therapistName} · PRO</span></div></div>
        </footer>

        {/* ───────── RAILNAV ───────── */}
        <nav className="railnav" aria-label="Bölümler">
          {RAIL.map((r) => (
            <a key={r.id} className={'rn-item' + (activeSec === r.id ? ' active' : '')} onClick={() => scrollTo(r.id)}>
              <span className="rn-label">{r.l}</span><span className="rn-tick" />
            </a>
          ))}
        </nav>

        {/* Gelişim aşamasındakiler — overlay'i body'ye portal et (sekme animasyonunun transform'lu sarmalayıcısı fixed'i kırıyor) */}
        {gelisimOpen && typeof document !== 'undefined' && createPortal(
          <div className="cav3 cav3-portal">
            <div className="gov" onClick={(e) => { if (e.target === e.currentTarget) setGelisimOpen(false); }}>
              <div className="gpanel">
                <div className="gpanel-h">
                  <div>
                    <span className="eyebrow">Gelişim aşamasındakiler</span>
                    <h3>Yapım aşamasındaki modüller</h3>
                    <p>Bu araçlar henüz geliştiriliyor; hazır oldukça hub&apos;a ayrı kart olarak taşınacak.</p>
                  </div>
                  <button className="gx" type="button" aria-label="Kapat" onClick={() => setGelisimOpen(false)}>×</button>
                </div>
                <div className="grooms">
                  {GELISIM_KEYS.map((k) => (
                    <a key={k} className="room" href="#" data-screen-label={TITLES[k]}
                      onClick={(e) => { e.preventDefault(); setGelisimOpen(false); roomClick[k]?.(); }}>
                      <div className="room-head"><span className="room-ic"><svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: ICONS[k] }} /></span></div>
                      <div className="room-body"><div className="room-title">{TITLES[k]}</div><div className="room-sub">{SUBS[k]}</div></div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

        {/* ───────── TOAST ───────── */}
        <div className="toast-wrap">
          {toast && <div className="toast show"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg><span>{toast}</span></div>}
        </div>
      </div>
    </>
  );
}
