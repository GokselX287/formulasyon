'use client';

import { useMemo, useState } from 'react';
import './SeansPlanlayiciV2.css';
import type { Intervention } from '@/lib/types';

// ──────────────────────────────────────────────────────────────────────────
// Seans Planlayıcı — "Klinik Editöryel Dosya" · Seans Planlayıcı v2.html port.
// Sol: hedef + plan blokları (süre düzenle/kaldır). Sağ: gerçek müdahale
// kütüphanesi (arama+kategori+ekle). Kaydet → SessionPlan.
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
};

const TONES = [{ bg: '#E8EAF7', ink: '#4C5078' }, { bg: '#FBE7DC', ink: '#8C5A41' }, { bg: '#DFF0E5', ink: '#477254' }, { bg: '#E3EAF6', ink: '#46587C' }, { bg: '#EDE6F4', ink: '#604B75' }, { bg: '#F6EFD9', ink: '#6F5C30' }];
const toneFor = (n: string) => { let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return TONES[h % TONES.length]; };
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

export default function SeansPlanlayiciV2(props: SeansPlanlayiciV2Props) {
  const { client, library, seedIds = [], onBack, onNav, onOpenFile, onSave } = props;
  const libMap = useMemo(() => new Map(library.map((i) => [i.id, i])), [library]);

  const [plan, setPlan] = useState<PlanBlock[]>(() =>
    seedIds.map((id) => libMap.get(id)).filter(Boolean).map((iv) => ({ id: iv!.id, t: iv!.title, cat: iv!.modality, dur: durOf(iv!) })),
  );
  const [goal, setGoal] = useState('');
  const [cat, setCat] = useState('');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);

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

  const t = toneFor(client?.name ?? 'Danışan');

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&display=swap" rel="stylesheet" />

      <div className="sx2">
        <div className="shell">

          <div className="topbar">
            <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Danışan dosyası</button>
            {client && <div className="tb-meta"><span className="av" style={{ background: t.bg, color: t.ink }}>{initials(client.name)}</span><span>{client.name}</span></div>}
          </div>

          <div className="modal-body">
            <div className="hero">
              <span className="eyebrow">Çalışma Alanı · Seans Planlayıcı</span>
              <h1>Seans <i>planı</i> kur</h1>
              <p>Danışan için bir sonraki seansın iskeletini kur: hedefi yaz, kütüphaneden müdahaleleri ekle, blok sürelerini ayarla.</p>
            </div>

            <div className="layout">
              {/* SOL: plan */}
              <div className="panel">
                <div className="ph"><span className="eyebrow">Plan</span><span className="ct">{plan.length} blok</span></div>
                <div className="goal">
                  <label htmlFor="goalInput">Seans hedefi</label>
                  <input id="goalInput" type="text" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Örn. Defüzyonu pekiştir; bir basamak ilerle." />
                </div>
                <div className="plan-list">
                  {plan.length === 0 ? (
                    <div className="plan-empty"><span className="ring">+</span><span className="t">Plan boş</span><span className="s">Sağdaki kütüphaneden müdahale ekle.</span></div>
                  ) : plan.map((b, idx) => (
                    <div className="pblock" key={b.id}>
                      <div className="hnd"><i /><i /><i /></div>
                      <div className="pc"><div className="pt">{b.t}</div><div className="pmeta">{b.cat} · adım {idx + 1}</div></div>
                      <div className="right">
                        <div className="dur-edit"><input type="number" min={1} max={90} value={b.dur} onChange={(e) => setDur(idx, +e.target.value)} aria-label="süre dk" /><span>dk</span></div>
                        <button className="rm" type="button" aria-label="kaldır" onClick={() => remove(idx)}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAĞ: kütüphane */}
              <div className="panel">
                <div className="ph"><span className="eyebrow">Müdahale kütüphanesi</span></div>
                <div className="libsearch">
                  <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value.trim().toLocaleLowerCase('tr'))} placeholder="Teknik ara…" aria-label="Teknik ara" />
                </div>
                <div className="libcats">
                  <button className={`lchip${cat === '' ? ' on' : ''}`} onClick={() => setCat('')}>Tümü</button>
                  {cats.map((c) => <button key={c} className={`lchip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
                </div>
                <div className="lib-list">
                  {libRows.length === 0 ? (
                    <div className="plan-empty"><span className="ring">∅</span><span className="t">Eşleşen teknik yok</span></div>
                  ) : libRows.map((i) => {
                    const added = plan.some((p) => p.id === i.id);
                    return (
                      <div className={`libitem${added ? ' added' : ''}`} key={i.id}>
                        <div><div className="li-t">{i.title}</div><div className="li-m">{i.modality} · {durOf(i)} dk</div></div>
                        <button className="add" type="button" aria-label={added ? 'eklendi' : 'ekle'} onClick={() => add(i)}>
                          <svg viewBox="0 0 24 24">{added ? <path d="M20 6 9 17l-5-5" /> : <path d="M12 5v14M5 12h14" />}</svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="savebar">
              <div className="savebar-in">
                <div className="stat">{plan.length} blok · {total} dk planlandı</div>
                <div className="acts">
                  <button className="ghost" type="button" onClick={() => { setPlan([]); setGoal(''); }}>Temizle</button>
                  <button className={`save${saved ? ' done' : ''}`} type="button" onClick={save}><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg><span>{saved ? 'Kaydedildi ✓' : 'Planı kaydet'}</span></button>
                </div>
              </div>
            </div>
          </div>

          <nav className="dock" aria-label="Bölümler">
            {DOCK.map((d) => (
              <a key={d.target} href="#" className={d.active ? 'active' : ''} onClick={(e) => { e.preventDefault(); if (!d.active) onNav?.(d.target); }}>{d.label}</a>
            ))}
          </nav>

        </div>
      </div>
    </>
  );
}
