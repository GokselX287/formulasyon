'use client';
import { useState, useEffect, useCallback } from 'react';
import { Phone, Calendar, XCircle, CheckCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';

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

// ── Editöryel tokenlar ────────────────────────────────────────
const INK = '#0E0F12', SOFT = '#6B7280', FAINT = '#9CA3AF', LINE = '#E7E5E0';
const SERIF = 'Georgia, "Times New Roman", serif';
const eyebrow: React.CSSProperties = { fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: FAINT };

// ── Helpers ───────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10); }
function gunFarki(tarih: string): number {
  return Math.floor((new Date(todayStr()).getTime() - new Date(tarih).getTime()) / 86400000);
}

function aciliyetRenk(gun: number) {
  if (gun >= 14) return { bg: '#FBF1EC', border: '#E6CBB9', chipBg: '#F3DDCC', chipInk: '#8A3D1A', dot: '#C2522A', label: 'Kritik' };
  if (gun >= 7)  return { bg: '#FBF6EC', border: '#E9DCBE', chipBg: '#F1E6C9', chipInk: '#86671C', dot: '#CC9A3A', label: 'Acil' };
  if (gun >= 3)  return { bg: '#FAF8F0', border: '#E6E0CC', chipBg: '#EDE8D6', chipInk: '#7A6F3E', dot: '#C2B061', label: 'Dikkat' };
  return           { bg: '#FAF8F5', border: LINE,      chipBg: '#EFEDE8', chipInk: SOFT,      dot: '#B6B4AD', label: 'Yeni' };
}

function formatTarih(tarih: string) {
  return new Date(tarih + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
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

const chip = (bg: string, ink: string): React.CSSProperties => ({
  fontSize: 10.5, padding: '2px 9px', borderRadius: 999, background: bg, color: ink, fontWeight: 600, whiteSpace: 'nowrap',
});
const actBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '7px 13px', borderRadius: 12,
  background: '#fff', border: `1px solid ${LINE}`, color: '#3A3C42', fontWeight: 500, cursor: 'pointer',
};
const fieldStyle: React.CSSProperties = {
  width: '100%', fontSize: 13, border: `1px solid ${LINE}`, borderRadius: 12, padding: '8px 11px', font: 'inherit', outline: 'none',
};
const primaryBtn: React.CSSProperties = { padding: '8px 15px', borderRadius: 12, background: INK, color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };

// ── TakipKarti ────────────────────────────────────────────────
function TakipKarti({ kayit, onUpdate }: { kayit: TakipKaydi; onUpdate: () => void }) {
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
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    setAksiyon(null);
    setNot(''); setSonrakiAdim(''); setDropNedeni('');
    onUpdate();
  };

  const handleIletisim = () => patch({ takipGirisimi: true, takipNotu: not || null, sonrakiAdim: sonrakiAdim || null, durum: 'iletisim_girisimi' });
  const handleRandevu = () => patch({ takipGirisimi: true, takipNotu: not || 'Yeni randevu alındı.', durum: 'yeni_randevu' });
  const handleDrop = () => patch({ durum: 'drop', mazeret: dropNedeni || null });
  const handleTamamlandi = () => patch({ durum: 'tamamlandi' });

  return (
    <div style={{ borderRadius: 18, border: `1px solid ${renk.border}`, background: renk.bg, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ marginTop: 5, width: 9, height: 9, borderRadius: '50%', background: renk.dot, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 16, color: INK }}>{kayit.clientName}</span>
            <span style={chip('#EFEDE8', SOFT)}>{kayit.seansNo}. seans</span>
            <span style={chip(renk.chipBg, renk.chipInk)}>{renk.label} · {gun} gün önce</span>
            {kayit.takipSayisi > 0 && <span style={chip('#EAEAF2', '#56587A')}>{kayit.takipSayisi}× girişim</span>}
          </div>
          <div style={{ fontSize: 12.5, color: SOFT, marginTop: 4 }}>
            {formatTarih(kayit.randevuTarihi)}{kayit.randevuSaati ? ` · ${kayit.randevuSaati}` : ''}
          </div>
          <p style={{ fontSize: 12.5, color: SOFT, fontStyle: 'italic', margin: '6px 0 0', lineHeight: 1.5 }}>{getMesaj(gun)}</p>
          {kayit.takipNotu && (
            <div style={{ marginTop: 10, borderRadius: 12, background: 'rgba(255,255,255,.65)', border: `1px solid ${LINE}`, padding: '8px 12px' }}>
              <div style={{ ...eyebrow, marginBottom: 2 }}>Son not</div>
              <p style={{ fontSize: 12.5, color: '#3A3C42', margin: 0 }}>{kayit.takipNotu}</p>
              {kayit.sonrakiAdim && <p style={{ fontSize: 12.5, color: '#8A3D1A', margin: '4px 0 0' }}>➜ {kayit.sonrakiAdim}</p>}
            </div>
          )}
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{ flexShrink: 0, width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 10, border: 'none', background: 'transparent', color: FAINT, cursor: 'pointer' }}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!aksiyon && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setAksiyon('iletisim')} style={actBtn}><Phone className="w-3.5 h-3.5" style={{ color: '#C2522A' }} /> İletişime geçtim</button>
          <button onClick={() => setAksiyon('randevu')} style={actBtn}><Calendar className="w-3.5 h-3.5" style={{ color: '#2F5D3A' }} /> Yeni randevu aldı</button>
          <button onClick={handleTamamlandi} style={actBtn}><CheckCircle className="w-3.5 h-3.5" style={{ color: '#2F5D3A' }} /> Seans notu var</button>
          <button onClick={() => setAksiyon('drop')} style={{ ...actBtn, color: SOFT }}><XCircle className="w-3.5 h-3.5" /> Süreci sonlandır</button>
        </div>
      )}

      {aksiyon === 'iletisim' && (
        <div style={{ marginTop: 12, display: 'grid', gap: 8, background: 'rgba(255,255,255,.65)', borderRadius: 12, padding: 12, border: `1px solid ${LINE}` }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: '#3A3C42', margin: 0 }}>Ne konuştunuz / Nasıl geçti?</p>
          <textarea rows={2} value={not} onChange={e => setNot(e.target.value)} placeholder="Aradım, mesaj attım, ulaşamadım…" style={{ ...fieldStyle, resize: 'none' }} />
          <input type="text" value={sonrakiAdim} onChange={e => setSonrakiAdim(e.target.value)} placeholder="Sonraki adım (opsiyonel)…" style={fieldStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleIletisim} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.5 : 1 }}>{saving ? '…' : 'Kaydet'}</button>
            <button onClick={() => setAksiyon(null)} style={{ ...actBtn, background: 'transparent', border: 'none', color: SOFT }}>İptal</button>
          </div>
        </div>
      )}

      {aksiyon === 'randevu' && (
        <div style={{ marginTop: 12, display: 'grid', gap: 8, background: 'rgba(255,255,255,.65)', borderRadius: 12, padding: 12, border: `1px solid ${LINE}` }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: '#3A3C42', margin: 0 }}>Randevu detayı (opsiyonel)</p>
          <input type="text" value={not} onChange={e => setNot(e.target.value)} placeholder="Tarih, saat veya not…" style={fieldStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleRandevu} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.5 : 1 }}>{saving ? '…' : 'Onayla'}</button>
            <button onClick={() => setAksiyon(null)} style={{ ...actBtn, background: 'transparent', border: 'none', color: SOFT }}>İptal</button>
          </div>
        </div>
      )}

      {aksiyon === 'drop' && (
        <div style={{ marginTop: 12, display: 'grid', gap: 8, background: 'rgba(255,255,255,.65)', borderRadius: 12, padding: 12, border: '1px solid #E6CBB9' }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: '#3A3C42', margin: 0 }}>Süreci sonlandırma nedeni</p>
          <textarea rows={2} value={dropNedeni} onChange={e => setDropNedeni(e.target.value)} placeholder="Danışan devam etmek istemedi / ulaşılamıyor…" style={{ ...fieldStyle, resize: 'none' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDrop} disabled={saving} style={{ ...primaryBtn, background: '#9A3D1A', opacity: saving ? 0.5 : 1 }}>{saving ? '…' : 'Sonlandır'}</button>
            <button onClick={() => setAksiyon(null)} style={{ ...actBtn, background: 'transparent', border: 'none', color: SOFT }}>İptal</button>
          </div>
        </div>
      )}

      {expanded && kayit.takipSayisi > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
          <div style={{ ...eyebrow, marginBottom: 5 }}>Takip geçmişi</div>
          <div style={{ fontSize: 12.5, color: SOFT, display: 'grid', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock className="w-3 h-3" />
              <span>Son girişim: {kayit.takipTarihi ? new Date(kayit.takipTarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
            </div>
            {kayit.sonrakiAdim && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8A3D1A' }}><span>➜</span><span>{kayit.sonrakiAdim}</span></div>}
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
    const takipGerekenler: TakipKaydi[] = res
      .filter((r: Record<string, unknown>) => r.randevuTarihi && (r.randevuTarihi as string) < today && ['bekleyen', 'iletisim_girisimi'].includes(r.durum as string))
      .map((r: Record<string, unknown>) => ({
        id: r.id as string, clientId: r.clientId as string, clientName: r.clientName as string, seansNo: r.seansNo as number,
        randevuTarihi: r.randevuTarihi as string, randevuSaati: (r.randevuSaati as string) ?? '', durum: r.durum as string,
        takipSayisi: (r.takipSayisi as number) ?? 0, takipNotu: r.takipNotu as string | null, takipTarihi: r.takipTarihi as string | null, sonrakiAdim: r.sonrakiAdim as string | null,
      }))
      .sort((a: TakipKaydi, b: TakipKaydi) => new Date(a.randevuTarihi).getTime() - new Date(b.randevuTarihi).getTime());
    setKayitlar(takipGerekenler);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return null;
  if (kayitlar.length === 0) return null;

  const kritik  = kayitlar.filter(k => gunFarki(k.randevuTarihi) >= 14);
  const acil    = kayitlar.filter(k => { const g = gunFarki(k.randevuTarihi); return g >= 7 && g < 14; });
  const dikkat  = kayitlar.filter(k => { const g = gunFarki(k.randevuTarihi); return g >= 3 && g < 7; });
  const yeni    = kayitlar.filter(k => gunFarki(k.randevuTarihi) < 3);

  return (
    <div style={{ borderRadius: 24, border: '1px solid #E6CBB9', background: 'linear-gradient(180deg,#FBF3EC,#FAF8F5)', padding: 22, boxShadow: '0 1px 2px rgba(16,17,20,.04), 0 14px 34px -18px rgba(16,17,20,.18)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={eyebrow}>takip bekleyenler</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 21, color: INK, margin: 0 }}>Takip bekleyen danışanlar</h3>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: '#C2522A', color: '#fff' }}>{kayitlar.length}</span>
          </div>
          <p style={{ fontSize: 13, color: SOFT, margin: '5px 0 0', lineHeight: 1.5 }}>Bu randevulardan sonra kayıt girilmedi veya durum güncellenmedi.</p>
        </div>
        <button onClick={() => setGizle(g => !g)} style={{ fontSize: 12.5, color: FAINT, background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}>{gizle ? 'Göster' : 'Gizle'}</button>
      </div>

      {!gizle && (
        <>
          <div style={{ marginTop: 14, borderRadius: 14, background: 'rgba(255,255,255,.6)', border: '1px solid #EDD9C8', padding: '12px 16px' }}>
            <p style={{ fontSize: 13, color: '#5a5a5a', margin: 0, lineHeight: 1.55 }}>
              Kaçırılan seanslardan sonra iletişime geçmek hem danışan hem terapist için zor olabilir. Bu liste hatırlatmak için burada — <strong>küçük bir adım yeterli</strong>.
            </p>
          </div>

          {[
            { title: 'Kritik · 14+ gün', items: kritik },
            { title: 'Acil · 7–13 gün',  items: acil  },
            { title: 'Dikkat · 3–6 gün', items: dikkat },
            { title: 'Yeni · 0–2 gün',   items: yeni  },
          ].filter(g => g.items.length > 0).map(g => (
            <div key={g.title} style={{ marginTop: 16, display: 'grid', gap: 8 }}>
              <div style={eyebrow}>{g.title}</div>
              {g.items.map(k => <TakipKarti key={k.id} kayit={k} onUpdate={load} />)}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
