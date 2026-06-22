'use client';

import { useState } from 'react';
import './TakvimRandevular.css';

// ──────────────────────────────────────────────────────────────────────────
// Web Siten — Takvim'den çıkarılıp Çalışma Alanı kutusu olarak sunulur.
// Takvim'in .tkv/.trv panel stillerini gömülü (.tkv-embed) kullanır.
// Şablon seçimi localStorage'da (calmie_site_template) — Takvim'deki ile aynı.
// ──────────────────────────────────────────────────────────────────────────

const lsGet = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };

const SITE_TEMPLATES = [
  { key: 'huzur', name: 'Huzur', desc: 'Yumuşak pastel mesh, havadar, sakin.', prev: 'linear-gradient(135deg,#E8EAF7,#EDE6F4 58%,#FBE7DC)' },
  { key: 'klinik', name: 'Klinik', desc: 'Krem editöryel, güçlü tipografi.', prev: 'linear-gradient(135deg,#F6EFD9,#EFEDE8)' },
  { key: 'sinematik', name: 'Sinematik', desc: 'Dokulu koyu hero, büyük başlık.', prev: 'linear-gradient(135deg,#2C2C33,#46587C)' },
  { key: 'sicak', name: 'Sıcak', desc: 'Toprak tonları, portre öncelikli.', prev: 'linear-gradient(135deg,#FBE7DC,#DFF0E5)' },
  { key: 'sade', name: 'Sade', desc: 'Ultra-minimal, bol boşluk, mono vurgu.', prev: 'linear-gradient(135deg,#EFEDE8,#FFFFFF)' },
];

export default function WebSitesiPanel({ onBack }: { onBack?: () => void }) {
  const [siteTemplate, setSiteTemplate] = useState<string | null>(() => lsGet('calmie_site_template'));
  const pickTemplate = (k: string) => { setSiteTemplate(k); try { localStorage.setItem('calmie_site_template', k); } catch {} };

  return (
    <div className="tkv tkv-embed">
      <div className="trv trv-pane">
        <main>
          <button type="button" className="tkv-embed-back" onClick={() => onBack?.()}>‹ Çalışma Alanı</button>
          <div className="panel" data-screen-label="Web Sitesi">
            <div className="panel-head"><div className="ph-l"><h1 className="ph-title">Web Siten</h1><p className="ph-sub">Calmie estetiğiyle, dakikalar içinde klinik web siteni kur — 5 hazır şablondan seç.</p></div></div>
            <div className="site-grid">
              <div className="site-main">
                <div className="site-intro">
                  <span className="eyebrow">başlangıç</span>
                  <h2 className="si-title">Kendi klinik web siteni kur.</h2>
                  <p className="si-desc">Sürükle-bırak yok — şablonunu seç, içeriğini doldur, yayınla. Çalışma saatlerin <b>Müsaitlik</b>'ten, “Randevu al” bağlantın <b>online ön-form</b>dan, ad ve portren <b>Profil</b>'den otomatik gelir.</p>
                  <div className="site-addr"><span className="sa-k">adres</span><span className="sa-v mono">calmie.site/dr-goksel</span></div>
                </div>
                <div className="tmpl-head"><span className="eyebrow">şablon seç</span><span className="eyebrow">{SITE_TEMPLATES.length} şablon</span></div>
                <div className="tmpl-grid">
                  {SITE_TEMPLATES.map((t) => (
                    <button key={t.key} type="button" className={`tmpl-card ${siteTemplate === t.key ? 'on' : ''}`} onClick={() => pickTemplate(t.key)}>
                      <span className="tc-prev" style={{ background: t.prev }} aria-hidden="true" />
                      <span className="tc-name">{t.name}</span>
                      <span className="tc-desc">{t.desc}</span>
                      <span className="tc-pick">{siteTemplate === t.key ? 'Seçildi ✓' : 'Seç'}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="site-side">
                <div className="side-card">
                  <span className="eyebrow">durum</span>
                  {siteTemplate ? (
                    <>
                      <div className="ss-row"><span className="ss-k">Şablon</span><span className="ss-v">{SITE_TEMPLATES.find((t) => t.key === siteTemplate)?.name}</span></div>
                      <div className="ss-row"><span className="ss-k">Yayın</span><span className="ss-v off">taslak</span></div>
                      <p className="ss-note">İçerik düzenleme ve yayın akışı tasarım aşamasında — şablon seçimin kaydedildi.</p>
                    </>
                  ) : (
                    <p className="ss-note">Henüz şablon seçilmedi. Soldan bir şablon seçerek başla.</p>
                  )}
                </div>
                <div className="side-card">
                  <span className="eyebrow">site içeriği · otomatik</span>
                  <ul className="site-feed">
                    <li><span>Çalışma saatleri</span><b>Müsaitlik'ten</b></li>
                    <li><span>Randevu butonu</span><b>online ön-form</b></li>
                    <li><span>Ad &amp; portre</span><b>Profil'den</b></li>
                    <li><span>İletişim</span><b>ayarlardan</b></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
