'use client';

import { useRouter } from 'next/navigation';
import SozlukV2 from '@/components/SozlukV2';

export default function SozlukPage() {
  const router = useRouter();
  return (
    <SozlukV2
      onBack={() => router.push('/uygulama')}
      onNav={(target) => router.push(target === 'home' ? '/' : `/uygulama?tab=${target}`)}
    />
  );
}
