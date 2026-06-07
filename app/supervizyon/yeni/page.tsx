'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SupervizyonNotuPanel from '@/components/SupervizyonNotuPanel';
import type { SupervizyonNotuData } from '@/components/SupervizyonNotuPanel';
import '@/components/SupervizyonNotuPanel.css';

const EMPTY: SupervizyonNotuData = {
  noteNo:            '',
  date:              new Date().toLocaleDateString('tr-TR').replace(/\//g, '.'),
  caseCode:          '',
  topic:             '',
  supervisorName:    '',
  therapistInitials: '',
  segments: [
    { kind: 'concern',    text: '' },
    { kind: 'case',       text: '' },
    { kind: 'supervisor', text: '' },
    { kind: 'learning',   text: '' },
  ],
  themes:     [],
  difficulty: 5,
  learning:   5,
};

export default function SupervizyonNotuYeniPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  return (
    <SupervizyonNotuPanel
      data={EMPTY}
      isEditing={true}
      onBack={() => router.back()}
      onPrint={() => window.print()}
      onExportPdf={() => {}}
      onSave={async (next) => {
        if (saved) return;
        setSaved(true);
        const res = await fetch('/api/supervizyon-notu', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(next),
        });
        const { id } = await res.json();
        router.replace(`/supervizyon/${id}`);
      }}
    />
  );
}
