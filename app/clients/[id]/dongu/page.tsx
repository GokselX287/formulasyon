'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const SorunDonguEkle = dynamic(() => import('@/components/SorunDonguEkle'), { ssr: false });

export default function DonguPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [clientName, setClientName] = useState('');

  // Sadece künye için danışan adını çek — döngü her an eklenebilir, anamnez şartı yok.
  useEffect(() => {
    fetch('/api/clients')
      .then((r) => (r.ok ? r.json() : []))
      .then((clients) => {
        const c = Array.isArray(clients) ? clients.find((x: any) => String(x.id) === String(id)) : null;
        if (c) setClientName(c.adSoyad || c.alias || c.name || c.ad_soyad || '');
      })
      .catch(() => {});
  }, [id]);

  return (
    <SorunDonguEkle
      clientId={id}
      clientName={clientName}
      clientNo={`#${id}`}
      onBack={() => router.push(`/profil/${id}`)}
      onNav={(target) => router.push(`/uygulama?tab=${target}`)}
    />
  );
}
