'use client';

import { useDictation } from '@/lib/useDictation';
import './DictationButton.css';

// ─── Props ────────────────────────────────────────────────────────────────
interface DictationButtonProps {
  /** Transkript tamamlandığında — genellikle textarea'ya eklenir */
  onTranscript: (text: string) => void;
  /** Küçük mod (textarea satır içi) */
  size?: 'sm' | 'md';
  /** Dil kodu, varsayılan tr-TR */
  lang?: string;
  /** Ek CSS class */
  className?: string;
}

// ─── Mikrofon SVG ─────────────────────────────────────────────────────────
function MicIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="7" y="2" width="6" height="10" rx="3" fill="currentColor" opacity=".9" />
      <path d="M4 10a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="16" x2="10" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7"  y1="19" x2="13" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StopIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="5" y="5" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────
export default function DictationButton({
  onTranscript,
  size = 'md',
  lang = 'tr-TR',
  className = '',
}: DictationButtonProps) {
  const { state, supported, interimText, start, stop, errorMessage, reset } = useDictation({
    lang,
    continuous: true,
    onFinalTranscript: (text) => {
      if (text) onTranscript(text + ' ');
    },
  });

  if (!supported) return null;

  const isRecording = state === 'recording';
  const isError     = state === 'error';
  const iconPx      = size === 'sm' ? 14 : 16;

  return (
    <div className={`dct-wrap dct-wrap--${size} ${className}`}>
      {/* Anlık transkript balonu */}
      {isRecording && interimText && (
        <div className="dct-interim" aria-live="polite">
          <span className="dct-interim-dot" />
          {interimText}
        </div>
      )}

      {/* Hata mesajı */}
      {isError && errorMessage && (
        <div className="dct-error" role="alert">
          {errorMessage}
          <button type="button" className="dct-error-dismiss" onClick={reset}>✕</button>
        </div>
      )}

      {/* Ana buton */}
      <button
        type="button"
        className={`dct-btn dct-btn--${size} ${isRecording ? 'dct-btn--recording' : ''} ${isError ? 'dct-btn--error' : ''}`}
        onClick={isRecording ? stop : start}
        title={isRecording ? 'Kaydı durdur' : 'Dikte başlat'}
        aria-label={isRecording ? 'Kaydı durdur' : 'Sesli dikte başlat'}
        aria-pressed={isRecording}
      >
        {/* Dalga animasyonu — sadece kayıt sırasında */}
        {isRecording && (
          <span className="dct-ripple" aria-hidden />
        )}
        {isRecording
          ? <StopIcon size={iconPx} />
          : <MicIcon  size={iconPx} />
        }
      </button>

      {/* Kayıt göstergesi */}
      {isRecording && (
        <span className="dct-live-badge" aria-hidden>
          <span className="dct-live-dot" />
          DİKTE
        </span>
      )}
    </div>
  );
}
