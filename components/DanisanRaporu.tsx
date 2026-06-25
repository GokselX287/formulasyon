'use client';

import { Fragment, useEffect, useState } from 'react';
import './DanisanOzetSunum.css';   // landing-uyumlu "mesh + opal cam" özet/sunum dili (.ozx)
import { PROFIL_DATA as DEFAULT_DATA } from './danisanRaporuData';
import { DiagramViewer, type DiagramType } from './BozuklukDongusu';
import SeansPlanlayiciV2 from './SeansPlanlayiciV2';   // "Sıradaki seansa hazırlık" — gömülü (embedded)
import type { Intervention } from '@/lib/types';
import { compileAile } from '@/lib/anamnez';

// ──────────────────────────────────────────────────────────────────────────
// Danışan Özet / Sunum — landing uyumlu ("mesh + opal cam") tasarım.
// Cv görsel-44 / design_handoff_danisan_ozet portu. Anamnez (.anx) / Çocuk (.cdx)
// ile kardeş kabuk: mesh sahne + opal kartlar + 5 temalı dock (sol alt) + sade
// dikey, salt-okunur, yazdırılabilir klinik dosya.
// Dosya adı geriye-uyum için korundu (importlar bu yolu kullanıyor).
// ⚠️ HİÇBİR BÖLÜM/VERİ KALDIRILMADI — mevcut tüm bölümler yeni dile uyarlandı.
// Veri hattı (page.tsx + türetmeler + gömülü gerçek döngü DiagramViewer) aynen
// korunur; yalnız görsel dil değişti.
// ══════════════════════════════════════════════════════════════════════════

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
  onAltFile?(): void;
  onSwitchView?(): void;
  clientId?: string;
};

const THEMES: [string, string][] = [['rose', '#E59FB6'], ['sage', '#9FBE96'], ['ocean', '#9DC4D6'], ['dusk', '#AEB2CC'], ['clay', '#E3A982']];
const FOURP_LABELS: Record<string, string> = {
  predispozan: 'Soruna zemin hazırlayan faktörler',
  presipitan: 'Tetikleyici faktörler',
  perpetuan: 'Sürdürücü faktörler',
  protektif: 'Koruyucu faktörler',
};
const DLBL: Record<string, string> = { tamamlandi: 'Tamamlandı', devam: 'Devam ediyor', baslanmadi: 'Başlanmadı' };
const OUT: Record<string, string> = { yararli: 'Yararlı', notr: 'Nötr', yararsiz: 'Sınırlı' };
const ozsLs = (k: string): string | null => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } };

export function DanisanOzetSunum(props: DanisanRaporuProps) {
  const D: any = props.data ?? DEFAULT_DATA;
  const [cycles, setCycles] = useState<any[]>([]);
  const [anamnez, setAnamnez] = useState<any>(null);
  const [theme, setTheme] = useState('rose');
  const [beliefTags, setBeliefTags] = useState<string[]>([]);
  const [library, setLibrary] = useState<Intervention[]>([]);   // müdahale kütüphanesi (gömülü planlayıcı için)

  useEffect(() => {
    try { const t = ozsLs('calmie-theme'); if (t && THEMES.some(([x]) => x === t)) setTheme(t); } catch {}
  }, []);
  const applyTheme = (t: string) => { setTheme(t); try { localStorage.setItem('calmie-theme', t); } catch {} };

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

  // Temel inanç havuzu = uygulamanın kendi terimleri (clinical_tags · temel_inanclar).
  // Terapistler döngü/formülasyon doldururken bu havuz büyür; biz salt okuruz.
  useEffect(() => {
    fetch('/api/tags')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const list = Array.isArray(d)
          ? d.filter((t: any) => t?.category === 'temel_inanclar' && typeof t?.label === 'string')
              .map((t: any) => t.label.trim())
              .filter(Boolean)
          : [];
        setBeliefTags(Array.from(new Set(list)));
      })
      .catch(() => {});
  }, []);

  // Müdahale kütüphanesi — gömülü "Sıradaki seansa hazırlık" planlayıcısı için.
  useEffect(() => {
    fetch('/api/interventions')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setLibrary(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Seans planını kaydet → SessionPlan (next_focus = seans hedefi).
  const saveNextPlan = (args: { goal: string; items: { interventionId: string; durationMinutes: number; order: number; block: 'main' }[] }) => {
    if (!props.clientId) return;
    fetch('/api/session-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: props.clientId, sessionLength: 50, items: args.items, nextFocus: args.goal }),
    }).catch(() => {});
  };

  const tx = (s: any): string => (typeof s === 'string' ? s.trim() : '');

  // ── Klinik dikkat: yatış öyküsü / psikiyatrik ilaç / ailede istismar ──
  const psik = anamnez?.psikiyatrik || {};
  const aileA = anamnez?.aile || {};
  const yatisVar = psik?.yatis?.var === true || psik?.yatis === 'Var' || psik?.yatis === true;
  const psikIlac = tx(psik?.ilacNot);
  const istismarVar = aileA?.istismarVar === 'Var';
  const istismarNot = tx(aileA?.istismarNot);
  const showFlag = yatisVar || !!psikIlac || istismarVar;
  const attnItems: { k: string; v?: string }[] = [];
  if (yatisVar) attnItems.push({ k: 'Yatış öyküsü var' });
  if (psikIlac) attnItems.push({ k: 'Psikiyatrik ilaç', v: psikIlac });
  if (istismarVar) attnItems.push({ k: 'Ailede istismar / eşitsizlik', v: istismarNot || undefined });

  // ── Temel inanç adayları: havuzdaki terimleri klinik sinyallere göre vurgula ──
  const bNorm = (s: string) => s.toLowerCase().replace(/i̇/g, 'i');
  const BELIEF_THEMES: Record<string, string[]> = {
    yetersizlik: ['yeter', 'çaresiz', 'caresiz', 'başar', 'basar', 'güçsüz', 'gucsuz', 'zayıf', 'zayif', 'beceriksiz', 'aciz', 'yetenek'],
    sevilmezlik: ['sevil', 'sevg', 'istenm', 'reddedil', 'yaln', 'terk', 'ilgisiz'],
    degersizlik: ['değer', 'deger', 'kötü', 'kotu', 'kusur', 'suç', 'suc', 'utan', 'önemsiz', 'onemsiz', 'eziklik'],
    guvensizlik: ['güven', 'guven', 'tehlike', 'savunmasız', 'savunmasiz', 'incin', 'zarar'],
  };
  const activeThemes = new Set<string>();
  if (istismarVar) ['degersizlik', 'guvensizlik', 'sevilmezlik'].forEach((t) => activeThemes.add(t));
  if (yatisVar) activeThemes.add('yetersizlik');
  if (psikIlac) activeThemes.add('yetersizlik');
  const signalBlob = bNorm([istismarNot, psikIlac].filter(Boolean).join(' '));
  for (const [theme, roots] of Object.entries(BELIEF_THEMES)) {
    if (roots.some((r) => signalBlob.includes(r))) activeThemes.add(theme);
  }
  const themesOf = (label: string): string[] => {
    const n = bNorm(label);
    return Object.entries(BELIEF_THEMES).filter(([, roots]) => roots.some((r) => n.includes(r))).map(([t]) => t);
  };
  const beliefList = beliefTags
    .map((label) => ({ label, hot: showFlag && themesOf(label).some((t) => activeThemes.has(t)) }))
    .sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || a.label.localeCompare(b.label, 'tr'));
  const showBeliefs = beliefList.length > 0;

  // ── Sosyal destek & ilişkiler + kendini tanımlama (anamnezden) ──
  const sosyalA = anamnez?.isSosyal || {};
  const demoA = anamnez?.demografik || {};
  const iliskiA = anamnez?.iliskiler || {};
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
  const derivedAile = anamnez?.derived?.aile || null;
  const aileConfirmed = derivedAile?.status === 'onaylandi' && derivedAile?.snapshotHash === aileSig;
  const aileStale = derivedAile?.status === 'onaylandi' && derivedAile?.snapshotHash !== aileSig;
  const aileIgnored = derivedAile?.status === 'yoksay';
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

  const T = (v: any): string => (v && typeof v === 'object' && !Array.isArray(v) ? (v.terapist ?? v.danisan ?? '') : (v ?? ''));
  const itemText = (x: any): string => (x && typeof x === 'object' ? (x.label ?? x.sade ?? '') : String(x ?? ''));

  const c = D.client || {};
  const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || '—';
  const initials = name.split(/\s+/).filter(Boolean).map((w: string) => w[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR') || '—';
  const metaBits = [c.gender, c.age ? `${c.age} yaşında` : '', c.occupation].filter(Boolean);
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
  const flexHasData = axes.some((a) => (a.value || 0) > 0);
  const flexAvg = flexHasData ? (flex.score ?? +(axes.reduce((s: number, a: any) => s + (a.value || 0), 0) / axes.length).toFixed(1)) : 0;
  const benlikHasData = !!(T(benlik?.self?.note) || T(benlik?.outer?.note));
  const moodSeries = scaleScores.filter((s) => (s.score || 0) > 0);
  const attend: Record<string, number> = { katildi: 0, katilmadi: 0, ertelendi: 0, iptal: 0 };
  records.forEach((r) => { const d = r.durum || 'katildi'; if (d in attend) attend[d]++; });
  const attendPct = records.length ? Math.round((attend.katildi / records.length) * 100) : 0;

  // ── bölümleri koşullu topla (otomatik numaralandırma — yalnız görünenler) ──
  const secs: { t: string; eye?: string; node: any; className?: string }[] = [];

  if (problems.length || goals.length) secs.push({ t: 'Temel sorunlar ↔ hedefler', eye: 'formülasyon', node: (
    <div className="split">
      <div className="subcard"><h4>Temel sorunlar</h4>
        {problems.length ? <ul className="list">{problems.map((p, i) => <li key={i}><span className="mk" /><span><b>{T(p.label)}</b>{T(p.note) ? <span className="item-note"> — {T(p.note)}</span> : null}</span></li>)}</ul> : <p className="empty">—</p>}
      </div>
      <div className="subcard goal"><h4>Terapi hedefleri</h4>
        {goals.length ? <ul className="list">{goals.map((g, i) => <li key={i}><span className="mk" /><span><b>{T(g.label)}</b>{T(g.note) ? <span className="item-note"> — {T(g.note)}</span> : null}</span></li>)}</ul> : <p className="empty">—</p>}
      </div>
    </div>
  ) });

  secs.push({ t: 'Sorun döngüsü', eye: 'sürdürücü', node: (
    cycles.length === 0
      ? <div className="cyc-empty"><span className="mk">!</span><div><b>Sorun döngüsü henüz eklenmedi</b>Bu danışanın formülasyonu eksik. Döngüyü “Formülasyon adımları” ekranından ekleyin.</div></div>
      : <div className="cycwrap">{cycles.map((cy) => { let f: Record<string, string> = {}; try { f = JSON.parse(cy.fields_json || '{}'); } catch {}
          return <div key={cy.id} className="cyc-card"><div className="cyc-h">{cy.label || cy.type}</div><DiagramViewer type={cy.type as DiagramType} fields={f} readOnly /></div>; })}</div>
  ) });

  // Uzunlamasına (gelişimsel) formülasyon — döngü gibi ŞEMA (uzunlamasina bdx tipi).
  const lng = (D.longitudinal || {}) as any;
  const lngFields: Record<string, string> = {
    lng_erken: (lng.earlyExperiences || []).join('\n'),
    lng_temel: (lng.coreBeliefs || []).join('\n'),
    lng_ara: (lng.intermediateBeliefs || []).join('\n'),
    lng_basa: (lng.copingStrategies || []).join('\n'),
  };
  if (Object.values(lngFields).some((v) => v.trim())) secs.push({ t: 'Uzunlamasına formülasyon', eye: 'gelişimsel', node: (
    <div className="cycwrap"><div className="cyc-card"><div className="cyc-h">Erken yaşantılardan başa çıkmaya</div><DiagramViewer type="uzunlamasina" fields={lngFields} readOnly /></div></div>
  ) });

  if (fourP.some((p) => T(p.body) || (p.chips && p.chips.length))) secs.push({ t: 'Koruyucu ve soruna yatkınlık yaratan faktörler', eye: 'dört pencere', node: (
    <div className="fourp">
      {fourP.map((p, i) => (
        <div key={i} className="subcard">
          <h4>{FOURP_LABELS[p.sub] ?? p.label}</h4>
          {T(p.body) ? <p>{T(p.body)}</p> : <p className="empty">—</p>}
        </div>
      ))}
    </div>
  ) });

  if (flexHasData) secs.push({ t: 'Psikolojik esneklik', eye: 'hexaflex /10', node: (
    <div className="hex">
      <div className="hex-avg"><b>{flexAvg}</b><span>/ 10 ortalama esneklik</span></div>
      {axes.map((a, i) => (
        <div key={i} className="hexrow">
          <span className="hl">{a.name}{a.sade ? <i> · {a.sade}</i> : null}</span>
          <div className="ht"><div className="hf" style={{ width: `${Math.max(0, Math.min(10, a.value || 0)) * 10}%` }} /></div>
          <span className="hv">{a.value ?? 0}</span>
        </div>
      ))}
    </div>
  ) });

  if (values.length) secs.push({ t: 'Değerler, hayattaki ideal ve beklentiler', eye: 'yön', node: (
    <div className="pill-row">{values.map((v, i) => <span key={i} className="pill">{v.label}{v.level ? ` · ${v.level}` : ''}</span>)}</div>
  ) });

  if (strengths.length || weaknesses.length) secs.push({ t: 'Güçlü yönler ve gelişim alanları', eye: 'kaynak', node: (
    <div className="split">
      <div className="subcard"><h4>Güçlü yönler</h4>
        {strengths.length ? <ul className="list">{strengths.map((s, i) => <li key={i}><span className="mk" /><span><b>{s.label}</b>{s.detail ? <span className="item-note"> — {s.detail}</span> : null}</span></li>)}</ul> : <p className="empty">—</p>}
      </div>
      <div className="subcard"><h4>Gelişim alanları</h4>
        {weaknesses.length ? <ul className="list">{weaknesses.map((w, i) => <li key={i}><span className="mk" /><span><b>{w.label}</b>{w.detail ? <span className="item-note"> — {w.detail}</span> : null}</span></li>)}</ul> : <p className="empty">—</p>}
      </div>
    </div>
  ) });

  if (quads.length) secs.push({ t: 'ACT Matrisi', eye: 'uzağa / yöne · içsel / davranış', node: (
    <div className="actmx">
      {quads.map((q, i) => (
        <div key={i} className={`subcard${q.side === 'toward' ? ' toward' : ''}`}>
          <h4>{q.sideLabel}</h4>
          <div className="qsub">{q.layerLabel}</div>
          <ul className="list">{(q.items || []).map((it: any, k: number) => <li key={k}><span className="mk" /><span>{itemText(it)}</span></li>)}</ul>
        </div>
      ))}
    </div>
  ) });

  if (benlikHasData) secs.push({ t: 'Benlik & Algı', eye: 'iç öz-algı ↔ dış sunum', node: (
    <div className="split">
      <div className="subcard"><h4>{benlik.self?.title || 'Kendi gözünden'}</h4><p>{T(benlik.self?.note) || '—'}</p></div>
      <div className="subcard"><h4>{benlik.outer?.title || 'Dış gözden'}</h4><p>{T(benlik.outer?.note) || '—'}</p></div>
    </div>
  ) });

  if (sosyalHasData) secs.push({ t: 'Sosyal destek & ilişkiler', eye: 'bağ', node: (
    <div className="kv one">
      {iliskiSorun != null && (
        <div className="kv-item span"><div className="kl">İlişkilerde sorun sıklığı</div>
          <div className="scoreline"><div className="ht"><div className="hf" style={{ width: `${Math.max(0, Math.min(10, iliskiSorun)) * 10}%` }} /></div><span className="hv">{iliskiSorun}/10</span></div>
        </div>
      )}
      {baglanmaStili && <div className="kv-item span"><div className="kl">Bağlanma stili</div><div className="kt"><b>{baglanmaStili}</b></div></div>}
      {sosyalDestek && <div className="kv-item span"><div className="kl">Sosyal destek ve arkadaş ilişkileri</div><div className="kt">{sosyalDestek}</div></div>}
    </div>
  ) });

  if (sikayetDetay.length) secs.push({ t: 'Şikayet & tetikleyiciler', eye: 'giriş', node: (
    <div className="kv one">{sikayetDetay.map((r, i) => <div key={i} className="kv-item span"><div className="kl">{r.l}</div><div className="kt">{r.v}</div></div>)}</div>
  ) });

  // Aile öyküsü: terapist onayıyla derlenir. ONAYLANMAYAN/bayat/yok-sayılan veri
  // PDF'e GEÇMEZ (className 'ozs-print-hide' → @media print: gizli).
  if (aileRows.length) {
    const gate = aileConfirmed ? (
      <div className="gate-ok"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>Onaylandı — bu bölüm PDF&apos;e dahil.</div>
    ) : aileStale ? (
      <div className="gate stale ozs-noprint"><span className="gate-msg"><svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>Sinyaller değişti. Yeniden onaylanana dek PDF&apos;e girmez.</span><div className="gate-act"><button type="button" className="btn btn-primary btn-sm" onClick={() => setAileDerived('onaylandi')}>Yeniden onayla</button></div></div>
    ) : aileIgnored ? (
      <div className="gate ozs-noprint"><span className="gate-msg"><svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A9 9 0 0 1 21 12a9 9 0 0 1-1.6 4.9M6.6 6.6A9 9 0 0 0 3 12a9 9 0 0 0 9 9 9 9 0 0 0 4-1" /></svg>Aile yapısı bu dosyada yok sayıldı — PDF&apos;e girmez.</span><div className="gate-act"><button type="button" className="btn btn-ghost btn-sm btn-undo" onClick={() => setAileDerived(null)}>Geri al</button></div></div>
    ) : (
      <div className="gate ozs-noprint"><span className="gate-msg"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>Terapist onaylayana dek bu bölüm PDF&apos;e girmez.</span><div className="gate-act"><button type="button" className="btn btn-ghost btn-sm btn-undo" onClick={() => setAileDerived('yoksay')}>Yok say</button><button type="button" className="btn btn-primary btn-sm" onClick={() => setAileDerived('onaylandi')}>Onayla &amp; PDF&apos;e ekle</button></div></div>
    );
    secs.push({ t: 'Aile öyküsü', eye: 'köken · onay kapılı', className: aileConfirmed ? undefined : 'ozs-print-hide', node: (
      <div className={`fam${aileIgnored ? ' ignored' : ''}`}>
        <div className="fam-body"><div className="kv one">{aileRows.map((r, i) => <div key={i} className="kv-item span"><div className="kl">{r.l}</div><div className="kt">{r.v}</div></div>)}</div></div>
        {gate}
      </div>
    ) });
  }

  if (story2.length) secs.push({ t: 'Danışanın hikâyesi', eye: 'gelişimsel anlatı', node: (
    <div className="kv one">{story2.map((r, i) => <div key={i} className="kv-item span"><div className="kl">{r.l}</div><div className="kt">{r.v}</div></div>)}</div>
  ) });

  if (dh.length) secs.push({ t: 'Danışan hedefleri', eye: `${dhDone}/${dh.length} · %${dhPct}`, node: (
    <>
      <div className="prog"><span className="prog-fill" style={{ width: `${dhPct}%` }} /></div>
      <div className="goal-list">{dh.map((g, i) => <div key={i} className="goal-row"><span className={`gpill ${['tamamlandi', 'devam', 'baslanmadi'].includes(g.durum) ? g.durum : 'baslanmadi'}`}>{DLBL[g.durum] || DLBL.baslanmadi}</span><span>{g.hedef}</span></div>)}</div>
    </>
  ) });

  if (interventions.length) secs.push({ t: 'Seanslarda işlenen konular / yapılan müdahaleler', eye: 'plan', node: (
    <ul className="list">
      {interventions.map((iv, i) => (
        <li key={i} className="iv-row"><span className="iv-no">{iv.romanNum}</span><b>{iv.title}</b>{iv.outcome ? <span className={`iv-out ${iv.outcome}`}>{OUT[iv.outcome] || iv.outcome}</span> : null}</li>
      ))}
    </ul>
  ) });

  if (T(rel.note) || T(rel.rupture) || (rel.supervision || []).length) secs.push({ t: 'İlişki & klinik notlar', eye: 'süreç', node: (
    <div className="kv one">
      {T(rel.rupture) && <div className="kv-item span"><div className="kl">Kırılma–onarım</div><div className="kt">{T(rel.rupture)}</div></div>}
      {(rel.supervision || []).length > 0 && <div className="kv-item span"><div className="kl">Süpervizyon soruları</div><ul className="list">{rel.supervision.map((s: string, i: number) => <li key={i}><span className="mk" /><span>{s}</span></li>)}</ul></div>}
      {T(rel.note) && <div className="kv-item span"><div className="kl">Klinik not</div><div className="kt">{T(rel.note)}</div></div>}
    </div>
  ) });

  if (moodSeries.length) secs.push({ t: 'Ölçek skorları', eye: 'ruh hali serisi', node: (
    <div className="spark">
      {moodSeries.map((s, i) => (
        <div key={i} className="spark-col">
          <div className="spark-bar" style={{ height: `${Math.max(6, Math.min(10, s.score)) * 10}%` }} />
          <span className="spark-v">{s.score}</span>
          <span className="spark-x">S{s.seansNo}</span>
        </div>
      ))}
    </div>
  ) });

  if (records.length) secs.push({ t: 'Katılım & süreklilik', eye: `%${attendPct} · ${records.length} seans`, node: (
    <>
      <div className="attend">
        <div className="attend-pct"><b>%{attendPct}</b><span>katılım oranı</span></div>
        <div className="attend-grid">
          <div className="attend-s"><b>{attend.katildi}</b><span>Katıldı</span></div>
          <div className="attend-s"><b>{attend.katilmadi}</b><span>Katılmadı</span></div>
          <div className="attend-s"><b>{attend.ertelendi}</b><span>Ertelendi</span></div>
          <div className="attend-s"><b>{attend.iptal}</b><span>İptal</span></div>
        </div>
      </div>
      <div className="prog" style={{ marginTop: 14 }}><span className="prog-fill" style={{ width: `${attendPct}%` }} /></div>
    </>
  ) });

  if (records.length) secs.push({ t: 'Seans kayıtları', eye: `${c.sessionCount != null ? c.sessionCount : records.length} seans`, node: (
    <div className="sess">
      {records.slice(0, 6).map((s, i) => (
        <div key={i} className="sess-row">
          <span className="sess-no">{s.seansNo != null ? `S${s.seansNo}` : '—'}</span>
          <div className="sess-b">
            <div className="st">{s.title || '—'}</div>
            {s.summary && s.summary !== '—' && <div className="sp">{s.summary}</div>}
            {Array.isArray(s.interventions) && s.interventions.length > 0 && <div className="schips">{s.interventions.map((t: string, k: number) => <span key={k}>{t}</span>)}</div>}
          </div>
          <span className="sess-d">{[s.modality, s.date].filter(Boolean).join(' · ')}</span>
        </div>
      ))}
    </div>
  ) });

  if ((story.preQuote || '').trim()) secs.push({ t: 'Danışanın hikâyesi', eye: 'kabul görüşmesi', node: (
    <div className="quote"><div className="quote-mark">“</div><p className="quote-t">{(story.preQuote || '').replace(/^[“"]|[”"]$/g, '')}</p>{story.meta ? <div className="quote-c">{story.meta}{story.metaTail ? ` · ${story.metaTail}` : ''}</div> : null}</div>
  ) });

  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── Seans ilerlemelerinin ALTINA gömülü "Sıradaki seansa hazırlık" planlayıcısı ──
  // Etkileşimli + yazdırmada gizli (read-only belgeye dahil değil). Yalnız gerçek dosyada.
  const nextPrep = props.clientId ? (
    <div className="ozs-next print-hide">
      <SeansPlanlayiciV2
        embedded
        client={{ id: String(props.clientId), name }}
        library={library}
        onSave={saveNextPlan}
      />
    </div>
  ) : null;

  return (
    <div className="ozx" data-theme={theme}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />

      <div className="scene" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {/* ÜST BAR (noprint) */}
      <header className="ozs-topbar print-hide">
        <div className="bar">
          <button className="back" type="button" onClick={() => props.onBack?.()}><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>{props.backLabel || 'Dosya'}</button>
          <a className="ozs-logo" onClick={() => props.onNav?.('home')}>Calmie<i>.</i></a>
          <div className="bar-right">
            <span className="tb-tag">Salt-okunur · Özet</span>
            <button className="btn btn-print" type="button" onClick={() => { if (typeof window !== 'undefined') window.print(); }}><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>Yazdır / PDF</button>
          </div>
        </div>
      </header>

      <main className="doc">
        <div className="wrap">
          <div className="doc-inner">
            {/* KLİNİK DİKKAT + temel inanç adayları */}
            {showFlag && (
              <div className={`attn-row${showBeliefs ? ' has-aside' : ''}`}>
                <section className="attn" role="alert">
                  <div className="attn-ic"><svg viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg></div>
                  <div className="attn-b">
                    <div className="lab">Klinik dikkat</div>
                    <h3>Bu danışan için öncelikli klinik sinyaller var.</h3>
                    <div className="attn-list">{attnItems.map((it, i) => {
                      const points = (it.v || '').split(/(?<=[.!?…])\s+/).map(s => s.trim()).filter(Boolean);
                      return (
                        <div key={i} className="attn-cat">
                          <b>{it.k}</b>
                          {points.length > 0 && <ul className="attn-points">{points.map((p, j) => <li key={j}>{p}</li>)}</ul>}
                        </div>
                      );
                    })}</div>
                  </div>
                </section>
                {showBeliefs && (
                  <aside className="belief-box" aria-label="Temel inanç adayları">
                    <div className="bb-lab">Uzunlamasına · Temel inanç</div>
                    <h3 className="bb-title">Kendinle ilgili inançlar</h3>
                    <p className="bb-sub">Havuzdaki terimler; klinik sinyallerle örtüşenler vurgulu.</p>
                    <div className="bb-chips">{beliefList.map((b, i) => (
                      <span key={i} className={`bb-chip${b.hot ? ' hot' : ''}`}>{b.label}</span>
                    ))}</div>
                  </aside>
                )}
              </div>
            )}

            {/* HERO */}
            <section className="hero">
              <div className="hero-top">
                <div className="hero-av">{initials}</div>
                <div className="hero-id">
                  <div className="hero-eye">Danışan özeti · Klinik formülasyon dosyası</div>
                  <h1 className="hero-name">{c.firstName || name}{c.lastName ? <> <i>{c.lastName}</i></> : null}</h1>
                  {metaBits.length > 0 && <div className="hero-meta">{metaBits.map((m, i) => <span key={i}>{i > 0 ? <i>·</i> : null}{m}</span>)}</div>}
                </div>
              </div>
              {kendiSifat && <p className="hero-desc">Kendini tanımı: <i>{kendiSifat}</i></p>}
              {Array.isArray(c.tags) && c.tags.length > 0 && (
                <>
                  <span className="tagblock-l">Temel sorunlar</span>
                  <div className="tags">{c.tags.map((t: string, i: number) => <span key={i} className="tag">{t}</span>)}</div>
                </>
              )}
              <div className="stat-strip">
                <div className="stat"><span className="k">Danışan no</span><span className="v">#{c.vakaNo ?? '—'}</span></div>
                <div className="stat"><span className="k">Seans</span><span className="v">{c.sessionCount ?? records.length}</span></div>
                {c.seansUcreti != null && <div className="stat"><span className="k">Ücret / seans</span><span className="v">₺{c.seansUcreti}</span></div>}
                {cycles.length > 0 && <div className="stat"><span className="k">Döngü</span><span className="v">{cycles.length}</span></div>}
              </div>
            </section>

            {/* NUMARALI KOŞULLU BÖLÜMLER */}
            {secs.map((s, i) => (
              <Fragment key={i}>
                <section className={`ozs-sec${s.className ? ' ' + s.className : ''}`}>
                  <div className="sec-head"><span className="ozs-no">{String(i + 1).padStart(2, '0')}</span><h2 className="sec-title">{s.t}</h2>{s.eye ? <span className="sec-eye">{s.eye}</span> : null}</div>
                  {s.node}
                </section>
                {/* Seans ilerlemelerinin (Seans kayıtları) hemen ALTINA gömülü planlayıcı */}
                {s.t === 'Seans kayıtları' && nextPrep}
              </Fragment>
            ))}
            {/* Henüz seans kaydı yoksa "Seans kayıtları" bölümü çizilmez → planlayıcıyı sona ekle */}
            {!records.length && nextPrep}
          </div>

          <div className="ozs-foot">
            <span className="lock"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>Bu dosya yalnızca terapist içindir.</span>
            <small>{name}{c.vakaNo != null ? ` #${c.vakaNo}` : ''} · Calmie · {today}</small>
          </div>
        </div>
      </main>

      {/* TEMA DOCK (sol alt) */}
      <div className="dock print-hide" aria-label="Renk teması">
        {THEMES.map(([t, col]) => <button key={t} type="button" className={'dock-dot' + (theme === t ? ' on' : '')} style={{ background: col }} title={t} aria-label={`${t} tema`} onClick={() => applyTheme(t)} />)}
      </div>
    </div>
  );
}
