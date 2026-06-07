'use client';

import dynamic from 'next/dynamic';
import type { Props } from './DanisanMindMap3DScene';

const Scene = dynamic(() => import('./DanisanMindMap3DScene'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center"
      style={{ height: '700px', background: '#000000' }}
    >
      <div style={{ color: '#9933FF', fontSize: '14px' }}>⬡ 3D Harita yükleniyor…</div>
    </div>
  ),
});

export default function DanisanMindMap3D(props: Props) {
  return <Scene {...props} />;
}
