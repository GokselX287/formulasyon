'use client';

import React, { useState } from 'react';
import { BdtSeans } from '../lib/types';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface SeansCardProps {
  seans: BdtSeans;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen?: (id: string) => void;
}

export function SeansCard({ seans, onEdit, onDelete, onOpen }: SeansCardProps) {
  const [deleting, setDeleting] = useState(false);

  const isAnamnez = seans.tip === 'anamnez';
  const data = isAnamnez ? seans.anamnez : seans.seansNotu;

  const handleDelete = async () => {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return;
    setDeleting(true);
    await onDelete(seans.id);
  };

  const riskColor: Record<string, string> = {
    yok: 'text-emerald-700 bg-emerald-50',
    dusuk: 'text-yellow-700 bg-yellow-50',
    orta: 'text-orange-700 bg-orange-50',
    yuksek: 'text-red-700 bg-red-50',
  };

  return (
    <div className={cx(
      'rounded-xl border p-4 transition-shadow hover:shadow-sm',
      isAnamnez ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white',
    )}>
      <div className="flex items-start justify-between gap-3">
        <button className="flex-1 text-left" onClick={() => onOpen?.(seans.id)}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cx(
              'rounded-full px-2 py-0.5 text-[11px] font-semibold',
              isAnamnez ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700',
            )}>
              {isAnamnez ? 'İlk Görüşme' : `Seans ${seans.no}`}
            </span>
            <span className="text-xs text-slate-500">{fmtDate(seans.tarih)}</span>
            {!isAnamnez && seans.seansNotu?.riskDegerlendirme && seans.seansNotu.riskDegerlendirme !== 'yok' && (
              <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-semibold', riskColor[seans.seansNotu.riskDegerlendirme])}>
                Risk: {seans.seansNotu.riskDegerlendirme}
              </span>
            )}
          </div>

          {/* Summary line */}
          <div className="mt-1.5 text-sm text-slate-700 line-clamp-1">
            {isAnamnez
              ? seans.anamnez?.anaGikayet || seans.anamnez?.basvuruNedeni || 'Anamnez formu'
              : seans.seansNotu?.seansOdagi || seans.seansNotu?.gundemMaddeleri || 'Seans notu'}
          </div>

          {!isAnamnez && seans.seansNotu && (seans.seansNotu.kullanilanTeknikler ?? []).length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {(seans.seansNotu.kullanilanTeknikler ?? []).slice(0, 3).map(t => (
                <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{t}</span>
              ))}
              {(seans.seansNotu.kullanilanTeknikler ?? []).length > 3 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                  +{(seans.seansNotu.kullanilanTeknikler ?? []).length - 3}
                </span>
              )}
            </div>
          )}
        </button>

        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => onEdit(seans.id)}
            className="rounded-lg px-2.5 py-1.5 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Düzenle
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg px-2.5 py-1.5 text-xs border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Sil
          </button>
        </div>
      </div>

      {/* Tıklama yönlendirme ipucu */}
      {onOpen && (
        <p className="mt-2 text-[10px] text-slate-400 italic">Detay için karta tıklayın →</p>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="font-semibold text-slate-500">{label}: </span>
      <span>{children}</span>
    </div>
  );
}
