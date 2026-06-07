'use client';

import { useMemo, useState } from 'react';
import {
  Plus, Search, ArrowRight, AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

export type ClientModality =
  | 'BDT' | 'ACT' | 'EFT' | 'CFT' | 'EMDR' | 'Şema' | 'Diğer';

export type ClientStatus = 'active' | 'passive' | 'follow';

export type Client = {
  id: string;
  name: string;
  age?: number;
  issue: string;
  modality: ClientModality;
  sessionCount: number;
  lastSession?: string;
  nextAppointment?: string;
  continuityPct: number;
  dropRisk?: 'low' | 'medium' | 'high';
  tags?: string[];
  status?: ClientStatus;
  exitReason?: 'completed' | 'dropout' | 'financial';
  takipSikligi?: 'haftalik' | 'iki_haftalik' | 'aylik';
};

export type DanisanlarPanelProps = {
  clients?: Client[];
  availableTags?: string[];
  onCreateClient?: () => void;
  onOpenProfile?: (id: string) => void;
  onPrefetchProfile?: (id: string) => void;
};

// ─── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_CLIENTS: Client[] = [
  { id: '142', name: 'Elif Yıldız',   age: 28, issue: 'Sosyal kaygı — sunum ve toplantılarda donma, kaçınma davranışı',           modality: 'ACT',  sessionCount: 7,  lastSession: '2026.04.20', nextAppointment: 'Bugün, 10:00',       continuityPct: 92, dropRisk: 'low',    tags: ['Sosyal kaygı','Maruziyet','ACT'],  status: 'active'  },
  { id: '138', name: 'Mert Karaca',   age: 34, issue: 'OKB — yıkama kompulsiyonu, kontrol davranışları, ERP yürütülüyor',          modality: 'BDT',  sessionCount: 4,  lastSession: '2026.05.18', nextAppointment: 'Bugün, 13:30',       continuityPct: 88, dropRisk: 'low',    tags: ['OKB','ERP'],                       status: 'active'  },
  { id: '129', name: 'Selin Aydın',   age: 41, issue: 'Karmaşık yas — anne kaybı 6. ay, anlam ve süreklilik çalışması',            modality: 'CFT',  sessionCount: 12, lastSession: '2026.05.21', nextAppointment: 'Bugün, 16:00',       continuityPct: 76,                       tags: ['Yas','Şefkat'],                    status: 'active'  },
  { id: '125', name: 'Burak Demir',   age: 36, issue: 'Çift terapisi — iletişim örüntüleri, kovalama/kaçma döngüsü',               modality: 'EFT',  sessionCount: 9,  lastSession: '2026.05.10', nextAppointment: 'Yarın · 09:30',      continuityPct: 70, dropRisk: 'medium', tags: ['Çift','İletişim'],                 status: 'active'  },
  { id: '119', name: 'Naz Özkan',     age: 23, issue: 'Travma sonrası stres — trafik kazası, intrusiv anılar, hipervijilans',       modality: 'EMDR', sessionCount: 5,  lastSession: '2026.05.02', nextAppointment: 'Per. 27.05 · 14:00', continuityPct: 64, dropRisk: 'medium', tags: ['Travma','EMDR'],                   status: 'active'  },
  { id: '112', name: 'Kerem Aksoy',   age: 29, issue: 'Yaygın anksiyete — uyku düzensizliği, kas gerginliği, endişe',              modality: 'BDT',  sessionCount: 18, lastSession: '2026.04.28', nextAppointment: '—',                  continuityPct: 48, dropRisk: 'high',   tags: ['YAB','Drop riski'],                status: 'follow'  },
  { id: '108', name: 'Deniz Tekin',   age: 31, issue: 'Şema çalışması — terk edilme şeması, bağlanma örüntüleri',                  modality: 'Şema', sessionCount: 22, lastSession: '2026.05.15', nextAppointment: 'Cu 28.05 · 11:00',   continuityPct: 84,                       tags: ['Şema','Bağlanma'],                 status: 'active'  },
  { id: '101', name: 'Ada Korkmaz',   age: 27, issue: 'Mükemmeliyetçilik — iş yerinde tükenmişlik, öz-eleştiri',                   modality: 'ACT',  sessionCount: 6,  lastSession: '2026.05.19', nextAppointment: 'Sa 26.05 · 17:00',   continuityPct: 80,                       tags: ['Tükenmişlik','Değerler'],          status: 'active'  },
  { id: '094', name: 'Tolga Erdem',   age: 45, issue: 'Panik bozukluk — agorafobik komponent, taşıt kaçınması',                    modality: 'BDT',  sessionCount: 11, lastSession: '2026.05.08', nextAppointment: 'Per 27.05 · 10:00',  continuityPct: 72, dropRisk: 'low',    tags: ['Panik','Maruziyet'],               status: 'active'  },
  { id: '087', name: 'Lale Yorulmaz', age: 52, issue: 'Depresif epizod — son 4 ayda fonksiyonellik kaybı, davranışsal aktivasyon', modality: 'BDT',  sessionCount: 8,  lastSession: '2026.03.14', nextAppointment: '—',                  continuityPct: 30, dropRisk: 'high',   tags: ['Depresyon','Drop riski'],          status: 'passive' },
];

const DEFAULT_TAGS = [
  'Hepsi', 'Sosyal kaygı', 'OKB', 'Travma', 'Yas', 'Çift', 'Depresyon', 'Şema', 'Drop riski',
];

// ─── Component ────────────────────────────────────────────────────────────

export default function DanisanlarPanel({
  clients = DEFAULT_CLIENTS,
  availableTags = DEFAULT_TAGS,
  onCreateClient,
  onOpenProfile,
  onPrefetchProfile,
}: DanisanlarPanelProps) {
  const [query, setQuery] = useState('');
  const [tag, setTag]     = useState<string>('Hepsi');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (tag !== 'Hepsi' && !(c.tags ?? []).includes(tag)) return false;
      if (q && !(
        c.name.toLowerCase().includes(q) ||
        c.issue.toLowerCase().includes(q) ||
        (c.tags ?? []).some((t) => t.toLowerCase().includes(q))
      )) return false;
      return true;
    });
  }, [clients, query, tag]);

  // Aktif = devam eden + takip · Geçmiş = arşiv / pasif
  const aktif  = useMemo(() => filtered.filter((c) => (c.status ?? 'active') !== 'passive'), [filtered]);
  const gecmis = useMemo(() => filtered.filter((c) => (c.status ?? 'active') === 'passive'), [filtered]);

  const renderRow = (c: Client, i: number) => (
    <button
      key={c.id}
      type="button"
      className="cl-row"
      onClick={() => onOpenProfile?.(c.id)}
      onMouseEnter={() => onPrefetchProfile?.(c.id)}
    >
      <span className="cl-row-ix">{String(i + 1).padStart(2, '0')}</span>
      <div className="cl-row-name">
        <div className="cl-avatar" aria-hidden="true">{initials(c.name)}</div>
        <div>
          <strong>{c.name}</strong>
          <span>{c.age ? `${c.age} yaş` : '—'} · vaka #{c.id}</span>
        </div>
      </div>
      <p className="cl-row-issue">{c.issue}</p>
      <span className={`cl-pill cl-pill-${c.modality.toLowerCase()}`}>
        <span className="cl-pill-dot" />
        {c.modality}
      </span>
      <span className="cl-row-seans">{c.sessionCount}<em>.</em></span>
      <div className="cl-row-cont">
        <span className="cl-cont-bar">
          <span className={`cl-cont-fill ${c.dropRisk === 'high' ? 'risk' : ''}`} style={{ width: `${c.continuityPct}%` }} />
        </span>
        <span className="cl-cont-pct">{c.continuityPct}%</span>
      </div>
      <div className="cl-row-next">
        {c.dropRisk === 'high' && (
          <span className="cl-risk" aria-label="yüksek drop riski"><AlertTriangle size={11} strokeWidth={2} /> risk</span>
        )}
        <span className={c.nextAppointment === '—' ? 'muted' : c.nextAppointment?.startsWith('Bugün') ? 'accent' : ''}>
          {c.nextAppointment || '—'}
        </span>
      </div>
      <span className="cl-row-arrow"><ArrowRight size={13} strokeWidth={1.8} /></span>
    </button>
  );

  const renderGroup = (title: string, rows: Client[], past = false) => (
    <section className={`cl-group ${past ? 'past' : ''}`}>
      <div className="cl-group-head">
        <h2 className="cl-group-title">{title}</h2>
        <span className="cl-group-n">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className="cl-group-empty">{past ? 'Henüz geçmiş (arşivlenmiş) danışan yok.' : 'Aktif danışan yok.'}</div>
      ) : (
        <div className="cl-list">
          <div className="cl-list-head">
            <span>#</span><span>Danışan</span><span>Yakınma</span><span>Ekol</span>
            <span className="num">Seans</span><span>Süreklilik</span><span>Sonraki randevu</span><span />
          </div>
          {rows.map((c, i) => renderRow(c, i))}
        </div>
      )}
    </section>
  );

  // Geçmiş = ayrılış sebebine göre alt gruplar
  const PAST_CATS: { key: string; label: string }[] = [
    { key: 'completed', label: 'Süreci Tamamlayanlar' },
    { key: 'dropout',   label: 'Yarıda Bırakanlar' },
    { key: 'financial', label: 'Maddi Sebeple Bırakanlar' },
    { key: '__none',    label: 'Sebep Belirtilmemiş' },
  ];
  const renderPast = () => (
    <section className="cl-group past">
      <div className="cl-group-head">
        <h2 className="cl-group-title">Geçmiş Danışanlar</h2>
        <span className="cl-group-n">{gecmis.length}</span>
      </div>
      {gecmis.length === 0 ? (
        <div className="cl-group-empty">Henüz geçmiş (arşivlenmiş) danışan yok.</div>
      ) : (
        PAST_CATS.map((cat) => {
          const rows = gecmis.filter((c) => (c.exitReason ?? '__none') === cat.key);
          if (rows.length === 0) return null;
          return (
            <div className="cl-subgroup" key={cat.key}>
              <div className="cl-subgroup-head">
                <span className="cl-subgroup-title">{cat.label}</span>
                <span className="cl-subgroup-n">{rows.length}</span>
              </div>
              <div className="cl-list">
                <div className="cl-list-head">
                  <span>#</span><span>Danışan</span><span>Yakınma</span><span>Ekol</span>
                  <span className="num">Seans</span><span>Süreklilik</span><span>Sonraki randevu</span><span />
                </div>
                {rows.map((c, i) => renderRow(c, i))}
              </div>
            </div>
          );
        })
      )}
    </section>
  );

  return (
    <div className="cl" data-screen-label="03 Danışanlar">

      {/* ── HEADER ────────────────────────────────────────── */}
      <header className="cl-header">
        <div className="cl-header-left">
          <span className="cl-eyebrow">arşiv · son güncel: bugün</span>
          <h1 className="cl-title">
            <em>{clients.length}</em> danışan,<br />
            bir bütün <em>tablo</em>.
          </h1>
        </div>
        <div className="cl-header-right">
          <div className="cl-search">
            <Search size={15} strokeWidth={1.8} />
            <input
              type="text"
              placeholder="İsim, yakınma veya etikete göre ara…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="cl-search-clear" onClick={() => setQuery('')}>
                temizle
              </button>
            )}
          </div>
          <button type="button" className="cl-btn cl-btn-primary" onClick={onCreateClient}>
            <Plus size={15} strokeWidth={2} /> Yeni danışan
          </button>
        </div>
      </header>

      {/* ── FILTER BAR ────────────────────────────────────── */}
      <div className="cl-filterbar">
        <div className="cl-tags">
          {availableTags.map((t) => (
            <button
              key={t}
              type="button"
              className={`cl-tag ${tag === t ? 'on' : ''}`}
              onClick={() => setTag(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── LİSTELER (Aktif / Geçmiş ayrı ayrı) ───────────── */}
      <div className="cl-list-wrap">
        {filtered.length === 0 ? (
          <div className="cl-empty">
            <p>Bu filtreyle eşleşen danışan yok.</p>
            <button
              type="button"
              className="cl-btn cl-btn-ghost"
              onClick={() => { setQuery(''); setTag('Hepsi'); }}
            >
              Filtreleri sıfırla
            </button>
          </div>
        ) : (
          <>
            {renderGroup('Aktif Danışanlar', aktif)}
            {renderPast()}
          </>
        )}
      </div>

    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
