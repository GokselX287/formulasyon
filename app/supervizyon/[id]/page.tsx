'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SupervizyonNotuPanel from '@/components/SupervizyonNotuPanel';
import type { SupervizyonNotuData } from '@/components/SupervizyonNotuPanel';
import '@/components/SupervizyonNotuPanel.css';

export default function SupervizyonNotuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }  = use(params);
  const router  = useRouter();
  const [data, setData] = useState<SupervizyonNotuData | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/supervizyon-notu/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }, [id]);

  return (
    <SupervizyonNotuPanel
      data={data}                            // undefined → component kendi mock'ını kullanır
      onBack={() => router.back()}
      onPrint={() => window.print()}
      onExportPdf={() => window.open(`/api/supervizyon-notu/${id}/pdf`)}
      onSave={async (next) => {
        await fetch(`/api/supervizyon-notu/${id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(next),
        });
      }}
    />
  );
}
