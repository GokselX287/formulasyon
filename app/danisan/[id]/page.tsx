'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './danisanAcilis.css';

// ──────────────────────────────────────────────────────────────────────────
// Danışan dosyası açılışı — iki kutu: Danışan Profili + Klinik Formülasyon.
// Terapist istediği görünümden ilerler. "Klinik Editöryel Dosya" dili (.dac).
// ──────────────────────────────────────────────────────────────────────────

export default function DanisanAcilisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState('');
  const [meta, setMeta] = useState<{ issue?: string; sessionCount?: number }>({});

  useEffect(() => {
    fetch(`/api/clients/${id}`).then((r) => r.json()).then((c) => {
      if (c && !c.error) { setName(c.adSoyad ?? c.name ?? ''); setMeta({ issue: c.sunumSorunu ?? c.issue ?? '' }); }
    }).catch(() => {});
  }, [id]);

  const initials = (n: string) => n.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '—';

  const CARDS = [
    {
      key: 'profil', no: '01', title: 'Danışan Profili',
      desc: 'Seans kayıtları, sorun & hedef, esneklik, ACT matrisi, terapi hedefleri ve hikâye — danışanın bütün dosyası.',
      go: 'Profili aç', onClick: () => router.push(`/profil/${id}`),
      icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    },
    {
      key: 'formulasyon', no: '02', title: 'Klinik Formülasyon',
      desc: 'Vakanın çekirdeği — 4P (vakanın dört penceresi), ACT Hexaflex, bozukluk döngüsü, vaka haritası, değer kartları ve şablonlar.',
      go: 'Formülasyonu aç', onClick: () => router.push(`/?tab=formulation&client=${id}`),
      icon: <><path d="M12 2a7 7 0 0 0-4 12.7V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.3A7 7 0 0 0 12 2z" /><path d="M9 22h6" /></>,
    },
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="dac">
        <div className="dac-shell">
          <div className="dac-topbar">
            <button className="dac-back" type="button" onClick={() => router.push('/?tab=calisma-alani')}><span className="chev">‹</span>Danışanlar</button>
          </div>

          <div className="dac-body">
            <header className="dac-intro">
              <span className="dac-av">{initials(name)}</span>
              <div>
                <span className="dac-eyebrow">Danışan dosyası</span>
                <h1 className="dac-name">{name || '—'}</h1>
                {meta.issue ? <p className="dac-issue">{String(meta.issue).split(/[,،]/)[0].trim()}</p> : null}
              </div>
            </header>
            <p className="dac-lead">Nereden ilerlemek istersin? İki görünüm de bu danışana ait — dilediğini seç.</p>

            <div className="dac-cards">
              {CARDS.map((c) => (
                <button key={c.key} type="button" className={`dac-card ${c.key}`} onClick={c.onClick}>
                  <span className="dac-no">{c.no}</span>
                  <span className="dac-icon"><svg viewBox="0 0 24 24">{c.icon}</svg></span>
                  <div className="dac-title">{c.title}</div>
                  <p className="dac-desc">{c.desc}</p>
                  <div className="dac-foot"><span className="dac-go">{c.go}</span><span className="dac-arrow"><svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
