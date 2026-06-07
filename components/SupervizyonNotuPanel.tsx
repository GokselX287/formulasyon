'use client';

import { useState } from 'react';
import {
  ArrowLeft, Edit3, Save, FileDown, Printer, AlertOctagon,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────
// Types — Süpervizyon notu = kâğıt mektup metaforu + marginalia
//   Profile değil, briefing değil, modal değil, dashboard değil.
// ──────────────────────────────────────────────────────────────────────────

export type NoteSegment = {
  kind: 'concern' | 'case' | 'supervisor' | 'learning';
  text: string;
  marginNote?: string;                  // sağ kenarda süpervizör annotation
};

export type SupervizyonNotuData = {
  noteNo: string;                        // "04"
  date: string;                          // "2026.05.14"
  caseCode: string;                      // "Vaka #142"
  topic: string;                         // "Karşı-aktarım örüntüsü"
  supervisorName: string;                // "Dr. Yasemin Kaya"
  therapistInitials: string;             // "A.D."
  segments: NoteSegment[];
  themes?: string[];                     // ["sınır", "karşı-aktarım", "şefkat"]
  difficulty?: number;                   // 0-10
  learning?: number;                     // 0-10
  redFlag?: string;                      // varsa kırmızı not (etik / kriz)
};

export type SupervizyonNotuPanelProps = {
  data?: SupervizyonNotuData;
  isEditing?: boolean;
  onToggleEdit?(): void;
  onSave?(d: SupervizyonNotuData): void;
  onBack?(): void;
  onPrint?(): void;
  onExportPdf?(): void;
};

// ──────────────────────────────────────────────────────────────────────────
// Default — mock fallback
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_DATA: SupervizyonNotuData = {
  noteNo: '04',
  date: '2026.05.14',
  caseCode: 'Vaka #142',
  topic: 'Karşı-aktarım örüntüsü',
  supervisorName: 'Dr. Yasemin Kaya',
  therapistInitials: 'A.D.',
  segments: [
    {
      kind: 'concern',
      text:
        'Elif\'in son üç seansta sürekli benden onay arar gibi göz teması kurmasıyla kendi anneme baktığım o ergenlik yıllarımı hatırladım. Bu örüntüyü fark etmek hem rahatsız edici hem de yol açıcı oldu — danışana hizmet edebilmek için kendi tepkimi anlamam gerek.',
      marginNote: 'göz teması bir veri',
    },
    {
      kind: 'case',
      text:
        'Vaka: 28y kadın, sosyal kaygı, ACT + maruziyet. 6. seans. Onay arama davranışı seansta belirgin; özellikle defüzyon egzersizinden sonra "iyi miydim?" diye sorması dikkat çekici.',
    },
    {
      kind: 'supervisor',
      text:
        '"Bu seninle ilgili değil, ilişkinin doğasıyla ilgili. Onay arayışı onun aile sistemine bir cevap; senin tepkin de senin sistemine. İkisi birbirine değdiğinde verim alacaksın — savunma kurmadan kalabilirsen."',
      marginNote: '"savunma kurmadan kal"',
    },
    {
      kind: 'learning',
      text:
        'Hafta boyunca düşündüm: bir sonraki seansta Elif\'in onay isteğine cevap vermek yerine, ona ne hissettiğini sormam gerek. Süpervizyonun beni rahatlatması, çözüm üretmesi değil — birlikte düşünebilmesi.',
      marginNote: 'cevap > soru',
    },
  ],
  themes: ['karşı-aktarım', 'sınır', 'şefkat', 'aile sistemi'],
  difficulty: 9,
  learning: 9,
};

const KIND_LABEL: Record<NoteSegment['kind'], string> = {
  concern:    'kaygım',
  case:       'vaka',
  supervisor: 'süpervizör',
  learning:   'öğrendiğim',
};

// ──────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────

export default function SupervizyonNotuPanel(props: SupervizyonNotuPanelProps) {
  const initial = props.data ?? DEFAULT_DATA;
  const [editing, setEditing] = useState(props.isEditing ?? false);
  const [draft, setDraft] = useState<SupervizyonNotuData>(initial);

  const toggleEdit = () => {
    if (editing) {
      props.onSave?.(draft);
    }
    setEditing((v) => !v);
    props.onToggleEdit?.();
  };

  return (
    <div className="sv">
      {/* ── Top strip ─────────────────────────────────────── */}
      <header className="sv-strip">
        <button type="button" className="sv-back" onClick={props.onBack}>
          <ArrowLeft size={14} strokeWidth={1.8} />
        </button>

        <div className="sv-strip-id">
          <span className="sv-eyebrow">süpervizyon notu · {draft.noteNo}</span>
          <strong>{draft.topic}</strong>
        </div>

        <div className="sv-strip-actions">
          <button type="button" className="sv-icon-btn" onClick={props.onPrint} title="Yazdır">
            <Printer size={14} />
          </button>
          <button type="button" className="sv-icon-btn" onClick={props.onExportPdf} title="PDF al">
            <FileDown size={14} />
          </button>
          <button type="button" className={`sv-btn ${editing ? 'primary' : 'ghost'}`} onClick={toggleEdit}>
            {editing ? <Save size={14} /> : <Edit3 size={14} />}
            {editing ? 'Kaydet' : 'Düzenle'}
          </button>
        </div>
      </header>

      {/* ── Letter sheet ──────────────────────────────────── */}
      <main className="sv-sheet">
        {/* Ink stamp top-right */}
        <div className="sv-stamp" aria-hidden>
          <span className="sv-stamp-rim" />
          <div className="sv-stamp-body">
            <span className="num">N° {draft.noteNo}</span>
            <span className="date">{draft.date}</span>
          </div>
        </div>

        {/* Letterhead */}
        <div className="sv-letterhead">
          <span className="sv-eyebrow">süpervizyon mektubu</span>
          <h1 className="sv-to">
            Sayın <em>{draft.caseCode}</em>.
          </h1>
          <p className="sv-subline">
            süpervizör: <span className="name">{draft.supervisorName}</span>
          </p>
        </div>

        {/* Red flag (varsa) */}
        {draft.redFlag && (
          <div className="sv-redflag">
            <AlertOctagon size={14} />
            <strong>etik dikkat:</strong> {draft.redFlag}
          </div>
        )}

        {/* Segments with marginalia */}
        <div className="sv-body">
          {draft.segments.map((seg, i) => (
            <article key={i} className={`sv-seg seg-${seg.kind}`}>
              <span className="sv-seg-kind">{KIND_LABEL[seg.kind]}</span>
              <div className="sv-seg-text">
                {!editing ? (
                  <p>{seg.text}</p>
                ) : (
                  <textarea
                    value={seg.text}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        segments: d.segments.map((s, idx) =>
                          idx === i ? { ...s, text: e.target.value } : s,
                        ),
                      }))
                    }
                  />
                )}
              </div>
              {seg.marginNote && (
                <aside className="sv-margin">
                  <span className="sv-margin-dot" aria-hidden />
                  <em>{seg.marginNote}</em>
                </aside>
              )}
            </article>
          ))}
        </div>

        {/* Signature line */}
        <footer className="sv-signature">
          <div className="sv-sig-rule" />
          <div className="sv-sig-row">
            <span className="initials">{draft.therapistInitials}</span>
            <span className="date">{draft.date}</span>
            <span className="seal">terapist mührü</span>
          </div>
        </footer>
      </main>

      {/* ── Outside the letter: themes + dual score ─────── */}
      <section className="sv-outside">
        {(draft.themes && draft.themes.length > 0) && (
          <article className="sv-themes">
            <span className="sv-eyebrow">çıkan temalar</span>
            <div className="chips">
              {draft.themes.map((t) => (
                <span key={t} className="sv-theme">{t}</span>
              ))}
            </div>
          </article>
        )}

        <article className="sv-scores">
          <span className="sv-eyebrow">notun ağırlığı</span>
          <div className="sv-score-row">
            <div className="sv-score sv-score-diff">
              <span className="num">{draft.difficulty ?? '—'}</span>
              <em>/10 · zorluk</em>
            </div>
            <div className="sv-score sv-score-learn">
              <span className="num">{draft.learning ?? '—'}</span>
              <em>/10 · öğrenme</em>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
