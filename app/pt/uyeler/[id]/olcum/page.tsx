'use client';

/* Aylık ölçüm — mezura + makine; ay seçici + trend grafiği. member+ay upsert. */
import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '@/components/pt/pt.css';

const MEZURA = [
  ['boyun', 'Boyun'], ['omuz', 'Omuz'], ['gogus', 'Göğüs'], ['bel', 'Bel'], ['kalca', 'Kalça'],
  ['kol_sag', 'Kol (sağ)'], ['kol_sol', 'Kol (sol)'], ['bacak_sag', 'Bacak (sağ)'], ['bacak_sol', 'Bacak (sol)'],
] as const;
const MAKINE = [
  ['kilo', 'Kilo (kg)'], ['yag_yuzde', 'Yağ %'], ['kas_kg', 'Kas (kg)'], ['vki', 'VKİ'],
  ['su_yuzde', 'Su %'], ['bazal', 'Bazal (kcal)'], ['visseral', 'Visseral yağ'],
] as const;

const ymNow = () => new Date().toISOString().slice(0, 7);
const monthOptions = () => Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - i); return d.toISOString().slice(0, 7); });
type Meas = { ay: string; mezura_json?: string; makine_json?: string; notlar?: string };

export default function PtUyeOlcum({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState('');
  const [all, setAll] = useState<Meas[]>([]);
  const [ay, setAy] = useState(ymNow());
  const [mezura, setMezura] = useState<Record<string, string>>({});
  const [makine, setMakine] = useState<Record<string, string>>({});
  const [notlar, setNotlar] = useState('');
  const [saved, setSaved] = useState<'idle' | 'saving' | 'ok'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAll = () => fetch(`/api/pt/members/${id}/measurements`).then((r) => r.json()).then((d) => setAll(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { fetch(`/api/pt/members/${id}`).then((r) => r.ok ? r.json() : null).then((m) => m && setName(m.ad_soyad)).catch(() => {}); loadAll(); }, [id]);

  // Seçili ayın verisini forma yükle
  useEffect(() => {
    const row = all.find((x) => x.ay === ay);
    try { setMezura(row?.mezura_json ? JSON.parse(row.mezura_json) : {}); } catch { setMezura({}); }
    try { setMakine(row?.makine_json ? JSON.parse(row.makine_json) : {}); } catch { setMakine({}); }
    setNotlar(row?.notlar ?? '');
  }, [ay, all]);

  const persist = (mez: Record<string, string>, mak: Record<string, string>, nt: string) => {
    setSaved('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const num = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)]));
      fetch(`/api/pt/members/${id}/measurements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ay, mezura: num(mez), makine: num(mak), notlar: nt }) })
        .then(() => { setSaved('ok'); loadAll(); }).catch(() => setSaved('idle'));
    }, 900);
  };
  const setMez = (k: string, v: string) => { const n = { ...mezura, [k]: v }; setMezura(n); persist(n, makine, notlar); };
  const setMak = (k: string, v: string) => { const n = { ...makine, [k]: v }; setMakine(n); persist(mezura, n, notlar); };

  const chart = useMemo(() => [...all].sort((a, b) => a.ay.localeCompare(b.ay)).map((r) => {
    let mk: any = {}; try { mk = r.makine_json ? JSON.parse(r.makine_json) : {}; } catch {}
    return { ay: r.ay.slice(2), kilo: mk.kilo ?? null, yag: mk.yag_yuzde ?? null };
  }), [all]);

  return (
    <div className="pt pt-stage">
      <div className="pt-wrap">
        <button className="pt-back" onClick={() => router.push(`/pt/uyeler/${id}`)}><span className="chev">‹</span> Üye dosyası</button>
        <div className="pt-head" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
          <div><div className="pt-eyebrow">Aylık ölçüm</div><h1 className="pt-title">{name || 'Üye'}</h1></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select className="pt-select" style={{ width: 'auto' }} value={ay} onChange={(e) => setAy(e.target.value)}>
              {monthOptions().map((m) => <option key={m} value={m}>{m}{m === ymNow() ? ' (bu ay)' : ''}</option>)}
            </select>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{saved === 'saving' ? 'Kaydediliyor…' : saved === 'ok' ? 'Kaydedildi ✓' : ''}</span>
          </div>
        </div>

        {chart.length > 1 && (
          <div className="pt-card" style={{ padding: '16px 18px', marginBottom: 14 }}>
            <b style={{ fontSize: 13.5 }}>Trend — kilo & yağ %</b>
            <div style={{ height: 220, marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" />
                  <XAxis dataKey="ay" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="kilo" stroke="#111" dot={{ r: 3 }} name="Kilo" connectNulls />
                  <Line type="monotone" dataKey="yag" stroke="#b3402e" dot={{ r: 3 }} name="Yağ %" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="pt-grid2">
          <div className="pt-card" style={{ padding: '18px 20px' }}>
            <b style={{ fontSize: 15 }}>Mezura ölçümleri <span style={{ color: 'var(--ink-mute)', fontWeight: 400, fontSize: 12 }}>(cm)</span></b>
            <div className="pt-grid3" style={{ marginTop: 12 }}>
              {MEZURA.map(([k, l]) => <label key={k} className="pt-field"><span className="pt-label">{l}</span><input className="pt-input" type="number" inputMode="decimal" value={mezura[k] ?? ''} onChange={(e) => setMez(k, e.target.value)} /></label>)}
            </div>
          </div>
          <div className="pt-card" style={{ padding: '18px 20px' }}>
            <b style={{ fontSize: 15 }}>Makine ölçümleri</b>
            <div className="pt-grid3" style={{ marginTop: 12 }}>
              {MAKINE.map(([k, l]) => <label key={k} className="pt-field"><span className="pt-label">{l}</span><input className="pt-input" type="number" inputMode="decimal" value={makine[k] ?? ''} onChange={(e) => setMak(k, e.target.value)} /></label>)}
            </div>
          </div>
        </div>

        <div className="pt-card" style={{ padding: '16px 20px', marginTop: 14 }}>
          <label className="pt-field"><span className="pt-label">Notlar</span><textarea className="pt-textarea" value={notlar} onChange={(e) => { setNotlar(e.target.value); persist(mezura, makine, e.target.value); }} /></label>
        </div>
      </div>
    </div>
  );
}
