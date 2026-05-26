'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { SessionPlan } from '@/components/SeansPlanlayiciPanel';
import type { Intervention } from '@/components/MudahalePanel';
import '@/components/SeansPlanlayiciPanel.css';

const SeansPlanlayiciPanel = dynamic(
  () => import('@/components/SeansPlanlayiciPanel'),
  { ssr: false },
);

// Inner component that uses useSearchParams — must be inside Suspense
function SeansPlanlayiciInner() {
  const router = useRouter();
  const search = useSearchParams();
  const clientId = search.get('client');
  const fromParam = search.get('from');
  const fromIds = fromParam ? fromParam.split(',').filter(Boolean) : [];

  const [client, setClient] = useState<{
    id: string; name: string; age?: number; issue?: string;
  } | null>(null);
  const [library, setLibrary] = useState<Intervention[]>([]);
  const [context, setContext] = useState<any>(null);
  const [plan, setPlan] = useState<SessionPlan>({
    clientId: clientId ?? '',
    sessionLength: 50,
    items: [],
  });

  useEffect(() => {
    if (!clientId) {
      fetch('/api/interventions')
        .then(r => r.json())
        .then(setLibrary)
        .catch(() => {});
      return;
    }

    Promise.all([
      fetch(`/api/clients/${clientId}`).then(r => r.json()),
      fetch('/api/interventions').then(r => r.json()),
      fetch(`/api/seans-context/${clientId}`).then(r => r.json()),
    ]).then(([c, lib, ctx]) => {
      setClient({
        id: clientId,
        name: c.adSoyad ?? c.name ?? '—',
        age: c.yas ? Number(c.yas) : c.age ? Number(c.age) : undefined,
        issue: c.sunumSorunu ?? c.issue ?? undefined,
      });
      setLibrary(lib);
      setContext(ctx);

      // Sepetten gelen müdahaleleri main bloğuna otomatik yerleştir
      if (fromIds.length > 0) {
        const libMap = new Map<string, Intervention>(lib.map((i: Intervention) => [i.id, i]));
        const DURATION_MIN: Record<string, number> = {
          kisa: 8, orta: 18, uzun: 35, 'tam-seans': 50,
        };
        const seededItems = fromIds.map((id, order) => {
          const iv = libMap.get(id);
          return {
            interventionId: id,
            block: 'main' as const,
            order,
            durationMinutes: iv?.durationMinutes ?? DURATION_MIN[iv?.duration ?? 'orta'] ?? 18,
          };
        });
        setPlan(p => ({ ...p, clientId: clientId, items: seededItems }));
      } else {
        setPlan(p => ({ ...p, clientId: clientId }));
      }
    }).catch(() => {
      fetch('/api/interventions').then(r => r.json()).then(setLibrary).catch(() => {});
    });
  }, [clientId, fromParam]);

  if (clientId && !client) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        background: '#EFEDE8', fontFamily: 'var(--sans)',
        fontSize: 13, color: 'var(--muted)',
      }}>
        Yükleniyor…
      </div>
    );
  }

  return (
    <SeansPlanlayiciPanel
      client={client ?? undefined}
      sessionNumber={context?.nextSessionNumber ?? 1}
      sessionDate={context?.nextSessionDate ?? '—'}
      sessionTime={context?.nextSessionTime ?? '—'}
      plan={plan}
      onChangePlan={setPlan}
      contextLast={context?.lastSession ?? undefined}
      fullLibrary={library}
      recommendations={context?.recommendations ?? []}
      onBackToLibrary={() => router.push('/?tab=mudahale-kutuphanesi')}
      onOpenFullLibrary={() => router.push('/?tab=mudahale-kutuphanesi')}
      onSaveAsTemplate={async () => {
        await fetch('/api/session-plan-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plan),
        });
      }}
      onAssignToSession={async (p) => {
        await fetch('/api/session-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        });
        if (clientId) {
          router.push(`/clients/${clientId}/anamnez`);
        } else {
          router.push('/');
        }
      }}
    />
  );
}

export default function SeansPlanlayiciPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        background: '#EFEDE8', fontFamily: 'var(--sans)',
        fontSize: 13, color: 'var(--muted)',
      }}>
        Yükleniyor…
      </div>
    }>
      <SeansPlanlayiciInner />
    </Suspense>
  );
}
