'use client';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, Coffee, UtensilsCrossed, Lock, CheckCircle2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────
type SablonRow = {
  id: string;
  gun: number; // 0=Pzt … 6=Paz
  tip: 'calisma' | 'mola' | 'yemek' | 'kapali';
  baslangic: string | null;
  bitis: string | null;
};

type Blok = {
  id: string;
  tarih: string;
  baslangic: string;
  bitis: string;
  aciklama: string | null;
  renk: string;
};

type MData = { sablon: SablonRow[]; bloklar: Blok[] };

// ── Constants ─────────────────────────────────────────────────
const GUN_ADLARI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const GUN_KISA   = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const SABLON_ONAYLAR: { label: string; rows: Partial<SablonRow>[] }[] = [
  {
    label: 'Standart (9–18, öğle 12–13)',
    rows: [0,1,2,3,4].flatMap(gun => [
      { gun, tip: 'calisma', baslangic: '09:00', bitis: '18:00' },
      { gun, tip: 'yemek',   baslangic: '12:00', bitis: '13:00' },
    ]),
  },
  {
    label: 'Öğleden sonra (13–20)',
    rows: [0,1,2,3,4].map(gun => ({ gun, tip: 'calisma', baslangic: '13:00', bitis: '20:00' })),
  },
  {
    label: 'Tam gün (8–20, öğle+mola)',
    rows: [0,1,2,3,4].flatMap(gun => [
      { gun, tip: 'calisma', baslangic: '08:00', bitis: '20:00' },
      { gun, tip: 'yemek',   baslangic: '12:30', bitis: '13:30' },
      { gun, tip: 'mola',    baslangic: '16:00', bitis: '16:30' },
    ]),
  },
];

const TIP_META = {
  calisma: { label: 'Çalışma', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
  yemek:   { label: 'Yemek',   icon: UtensilsCrossed, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  mola:    { label: 'Mola',    icon: Coffee, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  kapali:  { label: 'Kapalı',  icon: Lock, color: 'text-gray-500 bg-gray-100 border-gray-200' },
};

const RENK_OPTS = [
  { k: 'gray',   label: 'Gri',   cls: 'bg-gray-400' },
  { k: 'red',    label: 'Kırmızı', cls: 'bg-red-400' },
  { k: 'blue',   label: 'Mavi',  cls: 'bg-blue-400' },
  { k: 'purple', label: 'Mor',   cls: 'bg-purple-400' },
];

// ── Helpers ───────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10); }

// ── DayRow ────────────────────────────────────────────────────
function DayRow({ gun, rows, onSave, onDelete }: {
  gun: number;
  rows: SablonRow[];
  onSave: (row: Partial<SablonRow> & { gun: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const calisma = rows.find(r => r.tip === 'calisma');
  const extralar = rows.filter(r => r.tip !== 'calisma');
  const isAcik = !!calisma;

  const [saving, setSaving] = useState(false);
  const [localCal, setLocalCal] = useState({ baslangic: calisma?.baslangic ?? '09:00', bitis: calisma?.bitis ?? '18:00' });
  const [showAdd, setShowAdd] = useState(false);
  const [newTip, setNewTip] = useState<'mola' | 'yemek'>('mola');
  const [newBas, setNewBas] = useState('12:00');
  const [newBit, setNewBit] = useState('12:30');

  // Günü aç/kapat
  const toggleGun = async () => {
    setSaving(true);
    if (isAcik && calisma) {
      await onDelete(calisma.id);
    } else {
      await onSave({ gun, tip: 'calisma', baslangic: localCal.baslangic, bitis: localCal.bitis });
    }
    setSaving(false);
  };

  // Çalışma saatlerini kaydet
  const saveCalisma = async () => {
    if (!calisma) return;
    setSaving(true);
    await onSave({ id: calisma.id, gun, tip: 'calisma', baslangic: localCal.baslangic, bitis: localCal.bitis });
    setSaving(false);
  };

  // Extra (mola/yemek) ekle
  const addExtra = async () => {
    setSaving(true);
    await onSave({ gun, tip: newTip, baslangic: newBas, bitis: newBit });
    setShowAdd(false);
    setSaving(false);
  };

  return (
    <div className={`rounded-2xl border p-4 transition-all ${isAcik ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
      <div className="flex items-center gap-3">
        {/* Gün adı */}
        <div className="w-24 flex-shrink-0">
          <span className="text-sm font-semibold text-[#0E0F12]">{GUN_ADLARI[gun]}</span>
        </div>

        {/* Toggle */}
        <div
          onClick={toggleGun}
          className={`w-10 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors flex-shrink-0 ${isAcik ? 'bg-[#6366f1]' : 'bg-gray-200'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${isAcik ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>

        {/* Çalışma saatleri */}
        {isAcik ? (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input type="time" value={localCal.baslangic}
              onChange={e => setLocalCal(v => ({ ...v, baslangic: e.target.value }))}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-24" />
            <span className="text-gray-400 text-xs">–</span>
            <input type="time" value={localCal.bitis}
              onChange={e => setLocalCal(v => ({ ...v, bitis: e.target.value }))}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-24" />
            <button onClick={saveCalisma} disabled={saving}
              className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition disabled:opacity-40">
              {saving ? '…' : 'Kaydet'}
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400 flex-1">Kapalı gün</span>
        )}
      </div>

      {/* Mola/Yemek bloğu */}
      {isAcik && (
        <div className="mt-3 ml-28 space-y-2">
          {extralar.map(r => {
            const meta = TIP_META[r.tip];
            const Icon = meta.icon;
            return (
              <div key={r.id} className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 w-fit ${meta.color}`}>
                <Icon className="w-3 h-3" />
                <span className="text-[11px] font-medium">{meta.label}</span>
                <span className="text-[11px]">{r.baslangic} – {r.bitis}</span>
                <button onClick={() => onDelete(r.id)} className="hover:text-red-500 transition ml-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {showAdd ? (
            <div className="flex items-center gap-2 flex-wrap">
              <select value={newTip} onChange={e => setNewTip(e.target.value as 'mola' | 'yemek')}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs">
                <option value="mola">☕ Mola</option>
                <option value="yemek">🍽 Yemek</option>
              </select>
              <input type="time" value={newBas} onChange={e => setNewBas(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-24" />
              <span className="text-gray-400 text-xs">–</span>
              <input type="time" value={newBit} onChange={e => setNewBit(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-24" />
              <button onClick={addExtra} disabled={saving}
                className="text-[10px] px-2 py-1 rounded-lg bg-[#6366f1] text-white hover:bg-[#4f46e5] transition disabled:opacity-40">
                Ekle
              </button>
              <button onClick={() => setShowAdd(false)} className="text-[10px] text-gray-400 hover:text-gray-600">İptal</button>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#6366f1] transition">
              <Plus className="w-3 h-3" /> Mola / Yemek ekle
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── BlokCard ──────────────────────────────────────────────────
function BlokCard({ blok, onDelete }: { blok: Blok; onDelete: () => void }) {
  const renkMap: Record<string, string> = {
    gray: 'border-gray-200 bg-gray-50',
    red: 'border-red-200 bg-red-50',
    blue: 'border-blue-200 bg-blue-50',
    purple: 'border-purple-200 bg-purple-50',
  };
  const dotMap: Record<string, string> = { gray: 'bg-gray-400', red: 'bg-red-400', blue: 'bg-blue-400', purple: 'bg-purple-400' };

  const isPast = blok.tarih < todayStr();

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${renkMap[blok.renk] ?? renkMap.gray} ${isPast ? 'opacity-50' : ''}`}>
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotMap[blok.renk] ?? dotMap.gray}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#0E0F12]">
            {new Date(blok.tarih + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <span className="text-xs text-gray-500">{blok.baslangic} – {blok.bitis}</span>
        </div>
        {blok.aciklama && <p className="text-[11px] text-gray-500 truncate mt-0.5">{blok.aciklama}</p>}
      </div>
      <button onClick={onDelete} className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function MusaitlikPanel() {
  const [data, setData] = useState<MData>({ sablon: [], bloklar: [] });
  const [loading, setLoading] = useState(true);

  // Yeni blok form
  const [blokTarih, setBlokTarih]       = useState(todayStr());
  const [blokBas, setBlokBas]           = useState('09:00');
  const [blokBit, setBlokBit]           = useState('10:00');
  const [blokAcik, setBlokAcik]         = useState('');
  const [blokRenk, setBlokRenk]         = useState('gray');
  const [blokSaving, setBlokSaving]     = useState(false);
  const [onayTemplate, setOnayTemplate] = useState<number | null>(null);
  const [applying, setApplying]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/musaitlik').then(r => r.json());
    setData(res);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Şablon satırı kaydet
  const saveSablon = async (row: Partial<SablonRow> & { gun: number }) => {
    await fetch('/api/musaitlik', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    });
    await load();
  };

  // Şablon satırı sil
  const deleteSablon = async (id: string) => {
    await fetch(`/api/musaitlik?id=${id}`, { method: 'DELETE' });
    await load();
  };

  // Hazır şablon uygula
  const applyTemplate = async (idx: number) => {
    if (!confirm(`"${SABLON_ONAYLAR[idx].label}" şablonu uygulanacak. Mevcut haftalık program silinecek. Devam?`)) return;
    setApplying(true);
    // Tüm mevcut şablonu sil
    for (const r of data.sablon) {
      await fetch(`/api/musaitlik?id=${r.id}`, { method: 'DELETE' });
    }
    // Yenisini ekle
    for (const row of SABLON_ONAYLAR[idx].rows) {
      await fetch('/api/musaitlik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
    }
    setApplying(false);
    setOnayTemplate(null);
    await load();
  };

  // Özel blok ekle
  const addBlok = async () => {
    setBlokSaving(true);
    await fetch('/api/musaitlik/blok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tarih: blokTarih, baslangic: blokBas, bitis: blokBit, aciklama: blokAcik, renk: blokRenk }),
    });
    setBlokAcik('');
    await load();
    setBlokSaving(false);
  };

  // Özel blok sil
  const deleteBlok = async (id: string) => {
    await fetch(`/api/musaitlik/blok?id=${id}`, { method: 'DELETE' });
    await load();
  };

  if (loading) return <div className="text-center py-16 text-sm text-gray-400">Yükleniyor…</div>;

  const upcomingBloklar = data.bloklar.filter(b => b.tarih >= todayStr());
  const pastBloklar     = data.bloklar.filter(b => b.tarih < todayStr());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-semibold">Takvim</p>
        <h1 className="text-xl font-semibold mt-0.5 text-[#0E0F12] dark:text-white">Müsaitlik & Randevu Blokları</h1>
        <p className="text-xs text-gray-400 mt-0.5">Çalışma saatlerinizi ve kapalı dönemlerinizi belirleyin</p>
      </div>

      {/* ── Haftalık Program ── */}
      <div className="rounded-2xl border border-gray-100 bg-[#F4F5F8] p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-bold text-[#0E0F12] uppercase tracking-widest">Haftalık Program</p>
          {/* Hazır şablonlar */}
          <div className="flex gap-2 flex-wrap">
            {SABLON_ONAYLAR.map((s, i) => (
              <button key={i} onClick={() => setOnayTemplate(i)}
                className="text-[10px] px-3 py-1 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium transition">
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Onay dialog */}
        {onayTemplate !== null && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
            <span className="text-amber-600 text-sm">⚠️</span>
            <span className="text-xs text-amber-800 flex-1">
              <strong>"{SABLON_ONAYLAR[onayTemplate].label}"</strong> şablonu mevcut programın üzerine yazılacak.
            </span>
            <button onClick={() => applyTemplate(onayTemplate)} disabled={applying}
              className="text-xs px-3 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition font-medium">
              {applying ? 'Uygulanıyor…' : 'Uygula'}
            </button>
            <button onClick={() => setOnayTemplate(null)} className="text-xs text-gray-500 hover:text-gray-700">İptal</button>
          </div>
        )}

        {/* Gün satırları */}
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5, 6].map(gun => (
            <DayRow
              key={gun}
              gun={gun}
              rows={data.sablon.filter(r => r.gun === gun)}
              onSave={saveSablon}
              onDelete={deleteSablon}
            />
          ))}
        </div>
      </div>

      {/* ── Özel Tarih Blokları ── */}
      <div className="rounded-2xl border border-gray-100 bg-[#F4F5F8] p-4 space-y-3">
        <p className="text-xs font-bold text-[#0E0F12] uppercase tracking-widest">Özel Tarih Bloğu</p>
        <p className="text-xs text-gray-400">Belirli bir tarihte randevu kabul etmeyeceğiniz saatleri kapatın.</p>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase mb-1 block">Tarih</label>
              <input type="date" value={blokTarih} onChange={e => setBlokTarih(e.target.value)}
                min={todayStr()}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase mb-1 block">Başlangıç</label>
              <input type="time" value={blokBas} onChange={e => setBlokBas(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase mb-1 block">Bitiş</label>
              <input type="time" value={blokBit} onChange={e => setBlokBit(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-semibold uppercase mb-1 block">Renk</label>
              <div className="flex gap-1.5 mt-1.5">
                {RENK_OPTS.map(r => (
                  <button key={r.k} onClick={() => setBlokRenk(r.k)} title={r.label}
                    className={`w-6 h-6 rounded-full ${r.cls} transition-all ${blokRenk === r.k ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100'}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <input type="text" value={blokAcik} onChange={e => setBlokAcik(e.target.value)}
              placeholder="Açıklama (opsiyonel) — Toplantı, Tatil, Hastalık…"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20" />
            <button onClick={addBlok} disabled={blokSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6366f1] text-white text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50 transition">
              <Lock className="w-3.5 h-3.5" />
              {blokSaving ? 'Ekleniyor…' : 'Kapat'}
            </button>
          </div>
        </div>

        {/* Gelecek bloklar */}
        {upcomingBloklar.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Aktif Bloklar</p>
            {upcomingBloklar.map(b => (
              <BlokCard key={b.id} blok={b} onDelete={() => deleteBlok(b.id)} />
            ))}
          </div>
        )}

        {/* Geçmiş bloklar */}
        {pastBloklar.length > 0 && (
          <details className="group">
            <summary className="text-[11px] text-gray-400 cursor-pointer hover:text-gray-600 select-none">
              Geçmiş bloklar ({pastBloklar.length})
            </summary>
            <div className="space-y-2 mt-2">
              {pastBloklar.map(b => (
                <BlokCard key={b.id} blok={b} onDelete={() => deleteBlok(b.id)} />
              ))}
            </div>
          </details>
        )}

        {data.bloklar.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Henüz özel blok eklenmedi.</p>
        )}
      </div>
    </div>
  );
}
