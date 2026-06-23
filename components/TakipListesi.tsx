'use client';
import { useState, useEffect, useCallback } from 'react';
import { Phone, Calendar, XCircle, CheckCircle, Clock } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────
// TakipListesi — Takvim "Takip" sekmesi (geri-dönüş takibi).
// Yeni "landing uyumlu" .tk diline giydirildi (.tkv scope altında render edilir).
// Veri /api/seans-bildirimleri'nden; aksiyonlar PATCH /api/seans-bildirimleri/[id].
// ──────────────────────────────────────────────────────────────────────────

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

function todayStr() { return new Date().toISOString().slice(0, 10); }
function gunFarki(tarih: string): number {
  return Math.floor((new Date(todayStr()).getTime() - new Date(tarih).getTime()) / 86400000);
}
function formatTarih(tarih: string) {
  return new Date(tarih + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
}

// Aciliyet → kenar rengi (--tk-c) + etiket (brief §5 eşikleri)
function aciliyet(gun: number): { label: string; color: string } {
  if (gun >= 14) return { label: 'Kritik', color: 'var(--viz-warm)' };
  if (gun >= 7) return { label: 'Acil', color: '#C98A6C' };
  if (gun >= 3) return { label: 'Dikkat', color: 'var(--viz-b)' };
  return { label: 'Yeni', color: 'var(--ink-faint)' };
}

// Yumuşak/psikolojik mesaj (aciliyete göre)
const MESAJLAR: { gun: [number, number]; mesaj: string }[] = [
  { gun: [0, 2], mesaj: 'Randevudan sonra kısa bir mesaj, dönüt için iyi bir başlangıç olabilir.' },
  { gun: [3, 6], mesaj: 'Bu aralıkta ulaşmak süreci açık tutar. Bir mesaj veya kısa görüşme yeterli.' },
  { gun: [7, 13], mesaj: 'Bir haftayı geçti. İletişime geçmek zor gelebilir; bu normal. Yine de denemek değer.' },
  { gun: [14, 30], mesaj: '2 haftadan fazla oldu. Ne hissettirirse hissettirsin — ulaşmak hâlâ mümkün.' },
  { gun: [31, 999], mesaj: 'Uzun süre geçti. Kısa bir "nasılsınız" mesajı bile fark yaratabilir.' },
];
function getMesaj(gun: number): string {
  return MESAJLAR.find((m) => gun >= m.gun[0] && gun <= m.gun[1])?.mesaj ?? '';
}

// ── Takip kartı ──────────────────────────────────────────────────────────
function TakipKarti({ kayit, onUpdate }: { kayit: TakipKaydi; onUpdate: () => void }) {
  const gun = gunFarki(kayit.randevuTarihi);
  const a = aciliyet(gun);
  const [aksiyon, setAksiyon] = useState<'iletisim' | 'randevu' | 'drop' | null>(null);
  const [not, setNot] = useState('');
  const [sonrakiAdim, setSonrakiAdim] = useState('');
  const [dropNedeni, setDropNedeni] = useState('');
  const [saving, setSaving] = useState(false);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/seans-bildirimleri/${kayit.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }).catch(() => {});
    setSaving(false);
    setAksiyon(null); setNot(''); setSonrakiAdim(''); setDropNedeni('');
    onUpdate();
  };
  const handleIletisim = () => patch({ takipGirisimi: true, takipNotu: not || null, sonrakiAdim: sonrakiAdim || null, durum: 'iletisim_girisimi' });
  const handleRandevu = () => patch({ takipGirisimi: true, takipNotu: not || 'Yeni randevu alındı.', durum: 'yeni_randevu' });
  const handleDrop = () => patch({ durum: 'drop', mazeret: dropNedeni || null });
  const handleTamamlandi = () => patch({ durum: 'tamamlandi' });

  return (
    <div className="tk" style={{ ['--tk-c' as any]: a.color }}>
      <div className="tk-l">
        <div className="tk-top">
          <span className="tk-badge">{a.label} · {gun} gün</span>
          <span className="tk-name">{kayit.clientName}</span>
        </div>
        <div className="tk-meta">
          {kayit.seansNo}. seans · son randevu {formatTarih(kayit.randevuTarihi)}{kayit.randevuSaati ? ` · ${kayit.randevuSaati}` : ''} · <b>{gun} gündür sessiz</b>
        </div>
        <div className="tk-msg">{getMesaj(gun)}</div>
        {(kayit.takipSayisi > 0 || kayit.takipNotu || kayit.sonrakiAdim) && (
          <div className="tk-track">
            {kayit.takipSayisi > 0 && <div>girişim<b>{kayit.takipSayisi}×</b></div>}
            {kayit.takipNotu && <div>son not<b>{kayit.takipNotu}</b></div>}
            {kayit.sonrakiAdim && <div>sonraki adım<b>{kayit.sonrakiAdim}</b></div>}
            {kayit.takipTarihi && <div>son girişim<b>{new Date(kayit.takipTarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</b></div>}
          </div>
        )}
      </div>

      <div className="tk-acts">
        <button type="button" className="tk-act prim" onClick={() => setAksiyon(aksiyon === 'iletisim' ? null : 'iletisim')}><Phone className="w-4 h-4" /> Ara / yaz</button>
        <button type="button" className="tk-act" onClick={() => setAksiyon(aksiyon === 'randevu' ? null : 'randevu')}><Calendar className="w-4 h-4" /> Yeni randevu</button>
        <button type="button" className="tk-act" onClick={handleTamamlandi}><CheckCircle className="w-4 h-4" /> Tamamlandı</button>
        <button type="button" className="tk-act danger" onClick={() => setAksiyon(aksiyon === 'drop' ? null : 'drop')}><XCircle className="w-4 h-4" /> Sonlandır</button>
      </div>

      {aksiyon === 'iletisim' && (
        <div className="tk-note">
          <p>Ne konuştunuz / nasıl geçti?</p>
          <textarea value={not} onChange={(e) => setNot(e.target.value)} placeholder="Aradım, mesaj attım, ulaşamadım…" />
          <div className="nrow">
            <input type="text" value={sonrakiAdim} onChange={(e) => setSonrakiAdim(e.target.value)} placeholder="Sonraki adım (opsiyonel)…" />
            <button type="button" className="tk-save" onClick={handleIletisim} disabled={saving}>{saving ? '…' : 'Kaydet'}</button>
            <button type="button" className="tk-cancel" onClick={() => setAksiyon(null)}>İptal</button>
          </div>
        </div>
      )}
      {aksiyon === 'randevu' && (
        <div className="tk-note">
          <p>Randevu detayı (opsiyonel)</p>
          <div className="nrow">
            <input type="text" value={not} onChange={(e) => setNot(e.target.value)} placeholder="Tarih, saat veya not…" />
            <button type="button" className="tk-save" onClick={handleRandevu} disabled={saving}>{saving ? '…' : 'Onayla'}</button>
            <button type="button" className="tk-cancel" onClick={() => setAksiyon(null)}>İptal</button>
          </div>
        </div>
      )}
      {aksiyon === 'drop' && (
        <div className="tk-note">
          <p>Süreci sonlandırma nedeni</p>
          <textarea value={dropNedeni} onChange={(e) => setDropNedeni(e.target.value)} placeholder="Danışan devam etmek istemedi / ulaşılamıyor…" />
          <div className="nrow">
            <button type="button" className="tk-save" onClick={handleDrop} disabled={saving} style={{ background: '#A23B2E' }}>{saving ? '…' : 'Sonlandır'}</button>
            <button type="button" className="tk-cancel" onClick={() => setAksiyon(null)}>İptal</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ana bileşen ──────────────────────────────────────────────────────────
export default function TakipListesi({ onOpenFormulation }: { onOpenFormulation?: (id: string) => void }) {
  void onOpenFormulation;
  const [kayitlar, setKayitlar] = useState<TakipKaydi[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch('/api/seans-bildirimleri').then((r) => r.json()).catch(() => []);
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

  const head = (
    <div className="pane-head">
      <span className="eyebrow">takip</span>
      <h2>Takip</h2>
      <p>İletişimi kesilen danışanlar — geri dönüş için yumuşak bir hatırlatma.</p>
    </div>
  );

  if (loading) return <>{head}</>;

  if (kayitlar.length === 0) return (
    <>
      {head}
      <div className="empty">
        <div className="empty-ic"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <h2 className="empty-t">Takip bekleyen danışan yok</h2>
        <p className="empty-d">Herkes güncel — geri dönüş bekleyen danışan bulunmuyor.</p>
      </div>
    </>
  );

  const groups = [
    { title: 'Kritik · 14+ gün', items: kayitlar.filter((k) => gunFarki(k.randevuTarihi) >= 14) },
    { title: 'Acil · 7–13 gün', items: kayitlar.filter((k) => { const g = gunFarki(k.randevuTarihi); return g >= 7 && g < 14; }) },
    { title: 'Dikkat · 3–6 gün', items: kayitlar.filter((k) => { const g = gunFarki(k.randevuTarihi); return g >= 3 && g < 7; }) },
    { title: 'Yeni · 0–2 gün', items: kayitlar.filter((k) => gunFarki(k.randevuTarihi) < 3) },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      <div className="tk-head">
        <div>
          <span className="eyebrow">takip</span>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 'clamp(24px,2.8vw,34px)', fontWeight: 500, letterSpacing: '-.026em', margin: '6px 0 0', color: 'var(--ink-strong)' }}>
            Takip bekleyen danışanlar <span className="tk-headnum">{kayitlar.length}</span>
          </h2>
        </div>
      </div>
      <div className="tk-intro">
        <Clock className="w-4 h-4" style={{ display: 'inline', verticalAlign: '-3px', marginRight: 7 }} />
        Kaçırılan seanslardan sonra iletişime geçmek hem danışan hem terapist için zor olabilir — bu liste hatırlatmak için burada. <b>Küçük bir adım yeterli.</b>
      </div>
      {groups.map((g) => (
        <div key={g.title}>
          <div className="tk-group-eye">{g.title}</div>
          <div className="takip-list">
            {g.items.map((k) => <TakipKarti key={k.id} kayit={k} onUpdate={load} />)}
          </div>
        </div>
      ))}
    </>
  );
}
