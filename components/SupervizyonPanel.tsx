'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Printer } from 'lucide-react';

type Patient = { id: string; adSoyad: string; status: string };
type Seans = { id: string; patientId: string; tip?: string };

type SupRecord = {
  id: string;
  tarih: string;
  supervisor: string;
  format: string;
  duration: string;
  goal: string;
  selectedCases: string[];
  caseNotes: Record<string, { ozet: string; zorluk: string; feedbackType: string }>;
  tools: string[];
  notes: string;
  postNotes: string;
  status: string;
};

const EMPTY: Omit<SupRecord, 'id'> = {
  tarih: new Date().toISOString().slice(0, 10),
  supervisor: '', format: 'bireysel', duration: '', goal: '',
  selectedCases: [], caseNotes: {}, tools: [], notes: '', postNotes: '', status: 'hazirlanıyor',
};

const BDT_TOOLS = ['ABCDE Formu', 'Sokratik Sorgulama', 'Düşünce Günlüğü', 'Davranışsal Aktivasyon', 'Maruz Bırakma (ERP)', 'Bilişsel Yeniden Yapılandırma', 'Problem Çözme', 'Psikoeğitim'];
const ACT_TOOLS = ['Bilişsel Defüzyon', 'Değer Temas Çalışması', 'Matriks Çalışması', 'Kabul Egzersizleri', 'Şimdiki An Farkındalığı', 'Adanmış Eylem Planı', 'Yaratıcı Çaresizlik'];
const GEN_TOOLS = ['Rol Yapma', 'Boş Sandalye', 'Mindfulness Egzersizi', 'İletişim Becerileri', 'Travma İşleme (EMDR ipucu)', 'Şema Modu Çalışması', 'Ödev Gözden Geçirme'];

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

export default function SupervizyonPanel({ patients, seanslar }: { patients: Patient[]; seanslar: Seans[] }) {
  const [records, setRecords] = useState<SupRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SupRecord, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/supervizyon').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setRecords(data);
    });
  }, []);

  const activeRecord = records.find(r => r.id === activeId);

  const newRecord = () => {
    const id = `sup_${Date.now()}`;
    const rec: SupRecord = { id, ...EMPTY, tarih: new Date().toISOString().slice(0, 10) };
    setRecords(prev => [rec, ...prev]);
    setActiveId(id);
    setForm({ ...EMPTY, tarih: rec.tarih });
  };

  const save = async () => {
    if (!activeId) return;
    setSaving(true);
    await fetch(`/api/supervizyon/${activeId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setRecords(prev => prev.map(r => r.id === activeId ? { id: activeId, ...form } : r));
    setSaving(false);
  };

  const saveNew = async () => {
    if (!activeId) return;
    setSaving(true);
    await fetch('/api/supervizyon', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: activeId, ...form }),
    });
    setSaving(false);
  };

  const deleteRecord = async (id: string) => {
    if (!confirm('Bu süpervizyon kaydını silmek istiyor musunuz?')) return;
    await fetch(`/api/supervizyon/${id}`, { method: 'DELETE' });
    setRecords(prev => prev.filter(r => r.id !== id));
    if (activeId === id) { setActiveId(null); setForm(EMPTY); }
  };

  const selectRecord = (r: SupRecord) => {
    setActiveId(r.id);
    setForm({ tarih: r.tarih, supervisor: r.supervisor, format: r.format, duration: r.duration, goal: r.goal, selectedCases: r.selectedCases || [], caseNotes: r.caseNotes || {}, tools: r.tools || [], notes: r.notes, postNotes: r.postNotes, status: r.status });
  };

  const toggleCase = (pid: string) => {
    const sel = form.selectedCases.includes(pid)
      ? form.selectedCases.filter(x => x !== pid)
      : [...form.selectedCases, pid];
    const cn = { ...form.caseNotes };
    if (!cn[pid]) cn[pid] = { ozet: '', zorluk: '', feedbackType: 'teknik' };
    setForm(f => ({ ...f, selectedCases: sel, caseNotes: cn }));
  };

  const updateCaseNote = (pid: string, key: string, val: string) => {
    setForm(f => ({ ...f, caseNotes: { ...f.caseNotes, [pid]: { ...(f.caseNotes[pid] || { ozet: '', zorluk: '', feedbackType: 'teknik' }), [key]: val } } }));
  };

  const toggleTool = (tool: string) => {
    setForm(f => ({ ...f, tools: f.tools.includes(tool) ? f.tools.filter(t => t !== tool) : [...f.tools, tool] }));
  };

  const activePatients = patients.filter(p => p.status !== 'archived');
  const patientSeansCount = (pid: string) => seanslar.filter(s => s.patientId === pid).length;

  const anonCode = (idx: number) => `D${idx + 1}`;

  return (
    <div className="grid grid-cols-[220px_1fr] gap-6 min-h-[70vh]">
      {/* Left sidebar — record list */}
      <div className="space-y-2">
        <button onClick={newRecord} className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-2xl bg-[#0E0F12] text-white hover:bg-[#1A1B22] transition">
          <Plus className="w-3.5 h-3.5" /> Yeni Süpervizyon
        </button>
        <div className="space-y-1.5 mt-2">
          {records.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Henüz kayıt yok.</p>}
          {records.map(r => (
            <div key={r.id} className={cx('rounded-2xl border p-3 cursor-pointer transition group', r.id === activeId ? 'border-[#0E0F12] bg-gray-50' : 'border-gray-100 hover:border-gray-200')}>
              <div className="flex items-start justify-between" onClick={() => selectRecord(r)}>
                <div>
                  <p className="text-xs font-semibold text-[#0E0F12]">{r.tarih || '—'}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{r.supervisor || 'Süpervizör belirtilmedi'}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{r.format}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteRecord(r.id); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition p-0.5">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      {!activeId ? (
        <div className="flex items-center justify-center text-gray-400 text-sm">
          Sol panelden bir süpervizyon seçin veya yeni oluşturun.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0E0F12]">Süpervizyon Hazırlığı</h2>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-600">
                <Printer className="w-3.5 h-3.5" /> Yazdır
              </button>
              <button onClick={async () => { await save(); await saveNew(); }} disabled={saving} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-[#0E0F12] text-white hover:bg-[#1A1B22] transition disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Süpervizyon Bilgileri</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Tarih</label>
                <input type="date" value={form.tarih} onChange={e => setForm(f => ({ ...f, tarih: e.target.value }))} className="h-9 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#0E0F12]" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Süpervizör (opsiyonel)</label>
                <input type="text" value={form.supervisor} onChange={e => setForm(f => ({ ...f, supervisor: e.target.value }))} placeholder="Ad / Kurum" className="h-9 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#0E0F12]" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Format</label>
                <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} className="h-9 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#0E0F12] bg-white">
                  <option value="bireysel">Bireysel</option>
                  <option value="grup">Grup</option>
                  <option value="akran">Akran Süpervizyon</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Süre (dk)</label>
                <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="60" className="h-9 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#0E0F12]" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium block mb-1">Genel Hedef / Odak</label>
                <textarea value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="Bu süpervizyon seansından ne öğrenmek istiyorum?" rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0E0F12] resize-none" />
              </div>
            </div>
          </div>

          {/* Case selection */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Vaka Seçimi</p>
            <p className="text-xs text-gray-400 mb-4">Danışan isimleri süpervizyon formunda anonimleştirilir.</p>
            <div className="space-y-2">
              {activePatients.length === 0 && <p className="text-sm text-gray-400">Aktif danışan yok.</p>}
              {activePatients.map((p, idx) => {
                const checked = form.selectedCases.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-2xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition">
                    <input type="checkbox" checked={checked} onChange={() => toggleCase(p.id)} className="accent-[#0E0F12] w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-500 min-w-[28px]">{anonCode(idx)}</span>
                    <span className="text-sm text-[#0E0F12]">{p.adSoyad}</span>
                    <span className="text-xs text-gray-400 ml-auto">{patientSeansCount(p.id)} seans</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Selected case notes */}
          {form.selectedCases.length > 0 && (
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Seçilen Vakalar — Notlar</p>
              <div className="space-y-4">
                {form.selectedCases.map((pid, idx) => {
                  const p = patients.find(x => x.id === pid);
                  const n = form.caseNotes[pid] || { ozet: '', zorluk: '', feedbackType: 'teknik' };
                  const globalIdx = activePatients.findIndex(x => x.id === pid);
                  return (
                    <div key={pid} className="border border-gray-100 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0E0F12]">{anonCode(globalIdx >= 0 ? globalIdx : idx)}</span>
                        <select value={n.feedbackType} onChange={e => updateCaseNote(pid, 'feedbackType', e.target.value)} className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white outline-none focus:border-[#0E0F12]">
                          <option value="teknik">Teknik Geri Bildirim</option>
                          <option value="kavramsallaştırma">Kavramsallaştırma</option>
                          <option value="kisisel-etki">Kişisel Etki</option>
                          <option value="ilişki">Terapötik İlişki</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1">Kısa Vaka Özeti</label>
                          <textarea value={n.ozet} onChange={e => updateCaseNote(pid, 'ozet', e.target.value)} placeholder="Sunulan sorun, yaklaşım, mevcut aşama…" rows={3} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0E0F12] resize-none" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium block mb-1">Takıldığım An / Zorluk</label>
                          <textarea value={n.zorluk} onChange={e => updateCaseNote(pid, 'zorluk', e.target.value)} placeholder="Hangi noktada zorlandım?" rows={3} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0E0F12] resize-none" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tools */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Kullanılan / Planlanan Müdahale Araçları</p>
            {[['BDT Araçları', BDT_TOOLS], ['ACT Araçları', ACT_TOOLS], ['Genel / Diğer', GEN_TOOLS]].map(([label, tools]) => (
              <div key={label as string} className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">{label as string}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(tools as string[]).map(tool => (
                    <label key={tool} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition">
                      <input type="checkbox" checked={form.tools.includes(tool)} onChange={() => toggleTool(tool)} className="accent-[#0E0F12] w-4 h-4 flex-shrink-0" />
                      {tool}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* General notes */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Genel Notlar & Sorular</p>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Süpervizyona götürmek istediğim sorular, gözlemler, terapötik ilişki notları…" rows={4} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0E0F12] resize-none" />
          </div>

          {/* Post-supervision */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Süpervizyon Sonrası</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Durum</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="h-9 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#0E0F12] bg-white">
                  <option value="hazirlanıyor">Hazırlanıyor</option>
                  <option value="gönderildi">Gönderildi</option>
                  <option value="tamamlandı">Tamamlandı</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-gray-500 font-medium block mb-1">Süpervizyon Sonrası Notlar</label>
              <textarea value={form.postNotes} onChange={e => setForm(f => ({ ...f, postNotes: e.target.value }))} placeholder="Aldığım geri bildirimler, öğrendiklerim, uygulayacağım değişiklikler…" rows={4} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0E0F12] resize-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
