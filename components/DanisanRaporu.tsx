'use client';

import { useEffect, useRef, useState } from 'react';
import './CalmieChrome.css';   // Özet Sunum kabuğu (mesh + frosted) — Anamnez ile ortak
import './AnamnezV2.css';      // .an2 premium kart dili + .ozs özet-sunum stilleri (sonuna eklendi)
import { PROFIL_DATA as DEFAULT_DATA } from './danisanRaporuData';
import { DiagramViewer, type DiagramType } from './BozuklukDongusu';
import { compileAile } from '@/lib/anamnez';

// ──────────────────────────────────────────────────────────────────────────
// Danışan dosyası — profil görünümü. Eski "Pano" (bento .dr DanisanRaporu)
// kaldırıldı (2026-06-18); bu dosya artık yalnız ÖZET SUNUM'u (DanisanOzetSunum)
// barındırır. Dosya adı geriye-uyum için korundu (importlar bu yolu kullanıyor).
// ──────────────────────────────────────────────────────────────────────────

export type DanisanRaporuProps = {
  data?: any;
  backLabel?: string;
  onBack?(): void;
  onCreateBriefing?(): void;
  onOpenFormulationHub?(): void;
  onOpenStory?(): void;
  onSaveBenlik?(notes: { self: string; outer: string }): void | Promise<void>;
  onSaveFee?(amount: number | null): void | Promise<void>;
  onSaveClientPatch?(patch: Record<string, unknown>): void | Promise<void>;
  onNav?(target: string): void;
  onAltFile?(): void;   // eski "süreç dosyası" (/dosya) — alternatif görünüm
  onSwitchView?(): void;  // Pano ↔ Özet sunum (dikey) geçişi
  clientId?: string;      // özet sunumdaki döngüleri çekmek için
};
// ══════════════════════════════════════════════════════════════════════════
// DanisanOzetSunum — Profil ekranının 2. (DİKEY) görünümü: "Özet Sunum" (PDF).
// YENİ tasarım dili (Anamnez ekranı gibi): Calmie tema-mesh zemin + frosted
// scrim + üst dock + ortada yüzen kart; içerik PREMIUM hairline kartlar (.an2).
// Pano'daki TÜM bölümleri kapsar (sorun/hedef, döngü[gömülü], 4P, hexaflex,
// değerler, ACT matrisi, benlik&algı, güçlü/gelişim, danışan hedefleri,
// müdahaleler, ilişki, ölçek serisi, seanslar, hikaye). Aynı `data`yı paylaşır.
// Döngüler AYRI yapıdır (/clients/[id]/dongu) — burada yalnız ÖZETE gömülür,
// düzenlenmez. (Ayrı dosya yerine burada: Turbopack yeni-dosya riski yok.)
// ══════════════════════════════════════════════════════════════════════════
const OZS_DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani' },
  { label: 'Profil', target: 'terapist', active: true },
  { label: 'Ayarlar', target: 'ayarlar' },
];
const OZS_BG = '/calmie-hero-default.jpg';
const ozsLs = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };

export function DanisanOzetSunum(props: DanisanRaporuProps) {
  const D: any = props.data ?? DEFAULT_DATA;
  const [cycles, setCycles] = useState<any[]>([]);
  const [anamnez, setAnamnez] = useState<any>(null);
  const [theme] = useState<string>(() => ozsLs('calmie_home_bgtheme') || 'default');
  const [bgPhoto] = useState<string | null>(() => ozsLs('siyi_home_bg_v1'));

  useEffect(() => {
    if (!props.clientId) return;
    fetch(`/api/danisan-dongu?clientId=${encodeURIComponent(props.clientId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setCycles(Array.isArray(d) ? d : []))
      .catch(() => {});
    // klinik dikkat bayrağı (yatış öyküsü + psikiyatrik ilaç) anamnezden gelir
    fetch(`/api/anamnez/${props.clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAnamnez(d || null))
      .catch(() => {});
  }, [props.clientId]);

  const tx = (s: any): string => (typeof s === 'string' ? s.trim() : '');

  // ── Klinik dikkat: yatış öyküsü / psikiyatrik ilaç / ailede istismar ──
  const psik = anamnez?.psikiyatrik || {};
  const aileA = anamnez?.aile || {};
  const yatisVar = psik?.yatis?.var === true || psik?.yatis === 'Var' || psik?.yatis === true;
  const psikIlac = tx(psik?.ilacNot);
  const istismarVar = aileA?.istismarVar === 'Var';
  const istismarNot = tx(aileA?.istismarNot);
  const showFlag = yatisVar || !!psikIlac || istismarVar;

  // ── Sosyal destek & ilişkiler + kendini tanımlama (anamnezden) ──
  const sosyalA = anamnez?.isSosyal || {};
  const demoA = anamnez?.demografik || {};
  const iliskiA = anamnez?.iliskiler || {};
  // Sosyal destek + arkadaş ilişkileri tek alanda birleşti (çoklu çip / dizi).
  // Geriye-uyum: eski düz metin destekNot ve eski ayrı arkadasIliski alanı da toparlanır.
  const destekItems: string[] = Array.isArray(sosyalA.destekNot)
    ? sosyalA.destekNot.map(tx).filter(Boolean)
    : (tx(sosyalA.destekNot) ? [tx(sosyalA.destekNot)] : []);
  if (tx(sosyalA.arkadasIliski)) destekItems.push(tx(sosyalA.arkadasIliski));
  const sosyalDestek = destekItems.join(' · ');
  const baglanmaStili = tx(iliskiA.baglanmaStili);
  const iliskiSorunRaw = sosyalA.iliskiSorunPuan;
  const iliskiSorun = (iliskiSorunRaw != null && iliskiSorunRaw !== '' && !isNaN(Number(iliskiSorunRaw))) ? Number(iliskiSorunRaw) : null;
  const sosyalHasData = !!(sosyalDestek || baglanmaStili || iliskiSorun != null);
  const kendiSifat = Array.isArray(demoA.kendiSifatlar)
    ? demoA.kendiSifatlar.filter((x: any) => typeof x === 'string' && x.trim()).join(', ')
    : (typeof demoA.kendiSifatlar === 'string' ? demoA.kendiSifatlar.trim() : '');

  // ── Danışan hikâyesi (gelisim) + şikayet detayı (sikayet) + aile öyküsü (aile) ──
  const gelA = anamnez?.gelisim || {};
  const sikA = anamnez?.sikayet || {};
  const story2 = [
    { l: 'Çocukluk', v: tx(gelA.cocuklukTarif) },
    { l: 'Ergenlik', v: tx(gelA.ergenlikTarif) },
    { l: 'O dönemlerde kendini hissi / destek', v: tx(gelA.erkenDestek) },
    { l: 'Önemli yaşam olayları', v: tx(gelA.yasamOlaylari) },
  ].filter((x) => x.v);
  const sikayetDetay = [
    { l: 'Ne zamandır sürüyor', v: tx(sikA.baslangic) },
    { l: 'Başlatan vurucu olay', v: tx(sikA.vurucuOlay) },
    { l: 'Tetikleyiciler', v: tx(sikA.tetikleyicilerNot) },
  ].filter((x) => x.v);
  // Aile yapısı = türetilmiş boyut: sinyallerden okuma-anında derlenir (saf compileAile).
  const { rows: aileRows, hash: aileSig } = compileAile(aileA);
  // Terapist onay damgası (anamnez_json.derived.aile). Yoksa hiç onaylanmamış demektir.
  const derivedAile = anamnez?.derived?.aile || null;
  const aileConfirmed = derivedAile?.status === 'onaylandi' && derivedAile?.snapshotHash === aileSig;
  const aileStale = derivedAile?.status === 'onaylandi' && derivedAile?.snapshotHash !== aileSig;
  const aileIgnored = derivedAile?.status === 'yoksay';
  // Onayla / yeniden onayla / yok say / geri al — tek küçük PATCH (kök derived bütün gönderilir).
  const setAileDerived = (status: 'onaylandi' | 'yoksay' | null) => {
    if (!props.clientId) return;
    const derived: any = { ...(anamnez?.derived || {}) };
    if (status) derived.aile = { status, at: new Date().toISOString(), snapshotHash: aileSig };
    else delete derived.aile;
    setAnamnez((prev: any) => ({ ...(prev || {}), derived }));
    fetch(`/api/anamnez/${props.clientId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ derived }),
    }).catch(() => {});
  };

  // dock glider (Ana Sayfa ile aynı)
  const menuRef = useRef<HTMLElement>(null);
  const gliderRef = useRef<HTMLSpanElement>(null);
  const activeLink = () => (menuRef.current?.querySelector('a.active') || menuRef.current?.querySelector('a')) as HTMLElement | null;
  const moveGlider = (a: HTMLElement | null, instant = false) => {
    const g = gliderRef.current; if (!g || !a) return;
    if (instant) g.style.transition = 'none';
    g.style.width = a.offsetWidth + 'px';
    g.style.transform = `translateX(${a.offsetLeft}px)`;
    g.classList.add('on');
    menuRef.current?.querySelectorAll('a').forEach((l) => l.classList.toggle('lit', l === a));
    if (instant) { void g.offsetWidth; g.style.transition = ''; }
  };
  useEffect(() => {
    moveGlider(activeLink(), true);
    const onR = () => moveGlider(activeLink(), true);
    window.addEventListener('resize', onR);
    (document as any).fonts?.ready?.then(() => moveGlider(activeLink(), true));
    return () => window.removeEventListener('resize', onR);
  }, []);

  const T = (v: any): string => (v && typeof v === 'object' && !Array.isArray(v) ? (v.terapist ?? v.danisan ?? '') : (v ?? ''));
  const itemText = (x: any): string => (x && typeof x === 'object' ? (x.label ?? x.sade ?? '') : String(x ?? ''));

  const c = D.client || {};
  const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || '—';
  const metaBits = [c.gender, c.age ? `${c.age}` : '', c.occupation].filter(Boolean).join(' · ');
  const pg = D.problemsGoals || {};
  const problems: any[] = pg.problems || [];
  const goals: any[] = pg.goals || [];
  const fourP: any[] = D.fourP || [];
  const flex = D.flexibility || {};
  const axes: any[] = flex.axes || [];
  const values: any[] = D.values || [];
  const matrix = D.actMatrix || {};
  const quads: any[] = (matrix.quadrants || []).filter((q: any) => (q.items || []).length > 0);
  const benlik = D.benlikAlgisi || {};
  const sw = D.strengthsWeaknesses || {};
  const strengths: any[] = sw.strengths || [];
  const weaknesses: any[] = sw.weaknesses || [];
  const dh: any[] = D.danisanHedefleri || [];
  const interventions: any[] = D.interventions || [];
  const rel = D.relationship || {};
  const scaleScores: any[] = D.scaleScores || [];
  const records: any[] = (D.sessionRecords || []).slice().sort((a: any, b: any) => (b.seansNo || 0) - (a.seansNo || 0));
  const story = D.story || {};

  const dhDone = dh.filter((g) => g.durum === 'tamamlandi').length;
  const dhPct = dh.length ? Math.round((dhDone / dh.length) * 100) : 0;
  const DLBL: Record<string, string> = { tamamlandi: 'Tamamlandı', devam: 'Devam ediyor', baslanmadi: 'Başlanmadı' };
  const OUT: Record<string, string> = { yararli: 'Yararlı', notr: 'Nötr', yararsiz: 'Sınırlı' };
  const flexHasData = axes.some((a) => (a.value || 0) > 0);
  const benlikHasData = !!(T(benlik?.self?.note) || T(benlik?.outer?.note));
  const moodSeries = scaleScores.filter((s) => (s.score || 0) > 0);
  // katılım & süreklilik — seans durumlarından türetilir (Pano'daki Katılım + Erteleme/İptal)
  const attend: Record<string, number> = { katildi: 0, katilmadi: 0, ertelendi: 0, iptal: 0 };
  records.forEach((r) => { const d = r.durum || 'katildi'; if (d in attend) attend[d]++; });
  const attendPct = records.length ? Math.round((attend.katildi / records.length) * 100) : 0;

  // ── bölümleri koşullu topla (otomatik numaralandırma) ──
  const secs: { t: string; sub?: string; node: any; headExtra?: any; className?: string }[] = [];

  if (problems.length || goals.length) secs.push({ t: 'Temel sorunlar ve terapi hedefleri', node: (
    <div className="ozs-two">
      <div className="ozs-col"><span className="ozs-col-l">Temel sorunlar</span>
        {problems.length ? problems.map((p, i) => <div key={i} className="ozs-item"><b>{T(p.label)}</b>{T(p.note) ? <span>{T(p.note)}</span> : null}</div>) : <div className="ozs-empty">—</div>}
      </div>
      <div className="ozs-arrow" aria-hidden>→</div>
      <div className="ozs-col"><span className="ozs-col-l">Terapi hedefleri</span>
        {goals.length ? goals.map((g, i) => <div key={i} className="ozs-item"><b>{T(g.label)}</b>{T(g.note) ? <span>{T(g.note)}</span> : null}</div>) : <div className="ozs-empty">—</div>}
      </div>
    </div>
  ) });

  secs.push({ t: 'Sorun döngüsü', sub: 'danışanın formülasyon döngüsü', node: (
    cycles.length === 0
      ? <div className="ozs-warn" role="alert">
          <span className="ozs-warn-ic" aria-hidden>!</span>
          <div className="ozs-warn-b">
            <b>Sorun döngüsü henüz eklenmedi</b>
            <span>Bu danışanın formülasyonu eksik. Döngüyü “Formülasyon adımları” ekranından ekleyin.</span>
          </div>
        </div>
      : <>{cycles.map((cy) => { let f: Record<string, string> = {}; try { f = JSON.parse(cy.fields_json || '{}'); } catch {}
          return <div key={cy.id} className="ozs-cycle"><div className="ozs-cycle-h">{cy.label || cy.type}</div><div className="ozs-cycle-d"><DiagramViewer type={cy.type as DiagramType} fields={f} readOnly /></div></div>; })}</>
  ) });

  if (fourP.some((p) => T(p.body) || (p.chips && p.chips.length))) secs.push({ t: '4P Formülasyon', sub: 'vakanın dört penceresi', node: (
    <div className="ozs-4p">
      {fourP.map((p, i) => (
        <div key={i} className={`ozs-p${p.accent ? ' accent' : ''}`}>
          <div className="ozs-p-h"><span className="ozs-p-no">{p.num}</span><b>{p.label}</b><i>{p.sub}</i></div>
          {T(p.body) ? <p>{T(p.body)}</p> : <p className="ozs-empty">—</p>}
          {Array.isArray(p.chips) && p.chips.length > 0 && <div className="ozs-chips">{p.chips.map((ch: string, k: number) => <span key={k}>{ch}</span>)}</div>}
        </div>
      ))}
    </div>
  ) });

  if (flexHasData) secs.push({ t: 'Psikolojik esneklik', sub: `ACT Hexaflex · ${flex.score ?? 0}/10`, node: (
    <div className="ozs-axes">
      {axes.map((a, i) => (
        <div key={i} className="ozs-axis">
          <div className="ozs-axis-l"><b>{a.name}</b>{a.sade ? <i>{a.sade}</i> : null}</div>
          <div className="ozs-bar"><span style={{ width: `${Math.max(0, Math.min(10, a.value || 0)) * 10}%` }} /></div>
          <span className="ozs-axis-v">{a.value ?? 0}</span>
        </div>
      ))}
    </div>
  ) });

  if (values.length) secs.push({ t: 'Değerler', node: (
    <div className="ozs-chips lg">{values.map((v, i) => <span key={i}>{v.label}{v.level ? ` · ${v.level}` : ''}</span>)}</div>
  ) });

  if (quads.length) secs.push({ t: 'ACT Matrisi', sub: 'uzağa / yöne · içsel / davranış', node: (
    <div className="ozs-mx">
      {quads.map((q, i) => (
        <div key={i} className={`ozs-q ${q.side === 'toward' ? 'toward' : 'away'}`}>
          <div className="ozs-q-h"><span className="ozs-q-no">{q.num}</span>{q.sideLabel}</div>
          <div className="ozs-q-sub">{q.layerLabel}</div>
          <ul>{(q.items || []).map((it: any, k: number) => <li key={k}>{itemText(it)}</li>)}</ul>
        </div>
      ))}
    </div>
  ) });

  if (benlikHasData) secs.push({ t: 'Benlik & Algı', sub: 'iç öz-algı ↔ dış sosyal sunum', node: (
    <div className="ozs-two">
      <div className="ozs-col"><span className="ozs-col-l">{benlik.self?.title || 'Kendi gözünden'}</span><p className="ozs-note">{T(benlik.self?.note) || '—'}</p></div>
      <div className="ozs-col"><span className="ozs-col-l">{benlik.outer?.title || 'Dış gözden'}</span><p className="ozs-note">{T(benlik.outer?.note) || '—'}</p></div>
    </div>
  ) });

  if (strengths.length || weaknesses.length) secs.push({ t: 'Güçlü yönler ve gelişim alanları', node: (
    <div className="ozs-two">
      <div className="ozs-col"><span className="ozs-col-l">Güçlü yönler</span>
        {strengths.length ? strengths.map((s, i) => <div key={i} className="ozs-item"><b>{s.label}</b>{s.detail ? <span>{s.detail}</span> : null}</div>) : <div className="ozs-empty">—</div>}
      </div>
      <div className="ozs-col"><span className="ozs-col-l">Gelişim alanları</span>
        {weaknesses.length ? weaknesses.map((w, i) => <div key={i} className="ozs-item"><b>{w.label}</b>{w.detail ? <span>{w.detail}</span> : null}</div>) : <div className="ozs-empty">—</div>}
      </div>
    </div>
  ) });

  if (sosyalHasData) secs.push({ t: 'Sosyal destek & ilişkiler', node: (
    <>
      {iliskiSorun != null && (
        <div className="ozs-nblock">
          <span className="ozs-col-l">İlişkilerde sorun sıklığı</span>
          <div className="ozs-scoreline">
            <div className="ozs-bar"><span style={{ width: `${Math.max(0, Math.min(10, iliskiSorun)) * 10}%` }} /></div>
            <span className="ozs-axis-v">{iliskiSorun}/10</span>
          </div>
        </div>
      )}
      {baglanmaStili && <div className="ozs-nblock"><span className="ozs-col-l">Bağlanma stili</span><p><b>{baglanmaStili}</b></p></div>}
      {sosyalDestek && <div className="ozs-nblock"><span className="ozs-col-l">Sosyal destek ve arkadaş ilişkileri</span><p>{sosyalDestek}</p></div>}
    </>
  ) });

  if (sikayetDetay.length) secs.push({ t: 'Şikayet & tetikleyiciler', node: (
    <>{sikayetDetay.map((r, i) => <div key={i} className="ozs-nblock"><span className="ozs-col-l">{r.l}</span><p>{r.v}</p></div>)}</>
  ) });

  // Aile öyküsü: terapist onayıyla derlenir. ONAYLANMAYAN/bayat/yok-sayılan veri
  // PDF'e GEÇMEZ (className 'ozs-print-hide' → @media print: gizli). Yalnız ONAYLI
  // ve güncel olan basılır. Yok say → ekranda 'geri al' kalır (basımda yok).
  if (aileRows.length) {
    const aileChip = aileIgnored ? null : (
      <span className="ozs-ownchip ozs-noprint">
        {aileConfirmed
          ? <span className="ozs-own-ok">✓ Onaylandı</span>
          : <button type="button" className="ozs-own-btn" onClick={() => setAileDerived('onaylandi')}>{aileStale ? 'Sinyaller değişti — yeniden onayla' : 'Aile yapısını onayla'}</button>}
        <button type="button" className="ozs-own-btn ghost" onClick={() => setAileDerived('yoksay')}>Yok say</button>
      </span>
    );
    const aileNode = aileIgnored ? (
      <div className="ozs-nblock ozs-ignored"><p>Aile yapısı bu dosyada yok sayıldı — PDF’e girmez. <button type="button" className="ozs-own-btn ghost" onClick={() => setAileDerived(null)}>Geri al</button></p></div>
    ) : (
      <>
        {aileRows.map((r, i) => <div key={i} className="ozs-nblock"><span className="ozs-col-l">{r.l}</span><p>{r.v}</p></div>)}
        {!aileConfirmed && <p className="ozs-own-hint ozs-noprint">{aileStale ? 'Sinyaller değişti. Yeniden onaylanana dek PDF’e girmez.' : 'Terapist onaylayana dek bu bölüm PDF’e girmez.'}</p>}
      </>
    );
    secs.push({ t: 'Aile öyküsü', node: aileNode, headExtra: aileChip, className: aileConfirmed ? undefined : 'ozs-print-hide' });
  }

  if (story2.length) secs.push({ t: 'Danışanın hikâyesi', sub: 'gelişimsel anlatı', node: (
    <>{story2.map((r, i) => <div key={i} className="ozs-nblock"><span className="ozs-col-l">{r.l}</span><p>{r.v}</p></div>)}</>
  ) });

  if (dh.length) secs.push({ t: 'Danışan hedefleri', sub: `${dhDone}/${dh.length} tamamlandı · %${dhPct}`, node: (
    <>
      <div className="ozs-prog"><span className="ozs-prog-fill" style={{ width: `${dhPct}%` }} /></div>
      <div className="ozs-list">{dh.map((g, i) => <div key={i} className="ozs-goal"><span className={`ozs-pill ${['tamamlandi', 'devam', 'baslanmadi'].includes(g.durum) ? g.durum : 'baslanmadi'}`}>{DLBL[g.durum] || DLBL.baslanmadi}</span><span>{g.hedef}</span></div>)}</div>
    </>
  ) });

  if (interventions.length) secs.push({ t: 'Müdahaleler', sub: 'uygulanan ve planlanan teknikler', node: (
    <div className="ozs-list">
      {interventions.map((iv, i) => (
        <div key={i} className="ozs-iv"><span className="ozs-iv-no">{iv.romanNum}</span><b>{iv.title}</b>
          {iv.outcome ? <span className={`ozs-out ${iv.outcome}`}>{OUT[iv.outcome] || iv.outcome}</span> : null}</div>
      ))}
    </div>
  ) });

  if (T(rel.note) || T(rel.rupture) || (rel.supervision || []).length) secs.push({ t: 'İlişki & klinik notlar', node: (
    <>
      {T(rel.rupture) && <div className="ozs-nblock"><span className="ozs-col-l">Kırılma–onarım</span><p>{T(rel.rupture)}</p></div>}
      {(rel.supervision || []).length > 0 && <div className="ozs-nblock"><span className="ozs-col-l">Süpervizyon soruları</span><ul className="ozs-ul">{rel.supervision.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></div>}
      {T(rel.note) && <div className="ozs-nblock"><span className="ozs-col-l">Klinik not</span><p>{T(rel.note)}</p></div>}
    </>
  ) });

  if (moodSeries.length) secs.push({ t: 'Ölçek skorları', sub: 'seans bazlı ruh hali serisi', node: (
    <div className="ozs-spark">
      {moodSeries.map((s, i) => (
        <div key={i} className="ozs-spark-col">
          <div className="ozs-spark-bar"><span style={{ height: `${Math.max(6, Math.min(10, s.score)) * 10}%` }} /></div>
          <span className="ozs-spark-v">{s.score}</span>
          <span className="ozs-spark-x">S{s.seansNo}</span>
        </div>
      ))}
    </div>
  ) });

  if (records.length) secs.push({ t: 'Katılım & süreklilik', sub: `%${attendPct} katılım · ${records.length} seans`, node: (
    <>
      <div className="ozs-att">
        <div className="ozs-att-pct"><b>%{attendPct}</b><span>katılım oranı</span></div>
        <div className="ozs-att-grid">
          <div className="ozs-att-s"><b>{attend.katildi}</b><span>Katıldı</span></div>
          <div className="ozs-att-s"><b>{attend.katilmadi}</b><span>Katılmadı</span></div>
          <div className="ozs-att-s"><b>{attend.ertelendi}</b><span>Ertelendi</span></div>
          <div className="ozs-att-s"><b>{attend.iptal}</b><span>İptal</span></div>
        </div>
      </div>
      <div className="ozs-prog" style={{ marginTop: 14 }}><span className="ozs-prog-fill" style={{ width: `${attendPct}%` }} /></div>
    </>
  ) });

  if (records.length) secs.push({ t: 'Seans kayıtları', sub: `${c.sessionCount != null ? c.sessionCount : records.length} seans`, node: (
    <div className="ozs-list">
      {records.slice(0, 6).map((s, i) => (
        <div key={i} className="ozs-ses">
          <div className="ozs-ses-h"><span className="ozs-ses-no">{s.seansNo != null ? `S${s.seansNo}` : '—'}</span><b>{s.title || '—'}</b><span className="ozs-ses-meta">{[s.modality, s.date].filter(Boolean).join(' · ')}</span></div>
          {s.summary && s.summary !== '—' && <p className="ozs-ses-sum">{s.summary}</p>}
          {Array.isArray(s.interventions) && s.interventions.length > 0 && <div className="ozs-chips">{s.interventions.map((t: string, k: number) => <span key={k}>{t}</span>)}</div>}
        </div>
      ))}
    </div>
  ) });

  if ((story.preQuote || '').trim()) secs.push({ t: 'Danışan hikâyesi', node: (
    <><p className="ozs-quote">{story.preQuote}</p>{story.meta ? <div className="ozs-quote-meta">{story.meta}{story.metaTail ? ` · ${story.metaTail}` : ''}</div> : null}</>
  ) });

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&display=swap" rel="stylesheet" />

      <div className="an2 cchrome" data-bg={theme === 'default' ? undefined : theme}>
        <div className="app-bg" aria-hidden="true">
          <span className="hb-mesh" />
          <img className="hb-photo" alt="" src={bgPhoto || OZS_BG} />
          <img className="hb-cherry" alt="" src="/tema-cherry.jpg" /><span className="hb-cherry-scrim" />
          <img className="hb-fur" alt="" src="/tema-kurk.jpg" /><span className="hb-fur-scrim" />
          <span className="hb-tint" /><span className="hb-crest" /><span className="hb-grade" /><span className="hb-vignette" /><span className="hb-grain" />
        </div>
        <div className="scrim" aria-hidden="true" />

        <header className="page-menu">
          <span className="pm-brand"><b>Calmie</b><i>.</i></span>
          <nav className="pm-nav" aria-label="Sayfa menüsü" ref={menuRef} onMouseLeave={() => moveGlider(activeLink())}>
            <span className="pm-glider" ref={gliderRef} aria-hidden="true" />
            {OZS_DOCK.map((d) => (
              <a key={d.target} href="#" className={d.active ? 'active' : ''} onMouseEnter={(e) => moveGlider(e.currentTarget)} onClick={(e) => { e.preventDefault(); if (!d.active) props.onNav?.(d.target); }}>{d.label}</a>
            ))}
          </nav>
        </header>

        <div className="modal-wrap">
          <div className="shell" role="dialog" aria-modal="true" aria-label="Özet sunum">

            <div className="topbar">
              <div className="tb-left">
                <button className="back" type="button" onClick={() => props.onBack?.()}><span className="chev">‹</span>{props.backLabel || 'Danışanlar'}</button>
                <div className="tb-title"><span className="e">Klinik özet · sunum dosyası</span><b>{name}{c.vakaNo != null ? ` · #${c.vakaNo}` : ''}</b></div>
              </div>
              <div className="tb-right">
                <button className="tb-act" type="button" onClick={() => { if (typeof window !== 'undefined') window.print(); }}><svg viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4v-5h16v5h-2M8 14h8v7H8z" /></svg><span>Yazdır / PDF</span></button>
                {props.onSwitchView && (
                  <div className="view-seg" role="group" aria-label="Görünüm">
                    <button className="vs-opt" type="button" aria-pressed="false" onClick={props.onSwitchView}>Pano</button>
                    <button className="vs-opt active" type="button" aria-pressed="true">Özet sunum</button>
                  </div>
                )}
              </div>
            </div>

            <div className="formcol">
              <div className="ozs-doc">
                {/* KLİNİK DİKKAT — en üstte solda, kırmızı vurgu (yatış / psikiyatrik ilaç) */}
                {showFlag && (
                  <div className="ozs-flag" role="alert">
                    <span className="ozs-flag-ic" aria-hidden>!</span>
                    <div className="ozs-flag-body">
                      <span className="ozs-flag-t">Klinik dikkat</span>
                      <ul>
                        {yatisVar && <li>Yatış öyküsü <b>var</b></li>}
                        {psikIlac && <li>Psikiyatrik ilaç kullanımı: <b>{psikIlac}</b></li>}
                        {istismarVar && <li>Ailede eşitsizlik / adaletsizlik / istismar <b>var</b>{istismarNot ? ` — ${istismarNot}` : ''}</li>}
                      </ul>
                    </div>
                  </div>
                )}
                {/* HERO */}
                <header className="ozs-hero">
                  <span className="ozs-eyebrow">Klinik özet · sunum dosyası</span>
                  <h1 className="ozs-name">{c.firstName ? <><b>{c.firstName}</b> <i>{c.lastName}</i></> : name}</h1>
                  {metaBits && <div className="ozs-meta">{metaBits}</div>}
                  {kendiSifat && <div className="ozs-self">Kendini tanımı: <i>{kendiSifat}</i></div>}
                  {Array.isArray(c.tags) && c.tags.length > 0 && (
                    <div className="ozs-tagblock">
                      <span className="ozs-tagblock-l">Temel sorunlar</span>
                      <div className="ozs-tags">{c.tags.map((t: string, i: number) => <span key={i} className="ozs-tag">{t}</span>)}</div>
                    </div>
                  )}
                  <div className="ozs-stats">
                    <div className="ozs-stat"><span className="k">Vaka</span><b>#{c.vakaNo ?? '—'}</b></div>
                    <div className="ozs-stat"><span className="k">Seans</span><b>{c.sessionCount ?? records.length}</b></div>
                    {c.seansUcreti != null && <div className="ozs-stat"><span className="k">Ücret</span><b>₺{c.seansUcreti}</b></div>}
                    {cycles.length > 0 && <div className="ozs-stat"><span className="k">Döngü</span><b>{cycles.length}</b></div>}
                  </div>
                </header>

                {secs.map((s, i) => (
                  <section key={i} className={`ozs-sec${s.className ? ' ' + s.className : ''}`}>
                    <div className="ozs-sec-h"><span className="ozs-no">{String(i + 1).padStart(2, '0')}</span><h2>{s.t}</h2>{s.sub ? <span className="ozs-sec-sub">{s.sub}</span> : null}{s.headExtra ?? null}</div>
                    {s.node}
                  </section>
                ))}

                <footer className="ozs-foot">Calmie · klinik özet sunum dosyası — yalnızca terapist içindir.</footer>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
