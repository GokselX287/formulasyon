'use client';
import { useState } from 'react';
import WeekCalendar from './WeekCalendar';
import RandevuPanel from './RandevuPanel';
import TakvimGecmisAnaliz from './TakvimGecmisAnaliz';
import MusaitlikPanel from './MusaitlikPanel';
import type { ReactNode } from 'react';

type CalEvent = { id: string; title: string; start: string; end?: string };
type Patient   = { id: string; adSoyad: string };

type Props = {
  events: CalEvent[];
  onRefresh: () => void;
  loading?: boolean;
  patients: Patient[];
  smsChildren?: ReactNode;
};

export default function TakvimPanel({ events, onRefresh, loading, patients, smsChildren }: Props) {
  const [view, setView] = useState<'takvim' | 'randevular' | 'musaitlik' | 'gecmis' | 'sms'>('takvim');

  const tabs = [
    { k: 'takvim',     l: 'Takvim (macOS)'  },
    { k: 'randevular', l: 'Seansa Hazırlık' },
    { k: 'musaitlik',  l: 'Müsaitlik'       },
    { k: 'gecmis',     l: 'Geçmiş Analizi'  },
    { k: 'sms',        l: 'SMS & Netgsm'    },
  ] as const;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* İç sekme çubuğu */}
      <div className="flex gap-1 bg-[#F4F5F8] dark:bg-gray-800 p-1 rounded-2xl w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.k}
            onClick={() => setView(t.k)}
            className={`text-xs px-5 py-1.5 rounded-xl font-medium transition-colors ${
              view === t.k
                ? 'bg-white dark:bg-gray-900 text-[#0E0F12] dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-[#0E0F12] dark:hover:text-white'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {view === 'takvim' && (
        <WeekCalendar events={events} onRefresh={onRefresh} loading={loading} patients={patients} />
      )}
      {view === 'randevular' && (
        <RandevuPanel patients={patients} />
      )}
      {view === 'musaitlik' && (
        <MusaitlikPanel />
      )}
      {view === 'gecmis' && (
        <TakvimGecmisAnaliz patients={patients} />
      )}
      {view === 'sms' && (
        <div className="animate-fade-in">
          {smsChildren}
        </div>
      )}
    </div>
  );
}
