'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Trash2, ExternalLink, FileImage, File as FileIcon2, Plus,
  RefreshCw, X, StickyNote, Check,
} from 'lucide-react';
import './DesignFilesPanel.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DesignFile {
  id: string;
  name: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  source: 'upload' | 'canva';
  canva_id: string | null;
  thumbnail: string | null;
  path: string;
  notes: string | null;
  created_at: string;
}

// ─── Canva OAuth config (env vars ile gelecek) ────────────────────────────────
const CANVA_CLIENT_ID = process.env.NEXT_PUBLIC_CANVA_CLIENT_ID ?? '';
const CANVA_REDIRECT  = typeof window !== 'undefined'
  ? `${window.location.origin}/api/canva/callback`
  : '';

function buildCanvaOAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     CANVA_CLIENT_ID,
    redirect_uri:  CANVA_REDIRECT,
    scope:         'design:content:read',
    state:         Math.random().toString(36).slice(2),
  });
  return `https://www.canva.com/api/oauth/authorize?${params}`;
}

// ─── Yardımcı ─────────────────────────────────────────────────────────────────
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return iso.slice(0, 10); }
}

function isImage(mime: string) { return mime.startsWith('image/'); }
function isPdf(mime: string)   { return mime === 'application/pdf'; }

// ─── FileIcon ─────────────────────────────────────────────────────────────────
function FileIconDisplay({ mime }: { mime: string }) {
  if (isPdf(mime)) return <FileIcon2 size={22} className="df-file-icon pdf" />;
  return <FileImage size={22} className="df-file-icon img" />;
}

// ─── UploadZone ───────────────────────────────────────────────────────────────
function UploadZone({ onUpload }: { onUpload: (f: File) => Promise<void> }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    try { await onUpload(file); }
    catch (e) { setError(e instanceof Error ? e.message : 'Yükleme başarısız.'); }
    finally { setUploading(false); }
  }, [onUpload]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handle(file);
  };

  return (
    <div
      className={`df-upload-zone ${dragging ? 'df-upload-zone--over' : ''} ${uploading ? 'df-upload-zone--busy' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      role="button"
      aria-label="Dosya yükle"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.svg"
        className="df-hidden-input"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ''; }}
      />
      {uploading ? (
        <div className="df-upload-busy">
          <RefreshCw size={20} className="df-spin" />
          <span>Yükleniyor…</span>
        </div>
      ) : (
        <>
          <Upload size={24} className="df-upload-icon" />
          <p className="df-upload-label">Sürükle & bırak veya tıkla</p>
          <p className="df-upload-hint">PNG, JPG, PDF, SVG, GIF, WEBP · maks. 30 MB</p>
        </>
      )}
      {error && <p className="df-upload-error">{error}</p>}
    </div>
  );
}

// ─── CanvaConnectBanner ───────────────────────────────────────────────────────
function CanvaConnectBanner() {
  const hasCredentials = Boolean(CANVA_CLIENT_ID);

  const openCanva = () => {
    if (hasCredentials) {
      window.open(buildCanvaOAuthUrl(), '_blank', 'width=600,height=700');
    } else {
      window.open('https://www.canva.com', '_blank');
    }
  };

  return (
    <div className="df-canva-banner">
      <div className="df-canva-banner-left">
        {/* Canva logosu benzeri */}
        <div className="df-canva-logo" aria-hidden>
          <svg viewBox="0 0 40 40" width="32" height="32">
            <circle cx="20" cy="20" r="20" fill="#8B3DFF"/>
            <text x="20" y="26" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">C</text>
          </svg>
        </div>
        <div>
          <p className="df-canva-title">Canva ile Bağlan</p>
          <p className="df-canva-sub">
            {hasCredentials
              ? 'Canva hesabındaki tasarımları doğrudan içe aktar.'
              : 'Canva\'yı aç, tasarımını indir ve buraya yükle.'}
          </p>
        </div>
      </div>
      <div className="df-canva-actions">
        <button type="button" className="df-btn df-btn--canva" onClick={openCanva}>
          <ExternalLink size={13} />
          {hasCredentials ? 'Canva Hesabına Bağlan' : "Canva'yı Aç"}
        </button>
        {!hasCredentials && (
          <span className="df-canva-hint">
            Otomatik içe aktarma için <code>NEXT_PUBLIC_CANVA_CLIENT_ID</code> gerekli
          </span>
        )}
      </div>
    </div>
  );
}

// ─── DesignCard ───────────────────────────────────────────────────────────────
function DesignCard({
  file,
  onDelete,
  onUpdateNotes,
}: {
  file: DesignFile;
  onDelete: () => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteVal, setNoteVal] = useState(file.notes ?? '');
  const [saving, setSaving] = useState(false);

  const saveNote = async () => {
    setSaving(true);
    await fetch(`/api/designs/${file.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: noteVal }),
    });
    onUpdateNotes(noteVal);
    setSaving(false);
    setEditingNote(false);
  };

  return (
    <article className="df-card">
      {/* Önizleme */}
      <div className="df-card-thumb">
        {isImage(file.mime_type) ? (
          <img src={file.path} alt={file.original_name} className="df-card-img" loading="lazy" />
        ) : (
          <div className="df-card-pdf-placeholder">
            <FileIconDisplay mime={file.mime_type} />
            <span>PDF</span>
          </div>
        )}
        {/* Hover aksiyonlar */}
        <div className="df-card-overlay">
          <a
            href={file.path}
            target="_blank"
            rel="noopener noreferrer"
            className="df-card-action"
            title="Tam boyut aç"
          >
            <ExternalLink size={14} />
          </a>
          <button
            type="button"
            className="df-card-action df-card-action--note"
            title="Not ekle"
            onClick={() => setEditingNote(e => !e)}
          >
            <StickyNote size={14} />
          </button>
          <button
            type="button"
            className="df-card-action df-card-action--del"
            title="Sil"
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </button>
        </div>
        {/* Kaynak badge */}
        {file.source === 'canva' && (
          <span className="df-card-source-badge">Canva</span>
        )}
      </div>

      {/* Bilgi */}
      <div className="df-card-info">
        <p className="df-card-name" title={file.original_name}>{file.original_name}</p>
        <p className="df-card-meta">{formatBytes(file.size_bytes)} · {formatDate(file.created_at)}</p>

        {/* Not */}
        {editingNote ? (
          <div className="df-card-note-edit">
            <textarea
              className="df-card-note-input"
              value={noteVal}
              onChange={e => setNoteVal(e.target.value)}
              placeholder="Bu dosya hakkında not…"
              rows={2}
              autoFocus
            />
            <div className="df-card-note-actions">
              <button type="button" className="df-note-btn" onClick={saveNote} disabled={saving}>
                {saving ? <RefreshCw size={11} className="df-spin" /> : <Check size={11} />}
              </button>
              <button type="button" className="df-note-btn" onClick={() => setEditingNote(false)}>
                <X size={11} />
              </button>
            </div>
          </div>
        ) : file.notes ? (
          <p className="df-card-note" onClick={() => setEditingNote(true)}>{file.notes}</p>
        ) : null}
      </div>
    </article>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DesignFilesPanel() {
  const [files, setFiles]     = useState<DesignFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'image' | 'pdf'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/designs');
      if (r.ok) setFiles(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/designs', { method: 'POST', body: fd });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.error ?? 'Yükleme hatası');
    }
    await load();
  };

  const deleteFile = async (id: string) => {
    await fetch(`/api/designs/${id}`, { method: 'DELETE' });
    setFiles(f => f.filter(x => x.id !== id));
  };

  const updateNotes = (id: string, notes: string) =>
    setFiles(f => f.map(x => x.id === id ? { ...x, notes } : x));

  const filtered = files.filter(f => {
    if (filter === 'image') return isImage(f.mime_type);
    if (filter === 'pdf')   return isPdf(f.mime_type);
    return true;
  });

  return (
    <div className="df-root">
      {/* Canva banner */}
      <CanvaConnectBanner />

      {/* Upload zone */}
      <UploadZone onUpload={upload} />

      {/* Filtre + sayı */}
      {files.length > 0 && (
        <div className="df-toolbar">
          <div className="df-filter-group">
            {(['all', 'image', 'pdf'] as const).map(f => (
              <button
                key={f}
                type="button"
                className={`df-filter-btn ${filter === f ? 'df-filter-btn--on' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? `Tümü (${files.length})` : f === 'image' ? 'Görsel' : 'PDF'}
              </button>
            ))}
          </div>
          <button type="button" className="df-btn df-btn--refresh" onClick={load} title="Yenile">
            <RefreshCw size={13} />
          </button>
        </div>
      )}

      {/* Galeri */}
      {loading ? (
        <div className="df-loading">
          <RefreshCw size={20} className="df-spin" />
          <span>Yükleniyor…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="df-empty">
          <Plus size={28} className="df-empty-icon" />
          <p>Henüz tasarım dosyası yok.</p>
          <p className="df-empty-hint">Yukarıdan dosya yükle veya Canva'dan içe aktar.</p>
        </div>
      ) : (
        <div className="df-grid">
          {filtered.map(file => (
            <DesignCard
              key={file.id}
              file={file}
              onDelete={() => deleteFile(file.id)}
              onUpdateNotes={(notes) => updateNotes(file.id, notes)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
