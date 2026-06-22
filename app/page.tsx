import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './landing.css';

// ──────────────────────────────────────────────────────────────────────────
// Kök "/" — HERKESE AÇIK pazarlama landing'i (SEO). Sunucu-render; içerik
// HTML'de gelir (crawl edilebilir). Uygulama /uygulama altında (girişli).
// Strateji: kağıt/A4 düzeni → dijital klinik asistanı. Üstü kapalı FOMO:
// dosyalama yükünden kurtul, raporlamayı saniyelere indir, kendine zaman aç.
// ──────────────────────────────────────────────────────────────────────────

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://calmie.app';

// TODO(fiyat): Gerçek rakamla değiştir. Şu an yer-tutucu.
const PRICE_MONTHLY = '499';
const PRICE_YEARLY = '4.990';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Calmie — Terapistler için danışan yönetimi ve vaka formülasyonu yazılımı',
  description:
    'A4 ve Excel dağınıklığını bırak. Anamnez, vaka formülasyonu, bozukluk döngüsü, seans takibi ve otomatik randevu hatırlatması tek panelde. Klinik psikologlar için KVKK uyumlu dijital klinik asistanı — ücretsiz dene.',
  keywords: [
    'vaka formülasyonu programı', 'terapist danışan takip yazılımı', 'klinik psikolog yazılımı',
    'danışan yönetim programı', 'psikoterapi yazılımı', 'seans takip programı',
    'randevu hatırlatma sistemi', 'KVKK uyumlu danışan yönetimi', 'bozukluk döngüsü', 'anamnez formu',
  ],
  authors: [{ name: 'Calmie' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: SITE,
    siteName: 'Calmie',
    title: 'Calmie — Terapistler için dijital klinik asistanı',
    description:
      'Kağıt dosyaları bırak. Anamnezden bozukluk döngüsüne, seans takibinden randevu hatırlatmasına — tüm klinik sürecini tek panelde toplayan terapist asistanı.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calmie — Terapistler için dijital klinik asistanı',
    description:
      'Anamnez, vaka formülasyonu, bozukluk döngüsü, seans ve randevu — tek panelde. KVKK uyumlu.',
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Calmie nedir?',
    a: 'Calmie, klinik psikologlar ve psikoterapistler için bir dijital klinik asistanıdır. Anamnez, vaka formülasyonu, bozukluk döngüsü, seans takibi ve randevu hatırlatmasını tek panelde toplar; kağıt ve Excel dağınıklığını ortadan kaldırır.',
  },
  {
    q: 'Verilerim güvende mi? KVKK uyumlu mu?',
    a: 'Evet. Her terapist yalnızca kendi danışanlarının verisine erişir; veriler izole ve şifreli saklanır. Altyapı KVKK ilkelerine uygun tasarlanmıştır.',
  },
  {
    q: 'Hangi terapi ekolleriyle çalışıyor?',
    a: 'Vaka formülasyonu; 4P modeli, Beck bilişsel modeli ve ACT Hexaflex görünümleriyle çalışır. Sözlük BDT, ACT, Şema ve Psikodinamik ekollerden ortak bir dil sunar.',
  },
  {
    q: 'Randevu hatırlatma SMS’i gönderebilir miyim?',
    a: 'Evet. Takvim macOS ile senkron çalışır ve randevu yaklaşınca danışana otomatik bilgilendirme SMS’i gider; böylece gelmeyen danışan ve boşa giden saat azalır.',
  },
  {
    q: 'Ne kadar? İptal edebilir miyim?',
    a: 'Tek bir plan var: aylık ya da yıllık (yıllık ödemede indirimli). Kredi kartı olmadan ücretsiz başlarsın, taahhüt yoktur, istediğin an iptal edebilirsin.',
  },
  {
    q: 'Kağıt/Excel düzenimden geçiş zor mu?',
    a: 'Hayır. Yeni danışanı dakikalar içinde eklersin; eski A4 düzeninden dijital klinik asistanına geçiş ilk dosyanı kurmanla başlar. Özetlerini ve raporlarını dilediğin an PDF olarak dışa aktarırsın.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Calmie',
      url: SITE,
      description: 'Klinik psikologlar için danışan yönetimi ve vaka formülasyonu yazılımı.',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Calmie',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      url: SITE,
      offers: { '@type': 'Offer', price: PRICE_MONTHLY, priceCurrency: 'TRY' },
      description:
        'Anamnez, vaka formülasyonu, bozukluk döngüsü, seans takibi ve randevu hatırlatması tek panelde toplayan, klinik psikologlara yönelik KVKK uyumlu danışan yönetim yazılımı.',
      inLanguage: 'tr',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

const MODULES: { i: string; t: string; d: string }[] = [
  { i: 'clipboard', t: 'Anamnez', d: 'Yapılandırılmış görüşme formu; zorunlu alan kapısı ve otomatik kayıtla eksiksiz danışan geçmişi.' },
  { i: 'nodes', t: 'Vaka Formülasyonu', d: '4P, Beck bilişsel modeli ve ACT Hexaflex ile vakayı profesyonel adımlarla haritala.' },
  { i: 'cycle', t: 'Bozukluk Döngüsü', d: 'Tetikleyici, düşünce, duygu ve davranış arasındaki kısır döngüyü görselleştir ve paylaş.' },
  { i: 'calendar', t: 'Takvim & Randevu', d: 'macOS takvimiyle iki yönlü senkron; sürükle-bırak yeniden planla, çakışmayı anında gör.' },
  { i: 'bell', t: 'SMS Hatırlatma', d: 'Netgsm ile otomatik randevu bildirimi. Daha az iptal, daha dolu bir ajanda.' },
  { i: 'file', t: 'Özet & PDF', d: 'Danışana özel özet sunum; tek tıkla yazdırılabilir, paylaşılabilir profesyonel rapor.' },
];

const PAINS: { t: string; d: string }[] = [
  { t: 'Dağınık kağıt ve dosyalar', d: 'Notlar A4’lerde, klasörlerde, bir de telefonunda. Aradığın bilgi her seferinde kayıp.' },
  { t: 'Kaçan randevular', d: 'Hatırlatmayı elle yapıyorsun; unutan danışan boşa giden bir saat ve kaçan gelir demek.' },
  { t: 'Formülasyon kafanda kalıyor', d: 'Vakayı zihninde kuruyorsun ama kağıda dökmek, ilişkilendirmek saatini alıyor.' },
  { t: 'KVKK tedirginliği', d: 'Danışan verisi nerede, ne kadar güvende? Dağınık kağıt düzen bu soruya cevap veremiyor.' },
];

const OLD_WAY = [
  'Notlar A4 ve Excel’de dağınık',
  'Randevuyu elle hatırlat, gelmesini um',
  'Formülasyon kafanda, paylaşılamıyor',
  'Raporu elle hazırla — saatler',
  '“Veriler güvende mi?” belirsiz',
];
const NEW_WAY = [
  'Tek panelde, aranabilir danışan dosyası',
  'Otomatik SMS hatırlatma',
  'Görsel formülasyon, tek tıkla paylaş',
  'Özet & PDF saniyeler içinde',
  'İzole, şifreli, KVKK uyumlu',
];

const GAINS: { i: string; t: string; d: string }[] = [
  { i: 'zap', t: 'Daha hızlı klinik pratik', d: 'Hazır akış ve şablonlarla vakayı daha çabuk kavra; mesleki gelişimini hızlandır.' },
  { i: 'inbox', t: 'Dosyalama yükü sıfır', d: 'Kağıt yok, klasör yok. Her şey tek yerde, otomatik kayıtlı ve aranabilir.' },
  { i: 'chart', t: 'Anlık, basit raporlama', d: 'Özet sunum ve PDF tek tıkla hazır. Rapor için akşamını harcama.' },
  { i: 'clock', t: 'Kendine kalan zaman', d: 'İdari yükten kurtulan saatleri danışanına ve kendi gelişimine ayır.' },
];

const PLAN_FEATURES = [
  'Sınırsız danışan dosyası',
  'Tüm formülasyon görünümleri (4P · Beck · ACT)',
  'Otomatik SMS randevu hatırlatma',
  'Özet & PDF raporlama',
  'macOS takvim senkronu',
  'Dosyalama yükü sıfır — kendine kalan zaman',
];

const TRUST = [
  { i: 'shield', t: 'KVKK uyumlu' },
  { i: 'lock', t: 'Şifreli & izole veri' },
  { i: 'calendar', t: 'macOS takvim senkron' },
  { i: 'bell', t: 'Netgsm SMS altyapısı' },
];

// ── küçük çizgi ikon seti (currentColor ile renklenir) ──────────────────────
const ICONS: Record<string, ReactNode> = {
  clipboard: (<><rect x="5" y="5" width="14" height="16" rx="2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></>),
  nodes: (<><circle cx="6" cy="7" r="2.1" /><circle cx="18" cy="6" r="2.1" /><circle cx="12" cy="17.5" r="2.1" /><path d="M7.8 8.4 10.6 15.6M16.3 7.7 13.4 15.6M8 6.7 15.9 6.1" /></>),
  cycle: (<><path d="M5 12a7 7 0 0 1 11.9-5" /><path d="M19 12a7 7 0 0 1-11.9 5" /><path d="M17 2.5V7h-4.5M7 21.5V17h4.5" /></>),
  calendar: (<><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 9.5h16M8 3v4M16 3v4M8 14h2M14 14h2M8 17.5h2" /></>),
  bell: (<><path d="M18 8a6 6 0 0 0-12 0c0 6-3 8-3 8h18s-3-2-3-8" /><path d="M10.3 21a2 2 0 0 0 3.4 0" /></>),
  file: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>),
  zap: (<path d="M13 2.5 5.5 13H11l-1 8.5L18.5 10H13z" />),
  inbox: (<><path d="M4 13 6.6 5h10.8L20 13" /><path d="M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5h-5a3 3 0 0 1-6 0z" /></>),
  chart: (<><path d="M4 4v16h16" /><path d="M8 16v-4M12.5 16V8M17 16v-6" /></>),
  clock: (<><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2" /></>),
  check: (<path d="M5 12.5 10 17l9-10" />),
  x: (<path d="M7 7l10 10M17 7 7 17" />),
  shield: (<><path d="M12 3 5 6v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6z" /><path d="M9.2 12 11 13.8 15 9.6" /></>),
  lock: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  burger: (<path d="M4 7h16M4 12h16M4 17h16" />),
};

function Icon({ name }: { name: string }) {
  return (
    <svg className="lp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="lp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ---------- nav ---------- */}
      <header className="lp-nav">
        <input type="checkbox" id="lp-nav-toggle" className="lp-nav-toggle" aria-hidden="true" />
        <div className="lp-wrap lp-nav-inner">
          <Link href="/" className="lp-brand" aria-label="Calmie ana sayfa">
            <span className="lp-logo" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3c-3.6 2.4-7 4.2-7 9 0 4 3.1 7 7 7s7-3 7-7c0-4.8-3.4-6.6-7-9z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round" /><path d="M9 13c.7 1.2 1.8 2 3 2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" /></svg>
            </span>
            Calmie
          </Link>
          <nav className="lp-links" aria-label="Birincil">
            <a href="#moduller">Modüller</a>
            <a href="#nasil">Nasıl çalışır</a>
            <a href="#ozellikler">Özellikler</a>
            <a href="#fiyat">Fiyat</a>
            <a href="#sss">SSS</a>
            <Link href="/giris" className="lp-links-login">Giriş yap</Link>
          </nav>
          <div className="lp-nav-cta">
            <Link href="/giris" className="lp-login">Giriş yap</Link>
            <Link href="/kayit" className="lp-btn lp-btn-primary">Ücretsiz dene</Link>
            <label htmlFor="lp-nav-toggle" className="lp-burger" aria-label="Menüyü aç/kapat"><Icon name="burger" /></label>
          </div>
        </div>
      </header>

      <main>
        {/* ---------- hero ---------- */}
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-grid">
            <div>
              <span className="lp-eyebrow">Klinik psikologlar için dijital klinik asistanı</span>
              <h1 className="lp-h1">
                A4’leri bırak. <em>Klinik aklını</em> dijitale taşı.
              </h1>
              <p className="lp-sub">
                Anamnezden vaka formülasyonuna, randevudan otomatik hatırlatmaya — tüm klinik sürecin
                tek panelde. <strong>Dosyalama yükünden kurtul</strong>, kazandığın zamanı danışanına
                ve kendi gelişimine ayır.
              </p>
              <div className="lp-cta-row">
                <Link href="/kayit" className="lp-btn lp-btn-primary lp-btn-lg">Ücretsiz dene</Link>
                <a href="#nasil" className="lp-btn lp-btn-ghost lp-btn-lg">Nasıl çalışır?</a>
              </div>
              <ul className="lp-badges">
                <li>✓ Kredi kartı gerekmez</li>
                <li>✓ KVKK uyumlu &amp; güvenli</li>
                <li>✓ Dakikalar içinde kurulum</li>
              </ul>
            </div>

            <div className="lp-hero-card" aria-hidden="true">
              <div className="lp-card-bar"><i /><i /><i /><span>calmie · danışan dosyası</span></div>
              <div className="lp-case-head">
                <div className="lp-case-id"><span className="lp-avatar">A.Y.</span><div><b>A. Yılmaz</b><small>32 · Anksiyete · 7. seans</small></div></div>
                <span className="lp-pill">Formülasyon hazır</span>
              </div>
              <div className="lp-cycle">
                <h4>Bozukluk döngüsü</h4>
                <svg viewBox="0 0 300 150" width="100%" height="132">
                  <defs><marker id="lp-ar" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#5B8C7A" /></marker></defs>
                  <path d="M82 38 C120 18 180 18 218 38" stroke="#5B8C7A" strokeWidth="1.6" fill="none" markerEnd="url(#lp-ar)" />
                  <path d="M238 56 C256 84 256 84 238 112" stroke="#5B8C7A" strokeWidth="1.6" fill="none" markerEnd="url(#lp-ar)" />
                  <path d="M218 128 C180 146 120 146 82 128" stroke="#5B8C7A" strokeWidth="1.6" fill="none" markerEnd="url(#lp-ar)" />
                  <path d="M62 112 C44 84 44 84 62 56" stroke="#5B8C7A" strokeWidth="1.6" fill="none" markerEnd="url(#lp-ar)" />
                  <g><circle cx="60" cy="40" r="22" fill="#fff" stroke="#2F5D50" strokeWidth="1.5" /><text x="60" y="44" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1C1B19">Tetikleyici</text></g>
                  <g><circle cx="240" cy="40" r="22" fill="#fff" stroke="#2F5D50" strokeWidth="1.5" /><text x="240" y="44" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1C1B19">Düşünce</text></g>
                  <g><circle cx="240" cy="124" r="22" fill="#fff" stroke="#2F5D50" strokeWidth="1.5" /><text x="240" y="128" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1C1B19">Davranış</text></g>
                  <g><circle cx="60" cy="124" r="22" fill="#fff" stroke="#2F5D50" strokeWidth="1.5" /><text x="60" y="128" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1C1B19">Duygu</text></g>
                </svg>
              </div>
              <div className="lp-mini-row">
                <div className="lp-mini"><small>Sonraki seans</small><b>24 Haz · 14:00</b></div>
                <div className="lp-mini"><small>Ruh hâli</small><b>6.4 / 10</b></div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- trust strip ---------- */}
        <div className="lp-strip">
          <div className="lp-wrap lp-strip-inner">
            <span>Dört ekolden ortak bir dil:</span>
            <strong>BDT</strong><i /><strong>ACT</strong><i /><strong>Şema Terapi</strong><i /><strong>Psikodinamik</strong>
          </div>
        </div>

        {/* ---------- problem / agitation ---------- */}
        <section className="lp-block lp-pain-sec">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <p className="lp-kicker">Tanıdık geldi mi?</p>
              <h2>Hâlâ kağıtla mı yönetiyorsun?</h2>
              <p className="lp-lead">A4’ler, klasörler ve dağınık notlar terapiye ayıracağın enerjiyi yiyor. İşte her hafta tekrarlayan dört yorgunluk:</p>
            </div>
            <div className="lp-pains">
              {PAINS.map((p) => (
                <article className="lp-pain" key={p.t}>
                  <span className="lp-pain-x"><Icon name="x" /></span>
                  <div><h3>{p.t}</h3><p>{p.d}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- before / after contrast ---------- */}
        <section className="lp-block lp-vs-sec">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <p className="lp-kicker">Kağıttan dijitale</p>
              <h2>Aynı işi yarı zamanda yap</h2>
              <p className="lp-lead">Eski A4 düzeniyle dijital klinik asistanı arasındaki fark, her danışan dosyasında kendini gösterir.</p>
            </div>
            <div className="lp-vs">
              <div className="lp-vs-card lp-vs-old">
                <span className="lp-vs-tag">Eski düzen · A4 &amp; Excel</span>
                <h3>Kağıt yığını</h3>
                <ul>
                  {OLD_WAY.map((t) => (<li key={t}><Icon name="x" />{t}</li>))}
                </ul>
              </div>
              <div className="lp-vs-card lp-vs-new">
                <span className="lp-vs-tag">Calmie ile</span>
                <h3>Dijital klinik asistanı</h3>
                <ul>
                  {NEW_WAY.map((t) => (<li key={t}><Icon name="check" />{t}</li>))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- modules ---------- */}
        <section className="lp-block" id="moduller">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <p className="lp-kicker">Tek panel</p>
              <h2>Klinik akışının her adımı tek yerde</h2>
              <p className="lp-lead">Dağınık notlar, ayrı takvimler, kayıp hatırlatmalar yok. Calmie danışan dosyasını uçtan uca toparlar.</p>
            </div>
            <div className="lp-grid">
              {MODULES.map((m) => (
                <article className="lp-mod" key={m.t}>
                  <span className="lp-mod-ic"><Icon name={m.i} /></span>
                  <h3>{m.t}</h3>
                  <p>{m.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- how it works ---------- */}
        <section className="lp-block lp-how" id="nasil">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <p className="lp-kicker">Nasıl çalışır</p>
              <h2>Üç adımda kurulu bir danışan dosyası</h2>
            </div>
            <ol className="lp-steps">
              <li><span className="lp-num">01</span><h3>Danışanını ekle</h3><p>Kaydı sen tutma — temel bilgileri ve dosya kurulumunu Calmie senin için halleder. Dosya, durum odaklı bir akışla anında hazır.</p></li>
              <li><span className="lp-num">02</span><h3>Anamnez &amp; formülasyonu kur</h3><p>Yapılandırılmış anamnezi doldur, bozukluk döngüsünü çıkar, vakayı ekol diliyle formüle et.</p></li>
              <li><span className="lp-num">03</span><h3>Paylaş &amp; raporla</h3><p>Danışanınla çıkarımları, ölçekleri, onam formlarını ve süreç ilerleme raporunu paylaş.</p></li>
            </ol>
          </div>
        </section>

        {/* ---------- features ---------- */}
        <section className="lp-block" id="ozellikler">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <p className="lp-kicker">Özellikler</p>
              <h2>Klinik düşünceyi görünür kılan araçlar</h2>
              <p className="lp-lead">Calmie not tutmaktan fazlasını yapar — vakayı anlamana, ilişkilendirmene ve aktarmana yardım eder.</p>
            </div>
            <div className="lp-feats">
              <article className="lp-feat"><span className="lp-feat-ic"><Icon name="cycle" /></span><h3>Bozukluk döngüsünü görselleştir</h3><p>Tetikleyici, düşünce, duygu ve davranış arasındaki kısır döngüyü interaktif haritada kur. 4P, Beck ve ACT Hexaflex görünümleriyle.</p></article>
              <article className="lp-feat"><span className="lp-feat-ic"><Icon name="file" /></span><h3>Anamnezden özet sunuma kesintisiz</h3><p>Girdiğin her alan otomatik olarak özet sunuma yansır. Dağınık dosyalar yerine danışan için tek, bütüncül bir görünüm; PDF olarak dışa aktar.</p></article>
              <article className="lp-feat"><span className="lp-feat-ic"><Icon name="bell" /></span><h3>Randevuyu kaçırma, saatini boşa harcama</h3><p>Takvimin macOS ile senkron; randevu yaklaşınca danışana otomatik SMS gider. Daha az iptal, daha dolu bir ajanda.</p></article>
            </div>
          </div>
        </section>

        {/* ---------- value / gains ---------- */}
        <section className="lp-block lp-gain-sec">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <p className="lp-kicker">Sana ne kazandırır?</p>
              <h2>Yazılım değil, geri kazanılan zaman</h2>
            </div>
            <p className="lp-roi">Tek bir kaçan randevu, çoğu zaman <em>bir aylık üyelikten</em> daha pahalı.</p>
            <div className="lp-gains">
              {GAINS.map((g) => (
                <article className="lp-gain" key={g.t}>
                  <span className="lp-gain-ic"><Icon name={g.i} /></span>
                  <h3>{g.t}</h3>
                  <p>{g.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- stats ---------- */}
        <section className="lp-block lp-statwrap">
          <div className="lp-wrap">
            <div className="lp-stats">
              <div><b>4</b><span>terapi ekolü, ortak dil</span></div>
              <div><b>6</b><span>çekirdek klinik modül</span></div>
              <div><b>%100</b><span>KVKK uyumlu altyapı</span></div>
              <div><b>0</b><span>dağınık not, kayıp dosya</span></div>
            </div>
          </div>
        </section>

        {/* ---------- pricing ---------- */}
        <section className="lp-block lp-price-sec" id="fiyat">
          <div className="lp-wrap">
            <div className="lp-sec-head">
              <p className="lp-kicker">Fiyatlandırma</p>
              <h2>Basit, tek plan</h2>
              <p className="lp-lead">Karmaşık paket yok. Tek bir üyelik — kağıt yığını değil, kazanılan zaman.</p>
            </div>
            <div className="lp-pricing">
              <div className="lp-price-card">
                <span className="lp-price-name">Calmie · Klinik Asistan</span>
                <div className="lp-price-amt">₺{PRICE_MONTHLY}<small> / ay</small></div>
                <p className="lp-price-year">Yıllık ödemede ₺{PRICE_YEARLY} — 2 ay bedava</p>
                <ul className="lp-price-list">
                  {PLAN_FEATURES.map((f) => (<li key={f}><Icon name="check" />{f}</li>))}
                </ul>
                <Link href="/kayit" className="lp-btn lp-btn-primary lp-btn-lg">Ücretsiz dene</Link>
                <p className="lp-price-note">Kredi kartı gerekmez · İstediğin an iptal et</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- trust statement ---------- */}
        <section className="lp-block lp-trust-sec">
          <div className="lp-wrap lp-trustwrap">
            <p className="lp-trust-statement">
              Calmie’ye geçen uzmanlar dosyalama yükünden kurtuluyor, raporlamayı saniyelere indiriyor;
              kazandıkları zamanı danışanlarına ve kendi mesleki gelişimlerine ayırıyor.
            </p>
            <div className="lp-trust-row">
              {TRUST.map((t) => (<span key={t.t}><Icon name={t.i} />{t.t}</span>))}
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="lp-block lp-faq" id="sss">
          <div className="lp-wrap lp-faq-wrap">
            <div className="lp-sec-head">
              <p className="lp-kicker">SSS</p>
              <h2>Sık sorulan sorular</h2>
            </div>
            <div className="lp-faq-list">
              {FAQ.map((f) => (
                <details className="lp-faq-item" key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- final CTA ---------- */}
        <section className="lp-block lp-final">
          <div className="lp-wrap">
            <div className="lp-final-card">
              <h2>Kağıtla bir hafta daha mı, bugün kurulan düzen mi?</h2>
              <p>Calmie’yi ücretsiz dene. Dosyalama yükünü bırak; kazandığın zamanı danışanına ve kendine ayır.</p>
              <div className="lp-cta-row lp-center">
                <Link href="/kayit" className="lp-btn lp-btn-primary lp-btn-lg">Ücretsiz dene</Link>
                <Link href="/giris" className="lp-btn lp-btn-ghost lp-btn-lg">Giriş yap</Link>
              </div>
              <p className="lp-note">Kredi kartı gerekmez · KVKK uyumlu · İstediğin an iptal et</p>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- footer ---------- */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-foot-grid">
          <div>
            <span className="lp-brand"><span className="lp-logo" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3c-3.6 2.4-7 4.2-7 9 0 4 3.1 7 7 7s7-3 7-7c0-4.8-3.4-6.6-7-9z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round" /></svg></span>Calmie</span>
            <p className="lp-foot-desc">Klinik psikologlar için dijital klinik asistanı — sade, güvenli, bütüncül.</p>
          </div>
          <nav aria-label="Ürün"><h4>Ürün</h4><a href="#moduller">Modüller</a><a href="#nasil">Nasıl çalışır</a><a href="#ozellikler">Özellikler</a><a href="#fiyat">Fiyat</a><Link href="/kayit">Ücretsiz dene</Link></nav>
          <nav aria-label="Şirket"><h4>Şirket</h4><a href="#sss">SSS</a><Link href="/giris">Giriş yap</Link></nav>
          <nav aria-label="Yasal"><h4>Yasal</h4><a href="#">KVKK</a><a href="#">Gizlilik Politikası</a><a href="#">Kullanım Koşulları</a></nav>
        </div>
        <div className="lp-wrap lp-foot-bottom">
          <small>© 2026 Calmie. Tüm hakları saklıdır.</small>
        </div>
      </footer>
    </div>
  );
}
