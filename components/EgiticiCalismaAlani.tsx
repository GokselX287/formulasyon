'use client';
import React, { useState, useEffect } from 'react';
import {
  Users, Plus, FileText, Zap, Target, ChevronRight,
  Pencil, Trash2, CheckCircle2, Circle, BookOpen, Folder,
  X, Save, ChevronDown, ChevronUp, StickyNote, BarChart2,
  GraduationCap, Calendar, Hash, MessageSquare, Layers,
  TrendingUp, ClipboardList, Star, AlertTriangle,
  MessageCircle, Smartphone, Send, UserPlus, UserMinus,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PieChart, Pie, Cell,
  XAxis, YAxis, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProcessNote {
  id: string; date: string;
  category: 'gozlem' | 'gucu' | 'gelisim' | 'odev' | 'genel';
  content: string;
}

interface ScaleMeasurement {
  id: string; date: string; label: string;
  aaq2: number | null;    // AAQ-II (7–49) ↓ daha esnek
  cfq: number | null;     // CFQ (7–49)   ↓ daha az kaynaşmış
  maas: number | null;    // MAAS (1–6)   ↑ daha farkındalıklı
  // Hexaflex boyutları (1–10) — eğitici değerlendirmesi
  hexKabul: number; hexDefuzyon: number; hexSimdikiAn: number;
  hexBaglamsal: number; hexDegerler: number; hexEylem: number;
  therapistFlex: number | null; // Eğiticinin genel esneklik puanı 1–10
  notes: string;
}

interface LessonRecord {
  id: string; date: string; name: string;
  level: 'Temel' | 'Orta' | 'İleri';
  module: string;
  attended: boolean; isVoluntary: boolean;
  absenceReason: string;
  absenceType: '' | 'kaçınma' | 'pratik' | 'hastalık' | 'diğer';
  activityScore: number;      // 0–10
  voluntarinessScore: number; // 0–10
}

interface OutlineItem { id: string; text: string; done: boolean; note: string }
interface OutlineSection { id: string; title: string; items: OutlineItem[] }
interface WorkspaceFile { id: string; name: string; description: string; date: string; category: string }
interface SessionLog {
  id: string; date: string; time: string; mode: string; duration: number; speed: number;
  sequential: boolean; educatorName: string; therapistName: string;
  participants: { name: string; role: string }[]; yaziciNotes: string;
}

interface Trainee {
  id: string; name: string; startDate: string;
  level: 'başlangıç' | 'orta' | 'ileri';
  phone?: string;
  notes: ProcessNote[];
  measurements: ScaleMeasurement[];
  lessons: LessonRecord[];
}

interface Group {
  id: string;
  name: string;
  description: string;
  traineeIds: string[];
  createdAt: string;
}

interface Workspace {
  educatorName: string; trainees: Trainee[];
  outlines: OutlineSection[]; files: WorkspaceFile[]; generalNote: string;
  groups: Group[];
}

type Section = 'ozet' | 'adaylar' | 'gruplar' | 'seanslar' | 'notlar' | 'dosyalar' | 'anahatlar';
type TraineeTab = 'notlar' | 'olcekler' | 'dersler' | 'skorlar';

// ─── Constants ────────────────────────────────────────────────────────────────
const NOTE_CATS: Record<string, { label: string; color: string; bg: string }> = {
  gozlem: { label: 'Gözlem',    color: '#1A5276', bg: '#EEF5FF' },
  gucu:   { label: 'Güçlü Yan', color: '#1E8449', bg: '#EEFFF5' },
  gelisim:{ label: 'Gelişim',   color: '#784212', bg: '#FFF8EE' },
  odev:   { label: 'Ödev',      color: '#6D3B8A', bg: '#F5EEFF' },
  genel:  { label: 'Genel',     color: '#555',    bg: '#F5F5F5' },
};
const LEVELS: Record<string, { label: string; color: string }> = {
  'başlangıç': { label: 'Başlangıç', color: '#1E8449' },
  'orta':      { label: 'Orta',      color: '#784212' },
  'ileri':     { label: 'İleri',     color: '#C0392B' },
};
const LESSON_LEVELS = ['Temel', 'Orta', 'İleri'] as const;
const ABSENCE_TYPES = [
  { value: 'kaçınma', label: 'Kaçınma',  color: '#C0392B' },
  { value: 'pratik',  label: 'Pratik',   color: '#1A5276' },
  { value: 'hastalık',label: 'Hastalık', color: '#1E8449' },
  { value: 'diğer',   label: 'Diğer',    color: '#888'    },
] as const;
const CHART_COLORS = ['#C0392B', '#1A5276', '#1E8449', '#784212', '#6D3B8A', '#E67E22'];

const EMPTY_WS: Workspace = {
  educatorName: '', trainees: [],
  outlines: [{
    id: 'default', title: 'ACT Temel Eğitim',
    items: [
      { id: '1', text: 'Psikolojik Esneklik Modeli', done: false, note: '' },
      { id: '2', text: 'Kabul & Defüzyon teknikleri', done: false, note: '' },
      { id: '3', text: 'Şimdiki An farkındalığı uygulamaları', done: false, note: '' },
      { id: '4', text: 'Bağlamsal Benlik egzersizleri', done: false, note: '' },
      { id: '5', text: 'Değer netleştirme çalışması', done: false, note: '' },
      { id: '6', text: 'Adanmış Eylem & SMART hedefler', done: false, note: '' },
      { id: '7', text: 'Hexaflex Dancing pratik seansları', done: false, note: '' },
      { id: '8', text: 'Vaka formülasyonu entegrasyonu', done: false, note: '' },
    ],
  }],
  files: [], generalNote: '', groups: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2);
const today = () => new Date().toLocaleDateString('tr-TR');
const load = (): Workspace => { try { return { ...EMPTY_WS, ...JSON.parse(localStorage.getItem('act-egitici') || '{}') }; } catch { return EMPTY_WS; } };
const persist = (ws: Workspace) => { try { localStorage.setItem('act-egitici', JSON.stringify(ws)); } catch { /* */ } };
const loadSessions = (): SessionLog[] => { try { return JSON.parse(localStorage.getItem('act-session-logs') || '[]'); } catch { return []; } };

// ─── Scale input helper ───────────────────────────────────────────────────────
function NumInput({ label, value, min, max, step = 1, onChange, hint }: {
  label: string; value: number | null; min: number; max: number; step?: number;
  onChange: (v: number | null) => void; hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-0.5">{label}</label>
      {hint && <div className="text-xs text-gray-300 mb-1">{hint}</div>}
      <input
        type="number" min={min} max={max} step={step}
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose-300"
      />
    </div>
  );
}

// ─── Ölçek Gelişimi Paneli ────────────────────────────────────────────────────
function OlceklerPanel({ trainee, onUpdate }: { trainee: Trainee; onUpdate: (t: Trainee) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<ScaleMeasurement, 'id'>>({
    date: today(), label: '', aaq2: null, cfq: null, maas: null,
    hexKabul: 5, hexDefuzyon: 5, hexSimdikiAn: 5, hexBaglamsal: 5, hexDegerler: 5, hexEylem: 5,
    therapistFlex: null, notes: '',
  });

  const save = () => {
    const m: ScaleMeasurement = { id: uid(), ...form };
    onUpdate({ ...trainee, measurements: [...trainee.measurements, m].sort((a, b) => a.date.localeCompare(b.date)) });
    setAdding(false);
    setForm({ date: today(), label: '', aaq2: null, cfq: null, maas: null, hexKabul: 5, hexDefuzyon: 5, hexSimdikiAn: 5, hexBaglamsal: 5, hexDegerler: 5, hexEylem: 5, therapistFlex: null, notes: '' });
  };

  const deleteMeasurement = (id: string) =>
    onUpdate({ ...trainee, measurements: trainee.measurements.filter(m => m.id !== id) });

  const ms = trainee.measurements;
  const last = ms[ms.length - 1];

  // Line chart data
  const lineData = ms.map((m, i) => ({
    name: m.label || `#${i + 1}`,
    'AAQ-II': m.aaq2,
    'CFQ': m.cfq,
    'MAAS (×8)': m.maas != null ? +(m.maas * 8).toFixed(1) : null,
    'Esneklik': m.therapistFlex != null ? +(m.therapistFlex * 4.9).toFixed(1) : null,
  }));

  // Radar data (latest)
  const radarData = last ? [
    { subject: 'Kabul', A: last.hexKabul },
    { subject: 'Defüzyon', A: last.hexDefuzyon },
    { subject: 'Şimdiki An', A: last.hexSimdikiAn },
    { subject: 'Bağlamsal Benlik', A: last.hexBaglamsal },
    { subject: 'Değerler', A: last.hexDegerler },
    { subject: 'Adanmış Eylem', A: last.hexEylem },
  ] : [];

  return (
    <div className="space-y-5 pt-3">
      {/* Add measurement */}
      {!adding ? (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-medium">
          <Plus size={13} /> Yeni ölçüm ekle
        </button>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
          <div className="font-semibold text-sm text-gray-700">Yeni Ölçüm Girişi</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-0.5">Tarih</label>
              <input type="date" value={form.date.split('.').reverse().join('-')}
                onChange={e => { const [y,m,d]=e.target.value.split('-'); setForm(f=>({...f,date:`${d}.${m}.${y}`})); }}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-0.5">Etiket</label>
              <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))}
                placeholder="Ön-test, Hafta 4…"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose-300" />
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Standart Ölçekler</div>
          <div className="grid grid-cols-3 gap-3">
            <NumInput label="AAQ-II" hint="7–49 ↓ iyi" min={7} max={49} value={form.aaq2} onChange={v=>setForm(f=>({...f,aaq2:v}))} />
            <NumInput label="CFQ" hint="7–49 ↓ iyi" min={7} max={49} value={form.cfq} onChange={v=>setForm(f=>({...f,cfq:v}))} />
            <NumInput label="MAAS" hint="1–6 ↑ iyi" min={1} max={6} step={0.1} value={form.maas} onChange={v=>setForm(f=>({...f,maas:v}))} />
          </div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hexaflex Boyutları (1–10)</div>
          <div className="grid grid-cols-3 gap-3">
            {(['hexKabul','hexDefuzyon','hexSimdikiAn','hexBaglamsal','hexDegerler','hexEylem'] as const).map(key => {
              const labels: Record<string,string> = { hexKabul:'Kabul', hexDefuzyon:'Defüzyon', hexSimdikiAn:'Şimdiki An', hexBaglamsal:'Bağlamsal Benlik', hexDegerler:'Değerler', hexEylem:'Adanmış Eylem' };
              return (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-500 block mb-0.5">{labels[key]}</label>
                  <input type="range" min={1} max={10} value={form[key]}
                    onChange={e=>setForm(f=>({...f,[key]:+e.target.value}))}
                    className="w-full accent-rose-500" />
                  <div className="text-center text-xs font-bold text-rose-600">{form[key]}</div>
                </div>
              );
            })}
          </div>
          <NumInput label="Genel Terapist Esneklik Skoru (1–10)" hint="Eğiticinin genel değerlendirmesi" min={1} max={10} step={0.5} value={form.therapistFlex} onChange={v=>setForm(f=>({...f,therapistFlex:v}))} />
          <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
            placeholder="Notlar…" rows={2}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none outline-none focus:border-gray-400" />
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              <Save size={12}/> Kaydet
            </button>
            <button onClick={()=>setAdding(false)} className="text-xs text-gray-400 px-2">İptal</button>
          </div>
        </div>
      )}

      {ms.length === 0 && !adding && (
        <div className="text-center py-8 text-gray-300 text-sm">
          <TrendingUp size={28} className="mx-auto mb-2 opacity-30" />
          Henüz ölçüm yok. İlk ölçümü ekleyin.
        </div>
      )}

      {ms.length > 0 && (
        <>
          {/* Trend line chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-rose-500"/> Ölçek Trend Grafiği
              <span className="text-xs text-gray-400 font-normal">(MAAS ×8, Esneklik ×4.9 — karşılaştırılabilir ölçek)</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData} margin={{top:5,right:10,left:-20,bottom:0}}>
                <XAxis dataKey="name" tick={{fontSize:10}} />
                <YAxis tick={{fontSize:10}} domain={[0,50]}/>
                <Tooltip contentStyle={{fontSize:11}}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Line type="monotone" dataKey="AAQ-II" stroke="#C0392B" strokeWidth={2} dot={{r:4}} connectNulls />
                <Line type="monotone" dataKey="CFQ" stroke="#1A5276" strokeWidth={2} dot={{r:4}} connectNulls />
                <Line type="monotone" dataKey="MAAS (×8)" stroke="#1E8449" strokeWidth={2} dot={{r:4}} connectNulls />
                <Line type="monotone" dataKey="Esneklik" stroke="#784212" strokeWidth={2} strokeDasharray="5 5" dot={{r:4}} connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-rose-500 inline-block"/>AAQ-II ↓ azalması = esnekleşme</div>
              <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-700 inline-block"/>CFQ ↓ azalması = defüzyon</div>
              <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-700 inline-block"/>MAAS ↑ artışı = farkındalık</div>
            </div>
          </div>

          {/* Radar chart */}
          {last && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Star size={14} className="text-amber-500"/> Hexaflex Boyut Profili
                <span className="text-xs text-gray-400 font-normal">({last.label || 'Son ölçüm'} · {last.date})</span>
              </div>
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width="55%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{fontSize:10}}/>
                    <Radar name="Skor" dataKey="A" stroke="#C0392B" fill="#C0392B" fillOpacity={0.25} />
                    <Tooltip contentStyle={{fontSize:11}}/>
                  </RadarChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {radarData.map(d => (
                    <div key={d.subject}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-600">{d.subject}</span>
                        <span className="font-bold text-rose-600">{d.A}/10</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-full bg-rose-400 rounded-full" style={{width:`${d.A*10}%`}}/>
                      </div>
                    </div>
                  ))}
                  {last.therapistFlex != null && (
                    <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="text-xs font-semibold text-amber-700">Genel Esneklik Skoru: {last.therapistFlex}/10</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Measurement list */}
          <div className="space-y-2">
            {[...ms].reverse().map(m => (
              <div key={m.id} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-100 text-xs">
                <div className="flex-1">
                  <span className="font-semibold text-gray-700">{m.label || '—'}</span>
                  <span className="text-gray-400 ml-2">{m.date}</span>
                  <span className="ml-3 text-gray-500">
                    {m.aaq2 != null && `AAQ: ${m.aaq2} `}
                    {m.cfq != null && `CFQ: ${m.cfq} `}
                    {m.maas != null && `MAAS: ${m.maas} `}
                    {m.therapistFlex != null && `Esneklik: ${m.therapistFlex}/10`}
                  </span>
                </div>
                <button onClick={()=>deleteMeasurement(m.id)} className="text-gray-300 hover:text-red-400"><X size={12}/></button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Ders Takibi Paneli ───────────────────────────────────────────────────────
function DerslerPanel({ trainee, onUpdate }: { trainee: Trainee; onUpdate: (t: Trainee) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<LessonRecord,'id'>>({
    date: today(), name: '', level: 'Temel', module: '',
    attended: true, isVoluntary: false,
    absenceReason: '', absenceType: '',
    activityScore: 7, voluntarinessScore: 7,
  });

  const saveLesson = () => {
    const l: LessonRecord = { id: uid(), ...form };
    onUpdate({ ...trainee, lessons: [...trainee.lessons, l].sort((a,b)=>a.date.localeCompare(b.date)) });
    setAdding(false);
    setForm({ date: today(), name: '', level: 'Temel', module: '', attended: true, isVoluntary: false, absenceReason: '', absenceType: '', activityScore: 7, voluntarinessScore: 7 });
  };

  const deleteLesson = (id: string) => onUpdate({ ...trainee, lessons: trainee.lessons.filter(l=>l.id!==id) });

  const ls = trainee.lessons;
  const attended = ls.filter(l=>l.attended).length;
  const missed = ls.filter(l=>!l.attended).length;
  const voluntary = ls.filter(l=>l.isVoluntary).length;

  // Attendance per level
  const attendanceByLevel = LESSON_LEVELS.map(lv => ({
    level: lv,
    total: ls.filter(l=>l.level===lv).length,
    attended: ls.filter(l=>l.level===lv && l.attended).length,
  })).filter(d=>d.total>0);

  // Kaçınma analizi
  const absenceData = ABSENCE_TYPES.map(t => ({
    name: t.label, value: ls.filter(l=>!l.attended && l.absenceType===t.value).length, color: t.color,
  })).filter(d=>d.value>0);

  // Bar chart data for attendance
  const barData = attendanceByLevel.map(d=>({
    name: d.level, 'Katıldı': d.attended, 'Gelmedi': d.total-d.attended,
  }));

  return (
    <div className="space-y-5 pt-3">
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Toplam Ders', value: ls.length, color: '#555' },
          { label: 'Katıldı', value: attended, color: '#1E8449' },
          { label: 'Gelmedi', value: missed, color: '#C0392B' },
          { label: 'Gönüllü', value: voluntary, color: '#6D3B8A' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <div className="text-xl font-bold" style={{color:s.color}}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Level completion */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Seviye Tamamlama</div>
        <div className="flex gap-3">
          {LESSON_LEVELS.map(lv => {
            const d = attendanceByLevel.find(a=>a.level===lv);
            const pct = d ? Math.round((d.attended/d.total)*100) : 0;
            const colors: Record<string,string> = { Temel:'#1E8449', Orta:'#784212', 'İleri':'#C0392B' };
            return (
              <div key={lv} className="flex-1 text-center">
                <div className="text-sm font-bold" style={{color:colors[lv]}}>{lv}</div>
                <div className="text-2xl font-bold text-gray-800">{pct}%</div>
                <div className="text-xs text-gray-400">{d ? `${d.attended}/${d.total}` : '0/0'}</div>
                <div className="h-2 bg-gray-100 rounded-full mt-1">
                  <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,backgroundColor:colors[lv]}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      {barData.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">Katılım Durumu</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} margin={{top:0,right:0,left:-20,bottom:0}}>
                <XAxis dataKey="name" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:10}} allowDecimals={false}/>
                <Tooltip contentStyle={{fontSize:11}}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="Katıldı" fill="#1E8449" radius={[4,4,0,0]}/>
                <Bar dataKey="Gelmedi" fill="#C0392B" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {absenceData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-sm font-semibold text-gray-700 mb-1">Kaçınma Kontrol Analizi</div>
              <div className="text-xs text-gray-400 mb-2">Devamsızlık nedenleri</div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={absenceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label={({name,value})=>`${name}: ${value}`} labelLine={false} style={{fontSize:10}}>
                    {absenceData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{fontSize:11}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {absenceData.map(d=>(
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor:d.color}}/>
                    <span className="text-gray-600">{d.name}</span>
                    <span className="font-bold text-gray-800 ml-auto">{d.value}</span>
                  </div>
                ))}
                {ls.filter(l=>!l.attended && l.absenceType==='kaçınma').length > 0 && (
                  <div className="mt-2 p-2 bg-rose-50 rounded-lg border border-rose-100 flex items-start gap-2">
                    <AlertTriangle size={12} className="text-rose-500 mt-0.5 flex-shrink-0"/>
                    <p className="text-xs text-rose-700">
                      <strong>{ls.filter(l=>!l.attended && l.absenceType==='kaçınma').length} kaçınma kaynaklı devamsızlık</strong> — klinik süpervizyon önerilir.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add lesson */}
      {!adding ? (
        <button onClick={()=>setAdding(true)} className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-medium">
          <Plus size={13}/> Ders kaydı ekle
        </button>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="font-semibold text-sm text-gray-700">Yeni Ders Kaydı</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-0.5">Tarih</label>
              <input type="date" value={form.date.split('.').reverse().join('-')}
                onChange={e=>{const[y,m,d]=e.target.value.split('-');setForm(f=>({...f,date:`${d}.${m}.${y}`}));}}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-0.5">Ders Adı</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Kabul tekniklerri…"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-0.5">Seviye</label>
              <select value={form.level} onChange={e=>setForm(f=>({...f,level:e.target.value as LessonRecord['level']}))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none">
                {LESSON_LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-0.5">Modül</label>
              <input value={form.module} onChange={e=>setForm(f=>({...f,module:e.target.value}))} placeholder="Hexaflex, Defüzyon…"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"/>
            </div>
            <div className="flex gap-4 items-center pt-4">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" checked={form.attended} onChange={e=>setForm(f=>({...f,attended:e.target.checked}))} className="accent-rose-500"/>
                Katıldı
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isVoluntary} onChange={e=>setForm(f=>({...f,isVoluntary:e.target.checked}))} className="accent-purple-500"/>
                Gönüllü
              </label>
            </div>
          </div>
          {!form.attended && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-0.5">Devamsızlık Tipi</label>
                <select value={form.absenceType} onChange={e=>setForm(f=>({...f,absenceType:e.target.value as LessonRecord['absenceType']}))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none">
                  <option value="">Seç…</option>
                  {ABSENCE_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-0.5">Mazeret</label>
                <input value={form.absenceReason} onChange={e=>setForm(f=>({...f,absenceReason:e.target.value}))} placeholder="Açıklama…"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"/>
              </div>
            </div>
          )}
          {form.attended && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Aktiflik Skoru: <span className="text-rose-600">{form.activityScore}/10</span></label>
                <input type="range" min={1} max={10} value={form.activityScore} onChange={e=>setForm(f=>({...f,activityScore:+e.target.value}))} className="w-full accent-rose-500"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Gönüllülük Skoru: <span className="text-purple-600">{form.voluntarinessScore}/10</span></label>
                <input type="range" min={1} max={10} value={form.voluntarinessScore} onChange={e=>setForm(f=>({...f,voluntarinessScore:+e.target.value}))} className="w-full accent-purple-500"/>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={saveLesson} className="flex items-center gap-1 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              <Save size={12}/> Kaydet
            </button>
            <button onClick={()=>setAdding(false)} className="text-xs text-gray-400 px-2">İptal</button>
          </div>
        </div>
      )}

      {/* Lesson list */}
      {ls.length > 0 && (
        <div className="space-y-2">
          {[...ls].reverse().map(l=>(
            <div key={l.id} className={`flex items-center gap-3 p-3 rounded-xl border text-xs ${l.attended ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${l.attended ? 'bg-green-500' : 'bg-red-400'} text-white`}>
                {l.attended ? '✓' : '✗'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">{l.name || '—'} <span className="font-normal text-gray-400">· {l.level} · {l.module}</span></div>
                <div className="text-gray-400">{l.date}
                  {!l.attended && l.absenceReason && <span className="ml-2 text-red-500">"{l.absenceReason}"</span>}
                  {!l.attended && l.absenceType && <span className="ml-1 px-1.5 py-0.5 rounded-full text-white text-xs font-semibold" style={{backgroundColor: ABSENCE_TYPES.find(t=>t.value===l.absenceType)?.color}}>{ABSENCE_TYPES.find(t=>t.value===l.absenceType)?.label}</span>}
                  {l.isVoluntary && <span className="ml-2 text-purple-500 font-semibold">Gönüllü</span>}
                  {l.attended && <span className="ml-2">Aktiflik: {l.activityScore}/10 · Gönüllülük: {l.voluntarinessScore}/10</span>}
                </div>
              </div>
              <button onClick={()=>deleteLesson(l.id)} className="text-gray-300 hover:text-red-400"><X size={12}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Oturum Skorları Paneli ───────────────────────────────────────────────────
function SkorlarPanel({ trainee }: { trainee: Trainee }) {
  const attended = trainee.lessons.filter(l=>l.attended);
  if (attended.length === 0)
    return <div className="py-10 text-center text-gray-300 text-sm"><Star size={28} className="mx-auto mb-2 opacity-30"/> Katılınan ders yok. Ders Takibi sekmesinden dersleri ekleyin.</div>;

  const avgActivity = +(attended.reduce((s,l)=>s+l.activityScore,0)/attended.length).toFixed(1);
  const avgVoluntary = +(attended.reduce((s,l)=>s+l.voluntarinessScore,0)/attended.length).toFixed(1);
  const voluntarySessions = trainee.lessons.filter(l=>l.isVoluntary).length;

  const barData = attended.slice(-15).map((l,i)=>({
    name: l.name ? l.name.slice(0,10) : `#${i+1}`,
    Aktiflik: l.activityScore,
    Gönüllülük: l.voluntarinessScore,
  }));

  return (
    <div className="space-y-5 pt-3">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Ort. Aktiflik',    value: `${avgActivity}/10`, color: '#C0392B'  },
          { label: 'Ort. Gönüllülük',  value: `${avgVoluntary}/10`,color: '#6D3B8A'  },
          { label: 'Gönüllü Oturum',   value: voluntarySessions,   color: '#1A5276'  },
          { label: 'Katılan Ders',      value: attended.length,     color: '#1E8449'  },
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <div className="text-xl font-bold" style={{color:s.color}}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="text-sm font-semibold text-gray-700 mb-3">Aktiflik & Gönüllülük — Ders Bazlı</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{top:0,right:0,left:-20,bottom:20}}>
            <XAxis dataKey="name" tick={{fontSize:9}} angle={-30} textAnchor="end"/>
            <YAxis tick={{fontSize:10}} domain={[0,10]}/>
            <Tooltip contentStyle={{fontSize:11}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="Aktiflik" fill="#C0392B" radius={[3,3,0,0]}/>
            <Bar dataKey="Gönüllülük" fill="#6D3B8A" radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activity progress line */}
      {attended.length >= 3 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">Aktiflik & Gönüllülük Trendi</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={barData} margin={{top:5,right:10,left:-20,bottom:0}}>
              <XAxis dataKey="name" tick={{fontSize:9}}/>
              <YAxis tick={{fontSize:10}} domain={[0,10]}/>
              <Tooltip contentStyle={{fontSize:11}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Line type="monotone" dataKey="Aktiflik" stroke="#C0392B" strokeWidth={2} dot={{r:3}}/>
              <Line type="monotone" dataKey="Gönüllülük" stroke="#6D3B8A" strokeWidth={2} dot={{r:3}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Voluntary sessions detail */}
      {trainee.lessons.filter(l=>l.isVoluntary).length > 0 && (
        <div className="bg-purple-50 rounded-2xl border border-purple-100 p-4">
          <div className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
            <Star size={14} className="text-purple-500"/> Gönüllü Oturumlar
          </div>
          <div className="space-y-2">
            {trainee.lessons.filter(l=>l.isVoluntary).map(l=>(
              <div key={l.id} className="flex items-center gap-2 text-xs">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0 ${l.attended?'bg-purple-500':'bg-gray-300'}`}>
                  {l.attended?'✓':'✗'}
                </div>
                <span className="font-medium text-gray-700">{l.name}</span>
                <span className="text-gray-400">{l.date}</span>
                {l.attended && <span className="ml-auto text-purple-600">Aktiflik: {l.activityScore}/10</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trainee Card ─────────────────────────────────────────────────────────────
function TraineeCard({ trainee, onUpdate, onDelete }: {
  trainee: Trainee; onUpdate: (t: Trainee) => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [innerTab, setInnerTab] = useState<TraineeTab>('notlar');
  const [addingNote, setAddingNote] = useState(false);
  const [noteForm, setNoteForm] = useState({ category: 'gozlem' as ProcessNote['category'], content: '' });

  const lv = LEVELS[trainee.level] || LEVELS['başlangıç'];
  const attended = trainee.lessons.filter(l=>l.attended).length;
  const total = trainee.lessons.length;

  const addNote = () => {
    if (!noteForm.content.trim()) return;
    const n: ProcessNote = { id: uid(), date: today(), ...noteForm };
    onUpdate({ ...trainee, notes: [n, ...trainee.notes] });
    setNoteForm({ category: 'gozlem', content: '' }); setAddingNote(false);
  };

  const TABS: { id: TraineeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'notlar',  label: 'Süreç Notları',   icon: <MessageSquare size={12}/> },
    { id: 'olcekler',label: 'Ölçek Gelişimi',  icon: <TrendingUp size={12}/> },
    { id: 'dersler', label: 'Ders Takibi',      icon: <ClipboardList size={12}/> },
    { id: 'skorlar', label: 'Oturum Skorları',  icon: <Star size={12}/> },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={()=>setOpen(o=>!o)}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{backgroundColor:lv.color}}>
          {trainee.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900">{trainee.name}</div>
          <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
            <span>Başlangıç: {trainee.startDate}</span>
            {total > 0 && <span className="text-green-600 font-medium">{attended}/{total} ders</span>}
            {trainee.measurements.length > 0 && <span className="text-blue-600">{trainee.measurements.length} ölçüm</span>}
            {trainee.notes.length > 0 && <span>{trainee.notes.length} not</span>}
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{backgroundColor:lv.color+'20',color:lv.color}}>{lv.label}</span>
        {total > 0 && (
          <div className="w-16 flex-shrink-0">
            <div className="text-xs text-gray-400 text-right">{total>0?Math.round(attended/total*100):0}%</div>
            <div className="h-1.5 bg-gray-100 rounded-full mt-0.5">
              <div className="h-full bg-green-400 rounded-full" style={{width:`${total>0?Math.round(attended/total*100):0}%`}}/>
            </div>
          </div>
        )}
        <button onClick={e=>{e.stopPropagation();onDelete();}} className="text-red-300 hover:text-red-500 p-1"><Trash2 size={14}/></button>
        {open?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
      </div>

      {/* Expanded */}
      {open && (
        <div className="border-t border-gray-100">
          {/* Inner tab bar */}
          <div className="flex gap-1 px-4 pt-3 pb-0">
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setInnerTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-xl text-xs font-semibold transition-all ${
                  innerTab===t.id ? 'bg-rose-50 text-rose-600 border border-rose-200 border-b-rose-50' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div className="px-4 pb-5 bg-rose-50/20 border-t border-rose-100">
            {/* Notlar tab */}
            {innerTab === 'notlar' && (
              <div className="pt-3 space-y-3">
                {!addingNote ? (
                  <button onClick={()=>setAddingNote(true)} className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-medium">
                    <Plus size={13}/> Not ekle
                  </button>
                ) : (
                  <div className="space-y-2 p-3 bg-white rounded-xl border border-gray-200">
                    <div className="flex gap-1 flex-wrap">
                      {(Object.keys(NOTE_CATS) as ProcessNote['category'][]).map(c=>(
                        <button key={c} onClick={()=>setNoteForm(f=>({...f,category:c}))}
                          className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                          style={noteForm.category===c?{backgroundColor:NOTE_CATS[c].color,color:'white'}:{backgroundColor:NOTE_CATS[c].bg,color:NOTE_CATS[c].color}}>
                          {NOTE_CATS[c].label}
                        </button>
                      ))}
                    </div>
                    <textarea value={noteForm.content} onChange={e=>setNoteForm(f=>({...f,content:e.target.value}))}
                      placeholder="Notu yaz…" rows={2} autoFocus
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none outline-none focus:border-gray-400"/>
                    <div className="flex gap-2">
                      <button onClick={addNote} className="flex items-center gap-1 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                        <Save size={12}/> Kaydet
                      </button>
                      <button onClick={()=>setAddingNote(false)} className="text-xs text-gray-400 px-2">İptal</button>
                    </div>
                  </div>
                )}
                {trainee.notes.length === 0 && !addingNote && (
                  <p className="text-xs text-gray-300 italic">Henüz not yok.</p>
                )}
                <div className="space-y-2">
                  {trainee.notes.map(n=>{
                    const nc=NOTE_CATS[n.category];
                    return (
                      <div key={n.id} className="flex gap-2 p-3 rounded-xl border" style={{backgroundColor:nc.bg,borderColor:nc.color+'30'}}>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{backgroundColor:nc.color,color:'white'}}>{nc.label}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.content}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{n.date}</p>
                        </div>
                        <button onClick={()=>onUpdate({...trainee,notes:trainee.notes.filter(x=>x.id!==n.id)})} className="text-gray-300 hover:text-red-400 flex-shrink-0"><X size={12}/></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {innerTab === 'olcekler' && <OlceklerPanel trainee={trainee} onUpdate={onUpdate}/>}
            {innerTab === 'dersler'  && <DerslerPanel  trainee={trainee} onUpdate={onUpdate}/>}
            {innerTab === 'skorlar'  && <SkorlarPanel  trainee={trainee}/>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string|number; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:color+'20'}}>
        <div style={{color}}>{icon}</div>
      </div>
      <div><div className="text-2xl font-bold text-gray-900">{value}</div><div className="text-xs text-gray-400">{label}</div></div>
    </div>
  );
}

// ─── Other panels (Özet, Seans, Notlar, Dosyalar, Anahatlar) ─────────────────
function OzetPanel({ ws, sessions, onSection }: { ws: Workspace; sessions: SessionLog[]; onSection: (s: Section) => void }) {
  const done = ws.outlines.flatMap(o=>o.items).filter(i=>i.done).length;
  const total = ws.outlines.flatMap(o=>o.items).length;
  const totalLessons = ws.trainees.flatMap(t=>t.lessons).length;
  const totalMeasurements = ws.trainees.flatMap(t=>t.measurements).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Users size={18}/>}         label="Terapist Adayı"   value={ws.trainees.length}    color="#C0392B"/>
        <StatCard icon={<Zap size={18}/>}           label="Pratik Seansı"    value={sessions.length}       color="#1A5276"/>
        <StatCard icon={<ClipboardList size={18}/>} label="Ders Kaydı"       value={totalLessons}          color="#1E8449"/>
        <StatCard icon={<TrendingUp size={18}/>}    label="Ölçüm"            value={totalMeasurements}     color="#784212"/>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3"><StickyNote size={14} className="text-amber-500"/><span className="text-sm font-semibold text-gray-700">Genel Not / Gündem</span></div>
        <p className="text-sm text-gray-500 italic whitespace-pre-wrap">{ws.generalNote || 'Henüz not yok.'}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Zap size={14} className="text-rose-500"/><span className="text-sm font-semibold text-gray-700">Son Pratik Seansları</span></div>
          <button onClick={()=>onSection('seanslar')} className="text-xs text-rose-500 hover:underline">Tümünü gör</button>
        </div>
        {sessions.length===0 ? <p className="text-xs text-gray-400 italic">Henüz tamamlanmış seans yok.</p> : (
          <div className="space-y-2">
            {sessions.slice(0,4).map(s=>(
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-xs font-bold flex-shrink-0">{s.mode==='hexaflex'?'⬡':'△'}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{s.therapistName||'İsimsiz'} — {s.duration} dk</div>
                  <div className="text-xs text-gray-400">{s.date} {s.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Layers size={14} className="text-indigo-500"/><span className="text-sm font-semibold text-gray-700">Eğitim Anahatları</span></div>
          <button onClick={()=>onSection('anahatlar')} className="text-xs text-indigo-500 hover:underline">Yönet</button>
        </div>
        {ws.outlines.map(sec=>{
          const d=sec.items.filter(i=>i.done).length; const pct=sec.items.length?Math.round(d/sec.items.length*100):0;
          return (
            <div key={sec.id} className="mb-3">
              <div className="flex justify-between text-xs mb-1"><span className="font-medium text-gray-700">{sec.title}</span><span className="text-gray-400">{d}/{sec.items.length}</span></div>
              <div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-indigo-400 rounded-full transition-all" style={{width:`${pct}%`}}/></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeanslarPanel({ sessions }: { sessions: SessionLog[] }) {
  const [open, setOpen] = useState<string|null>(null);
  if (sessions.length===0) return <div className="text-center py-16 text-gray-400"><Zap size={36} className="mx-auto mb-3 opacity-30"/><p className="text-sm">Henüz tamamlanmış seans yok.</p></div>;
  return (
    <div className="space-y-3">
      {sessions.map(s=>{
        const isOpen=open===s.id;
        return (
          <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50" onClick={()=>setOpen(isOpen?null:s.id)}>
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 font-bold">{s.mode==='hexaflex'?'⬡':'△'}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">{s.therapistName||'İsimsiz'} — {s.mode==='hexaflex'?'Hexaflex':'Triflex'} Dancing</div>
                <div className="text-xs text-gray-400">{s.date} {s.time} · {s.duration} dk · {s.speed} sn/boyut</div>
              </div>
              {s.yaziciNotes && <div className="w-2 h-2 rounded-full bg-purple-400" title="Yazıcı notu var"/>}
              {isOpen?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
            </div>
            {isOpen && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {s.participants.filter(p=>p.name).map((p,i)=>(
                    <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-full"><span className="font-semibold">{p.role}:</span> {p.name}</span>
                  ))}
                </div>
                {s.yaziciNotes && <div className="p-3 bg-purple-50 rounded-xl border border-purple-100"><div className="text-xs font-semibold text-purple-600 mb-1">Yazıcı Notu</div><p className="text-xs text-gray-600 whitespace-pre-wrap">{s.yaziciNotes}</p></div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NotlarPanel({ ws, setWs }: { ws: Workspace; setWs: (w: Workspace) => void }) {
  const allNotes = ws.trainees.flatMap(t=>t.notes.map(n=>({...n,traineeName:t.name}))).sort((a,b)=>b.date.localeCompare(a.date));
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3"><StickyNote size={14} className="text-amber-500"/><span className="text-sm font-semibold text-gray-700">Genel Not / Gündem</span></div>
        <textarea value={ws.generalNote} onChange={e=>setWs({...ws,generalNote:e.target.value})} placeholder="Eğitim gündemine dair genel notlar…" rows={4} className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2 resize-none outline-none focus:border-amber-300"/>
      </div>
      {allNotes.length===0 ? <div className="text-center py-10 text-gray-300 text-sm"><MessageSquare size={28} className="mx-auto mb-2 opacity-30"/>Henüz süreç notu yok.</div> : (
        <div className="space-y-2">
          {allNotes.map(n=>{const nc=NOTE_CATS[n.category]; return (
            <div key={n.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{backgroundColor:nc.color,color:'white'}}>{nc.label}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-500 mb-0.5">{n.traineeName}</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.content}</p>
                <p className="text-xs text-gray-400 mt-1">{n.date}</p>
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

function DosyalarPanel({ ws, setWs }: { ws: Workspace; setWs: (w: Workspace) => void }) {
  const FILE_CATS: Record<string,{label:string;icon:string}> = { materyal:{label:'Materyal',icon:'📄'}, form:{label:'Form',icon:'📋'}, kaynak:{label:'Kaynak',icon:'📚'}, değerlendirme:{label:'Değerlendirme',icon:'📊'}, diğer:{label:'Diğer',icon:'📁'} };
  const [form, setForm] = useState({ name:'', description:'', category:'materyal' });
  const [adding, setAdding] = useState(false);
  const addFile = () => {
    if (!form.name.trim()) return;
    setWs({...ws,files:[...ws.files,{id:uid(),date:today(),...form}]});
    setForm({name:'',description:'',category:'materyal'}); setAdding(false);
  };
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        {!adding ? (
          <button onClick={()=>setAdding(true)} className="flex items-center gap-2 text-sm text-rose-500 font-medium"><Plus size={15}/> Dosya ekle</button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3 flex-wrap">
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Dosya adı" className="flex-1 min-w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"/>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
                {Object.entries(FILE_CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Açıklama" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"/>
            <div className="flex gap-2">
              <button onClick={addFile} className="flex items-center gap-1 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"><Save size={12}/> Kaydet</button>
              <button onClick={()=>setAdding(false)} className="text-xs text-gray-400 px-2">İptal</button>
            </div>
          </div>
        )}
      </div>
      {ws.files.length===0 ? <div className="text-center py-12 text-gray-300 text-sm"><Folder size={32} className="mx-auto mb-2 opacity-30"/>Henüz dosya eklenmedi.</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ws.files.map(f=><div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3 items-start">
            <div className="text-2xl flex-shrink-0">{FILE_CATS[f.category]?.icon||'📁'}</div>
            <div className="flex-1 min-w-0"><div className="font-semibold text-sm text-gray-900">{f.name}</div>{f.description&&<div className="text-xs text-gray-400 mt-0.5">{f.description}</div>}<div className="text-xs text-gray-300 mt-1">{f.date}</div></div>
            <button onClick={()=>setWs({...ws,files:ws.files.filter(x=>x.id!==f.id)})} className="text-gray-300 hover:text-red-400"><Trash2 size={13}/></button>
          </div>)}
        </div>
      )}
    </div>
  );
}

// ─── Gruplar Paneli ───────────────────────────────────────────────────────────
function GruplarPanel({ ws, setWs }: { ws: Workspace; setWs: (w: Workspace) => void }) {
  const [newName, setNewName]       = useState('');
  const [newDesc, setNewDesc]       = useState('');
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [msgDraft, setMsgDraft]     = useState<Record<string, string>>({});
  const [toast, setToast]           = useState<string | null>(null);
  const [addMember, setAddMember]   = useState<string | null>(null); // groupId being edited

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const createGroup = () => {
    if (!newName.trim()) return;
    const g: Group = { id: uid(), name: newName.trim(), description: newDesc.trim(), traineeIds: [], createdAt: today() };
    setWs({ ...ws, groups: [...ws.groups, g] });
    setNewName(''); setNewDesc('');
  };

  const deleteGroup = (id: string) =>
    setWs({ ...ws, groups: ws.groups.filter(g => g.id !== id) });

  const toggleMember = (groupId: string, traineeId: string) => {
    setWs({
      ...ws,
      groups: ws.groups.map(g => {
        if (g.id !== groupId) return g;
        const already = g.traineeIds.includes(traineeId);
        return { ...g, traineeIds: already ? g.traineeIds.filter(id => id !== traineeId) : [...g.traineeIds, traineeId] };
      }),
    });
  };

  const membersOf = (g: Group) => ws.trainees.filter(t => g.traineeIds.includes(t.id));
  const outsideOf = (g: Group) => ws.trainees.filter(t => !g.traineeIds.includes(t.id));

  const handleSMS = (g: Group) => {
    const msg = msgDraft[g.id] || '';
    const members = membersOf(g);
    if (members.length === 0) { showToast('Grupta üye yok.'); return; }
    // Gerçek SMS entegrasyonu buraya eklenecek
    showToast(`SMS hazır (${members.length} üye) — entegrasyon yakında aktif olacak.`);
  };

  const handleWP = (g: Group) => {
    const msg = encodeURIComponent(msgDraft[g.id] || '');
    const members = membersOf(g);
    if (members.length === 0) { showToast('Grupta üye yok.'); return; }
    // Tek kişi varsa doğrudan aç, toplu WP API entegrasyonu yakında
    const first = members[0];
    const phone = first.phone?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/${phone}${msg ? `?text=${msg}` : ''}`, '_blank');
    } else {
      showToast(`WhatsApp hazır (${members.length} üye) — telefon numaraları eksik.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={15} className="text-green-400" /> {toast}
        </div>
      )}

      {/* Yeni grup oluştur */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Users size={14} className="text-rose-500" /> Yeni Grup Oluştur
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Grup adı…" onKeyDown={e => e.key === 'Enter' && createGroup()}
            className="flex-1 min-w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-300" />
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
            placeholder="Açıklama (isteğe bağlı)…"
            className="flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-300" />
          <button onClick={createGroup}
            className="flex items-center gap-1.5 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-700">
            <Plus size={14} /> Grup Oluştur
          </button>
        </div>
      </div>

      {ws.groups.length === 0 && (
        <div className="text-center py-14 text-gray-300 text-sm">
          <Users size={36} className="mx-auto mb-2 opacity-30" />
          Henüz grup oluşturulmadı.
        </div>
      )}

      {ws.groups.map(g => {
        const members = membersOf(g);
        const outside = outsideOf(g);
        const isOpen  = expanded === g.id;
        const draft   = msgDraft[g.id] || '';

        return (
          <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Group header */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 leading-tight">{g.name}</div>
                {g.description && <div className="text-xs text-gray-400 truncate mt-0.5">{g.description}</div>}
              </div>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                {members.length} üye
              </span>
              <button onClick={() => setExpanded(isOpen ? null : g.id)}
                className="text-gray-300 hover:text-gray-600 transition-colors">
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button onClick={() => deleteGroup(g.id)}
                className="text-gray-200 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Member chips (collapsed view) */}
            {!isOpen && members.length > 0 && (
              <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                {members.map(t => (
                  <span key={t.id} className="inline-flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-medium">
                    <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-[10px] font-bold">
                      {t.name[0]?.toUpperCase()}
                    </span>
                    {t.name}
                  </span>
                ))}
              </div>
            )}

            {/* Expanded panel */}
            {isOpen && (
              <div className="border-t border-gray-100">
                {/* Members list */}
                <div className="px-5 py-4 space-y-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Grup Üyeleri</div>
                  {members.length === 0 ? (
                    <p className="text-sm text-gray-300 italic">Henüz üye eklenmedi.</p>
                  ) : (
                    <div className="space-y-2">
                      {members.map(t => (
                        <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 group">
                          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {t.name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800">{t.name}</div>
                            <div className="text-xs text-gray-400">{LEVELS[t.level]?.label} · {t.startDate}</div>
                          </div>
                          {/* Phone number inline edit */}
                          <input
                            type="tel"
                            placeholder="Tel…"
                            value={t.phone || ''}
                            onChange={e => {
                              const updated = { ...t, phone: e.target.value };
                              setWs({ ...ws, trainees: ws.trainees.map(x => x.id === t.id ? updated : x) });
                            }}
                            className="w-28 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-rose-300 bg-white"
                          />
                          <button onClick={() => toggleMember(g.id, t.id)}
                            title="Gruptan çıkar"
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                            <UserMinus size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add member */}
                  {outside.length > 0 && (
                    <div>
                      {addMember === g.id ? (
                        <div className="space-y-2 mt-2">
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Üye Ekle</div>
                          <div className="flex flex-wrap gap-2">
                            {outside.map(t => (
                              <button key={t.id} onClick={() => { toggleMember(g.id, t.id); }}
                                className="flex items-center gap-1.5 text-xs border border-dashed border-gray-300 text-gray-500 hover:border-rose-400 hover:text-rose-600 px-3 py-1.5 rounded-full transition-all">
                                <UserPlus size={11} /> {t.name}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => setAddMember(null)} className="text-xs text-gray-300 hover:text-gray-500">Kapat</button>
                        </div>
                      ) : (
                        <button onClick={() => setAddMember(g.id)}
                          className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-medium mt-1">
                          <UserPlus size={13} /> Gruba üye ekle ({outside.length} terapist adayı mevcut)
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Notification panel */}
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/60 space-y-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Send size={12} className="text-gray-400" /> Toplu Bildirim
                  </div>
                  <textarea
                    value={draft}
                    onChange={e => setMsgDraft(p => ({ ...p, [g.id]: e.target.value }))}
                    placeholder={`Merhaba, ${g.name} grubundaki terapist adayları…\n\nBu haftaki seans: [tarih]\nYer: [yer]\n\nGörüşmek üzere.`}
                    rows={4}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none outline-none focus:border-gray-400 bg-white"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {/* SMS Button */}
                    <button
                      onClick={() => handleSMS(g)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-100"
                    >
                      <Smartphone size={15} />
                      SMS Gönder
                      {members.length > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">{members.length}</span>
                      )}
                    </button>
                    {/* WhatsApp Button */}
                    <button
                      onClick={() => handleWP(g)}
                      className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      <MessageCircle size={15} />
                      WhatsApp
                      {members.length > 0 && (
                        <span className="text-white text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#1ebe5d' }}>{members.length}</span>
                      )}
                    </button>
                    {members.length === 0 && (
                      <span className="text-xs text-gray-400 italic self-center">Gönderim için gruba üye ekleyin.</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300">
                    SMS ve WhatsApp entegrasyonu yakında aktif olacak. Telefon numaralarını üye satırlarından girebilirsiniz.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnahatlarPanel({ ws, setWs }: { ws: Workspace; setWs: (w: Workspace) => void }) {
  const [newTitle, setNewTitle] = useState('');
  const [newItem, setNewItem] = useState<Record<string,string>>({});
  const [editNote, setEditNote] = useState<{secId:string;itemId:string}|null>(null);
  const uid2 = uid;
  const addSection = () => { if (!newTitle.trim()) return; setWs({...ws,outlines:[...ws.outlines,{id:uid2(),title:newTitle.trim(),items:[]}]}); setNewTitle(''); };
  const addItem = (secId:string) => { const text=newItem[secId]?.trim(); if(!text) return; const outlines=ws.outlines.map(s=>s.id===secId?{...s,items:[...s.items,{id:uid2(),text,done:false,note:''}]}:s); setWs({...ws,outlines}); setNewItem(p=>({...p,[secId]:''})); };
  const toggle = (secId:string,itemId:string) => setWs({...ws,outlines:ws.outlines.map(s=>s.id!==secId?s:{...s,items:s.items.map(i=>i.id===itemId?{...i,done:!i.done}:i)})});
  const updateNote = (secId:string,itemId:string,note:string) => setWs({...ws,outlines:ws.outlines.map(s=>s.id!==secId?s:{...s,items:s.items.map(i=>i.id===itemId?{...i,note}:i)})});
  const delItem = (secId:string,itemId:string) => setWs({...ws,outlines:ws.outlines.map(s=>s.id!==secId?s:{...s,items:s.items.filter(i=>i.id!==itemId)})});
  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Yeni bölüm başlığı…" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-300" onKeyDown={e=>e.key==='Enter'&&addSection()}/>
        <button onClick={addSection} className="flex items-center gap-1 bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"><Plus size={14}/> Bölüm</button>
      </div>
      {ws.outlines.map(sec=>{
        const done=sec.items.filter(i=>i.done).length;
        return (
          <div key={sec.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 bg-indigo-50 border-b border-indigo-100">
              <Layers size={15} className="text-indigo-500"/>
              <span className="font-semibold text-gray-800 flex-1">{sec.title}</span>
              <span className="text-xs text-indigo-400 font-medium">{done}/{sec.items.length}</span>
              <button onClick={()=>setWs({...ws,outlines:ws.outlines.filter(s=>s.id!==sec.id)})} className="text-indigo-300 hover:text-red-400"><Trash2 size={13}/></button>
            </div>
            <div className="divide-y divide-gray-50">
              {sec.items.map(item=>(
                <div key={item.id}>
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                    <button onClick={()=>toggle(sec.id,item.id)} className="flex-shrink-0">{item.done?<CheckCircle2 size={18} className="text-green-500"/>:<Circle size={18} className="text-gray-300"/>}</button>
                    <span className={`flex-1 text-sm ${item.done?'line-through text-gray-400':'text-gray-700'}`}>{item.text}</span>
                    {item.note&&<span className="text-xs text-gray-400 italic truncate max-w-[140px]">{item.note}</span>}
                    <button onClick={()=>setEditNote(editNote?.itemId===item.id?null:{secId:sec.id,itemId:item.id})} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-indigo-400"><Pencil size={12}/></button>
                    <button onClick={()=>delItem(sec.id,item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400"><X size={12}/></button>
                  </div>
                  {editNote?.secId===sec.id&&editNote?.itemId===item.id&&(
                    <div className="px-11 pb-3"><input value={item.note} onChange={e=>updateNote(sec.id,item.id,e.target.value)} placeholder="Not…" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-300" onKeyDown={e=>e.key==='Enter'&&setEditNote(null)}/></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 px-4 py-3 border-t border-gray-50">
              <input value={newItem[sec.id]||''} onChange={e=>setNewItem(p=>({...p,[sec.id]:e.target.value}))} placeholder="Yeni adım ekle…" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-300" onKeyDown={e=>e.key==='Enter'&&addItem(sec.id)}/>
              <button onClick={()=>addItem(sec.id)} className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-semibold">Ekle</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function EgiticiCalismaAlani() {
  const [ws, setWsState] = useState<Workspace>(EMPTY_WS);
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [section, setSection] = useState<Section>('ozet');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [addForm, setAddForm] = useState({ name:'', level:'başlangıç' as Trainee['level'], startDate:today() });

  useEffect(() => {
    const loaded = load();
    // Migrate old trainees without new fields
    const rawWs = loaded as unknown as Record<string, unknown>;
    const migrated = {
      ...loaded,
      groups: (rawWs.groups as Group[] | undefined) ?? [],
      trainees: loaded.trainees.map(t => {
        const raw = t as unknown as Record<string, unknown>;
        return {
          ...t,
          measurements: (raw.measurements as ScaleMeasurement[] | undefined) ?? [],
          lessons: (raw.lessons as LessonRecord[] | undefined) ?? [],
        };
      }),
    };
    setWsState(migrated); setNameInput(migrated.educatorName);
    setSessions(loadSessions());
  }, []);

  const setWs = (next: Workspace) => { setWsState(next); persist(next); };
  const saveName = () => { setWs({...ws,educatorName:nameInput.trim()}); setEditingName(false); };

  const addTrainee = () => {
    if (!addForm.name.trim()) return;
    const t: Trainee = { id:uid(), name:addForm.name.trim(), level:addForm.level, startDate:addForm.startDate, notes:[], measurements:[], lessons:[] };
    setWs({...ws,trainees:[...ws.trainees,t]});
    setAddForm({name:'',level:'başlangıç',startDate:today()});
  };

  const updateTrainee = (t: Trainee) => setWs({...ws,trainees:ws.trainees.map(x=>x.id===t.id?t:x)});
  const deleteTrainee = (id: string) => setWs({...ws,trainees:ws.trainees.filter(t=>t.id!==id)});

  const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id:'ozet',      label:'Genel Bakış',      icon:<BarChart2 size={15}/> },
    { id:'adaylar',   label:'Terapist Adayları', icon:<Users size={15}/> },
    { id:'gruplar',   label:'Gruplar',           icon:<MessageCircle size={15}/> },
    { id:'seanslar',  label:'Seans Kayıtları',   icon:<Zap size={15}/> },
    { id:'notlar',    label:'Süreç Notları',     icon:<MessageSquare size={15}/> },
    { id:'dosyalar',  label:'Dosyalar',           icon:<Folder size={15}/> },
    { id:'anahatlar', label:'Anahatlar',          icon:<Layers size={15}/> },
  ];
  const BADGES: Partial<Record<Section,number>> = {
    adaylar: ws.trainees.length,
    gruplar: ws.groups.length,
    seanslar: sessions.length,
    dosyalar: ws.files.length,
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1"><GraduationCap size={16} className="text-rose-500"/><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Eğitici Alanı</span></div>
          {editingName ? (
            <div className="flex gap-1.5 mt-2">
              <input value={nameInput} onChange={e=>setNameInput(e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-rose-300" onKeyDown={e=>e.key==='Enter'&&saveName()} autoFocus/>
              <button onClick={saveName} className="text-xs bg-rose-600 text-white px-2 py-1 rounded-lg">✓</button>
            </div>
          ) : (
            <button onClick={()=>setEditingName(true)} className="text-sm font-semibold text-gray-800 hover:text-rose-600 text-left w-full truncate mt-1 flex items-center gap-1">
              {ws.educatorName||<span className="text-gray-300 italic">Eğitici adı…</span>}
              <Pencil size={11} className="text-gray-300 flex-shrink-0"/>
            </button>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setSection(n.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${section===n.id?'bg-rose-50 text-rose-600 font-semibold':'text-gray-600 hover:bg-gray-50'}`}>
              <span className={section===n.id?'text-rose-500':'text-gray-400'}>{n.icon}</span>
              <span className="flex-1 text-left">{n.label}</span>
              {BADGES[n.id]!==undefined&&BADGES[n.id]!>0&&(
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${section===n.id?'bg-rose-100 text-rose-600':'bg-gray-100 text-gray-500'}`}>{BADGES[n.id]}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={()=>setSessions(loadSessions())} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 rounded-lg flex items-center justify-center gap-1">↻ Seansları Yenile</button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">{NAV.find(n=>n.id===section)?.label}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {section==='ozet'     &&'Eğitim sürecine genel bakış'}
              {section==='adaylar'  &&'Terapist adaylarını yönet — ölçekler, dersler, skorlar'}
              {section==='gruplar'  &&'Grupları yönet ve SMS / WhatsApp ile toplu bildirim gönder'}
              {section==='seanslar' &&'ACT Dancing\'den otomatik kaydedilen seans logları'}
              {section==='notlar'   &&'Tüm süreç notları'}
              {section==='dosyalar' &&'Eğitim materyalleri ve kaynaklar'}
              {section==='anahatlar'&&'Eğitim planı ve tamamlanma takibi'}
            </p>
          </div>

          {section==='ozet'      && <OzetPanel ws={ws} sessions={sessions} onSection={setSection}/>}
          {section==='gruplar'   && <GruplarPanel ws={ws} setWs={setWs}/>}
          {section==='seanslar'  && <SeanslarPanel sessions={sessions}/>}
          {section==='notlar'    && <NotlarPanel ws={ws} setWs={setWs}/>}
          {section==='dosyalar'  && <DosyalarPanel ws={ws} setWs={setWs}/>}
          {section==='anahatlar' && <AnahatlarPanel ws={ws} setWs={setWs}/>}

          {section==='adaylar' && (
            <div className="space-y-4">
              {/* Add trainee form */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <input value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))} placeholder="Yeni terapist adayı adı…"
                    className="flex-1 min-w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-300" onKeyDown={e=>e.key==='Enter'&&addTrainee()}/>
                  <select value={addForm.level} onChange={e=>setAddForm(f=>({...f,level:e.target.value as Trainee['level']}))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
                    {(Object.keys(LEVELS) as Trainee['level'][]).map(l=><option key={l} value={l}>{LEVELS[l].label}</option>)}
                  </select>
                  <input type="date" value={addForm.startDate.split('.').reverse().join('-')}
                    onChange={e=>{const[y,m,d]=e.target.value.split('-');setAddForm(f=>({...f,startDate:`${d}.${m}.${y}`}));}}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"/>
                  <button onClick={addTrainee} className="flex items-center gap-1.5 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                    <Plus size={14}/> Ekle
                  </button>
                </div>
              </div>
              {ws.trainees.length===0 && (
                <div className="text-center py-12 text-gray-400 text-sm"><GraduationCap size={32} className="mx-auto mb-2 opacity-30"/>Henüz terapist adayı eklenmedi.</div>
              )}
              {ws.trainees.map(t=>(
                <TraineeCard key={t.id} trainee={t} onUpdate={updateTrainee} onDelete={()=>deleteTrainee(t.id)}/>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
