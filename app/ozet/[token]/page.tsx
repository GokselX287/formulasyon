'use client';

import React, { useEffect, useState } from 'react';
import DanisanOzetIcerik, { danisanKodu, type OzetData } from '@/components/DanisanOzetIcerik';

// Herkese-açık danışan özeti — token'lı (form_linkleri · formTipi 'danisan-ozet').
// Snapshot payload'ı render eder; klinik-içi alan içermez.

type PageProps = { params: Promise<{ token: string }> };

export default function OzetPage({ params }: PageProps) {
  const { token } = React.use(params);
  const [data, setData] = useState<OzetData | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    fetch(`/api/form/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('404'))))
      .then((meta) => {
        const p = meta?.payload;
        if (p && (meta.formTipi === 'danisan-ozet' || p.fourP || p.longitudinal || p.summary || p.interventionsPlanned)) {
          setData({
            name: p.name ?? meta.clientName,
            summary: p.summary,
            fourP: p.fourP,
            longitudinal: p.longitudinal,
            interventionsPlanned: p.interventionsPlanned,
          });
          setState('ok');
        } else {
          setState('error');
        }
      })
      .catch(() => setState('error'));
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: '#F4F5F8', padding: '32px 16px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: '0 auto', background: '#fff', borderRadius: 24, boxShadow: '0 12px 40px -16px rgba(0,0,0,.18)', padding: '28px 26px' }}>
        {state === 'loading' && <p style={{ color: '#6B7280' }}>Yükleniyor…</p>}
        {state === 'error' && <p style={{ color: '#6B7280' }}>Bu özet bulunamadı ya da artık geçerli değil.</p>}
        {state === 'ok' && data && (
          <>
            <div style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#6B7280' }}>Vaka Sunumu</div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 600, fontSize: 30, margin: '6px 0 2px', color: '#0E0F12' }}>{danisanKodu(data.name)}</h1>
            <p style={{ color: '#6B7280', margin: '0 0 4px' }}>Birlikte üzerinde çalıştığımız konuların özeti.</p>
            <DanisanOzetIcerik data={data} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={() => window.print()} style={{ border: 'none', background: '#0E0F12', color: '#fff', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>PDF olarak indir</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
