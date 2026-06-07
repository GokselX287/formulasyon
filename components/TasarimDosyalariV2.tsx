'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './TasarimDosyalariV2.css';

// ──────────────────────────────────────────────────────────────────────────
// Tasarım Dosyaları — "Klinik Editöryel Dosya" · Tasarım Dosyaları v2.html port.
// Gerçek /api/designs (GET/POST/DELETE) — boşsa boş durum (uydurma yok).
// Kategori filtresi gerçek veride yok → kind'a (Görsel/PDF/SVG) maplenir.
// ──────────────────────────────────────────────────────────────────────────

interface DesignFile {
  id: string; name: string; original_name: string; mime_type: string;
  size_bytes: number; source: 'upload' | 'canva'; thumbnail: string | null;
  path: string; notes: string | null; created_at: string;
}

export type TasarimDosyalariV2Props = { onBack?(): void; onNav?(target: string): void };

const KIND_ICON: Record<string, React.ReactNode> = {
  'görsel': <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M3 17l5-4 4 3 3-3 6 5" /></>,
  'pdf': <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>,
  'svg': <polygon points="12 3 20 8 20 16 12 21 4 16 4 8" />,
};

const kindOf = (mime: string): 'görsel' | 'pdf' | 'svg' =>
  mime === 'image/svg+xml' ? 'svg' : mime === 'application/pdf' ? 'pdf' : 'görsel';
const sourceLabel = (s: string) => (s === 'canva' ? 'Canva' : 'Yerel');
const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return iso.slice(0, 10); } };

const DOCK = [
  { label: 'Ana Sayfa', target: 'home' },
  { label: 'Çalışma Alanı', target: 'calisma-alani', active: true },
  { label: 'Profil', target: 'terapist' },
  { label: 'Yol Haritası', target: 'tasarim-arsivi' },
  { label: 'ACT Geliştirme', target: 'act-gelistirme' },
];

export default function TasarimDosyalariV2(props: TasarimDosyalariV2Props) {
  const { onBack, onNav } = props;
  const [files, setFiles] = useState<DesignFile[]>([]);
  const [cat, setCat] = useState('');
  const [query, setQuery] = useState('');
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try { const r = await fetch('/api/designs'); if (r.ok) setFiles(await r.json()); } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (fileList: FileList | null) => {
    if (!fileList) return;
    for (const file of Array.from(fileList)) {
      const fd = new FormData(); fd.append('file', file);
      try { await fetch('/api/designs', { method: 'POST', body: fd }); } catch {}
    }
    load();
  };

  const cats = [...new Set(files.map((f) => kindLabel(f)))];
  const rows = files.filter((f) =>
    (!cat || kindLabel(f) === cat) &&
    (!query || `${f.name} ${f.original_name}`.toLocaleLowerCase('tr').includes(query)),
  );

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="td2" data-cat={cat}>
        <div className="shell">

          <div className="topbar">
            <button className="back" type="button" onClick={() => onBack?.()}><span className="chev">‹</span>Çalışma Alanı</button>
            <button className="tb-new" type="button" onClick={() => inputRef.current?.click()}><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Dosya yükle</button>
          </div>

          <div className="modal-body">
            <div className="hero">
              <span className="eyebrow">Çalışma Alanı · Tasarım Dosyaları</span>
              <h1>Tasarım <i>dosyaları</i></h1>
              <p>Danışan materyalleri — Canva/Figma görselleri, psikoeğitim afişleri, çalışma kâğıtları. Yükle, etiketle, seansta ya da paylaşımda kullan.</p>
            </div>

            <div className="wrap">
              <div className={`drop${over ? ' over' : ''}`} onClick={() => inputRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); setOver(true); }} onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setOver(false); }} onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}>
                <span className="di"><svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" /></svg></span>
                <div className="dt">
                  <b>Dosyaları buraya bırak ya da içe aktar</b>
                  <span>PNG · JPG · PDF · SVG — ya da Canva / Figma bağlantısı yapıştır</span>
                  <div className="src"><span>Canva</span><span>Figma</span><span>Yerel dosya</span><span>Bağlantı</span></div>
                </div>
                <span className="browse">Gözat</span>
                <input ref={inputRef} type="file" hidden multiple accept="image/*,application/pdf" onChange={(e) => upload(e.target.files)} />
              </div>

              <div className="controls">
                <div className="cats">
                  <span className="lbl">Tür</span>
                  <button className={`chip${cat === '' ? ' on' : ''}`} onClick={() => setCat('')}>Tümü</button>
                  {cats.map((c) => <button key={c} className={`chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
                </div>
                <div className="search">
                  <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value.trim().toLocaleLowerCase('tr'))} placeholder="Dosya ara…" aria-label="Dosya ara" />
                </div>
              </div>

              <div className="gallery">
                {rows.length === 0 ? (
                  <div className="empty"><span className="ring">∅</span><span className="t">{files.length === 0 ? 'Henüz tasarım dosyası yok' : 'Eşleşen dosya yok'}</span></div>
                ) : rows.map((a) => {
                  const k = kindOf(a.mime_type);
                  return (
                    <article className="asset" key={a.id} data-screen-label={`Dosya — ${a.name}`}>
                      <div className="thumb">
                        <span className="kind">{k}</span>
                        <span className="src-tag">{sourceLabel(a.source)}</span>
                        {a.thumbnail || (k === 'görsel' && a.path)
                          ? <img src={a.thumbnail ?? a.path} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span className="gi"><svg viewBox="0 0 24 24">{KIND_ICON[k]}</svg></span>}
                      </div>
                      <div className="meta">
                        <div className="an">{a.name}</div>
                        <div className="am">{kindLabel(a)} · {fmtDate(a.created_at)}</div>
                        {a.notes && <div className="tags"><span>{a.notes}</span></div>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="tail"><p>{files.length} dosya · sürükle-bırak ya da “Dosya yükle”.</p></div>
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

  function kindLabel(f: DesignFile) { return ({ 'görsel': 'Görsel', 'pdf': 'PDF', 'svg': 'SVG' } as const)[kindOf(f.mime_type)]; }
}
