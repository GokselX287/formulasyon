'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './cocukKoruma.css';

// ──────────────────────────────────────────────────────────────────────────
// Çocuk Koruma & Bildirim Protokolü — "Klinik Editöryel Dosya" · v2 port.
// Statik referans: uyarı işaretleri · adım adım protokol · kontrol listesi
// (yerel interaktif) · acil iletişim · yasal not. Yazdır.
// ──────────────────────────────────────────────────────────────────────────

const SIGNS = [
  { t: 'Fiziksel işaretler', d: 'Açıklanamayan/örüntülü morluk, yanık, tekrarlayan yaralanma; yaşa uygunsuz açıklama.' },
  { t: 'Davranışsal değişim', d: 'Ani içe kapanma, saldırganlık, regresyon, okuldan/eve gitmekten kaçınma.' },
  { t: 'Cinsel içerikli ipucu', d: 'Yaşına uygunsuz cinsel bilgi/dil/oyun; bedensel temasa aşırı tepki.' },
  { t: 'İhmal göstergeleri', d: 'Sürekli bakımsızlık, açlık, uygunsuz giyim, kronik tıbbi/okul takipsizliği.' },
  { t: 'Duygusal istismar', d: 'Aşağılanma, sürekli korku, koşullu sevgi; düşük öz-değer ve kaygı.' },
  { t: 'Açıklama (disclosure)', d: 'Çocuğun doğrudan ya da dolaylı anlatımı — en güçlü işaret; ciddiye al.' },
];
const STEPS = [
  { urgent: true, t: 'Acil tehlikeyi değerlendir', d: 'Çocuk şu an fiziksel tehlikede mi? Hayati risk varsa önce güvenliği sağla.', warn: 'Hayati risk → 112 / 155' },
  { t: 'Sakin kal, çocuğu yönlendirme', d: 'Açıklama varsa kesme, yargılama, sorgu yapma. Çocuğun kelimelerini kullan; söz verme ("kimseye söylemem" deme).' },
  { t: 'Birebir, ayrıntılı kayıt tut', d: 'Tarih/saat, çocuğun ifadesi (aynen), gözlemlenen işaretler, bağlam. Yorum değil gözlem yaz.' },
  { urgent: true, t: 'Bildirim yükümlülüğünü yerine getir', d: 'Makul şüphe bildirim için yeterlidir; ispat senin görevin değil. ALO 183 / Çocuk İzlem Merkezi / Cumhuriyet Savcılığı.', warn: 'Bildirim yasal zorunluluk (TCK 279)' },
  { t: 'Süpervizör & gerekirse aileyle çalış', d: 'Süreci süpervizöre taşı. Bildirim sonrası aile/kurumla iletişimi mevzuata göre yürüt; çocuğun üstün yararı esas.' },
  { t: 'Kendi öz-bakımını ihmal etme', d: 'Bu vakalar terapist için de örseleyicidir. Süpervizyon ve kişisel destek al.' },
];
const CHECKS = [
  { t: 'Çocuğun güvenliği şu an sağlandı mı?', s: 'Acil tehlike yoksa onay; varsa 112/155.' },
  { t: 'Çocuğun ifadesi aynen kaydedildi mi?', s: 'Yorum eklemeden, tarih/saatle.' },
  { t: 'Gözlemlenen işaretler belgelendi mi?', s: 'Fiziksel/davranışsal, mümkünse görselsiz tarif.' },
  { t: 'Bildirim yapıldı / planlandı mı?', s: 'ALO 183 ya da savcılık; tarih-saat not edildi.' },
  { t: 'Süpervizör bilgilendirildi mi?', s: 'Vaka süpervizyona taşındı.' },
  { t: 'Aile iletişimi mevzuata göre ele alındı mı?', s: 'Çocuğun üstün yararı gözetilerek.' },
];
const CONTACTS = [
  { hot: true, l: 'Acil yardım', v: '112', d: 'Hayati tehlike — sağlık/itfaiye.' },
  { hot: true, l: 'Polis imdat', v: '155', d: 'Aktif tehlike / suç durumu.' },
  { l: 'Sosyal Hizmet', v: 'ALO 183', d: 'Çocuk, kadın, aile sosyal destek hattı — bildirim.' },
  { l: 'Çocuk İzlem Merkezi', v: 'ÇİM', d: 'İl hastanesi bünyesi — istismar değerlendirme.' },
];

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Takvim & Randevular', target: 'calendar' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

export default function CocukKorumaProtokolPage() {
  const router = useRouter();
  const [done, setDone] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setDone((prev) => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  const nav = (target: string) => router.push(target === 'home' ? '/' : `/uygulama?tab=${target}`);
  let n = 0; const sn = () => String(++n).padStart(2, '0');

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&display=swap" rel="stylesheet" />

      <div className="ck2">
        <div className="shell">
          <div className="topbar">
            <button className="back" type="button" onClick={() => router.push('/uygulama?tab=calisma-alani')}><span className="chev">‹</span>Çalışma Alanı</button>
            <button className="tb-print" type="button" onClick={() => window.print()}><svg viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z" /></svg>Yazdır</button>
          </div>

          <div className="modal-body">
            <div className="hero">
              <div className="hero-in">
                <span className="eyebrow">Referans Protokol · Çocuk Koruma</span>
                <h1>Çocuk koruma &amp; bildirim protokolü</h1>
                <p>Çocuk ihmal/istismar şüphesinde izlenecek adımlar. Şüphe halinde değerlendirme senin, ama <b>bildirim yasal bir yükümlülüktür</b>. Bu sayfa hızlı başvuru içindir; tereddütte süpervizöre danış.</p>
                <div className="ref"><span>Türk Ceza Kanunu m.279</span><span>Çocuk Koruma Kanunu</span><span>ALO 183</span></div>
              </div>
            </div>

            <div className="wrap">
              <section className="section">
                <div className="sec-head"><span className="no">{sn()}</span><div><h2>Uyarı işaretleri</h2><p>Tek bir işaret tanı koymaz; örüntü ve bağlam değerlendirilir.</p></div></div>
                <div className="signs">{SIGNS.map((s, i) => <div className="sign" key={i}><div className="st">dikkat</div><h3>{s.t}</h3><p>{s.d}</p></div>)}</div>
              </section>

              <section className="section">
                <div className="sec-head"><span className="no">{sn()}</span><div><h2>Adım adım protokol</h2><p>Şüphe anından bildirim ve sonrasına kadar izlenecek sıra.</p></div></div>
                <div className="steps">{STEPS.map((s, i) => (
                  <div className={`pstep${s.urgent ? ' urgent' : ''}`} key={i}><div className="pn">{i + 1}</div><div className="pc"><h3>{s.t}</h3><p>{s.d}</p>{s.warn && <span className="warn">{s.warn}</span>}</div></div>
                ))}</div>
              </section>

              <section className="section">
                <div className="sec-head"><span className="no">{sn()}</span><div><h2>Vaka kontrol listesi</h2><p>İşaretledikçe ilerleme güncellenir; bu sayfada yalnızca senin için.</p></div></div>
                <div className="checklist">
                  {CHECKS.map((c, i) => (
                    <div className={`check${done.has(i) ? ' on' : ''}`} key={i} onClick={() => toggle(i)}>
                      <span className="cb"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg></span>
                      <span className="ct">{c.t}<span>{c.s}</span></span>
                    </div>
                  ))}
                  <div className="checkbar"><span>tamamlanan adım</span><b><span className="num">{done.size}</span> / {CHECKS.length}</b></div>
                </div>
              </section>

              <section className="section">
                <div className="sec-head"><span className="no">{sn()}</span><div><h2>Acil iletişim</h2><p>Bildirim ve acil durum hatları.</p></div></div>
                <div className="contacts">{CONTACTS.map((c, i) => <div className={`contact${c.hot ? ' hot' : ''}`} key={i}><div className="cl">{c.l}</div><div className="cv">{c.v}</div><div className="cd">{c.d}</div></div>)}</div>
                <div className="legalnote"><p><b>Hatırlatma:</b> Bildirim için suçun kanıtlanması gerekmez; <b>makul şüphe yeterlidir</b> ve bildirmemek TCK m.279 kapsamında suçtur. Çocuğun üstün yararı her durumda önceliklidir. Tereddütte süpervizöre ve kurum hukuk birimine danış.</p></div>
              </section>
            </div>
            <div className="tail"><p>Referans amaçlıdır · klinik karar ve yerel mevzuat önceliklidir · son güncelleme 2026</p></div>
          </div>

          <nav className="dock" aria-label="Bölümler">
            {DOCK.map((d) => (
              <a key={d.target} href="#" className={d.active ? 'active' : ''} onClick={(e) => { e.preventDefault(); if (!d.active) nav(d.target); }}>{d.label}</a>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
