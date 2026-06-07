'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Upload } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  therapistName?: string;
  therapistTitle?: string;
  onClose: () => void;
};

const PHOTO_KEY = 'therapist_photo';
const DEFAULT_NAME  = 'Göksel Akkaya';
const DEFAULT_TITLE = 'EABCT Akredite Bilişsel Davranışçı Terapist · Psikolojik Danışman';

// ─── Component ────────────────────────────────────────────────────────────────

export default function BeklemeEkrani({ therapistName, therapistTitle, onClose }: Props) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Load photo from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PHOTO_KEY);
    if (saved) setPhoto(saved);
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Handle photo file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      localStorage.setItem(PHOTO_KEY, dataUrl);
      setPhoto(dataUrl);
      setShowUpload(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const name  = therapistName  || DEFAULT_NAME;
  const title = therapistTitle || DEFAULT_TITLE;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-[90] flex overflow-hidden bg-[#0E0F12]">

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
      >
        <X className="w-4 h-4" />
      </button>

      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-start justify-center px-16 select-none">

        {/* App brand mark */}
        <div className="mb-10">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <svg viewBox="0 0 20 20" className="w-5 h-5 fill-white/80">
              <circle cx="10" cy="10" r="3" />
              <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] font-medium">Klinik Asistan</p>
        </div>

        {/* Main title */}
        <div className="space-y-0">
          <p className="text-white/35 text-5xl font-light tracking-tight leading-none">Klinik</p>
          <p className="text-white text-6xl font-semibold tracking-tight leading-none">Asistanı</p>
        </div>

        {/* Tagline */}
        <p className="mt-8 text-white/30 text-sm leading-relaxed max-w-xs">
          BDT tabanlı vaka formülasyonu<br />ve seans yönetim platformu
        </p>

        {/* Clock */}
        <Clock />
      </div>

      {/* ── CENTER DIVIDER ─────────────────────────────────── */}
      <div className="relative flex-shrink-0 w-px mx-2 self-stretch">
        {/* The vertical line with fade at top and bottom */}
        <div
          className="absolute inset-x-0 top-0 bottom-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.25) 20%, rgba(255,255,255,0.25) 80%, transparent 100%)',
            width: 1,
          }}
        />
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-16 select-none">

        {/* Name & title */}
        <div className="text-center mb-10">
          <p className="text-white/40 text-xs uppercase tracking-[0.25em] font-medium mb-4">Terapist</p>
          <h2 className="text-white text-4xl font-semibold tracking-tight leading-tight">{name}</h2>
          <div className="mt-3 space-y-0.5">
            {title.split('·').map((part, i) => (
              <p key={i} className="text-white/45 text-sm leading-relaxed">{part.trim()}</p>
            ))}
          </div>
        </div>

        {/* Circular photo */}
        <div className="relative group">
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="w-40 h-40 rounded-full object-cover object-top ring-2 ring-white/15"
            />
          ) : (
            /* Initials fallback */
            <div className="w-40 h-40 rounded-full bg-white/10 ring-2 ring-white/15 flex items-center justify-center">
              <span className="text-white/60 text-3xl font-semibold tracking-wide">{initials}</span>
            </div>
          )}

          {/* Upload overlay on hover */}
          <button
            onClick={e => { e.stopPropagation(); setShowUpload(true); }}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1"
            title="Fotoğraf yükle"
          >
            <Upload className="w-5 h-5 text-white/80" />
            <span className="text-white/70 text-[10px] font-medium">Fotoğraf Seç</span>
          </button>
        </div>

        {/* Hidden file input trigger */}
        {showUpload && (
          <label className="mt-4 cursor-pointer">
            <span className="text-white/40 text-xs underline underline-offset-2">Dosyayı seç</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              autoFocus
            />
          </label>
        )}

        {!photo && !showUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="mt-5 text-white/25 text-xs hover:text-white/50 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3 h-3" />
            Fotoğraf ekle
          </button>
        )}
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
        <p className="text-white/20 text-[10px] tracking-widest uppercase">ESC · Devam et</p>
      </div>
    </div>
  );
}

// ─── Live clock ───────────────────────────────────────────────────────────────

function Clock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-12">
      <p className="text-white/70 text-3xl font-light tabular-nums tracking-tight">{time}</p>
      <p className="text-white/25 text-xs mt-1 capitalize">{date}</p>
    </div>
  );
}
