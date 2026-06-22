'use client';

/* Finans — aylık gelir/gider + satış + tahsilat takibi + gider ekle. */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/pt/pt.css';

const BACK = '/uygulama?tab=calisma-alani&room=antrenor';
const tl = (n: number) => `${Number(n || 0).toLocaleString('tr-TR')} TL`;
const ymNow = () => new Date().toISOString().slice(0, 7);
const monthOptions = () => Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - i); return d.toISOString().slice(0, 7); });

export default function PtFinans() {
  const router = useRouter();
  const [month, setMonth] = useState(ymNow());
  const [fin, setFin] = useState<any>({ income: 0, expense: 0, net: 0, byCategory: [], sales: { total: 0, packages: [] } });
  const [expenses, setExpenses] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  const load = useCallback(() => {
    fetch(`/api/pt/finance?month=${month}`).then((r) => r.json()).then(setFin).catch(() => {});
    fetch(`/api/pt/expenses?month=${month}`).then((r) => r.json()).then((d) => setExpenses(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`/api/pt/collections`).then((r) => r.json()).then((d) => setCollections(Array.isArray(d) ? d : [])).catch(() => {});
  }, [month]);
  useEffect(() => { load(); }, [load]);

  const addExpense = async () => {
    const kategori = prompt('Kategori (kira/maas/ekipman/fatura/diger):', 'diger') || 'diger';
    const aciklama = prompt('Açıklama:', '') || '';
    const tutarS = prompt('Tutar (TL):', ''); if (!tutarS) return;
    await fetch('/api/pt/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kategori, aciklama, tutar: Number(tutarS) }) });
    load();
  };
  const markPaid = async (id: string, durum: string) => { await fetch(`/api/pt/collections/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ durum }) }); load(); };
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="pt pt-stage">
      <div className="pt-wrap">
        <button className="pt-back" onClick={() => router.push(BACK)}><span className="chev">‹</span> Kişisel Antrenör</button>
        <div className="pt-head" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div><div className="pt-eyebrow">Finans</div><h1 className="pt-title">Gelir & gider</h1></div>
          <select className="pt-select" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(e.target.value)}>{monthOptions().map((m) => <option key={m} value={m}>{m}</option>)}</select>
        </div>

        <div className="pt-stats" style={{ marginBottom: 16 }}>
          <div className="pt-stat pt-card"><div className="v" style={{ color: 'var(--ok)' }}>{tl(fin.income)}</div><div className="k">Gelir (tahsilat)</div></div>
          <div className="pt-stat pt-card"><div className="v" style={{ color: 'var(--risk)' }}>{tl(fin.expense)}</div><div className="k">Gider</div></div>
          <div className="pt-stat pt-tray"><div className="v">{tl(fin.net)}</div><div className="k">Net</div></div>
          <div className="pt-stat pt-dark"><div className="v">{tl(fin.sales?.total ?? 0)}</div><div className="k">Açılan paket</div><div className="ss">{fin.sales?.packages?.length ?? 0} paket</div></div>
        </div>

        {/* Tahsilat takibi */}
        <div className="pt-card" style={{ padding: '18px 20px', marginBottom: 14 }}>
          <b style={{ fontSize: 15 }}>Tahsilat takibi</b>
          {collections.length === 0 ? <p style={{ color: 'var(--ink-mute)', fontSize: 13, marginTop: 8 }}>Kayıtlı ödeme sözü yok. (Üye dosyasından eklenir.)</p>
            : <div className="pt-list" style={{ marginTop: 6 }}>{collections.map((c) => {
              const overdue = c.durum === 'bekleyen' && c.soz_tarihi < today;
              return (
                <div key={c.id} className="pt-row" style={{ cursor: 'default' }}>
                  <div style={{ flex: 1 }}><div className="nm">{c.member_ad ?? '—'}</div><div className="meta">Söz: {c.soz_tarihi}{c.tutar ? ` · ${tl(c.tutar)}` : ''}</div></div>
                  <span className={`pt-badge ${c.durum === 'odendi' ? 'ok' : overdue ? 'risk' : 'warn'}`}><span className="dot" />{c.durum === 'odendi' ? 'Ödendi' : overdue ? 'Gecikti' : 'Bekliyor'}</span>
                  {c.durum !== 'odendi' && <button className="pt-btn" style={{ padding: '6px 12px' }} onClick={() => markPaid(c.id, 'odendi')}>Ödendi</button>}
                </div>
              );
            })}</div>}
        </div>

        {/* Giderler */}
        <div className="pt-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b style={{ fontSize: 15 }}>Giderler ({month})</b><button className="pt-btn ghost" onClick={addExpense}>+ Gider ekle</button></div>
          {expenses.length === 0 ? <p style={{ color: 'var(--ink-mute)', fontSize: 13, marginTop: 8 }}>Bu ay gider yok.</p>
            : <div className="pt-list" style={{ marginTop: 6 }}>{expenses.map((e) => (
              <div key={e.id} className="pt-row" style={{ cursor: 'default' }}>
                <div style={{ flex: 1 }}><div className="nm">{e.kategori ?? 'diğer'}</div><div className="meta">{e.aciklama || '—'} · {e.tarih}</div></div>
                <b style={{ color: 'var(--risk)' }}>{tl(e.tutar)}</b>
              </div>
            ))}</div>}
        </div>
      </div>
    </div>
  );
}
