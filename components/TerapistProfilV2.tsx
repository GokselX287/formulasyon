'use client';

import { useEffect, useRef, useState } from 'react';
import './TerapistProfilV2.css';

// ──────────────────────────────────────────────────────────────────────────
// Terapist Profil v3 — landing ("mesh + opal cam") dili.
// Ana Sayfa (AnaSayfaLanding/.aslx) ile birebir kardeş kabuk: mesh sahne ·
// siyah sticky üst nav + nav-prof · opal cam kartlar · 5 temalı alttaki dock ·
// koyu footer · sağ ilerleme rayı · tek-açılır profil bölümleri.
// Tüm aksiyonlar gerçek sisteme bağlı: iyilik hali (/api/reflections) canlı,
// foto localStorage['tp-profile-photo'] (nav avatarı ile ortak), tema
// localStorage['calmie-theme'], ayar inputları blur'da onUpdateSetting → /api/settings,
// hesap güvenliği /api/auth, CV üret gerçek yazdırılabilir belge.
// "Hesap & Ayarlar" kutucuğu eski ayrı Ayarlar ekranını içine alır.
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
  therapistTrainings?: string; // JSON: {ti,by,yr}[] — eğitim geçmişine eklenen özel eğitimler
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
  /** Deep-link: açılışta açık gelecek profil bölümü ('hesap' = Hesap & Ayarlar). */
  initialTile?: string;
};

const FONTS = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&display=swap';

/* ── üst nav (AnaSayfaLanding ile birebir) ── */
const NAV: { label: string; target: string }[] = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Takvim', target: 'calendar' },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
];

const THEMES = [
  { id: 'sage', dot: '#8FB58C' },
  { id: 'ocean', dot: '#5FA9C0' },
  { id: 'dusk', dot: '#8E84A8' },
  { id: 'clay', dot: '#D78C66' },
  { id: 'rose', dot: '#C97FA0' },
];

const TILES: { id: string; t: string; s: string }[] = [
  { id: 'pratik', t: 'Pratik', s: 'Bu dönemin pratik özeti' },
  { id: 'duygusal', t: 'Duygusal Haritan', s: 'Kendi iyilik hali seyrin' },
  { id: 'egitim', t: 'Eğitim geçmişi', s: 'Ekol, akademik & eğitimler' },
  { id: 'gelisim', t: 'Gelişim & beceriler', s: 'Sertifika & çalışma ilkelerin' },
  { id: 'hesap', t: 'Hesap & Ayarlar', s: 'Profil, SMS, görünüm, güvenlik' },
  { id: 'onam', t: 'Onam formu', s: 'Şablonlar, paylaşım & gönderimler' },
];

const ICONS: Record<string, string> = {
  pratik: '<path d="M5 3h11l4 4v14H5zM15 3v5h5"/><path d="M9 13h6M9 16h4"/>',
  duygusal: '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>',
  egitim: '<path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M7 10v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5"/>',
  gelisim: '<path d="M4 17l5-5 3 3 7-8M16 4h4v4"/>',
  hesap: '<circle cx="12" cy="8" r="3.4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  set: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l1.7-1.3-1.8-3.1-2 .8a7.5 7.5 0 0 0-1.7-1l-.3-2.1H9.7l-.3 2.1a7.5 7.5 0 0 0-1.7 1l-2-.8L3.9 9.7 5.6 11a7.6 7.6 0 0 0 0 2l-1.7 1.3 1.8 3.1 2-.8a7.5 7.5 0 0 0 1.7 1l.3 2.1h3.6l.3-2.1a7.5 7.5 0 0 0 1.7-1l2 .8 1.8-3.1z"/>',
  onam: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
};
const Glyph = ({ id }: { id: string }) => (
  <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: ICONS[id] || '' }} />
);

/* ── ekran verisi (statik; isim/unvan/about/konum settings'ten gelir) ── */
const DEFAULT_BIO_HTML =
  'Çalışmalarını ağırlıklı olarak <b>Bilişsel Davranışçı Terapi</b>, <b>Kabul ve Kararlılık Terapisi</b> ve <b>Metakognitif Terapi</b> üzerine inşa eder. Her seansın bir gündemi ve hedefi olan, sonuç odaklı ve yapılandırılmış bir süreç yürütür.';
const QUOTE = 'Gerçek değişim, konfor alanının bittiği ve dürüstlüğün başladığı yerde filizlenir.';
const PRO = { chips: ['Sınırsız danışan', 'Online randevu', 'Öncelikli destek'], renew: '14 Tem 2026' };
const SESSIONS = { total: 540, active: 28, perClient: 19 };

const PRATIK: { v: string; l: string }[] = [
  { v: '28', l: 'Aktif danışan' },
  { v: '17', l: 'Bu hafta seans' },
  { v: '540', l: 'Toplam seans' },
  { v: '₺1.800', l: 'Ort. seans ücreti' },
];
const UZMANLIK = ['Kaygı Bozuklukları', 'Depresyon', 'Obsesif Kompulsif Bozukluk', 'Bağımlılık', 'Travma Sorunları', 'Yeme Bozuklukları', 'Ergen & Yetişkin', 'Kurumsal Danışmanlık'];
const EKOLLER: { b: string; h: string }[] = [
  { b: 'BDT', h: 'Bilişsel Davranışçı Terapi' },
  { b: 'MCT', h: 'Metakognitif Terapi' },
  { b: 'ACT', h: 'Kabul ve Kararlılık Terapisi' },
  { b: 'MBCT', h: 'Mindfulness Bazlı BDT' },
];
const AKADEMIK: { lvl: string; h: string; k: string }[] = [
  { lvl: 'Yüksek Lisans', h: 'Yönetim ve Organizasyon (MBA)', k: 'Marmara Üniversitesi' },
  { lvl: 'Lisans', h: 'Psikolojik Danışmanlık ve Rehberlik (İng.)', k: 'Orta Doğu Teknik Üniversitesi (ODTÜ)' },
];
const SEANS_AYAR: { k: string; s?: string; v: string }[] = [
  { k: 'Seans süresi', s: 'Standart bireysel seans', v: '50 dakika' },
  { k: 'Format', s: 'Görüşme türleri', v: 'Yüz yüze · Online' },
  { k: 'Seans dili', v: 'Türkçe' },
  { k: 'İptal politikası', s: 'Ücretsiz iptal için', v: '24 saat önce' },
];
const EGITIM: { grp: string; items: { yr: string; ti: string; by: string }[] }[] = [
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
];
const CERTS: { lvl: string; h: string; k: string }[] = [
  { lvl: '2019', h: 'Hipnoterapi & Cinsel Terapide Hipnoterapi', k: 'Bülent Uran · CİSED' },
  { lvl: '2019', h: 'Uygulayıcı Test Sertifikaları (WISC-R, Raven, Peabody…)', k: 'Bilgelik Enstitüsü' },
  { lvl: '—', h: 'BDT Süpervizyon — 3 dönem', k: 'M. Hakan Türkçapar' },
  { lvl: 'sürüyor', h: 'ACT İleri Süpervizyon', k: 'ACT Türkiye' },
];
const PRINCIPLES: { b: string; p: string }[] = [
  { b: 'Bilimsel Katılık', p: 'Yalnızca kanıta dayalı, etkinliği ispatlanmış yöntemler.' },
  { b: 'Tam Mahremiyet', p: 'Etik kurallar çerçevesinde en yüksek gizlilik standardı.' },
  { b: 'Sonuç Odaklı', p: 'Geçici rahatlama değil, kalıcı psikolojik esneklik.' },
  { b: 'Titiz Yapılandırma', p: 'Her seansın gündemi ve hedefi olan sistematik yapı.' },
  { b: 'İnsanlığı Modelleme', p: 'Zorlayıcı duygular insan olmanın doğal parçası olarak ele alınır.' },
  { b: 'Psikoeğitim', p: 'Zihinsel mekanizmaların öğretilmesi; danışanın kendi uzmanı olması.' },
];
const ONAM: { b: string; s: string; state: string; ok: boolean }[] = [
  { b: 'KVKK Aydınlatma & Açık Rıza', s: 'Standart · imzalı akış aktif', state: 'Aktif', ok: true },
  { b: 'Psikoterapi Onam Formu', s: 'Yetişkin bireysel', state: 'Aktif', ok: true },
  { b: 'Çocuk / Ebeveyn Onamı', s: '18 yaş altı için', state: 'Aktif', ok: true },
];
const RECENT_SHARES_DEF: { who: string; when: string }[] = [
  { who: 'E. Tunç', when: 'Dün · imzalandı' },
  { who: 'M. Aydın', when: '3 gün önce · bekliyor' },
  { who: 'S. Korkmaz', when: '1 hafta önce · imzalandı' },
];

/* iyilik hali — veri yokken görünecek varsayılan seyir (0–10). */
const WB_DEFAULT = [6, 7, 5, 6, 8, 7, 6, 7, 5, 6, 8, 7, 6, 7];

/* ── CV üret (yazdırılabilir belge) — bölüm listesi + içerik ── */
const CV_ITEMS: { key: string; title: string; sub: string; def: boolean }[] = [
  { key: 'kisisel', title: 'Kişisel bilgiler', sub: 'Ad, unvan, konum', def: true },
  { key: 'hakkimda', title: 'Hakkımda', sub: 'Kısa biyografi', def: true },
  { key: 'uzmanlik', title: 'Uzmanlık alanları', sub: 'Çalışılan başlıklar', def: true },
  { key: 'egitim', title: 'Eğitim & sertifikalar', sub: 'Akademik + akredite eğitimler', def: true },
  { key: 'deneyim', title: 'Deneyim', sub: 'Klinik geçmiş', def: true },
  { key: 'istatistik', title: 'Seans istatistikleri', sub: '540 seans · 28 danışan', def: false },
  { key: 'diller', title: 'Diller', sub: 'Türkçe · İngilizce', def: true },
  { key: 'supervizyon', title: 'Süpervizyon', sub: 'Aldığı süpervizyonlar', def: true },
  { key: 'iletisim', title: 'İletişim', sub: 'E-posta & telefon', def: true },
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
const CV_CERTIFICATES: [string, string][] = [
  ['EABCT · Akredite BDT Terapisti', 'European Association of Behavioural and Cognitive Therapies · 2025'],
  ['Hipnoterapi Uygulayıcı Sertifikası', 'Cinsel Sağlık Enstitüsü Derneği (CİSED) · 2019'],
  ['Onaylı Psikometrik Test Uygulayıcılığı', 'WISC-R, Raven, Catell 2-A, AGTE ve diğerleri · 2019'],
];
const CV_SKILLS = [
  'BDT / ACT', 'Topluluk önünde konuşma', 'Esneklik & çatışma çözümü',
  'Gözlem & değerlendirme', 'Kişilerarası beceriler', 'Aktif dinleme & duygusal zeka',
  'İkna edici iletişim', 'Eleştirel & analitik düşünme',
];
const CV_ABOUT =
  'Profesyonel misyonum; dayanıklılığı güçlendiren, yaşam kalitesini artıran ve hem bireysel gelişime hem de kurumsal sağlığa katkı sunan kanıta dayalı müdahaleleri ileriye taşımak. Psikoloji ve örgütsel çalışmalar alanındaki birikimimi birleştirerek, klinik pratiğin ötesine geçen; ruh sağlığı, işyeri iyi oluşu ve örgütsel dinamiklerin kesişimini keşfeden bir bakış açısı sunuyorum.';
const CV_ACADEMIC: [string, string, string, string][] = [
  ['Yüksek lisans', 'Yönetim ve Organizasyon, MBA (İng.)', 'Marmara Üniversitesi', '2016 – 2017'],
  ['Lisans', 'Rehberlik ve Psikolojik Danışmanlık (İng.)', 'Orta Doğu Teknik Üniversitesi (ODTÜ)', '2011 – 2016'],
];
const CV_UZMANLIK = ['Anksiyete', 'Depresyon', 'İlişki sorunları', 'Travma', 'Yas'];
const CV_EKOLLER = 'BDT · ACT · MKT (Üstbilişsel) · DBT · MBCT · Şema Terapi';
const CV_STATS: [string, string][] = [
  ['Toplam seans', '540'], ['Aktif danışan', '28'], ['Bu yıl seans', '412'], ['Danışan başına ort.', '≈ 19 seans'],
];
const CV_CONTACT: [string, string][] = [
  ['E-posta', 'akkayagoksel8@gmail.com'], ['Konum', 'Tekirdağ'], ['Randevu', 'elegantpsikoloji.com'],
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
    <h3>Sertifikalar</h3>${CV_CERTIFICATES.map(([t, s]) => cvRow(t, s, '')).join('')}</section>`);
  if (cv.deneyim) sec.push(`<section><h2>Deneyim</h2><div class="kpi">${[['5.000+', 'Bireysel görüşme'], ['700+', 'Akredite eğitim saati'], ['300+', 'Süpervizyon saati']].map(([v, k]) => `<div><b>${v}</b><span>${cvEsc(k)}</span></div>`).join('')}</div></section>`);
  if (cv.istatistik) sec.push(`<section><h2>Seans istatistikleri</h2><div class="kpi">${CV_STATS.map(([k, v]) => `<div><b>${cvEsc(v)}</b><span>${cvEsc(k)}</span></div>`).join('')}</div></section>`);
  if (cv.diller) sec.push(`<section><h2>Diller</h2><p>Türkçe · İngilizce</p></section>`);
  if (cv.supervizyon) sec.push(`<section><h2>Süpervizyon &amp; gelişim</h2><p class="lead">300+ süpervizyon saati · ${CV_SKILLS.length} beceri seti.</p>${BDT_TRAININGS.filter(([n]) => /Süpervizyon/i.test(n)).map(([n, y]) => cvRow(n, '', y)).join('')}<div class="chips" style="margin-top:8px">${CV_SKILLS.map((t) => `<span class="c">${cvEsc(t)}</span>`).join('')}</div></section>`);
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
  <footer>Calmie · Terapist CV — yazdırma tarihinde oluşturuldu.</footer>
</body></html>`;
}

export default function TerapistProfilV2(props: TerapistProfilV2Props) {
  const {
    onBack, onNav, onEditProfile, onExportData,
    settings = {},
    onUpdateSetting,
    onShareConsent = (id) => console.log('paylaş:', id),
    initialTile,
  } = props;

  /* profil alanları (settings → varsayılan) */
  const profName = (settings.therapistName ?? '').trim() || 'Göksel Akkaya';
  const profFirst = profName.split(/\s+/).filter(Boolean)[0] || profName;
  const profTitle = (settings.therapistTitle ?? '').trim() || 'Psikolojik Danışman & Terapist';
  const profLoc = (settings.therapistLocation ?? '').trim() || 'Tekirdağ';
  const aboutSet = (settings.therapistAbout ?? '').trim();
  const aboutHtml = aboutSet ? cvEsc(aboutSet) : DEFAULT_BIO_HTML;
  const initials = profName.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'GA';

  const [open, setOpen] = useState<string | null>(initialTile ?? null);
  const [cvOpen, setCvOpen] = useState(false);
  const [cv, setCv] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CV_ITEMS.map((i) => [i.key, i.def])));
  const [photo, setPhoto] = useState<string | null>(null);
  const [theme, setTheme] = useState('sage');
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [railActive, setRailActive] = useState('kimlik');
  const [acctEmail, setAcctEmail] = useState('');
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const toastId = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  /* profil / SMS form state (blur'da kaydedilir) */
  const [form, setForm] = useState({
    name: settings.therapistName ?? '', title: settings.therapistTitle ?? '',
    ngUser: settings.netgsmUser ?? '', ngPass: settings.netgsmPassword ?? '', ngHeader: settings.netgsmHeader ?? '',
    ngWebhook: settings.smsWebhookUrl ?? '',
  });
  useEffect(() => {
    setForm({
      name: settings.therapistName ?? '', title: settings.therapistTitle ?? '',
      ngUser: settings.netgsmUser ?? '', ngPass: settings.netgsmPassword ?? '', ngHeader: settings.netgsmHeader ?? '',
      ngWebhook: settings.smsWebhookUrl ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.therapistName, settings.therapistTitle, settings.netgsmUser, settings.netgsmPassword, settings.netgsmHeader, settings.smsWebhookUrl]);
  const [pwCur, setPwCur] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /* test SMS (Netgsm) */
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const smsReady = !!((form.ngUser.trim() && form.ngHeader.trim()) || form.ngWebhook.trim());
  const sendTestSms = async () => {
    if (!testPhone.trim() || testing) return;
    setTesting(true); setTestMsg(null);
    try {
      const r = await fetch('/api/sms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone.trim(), name: 'Test', message: 'Calmie test mesajı — SMS kurulumunuz çalışıyor. ✓', trigger_type: 'manual' }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.ok) setTestMsg({ ok: true, text: 'Gönderildi ✓' + (d.jobid ? ` · jobid ${d.jobid}` : '') });
      else setTestMsg({ ok: false, text: d.error || 'Gönderilemedi' });
    } catch (e: any) { setTestMsg({ ok: false, text: e?.message ?? 'Ağ hatası' }); }
    finally { setTesting(false); }
  };

  /* eğitim geçmişi — eklenebilir özel eğitimler (ad + kurum + yıl) */
  const [trAd, setTrAd] = useState('');
  const [trKurum, setTrKurum] = useState('');
  const [trYil, setTrYil] = useState('');

  /* foto (localStorage, nav avatarı ile ortak) */
  useEffect(() => {
    try { const p = localStorage.getItem('tp-profile-photo'); if (p) setPhoto(p); } catch {}
  }, []);
  /* tema (localStorage: calmie-theme) — AnaSayfaLanding ile ortak */
  useEffect(() => {
    try { const t = localStorage.getItem('calmie-theme'); if (t && THEMES.some((x) => x.id === t)) setTheme(t); } catch {}
  }, []);
  /* giriş e-postası */
  useEffect(() => {
    fetch('/api/auth').then((r) => r.json()).then((d) => setAcctEmail(d?.email || '')).catch(() => {});
  }, []);
  /* sc-fill / bar giriş animasyonları */
  useEffect(() => { const r = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(r); }, []);

  /* canlı iyilik hali */
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
  const hasWb = checkins.length > 0;
  const wbBars = hasWb ? checkins.slice(-14) : WB_DEFAULT;
  const wbMax = Math.max(...wbBars, 10);
  const wbScore = hasWb ? wbBars[wbBars.length - 1] : 7.0;
  const wbAvg = wbBars.reduce((a, b) => a + b, 0) / wbBars.length;
  const sessionFill = Math.min(100, Math.round((SESSIONS.active / 45) * 100)); // doluluk göstergesi

  /* railnav scroll-spy */
  useEffect(() => {
    const ids = ['tpx-kimlik', 'tpx-bolumler'];
    const els = ids.map((i) => document.getElementById(i)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) setRailActive(e.target.id.replace('tpx-', '')); });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const toast = (msg: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  const applyTheme = (id: string) => {
    setTheme(id);
    try { localStorage.setItem('calmie-theme', id); } catch {}
  };

  const toggleTile = (id: string) => {
    const willOpen = open !== id;
    setOpen(willOpen ? id : null);
    if (willOpen) {
      setTimeout(() => {
        const el = detailRef.current;
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
      }, 140);
    }
  };
  const openFromFooter = (id: string) => {
    document.getElementById('tpx-bolumler')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => setOpen(id), 280);
  };

  const togCv = (k: string) => setCv((c) => ({ ...c, [k]: !c[k] }));
  const cvCount = Object.values(cv).filter(Boolean).length;
  const generateCv = () => {
    const w = window.open('', '_blank', 'width=860,height=1040');
    if (!w) { try { alert('CV için açılır pencere engellendi. Lütfen bu site için açılır pencerelere izin verin.'); } catch {} return; }
    w.document.open(); w.document.write(buildCvHtml(cv, photo)); w.document.close(); w.focus();
    let printed = false;
    const go = () => { if (printed) return; printed = true; try { w.print(); } catch {} };
    w.onload = () => window.setTimeout(go, 300);
    window.setTimeout(go, 900);
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

  const commit = (patch: Partial<TerapistSettings>) => onUpdateSetting?.(patch);
  const doExport = () => { onExportData?.(); toast('Veriler JSON olarak dışa aktarılıyor…'); };

  const doLogout = async () => {
    try { await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) }); } catch {}
    window.location.href = '/giris';
  };
  const doChangePw = async () => {
    setPwMsg(null);
    if (pwNew.length < 8) { setPwMsg({ ok: false, text: 'Yeni şifre en az 8 karakter olmalı.' }); return; }
    setPwBusy(true);
    try {
      const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'change-password', password: pwCur, newPassword: pwNew }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d?.ok !== false) { setPwMsg({ ok: true, text: 'Şifre güncellendi ✓' }); setPwCur(''); setPwNew(''); }
      else setPwMsg({ ok: false, text: d?.error || 'Şifre güncellenemedi.' });
    } catch { setPwMsg({ ok: false, text: 'Bağlantı hatası.' }); }
    setPwBusy(false);
  };

  const customTrainings: { ti: string; by: string; yr: string }[] = (() => {
    try { const a = JSON.parse(settings.therapistTrainings || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
  })();
  const addTraining = () => {
    const ti = trAd.trim(); if (!ti) return;
    commit({ therapistTrainings: JSON.stringify([...customTrainings, { ti, by: trKurum.trim(), yr: trYil.trim() }]) });
    setTrAd(''); setTrKurum(''); setTrYil(''); toast('Eğitim eklendi.');
  };
  const removeTraining = (i: number) => commit({ therapistTrainings: JSON.stringify(customTrainings.filter((_, idx) => idx !== i)) });

  /* ── açılan bölüm içeriği ── */
  const renderDetail = (id: string) => {
    switch (id) {
      case 'pratik':
        return (
          <div className="dpanel panel">
            <DHead id="pratik" h="Pratik özet" sub="Bu dönemin sayıları" />
            <div className="mgrid">
              {PRATIK.map((c) => (<div className="mstat" key={c.l}><b className="num">{c.v}</b><span>{c.l}</span></div>))}
            </div>
          </div>
        );
      case 'duygusal':
        return (
          <div className="dpanel panel">
            <DHead id="duygusal" h="Duygusal haritan" sub="Kendi check-in skorların — son 14 gün" />
            <div className="sc-big"><b className="num" style={{ fontSize: 56 }}>{wbScore.toFixed(1)}</b><small>bugünkü skor / 10</small></div>
            <div className="wb-chart" style={{ height: 96 }}>
              {wbBars.map((v, i) => (<i key={i} style={{ height: mounted ? `${Math.round((v / wbMax) * 100)}%` : '5%' }} />))}
            </div>
            <div className="wb-foot">
              <span>Ortalama <b className="num">{wbAvg.toFixed(1)}</b> / 10</span>
              <span>En yüksek <b className="num">{Math.max(...wbBars)}</b> · en düşük <b className="num">{Math.min(...wbBars)}</b></span>
            </div>
          </div>
        );
      case 'egitim':
        return (
          <div className="dpanel panel">
            <DHead id="egitim" h="Eğitim geçmişi" sub="Ekoller, akademik & akredite eğitimler" />
            <div className="dlabel">Çalışılan ekoller</div>
            <div className="chips">{EKOLLER.map((e) => (<span className="chip ac" key={e.b}>{e.b} · {e.h}</span>))}</div>
            <div className="dlabel">Uzmanlık alanları</div>
            <div className="chips">{UZMANLIK.map((u) => (<span className="chip" key={u}>{u}</span>))}</div>
            <div className="dlabel">Akademik</div>
            <div className="cards2">{AKADEMIK.map((a) => (<div className="minic" key={a.h}><div className="lvl">{a.lvl}</div><div className="h">{a.h}</div><div className="k">{a.k}</div></div>))}</div>
            <div className="dlabel">Diller · seans biçimi</div>
            <div className="rows">{SEANS_AYAR.map((r) => (<div className="row" key={r.k}><div><div className="rk">{r.k}</div>{r.s ? <div className="rs">{r.s}</div> : null}</div><div className="rv">{r.v}</div></div>))}</div>
            {EGITIM.map((g) => (
              <div key={g.grp}>
                <div className="dlabel">{g.grp}</div>
                <div className="edu-grp">{g.items.map((it) => (<div className="edu-item" key={it.ti}><span className="yr">{it.yr}</span><div><div className="ti">{it.ti}</div><div className="by">{it.by}</div></div></div>))}</div>
              </div>
            ))}
            <div className="dlabel">Eklenen eğitimler</div>
            <div className="edu-grp">
              {customTrainings.length === 0 && <div className="tile-s" style={{ margin: '0 0 4px' }}>Henüz eğitim eklenmedi.</div>}
              {customTrainings.map((it, i) => (
                <div className="edu-item cust" key={i}>
                  <span className="yr">{it.yr || '—'}</span>
                  <div><div className="ti">{it.ti}</div>{it.by ? <div className="by">{it.by}</div> : null}</div>
                  <button className="tr-del" type="button" aria-label="Eğitimi sil" onClick={() => removeTraining(i)}>×</button>
                </div>
              ))}
            </div>
            <div className="tr-add">
              <input className="tr-in" placeholder="Eğitim adı" value={trAd} onChange={(e) => setTrAd(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTraining(); }} />
              <input className="tr-in" placeholder="Veren kurum" value={trKurum} onChange={(e) => setTrKurum(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTraining(); }} />
              <input className="tr-in tr-yr" placeholder="Yıl" value={trYil} onChange={(e) => setTrYil(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTraining(); }} />
              <button className="btn-primary" type="button" disabled={!trAd.trim()} onClick={addTraining}>Ekle</button>
            </div>
          </div>
        );
      case 'gelisim':
        return (
          <div className="dpanel panel">
            <DHead id="gelisim" h="Gelişim & beceriler" sub="Sertifikalar ve çalışma ilkelerin" />
            <div className="dlabel">Onaylı sertifika & süpervizyon</div>
            <div className="cards2">{CERTS.map((c) => (<div className="minic" key={c.h}><div className="lvl">{c.lvl}</div><div className="h">{c.h}</div><div className="k">{c.k}</div></div>))}</div>
            <div className="dlabel">Çalışma ilkelerin</div>
            <div className="skills">{PRINCIPLES.map((s) => (<div className="skill" key={s.b}><b>{s.b}</b><p>{s.p}</p></div>))}</div>
          </div>
        );
      case 'onam':
        return (
          <div className="dpanel panel">
            <DHead id="onam" h="Onam formu" sub="Şablonlar, bağlantı oluştur & paylaş" />
            {ONAM.map((o) => (
              <div className="tmpl" key={o.b}>
                <div><div className="tt">{o.b}</div><div className="tsub">{o.s}</div></div>
                <span className={'badge ' + (o.ok ? 'ok' : 'warn')}><span className="d" />{o.state}</span>
                <button className="tmpl-act" type="button" onClick={() => { onShareConsent(o.b); toast('Onam bağlantısı oluşturuldu & kopyalandı.'); }}>Bağlantı oluştur</button>
              </div>
            ))}
            <div className="recent">
              <div className="dlabel">Son gönderimler</div>
              {RECENT_SHARES_DEF.map((r) => (<div className="ri" key={r.who}><span className="who">{r.who}</span><span className="when">{r.when}</span></div>))}
            </div>
          </div>
        );
      case 'hesap':
        return (
          <div className="dpanel panel">
            <DHead id="set" h="Hesap & Ayarlar" sub="Tüm hesap ayarların tek yerde" />
            {/* 01 Profil */}
            <div className="setcard">
              <div className="set-no"><b>01</b> — Profil</div><div className="set-h">Kimlik</div>
              <div className="field-2">
                <div className="field"><label>Ad Soyad</label><input type="text" value={form.name} placeholder="Göksel Akkaya"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} onBlur={() => commit({ therapistName: form.name })}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} /></div>
                <div className="field"><label>Unvan</label><input type="text" value={form.title} placeholder="Psikolojik Danışman & Terapist"
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} onBlur={() => commit({ therapistTitle: form.title })}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} /></div>
              </div>
              <div className="btn-row">
                <button className="btn-ghost" type="button" onClick={pickPhoto}>Fotoğrafı değiştir</button>
                <button className="btn-ghost" type="button" onClick={() => onEditProfile?.()}>Tüm profili düzenle →</button>
              </div>
            </div>
            {/* 02 Bildirim & SMS */}
            <div className="setcard">
              <div className="set-no"><b>02</b> — Bildirim & SMS</div><div className="set-h">Netgsm SMS</div>
              <div className="field-2">
                <div className="field"><label>Netgsm kullanıcı kodu</label><input type="text" value={form.ngUser} placeholder="850XXXXXXX" autoComplete="off"
                  onChange={(e) => setForm((f) => ({ ...f, ngUser: e.target.value }))} onBlur={() => commit({ netgsmUser: form.ngUser })} /></div>
                <div className="field"><label>Netgsm API şifresi</label><input type="password" value={form.ngPass} placeholder="••••••••" autoComplete="off"
                  onChange={(e) => setForm((f) => ({ ...f, ngPass: e.target.value }))} onBlur={() => commit({ netgsmPassword: form.ngPass })} /></div>
              </div>
              <div className="field"><label>Mesaj başlığı</label><input type="text" value={form.ngHeader} placeholder="onaylı başlık" autoComplete="off"
                onChange={(e) => setForm((f) => ({ ...f, ngHeader: e.target.value }))} onBlur={() => commit({ netgsmHeader: form.ngHeader })} />
                <span className="hint">Başlık, “bilgilendirme” tipinde onaylı olmalıdır.</span></div>
              <div className="field"><label>Yedek webhook URL (opsiyonel)</label><input type="text" value={form.ngWebhook} placeholder="https://…" autoComplete="off"
                onChange={(e) => setForm((f) => ({ ...f, ngWebhook: e.target.value }))} onBlur={() => commit({ smsWebhookUrl: form.ngWebhook })} /></div>
              <div className="testrow">
                <div className="field"><label>Test SMS</label><input type="text" value={testPhone} placeholder="05__ ___ __ __" onChange={(e) => setTestPhone(e.target.value)} /></div>
                <button className="btn-primary" type="button" disabled={!smsReady || testing} onClick={sendTestSms}>{testing ? 'Gönderiliyor…' : 'Gönder'}</button>
                {testMsg && <span className={'pwmsg ' + (testMsg.ok ? 'ok' : 'err')}>{testMsg.text}</span>}
                {!smsReady && <span className="hint">Önce kullanıcı kodu + başlık (veya webhook) gir.</span>}
              </div>
              <ToggleRow tk="Randevu hatırlatma" ts="Danışana, seanstan önce" on={!!settings.smsAutoAppointmentReminder} onToggle={(v) => commit({ smsAutoAppointmentReminder: v })} />
              <ToggleRow tk="Seans günü hatırlatması" ts="Aynı gün sabah SMS" on={!!settings.smsDayOfReminder} onToggle={(v) => commit({ smsDayOfReminder: v })} />
              <ToggleRow tk="Atölye kaydı bildirimi" ts="Yeni atölye katılımı" on={!!settings.smsAutoWorkshopSignup} onToggle={(v) => commit({ smsAutoWorkshopSignup: v })} />
            </div>
            {/* 03 Görünüm & tercihler */}
            <div className="setcard">
              <div className="set-no"><b>03</b> — Görünüm & tercihler</div><div className="set-h">Tema</div>
              <div className="field"><label>Arka plan teması</label>
                <div className="swatches" role="group" aria-label="Arka plan teması">
                  {THEMES.map((t) => (<button key={t.id} type="button" className={'sw' + (theme === t.id ? ' on' : '')} style={{ background: t.dot }} aria-label={t.id} onClick={() => applyTheme(t.id)} />))}
                </div>
              </div>
              <ToggleRow tk="Gelmeyen seans takibi" ts="No-show işaretleme" on={!!settings.noShowTracking} onToggle={(v) => commit({ noShowTracking: v })} />
            </div>
            {/* 04 Veri */}
            <div className="setcard">
              <div className="set-no"><b>04</b> — Veri</div><div className="set-h">Dışa aktarma</div>
              <div className="btn-row"><button className="btn-primary" type="button" onClick={doExport}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M8 11l4 4 4-4M5 21h14" /></svg>
                Verileri dışa aktar (JSON)</button></div>
            </div>
            {/* 05 Hesap güvenliği */}
            <div className="setcard">
              <div className="set-no"><b>05</b> — Hesap güvenliği</div><div className="set-h">Şifre & oturum</div>
              <div className="acctline" style={{ marginBottom: 14 }}>{acctEmail ? <>Giriş e-postası: <b>{acctEmail}</b></> : 'Oturum ve şifre yönetimi.'}</div>
              <div className="field-2">
                <div className="field"><label>Mevcut şifre</label><input type="password" value={pwCur} placeholder="••••••••" autoComplete="current-password" onChange={(e) => setPwCur(e.target.value)} /></div>
                <div className="field"><label>Yeni şifre (≥8)</label><input type="password" value={pwNew} placeholder="••••••••" autoComplete="new-password" onChange={(e) => setPwNew(e.target.value)} /></div>
              </div>
              <div className="btn-row">
                <button className="btn-primary" type="button" disabled={pwBusy || !pwCur || !pwNew} onClick={doChangePw}>{pwBusy ? 'Güncelleniyor…' : 'Şifreyi değiştir'}</button>
                <a className="btn-ghost" href="/admin">Yönetim paneli →</a>
                <button className="btn-ghost danger" type="button" onClick={doLogout}>Çıkış yap</button>
                {pwMsg && <span className={'pwmsg ' + (pwMsg.ok ? 'ok' : 'err')}>{pwMsg.text}</span>}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="tpx" data-theme={theme === 'sage' ? undefined : theme}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={FONTS} rel="stylesheet" />

      <div className="scene" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <input type="file" accept="image/*" ref={fileRef} onChange={onPhoto} style={{ display: 'none' }} />

      {/* ── NAV ── */}
      <div className="navwrap">
        <nav className="nav" aria-label="Birincil">
          <a className="logo" onClick={() => onNav?.('home')}>Calmie<i>.</i></a>
          <div className="nav-links">
            {NAV.map((n) => (<a key={n.target} onClick={() => onNav?.(n.target)}>{n.label}</a>))}
            <a className="active">Profil</a>
          </div>
          <a className="nav-prof" onClick={() => onEditProfile?.()}>
            <div className="np-col">
              <span className="pro-badge"><svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.3L21 9l-4.8 4.3L17.6 22 12 18.4 6.4 22l1.4-8.7L3 9l6.4-.7z" /></svg>PRO</span>
              <span className="np-name">{profFirst}</span>
            </div>
            <span className="np-av">{photo ? <img alt="" src={photo} /> : initials}</span>
          </a>
          <button className="menu-btn" aria-label="Menü" onClick={() => setMobileOpen((v) => !v)}>
            <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </nav>
        <div className={'mobile-menu' + (mobileOpen ? ' open' : '')}>
          <a onClick={() => { setMobileOpen(false); onNav?.('home'); }}>Ana Sayfa</a>
          <a onClick={() => { setMobileOpen(false); onNav?.('calendar'); }}>Takvim &amp; Randevular</a>
          <a onClick={() => { setMobileOpen(false); onNav?.('calisma-alani'); }}>Çalışma Alanı</a>
          <a onClick={() => { setMobileOpen(false); onEditProfile?.(); }}>Profil</a>
        </div>
      </div>

      <main className="page">
        <div className="wrap">
          <div className="toprow">
            <a className="back" onClick={() => onBack?.()}><span className="chev">‹</span>Ana Sayfa</a>
            <a className="print-link" onClick={() => setCvOpen(true)}>
              <svg viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>Yazdır / PDF
            </a>
          </div>

          {/* §01 HERO */}
          <section id="tpx-kimlik">
            <div className="hero">
              <div className="hero-main reveal">
                <span className="eyebrow hero-eye" data-no="01">Profil · Pro Plan</span>
                <h1 className="hero-title">Merhaba, ben <span className="ser">{profFirst}</span>:<br />{profTitle}.</h1>
                <div className="hero-role">
                  <span>Elegant Psikoloji</span><span className="sep">·</span>
                  <span className="mut">{profLoc}</span><span className="sep">·</span>
                  <span className="mut">EABCT Akredite · 2025–2030</span>
                </div>
                <p className="hero-bio" dangerouslySetInnerHTML={{ __html: aboutHtml }} />
                <div className="hero-quote"><p>“{QUOTE}”</p></div>
              </div>
              <aside className="hero-side">
                <div className="pro-card panel reveal">
                  <div className="pc-top"><span className="pc-brand">calmie<i>.</i></span><span className="pc-tag">Pro Plan</span></div>
                  <div className="pc-chips">{PRO.chips.map((c) => (<span className="pc-chip" key={c}>{c}</span>))}</div>
                  <div className="pc-renew"><span>Yenileme</span><b>{PRO.renew}</b></div>
                </div>
                <button className="cv-btn reveal" type="button" onClick={() => setCvOpen(true)}>
                  <span className="cl">
                    <span className="ce">Tek tıkla</span>
                    <span className="ct">CV / Özgeçmiş üret</span>
                    <span className="cs">Bölümleri seç · PDF olarak indir</span>
                  </span>
                  <span className="cgo"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
                </button>
              </aside>
            </div>

            {/* portre + 2 istatistik */}
            <div className="idblk">
              <div className="portrait reveal" onClick={pickPhoto} title="Profil fotoğrafını değiştir">
                {photo
                  ? <img src={photo} alt="Profil fotoğrafı" />
                  : (
                    <div className="pempty">
                      <span className="pic"><svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg></span>
                      <span>Profil fotoğrafı ekle</span>
                    </div>
                  )}
                <span className="pedit"><svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>Değiştir</span>
                <div className="pname"><b>{profName}</b><span>Psikolojik Danışman & EABCT Akredite Terapist</span></div>
              </div>

              <div className="statcard panel reveal">
                <span className="eyebrow sc-eye" data-no="02">Seans & Danışan</span>
                <div className="sc-big"><b className="num">{SESSIONS.total}</b><small>toplam seans</small></div>
                <div className="sc-sub"><b style={{ color: 'var(--ink-strong)' }}>{SESSIONS.active}</b> aktif danışan</div>
                <div className="sc-bar"><span className="sc-fill" style={{ width: mounted ? `${sessionFill}%` : '0%' }} /></div>
                <div className="sc-note">Aktif danışan başına <b>≈ {SESSIONS.perClient}</b> seans</div>
              </div>

              <div className="statcard panel reveal">
                <span className="eyebrow sc-eye" data-no="03">İyilik Hali</span>
                <div className="sc-big"><b className="num">{wbScore.toFixed(1)}</b><small>bugünkü skor / 10</small></div>
                <div className="wb-chart">{wbBars.map((v, i) => (<i key={i} style={{ height: mounted ? `${Math.round((v / wbMax) * 100)}%` : '5%' }} />))}</div>
                <div className="wb-foot"><span>Son {wbBars.length} gün</span><span>Ortalama <b className="num">{wbAvg.toFixed(1)}</b></span></div>
              </div>
            </div>
          </section>

          {/* §02 PROFİL BÖLÜMLERİ */}
          <section id="tpx-bolumler">
            <div className="sec-head">
              <span className="eyebrow" data-no="04">Profil bölümleri</span>
              <h2>Bir bölüme dokun, <i>aşağıda açılsın</i>.</h2>
              <p>Aynı bölüme tekrar dokunursan kapanır. Tek seferde tek bölüm açık kalır.</p>
            </div>
            <div className="tiles">
              {TILES.map((e, i) => (
                <button key={e.id} type="button" className={'tile reveal' + (open === e.id ? ' on' : '')} style={{ animationDelay: `${i * 45}ms` }} onClick={() => toggleTile(e.id)}>
                  <span className="tile-cue">+</span>
                  <span className="tile-ic"><Glyph id={e.id} /></span>
                  <span><span className="tile-t">{e.t}</span><span className="tile-s">{e.s}</span></span>
                </button>
              ))}
            </div>
            <div className={'detail' + (open ? ' open' : '')} ref={detailRef}>
              <div>{open ? renderDetail(open) : null}</div>
            </div>
          </section>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-in">
          <div className="foot-brand">
            <span className="logo">Calmie<i>.</i></span>
            <p>Sadece işini yapmak isteyenler için klinik asistan.</p>
          </div>
          <div className="foot-col">
            <h4>Panel</h4>
            <a onClick={() => onNav?.('home')}>Ana Sayfa</a>
            <a onClick={() => onNav?.('calendar')}>Takvim &amp; Randevular</a>
            <a onClick={() => onNav?.('calisma-alani')}>Çalışma Alanı</a>
          </div>
          <div className="foot-col">
            <h4>Hesap</h4>
            <a onClick={() => openFromFooter('hesap')}>Hesap &amp; Ayarlar</a>
            <a onClick={() => openFromFooter('onam')}>Onam formu</a>
            <a onClick={() => setCvOpen(true)}>CV üret</a>
          </div>
          <div className="foot-col">
            <h4>Destek</h4>
            <a onClick={() => toast('Yardım merkezi yakında.')}>Yardım merkezi</a>
            <a onClick={() => openFromFooter('gelisim')}>Süpervizyon</a>
            <a onClick={() => onEditProfile?.()}>İletişim</a>
          </div>
        </div>
        <div className="foot-bottom"><div className="foot-bottom-in"><span>© 2026 Calmie</span><span>{profName} · PRO</span></div></div>
      </footer>

      {/* ── RAILNAV ── */}
      <nav className="railnav" aria-label="Bölümler">
        <a className={'rn-item' + (railActive === 'kimlik' ? ' active' : '')} onClick={() => document.getElementById('tpx-kimlik')?.scrollIntoView({ behavior: 'smooth' })}><span className="rn-label">Kimlik</span><span className="rn-tick" /></a>
        <a className={'rn-item' + (railActive === 'bolumler' ? ' active' : '')} onClick={() => document.getElementById('tpx-bolumler')?.scrollIntoView({ behavior: 'smooth' })}><span className="rn-label">Bölümler</span><span className="rn-tick" /></a>
      </nav>

      {/* ── DOCK (tema) ── */}
      <div className="dock" aria-label="Renk teması">
        {THEMES.map((t) => (<button key={t.id} type="button" className={'dock-dot' + (theme === t.id ? ' on' : '')} style={{ background: t.dot }} aria-label={`${t.id} tema`} onClick={() => applyTheme(t.id)} />))}
      </div>

      {/* ── CV MODAL ── */}
      <div className={'ov' + (cvOpen ? ' open' : '')} role="dialog" aria-modal="true" aria-label="CV üret" onClick={(e) => { if (e.target === e.currentTarget) setCvOpen(false); }}>
        <div className="modal">
          <button className="modal-x" type="button" aria-label="Kapat" onClick={() => setCvOpen(false)}>×</button>
          <div className="modal-h">
            <span className="me">Özgeçmiş</span>
            <h3>CV&apos;ni oluştur</h3>
            <p>Yer alacak bölümleri seç, PDF olarak indir.</p>
          </div>
          <div className="modal-list">
            {CV_ITEMS.map((c) => (
              <div key={c.key} className={'cvopt' + (cv[c.key] ? ' sel' : '')} onClick={() => togCv(c.key)}>
                <span className="ci"><svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg></span>
                <span className="cm"><b>{c.title}</b><span>{c.sub}</span></span>
                <span className="cbox"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-11" /></svg></span>
              </div>
            ))}
          </div>
          <div className="modal-f">
            <span className="cnt"><b>{cvCount}</b> bölüm seçili</span>
            <button className="gen-btn" type="button" disabled={cvCount === 0} onClick={() => { if (cvCount === 0) return; generateCv(); }}>
              <svg viewBox="0 0 24 24"><path d="M12 3v12M8 11l4 4 4-4M5 21h14" /></svg>PDF olarak üret
            </button>
          </div>
        </div>
      </div>

      {/* ── TOAST ── */}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className="toast show"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg><span>{t.msg}</span></div>
        ))}
      </div>
    </div>
  );
}

/* ── küçük yardımcı bileşenler ── */
function DHead({ id, h, sub }: { id: string; h: string; sub?: string }) {
  return (
    <div className="dpanel-head">
      <span className="di"><Glyph id={id} /></span>
      <div><h3>{h}</h3>{sub ? <div className="dsub">{sub}</div> : null}</div>
    </div>
  );
}
function ToggleRow({ tk, ts, on, onToggle }: { tk: string; ts: string; on: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="toggle-row">
      <div><div className="tk">{tk}</div><div className="ts">{ts}</div></div>
      <button type="button" className={'tog' + (on ? ' on' : '')} aria-pressed={on} onClick={() => onToggle(!on)} />
    </div>
  );
}
