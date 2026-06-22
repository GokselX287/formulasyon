'use client';

/* Üye bilgi formu — PAR-Q, postür, sağlık, hedefler. profile_json'a debounce autosave. */
import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/pt/pt.css';

const PARQ = [
  'Doktorunuz kalp rahatsızlığınız olduğunu ve yalnızca doktor önerisiyle fiziksel aktivite yapmanız gerektiğini söyledi mi?',
  'Fiziksel aktivite sırasında göğsünüzde ağrı hissediyor musunuz?',
  'Son bir ayda, fiziksel aktivite yapmadığınız halde göğüs ağrınız oldu mu?',
  'Baş dönmesi nedeniyle dengenizi kaybeder veya bilincinizi yitirir misiniz?',
  'Fiziksel aktivite değişikliğiyle kötüleşebilecek bir kemik/eklem sorununuz var mı?',
  'Doktorunuz şu anda tansiyon veya kalp için ilaç veriyor mu?',
  'Fiziksel aktivite yapmamanız için başka bir neden biliyor musunuz?',
];

type Profile = {
  parq?: { answers?: (boolean | null)[]; notlar?: string };
  postur?: { gozlem?: string; notlar?: string };
  saglik?: { kronik?: string; ilac?: string; sakatlik?: string; alerji?: string };
  hedefler?: { metin?: string };
};

export default function PtUyeProfil({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [p, setP] = useState<Profile>({});
  const [name, setName] = useState('');
  const [saved, setSaved] = useState<'idle' | 'saving' | 'ok'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/pt/members/${id}`).then((r) => r.ok ? r.json() : null).then((m) => m && setName(m.ad_soyad)).catch(() => {});
    fetch(`/api/pt/members/${id}/profile`).then((r) => r.ok ? r.json() : {}).then((d) => setP(d && typeof d === 'object' ? d : {})).catch(() => {});
  }, [id]);

  const persist = (next: Profile) => {
    setSaved('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch(`/api/pt/members/${id}/profile`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) })
        .then(() => setSaved('ok')).catch(() => setSaved('idle'));
    }, 900);
  };
  const upd = (section: keyof Profile, patch: any) => setP((prev) => { const next = { ...prev, [section]: { ...(prev[section] as any), ...patch } }; persist(next); return next; });

  const parqAns = p.parq?.answers ?? Array(7).fill(null);
  const setParq = (i: number, v: boolean) => { const a = [...parqAns]; a[i] = v; upd('parq', { answers: a }); };
  const parqFlag = parqAns.some((x) => x === true);

  return (
    <div className="pt pt-stage">
      <div className="pt-wrap">
        <button className="pt-back" onClick={() => router.push(`/pt/uyeler/${id}`)}><span className="chev">‹</span> Üye dosyası</button>
        <div className="pt-head" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div><div className="pt-eyebrow">Bilgi formu</div><h1 className="pt-title">{name || 'Üye'} <i>· değerlendirme</i></h1></div>
          <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{saved === 'saving' ? 'Kaydediliyor…' : saved === 'ok' ? 'Kaydedildi ✓' : 'Otomatik kaydedilir'}</span>
        </div>

        {/* PAR-Q */}
        <div className="pt-card" style={{ padding: '18px 22px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ fontSize: 15 }}>PAR-Q Testi</b>
            {parqFlag && <span className="pt-badge risk"><span className="dot" />Doktor onayı önerilir</span>}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-mute)', margin: '4px 0 12px' }}>Bir veya daha fazla "Evet" → egzersiz öncesi hekim görüşü önerilir.</p>
          {PARQ.map((q, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
              <span style={{ flex: 1, fontSize: 13.5 }}>{i + 1}. {q}</span>
              <div className="pt-seg" style={{ flex: 'none' }}>
                <button aria-pressed={parqAns[i] === true} onClick={() => setParq(i, true)}>Evet</button>
                <button aria-pressed={parqAns[i] === false} onClick={() => setParq(i, false)}>Hayır</button>
              </div>
            </div>
          ))}
          <label className="pt-field" style={{ marginTop: 12 }}><span className="pt-label">PAR-Q notları</span><textarea className="pt-textarea" value={p.parq?.notlar ?? ''} onChange={(e) => upd('parq', { notlar: e.target.value })} /></label>
        </div>

        {/* Postür */}
        <div className="pt-card" style={{ padding: '18px 22px', marginBottom: 14 }}>
          <b style={{ fontSize: 15 }}>Postür Analizi</b>
          <div className="pt-grid2" style={{ marginTop: 12 }}>
            <label className="pt-field"><span className="pt-label">Gözlem (önden/yandan/arkadan)</span><textarea className="pt-textarea" value={p.postur?.gozlem ?? ''} onChange={(e) => upd('postur', { gozlem: e.target.value })} placeholder="omuz asimetrisi, kifoz/lordoz, pelvik tilt…" /></label>
            <label className="pt-field"><span className="pt-label">Notlar / öneriler</span><textarea className="pt-textarea" value={p.postur?.notlar ?? ''} onChange={(e) => upd('postur', { notlar: e.target.value })} /></label>
          </div>
        </div>

        {/* Sağlık */}
        <div className="pt-card" style={{ padding: '18px 22px', marginBottom: 14 }}>
          <b style={{ fontSize: 15 }}>Sağlık Bilgileri</b>
          <div className="pt-grid2" style={{ marginTop: 12 }}>
            <label className="pt-field"><span className="pt-label">Kronik rahatsızlık</span><input className="pt-input" value={p.saglik?.kronik ?? ''} onChange={(e) => upd('saglik', { kronik: e.target.value })} /></label>
            <label className="pt-field"><span className="pt-label">Kullanılan ilaçlar</span><input className="pt-input" value={p.saglik?.ilac ?? ''} onChange={(e) => upd('saglik', { ilac: e.target.value })} /></label>
            <label className="pt-field"><span className="pt-label">Geçmiş sakatlık / ameliyat</span><input className="pt-input" value={p.saglik?.sakatlik ?? ''} onChange={(e) => upd('saglik', { sakatlik: e.target.value })} /></label>
            <label className="pt-field"><span className="pt-label">Alerji</span><input className="pt-input" value={p.saglik?.alerji ?? ''} onChange={(e) => upd('saglik', { alerji: e.target.value })} /></label>
          </div>
        </div>

        {/* Hedefler */}
        <div className="pt-card" style={{ padding: '18px 22px' }}>
          <b style={{ fontSize: 15 }}>Hedefler</b>
          <label className="pt-field" style={{ marginTop: 12 }}><span className="pt-label">Üyenin hedefleri & beklentileri</span><textarea className="pt-textarea" style={{ minHeight: 100 }} value={p.hedefler?.metin ?? ''} onChange={(e) => upd('hedefler', { metin: e.target.value })} placeholder="kilo verme, kas kazanımı, kondisyon, rehabilitasyon…" /></label>
        </div>
      </div>
    </div>
  );
}
