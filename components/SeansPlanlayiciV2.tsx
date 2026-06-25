'use client';

import { useEffect, useMemo, useState } from 'react';
import './SeansPlanlayiciV2.css';
import type { Intervention } from '@/lib/types';

// ──────────────────────────────────────────────────────────────────────────
// "Sıradaki seansa hazırlık yap" — landing-uyumlu Cam bölümü (.shp scope).
// Danışan dosyasında "seans ilerlemeleri"nin hemen altına GÖMÜLÜR (embedded).
// Sol: hedef + plan blokları · Sağ: müdahale kütüphanesi · Kaydet → SessionPlan.
// İşlev önceki sürümden BİREBİR korunmuştur; yalnız tasarım + başlık değişti.
// ──────────────────────────────────────────────────────────────────────────

const DUR_MIN: Record<string, number> = { kisa: 8, orta: 18, uzun: 35, 'tam-seans': 50 };
const durOf = (iv: Intervention) => iv.durationMinutes ?? DUR_MIN[iv.duration] ?? 18;

export type PlanBlock = { id: string; t: string; cat: string; dur: number };

export type SeansPlanlayiciV2Props = {
  client?: { id: string; name: string };
  library: Intervention[];
  seedIds?: string[];
  onBack?(): void;
  onNav?(target: string): void;
  onOpenFile?(): void;
  onSave?(args: { goal: string; items: { interventionId: string; durationMinutes: number; order: number; block: 'main' }[] }): void;
  /** Danışan dosyasına gömülü kullanım — kendi sahne/geri butonunu çizmez (ebeveyn sağlar). */
  embedded?: boolean;
};

export default function SeansPlanlayiciV2(props: SeansPlanlayiciV2Props) {
  const { client, library, seedIds = [], onBack, onSave, embedded } = props;
  const libMap = useMemo(() => new Map(library.map((i) => [i.id, i])), [library]);

  const [plan, setPlan] = useState<PlanBlock[]>(() =>
    seedIds.map((id) => libMap.get(id)).filter(Boolean).map((iv) => ({ id: iv!.id, t: iv!.title, cat: iv!.modality, dur: durOf(iv!) })),
  );
  const [goal, setGoal] = useState('');
  const [cat, setCat] = useState('');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);

  // Tema (Ana Sayfa/Danışanlar ile paylaşımlı) — gömülüyken ebeveynle aynı görünür.
  const [theme, setTheme] = useState('sage');
  useEffect(() => { try { setTheme(localStorage.getItem('calmie-theme') || 'sage'); } catch { /* yoksay */ } }, []);

  const cats = useMemo(() => [...new Set(library.map((i) => i.modality))], [library]);
  const libRows = library.filter((i) => (!cat || i.modality === cat) && (!query || i.title.toLocaleLowerCase('tr').includes(query)));

  const add = (iv: Intervention) => { if (!plan.some((p) => p.id === iv.id)) setPlan((p) => [...p, { id: iv.id, t: iv.title, cat: iv.modality, dur: durOf(iv) }]); };
  const remove = (idx: number) => setPlan((p) => p.filter((_, i) => i !== idx));
  const setDur = (idx: number, v: number) => setPlan((p) => p.map((b, i) => (i === idx ? { ...b, dur: v } : b)));
  const total = plan.reduce((n, b) => n + (b.dur || 0), 0);

  const save = () => {
    onSave?.({ goal, items: plan.map((b, order) => ({ interventionId: b.id, durationMinutes: b.dur, order, block: 'main' as const })) });
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };

  const section = (
    <section className="shp-sec">
      <div className="shp-head">
        {!embedded && onBack && (
          <button className="shp-back" type="button" onClick={() => onBack()}><span className="chev">‹</span>Danışan dosyası</button>
        )}
        <span className="shp-eyebrow">Sıradaki seans</span>
        <h2 className="shp-title">Sıradaki seansa <i>hazırlık</i> yap</h2>
        <p className="shp-lead">Bir sonraki seansın iskeletini kur — hedefi yaz, kütüphaneden müdahale ekle, blok sürelerini ayarla.</p>
      </div>

      <div className="shp-grid">
        {/* SOL: plan */}
        <div className="shp-card">
          <div className="shp-ch"><span className="shp-eye">Plan</span><span className="shp-ct num">{plan.length} blok</span></div>
          <div className="shp-goal">
            <label htmlFor="shpGoal">Seans hedefi</label>
            <input id="shpGoal" type="text" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Örn. Defüzyonu pekiştir; bir basamak ilerle." />
          </div>
          <div className="shp-plan">
            {plan.length === 0 ? (
              <div className="shp-empty"><span className="ring">+</span><span className="t">Plan boş</span><span className="s">Sağdaki kütüphaneden müdahale ekle.</span></div>
            ) : plan.map((b, idx) => (
              <div className="shp-block" key={b.id}>
                <span className="shp-step num">{idx + 1}</span>
                <div className="shp-bc"><div className="shp-bt">{b.t}</div><div className="shp-bm">{b.cat}</div></div>
                <div className="shp-bright">
                  <div className="shp-dur"><input type="number" min={1} max={90} value={b.dur} onChange={(e) => setDur(idx, +e.target.value)} aria-label="süre dk" /><span>dk</span></div>
                  <button className="shp-rm" type="button" aria-label="kaldır" onClick={() => remove(idx)}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SAĞ: kütüphane */}
        <div className="shp-card">
          <div className="shp-ch"><span className="shp-eye">Müdahale kütüphanesi</span></div>
          <div className="shp-search">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value.trim().toLocaleLowerCase('tr'))} placeholder="Teknik ara…" aria-label="Teknik ara" />
          </div>
          <div className="shp-cats">
            <button className={`shp-chip${cat === '' ? ' on' : ''}`} onClick={() => setCat('')}>Tümü</button>
            {cats.map((c) => <button key={c} className={`shp-chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <div className="shp-lib">
            {libRows.length === 0 ? (
              <div className="shp-empty"><span className="ring">∅</span><span className="t">Eşleşen teknik yok</span></div>
            ) : libRows.map((i) => {
              const added = plan.some((p) => p.id === i.id);
              return (
                <div className={`shp-li${added ? ' added' : ''}`} key={i.id}>
                  <div><div className="shp-lit">{i.title}</div><div className="shp-lim num">{i.modality} · {durOf(i)} dk</div></div>
                  <button className="shp-add" type="button" aria-label={added ? 'eklendi' : 'ekle'} onClick={() => add(i)}>
                    <svg viewBox="0 0 24 24">{added ? <path d="M20 6 9 17l-5-5" /> : <path d="M12 5v14M5 12h14" />}</svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="shp-bar">
        <div className="shp-stat num">{plan.length} blok · {total} dk planlandı</div>
        <div className="shp-acts">
          <button className="shp-ghost" type="button" onClick={() => { setPlan([]); setGoal(''); }}>Temizle</button>
          <button className={`shp-save${saved ? ' done' : ''}`} type="button" onClick={save}><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg><span>{saved ? 'Kaydedildi ✓' : 'Planı kaydet'}</span></button>
        </div>
      </div>
    </section>
  );

  // Gömülü: ebeveyn (danışan dosyası) sahne/temayı sağlar → yalnız bölüm.
  if (embedded) return <div className="shp" data-theme={theme}>{section}</div>;

  // Standalone route: kendi Cam sahnesi + tema.
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap" rel="stylesheet" />
      <div className="shp shp-page" data-theme={theme}>
        <div className="shp-scene" aria-hidden="true" />
        {section}
      </div>
    </>
  );
}
