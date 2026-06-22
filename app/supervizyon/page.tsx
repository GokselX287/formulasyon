'use client';

import { useRouter } from 'next/navigation';
import SupervizyonV2 from '@/components/SupervizyonV2';

export default function SupervizyonPage() {
  const router = useRouter();
  return (
    <SupervizyonV2
      onBack={() => router.back()}
      onNav={(target) => router.push(target === 'home' ? '/' : `/uygulama?tab=${target}`)}
    />
  );
}
