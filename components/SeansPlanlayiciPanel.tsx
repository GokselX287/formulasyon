'use client';

import { useMemo, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Save, Sparkles,
  Plus, Search, X, MoreHorizontal, Trash2, GripVertical,
  ChevronLeft, ChevronRight, AlertTriangle, RotateCcw, Eye, Library,
  CheckCircle2, Clock, FileText,
} from 'lucide-react';

// ─── Shared types — imported from MudahalePanel (single source of truth) ──
import type {
  Modality, AgeGroup, Format, Duration, Evidence, Intervention,
} from '@/components/MudahalePanel';
export type {
  Modality, AgeGroup, Format, Duration, Evidence, Intervention,
} from '@/components/MudahalePanel';

export type SessionBlock  = 'opening' | 'main' | 'closing';
export type SessionLength = 45 | 50 | 60 | 90;

export type PlannedItem = {
  interventionId:   string;
  block:            SessionBlock;
  order:            number;
  durationMinutes:  number;
  sessionNotes?:    string;
};

export type SessionPlan = {
  id?:            string;
  clientId:       string;
  sessionLength:  SessionLength;
  items:          PlannedItem[];
  homework?:      string;
  nextFocus?:     string;
};

export type SessionContext = {
  summary:       string;
  homework:      { label: string; done: boolean }[];
  focusPoints:   string[];
  avoid?:        string[];
  recommendedModalities?: Modality[];
};

export type SeansPlanlayiciPanelProps = {
  client?:        { id: string; name: string; age?: number; issue?: string };
  sessionNumber?: number;
  sessionDate?:   string;        // "26 May 2026"
  sessionTime?:   string;        // "14:00"
  plan?:          SessionPlan;
  onChangePlan?:  (p: SessionPlan) => void;
  contextLast?:   SessionContext;
  recommendations?: Intervention[];      // right mini library
  fullLibrary?:     Intervention[];      // "+ Müdahale ekle" sheet
  onBackToLibrary?:    () => void;
  onOpenFullLibrary?:  () => void;
  onSaveAsTemplate?:   () => void;
  onAssignToSession?:  (plan: SessionPlan) => void;
  onPreview?:          () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────

const DURATION_MIN: Record<Duration, number> = {
  'kisa': 8, 'orta': 18, 'uzun': 35, 'tam-seans': 50,
};

const MODALITY_TONE: Record<Modality, string> = {
  BDT: 'mavi', ACT: 'accent', EFT: 'mor', CFT: 'yesil', EMDR: 'risk',
  Şema: 'amber', Sistemik: 'lacivert', Diğer: 'ink',
};

function defaultMinutes(it: Intervention): number {
  return it.durationMinutes ?? DURATION_MIN[it.duration];
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_LIBRARY: Intervention[] = [
  { id: 'i-1',  title: 'Defüzyon · "Yapraklar dalda"',  modality: 'ACT', problems: ['rumination', 'sosyal kaygı'], ageGroups: ['yetiskin','ergen'], format: 'seans-ici', duration: 'orta',  evidence: 'rkc',                description: 'Düşünceleri akıntıda yaprak gibi izleme — defüzyon pratiği.' },
  { id: 'i-2',  title: 'Değerler Pusulası',             modality: 'ACT', problems: ['mükemmeliyetçilik','değer'],   ageGroups: ['yetiskin'],         format: 'calisma-kagidi', duration: 'orta', evidence: 'rkc',                description: '10 yaşam alanında değer-eylem boşluğu haritası.', homeworkVariant: 'Haftalık 1 değerli eylem seçimi + günlük tutma' },
  { id: 'i-3',  title: 'Şimdiki an demirleme',          modality: 'ACT', problems: ['kaçınma','panik'],             ageGroups: ['yetiskin','ergen'], format: 'seans-ici', duration: 'kisa',  evidence: 'sistematik-review',  description: '5-4-3-2-1 duyusal demirleme.' },
  { id: 'i-4',  title: 'Maruziyet hiyerarşisi',         modality: 'BDT', problems: ['sosyal kaygı','panik'],        ageGroups: ['yetiskin','ergen'], format: 'seans-ici', duration: 'uzun',  evidence: 'rkc',                description: 'SUDS skorlu kademeli maruz bırakma.', homeworkVariant: 'En düşük SUDS\'lu durumu hafta içinde 3 kez tekrar et' },
  { id: 'i-6',  title: 'Düşünce kaydı',                  modality: 'BDT', problems: ['depresyon','YAB'],             ageGroups: ['yetiskin','ergen','cocuk-7-11'], format: 'ev-odevi', duration: 'orta', evidence: 'rkc',           description: 'A-B-C kayıt + alternatif düşünce.', homeworkVariant: '7 gün × 2 kayıt' },
  { id: 'i-7',  title: 'Davranışsal aktivasyon',         modality: 'BDT', problems: ['depresyon'],                   ageGroups: ['yetiskin','ergen'], format: 'ev-odevi',  duration: 'uzun',  evidence: 'rkc',                description: 'Haz/ustalık çizelgeleri ile aktivite çoğaltma.', homeworkVariant: '7 günlük çizelge' },
  { id: 'i-9',  title: 'Şefkatli imgelem',              modality: 'CFT', problems: ['öz-eleştiri','travma'],        ageGroups: ['yetiskin','ergen'], format: 'seans-ici', duration: 'orta',  evidence: 'sistematik-review',  description: 'Sakinlik sistemini etkinleştiren imgeleme.' },
  { id: 'i-15', title: 'Güvenli yer imgelemi',          modality: 'EMDR',problems: ['travma'],                       ageGroups: ['yetiskin','ergen'], format: 'seans-ici', duration: 'orta',  evidence: 'klinik-kilavuz',     description: 'EMDR ön-stabilizasyon — kaynak geliştirme.' },
  { id: 'i-24', title: 'Nefes farkındalığı · 8 dk',     modality: 'ACT', problems: ['kaygı','rumination'],          ageGroups: ['yetiskin','ergen'], format: 'ev-odevi',  duration: 'kisa',  evidence: 'sistematik-review',  description: 'Kısa rehberli nefes pratiği.', homeworkVariant: 'Günlük 8 dk · 7 gün' },
  { id: 'i-26', title: 'Davranış deneyi',                modality: 'BDT', problems: ['sosyal kaygı','panik'],        ageGroups: ['yetiskin','ergen'], format: 'ev-odevi',  duration: 'orta',  evidence: 'rkc',                description: 'İnanca yönelik test deneyi; öncesi-sonrası tahmin.' },
];

const DEFAULT_CLIENT = {
  id: '142', name: 'Elif Yıldız', age: 28,
  issue: 'Sosyal kaygı — sunum ve toplantılarda donma',
};

const DEFAULT_CONTEXT: SessionContext = {
  summary:
    'Geçen seans defüzyon egzersizi (yapraklar) iyi karşılandı. SUDS 7 → 4. ' +
    'Yaratıcılık değeri ile maruziyet eylemi bağı netleşti. Bağlam-benlik ' +
    'hâlâ zayıf — bu seansta "gözlemleyen ben" odaklı çalışma önerildi.',
  homework: [
    { label: 'Haftalık sergi açılışına gitmek',          done: true  },
    { label: 'Sunum öncesi 5 dk defüzyon egzersizi',      done: true  },
    { label: 'Kamerayı açık tutarak 1 toplantı',         done: false },
  ],
  focusPoints: [
    'Bağlam-benlik (ACT)',
    'Defüzyon kazanımının sabitlenmesi',
    'Değer-eylem köprüsü',
  ],
  avoid: [
    'Yeni maruziyet ekleme — önce mevcut homework tamamlansın',
  ],
  recommendedModalities: ['ACT', 'BDT'],
};

const DEFAULT_PLAN: SessionPlan = {
  clientId: '142',
  sessionLength: 50,
  items: [
    { interventionId: 'op-default-1', block: 'opening', order: 0, durationMinutes: 8,
      sessionNotes: 'Geçen seansın özeti + gündem belirleme' },
    { interventionId: 'i-3',          block: 'main',    order: 0, durationMinutes: 8 },
    { interventionId: 'i-1',          block: 'main',    order: 1, durationMinutes: 22,
      sessionNotes: 'Yaprak metaforu ile başla; 2-3 düşünce ile pratik et.' },
    { interventionId: 'cl-default-1', block: 'closing', order: 0, durationMinutes: 7,
      sessionNotes: 'Ödev belirleme + sonraki seans randevu' },
  ],
  homework:  'Günde 1 kez (sabah) 8 dk nefes farkındalığı. Toplantı önceleri defüzyon kısa formunu uygula.',
  nextFocus: 'Bağlam-benlik · "gözlemleyen ben" egzersizine geçiş.',
};

// Built-in non-library "items" representing the default opening/closing fillers.
// They have synthetic IDs so they can sit inside `items` without colliding
// with real library entries.
const PLACEHOLDER_ITEMS: Record<string, Intervention> = {
  'op-default-1': {
    id: 'op-default-1', title: 'İlişki kurma + gündem',
    modality: 'Diğer', problems: ['açılış'], ageGroups: ['yetiskin'],
    format: 'seans-ici', duration: 'kisa', evidence: 'klinik-kilavuz',
    description: 'Açılış · ruh hâli kontrolü, gündem belirleme.',
  },
  'cl-default-1': {
    id: 'cl-default-1', title: 'Ödev + sonraki seans randevu',
    modality: 'Diğer', problems: ['kapanış'], ageGroups: ['yetiskin'],
    format: 'seans-ici', duration: 'kisa', evidence: 'klinik-kilavuz',
    description: 'Kapanış · ödev belirleme + sonraki seans.',
  },
};

const BLOCK_META: Record<SessionBlock, { label: string; eyebrow: string; range: string }> = {
  opening: { label: 'Açılış',      eyebrow: 'ilk 5-10 dk',      range: '5-10 dk' },
  main:    { label: 'Ana içerik',  eyebrow: 'odak çalışması',    range: '30-40 dk' },
  closing: { label: 'Kapanış',     eyebrow: 'son 5-10 dk',       range: '5-10 dk' },
};

const SESSION_LENGTHS: SessionLength[] = [45, 50, 60, 90];

// ─── Component ────────────────────────────────────────────────────────────

export default function SeansPlanlayiciPanel({
  client          = DEFAULT_CLIENT,
  sessionNumber   = 7,
  sessionDate     = '26 May 2026',
  sessionTime     = '14:00',
  plan: planProp,
  onChangePlan,
  contextLast     = DEFAULT_CONTEXT,
  recommendations,
  fullLibrary     = DEFAULT_LIBRARY,
  onBackToLibrary,
  onOpenFullLibrary,
  onSaveAsTemplate,
  onAssignToSession,
  onPreview,
}: SeansPlanlayiciPanelProps) {
  const [planState, setPlanState] = useState<SessionPlan>(planProp ?? DEFAULT_PLAN);
  const [librarySheet, setLibrarySheet] = useState<{ block: SessionBlock } | null>(null);
  const [miniQuery, setMiniQuery] = useState('');
  const [rightOpen, setRightOpen] = useState(true);
  const [dragInterId, setDragInterId] = useState<string | null>(null);
  const [hotBlock,  setHotBlock]      = useState<SessionBlock | null>(null);

  useEffect(() => { if (planProp) setPlanState(planProp); }, [planProp]);

  const plan = planState;

  const update = useCallback((next: SessionPlan) => {
    setPlanState(next);
    onChangePlan?.(next);
  }, [onChangePlan]);

  // Library lookup (real + placeholder fillers)
  const lookup = useCallback((id: string): Intervention | null => {
    return fullLibrary.find((i) => i.id === id) ?? PLACEHOLDER_ITEMS[id] ?? null;
  }, [fullLibrary]);

  // Default recommendations — context-aware fallback
  const recs = useMemo(() => {
    if (recommendations && recommendations.length > 0) return recommendations;
    const focusKeywords = [
      ...contextLast.focusPoints.map((p) => p.toLowerCase()),
      ...contextLast.recommendedModalities ?? [],
    ].join(' ').toLowerCase();
    return fullLibrary
      .filter((i) =>
        focusKeywords.includes(i.modality.toLowerCase()) ||
        i.problems.some((p) => focusKeywords.includes(p.toLowerCase()))
      )
      .slice(0, 8);
  }, [recommendations, contextLast, fullLibrary]);

  const filteredRecs = useMemo(() => {
    const q = miniQuery.trim().toLowerCase();
    if (!q) return recs;
    return recs.filter((i) =>
      (i.title + ' ' + i.modality + ' ' + i.problems.join(' ')).toLowerCase().includes(q)
    );
  }, [recs, miniQuery]);

  // Block helpers
  const itemsByBlock = useMemo(() => {
    const out: Record<SessionBlock, PlannedItem[]> = { opening: [], main: [], closing: [] };
    for (const it of plan.items) out[it.block].push(it);
    out.opening.sort((a, b) => a.order - b.order);
    out.main.sort((a, b) => a.order - b.order);
    out.closing.sort((a, b) => a.order - b.order);
    return out;
  }, [plan.items]);

  const totalMin = plan.items.reduce((a, b) => a + b.durationMinutes, 0);
  const blockMin = (b: SessionBlock) => itemsByBlock[b].reduce((a, x) => a + x.durationMinutes, 0);
  const overrun  = totalMin > plan.sessionLength;

  // Item operations
  const addItem = (interventionId: string, block: SessionBlock) => {
    const it = lookup(interventionId);
    if (!it) return;
    const dur = defaultMinutes(it);
    const order = itemsByBlock[block].length;
    update({
      ...plan,
      items: [...plan.items, { interventionId, block, order, durationMinutes: dur }],
    });
  };

  const removeItem = (idx: number) => {
    const next = [...plan.items];
    next.splice(idx, 1);
    update({ ...plan, items: reindex(next) });
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const next = [...plan.items];
    const it = next[idx];
    const peer = next
      .map((x, i) => ({ x, i }))
      .filter(({ x }) => x.block === it.block)
      .sort((a, b) => a.x.order - b.x.order);
    const cur = peer.findIndex(({ i }) => i === idx);
    const tgt = cur + dir;
    if (tgt < 0 || tgt >= peer.length) return;
    [peer[cur].x.order, peer[tgt].x.order] = [peer[tgt].x.order, peer[cur].x.order];
    update({ ...plan, items: next });
  };

  const updateItem = (idx: number, patch: Partial<PlannedItem>) => {
    const next = [...plan.items];
    next[idx] = { ...next[idx], ...patch };
    update({ ...plan, items: next });
  };

  // Auto-suggest homework based on homework-format items in the plan
  const suggestedHomework = useMemo(() => {
    const parts: string[] = [];
    for (const item of plan.items) {
      const it = lookup(item.interventionId);
      if (!it) continue;
      if (it.format === 'ev-odevi' || it.format === 'calisma-kagidi') {
        parts.push(`${it.title}: ${it.homeworkVariant ?? 'Haftalık tekrar'}.`);
      }
    }
    return parts.join('\n');
  }, [plan.items, lookup]);

  const applySuggestedHomework = () => {
    if (!suggestedHomework) return;
    update({ ...plan, homework: suggestedHomework });
  };

  const resetPlan = () => {
    if (!confirm('Tüm plan sıfırlanacak. Onaylıyor musunuz?')) return;
    update({ ...DEFAULT_PLAN, clientId: plan.clientId, sessionLength: plan.sessionLength });
  };

  // HTML5 drag-and-drop
  const onDragStartCard = (e: React.DragEvent, interventionId: string) => {
    e.dataTransfer.setData('text/intervention', interventionId);
    e.dataTransfer.effectAllowed = 'copy';
    setDragInterId(interventionId);
  };
  const onDragOverBlock = (e: React.DragEvent, block: SessionBlock) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setHotBlock(block);
  };
  const onDropBlock = (e: React.DragEvent, block: SessionBlock) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/intervention');
    if (id) addItem(id, block);
    setDragInterId(null);
    setHotBlock(null);
  };
  const onDragEnd = () => { setDragInterId(null); setHotBlock(null); };

  return (
    <div className="sp" data-screen-label="10 Seans Planlayıcı" data-overrun={overrun ? 'true' : 'false'}>
      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <header className="sp-top">
        <div className="sp-top-left">
          <button type="button" className="sp-icon-btn" aria-label="Kütüphaneye dön" onClick={onBackToLibrary}>
            <ArrowLeft size={14} strokeWidth={1.8} />
          </button>
          <div className="sp-top-title">
            <span className="sp-eyebrow">seans · {sessionDate.toUpperCase()} · {sessionTime}</span>
            <h1>
              {client.name.split(' ').slice(0, -1).join(' ')}{' '}
              <em>{client.name.split(' ').slice(-1)[0]}</em>{' '}
              · {sessionNumber}. seans
            </h1>
            {client.issue && <p className="sp-top-issue">{client.issue}</p>}
          </div>
        </div>

        <nav className="sp-length" role="radiogroup" aria-label="Seans uzunluğu">
          {SESSION_LENGTHS.map((n) => (
            <button
              key={n} type="button" role="radio"
              aria-checked={plan.sessionLength === n}
              className={`sp-length-btn ${plan.sessionLength === n ? 'on' : ''}`}
              onClick={() => update({ ...plan, sessionLength: n })}
            >
              {n}<em>dk</em>
            </button>
          ))}
        </nav>

        <div className="sp-top-right">
          <button type="button" className="sp-btn sp-btn-ghost" onClick={onSaveAsTemplate}>
            <Save size={13} strokeWidth={1.8} /> Şablon olarak kaydet
          </button>
          <button type="button" className="sp-btn sp-btn-primary" onClick={() => onAssignToSession?.(plan)}>
            <Sparkles size={13} strokeWidth={1.8} /> Seansa ata
            <ArrowRight size={13} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────── */}
      <div className="sp-body">
        {/* LEFT — context */}
        <aside className="sp-context">
          <ContextCard title="Son seans özeti" eyebrow={`vaka #${client.id}`}>
            <p>{contextLast.summary}</p>
          </ContextCard>

          <ContextCard title="Verilen ödevler" eyebrow="hatırlat">
            <ul className="sp-hw-list">
              {contextLast.homework.map((h, i) => (
                <li key={i} className={h.done ? 'done' : ''}>
                  <span className={`sp-check ${h.done ? 'on' : ''}`}>
                    {h.done && <CheckCircle2 size={11} strokeWidth={2} />}
                  </span>
                  <span>{h.label}</span>
                </li>
              ))}
            </ul>
          </ContextCard>

          <ContextCard title="Aktif formülasyon odakları" eyebrow="seans hedefi" tone="accent">
            <ul className="sp-focus-list">
              {contextLast.focusPoints.map((p, i) => (
                <li key={i}><span className="sp-focus-dot" />{p}</li>
              ))}
            </ul>
            {contextLast.recommendedModalities && contextLast.recommendedModalities.length > 0 && (
              <div className="sp-modality-chips">
                {contextLast.recommendedModalities.map((m) => (
                  <span key={m} className={`sp-pill m-${MODALITY_TONE[m]}`}>{m}</span>
                ))}
              </div>
            )}
          </ContextCard>

          {contextLast.avoid && contextLast.avoid.length > 0 && (
            <ContextCard title="Bu seansta yapma" eyebrow="kontrendikasyon" tone="warn">
              <ul className="sp-avoid">
                {contextLast.avoid.map((a, i) => (
                  <li key={i}><AlertTriangle size={11} strokeWidth={2} />{a}</li>
                ))}
              </ul>
            </ContextCard>
          )}
        </aside>

        {/* CENTER — timeline */}
        <main className="sp-timeline">
          <div className="sp-progress">
            <div className="sp-progress-bar">
              <span style={{ width: `${Math.min(100, (totalMin / plan.sessionLength) * 100)}%` }} className={overrun ? 'over' : ''} />
            </div>
            <span className={`sp-progress-text ${overrun ? 'over' : ''}`}>
              {totalMin}<em>/{plan.sessionLength} dk planlandı</em>
            </span>
          </div>

          {(['opening', 'main', 'closing'] as SessionBlock[]).map((b) => (
            <BlockColumn
              key={b}
              block={b}
              items={itemsByBlock[b]}
              minutes={blockMin(b)}
              lookup={lookup}
              isHot={hotBlock === b}
              onDragOver={(e) => onDragOverBlock(e, b)}
              onDrop={(e) => onDropBlock(e, b)}
              onDragLeave={() => setHotBlock(null)}
              onAddClick={() => setLibrarySheet({ block: b })}
              onRemoveItem={(idx) => removeItem(idx)}
              onMoveItem={(idx, dir) => moveItem(idx, dir)}
              onUpdateNotes={(idx, n) => updateItem(idx, { sessionNotes: n })}
              onUpdateDuration={(idx, n) => updateItem(idx, { durationMinutes: n })}
              indexBase={plan.items.findIndex((x) => x === itemsByBlock[b][0])}
              fullItems={plan.items}
            />
          ))}

          {/* Closing block extras: homework + next focus */}
          <section className="sp-closing-extra">
            <header>
              <span className="sp-eyebrow">kapanış · çıktılar</span>
            </header>
            <div className="sp-field">
              <label>
                <span className="sp-field-label">Bu seansın ödevi</span>
                {suggestedHomework && (
                  <button type="button" className="sp-text-btn" onClick={applySuggestedHomework}>
                    <Sparkles size={11} strokeWidth={1.8} /> Önerilenleri uygula
                  </button>
                )}
              </label>
              <textarea
                className="sp-textarea italic"
                rows={3}
                placeholder="Eklenen müdahalelerden otomatik öneri için sağ üstten 'Önerilenleri uygula' butonunu kullanın."
                value={plan.homework ?? ''}
                onChange={(e) => update({ ...plan, homework: e.target.value })}
              />
            </div>
            <div className="sp-field">
              <label><span className="sp-field-label">Sonraki seans odağı</span></label>
              <input
                type="text" className="sp-input"
                placeholder="Bir cümle — sonraki seansın odak teması"
                value={plan.nextFocus ?? ''}
                onChange={(e) => update({ ...plan, nextFocus: e.target.value })}
              />
            </div>
          </section>
        </main>

        {/* RIGHT — mini library */}
        <aside className={`sp-mini ${rightOpen ? '' : 'col'}`}>
          <button
            type="button" className="sp-mini-collapse"
            onClick={() => setRightOpen((v) => !v)}
            aria-label={rightOpen ? 'Kütüphaneyi kapat' : 'Kütüphaneyi aç'}
            aria-expanded={rightOpen}
          >
            {rightOpen ? <ChevronRight size={14} strokeWidth={1.8} /> : <ChevronLeft size={14} strokeWidth={1.8} />}
          </button>

          {rightOpen ? (
            <div className="sp-mini-body">
              <div className="sp-mini-head">
                <div>
                  <span className="sp-eyebrow">müdahale kütüphanesi</span>
                  <h3>Bu seansa <em>uygun</em> öneriler</h3>
                </div>
                <button type="button" className="sp-text-btn" onClick={onOpenFullLibrary}>
                  <Library size={11} strokeWidth={1.8} /> Geniş kütüphane
                </button>
              </div>
              <div className="sp-mini-search">
                <Search size={13} strokeWidth={1.8} />
                <input
                  type="text" value={miniQuery}
                  placeholder="Mini arama…"
                  onChange={(e) => setMiniQuery(e.target.value)}
                />
                {miniQuery && (
                  <button type="button" className="sp-mini-clear" onClick={() => setMiniQuery('')}>
                    <X size={11} strokeWidth={2} />
                  </button>
                )}
              </div>
              <ul className="sp-mini-list">
                {filteredRecs.length === 0 && (
                  <li className="sp-mini-empty">Bu aramayla eşleşen öneri yok.</li>
                )}
                {filteredRecs.map((it) => (
                  <li key={it.id}>
                    <MiniLibraryCard
                      it={it}
                      onDragStart={(e) => onDragStartCard(e, it.id)}
                      onDragEnd={onDragEnd}
                      onQuickAdd={(block) => addItem(it.id, block)}
                    />
                  </li>
                ))}
              </ul>
              <p className="sp-mini-tip">
                <strong>Tip.</strong> Bir kartı tutup zaman çizgisindeki bloka sürükle.
                Ya da kart üzerindeki bloka tıkla.
              </p>
            </div>
          ) : (
            <span className="sp-rail-label">Kütüphane</span>
          )}
        </aside>
      </div>

      {/* ── BOTTOM BAR ──────────────────────────────────────────── */}
      <footer className="sp-bottom">
        <button type="button" className="sp-btn sp-btn-ghost" onClick={resetPlan}>
          <RotateCcw size={13} strokeWidth={1.8} /> Sıfırla
        </button>
        <div className={`sp-bottom-mid ${overrun ? 'over' : ''}`}>
          {overrun && <AlertTriangle size={13} strokeWidth={2} />}
          <strong>{totalMin}</strong>
          <span>/ {plan.sessionLength} dk</span>
          {overrun && <em>· {totalMin - plan.sessionLength} dk taşma</em>}
        </div>
        <div className="sp-bottom-right">
          <button type="button" className="sp-btn sp-btn-ghost" onClick={onPreview}>
            <Eye size={13} strokeWidth={1.8} /> Önizle
          </button>
          <button type="button" className="sp-btn sp-btn-primary" onClick={() => onAssignToSession?.(plan)}>
            Seansa ata
            <ArrowRight size={13} strokeWidth={1.8} />
          </button>
        </div>
      </footer>

      {/* ── LIBRARY SHEET (full search to pick into a specific block) ─── */}
      {librarySheet && (
        <LibrarySheet
          block={librarySheet.block}
          library={fullLibrary}
          onClose={() => setLibrarySheet(null)}
          onPick={(id) => {
            addItem(id, librarySheet.block);
            setLibrarySheet(null);
          }}
          onOpenFull={onOpenFullLibrary}
        />
      )}
    </div>
  );
}

// ─── Sub: BlockColumn ────────────────────────────────────────────────────

function BlockColumn({
  block, items, minutes, lookup, isHot,
  onDragOver, onDrop, onDragLeave,
  onAddClick, onRemoveItem, onMoveItem, onUpdateNotes, onUpdateDuration,
  indexBase, fullItems,
}: {
  block: SessionBlock;
  items: PlannedItem[];
  minutes: number;
  lookup: (id: string) => Intervention | null;
  isHot: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop:     (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onAddClick: () => void;
  onRemoveItem: (idx: number) => void;
  onMoveItem:   (idx: number, dir: -1 | 1) => void;
  onUpdateNotes: (idx: number, n: string) => void;
  onUpdateDuration: (idx: number, n: number) => void;
  indexBase: number;
  fullItems: PlannedItem[];
}) {
  const meta = BLOCK_META[block];
  return (
    <section
      className={`sp-block sp-block-${block} ${isHot ? 'hot' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
    >
      <header className="sp-block-head">
        <div>
          <span className="sp-eyebrow">{meta.eyebrow}</span>
          <h2>{meta.label}</h2>
        </div>
        <div className="sp-block-meta">
          <span className="sp-block-range">{meta.range}</span>
          <strong className="sp-block-min">{minutes}<em>dk</em></strong>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="sp-block-empty">
          <p>
            {block === 'main'
              ? <>Kütüphaneden müdahale <strong>sürükle</strong> ya da aşağıdaki butona tıkla.</>
              : block === 'opening'
                ? 'Açılış adımı seç.'
                : 'Kapanış adımı seç.'}
          </p>
        </div>
      ) : (
        <ol className="sp-items">
          {items.map((it) => {
            const inter = lookup(it.interventionId);
            const idx = fullItems.indexOf(it);
            if (!inter) return null;
            return (
              <PlanItemCard
                key={`${it.block}-${it.order}-${it.interventionId}`}
                inter={inter}
                item={it}
                isFirst={items.indexOf(it) === 0}
                isLast={items.indexOf(it) === items.length - 1}
                onRemove={() => onRemoveItem(idx)}
                onMoveUp={() => onMoveItem(idx, -1)}
                onMoveDown={() => onMoveItem(idx, 1)}
                onUpdateNotes={(n) => onUpdateNotes(idx, n)}
                onUpdateDuration={(n) => onUpdateDuration(idx, n)}
              />
            );
          })}
        </ol>
      )}

      <button type="button" className="sp-block-add" onClick={onAddClick}>
        <Plus size={13} strokeWidth={2} /> Müdahale ekle
      </button>
    </section>
  );
}

// ─── Sub: PlanItemCard ───────────────────────────────────────────────────

function PlanItemCard({
  inter, item, isFirst, isLast,
  onRemove, onMoveUp, onMoveDown, onUpdateNotes, onUpdateDuration,
}: {
  inter: Intervention;
  item: PlannedItem;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdateNotes: (n: string) => void;
  onUpdateDuration: (n: number) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notes, setNotes]   = useState(item.sessionNotes ?? '');
  useEffect(() => setNotes(item.sessionNotes ?? ''), [item.sessionNotes]);
  const isPlaceholder = inter.id.startsWith('op-default-') || inter.id.startsWith('cl-default-');

  return (
    <li className={`sp-item ${isPlaceholder ? 'placeholder' : ''}`}>
      <div className="sp-item-head">
        <span className="sp-item-grip" aria-hidden="true"><GripVertical size={12} strokeWidth={1.6} /></span>
        <div className="sp-item-title-row">
          <span className={`sp-pill m-${MODALITY_TONE[inter.modality]}`}>{inter.modality}</span>
          <strong>{inter.title}</strong>
        </div>

        <div className="sp-item-duration">
          <input
            type="number"
            className="sp-item-dur-input"
            min={1} max={120}
            value={item.durationMinutes}
            onChange={(e) => onUpdateDuration(Math.max(1, Math.min(120, Number(e.target.value))))}
            aria-label="Süre (dakika)"
          />
          <em>dk</em>
        </div>

        <div className="sp-item-actions">
          <button type="button" className="sp-icon-btn xs" aria-label="Yukarı" disabled={isFirst} onClick={onMoveUp}>
            <ArrowUp size={11} strokeWidth={2} />
          </button>
          <button type="button" className="sp-icon-btn xs" aria-label="Aşağı" disabled={isLast} onClick={onMoveDown}>
            <ArrowDown size={11} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`sp-icon-btn xs ${menuOpen ? 'active' : ''}`}
            aria-label="Daha fazla"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal size={11} strokeWidth={2} />
          </button>
          {menuOpen && (
            <div className="sp-item-menu" role="menu" onMouseLeave={() => setMenuOpen(false)}>
              <button type="button" role="menuitem" onClick={() => { setOpen(true); setMenuOpen(false); }}>
                <FileText size={11} strokeWidth={1.8} /> Not ekle / düzenle
              </button>
              <button type="button" role="menuitem" className="danger" onClick={() => { onRemove(); setMenuOpen(false); }}>
                <Trash2 size={11} strokeWidth={1.8} /> Sil
              </button>
            </div>
          )}
        </div>
      </div>

      {(open || item.sessionNotes) && (
        <div className="sp-item-notes">
          {!open && item.sessionNotes ? (
            <p onClick={() => setOpen(true)}>"{item.sessionNotes}"</p>
          ) : (
            <textarea
              className="sp-textarea italic"
              rows={2}
              value={notes}
              placeholder='"Yaprak metaforu ile başla; 2-3 düşünce ile pratik et."'
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => { onUpdateNotes(notes); setOpen(false); }}
              autoFocus={open}
            />
          )}
        </div>
      )}

      {!item.sessionNotes && !open && !isPlaceholder && (
        <button type="button" className="sp-item-addnote" onClick={() => setOpen(true)}>
          <Plus size={10} strokeWidth={2} /> Not ekle
        </button>
      )}
    </li>
  );
}

// ─── Sub: MiniLibraryCard ────────────────────────────────────────────────

function MiniLibraryCard({
  it, onDragStart, onDragEnd, onQuickAdd,
}: {
  it: Intervention;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onQuickAdd: (block: SessionBlock) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <article
      className="sp-mini-card"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="sp-mini-card-head">
        <span className={`sp-pill m-${MODALITY_TONE[it.modality]}`}>{it.modality}</span>
        <span className="sp-mini-card-dur">
          <Clock size={10} strokeWidth={1.8} />
          {defaultMinutes(it)} dk
        </span>
      </div>
      <strong>{it.title}</strong>
      <p>{it.description}</p>
      <div className="sp-mini-card-foot">
        <span className="sp-mini-grip" aria-hidden="true"><GripVertical size={10} strokeWidth={1.6} /></span>
        <button
          type="button"
          className={`sp-mini-quick ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
        >
          + Ekle
        </button>
        {menuOpen && (
          <div className="sp-mini-quick-menu" role="menu">
            {(['opening', 'main', 'closing'] as SessionBlock[]).map((b) => (
              <button
                key={b} type="button" role="menuitem"
                onClick={() => { onQuickAdd(b); setMenuOpen(false); }}
              >
                {BLOCK_META[b].label}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Sub: LibrarySheet (full search to a specific block) ─────────────────

function LibrarySheet({
  block, library, onClose, onPick, onOpenFull,
}: {
  block: SessionBlock;
  library: Intervention[];
  onClose: () => void;
  onPick: (id: string) => void;
  onOpenFull?: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return library;
    return library.filter((i) =>
      (i.title + ' ' + i.modality + ' ' + i.problems.join(' ')).toLowerCase().includes(q)
    );
  }, [library, query]);

  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onClose]);

  return (
    <div className="sp-overlay" role="dialog" aria-modal="true">
      <button type="button" className="sp-overlay-scrim" aria-label="Kapat" onClick={onClose} />
      <aside className="sp-sheet">
        <header className="sp-sheet-head">
          <div>
            <span className="sp-eyebrow">{BLOCK_META[block].label} bloku · ekle</span>
            <h2>Müdahale <em>seç</em></h2>
          </div>
          <button type="button" className="sp-icon-btn" aria-label="Kapat" onClick={onClose}>
            <X size={14} strokeWidth={1.8} />
          </button>
        </header>
        <div className="sp-mini-search">
          <Search size={13} strokeWidth={1.8} />
          <input
            type="text" value={query}
            placeholder="Tüm kütüphanede ara…"
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <ul className="sp-sheet-list">
          {filtered.map((it) => (
            <li key={it.id}>
              <button type="button" className="sp-sheet-row" onClick={() => onPick(it.id)}>
                <div>
                  <div className="sp-sheet-row-top">
                    <span className={`sp-pill m-${MODALITY_TONE[it.modality]}`}>{it.modality}</span>
                    <strong>{it.title}</strong>
                  </div>
                  <p>{it.description}</p>
                </div>
                <span className="sp-sheet-row-dur">
                  <Clock size={10} strokeWidth={1.8} />
                  {defaultMinutes(it)} dk
                </span>
              </button>
            </li>
          ))}
        </ul>
        <footer className="sp-sheet-foot">
          <button type="button" className="sp-btn sp-btn-ghost sp-btn-block" onClick={onOpenFull}>
            <Library size={13} strokeWidth={1.8} /> Geniş kütüphaneyi aç
            <ArrowRight size={13} strokeWidth={1.8} style={{ marginLeft: 'auto' }} />
          </button>
        </footer>
      </aside>
    </div>
  );
}

// ─── Sub: ContextCard ────────────────────────────────────────────────────

function ContextCard({
  title, eyebrow, tone, children,
}: { title: string; eyebrow?: string; tone?: 'accent' | 'warn'; children: ReactNode }) {
  return (
    <section className={`sp-ctx-card t-${tone ?? 'ink'}`}>
      <header>
        {eyebrow && <span className="sp-eyebrow">{eyebrow}</span>}
        <h3>{title}</h3>
      </header>
      {children}
    </section>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function reindex(items: PlannedItem[]): PlannedItem[] {
  const byBlock: Record<SessionBlock, PlannedItem[]> = { opening: [], main: [], closing: [] };
  for (const it of items) byBlock[it.block].push(it);
  for (const b of ['opening', 'main', 'closing'] as SessionBlock[]) {
    byBlock[b].sort((a, b) => a.order - b.order).forEach((x, i) => { x.order = i; });
  }
  return [...byBlock.opening, ...byBlock.main, ...byBlock.closing];
}
