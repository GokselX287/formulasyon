'use client';

import { useMemo } from 'react';
import './TakvimRandevular.css';

// ──────────────────────────────────────────────────────────────────────────
// Gelişim Planı — Takvim'den çıkarılıp Çalışma Alanı kutusu olarak sunulur.
// Takvim'in .tkv/.trv panel stillerini gömülü (.tkv-embed) kullanır.
// gelisimEvents prop'undan beslenir (Takvim'deki dev memo'su ile aynı).
// ──────────────────────────────────────────────────────────────────────────

export type GelisimEv = { id: string; title: string; date: string; time: string; durationMin: number; done?: boolean };

export default function GelisimPlaniPanel({ gelisimEvents, onBack }: { gelisimEvents?: GelisimEv[]; onBack?: () => void }) {
  const dev = useMemo(() => {
    const g = gelisimEvents ?? [];
    if (!g.length) return null;
    const toItem = (x: GelisimEv) => ({ date: x.date, kind: 'Etkinlik', title: x.title, meta: `${x.time} · ${x.durationMin} dk`, progress: 0 as number | null });
    return { upcoming: g.filter((x) => !x.done).map(toItem), completed: g.filter((x) => x.done).map(toItem) };
  }, [gelisimEvents]);

  return (
    <div className="tkv tkv-embed">
      <div className="trv trv-pane">
        <main>
          <button type="button" className="tkv-embed-back" onClick={() => onBack?.()}>‹ Çalışma Alanı</button>
          <div className="panel" data-screen-label="Gelişim Planı">
            <div className="panel-head"><div className="ph-l"><h1 className="ph-title">Gelişim Planı</h1><p className="ph-sub">Eğitim ve mesleki yatırım etkinliklerin — ayrı bir takvim kaynağından.</p></div></div>
            {!dev || (dev.upcoming.length === 0 && dev.completed.length === 0) ? (
              <div className="empty"><div className="e-mark">∅</div><div className="e-title">Henüz gelişim etkinliği yok.</div><div className="e-sub">Eğitim/süpervizyon planı eklenince burada görünür.</div></div>
            ) : (
              <div className="dev-cols">
                <div>
                  <div className="dev-col-head"><span className="d" style={{ background: 'var(--now)' }} /><span className="t">Yaklaşan</span></div>
                  {dev.upcoming.map((x, i) => (
                    <div key={i} className="dev-item"><div className="di-top"><span className="di-date mono">{x.date}</span><span className="di-kind">{x.kind}</span></div><h3 className="di-title">{x.title}</h3><div className="di-meta">{x.meta}</div>{x.progress != null && <div className="di-prog"><span style={{ width: `${x.progress}%` }} /></div>}</div>
                  ))}
                </div>
                <div>
                  <div className="dev-col-head"><span className="d" style={{ background: 'var(--sage, #6E6C66)' }} /><span className="t">Tamamlanan</span></div>
                  {dev.completed.map((x, i) => (
                    <div key={i} className="dev-item done"><div className="di-top"><span className="di-date mono">{x.date}</span><span className="di-kind">{x.kind}</span></div><h3 className="di-title">{x.title}</h3><div className="di-meta">{x.meta}</div></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
