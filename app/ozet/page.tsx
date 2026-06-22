'use client';

import { useRouter } from 'next/navigation';
import OzetInceleme from '@/components/OzetInceleme';

export default function OzetIncelemePage() {
  const router = useRouter();
  return (
    <OzetInceleme
      onBack={() => router.back()}
      onNav={(t) => { if (t === 'home') router.push('/uygulama?tab=home'); else router.push(`/uygulama?tab=${t}`); }}
      onSave={({ mode, fields }) => {
        // TODO (AI fazı): POST /api/ozet-cikar onayı → seanslar/formulations yazımı
        // Şimdilik yalnızca kabul edilen alanları konsola döker.
        console.log('[ozet] kaydet', mode, fields);
      }}
    />
  );
}
