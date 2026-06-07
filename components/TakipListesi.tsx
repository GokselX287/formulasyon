'use client';
import { useState, useEffect, useCallback } from 'react';
import { Phone, Calendar, XCircle, CheckCircle, ChevronDown, ChevronUp, AlertTriangle, Clock } from 'lucide-react';

type TakipKaydi = {
  id: string;
  clientId: string;
  clientName: string;
  seansNo: number;
  randevuTarihi: string;
  randevuSaati: string;
  durum: string;
  takipSayisi: number;
  takipNotu: string | null;
  takipTarihi: string | null;
  sonrakiAdim: string | null;
};

// ── Helpers ───────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10); }

function gunFarki(tarih: string): number {
  return Math.floor(
    (new Date(todayStr()).getTime() - new Date(tarih).getTime()) / 86400000
  );
}

function aciliyetRenk(gun: number) {
  if (gun >= 14) return { bg: 'bg-red-50 border-red-200',   badge: 'bg-red-100 text-red-700',   dot: 'bg-red-500',    label: 'Kritik'  };
  if (gun >= 7)  return { bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400', label: 'Acil'    };
  if (gun >= 3)  return { bg: 'bg-amber-50 border-amber-100',   badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400',  label: 'Dikkat'  };
  return         { bg: 'bg-gray-50 border-gray-200',   badge: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400',   label: 'Yeni'    };
}

function formatTarih(tarih: string) {
  return new Date(tarih + 'T00:00:00').toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', weekday: 'long',
  });
}

// ── Psikolojik Mesajlar ───────────────────────────────────────
const MESAJLAR: { gun: [number, number]; mesaj: string }[] = [
  { gun: [0, 2],  mesaj: 'Randevudan sonra kısa bir mesaj dönüt için iyi bir başlangıç olabilir.' },
  { gun: [3, 6],  mesaj: 'Bu aralıkta ulaşmak süreci açık tutar. Bir mesaj veya kısa görüşme yeterli.' },
  { gun: [7, 13], mesaj: 'Bir haftayı geçti. İletişime geçmek zor gelebilir; bu normal. Yine de denemek değer.' },
  { gun: [14, 30], mesaj: '2 haftadan fazla oldu. Ne hissettirirse hissettirsin — ulaşmak hâlâ mümkün.' },
  { gun: [31, 999], mesaj: 'Uzun süre geçti. Kısa bir "nasılsınız" mesajı bile fark yaratabilir.' },
];

function getMesaj(gun: number): string {
  return MESAJLAR.find(m => gun >= m.gun[0] && gun <= m.gun[1])?.mesaj ?? '';
}

// ── TakipKarti ────────────────────────────────────────────────
function TakipKarti({ kayit, onUpdate }: {
  kayit: TakipKaydi;
  onUpdate: () => void;
}) {
  const gun = gunFarki(kayit.randevuTarihi);
  const renk = aciliyetRenk(gun);
  const [expanded, setExpanded]       = useState(false);
  const [aksiyon, setAksiyon]         = useState<'iletisim' | 'randevu' | 'drop' | null>(null);
  const [not, setNot]                 = useState('');
  const [sonrakiAdim, setSonrakiAdim] = useState('');
  const [dropNedeni, setDropNedeni]   = useState('');
  const [saving, setSaving]           = useState(false);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/seans-bildirimleri/${kayit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setAksiyon(null);
    setNot(''); setSonrakiAdim(''); setDropNedeni('');
    onUpdate();
  };

  const handleIletisim = () => patch({
    takipGirisimi: true,
    takipNotu: not || null,
    sonrakiAdim: sonrakiAdim || null,
    durum: 'iletisim_girisimi',
  });

  const handleRandevu = () => patch({
    takipGirisimi: true,
    takipNotu: not || 'Yeni randevu alındı.',
    durum: 'yeni_randevu',
  });

  const handleDrop = () => patch({
    durum: 'drop',
    mazeret: dropNedeni || null,
  });

  const handleTamamlandi = () => patch({ durum: 'tamamlandi' });

  return (
    <div className={`rounded-2xl border p-4 transition-all ${renk.bg}`}>
      {/* Üst satır */}
      <div className="flex items-start gap-3">
        <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${renk.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#0E0F12]">{kayit.clientName}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold">
              {kayit.seansNo}. Seans
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${renk.badge}`}>
              {renk.label} · {gun} gün önce
            </span>
            {kayit.takipSayisi > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">
                {kayit.takipSayisi}× girişim
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatTarih(kayit.randevuTarihi)}{kayit.randevuSaati ? ` · ${kayit.randevuSaati}` : ''}
          </div>
          {/* Psikolojik mesaj */}
          <p className="text-xs text-gray-500 italic mt-1.5 leading-relaxed">
            {getMesaj(gun)}
          </p>
          {/* Son takip notu */}
          {kayit.takipNotu && (
            <div className="mt-2 rounded-xl bg-white/70 border border-white px-3 py-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Son not</p>
              <p className="text-xs text-gray-600">{kayit.takipNotu}</p>
              {kayit.sonrakiAdim && (
                <p className="text-xs text-blue-600 mt-1">➜ {kayit.sonrakiAdim}</p>
              )}
            </div>
          )}
        </div>
        <button onClick={() => setExpanded(e => !e)} className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/60 text-gray-400 transition">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Aksiyon butonları */}
      {!aksiyon && (
        <div className="flex gap-2 mt-3 flex-wrap">
          <button onClick={() => setAksiyon('iletisim')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition shadow-sm">
            <Phone className="w-3.5 h-3.5 text-blue-500" /> İletişime geçtim
          </button>
          <button onClick={() => setAksiyon('randevu')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-green-500" /> Yeni randevu aldı
          </button>
          <button onClick={handleTamamlandi}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Seans notu var
          </button>
          <button onClick={() => setAksiyon('drop')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-red-50 text-gray-500 hover:text-red-600 font-medium transition shadow-sm">
            <XCircle className="w-3.5 h-3.5" /> Süreci sonlandır
          </button>
        </div>
      )}

      {/* İletişim formu */}
      {aksiyon === 'iletisim' && (
        <div className="mt-3 space-y-2 bg-white/70 rounded-xl p-3 border border-white">
          <p className="text-xs font-semibold text-gray-600">Ne konuştunuz / Nasıl geçti?</p>
          <textarea rows={2} value={not} onChange={e => setNot(e.target.value)}
            placeholder="Aradım, mesaj attım, ulaşamadım…"
            className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200" />
          <input type="text" value={sonrakiAdim} onChange={e => setSonrakiAdim(e.target.value)}
            placeholder="Sonraki adım (opsiyonel) — Tekrar arayacağım, randevu bekliyoruz…"
            className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
          <div className="flex gap-2">
            <button onClick={handleIletisim} disabled={saving}
              className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 transition">
              {saving ? '…' : 'Kaydet'}
            </button>
            <button onClick={() => setAksiyon(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">İptal</button>
          </div>
        </div>
      )}

      {/* Randevu formu */}
      {aksiyon === 'randevu' && (
        <div className="mt-3 space-y-2 bg-white/70 rounded-xl p-3 border border-white">
          <p className="text-xs font-semibold text-gray-600">Randevu detayı (opsiyonel)</p>
          <input type="text" value={not} onChange={e => setNot(e.target.value)}
            placeholder="Tarih, saat veya not…"
            className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200" />
          <div className="flex gap-2">
            <button onClick={handleRandevu} disabled={saving}
              className="px-3 py-1.5 rounded-xl bg-green-500 text-white text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition">
              {saving ? '…' : 'Onayla'}
            </button>
            <button onClick={() => setAksiyon(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">İptal</button>
          </div>
        </div>
      )}

      {/* Drop formu */}
      {aksiyon === 'drop' && (
        <div className="mt-3 space-y-2 bg-white/70 rounded-xl p-3 border border-red-100">
          <p className="text-xs font-semibold text-gray-600">Süreci sonlandırma nedeni</p>
          <textarea rows={2} value={dropNedeni} onChange={e => setDropNedeni(e.target.value)}
            placeholder="Danışan devam etmek istemedi / ulaşılamıyor / başka terapiste yönlendirildi…"
            className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-200" />
          <div className="flex gap-2">
            <button onClick={handleDrop} disabled={saving}
              className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-50 transition">
              {saving ? '…' : 'Sonlandır'}
            </button>
            <button onClick={() => setAksiyon(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">İptal</button>
          </div>
        </div>
      )}

      {/* Genişletilmiş geçmiş */}
      {expanded && kayit.takipSayisi > 0 && (
        <div className="mt-3 pt-3 border-t border-white/60">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Takip Geçmişi</p>
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Son girişim: {kayit.takipTarihi ? new Date(kayit.takipTarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
            </div>
            {kayit.sonrakiAdim && (
              <div className="flex items-center gap-2 text-blue-600">
                <span>➜</span><span>{kayit.sonrakiAdim}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ana Bileşen ───────────────────────────────────────────────
export default function TakipListesi({ onOpenFormulation }: { onOpenFormulation?: (id: string) => void }) {
  const [kayitlar, setKayitlar] = useState<TakipKaydi[]>([]);
  const [loading, setLoading]   = useState(true);
  const [gizle, setGizle]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/seans-bildirimleri').then(r => r.json()).catch(() => []);
    if (!Array.isArray(res)) { setLoading(false); return; }

    const today = todayStr();
    // Geçmiş tarihli, hâlâ bekleyen veya sadece iletişim girişiminde kalınan
    const takipGerekenler: TakipKaydi[] = res
      .filter((r: Record<string, unknown>) =>
        r.randevuTarihi && (r.randevuTarihi as string) < today &&
        ['bekleyen', 'iletisim_girisimi'].includes(r.durum as string)
      )
      .map((r: Record<string, unknown>) => ({
        id: r.id as string,
        clientId: r.clientId as string,
        clientName: r.clientName as string,
        seansNo: r.seansNo as number,
        randevuTarihi: r.randevuTarihi as string,
        randevuSaati: (r.randevuSaati as string) ?? '',
        durum: r.durum as string,
        takipSayisi: (r.takipSayisi as number) ?? 0,
        takipNotu: r.takipNotu as string | null,
        takipTarihi: r.takipTarihi as string | null,
        sonrakiAdim: r.sonrakiAdim as string | null,
      }))
      .sort((a: TakipKaydi, b: TakipKaydi) =>
        new Date(a.randevuTarihi).getTime() - new Date(b.randevuTarihi).getTime()
      );

    setKayitlar(takipGerekenler);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return null;
  if (kayitlar.length === 0) return null;

  // Aciliyet grupları
  const kritik  = kayitlar.filter(k => gunFarki(k.randevuTarihi) >= 14);
  const acil    = kayitlar.filter(k => { const g = gunFarki(k.randevuTarihi); return g >= 7 && g < 14; });
  const dikkat  = kayitlar.filter(k => { const g = gunFarki(k.randevuTarihi); return g >= 3 && g < 7; });
  const yeni    = kayitlar.filter(k => gunFarki(k.randevuTarihi) < 3);

  return (
    <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0E0F12]">Takip Bekleyen Danışanlar</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                {kayitlar.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Bu randevulardan sonra kayıt girilmedi veya durum güncellenmedi.
            </p>
          </div>
        </div>
        <button onClick={() => setGizle(g => !g)}
          className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1">
          {gizle ? 'Göster' : 'Gizle'}
        </button>
      </div>

      {!gizle && (
        <>
          {/* Haftalık özet mesajı */}
          <div className="rounded-xl bg-white/70 border border-orange-100 px-4 py-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              Kaçırılan seanslardan sonra iletişime geçmek, hem danışan hem de terapist için zor olabilir.
              Bu liste sizi hatırlatmak için burada — <strong>küçük bir adım yeterli</strong>.
            </p>
          </div>

          {/* Gruplar */}
          {[
            { title: '🔴 Kritik (14+ gün)', items: kritik },
            { title: '🟠 Acil (7–13 gün)',  items: acil  },
            { title: '🟡 Dikkat (3–6 gün)', items: dikkat },
            { title: '⚪ Yeni (0–2 gün)',   items: yeni  },
          ].filter(g => g.items.length > 0).map(g => (
            <div key={g.title} className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">{g.title}</p>
              {g.items.map(k => (
                <TakipKarti key={k.id} kayit={k} onUpdate={load} />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
