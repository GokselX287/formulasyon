'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ──────────────────────────────────────────────────────────────────────────
// Danışan Dosyası — sade, süreç-sekmeli kabuk (editöryel kartlar).
// Anamnez ZORUNLU ve KAPI: doldurulmadan diğer sekmeler kilitli.
// Anamnez dolduğunda bu sekme doldurulmuş formun ÖZETİNİ sunar; diğer alanlar
// (değerlendirme, görüşmeler...) oradan açılıp doldurulabilir.
// ──────────────────────────────────────────────────────────────────────────

type PageProps = { params: Promise<{ id: string }> };

const INK = '#0E0F12';
const SOFT = '#6B7280';
const FAINT = '#9CA3AF';
const LINE = '#E7E5E0';
const PAPER = '#FBFAF7';
const ACCENT = '#604B75';

const initials = (n: string) =>
  (n || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toLocaleUpperCase('tr')).join('.') + '.';

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif', intake: 'İlk görüşme', passive: 'Pasif', follow: 'Takipte', dropped: 'Ayrıldı',
};

// Anamnez alan etiketleri (önemli + güvenli alanlar; intihar/risk özetten gizli)
const ANAMNEZ_LABELS: Record<string, string> = {
  basvuruNedeni: 'Başvuru nedeni', nasilBuldu: 'Nasıl buldu', anaGikayet: 'Ana şikayet',
  baslangicTarihi: 'Başlangıç', tetikleyiciOlay: 'Tetikleyici olay', gunlukYasamaEtkisi: 'Günlük yaşama etkisi',
  otomatikDusunceler: 'Otomatik düşünceler', kacinanDurumlar: 'Kaçınılan durumlar', baskinDuygular: 'Baskın duygular',
  aileDinamikleri: 'Aile dinamikleri', cocuklukDeneyimleri: 'Çocukluk deneyimleri', onemliYasamOlaylari: 'Önemli yaşam olayları',
  tibbTanilar: 'Tıbbi tanılar', kullanilanIlaclar: 'Kullanılan ilaçlar', medeniDurum: 'Medeni durum',
  calismaYasam: 'Çalışma / yaşam', sosyalDestek: 'Sosyal destek', gucluYonler: 'Güçlü yönler',
};
const HIDE_KEYS = new Set(['intiharGecmis', 'intiharSuanki', 'intiharDetay', 'maddeKullanimi', 'oncekiPsikiyatrikTani']);

function humanize(k: string) {
  const s = k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
}

// Düz veya bölümlü anamnez objesini { label, value } listesine indirir
function anamnezOzet(data: any): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const push = (key: string, val: any) => {
    if (HIDE_KEYS.has(key)) return;
    let s = '';
    if (Array.isArray(val)) s = val.filter(Boolean).join(', ');
    else if (typeof val === 'string') s = val.trim();
    else return;
    if (!s) return;
    out.push({ label: ANAMNEZ_LABELS[key] ?? humanize(key), value: s });
  };
  for (const [k, v] of Object.entries(data || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [k2, v2] of Object.entries(v)) push(k2, v2);
    } else push(k, v);
  }
  return out;
}

type StepKey = 'anamnez' | 'degerlendirme' | 'gorusmeler' | 'ilerleme' | 'rapor' | 'sunum';

const ICONS: Record<StepKey, React.ReactNode> = {
  anamnez: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" /></>,
  degerlendirme: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  gorusmeler: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
  ilerleme: <><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></>,
  rapor: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  sunum: <><path d="M4 5h16v11H4z" /><path d="M12 16v4M8 20h8M9 10l2 2 4-4" /></>,
};

export default function DanisanDosyasi({ params }: PageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const [active, setActive] = useState<StepKey>('anamnez');
  const [c, setC] = useState<any>(null);
  const [anamnezData, setAnamnezData] = useState<any>(null);
  const [maturity, setMaturity] = useState(0);
  const [seansCount, setSeansCount] = useState(0);
  const [hasScores, setHasScores] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cl, a, p] = await Promise.all([
          fetch(`/api/clients/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`/api/anamnez/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`/api/formulations/${id}/panel`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        if (!alive) return;
        setC(cl);
        setAnamnezData(a && typeof a === 'object' ? a : {});
        if (p) {
          setMaturity(Number(p.maturity ?? 0));
          setSeansCount(Number(p?.sessionTimeline?.length ?? 0));
          setHasScores(Array.isArray(p?.sessionTimeline) && p.sessionTimeline.length > 0);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const ozet = anamnezOzet(anamnezData);
  const anamnezDone = ozet.length > 0;

  const name = c?.alias ?? c?.name ?? c?.adSoyad ?? '';
  const age = c?.age ?? c?.yas ?? null;
  const issue = c?.sunumSorunu ?? c?.issue ?? '';
  const nextSession = c?.nextSession ?? null;
  const phone = c?.telefon ?? '';
  const status = c?.status ?? 'intake';
  const kod = name ? initials(name) : 'Danışan';
  const locked = (k: StepKey) => !anamnezDone && k !== 'anamnez';

  const TABS: { key: StepKey; no: string; label: string; done: boolean }[] = [
    { key: 'anamnez', no: '01', label: 'Anamnez', done: anamnezDone },
    { key: 'degerlendirme', no: '02', label: 'Değerlendirme', done: maturity > 0 },
    { key: 'gorusmeler', no: '03', label: 'Görüşmeler', done: seansCount > 0 },
    { key: 'ilerleme', no: '04', label: 'İlerleme', done: hasScores },
    { key: 'rapor', no: '05', label: 'Rapor', done: maturity > 0 },
    { key: 'sunum', no: '06', label: 'Vaka Sunumu', done: false },
  ];

  const PANELS: Record<StepKey, { eyebrow: string; title: string; status: string; action: string; href: string }> = {
    anamnez: { eyebrow: 'tanışma & geçmiş', title: 'Anamnez', status: '', action: anamnezDone ? 'Anamnezi düzenle' : 'Anamnezi doldur', href: `/clients/${id}/anamnez` },
    degerlendirme: { eyebrow: 'sorunu anlama', title: 'Değerlendirme', status: `Formülasyon olgunluğu %${maturity}. Sorunun kökleri, döngü, esneklik ve değerler.`, action: 'Değerlendirmeyi aç', href: `/uygulama?tab=formulation&client=${id}` },
    gorusmeler: { eyebrow: 'seans notları & ödev', title: 'Görüşmeler', status: seansCount > 0 ? `${seansCount} görüşme kaydı.` : 'Henüz görüşme kaydı yok.', action: 'Görüşmeleri aç', href: `/profil/${id}?focus=seanslar` },
    ilerleme: { eyebrow: 'ölçek & izlem', title: 'İlerleme', status: hasScores ? 'Ölçek puanları ve zaman çizelgesi.' : 'Henüz ölçek verisi yok.', action: 'İlerlemeyi gör', href: `/profil/${id}` },
    rapor: { eyebrow: 'bütünleşik', title: 'Rapor', status: 'Dosyanın tüm bölümlerinin okunur özeti.', action: 'Raporu aç', href: `/profil/${id}` },
    sunum: { eyebrow: 'danışana', title: 'Vaka Sunumu', status: 'Danışana sunulabilir, sade özet (PDF / SMS ile link).', action: 'Vaka sunumunu aç', href: `/uygulama?tab=formulation&client=${id}` },
  };

  const p = PANELS[active];
  const cardShadow = '0 1px 2px rgba(16,17,20,.04), 0 14px 34px -18px rgba(16,17,20,.22)';
  const isAnamnez = active === 'anamnez';

  const Chip = ({ children }: { children: React.ReactNode }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 999, padding: '5px 11px', fontSize: 12.5, color: SOFT }}>{children}</span>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(120% 120% at 50% 0%, #F6F5F1 0%, #EFEDE8 60%, #E9E7E1 100%)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '22px 18px 56px' }}>
        <button onClick={() => router.push('/uygulama?tab=calisma-alani&room=danisanlar')} style={{ border: 'none', background: 'transparent', color: SOFT, fontSize: 13, cursor: 'pointer', padding: '4px 0' }}>‹ Danışanlar</button>

        {/* Başlık kartı */}
        <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 24, padding: '22px 24px', boxShadow: cardShadow, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <span style={{ width: 54, height: 54, borderRadius: 16, background: 'linear-gradient(140deg,#EDE6F4,#E3DCEF)', color: ACCENT, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 17, flexShrink: 0 }}>{kod}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, letterSpacing: '.18em', textTransform: 'uppercase', color: FAINT }}>Danışan Dosyası</div>
              <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 600, fontSize: 27, margin: '3px 0 0', color: INK, lineHeight: 1.1 }}>
                {name || 'Danışan'}{age ? <span style={{ fontSize: 15, color: SOFT, fontWeight: 400 }}> · {age} yaş</span> : null}
              </h1>
              {issue && <p style={{ color: SOFT, fontSize: 14, margin: '6px 0 0', lineHeight: 1.5 }}>{issue}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 13 }}>
                <Chip><span style={{ width: 7, height: 7, borderRadius: '50%', background: status === 'active' ? '#16A34A' : status === 'passive' || status === 'dropped' ? '#9CA3AF' : '#D97706' }} />{STATUS_LABEL[status] ?? status}</Chip>
                {nextSession && <Chip>📅 {nextSession}</Chip>}
                {phone && <Chip>☎ {phone}</Chip>}
              </div>
            </div>
          </div>
        </div>

        {/* Süreç sekmeleri */}
        <nav style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '18px 0 0', paddingBottom: 2 }}>
          {TABS.map((t) => {
            const lk = locked(t.key);
            const on = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => !lk && setActive(t.key)}
                disabled={lk}
                style={{
                  border: `1px solid ${on ? INK : LINE}`, background: on ? INK : '#fff',
                  color: lk ? '#C4C7CE' : on ? '#fff' : SOFT, cursor: lk ? 'not-allowed' : 'pointer',
                  borderRadius: 999, padding: '8px 14px', whiteSpace: 'nowrap', fontSize: 13, fontWeight: on ? 700 : 500,
                  display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
                }}
              >
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, opacity: 0.8 }}>{t.no}</span>
                {t.label}
                {lk ? <span style={{ fontSize: 11 }}>🔒</span> : <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.done ? '#16A34A' : on ? 'rgba(255,255,255,.5)' : '#D1D5DB' }} />}
              </button>
            );
          })}
        </nav>

        {/* İçerik kartı */}
        <main style={{ marginTop: 16 }}>
          {loading ? (
            <p style={{ color: SOFT }}>Yükleniyor…</p>
          ) : (
            <>
              {!anamnezDone && isAnamnez && (
                <div style={{ background: '#FDF4E7', border: '1px solid #F0D9B5', borderRadius: 16, padding: '13px 16px', marginBottom: 14, color: '#8a5a1a', fontSize: 13.5, lineHeight: 1.5 }}>
                  Bu dosya henüz <b>anamnezle başlamadı.</b> Anamnez doldurulunca diğer adımlar açılır.
                </div>
              )}
              <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 22, padding: '26px 26px 24px', boxShadow: cardShadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: '#F1EFEA', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={ACCENT} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{ICONS[active]}</svg>
                  </span>
                  <div>
                    <div style={{ fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: FAINT }}>{p.eyebrow}</div>
                    <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 600, fontSize: 22, margin: '1px 0 0', color: INK }}>{p.title}</h2>
                  </div>
                </div>

                {/* Anamnez sekmesi: doldurulmuş formun özeti */}
                {isAnamnez && anamnezDone ? (
                  <div style={{ margin: '16px 0 20px', display: 'grid', gap: 14 }}>
                    {ozet.map((row, i) => (
                      <div key={i} style={{ borderTop: i === 0 ? 'none' : `1px solid ${LINE}`, paddingTop: i === 0 ? 0 : 12 }}>
                        <div style={{ fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase', color: FAINT, marginBottom: 3 }}>{row.label}</div>
                        <div style={{ fontSize: 14.5, color: INK, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: SOFT, fontSize: 14.5, lineHeight: 1.6, margin: '12px 0 20px' }}>{p.status}</p>
                )}

                <button onClick={() => router.push(p.href)} style={{ border: isAnamnez && anamnezDone ? `1px solid ${LINE}` : 'none', background: isAnamnez && anamnezDone ? '#fff' : INK, color: isAnamnez && anamnezDone ? INK : '#fff', borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {p.action}
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>

                {isAnamnez && anamnezDone && (
                  <p style={{ color: FAINT, fontSize: 12.5, margin: '16px 0 0' }}>
                    Diğer alanları (değerlendirme, görüşmeler…) yukarıdaki sekmelerden açıp doldurabilirsin.
                  </p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
