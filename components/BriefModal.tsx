'use client';
import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import '@/components/CalmieModals.css';

type Props = {
  patientId?: string;
  patientName?: string;
};

const BriefIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
    <rect x="8" y="3" width="8" height="4" rx="1.5"/>
    <rect x="5" y="5" width="14" height="16" rx="2.5"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
    <line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 15, height: 15, flex: 'none', marginTop: 1 }}>
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="11" x2="12" y2="16.5"/>
    <circle cx="12" cy="7.7" r=".7" fill="currentColor" stroke="none"/>
  </svg>
);

export default function BriefModal({ patientId, patientName }: Props) {
  const [open, setOpen] = useState(false);
  const [not, setNot] = useState('');
  const [guncelleme, setGuncelleme] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!patientId || !open) return;
    fetch(`/api/brief?patientId=${patientId}`)
      .then(r => r.json())
      .then(d => { setNot(d.not || ''); setGuncelleme(d.guncelleme); });
  }, [patientId, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => textRef.current?.focus(), 60);
  }, [open]);

  const save = async () => {
    if (!patientId) return;
    await fetch('/api/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, not }),
    });
    setSaved(true);
    setGuncelleme(new Date().toLocaleString('tr-TR'));
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 90,
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#1A1A1C', color: '#FAFAF8',
          border: 'none', borderRadius: 999,
          padding: '11px 20px',
          fontSize: 13.5, fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans','Helvetica Neue',Arial,sans-serif",
          boxShadow: '4px 6px 14px -5px rgba(12,12,16,.46), -1px -1px 5px rgba(255,255,255,.18)',
          cursor: 'pointer', transition: '.16s',
          WebkitFontSmoothing: 'antialiased',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '7px 10px 22px -6px rgba(12,12,16,.5), -2px -2px 7px rgba(255,255,255,.22)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '4px 6px 14px -5px rgba(12,12,16,.46), -1px -1px 5px rgba(255,255,255,.18)'; }}
        title="Seans Brief"
      >
        <BriefIcon />
        Brief
      </button>

      {/* Modal — .cm CSS sistemi kullanır */}
      <div
        className={`cm${open ? ' show' : ''}`}
        aria-hidden={!open}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      >
        <div className="mcard" role="dialog" aria-modal="true">
          <div className="mhead">
            <div>
              <span className="eyebrow">Seans Brief</span>
              <h2>Seans Brief</h2>
              {patientName && <p className="sub">{patientName}</p>}
            </div>
            <button className="mx" type="button" aria-label="Kapat" onClick={() => setOpen(false)}>
              <X size={15} />
            </button>
          </div>

          <div className="mbody">
            {!patientId ? (
              <div className="note neutral">
                <InfoIcon />
                <span>Brief için önce bir danışan seçin.</span>
              </div>
            ) : (
              <div className="field">
                <label className="flabel" htmlFor="cm-brief-not">Seans öncesi notlar</label>
                <textarea
                  ref={textRef}
                  className="cinput"
                  id="cm-brief-not"
                  style={{ minHeight: 170 }}
                  placeholder={`${patientName ? patientName + ' için ' : ''}seans öncesi notlar, odak noktası, hatırlatmalar…`}
                  value={not}
                  onChange={e => setNot(e.target.value)}
                />
                {guncelleme && <p className="fhint">Son güncelleme: {guncelleme}</p>}
              </div>
            )}
          </div>

          {patientId && (
            <div className="mfoot">
              <span className={`savedtick${saved ? ' show' : ''}`}>
                <Check size={14} />Kaydedildi
              </span>
              <button className="cbtn cbtn-ghost" type="button" onClick={() => setOpen(false)}>Kapat</button>
              <button className="cbtn cbtn-primary" type="button" onClick={save}>Kaydet</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
