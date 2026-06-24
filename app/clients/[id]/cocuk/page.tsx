'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { CocukData } from '@/components/CocukPanel';

const CocukDegerlendirmeV2 = dynamic(() => import('@/components/CocukDegerlendirmeV2'), { ssr: false });

export default function CocukPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<CocukData>({});
  const [, setSavedAt] = useState<string | undefined>();
  // İlk GET yüklemesi oto-kaydı tetiklemesin; yalnız kullanıcı düzenleyince kaydet.
  const dirty = useRef(false);

  useEffect(() => {
    fetch(`/api/cocuk/${id}`).then((r) => r.json()).then((d: CocukData) => setData(d ?? {})).catch(() => setData({}));
  }, [id]);

  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(async () => {
      await fetch(`/api/cocuk/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      setSavedAt('şimdi');
    }, 1500);
    return () => clearTimeout(t);
  }, [data, id]);

  const saveNow = async () => {
    await fetch(`/api/cocuk/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setSavedAt('şimdi');
  };

  return (
    <CocukDegerlendirmeV2
      data={data}
      clientName={(data as any).demografik?.adSoyad}
      clientNo={`#${id}`}
      onChange={(s, v) => { dirty.current = true; setData((d) => ({ ...d, [s]: v })); }}
      onBack={() => router.push(`/profil/${id}`)}
      onNav={(target) => router.push(target === 'home' ? '/' : `/uygulama?tab=${target}`)}
      onAiFill={() => router.push('/ozet')}
      onFormul={() => router.push('/ozet')}
      onSave={saveNow}
    />
  );
}
