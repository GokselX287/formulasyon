'use client';

/* =====================================================================
   AntrenorHub — Kişisel Antrenör alt uygulaması giriş paneli.
   CalismaAlaniShell içinde render edilir (chrome dışarıdan gelir).
   Tile'lar standalone /pt/* rotalarına gider; canlı sayımlar /api/pt/*'ten.
   ===================================================================== */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './pt.css';

const Ico = {
  members: <svg viewBox="0 0 24 24"><path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3.4" /><path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.5a4 4 0 0 1 0 7" /></svg>,
  trainers: <svg viewBox="0 0 24 24"><path d="M6.5 12h11" /><path d="M4 9v6M7 7.5v9M17 7.5v9M20 9v6" /></svg>,
  calendar: <svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>,
  finance: <svg viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg>,
  bell: <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>,
  qr: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 21v.01M17 21h.01M21 17h.01" /></svg>,
};

type Counts = { members: number; active: number; trainers: number; alerts: number };

export default function AntrenorHub() {
  const router = useRouter();
  const [c, setC] = useState<Counts>({ members: 0, active: 0, trainers: 0, alerts: 0 });

  useEffect(() => {
    let alive = true;
    (async () => {
      const [m, t, n] = await Promise.all([
        fetch('/api/pt/members').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/pt/trainers').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/pt/notifications').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);
      if (!alive) return;
      const members = Array.isArray(m) ? m : [];
      setC({
        members: members.length,
        active: members.filter((x: any) => x.durum === 'aktif').length,
        trainers: Array.isArray(t) ? t.length : 0,
        alerts: Array.isArray(n) ? n.length : 0,
      });
    })();
    return () => { alive = false; };
  }, []);

  const Tile = ({ icon, t, s, to, count, warn, dark }: { icon: React.ReactNode; t: string; s: string; to: string; count?: number; warn?: boolean; dark?: boolean }) => (
    <button type="button" className={`pt-tile${dark ? ' dark' : ''}`} onClick={() => router.push(to)}>
      {count != null && <span className={`cnt${warn ? ' warn' : ''}`}>{count}</span>}
      <span className="ic">{icon}</span>
      <span><span className="t">{t}</span><span className="s" style={{ display: 'block' }}>{s}</span></span>
    </button>
  );

  return (
    <div className="pt">
      <div className="pt-stats" style={{ marginBottom: 18 }}>
        <div className="pt-stat pt-tray"><div className="v">{c.members}</div><div className="k">Üye</div><div className="ss">toplam kayıt</div></div>
        <div className="pt-stat pt-card"><div className="v">{c.active}</div><div className="k">Aktif üye</div><div className="ss">takip ediliyor</div></div>
        <div className="pt-stat pt-card"><div className="v">{c.trainers}</div><div className="k">Eğitmen</div><div className="ss">kayıtlı</div></div>
        <div className="pt-stat pt-dark"><div className="v" style={{ color: c.alerts ? '#ffd9d2' : '#F2F1ED' }}>{c.alerts}</div><div className="k">Bildirim</div><div className="ss">yönetici uyarısı</div></div>
      </div>

      <div className="pt-tiles">
        <Tile icon={Ico.members} t="Üyeler" s="Kayıt, profil, ölçüm" to="/pt/uyeler" count={c.members} />
        <Tile icon={Ico.trainers} t="Eğitmenler" s="Bilgi, program, satış" to="/pt/egitmenler" count={c.trainers} />
        <Tile icon={Ico.calendar} t="Takvim" s="Geliş-gidiş & dersler" to="/pt/takvim" />
        <Tile icon={Ico.finance} t="Finans" s="Gelir-gider, tahsilat" to="/pt/finans" />
        <Tile icon={Ico.bell} t="Bildirimler" s="Ölçüm, tahsilat, paket" to="/pt/bildirimler" count={c.alerts} warn={c.alerts > 0} />
        <Tile icon={Ico.qr} t="QR Gişe" s="Üye giriş kiosku" to="/pt/gise" dark />
      </div>
    </div>
  );
}
