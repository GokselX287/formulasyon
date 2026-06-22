'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { AnamnezData } from '@/components/AnamnezPanel';
import { mergePreForm, type PreFormResponse } from '@/lib/anamnez';

const AnamnezV2 = dynamic(() => import('@/components/AnamnezV2'), {
  ssr: false,
});

export default function AnamnezPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<AnamnezData>({});
  const [, setSavedAt] = useState<string | undefined>();
  const [preForm, setPreForm] = useState<PreFormResponse[]>([]);
  // İlk GET yüklemesi oto-kaydı tetiklemesin; yalnız kullanıcı düzenleyince kaydet.
  const dirty = useRef(false);

  // İlk yükleme: mevcut anamnezi + ön-formu çek
  useEffect(() => {
    fetch(`/api/anamnez/${id}`)
      .then((r) => r.json())
      .then((d) => setData(d ?? {}));

    fetch(`/api/form-yanitlari?clientId=${id}`)
      .then((r) => r.json())
      .then((rows: { yanit_data?: string }[]) => {
        if (!Array.isArray(rows)) return;
        // yanit_data her satırda JSON string — düzleştirip { question, answer }[] yap
        const flat: PreFormResponse[] = [];
        for (const row of rows) {
          if (!row.yanit_data) continue;
          try {
            const parsed = JSON.parse(row.yanit_data);
            if (Array.isArray(parsed)) {
              // [{ question, answer }] biçimi
              for (const item of parsed) {
                if (item?.question != null && item?.answer != null) {
                  flat.push({ question: String(item.question), answer: String(item.answer) });
                }
              }
            } else if (parsed && typeof parsed === 'object') {
              // { key: value } biçimi
              for (const [k, v] of Object.entries(parsed)) {
                flat.push({ question: k, answer: String(v) });
              }
            }
          } catch {
            // parse hatası — atla
          }
        }
        setPreForm(flat);
      })
      .catch(() => setPreForm([]));
  }, [id]);

  // Debounced autosave — HER düzenlemede kaydet (veri asla kaybolmasın).
  // Zorunlu-alan kontrolü artık kaydı BLOKLAMAZ; yalnız "tamamlandı" hatırlatması olur.
  useEffect(() => {
    if (!dirty.current) return;              // ilk yükleme / kullanıcı düzenlemesi değil
    const t = setTimeout(async () => {
      await fetch(`/api/anamnez/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setSavedAt('şimdi');
    }, 1000);
    return () => clearTimeout(t);
  }, [data, id]);

  const saveNow = async () => {
    await fetch(`/api/anamnez/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setSavedAt('şimdi');
  };

  return (
    <AnamnezV2
      data={data}
      clientName={data.demografik?.adSoyad}
      clientNo={`#${id}`}
      hasPreForm={preForm.length > 0}
      onChange={(s, v) => { dirty.current = true; setData((d) => ({ ...d, [s]: v })); }}
      onBack={() => router.push(`/uygulama?tab=calisma-alani&room=danisanlar`)}
      onNav={(target) => router.push(`/uygulama?tab=${target}`)}
      onAiFill={() => router.push('/ozet')}
      onImportPreForm={() => { dirty.current = true; setData((d) => mergePreForm(d, preForm)); }}
      onSave={saveNow}
      onOpenDongu={() => router.push(`/clients/${id}/dongu`)}
    />
  );
}
