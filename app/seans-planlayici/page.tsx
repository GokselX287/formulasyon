'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Intervention } from '@/components/MudahalePanel';
import SeansPlanlayiciV2 from '@/components/SeansPlanlayiciV2';

function SeansPlanlayiciInner() {
  const router = useRouter();
  const search = useSearchParams();
  const clientId = search.get('client');
  const fromParam = search.get('from');
  const seedIds = fromParam ? fromParam.split(',').filter(Boolean) : [];

  const [client, setClient] = useState<{ id: string; name: string } | null>(null);
  const [library, setLibrary] = useState<Intervention[]>([]);

  useEffect(() => {
    fetch('/api/interventions').then((r) => r.json()).then(setLibrary).catch(() => {});
    if (clientId) {
      fetch(`/api/clients/${clientId}`).then((r) => r.json()).then((c) => {
        setClient({ id: clientId, name: c.adSoyad ?? c.name ?? '—' });
      }).catch(() => {});
    }
  }, [clientId]);

  return (
    <SeansPlanlayiciV2
      client={client ?? undefined}
      library={library}
      seedIds={seedIds}
      onBack={() => (clientId ? router.push(`/profil/${clientId}`) : router.push('/?tab=calisma-alani'))}
      onNav={(target) => router.push(target === 'home' ? '/' : `/?tab=${target}`)}
      onOpenFile={() => clientId && router.push(`/profil/${clientId}`)}
      onSave={async ({ goal, items }) => {
        await fetch('/api/session-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: clientId ?? '', sessionLength: 50, items, nextFocus: goal }),
        });
      }}
    />
  );
}

export default function SeansPlanlayiciPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#EFEDE8', fontSize: 13, color: '#8C8A84' }}>Yükleniyor…</div>}>
      <SeansPlanlayiciInner />
    </Suspense>
  );
}
