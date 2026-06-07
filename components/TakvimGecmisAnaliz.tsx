'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, UserPlus, Search, Calendar, Check, X, Users, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  CartesianGrid, Legend,
} from 'recharts';

// ── Tipler ────────────────────────────────────────────────────────────────────
type SeansKayit = { tarih: string; saat: string; iptal: boolean };
type DanisanOzet = {
  ad: string; toplamRandevu: number; gerceklesen: number; iptal: number;
  seanslar: SeansKayit[]; ilkTarih: string; sonTarih: string;
};
type Analiz = {
  ozet: {
    toplamEtkinlik: number; benzersizDanis: number;
    toplamGercekles: number; toplamIptal: number;
    enErkenTarih: string | null; enGecTarih: string | null;
  };
  danisanlar: DanisanOzet[];
};
type Patient = { id: string; adSoyad: string };
type ZamanDilim = 'yillik' | 'aylik' | 'haftalik';

// ── Yardımcılar ───────────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isoWeek(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const weekNum = Math.floor((d.getTime() - startOfWeek1.getTime()) / 604800000) + 1;
  return `${d.getFullYear()}-H${String(weekNum).padStart(2, '0')}`;
}

const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// ── Zaman serisi hesaplama ────────────────────────────────────────────────────
function buildZamanSeri(danisanlar: DanisanOzet[], dilim: ZamanDilim) {
  const map = new Map<string, { gerceklesen: number; iptal: number }>();

  danisanlar.forEach(d =>
    d.seanslar.forEach(s => {
      let key: string;
      const [y, m] = s.tarih.split('-');
      if (dilim === 'yillik')  key = y;
      else if (dilim === 'aylik') key = `${y}-${m}`;
      else key = isoWeek(s.tarih);

      if (!map.has(key)) map.set(key, { gerceklesen: 0, iptal: 0 });
      const e = map.get(key)!;
      if (s.iptal) e.iptal++; else e.gerceklesen++;
    })
  );

  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));

  return sorted.map(([key, v]) => {
    let label = key;
    if (dilim === 'aylik') {
      const [yr, mo] = key.split('-');
      label = `${TR_MONTHS[parseInt(mo) - 1]} ${yr}`;
    } else if (dilim === 'haftalik') {
      label = key.replace('-H', ' H');
    }
    return { key, label, ...v, toplam: v.gerceklesen + v.iptal };
  });
}

// ── Özel tooltip ──────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const g = payload.find((p: any) => p.dataKey === 'gerceklesen')?.value ?? 0;
  const ip = payload.find((p: any) => p.dataKey === 'iptal')?.value ?? 0;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-[#0E0F12] mb-1.5">{label}</p>
      <p className="text-emerald-600">✓ Gerçekleşen: <strong>{g}</strong></p>
      <p className="text-red-400">✕ İptal: <strong>{ip}</strong></p>
      <p className="text-gray-500 mt-1 border-t pt-1">Toplam: <strong>{g + ip}</strong></p>
    </div>
  );
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────
export default function TakvimGecmisAnaliz({ patients }: { patients: Patient[] }) {
  const [analiz, setAnaliz]         = useState<Analiz | null>(null);
  const [loading, setLoading]       = useState(false);
  const [syncing, setSyncing]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [q, setQ]                   = useState('');
  const [minSeans, setMinSeans]     = useState(1);
  const [acikDetay, setAcikDetay]   = useState<string | null>(null);
  const [olusturulanlar, setOlusturulanlar] = useState<Set<string>>(new Set());
  const [zamanDilim, setZamanDilim] = useState<ZamanDilim>('aylik');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/takvim-analiz');
      const data = await res.json();
      if (data.empty) setAnaliz(null);
      else if (data.error) setError(data.error);
      else setAnaliz(data);
    } catch { setError('Veri yüklenemedi.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setSyncing(true); setError(null);
    try {
      const res = await fetch('/api/takvim-analiz', { method: 'POST' });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setAnaliz(data);
    } catch { setError('Senkronizasyon başarısız.'); }
    finally { setSyncing(false); }
  };

  const createFile = async (ad: string) => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adSoyad: ad }),
      });
      if (res.ok) setOlusturulanlar(prev => new Set([...prev, ad]));
    } catch {}
  };

  const eslesiyorMu = (ad: string) =>
    patients.some(p => p.adSoyad.toLowerCase().trim() === ad.toLowerCase().trim());

  const filtered = useMemo(() => (analiz?.danisanlar ?? [])
    .filter(d => d.gerceklesen >= minSeans)
    .filter(d => !q || d.ad.toLowerCase().includes(q.toLowerCase())),
    [analiz, minSeans, q]);

  // Zaman serisi verileri
  const zamanData = useMemo(
    () => analiz ? buildZamanSeri(analiz.danisanlar, zamanDilim) : [],
    [analiz, zamanDilim]
  );

  // Haftalık görünümde son 52 hafta, aylıkta son 36 ay
  const zamanDataTrimmed = useMemo(() => {
    if (zamanDilim === 'haftalik') return zamanData.slice(-52);
    if (zamanDilim === 'aylik')    return zamanData.slice(-36);
    return zamanData;
  }, [zamanData, zamanDilim]);

  // Top-10 danışan grafiği
  const topDanis = useMemo(() => [...(analiz?.danisanlar ?? [])]
    .sort((a, b) => b.gerceklesen - a.gerceklesen)
    .slice(0, 10)
    .map(d => ({ name: d.ad.split(' ')[0], gerceklesen: d.gerceklesen, iptal: d.iptal })),
    [analiz]);

  // Zaman ekseninde en yüksek değer (bar yüksekliği için)
  const zamanMax = useMemo(
    () => Math.max(...zamanDataTrimmed.map(d => d.toplam), 1),
    [zamanDataTrimmed]
  );

  const DILIM_LABELS: Record<ZamanDilim, string> = {
    yillik: 'Yıllık', aylik: 'Aylık', haftalik: 'Haftalık',
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Başlık + Senkronize Et */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-gray-400">Takvim Geçmişi</p>
          <h2 className="text-xl font-medium mt-0.5 text-[#0E0F12]">Geçmiş Seans Analizi</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-lg leading-relaxed">
            Uygulamayı kullanmaya başlamadan önceki randevular. 20:00 ve sonrası otomatik iptal sayılır.
          </p>
        </div>
        <button onClick={sync} disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0E0F12] text-white text-sm font-medium hover:opacity-80 disabled:opacity-40 transition">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Takvim Okunuyor…' : 'Takvimi Senkronize Et'}
        </button>
      </div>

      {error && (
        <div className="card p-4 flex items-center gap-3 bg-red-50/50">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading && !analiz && (
        <div className="card p-10 text-center text-sm text-gray-400">Yükleniyor…</div>
      )}

      {!analiz && !loading && !error && (
        <div className="card p-10 text-center">
          <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">
            Geçmiş takvim verisi henüz yüklenmedi.{' '}
            <strong>"Takvimi Senkronize Et"</strong> ile macOS Takvim'deki{' '}
            <strong>Randevular</strong> takviminizden geçmiş seansları çekin.
          </p>
        </div>
      )}

      {analiz && (
        <>
          {/* ── Özet istatistikler ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Toplam Etkinlik',   val: analiz.ozet.toplamEtkinlik,  color: '#6366f1' },
              { label: 'Benzersiz Danışan', val: analiz.ozet.benzersizDanis,  color: '#0E0F12' },
              { label: 'Gerçekleşen',       val: analiz.ozet.toplamGercekles, color: '#16a34a' },
              { label: 'İptal (20:00+)',    val: analiz.ozet.toplamIptal,     color: '#dc2626' },
            ].map(s => (
              <div key={s.label} className="card-stat p-5">
                <p className="text-3xl font-light leading-none" style={{ color: s.color }}>{s.val}</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-2">{s.label}</p>
              </div>
            ))}
          </div>

          {analiz.ozet.enErkenTarih && (
            <p className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              Kapsam: <strong className="text-gray-600">{fmtDate(analiz.ozet.enErkenTarih)}</strong>
              {' — '}
              <strong className="text-gray-600">{fmtDate(analiz.ozet.enGecTarih)}</strong>
            </p>
          )}

          {/* ── Zaman serisi grafiği ───────────────────────────────────────── */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
                  Seans Dağılımı
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {zamanDilim === 'haftalik' ? 'Son 52 hafta' : zamanDilim === 'aylik' ? 'Son 36 ay' : 'Tüm yıllar'}
                </p>
              </div>
              {/* Dilim toggle */}
              <div className="pill-toggle">
                {(['yillik', 'aylik', 'haftalik'] as ZamanDilim[]).map(d => (
                  <button key={d} onClick={() => setZamanDilim(d)}
                    className={zamanDilim === d ? 'active' : ''}>
                    {DILIM_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            {zamanDataTrimmed.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Veri yok.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={zamanDataTrimmed}
                    margin={{ top: 4, right: 8, left: -18, bottom: zamanDilim === 'aylik' ? 24 : 4 }}
                    barCategoryGap={zamanDilim === 'haftalik' ? '10%' : '25%'}
                  >
                    <CartesianGrid vertical={false} stroke="#F1F2F5" />
                    <XAxis
                      dataKey="label"
                      stroke="#9CA3AF"
                      fontSize={zamanDilim === 'haftalik' ? 9 : 10}
                      tickLine={false}
                      axisLine={false}
                      angle={zamanDilim !== 'yillik' ? -35 : 0}
                      textAnchor={zamanDilim !== 'yillik' ? 'end' : 'middle'}
                      interval={zamanDilim === 'haftalik' ? 3 : zamanDilim === 'aylik' ? 1 : 0}
                    />
                    <YAxis
                      stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} width={24}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#6366f108' }} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      formatter={(v) => v === 'gerceklesen' ? 'Gerçekleşen' : 'İptal'}
                    />
                    <Bar dataKey="gerceklesen" name="gerceklesen" stackId="a"
                      radius={[0, 0, 0, 0]} maxBarSize={40} fill="#6366f1" fillOpacity={0.85} />
                    <Bar dataKey="iptal" name="iptal" stackId="a"
                      radius={[4, 4, 0, 0]} maxBarSize={40} fill="#fca5a5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Yıllık özet tablo (sadece yıllık görünümde) */}
            {zamanDilim === 'yillik' && zamanDataTrimmed.length > 0 && (
              <div className="border-t border-black/[0.05] pt-4">
                <div className="grid grid-cols-4 gap-2 text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-1 mb-2">
                  <span>Yıl</span>
                  <span className="text-right">Gerçekleşen</span>
                  <span className="text-right">İptal</span>
                  <span className="text-right">Toplam</span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {[...zamanDataTrimmed].reverse().map(row => (
                    <div key={row.key} className="grid grid-cols-4 gap-2 px-1 py-1.5 rounded-xl hover:bg-black/[0.02]">
                      <span className="text-sm font-semibold text-[#0E0F12]">{row.label}</span>
                      <span className="text-sm text-right text-emerald-600 font-medium">{row.gerceklesen}</span>
                      <span className="text-sm text-right text-red-400">{row.iptal}</span>
                      <span className="text-sm text-right text-gray-500 font-medium">{row.toplam}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── En çok seans yapılan danışanlar ───────────────────────────── */}
          {topDanis.length > 0 && (
            <div className="card p-6">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">
                En Çok Seans — İlk 10 Danışan
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDanis} margin={{ top: 4, right: 8, left: -18, bottom: 0 }} barCategoryGap="25%">
                    <CartesianGrid vertical={false} stroke="#F1F2F5" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} width={24} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #F1F2F5', fontSize: 12 }} cursor={{ fill: '#0E0F1208' }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      formatter={(v) => v === 'gerceklesen' ? 'Gerçekleşen' : 'İptal'} />
                    <Bar dataKey="gerceklesen" name="gerceklesen" stackId="a" radius={[0, 0, 0, 0]} maxBarSize={32} fill="#6366f1" fillOpacity={0.8} />
                    <Bar dataKey="iptal" name="iptal" stackId="a" radius={[4, 4, 0, 0]} maxBarSize={32} fill="#fca5a5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Danışan listesi ────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-[#F4F5F8] outline-none focus:border-[#0E0F12]"
                placeholder="Danışan adı ara…"
                value={q} onChange={e => setQ(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Min. seans:</label>
              <select value={minSeans} onChange={e => setMinSeans(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-[#F4F5F8] outline-none">
                {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} danışan</span>
          </div>

          <div className="space-y-2">
            {filtered.map(d => {
              const matched   = eslesiyorMu(d.ad);
              const created   = olusturulanlar.has(d.ad);
              const isOpen    = acikDetay === d.ad;
              const iptalOran = d.toplamRandevu > 0 ? Math.round((d.iptal / d.toplamRandevu) * 100) : 0;

              return (
                <div key={d.ad} className={`card overflow-hidden transition-all ${matched ? 'border-emerald-200/80' : ''}`}>
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-black/[0.01]"
                    onClick={() => setAcikDetay(isOpen ? null : d.ad)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#0E0F12] truncate">{d.ad}</span>
                        {matched && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ Sistemde var</span>
                        )}
                        {created && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Dosya oluşturuldu</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">
                          <span className="font-medium text-[#0E0F12]">{d.gerceklesen}</span> gerçekleşen
                          {d.iptal > 0 && <span className="text-red-400"> · {d.iptal} iptal</span>}
                        </span>
                        <span className="text-xs text-gray-400">{fmtDate(d.ilkTarih)} – {fmtDate(d.sonTarih)}</span>
                      </div>
                    </div>

                    {/* İptal oranı bar */}
                    <div className="flex-shrink-0 w-24 hidden sm:block">
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-red-300" style={{ width: `${iptalOran}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 text-right">%{iptalOran} iptal</p>
                    </div>

                    {!matched && !created && (
                      <button
                        onClick={e => { e.stopPropagation(); createFile(d.ad); }}
                        className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#0E0F12] text-white hover:opacity-80 transition whitespace-nowrap"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Dosya Oluştur
                      </button>
                    )}

                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Detay: seans zaman çizelgesi */}
                  {isOpen && (
                    <div className="border-t border-black/[0.05] px-4 py-3 bg-[#F4F5F8]/50">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">
                        Seans Zaman Çizelgesi
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                        {d.seanslar
                          .slice().sort((a, b) => a.tarih.localeCompare(b.tarih))
                          .map((s, i) => (
                            <div key={i}
                              title={`${s.tarih} ${s.saat}${s.iptal ? ' — İptal (20:00+)' : ''}`}
                              className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
                                s.iptal ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {new Date(s.tarih + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: '2-digit' })}
                              {' '}<span className="opacity-60">{s.saat}</span>
                              {s.iptal && ' ✕'}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="card p-8 text-center text-sm text-gray-400">
                Filtreyle eşleşen danışan bulunamadı.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
