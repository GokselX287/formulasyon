'use client';

/* Bildirimler — türetilmiş yönetici uyarıları (ölçüm eksik / tahsilat gecikti / paket bitti). */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/pt/pt.css';

const BACK = '/uygulama?tab=calisma-alani&room=antrenor';
type Notif = { tip: string; severity: 'warn' | 'risk'; memberId: string; memberName: string; detail: string; link: string };
const TIP_LABEL: Record<string, string> = { olcum_eksik: 'Ölçüm eksik', tahsilat_gecikti: 'Tahsilat gecikti', paket_bitti: 'Paket bitti' };

export default function PtBildirimler() {
  const router = useRouter();
  const [rows, setRows] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/pt/notifications').then((r) => r.json()).then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  return (
    <div className="pt pt-stage">
      <div className="pt-wrap">
        <button className="pt-back" onClick={() => router.push(BACK)}><span className="chev">‹</span> Kişisel Antrenör</button>
        <div className="pt-head"><div className="pt-eyebrow">Bildirimler</div><h1 className="pt-title">Yönetici uyarıları <i>({rows.length})</i></h1><p className="pt-lead">Bu ay ölçümü girilmemiş aktif üyeler, geciken tahsilat sözleri ve biten paketler otomatik listelenir.</p></div>
        <div className="pt-card" style={{ padding: '6px 18px' }}>
          {loading ? <div className="pt-empty">Yükleniyor…</div>
            : rows.length === 0 ? <div className="pt-empty"><h3>Her şey yolunda</h3><p>Bekleyen uyarı yok.</p></div>
              : <div className="pt-list">{rows.map((n, i) => (
                <div key={i} className="pt-row" onClick={() => router.push(n.link)}>
                  <span className={`pt-badge ${n.severity}`}><span className="dot" />{TIP_LABEL[n.tip] ?? n.tip}</span>
                  <div style={{ flex: 1 }}><div className="nm">{n.memberName}</div><div className="meta">{n.detail}</div></div>
                  <span style={{ color: 'var(--ink-mute)' }}>›</span>
                </div>
              ))}</div>}
        </div>
      </div>
    </div>
  );
}
