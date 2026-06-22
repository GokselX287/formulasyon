'use client';

// ──────────────────────────────────────────────────────────────────────────
// Danışan Konum Haritası — Çalışma Alanı kutusu. Danışanların anamnezdeki
// şehir/ilçe verisinden coğrafi dağılımı: şematik Türkiye haritası üzerinde
// il bazlı balonlar + yanında sıralı liste (ilçe kırılımı). Kendi verisini çeker.
// ──────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { ILLER, SINIR, project, ilBul, MAP_W, MAP_H } from '@/lib/turkiyeGeo';
import './DanisanKonumHaritasi.css';

type IlSayim = { sehir: string; count: number; ilceler: { ilce: string; count: number }[] };
type KonumData = { total: number; bilinmeyen: number; iller: IlSayim[] };

const outlinePath = (() => {
  const pts = SINIR.map(([lon, lat]) => project(lon, lat));
  return 'M' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L') + 'Z';
})();

export default function DanisanKonumHaritasi() {
  const [data, setData] = useState<KonumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/danisan-konum')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setData(d); })
      .catch(() => { if (alive) setData(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const maxCount = useMemo(() => Math.max(1, ...((data?.iller ?? []).map((i) => i.count))), [data]);
  const bubbles = useMemo(() => (data?.iller ?? []).map((i) => {
    const il = ilBul(i.sehir);
    if (!il) return null;
    const p = project(il.lon, il.lat);
    const r = 7 + 24 * Math.sqrt(i.count / maxCount);
    return { ...i, x: p.x, y: p.y, r };
  }).filter(Boolean) as (IlSayim & { x: number; y: number; r: number })[], [data, maxCount]);

  const total = data?.total ?? 0;
  const ilSayisi = data?.iller.length ?? 0;
  const selData = sel ? data?.iller.find((i) => i.sehir === sel) ?? null : null;

  return (
    <section className="dkh" data-screen-label="Danışan konumları">
      <div className="dkh-head">
        <div>
          <span className="dkh-eyebrow">Konum</span>
          <h2 className="dkh-title">Danışanlar hangi konumlardan geliyor?</h2>
        </div>
        <div className="dkh-stats">
          <div className="dkh-stat"><b>{total}</b><span>konumlu danışan</span></div>
          <div className="dkh-stat"><b>{ilSayisi}</b><span>farklı il</span></div>
        </div>
      </div>

      {loading ? (
        <div className="dkh-empty">Konum verisi yükleniyor…</div>
      ) : total === 0 ? (
        <div className="dkh-empty">
          Henüz konum verisi yok. Anamnez → <b>Kişisel bilgiler</b>’de şehir/ilçe girdikçe danışanların dağılımı burada haritalanır.
        </div>
      ) : (
        <div className="dkh-body">
          <div className="dkh-mapwrap">
            <svg className="dkh-map" viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label="Danışan il dağılımı">
              <path className="dkh-outline" d={outlinePath} />
              {/* tüm iller — soluk referans noktaları (harita şekli okunsun) */}
              {ILLER.map((il) => { const p = project(il.lon, il.lat); return <circle key={il.ad} className="dkh-dot" cx={p.x} cy={p.y} r={2.4} />; })}
              {/* danışanı olan iller — balonlar */}
              {bubbles.map((b) => {
                const on = sel === b.sehir;
                return (
                  <g key={b.sehir} className={`dkh-bub${on ? ' on' : ''}`} onClick={() => setSel(on ? null : b.sehir)}>
                    <circle cx={b.x} cy={b.y} r={b.r} />
                    {(b.count === maxCount || on) && <text x={b.x} y={b.y} dy="0.35em">{b.count}</text>}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="dkh-side">
            <ul className="dkh-list">
              {data!.iller.map((i) => (
                <li key={i.sehir}>
                  <button type="button" className={sel === i.sehir ? 'on' : ''} onClick={() => setSel(sel === i.sehir ? null : i.sehir)}>
                    <span className="dkh-bar" style={{ width: `${Math.round((i.count / maxCount) * 100)}%` }} />
                    <span className="dkh-li-name">{i.sehir}</span>
                    <span className="dkh-li-n num">{i.count}</span>
                  </button>
                </li>
              ))}
            </ul>
            {selData && (
              <div className="dkh-ilce">
                <div className="dkh-ilce-h">{selData.sehir} · ilçeler</div>
                {selData.ilceler.length ? (
                  <div className="dkh-ilce-tags">
                    {selData.ilceler.map((x) => <span key={x.ilce}>{x.ilce}<i>{x.count}</i></span>)}
                  </div>
                ) : <p className="dkh-ilce-empty">İlçe bilgisi girilmemiş.</p>}
              </div>
            )}
            {(data!.bilinmeyen > 0) && <p className="dkh-note">{data!.bilinmeyen} danışanın şehri tanınmadı (haritada gösterilmiyor).</p>}
          </div>
        </div>
      )}
    </section>
  );
}
