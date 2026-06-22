'use client';

import { useEffect, useState } from 'react';
import type { FourP } from '@/lib/types';
import DanisanOzetIcerik, { buildOzetPrintHtml, hasOzetContent, danisanKodu, type CycleNode } from './DanisanOzetIcerik';

// ──────────────────────────────────────────────────────────────────────────
// Danışan Sayfası — danışana sunulacak sade özetin modal görünümü.
// "PDF olarak indir": tarayıcı yazdır→PDF (ek bağımlılık yok).
// "SMS ile gönder": token'lı herkese-açık /ozet/[token] linki oluşturup
// danışanın telefonuna NetGSM ile yollar. Klinik not/risk gösterilmez.
// ──────────────────────────────────────────────────────────────────────────

export type DanisanSayfasiModalProps = {
  open: boolean;
  onClose: () => void;
  clientName?: string;
  clientId?: string;
  clientPhone?: string;
  fourP?: FourP;
  summary?: string;
  interventionsPlanned?: string[];
};

const INK = '#0E0F12';
const SOFT = '#6B7280';
const LINE = '#E5E7EB';

export default function DanisanSayfasiModal(props: DanisanSayfasiModalProps) {
  const { open, onClose, clientName, clientId, clientPhone, fourP, summary, interventionsPlanned = [] } = props;
  const [phone, setPhone] = useState(clientPhone ?? '');
  const [smsState, setSmsState] = useState<'' | 'sending' | 'sent' | 'error'>('');
  const [smsMsg, setSmsMsg] = useState('');
  const [cycle, setCycle] = useState<CycleNode[] | undefined>(undefined);

  useEffect(() => {
    if (!open || !clientId) { setCycle(undefined); return; }
    try {
      const raw = localStorage.getItem(`vaka_cycle_${clientId}`);
      setCycle(raw ? JSON.parse(raw) : undefined);
    } catch { setCycle(undefined); }
  }, [open, clientId]);

  if (!open) return null;
  const name = clientName?.trim() || 'Danışan';
  const kod = danisanKodu(name);
  const data = { name, summary, fourP, interventionsPlanned, cycle };

  const printPdf = () => {
    const w = window.open('', '_blank', 'width=820,height=900');
    if (!w) return;
    w.document.write(buildOzetPrintHtml(data));
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch { /* kullanıcı elle yazdırır */ } }, 350);
  };

  const sendSms = async () => {
    const to = phone.trim();
    if (!to) { setSmsState('error'); setSmsMsg('Telefon numarası gerekli.'); return; }
    if (!hasOzetContent(data)) { setSmsState('error'); setSmsMsg('Önce formülasyona içerik ekleyin.'); return; }
    setSmsState('sending'); setSmsMsg('');
    try {
      const linkRes = await fetch('/api/form-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientId ?? '0', clientName: name, formTipi: 'danisan-ozet', payload: data }),
      });
      if (!linkRes.ok) throw new Error('link');
      const link = await linkRes.json();
      const url = `${window.location.origin}/ozet/${link.token}`;
      const smsRes = await fetch('/api/sms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: to, name, message: `Merhaba ${name}, terapistinle çalışmanın özeti: ${url}`, trigger_type: 'manual' }),
      });
      const sms = await smsRes.json().catch(() => ({} as any));
      if (smsRes.ok && (sms.ok || sms.status === 'sent' || sms.status === 'queued' || sms.id)) {
        setSmsState('sent'); setSmsMsg('Özet linki SMS ile gönderildi.');
      } else {
        setSmsState('error'); setSmsMsg(sms.error || 'SMS gönderilemedi — Netgsm ayarlarını kontrol edin.');
      }
    } catch {
      setSmsState('error'); setSmsMsg('Gönderim sırasında hata oluştu.');
    }
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(4px)', padding: 16,
  };
  const card: React.CSSProperties = {
    width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', background: '#fff',
    borderRadius: 24, boxShadow: '0 24px 60px -12px rgba(0,0,0,.3)',
  };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={card} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '22px 26px 0' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: SOFT }}>Vaka Sunumu</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 600, fontSize: 26, margin: '4px 0 0', color: INK }}>{kod}</h2>
            <p style={{ color: SOFT, margin: '4px 0 0', fontSize: 14 }}>Danışana sunulabilir, anonim vaka özeti.</p>
          </div>
          <button onClick={onClose} aria-label="Kapat" style={{ border: 'none', background: '#F3F4F6', borderRadius: 12, width: 34, height: 34, cursor: 'pointer', color: SOFT, fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: '0 26px' }}>
          <DanisanOzetIcerik data={data} />
        </div>

        {/* SMS ile gönder */}
        <div style={{ padding: '18px 26px 0', borderTop: `1px solid ${LINE}`, marginTop: 18 }}>
          <div style={{ fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase', color: SOFT, margin: '0 0 10px' }}>Danışana gönder</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefon (05xx…)"
              inputMode="tel"
              style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 10, padding: '9px 11px', font: 'inherit', fontSize: 14 }}
            />
            <button
              onClick={sendSms}
              disabled={smsState === 'sending'}
              style={{ border: `1px solid ${LINE}`, background: '#fff', color: INK, borderRadius: 10, padding: '9px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {smsState === 'sending' ? 'Gönderiliyor…' : 'SMS ile link gönder'}
            </button>
          </div>
          {smsMsg && (
            <p style={{ margin: '8px 0 0', fontSize: 12.5, color: smsState === 'sent' ? '#166534' : smsState === 'error' ? '#B91C1C' : SOFT }}>{smsMsg}</p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '20px 26px 24px' }}>
          <button onClick={onClose} style={{ border: `1px solid ${LINE}`, background: '#fff', color: '#374151', borderRadius: 12, padding: '10px 16px', fontSize: 14, cursor: 'pointer' }}>Kapat</button>
          <button onClick={printPdf} style={{ border: 'none', background: INK, color: '#fff', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>PDF olarak indir</button>
        </div>
      </div>
    </div>
  );
}
