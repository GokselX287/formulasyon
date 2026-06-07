'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { OLCEKLER } from '@/lib/olcekler';
import { DEFAULT_HEX_SCALE, HEX_LIKERT_MAX, type HexGroup } from '@/lib/hexaflexScale';
import './danisanForm.css';

// ──────────────────────────────────────────────────────────────────────────
// Danışan Ön-Form (dış) — "Danışan Formu v2.html" görsel dili (şasisiz, mobil,
// markalı, adım adım + ilerleme + onam + teşekkür). Mevcut veri modeli korunur:
// formTipi 'olcek' (skor) veya 'on_form' (4 soru). POST /api/form/[token].
// ──────────────────────────────────────────────────────────────────────────

type FormMeta = {
  token: string; clientName: string; formTipi: string;
  olcekId: string | null; olcekAd: string | null; alreadySubmitted: boolean;
  payload?: any;
};
type PageProps = { params: Promise<{ token: string }> };

const ON_FORM_FIELDS = [
  { key: 'hissettim', e: 'Bu hafta', title: 'Bu hafta nasıl hissettiniz?', ph: 'Genel ruh halinizi kısaca anlatın…' },
  { key: 'zorluklar', e: 'Zorluklar', title: 'Karşılaştığınız zorluklar nelerdi?', ph: 'Zorlandığınız durumlar, olaylar…' },
  { key: 'beklentiler', e: 'Beklenti', title: 'Bu seanstan beklentileriniz?', ph: 'Bugün ne üzerine çalışmak istersiniz…' },
  { key: 'odev', e: 'Ödev', title: 'Ödevinizi yapabildiniz mi?', ph: 'Yaptıysanız nasıl geçti, yapamadıysanız neden…' },
] as const;

export default function FormPage({ params }: PageProps) {
  const { token } = React.use(params);
  const [meta, setMeta] = useState<FormMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [cur, setCur] = useState(0);
  const [skor, setSkor] = useState('');
  const [vals, setVals] = useState<Record<string, string>>({});
  const [hexAns, setHexAns] = useState<Record<string, number>>({});
  const [consent, setConsent] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    fetch(`/api/form/${token}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else { setMeta(d); if (d.alreadySubmitted) setSubmitted(true); } })
      .catch(() => setError('Form yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [token]);

  const isOlcek = meta?.formTipi === 'olcek';
  const isOnam = meta?.formTipi === 'onam';
  const isEsneklik = meta?.formTipi === 'esneklik';
  const isKitapcik = meta?.formTipi === 'kitapcik';
  const kitapcik = isKitapcik ? (meta?.payload ?? {}) : null;
  const isMatris = meta?.formTipi === 'act-matris';
  const matris = isMatris ? (meta?.payload ?? {}) : null;
  const olcek = meta?.olcekId ? OLCEKLER.find((o) => o.id === meta.olcekId) : null;
  const hexScale: HexGroup[] = isEsneklik ? (meta?.payload?.length ? meta.payload : DEFAULT_HEX_SCALE) : [];

  // Adım listesi: içerik adımları + onam
  const steps = useMemo(() => {
    if (isOnam) return [{ kind: 'onam' as const }, { kind: 'consent' as const }];
    if (isKitapcik) return [{ kind: 'kitapcik' as const }];
    if (isMatris) return [{ kind: 'matris' as const }];
    if (isOlcek) return [{ kind: 'olcek' as const }, { kind: 'consent' as const }];
    if (isEsneklik) return [...hexScale.map((g) => ({ kind: 'hexgroup' as const, group: g })), { kind: 'consent' as const }];
    return [...ON_FORM_FIELDS.map((f) => ({ kind: 'field' as const, field: f })), { kind: 'consent' as const }];
  }, [isOlcek, isOnam, isEsneklik, isKitapcik, isMatris, hexScale]);

  const N = steps.length;
  const step = steps[cur];
  const pct = Math.round((cur / N) * 100);

  async function submit() {
    if (!meta) return;
    setSubmitting(true);
    const yanitData = isOnam
      ? { type: 'onam', onaylandi: true, tarih: new Date().toISOString() }
      : isOlcek
      ? { type: 'olcek', olcekId: meta.olcekId, olcekAd: meta.olcekAd ?? olcek?.ad, skor: Number(skor), tarih: new Date().toISOString() }
      : isEsneklik
      ? { type: 'esneklik', answers: hexAns, tarih: new Date().toISOString() }
      : isKitapcik
      ? { type: 'kitapcik', baslik: kitapcik?.title ?? '', okundu: true, tarih: new Date().toISOString() }
      : isMatris
      ? { type: 'act-matris', okundu: true, tarih: new Date().toISOString() }
      : { type: 'on_form', hissettim: vals.hissettim ?? '', zorluklar: vals.zorluklar ?? '', beklentiler: vals.beklentiler ?? '', odev: vals.odev ?? '', tarih: new Date().toISOString() };
    try {
      const res = await fetch(`/api/form/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ yanitData }) });
      if (res.ok) setSubmitted(true);
      else { const d = await res.json(); setError(d.error ?? 'Gönderim başarısız.'); }
    } catch { setError('Bağlantı hatası.'); } finally { setSubmitting(false); }
  }

  const next = () => {
    if (step.kind === 'consent' && !consent) { setShake(true); setTimeout(() => setShake(false), 300); return; }
    if (cur < N - 1) { setCur((c) => c + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else submit();
  };

  const skorNum = skor !== '' ? Number(skor) : null;
  const sinif = (olcek && skorNum !== null) ? olcek.sinif.find((s) => skorNum >= s.s && skorNum <= s.e) : null;

  // ── Durumlar ──
  if (loading) return <div className="df2"><div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}><div className="df-spin" /></div></div>;

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="df2"><div className="page">
      <div className="brand">
        <span className="mk">GA</span>
        <span className="bt">Göksel Akkaya<span>Klinik Ön Değerlendirme</span></span>
        <span className="secure"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>Şifreli</span>
      </div>
      {children}
      <div className="legal">KVKK kapsamında korunur · yalnızca terapistinizle paylaşılır</div>
    </div></div>
  );

  if (error) return <Shell><div className="done-screen on"><span className="ring" style={{ background: 'var(--paper-2)', color: 'var(--ink-mute)' }}><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></span><h2>Form bulunamadı</h2><p>{error}</p></div></Shell>;

  if (submitted) return <Shell><div className="done-screen on"><span className="ring"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg></span><h2>Teşekkürler!</h2><p>Yanıtların güvenle iletildi. Göksel Akkaya ilk görüşmenizden önce bunları gözden geçirecek.</p><span className="foot">Bu pencereyi kapatabilirsiniz.</span></div></Shell>;

  return (
    <Shell>
      <div className="prog">
        <div className="pt"><span className="st">Adım {cur + 1}/{N} · Sayın {meta?.clientName ?? '—'}</span><span className="pc num">{pct}%</span></div>
        <div className="track"><span className="fill" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="step on">
        {step.kind === 'field' && (<>
          <div className="step-h"><span className="e">{step.field.e}</span><h1>{step.field.title}</h1></div>
          <div className="field">
            <textarea value={vals[step.field.key] ?? ''} onChange={(e) => setVals((v) => ({ ...v, [step.field.key]: e.target.value }))} placeholder={step.field.ph} />
            <span className="hint">İstersen boş bırakabilirsin.</span>
          </div>
        </>)}

        {step.kind === 'olcek' && (<>
          <div className="step-h"><span className="e">Kısa ölçek</span><h1>{olcek?.tam ?? meta?.olcekAd ?? 'Ölçek değerlendirmesi'}</h1><p>Toplam puanınızı girin (0 – {olcek?.max ?? 0}). Bu bilgi seans öncesinde terapistinizle paylaşılır.</p></div>
          <div className="field">
            <label>Toplam Puan <span className="hint">(0 – {olcek?.max ?? 0})</span></label>
            <input type="number" min={0} max={olcek?.max} value={skor} onChange={(e) => setSkor(e.target.value)} placeholder="Puanı giriniz" />
          </div>
          {sinif && <div className="df-band" style={{ background: sinif.c + '20', color: sinif.c }}>{olcek?.ad}: <b>{sinif.l}</b> ({skor} puan)</div>}
        </>)}

        {step.kind === 'hexgroup' && (<>
          <div className="step-h"><span className="e">Psikolojik esneklik · {step.group.label}</span><h1>{step.group.sade}</h1><p>Her cümleye ne kadar katıldığını işaretle. (0 = Hiç katılmıyorum · {HEX_LIKERT_MAX} = Tamamen katılıyorum)</p></div>
          <div className="hexq-list">
            {step.group.questions.map((q) => (
              <div className="hexq" key={q.id}>
                <div className="hexq-text">{q.text}</div>
                <div className="hexq-scale" role="radiogroup" aria-label={q.text}>
                  {Array.from({ length: HEX_LIKERT_MAX + 1 }, (_, n) => (
                    <button key={n} type="button" className={`hexq-dot${hexAns[q.id] === n ? ' on' : ''}`}
                      aria-pressed={hexAns[q.id] === n} aria-label={String(n)}
                      onClick={() => setHexAns((a) => ({ ...a, [q.id]: n }))}>{n}</button>
                  ))}
                </div>
                <div className="hexq-ends"><span>Hiç</span><span>Tamamen</span></div>
              </div>
            ))}
          </div>
        </>)}

        {step.kind === 'kitapcik' && (<>
          <div className="step-h"><span className="e">Bilgilendirme</span><h1>{kitapcik?.title ?? 'Bilgilendirme kitapçığı'}</h1><p>Terapistiniz bu bilgilendirme metnini sizinle paylaştı.</p></div>
          <div className="field" style={{ maxHeight: 420, overflowY: 'auto', lineHeight: 1.65, fontSize: 14.5, whiteSpace: 'pre-wrap' }}>
            {kitapcik?.body ?? ''}
          </div>
        </>)}

        {step.kind === 'matris' && (<>
          <div className="step-h"><span className="e">ACT Matrisi</span><h1>{matris?.title ?? 'ACT Matrisi'}</h1><p>Terapistinle birlikte çıkardığınız harita — önemli olana doğru mu, ondan uzağa mı?</p></div>
          <div className="mtx-list">
            {(matris?.quadrants ?? []).map((q: any, i: number) => (
              <div className={`mtx-q ${q.side === 'Yöne' ? 'toward' : 'away'}`} key={i}>
                <div className="mtx-side">{q.side}</div>
                <div className="mtx-qtext">{q.q}</div>
                <ul className="mtx-items">{(q.items ?? []).map((it: string, j: number) => <li key={j}>{it}</li>)}</ul>
              </div>
            ))}
          </div>
          {matris?.homework ? <div className="df-band" style={{ background: 'var(--paper-2)', color: 'var(--ink-soft)', marginTop: 4 }}><b>Ödev:</b> {matris.homework}</div> : null}
        </>)}

        {step.kind === 'onam' && (<>
          <div className="step-h"><span className="e">Onam</span><h1>Psikoterapi & KVKK Onam Formu</h1><p>Lütfen aşağıdaki metni okuyun. Sonraki adımda onayınızı vereceksiniz.</p></div>
          <div className="field" style={{ maxHeight: 360, overflowY: 'auto', lineHeight: 1.55, fontSize: 14 }}>
            <p><b>1. Psikoterapi Süreci.</b> Psikoterapi; ruh sağlığını desteklemeye yönelik, danışan ile terapistin iş birliğine dayanan bir süreçtir. Sürecin etkisi kişiden kişiye değişebilir; belirli bir sonuç garanti edilmez. Seanslara düzenli katılım ve açık iletişim sürecin verimini artırır.</p>
            <p style={{ marginTop: 12 }}><b>2. Gizlilik.</b> Görüşmelerde paylaştığınız bilgiler mesleki etik ve yasal çerçevede gizli tutulur. Gizliliğin istisnaları; kendinize veya bir başkasına yönelik ciddi ve yakın bir tehlike, çocuk/yaşlı istismarı şüphesi ve yasal zorunluluk hâlleridir.</p>
            <p style={{ marginTop: 12 }}><b>3. KVKK — Kişisel Verilerin İşlenmesi.</b> Paylaştığınız kişisel ve özel nitelikli (sağlık) veriler, yalnızca değerlendirme ve terapi sürecinin yürütülmesi amacıyla, 6698 sayılı KVKK kapsamında işlenir ve cihazda güvenli biçimde saklanır. Verileriniz üçüncü kişilerle paylaşılmaz.</p>
            <p style={{ marginTop: 12 }}><b>4. Randevu & İptal.</b> Seans süresi 50 dakikadır. İptal veya erteleme için en az 24 saat önce bilgi verilmesi beklenir.</p>
            <p style={{ marginTop: 12 }}><b>5. Haklarınız.</b> Onamınızı dilediğiniz zaman geri çekebilir; verilerinize erişim, düzeltme ve silinme taleplerinde bulunabilirsiniz.</p>
          </div>
        </>)}

        {step.kind === 'consent' && (<>
          <div className="step-h"><span className="e">Son adım</span><h1>Gizlilik ve onam</h1></div>
          <div className={`consent${consent ? ' on' : ''}`} onClick={() => setConsent((c) => !c)} style={shake ? { animation: 'df-shake .3s' } : undefined}>
            <span className="cb"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg></span>
            <span className="ct">Verdiğim bilgilerin <b>KVKK kapsamında</b> korunduğunu, yalnızca terapistimle paylaşılacağını ve ilk değerlendirme amacıyla kullanılacağını okudum, kabul ediyorum.</span>
          </div>
        </>)}
      </div>

      <div className="nav">
        <button className="prev" type="button" disabled={cur === 0} onClick={() => { if (cur > 0) setCur((c) => c - 1); }}>Geri</button>
        <button className="next" type="button" onClick={next} disabled={submitting || (step.kind === 'olcek' && skor === '') || (step.kind === 'hexgroup' && step.group.questions.some((q) => hexAns[q.id] === undefined))}>
          <span>{submitting ? 'Gönderiliyor…' : cur === N - 1 ? ((isKitapcik || isMatris) ? 'Okudum, kapat' : 'Gönder') : 'Devam'}</span>
          <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </div>
    </Shell>
  );
}
