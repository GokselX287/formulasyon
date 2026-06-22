'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './TerapistProfilV2.css';

// ──────────────────────────────────────────────────────────────────────────
// Terapist Profili — yeni tasarım (Göksel Akkaya · Calmie premium).
// Üstte paylaşılan menü (kayan glider — her sayfayla birebir) KORUNUR; gövde
// yeni tasarımla birebir değiştirildi: hero + portre + profil bölümü kutucukları
// (açılır paneller) + CV Üret modalı. İyilik hali canlı check-in verisiyle
// beslenir; onam paylaşımı / dışa aktarma mevcut sisteme bağlıdır.
// ──────────────────────────────────────────────────────────────────────────

export type TerapistSettings = {
  therapistName: string;
  therapistTitle: string;
  therapistAbout: string;
  therapistLocation: string;
  therapistEmail: string;
  therapistPhone: string;
  therapistSchools: string;
  smsWebhookUrl: string;
  netgsmUser: string;
  netgsmPassword: string;
  netgsmHeader: string;
  smsAutoAppointmentReminder: boolean;
  smsDayOfReminder: boolean;
  noShowTracking: boolean;
  smsAutoWorkshopSignup: boolean;
  gmailUser: string;
  gmailAppPassword: string;
  gmailImapHost: string;
  gmailImapPort: number;
};

export type ConsentTemplate = { id: string; glyph: string; title: string; sub: string; badge?: string };
export type ConsentShare = { name: string; at: string; status: string };

export type TerapistProfilV2Props = {
  onBack?(): void;
  onNav?(target: string): void;
  onEditProfile?(): void;
  onShareConsent?(templateId?: string): void;
  onShowQr?(templateId?: string): void;
  settings?: Partial<TerapistSettings>;
  onUpdateSetting?(patch: Partial<TerapistSettings>): void;
  onExportData?(): void;
  onShareBooklet?(booklet: { title: string; body: string }): void;
  gelisimEvents?: { id: string; title: string; date: string; time: string; durationMin: number; done?: boolean }[];
  onAddGelisim?(ev: { title: string; date: string; time: string; durationMin: number }): void;
  templates?: ConsentTemplate[];
  recentShares?: ConsentShare[];
};

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
  { label: 'Profil', target: 'terapist', active: true },
  { label: 'Ayarlar', target: 'ayarlar' },
];

/* ---------- Sabit veriler ---------- */

const SECTIONS = [
  { key: 'pratik', glyph: '▦', label: 'Pratik' },
  { key: 'iyilik', glyph: '♥', label: 'Duygusal\nHaritan' },
  { key: 'uzmanlik', glyph: '◈', label: 'Eğitim\ngeçmişi' },
  { key: 'gelisim', glyph: '✦', label: 'Gelişim &\nbeceriler' },
  { key: 'hesap', glyph: '⚙', label: 'Hesap' },
  { key: 'onam', glyph: '✎', label: 'Onam\nformu' },
];

const BDT_TRAININGS: [string, string][] = [
  ['Klinik Değerlendirme Eğitimi', '2020'],
  ['Teorik Eğitim', '2020'],
  ['Beceri Geliştirme Programı', '2021'],
  ['Süpervizyon · 90 saat, 6 vaka', '2021'],
  ['Süpervizyon · 90 saat, 3 vaka', '2022–23'],
  ['Çocuk ve Ergenlerde BDT Uygulamaları', '2023–24'],
  ['İleri Teorik Eğitim · 2. Modül', '2023–24'],
  ['Süpervizyon · 70 saat, 4 vaka', '2024'],
];

const ACT_TRAININGS: [string, string, string][] = [
  ['Teorik Eğitim', 'Prof. Dr. Fatih Yavuz · Bağlamsal Bilimler Derneği (TÜRBAD), Ankara', '2024–25'],
  ['Teorik Eğitim', 'Dr. İbrahim Bilgen · ACT Türkiye, İstanbul', '2025'],
];

const CERTIFICATES: [string, string][] = [
  ['EABCT · Akredite BDT Terapisti', 'European Association of Behavioural and Cognitive Therapies · 2025'],
  ['Hipnoterapi Uygulayıcı Sertifikası', 'Cinsel Sağlık Enstitüsü Derneği (CİSED) · 2019'],
  ['Onaylı Psikometrik Test Uygulayıcılığı', 'WISC-R, Raven, Catell 2-A, AGTE ve diğerleri · 2019'],
];

const SKILLS = [
  'BDT / ACT', 'Topluluk önünde konuşma', 'Esneklik & çatışma çözümü',
  'Gözlem & değerlendirme', 'Kişilerarası beceriler', 'Aktif dinleme & duygusal zeka',
  'İkna edici iletişim', 'Eleştirel & analitik düşünme',
];

const CV_ITEMS: [string, string, string, string][] = [
  ['kisisel', '◉', 'Kişisel bilgiler', 'Ad, unvan ve profil fotoğrafı'],
  ['hakkimda', '❝', 'Hakkımda', 'Profil özeti ve yaklaşım metni'],
  ['uzmanlik', '◈', 'Uzmanlık alanları', 'Anksiyete, depresyon, travma, yas'],
  ['egitim', '◇', 'Eğitim & sertifikalar', 'Lisans, yüksek lisans ve EMDR'],
  ['deneyim', '▤', 'Deneyim', 'Çalışılan kurumlar ve yıllar'],
  ['istatistik', '▦', 'Seans istatistikleri', '540 seans · 28 aktif danışan'],
  ['diller', '◎', 'Diller', 'Türkçe · İngilizce'],
  ['supervizyon', '↻', 'Süpervizyon & gelişim', 'Süpervizyon geçmişi ve eğitim saatleri'],
  ['iletisim', '✉', 'İletişim', 'E-posta, telefon ve randevu linki'],
];

const CONSENT_TEMPLATES: ConsentTemplate[] = [
  { id: 'psikoterapi', glyph: '✎', title: 'Psikoterapi onam formu', sub: 'Bireysel seans · KVKK aydınlatma metni dahil', badge: 'Varsayılan' },
  { id: 'online', glyph: '⛁', title: 'Online görüşme onam formu', sub: 'Video seans · gizlilik koşulları dahil' },
  { id: 'resit-degil', glyph: '♁', title: 'Reşit olmayan danışan onam formu', sub: 'Ebeveyn/vasi onayı gerektirir' },
];

const RECENT_SHARES: ConsentShare[] = [
  { name: 'E. Demir · Psikoterapi onam formu', at: '14 Haz, 21:08', status: 'İmzalandı' },
  { name: 'M. Yılmaz · Online görüşme onam formu', at: '13 Haz, 16:42', status: 'Bekliyor' },
];

/* İyilik hali — canlı veri yokken görünecek varsayılan seyir (yükseklik %). */
const MOCK_WB = [50, 60, 40, 70, 60, 80, 50, 70, 90, 60, 70, 80, 60, 70];

/* ---------- CV içeriği (yazdırılabilir belge) ---------- */

const CV_ABOUT =
  'Profesyonel misyonum; dayanıklılığı güçlendiren, yaşam kalitesini artıran ve hem bireysel gelişime hem de kurumsal sağlığa katkı sunan kanıta dayalı müdahaleleri ileriye taşımak. Psikoloji ve örgütsel çalışmalar alanındaki birikimimi birleştirerek, klinik pratiğin ötesine geçen; ruh sağlığı, işyeri iyi oluşu ve örgütsel dinamiklerin kesişimini keşfeden bir bakış açısı sunuyorum.';
const CV_ACADEMIC: [string, string, string, string][] = [
  ['Yüksek lisans', 'Yönetim ve Organizasyon, MBA (İng.)', 'Marmara Üniversitesi', '2016 – 2017'],
  ['Lisans', 'Rehberlik ve Psikolojik Danışmanlık (İng.)', 'Orta Doğu Teknik Üniversitesi (ODTÜ)', '2011 – 2016'],
];
const CV_UZMANLIK = ['Anksiyete', 'Depresyon', 'İlişki sorunları', 'Travma', 'Yas'];
const CV_EKOLLER = 'BDT · ACT · MKT (Üstbilişsel) · DBT · MBCT · Şema Terapi';
const CV_STATS: [string, string][] = [
  ['Toplam seans', '540'],
  ['Aktif danışan', '28'],
  ['Bu yıl seans', '412'],
  ['Danışan başına ort.', '≈ 19 seans'],
];
const CV_CONTACT: [string, string][] = [
  ['E-posta', 'akkayagoksel8@gmail.com'],
  ['Konum', 'Tekirdağ'],
  ['Randevu', 'elegantpsikoloji.com'],
];

function cvEsc(s: string) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
}
function cvRow(title: string, meta: string, yr: string) {
  return `<div class="r"><div class="rt"><span>${cvEsc(title)}</span>${meta ? `<small>${cvEsc(meta)}</small>` : ''}</div>${yr ? `<span class="ry">${cvEsc(yr)}</span>` : ''}</div>`;
}

function buildCvHtml(cv: Record<string, boolean>, photo: string | null) {
  const chips = (arr: string[]) => `<div class="chips">${arr.map((t) => `<span class="c">${cvEsc(t)}</span>`).join('')}</div>`;
  const sec: string[] = [];

  if (cv.hakkimda) sec.push(`<section><h2>Hakkımda</h2><p class="lead">${cvEsc(CV_ABOUT)}</p></section>`);

  if (cv.uzmanlik) sec.push(`<section><h2>Uzmanlık alanları</h2>${chips(CV_UZMANLIK)}<p class="ek"><b>Çalışılan ekoller:</b> ${cvEsc(CV_EKOLLER)}</p></section>`);

  if (cv.egitim) sec.push(`<section><h2>Eğitim &amp; sertifikalar</h2>
    <h3>Akademik</h3>${CV_ACADEMIC.map(([lvl, h, k, yr]) => cvRow(h, `${lvl} · ${k}`, yr)).join('')}
    <h3>BDT — Bilişsel Davranışçı Terapi</h3><p class="src">Bilişsel Davranışçı Psikoterapiler Derneği — Prof. Dr. M. Hakan Türkçapar</p>${BDT_TRAININGS.map(([n, y]) => cvRow(n, '', y)).join('')}
    <h3>ACT — Kabul ve Kararlılık Terapisi</h3>${ACT_TRAININGS.map(([n, by, y]) => cvRow(n, by, y)).join('')}
    <h3>Sertifikalar</h3>${CERTIFICATES.map(([t, s]) => cvRow(t, s, '')).join('')}</section>`);

  if (cv.deneyim) sec.push(`<section><h2>Deneyim</h2><div class="kpi">${[['5.000+', 'Bireysel görüşme'], ['700+', 'Akredite eğitim saati'], ['300+', 'Süpervizyon saati']].map(([v, k]) => `<div><b>${v}</b><span>${cvEsc(k)}</span></div>`).join('')}</div></section>`);

  if (cv.istatistik) sec.push(`<section><h2>Seans istatistikleri</h2><div class="kpi">${CV_STATS.map(([k, v]) => `<div><b>${cvEsc(v)}</b><span>${cvEsc(k)}</span></div>`).join('')}</div></section>`);

  if (cv.diller) sec.push(`<section><h2>Diller</h2><p>Türkçe · İngilizce</p></section>`);

  if (cv.supervizyon) sec.push(`<section><h2>Süpervizyon &amp; gelişim</h2><p class="lead">300+ süpervizyon saati · ${SKILLS.length} beceri seti.</p>${BDT_TRAININGS.filter(([n]) => /Süpervizyon/i.test(n)).map(([n, y]) => cvRow(n, '', y)).join('')}<div class="chips" style="margin-top:8px">${SKILLS.map((t) => `<span class="c">${cvEsc(t)}</span>`).join('')}</div></section>`);

  if (cv.iletisim) sec.push(`<section><h2>İletişim</h2><div class="cts">${CV_CONTACT.map(([k, v]) => `<div><span class="ck">${cvEsc(k)}</span><span class="cvv">${cvEsc(v)}</span></div>`).join('')}</div></section>`);

  const idDetails = cv.kisisel
    ? `<p class="sub">Psikolojik Danışman &amp; EABCT Akredite Terapist</p><p class="meta">Tekirdağ · BDT · ACT · Metakognitif</p>`
    : '';

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Göksel Akkaya — CV</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 16mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #100F0D; font-size: 11px; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .hd { display: flex; align-items: center; gap: 18px; padding-bottom: 16px; margin-bottom: 18px; border-bottom: 2px solid #100F0D; }
  .hd .ph { width: 72px; height: 72px; border-radius: 14px; object-fit: cover; flex: none; }
  .hd h1 { font-size: 26px; font-weight: 700; letter-spacing: -.02em; }
  .hd .sub { font-size: 12.5px; color: #56544D; margin-top: 3px; font-weight: 600; }
  .hd .meta { font-size: 11px; color: #8B887E; margin-top: 2px; }
  section { margin-bottom: 16px; break-inside: avoid; }
  h2 { font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #8B887E; margin-bottom: 9px; padding-bottom: 5px; border-bottom: 1px solid rgba(16,15,13,.13); }
  h3 { font-size: 11.5px; font-weight: 700; color: #100F0D; margin: 12px 0 6px; }
  h3:first-of-type { margin-top: 2px; }
  p.lead { color: #56544D; }
  p.ek { margin-top: 8px; color: #56544D; }
  p.src { color: #8B887E; font-size: 10px; margin-bottom: 6px; }
  .r { display: flex; align-items: baseline; gap: 12px; padding: 5px 0; border-bottom: 1px solid rgba(16,15,13,.07); }
  .r:last-child { border-bottom: none; }
  .rt { flex: 1; min-width: 0; }
  .rt span { font-weight: 600; }
  .rt small { display: block; color: #8B887E; font-size: 10px; font-weight: 400; margin-top: 1px; }
  .ry { flex: none; font-size: 10px; font-weight: 600; color: #56544D; background: #F1EFE9; border-radius: 999px; padding: 2px 9px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chips .c { font-size: 10.5px; font-weight: 600; color: #56544D; background: #F4F1E9; border: 1px solid rgba(16,15,13,.1); border-radius: 999px; padding: 3px 11px; }
  .kpi { display: flex; gap: 22px; }
  .kpi div { display: flex; flex-direction: column; }
  .kpi b { font-size: 22px; font-weight: 700; letter-spacing: -.02em; }
  .kpi span { font-size: 10px; color: #8B887E; }
  .cts { display: flex; flex-wrap: wrap; gap: 8px 30px; }
  .cts div { display: flex; flex-direction: column; }
  .ck { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #8B887E; }
  .cvv { font-size: 12px; font-weight: 600; }
  footer { margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(16,15,13,.13); font-size: 9px; color: #B9B6AD; }
</style></head>
<body>
  <header class="hd">${photo ? `<img class="ph" src="${photo}" alt="">` : ''}<div><h1>Göksel Akkaya</h1>${idDetails}</div></header>
  ${sec.join('\n')}
  <footer>Calmie · ${'Terapist CV'} — yazdırma tarihinde oluşturuldu.</footer>
</body></html>`;
}

/* ---------- Stil yardımcıları ---------- */

const GLOSS_WHITE =
  'radial-gradient(135% 110% at 22% -10%, #ffffff 0%, #ffffff 32%, #f4f5f7 62%, #e7e9ee 100%)';
const TILE_SHADOW =
  'inset 0 2px 1px rgba(255,255,255,0.95), inset 0 -16px 30px -14px rgba(20,24,33,0.10), inset 0 1px 0 rgba(255,255,255,1), 0 18px 30px -16px rgba(20,24,33,0.30), 0 2px 6px rgba(20,24,33,0.06)';
const CARD_SHADOW = '0 1px 2px rgba(0,0,0,0.04)';
const SUB_LABEL: CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#9a9a9a',
};
const SECTION_LABEL: CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#9a9a9a',
};
const CHIP: CSSProperties = {
  fontSize: 12.5, fontWeight: 500, color: '#555555',
  background: '#f0f0f0', borderRadius: 999, padding: '5px 12px',
};
const PANEL: CSSProperties = { background: '#f0f0f0', borderRadius: 26, padding: '24px 26px' };
const WHITE_CARD: CSSProperties = {
  background: '#fff', borderRadius: 16, padding: '18px 20px',
  marginTop: 16, boxShadow: CARD_SHADOW,
};

function CameraIcon({ size = 13, stroke = '#fff' }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function TerapistProfilV2(props: TerapistProfilV2Props) {
  const {
    onBack, onNav, onEditProfile, onExportData,
    settings = {},
    templates = CONSENT_TEMPLATES,
    recentShares = RECENT_SHARES,
    onShareConsent = (id) => console.log('paylaş:', id),
    onShowQr = (id) => console.log('QR:', id),
  } = props;
  // Düzenlenebilir profil alanları — settings'ten okunur; boşsa varsayılan içerik gösterilir.
  const profName = (settings.therapistName ?? '').trim() || 'Göksel Akkaya';
  const profFirst = profName.split(/\s+/).filter(Boolean)[0] || profName;
  const profTitle = (settings.therapistTitle ?? '').trim() || 'Psikolojik Danışman & Terapist';
  const profAbout = (settings.therapistAbout ?? '').trim() || CV_ABOUT;
  const profSchools = (settings.therapistSchools ?? '').trim() || CV_EKOLLER;
  const profLoc = (settings.therapistLocation ?? '').trim();
  const initials = profName.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'GA';

  const [open, setOpen] = useState<string | null>(null); // tek açık bölüm
  const [cvOpen, setCvOpen] = useState(false);
  const [cv, setCv] = useState<Record<string, boolean>>({
    kisisel: true, hakkimda: true, uzmanlik: true, egitim: true,
    deneyim: false, istatistik: true, diller: true, supervizyon: false, iletisim: true,
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { const p = localStorage.getItem('tp-profile-photo'); if (p) setPhoto(p); } catch {}
  }, []);

  // canlı iyilik hali (check-in skorları 0–10)
  const [checkins, setCheckins] = useState<number[]>([]);
  useEffect(() => {
    fetch('/api/reflections?type=check-in&limit=60')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: any[]) => {
        const pts = (Array.isArray(d) ? d : [])
          .filter((x) => x && x.score != null && !Number.isNaN(Number(x.score)))
          .map((x) => Number(x.score)).reverse();
        setCheckins(pts);
      })
      .catch(() => {});
  }, []);
  const wbBars = checkins.slice(-14);
  const wbLast = wbBars.length ? wbBars[wbBars.length - 1] : null;
  const wbAvg = checkins.length ? Math.round((checkins.reduce((a, b) => a + b, 0) / checkins.length) * 10) / 10 : null;
  // çizimde kullanılacak yükseklik dizisi (% 0–100); veri yoksa varsayılan seyir
  const barsPct = wbBars.length ? wbBars.map((v) => Math.round((v / 10) * 100)) : MOCK_WB;
  const scoreShown = wbLast ?? 7;
  const avgShown = wbAvg ?? 6.6;

  const toggle = (k: string) => setOpen((cur) => (cur === k ? null : k));
  const togCv = (k: string) => setCv((c) => ({ ...c, [k]: !c[k] }));
  const cvCount = Object.values(cv).filter(Boolean).length;

  // CV üret → seçili bölümlerden yazdırılabilir belge aç (window.print → "PDF olarak kaydet")
  const generateCv = () => {
    const w = window.open('', '_blank', 'width=860,height=1040');
    if (!w) { try { alert('CV için açılır pencere engellendi. Lütfen bu site için açılır pencerelere izin verin.'); } catch {} return; }
    w.document.open();
    w.document.write(buildCvHtml(cv, photo));
    w.document.close();
    w.focus();
    let printed = false;
    const go = () => { if (printed) return; printed = true; try { w.print(); } catch {} };
    w.onload = () => window.setTimeout(go, 300); // foto/font yüklensin
    window.setTimeout(go, 900); // onload tetiklenmezse yedek
  };

  const pickPhoto = () => fileRef.current && fileRef.current.click();
  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const v = typeof reader.result === 'string' ? reader.result : null;
      setPhoto(v);
      try { if (v) localStorage.setItem('tp-profile-photo', v); } catch {}
    };
    reader.readAsDataURL(f);
  };

  // üst menü glider (Ana Sayfa ile aynı)
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

  return (
    <div className="tp2">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap" rel="stylesheet" />

      <header className="page-menu">
        <span className="pm-brand"><b>Calmie</b><i>.</i></span>
        <nav className="pm-nav" aria-label="Sayfa menüsü" ref={menuRef} onMouseLeave={() => moveGlider(activeLink())}>
          <span className="pm-glider" ref={gliderRef} aria-hidden="true" />
          {DOCK.map((d) => (
            <a key={d.target} href="#" className={d.active ? 'active' : ''} onMouseEnter={(e) => moveGlider(e.currentTarget)}
              onClick={(e) => { e.preventDefault(); if (!d.active) onNav?.(d.target); }}>{d.label}</a>
          ))}
        </nav>
        <div className="pm-right">
          <span className="pm-pro">Pro</span>
          <button className="pm-av" type="button" onClick={() => onEditProfile?.()} aria-label="Profili düzenle">{photo ? <img alt="" src={photo} /> : <span>{initials}</span>}</button>
        </div>
      </header>

      <div className="scroll">
        {/* ARKA PLAN SAYDAM — .tp2 mesh zemini görünür. */}
        <div style={{
          width: '100%', display: 'flex', justifyContent: 'center',
          padding: '0 16px 60px',
          fontFamily: "'Plus Jakarta Sans', sans-serif", WebkitFontSmoothing: 'antialiased',
        }}>
          <div style={{ width: '100%', maxWidth: 864, display: 'flex', flexDirection: 'column', gap: 9 }}>

            {/* ===== GERİ ===== */}
            <button type="button" onClick={() => onBack?.()} aria-label="Geri dön" style={{
              alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 7,
              background: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              borderRadius: 999, padding: '9px 16px 9px 12px', fontSize: 13, fontWeight: 600, color: '#111',
              boxShadow: '0 10px 22px -14px rgba(20,24,33,0.45), inset 0 1px 0 #fff', marginBottom: 1,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1, color: '#9a9a9a' }}>‹</span> Ana Sayfa
            </button>

            {/* ===== HERO CARD ===== */}
            <div style={{
              position: 'relative', overflow: 'hidden', borderRadius: 26, padding: '10px 26px 12px',
              background: GLOSS_WHITE,
              boxShadow: 'inset 0 2px 1px rgba(255,255,255,0.95), inset 0 -22px 44px -18px rgba(20,24,33,0.10), inset 0 1px 0 rgba(255,255,255,1), 0 28px 50px -28px rgba(20,24,33,0.34), 0 2px 6px rgba(20,24,33,0.06)',
            }}>
              {/* üst parlama */}
              <span style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '58%',
                borderRadius: '26px 26px 50% 50%/26px 26px 30% 30%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.32) 42%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none', zIndex: 1,
              }} />
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-start', gap: 13, flexWrap: 'wrap' }}>
                <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 7, width: 268, maxWidth: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, background: '#fff', borderRadius: 16, padding: '9px 14px', boxShadow: CARD_SHADOW }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>calmie.</span>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', background: '#111', borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' }}>Pro Plan</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end' }}>
                      {['Sınırsız danışan', 'Online randevu', 'Öncelikli destek'].map((t) => (
                        <span key={t} style={{ fontSize: 10.5, fontWeight: 500, color: '#555', background: '#f0f0f0', borderRadius: 999, padding: '3px 9px' }}>{t}</span>
                      ))}
                    </div>
                    <span style={{ fontSize: 9.5, color: '#9a9a9a' }}>Yenileme · 14 Tem 2026</span>
                  </div>
                  <button type="button" onClick={() => setCvOpen(true)} style={{
                    display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#fff',
                    borderRadius: 16, padding: '9px 14px', boxShadow: CARD_SHADOW,
                  }}>
                    <span style={{ flex: 'none', width: 34, height: 34, borderRadius: 10, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15 }}>↧</span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111', letterSpacing: '-0.2px' }}>CV Üret</span>
                      <span style={{ fontSize: 10.5, color: '#9a9a9a' }}>Bölümleri seç · PDF indir</span>
                    </span>
                    <span style={{ flex: 'none', fontSize: 14, color: '#111' }}>→</span>
                  </button>
                </div>
              </div>
              <h1 style={{ position: 'relative', zIndex: 2, margin: '7px 0 0', fontSize: 24, lineHeight: 1.14, fontWeight: 400, color: '#0a0a0a', letterSpacing: '-0.6px' }}>
                Merhaba, ben {profFirst}:<br />{profTitle}
              </h1>
              <p style={{ position: 'relative', zIndex: 2, margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, fontWeight: 400, color: '#2a2a2a', maxWidth: 430, whiteSpace: 'pre-wrap' }}>
                {profAbout}
              </p>
            </div>

            {/* ===== PORTRE KARTI ===== */}
            <div style={{ background: 'linear-gradient(155deg, #dcdcdc 0%, #cfcfcf 55%, #c4c4c4 100%)', borderRadius: 26, padding: '42px 34px 50px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 36px 72px -26px rgba(17,17,17,0.5)', maxWidth: 780, margin: '0 auto' }}>
                {/* SOL: foto */}
                <div style={{ flex: 1.32, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button type="button" onClick={pickPhoto} title="Profil fotoğrafını değiştir" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#111', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 8, padding: '5px 9px', boxShadow: '0 1px 2px rgba(0,0,0,0.18)' }}>
                      <CameraIcon />
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: '#fff' }}>Değiştir</span>
                    </button>
                  </div>
                  <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', flex: 1, background: '#ececec', minHeight: 330 }}>
                    {photo ? (
                      <img src={photo} alt="Profil fotoğrafı" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <button type="button" onClick={pickPhoto} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'transparent' }}>
                        <span style={{ width: 44, height: 44, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CameraIcon size={19} />
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#6b6b6b' }}>Profil fotoğrafı ekle</span>
                      </button>
                    )}
                    <input type="file" accept="image/*" ref={fileRef} onChange={onPhoto} style={{ display: 'none' }} />
                  </div>
                </div>
                {/* SAĞ: profil paneli */}
                <div style={{ flex: 1, borderLeft: '1px solid #e8e8e8', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
                    <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#111' }}>Göksel Akkaya</span>
                        <span style={{ fontSize: 9.5, color: '#8c8c8c', lineHeight: 1.35 }}>Psikolojik Danışman &amp; EABCT Akredite Terapist</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 9.5, lineHeight: 1.65, color: '#8c8c8c' }}>
                        Çalışılan ekoller: BDT (Bilişsel Davranışçı Terapi), ACT (Kabul ve Kararlılık Terapisi),
                        MKT (Üstbilişsel Terapi), DBT, MBCT ve Şema Terapi yaklaşımları.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {/* Seans / Danışan */}
                    <div style={{ position: 'relative', borderRadius: 9, background: '#f0f0f0', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.07)', padding: 12, height: 160, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8c8c8c' }}>Seans / Danışan</span>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                          <span style={{ fontSize: 26, fontWeight: 600, color: '#111', letterSpacing: '-0.03em', lineHeight: 1 }}>540</span>
                          <span style={{ fontSize: 8.5, color: '#8c8c8c' }}>Toplam seans</span>
                        </div>
                        <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(0,0,0,0.1)' }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                          <span style={{ fontSize: 26, fontWeight: 600, color: '#111', letterSpacing: '-0.03em', lineHeight: 1 }}>28</span>
                          <span style={{ fontSize: 8.5, color: '#8c8c8c' }}>Aktif danışan</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 2 }}>
                        <span style={{ flex: 95, background: '#111', borderRadius: 3 }} />
                        <span style={{ flex: 5, background: '#cfcfcf', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 9, color: '#777' }}>Aktif danışan başına ≈ 19 seans</span>
                    </div>
                    {/* İyilik Hali */}
                    <div style={{ position: 'relative', borderRadius: 9, overflow: 'hidden', background: '#111', padding: '11px 12px', height: 160, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>İyilik Hali</span>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.42)' }}>14 gün</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 30, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{scoreShown}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>/ 10</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 38 }}>
                        {barsPct.map((h, i, a) => (
                          <span key={i} style={{ flex: 1, borderRadius: 2, height: `${h}%`, background: i === a.length - 1 ? '#fff' : 'rgba(255,255,255,0.22)' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== PROFIL BÖLÜMLERİ (kutucuklar) ===== */}
            <div style={{ padding: '16px 6px 8px', textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#111' }}>Profil bölümleri</span>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#111' }}>Bir bölüme dokun, aşağıda açılsın.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 13, marginTop: 18, justifyContent: 'center' }}>
                {SECTIONS.map((s) => (
                  <button key={s.key} type="button" onClick={() => toggle(s.key)} style={{
                    position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 5, width: 74, height: 74,
                    borderRadius: 18, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    letterSpacing: '-0.1px', color: '#0a0a0a', background: GLOSS_WHITE, boxShadow: TILE_SHADOW,
                    transition: 'transform .12s ease, box-shadow .15s ease',
                  }}>
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', borderRadius: '18px 18px 50% 50%/18px 18px 38% 38%', background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0) 100%)', pointerEvents: 'none', zIndex: 1 }} />
                    {open === s.key && (
                      <span style={{ position: 'absolute', inset: 0, borderRadius: 18, boxShadow: 'inset 0 0 0 2px #111', zIndex: 3, pointerEvents: 'none' }} />
                    )}
                    <span style={{ position: 'relative', zIndex: 2, fontSize: 18, lineHeight: 1 }}>{s.glyph}</span>
                    <span style={{ position: 'relative', zIndex: 2, fontSize: s.label.includes('\n') ? 9 : 10, fontWeight: 600, lineHeight: 1.2, textAlign: 'center', whiteSpace: 'pre-line' }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ===== AÇILIR BÖLÜMLER ===== */}

            {/* PRATIK */}
            {open === 'pratik' && (
              <div style={PANEL}>
                <span style={SECTION_LABEL}>Pratik özeti</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 10, marginTop: 16 }}>
                  {([
                    ['Aktif danışan', '28', '3 yeni · bu ay'],
                    ['Bu hafta seans', '17', '9–15 Haziran'],
                    ['Toplam seans', '540', 'tüm zamanlar'],
                    ['Ort. seans ücreti', '₺1.800', 'aktif danışanlar'],
                  ] as [string, string, string][]).map(([l, v, sub]) => (
                    <div key={l} style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', boxShadow: CARD_SHADOW }}>
                      <div style={SUB_LABEL}>{l}</div>
                      <div style={{ fontSize: 28, fontWeight: 600, color: '#111', letterSpacing: '-0.02em', lineHeight: 1, marginTop: 8 }}>{v}</div>
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 6 }}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* IYILIK / DUYGUSAL HARİTAN */}
            {open === 'iyilik' && (
              <div style={PANEL}>
                <span style={SECTION_LABEL}>İyilik hali</span>
                <div style={WHITE_CARD}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 34, fontWeight: 600, color: '#111', letterSpacing: '-0.02em', lineHeight: 1 }}>{scoreShown}</span>
                    <span style={{ fontSize: 13, color: '#8c8c8c' }}>/ 10 · bugünkü check-in</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', margin: '10px 0 14px' }}>Son {barsPct.length} gün seyri · ort. {avgShown}</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 54 }}>
                    {barsPct.map((h, i, a) => (
                      <span key={i} style={{ flex: 1, borderRadius: 4, height: `${h}%`, background: i === a.length - 1 ? '#111' : '#cfcfcf' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* UZMANLIK / EĞİTİM GEÇMİŞİ */}
            {open === 'uzmanlik' && (
              <>
                <div style={PANEL}>
                  <span style={SECTION_LABEL}>Uzmanlık &amp; odak</span>
                  <div style={{ ...WHITE_CARD, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ ...SUB_LABEL, marginBottom: 9 }}>Çalışma alanları</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {['Anksiyete', 'Depresyon', 'İlişki sorunları', 'Travma', 'Yas'].map((t) => (
                          <span key={t} style={CHIP}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ ...SUB_LABEL, marginBottom: 11 }}>Eğitim geçmişi</div>
                      {([
                        ['Marmara Üniversitesi', 'Yönetim ve Organizasyon, MBA (İng.)', '2016 – 2017'],
                        ['Orta Doğu Teknik Üniversitesi (ODTÜ)', 'Rehberlik ve Psikolojik Danışmanlık (İng.)', '2011 – 2016'],
                      ] as [string, string, string][]).map(([uni, dep, yr], i) => (
                        <div key={uni} style={{ display: 'flex', gap: 13, alignItems: 'flex-start', padding: i === 0 ? '0 0 14px' : '14px 0 0', borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>
                          <span style={{ flex: 'none', width: 9, height: 9, borderRadius: '50%', background: '#111', marginTop: 5 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{uni}</div>
                            <div style={{ fontSize: 12.5, color: '#555', marginTop: 2 }}>{dep}</div>
                            <div style={{ fontSize: 11.5, color: '#9a9a9a', marginTop: 3 }}>{yr}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ ...SUB_LABEL, marginBottom: 6 }}>Diller</div>
                      <div style={{ fontSize: 14, color: '#111' }}>Türkçe · İngilizce</div>
                    </div>
                    <div>
                      <div style={{ ...SUB_LABEL, marginBottom: 6 }}>Seans biçimi</div>
                      <div style={{ fontSize: 14, color: '#111' }}>Yüz yüze · Online</div>
                    </div>
                  </div>
                </div>

                {/* Terapi ekolü eğitimleri */}
                <div style={{ ...PANEL, marginTop: 12 }}>
                  <span style={SECTION_LABEL}>Terapi ekolü eğitimleri</span>
                  {/* BDT */}
                  <div style={WHITE_CARD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: '#fff', background: '#111', borderRadius: 8, padding: '5px 11px' }}>BDT</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#111' }}>Bilişsel Davranışçı Terapi</span>
                    </div>
                    <p style={{ margin: '9px 0 0', fontSize: 11.5, lineHeight: 1.5, color: '#9a9a9a' }}>Bilişsel Davranışçı Psikoterapiler Derneği — Prof. Dr. M. Hakan Türkçapar</p>
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
                      {BDT_TRAININGS.map(([name, yr]) => (
                        <div key={name} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '11px 0', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                          <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: '#111', lineHeight: 1.4 }}>{name}</span>
                          <span style={{ flex: 'none', fontSize: 11, fontWeight: 600, color: '#555', background: '#f0f0f0', borderRadius: 999, padding: '3px 9px' }}>{yr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* ACT */}
                  <div style={{ ...WHITE_CARD, marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: '#fff', background: '#111', borderRadius: 8, padding: '5px 11px' }}>ACT</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#111' }}>Kabul ve Kararlılık Terapisi</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
                      {ACT_TRAININGS.map(([name, by, yr]) => (
                        <div key={by} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '12px 0', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, color: '#111', lineHeight: 1.4 }}>{name}</div>
                            <div style={{ fontSize: 11.5, color: '#9a9a9a', marginTop: 3, lineHeight: 1.45 }}>{by}</div>
                          </div>
                          <span style={{ flex: 'none', fontSize: 11, fontWeight: 600, color: '#555', background: '#f0f0f0', borderRadius: 999, padding: '3px 9px' }}>{yr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* GELISIM & BECERILER */}
            {open === 'gelisim' && (
              <div style={PANEL}>
                <span style={SECTION_LABEL}>Gelişim &amp; beceriler</span>
                <div style={{ ...WHITE_CARD, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <div style={{ ...SUB_LABEL, marginBottom: 4 }}>Onaylı sertifikalar</div>
                    {CERTIFICATES.map(([title, sub], i) => (
                      <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: i === 0 ? '13px 0' : (i === CERTIFICATES.length - 1 ? '13px 0 0' : '13px 0'), borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>
                        <span style={{ flex: 'none', width: 22, height: 22, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, marginTop: 1 }}>✓</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{title}</div>
                          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ ...SUB_LABEL, marginBottom: 11 }}>Beceri setleri</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {SKILLS.map((t) => <span key={t} style={CHIP}>{t}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HESAP */}
            {open === 'hesap' && (
              <div style={PANEL}>
                <span style={SECTION_LABEL}>Hesap &amp; tercihler</span>
                <div style={{ background: '#fff', borderRadius: 16, padding: '6px 20px 8px', marginTop: 16, boxShadow: CARD_SHADOW }}>
                  {([
                    ['Profili düzenle', () => onEditProfile?.()],
                    ['Bildirim & SMS', () => onNav?.('ayarlar')],
                    ['Tema', () => onNav?.('ayarlar')],
                    ['Veriyi dışa aktar', () => onExportData?.()],
                  ] as [string, () => void][]).map(([t, fn], i) => (
                    <div key={t} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}>
                      <div style={{ fontSize: 14, color: '#111' }}>{t}</div>
                      <span style={{ marginLeft: 'auto', color: '#9a9a9a' }}>›</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ONAM FORMU PAYLAŞ */}
            {open === 'onam' && (
              <div style={PANEL}>
                <span style={SECTION_LABEL}>Onam formu paylaş</span>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#8c8c8c' }}>Bir form şablonu seç, danışana güvenli bağlantı veya QR ile gönder.</p>
                <div style={{ background: '#fff', borderRadius: 16, padding: '8px 20px', marginTop: 16, boxShadow: CARD_SHADOW }}>
                  {templates.map((t, i) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>
                      <span style={{ flex: 'none', width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#111', background: 'radial-gradient(135% 110% at 22% -10%, #fff 0%, #f4f5f7 60%, #e7e9ee 100%)', boxShadow: 'inset 0 1px 0 #fff, 0 1px 2px rgba(0,0,0,0.06)' }}>{t.glyph}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{t.title}</div>
                        <div style={{ fontSize: 11.5, color: '#9a9a9a', marginTop: 2 }}>{t.sub}</div>
                      </div>
                      {t.badge && <span style={{ flex: 'none', fontSize: 11, fontWeight: 600, color: '#555', background: '#f0f0f0', borderRadius: 999, padding: '4px 10px' }}>{t.badge}</span>}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button type="button" onClick={() => onShareConsent(templates[0] && templates[0].id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 14, padding: 14, color: '#fff', fontSize: 13.5, fontWeight: 600, background: 'radial-gradient(135% 110% at 22% -10%, #3a3a3a 0%, #1a1a1a 55%, #0a0a0a 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 22px -12px rgba(0,0,0,0.5)' }}>
                    <span style={{ fontSize: 15 }}>⤴</span> Bağlantı oluştur &amp; paylaş
                  </button>
                  <button type="button" title="QR kod" onClick={() => onShowQr(templates[0] && templates[0].id)} style={{ flex: 'none', width: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 14, color: '#111', fontSize: 18, background: 'radial-gradient(135% 110% at 22% -10%, #fff 0%, #f4f5f7 60%, #e7e9ee 100%)', boxShadow: 'inset 0 1px 0 #fff, 0 1px 2px rgba(0,0,0,0.06)' }}>▣</button>
                </div>
                <div style={{ ...SUB_LABEL, margin: '20px 0 9px' }}>Son gönderimler</div>
                <div style={{ background: '#fff', borderRadius: 16, padding: '4px 20px', boxShadow: CARD_SHADOW }}>
                  {recentShares.map((r, i) => {
                    const signed = r.status === 'İmzalandı';
                    return (
                      <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.08)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, color: '#111' }}>{r.name}</div>
                          <div style={{ fontSize: 11, color: '#9a9a9a', marginTop: 2 }}>{r.at}</div>
                        </div>
                        <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: signed ? '#1f8a5b' : '#9a7b16', background: signed ? 'rgba(31,138,91,0.1)' : 'rgba(154,123,22,0.1)', borderRadius: 999, padding: '4px 10px' }}>● {r.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== CV ÜRET MODAL ===== */}
      {cvOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, background: 'rgba(16,18,22,0.52)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)' }}>
          <button type="button" onClick={() => setCvOpen(false)} aria-label="Kapat" style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent', cursor: 'default', padding: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 452, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 28, background: 'radial-gradient(135% 88% at 25% -8%, #fff 0%, #fff 42%, #f4f5f7 74%, #eceef1 100%)', boxShadow: 'inset 0 2px 1px rgba(255,255,255,0.95), inset 0 1px 0 #fff, 0 44px 90px -34px rgba(8,10,14,0.62), 0 6px 16px rgba(8,10,14,0.28)' }}>
            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180, borderRadius: '28px 28px 50% 50%/28px 28px 14% 14%', background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0) 100%)', pointerEvents: 'none', zIndex: 1 }} />
            {/* header */}
            <div style={{ position: 'relative', zIndex: 2, padding: '26px 26px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9a9a9a' }}>CV Üret</span>
                <h3 style={{ margin: '7px 0 0', fontSize: 22, fontWeight: 600, color: '#0a0a0a', letterSpacing: '-0.4px' }}>Hangi bölümler eklensin?</h3>
                <p style={{ margin: '7px 0 0', fontSize: 13, lineHeight: 1.5, color: '#8c8c8c' }}>Seçtiğin bölümler CV'ne dahil edilir; istediğini kapatabilirsin.</p>
              </div>
              <button type="button" onClick={() => setCvOpen(false)} aria-label="Kapat" style={{ flex: 'none', width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, color: '#6b6b6b', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(130% 130% at 25% -10%, #fff 0%, #f3f4f6 70%, #e6e8ec 100%)', boxShadow: 'inset 0 1px 0 #fff, 0 2px 5px rgba(20,24,33,0.10)' }}>✕</button>
            </div>
            {/* list */}
            <div style={{ position: 'relative', zIndex: 2, flex: 1, overflowY: 'auto', padding: '2px 18px 6px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {CV_ITEMS.map(([key, glyph, title, sub]) => {
                const active = cv[key];
                return (
                  <button key={key} type="button" onClick={() => togCv(key)} style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 16, padding: '13px 15px', background: 'radial-gradient(130% 120% at 20% -10%, #fff 0%, #fff 36%, #f5f6f8 72%, #eceef1 100%)', boxShadow: 'inset 0 1px 0 #fff, inset 0 -10px 22px -12px rgba(20,24,33,0.08), 0 2px 5px rgba(20,24,33,0.05)' }}>
                    <span style={{ flex: 'none', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#111', background: 'radial-gradient(120% 120% at 30% 0%, #fff 0%, #eef0f3 100%)', boxShadow: 'inset 0 1px 0 #fff, inset 0 0 0 1px rgba(0,0,0,0.04)' }}>{glyph}</span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{title}</span>
                      <span style={{ fontSize: 11.5, color: '#8c8c8c' }}>{sub}</span>
                    </span>
                    <span style={{ flex: 'none', position: 'relative', width: 24, height: 24 }}>
                      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: 'inset 0 0 0 2px #d4d6da' }} />
                      {active && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>✓</span>}
                    </span>
                    {active && <span style={{ position: 'absolute', inset: 0, borderRadius: 16, boxShadow: 'inset 0 0 0 1.5px #111', pointerEvents: 'none' }} />}
                  </button>
                );
              })}
            </div>
            {/* footer */}
            <div style={{ position: 'relative', zIndex: 2, padding: '15px 22px 22px', marginTop: 4, display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
              <span style={{ fontSize: 12.5, color: '#6b6b6b' }}><span style={{ fontWeight: 700, color: '#111' }}>{cvCount}</span> bölüm seçili</span>
              <button type="button" disabled={cvCount === 0} onClick={() => { if (cvCount === 0) return; generateCv(); }} style={{ position: 'relative', overflow: 'hidden', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: cvCount === 0 ? 'not-allowed' : 'pointer', opacity: cvCount === 0 ? 0.45 : 1, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: '#fff', borderRadius: 999, padding: '13px 22px', background: 'radial-gradient(130% 130% at 25% -10%, #3a3a3d 0%, #1d1d1f 42%, #0b0b0c 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 22px -10px rgba(0,0,0,0.5), 0 2px 5px rgba(0,0,0,0.25)' }}>
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', borderRadius: '999px 999px 50% 50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)', pointerEvents: 'none' }} />
                <span style={{ position: 'relative', zIndex: 2 }}>PDF olarak üret</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
