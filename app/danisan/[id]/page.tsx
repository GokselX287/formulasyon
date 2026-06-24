'use client';

// ──────────────────────────────────────────────────────────────────────────
// Danışan Dosyası — AÇILIŞ ekranı (v3 "derleme").
// Beyaz frosted-glass zemin + üst/alt ekrana birleşmiş tam-boy modal sheet.
// İçinde danışanın TÜM verisi düzgün sıralı (tanım listeleri), eksik alanlar
// işaretli ve SORUN DÖNGÜSÜ gerçek diyagramıyla görselleştirilmiş.
// ──────────────────────────────────────────────────────────────────────────

import { use, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DiagramViewer } from '@/components/BozuklukDongusu';
import '@/components/BozuklukDongusu.css';
import './danisanDosya2.css';

type StageKey = 'anamnez' | 'degerlendirme' | 'dongu' | 'gorusmeler' | 'ilerleme' | 'rapor';
type Audience = 'terapist' | 'danisan';

const ACTIONABLE: StageKey[] = ['anamnez', 'degerlendirme', 'dongu', 'gorusmeler', 'ilerleme'];

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif', intake: 'İlk görüşme', passive: 'Pasif', follow: 'Takipte', dropped: 'Ayrıldı',
};

function initials(n: string) {
  return (n || '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0].toLocaleUpperCase('tr')).join('') || '—';
}
function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function computeState(completed: StageKey[]) {
  const done = new Set<StageKey>(completed);
  const firstPending = ACTIONABLE.find((k) => !done.has(k));
  const allDone = !firstPending;
  const activeKey: StageKey = allDone ? 'rapor' : (firstPending as StageKey);
  const doneCount = ACTIONABLE.filter((k) => done.has(k)).length;
  const total = ACTIONABLE.length;
  const pct = allDone ? 100 : Math.round((doneCount / total) * 100);
  const stageNo = allDone ? total : doneCount + 1;
  return { done, allDone, activeKey, doneCount, total, pct, stageNo };
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const Check = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.6}
    strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
);

// ── veri haritası (anamnez alan anahtarları + formülasyon paneli) ──
const isEmptyVal = (v: unknown) =>
  v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);

const RISK_TR: Record<string, string> = {
  var: 'Var', yok: 'Yok', plan: 'Plan var', girisim: 'Girişim öyküsü',
  aktif: 'Aktif', gecmis: 'Geçmişte', risk: 'Risk var',
  dusuk: 'Düşük', orta: 'Orta', yuksek: 'Yüksek',
};
function fmtVal(v: unknown): string {
  if (Array.isArray(v)) return v.join(' · ');
  if (typeof v === 'boolean') return v ? 'Var' : 'Yok';
  const s = String(v);
  return RISK_TR[s] ?? s;
}

type DField = { label: string; val: unknown };
type DGroup = { band: 'anamnez' | 'formulasyon'; title: string; to: string; terapistOnly?: boolean; fields: DField[] };

function buildDataGroups(id: string, an: any, p: any): DGroup[] {
  an = an || {}; p = p || {};
  const sec = p.sections || {}, fourP = p.fourP || {}, beck = p.beck || {}, long = p.longitudinal || {};
  const anam = `/clients/${id}/anamnez`;
  const form = `/uygulama?tab=formulation&client=${id}`;
  return [
    { band: 'anamnez', title: 'Kişisel bilgiler', to: anam, fields: [
      { label: 'Ad Soyad', val: an.demografik?.adSoyad },
      { label: 'Yaş', val: an.demografik?.yas },
      { label: 'Cinsiyet', val: an.demografik?.cinsiyet },
      { label: 'Medeni durum', val: an.demografik?.medeniDurum },
      { label: 'Meslek', val: an.demografik?.meslek },
      { label: 'Şehir', val: an.demografik?.sehir },
      { label: 'İş durumu', val: an.isSosyal?.isDurumu },
      { label: 'Kendini tanımlama', val: an.demografik?.kendiSifatlar },
    ] },
    { band: 'anamnez', title: 'Başvuru & şikâyet', to: anam, fields: [
      { label: 'Başvuru nedeni', val: an.basvuru?.sebep },
      { label: 'Ana yakınma', val: an.basvuru?.anaYakinma },
      { label: 'Başvuru şekli', val: an.basvuru?.yonlendiren },
      { label: 'Görüşme şekli', val: an.basvuru?.gorusmeSekli },
      { label: 'Şikâyet süresi', val: an.sikayet?.baslangic },
      { label: 'Vurucu olay', val: an.sikayet?.vurucuOlay },
      { label: 'Tetikleyiciler', val: an.sikayet?.tetikleyicilerNot },
    ] },
    { band: 'anamnez', title: 'Psikiyatrik & tıbbi', to: anam, fields: [
      { label: 'Önceki başvuru', val: an.psikiyatrik?.oncekiBasvuru },
      { label: 'Psikiyatrik ilaç', val: an.psikiyatrik?.ilacNot },
      { label: 'Yatış öyküsü', val: an.psikiyatrik?.yatis?.var },
      { label: 'Kronik hastalık', val: an.tibbi?.kronikNot },
      { label: 'Tıbbi ilaçlar', val: an.tibbi?.ilac },
    ] },
    { band: 'anamnez', title: 'Aile öyküsü', to: anam, fields: [
      { label: 'Ailede öykü', val: an.aile?.genogram },
      { label: 'Anne', val: an.aile?.anneTarif },
      { label: 'Baba', val: an.aile?.babaTarif },
      { label: 'Anne–baba ilişkisi', val: an.aile?.anneBabaIliski },
      { label: 'Kardeşler', val: an.aile?.kardesTarif || an.aile?.kardesDurum },
      { label: 'İstismar / adaletsizlik', val: an.aile?.istismarVar },
    ] },
    { band: 'anamnez', title: 'Madde kullanımı', to: anam, fields: [
      { label: 'Alkol', val: an.madde?.alkol },
      { label: 'Sigara', val: an.madde?.sigara },
      { label: 'Madde', val: an.madde?.madde },
    ] },
    { band: 'anamnez', title: 'Danışanın hikâyesi', to: anam, fields: [
      { label: 'Çocukluk', val: an.gelisim?.cocuklukTarif },
      { label: 'Ergenlik', val: an.gelisim?.ergenlikTarif },
      { label: 'O dönem destek', val: an.gelisim?.erkenDestek },
      { label: 'Yaşam olayları', val: an.gelisim?.yasamOlaylari },
    ] },
    { band: 'anamnez', title: 'İlişkiler', to: anam, fields: [
      { label: 'İlişki durumu', val: an.iliskiler?.romantik },
      { label: 'İlişki örüntüleri', val: an.iliskiler?.baglanma },
      { label: 'Sosyal destek', val: an.isSosyal?.destekNot },
      { label: 'Bağlanma stili', val: an.iliskiler?.baglanmaStili },
    ] },
    { band: 'anamnez', title: 'Travma', to: anam, fields: [
      { label: 'Travma öyküsü', val: an.travma?.travmaVar },
      { label: 'Açıklama', val: an.travma?.travmaNot },
    ] },
    { band: 'anamnez', title: 'Risk değerlendirme', to: anam, terapistOnly: true, fields: [
      { label: 'İntihar düşüncesi', val: an.risk?.intihar },
      { label: 'Plan / niyet', val: an.risk?.planNiyet },
      { label: 'Kendine zarar', val: an.risk?.zarar },
      { label: 'Başkasına zarar', val: an.risk?.baskasi },
      { label: 'Genel risk düzeyi', val: an.risk?.seviye },
    ] },
    { band: 'anamnez', title: 'Hedefler', to: anam, fields: [
      { label: 'Terapi hedefleri', val: an.hedefler?.hedeflerNot },
      { label: 'Beklenti / motivasyon', val: an.hedefler?.beklenti },
    ] },
    { band: 'formulasyon', title: 'Sunum & hedef', to: form, fields: [
      { label: 'Sunum problemi', val: sec.presentingProblem },
      { label: 'Danışan hedefi', val: sec.clientGoal },
      { label: 'Terapist hedefi', val: sec.therapistGoal },
    ] },
    { band: 'formulasyon', title: '4P formülasyon', to: form, fields: [
      { label: 'Predispozan', val: fourP.predisposing },
      { label: 'Presipitan', val: fourP.precipitating },
      { label: 'Perpetuan', val: fourP.perpetuating },
      { label: 'Protektif', val: fourP.protective },
    ] },
    { band: 'formulasyon', title: 'Bilişsel & özet', to: form, fields: [
      { label: 'Temel inanç', val: beck.coreBelief },
      { label: 'Ara inançlar', val: beck.rules },
      { label: 'Otomatik düşünceler', val: beck.automaticThoughts },
      { label: 'Formülasyon özeti', val: p.summary },
    ] },
    { band: 'formulasyon', title: 'Uzunlamasına formülasyon', to: form, fields: [
      { label: 'Erken yaşantılar', val: long.earlyExperiences },
      { label: 'Temel inançlar', val: long.coreBeliefs },
      { label: 'Ara inançlar', val: long.intermediateBeliefs },
      { label: 'Başa çıkma stratejileri', val: long.copingStrategies },
    ] },
  ];
}

// ── küçük sunum bileşenleri ──
function SecHead({ kicker, title, right }: { kicker: string; title: string; right?: ReactNode }) {
  return (
    <div className="dfx-sechead">
      <div>
        <span className="dfx-kicker">{kicker}</span>
        <h2>{title}</h2>
      </div>
      {right}
    </div>
  );
}

function DataGroup({ g, onFill }: { g: DGroup; onFill: (to: string) => void }) {
  const miss = g.fields.filter((f) => isEmptyVal(f.val)).length;
  return (
    <div className={`dfx-grp${g.terapistOnly ? ' terapist-only' : ''}`}>
      <div className="dfx-grp-head">
        <h3>{g.title}</h3>
        <span className={`dfx-tag ${miss ? 'warn' : 'ok'}`}>{miss ? `${miss} eksik` : 'tam'}</span>
      </div>
      <dl className="dfx-dl">
        {g.fields.map((f) => {
          const empty = isEmptyVal(f.val);
          return (
            <div key={f.label} className={empty ? 'empty' : ''}>
              <dt>{f.label}</dt>
              <dd>{empty ? <span className="dfx-miss">—</span> : fmtVal(f.val)}</dd>
            </div>
          );
        })}
      </dl>
      {miss > 0 && (
        <button className="dfx-fill" type="button" onClick={() => onFill(g.to)}>
          {miss} eksik alanı doldur <Arrow />
        </button>
      )}
    </div>
  );
}

export default function DanisanDosyasiAcilis({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [mode, setMode] = useState<Audience>('terapist');
  const danisan = mode === 'danisan';

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [anamnez, setAnamnez] = useState<any>(null);
  const [panel, setPanel] = useState<any>(null);
  const [cycles, setCycles] = useState<any[]>([]);
  const [seanslar, setSeanslar] = useState<any[]>([]);
  const [flags, setFlags] = useState({ anamnez: false, degerlendirme: false, dongu: false, gorusmeler: false, ilerleme: false });

  const bodyRef = useRef<HTMLDivElement>(null);
  const [activeSec, setActiveSec] = useState('durum');

  const backTo = '/uygulama?tab=calisma-alani&room=danisanlar';

  const stages = useMemo(() => ([
    { key: 'anamnez' as StageKey, title: 'Anamnez', to: `/clients/${id}/anamnez`, desc: 'Tanışma, başvuru nedeni ve geçmiş.' },
    { key: 'degerlendirme' as StageKey, title: 'Değerlendirme', to: `/uygulama?tab=formulation&client=${id}`, desc: 'Ölçek bataryası ve klinik formülasyon.' },
    { key: 'dongu' as StageKey, title: 'Sorun döngüsü', to: `/clients/${id}/dongu`, desc: 'Bozukluğu sürdüren döngüyü çıkar.' },
    { key: 'gorusmeler' as StageKey, title: 'Görüşmeler', to: `/profil/${id}?focus=seanslar`, desc: 'Seans kayıtları, teknikler, ödevler.' },
    { key: 'ilerleme' as StageKey, title: 'İlerleme', to: `/profil/${id}`, desc: 'Skor serileri ve esneklik göstergeleri.' },
  ]), [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cl, a, p, cyc, ss] = await Promise.all([
          fetch(`/api/clients/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`/api/anamnez/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`/api/formulations/${id}/panel`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`/api/danisan-dongu?clientId=${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`/api/seanslar?clientId=${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        if (!alive) return;
        setClient(cl && !cl.error ? cl : null);
        setAnamnez(a && typeof a === 'object' && !a.error ? a : null);
        setPanel(p && typeof p === 'object' ? p : null);
        setCycles(Array.isArray(cyc) ? cyc : []);
        setSeanslar(Array.isArray(ss) ? ss : []);
        const anamnezDone = !!(a && typeof a === 'object' && Object.values(a).some((v) =>
          (typeof v === 'string' && v.trim()) || (Array.isArray(v) && v.length) ||
          (v && typeof v === 'object' && Object.values(v).some((x) =>
            (typeof x === 'string' && x.trim()) || (Array.isArray(x) && x.length)))));
        const donguDone = Array.isArray(cyc) && cyc.some((c: any) => {
          let f = c?.fields_json ?? c?.fields;
          if (typeof f === 'string') { try { f = JSON.parse(f); } catch { f = null; } }
          return f && typeof f === 'object' && Object.values(f).some((v) =>
            (typeof v === 'string' && v.trim()) || (Array.isArray(v) && v.length));
        });
        const maturity = Number(p?.maturity ?? 0);
        const seansCount = Number(p?.sessionTimeline?.length ?? 0);
        setFlags({
          anamnez: anamnezDone, degerlendirme: maturity > 0, dongu: donguDone,
          gorusmeler: seansCount > 0,
          ilerleme: Array.isArray(p?.sessionTimeline) && p.sessionTimeline.length > 0 && maturity > 0,
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const completed = useMemo(() => ACTIONABLE.filter((k) => (flags as any)[k]) as StageKey[], [flags]);
  const st = computeState(completed);

  const groups = useMemo(() => buildDataGroups(id, anamnez, panel), [id, anamnez, panel]);
  const anamnezGroups = groups.filter((g) => g.band === 'anamnez');
  const formGroups = groups.filter((g) => g.band === 'formulasyon');
  const fill = useMemo(() => {
    const total = groups.reduce((a, g) => a + g.fields.length, 0);
    const miss = groups.reduce((a, g) => a + g.fields.filter((f) => isEmptyVal(f.val)).length, 0);
    return { total, miss, pct: total ? Math.round(((total - miss) / total) * 100) : 0 };
  }, [groups]);

  // parsed cycles
  const parsedCycles = useMemo(() => cycles.map((c) => {
    let f = c?.fields_json ?? c?.fields;
    if (typeof f === 'string') { try { f = JSON.parse(f); } catch { f = {}; } }
    return { id: c.id, type: c.type, label: c.label as string | null, fields: f && typeof f === 'object' ? f : {} };
  }), [cycles]);

  // seans kayıtları — derlenmiş (en yeni üstte)
  const seansKayit = useMemo(() => {
    return (seanslar || [])
      .slice()
      .sort((a, b) => String(b.tarih ?? '').localeCompare(String(a.tarih ?? '')))
      .map((s, i) => {
        const n = s.seansNotu ?? {}; const d = s.detay ?? {};
        const tek = Array.isArray(n.kullanilanTeknikler) ? n.kullanilanTeknikler
          : Array.isArray(n.teknikler) ? n.teknikler : [];
        return {
          no: s.no ?? (i + 1),
          tip: s.tip ?? 'seans',
          date: fmtDate(s.tarih),
          durum: ['katildi', 'katilmadi', 'ertelendi', 'iptal'].includes(s.durum) ? s.durum : 'katildi',
          title: n.seansOdagi || (s.tip === 'anamnez' ? 'Anamnez görüşmesi' : `Seans ${s.no ?? i + 1}`),
          summary: d.seansOzeti || n.gelisimGozlemi || n.gundemMaddeleri || n.terapistNotu || n.notlar || '—',
          teknikler: tek.filter((t: any) => typeof t === 'string' && t.trim()),
        };
      });
  }, [seanslar]);

  // section nav
  const RAIL = useMemo(() => {
    const base = [
      { id: 'durum', label: 'Durum' },
      { id: 'temel', label: 'Temel bilgiler & hikâye' },
      { id: 'formulasyon', label: 'Formülasyon' },
    ];
    return danisan ? base : [...base, { id: 'seanslar', label: 'Seanslar' }];
  }, [danisan]);
  const scrollToSec = (sid: string) => {
    const root = bodyRef.current;
    const target = root?.querySelector<HTMLElement>(`#${sid}`);
    if (root && target) root.scrollTo({ top: target.offsetTop - 8, behavior: 'smooth' });
  };

  useEffect(() => {
    if (loading) return;
    const root = bodyRef.current;
    if (!root) return;
    const secs = Array.from(root.querySelectorAll<HTMLElement>('.dfx-sec'));
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => { if (e.isIntersecting) setActiveSec(e.target.id); }),
      { root, threshold: 0.12, rootMargin: '-8% 0px -65% 0px' },
    );
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [loading, danisan]);

  const name = client?.adSoyad ?? client?.name ?? '';
  const status = client?.status ?? 'intake';
  const statusLabel = STATUS_LABEL[status] ?? status;
  const statusNote = st.allDone ? 'Tamamlandı' : st.doneCount === 0 ? 'Yeni dosya' : `${st.doneCount}/${st.total} aşama tamam`;
  const bigLabel = st.allDone ? 'Tüm aşamalar tamamlandı' : `${stages.find((s) => s.key === st.activeKey)?.title ?? ''} bekleniyor`;

  return (
    <div className="dfx" data-mode={mode}>
      <div className="dfx-bg" aria-hidden="true" />

      <div className="dfx-sheet" role="dialog" aria-modal="true" aria-label="Danışan dosyası">
        {/* ── sticky header ── */}
        <header className="dfx-head">
          <button className="dfx-back" type="button" onClick={() => router.push(backTo)}>
            <span className="chev">‹</span> Danışanlar
          </button>
          <div className="dfx-head-mid">
            <span className="dfx-mono">{initials(name)}</span>
            <div className="dfx-head-id">
              <b>{name || 'Danışan'}</b>
              <small>{statusLabel} · {statusNote}</small>
            </div>
          </div>
          <div className="dfx-toggle">
            <span className="dfx-thumb" style={{ left: danisan ? '50%' : 3, width: 'calc(50% - 3px)' }} />
            <button type="button" aria-pressed={!danisan} onClick={() => setMode('terapist')}>Terapist</button>
            <button type="button" aria-pressed={danisan} onClick={() => setMode('danisan')}>Danışan</button>
          </div>
          <button className="dfx-print" type="button" onClick={() => window.print()} aria-label="Yazdır / PDF" title="Yazdır / PDF olarak kaydet">
            <svg viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>
            <span>Yazdır</span>
          </button>
        </header>

        {/* ── scrollable body ── */}
        <div className="dfx-body" ref={bodyRef}>
          {loading ? (
            <div className="dfx-loading">Dosya yükleniyor…</div>
          ) : (
            <div className="dfx-inner">

              {/* DURUM */}
              <section className="dfx-sec" id="durum">
                <div className="dfx-statline">
                  <div className="dfx-stat">
                    <b>{st.allDone ? '✓' : st.stageNo}</b>
                    <span>/ {st.total} aşama</span>
                  </div>
                  <div className="dfx-statbody">
                    <p className="dfx-bigl">{bigLabel}</p>
                    {/* küçük süreç haritası — hangi adımdayız */}
                    <div className="dfx-map" role="list" aria-label="Dosya süreci">
                      {stages.map((s, i) => {
                        const done = st.done.has(s.key);
                        const active = s.key === st.activeKey;
                        const cls = done ? 'done' : active ? 'active' : 'locked';
                        const clickable = done || active;
                        return (
                          <div key={s.key} className={`dfx-map-step ${cls}`} role="listitem">
                            <button type="button" className="dfx-map-node" title={s.title} aria-label={s.title}
                              disabled={!clickable} onClick={clickable ? () => router.push(s.to) : undefined}>
                              {done ? <Check /> : <span>{i + 1}</span>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <dl className="dfx-meta">
                  <div><dt>Dosya açıldı</dt><dd>{fmtDate(client?.createdAt)}</dd></div>
                  <div className="terapist-only"><dt>Sonraki seans</dt><dd>{client?.nextSession ?? 'Planlanmadı'}</dd></div>
                  <div className="terapist-only"><dt>Başvuru</dt><dd>{client?.referral || '—'}</dd></div>
                  <div><dt>Veri doluluğu</dt><dd>%{fill.pct}{fill.miss > 0 ? ` · ${fill.miss} eksik` : ''}</dd></div>
                </dl>
              </section>

              {/* 1 · TEMEL BİLGİLER & HİKÂYE (anamnez derlemesi) */}
              <section className="dfx-sec" id="temel">
                <SecHead kicker="1 · Danışan" title="Temel bilgiler & hikâye"
                  right={<span className={`dfx-tag ${anamnezGroups.some((g) => g.fields.some((f) => isEmptyVal(f.val))) ? 'warn' : 'ok'}`}>
                    {anamnezGroups.reduce((a, g) => a + g.fields.filter((f) => isEmptyVal(f.val)).length, 0)} eksik
                  </span>} />
                {anamnezGroups.map((g) => <DataGroup key={g.title} g={g} onFill={(to) => router.push(to)} />)}
              </section>

              {/* 2 · FORMÜLASYON (sorun döngüsü çekirdek + 4P/bilişsel) */}
              <section className="dfx-sec" id="formulasyon">
                <SecHead kicker="2 · Klinik" title="Formülasyon" />
                {parsedCycles.length > 0 ? (
                  parsedCycles.map((c) => (
                    <div className="dfx-cycle" key={c.id}>
                      {c.label && <h4>{c.label}</h4>}
                      <DiagramViewer type={c.type as any} fields={c.fields} readOnly />
                    </div>
                  ))
                ) : (
                  <div className="dfx-empty">
                    <p>Bu danışan için henüz bir sorun döngüsü oluşturulmadı.</p>
                    <button className="dfx-fill solid" type="button" onClick={() => router.push(`/clients/${id}/dongu`)}>
                      Sorun döngüsü oluştur <Arrow />
                    </button>
                  </div>
                )}
                <div className="terapist-only">
                  {formGroups.map((g) => <DataGroup key={g.title} g={g} onFill={(to) => router.push(to)} />)}
                </div>
              </section>

              {/* 3 · SEANSLAR (derlenmiş) — yalnız terapist */}
              <section className="dfx-sec terapist-only" id="seanslar">
                <SecHead kicker="3 · Süreç" title="Seanslar"
                  right={<span className="dfx-tag ok">{seansKayit.length} seans</span>} />
                {seansKayit.length > 0 ? (
                  <div className="dfx-seslist">
                    {seansKayit.slice(0, 8).map((s, i) => (
                      <div className="dfx-ses" key={i}>
                        <span className={`dfx-ses-no${s.tip === 'anamnez' ? ' anam' : ''}`}>{s.tip === 'anamnez' ? 'A' : `S${s.no}`}</span>
                        <div className="dfx-ses-b">
                          <div className="dfx-ses-h"><b>{s.title}</b><span>{s.date}</span></div>
                          {s.summary && s.summary !== '—' && <p>{s.summary}</p>}
                          {s.teknikler.length > 0 && <div className="dfx-ses-chips">{s.teknikler.map((t: string, k: number) => <span key={k}>{t}</span>)}</div>}
                        </div>
                      </div>
                    ))}
                    <button className="dfx-fill" type="button" onClick={() => router.push(`/profil/${id}?focus=seanslar`)}>
                      Tüm seansları yönet <Arrow />
                    </button>
                  </div>
                ) : (
                  <div className="dfx-empty">
                    <p>Henüz seans kaydı yok.</p>
                    <button className="dfx-fill solid" type="button" onClick={() => router.push(`/profil/${id}?focus=seanslar`)}>
                      Seanslara git <Arrow />
                    </button>
                  </div>
                )}
              </section>

            </div>
          )}
        </div>

        {/* ── section rail ── */}
        {!loading && (
          <nav className="dfx-rail" aria-label="Bölümler">
            {RAIL.map((r) => (
              <button key={r.id} type="button" className={`dfx-rn${activeSec === r.id ? ' on' : ''}`} onClick={() => scrollToSec(r.id)}>
                <span className="dfx-rn-l">{r.label}</span>
                <span className="dfx-rn-t" />
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
