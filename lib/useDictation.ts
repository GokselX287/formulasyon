'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Web Speech API tip tanımları (lib.dom'da eksik olan tarayıcı API'leri) ─
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart:  ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror:  ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend:    ((ev: Event) => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

// ─── Tipler ───────────────────────────────────────────────────────────────
export type DictationState = 'idle' | 'recording' | 'processing' | 'error';

export interface UseDictationOptions {
  lang?: string;             // varsayılan 'tr-TR'
  continuous?: boolean;      // varsayılan true (durana kadar devam)
  onFinalTranscript?: (text: string) => void; // her cümle bitişinde çağrılır
  onInterim?: (text: string) => void;         // anlık (henüz onaylanmamış) metin
  onError?: (msg: string) => void;
}

export interface UseDictationReturn {
  state: DictationState;
  supported: boolean;
  interimText: string;        // anlık önizleme
  start: () => void;
  stop: () => void;
  reset: () => void;
  errorMessage: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────
export function useDictation(opts: UseDictationOptions = {}): UseDictationReturn {
  const {
    lang = 'tr-TR',
    continuous = true,
    onFinalTranscript,
    onInterim,
    onError,
  } = opts;

  const [state, setState] = useState<DictationState>('idle');
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeRef = useRef(false);

  const supported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const buildRecognition = useCallback(() => {
    const SR: SpeechRecognitionConstructor | undefined =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const r = new SR();
    r.lang = lang;
    r.continuous = continuous;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      setState('recording');
      setInterimText('');
      setErrorMessage(null);
    };

    r.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          onFinalTranscript?.(text);
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
      onInterim?.(interim);
    };

    r.onerror = (event: SpeechRecognitionErrorEvent) => {
      const msg = errorLabel(event.error);
      setErrorMessage(msg);
      setState('error');
      onError?.(msg);
      activeRef.current = false;
    };

    r.onend = () => {
      setInterimText('');
      // Continuous modda kullanıcı durdurana kadar yeniden başlat
      if (activeRef.current && continuous) {
        try { r.start(); } catch { /* zaten devam ediyor */ }
      } else {
        setState('idle');
      }
    };

    return r;
  }, [lang, continuous, onFinalTranscript, onInterim, onError]);

  const start = useCallback(() => {
    if (!supported) return;
    if (state === 'recording') return;

    // Öncekini temizle
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* */ }
    }

    const r = buildRecognition();
    if (!r) return;
    recognitionRef.current = r;
    activeRef.current = true;
    try {
      r.start();
    } catch (e) {
      setErrorMessage('Mikrofon başlatılamadı.');
      setState('error');
    }
  }, [supported, state, buildRecognition]);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* */ }
    }
    setState('idle');
    setInterimText('');
  }, []);

  const reset = useCallback(() => {
    stop();
    setErrorMessage(null);
    setInterimText('');
  }, [stop]);

  // Unmount temizliği
  useEffect(() => () => {
    activeRef.current = false;
    try { recognitionRef.current?.abort(); } catch { /* */ }
  }, []);

  return { state, supported, interimText, start, stop, reset, errorMessage };
}

// ─── Yardımcı ─────────────────────────────────────────────────────────────
function errorLabel(code: string): string {
  const map: Record<string, string> = {
    'not-allowed':          'Mikrofon erişimi reddedildi.',
    'no-speech':            'Ses algılanamadı.',
    'audio-capture':        'Mikrofon bulunamadı.',
    'network':              'Ağ hatası — internet bağlantısını kontrol edin.',
    'aborted':              'Kayıt iptal edildi.',
    'service-not-allowed':  'Konuşma tanıma servisi kullanılamıyor.',
  };
  return map[code] ?? `Bilinmeyen hata: ${code}`;
}
