'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

type Patient = { id: string; adSoyad: string };

type Appt = {
  id: string;
  clientId: string | null;
  clientName: string;
  tarih: string;
  saat: string;
  sure: number;
  not: string;
  done: boolean;
  source?: 'calendar' | 'db';
};

type Bildirim = {
  id: string;
  clientId: string;
  clientName: string;
  seansNo: number;
  randevuTarihi: string;
  randevuSaati: string;
  durum: string;
};

type FormLink = {
  id: string;
  token: string;
  client_id: string;
  form_tipi: string;
  olcek_id: string | null;
  olcek_ad: string | null;
  aktif: number;
};

type FormYanit = {
  id: string;
  token: string;
  client_id: string;
  submitted_at: string;
  form_tipi: string;
};

// ── helpers ──────────────────────────────────────────────────
function nowMs() { return Date.now(); }

function apptEndMs(a: Appt): number {
  const [h, m] = a.saat.split(':').map(Number);
  const base = new Date(a.tarih + 'T00:00:00').getTime();
  return base + (h * 60 + m + (a.sure ?? 50)) * 60000;
}

function apptStartMs(a: Appt): number {
  const [h, m] = a.saat.split(':').map(Number);
  return new Date(a.tarih + 'T00:00:00').getTime() + (h * 60 + m) * 60000;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function weekLaterStr() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function fmtSaat(saat: string, sure: number) {
  const [h, m] = saat.split(':').map(Number);
  const endMs = (h * 60 + m + sure) * 60000;
  const eh = Math.floor(endMs / 3600000);
  const em = Math.floor((endMs % 3600000) / 60000);
  return `${pad2(h)}:${pad2(m)} – ${pad2(eh)}:${pad2(em)}`;
}

function pad2(n: number) { return String(n).padStart(2, '0'); }

function daysLabel(tarih: string): string {
  const today = todayStr();
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();
  if (tarih === today) return 'Bugün';
  if (tarih === tomorrow) return 'Yarın';
  return new Date(tarih + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function minutesUntil(a: Appt): number {
  return Math.round((apptStartMs(a) - nowMs()) / 60000);
}

// ── UntilBadge ────────────────────────────────────────────────
function UntilBadge({ mins }: { mins: number }) {
  if (mins <= 0) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">Devam ediyor</span>;
  if (mins < 30) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-semibold">{mins} dk sonra</span>;
  if (mins < 60) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold">{mins} dk sonra</span>;
  const h = Math.floor(mins / 60); const m = mins % 60;
  if (h < 24) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">{h > 0 ? `${h} sa ${m > 0 ? m + ' dk' : ''}` : `${m} dk`} sonra</span>;
  return null;
}

// ── ApptCard ──────────────────────────────────────────────────
function ApptCard({ appt, bildirim, formLinks, formYanitlar, now }: {
  appt: Appt;
  bildirim?: Bildirim;
  formLinks: FormLink[];
  formYanitlar: FormYanit[];
  now: number;
}) {
  const mins = Math.round((apptStartMs(appt) - now) / 60000);
  const isToday = appt.tarih === todayStr();
  const isSoon = mins >= 0 && mins < 60;
  const isOngoing = mins < 0 && now < apptEndMs(appt);

  // Form linkleri bu danışana ait
  const clientLinks = formLinks.filter(l => l.client_id === appt.clientId && l.aktif === 1);
  const olcekLink = clientLinks.find(l => l.form_tipi === 'olcek');
  const onFormLink = clientLinks.find(l => l.form_tipi === 'on_form');

  // Bu danışanın bugün gönderdiği yanıtlar
  const todayYanitlar = formYanitlar.filter(y =>
    y.client_id === appt.clientId &&
    y.submitted_at?.slice(0, 10) === appt.tarih
  );
  const hasOlcekYanit = todayYanitlar.some(y => y.form_tipi === 'olcek');
  const hasOnFormYanit = todayYanitlar.some(y => y.form_tipi === 'on_form');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${baseUrl}/form/${token}`);
  };

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      isOngoing ? 'border-blue-300 bg-blue-50'
      : isSoon   ? 'border-orange-200 bg-orange-50'
      : 'border-gray-100 bg-white'
    }`}>
      {/* Üst satır */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#0E0F12] truncate">
              {appt.clientName || '—'}
            </span>
            {appt.source === 'calendar' && (
              <span title="macOS Takvim'den" className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-medium flex-shrink-0">📅 Takvim</span>
            )}
            {bildirim && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-medium">
                {bildirim.seansNo}. Seans
              </span>
            )}
            {isToday && <UntilBadge mins={mins} />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>🕐 {fmtSaat(appt.saat, appt.sure)}</span>
            <span>⏱ {appt.sure} dk</span>
            {appt.not && <span className="truncate text-gray-400">📝 {appt.not}</span>}
          </div>
        </div>

        {/* Durum ikonu */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
          isOngoing ? 'bg-blue-100' : isSoon ? 'bg-orange-100' : 'bg-gray-100'
        }`}>
          {isOngoing ? '🟢' : isSoon ? '⏰' : '📅'}
        </div>
      </div>

      {/* Seans öncesi hatırlatmalar */}
      {appt.clientId && (clientLinks.length > 0 || todayYanitlar.length > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Seans Öncesi</p>

          {/* Ön form */}
          {onFormLink && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${hasOnFormYanit ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {hasOnFormYanit ? '✓' : '○'}
                </span>
                <span className="text-xs text-gray-600">Seans öncesi form</span>
                {hasOnFormYanit && <span className="text-[10px] text-green-600 font-medium">• Yanıt alındı</span>}
              </div>
              {!hasOnFormYanit && (
                <button
                  onClick={() => copyLink(onFormLink.token)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                >
                  📋 Link kopyala
                </button>
              )}
            </div>
          )}

          {/* Ölçek */}
          {olcekLink && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${hasOlcekYanit ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {hasOlcekYanit ? '✓' : '○'}
                </span>
                <span className="text-xs text-gray-600">{olcekLink.olcek_ad ?? 'Ölçek'}</span>
                {hasOlcekYanit && <span className="text-[10px] text-green-600 font-medium">• Yanıt alındı</span>}
              </div>
              {!hasOlcekYanit && (
                <button
                  onClick={() => copyLink(olcekLink.token)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                >
                  📋 Link kopyala
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function RandevuPanel({ patients }: { patients: Patient[] }) {
  const [appts, setAppts]           = useState<Appt[]>([]);
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [formLinks, setFormLinks]   = useState<FormLink[]>([]);
  const [formYanitlar, setFormYanitlar] = useState<FormYanit[]>([]);
  const [now, setNow]               = useState(nowMs);
  const [loading, setLoading]       = useState(true);
  const timerRef                    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Her dakika saat güncelle → geçmiş randevular kaybolur
  useEffect(() => {
    timerRef.current = setInterval(() => setNow(nowMs()), 30000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [ra, cal, bi, fl, fy] = await Promise.all([
      fetch('/api/randevu').then(r => r.json()).catch(() => []),
      fetch('/api/takvim-yaklasan').then(r => r.json()).catch(() => []),
      fetch('/api/seans-bildirimleri').then(r => r.json()).catch(() => []),
      fetch('/api/form-link').then(r => r.json()).catch(() => []),
      fetch('/api/form-yanitlari').then(r => r.json()).catch(() => []),
    ]);

    // DB randevuları + macOS Calendar randevuları birleştir (deduplikasyon: aynı tarih+saat+ad varsa DB öncelikli)
    const dbAppts: Appt[] = (Array.isArray(ra) ? ra : []).map((a: Appt) => ({ ...a, source: 'db' as const }));
    const calAppts: Appt[] = (Array.isArray(cal) ? cal : []).map((a: Appt) => ({ ...a, source: 'calendar' as const }));

    // Calendar'dan gelenler için: DB'de aynı tarih+saat+ad yoksa ekle
    const merged: Appt[] = [...dbAppts];
    for (const ca of calAppts) {
      const exists = dbAppts.some(db =>
        db.tarih === ca.tarih &&
        db.saat === ca.saat &&
        db.clientName.trim().toLowerCase() === ca.clientName.trim().toLowerCase()
      );
      if (!exists) merged.push(ca);
    }

    setAppts(merged);
    setBildirimler(Array.isArray(bi) ? bi : []);
    setFormLinks(Array.isArray(fl) ? fl : []);
    setFormYanitlar(Array.isArray(fy) ? fy : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtre: seans bitmemiş + önümüzdeki 7 gün
  const visible = appts.filter(a =>
    !a.done &&
    apptEndMs(a) > now &&
    a.tarih <= weekLaterStr()
  ).sort((a, b) => apptStartMs(a) - apptStartMs(b));

  // Güne göre grupla
  const groups = visible.reduce<Record<string, Appt[]>>((acc, a) => {
    if (!acc[a.tarih]) acc[a.tarih] = [];
    acc[a.tarih].push(a);
    return acc;
  }, {});
  const sortedDays = Object.keys(groups).sort();

  // Bildirim eşleştir: randevu id → bildirim
  const bildirimByRandevuId = bildirimler.reduce<Record<string, Bildirim>>((acc, b) => {
    acc[b.id] = b;  // bildirim tablosunda randevu_id yok direkt, clientId + tarih eşleşir
    return acc;
  }, {});

  function findBildirim(a: Appt): Bildirim | undefined {
    return bildirimler.find(b =>
      b.clientId === a.clientId &&
      b.randevuTarihi === a.tarih &&
      b.randevuSaati === a.saat
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-semibold">Takvim</p>
          <h1 className="text-xl font-semibold mt-0.5 text-[#0E0F12] dark:text-white">Seansa Hazırlık</h1>
          <p className="text-xs text-gray-400 mt-0.5">Önümüzdeki 7 günün randevuları</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#0E0F12] tabular-nums">
            {visible.length}
          </div>
          <div className="text-xs text-gray-400">randevu</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-gray-400">Yükleniyor…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm font-medium text-gray-600">Önümüzdeki 7 günde randevu yok</p>
          <p className="text-xs text-gray-400 mt-1">Takvim sekmesinden yeni randevu oluşturabilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDays.map(tarih => (
            <div key={tarih}>
              {/* Gün başlığı */}
              <div className="flex items-center gap-3 mb-2">
                <div className={`text-xs font-bold px-3 py-1 rounded-full ${
                  tarih === todayStr()
                    ? 'bg-[#0E0F12] text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {daysLabel(tarih)}
                </div>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] text-gray-400">{groups[tarih].length} randevu</span>
              </div>

              <div className="space-y-2">
                {groups[tarih].map(a => (
                  <ApptCard
                    key={a.id}
                    appt={a}
                    bildirim={findBildirim(a)}
                    formLinks={formLinks}
                    formYanitlar={formYanitlar}
                    now={now}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
