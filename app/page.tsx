'use client';

import React, { useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Check, X, Download, Upload, RefreshCw, AlertTriangle, Phone, Send,
  ChevronRight, ChevronLeft, Search, UserX, TrendingDown, Clock, Save, FileText,
  Calendar, Users, ClipboardList, Bell, MessageSquare, Tag as TagIcon, Archive,
  Sparkles, Home, BookOpen, Layers, MonitorOff, Zap, Target, GraduationCap, Heart,
} from "lucide-react";
import dynamic from "next/dynamic";
import "@/components/GunlukOzet.css";
import WeekCalendar from "@/components/WeekCalendar";
import HomePanel from "@/components/HomePanel";
import "@/components/HomePanel.css";
import type { Client as DanisanClient } from "@/components/DanisanlarPanel";
import "@/components/DanisanlarPanel.css";
import FormulasyonPanelNew, { type FormulationViewMode, type FormulationVizMode, type FourP, type BeckChain, type Hexaflex, type SelectedNode } from "@/components/FormulasyonPanel";
import "@/components/FormulasyonPanel.css";
import ActHubPanelNew from "@/components/ActHubPanel";
import "@/components/ActHubPanel.css";
import TasarimDosyalariV2 from "@/components/TasarimDosyalariV2";
import { type TakvimSubTab } from "@/components/TakvimPanel";
import TakvimRandevular from "@/components/TakvimRandevular";
import { AnamnezForm } from "@/components/AnamnezForm";
import { SeansNotuForm } from "@/components/SeansNotuForm";
import { SeansCard } from "@/components/SeansCard";
import SeansDetay from "@/components/SeansDetay";
import { BdtSeans, AnamnezData, SeansNotuData, SeansDetayVerisi } from "@/lib/types";
import { OLCEKLER, getSinif, OLCEK_RENKLER } from "@/lib/olcekler";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartTooltip,
  Cell, LabelList,
} from "recharts";
import OnamMetinleri from "@/components/OnamMetinleri";
import VakaHaritasi, { DEMO_CASE } from "@/components/VakaHaritasi";
import RandevuPanel from "@/components/RandevuPanel";
import TerapistProfilV2 from "@/components/TerapistProfilV2";
import CalismaAlaniV2 from "@/components/CalismaAlaniV2";
import DanisanlarV2 from "@/components/DanisanlarV2";
import MudahaleV2 from "@/components/MudahaleV2";
import YolHaritasiV2 from "@/components/YolHaritasiV2";
import FormulasyonV2 from "@/components/FormulasyonV2";
import ACTGelistirmeV2 from "@/components/ACTGelistirmeV2";
import HomeDashboardPanel from "@/components/HomeDashboardPanel";
import "@/components/HomeDashboardPanel.css";
import AnaSayfa from "@/components/AnaSayfa";
import BriefModal from "@/components/BriefModal";
import MudahalePanel, { type Intervention } from "@/components/MudahalePanel";
import "@/components/MudahalePanel.css";
import BozuklukDongusu from "@/components/BozuklukDongusu";
import FormulasyonEkleri from "@/components/FormulasyonEkleri";
import FormulasyonSablonlari from "@/components/FormulasyonSablonlari";
import ModelOlustur from "@/components/ModelOlustur";
import BeklemeEkrani from "@/components/BeklemeEkrani";
import ActFormulasyon from "@/components/ActFormulasyon";
import PratikYap from "@/components/PratikYap";
import DegerKartlari from "@/components/DegerKartlari";
import BenlikAlgisiPanel, { type BenlikAlgisiData } from "@/components/BenlikAlgisiPanel";
import "@/components/BenlikAlgisiPanel.css";
import CocukDegerlendirme from "@/components/CocukDegerlendirme";
import CocukBdtForm from "@/components/CocukBdtForm";
import OyunTerapisi from "@/components/OyunTerapisi";
import DanisanMindMap3D from "@/components/DanisanMindMap3D";
import DanisanMindMap   from "@/components/DanisanMindMap";
import { Marquee }      from "@/components/ui/marquee";
import ACTDancing            from "@/components/ACTDancing";
import SMARTHedef            from "@/components/SMARTHedef";
import EgiticiCalismaAlani   from "@/components/EgiticiCalismaAlani";
import SefkatCalismasi       from "@/components/SefkatCalismasi";
import EkolKarsilastirma     from "@/components/EkolKarsilastirma";

const Screensaver       = dynamic(() => import("@/components/Screensaver"),    { ssr: false });
const MusaitlikPanel    = dynamic(() => import("@/components/MusaitlikPanel"), { ssr: false });
const HexaflexRadarDyn  = dynamic(() => import("@/components/HexaflexRadar"), { ssr: false });
const SemaTerapisiDyn   = dynamic(() => import("@/components/SemaTerapisi"),  { ssr: false });

// ---------- Types ----------
type Patient = {
  id: string; adSoyad: string; yas?: string; cinsiyet?: string;
  telefon?: string; email?: string; basvuruTarihi?: string;
  sunumSorunu?: string; hedefler?: string; status: "intake" | "active" | "archived";
  exitReason?: "completed" | "dropout" | "financial";
  seansUcreti?: number;
  takipSikligi?: 'haftalik' | 'iki_haftalik' | 'aylik';
  kisilikTipi?: string;
  patientType?: 'cocuk' | 'yetiskin';
  il?: string; ilce?: string;
  onamImzalandi?: boolean;
  createdAt: string;
};
type Formulation = {
  id: string; patientId: string;
  anaSikayetler?: string; yonlendirmeNedeni?: string;
  predispozan?: string; presipitan?: string; perpetuan?: string; protektif?: string;
  temelInanclar?: string; araInanclar?: string; basaCikma?: string;
  otomatikDusunceler?: string; duyguBedensel?: string; davranislar?: string;
  smartSpesifik?: string; smartOlculebilir?: string; smartZaman?: string;
  actKabul?: string; actDefuzyon?: string; actSimdi?: string;
  actBaglam?: string; actDegerler?: string; actEylem?: string; actYaraticiCaresizlik?: string;
  updatedAt: string;
};
type Seans = {
  id: string; patientId: string; tarih: string; sure?: number;
  konu?: string; notlar?: string; odev?: string;
};
type CalEvent = {
  id: string; title: string; start: string; end?: string; notes?: string;
};
type DropReason = "no_show" | "first_session_drop" | "mid_therapy_drop";
type PendingFile = {
  id: string; adSoyad: string; randevuTarihi: string; not?: string;
  status: "pending" | "dropped"; dropReason?: DropReason; droppedAt?: string;
  createdAt: string;
};
type SmsLog = {
  id: string; phone: string; name?: string; message: string;
  trigger: "manual" | "appointment_reminder" | "workshop_signup";
  status: "queued" | "sent" | "failed"; error?: string;
  createdAt: string; sentAt?: string;
  deliveryStatus?: string; deliveredAt?: string;
};
type Tag = { id: string; category: string; label: string; count: number };
type Settings_ = {
  therapistName: string;
  smsWebhookUrl: string;
  smsAutoAppointmentReminder: boolean;
  smsAutoWorkshopSignup: boolean;
  smsDayOfReminder: boolean;
  noShowTracking: boolean;
  gmailUser: string;
  gmailAppPassword: string;
  gmailImapHost: string;
  gmailImapPort: number;
  todayIntent?: string;
};

type State = {
  patients: Patient[];
  formulations: Formulation[];
  seanslar: Seans[];
  events: CalEvent[];
  pending: PendingFile[];
  sms: SmsLog[];
  tags: Tag[];
  settings: Settings_;
};

// ---------- Categories ----------
const TAG_CATEGORIES = [
  { key: "ana_sikayetler", label: "Ana Şikayetler" },
  { key: "yonlendirme_nedeni", label: "Yönlendirme Nedeni" },
  { key: "sunum_sorunu", label: "Sunum Sorunu" },
  { key: "predispozan", label: "Predispozan" },
  { key: "presipitan", label: "Presipitan" },
  { key: "perpetuan", label: "Perpetuan" },
  { key: "protektif", label: "Protektif" },
  { key: "temel_inanclar", label: "Temel İnançlar" },
  { key: "ara_inanclar", label: "Ara İnançlar" },
  { key: "basa_cikma", label: "Başa Çıkma" },
  { key: "otomatik_dusunceler", label: "Otomatik Düşünceler" },
  { key: "duygu_bedensel", label: "Duygu/Bedensel" },
  { key: "davranislar", label: "Davranışlar" },
];

const defaultSettings: Settings_ = {
  therapistName: 'Terapist',
  smsWebhookUrl: '',
  smsAutoAppointmentReminder: true,
  smsAutoWorkshopSignup: true,
  smsDayOfReminder: true,
  noShowTracking: true,
  gmailUser: '',
  gmailAppPassword: '',
  gmailImapHost: 'imap.gmail.com',
  gmailImapPort: 993,
  todayIntent: '',
};

const defaultState: State = {
  patients: [], formulations: [], seanslar: [], events: [],
  pending: [], sms: [], tags: [], settings: defaultSettings,
};

// ---------- Reducer ----------
type Action =
  | { type: "SET"; state: State }
  | { type: "PATCH"; patch: Partial<State> }
  | { type: "PATIENT_ADD"; p: Patient }
  | { type: "PATIENT_UPDATE"; id: string; patch: Partial<Patient> }
  | { type: "PATIENT_DELETE"; id: string }
  | { type: "FORM_UPSERT"; f: Formulation }
  | { type: "SEANS_ADD"; s: Seans }
  | { type: "SEANS_UPDATE"; id: string; patch: Partial<Seans> }
  | { type: "SEANS_DELETE"; id: string }
  | { type: "EVENT_ADD"; e: CalEvent }
  | { type: "EVENT_UPDATE"; id: string; patch: Partial<CalEvent> }
  | { type: "EVENT_DELETE"; id: string }
  | { type: "PENDING_ADD"; p: PendingFile }
  | { type: "PENDING_UPDATE"; id: string; patch: Partial<PendingFile> }
  | { type: "PENDING_DELETE"; id: string }
  | { type: "SMS_ADD"; m: SmsLog }
  | { type: "SMS_UPDATE"; id: string; patch: Partial<SmsLog> }
  | { type: "TAG_ADD"; t: Tag }
  | { type: "TAG_DELETE"; id: string }
  | { type: "SETTINGS"; patch: Partial<Settings_> };

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "SET": return a.state;
    case "PATCH": return { ...state, ...a.patch };
    case "PATIENT_ADD": return { ...state, patients: [a.p, ...state.patients] };
    case "PATIENT_UPDATE": return { ...state, patients: state.patients.map(p => p.id === a.id ? { ...p, ...a.patch } : p) };
    case "PATIENT_DELETE": return { ...state, patients: state.patients.filter(p => p.id !== a.id) };
    case "FORM_UPSERT": {
      const exists = state.formulations.some(f => f.patientId === a.f.patientId);
      return { ...state, formulations: exists ? state.formulations.map(f => f.patientId === a.f.patientId ? a.f : f) : [a.f, ...state.formulations] };
    }
    case "SEANS_ADD": return { ...state, seanslar: [a.s, ...state.seanslar] };
    case "SEANS_UPDATE": return { ...state, seanslar: state.seanslar.map(s => s.id === a.id ? { ...s, ...a.patch } : s) };
    case "SEANS_DELETE": return { ...state, seanslar: state.seanslar.filter(s => s.id !== a.id) };
    case "EVENT_ADD": return { ...state, events: [...state.events, a.e] };
    case "EVENT_UPDATE": return { ...state, events: state.events.map(e => e.id === a.id ? { ...e, ...a.patch } : e) };
    case "EVENT_DELETE": return { ...state, events: state.events.filter(e => e.id !== a.id) };
    case "PENDING_ADD": return { ...state, pending: [a.p, ...state.pending] };
    case "PENDING_UPDATE": return { ...state, pending: state.pending.map(p => p.id === a.id ? { ...p, ...a.patch } : p) };
    case "PENDING_DELETE": return { ...state, pending: state.pending.filter(p => p.id !== a.id) };
    case "SMS_ADD": return { ...state, sms: [a.m, ...state.sms] };
    case "SMS_UPDATE": return { ...state, sms: state.sms.map(m => m.id === a.id ? { ...m, ...a.patch } : m) };
    case "TAG_ADD": return { ...state, tags: [...state.tags, a.t] };
    case "TAG_DELETE": return { ...state, tags: state.tags.filter(t => t.id !== a.id) };
    case "SETTINGS": return { ...state, settings: { ...state.settings, ...a.patch } };
  }
}

// ---------- UI primitives ----------
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" | "danger"; size?: "sm" | "md" }> =
  ({ variant = "primary", size = "md", className, ...p }) => (
    <button {...p} className={cx(
      "inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
      size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
      variant === "primary" && "bg-[#0E0F12] text-white hover:bg-[#1A1B22]",
      variant === "ghost" && "text-gray-600 hover:bg-gray-100",
      variant === "outline" && "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
      variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
      className,
    )} />
  );

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...p }) =>
  <input {...p} className={cx("h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#0E0F12] transition-colors", className)} />;

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...p }) =>
  <textarea {...p} className={cx("min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0E0F12] transition-colors", className)} />;

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...p }) =>
  <div {...p} className={cx("card p-5", className)} />;

const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...p }) =>
  <label {...p} className={cx("text-xs font-semibold text-gray-500 uppercase tracking-wide", className)} />;

const Badge: React.FC<{ tone?: "slate" | "amber" | "red" | "green" | "blue"; children: React.ReactNode }> = ({ tone = "slate", children }) => {
  const map = {
    slate: "bg-gray-100 text-gray-700",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
  } as const;
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", map[tone])}>{children}</span>;
};

function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={cx("w-full rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-[#0E0F12]">{title}</h3>
          <button onClick={onClose} className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 transition"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function TagAutocomplete({ tags, category, value, onChange }: { tags: Tag[]; category: string; value: string; onChange: (v: string) => void }) {
  const [focus, setFocus] = useState(false);
  const options = tags.filter(t => t.category === category);
  const last = value.split(",").pop()?.trim().toLowerCase() ?? "";
  const filtered = last ? options.filter(o => o.label.toLowerCase().includes(last)) : options;
  const addTag = (label: string) => {
    const parts = value.split(",").map(s => s.trim()).filter(Boolean);
    parts.pop();
    onChange([...parts, label].join(", ") + ", ");
  };
  return (
    <div className="relative">
      <Textarea value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)} />
      {focus && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-44 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-lg">
          {filtered.slice(0, 12).map(t => (
            <button key={t.id} type="button" onMouseDown={e => { e.preventDefault(); addTag(t.label); }} className="block w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50">
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Helpers ----------
const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (iso?: string) => iso ? new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const uid = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

// ============================================================
// Landing (Welcome Gate)
// ============================================================
function Landing({ name, onStart }: { name: string; onStart: () => void }) {
  const hour = new Date().getHours();
  const greet = hour < 6 ? "İyi geceler" : hour < 12 ? "Günaydın" : hour < 18 ? "Tünaydın" : "İyi akşamlar";
  const today = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F8] p-4">
      <div className="w-full max-w-2xl">
        <div className="card p-10 md:p-12 bg-gradient-to-br from-[#0E0F12] to-[#1A1B22] text-white relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 font-medium">{today}</p>
          <h1 className="text-3xl md:text-4xl font-medium mt-3 text-white">{greet}, {name}.</h1>
          <p className="mt-3 text-base text-white/60 leading-relaxed">Tüm danışan kayıtları ve seans notları güvenli biçimde yerel SQLite veritabanında saklanıyor.</p>
          <div className="mt-8 grid sm:grid-cols-3 gap-3">
            {[["SQLite depolama", "Veriler kalıcı olarak saklanır"], ["Sen kontrol et", "Bulut zorunluluğu yok"], ["Otomatik kayıt", "Her değişiklik kaydedilir"]].map(([t, b]) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">{t}</div>
                <p className="mt-1 text-xs text-white/50">{b}</p>
              </div>
            ))}
          </div>
          <button className="mt-8 inline-flex items-center gap-2 bg-white text-[#0E0F12] font-semibold text-sm px-6 py-3 rounded-2xl hover:bg-white/90 transition" onClick={onStart}>
            <Sparkles className="h-4 w-4" /> Çalışmaya Başla
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Calendar (month view fallback)
// ============================================================
function CalendarView({ events, dispatch }: { events: CalEvent[]; dispatch: React.Dispatch<Action> }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const [creating, setCreating] = useState<string | null>(null);

  const monthLabel = cursor.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const firstDow = (cursor.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const eventsForDay = (day: number) => events.filter(e => {
    const d = new Date(e.start);
    return d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth() && d.getDate() === day;
  });

  const shift = (n: number) => { const d = new Date(cursor); d.setMonth(d.getMonth() + n); setCursor(d); };

  const handleSave = async (e: CalEvent) => {
    if (editing) {
      dispatch({ type: "EVENT_UPDATE", id: e.id, patch: e });
      await fetch(`/api/events/${e.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
    } else {
      dispatch({ type: "EVENT_ADD", e });
      await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
    }
    setEditing(null); setCreating(null);
  };

  const handleDelete = async (id: string) => {
    dispatch({ type: "EVENT_DELETE", id });
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    setEditing(null);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Btn>
          <h2 className="text-lg font-semibold text-[#0E0F12] capitalize min-w-[180px] text-center">{monthLabel}</h2>
          <Btn variant="ghost" size="sm" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Btn>
        </div>
        <Btn size="sm" onClick={() => { const d = new Date(); d.setHours(14, 0, 0, 0); setCreating(d.toISOString()); }}>
          <Plus className="h-3.5 w-3.5" /> Etkinlik Ekle
        </Btn>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-2xl overflow-hidden text-xs">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(d => (
          <div key={d} className="bg-gray-50 px-2 py-2 text-center font-semibold text-gray-500">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="bg-white min-h-[90px] p-1.5">
            {day && (
              <>
                <button className="text-[11px] text-gray-500 hover:text-[#0E0F12] mb-1"
                  onClick={() => { const d = new Date(cursor); d.setDate(day); d.setHours(14, 0, 0, 0); setCreating(d.toISOString()); }}>{day}</button>
                <div className="space-y-1">
                  {eventsForDay(day).map(e => (
                    <button key={e.id} onClick={() => setEditing(e)} className="block w-full text-left text-[11px] bg-[#0E0F12] text-white rounded-lg px-1.5 py-0.5 truncate hover:bg-[#1A1B22]">
                      {new Date(e.start).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} {e.title}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {(editing || creating) && (
        <EventModal
          initial={editing ?? { id: uid(), title: "", start: creating! }}
          isNew={!editing}
          onClose={() => { setEditing(null); setCreating(null); }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </Card>
  );
}

function EventModal({ initial, isNew, onClose, onSave, onDelete }: {
  initial: CalEvent; isNew: boolean; onClose: () => void; onSave: (e: CalEvent) => void; onDelete: (id: string) => void;
}) {
  const [e, setE] = useState<CalEvent>(initial);
  const dt = new Date(e.start);
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return (
    <Modal open onClose={onClose} title={isNew ? "Yeni Etkinlik" : "Etkinliği Düzenle"}>
      <div className="space-y-3">
        <div><Label>Başlık</Label><Input value={e.title} onChange={ev => setE({ ...e, title: ev.target.value })} placeholder="Ör: Ayşe Demir — seans" /></div>
        <div><Label>Tarih & Saat</Label><Input type="datetime-local" value={local} onChange={ev => setE({ ...e, start: new Date(ev.target.value).toISOString() })} /></div>
        <div><Label>Not</Label><Textarea value={e.notes ?? ""} onChange={ev => setE({ ...e, notes: ev.target.value })} /></div>
        <div className="flex justify-between pt-2">
          {!isNew ? <Btn variant="danger" size="sm" onClick={() => onDelete(e.id)}><Trash2 className="h-3.5 w-3.5" /> Sil</Btn> : <span />}
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={onClose}>Vazgeç</Btn>
            <Btn size="sm" onClick={() => onSave(e)} disabled={!e.title.trim()}><Check className="h-3.5 w-3.5" /> Kaydet</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// Intake Inbox
// ============================================================
function IntakeInbox({ state, dispatch, onOpenFormulation, onOpenSeanslar }: { state: State; dispatch: React.Dispatch<Action>; onOpenFormulation: (id: string) => void; onOpenSeanslar: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [patientTab, setPatientTab] = useState<'yetiskin' | 'cocuk'>('yetiskin');
  const [draft, setDraft] = useState<Partial<Patient>>({ patientType: 'yetiskin' });
  const [formAyar, setFormAyar] = useState({ onForm: false, haftalikOlcek: false, olcekId: '' });
  const [haritaPatient, setHaritaPatient] = useState<Patient | null>(null);

  // All existing patients without patientType are treated as yetiskin
  const allActive = state.patients.filter(p => p.status !== "archived");
  const yetiskinIntakes  = allActive.filter(p => p.status === "intake"  && (p.patientType ?? 'yetiskin') === 'yetiskin');
  const yetiskinActives  = allActive.filter(p => p.status === "active"  && (p.patientType ?? 'yetiskin') === 'yetiskin');
  const cocukIntakes     = allActive.filter(p => p.status === "intake"  && p.patientType === 'cocuk');
  const cocukActives     = allActive.filter(p => p.status === "active"  && p.patientType === 'cocuk');

  const intakes = patientTab === 'yetiskin' ? yetiskinIntakes : cocukIntakes;
  const actives = patientTab === 'yetiskin' ? yetiskinActives : cocukActives;

  const add = async () => {
    if (!draft.adSoyad?.trim()) return;
    const pType = draft.patientType ?? 'yetiskin';
    const np: Patient = {
      id: uid(), adSoyad: draft.adSoyad, yas: draft.yas, cinsiyet: draft.cinsiyet,
      telefon: draft.telefon, email: draft.email, basvuruTarihi: new Date().toISOString(),
      sunumSorunu: draft.sunumSorunu, hedefler: draft.hedefler,
      il: draft.il, ilce: draft.ilce,
      status: "intake", patientType: pType, createdAt: new Date().toISOString(),
    };
    dispatch({ type: "PATIENT_ADD", p: np });
    const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(np) });
    const created = await res.json();
    if (created.id && created.id !== np.id) {
      dispatch({ type: "PATIENT_UPDATE", id: np.id, patch: { id: created.id } });
    }
    setDraft({ patientType: pType });

    // Save form/ölçek settings if any are enabled
    const finalId = created.id && created.id !== np.id ? created.id : np.id;
    if (formAyar.onForm || formAyar.haftalikOlcek) {
      await fetch('/api/danisan-ayarlar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: finalId,
          onFormAktif: formAyar.onForm,
          haftalikOlcekAktif: formAyar.haftalikOlcek,
          haftalikOlcekId: formAyar.haftalikOlcek ? formAyar.olcekId : null,
        }),
      });
      // Create form links automatically
      if (formAyar.onForm) {
        await fetch('/api/form-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: finalId, clientName: np.adSoyad, formTipi: 'on_form' }),
        });
      }
      if (formAyar.haftalikOlcek && formAyar.olcekId) {
        const olcek = OLCEKLER.find(o => o.id === formAyar.olcekId);
        await fetch('/api/form-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: finalId, clientName: np.adSoyad,
            formTipi: 'olcek', olcekId: formAyar.olcekId, olcekAd: olcek?.ad,
          }),
        });
      }
    }
    setFormAyar({ onForm: false, haftalikOlcek: false, olcekId: '' });
    setOpen(false);
    // Immediately activate and open
    dispatch({ type: "PATIENT_UPDATE", id: np.id, patch: { status: "active" } });
    onOpenFormulation(np.id);
  };

  const activatePatient = async (p: Patient) => {
    dispatch({ type: "PATIENT_UPDATE", id: p.id, patch: { status: "active" } });
    await fetch(`/api/clients/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'active' }) });
    onOpenFormulation(p.id);
  };

  const removePatient = async (id: string) => {
    dispatch({ type: "PATIENT_DELETE", id });
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
  };

  return (
    <div className="space-y-4">
      {/* Çocuk / Yetişkin tab switcher */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-[#F4F5F8] p-1 rounded-2xl">
          {([
            { k: 'yetiskin', l: `Ergen / Yetişkin`, count: yetiskinIntakes.length + yetiskinActives.length },
            { k: 'cocuk',    l: `Çocuk`,             count: cocukIntakes.length + cocukActives.length },
          ] as const).map(t => (
            <button
              key={t.k}
              onClick={() => setPatientTab(t.k)}
              className={`text-xs px-4 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
                patientTab === t.k ? 'bg-white text-[#0E0F12] shadow-sm' : 'text-gray-500 hover:text-[#0E0F12]'
              }`}
            >
              {t.l}
              {t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  patientTab === t.k ? 'bg-[#0E0F12] text-white' : 'bg-gray-200 text-gray-500'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
        <Btn size="sm" onClick={() => { setDraft({ patientType: patientTab }); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5" />
          {patientTab === 'cocuk' ? 'Yeni Çocuk Kaydı' : 'Manuel Kayıt'}
        </Btn>
      </div>

      {/* Intake list */}
      {intakes.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-[#0E0F12] mb-3">
            {patientTab === 'cocuk' ? '🧒 Bekleyen Çocuk Kayıtları' : 'Bekleyen Kayıtlar'} ({intakes.length})
          </h3>
          <div className="space-y-2">
            {intakes.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl border border-gray-100 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-[#0E0F12]">{p.adSoyad}</div>
                    {p.patientType === 'cocuk' && <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold">Çocuk</span>}
                  </div>
                  <div className="text-xs text-gray-500">{p.yas ? `${p.yas} yaş · ` : ""}{p.cinsiyet ?? ""} · {fmtDate(p.basvuruTarihi)}</div>
                  {p.sunumSorunu && <p className="mt-1 text-xs text-gray-600 line-clamp-2">{p.sunumSorunu}</p>}
                </div>
                <div className="flex gap-2">
                  <Btn size="sm" variant="outline" onClick={() => activatePatient(p)}>
                    <FileText className="h-3.5 w-3.5" />
                    {p.patientType === 'cocuk' ? 'Değerlendirme Aç' : 'Dosya Aç'}
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => removePatient(p.id)}><Trash2 className="h-3.5 w-3.5" /></Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active list */}
      <Card>
        <h3 className="text-sm font-semibold text-[#0E0F12] mb-3">
          {patientTab === 'cocuk' ? '🧒 Aktif Çocuk Danışanlar' : 'Aktif Danışanlar'} ({actives.length})
        </h3>
        <div className="space-y-1.5">
          {actives.map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl border border-gray-100 px-3 py-2 hover:bg-gray-50 transition">
              <button onClick={() => onOpenFormulation(p.id)} className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-[#0E0F12]">{p.adSoyad}</div>
                  {p.patientType === 'cocuk' && <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold">Çocuk</span>}
                </div>
                <div className="text-[11px] text-gray-500">{p.yas ? `${p.yas} yaş · ` : ""}{p.telefon ?? "—"}</div>
              </button>
              <div className="flex items-center gap-1.5">
                {patientTab === 'yetiskin' && (
                  <Btn size="sm" variant="ghost" onClick={() => setHaritaPatient(p)}>
                    <Layers className="h-3.5 w-3.5" /> Vaka Haritası
                  </Btn>
                )}
                <Btn size="sm" variant="ghost" onClick={() => onOpenSeanslar(p.id)}>
                  <ClipboardList className="h-3.5 w-3.5" /> Seanslar
                </Btn>
                <button onClick={() => onOpenFormulation(p.id)} className="text-gray-400 hover:text-[#0E0F12] transition">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {actives.length === 0 && (
            <p className="text-sm text-gray-500 py-2">
              {patientTab === 'cocuk' ? 'Aktif çocuk danışan yok.' : 'Aktif danışan yok.'}
            </p>
          )}
        </div>
      </Card>

      {/* Add modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Yeni Danışan Kaydı" wide>
        {/* Type selector */}
        <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-xl w-fit">
          {([
            { k: 'yetiskin', l: 'Ergen / Yetişkin' },
            { k: 'cocuk',    l: '🧒 Çocuk' },
          ] as const).map(t => (
            <button
              key={t.k}
              onClick={() => setDraft(d => ({ ...d, patientType: t.k }))}
              className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-colors ${
                (draft.patientType ?? 'yetiskin') === t.k ? 'bg-white text-[#0E0F12] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >{t.l}</button>
          ))}
        </div>

        {(draft.patientType ?? 'yetiskin') === 'cocuk' && (
          <div className="mb-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
            Kaydedildiğinde çocuk değerlendirme formu otomatik açılır.
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Ad Soyad *</Label><Input value={draft.adSoyad ?? ""} onChange={e => setDraft({ ...draft, adSoyad: e.target.value })} /></div>
          <div><Label>Yaş</Label><Input value={draft.yas ?? ""} onChange={e => setDraft({ ...draft, yas: e.target.value })} /></div>
          <div><Label>Cinsiyet</Label><Input value={draft.cinsiyet ?? ""} onChange={e => setDraft({ ...draft, cinsiyet: e.target.value })} /></div>
          <div><Label>Telefon</Label><Input value={draft.telefon ?? ""} onChange={e => setDraft({ ...draft, telefon: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Email</Label><Input value={draft.email ?? ""} onChange={e => setDraft({ ...draft, email: e.target.value })} /></div>
          <div><Label>İl</Label><Input value={draft.il ?? ""} onChange={e => setDraft({ ...draft, il: e.target.value })} placeholder="İstanbul" /></div>
          <div><Label>İlçe</Label><Input value={draft.ilce ?? ""} onChange={e => setDraft({ ...draft, ilce: e.target.value })} placeholder="Kadıköy" /></div>
          <div className="sm:col-span-2"><Label>Sunum Sorunu / Başvuru Nedeni</Label><Textarea value={draft.sunumSorunu ?? ""} onChange={e => setDraft({ ...draft, sunumSorunu: e.target.value })} /></div>
          {(draft.patientType ?? 'yetiskin') === 'yetiskin' && (
            <div className="sm:col-span-2"><Label>Hedefler</Label><Textarea value={draft.hedefler ?? ""} onChange={e => setDraft({ ...draft, hedefler: e.target.value })} /></div>
          )}
        </div>

        {/* Seans Öncesi Form & Haftalık Ölçek */}
        <div className="mt-4 rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Seans Öncesi Ayarlar</p>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setFormAyar(a => ({ ...a, onForm: !a.onForm }))}
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${formAyar.onForm ? 'bg-[#6366f1]' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${formAyar.onForm ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-gray-700">Seans öncesi form linki oluştur</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setFormAyar(a => ({ ...a, haftalikOlcek: !a.haftalikOlcek }))}
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${formAyar.haftalikOlcek ? 'bg-[#6366f1]' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${formAyar.haftalikOlcek ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-gray-700">Haftalık ölçek uygula</span>
          </label>

          {formAyar.haftalikOlcek && (
            <div>
              <Label>Ölçek Seç</Label>
              <select
                value={formAyar.olcekId}
                onChange={e => setFormAyar(a => ({ ...a, olcekId: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30"
              >
                <option value="">— Seçiniz —</option>
                {OLCEKLER.filter(o => o.id !== 'custom').map(o => (
                  <option key={o.id} value={o.id}>{o.tam}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="outline" size="sm" onClick={() => setOpen(false)}>Vazgeç</Btn>
          <Btn size="sm" onClick={add}>Kaydet</Btn>
        </div>
      </Modal>

      {/* Vaka Haritası Modal */}
      {haritaPatient && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setHaritaPatient(null)} />
          <div className="relative bg-[#F4F5F8] dark:bg-gray-950 rounded-3xl shadow-2xl w-full max-w-4xl z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400">Vaka Haritası</p>
                <h2 className="text-lg font-semibold text-[#0E0F12] dark:text-white">{haritaPatient.adSoyad}</h2>
              </div>
              <button onClick={() => setHaritaPatient(null)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-gray-800 transition text-gray-400 hover:text-[#0E0F12]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <VakaHaritasi initialData={DEMO_CASE} patientId={haritaPatient.id} />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// NewClientModal — erişilebilir "Yeni danışan" kaydı
// IntakeInbox'taki kayıt mantığının bağımsız, yeniden kullanılabilir hâli.
// V2 ekranlarından (DanisanlarV2 / CalismaAlaniV2) onNewClient ile açılır.
// ============================================================
function NewClientModal({ open, onClose, dispatch, onCreated }: {
  open: boolean;
  onClose: () => void;
  dispatch: React.Dispatch<Action>;
  onCreated: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Partial<Patient>>({ patientType: 'yetiskin' });
  const [formAyar, setFormAyar] = useState({ onForm: false, haftalikOlcek: false, olcekId: '' });
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setDraft({ patientType: 'yetiskin' });
    setFormAyar({ onForm: false, haftalikOlcek: false, olcekId: '' });
  };

  const add = async () => {
    if (!draft.adSoyad?.trim() || saving) return;
    setSaving(true);
    const pType = draft.patientType ?? 'yetiskin';
    const np: Patient = {
      id: uid(), adSoyad: draft.adSoyad, yas: draft.yas, cinsiyet: draft.cinsiyet,
      telefon: draft.telefon, email: draft.email, basvuruTarihi: new Date().toISOString(),
      sunumSorunu: draft.sunumSorunu, hedefler: draft.hedefler,
      il: draft.il, ilce: draft.ilce, seansUcreti: draft.seansUcreti,
      takipSikligi: draft.takipSikligi, kisilikTipi: draft.kisilikTipi,
      status: "active", patientType: pType, createdAt: new Date().toISOString(),
    };
    dispatch({ type: "PATIENT_ADD", p: np });
    let finalId = np.id;
    try {
      const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(np) });
      const created = await res.json();
      if (created.id && created.id !== np.id) {
        dispatch({ type: "PATIENT_UPDATE", id: np.id, patch: { id: created.id } });
        finalId = created.id;
      }

      if (formAyar.onForm || formAyar.haftalikOlcek) {
        await fetch('/api/danisan-ayarlar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: finalId,
            onFormAktif: formAyar.onForm,
            haftalikOlcekAktif: formAyar.haftalikOlcek,
            haftalikOlcekId: formAyar.haftalikOlcek ? formAyar.olcekId : null,
          }),
        });
        if (formAyar.onForm) {
          await fetch('/api/form-link', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: finalId, clientName: np.adSoyad, formTipi: 'on_form' }),
          });
        }
        if (formAyar.haftalikOlcek && formAyar.olcekId) {
          const olcek = OLCEKLER.find(o => o.id === formAyar.olcekId);
          await fetch('/api/form-link', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: finalId, clientName: np.adSoyad, formTipi: 'olcek', olcekId: formAyar.olcekId, olcekAd: olcek?.ad }),
          });
        }
      }
    } catch { /* yerel state zaten eklendi; sessiz geç */ }
    setSaving(false);
    reset();
    onClose();
    onCreated(finalId);
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Yeni Danışan Kaydı" wide>
      {/* Type selector */}
      <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-xl w-fit">
        {([
          { k: 'yetiskin', l: 'Ergen / Yetişkin' },
          { k: 'cocuk',    l: '🧒 Çocuk' },
        ] as const).map(t => (
          <button
            key={t.k}
            onClick={() => setDraft(d => ({ ...d, patientType: t.k }))}
            className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-colors ${
              (draft.patientType ?? 'yetiskin') === t.k ? 'bg-white text-[#0E0F12] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >{t.l}</button>
        ))}
      </div>

      {(draft.patientType ?? 'yetiskin') === 'cocuk' && (
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
          Kaydedildiğinde çocuk değerlendirme formu otomatik açılır.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label>Ad Soyad *</Label><Input value={draft.adSoyad ?? ""} onChange={e => setDraft({ ...draft, adSoyad: e.target.value })} /></div>
        <div><Label>Yaş</Label><Input value={draft.yas ?? ""} onChange={e => setDraft({ ...draft, yas: e.target.value })} /></div>
        <div><Label>Cinsiyet</Label><Input value={draft.cinsiyet ?? ""} onChange={e => setDraft({ ...draft, cinsiyet: e.target.value })} /></div>
        <div><Label>Telefon</Label><Input value={draft.telefon ?? ""} onChange={e => setDraft({ ...draft, telefon: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Email</Label><Input value={draft.email ?? ""} onChange={e => setDraft({ ...draft, email: e.target.value })} /></div>
        <div><Label>İl</Label><Input value={draft.il ?? ""} onChange={e => setDraft({ ...draft, il: e.target.value })} placeholder="İstanbul" /></div>
        <div><Label>İlçe</Label><Input value={draft.ilce ?? ""} onChange={e => setDraft({ ...draft, ilce: e.target.value })} placeholder="Kadıköy" /></div>
        <div><Label>Seans Ücreti (₺)</Label><Input type="number" inputMode="numeric" value={draft.seansUcreti != null ? String(draft.seansUcreti) : ""} onChange={e => setDraft({ ...draft, seansUcreti: e.target.value === "" ? undefined : Number(e.target.value) })} placeholder="örn. 1500" /></div>
        <div><Label>Takip Sıklığı</Label>
          <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white" value={draft.takipSikligi ?? ""} onChange={e => setDraft({ ...draft, takipSikligi: (e.target.value || undefined) as any })}>
            <option value="">— seçiniz —</option>
            <option value="haftalik">Haftalık</option>
            <option value="iki_haftalik">2 haftalık</option>
            <option value="aylik">Aylık</option>
          </select>
        </div>
        <div><Label>Kişilik Tipi</Label><Input value={draft.kisilikTipi ?? ""} onChange={e => setDraft({ ...draft, kisilikTipi: e.target.value || undefined })} placeholder="örn. Kaçıngan / 4w5 / INFP" /></div>
        <div className="sm:col-span-2"><Label>Sunum Sorunu / Başvuru Nedeni</Label><Textarea value={draft.sunumSorunu ?? ""} onChange={e => setDraft({ ...draft, sunumSorunu: e.target.value })} /></div>
        {(draft.patientType ?? 'yetiskin') === 'yetiskin' && (
          <div className="sm:col-span-2"><Label>Hedefler</Label><Textarea value={draft.hedefler ?? ""} onChange={e => setDraft({ ...draft, hedefler: e.target.value })} /></div>
        )}
      </div>

      {/* Seans Öncesi Form & Haftalık Ölçek */}
      <div className="mt-4 rounded-xl border border-gray-200 p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Seans Öncesi Ayarlar</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setFormAyar(a => ({ ...a, onForm: !a.onForm }))}
            className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${formAyar.onForm ? 'bg-[#6366f1]' : 'bg-gray-200'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${formAyar.onForm ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm text-gray-700">Seans öncesi form linki oluştur</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setFormAyar(a => ({ ...a, haftalikOlcek: !a.haftalikOlcek }))}
            className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${formAyar.haftalikOlcek ? 'bg-[#6366f1]' : 'bg-gray-200'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${formAyar.haftalikOlcek ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm text-gray-700">Haftalık ölçek uygula</span>
        </label>
        {formAyar.haftalikOlcek && (
          <div>
            <Label>Ölçek Seç</Label>
            <select
              value={formAyar.olcekId}
              onChange={e => setFormAyar(a => ({ ...a, olcekId: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30"
            >
              <option value="">— Seçiniz —</option>
              {OLCEKLER.filter(o => o.id !== 'custom').map(o => (
                <option key={o.id} value={o.id}>{o.tam}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Btn variant="outline" size="sm" onClick={() => { reset(); onClose(); }}>Vazgeç</Btn>
        <Btn size="sm" onClick={add} disabled={saving || !draft.adSoyad?.trim()}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Btn>
      </div>
    </Modal>
  );
}

// ============================================================
// ProfileEditModal — Terapist Profil "Profili düzenle"
// Gerçek kalıcı alanlar: terapist adı (/api/settings) + portre foto (localStorage).
// Statik profil içeriği Claude Design'da ayrıca düzenlenecek.
// ============================================================
function ProfileEditModal({ open, onClose, currentName, onSaved }: {
  open: boolean;
  onClose: () => void;
  currentName: string;
  onSaved: (name: string) => void;
}) {
  const [name, setName] = useState(currentName);
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(currentName);
    try { setPhoto(localStorage.getItem('tp-profile-photo')); } catch { setPhoto(null); }
  }, [open, currentName]);

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      try {
        if (photo) localStorage.setItem('tp-profile-photo', photo);
        else localStorage.removeItem('tp-profile-photo');
      } catch {}
      await fetch('/api/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ therapistName: name.trim() || 'Terapist' }),
      });
    } catch {}
    setSaving(false);
    onSaved(name.trim() || 'Terapist');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Profili Düzenle">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-[#07090f] text-white flex items-center justify-center overflow-hidden shrink-0">
            {photo
              ? <img alt="Portre" src={photo} className="w-full h-full object-cover" />
              : <span className="font-mono text-lg">{(name || 'GA').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => pickPhoto(e.target.files?.[0])} />
            <Btn size="sm" variant="outline" onClick={() => fileRef.current?.click()}>Fotoğraf yükle</Btn>
            {photo && <Btn size="sm" variant="ghost" onClick={() => setPhoto(null)}>Fotoğrafı kaldır</Btn>}
          </div>
        </div>
        <div>
          <Label>Ad Soyad</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Göksel Akkaya" />
          <p className="mt-1 text-xs text-gray-400">Ana sayfa, çalışma alanı ve selamlamalarda kullanılır.</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn variant="outline" size="sm" onClick={onClose}>Vazgeç</Btn>
        <Btn size="sm" onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Btn>
      </div>
    </Modal>
  );
}

// ============================================================
// ConsentShareModal — Terapist Profil "Onam formunu paylaş"
// Danışan seç → 'onam' tipi form-link üret → paylaşılabilir bağlantıyı kopyala.
// Danışan, /form/[token] üzerinden onam metnini okuyup onaylar.
// ============================================================
function ShareLinkModal({ open, onClose, patients, formTipi = 'onam', payload, modalTitle = 'Paylaş', ctaLabel = 'Link üret', successNoun = 'bağlantı', note }: {
  open: boolean;
  onClose: () => void;
  patients: Patient[];
  formTipi?: string;
  payload?: unknown;
  modalTitle?: string;
  ctaLabel?: string;
  successNoun?: string;
  note?: string;
}) {
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [link, setLink] = useState<{ name: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) { setQ(''); setLink(null); setCopied(false); setBusyId(null); }
  }, [open]);

  const candidates = patients
    .filter(p => p.status !== 'archived' && (p.adSoyad ?? '').trim())
    .filter(p => !q.trim() || (p.adSoyad ?? '').toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR')))
    .slice(0, 40);

  const generate = async (p: Patient) => {
    if (busyId) return;
    setBusyId(p.id);
    setCopied(false);
    try {
      const res = await fetch('/api/form-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: p.id, clientName: p.adSoyad, formTipi, payload }),
      });
      const row = await res.json();
      if (row?.token) {
        const url = `${window.location.origin}/form/${row.token}`;
        setLink({ name: p.adSoyad ?? '—', url });
        try { await navigator.clipboard.writeText(url); setCopied(true); } catch {}
      }
    } catch {}
    setBusyId(null);
  };

  const copyAgain = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link.url); setCopied(true); } catch {}
  };

  return (
    <Modal open={open} onClose={onClose} title={modalTitle}>
      {link ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
            <b>{link.name}</b> için {successNoun} oluşturuldu{copied ? ' ve panoya kopyalandı' : ''}.
          </div>
          <div className="flex items-center gap-2">
            <Input value={link.url} readOnly onFocus={e => e.currentTarget.select()} />
            <Btn size="sm" onClick={copyAgain}>{copied ? 'Kopyalandı' : 'Kopyala'}</Btn>
          </div>
          {note && <p className="text-xs text-gray-400">{note}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="outline" size="sm" onClick={() => { setLink(null); setCopied(false); }}>Başka danışan</Btn>
            <Btn size="sm" onClick={onClose}>Kapat</Btn>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Danışan ara…" autoFocus />
          <div className="max-h-72 overflow-y-auto space-y-1.5">
            {candidates.map(p => (
              <button
                key={p.id}
                onClick={() => generate(p)}
                disabled={!!busyId}
                className="w-full flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-left hover:bg-gray-50 transition disabled:opacity-50"
              >
                <div>
                  <div className="text-sm font-medium text-[#0E0F12]">{p.adSoyad}</div>
                  <div className="text-[11px] text-gray-500">{p.telefon ?? p.email ?? '—'}</div>
                </div>
                <span className="text-xs text-[#6366f1] font-medium">{busyId === p.id ? 'Oluşturuluyor…' : ctaLabel}</span>
              </button>
            ))}
            {candidates.length === 0 && (
              <p className="text-sm text-gray-500 py-3 text-center">Eşleşen danışan yok.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ============================================================
// MuhasebePanel — "Muhasebe İçerikleri": Drive bağla + fatura yükle (stub)
// TODO: Gerçek Google Drive OAuth + Drive API yükleme entegrasyonu.
// ============================================================
function MuhasebePanel({ onBack }: { onBack: () => void }) {
  const [connected, setConnected] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);
  const [toast, setToast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = Array.from(e.target.files ?? []);
    if (!fs.length) return;
    if (!connected) { flash('Önce Google Drive’a bağlanın.'); return; }
    // TODO: gerçek Drive yükleme — şimdilik yalnızca listeye eklenir (stub).
    setFiles((prev) => [...fs.map((f) => ({ name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB` })), ...prev]);
    flash(`${fs.length} dosya Drive’a yüklendi (demo).`);
    if (fileRef.current) fileRef.current.value = '';
  };
  return (
    <div className="min-h-screen w-full bg-[#EFEDE9] px-6 py-8 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#F1EFEA] border border-black/5 px-4 py-2 text-sm text-[#57554F] hover:text-[#2A2926] shadow-sm">‹ Çalışma Alanı</button>
        <div className="font-mono text-[10.5px] font-bold tracking-[.18em] uppercase text-[#8C8A84]">çalışma alanı · muhasebe</div>
        <h1 className="mt-2 text-[32px] font-medium tracking-tight text-[#2A2926]">Muhasebe <span className="italic text-[#A6A6A1]">içerikleri</span></h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#57554F] max-w-[58ch]">Faturalarını ve mali belgelerini kendi Google Drive’ında sakla. Önce Drive’a bağlan, sonra dosyaları doğrudan yükle.</p>

        {/* Drive bağlantısı */}
        <div className="mt-7 rounded-3xl border border-white/50 bg-[#F1EFEA] p-6 shadow-[-7px_-7px_18px_rgba(255,255,255,.72),11px_14px_30px_-10px_rgba(45,42,36,.2)]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[15px] font-semibold text-[#2A2926]">Google Drive</div>
              <div className="text-[12.5px] text-[#8C8A84] mt-1">{connected ? 'Bağlı · faturalar Drive’ına yüklenir' : 'Bağlı değil'}</div>
            </div>
            <button onClick={() => { setConnected((c) => !c); flash(connected ? 'Drive bağlantısı kesildi.' : 'Drive’a bağlanıldı (demo).'); }}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${connected ? 'bg-[#E7E4DE] text-[#57554F] border border-black/10' : 'bg-[#2A2926] text-[#F2F1ED]'}`}>
              {connected ? 'Bağlantıyı kes' : 'Drive’a bağlan'}
            </button>
          </div>
          <p className="mt-3 text-[11px] text-[#B6B4AD]">Not: Gerçek OAuth/Drive API bağlantısı sonra eklenecek (TODO). Şu an demo akış.</p>
        </div>

        {/* Yükleme */}
        <div className="mt-5 rounded-3xl border border-white/50 bg-[#F1EFEA] p-6 shadow-[-7px_-7px_18px_rgba(255,255,255,.72),11px_14px_30px_-10px_rgba(45,42,36,.2)]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[15px] font-semibold text-[#2A2926]">Fatura / belge yükle</div>
              <div className="text-[12.5px] text-[#8C8A84] mt-1">PDF, görsel veya tablo — doğrudan Drive’a.</div>
            </div>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={onPick} />
            <button onClick={() => fileRef.current?.click()} disabled={!connected}
              className="rounded-full px-5 py-2.5 text-sm font-semibold bg-[#2A2926] text-[#F2F1ED] disabled:opacity-40 disabled:cursor-not-allowed">
              Dosya yükle
            </button>
          </div>
          {files.length > 0 && (
            <div className="mt-4 divide-y divide-black/5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-[#2A2926] truncate">{f.name}</span>
                  <span className="font-mono text-[11px] text-[#8C8A84] flex-none ml-3">{f.size} · yüklendi ✓</span>
                </div>
              ))}
            </div>
          )}
          {files.length === 0 && <p className="mt-4 text-[13px] text-[#8C8A84] italic">Henüz dosya yok.</p>}
        </div>
      </div>
      {toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] rounded-full bg-[#131311] px-5 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
    </div>
  );
}

// ============================================================
// InlineToolBox — collapsible card wrapper for embedded tools
// ============================================================
function InlineToolBox({ icon, title, subtitle, children }: {
  icon: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${open ? 'bg-[#F4F5F8]' : 'bg-white hover:bg-[#F9FAFB]'}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-[#0E0F12]">{title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-gray-100 p-5 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Formulation
// ============================================================
function FormulationPanelLegacy({ state, dispatch, patientId, setPatientId }: { state: State; dispatch: React.Dispatch<Action>; patientId: string | null; setPatientId: (id: string | null) => void }) {
  const patient = state.patients.find(p => p.id === patientId);
  const existing = state.formulations.find(f => f.patientId === patientId);
  const [f, setF] = useState<Formulation>(existing ?? { id: uid(), patientId: patientId ?? "", updatedAt: new Date().toISOString() });
  const [saving, setSaving] = useState(false);
  const [archMenu, setArchMenu] = useState(false);
  const isCocuk = patient?.patientType === 'cocuk';
  const [innerTab, setInnerTab] = useState<'formulasyon' | 'ekler' | 'protokol' | 'dongu' | 'sablonlar' | 'model' | 'act' | 'pratik' | 'deger' | 'benlik' | 'cocuk-form' | 'cocuk-bdt' | 'oyun-terapisi' | 'mindmap' | 'mindmap1'>(
    isCocuk ? 'cocuk-form' : 'formulasyon'
  );

  useEffect(() => {
    if (!patientId) return;
    fetch(`/api/formulations/${patientId}`)
      .then(r => r.json())
      .then(data => {
        if (data) { dispatch({ type: "FORM_UPSERT", f: data }); setF(data); }
      })
      .catch(() => {});
  }, [patientId]);

  useEffect(() => {
    if (existing) setF(existing);
  }, [existing?.id]);

  // Reset tab when switching patients
  useEffect(() => {
    const p = state.patients.find(pt => pt.id === patientId);
    setInnerTab(p?.patientType === 'cocuk' ? 'cocuk-form' : 'formulasyon');
  }, [patientId]);

  if (!patient) {
    return (
      <Card>
        <p className="text-sm text-gray-500">Soldaki <strong>Danışanlar</strong> sekmesinden bir danışan seçin.</p>
        {state.patients.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {state.patients.filter(p => p.status !== "archived").map(p => (
              <button key={p.id} onClick={() => setPatientId(p.id)} className="rounded-full border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50 transition">{p.adSoyad}</button>
            ))}
          </div>
        )}
      </Card>
    );
  }

  const save = async () => {
    setSaving(true);
    const updated = { ...f, updatedAt: new Date().toISOString() };
    dispatch({ type: "FORM_UPSERT", f: updated });
    await fetch(`/api/formulations/${f.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    setSaving(false);
  };

  const FieldComp = ({ k, label, cat }: { k: keyof Formulation; label: string; cat?: string }) => (
    <div>
      <Label>{label}</Label>
      {cat ? (
        <TagAutocomplete tags={state.tags} category={cat} value={(f as any)[k] ?? ""} onChange={v => setF({ ...f, [k]: v } as Formulation)} />
      ) : (
        <Textarea value={(f as any)[k] ?? ""} onChange={e => setF({ ...f, [k]: e.target.value } as Formulation)} />
      )}
    </div>
  );

  const archivePatient = async (exitReason: "completed" | "dropout" | "financial") => {
    setArchMenu(false);
    dispatch({ type: "PATIENT_UPDATE", id: patient.id, patch: { status: "archived", exitReason } });
    await fetch(`/api/clients/${patient.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'archived', exitReason }) });
  };

  return (
    <div className="space-y-4">
      {/* Danışan başlık + iç sekme çubuğu */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[#0E0F12]">{patient.adSoyad}</h2>
              {isCocuk && <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold">Çocuk</span>}
            </div>
            <p className="text-xs text-gray-500">{patient.yas ? `${patient.yas} yaş · ` : ""}{patient.cinsiyet ?? ""} · {patient.telefon ?? "—"}</p>
          </div>
          {innerTab === 'formulasyon' && !isCocuk && (
            <Btn size="sm" onClick={save} disabled={saving}><Save className="h-3.5 w-3.5" /> {saving ? "Kaydediliyor…" : "Kaydet"}</Btn>
          )}
        </div>
        {/* İç sekme çubuğu */}
        {isCocuk ? (
          <div className="flex gap-1 bg-[#F4F5F8] dark:bg-gray-800 p-1 rounded-2xl overflow-x-auto">
            {([
              { k: 'cocuk-form',    l: '🧒 Değerlendirme'     },
              { k: 'cocuk-bdt',     l: '📋 Çocuk BDT'         },
              { k: 'oyun-terapisi', l: '🎭 Oyun Terapisi'      },
              { k: 'mindmap',       l: '🌐 3D Map'              },
              { k: 'mindmap1',      l: '🗺 Mind Map'            },
              { k: 'protokol',      l: 'Protokol'              },
              { k: 'dongu',         l: 'Döngüler'              },
              { k: 'sablonlar',     l: 'Şablonlar'             },
              { k: 'pratik',        l: 'Pratik Yap'            },
            ] as const).map(t => (
              <button key={t.k} onClick={() => setInnerTab(t.k)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  innerTab === t.k
                    ? 'bg-white dark:bg-gray-900 text-[#0E0F12] dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-[#0E0F12]'
                }`}>
                {t.l}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-1 bg-[#F4F5F8] dark:bg-gray-800 p-1 rounded-2xl overflow-x-auto">
            {([
              { k: 'formulasyon', l: 'Formülasyon'        },
              { k: 'mindmap',     l: '🌐 3D Map'           },
              { k: 'mindmap1',    l: '🗺 Mind Map'         },
              { k: 'ekler',       l: 'Ekleri'              },
              { k: 'protokol',    l: 'Protokol'            },
              { k: 'dongu',       l: 'Döngüler'            },
              { k: 'sablonlar',   l: 'Şablonlar'           },
              { k: 'model',       l: 'Model Oluştur'       },
              { k: 'act',         l: 'ACT Formülasyon'     },
              { k: 'pratik',      l: 'Pratik Yap'          },
              { k: 'deger',       l: 'Değer Kartları'      },
              { k: 'benlik',      l: '🪞 Benlik & Algı'     },
            ] as const).map(t => (
              <button key={t.k} onClick={() => setInnerTab(t.k)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  innerTab === t.k
                    ? 'bg-white dark:bg-gray-900 text-[#0E0F12] dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-[#0E0F12]'
                }`}>
                {t.l}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* ── Çocuk sekmeleri ── */}
      {innerTab === 'cocuk-form' && (
        <CocukDegerlendirme
          patientId={patient.id}
          patientName={patient.adSoyad}
        />
      )}
      {innerTab === 'cocuk-bdt' && (
        <CocukBdtForm
          patientId={patient.id}
          patientName={patient.adSoyad}
        />
      )}
      {innerTab === 'oyun-terapisi' && (
        <OyunTerapisi
          patientId={patient.id}
          patientName={patient.adSoyad}
        />
      )}

      {/* ── Ortak sekmeler ── */}
      {innerTab === 'mindmap' && (
        <DanisanMindMap3D
          patient={patient}
          formulation={f}
          seanslar={state.seanslar.filter(s => s.patientId === patient.id)}
        />
      )}
      {innerTab === 'mindmap1' && (
        <DanisanMindMap
          patient={patient}
          formulation={f}
          seanslar={state.seanslar.filter(s => s.patientId === patient.id)}
        />
      )}
      {innerTab === 'protokol' && (
        <div className="p-4 text-sm text-gray-500">
          Seans planlayıcıya geçmek için Kütüphane sekmesini kullanın.
        </div>
      )}
      {innerTab === 'ekler' && <FormulasyonEkleri />}
      {innerTab === 'dongu' && <BozuklukDongusu />}
      {innerTab === 'sablonlar' && <FormulasyonSablonlari />}
      {innerTab === 'model' && <ModelOlustur patientId={patientId ?? undefined} patient={patient} formulation={f} />}
      {innerTab === 'act' && <ActFormulasyon patientName={patient.adSoyad} patientAge={patient.yas} />}
      {innerTab === 'pratik' && <PratikYap />}
      {innerTab === 'deger' && <DegerKartlari />}
      {innerTab === 'benlik' && (
        <BenlikAlgisiPanel
          patientName={patient.adSoyad}
          initialData={(() => {
            try {
              const raw = (f as any).benlikAlgisiJson;
              return raw ? JSON.parse(raw) : undefined;
            } catch { return undefined; }
          })()}
          onSave={async (data: BenlikAlgisiData) => {
            const updated = { ...f, benlikAlgisiJson: JSON.stringify(data), updatedAt: new Date().toISOString() };
            dispatch({ type: 'FORM_UPSERT', f: updated as any });
            await fetch(`/api/formulations/${f.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ benlikAlgisiJson: JSON.stringify(data) }),
            });
          }}
        />
      )}

      {/* ── Ana Formülasyon ── */}
      {innerTab === 'formulasyon' && <>
      <Card>
        <h3 className="text-sm font-semibold text-[#0E0F12] mb-3">Klinik Profil</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <FieldComp k="anaSikayetler" label="Ana Şikayetler" cat="ana_sikayetler" />
          <FieldComp k="yonlendirmeNedeni" label="Yönlendirme Nedeni" cat="yonlendirme_nedeni" />
        </div>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-[#0E0F12] mb-3">4P — Vaka Formülasyonu</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <FieldComp k="predispozan" label="Predispozan (Hazırlayıcı)" cat="predispozan" />
          <FieldComp k="presipitan" label="Presipitan (Tetikleyici)" cat="presipitan" />
          <FieldComp k="perpetuan" label="Perpetuan (Sürdürücü)" cat="perpetuan" />
          <FieldComp k="protektif" label="Protektif (Koruyucu)" cat="protektif" />
        </div>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-[#0E0F12] mb-3">Bilişsel Yapı</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <FieldComp k="temelInanclar" label="Temel İnançlar" cat="temel_inanclar" />
          <FieldComp k="araInanclar" label="Ara İnançlar" cat="ara_inanclar" />
          <FieldComp k="basaCikma" label="Başa Çıkma Stratejileri" cat="basa_cikma" />
          <FieldComp k="otomatikDusunceler" label="Otomatik Düşünceler" cat="otomatik_dusunceler" />
          <FieldComp k="duyguBedensel" label="Duygu / Bedensel" cat="duygu_bedensel" />
          <FieldComp k="davranislar" label="Davranışlar" cat="davranislar" />
        </div>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-[#0E0F12] mb-3">SMART Hedefler</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <FieldComp k="smartSpesifik" label="Spesifik" />
          <FieldComp k="smartOlculebilir" label="Ölçülebilir" />
          <FieldComp k="smartZaman" label="Zaman" />
        </div>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-[#0E0F12] mb-1">ACT Hexaflex</h3>
        <p className="text-xs text-gray-400 mb-4">ACT'ın altı esneklik sürecine ilişkin klinik notlar.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <FieldComp k="actKabul" label="Kabul" />
          <FieldComp k="actDefuzyon" label="Bilişsel Defüzyon" />
          <FieldComp k="actSimdi" label="Şimdiki Ana Temas" />
          <FieldComp k="actBaglam" label="Bağlam Olarak Benlik" />
          <FieldComp k="actDegerler" label="Değerler" />
          <FieldComp k="actEylem" label="Kararlı Eylem" />
          <FieldComp k="actYaraticiCaresizlik" label="Yaratıcı Çaresizlik" />
        </div>
      </Card>

      {/* ── Gömülü araçlar ── */}
      <InlineToolBox icon="🗂" title="Formülasyon Şablonları" subtitle="Hazır BDT/ACT şablonlarını incele ve uygula">
        <FormulasyonSablonlari />
      </InlineToolBox>
      <InlineToolBox icon="🎯" title="Pratik Yap" subtitle="Modelleri ve teknikleri adım adım alıştır">
        <PratikYap />
      </InlineToolBox>
      <InlineToolBox icon="🃏" title="Değer Kartları" subtitle="ACT değer çalışması ve Boğa Gözü analizi">
        <DegerKartlari />
      </InlineToolBox>

      <div className="flex justify-between">
        <div className="relative">
          <Btn variant="outline" size="sm" onClick={() => setArchMenu(v => !v)}>
            <Archive className="h-3.5 w-3.5" /> Arşivle ▾
          </Btn>
          {archMenu && (
            <div className="absolute left-0 bottom-full mb-1 z-20 w-60 rounded-lg border border-black/10 bg-white shadow-lg p-1">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-gray-400">Ayrılış sebebi</div>
              <button type="button" className="w-full text-left px-3 py-2 text-sm rounded hover:bg-black/5" onClick={() => archivePatient('completed')}>Süreci tamamlandı</button>
              <button type="button" className="w-full text-left px-3 py-2 text-sm rounded hover:bg-black/5" onClick={() => archivePatient('dropout')}>Yarıda bıraktı</button>
              <button type="button" className="w-full text-left px-3 py-2 text-sm rounded hover:bg-black/5" onClick={() => archivePatient('financial')}>Maddi sebeple bıraktı</button>
            </div>
          )}
        </div>
        <Btn size="sm" onClick={save} disabled={saving}><Save className="h-3.5 w-3.5" /> {saving ? "Kaydediliyor…" : "Kaydet"}</Btn>
      </div>
      </>}
    </div>
  );
}

// ============================================================
// Seanslar (BDT)
// ============================================================
type SeansBildirim = {
  id: string; randevuId: string; clientId: string; clientName: string;
  seansNo: number; randevuTarihi: string; randevuSaati?: string;
  durum: string; mazeret?: string; terapistTutum?: string;
  dikkatEdilecekler?: string; niyetKalibi?: string; ertlemeTarihi?: string;
};

type FormYaniti = {
  id: string; token: string; client_id: string; form_tipi: string;
  olcek_id: string | null; olcek_ad: string | null;
  yanit_data: string; submitted_at: string;
};

type FormLinki = {
  id: string; token: string; client_id: string; client_name: string;
  form_tipi: string; olcek_id: string | null; olcek_ad: string | null;
  aktif: number; created_at: string;
};

const NIYET_LABELS: Record<string, string> = {
  kacınma: 'Kaçınma', odev_yapmama: 'Ödevi Yapmama', erteleme: 'Erteleme',
  motivasyon: 'Motivasyon Dalgalanması', dis_etken: 'Dış Etken', belirsiz: 'Belirsiz',
};

const DURUM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  no_show:  { bg: 'bg-red-50 border-red-100',    text: 'text-red-700',   label: 'No-show'  },
  iptal:    { bg: 'bg-gray-50 border-gray-200',   text: 'text-gray-600',  label: 'İptal'    },
  erteleme: { bg: 'bg-blue-50 border-blue-100',   text: 'text-blue-700',  label: 'Erteleme' },
};

// ── Ölçek Değişim Kartı (seanslar arası) ────────────────────────────────────
function OlcekDegisimKart({ prev, next }: { prev: BdtSeans; next: BdtSeans }) {
  const prevScores = prev.detay?.olcekler ?? [];
  const nextScores = next.detay?.olcekler ?? [];

  // Son ölçülen değeri al (aynı ölçek birden fazla girilmişse)
  const toMap = (arr: typeof prevScores) => {
    const m = new Map<string, (typeof arr)[0]>();
    arr.forEach(o => m.set(o.olcekId, o));
    return m;
  };
  const prevMap = toMap(prevScores);
  const nextMap = toMap(nextScores);

  // Öncesi ve sonrasında olan ortak ölçekler
  const shared = [...prevMap.entries()]
    .filter(([id]) => nextMap.has(id))
    .map(([id, p]) => {
      const n = nextMap.get(id)!;
      const tanim = OLCEKLER.find(o => o.id === id);
      const delta = n.skor - p.skor;
      const improved = tanim ? (tanim.higherBetter ? delta > 0 : delta < 0) : delta < 0;
      const prevSinif = getSinif(id, p.skor);
      const nextSinif = getSinif(id, n.skor);
      return { id, ad: n.ad, max: tanim?.max ?? 100, prev: p.skor, next: n.skor, delta, improved, prevSinif, nextSinif };
    });

  if (shared.length === 0) return null;

  const chartData = shared.map(s => ({
    name: s.ad,
    Öncesi: s.prev,
    Sonrası: s.next,
    max: s.max,
    improved: s.improved,
    delta: s.delta,
  }));

  return (
    <div className="mx-2 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/70 to-indigo-50/40 px-5 py-4">
      {/* Başlık */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-violet-200/60" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
          S{prev.no} → S{next.no} Ölçek Değişimi
        </span>
        <div className="h-px flex-1 bg-violet-200/60" />
      </div>

      {/* Delta özetleri */}
      <div className="flex flex-wrap gap-2 mb-4">
        {shared.map(s => {
          const sign = s.delta > 0 ? '+' : '';
          const color = s.improved ? '#16a34a' : s.delta === 0 ? '#6b7280' : '#dc2626';
          const bg    = s.improved ? 'bg-green-50 border-green-200' : s.delta === 0 ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200';
          const arrow = s.delta === 0 ? '→' : s.improved ? '↓' : '↑';
          return (
            <div key={s.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${bg}`}>
              <span className="text-xs font-semibold text-gray-700">{s.ad}</span>
              <span className="text-sm font-bold" style={{ color }}>{s.prev}</span>
              <span className="text-xs text-gray-400">{arrow}</span>
              <span className="text-sm font-bold" style={{ color }}>{s.next}</span>
              <span className="text-xs font-semibold rounded-full px-1.5 py-0.5"
                style={{ color, background: color + '18' }}>
                {sign}{s.delta}
              </span>
              {s.nextSinif && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ color: s.nextSinif.c, background: s.nextSinif.c + '20' }}>
                  {s.nextSinif.l}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Grouped bar chart */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="30%">
            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} width={28} />
            <RechartTooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #EDE9FE', fontSize: 12 }}
              cursor={{ fill: '#7C3AED08' }}
            />
            <Bar dataKey="Öncesi" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="#a78bfa" fillOpacity={0.7} />
              ))}
              <LabelList dataKey="Öncesi" position="top" style={{ fontSize: 10, fill: '#7c3aed' }} />
            </Bar>
            <Bar dataKey="Sonrası" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.improved ? '#4ade80' : entry.delta === 0 ? '#9ca3af' : '#f87171'} fillOpacity={0.85} />
              ))}
              <LabelList dataKey="Sonrası" position="top" style={{ fontSize: 10, fill: '#374151' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DevamsizlikKart({ sb }: { sb: SeansBildirim }) {
  const style = DURUM_COLORS[sb.durum] ?? DURUM_COLORS.iptal;
  const fmtD = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className={`rounded-2xl border px-4 py-3 ${style.bg} flex items-start gap-3`}>
      <div className="flex-shrink-0 mt-0.5">
        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} border-current/20`}>
          {style.label}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-700">{sb.seansNo}. Seans Randevusu</span>
          <span className="text-[10px] text-gray-400">{fmtD(sb.randevuTarihi)}{sb.randevuSaati && ` · ${sb.randevuSaati}`}</span>
        </div>
        {sb.mazeret && (
          <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Mazeret:</span> {sb.mazeret}</p>
        )}
        {sb.niyetKalibi && (
          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
            {NIYET_LABELS[sb.niyetKalibi] ?? sb.niyetKalibi}
          </span>
        )}
        {sb.terapistTutum && (
          <p className="text-xs text-gray-400 mt-1 italic">{sb.terapistTutum}</p>
        )}
        {sb.dikkatEdilecekler && (
          <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 rounded-lg px-2 py-1">⚠ {sb.dikkatEdilecekler}</p>
        )}
        {sb.durum === 'erteleme' && sb.ertlemeTarihi && (
          <p className="text-xs text-blue-600 mt-1">Erteleme tarihi: {fmtD(sb.ertlemeTarihi)}</p>
        )}
      </div>
    </div>
  );
}

// ── Form Yanıtı Kartı (seanslar arası) ──────────────────────────────────────
function FormYanitiKart({ yanit }: { yanit: FormYaniti }) {
  const parsed = React.useMemo(() => {
    try { return JSON.parse(yanit.yanit_data); } catch { return null; }
  }, [yanit.yanit_data]);

  const tarih = yanit.submitted_at?.split('T')[0] ?? '';

  if (!parsed) return null;

  if (parsed.type === 'olcek') {
    const olcek = OLCEKLER.find(o => o.id === parsed.olcekId);
    const sinif = olcek ? getSinif(parsed.olcekId, parsed.skor) : null;
    return (
      <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-sm font-bold flex-shrink-0">
          📊
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-violet-700">Seans Öncesi Ölçek</span>
            <span className="text-[10px] text-gray-400">{tarih}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-700">{olcek?.tam ?? yanit.olcek_ad ?? parsed.olcekId}</span>
            <span className="text-sm font-bold text-violet-700">{parsed.skor}</span>
            {sinif && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: sinif.c + '20', color: sinif.c }}>
                {sinif.l}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // on_form tipi
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-emerald-700">Seans Öncesi Form</span>
        <span className="text-[10px] text-gray-400">{tarih}</span>
      </div>
      <div className="space-y-1.5">
        {[
          { label: 'Nasıl hissetti', val: parsed.hissettim },
          { label: 'Zorluklar', val: parsed.zorluklar },
          { label: 'Beklentiler', val: parsed.beklentiler },
          { label: 'Ödev', val: parsed.odev },
        ].filter(f => f.val).map(f => (
          <div key={f.label}>
            <span className="text-[10px] font-medium text-emerald-600">{f.label}: </span>
            <span className="text-xs text-gray-600">{f.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Form Link Panel (form linkleri yönetimi) ─────────────────────────────────
function FormLinkPanel({ clientId, clientName, linkleri, onRefresh }: {
  clientId: string; clientName: string;
  linkleri: FormLinki[]; onRefresh: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [tip, setTip] = useState<'on_form' | 'olcek'>('on_form');
  const [olcekId, setOlcekId] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const create = async () => {
    setCreating(true);
    const olcek = OLCEKLER.find(o => o.id === olcekId);
    await fetch('/api/form-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId, clientName, formTipi: tip,
        olcekId: tip === 'olcek' ? olcekId : undefined,
        olcekAd: tip === 'olcek' ? olcek?.ad : undefined,
      }),
    });
    setCreating(false);
    onRefresh();
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${baseUrl}/form/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleAktif = async (id: string, aktif: number) => {
    await fetch('/api/form-link', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, aktif: aktif === 1 ? 0 : 1 }),
    });
    onRefresh();
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Form Linkleri</p>
      </div>

      {/* Yeni link oluştur */}
      <div className="flex gap-2 flex-wrap items-end">
        <div>
          <label className="text-[10px] text-gray-400 mb-1 block">Tip</label>
          <select value={tip} onChange={e => setTip(e.target.value as 'on_form' | 'olcek')}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
            <option value="on_form">Seans Öncesi Form</option>
            <option value="olcek">Ölçek</option>
          </select>
        </div>
        {tip === 'olcek' && (
          <div>
            <label className="text-[10px] text-gray-400 mb-1 block">Ölçek</label>
            <select value={olcekId} onChange={e => setOlcekId(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
              <option value="">— Seçin —</option>
              {OLCEKLER.filter(o => o.id !== 'custom').map(o => (
                <option key={o.id} value={o.id}>{o.ad}</option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={create}
          disabled={creating || (tip === 'olcek' && !olcekId)}
          className="px-3 py-1.5 rounded-lg bg-[#6366f1] text-white text-xs font-medium hover:bg-[#4f46e5] disabled:opacity-50 transition"
        >
          {creating ? '…' : '+ Link Oluştur'}
        </button>
      </div>

      {/* Mevcut linkler */}
      {linkleri.length === 0 ? (
        <p className="text-xs text-gray-400">Henüz form linki oluşturulmadı.</p>
      ) : (
        <div className="space-y-2">
          {linkleri.map(l => (
            <div key={l.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${l.aktif ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    l.form_tipi === 'olcek' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {l.form_tipi === 'olcek' ? (l.olcek_ad ?? 'Ölçek') : 'Ön Form'}
                  </span>
                  <span className="text-[10px] text-gray-400">{l.created_at?.split('T')[0]}</span>
                </div>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{baseUrl}/form/{l.token}</p>
              </div>
              <button
                onClick={() => copyLink(l.token)}
                className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-600 flex-shrink-0"
              >
                {copied === l.token ? '✓ Kopyalandı' : '📋 Kopyala'}
              </button>
              <button
                onClick={() => toggleAktif(l.id, l.aktif)}
                className={`text-[10px] px-2 py-1 rounded-lg transition flex-shrink-0 ${
                  l.aktif ? 'bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600' : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {l.aktif ? 'Kapat' : 'Aç'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SeansPanel({ state, dispatch, initialPatientId }: { state: State; dispatch: React.Dispatch<Action>; initialPatientId?: string | null }) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(initialPatientId ?? null);
  const [view, setView] = useState<'list' | 'new-anamnez' | 'new-seans' | 'edit-anamnez' | 'edit-seans' | 'detail'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [devamsizlik, setDevamsizlik] = useState<SeansBildirim[]>([]);
  const [formYanitlari, setFormYanitlari] = useState<FormYaniti[]>([]);
  const [formLinkleri, setFormLinkleri] = useState<FormLinki[]>([]);

  const selectedPatient = state.patients.find(p => p.id === selectedPatientId);
  const patientSeanslar: BdtSeans[] = (state.seanslar as unknown as BdtSeans[]).filter(s => s.patientId === selectedPatientId);
  const hasAnamnez = patientSeanslar.some(s => s.tip === 'anamnez');
  const nextNo = patientSeanslar.filter(s => s.tip === 'seans').length + 1;

  const refreshFormData = React.useCallback(() => {
    if (!selectedPatientId) return;
    fetch(`/api/form-yanitlari?clientId=${selectedPatientId}`)
      .then(r => r.json())
      .then((data: FormYaniti[]) => setFormYanitlari(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch(`/api/form-link?clientId=${selectedPatientId}`)
      .then(r => r.json())
      .then((data: FormLinki[]) => setFormLinkleri(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [selectedPatientId]);

  useEffect(() => {
    if (!selectedPatientId) return;
    fetch('/api/seans-bildirimleri')
      .then(r => r.json())
      .then((data: SeansBildirim[]) =>
        setDevamsizlik(data.filter(
          d => d.clientId === selectedPatientId && ['no_show', 'iptal', 'erteleme'].includes(d.durum)
        ))
      ).catch(() => {});
    refreshFormData();
  }, [selectedPatientId, refreshFormData]);

  if (!selectedPatientId || !selectedPatient) {
    return (
      <div className="space-y-4">
        <Card>
          <h2 className="text-lg font-semibold text-[#0E0F12] mb-4">Seanslar</h2>
          <p className="text-sm text-gray-500 mb-3">Seans notlarını görüntülemek için bir danışan seçin:</p>
          <div className="space-y-2">
            {state.patients.filter(p => p.status !== 'archived').map(p => {
              const seansCount = (state.seanslar as unknown as BdtSeans[]).filter(s => s.patientId === p.id).length;
              return (
                <button key={p.id} onClick={() => setSelectedPatientId(p.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 text-left hover:bg-gray-50 transition">
                  <div>
                    <div className="text-sm font-medium text-[#0E0F12]">{p.adSoyad}</div>
                    <div className="text-xs text-gray-500">{seansCount} seans kaydı</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              );
            })}
            {state.patients.filter(p => p.status !== 'archived').length === 0 && (
              <p className="text-sm text-gray-500">Henüz aktif danışan yok.</p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (view === 'new-anamnez' || view === 'edit-anamnez') {
    const editing = editingId ? patientSeanslar.find(s => s.id === editingId) : undefined;
    return (
      <AnamnezForm
        patientName={selectedPatient.adSoyad}
        initial={editing?.anamnez}
        initialTarih={editing?.tarih}
        onSave={async (tarih, data: AnamnezData) => {
          if (editingId) {
            dispatch({ type: 'SEANS_UPDATE', id: editingId, patch: { tarih, anamnez: data } as any });
            await fetch(`/api/seanslar/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tarih, anamnez: data }) });
          } else {
            const id = uid();
            const yeni: BdtSeans = { id, patientId: selectedPatientId, no: 1, tarih, tip: 'anamnez', anamnez: data, olusturmaTarihi: new Date().toISOString(), guncellemeTarihi: new Date().toISOString() };
            dispatch({ type: 'SEANS_ADD', s: yeni as any });
            await fetch('/api/seanslar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: selectedPatientId, tarih, tip: 'anamnez', no: 1, anamnez: data }) });
          }
          setView('list'); setEditingId(null);
        }}
        onCancel={() => { setView('list'); setEditingId(null); }}
      />
    );
  }

  if (view === 'new-seans' || view === 'edit-seans') {
    const editing = editingId ? patientSeanslar.find(s => s.id === editingId) : undefined;
    const seansNo = editing?.no ?? nextNo;
    return (
      <SeansNotuForm
        seansNo={seansNo}
        initial={editing?.seansNotu}
        initialTarih={editing?.tarih}
        onSave={async (tarih, data: SeansNotuData) => {
          if (editingId) {
            dispatch({ type: 'SEANS_UPDATE', id: editingId, patch: { tarih, seansNotu: data } as any });
            await fetch(`/api/seanslar/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tarih, seansNotu: data }) });
          } else {
            const id = uid();
            const yeni: BdtSeans = { id, patientId: selectedPatientId, no: seansNo, tarih, tip: 'seans', seansNotu: data, olusturmaTarihi: new Date().toISOString(), guncellemeTarihi: new Date().toISOString() };
            dispatch({ type: 'SEANS_ADD', s: yeni as any });
            await fetch('/api/seanslar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: selectedPatientId, tarih, tip: 'seans', no: seansNo, seansNotu: data }) });
          }
          setView('list'); setEditingId(null);
        }}
        onCancel={() => { setView('list'); setEditingId(null); }}
      />
    );
  }

  if (view === 'detail' && detailId) {
    const detailSeans = patientSeanslar.find(s => s.id === detailId);
    if (!detailSeans) { setView('list'); return null; }
    return (
      <SeansDetay
        seans={detailSeans}
        allSeanslar={patientSeanslar}
        patientName={selectedPatient?.adSoyad ?? ''}
        onBack={() => { setView('list'); setDetailId(null); }}
        onSave={async (id, detay: SeansDetayVerisi) => {
          dispatch({ type: 'SEANS_UPDATE', id, patch: { detay } as any });
          await fetch(`/api/seanslar/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ detay }),
          });
        }}
        onNavigate={(tabName) => {
          // Formulation tab'ına yönlendir (page-level setTab gerekir; şimdilik window.history kullanılmaz)
          // Kullanıcı formulation sekmesine geçer
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Form Linkleri */}
      <FormLinkPanel
        clientId={selectedPatientId}
        clientName={selectedPatient.adSoyad}
        linkleri={formLinkleri}
        onRefresh={refreshFormData}
      />

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setSelectedPatientId(null)}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 text-sm font-semibold transition">
            ←
          </button>
          <div>
            <h2 className="text-lg font-semibold text-[#0E0F12]">{selectedPatient.adSoyad}</h2>
            <p className="text-xs text-gray-500">{patientSeanslar.length} seans kaydı</p>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          {!hasAnamnez && (
            <button onClick={() => setView('new-anamnez')}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-[#0E0F12] text-white font-semibold text-sm hover:bg-[#1A1B22] transition">
              ① İlk Görüşme — BDT Anamnez
            </button>
          )}
          {hasAnamnez && (
            <button onClick={() => setView('new-seans')}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-[#0E0F12] text-white font-semibold text-sm hover:bg-[#1A1B22] transition">
              + Seans {nextNo} Notu
            </button>
          )}
        </div>
        <div className="space-y-2">
          {(() => {
            // Gerçek seanslar, devamsızlık ve form yanıtlarını seans numarasına göre birleştir
            const gercekSeanslar = [...patientSeanslar].sort((a, b) => a.no - b.no);
            type MergeItem =
              | { type: 'seans'; data: BdtSeans }
              | { type: 'devamsizlik'; data: SeansBildirim }
              | { type: 'form'; data: FormYaniti };
            const merged: MergeItem[] = [];

            // Form yanıtlarını tarihe göre sırala
            const sortedFormYanitlari = [...formYanitlari].sort(
              (a, b) => (a.submitted_at ?? '').localeCompare(b.submitted_at ?? '')
            );

            // Tüm seans numaralarını belirle (gerçek + devamsızlık)
            const sortedNos = [...new Set([
              ...gercekSeanslar.map(s => s.no),
              ...devamsizlik.map(d => d.seansNo),
            ])].sort((a, b) => a - b);

            sortedNos.forEach((no, noIdx) => {
              // Bu seanstan önceki tarih sınırı (önceki gerçek seansın tarihi)
              const prevGercek = gercekSeanslar.filter(s => s.no < no).pop();
              const prevDate = prevGercek?.tarih ?? '0000-00-00';
              const thisGercek = gercekSeanslar.find(s => s.no === no);
              const thisDate = thisGercek?.tarih ?? '9999-99-99';

              // Bu aralığa düşen form yanıtlarını ekle (seans öncesi)
              sortedFormYanitlari
                .filter(f => f.submitted_at > prevDate && f.submitted_at <= thisDate)
                .forEach(f => merged.push({ type: 'form', data: f }));

              // Bu no'ya ait devamsızlıkları ekle
              devamsizlik.filter(d => d.seansNo === no).forEach(d =>
                merged.push({ type: 'devamsizlik', data: d })
              );
              // Sonra gerçek seansı ekle
              gercekSeanslar.filter(s => s.no === no).forEach(s =>
                merged.push({ type: 'seans', data: s })
              );

              // Son seans sonrasındaki form yanıtlarını da ekle
              if (noIdx === sortedNos.length - 1) {
                sortedFormYanitlari
                  .filter(f => f.submitted_at > thisDate)
                  .forEach(f => merged.push({ type: 'form', data: f }));
              }
            });

            // Hiç seans yoksa form yanıtları tek başına da gösterilmeli
            if (sortedNos.length === 0 && sortedFormYanitlari.length > 0) {
              sortedFormYanitlari.forEach(f => merged.push({ type: 'form', data: f }));
            }

            if (merged.length === 0) return (
              <p className="text-sm text-gray-500 text-center py-6">Henüz seans kaydı yok. İlk görüşme formunu başlatın.</p>
            );

            // Gerçek seans listesi (sıralı) — ölçek karşılaştırması için
            const sortedGercek = gercekSeanslar.filter(s => s.tip === 'seans');

            return merged.map((item, i) => {
              if (item.type === 'devamsizlik') {
                return <DevamsizlikKart key={`d-${item.data.id}`} sb={item.data} />;
              }
              if (item.type === 'form') {
                return <FormYanitiKart key={`f-${item.data.id}`} yanit={item.data} />;
              }
              const s = item.data;

              // Bu seans kartından sonra ölçek değişim kartı gelecek mi?
              const thisIdx = sortedGercek.findIndex(x => x.id === s.id);
              const nextGercek = thisIdx >= 0 ? sortedGercek[thisIdx + 1] : undefined;
              const showOlcek = s.tip === 'seans' && nextGercek &&
                (s.detay?.olcekler?.length ?? 0) > 0 &&
                (nextGercek.detay?.olcekler?.length ?? 0) > 0;

              return (
                <React.Fragment key={s.id}>
                  <SeansCard seans={s}
                    onOpen={(id) => { setDetailId(id); setView('detail'); }}
                    onEdit={(id) => { setEditingId(id); setView(s.tip === 'anamnez' ? 'edit-anamnez' : 'edit-seans'); }}
                    onDelete={async (id) => {
                      dispatch({ type: 'SEANS_DELETE', id });
                      await fetch(`/api/seanslar/${id}`, { method: 'DELETE' });
                    }}
                  />
                  {showOlcek && <OlcekDegisimKart prev={s} next={nextGercek!} />}
                </React.Fragment>
              );
            });
          })()}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// Kütüphane + Arşiv wrapper
// ============================================================
function KutuphanePaneli({
  state, dispatch, router,
  interventions, basket, setBasket, setInterventions,
  activePatientId,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  router: ReturnType<typeof useRouter>;
  interventions: Intervention[];
  basket: string[];
  setBasket: React.Dispatch<React.SetStateAction<string[]>>;
  setInterventions: React.Dispatch<React.SetStateAction<Intervention[]>>;
  activePatientId: string | null;
}) {
  const [innerTab, setInnerTab] = useState<'kutuphane' | 'arsiv'>('kutuphane');

  const activePatient = activePatientId
    ? (state.patients as any[]).find((p: any) => String(p.id) === activePatientId)
    : null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-1 bg-[#F4F5F8] dark:bg-gray-800 p-1 rounded-2xl w-fit">
        {([
          { k: 'kutuphane', l: '📚 Müdahale Kütüphanesi' },
          { k: 'arsiv',     l: '🗂 Arşiv & Belgeler'      },
        ] as const).map(t => (
          <button key={t.k} onClick={() => setInnerTab(t.k)}
            className={`text-xs px-5 py-1.5 rounded-xl font-medium transition-colors ${
              innerTab === t.k
                ? 'bg-white dark:bg-gray-900 text-[#0E0F12] dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-[#0E0F12] dark:hover:text-white'
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {innerTab === 'kutuphane' && (
        <MudahalePanel
          interventions={interventions}
          activeClient={activePatient ? {
            id: String(activePatient.id),
            name: activePatient.adSoyad ?? activePatient.name ?? '—',
            age: activePatient.yas ? Number(activePatient.yas) : undefined,
          } : undefined}
          basket={basket}
          onAddToBasket={(id) => setBasket(b => b.includes(id) ? b : [...b, id])}
          onRemoveFromBasket={(id) => setBasket(b => b.filter(x => x !== id))}
          onReorderBasket={setBasket}
          onToggleFavorite={async (id) => {
            const r = await fetch(`/api/interventions/${id}/favorite`, { method: 'POST' });
            if (r.ok) {
              const result = await r.json();
              setInterventions(prev => prev.map(iv =>
                iv.id === id ? { ...iv, favorite: result.favorite } : iv
              ));
            }
          }}
          onCreateNew={() => { /* TODO: yeni müdahale modal */ }}
          onCreateSessionPlan={(ids) => {
            const base = activePatientId
              ? `/seans-planlayici?client=${activePatientId}&from=${ids.join(',')}`
              : `/seans-planlayici?from=${ids.join(',')}`;
            router.push(base);
            setBasket([]);
          }}
          onAssignToClient={async (id, target) => {
            await fetch('/api/intervention-assignments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ interventionId: id, ...target }),
            });
            setInterventions(prev => prev.map(iv =>
              iv.id === id ? { ...iv, useCount: (iv.useCount ?? 0) + 1 } : iv
            ));
          }}
          onSavePersonalNotes={async (id, notes) => {
            await fetch(`/api/interventions/${id}/notes`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notes }),
            });
            setInterventions(prev => prev.map(iv =>
              iv.id === id ? { ...iv, personalNotes: notes } : iv
            ));
          }}
          onExportPdf={(id) => window.open(`/api/interventions/${id}/pdf`)}
        />
      )}
      {innerTab === 'arsiv' && <ArchivePanel state={state} dispatch={dispatch} />}
    </div>
  );
}

// ============================================================
// Archive — kart düzeni
// ============================================================
function ArchivePanel({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // tüm arşivlenmemiş danışanlar (contact verisi için)
  const allPatients = state.patients.filter(p => p.status !== "archived");
  const archived    = state.patients.filter(p => p.status === "archived" && p.adSoyad.toLowerCase().includes(q.toLowerCase()));

  const toggleOnam = async (p: Patient) => {
    const patch = { onamImzalandi: !p.onamImzalandi };
    dispatch({ type: "PATIENT_UPDATE", id: p.id, patch });
    await fetch(`/api/clients/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  };

  const restore = async (p: Patient) => {
    dispatch({ type: "PATIENT_UPDATE", id: p.id, patch: { status: "active" } });
    await fetch(`/api/clients/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'active' }) });
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const phoneList  = allPatients.filter(p => p.telefon);
  const emailList  = allPatients.filter(p => p.email);
  const onamList   = allPatients;
  const onamSigned = onamList.filter(p => p.onamImzalandi).length;

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Onam Formları ─────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#0E0F12]">Onaylanmış Onam Formları</h2>
            <p className="text-xs text-gray-400 mt-0.5">{onamSigned} / {onamList.length} danışan · onam imzaladı</p>
          </div>
          <div className="h-8 w-8 rounded-xl bg-green-50 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
        </div>
        {/* İlerleme çubuğu */}
        <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: onamList.length > 0 ? `${Math.round((onamSigned / onamList.length) * 100)}%` : '0%' }}
          />
        </div>
        <div className="space-y-1.5">
          {onamList.map(p => (
            <div key={p.id} className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 transition ${p.onamImzalandi ? 'border-green-200 bg-green-50/40' : 'border-gray-100'}`}>
              <div>
                <span className="text-sm font-medium text-[#0E0F12]">{p.adSoyad}</span>
                {p.yas && <span className="text-xs text-gray-400 ml-2">{p.yas} yaş</span>}
              </div>
              <button
                onClick={() => toggleOnam(p)}
                className={`text-xs font-semibold px-3 py-1 rounded-xl transition ${
                  p.onamImzalandi
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600'
                }`}
              >
                {p.onamImzalandi ? '✓ İmzalandı' : 'İmzalanmadı'}
              </button>
            </div>
          ))}
          {onamList.length === 0 && <p className="text-sm text-gray-400">Henüz aktif danışan yok.</p>}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Onam metni şablonları:</p>
          <OnamMetinleri />
        </div>
      </Card>

      {/* ── Telefon Rehberi ───────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#0E0F12]">Danışan Telefon Numaraları</h2>
            <p className="text-xs text-gray-400 mt-0.5">{phoneList.length} danışanın telefonu kayıtlı</p>
          </div>
          <button
            onClick={() => copy(phoneList.map(p => `${p.adSoyad}: ${p.telefon}`).join('\n'), 'phone')}
            className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-600 flex items-center gap-1.5"
          >
            {copied === 'phone' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Download className="w-3.5 h-3.5" />}
            {copied === 'phone' ? 'Kopyalandı' : 'Tümünü Kopyala'}
          </button>
        </div>
        {phoneList.length === 0 ? (
          <p className="text-sm text-gray-400">Kayıtlı telefon numarası yok.</p>
        ) : (
          <div className="space-y-1.5">
            {phoneList.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl border border-gray-100 px-3 py-2.5">
                <div>
                  <span className="text-sm font-medium text-[#0E0F12]">{p.adSoyad}</span>
                  {p.il && <span className="text-xs text-gray-400 ml-2">· {p.il}{p.ilce ? ` / ${p.ilce}` : ''}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-700">{p.telefon}</span>
                  <button
                    onClick={() => copy(p.telefon!, `phone_${p.id}`)}
                    className="text-gray-300 hover:text-gray-600 transition"
                  >
                    {copied === `phone_${p.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <ClipboardList className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── E-posta Listesi ───────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#0E0F12]">Danışan E-posta Adresleri</h2>
            <p className="text-xs text-gray-400 mt-0.5">{emailList.length} danışanın e-postası kayıtlı</p>
          </div>
          <button
            onClick={() => copy(emailList.map(p => p.email).join(', '), 'email')}
            className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-600 flex items-center gap-1.5"
          >
            {copied === 'email' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Download className="w-3.5 h-3.5" />}
            {copied === 'email' ? 'Kopyalandı' : 'Tümünü Kopyala'}
          </button>
        </div>
        {emailList.length === 0 ? (
          <p className="text-sm text-gray-400">Kayıtlı e-posta adresi yok.</p>
        ) : (
          <div className="space-y-1.5">
            {emailList.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl border border-gray-100 px-3 py-2.5">
                <span className="text-sm font-medium text-[#0E0F12]">{p.adSoyad}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{p.email}</span>
                  <button
                    onClick={() => copy(p.email!, `email_${p.id}`)}
                    className="text-gray-300 hover:text-gray-600 transition"
                  >
                    {copied === `email_${p.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <ClipboardList className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Arşivlenen Danışanlar ─────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#0E0F12]">Arşivlenen Danışanlar ({archived.length})</h2>
          <div className="relative w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Ara…" className="pl-9 py-2 text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          {archived.map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl border border-gray-100 px-3 py-2.5">
              <div>
                <span className="text-sm font-medium text-[#0E0F12]">{p.adSoyad}</span>
                <span className="text-xs text-gray-400 ml-2">· {fmtDate(p.basvuruTarihi)}</span>
              </div>
              <Btn size="sm" variant="outline" onClick={() => restore(p)}>
                <RefreshCw className="h-3.5 w-3.5" /> Geri Al
              </Btn>
            </div>
          ))}
          {archived.length === 0 && <p className="text-sm text-gray-400">Arşivde kayıt yok.</p>}
        </div>
      </Card>

      {/* ── Klinik Etiketler ──────────────────────────────────────────────────── */}
      <ClinicalTagsManager state={state} dispatch={dispatch} />
    </div>
  );
}

// ============================================================
// Pending Files
// ============================================================
// ============================================================
// Bildirimler (Bekleyen Dosyalar + Drop İstatistik)
// ============================================================
function BildirimlerPanel({ state, dispatch, onOpenFormulation }: { state: State; dispatch: React.Dispatch<Action>; onOpenFormulation: (name: string) => void }) {
  const [inner, setInner] = useState<'bekleyen' | 'drop'>('bekleyen');
  const pendingCount = state.pending.filter(p => p.status === "pending").length;
  const droppedCount = state.pending.filter(p => p.status === "dropped").length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* İç sekme çubuğu */}
      <div className="flex gap-1 bg-[#F4F5F8] dark:bg-gray-800 p-1 rounded-2xl w-fit">
        {([
          { k: 'bekleyen', l: `Bekleyen Dosyalar${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { k: 'drop',     l: `Drop İstatistik${droppedCount > 0 ? ` (${droppedCount})` : ''}` },
        ] as const).map(t => (
          <button key={t.k} onClick={() => setInner(t.k)}
            className={`text-xs px-5 py-1.5 rounded-xl font-medium transition-colors ${
              inner === t.k
                ? 'bg-white dark:bg-gray-900 text-[#0E0F12] dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-[#0E0F12] dark:hover:text-white'
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {inner === 'bekleyen' && <PendingFilesPanel state={state} dispatch={dispatch} onOpenFormulation={onOpenFormulation} />}
      {inner === 'drop'     && <DroppedPatientsPanel state={state} dispatch={dispatch} />}
    </div>
  );
}

function PendingFilesPanel({ state, dispatch, onOpenFormulation }: { state: State; dispatch: React.Dispatch<Action>; onOpenFormulation: (name: string) => void }) {
  const pending = state.pending.filter(p => p.status === "pending");

  const markDrop = async (p: PendingFile, reason: DropReason) => {
    const patch = { status: "dropped" as const, dropReason: reason, droppedAt: new Date().toISOString() };
    dispatch({ type: "PENDING_UPDATE", id: p.id, patch });
    await fetch(`/api/pending/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-4 w-4 text-amber-600" />
        <h2 className="text-lg font-semibold text-[#0E0F12]">Bekleyen Dosyalar ({pending.length})</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">Geçmiş randevuya rağmen dosyası oluşturulmamış kayıtlar.</p>
      <div className="space-y-2">
        {pending.map(p => {
          const delay = Math.max(0, Math.floor((Date.now() - new Date(p.randevuTarihi).getTime()) / 86400000));
          return (
            <div key={p.id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#0E0F12]">{p.adSoyad}</div>
                  <div className="text-xs text-gray-500">{fmtDate(p.randevuTarihi)} · <Badge tone="amber">{delay} gün gecikme</Badge></div>
                  {p.not && <p className="mt-1 text-xs text-gray-600">{p.not}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Btn size="sm" onClick={() => onOpenFormulation(p.adSoyad)}><FileText className="h-3.5 w-3.5" /> Dosya Oluştur</Btn>
                  <div className="flex gap-1">
                    <Btn size="sm" variant="outline" onClick={() => markDrop(p, "no_show")}><UserX className="h-3.5 w-3.5" /> No-show</Btn>
                    <Btn size="sm" variant="outline" onClick={() => markDrop(p, "first_session_drop")}>İlk Drop</Btn>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {pending.length === 0 && <p className="text-sm text-gray-500">Bekleyen dosya yok.</p>}
      </div>
    </Card>
  );
}

// ============================================================
// Dropped statistics
// ============================================================
function DroppedPatientsPanel({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const dropped = state.pending.filter(p => p.status === "dropped");
  const noShow = dropped.filter(d => d.dropReason === "no_show").length;
  const firstDrop = dropped.filter(d => d.dropReason === "first_session_drop").length;
  const midDrop = dropped.filter(d => d.dropReason === "mid_therapy_drop").length;
  const last30 = dropped.filter(d => Date.now() - new Date(d.droppedAt ?? d.createdAt).getTime() < 30 * 86400000).length;

  const labelMap: Record<DropReason, string> = {
    no_show: "Randevuya gelmedi",
    first_session_drop: "İlk seans drop",
    mid_therapy_drop: "Terapi ortası drop",
  };

  const restore = async (d: PendingFile) => {
    const patch = { status: "pending" as const, dropReason: undefined, droppedAt: undefined };
    dispatch({ type: "PENDING_UPDATE", id: d.id, patch });
    await fetch(`/api/pending/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'pending', drop_reason: null, dropped_at: null }) });
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-4 gap-3">
        {[
          ["Toplam Drop", dropped.length],
          ["Son 30 Gün", last30],
          ["No-show", noShow],
          ["İlk Seans Drop", firstDrop],
        ].map(([t, v]) => (
          <Card key={t as string} className="!p-4">
            <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{t}</div>
            <div className="mt-1 text-2xl font-bold text-[#0E0F12]">{v as number}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="h-4 w-4 text-[#0E0F12]" />
          <h3 className="text-sm font-semibold text-[#0E0F12]">Drop Geçmişi</h3>
        </div>
        <div className="space-y-2">
          {dropped.map(d => (
            <div key={d.id} className="flex items-center justify-between rounded-2xl border border-gray-100 p-3">
              <div>
                <div className="text-sm font-semibold text-[#0E0F12]">{d.adSoyad}</div>
                <div className="text-xs text-gray-500">{fmtDate(d.droppedAt)} · {labelMap[d.dropReason!]}</div>
                {d.not && <p className="mt-1 text-xs text-gray-600">{d.not}</p>}
              </div>
              <Btn size="sm" variant="outline" onClick={() => restore(d)}>
                <RefreshCw className="h-3.5 w-3.5" /> Geri Al
              </Btn>
            </div>
          ))}
          {dropped.length === 0 && <p className="text-sm text-gray-500">Henüz drop kaydı yok.</p>}
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#0E0F12]" />
          <span className="text-sm text-[#0E0F12]">Terapi ortası drop: <strong>{midDrop}</strong></span>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// SMS Panel
// ============================================================
function SmsPanel({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ checked: number; updated: number; error?: string } | null>(null);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todays = state.sms.filter(m => new Date(m.createdAt) >= today);

  const send = async () => {
    if (!phone.trim() || !message.trim()) return;
    const log: SmsLog = { id: uid(), phone, name, message, trigger: "manual", status: "queued", createdAt: new Date().toISOString() };
    dispatch({ type: "SMS_ADD", m: log });
    setSending(true);
    try {
      const r = await fetch('/api/sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...log, trigger_type: 'manual' }) });
      const result = await r.json();
      dispatch({ type: "SMS_UPDATE", id: log.id, patch: { status: result.status ?? 'failed', error: result.error, sentAt: result.status === 'sent' ? new Date().toISOString() : undefined } });
    } catch (e: any) {
      dispatch({ type: "SMS_UPDATE", id: log.id, patch: { status: "failed", error: e?.message ?? "Hata" } });
    } finally { setSending(false); setPhone(""); setName(""); setMessage(""); }
  };

  const syncFromMail = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const r = await fetch('/api/sms/sync-mail');
      const result = await r.json();
      if (!r.ok) {
        setSyncResult({ checked: 0, updated: 0, error: result.error ?? 'Bağlantı hatası' });
        return;
      }
      setSyncResult({ checked: result.checked ?? 0, updated: result.updated ?? 0 });
      // Refresh SMS list to show updated delivery statuses
      if (result.updated > 0) {
        const fresh = await fetch('/api/sms').then(r2 => r2.json()).catch(() => null);
        if (Array.isArray(fresh)) {
          for (const m of fresh) {
            if (m.deliveryStatus) {
              dispatch({ type: "SMS_UPDATE", id: m.id, patch: { deliveryStatus: m.deliveryStatus, deliveredAt: m.deliveredAt } });
            }
          }
        }
      }
    } catch (e: any) {
      setSyncResult({ checked: 0, updated: 0, error: e?.message ?? 'Hata' });
    } finally {
      setSyncing(false);
    }
  };

  const hasGmailConfig = !!(state.settings.gmailUser && state.settings.gmailAppPassword);

  return (
    <div className="space-y-4">
      {!state.settings.smsWebhookUrl && (
        <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-sm"><AlertTriangle className="h-4 w-4" /> SMS sağlayıcı bağlı değil</div>
          <p className="mt-1 text-xs text-red-700">Netgsm webhook URL'i <strong>Ayarlar</strong> sekmesinden girilmeli.</p>
        </div>
      )}
      <Card>
        <h2 className="text-lg font-semibold text-[#0E0F12] mb-3">Manuel SMS</h2>
        {/* Message templates */}
        <div className="mb-3">
          <Label>Şablon Seç</Label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {[
              { label: 'Randevu Hatırlatma', text: 'Merhaba [İsim], yarınki seansınızı hatırlatmak istedim. Saat [Saat]\'de görüşmek üzere.' },
              { label: 'İptal Bildirimi', text: 'Merhaba [İsim], [Tarih] tarihli seansımızı iptal etmem gerekiyor. En kısa sürede yeni bir randevu ayarlayalım.' },
              { label: 'Ödev Paylaşımı', text: 'Merhaba [İsim], bu haftaki çalışmanızı hatırlatmak istedim: [Ödev]. Sorularınız olursa yazabilirsiniz.' },
              { label: 'Kriz Takibi', text: 'Merhaba [İsim], nasıl olduğunuzu merak ettim. Konuşmak isterseniz beni arayabilirsiniz.' },
              { label: 'Ölçek Hatırlatma', text: 'Merhaba [İsim], bu haftaki değerlendirme formunu doldurmayı unutmayın. Teşekkürler.' },
            ].map(t => (
              <button key={t.label} onClick={() => setMessage(t.text)} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:border-[#0E0F12] hover:bg-gray-50 transition text-gray-600">
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Telefon</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0555…" /></div>
          <div><Label>Alıcı Adı (opsiyonel)</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
        </div>
        <div className="mt-3"><Label>Mesaj</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} /></div>
        <div className="flex justify-end mt-3">
          <Btn onClick={send} disabled={sending}><Send className="h-3.5 w-3.5" /> Gönder</Btn>
        </div>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-[#0E0F12] mb-3">Otomatik Tetikleyiciler</h3>
        <Toggle label="Randevu hatırlatma (danışana)" checked={state.settings.smsAutoAppointmentReminder} onChange={async v => {
          dispatch({ type: "SETTINGS", patch: { smsAutoAppointmentReminder: v } });
          await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ smsAutoAppointmentReminder: v }) });
        }} />
        <Toggle label="Atölye kaydı yapıldığında" checked={state.settings.smsAutoWorkshopSignup} onChange={async v => {
          dispatch({ type: "SETTINGS", patch: { smsAutoWorkshopSignup: v } });
          await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ smsAutoWorkshopSignup: v }) });
        }} />
      </Card>

      {/* Mail-based delivery report sync */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-[#0E0F12]">İletim Raporu · Gmail IMAP</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {hasGmailConfig
                ? `${state.settings.gmailUser} · Son 7 günlük iletim raporları çekilir`
                : 'Gmail hesabı ayarlanmamış — Ayarlar sekmesine gidin'}
            </p>
          </div>
          <Btn
            onClick={syncFromMail}
            disabled={syncing || !hasGmailConfig}
          >
            {syncing
              ? <><span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" /> Çekiliyor…</>
              : <><RefreshCw className="h-3.5 w-3.5" /> Mail'den Senkronize Et</>}
          </Btn>
        </div>
        {syncResult && (
          syncResult.error
            ? <p className="text-[11px] text-red-600 rounded-xl bg-red-50 border border-red-200 p-2">{syncResult.error}</p>
            : <p className="text-[11px] text-green-700 rounded-xl bg-green-50 border border-green-200 p-2">
                {syncResult.checked} e-posta tarandı · {syncResult.updated} SMS güncellendi
              </p>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-[#0E0F12] mb-3">Bugünkü Aktivite ({todays.length})</h3>
        <div className="space-y-2">
          {state.sms.slice(0, 30).map(m => (
            <div key={m.id} className="flex items-start justify-between rounded-2xl border border-gray-100 p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <span className="font-semibold text-[#0E0F12]">{m.phone}</span>
                  {m.name && <span className="text-gray-500">· {m.name}</span>}
                  <Badge tone={m.status === "sent" ? "green" : m.status === "failed" ? "red" : "amber"}>{m.status}</Badge>
                  {m.deliveryStatus && (
                    <Badge tone={m.deliveryStatus === 'delivered' ? 'green' : 'red'}>
                      {m.deliveryStatus === 'delivered' ? '✓ iletildi' : '✗ iletilemedi'}
                    </Badge>
                  )}
                  <Badge tone="slate">{m.trigger}</Badge>
                </div>
                <p className="mt-1 text-xs text-gray-700">{m.message}</p>
                {m.error && <p className="mt-1 text-[11px] text-red-600">{m.error}</p>}
                {m.deliveredAt && (
                  <p className="mt-0.5 text-[11px] text-green-600">İletildi: {fmtDateTime(m.deliveredAt)}</p>
                )}
              </div>
              <span className="text-[11px] text-gray-400 shrink-0 ml-2">{fmtDateTime(m.sentAt ?? m.createdAt)}</span>
            </div>
          ))}
          {state.sms.length === 0 && <p className="text-sm text-gray-500">Henüz SMS kaydı yok.</p>}
        </div>
      </Card>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-gray-100 p-3 cursor-pointer mb-2">
      <span className="text-sm text-gray-700">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={cx("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-[#0E0F12]" : "bg-gray-300")}>
        <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

// ============================================================
// Clinical Tags Manager
// ============================================================

/** Per-category accent colours for the marquee badges */
const CAT_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  ana_sikayetler:      { bg: "bg-rose-500",    text: "text-white", ring: "ring-rose-300"    },
  yonlendirme_nedeni:  { bg: "bg-orange-500",  text: "text-white", ring: "ring-orange-300"  },
  sunum_sorunu:        { bg: "bg-amber-500",   text: "text-white", ring: "ring-amber-300"   },
  predispozan:         { bg: "bg-yellow-500",  text: "text-white", ring: "ring-yellow-300"  },
  presipitan:          { bg: "bg-lime-600",    text: "text-white", ring: "ring-lime-400"    },
  perpetuan:           { bg: "bg-emerald-600", text: "text-white", ring: "ring-emerald-400" },
  protektif:           { bg: "bg-teal-500",    text: "text-white", ring: "ring-teal-300"    },
  temel_inanclar:      { bg: "bg-cyan-600",    text: "text-white", ring: "ring-cyan-400"    },
  ara_inanclar:        { bg: "bg-sky-500",     text: "text-white", ring: "ring-sky-300"     },
  basa_cikma:          { bg: "bg-blue-600",    text: "text-white", ring: "ring-blue-400"    },
  otomatik_dusunceler: { bg: "bg-indigo-600",  text: "text-white", ring: "ring-indigo-400"  },
  duygu_bedensel:      { bg: "bg-violet-600",  text: "text-white", ring: "ring-violet-400"  },
  davranislar:         { bg: "bg-purple-600",  text: "text-white", ring: "ring-purple-400"  },
};

const DEFAULT_COLOR = { bg: "bg-gray-500", text: "text-white", ring: "ring-gray-300" };

function ClinicalTagsManager({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const [active, setActive] = useState(TAG_CATEGORIES[0].key);
  const [label, setLabel] = useState("");
  const inCat = state.tags.filter(t => t.category === active);

  /* Split all tags into two rows for the double-marquee */
  const allTags = state.tags;
  const rowA = allTags.filter((_, i) => i % 2 === 0);
  const rowB = allTags.filter((_, i) => i % 2 !== 0);

  const addTag = async () => {
    if (!label.trim()) return;
    const t: Tag = { id: uid(), category: active, label: label.trim(), count: 0 };
    dispatch({ type: "TAG_ADD", t });
    await fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) });
    setLabel("");
  };

  const removeTag = async (id: string) => {
    dispatch({ type: "TAG_DELETE", id });
    await fetch(`/api/tags/${id}`, { method: 'DELETE' });
  };

  return (
    <Card>
      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-1">
        <TagIcon className="h-4 w-4" />
        <h2 className="text-lg font-semibold text-[#0E0F12]">Klinik Etiket Sözlüğü</h2>
        <span className="text-xs text-gray-500">({state.tags.length} etiket · {TAG_CATEGORIES.length} kategori)</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">Yeni danışan formunda otomatik tamamlama olarak gösterilir.</p>

      {/* ── Marquee showcase ── */}
      {allTags.length > 0 && (
        <div className="mb-5 rounded-2xl overflow-hidden border border-gray-100 bg-[#FAFAFA] py-3 space-y-2">
          {/* Row A — left → right, pause on hover */}
          <Marquee pauseOnHover speed="slow" repeat={4}>
            {(rowA.length > 0 ? rowA : allTags).map(t => {
              const c = CAT_COLORS[t.category] ?? DEFAULT_COLOR;
              const catLabel = TAG_CATEGORIES.find(x => x.key === t.category)?.label ?? t.category;
              return (
                <span
                  key={t.id}
                  title={catLabel}
                  className={cx(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 select-none",
                    c.bg, c.text, c.ring,
                  )}
                >
                  {t.label}
                </span>
              );
            })}
          </Marquee>

          {/* Row B — right → left, slightly faster */}
          {rowB.length > 0 && (
            <Marquee pauseOnHover reverse speed="slow" repeat={4}>
              {rowB.map(t => {
                const c = CAT_COLORS[t.category] ?? DEFAULT_COLOR;
                const catLabel = TAG_CATEGORIES.find(x => x.key === t.category)?.label ?? t.category;
                return (
                  <span
                    key={t.id}
                    title={catLabel}
                    className={cx(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 select-none",
                      c.bg, c.text, c.ring,
                    )}
                  >
                    {t.label}
                  </span>
                );
              })}
            </Marquee>
          )}

          {/* Legend strip */}
          <div className="flex flex-wrap gap-1.5 px-3 pt-1">
            {TAG_CATEGORIES.filter(c => state.tags.some(t => t.category === c.key)).map(c => {
              const col = CAT_COLORS[c.key] ?? DEFAULT_COLOR;
              return (
                <span key={c.key} className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1", col.bg, col.text, col.ring)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                  {c.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Category filter ── */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TAG_CATEGORIES.map(c => {
          const n = state.tags.filter(t => t.category === c.key).length;
          const col = CAT_COLORS[c.key] ?? DEFAULT_COLOR;
          const isActive = active === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={cx(
                "text-xs px-3 py-1.5 rounded-full border transition ring-1",
                isActive
                  ? cx(col.bg, col.text, col.ring, "border-transparent")
                  : "bg-white border-gray-200 text-gray-600 ring-transparent hover:border-gray-400",
              )}
            >
              {c.label} <span className="opacity-60">· {n}</span>
            </button>
          );
        })}
      </div>

      {/* ── Add input ── */}
      <div className="flex gap-2 mb-4">
        <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Yeni etiket…" onKeyDown={e => { if (e.key === "Enter") addTag(); }} />
        <Btn size="sm" onClick={addTag}><Plus className="h-3.5 w-3.5" /> Ekle</Btn>
      </div>

      {/* ── Tag pills for active category ── */}
      <div className="flex flex-wrap gap-1.5 min-h-[60px]">
        {inCat.map(t => {
          const col = CAT_COLORS[t.category] ?? DEFAULT_COLOR;
          return (
            <span
              key={t.id}
              className={cx(
                "group inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ring-1 font-medium",
                col.bg, col.text, col.ring,
              )}
            >
              {t.label}
              <button onClick={() => removeTag(t.id)} className="opacity-60 hover:opacity-100 transition">
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          );
        })}
        {inCat.length === 0 && (
          <span className="text-xs text-gray-400 italic">Bu kategoride henüz etiket yok.</span>
        )}
      </div>
    </Card>
  );
}

// ============================================================
// Settings
// ============================================================
function SettingsPanel({ state, dispatch, onSeedData }: { state: State; dispatch: React.Dispatch<Action>; onSeedData?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const updateSetting = async (patch: Partial<Settings_>) => {
    dispatch({ type: "SETTINGS", patch });
    await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `formulasyon-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-semibold text-[#0E0F12] mb-3">Genel</h2>
        <div>
          <Label>Terapist Adı (selamda kullanılır)</Label>
          <Input value={state.settings.therapistName} onChange={e => updateSetting({ therapistName: e.target.value })} />
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-[#0E0F12] mb-1">SMS — Netgsm Webhook</h2>
        <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-3 mb-3">
          <p className="text-xs text-red-700 font-semibold">⚠ Bu alan kendi Netgsm proxy URL'inizle doldurulmalı.</p>
          <p className="text-[11px] text-red-600 mt-1">URL boşsa SMS'ler kuyruğa yazılır ama gönderilmez. Doluysa POST JSON &#123;to, text, name&#125; formatında istek atılır.</p>
        </div>
        <Label>Webhook URL</Label>
        <Input value={state.settings.smsWebhookUrl} onChange={e => updateSetting({ smsWebhookUrl: e.target.value })} placeholder="https://localhost:3001/sms" />
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-[#0E0F12] mb-1">İletim Raporu — Gmail IMAP</h2>
        <p className="text-[11px] text-gray-500 mb-3">
          SMS sağlayıcısının gönderdiği iletim raporu e-postalarını Gmail'den çekmek için kullanılır.
          Gmail hesabınızda <strong>2FA</strong> ve <strong>Uygulama Şifresi</strong> etkin olmalı.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Gmail Adresi</Label>
            <Input
              type="email"
              value={state.settings.gmailUser}
              onChange={e => updateSetting({ gmailUser: e.target.value })}
              placeholder="klinik@gmail.com"
            />
          </div>
          <div>
            <Label>Uygulama Şifresi (App Password)</Label>
            <Input
              type="password"
              value={state.settings.gmailAppPassword}
              onChange={e => updateSetting({ gmailAppPassword: e.target.value })}
              placeholder="xxxx xxxx xxxx xxxx"
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>IMAP Sunucusu</Label>
            <Input
              value={state.settings.gmailImapHost}
              onChange={e => updateSetting({ gmailImapHost: e.target.value })}
              placeholder="imap.gmail.com"
            />
          </div>
          <div>
            <Label>IMAP Port</Label>
            <Input
              type="number"
              value={String(state.settings.gmailImapPort)}
              onChange={e => updateSetting({ gmailImapPort: Number(e.target.value) || 993 })}
              placeholder="993"
            />
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-3">
          Google Hesap → Güvenlik → Uygulama Şifreleri (2FA etkinken görünür).
          Şifre bu cihazda şifreli olarak saklanır, dışarıya iletilmez.
        </p>
      </Card>
      {onSeedData && (
        <Card>
          <h2 className="text-lg font-semibold text-[#0E0F12] mb-1">Örnek Veri</h2>
          <p className="text-xs text-gray-500 mb-3">3 örnek danışan (Ayşe Yılmaz, Mehmet Kara, Zeynep Demir) ve seans notları ekler. Mevcut veriler korunur.</p>
          <Btn variant="outline" onClick={onSeedData}><Plus className="h-3.5 w-3.5" /> Örnek Verileri Yükle</Btn>
        </Card>
      )}
      <Card>
        <h2 className="text-lg font-semibold text-[#0E0F12] mb-3">Yedekleme</h2>
        <div className="flex gap-2">
          <Btn variant="outline" onClick={exportJson}><Download className="h-3.5 w-3.5" /> JSON İndir</Btn>
          <Btn variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" /> JSON Yükle</Btn>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const r = new FileReader();
            r.onload = () => { try { dispatch({ type: "SET", state: JSON.parse(r.result as string) }); alert("Yüklendi"); } catch { alert("Geçersiz JSON"); } };
            r.readAsText(file);
          }} />
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// Danışanlar + Seanslar combined panel
// ============================================================
function DanisanlarPanelLegacy({ state, dispatch, onOpenFormulation }: {
  state: State;
  dispatch: React.Dispatch<Action>;
  onOpenFormulation: (id: string) => void;
}) {
  const [innerTab, setInnerTab] = useState<'danisanlar' | 'seanslar'>('danisanlar');
  const [seansPatientId, setSeansPatientId] = useState<string | null>(null);

  const openSeanslar = (id: string) => {
    setSeansPatientId(id);
    setInnerTab('seanslar');
  };

  const tabs = [
    { k: 'danisanlar', l: 'Danışanlar' },
    { k: 'seanslar',   l: 'Seanslar'   },
  ] as const;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* İç sekme çubuğu */}
      <div className="flex gap-1 bg-[#F4F5F8] dark:bg-gray-800 p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button
            key={t.k}
            onClick={() => setInnerTab(t.k)}
            className={`text-xs px-5 py-1.5 rounded-xl font-medium transition-colors ${
              innerTab === t.k
                ? 'bg-white dark:bg-gray-900 text-[#0E0F12] dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-[#0E0F12] dark:hover:text-white'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {innerTab === 'danisanlar' && (
        <IntakeInbox
          state={state}
          dispatch={dispatch}
          onOpenFormulation={onOpenFormulation}
          onOpenSeanslar={openSeanslar}
        />
      )}
      {innerTab === 'seanslar' && (
        <SeansPanel
          state={state}
          dispatch={dispatch}
          initialPatientId={seansPatientId}
        />
      )}
    </div>
  );
}

// ============================================================
// ACT Geliştirme — Hub + araç sayfaları
// ============================================================
type ActSubTab = 'hub' | 'hexaflex' | 'triflex' | 'sefkat' | 'ekoller' | 'smart-hedef';

const ACT_CARDS: {
  id: Exclude<ActSubTab, 'hub'>;
  emoji: string;
  title: string;
  subtitle: string;
  desc: string;
  accent: string;      // border + badge
  accentBg: string;    // card tint
  tag: string;
}[] = [
  {
    id: 'hexaflex',
    emoji: '⬡',
    title: 'Hexaflex Dancing',
    subtitle: 'Sıralı · 6 boyut · Eğitici paneli',
    desc: 'ACT\'nin 6 psikolojik esneklik boyutunu sıralı ya da rastgele gezerek canlı müdahale pratiği yapın. Eğitici panelinden anlık yönlendirme ve intervention önerileri alın.',
    accent: 'border-rose-700/60',
    accentBg: 'bg-rose-950/30',
    tag: 'ACT Core',
  },
  {
    id: 'triflex',
    emoji: '△',
    title: 'Triflex Dancing',
    subtitle: 'FARKINDA · AÇIK · AKTİF',
    desc: 'Hexaflex boyutlarına ek olarak üst ACT kategorilerini (FARKINDA / AÇIK / AKTİF) dinamik olarak vurgular. Kategori geçişlerine odaklanan daha ileri bir pratik formatı.',
    accent: 'border-blue-700/60',
    accentBg: 'bg-blue-950/30',
    tag: 'İleri Pratik',
  },
  {
    id: 'sefkat',
    emoji: '🤍',
    title: 'Şefkatli Hexaflex',
    subtitle: 'CFT + Neff · 6 şefkat boyutu',
    desc: 'Paul Gilbert\'in CFT modeli ve Kristin Neff\'in öz-şefkat çerçevesini hexagonal yapıyla birleştirir. Farkındalık · Ortak İnsanlık · Öz-Nezaket · Güvenli Yer · Şefkat Sesi · Şefkat Gönder.',
    accent: 'border-pink-700/60',
    accentBg: 'bg-pink-950/30',
    tag: 'CFT / Öz-Şefkat',
  },
  {
    id: 'ekoller',
    emoji: '⬡',
    title: 'Terapi Ekolü Karşılaştırmaları',
    subtitle: 'Psikanaliz → 3. Dalga · 11 ekol',
    desc: 'Psikanaliz\'den ACT\'ye 11 terapi ekolünü tarihsel katman görünümü ve karşılaştırma tablosuyla inceleyin. Her dalga geçişindeki paradigma kırılmasını görün.',
    accent: 'border-amber-700/60',
    accentBg: 'bg-amber-950/30',
    tag: 'Kuramsal Arka Plan',
  },
];

const ACT_TOOL_TITLES: Record<Exclude<ActSubTab, 'hub' | 'smart-hedef'>, string> = {
  hexaflex: 'Hexaflex Dancing',
  triflex:  'Triflex Dancing',
  sefkat:   'Şefkatli Hexaflex',
  ekoller:  'Terapi Ekolü Karşılaştırmaları',
};

function ActGelistirmeHubLegacy({ onSelect }: { onSelect: (t: Exclude<ActSubTab, 'hub'>) => void }) {
  return (
    <div className="min-h-full bg-[#0E0F12] flex flex-col">
      <div className="max-w-4xl mx-auto px-8 py-12 w-full">
        {/* Başlık */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-white/30" />
            <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">ACT Geliştirme</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Araç Seç</h1>
          <p className="text-sm text-white/40 mt-1">
            Klinik pratik, şefkat çalışması veya kuramsal karşılaştırma — hangi alana odaklanmak istiyorsunuz?
          </p>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ACT_CARDS.map(c => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`group text-left rounded-2xl border ${c.accent} ${c.accentBg} p-6 hover:bg-white/5 transition-all hover:scale-[1.01] active:scale-[0.99]`}
            >
              {/* Tag */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${c.accent} text-white/50`}>
                  {c.tag}
                </span>
                <span className="text-white/20 group-hover:text-white/50 transition-colors text-lg">→</span>
              </div>
              {/* İkon + başlık */}
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl leading-none select-none">{c.emoji}</span>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">{c.title}</h2>
                  <p className="text-xs text-white/40 mt-0.5">{c.subtitle}</p>
                </div>
              </div>
              {/* Açıklama */}
              <p className="text-xs text-white/55 leading-relaxed">{c.desc}</p>
            </button>
          ))}
        </div>

        {/* Alt not */}
        <p className="text-center text-xs text-white/20 mt-10">
          Eğitici Alanı ve diğer araçlara üst menüden erişilebilir
        </p>
      </div>
    </div>
  );
}

function ActGelistirmePanelLegacy() {
  const [sub, setSub] = useState<ActSubTab>('hub');

  // Hub göster
  if (sub === 'hub') {
    return <ActGelistirmeHubLegacy onSelect={setSub} />;
  }

  // Araç göster — üstte geri butonu
  return (
    <div className="flex flex-col h-full">
      {/* Üst bar: geri + başlık */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0E0F12] border-b border-white/8 flex-shrink-0">
        <button
          onClick={() => setSub('hub')}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
        >
          <span className="text-base leading-none">←</span>
          ACT Geliştirme
        </button>
        <span className="text-white/15">|</span>
        <span className="text-xs font-semibold text-white/70">{ACT_TOOL_TITLES[sub as Exclude<ActSubTab,'hub'|'smart-hedef'>]}</span>
      </div>
      {/* İçerik */}
      <div className="flex-1 overflow-auto">
        {sub === 'hexaflex' && <ACTDancing initialMode="hexaflex" />}
        {sub === 'triflex'  && <ACTDancing initialMode="triflex"  />}
        {sub === 'sefkat'   && <SefkatCalismasi />}
        {sub === 'ekoller'  && <EkolKarsilastirma />}
      </div>
    </div>
  );
}

// ============================================================
// Main
// ============================================================
type Tab = "home" | "calendar" | "calisma-alani" | "terapist" | "tasarim-arsivi" | "act-gelistirme" | "mudahale-kutuphanesi";
type CalismaSubTab = "hub" | "danisanlar" | "formulasyon" | "tasarimlar" | "takvim" | "muhasebe";

const NAV: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: "home",          label: "Ana Sayfa",          icon: Home },
  { id: "calisma-alani", label: "Çalışma Alanı",      icon: Users },
  { id: "terapist",      label: "Profil",              icon: Sparkles },
  { id: "tasarim-arsivi",label: "Yol Haritası",        icon: BookOpen },
  { id: "act-gelistirme",label: "ACT Geliştirme",      icon: Zap },
];

function useIdleTimer(timeout: number, onIdle: () => void, onActive: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const reset = () => {
      onActive();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(onIdle, timeout);
    };
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    timer.current = setTimeout(onIdle, timeout);
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [timeout, onIdle, onActive]);
}

// ============================================================
// Günlük Randevu Özeti Modal
// ============================================================

const FIRST_SESSION_OUTLINE = [
  { min: 10, label: 'Tanışma ve ilişki kurma' },
  { min: 15, label: 'Sunulan sorunun ayrıntılandırılması' },
  { min:  8, label: 'Psikiyatrik / psikolojik geçmiş' },
  { min:  7, label: 'Aile geçmişi ve sosyal destek sistemi' },
  { min:  5, label: 'Motivasyon ve beklentiler' },
  { min:  5, label: 'Gizlilik, onam ve ücret bilgilendirmesi' },
  { min:  5, label: 'Sonraki randevu ve gözlem ödevi' },
];

const DURUM_META: Record<string, { label: string; color: string; bg: string }> = {
  no_show:  { label: 'No-show',  color: '#B83216', bg: 'rgba(184,50,22,0.08)'  },
  iptal:    { label: 'İptal',    color: '#7B7C82', bg: 'rgba(14,15,18,0.06)'  },
  erteleme: { label: 'Erteleme', color: '#2F5D3A', bg: 'rgba(47,93,58,0.08)'  },
};

/** Demo verisi — gerçek DB boşken briefing'in nasıl göründüğünü göstermek için */
function makeMockBriefData(todayStr: string) {
  const d = new Date(todayStr + 'T12:00:00');
  const fmt = (offset: number) => {
    const x = new Date(d); x.setDate(d.getDate() + offset);
    return x.toISOString().slice(0, 10);
  };
  const yest = fmt(-1), tom = fmt(1);
  return {
    window: { yesterday: yest, today: todayStr, tomorrow: tom },
    cancellations: [
      {
        id: 'mock-1', clientId: 'c1', clientName: 'Ayşe Kaya',
        seansNo: 7, date: yest, time: '10:00',
        durum: 'no_show' as const, mazeret: null, ertlemeTarihi: null, createdAt: yest,
      },
      {
        id: 'mock-2', clientId: 'c2', clientName: 'Mert Demir',
        seansNo: 3, date: yest, time: '14:30',
        durum: 'iptal' as const,
        mazeret: 'İş yoğunluğu nedeniyle gelemeyeceğini sabah iletti.',
        ertlemeTarihi: null, createdAt: yest,
      },
      {
        id: 'mock-3', clientId: 'c3', clientName: 'Zeynep Arslan',
        seansNo: 12, date: todayStr, time: '09:00',
        durum: 'erteleme' as const, mazeret: null,
        ertlemeTarihi: tom, createdAt: todayStr,
      },
      {
        id: 'mock-4', clientId: 'c4', clientName: 'Kemal Şahin',
        seansNo: 5, date: todayStr, time: '16:00',
        durum: 'iptal' as const,
        mazeret: 'Hastalık — doktor raporu var.',
        ertlemeTarihi: null, createdAt: todayStr,
      },
      {
        id: 'mock-5', clientId: 'c5', clientName: 'Defne Yıldız',
        seansNo: 2, date: tom, time: '11:00',
        durum: 'no_show' as const, mazeret: null, ertlemeTarihi: null, createdAt: todayStr,
      },
    ],
    newAppointments: [
      {
        id: 'mock-ev1', title: 'Selin Çelik — ilk görüşme',
        start: `${todayStr}T13:00`, end: `${todayStr}T13:50`,
        notes: 'Telefonda anksiyete ve uyku bozukluğu bildirdi.', createdAt: todayStr,
      },
      {
        id: 'mock-ev2', title: 'Burak Tan — seans',
        start: `${tom}T10:00`, end: `${tom}T10:50`,
        notes: null, createdAt: todayStr,
      },
    ],
  };
}

function CancellationRow({ row, onSaveMazeret }: {
  row: any;
  onSaveMazeret(id: string, mazeret: string): void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(row.mazeret ?? '');
  const DMETA: Record<string, { cls: string; label: string }> = {
    iptal:    { cls: 'iptal',    label: 'İptal' },
    erteleme: { cls: 'erteleme', label: 'Erteleme' },
    no_show:  { cls: 'noshow',   label: 'No-show' },
  };
  const m = DMETA[String(row.durum).replace('-', '_')] ?? DMETA.iptal;
  const timeStr = row.time ? String(row.time).slice(0, 5) : '';
  const reschedStr = row.ertlemeTarihi && /^\d{4}-\d{2}-\d{2}/.test(String(row.ertlemeTarihi))
    ? new Date(row.ertlemeTarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
    : row.ertlemeTarihi;

  return (
    <div className="row">
      <div className="row-top">
        <span className={`badge ${m.cls}`}><span className="gl" />{m.label}</span>
        <span className="who">{row.clientName}</span>
        {timeStr && <span className="time num">{timeStr}</span>}
      </div>
      {row.durum === 'erteleme' && row.ertlemeTarihi && (
        <div className="reschedule">
          <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>{reschedStr}
        </div>
      )}
      <div className="reason">
        {editing ? (
          <div className="reason-edit">
            <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} placeholder="İptal / erteleme gerekçesi, mazeret notu…" />
            <div className="acts">
              <button className="btn-sm cancel" type="button" onClick={() => { setDraft(row.mazeret ?? ''); setEditing(false); }}>Vazgeç</button>
              <button className="btn-sm save" type="button" onClick={() => { onSaveMazeret(row.id, draft.trim()); setEditing(false); }}>Kaydet</button>
            </div>
          </div>
        ) : row.mazeret ? (
          <div className="reason-view">
            <span className="q">{row.mazeret}</span>
            <button className="edit-link" type="button" onClick={() => { setDraft(row.mazeret); setEditing(true); }}>Düzenle</button>
          </div>
        ) : (
          <button className="add-reason" type="button" onClick={() => { setDraft(''); setEditing(true); }}>+ gerekçe ekle</button>
        )}
      </div>
    </div>
  );
}

function DailyBriefModal({
  randevuOzet,
  firstContact,
  today,
  onClose,
  onOpenPatient,
  onSaveMazeret,
}: {
  randevuOzet: { window: { yesterday: string; today: string; tomorrow: string }; cancellations: any[]; newAppointments: any[] } | null;
  firstContact: { patient: Patient; calEvent: CalEvent | null } | null;
  today: string;
  onClose(): void;
  onOpenPatient(id: string): void;
  onSaveMazeret(id: string, mazeret: string): void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dateLabel = new Date()
    .toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .toLocaleUpperCase('tr-TR');

  const labelFor = (date: string) => {
    if (!randevuOzet) return date;
    if (date === randevuOzet.window.yesterday) return 'Dün';
    if (date === randevuOzet.window.today)     return 'Bugün';
    if (date === randevuOzet.window.tomorrow)  return 'Yarın';
    return date;
  };
  const prettyDate = (date: string) => {
    try { return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }); }
    catch { return date; }
  };

  const cancellations = randevuOzet?.cancellations ?? [];
  const newAppts = randevuOzet?.newAppointments ?? [];
  const hasCancellations = cancellations.length > 0;
  const hasNew = newAppts.length > 0;
  const hasFirstContact = !!firstContact;
  const isEmpty = !hasCancellations && !hasNew && !hasFirstContact;
  const fi = firstContact?.patient;

  // İptalleri Dün / Bugün / Yarın gruplarına ayır
  const ORDER = ['Dün', 'Bugün', 'Yarın'];
  const groups: Record<string, any[]> = {};
  cancellations.forEach((c: any) => { const k = labelFor(c.date); (groups[k] = groups[k] || []).push(c); });
  const groupOrder = ORDER.filter(g => groups[g]);

  const total = FIRST_SESSION_OUTLINE.reduce((a, s) => a + s.min, 0);

  return (
    <div className="gb2">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="gbTitle" data-screen-label="Günlük Özet — Bugünün Briefing'i">

          <header className="m-head">
            <div className="ttl">
              <span className="m-eyebrow eyebrow">Günlük Özet · <b>{dateLabel}</b></span>
              <h1 className="m-title" id="gbTitle">Bugünün <i>Briefing</i>&apos;i</h1>
            </div>
            <button className="x-btn" type="button" aria-label="Kapat" onClick={onClose}>
              <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </header>

          <div className="m-body">
            {isEmpty ? (
              <div className="empty">
                <span className="ico"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg></span>
                <p>Dün, bugün ve yarın için kayıtlı değişiklik yok.</p>
                <span className="sub">Tüm randevular planlandığı gibi aktif. İyi seanslar.</span>
              </div>
            ) : (
              <>
                {hasCancellations && (
                  <section className="sec">
                    <div className="sec-eyebrow">
                      <span className="lab eyebrow">İptal · Erteleme · No-show</span>
                      <span className="cnt">{cancellations.length} kayıt</span>
                    </div>
                    {groupOrder.map(g => (
                      <div className="grp" key={g}>
                        <div className="grp-head">{g} <span className="when">· {prettyDate(groups[g][0].date)}</span></div>
                        {groups[g].map((row: any) => (
                          <CancellationRow key={row.id} row={row} onSaveMazeret={onSaveMazeret} />
                        ))}
                      </div>
                    ))}
                  </section>
                )}

                {hasNew && (
                  <section className="sec">
                    <div className="sec-eyebrow">
                      <span className="lab eyebrow">Yeni oluşturulan randevular</span>
                      <span className="cnt">{newAppts.length} randevu</span>
                    </div>
                    {newAppts.map((ev: any) => {
                      const dateKey = String(ev.start ?? '').slice(0, 10);
                      const tStr = String(ev.start ?? '').slice(11, 16);
                      return (
                        <div className="nrow" key={ev.id}>
                          <span className="badge yeni"><span className="gl" />Yeni</span>
                          <span className="who">{ev.title}</span>
                          <span className="meta">{labelFor(dateKey)} · {tStr}</span>
                        </div>
                      );
                    })}
                  </section>
                )}

                {hasFirstContact && fi && (
                  <section className="sec">
                    <div className="sec-eyebrow accent"><span className="lab eyebrow">İlk görüşme · Bugün</span></div>
                    <div className="fi-grid">
                      <div className="fi-card">
                        <h3 className="fi-name">{fi.adSoyad}</h3>
                        <div className="fi-meta">
                          {fi.yas && <span>{fi.yas} yaş</span>}
                          {fi.cinsiyet && <span>{fi.cinsiyet}</span>}
                          {fi.telefon && <span>{fi.telefon}</span>}
                        </div>
                        {fi.sunumSorunu && (
                          <div className="fi-block"><div className="k">Başvuru nedeni</div><div className="v">{fi.sunumSorunu}</div></div>
                        )}
                        {firstContact?.calEvent?.notes && (
                          <div className="fi-note"><div className="k">Telefon notu</div><div className="v">{firstContact.calEvent.notes}</div></div>
                        )}
                      </div>
                      <div className="fi-outline">
                        <div className="oh"><span className="k">İlk seans ana hatları</span><span className="tot num">{total} dk</span></div>
                        <ol className="steps">
                          {FIRST_SESSION_OUTLINE.map((step, i) => (
                            <li key={i}><span className="t">{step.label}</span><span className="d">{step.min} dk</span></li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          <footer className="m-foot">
            <span className="foot-summary">
              {!hasCancellations && !hasNew ? 'Tüm randevular aktif' : (
                <>
                  {hasCancellations && <><b>{cancellations.length}</b> değişiklik</>}
                  {hasCancellations && hasNew && ' · '}
                  {hasNew && <><b>{newAppts.length}</b> yeni randevu</>}
                </>
              )}
            </span>
            <div className="foot-acts">
              <button className="btn ghost" type="button" onClick={onClose}>Kapat</button>
              {hasFirstContact && fi && (
                <button className="btn solid" type="button" onClick={() => onOpenPatient(fi.id)}>
                  <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                  Dosyayı Aç
                </button>
              )}
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, defaultState);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(true);
  const [tab, setTab] = useState<Tab>("home");
  const [activePatientId, setActivePatientId] = useState<string | null>(null);

  // Bugün incelenmiş seans dosyaları (havuz işaretleri) — günlük, localStorage
  const reviewKey = () => `seans-incelendi:${new Date().toISOString().slice(0, 10)}`;
  const [reviewedToday, setReviewedToday] = useState<string[]>([]);
  useEffect(() => {
    try { setReviewedToday(JSON.parse(localStorage.getItem(reviewKey()) || '[]')); } catch {}
  }, []);

  // Danışan dosyasından "Günün seansları" ile dönüldüyse → havuza kaydır
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('focus') !== 'havuz') return;
    const t = setTimeout(() => {
      document.getElementById('gunun-seanslari')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
    return () => clearTimeout(t);
  }, []);
  const markReviewed = (id: string) => {
    try {
      const set = new Set<string>(JSON.parse(localStorage.getItem(reviewKey()) || '[]'));
      set.add(String(id));
      const arr = [...set];
      localStorage.setItem(reviewKey(), JSON.stringify(arr));
      setReviewedToday(arr);
    } catch {}
  };

  // URL query params'tan tab + client oku (profil sayfasından yönlendirme için)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const qTab    = sp.get('tab') as string | null;
    const qClient = sp.get('client');
    const validTabs: Tab[] = ['home','calendar','calisma-alani','terapist','tasarim-arsivi','act-gelistirme','mudahale-kutuphanesi'];
    // 'formulation' → Çalışma Alanı'nın formülasyon alt sekmesi (danışan formülasyon hub'ı)
    if (qTab === 'formulation') { setTab('calisma-alani'); setCalismaSubTab('formulasyon'); }
    else if (qTab === 'calendar') { setTab('calisma-alani'); setCalismaSubTab('takvim'); } // Takvim artık Çalışma Alanı altında
    else if (qTab && validTabs.includes(qTab as Tab)) setTab(qTab as Tab);
    if (qClient) setActivePatientId(qClient);
    const qTakvim = sp.get('takvim') as TakvimSubTab | null;
    if (qTakvim && (['takvim','hazirlik','musaitlik','gecmis','sms','gelisim'] as TakvimSubTab[]).includes(qTakvim)) setTakvimSubTab(qTakvim);
    // Parametre geldiyse landing'i atla
    if (sp.toString()) {
      setReady(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [calEvents, setCalEvents] = useState<CalEvent[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [idle, setIdle] = useState(false);

  // ── Müdahale Kütüphanesi state ───────────────────────────────────────
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [basket, setBasket] = useState<string[]>([]);

  // ── Home Dashboard — reflections ─────────────────────────────────────
  const [reflectionsState, setReflectionsState] = useState<any[]>([]);

  // ── Günlük Randevu Özeti Modal ────────────────────────────────────────
  const [dailyBriefOpen, setDailyBriefOpen] = useState(false);
  const [randevuOzet, setRandevuOzet] = useState<{
    window: { yesterday: string; today: string; tomorrow: string };
    cancellations: any[];
    newAppointments: any[];
  } | null>(null);
  const [firstContactClient, setFirstContactClient] = useState<{ patient: Patient; calEvent: CalEvent | null } | null>(null);

  // ── Yeni danışan modalı (V2 ekranlarından erişilebilir) ───────────────
  const [newClientOpen, setNewClientOpen] = useState(false);
  // ── Terapist Profil: düzenle + onam paylaş ────────────────────────────
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [shareConsentOpen, setShareConsentOpen] = useState(false);
  const [bookletShare, setBookletShare] = useState<{ open: boolean; booklet?: { title: string; body: string } }>({ open: false });
  const [profileKey, setProfileKey] = useState(0); // foto değişince TerapistProfilV2 remount
  const [reflectFocus, setReflectFocus] = useState(false); // Ana Sayfa "yeni yansıma" → terapist tab yansıma bölümü

  useEffect(() => {
    fetch('/api/interventions')
      .then(r => r.json())
      .then((data: Intervention[]) => setInterventions(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/reflections?type=daily&limit=3')
      .then(r => r.json())
      .then((data: any[]) => setReflectionsState(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useIdleTimer(5 * 60 * 1000, () => setIdle(true), () => setIdle(false));

  // ── Derive DanisanlarPanel Client[] from state ───────────────────────
  const panelClients = React.useMemo<DanisanClient[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return (state.patients as any[]).map((p) => {
      const pid = String(p.id);
      const seansList = (state.seanslar as any[]).filter((s) => s.patientId === pid);
      const sessionCount = seansList.length;
      const sortedDates = seansList.map((s: any) => s.tarih).filter(Boolean).sort().reverse();
      const lastSession = sortedDates[0] as string | undefined;
      const daysSinceLast = lastSession
        ? Math.floor((Date.now() - new Date(lastSession).getTime()) / 86400000)
        : 999;
      const last30Count = seansList.filter((s: any) => s.tarih >= thirtyDaysAgo).length;
      const continuityPct = sessionCount === 0 ? 0 : Math.min(100, Math.round((last30Count / 4) * 100));
      const dropRisk: 'low' | 'medium' | 'high' =
        daysSinceLast > 30 ? 'high' : daysSinceLast > 14 ? 'medium' : 'low';
      const rawStatus = (p.status as string) ?? 'active';
      const panelStatus: 'active' | 'passive' | 'follow' =
        rawStatus === 'archived' ? 'passive' :
        rawStatus === 'intake'   ? 'follow'  : 'active';
      // next appointment from calEvents
      const nameLC = (p.adSoyad ?? '').toLowerCase();
      const nextEv = calEvents
        .filter((e: any) => e.start >= today && (e.title ?? '').toLowerCase().includes(nameLC.split(' ')[0]))
        .sort((a: any, b: any) => a.start.localeCompare(b.start))[0];
      const nextAppointment = nextEv
        ? new Date(nextEv.start).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : undefined;
      return {
        id: pid,
        name: p.adSoyad ?? '—',
        age: p.yas ? Number(p.yas) : undefined,
        issue: p.sunumSorunu ?? '—',
        modality: 'Diğer' as const,
        sessionCount,
        lastSession,
        nextAppointment,
        continuityPct,
        dropRisk: sessionCount > 0 ? dropRisk : undefined,
        tags: (state.tags as any[]).filter((t) => t.clientId === pid).map((t) => t.label),
        status: panelStatus,
        exitReason: (p as any).exitReason,
        takipSikligi: (p as any).takipSikligi,
      } satisfies DanisanClient;
    });
  }, [state.patients, state.seanslar, state.tags, calEvents]);

  // ── Müsaitlik (sablon + bloklar) — #6: stored veriyi yükle ───────────
  const [availability, setAvailability] = useState<{ sablon: any[]; bloklar: any[] }>({ sablon: [], bloklar: [] });
  const refreshAvailability = React.useCallback(() => {
    fetch('/api/musaitlik').then((r) => r.json()).then((d) => {
      if (d) setAvailability({ sablon: Array.isArray(d.sablon) ? d.sablon : [], bloklar: Array.isArray(d.bloklar) ? d.bloklar : [] });
    }).catch(() => {});
  }, []);
  useEffect(() => { refreshAvailability(); }, [refreshAvailability]);

  // ── FormulasyonPanel state ───────────────────────────────────────────
  const [formMode,            setFormMode]            = useState<FormulationViewMode>('focus');
  const [vizMode,             setVizMode]             = useState<FormulationVizMode>('harita');
  const [selectedNodeId,      setSelectedNodeId]      = useState<string | null>(null);
  const [formulationPanelData, setFormulationPanelData] = useState<{
    fourP?: FourP; beck?: BeckChain; hexaflex?: Hexaflex | null;
    summary?: string | null; maturity?: number;
    stats?: { nodes: number; edges: number; gaps: number };
    sessionTimeline?: number[];
  } | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<SelectedNode | null>(null);
  const [actSubTab, setActSubTab]         = useState<ActSubTab>('hub');
  const [calismaSubTab, setCalismaSubTab] = useState<CalismaSubTab>('hub');
  // İsimden danışan id'si çöz (takvim seans isimleri → dosya)
  const resolvePatientByName = (name: string): string | undefined => {
    const nm = (s: string) => (s ?? '').trim().toLocaleLowerCase('tr-TR');
    const t = nm(name);
    if (!t) return undefined;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = nm(parts[0] ?? '');
    const lastInit = parts[1] ? nm(parts[1])[0] : undefined;
    const named = (state.patients as any[]).filter((p) => (p.adSoyad ?? '').trim());
    const nameOf = (p: any) => (p.adSoyad ?? '').trim();
    let hit = named.find((p) => nm(nameOf(p)) === t);
    if (!hit) hit = named.find((p) => { const np = nameOf(p).split(/\s+/); return nm(np[0]) === first && (!lastInit || nm(np[np.length - 1] ?? '')[0] === lastInit); });
    if (!hit) { const fm = named.filter((p) => nm(nameOf(p).split(/\s+/)[0]) === first); if (fm.length === 1) hit = fm[0]; }
    if (!hit) hit = named.find((p) => { const n = nm(nameOf(p)); return n.includes(t) || t.includes(n); });
    return hit?.id ? String(hit.id) : undefined;
  };

  // Takvim için: randevu ismini danışana eşle → { id, konu (sunum sorunu) }
  const resolveClientForCalendar = (name: string): { id?: string; topic?: string; phone?: string; reviewed?: boolean; fileHref?: string; fee?: number } | undefined => {
    const id = resolvePatientByName(name);
    if (!id) return undefined;
    const p = (state.patients as any[]).find((x) => String(x.id) === id);
    const topic = p?.sunumSorunu ? String(p.sunumSorunu).split(/[,،]/)[0].trim() : undefined;
    return { id, topic, phone: p?.telefon ?? undefined, reviewed: reviewedToday.includes(id), fileHref: `/profil/${id}`, fee: p?.seansUcreti != null ? Number(p.seansUcreti) : undefined };
  };
  // Ortalama seans ücreti — ücreti girilmiş danışanlardan (kazanç tahmini için)
  const avgClientFee = (() => {
    const fees = (state.patients as any[]).map((p) => p?.seansUcreti).filter((f) => f != null && !Number.isNaN(Number(f))).map(Number);
    return fees.length ? Math.round(fees.reduce((s, f) => s + f, 0) / fees.length) : 0;
  })();

  const goToDanisanlar = () => { setCalismaSubTab('danisanlar'); setTab('calisma-alani'); };
  const goToTakvim     = () => { setCalismaSubTab('takvim');     setTab('calisma-alani'); };
  const goToMuhasebe   = () => { setCalismaSubTab('muhasebe');   setTab('calisma-alani'); };
  const goToFormulasyon = () => { setCalismaSubTab('formulasyon'); setTab('calisma-alani'); };
  const goToTasarimlar  = () => { setCalismaSubTab('tasarimlar');  setTab('calisma-alani'); };
  const [hexMode,   setHexMode]           = useState<'hexaflex' | 'triflex'>('hexaflex');
  const [takvimSubTab, setTakvimSubTab]   = useState<TakvimSubTab>('takvim');
  const [gelisimEvents, setGelisimEvents] = useState<import('@/components/TakvimPanel').GelisimEvent[]>([
    // Örnek: haftada 2x 3 saat ACT eğitimi
    { id: 'eg-01', title: 'ACT İleri Uygulayıcı Eğitimi — Modül 1',     date: '2026-06-02', time: '09:00', durationMin: 180, done: false },
    { id: 'eg-02', title: 'ACT İleri Uygulayıcı Eğitimi — Modül 1',     date: '2026-06-04', time: '09:00', durationMin: 180, done: false },
    { id: 'eg-03', title: 'ACT İleri Uygulayıcı Eğitimi — Modül 2',     date: '2026-06-09', time: '09:00', durationMin: 180, done: false },
    { id: 'eg-04', title: 'ACT İleri Uygulayıcı Eğitimi — Modül 2',     date: '2026-06-11', time: '09:00', durationMin: 180, done: false },
    { id: 'eg-05', title: 'ACT İleri Uygulayıcı Eğitimi — Modül 3',     date: '2026-06-16', time: '09:00', durationMin: 180, done: false },
    { id: 'eg-06', title: 'ACT İleri Uygulayıcı Eğitimi — Modül 3',     date: '2026-06-18', time: '09:00', durationMin: 180, done: false },
    { id: 'eg-07', title: 'ACT İleri Uygulayıcı Eğitimi — Modül 4',     date: '2026-06-23', time: '09:00', durationMin: 180, done: false },
    { id: 'eg-08', title: 'ACT İleri Uygulayıcı Eğitimi — Modül 4',     date: '2026-06-25', time: '09:00', durationMin: 180, done: false },
    // Tamamlananlar
    { id: 'eg-09', title: 'ACT İleri Uygulayıcı Eğitimi — Modül 0 (Giriş)', date: '2026-05-26', time: '09:00', durationMin: 180, done: true  },
    { id: 'eg-10', title: 'ACT İleri Uygulayıcı Eğitimi — Modül 0 (Giriş)', date: '2026-05-28', time: '09:00', durationMin: 180, done: true  },
  ]);

  useEffect(() => {
    if (!activePatientId) { setFormulationPanelData(null); return; }
    fetch(`/api/formulations/${activePatientId}/panel`)
      .then(r => r.json())
      .then(setFormulationPanelData)
      .catch(() => {});
  }, [activePatientId]);

  useEffect(() => {
    if (!selectedNodeId) { setSelectedNodeData(null); return; }
    fetch(`/api/mindmap/node/${selectedNodeId}`)
      .then(r => r.json())
      .then((d) => { if (!d.error) setSelectedNodeData(d); })
      .catch(() => {});
  }, [selectedNodeId]);

  const refreshCalendar = async () => {
    setCalLoading(true);
    try {
      const data = await fetch('/api/calendar-sync').then(r => r.json());
      if (Array.isArray(data)) setCalEvents(data);
    } catch {
      // ignore
    } finally {
      setCalLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then(r => r.json()).catch(() => []),
      fetch('/api/events').then(r => r.json()).catch(() => []),
      fetch('/api/seanslar').then(r => r.json()).catch(() => []),
      fetch('/api/pending').then(r => r.json()).catch(() => []),
      fetch('/api/sms').then(r => r.json()).catch(() => []),
      fetch('/api/tags').then(r => r.json()).catch(() => []),
      fetch('/api/settings').then(r => r.json()).catch(() => defaultSettings),
    ]).then(([patients, events, seanslar, pending, sms, tags, settings]) => {
      dispatch({
        type: "SET", state: {
          patients: Array.isArray(patients) ? patients : [],
          events: Array.isArray(events) ? events : [],
          seanslar: Array.isArray(seanslar) ? seanslar : [],
          pending: Array.isArray(pending) ? pending : [],
          sms: Array.isArray(sms) ? sms : [],
          tags: Array.isArray(tags) ? tags : [],
          settings: settings && typeof settings === 'object' ? { ...defaultSettings, ...settings } : defaultSettings,
          formulations: [],
        }
      });
      setLoading(false);
    });
    refreshCalendar();
  }, []);

  const seedData = async () => {
    if (!confirm('3 örnek danışan ve seans verisi eklensin mi? Mevcut veriler korunur.')) return;
    const SEED_PATIENTS = [
      { id: `seed_p1_${Date.now()}`, adSoyad: 'Ayşe Yılmaz', yas: '32', cinsiyet: 'Kadın', telefon: '0532 111 2233', email: 'ayse@ornek.com', status: 'active' as const, sunumSorunu: 'Sosyal ortamlarda yoğun kaygı, performans kaygısı, sosyal fobi belirtileri', hedefler: 'Sosyal kaygıyı azaltmak, sosyal becerilerini geliştirmek', basvuruTarihi: new Date(Date.now() - 60 * 86400000).toISOString(), createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
      { id: `seed_p2_${Date.now() + 1}`, adSoyad: 'Mehmet Kara', yas: '28', cinsiyet: 'Erkek', telefon: '0541 222 3344', email: 'mehmet@ornek.com', status: 'active' as const, sunumSorunu: 'Kronik yorgunluk, motivasyon kaybı, depresif belirtiler, iş burnout', hedefler: 'Değer temelli yaşamı keşfetmek, psikolojik esnekliği artırmak', basvuruTarihi: new Date(Date.now() - 30 * 86400000).toISOString(), createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
      { id: `seed_p3_${Date.now() + 2}`, adSoyad: 'Zeynep Demir', yas: '45', cinsiyet: 'Kadın', telefon: '0555 333 4455', email: 'zeynep@ornek.com', status: 'active' as const, sunumSorunu: 'Geçmiş travmaya bağlı yeniden yaşantılama, kaçınma, uyku bozukluğu (TSSB belirtileri)', hedefler: 'Travma belirtilerini işlemek, günlük işlevselliği yeniden kazanmak', basvuruTarihi: new Date(Date.now() - 14 * 86400000).toISOString(), createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
    ];
    for (const p of SEED_PATIENTS) {
      dispatch({ type: 'PATIENT_ADD', p });
      const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
      const created = await res.json();
      const realId = created.id || p.id;

      // Formulation
      const formData = { id: uid(), patientId: realId, updatedAt: new Date().toISOString(),
        anaSikayetler: p.sunumSorunu, predispozan: p.adSoyad === 'Ayşe Yılmaz' ? 'Mükemmeliyetçi aile ortamı, erken dönem başarısızlık deneyimleri' : p.adSoyad === 'Mehmet Kara' ? 'İhtiyaçlarını bastırma örüntüsü, bağlanma güçlükleri' : 'Çocukluk çağı fiziksel istismar öyküsü',
        presipitan: p.adSoyad === 'Ayşe Yılmaz' ? 'Yeni işe başlama, sunum görevi' : p.adSoyad === 'Mehmet Kara' ? 'Yönetici değişikliği, aşırı iş yükü' : 'İş yerinde sesli tartışma olayı',
        perpetuan: p.adSoyad === 'Ayşe Yılmaz' ? 'Kaçınma davranışları, güvenlik sinyalleri kullanımı' : p.adSoyad === 'Mehmet Kara' ? 'Değer-eylem uyumsuzluğu, izolasyon' : 'Tetikleyici uyaranlardan kaçınma, uyku yoksunluğu',
        protektif: 'Güçlü sosyal destek ağı, değişim motivasyonu yüksek',
        temelInanclar: p.adSoyad === 'Ayşe Yılmaz' ? '"Başkalarının gözünde aptal görünürsem mahvolurum"' : p.adSoyad === 'Mehmet Kara' ? '"Hiçbir şey fark etmez, sadece devam ediyorum"' : '"Güvende değilim, her an tehlike var"',
        hedefler: p.hedefler,
      };
      await fetch('/api/formulations/' + realId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });

      // Seans — anamnez
      const anamnezId = uid();
      await fetch('/api/seanslar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: anamnezId, patientId: realId, tarih: p.basvuruTarihi?.slice(0, 10), tip: 'anamnez', no: 1, anamnez: { basvuruNedeni: p.sunumSorunu, sikayetSiddeti: 7 } }) });

      // Seans notları (ilk 2 danışan için)
      if (p.adSoyad !== 'Zeynep Demir') {
        await fetch('/api/seanslar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: realId, tarih: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), tip: 'seans', no: 2, seansNotu: { moodPuani: 5, risk: 'yok', teknikler: p.adSoyad === 'Ayşe Yılmaz' ? ['Bilişsel Yeniden Yapılandırma', 'Psikoeğitim'] : ['Değer Temas Çalışması', 'Matriks Çalışması'], notlar: 'İlk seans iyi geçti, danışan formülasyona açık.' } }) });
        if (p.adSoyad === 'Ayşe Yılmaz') {
          await fetch('/api/seanslar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: realId, tarih: new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10), tip: 'seans', no: 3, seansNotu: { moodPuani: 6, risk: 'yok', teknikler: ['Maruz Bırakma (ERP)', 'Sokratik Sorgulama'], notlar: 'Sosyal maruz bırakma hiyerarşisi oluşturuldu. Ev ödevi: hafif sosyal durumlara giriş.' } }) });
        }
      }
    }
    // Reload
    const [patients, seanslar] = await Promise.all([
      fetch('/api/clients').then(r => r.json()).catch(() => []),
      fetch('/api/seanslar').then(r => r.json()).catch(() => []),
    ]);
    dispatch({ type: 'PATCH', patch: { patients: Array.isArray(patients) ? patients : state.patients, seanslar: Array.isArray(seanslar) ? seanslar : state.seanslar } });
    alert('Örnek veriler eklendi! Danışanlar sekmesini kontrol edin.');
  };

  const openFormulationFor = async (name: string) => {
    let p = state.patients.find(x => x.adSoyad.toLowerCase() === name.toLowerCase());
    if (!p) {
      const np: Patient = { id: uid(), adSoyad: name, status: "active", createdAt: new Date().toISOString() };
      dispatch({ type: "PATIENT_ADD", p: np });
      const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(np) });
      const created = await res.json();
      if (created.id && created.id !== np.id) {
        dispatch({ type: "PATIENT_UPDATE", id: np.id, patch: { id: created.id } });
        setActivePatientId(created.id);
      } else {
        setActivePatientId(np.id);
      }
    } else {
      setActivePatientId(p.id);
    }
    goToFormulasyon();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F8]">
        <div className="text-gray-400 text-sm">Yükleniyor…</div>
      </div>
    );
  }

  // Landing screen kaldırıldı — uygulama direkt açılır.

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-[#0E0F12]">
      {idle && (
        <BeklemeEkrani
          therapistName={state.settings.therapistName || 'Göksel Akkaya'}
          onClose={() => setIdle(false)}
        />
      )}

      {/* In-app V2 ekranları kendi .dock'unu render ediyor; alttaki global ana menü (fixed NAV)
          zaten var → in-app dock'ları gizle (terapist .tp2 hariç — kullanıcı: dokunma). */}
      <style>{`.siyi-inapp .dock{display:none!important}.siyi-inapp .tp2 .dock{display:flex!important}`}</style>

      {/* ── Bekleme (legacy S-İ-Y-İ üst başlığı kaldırıldı — V2 ekranların kendi topbar'ı var) ── */}
      <button
        onClick={() => setIdle(true)}
        title="Bekleme moduna geç"
        className="fixed top-3 right-4 z-50 flex items-center gap-2 rounded-full bg-[#0E0F12] pl-4 pr-3 py-1.5 text-[12px] font-medium text-white shadow-[0_2px_12px_rgba(0,0,0,0.18)] hover:bg-[#1c1d21] transition-colors"
      >
        Bekleme
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/15">
          <MonitorOff className="w-3 h-3" />
        </span>
      </button>

      <main className={cx(
        "siyi-inapp pb-24",
        tab === "home" ? "overflow-x-hidden" : (tab === "act-gelistirme" || tab === "calisma-alani" || tab === "terapist") ? "" : "max-w-6xl mx-auto px-6 py-8"
      )}>
        <div key={tab} className="animate-fade-in">
          {tab === "home" && (() => {
            const today = new Date().toISOString().slice(0, 10);
            const sessionsToday = (calEvents as any[])
              .filter(e => (e.start ?? '').slice(0, 10) === today)
              .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));

            const totalSessions = (state.seanslar ?? []).length;
            const activeClients = (state.patients ?? []).filter((p: any) => p.status === 'active').length;
            const pendingTasks  = (state.pending  ?? []).length;

            const roman = ['I','II','III','IV','V','VI','VII','VIII'];
            // Takvim olayında patientId yok → danışanı isimden eşle.
            // Sıra: tam ad → ad + soyad baş harfi → benzersiz ilk isim → alt-dize.
            const norm = (s: string) => (s ?? '').trim().toLocaleLowerCase('tr-TR');
            const matchPatientId = (title: string): string | undefined => {
              const t = norm(title);
              if (!t) return undefined;
              const parts = title.trim().split(/\s+/).filter(Boolean);
              const first = norm(parts[0] ?? '');
              const lastInit = parts[1] ? norm(parts[1])[0] : undefined;
              const named = (state.patients as any[]).filter((p: any) => (p.adSoyad ?? '').trim());
              const nameOf = (p: any) => (p.adSoyad ?? '').trim();
              // 1) tam ad
              let hit = named.find((p: any) => norm(nameOf(p)) === t);
              // 2) ilk isim + soyad baş harfi
              if (!hit) hit = named.find((p: any) => {
                const np = nameOf(p).split(/\s+/);
                return norm(np[0]) === first && (!lastInit || norm(np[np.length - 1] ?? '')[0] === lastInit);
              });
              // 3) benzersiz ilk isim
              if (!hit) {
                const fm = named.filter((p: any) => norm(nameOf(p).split(/\s+/)[0]) === first);
                if (fm.length === 1) hit = fm[0];
              }
              // 4) alt-dize (her iki yön)
              if (!hit) hit = named.find((p: any) => { const n = norm(nameOf(p)); return n.includes(t) || t.includes(n); });
              return hit?.id ? String(hit.id) : undefined;
            };
            // Zaman-tabanlı durum: bitmiş seans 'past' (koyu), ilk gelecek olan 'next', kalanlar 'upcoming'.
            // calEvents client-side yüklendiği için Date.now() SSR/hydration sorunu yaratmaz (SSR'da liste boş).
            const nowMs = Date.now();
            const SESSION_MIN = 50; // seans bitiş tahmini (başlangıç + 50dk geçtiyse "geçmiş")
            // Kart başı kısa briefing: son seans notu → güncel hedef → sunum sorunu
            const briefForClient = (cid?: string): string | undefined => {
              if (!cid) return undefined;
              const sList = (state.seanslar as any[])
                .filter((s) => String(s.patientId ?? s.client_id ?? '') === String(cid))
                .sort((a, b) => String(b.tarih ?? '').localeCompare(String(a.tarih ?? '')));
              const note = sList[0]?.notlar ?? sList[0]?.konu;
              if (note && String(note).trim()) return `Son seans — ${String(note).trim()}`;
              const p = (state.patients as any[]).find((x) => String(x.id) === String(cid));
              if (p?.hedefler && String(p.hedefler).trim()) return `Hedef — ${String(p.hedefler).trim()}`;
              if (p?.sunumSorunu && String(p.sunumSorunu).trim()) return `Sunum — ${String(p.sunumSorunu).trim()}`;
              return undefined;
            };
            const sessionsList = sessionsToday.map((e: any, i: number) => {
              const startMs = new Date(e.start).getTime();
              const endMs   = e.end ? new Date(e.end).getTime() : startMs + SESSION_MIN * 60000;
              const isPast  = Number.isFinite(endMs) && endMs < nowMs;
              const cid = (e.clientId ?? e.patientId) ? String(e.clientId ?? e.patientId) : matchPatientId(e.title ?? e.clientName ?? '');
              return {
                ix:         roman[i] ?? String(i + 1),
                time:       new Date(e.start).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                clientId:   cid,
                clientName: e.title ?? e.clientName ?? 'Seans',
                topic:      e.notes ?? e.topic ?? '—',
                brief:      briefForClient(cid),
                modality:   e.modality ?? 'Diğer',
                sessionNo:  i + 1,
                sev:        3 as const,
                nextLabel:  'Bugün, ' + new Date(e.start).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                status:     (isPast ? 'past' : 'upcoming') as 'past'|'next'|'upcoming',
              };
            });
            // İlk geçmemiş seansı "next" olarak işaretle (sırada olan).
            const firstUpcomingIdx = sessionsList.findIndex((s) => s.status !== 'past');
            if (firstUpcomingIdx >= 0) sessionsList[firstUpcomingIdx].status = 'next';

            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
            // Gün yoğunluğu da takvimden (calEvents) okunur — deck/tablo ile aynı kaynak
            const days = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map((label, idx) => {
              const d = new Date(weekStart);
              d.setDate(weekStart.getDate() + idx);
              const dKey = d.toISOString().slice(0, 10);
              const count = (calEvents as any[]).filter((e: any) => (e.start ?? '').slice(0, 10) === dKey).length;
              return { label, sessions: count, today: dKey === today };
            });
            const totalWeek = days.reduce((s, d) => s + d.sessions, 0);

            // ── Yoğunluk serileri (Hafta/Ay/Yıl) ──────────────────────────
            // calEvents (canlı takvim) + state.seanslar (tarihsel kayıt) birleşimi;
            // aynı gün+kişi tekilleştirilir (çift sayım önlenir). Tüm anahtarlar YEREL tarih.
            const pad2 = (n: number) => String(n).padStart(2, '0');
            const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
            const firstName = (s: string) => ((s ?? '').trim().split(/\s+/)[0] ?? '').toLocaleLowerCase('tr-TR');
            const patientNameById = (id: any) => (state.patients as any[]).find((p) => String(p.id) === String(id))?.adSoyad ?? '';
            const dayCount: Record<string, number> = {};
            const seenSession = new Set<string>();
            const addSession = (rawDate: string, name: string) => {
              const date = (rawDate ?? '').slice(0, 10);
              if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
              const key = `${date}|${firstName(name)}`;
              if (seenSession.has(key)) return;
              seenSession.add(key);
              dayCount[date] = (dayCount[date] ?? 0) + 1;
            };
            (calEvents as any[]).forEach((e) => addSession(e.start ?? '', e.title ?? e.clientName ?? ''));
            ((state.seanslar as any[]) ?? []).forEach((s) => addSession(s.tarih ?? '', patientNameById(s.client_id)));

            const nowD = new Date();
            const curY = nowD.getFullYear(), curM = nowD.getMonth(), todayLocal = ymd(nowD);
            // Hafta: mevcut haftanın 7 günü
            const weekSeries = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map((label, idx) => {
              const d = new Date(weekStart); d.setDate(weekStart.getDate() + idx);
              const k = ymd(d);
              return { label, sessions: dayCount[k] ?? 0, today: k === todayLocal };
            });
            // Ay: mevcut ayın haftalık kovaları (1–7, 8–14, …)
            const daysInMonth = new Date(curY, curM + 1, 0).getDate();
            const monthSeries: { label: string; sessions: number; today?: boolean }[] = [];
            for (let s = 1; s <= daysInMonth; s += 7) {
              const e = Math.min(s + 6, daysInMonth);
              let sum = 0;
              for (let dd = s; dd <= e; dd++) sum += dayCount[`${curY}-${pad2(curM + 1)}-${pad2(dd)}`] ?? 0;
              monthSeries.push({ label: `${s}–${e}`, sessions: sum, today: nowD.getDate() >= s && nowD.getDate() <= e });
            }
            // Yıl: 12 ay
            const AY3 = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
            const yearSeries = AY3.map((label, m) => {
              const prefix = `${curY}-${pad2(m + 1)}-`;
              let sum = 0;
              for (const k in dayCount) if (k.startsWith(prefix)) sum += dayCount[k];
              return { label, sessions: sum, today: m === curM };
            });
            const intensity = { week: weekSeries, month: monthSeries, year: yearSeries };

            // Drop riski + süreklilik — gerçek panelClients'tan türetilir
            const dropClients = panelClients.filter((c: any) => c.dropRisk === 'high' || c.dropRisk === 'medium');
            const dropRiskCard = {
              count: dropClients.length,
              copy: '14 günde 1+ iptal / sessizlik',
              list: dropClients.slice(0, 3).map((c: any) => ({ name: c.name, reason: c.dropRisk === 'high' ? 'yüksek risk' : 'orta risk' })),
            };
            const contClients = [...panelClients]
              .filter((c: any) => c.status !== 'passive' && (c.continuityPct ?? 0) > 0)
              .sort((a: any, b: any) => (b.continuityPct ?? 0) - (a.continuityPct ?? 0))
              .slice(0, 5)
              .map((c: any) => ({ name: c.name, pct: c.continuityPct ?? 0, accent: (c.continuityPct ?? 0) >= 90 }));
            const continuityCard = contClients.length
              ? { headline: 'son 30 gün', copy: 'Son 30 günün seans katılım oranı; üst üste 3 seansını tamamlayanlar koyu.', clients: contClients, values: [] }
              : undefined;

            return (
              <AnaSayfa
                onNav={(t) => { if (t === 'calisma-alani') { setCalismaSubTab('hub'); setTab('calisma-alani'); } else if (t === 'calendar') goToTakvim(); else setTab(t as any); }}
                dropRisk={dropRiskCard}
                continuity={continuityCard}
                therapist={{
                  firstName:         (state.settings.therapistName ?? 'Terapist').split(' ')[0],
                  dateLabel:         new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                  sessionCountToday: sessionsToday.length,
                }}
                stats={{
                  totalSessions,
                  activeClients,
                  continuityPct: 92,
                  pendingTasks,
                }}
                nextSession={sessionsToday[0] ? {
                  time:       new Date(sessionsToday[0].start).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                  clientName: sessionsToday[0].title ?? 'Seans',
                  meta:       `${sessionsToday.length}. seans · ${sessionsToday[0].modality ?? 'ACT'} · 50 dk`,
                } : undefined}
                todaySessions={sessionsList.length > 0 ? sessionsList : undefined}
                weekly={{ days, totalLabel: `${totalWeek} seans` }}
                intensity={intensity}
                reflection={reflectionsState[0] ? {
                  date:               new Date(reflectionsState[0].created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
                  excerpt:            (reflectionsState[0].body ?? '').slice(0, 200),
                  accentItalicPhrase: reflectionsState[0].accent_word ? ` ${reflectionsState[0].accent_word} ` : undefined,
                  meta:               reflectionsState[0].meta ?? 'günlük yansıma',
                } : undefined}
                onOpenBriefing={() => {
                  // İlk görüşme danışanı kontrolü (senkron — state'ten)
                  const newToday = (state.patients as Patient[]).find(p =>
                    (p.createdAt ?? '').slice(0, 10) === today &&
                    (p.status === 'intake' || p.status === 'active')
                  );
                  const matchedEv = newToday
                    ? (sessionsToday.find((ev: any) =>
                        (ev.title ?? '').toLowerCase().includes(
                          (newToday.adSoyad ?? '').split(' ')[0].toLowerCase()
                        )
                      ) ?? sessionsToday[0] ?? null)
                    : null;
                  setFirstContactClient(newToday ? { patient: newToday, calEvent: matchedEv } : null);

                  // Anında mock ile aç, arka planda gerçek veriyi çek
                  setRandevuOzet(makeMockBriefData(today));
                  setDailyBriefOpen(true);

                  fetch('/api/randevu-ozet')
                    .then(r => r.json())
                    .then(data => {
                      const isEmpty =
                        (data.cancellations?.length ?? 0) === 0 &&
                        (data.newAppointments?.length ?? 0) === 0;
                      setRandevuOzet(isEmpty ? makeMockBriefData(today) : data);
                    })
                    .catch(() => { /* mock zaten set edildi */ });
                }}
                onAskAssistant={() => console.log('assistant')}
                resolvePatientId={(name) => matchPatientId(name)}
                reviewedIds={reviewedToday}
                onOpenPatient={(id) => {
                  if (id) { markReviewed(id); router.push(`/danisan/${id}`); }
                  else goToDanisanlar();
                }}
                onOpenPatientSessions={(id) => {
                  if (id) { markReviewed(id); router.push(`/profil/${id}?from=havuz&focus=seanslar`); }
                  else goToDanisanlar();
                }}
                onOpenFormulation={() => goToFormulasyon()}
                onOpenProcesses={() => goToDanisanlar()}
                onSaveWellbeing={async (score, note) => {
                  await fetch('/api/reflections', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ type: 'check-in', score, text: note, meta: 'iyilik hali' }),
                  });
                }}
                onWriteReflection={() => { setReflectFocus(true); setTab('terapist'); }}
                onOpenContinuity={() => goToDanisanlar()}
                onOpenWeekly={() => goToTakvim()}
                onOpenSozluk={() => router.push('/sozluk')}
              />
            );
          })()}

          {/* ── Günlük Randevu Özeti Modal ───────────────────── */}
          {dailyBriefOpen && (
            <DailyBriefModal
              randevuOzet={randevuOzet}
              firstContact={firstContactClient}
              today={new Date().toISOString().slice(0, 10)}
              onClose={() => setDailyBriefOpen(false)}
              onOpenPatient={(id) => {
                setDailyBriefOpen(false);
                setActivePatientId(id);
                goToFormulasyon();
              }}
              onSaveMazeret={async (sbId, mazeret) => {
                await fetch(`/api/seans-bildirimleri/${sbId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mazeret }),
                });
                // Lokal güncelle
                setRandevuOzet(prev => prev ? {
                  ...prev,
                  cancellations: prev.cancellations.map(c =>
                    c.id === sbId ? { ...c, mazeret } : c
                  ),
                } : prev);
              }}
            />
          )}

          {tab === "calisma-alani" && calismaSubTab === "takvim" && (
            <TakvimRandevular
              events={calEvents}
              resolveClient={resolveClientForCalendar}
              avgFee={avgClientFee}
              availability={availability}
              onAddBlock={async (b) => {
                await fetch('/api/musaitlik/blok', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).catch(() => {});
                refreshAvailability();
              }}
              gelisimEvents={gelisimEvents}
              onManualSync={async () => {
                await fetch('/api/calendar-sync', { method: 'POST' }).catch(() => {});
                await refreshCalendar();
              }}
              onBack={() => setCalismaSubTab('hub')}
              onNav={(t) => { if (t === 'home') setTab('home'); else if (t === 'calisma-alani') setCalismaSubTab('hub'); else if (t === 'calendar') goToTakvim(); else if (t === 'terapist') setTab('terapist'); else setTab(t as any); }}
              onOpenClient={(name) => {
                const id = resolvePatientByName(name);
                if (id) { markReviewed(id); router.push(`/profil/${id}?from=havuz&focus=seanslar`); }
                else goToDanisanlar();
              }}
              onPrepareSession={(name) => {
                const id = resolvePatientByName(name);
                if (id) router.push(`/seansa-hazirlik/${id}`);
                else goToDanisanlar();
              }}
              onNewAppointment={() => router.push('/seans-planlayici')}
              onOpenInterventionSuggest={() => setTab('terapist')}
            />
          )}
          {tab === "calisma-alani" && calismaSubTab === "danisanlar" && (
            <DanisanlarV2
              clients={panelClients}
              onBack={() => setCalismaSubTab('hub')}
              onNav={(t) => setTab(t as Tab)}
              onNewClient={() => setNewClientOpen(true)}
              onPrefetchClient={(id) => router.prefetch(`/danisan/${id}`)}
              onOpenClient={(id) => router.push(`/danisan/${id}`)}
            />
          )}
          {tab === "calisma-alani" && calismaSubTab === "hub" && (() => {
            const today = new Date().toISOString().slice(0, 10);
            const activeCount  = panelClients.filter((c) => c.status === 'active' || c.status === 'follow').length;
            const archiveCount = panelClients.filter((c) => c.status === 'passive').length;
            const todaySeans   = calEvents.filter((e: any) => (e.start ?? '').slice(0, 10) === today).length;
            const hubStats = [
              { v: String(activeCount),  l: 'Aktif danışan' },
              { v: String(archiveCount), l: 'Arşiv' },
              { v: String(todaySeans),   l: 'Bugün seans' },
            ];
            const hubRecent = [...panelClients]
              .filter((c) => c.lastSession)
              .sort((a, b) => String(b.lastSession).localeCompare(String(a.lastSession)))
              .slice(0, 4)
              .map((c) => ({ id: c.id, name: c.name, topic: c.issue || '—' }));
            return (
              <CalismaAlaniV2
                therapistName={(state.settings.therapistName ?? 'Göksel Akkaya').trim()}
                stats={hubStats}
                recent={hubRecent}
                onBack={() => setTab('home')}
                onNav={(t) => { if (t === 'calendar') goToTakvim(); else setTab(t as Tab); }}
                onNewClient={() => setNewClientOpen(true)}
                onOpenProfile={() => setTab('terapist')}
                onOpenDanisanlar={goToDanisanlar}
                onOpenTasarimlar={goToTasarimlar}
                onOpenTakvim={goToTakvim}
                onOpenMuhasebe={goToMuhasebe}
                onOpenClient={(id) => router.push(`/danisan/${id}`)}
              />
            );
          })()}
          {tab === "calisma-alani" && calismaSubTab === "formulasyon" && (() => {
            const activePatient = state.patients.find((p: any) => String(p.id) === String(activePatientId));
            return (
              <FormulasyonV2
                client={activePatient ? {
                  id:    String(activePatient.id),
                  name:  activePatient.adSoyad ?? '—',
                  issue: activePatient.sunumSorunu ?? '—',
                } : undefined}
                fourP={formulationPanelData?.fourP}
                hexaflex={formulationPanelData?.hexaflex ?? undefined}
                summary={formulationPanelData?.summary ?? undefined}
                maturity={formulationPanelData?.maturity}
                onBack={() => { setCalismaSubTab('hub'); setTab('calisma-alani'); }}
                onNav={(t) => setTab(t as Tab)}
                onSave={async () => {
                  if (!activePatientId) return;
                  const res = await fetch(`/api/formulations/${activePatientId}/panel`);
                  if (res.ok) setFormulationPanelData(await res.json());
                }}
                onOpenLibrary={() => setTab('mudahale-kutuphanesi')}
              />
            );
          })()}
          {tab === "calisma-alani" && calismaSubTab === "tasarimlar" && (
            <TasarimDosyalariV2
              onBack={() => setCalismaSubTab('hub')}
              onNav={(t) => setTab(t as Tab)}
            />
          )}
          {tab === "calisma-alani" && calismaSubTab === "muhasebe" && (
            <MuhasebePanel onBack={() => setCalismaSubTab('hub')} />
          )}
          {tab === "terapist" && (
            <TerapistProfilV2
              key={profileKey}
              focusReflection={reflectFocus}
              onConsumedFocus={() => setReflectFocus(false)}
              onBack={() => setTab('home')}
              onNav={(target) => setTab(target as Tab)}
              onEditProfile={() => setEditProfileOpen(true)}
              onShareConsent={() => { window.location.href = 'https://www.elegantpsikoloji.com/onam-onizleme'; }}
              onShareBooklet={(b) => setBookletShare({ open: true, booklet: b })}
              gelisimEvents={gelisimEvents}
              onAddGelisim={(ev) => setGelisimEvents((prev) => [...prev, { id: `gp-${Date.now()}`, done: false, ...ev }])}
              settings={state.settings}
              onUpdateSetting={async (patch) => {
                dispatch({ type: 'SETTINGS', patch });
                await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(() => {});
              }}
              onExportData={() => {
                const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `formulasyon-${new Date().toISOString().slice(0, 10)}.json`; a.click();
                URL.revokeObjectURL(url);
              }}
            />
          )}
          {tab === "tasarim-arsivi" && (
            <YolHaritasiV2
              onBack={() => { setCalismaSubTab('hub'); setTab('calisma-alani'); }}
              onNav={(t) => setTab(t as Tab)}
              onNewTool={() => {}}
            />
          )}
          {tab === "mudahale-kutuphanesi" && (
            <MudahaleV2
              interventions={interventions}
              basket={basket}
              onBack={() => { setCalismaSubTab('hub'); setTab('calisma-alani'); }}
              onNav={(t) => setTab(t as Tab)}
              onToggleFavorite={async (id) => {
                const r = await fetch(`/api/interventions/${id}/favorite`, { method: 'POST' });
                if (r.ok) {
                  const result = await r.json();
                  setInterventions(prev => prev.map(iv => iv.id === id ? { ...iv, favorite: result.favorite } : iv));
                }
              }}
              onAddToBasket={(id) => setBasket(b => b.includes(id) ? b : [...b, id])}
              onRemoveFromBasket={(id) => setBasket(b => b.filter(x => x !== id))}
              onCreateSessionPlan={(ids) => {
                const base = activePatientId
                  ? `/seans-planlayici?client=${activePatientId}&from=${ids.join(',')}`
                  : `/seans-planlayici?from=${ids.join(',')}`;
                router.push(base);
                setBasket([]);
              }}
            />
          )}
          {tab === "act-gelistirme" && (
            <ACTGelistirmeV2
              onBack={() => setTab('home')}
              onNav={(t) => setTab(t as Tab)}
              slots={{
                hexaflex: <ACTDancing initialMode="hexaflex" />,
                triflex:  <ACTDancing initialMode="triflex" />,
                sefkat:   <SefkatCalismasi />,
                schools:  <EkolKarsilastirma />,
                smart:    <SMARTHedef />,
              }}
            />
          )}
        </div>
      </main>
      {/* ── Yeni danışan modalı (erişilebilir) ── */}
      <NewClientModal
        open={newClientOpen}
        onClose={() => setNewClientOpen(false)}
        dispatch={dispatch}
        onCreated={(id) => { setActivePatientId(id); router.push(`/profil/${id}`); }}
      />

      {/* ── Terapist Profil: düzenle modalı ── */}
      <ProfileEditModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        currentName={state.settings.therapistName || 'Göksel Akkaya'}
        onSaved={(name) => { dispatch({ type: 'SETTINGS', patch: { therapistName: name } }); setProfileKey(k => k + 1); }}
      />

      {/* ── Terapist Profil: onam formu paylaş modalı ── */}
      <ShareLinkModal
        open={bookletShare.open}
        onClose={() => setBookletShare({ open: false })}
        patients={state.patients as Patient[]}
        formTipi="kitapcik"
        payload={bookletShare.booklet}
        modalTitle={bookletShare.booklet ? `Kitapçık gönder — ${bookletShare.booklet.title}` : 'Kitapçık gönder'}
        ctaLabel="Bu danışana gönder"
        successNoun="kitapçık bağlantısı"
        note="Danışan bu bağlantıdan bilgilendirme kitapçığını okuyabilir."
      />

      {/* ── Bottom pill nav ── */}
      <nav className="fixed bottom-[22px] left-0 right-0 z-[60] flex justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#131311] p-[7px] shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55),0_2px_8px_-3px_rgba(0,0,0,0.4)] max-w-[calc(100vw-28px)] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map(n => {
            const isActive = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => { if (n.id === 'calisma-alani') setCalismaSubTab('hub'); setTab(n.id); }}
                className={cx(
                  "relative px-5 py-[11px] rounded-full text-[14px] transition-all whitespace-nowrap",
                  isActive
                    ? "bg-white text-[#15171d] font-semibold"
                    : "font-medium text-[rgba(243,241,234,0.6)] hover:text-white",
                )}
              >
                {n.label}
              </button>
            );
          })}
          <button
            key="supervizyon"
            onClick={() => router.push('/supervizyon')}
            className={cx(
              "relative px-5 py-[11px] rounded-full text-[14px] transition-all whitespace-nowrap",
              "font-medium text-[rgba(243,241,234,0.6)] hover:text-white",
            )}
          >
            Süpervizyon
          </button>
        </div>
      </nav>

      {/* Brief floating button — visible when a patient is active */}
      <BriefModal
        patientId={activePatientId ?? undefined}
        patientName={activePatientId ? state.patients.find(p => p.id === activePatientId)?.adSoyad : undefined}
      />
    </div>
  );
}
