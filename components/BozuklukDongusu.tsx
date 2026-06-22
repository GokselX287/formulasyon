'use client';

// ══════════════════════════════════════════════════════════════════════════
// BozuklukDongusu — Sorun Döngüsü / formülasyon diyagramları.
// 23 modelin tamamı TEK tutarlı motorla (lib/bdxEngine) çizilir; kutu/ok dili,
// monokrom palet, plastik gölge her diyagramda aynıdır. Düğümlerdeki
// düzenlenebilir alanlar fieldKey ile kalıcılaştırılır.
//
// • DiagramViewer({type, fields?, onChange?}) — kontrollü (ebeveyn kalıcılığı)
//   ya da kontrolsüz (kendi state). SorunDonguEkle + PratikYap bunu kullanır.
// • Varsayılan export — standalone kütüphane/galeri (modelleri aç/kapat).
//
// Kaynak handoff: ~/Downloads/design_handoff_bozukluk_dongusu (bdx-engine + bdx-defs)
// ══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BDX_DEFS, DIAGRAMS, type DiagramType } from '@/lib/bdxDefs';
import { renderBdx } from '@/lib/bdxEngine';
import './BozuklukDongusu.css';

export { DIAGRAMS };
export type { DiagramType };

type FieldsState = Record<string, string>;
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// ── Motor sarıcısı ─────────────────────────────────────────────────────────
// def değişince (tip değişimi) tüm SVG yeniden çizilir. onChange/fields ref'te
// tutulur → her tuş vuruşunda yeniden render yok (textarea odağı korunur).
// fields prop'u dışarıdan değişince (asenkron yükleme / döngü değişimi) mevcut
// textarea değerleri yerinde senkronlanır.
// Odaklanılan düğüm için "öne çıkan" düzenleme kartı. SVG foreignObject sabit
// boyutlu → uzun metin kırpılır; bir düğümün textarea'sı odaklanınca büyük,
// serbest büyüyen bir kart düğümün üzerinden ölçeklenerek belirir (kırpma yok,
// yazı büyük). Tüm yazım bu kartta olur; değer alttaki SVG textarea'ya + onChange'e
// yazılır. Tüm sayfayı değil yalnız o alanı öne çıkarır (kullanıcı isteği).
type FocusState = { key: string; cx: number; cy: number; w: number; label: string; desc: string; value: string };

// Bir metni öneri-ifadelerine böl (satır bazlı; çok kısa olanları ele).
function splitPhrases(v: string): string[] {
  return v.split('\n').map((s) => s.trim()).filter((s) => s.length >= 3);
}
// İmlecin bulunduğu satırın metni + sınırları (öneri filtresi + ekleme için).
function activeLine(el: HTMLTextAreaElement) {
  const pos = el.selectionStart ?? el.value.length;
  const start = el.value.lastIndexOf('\n', pos - 1) + 1;
  const e = el.value.indexOf('\n', pos);
  const end = e === -1 ? el.value.length : e;
  return { text: el.value.slice(start, end), start, end };
}

function BdxDiagram({ def, fields, onChange, readOnly, suggest }: {
  def: typeof BDX_DEFS[string];
  fields: FieldsState;
  onChange?: (k: string, v: string) => void;
  readOnly?: boolean;
  suggest?: boolean;   // ortak öneri havuzu aktif mi (yalnız döngü editörü)
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [focus, setFocus] = useState<FocusState | null>(null);
  const overlayRef = useRef<HTMLTextAreaElement>(null);
  // öneri havuzu durumu
  const [pool, setPool] = useState<string[]>([]);      // bu alan için çekilen öneriler
  const [q, setQ] = useState<{ line: string; empty: boolean }>({ line: '', empty: true });

  // Kapanışta: girilen ifadeleri ortak havuza kaydet (danışan kimliği yok).
  const close = () => {
    if (suggest && focus) {
      const v = overlayRef.current?.value ?? focus.value;
      const lines = splitPhrases(v);
      if (lines.length) {
        fetch('/api/field-suggestions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: focus.key, values: lines }),
        }).catch(() => {});
      }
    }
    setFocus(null);
  };

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    renderBdx(
      host,
      def,
      (k) => fieldsRef.current[k] ?? '',
      readOnly ? () => {} : (k, v) => onChangeRef.current?.(k, v),
    );
  }, [def, readOnly]);

  // Düğüm textarea'sına odak/dokunuş → öne çıkan kartı aç (yalnız düzenleme modu).
  useEffect(() => {
    if (readOnly) return;
    const host = ref.current;
    if (!host) return;
    const open = (ta: HTMLTextAreaElement) => {
      const k = ta.getAttribute('data-fkey') || '';
      const r = ta.getBoundingClientRect();
      const cx = Math.min(Math.max(r.left + r.width / 2, 200), window.innerWidth - 200);
      const cy = Math.min(Math.max(r.top + r.height / 2, 150), window.innerHeight - 150);
      setFocus({ key: k, cx, cy, w: r.width, label: ta.getAttribute('data-label') || '', desc: ta.getAttribute('data-desc') || '', value: fieldsRef.current[k] ?? ta.value ?? '' });
    };
    const subs: Array<() => void> = [];
    host.querySelectorAll<HTMLTextAreaElement>('textarea[data-fkey]').forEach((ta) => {
      const h = () => open(ta);
      ta.addEventListener('focus', h);
      ta.addEventListener('pointerdown', h);
      subs.push(() => { ta.removeEventListener('focus', h); ta.removeEventListener('pointerdown', h); });
    });
    return () => subs.forEach((u) => u());
  }, [def, readOnly]);

  // Kart açılınca: textarea'ya odaklan, imleci sona al, yüksekliği içeriğe oturt,
  // öneri havuzunu çek. (Kapanma YALNIZ × ya da Esc ile.)
  useEffect(() => {
    if (!focus) { setPool([]); return; }
    const t = overlayRef.current;
    if (t) {
      t.focus();
      const v = t.value;
      t.setSelectionRange(v.length, v.length);
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + 'px';
    }
    setQ({ line: '', empty: !(focus.value || '').trim() });
    if (suggest && focus.key) {
      let alive = true;
      fetch(`/api/field-suggestions?key=${encodeURIComponent(focus.key)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => { if (alive) setPool(Array.isArray(d) ? d : []); })
        .catch(() => {});
      return () => { alive = false; };
    } else {
      setPool([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.key]);

  // dışarıdan gelen değer değişikliklerini mevcut textarea'lara yansıt
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.querySelectorAll<HTMLTextAreaElement>('textarea[data-fkey]').forEach((ta) => {
      const k = ta.getAttribute('data-fkey') as string;
      const v = fields[k] ?? '';
      if (ta.value !== v) {
        ta.value = v;
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
      }
    });
  }, [fields]);

  // Karttaki yazımı alttaki SVG textarea'ya + ebeveyn onChange'e yansıt.
  const syncDown = (k: string, v: string) => {
    const host = ref.current;
    const sel = (window as any).CSS?.escape ? CSS.escape(k) : k.replace(/"/g, '\\"');
    const ta = host?.querySelector<HTMLTextAreaElement>(`textarea[data-fkey="${sel}"]`);
    if (ta) { ta.value = v; ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
  };
  const pushValue = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    if (focus) { onChangeRef.current?.(focus.key, el.value); syncDown(focus.key, el.value); }
  };
  const onOverlayInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    pushValue(el);
    setQ({ line: activeLine(el).text.trim(), empty: !el.value.trim() });
  };
  // Öneri çipi → imlecin olduğu satırı bu ifadeyle değiştir.
  const applySuggestion = (s: string) => {
    const el = overlayRef.current;
    if (!el) return;
    const { start, end } = activeLine(el);
    const next = el.value.slice(0, start) + s + el.value.slice(end);
    el.value = next;
    const caret = start + s.length;
    el.focus();
    el.setSelectionRange(caret, caret);
    pushValue(el);
    setQ({ line: s.trim(), empty: false });
  };

  // Gösterilecek öneriler: 2+ harf yazıldıysa eşleşenler; alan boşsa en popülerler.
  const ql = q.line.toLowerCase();
  const matches = suggest
    ? (q.empty
        ? pool.slice(0, 5)
        : ql.length >= 2
          ? pool.filter((s) => { const sl = s.toLowerCase(); return sl.includes(ql) && sl !== ql; }).slice(0, 5)
          : [])
    : [];

  return (
    <div className="bdx-wrap">
      <div ref={ref} className="bdx" />
      {focus && typeof document !== 'undefined' && createPortal(
        <div className="bdx-focus-layer">
          <div className="bdx-focus" style={{ left: focus.cx, top: focus.cy }}>
            {/* siyah başlık — kavramın ne olduğunu açıklar */}
            <div className="bdx-focus-head">
              <div className="bdx-focus-head-row">
                {focus.label && <span className="bdx-focus-l">{focus.label}</span>}
                <button type="button" className="bdx-focus-x" aria-label="Kapat" onClick={close}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
              {focus.desc && <p className="bdx-focus-desc">{focus.desc}</p>}
            </div>
            {/* beyaz gövde — düzenleme */}
            <div className="bdx-focus-body">
              <textarea
                ref={overlayRef}
                className="bdx-focus-ta"
                defaultValue={focus.value}
                placeholder="Danışanın ifadelerini buraya yaz…"
                rows={2}
                onInput={onOverlayInput}
                onKeyUp={(e) => { const el = e.currentTarget; setQ({ line: activeLine(el).text.trim(), empty: !el.value.trim() }); }}
                onClick={(e) => { const el = e.currentTarget; setQ({ line: activeLine(el).text.trim(), empty: !el.value.trim() }); }}
                onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } }}
              />
              {matches.length > 0 && (
                <div className="bdx-sugg">
                  <span className="bdx-sugg-l">{q.empty ? 'Sık girilenler' : 'Öneriler'}</span>
                  <div className="bdx-sugg-row">
                    {matches.map((s, i) => (
                      <button key={i} type="button" className="bdx-sugg-chip" onClick={() => applySuggestion(s)} title={s}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              <span className="bdx-focus-hint">Esc ya da × ile kapat · otomatik kaydedilir</span>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ── Kontrollü / kontrolsüz görüntüleyici (dış API) ──────────────────────────
export function DiagramViewer({ type, fields: fieldsProp, onChange: onChangeProp, readOnly, suggest }: {
  type: DiagramType;
  fields?: FieldsState;
  onChange?: (k: string, v: string) => void;
  readOnly?: boolean;
  suggest?: boolean;
}) {
  const [localFields, setLocalFields] = useState<FieldsState>({});
  const fields = fieldsProp ?? localFields;
  const onChange = onChangeProp ?? ((k: string, v: string) => setLocalFields((prev) => ({ ...prev, [k]: v })));
  const def = BDX_DEFS[type];
  if (!def) return <p className="bdx-cite">Bu model için diyagram tanımı bulunamadı.</p>;
  return (
    <div className="w-full">
      <BdxDiagram def={def} fields={fields} onChange={onChange} readOnly={readOnly} suggest={suggest} />
    </div>
  );
}

// ── Standalone kütüphane / galeri ───────────────────────────────────────────
export default function BozuklukDongusu() {
  const [active, setActive] = useState<DiagramType | null>(null);
  const [fields, setFields] = useState<FieldsState>({});
  const [enabled, setEnabled] = useState<Set<DiagramType>>(new Set());

  const toggle = (id: DiagramType) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); if (active === id) setActive(null); }
      else { next.add(id); setActive(id); }
      return next;
    });
  };

  const onChange = (k: string, v: string) => setFields((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="text-base font-semibold text-[#0E0F12] mb-1">İleri Düzey Görselleştirilmiş Formülasyonlar</h2>
        <p className="text-xs text-gray-500 mb-3">Danışana özel grafiksel formülasyon şablonlarını aktif edin.</p>
        <div className="flex flex-wrap gap-2">
          {DIAGRAMS.map((d) => (
            <label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={enabled.has(d.id)}
                onChange={() => toggle(d.id)}
                className="rounded accent-gray-800"
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      {/* aktif diyagramlar için sekme düğmeleri */}
      {enabled.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from(enabled).map((id) => {
            const d = DIAGRAMS.find((x) => x.id === id)!;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cx(
                  'text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
                  active === id ? 'bg-[#0E0F12] text-white border-[#0E0F12]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400',
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      )}

      {/* aktif diyagram */}
      {active && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-[#0E0F12]">{DIAGRAMS.find((d) => d.id === active)?.label}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">BDT</span>
            <span className="text-[11px] text-gray-400">Alanları danışan bilgisiyle doldurun</span>
          </div>
          <DiagramViewer type={active} fields={fields} onChange={onChange} />
        </div>
      )}

      {enabled.size === 0 && (
        <div className="card p-6 text-center text-sm text-gray-500">
          Yukarıdan görselleştirme şablonlarını aktif edin.
        </div>
      )}
    </div>
  );
}
