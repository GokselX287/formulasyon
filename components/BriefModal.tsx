'use client';
import { useState, useEffect, useRef } from 'react';
import { ClipboardList, X, Save } from 'lucide-react';

type Props = {
  patientId?: string;
  patientName?: string;
};

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
    if (open) setTimeout(() => textRef.current?.focus(), 50);
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
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0E0F12] dark:bg-white text-white dark:text-[#0E0F12] text-sm font-medium px-4 py-3 rounded-2xl shadow-lg hover:opacity-80 transition-all active:scale-95"
        title="Seans Brief"
      >
        <ClipboardList className="w-4 h-4" />
        <span className="hidden sm:inline">Brief</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-semibold text-[#0E0F12] dark:text-white">Seans Brief</p>
                </div>
                {patientName && <p className="text-xs text-gray-400 mt-0.5">{patientName}</p>}
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#F4F5F8] dark:hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {!patientId ? (
                <p className="text-sm text-gray-400 text-center py-4">Brief için önce bir danışan seçin</p>
              ) : (
                <>
                  <textarea
                    ref={textRef}
                    rows={8}
                    placeholder={`${patientName ? patientName + ' için ' : ''}seans öncesi notlar, odak noktası, hatırlatmalar…`}
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-[#F4F5F8] dark:bg-gray-800 dark:text-white outline-none focus:border-[#0E0F12] resize-none leading-relaxed"
                    value={not}
                    onChange={e => setNot(e.target.value)}
                  />
                  {guncelleme && (
                    <p className="text-[10px] text-gray-400">Son güncelleme: {guncelleme}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      Kapat
                    </button>
                    <button onClick={save}
                      className="flex items-center gap-1.5 bg-[#0E0F12] dark:bg-white text-white dark:text-[#0E0F12] text-xs font-medium px-4 py-1.5 rounded-xl hover:opacity-80 transition-opacity">
                      <Save className="w-3 h-3" />
                      {saved ? '✓ Kaydedildi' : 'Kaydet'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
