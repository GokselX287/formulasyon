'use client';

import { useEffect, useRef, useState } from 'react';
import './TerapistProfilV2.css';

// ──────────────────────────────────────────────────────────────────────────
// Terapist Profil — "Hesabım" · "Klinik Editöryel Dosya"
// Terapist Profil v2.html birebir port. Koyu mesh hero + 10 bölüm +
// kitle modu (Hesabım/Herkese açık) + sağ ray scroll-spy + dock.
// Portre fotoğrafı localStorage('tp-profile-photo')'tan okunur (mevcut anahtar).
// ──────────────────────────────────────────────────────────────────────────

export type TerapistSettings = {
  smsWebhookUrl: string;
  smsAutoAppointmentReminder: boolean;
  smsDayOfReminder: boolean;
  noShowTracking: boolean;
  smsAutoWorkshopSignup: boolean;
  gmailUser: string;
  gmailAppPassword: string;
  gmailImapHost: string;
  gmailImapPort: number;
};

export type TerapistProfilV2Props = {
  onBack?(): void;
  onNav?(target: string): void;
  onEditProfile?(): void;
  onShareConsent?(): void;
  settings?: Partial<TerapistSettings>;
  onUpdateSetting?(patch: Partial<TerapistSettings>): void;
  onExportData?(): void;
  /** Ana Sayfa "yeni yansıma" → terapist tab açılıp yansıma bölümüne kaydırır */
  focusReflection?: boolean;
  onConsumedFocus?(): void;
  /** Bilgilendirme kitapçığını danışana gönder (link üretir) */
  onShareBooklet?(booklet: { title: string; body: string }): void;
  /** Gelişim planı etkinlikleri (takvimden taşındı) */
  gelisimEvents?: { id: string; title: string; date: string; time: string; durationMin: number; done?: boolean }[];
  onAddGelisim?(ev: { title: string; date: string; time: string; durationMin: number }): void;
};

// Bilgilendirme kitapçıkları — danışana gönderilebilen psikoeğitim metinleri
const BOOKLETS: { id: string; title: string; desc: string; body: string }[] = [
  { id: 'kaygi', title: 'Kaygı Nedir?', desc: 'Kaygının işlevi, bedensel belirtileri ve kısır döngüsü.',
    body: 'Kaygı, tehlike algısına karşı bedenin doğal alarm sistemidir; kısa vadede koruyucu, aşırı uyarıldığında tüketicidir. Çarpıntı, nefes darlığı, kas gerginliği gibi belirtiler tehlikeli değil, alarmın bedensel yankısıdır. Kaçınma kısa vadede rahatlatır ama uzun vadede kaygıyı besler — çünkü "tehlike yok" öğrenmesi gerçekleşmez. İyileşme, kaçındığımız durumlara kademeli ve güvenli biçimde yaklaşmaktan geçer.' },
  { id: 'panik', title: 'Panik Döngüsü', desc: 'Bedensel duyum → felaket yorumu → panik kısır döngüsü.',
    body: 'Panik atak; zararsız bir bedensel duyumun (çarpıntı, baş dönmesi) "kalp krizi geçiriyorum / kontrolü kaybediyorum" gibi felaket yorumuyla büyümesiyle oluşur. Yorum korkuyu, korku duyumu artırır — döngü kapanır. Atak tehlikeli değildir ve kendiliğinden geçer. Duyumları felaketleştirmeden gözlemlemek ve güvenlik davranışlarını azaltmak döngüyü kırar.' },
  { id: 'act', title: 'ACT’e Giriş', desc: 'Kabul, değerler ve psikolojik esneklik.',
    body: 'Kabul ve Kararlılık Terapisi (ACT), zorlayıcı düşünce ve duygularla mücadele etmek yerine onlara yer açmayı; enerjiyi sizin için gerçekten önemli olan (değerleriniz) yönünde harcamayı öğretir. Amaç duyguları yok etmek değil, onlarla birlikteyken bile değerli bir hayat sürebilmektir. Buna psikolojik esneklik denir.' },
  { id: 'uyku', title: 'Uyku Hijyeni', desc: 'Sağlıklı uyku için davranışsal öneriler.',
    body: 'Düzenli yatış-kalkış saatleri, yatağı yalnızca uyku için kullanmak, gün içinde ışık almak, akşam ekran ve kafeini azaltmak uyku kalitesini artırır. Uyku gelmiyorsa yatakta zorlanmak yerine kalkıp sakin bir aktivite yapıp uyku gelince dönmek önerilir. Uykuyu "kontrol etmeye" çalışmak çoğu zaman uykusuzluğu besler.' },
  { id: 'defuzyon', title: 'Düşüncelerden Ayrışma (Defüzyon)', desc: 'Düşünceyi gerçek değil, zihnin ürünü olarak görmek.',
    body: 'Zihnimiz sürekli düşünce üretir; ama her düşünce doğru ya da emir değildir. Defüzyon, bir düşünceye kapılmak yerine onu bir adım geriden izlemektir: "Yetersizim" yerine "…yetersiz olduğum düşüncem var" demek gibi. Böylece düşünce gücünü yitirir ve değerli eylemlerinizi engellemez.' },
];

type Reflection = {
  id?: number | string;
  body?: string;
  created_at?: string;
  meta?: string | null;
  accent_word?: string | null;
};

type Mode = 'hesabim' | 'herkes';

const PROFIL = {
  stats: [
    { v: '5.000+', l: 'Bireysel görüşme' },
    { v: '700+', l: 'Saat akredite eğitim' },
    { v: '300+', l: 'Saat süpervizyon' },
  ],
  uzmanlik: ['Kaygı Bozuklukları', 'Depresyon', 'Obsesif Kompulsif Bozukluk', 'Bağımlılık', 'Travma Sorunları', 'Yeme Bozuklukları', 'Ergen & Yetişkin', 'Kurumsal Danışmanlık'],
  yaklasimlar: [
    { b: 'BDT', h: 'Bilişsel Davranışçı Terapi', p: 'Düşünce, duygu ve davranış döngüsünü sistematik biçimde ele alır; her seansın gündemi ve hedefi vardır.' },
    { b: 'MCT', h: 'Metakognitif Terapi', p: 'Düşünceler hakkındaki düşüncelerimizi — endişe ve ruminasyon örüntülerini hedefler.' },
    { b: 'ACT', h: 'Kabul ve Kararlılık Terapisi', p: 'Psikolojik esneklik ve değerler temelli; zorlayıcı duyguları insan olmanın doğal parçası olarak konumlar.' },
    { b: 'MBCT', h: 'Mindfulness Bazlı BDT', p: 'Bilinçli farkındalık temelli yaklaşım; deneyimsel egzersizlerle değişimi ‘hissetme’ odağı.' },
  ],
  saatler: [
    { d: 'Pazartesi', t: '09:00 – 18:00' }, { d: 'Salı', t: '09:00 – 18:00' }, { d: 'Çarşamba', t: '09:00 – 18:00' },
    { d: 'Perşembe', t: '09:00 – 18:00' }, { d: 'Cuma', t: '09:00 – 16:00' }, { d: 'Cumartesi', t: 'Kapalı', off: true }, { d: 'Pazar', t: 'Kapalı', off: true },
  ],
  seansAyar: [
    { k: 'Seans süresi', s: 'Standart bireysel seans', v: '50 dakika' },
    { k: 'Format', s: 'Görüşme türleri', v: 'Yüz yüze · Online' },
    { k: 'Seans dili', s: '', v: 'Türkçe' },
    { k: 'İptal politikası', s: 'Ücretsiz iptal için', v: '24 saat önce' },
    { k: 'Ücret görünürlüğü', s: 'Danışan tarafında', v: 'Görüşmede paylaşılır' },
  ],
  bildirim: [
    { k: 'Randevu hatırlatma', s: 'Danışana, seanstan önce', tog: true },
    { k: 'Gün içi hatırlatma', s: 'Aynı gün sabah SMS', tog: true },
    { k: 'No-show takibi', s: 'Gelmeyen danışan işareti', tog: true },
    { k: 'Pazarlama / toplu SMS', s: 'Kampanya mesajları', tog: false },
  ],
  veri: [
    { k: 'macOS Takvim — Randevular', s: 'Seanslar canlı okunur', state: 'Güncel', ok: true },
    { k: 'Yerel veri (SQLite)', s: 'Tüm kayıtlar cihazda', state: 'Şifreli', ok: true },
    { k: 'Yedekleme', s: 'Son yedek 2 gün önce', state: 'Hatırlat', warn: true },
    { k: 'Dışa aktarma', s: 'Danışan dosyaları · PDF', chev: true },
  ],
  yil: {
    cards: [{ v: '412', l: 'Bu yıl seans' }, { v: '86', l: 'Eğitim saati' }, { v: '14', l: 'Süpervizyon' }, { v: '23', l: 'Yansıma notu' }],
    quote: 'Bu yıl en çok ACT süreç-odaklı çalışmada derinleştim; öz-bakımda haftalık ritmi korumak en büyük kazanım oldu.',
  },
  akademik: [
    { lvl: 'Yüksek Lisans', h: 'Yönetim ve Organizasyon (MBA)', k: 'Marmara Üniversitesi' },
    { lvl: 'Lisans', h: 'Psikolojik Danışmanlık ve Rehberlik (İng.)', k: 'Orta Doğu Teknik Üniversitesi (ODTÜ)' },
  ],
  egitim: [
    { grp: 'Kabul ve Kararlılık Terapisi (ACT)', items: [
      { yr: '2026', ti: 'Süreç Odaklı Terapi Eğitimi', by: 'Dr. İbrahim Bilgen · ACT Türkiye' },
      { yr: '2026', ti: 'ACT İleri Düzey Eğitimi', by: 'Dr. İbrahim Bilgen · ACT Türkiye' },
      { yr: '2025', ti: 'ACT Orta Seviye Eğitimi', by: 'Dr. İbrahim Bilgen · ACT Türkiye' },
      { yr: '2025', ti: 'ACT Temel Eğitim', by: 'Fatih Yavuz · TÜRBAD' },
    ] },
    { grp: 'Bilişsel Davranışçı Terapi (BDT)', items: [
      { yr: '2023–24', ti: 'BDT Süpervizyon (3.) + Çocuk-Ergen BDT', by: 'Türkçapar / Görmez · BDPD, İstanbul' },
      { yr: '2022', ti: 'BDT 2. Modül İleri Düzey (Yeme, OKB, TSSB, Bağımlılık…)', by: 'M. Hakan Türkçapar · BDPD, Ankara' },
      { yr: '2021', ti: 'BDT Süpervizyon (1.) + Beceri Kazandırma', by: 'M. Hakan Türkçapar · BDPD' },
      { yr: '2020', ti: 'BDT Teorik Eğitim + Klinik Değerlendirme', by: 'M. Hakan Türkçapar · BDPD, İstanbul' },
    ] },
    { grp: 'Diğer & Sertifikalar', items: [
      { yr: '2019', ti: 'Hipnoterapi & Cinsel Terapide Hipnoterapi', by: 'Bülent Uran · CİSED, İstanbul' },
      { yr: '2019', ti: 'Uygulayıcı Test Sertifikaları (WISC-R, Raven, Peabody…)', by: 'Bilgelik Enstitüsü · İstanbul' },
      { yr: '2016', ti: 'İletişim & Müşteri Deneyimi Sertifikaları', by: 'TelephoneDoctor, İstanbul' },
    ] },
  ],
  onam: [
    { b: 'KVKK Aydınlatma & Açık Rıza', s: 'Standart · imzalı akış aktif', state: 'Aktif', ok: true },
    { b: 'Psikoterapi Onam Formu', s: 'Yetişkin bireysel', state: 'Aktif', ok: true },
    { b: 'Çocuk / Ebeveyn Onamı', s: '18 yaş altı için', state: 'Aktif', ok: true },
  ],
  supervizyon: [
    { b: 'BDT Süpervizyon — 3 dönem', s: 'M. Hakan Türkçapar' },
    { b: 'ACT İleri Süpervizyon', s: 'ACT Türkiye · sürüyor' },
  ],
  prensipler: [
    { b: 'Bilimsel Katılık', p: 'Yalnızca kanıta dayalı, etkinliği ispatlanmış yöntemler.' },
    { b: 'Tam Mahremiyet', p: 'Etik kurallar çerçevesinde en yüksek gizlilik standardı.' },
    { b: 'Sonuç Odaklı', p: 'Geçici rahatlama değil, kalıcı psikolojik esneklik.' },
    { b: 'Titiz Yapılandırma', p: 'Her seansın gündemi ve hedefi olan sistematik yapı.' },
    { b: 'İnsanlığı Modelleme', p: 'Zorlayıcı duygular insan olmanın doğal parçası olarak ele alınır.' },
    { b: 'Psikoeğitim', p: 'Zihinsel mekanizmaların öğretilmesi; danışanın kendi uzmanı olması.' },
  ],
};

const EditBtn = ({ onClick }: { onClick?(): void }) => (
  <button className="sec-edit hesabim-only" type="button" onClick={onClick}>
    <svg viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>Düzenle
  </button>
);

const RAIL: { id: string; l: string; hide?: boolean }[] = [
  { id: 'kimlik', l: 'Kimlik' }, { id: 'uzmanlik', l: 'Uzmanlık' }, { id: 'yaklasimlar', l: 'Yaklaşımlar' }, { id: 'saatler', l: 'Saatler' },
  { id: 'seans-ayar', l: 'Seans', hide: true }, { id: 'bildirim', l: 'Bildirim', hide: true }, { id: 'veri', l: 'Veri', hide: true },
  { id: 'yil', l: 'Yıl' }, { id: 'iyilik', l: 'İyilik hali', hide: true }, { id: 'gelisim', l: 'Gelişim', hide: true }, { id: 'yansima', l: 'Yansıma', hide: true }, { id: 'kitapcik', l: 'Kitapçıklar', hide: true }, { id: 'egitim', l: 'Eğitim' }, { id: 'onam', l: 'Onam', hide: true }, { id: 'prensipler', l: 'Prensipler' },
];

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
  { label: 'Profil', target: 'terapist', active: true },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

export default function TerapistProfilV2(props: TerapistProfilV2Props) {
  const { onBack, onNav, onEditProfile, onShareConsent, settings, onUpdateSetting, onExportData, focusReflection, onConsumedFocus, onShareBooklet, gelisimEvents = [], onAddGelisim } = props;
  const [openBooklet, setOpenBooklet] = useState<string | null>(null);
  const [gp, setGp] = useState({ title: '', date: '', time: '', dur: '180' });
  const addGelisim = () => {
    if (!gp.title.trim() || !gp.date) return;
    onAddGelisim?.({ title: gp.title.trim(), date: gp.date, time: gp.time || '09:00', durationMin: Number(gp.dur) || 60 });
    setGp({ title: '', date: '', time: '', dur: gp.dur });
  };

  // ── Yansıma defteri — gerçek /api/reflections ──────────────────────────
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [draftFark, setDraftFark] = useState('');
  const [draftKlinik, setDraftKlinik] = useState('');
  const [savingRefl, setSavingRefl] = useState(false);

  const loadReflections = () => {
    fetch('/api/reflections?type=daily&limit=12')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setReflections(Array.isArray(d) ? d : []))
      .catch(() => {});
  };
  useEffect(() => { loadReflections(); }, []);

  const saveReflection = async () => {
    const fark = draftFark.trim(); const klinik = draftKlinik.trim();
    if ((!fark && !klinik) || savingRefl) return;
    const parts: string[] = [];
    if (fark) parts.push(`Fark ettiklerim — ${fark}`);
    if (klinik) parts.push(`Klinik yansımalar — ${klinik}`);
    const text = parts.join('\n\n');
    setSavingRefl(true);
    try {
      await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'daily', text, meta: 'yansıma notu' }),
      });
      setDraftFark(''); setDraftKlinik('');
      loadReflections();
    } catch {} finally {
      setSavingRefl(false);
    }
  };

  const fmtReflDate = (s?: string) => {
    if (!s) return '';
    try { return new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return ''; }
  };

  // ── İyilik hali — Ana Sayfa check-in skorları (0-10) ───────────────────
  type CheckIn = { id?: number | string; score?: number | null; body?: string; created_at?: string };
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  useEffect(() => {
    fetch('/api/reflections?type=check-in&limit=60')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: CheckIn[]) => setCheckins(
        (Array.isArray(d) ? d : [])
          .filter((x) => x.score != null && !Number.isNaN(Number(x.score)))
          .reverse(), // GET DESC → kronolojik (eski→yeni) çiz
      ))
      .catch(() => {});
  }, []);

  // SVG çizim geometrisi (hydration için koordinatlar yuvarlanır; veri client-fetch).
  const wbChart = (() => {
    const pts = checkins.map((c) => Number(c.score));
    const n = pts.length;
    const W = 680, H = 200, padL = 30, padR = 14, padT = 14, padB = 26;
    const iw = W - padL - padR, ih = H - padT - padB;
    const xAt = (i: number) => Math.round((n <= 1 ? 0 : (i / (n - 1)) * iw) + padL);
    const yAt = (v: number) => Math.round(padT + (1 - v / 10) * ih);
    const line = pts.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
    const area = n ? `${padL},${padT + ih} ${line} ${xAt(n - 1)},${padT + ih}` : '';
    const grid = [0, 5, 10].map((v) => ({ v, y: yAt(v) }));
    const avg = n ? Math.round((pts.reduce((s, v) => s + v, 0) / n) * 10) / 10 : null;
    const last = n ? pts[n - 1] : null;
    return { W, H, padL, padT, ih, n, pts, line, area, grid, avg, last, xAt, yAt };
  })();


  // Webhook + Gmail metin alanları: yerel taslak, blur'da kaydet
  const [cfg, setCfg] = useState({
    smsWebhookUrl: '', gmailUser: '', gmailAppPassword: '', gmailImapHost: 'imap.gmail.com', gmailImapPort: '993',
  });
  useEffect(() => {
    setCfg({
      smsWebhookUrl: settings?.smsWebhookUrl ?? '',
      gmailUser: settings?.gmailUser ?? '',
      gmailAppPassword: settings?.gmailAppPassword ?? '',
      gmailImapHost: settings?.gmailImapHost ?? 'imap.gmail.com',
      gmailImapPort: String(settings?.gmailImapPort ?? 993),
    });
  }, [settings?.smsWebhookUrl, settings?.gmailUser, settings?.gmailAppPassword, settings?.gmailImapHost, settings?.gmailImapPort]);
  const saveCfg = (key: keyof TerapistSettings, raw: string) => {
    const val: any = key === 'gmailImapPort' ? (Number(raw) || 993) : raw;
    onUpdateSetting?.({ [key]: val } as Partial<TerapistSettings>);
  };
  const [mode, setMode] = useState<Mode>('hesabim');
  const [activeRail, setActiveRail] = useState('kimlik');
  const [photo, setPhoto] = useState<string | null>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const secRefs = useRef<Record<string, HTMLElement | null>>({});
  const optRefs = useRef<Record<Mode, HTMLButtonElement | null>>({ hesabim: null, herkes: null });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tp-profile-photo');
      if (saved) setPhoto(saved);
    } catch {}
  }, []);

  // Kitle modu thumb konumu (buton genişlikleri farklı — gerçek ölçüm)
  useEffect(() => {
    const el = optRefs.current[mode];
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
  }, [mode]);

  // Scroll-spy
  useEffect(() => {
    const root = modalBodyRef.current; if (!root) return;
    const secs = Object.values(secRefs.current).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => { if (e.isIntersecting) setActiveRail((e.target as HTMLElement).id); }),
      { root, rootMargin: '-12% 0px -80% 0px', threshold: 0 },
    );
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [mode]);

  const scrollTo = (id: string) => {
    const el = secRefs.current[id]; const mb = modalBodyRef.current;
    if (el && mb) mb.scrollTo({ top: el.getBoundingClientRect().top - mb.getBoundingClientRect().top + mb.scrollTop - 4, behavior: 'smooth' });
  };

  // Ana Sayfa "yeni yansıma" → yansıma bölümüne odaklan.
  // Tab mount olurken yazı tipi/görsel yüklemesi düzeni kaydırdığından
  // tek seferlik scroll güvenilmez; düzen oturana dek birkaç kez dener.
  useEffect(() => {
    if (!focusReflection) return;
    setMode('hesabim');
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      scrollTo('yansima');
      // onConsumedFocus'u SON tick'te çağır: erken çağrı focusReflection'ı
      // false yapıp effect cleanup'ı pending scroll'u iptal ederdi.
      if (++tries < 4) timer = setTimeout(tick, 220);
      else onConsumedFocus?.();
    };
    timer = setTimeout(tick, 180);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusReflection]);

  const railItems = RAIL.filter((it) => !(it.hide && mode === 'herkes'));
  const setRef = (id: string) => (el: HTMLElement | null) => { secRefs.current[id] = el; };

  const SecHead = ({ eyebrow, title, edit = true }: { eyebrow: string; title: React.ReactNode; edit?: boolean }) => (
    <div className="sec-head">
      <div className="l"><span className="eyebrow">{eyebrow}</span><h2 className="sec-title">{title}</h2></div>
      {edit && <EditBtn onClick={onEditProfile} />}
    </div>
  );

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="tp2" data-mode={mode}>
        <div className="shell">

          <div className="topbar">
            <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Ana Sayfa</button>
            <div className="topbar-right">
              <a className="print-link hesabim-only" href="#" onClick={(e) => { e.preventDefault(); window.print(); }}>Yazdır / PDF</a>
              <div className="audience" role="group" aria-label="Kitle modu">
                <span className="thumb" style={thumb ? { left: thumb.left, width: thumb.width } : { opacity: 0 }} />
                <button ref={(el) => { optRefs.current.hesabim = el; }} className="opt" data-mode="hesabim" aria-pressed={mode === 'hesabim'} onClick={() => setMode('hesabim')}>Hesabım</button>
                <button ref={(el) => { optRefs.current.herkes = el; }} className="opt" data-mode="herkes" aria-pressed={mode === 'herkes'} onClick={() => setMode('herkes')}>Herkese açık</button>
              </div>
            </div>
          </div>

          <div className="modal-body" ref={modalBodyRef}>

            {/* HERO — Kimlik */}
            <section className="hero" id="kimlik" ref={setRef('kimlik')} data-screen-label="Hesabım — Kimlik">
              <div className="hero-inner">
                <div>
                  <div className="hero-eyebrow"><span>Psikolojik Danışman</span><span className="acc">EABCT Akredite · 2025–2030</span></div>
                  <h1 className="hero-name">Göksel <i>Akkaya</i></h1>
                  <div className="hero-role"><span>Tekirdağ</span><span className="sep">·</span><span>BDT · ACT · Metakognitif</span></div>
                  <p className="hero-bio">Çalışmalarını ağırlıklı olarak <b>Bilişsel Davranışçı Terapi</b>, <b>Kabul ve Kararlılık Terapisi</b> ve <b>Metakognitif Terapi</b> üzerine inşa eder. Sunulan destek; yalnızca deneyime değil, sürekli öğrenmeye, güncel literatüre ve süpervizyon süreçlerine dayanır.</p>
                  <div className="hero-quote"><p>“Gerçek değişim, konfor alanının bittiği ve dürüstlüğün başladığı yerde filizlenir.”</p></div>
                  <div className="hero-cta">
                    <button className="btn solid hesabim-only" type="button" onClick={() => onEditProfile?.()}><svg viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>Profili düzenle</button>
                    <button className="btn ghost hesabim-only" type="button" onClick={() => onShareConsent?.()}><svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>Onam formunu paylaş</button>
                    <a className="btn ghost herkes-only" href="mailto:elegantpsikoloji@icloud.com"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>İletişime geç</a>
                  </div>
                </div>
                <aside className="hero-aside">
                  <div className="portrait"><span className="mono">GA</span>{photo && <img alt="Göksel Akkaya" src={photo} />}</div>
                  <div className="contact hesabim-only">
                    <a href="mailto:elegantpsikoloji@icloud.com"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>elegantpsikoloji@icloud.com</a>
                    <a href="tel:+905541951854"><svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>+90 554 195 18 54</a>
                    <a href="https://instagram.com/psk.gokselakkaya" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>@psk.gokselakkaya</a>
                  </div>
                </aside>
              </div>
              <div className="hero-stats">
                {PROFIL.stats.map((s, i) => (
                  <div className="hstat" key={i}><div className="v num">{s.v}</div><div className="l">{s.l}</div></div>
                ))}
              </div>
            </section>

            <main className="main">

              {/* 01 Uzmanlık */}
              <section className="section" id="uzmanlik" ref={setRef('uzmanlik')} data-screen-label="Uzmanlık alanları">
                <SecHead eyebrow="uzmanlık alanları" title={<>Çalışılan <i>konular</i></>} />
                <div className="chips">{PROFIL.uzmanlik.map((u, i) => <span className="c" key={i}>{u}</span>)}</div>
              </section>

              {/* 02 Yaklaşımlar */}
              <section className="section" id="yaklasimlar" ref={setRef('yaklasimlar')} data-screen-label="Terapi yaklaşımları">
                <SecHead eyebrow="terapi yaklaşımları" title={<>Çalışılan <i>ekoller</i></>} />
                <div className="appr">{PROFIL.yaklasimlar.map((a, i) => (
                  <div className="acard" key={i}><div className="ab">{a.b}</div><h3>{a.h}</h3><p>{a.p}</p></div>
                ))}</div>
              </section>

              {/* 03 Çalışma saatleri */}
              <section className="section" id="saatler" ref={setRef('saatler')} data-screen-label="Çalışma saatleri">
                <SecHead eyebrow="çalışma saatleri" title={<>Haftalık <i>uygunluk</i></>} />
                <div className="hours">{PROFIL.saatler.map((h, i) => (
                  <div className={`hrow${h.off ? ' off' : ''}`} key={i}><span className="d">{h.d}</span><span className="t">{h.t}</span></div>
                ))}</div>
              </section>

              {/* 04 Seans ayarları (hesabim-only) */}
              <section className="section hesabim-only" id="seans-ayar" ref={setRef('seans-ayar')} data-screen-label="Seans ayarları">
                <SecHead eyebrow="seans ayarları" title={<>Görüşme <i>kuralları</i></>} />
                <div className="set-card">{PROFIL.seansAyar.map((r, i) => (
                  <div className="srow" key={i}><div className="sk"><b>{r.k}</b>{r.s && <span>{r.s}</span>}</div><div className="sv"><span className="val">{r.v}</span><span className="chev">›</span></div></div>
                ))}</div>
              </section>

              {/* 05 Bildirim & SMS (hesabim-only) — gerçek /api/settings */}
              <section className="section hesabim-only" id="bildirim" ref={setRef('bildirim')} data-screen-label="Bildirim & SMS">
                <SecHead eyebrow="bildirim & sms" title={<>SMS <i>ayarları</i></>} edit={false} />
                <div className="set-card">
                  <div className="srow col">
                    <div className="sk"><b>SMS Netgsm Webhook URL</b><span>Boşsa SMS gönderilmez, kuyruğa yazılır</span></div>
                    <input className="s-input" type="url" placeholder="https://…/sms"
                      value={cfg.smsWebhookUrl}
                      onChange={(e) => setCfg((c) => ({ ...c, smsWebhookUrl: e.target.value }))}
                      onBlur={(e) => saveCfg('smsWebhookUrl', e.target.value)} />
                  </div>
                </div>
              </section>

              {/* 06 Takvim & Veri (hesabim-only) */}
              <section className="section hesabim-only" id="veri" ref={setRef('veri')} data-screen-label="Takvim & Veri">
                <SecHead eyebrow="takvim & veri" title={<>Senkron ve <i>gizlilik</i></>} edit={false} />
                <div className="set-card">{PROFIL.veri.map((r, i) => {
                  const isExport = /Dışa aktarma/i.test(r.k);
                  return (
                    <div className={`srow${isExport ? ' clickable' : ''}`} key={i}
                      {...(isExport ? { role: 'button', tabIndex: 0, onClick: () => onExportData?.() } : {})}>
                      <div className="sk"><b>{r.k}</b><span>{r.s}</span></div>
                      <div className="sv">{r.state && <span className={`pill-state ${r.ok ? 'ok' : 'warn'}`}>{r.state}</span>}{r.chev && <span className="chev">›</span>}</div>
                    </div>
                  );
                })}</div>

                {/* İletim raporu — Gmail IMAP (gerçek /api/settings) */}
                <div className="set-sub">İletim raporu · Gmail IMAP</div>
                <div className="set-card">
                  <div className="srow col">
                    <div className="sk"><b>Gmail adresi</b><span>SMS iletim raporlarını çekmek için</span></div>
                    <input className="s-input" type="email" placeholder="klinik@gmail.com"
                      value={cfg.gmailUser}
                      onChange={(e) => setCfg((c) => ({ ...c, gmailUser: e.target.value }))}
                      onBlur={(e) => saveCfg('gmailUser', e.target.value)} />
                  </div>
                  <div className="srow col">
                    <div className="sk"><b>Uygulama şifresi</b><span>2FA etkinken Google Hesap → Uygulama Şifreleri</span></div>
                    <input className="s-input" type="password" autoComplete="new-password" placeholder="xxxx xxxx xxxx xxxx"
                      value={cfg.gmailAppPassword}
                      onChange={(e) => setCfg((c) => ({ ...c, gmailAppPassword: e.target.value }))}
                      onBlur={(e) => saveCfg('gmailAppPassword', e.target.value)} />
                  </div>
                  <div className="srow col">
                    <div className="sk"><b>IMAP sunucusu</b></div>
                    <input className="s-input" placeholder="imap.gmail.com"
                      value={cfg.gmailImapHost}
                      onChange={(e) => setCfg((c) => ({ ...c, gmailImapHost: e.target.value }))}
                      onBlur={(e) => saveCfg('gmailImapHost', e.target.value)} />
                  </div>
                  <div className="srow col">
                    <div className="sk"><b>IMAP port</b></div>
                    <input className="s-input" type="number" placeholder="993"
                      value={cfg.gmailImapPort}
                      onChange={(e) => setCfg((c) => ({ ...c, gmailImapPort: e.target.value }))}
                      onBlur={(e) => saveCfg('gmailImapPort', e.target.value)} />
                  </div>
                  <div className="set-note">Şifre bu cihazda saklanır, dışarıya iletilmez.</div>
                </div>
              </section>

              {/* 07 Yılın özeti (matris) */}
              <section className="section matrix" id="yil" ref={setRef('yil')} data-screen-label="Yılın özeti">
                <div className="sec-head"><div className="l"><span className="eyebrow">yılın özeti · 2026</span><h2 className="sec-title">Gelişim &amp; <i>öz-bakım</i></h2></div></div>
                <div className="ysum">{PROFIL.yil.cards.map((c, i) => (
                  <div className="ycard" key={i}><div className="v num">{c.v}</div><div className="l">{c.l}</div></div>
                ))}</div>
                <p className="yquote">“{PROFIL.yil.quote}”</p>
              </section>

              {/* 08 İyilik hali grafiği (hesabim-only) — Ana Sayfa check-in skorları */}
              <section className="section hesabim-only" id="iyilik" ref={setRef('iyilik')} data-screen-label="İyilik hali">
                <SecHead eyebrow="kendi iyilik halin" title={<>İyilik hali <i>seyri</i></>} edit={false} />
                <div className="wbp-card">
                  {wbChart.n === 0 ? (
                    <p className="wbp-empty">Henüz iyilik hali kaydı yok. Ana Sayfa’daki “Kendi iyilik halini izle” bölümünden günlük puanını gir; seyri burada grafikte görürsün.</p>
                  ) : (
                    <>
                      <div className="wbp-top">
                        <div className="wbp-stat"><span className="wbp-lbl">son puan</span><span className="wbp-big num">{wbChart.last}<em>/10</em></span></div>
                        <div className="wbp-stat"><span className="wbp-lbl">ortalama</span><span className="wbp-big num">{wbChart.avg}<em>/10</em></span></div>
                        <div className="wbp-stat"><span className="wbp-lbl">kayıt</span><span className="wbp-big num">{wbChart.n}</span></div>
                      </div>
                      <svg className="wbp-svg" viewBox={`0 0 ${wbChart.W} ${wbChart.H}`} preserveAspectRatio="none" role="img" aria-label="İyilik hali zaman grafiği">
                        <defs>
                          <linearGradient id="wbpFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--clay)" stopOpacity="0.20" />
                            <stop offset="100%" stopColor="var(--clay)" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        {wbChart.grid.map((g) => (
                          <g key={g.v}>
                            <line className="wbp-grid" x1={wbChart.padL} y1={g.y} x2={wbChart.W - 14} y2={g.y} />
                            <text className="wbp-axis" x={wbChart.padL - 8} y={g.y + 3} textAnchor="end">{g.v}</text>
                          </g>
                        ))}
                        {wbChart.n > 1 && <polygon className="wbp-area" points={wbChart.area} fill="url(#wbpFill)" />}
                        {wbChart.n > 1 && <polyline className="wbp-line" points={wbChart.line} />}
                        {wbChart.pts.map((v, i) => (
                          <circle key={i} className="wbp-dot" cx={wbChart.xAt(i)} cy={wbChart.yAt(v)} r={wbChart.n === 1 ? 4 : 3} />
                        ))}
                      </svg>
                      <p className="wbp-foot">{wbChart.n} kayıt · en eskiden en yeniye · 0 (çok zor) – 10 (çok iyi)</p>
                    </>
                  )}
                </div>
              </section>

              {/* Gelişim Planı (hesabim-only) — takvimden taşındı */}
              <section className="section hesabim-only" id="gelisim" ref={setRef('gelisim')} data-screen-label="Gelişim planı">
                <SecHead eyebrow="kişisel gelişim · eğitim" title={<>Gelişim <i>planı</i></>} edit={false} />
                <div className="set-card">
                  <div className="srow col">
                    <div className="sk"><b>Yeni etkinlik ekle</b><span>Eğitim, süpervizyon, atölye — takvimde randevu oluşturur gibi.</span></div>
                    <div className="gp-form">
                      <input className="s-input" type="text" placeholder="Başlık (örn. ACT İleri Eğitim)" value={gp.title} onChange={(e) => setGp((s) => ({ ...s, title: e.target.value }))} />
                      <input className="s-input gp-sm" type="date" value={gp.date} onChange={(e) => setGp((s) => ({ ...s, date: e.target.value }))} />
                      <input className="s-input gp-sm" type="time" value={gp.time} onChange={(e) => setGp((s) => ({ ...s, time: e.target.value }))} />
                      <input className="s-input gp-sm" type="number" min="15" step="15" placeholder="dk" value={gp.dur} onChange={(e) => setGp((s) => ({ ...s, dur: e.target.value }))} />
                      <button type="button" className="refl-save gp-add" disabled={!gp.title.trim() || !gp.date} onClick={addGelisim}>Ekle</button>
                    </div>
                  </div>
                </div>
                {gelisimEvents.length > 0 ? (
                  <div className="gp-list">
                    {[...gelisimEvents].sort((a, b) => String(a.date).localeCompare(String(b.date))).map((ev) => (
                      <div className={`gp-row${ev.done ? ' done' : ''}`} key={ev.id}>
                        <span className="gp-date num">{fmtReflDate(ev.date)}</span>
                        <span className="gp-title">{ev.title}</span>
                        <span className="gp-meta num">{ev.time} · {ev.durationMin} dk</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="refl-empty">Henüz gelişim etkinliği yok.</p>}
              </section>

              {/* 09 Yansıma defteri (hesabim-only) — gerçek /api/reflections */}
              <section className="section hesabim-only" id="yansima" ref={setRef('yansima')} data-screen-label="Yansıma defteri">
                <SecHead eyebrow="yansıma defteri" title={<>Klinik <i>yansımalar</i></>} edit={false} />
                <div className="set-card">
                  <div className="srow col">
                    <div className="sk"><b>Yeni yansıma</b><span>İki bölüm — yalnızca sana görünür.</span></div>
                    <label className="refl-lbl">Fark ettiklerim</label>
                    <textarea
                      className="refl-ta"
                      rows={3}
                      placeholder="Bugün neyi fark ettin? (gözlem, öz-bakım, duygu)"
                      value={draftFark}
                      onChange={(e) => setDraftFark(e.target.value)}
                    />
                    <label className="refl-lbl">Klinik yansımalar</label>
                    <textarea
                      className="refl-ta"
                      rows={3}
                      placeholder="Vaka/süreçle ilgili klinik çıkarımların (eski: insanlarla ilgili çıkarımlarım)"
                      value={draftKlinik}
                      onChange={(e) => setDraftKlinik(e.target.value)}
                    />
                    <div className="refl-actions">
                      <button type="button" className="refl-save" disabled={(!draftFark.trim() && !draftKlinik.trim()) || savingRefl} onClick={saveReflection}>
                        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                        {savingRefl ? 'Kaydediliyor…' : 'Yansımayı kaydet'}
                      </button>
                    </div>
                  </div>
                </div>

                {reflections.length > 0 ? (
                  <div className="refl-list">
                    {reflections.map((r, i) => (
                      <article className="refl-card" key={r.id ?? i}>
                        <div className="refl-meta">
                          <span className="refl-date">{fmtReflDate(r.created_at)}</span>
                          {r.meta && <span className="refl-tag">{r.meta}</span>}
                        </div>
                        <p className="refl-body">{r.body}{r.accent_word && <em> {r.accent_word}</em>}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="refl-empty">Henüz yansıma notu yok. İlk notunu yukarıdan ekleyebilirsin.</p>
                )}
              </section>

              {/* Bilgilendirme kitapçıkları (hesabim-only) — danışana tek tıkla gönder */}
              <section className="section hesabim-only" id="kitapcik" ref={setRef('kitapcik')} data-screen-label="Bilgilendirme kitapçıkları">
                <SecHead eyebrow="psikoeğitim · paylaşım" title={<>Bilgilendirme <i>kitapçıkları</i></>} edit={false} />
                <div className="bk-list">
                  {BOOKLETS.map((b) => {
                    const open = openBooklet === b.id;
                    return (
                      <article className={`bk-card${open ? ' open' : ''}`} key={b.id}>
                        <div className="bk-head">
                          <div className="bk-meta"><b>{b.title}</b><span>{b.desc}</span></div>
                          <div className="bk-actions">
                            <button className="bk-btn ghost" type="button" onClick={() => setOpenBooklet(open ? null : b.id)}>{open ? 'Kapat' : 'Önizle'}</button>
                            <button className="bk-btn solid" type="button" onClick={() => onShareBooklet?.({ title: b.title, body: b.body })}>Danışana gönder</button>
                          </div>
                        </div>
                        {open && <p className="bk-body">{b.body}</p>}
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* 09 Eğitim & akademik */}
              <section className="section" id="egitim" ref={setRef('egitim')} data-screen-label="Eğitim & akademik geçmiş">
                <SecHead eyebrow="eğitim & akademik geçmiş" title={<>Eğitim <i>geçmişi</i></>} />
                <div className="edu-acc">{PROFIL.akademik.map((a, i) => (
                  <div className="educ" key={i}><div className="lvl">{a.lvl}</div><h3>{a.h}</h3><span>{a.k}</span></div>
                ))}</div>
                {PROFIL.egitim.map((g, i) => (
                  <div className="edu-grp" key={i}>
                    <div className="gh">{g.grp}<span className="ln" /></div>
                    {g.items.map((it, j) => (
                      <div className="eline" key={j}><span className="yr">{it.yr}</span><div className="ti">{it.ti}<span>{it.by}</span></div></div>
                    ))}
                  </div>
                ))}
              </section>

              {/* 09 Onam & Süpervizyon (hesabim-only) */}
              <section className="section hesabim-only" id="onam" ref={setRef('onam')} data-screen-label="Onam & Süpervizyon">
                <SecHead eyebrow="onam & süpervizyon" title={<>Belge ve <i>denetim</i></>} />
                <div className="twocol">
                  <div className="minicard"><span className="eyebrow">Onam formları</span><div className="mlist">{PROFIL.onam.map((o, i) => (
                    <div className="mli" key={i}><div><b>{o.b}</b><span>{o.s}</span></div><span className={`pill-state ${o.ok ? 'ok' : 'warn'}`}>{o.state}</span></div>
                  ))}</div></div>
                  <div className="minicard"><span className="eyebrow">Süpervizyon</span><div className="mlist">{PROFIL.supervizyon.map((o, i) => (
                    <div className="mli" key={i}><div><b>{o.b}</b><span>{o.s}</span></div><span className="chev" style={{ color: 'var(--accent-gray)', fontSize: 18 }}>›</span></div>
                  ))}</div></div>
                </div>
              </section>

              {/* 10 Çalışma prensipleri */}
              <section className="section" id="prensipler" ref={setRef('prensipler')} data-screen-label="Çalışma prensipleri">
                <SecHead eyebrow="çalışma prensipleri" title={<>Çalışma <i>prensipleri</i></>} />
                <div className="princ">{PROFIL.prensipler.map((p, i) => (
                  <div className="pcard" key={i}><span className="n">{String(i + 1).padStart(2, '0')}</span><div className="pt"><b>{p.b}</b><p>{p.p}</p></div></div>
                ))}</div>
              </section>

            </main>
          </div>{/* /modal-body */}

          <nav className="railnav" aria-label="Bölümler">
            {railItems.map((it) => (
              <a key={it.id} className={`rn-item${activeRail === it.id ? ' active' : ''}`} href={`#${it.id}`} onClick={(e) => { e.preventDefault(); scrollTo(it.id); }}>
                <span className="rn-label">{it.l}</span><span className="rn-tick" />
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
