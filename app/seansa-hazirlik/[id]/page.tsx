'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SeansaHazirlikV2 from '@/components/SeansaHazirlikV2';

// Niyet gerçek /api/brief'e bağlı. Seyir/son-söz/araç-kiti/plan illüstratif
// (gerçek seyir/plan kaynağı bağlanınca dolar) — app'in demo-briefing pattern'i.
const EX_VITALS = [
  { label: 'SUDS', series: [8, 7, 7, 6, 7, 5], unit: '' },
  { label: 'Ruh hali', series: [4, 5, 5, 6, 5, 6], unit: '/10' },
];
const EX_TOOLKIT = [
  { t: 'Yaprak-dere metaforu', icon: 'leaf' as const },
  { t: '“Bu bir düşünce” etiketleme', icon: 'tag' as const },
  { t: 'Değerler pusulası', icon: 'compass' as const },
  { t: 'Maruziyet basamağı +1', icon: 'ladder' as const },
];
const EX_PLAN = [
  { dur: '5 dk', t: 'Açılış & gündem', d: 'Hafta nasıldı; ödev ne oldu?', phase: 'bağ' },
  { dur: '10 dk', t: 'Ödev gözden geçirme', d: 'Deneyimi değer çerçevesinde ele al.', phase: 'köprü' },
  { dur: '20 dk', t: 'Çekirdek çalışma', d: 'Seansın ana müdahalesi.', phase: 'çekirdek' },
  { dur: '8 dk', t: 'Yeni ödev & kapanış', d: 'Özet ve geri bildirim.', phase: 'kapanış' },
];

export default function SeansaHazirlikPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [client, setClient] = useState<{ name: string; topic?: string } | null>(null);
  const [intent, setIntent] = useState('');

  useEffect(() => {
    fetch('/api/clients').then((r) => r.json()).then((rows: any[]) => {
      const c = Array.isArray(rows) ? rows.find((x) => String(x.id) === String(id)) : null;
      if (c) setClient({ name: c.adSoyad ?? c.name ?? 'Danışan', topic: c.sunumSorunu ?? undefined });
    }).catch(() => {});
    fetch(`/api/brief?patientId=${id}`).then((r) => r.json()).then((d) => setIntent(d?.not ?? '')).catch(() => {});
  }, [id]);

  return (
    <SeansaHazirlikV2
      clientId={id}
      clientName={client?.name}
      topic={client?.topic}
      intent={intent}
      vitals={EX_VITALS}
      lastWords={null}
      toolkit={EX_TOOLKIT}
      plan={EX_PLAN}
      onBack={() => router.push('/uygulama?tab=calendar')}
      onNav={(target) => router.push(target === 'home' ? '/' : `/uygulama?tab=${target}`)}
      onOpenFile={() => router.push(`/profil/${id}`)}
      onOpenLibrary={() => router.push('/uygulama?tab=mudahale-kutuphanesi')}
      onSaveIntent={(text) => {
        setIntent(text);
        fetch('/api/brief', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: id, not: text }) });
      }}
    />
  );
}
