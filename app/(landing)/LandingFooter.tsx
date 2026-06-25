import Link from 'next/link';

// Çok-sayfalı landing footer'ı — ürün/şirket bağlantıları artık ayrı route'lar.
export default function LandingFooter() {
  return (
    <div className="footwrap">
      <footer>
        <div className="foot-grid">
          <div className="foot-brand">
            <Link href="/" className="logo">
              Calmie<i>.</i>
            </Link>
            <p>
              İşini profesyonel boyutta yapmak isteyen herkes için dijital klinik asistanı — sade, güvenli,
              bütüncül.
            </p>
          </div>
          <div className="foot-col">
            <h4>Ürün</h4>
            <Link href="/moduller">Modüller</Link>
            <Link href="/nasil-calisir">Nasıl çalışır</Link>
            <Link href="/ozellikler">Özellikler</Link>
            <Link href="/fiyat">Fiyat</Link>
            <Link href="/kayit">Kapalı betaya giriş kodu iste</Link>
          </div>
          <div className="foot-col">
            <h4>Şirket</h4>
            <Link href="/sss">SSS</Link>
            <Link href="/giris">Giriş yap</Link>
          </div>
          <div className="foot-col">
            <h4>Yasal</h4>
            <a href="#">KVKK</a>
            <a href="#">Gizlilik Politikası</a>
            <a href="#">Kullanım Koşulları</a>
          </div>
        </div>
        <div className="foot-bottom">
          <small>© 2026 Calmie. Tüm hakları saklıdır.</small>
          <div className="foot-legal">
            <a href="#">KVKK</a>
            <a href="#">Gizlilik Politikası</a>
            <a href="#">Kullanım Koşulları</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
