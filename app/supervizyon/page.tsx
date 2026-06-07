'use client';

import { useRouter } from 'next/navigation';
import SupervizyonV2 from '@/components/SupervizyonV2';

export default function SupervizyonPage() {
  const router = useRouter();
  return (
    <SupervizyonV2
      onBack={() => router.push('/?tab=terapist')}
      onNav={(target) => router.push(target === 'home' ? '/' : `/?tab=${target}`)}
    />
  );
}
