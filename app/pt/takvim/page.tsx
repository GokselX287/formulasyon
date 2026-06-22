'use client';

/* Takvim — bu hafta dersleri + bugünkü girişler (yoklama). */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/pt/pt.css';

const BACK = '/uygulama?tab=calisma-alani&room=antrenor';
const GUNLER = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const ymd = (d: Date) => d.toISOString().slice(0, 10);
type Lesson = { id: string; tarih: string; baslangic: string; bitis?: string; tip: string; durum: string; notlar?: string; trainer_id?: string; member_id?: string };
type Att = { id: string; tarih: string; giris_at?: string; member_id: string; kaynak: string };

export default function PtTakvim() {
  const router = useRouter();
  const [weekStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; });
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [att, setAtt] = useState<Att[]>([]);
  const [members, setMembers] = useState<Record<string, string>>({});
  const [trainers, setTrainers] = useState<{ id: string; ad_soyad: string }[]>([]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; }), [weekStart]);
  const from = ymd(days[0]); const to = ymd(days[6]); const today = ymd(new Date());

  const load = useCallback(() => {
    fetch(`/api/pt/lessons?from=${from}&to=${to}`).then((r) => r.json()).then((d) => setLessons(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`/api/pt/attendance?from=${today}&to=${today}`).then((r) => r.json()).then((d) => setAtt(Array.isArray(d) ? d : [])).catch(() => {});
  }, [from, to, today]);
  useEffect(() => {
    load();
    fetch('/api/pt/members').then((r) => r.json()).then((d) => { const map: Record<string, string> = {}; (Array.isArray(d) ? d : []).forEach((m: any) => map[m.id] = m.ad_soyad); setMembers(map); }).catch(() => {});
    fetch('/api/pt/trainers').then((r) => r.json()).then((d) => setTrainers(Array.isArray(d) ? d : [])).catch(() => {});
  }, [load]);

  const addLesson = async (tarih: string) => {
    const saat = prompt('Başlangıç saati (HH:MM):', '09:00'); if (!saat) return;
    const bitis = prompt('Bitiş saati (HH:MM):', '10:00') || null;
    const tip = (prompt('Tip: ders / grup / musait / kapali', 'ders') || 'ders');
    const r = await fetch('/api/pt/lessons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tarih, baslangic: saat, bitis, tip }) }).then((x) => x.json());
    if (r?.ok) load();
  };
  const delLesson = async (id: string) => { await fetch(`/api/pt/lessons/${id}`, { method: 'DELETE' }); load(); };

  return (
    <div className="pt pt-stage">
      <div className="pt-wrap">
        <button className="pt-back" onClick={() => router.push(BACK)}><span className="chev">‹</span> Kişisel Antrenör</button>
        <div className="pt-head"><div className="pt-eyebrow">Takvim</div><h1 className="pt-title">Ders takvimi <i>· bu hafta</i></h1></div>

        <div className="pt-card" style={{ padding: '14px 16px', marginBottom: 14 }}>
          <b style={{ fontSize: 13 }}>Bugünkü girişler ({att.length})</b>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {att.length === 0 ? <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Bugün giriş yok.</span>
              : att.map((a) => <span key={a.id} className="pt-badge ok"><span className="dot" />{members[a.member_id] ?? '—'} {a.giris_at ? new Date(a.giris_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
          {days.map((d, i) => {
            const key = ymd(d); const dayLessons = lessons.filter((l) => l.tarih === key).sort((a, b) => a.baslangic.localeCompare(b.baslangic));
            const isToday = key === today;
            return (
              <div key={key} className="pt-card" style={{ padding: '12px 12px', outline: isToday ? '2px solid #111' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: 12.5 }}>{GUNLER[i]} {d.getDate()}</b>
                  <button className="pt-btn ghost" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => addLesson(key)}>+</button>
                </div>
                <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                  {dayLessons.length === 0 ? <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>—</span>
                    : dayLessons.map((l) => (
                      <div key={l.id} style={{ fontSize: 11.5, background: 'var(--chip)', borderRadius: 8, padding: '5px 7px' }} onDoubleClick={() => delLesson(l.id)} title="Çift tık: sil">
                        <b>{l.baslangic}</b>{l.bitis ? `–${l.bitis}` : ''} · {l.tip}{l.member_id && members[l.member_id] ? ` · ${members[l.member_id]}` : ''}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 10 }}>Ders eklemek için günün “+” butonu; silmek için derse çift tıkla. {trainers.length} eğitmen kayıtlı.</p>
      </div>
    </div>
  );
}
