'use client';

/* Eğitmen haftalık programı — program_json (slot listesi). */
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/pt/pt.css';

const GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
type Slot = { gun: number; baslangic: string; bitis: string; tip: string; not?: string };

export default function PtEgitmenProgram({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/pt/trainers/${id}`).then((r) => r.ok ? r.json() : null).then((t) => {
      if (!t) return; setName(t.ad_soyad);
      try { setSlots(t.program_json ? JSON.parse(t.program_json) : []); } catch { setSlots([]); }
    }).catch(() => {});
  }, [id]);

  const save = async (next: Slot[]) => {
    setSlots(next);
    await fetch(`/api/pt/trainers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ program_json: JSON.stringify(next) }) });
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  };
  const addSlot = (gun: number) => save([...slots, { gun, baslangic: '09:00', bitis: '10:00', tip: 'ders', not: '' }]);
  const updSlot = (i: number, patch: Partial<Slot>) => save(slots.map((s, x) => x === i ? { ...s, ...patch } : s));
  const delSlot = (i: number) => save(slots.filter((_, x) => x !== i));

  return (
    <div className="pt pt-stage">
      <div className="pt-wrap">
        <button className="pt-back" onClick={() => router.push(`/pt/egitmen/${id}`)}><span className="chev">‹</span> Eğitmen</button>
        <div className="pt-head" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div><div className="pt-eyebrow">Haftalık program</div><h1 className="pt-title">{name || 'Eğitmen'}</h1></div>
          <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{saved ? 'Kaydedildi ✓' : 'Değişiklikler otomatik kaydedilir'}</span>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {GUNLER.map((g, gi) => {
            const daySlots = slots.map((s, i) => ({ s, i })).filter(({ s }) => s.gun === gi);
            return (
              <div key={gi} className="pt-card" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: daySlots.length ? 10 : 0 }}>
                  <b style={{ fontSize: 14 }}>{g}</b>
                  <button className="pt-btn ghost" style={{ padding: '6px 12px' }} onClick={() => addSlot(gi)}>+ Saat ekle</button>
                </div>
                {daySlots.map(({ s, i }) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0', borderTop: '1px solid var(--line)' }}>
                    <input className="pt-input" style={{ width: 100 }} type="time" value={s.baslangic} onChange={(e) => updSlot(i, { baslangic: e.target.value })} />
                    <span style={{ color: 'var(--ink-mute)' }}>–</span>
                    <input className="pt-input" style={{ width: 100 }} type="time" value={s.bitis} onChange={(e) => updSlot(i, { bitis: e.target.value })} />
                    <select className="pt-select" style={{ width: 'auto' }} value={s.tip} onChange={(e) => updSlot(i, { tip: e.target.value })}>
                      <option value="ders">Ders</option><option value="grup">Grup</option><option value="musait">Müsait</option><option value="kapali">Kapalı</option>
                    </select>
                    <input className="pt-input" style={{ flex: 1, minWidth: 120 }} placeholder="not (opsiyonel)" value={s.not ?? ''} onChange={(e) => updSlot(i, { not: e.target.value })} />
                    <button className="pt-btn ghost" style={{ padding: '6px 10px' }} onClick={() => delSlot(i)}>Sil</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
