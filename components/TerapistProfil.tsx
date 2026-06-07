'use client';
import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, AlertTriangle, Heart, Save, CheckCircle2, Tag, Download,
  Camera, Plus, X, Settings, User, GraduationCap, Building2, Award,
  MessageSquare, Bell, Eye, EyeOff, Printer, RefreshCw,
} from 'lucide-react';
import SupervizyonPanel from '@/components/SupervizyonPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckIn   = { id: string; tarih: string; degerler: number; kacinma: number; burnout: number; eylem: string };
type MoodLog   = { id: string; tarih: string; skor: number; emoji: string; not: string };
type TodoItem  = { id: string; text: string; tamamlandi: boolean; deger?: string; tamamlanmaTarihi?: string; createdAt: string };
type PatientStub = { id: string; adSoyad: string; status: string };
type SeansStub   = { id: string; patientId: string; tip?: string };

type EgitimBilgisi = { universite: string; bolum: string; yil: string };

type ProfilData = {
  adSoyad: string;
  unvan: string;
  dogumTarihi: string;
  telefon: string;
  eposta: string;
  sehir: string;
  hakkinda: string;
  foto?: string;
  lisans: EgitimBilgisi;
  yuksekLisans: EgitimBilgisi;
  doktora: EgitimBilgisi;
  uzmanlikAlanlari: string[];
  dernekUyelikleri: string[];
  sertifikalar: string[];
};

const EMPTY_EGITIM: EgitimBilgisi = { universite: '', bolum: '', yil: '' };

const EMPTY_PROFIL: ProfilData = {
  adSoyad: '', unvan: '', dogumTarihi: '', telefon: '', eposta: '', sehir: '', hakkinda: '',
  foto: undefined,
  lisans: { ...EMPTY_EGITIM },
  yuksekLisans: { ...EMPTY_EGITIM },
  doktora: { ...EMPTY_EGITIM },
  uzmanlikAlanlari: [],
  dernekUyelikleri: [],
  sertifikalar: [],
};

const MOODS = [
  { skor: 1, emoji: '😔', label: 'Çok kötü' },
  { skor: 2, emoji: '😕', label: 'Kötü' },
  { skor: 3, emoji: '😐', label: 'Orta' },
  { skor: 4, emoji: '🙂', label: 'İyi' },
  { skor: 5, emoji: '😊', label: 'Harika' },
];

const ACT_DEGERLER_PROFIL = [
  { id: 'mesleki',    emoji: '🌱', label: 'Mesleki Gelişim'  },
  { id: 'ozbakım',   emoji: '💙', label: 'Öz-Bakım'         },
  { id: 'super',     emoji: '🧑‍🏫', label: 'Süpervizyon'      },
  { id: 'etik',      emoji: '⚖️',  label: 'Etik Uygulama'    },
  { id: 'aile',      emoji: '👨‍👩‍👧', label: 'Aile & İlişkiler' },
  { id: 'anlam',     emoji: '🌟', label: 'Anlam & Amaç'      },
  { id: 'baglanti',  emoji: '🤝', label: 'Bağlantı'          },
  { id: 'saglik',    emoji: '🏃', label: 'Sağlık & Hareket'  },
  { id: 'ogrenme',   emoji: '📚', label: 'Öğrenme & Merak'   },
  { id: 'donusturuk',emoji: '🎨', label: 'Yaratıcılık'       },
];

function todayStr() { return new Date().toISOString().slice(0, 10); }

// ─── Mini chart ───────────────────────────────────────────────────────────────

function MiniChart({ data }: { data: MoodLog[] }) {
  if (data.length < 2) return <p className="text-xs text-gray-500 text-center py-4">En az 2 giriş gerekiyor</p>;
  const sorted = [...data].sort((a, b) => a.tarih.localeCompare(b.tarih)).slice(-14);
  const W = 280, H = 60, pad = 8;
  const xs = sorted.map((_, i) => pad + (i / (sorted.length - 1)) * (W - 2 * pad));
  const ys = sorted.map(d => H - pad - ((d.skor - 1) / 4) * (H - 2 * pad));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <path d={path} fill="none" stroke="#0E0F12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {sorted.map((d, i) => <circle key={i} cx={xs[i]} cy={ys[i]} r="3" fill="#0E0F12" />)}
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  therapistName?: string;
  patients?: PatientStub[];
  seanslar?: SeansStub[];
  onSettingsChange?: (patch: { therapistName?: string; smsWebhookUrl?: string }) => void;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TerapistProfil({
  therapistName, patients = [], seanslar = [], onSettingsChange,
}: Props) {
  const [tab, setTab] = useState<'profil' | 'checkin' | 'mood' | 'supervizyon' | 'deger-eylemler' | 'ayarlar'>('profil');

  // Check-in
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [degerler, setDegerler] = useState(3);
  const [kacinma,  setKacinma]  = useState(2);
  const [burnout,  setBurnout]  = useState(2);
  const [eylem,    setEylem]    = useState('');
  const [checkSaved, setCheckSaved] = useState(false);

  // Mood
  const [moods,    setMoods]    = useState<MoodLog[]>([]);
  const [moodSkor, setMoodSkor] = useState(4);
  const [moodNot,  setMoodNot]  = useState('');
  const [moodSaved, setMoodSaved] = useState(false);

  // Profil
  const [profil, setProfil] = useState<ProfilData>(EMPTY_PROFIL);
  const [profilSaved, setProfilSaved] = useState(false);
  const [showCv, setShowCv] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);

  // Tag inputs
  const [newUzmanlik,  setNewUzmanlik]  = useState('');
  const [newDernek,    setNewDernek]    = useState('');
  const [newSertifika, setNewSertifika] = useState('');

  // Settings
  const [settTerapistAdi, setSettTerapistAdi] = useState(therapistName || '');
  const [settSmsUrl,      setSettSmsUrl]      = useState('');
  const [settSmsEnabled,  setSettSmsEnabled]  = useState(false);
  const [settBildirim,    setSettBildirim]    = useState(true);
  const [settSaved,       setSettSaved]       = useState(false);
  const [showSmsPass,     setShowSmsPass]     = useState(false);

  useEffect(() => {
    const ci = JSON.parse(localStorage.getItem('terapist_checkins') || '[]');
    const ml = JSON.parse(localStorage.getItem('terapist_moods')    || '[]');
    const pr = JSON.parse(localStorage.getItem('terapist_profil')   || 'null');
    const st = JSON.parse(localStorage.getItem('terapist_sett')     || 'null');
    setCheckins(ci);
    setMoods(ml);
    if (pr) setProfil(pr);
    if (st) {
      if (st.terapistAdi)  setSettTerapistAdi(st.terapistAdi);
      if (st.smsUrl)       setSettSmsUrl(st.smsUrl);
      if (st.smsEnabled != null)  setSettSmsEnabled(st.smsEnabled);
      if (st.bildirim != null)    setSettBildirim(st.bildirim);
    } else if (therapistName) {
      setSettTerapistAdi(therapistName);
    }
  }, []);

  // ── Check-in
  const saveCheckin = () => {
    const entry: CheckIn = { id: `ci_${Date.now()}`, tarih: todayStr(), degerler, kacinma, burnout, eylem };
    const updated = [entry, ...checkins.filter(c => c.tarih !== todayStr())];
    setCheckins(updated);
    localStorage.setItem('terapist_checkins', JSON.stringify(updated));
    setCheckSaved(true); setTimeout(() => setCheckSaved(false), 2000);
    setEylem('');
  };

  // ── Mood
  const saveMood = () => {
    const mood = MOODS.find(m => m.skor === moodSkor)!;
    const entry: MoodLog = { id: `ml_${Date.now()}`, tarih: todayStr(), skor: moodSkor, emoji: mood.emoji, not: moodNot };
    const updated = [entry, ...moods.filter(m => m.tarih !== todayStr())];
    setMoods(updated);
    localStorage.setItem('terapist_moods', JSON.stringify(updated));
    setMoodSaved(true); setTimeout(() => setMoodSaved(false), 2000);
    setMoodNot('');
  };

  // ── Profil
  const saveProfil = () => {
    localStorage.setItem('terapist_profil', JSON.stringify(profil));
    setProfilSaved(true); setTimeout(() => setProfilSaved(false), 2000);
  };

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setProfil(p => ({ ...p, foto: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const addTag = (field: 'uzmanlikAlanlari' | 'dernekUyelikleri' | 'sertifikalar', val: string, clear: () => void) => {
    if (!val.trim()) return;
    setProfil(p => ({ ...p, [field]: [...p[field], val.trim()] }));
    clear();
  };
  const removeTag = (field: 'uzmanlikAlanlari' | 'dernekUyelikleri' | 'sertifikalar', idx: number) =>
    setProfil(p => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }));

  // ── Settings
  const saveSettings = () => {
    const st = { terapistAdi: settTerapistAdi, smsUrl: settSmsUrl, smsEnabled: settSmsEnabled, bildirim: settBildirim };
    localStorage.setItem('terapist_sett', JSON.stringify(st));
    onSettingsChange?.({ therapistName: settTerapistAdi, smsWebhookUrl: settSmsUrl });
    setSettSaved(true); setTimeout(() => setSettSaved(false), 2000);
  };

  // ── Derived
  const todayCheckin = checkins.find(c => c.tarih === todayStr());
  const todayMood    = moods.find(m => m.tarih === todayStr());
  const burnoutHigh  = todayCheckin && todayCheckin.burnout >= 4;
  const avgMood = moods.length > 0 ? (moods.reduce((a, m) => a + m.skor, 0) / moods.length).toFixed(1) : '—';
  const streak = (() => {
    let s = 0; const d = new Date();
    for (let i = 0; i < 30; i++) {
      const ds = d.toISOString().slice(0, 10);
      if (moods.find(m => m.tarih === ds)) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    return s;
  })();

  const displayName  = profil.adSoyad  || therapistName || 'Terapist';
  const displayUnvan = profil.unvan    || '';

  // ── Egitim field helper
  const setEgitim = (key: 'lisans' | 'yuksekLisans' | 'doktora', field: keyof EgitimBilgisi, val: string) =>
    setProfil(p => ({ ...p, [key]: { ...p[key], [field]: val } }));

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── Profil başlığı ────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          {/* Fotoğraf */}
          <div className="relative flex-shrink-0">
            <div
              onClick={() => fotoRef.current?.click()}
              className="w-16 h-16 rounded-2xl bg-[#F4F5F8] flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition border-2 border-dashed border-gray-200 hover:border-indigo-300"
            >
              {profil.foto
                ? <img src={profil.foto} alt="Profil" className="w-full h-full object-cover" />
                : <User className="w-7 h-7 text-gray-300" />
              }
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0E0F12] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition"
              onClick={() => fotoRef.current?.click()}
            >
              <Camera className="w-2.5 h-2.5 text-white" />
            </div>
            <input ref={fotoRef} type="file" accept="image/*" onChange={handleFoto} className="hidden" />
          </div>

          {/* İsim + Ünvan */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-[#0E0F12] leading-tight truncate">{displayName}</h1>
            {displayUnvan && <p className="text-sm text-gray-600 mt-0.5">{displayUnvan}</p>}
            {profil.sehir && <p className="text-xs text-gray-400 mt-0.5">📍 {profil.sehir}</p>}
          </div>

          {/* CV butonu */}
          <button
            onClick={() => setShowCv(true)}
            className="flex-shrink-0 flex items-center gap-1.5 bg-[#0E0F12] text-white text-xs rounded-xl px-4 py-2.5 hover:opacity-80 transition font-medium"
          >
            <Download className="w-3.5 h-3.5" /> CV
          </button>
        </div>
      </div>

      {/* Burnout uyarısı */}
      {burnoutHigh && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Burnout sinyali</p>
            <p className="text-xs text-amber-700 mt-0.5">Bugünkü burnout puanın yüksek. Süpervizyon veya dinlenme planla.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-[#0E0F12]">{moods.length}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Mood Girişi</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-[#0E0F12]">{avgMood}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Ort. Puan</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-[#0E0F12]">{streak}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Ardışık Gün</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#F4F5F8] p-1 rounded-2xl overflow-x-auto">
        {([
          { k: 'profil',         l: '👤 Profil & CV'        },
          { k: 'checkin',        l: '✅ Check-in'            },
          { k: 'mood',           l: '😊 Duygu Günlüğü'       },
          { k: 'supervizyon',    l: '🧑‍🏫 Süpervizyon'         },
          { k: 'deger-eylemler', l: '🌟 Değer Eylemleri'     },
          { k: 'ayarlar',        l: '⚙️ Sistem Ayarları'      },
        ] as const).map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-shrink-0 text-xs px-3 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              tab === t.k ? 'bg-white text-[#0E0F12] shadow-sm' : 'text-gray-500 hover:text-[#0E0F12]'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* ── PROFIL TAB ────────────────────────────────────────────────── */}
      {tab === 'profil' && (
        <div className="space-y-4">
          {/* Kişisel bilgiler */}
          <div className="card p-5 space-y-4">
            <SectionTitle icon={<User className="w-4 h-4" />} title="Kişisel Bilgiler" />
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <FieldLabel>Ad Soyad</FieldLabel>
                <Input value={profil.adSoyad} onChange={v => setProfil(p => ({ ...p, adSoyad: v }))} placeholder="Ad Soyad" />
              </div>
              <div>
                <FieldLabel>Ünvan / Meslek</FieldLabel>
                <Input value={profil.unvan} onChange={v => setProfil(p => ({ ...p, unvan: v }))} placeholder="Psikolog, Psikiyatrist…" />
              </div>
              <div>
                <FieldLabel>Doğum Tarihi</FieldLabel>
                <input
                  type="date"
                  value={profil.dogumTarihi}
                  onChange={e => setProfil(p => ({ ...p, dogumTarihi: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-[#F4F5F8] outline-none focus:border-[#0E0F12] text-[#0E0F12]"
                />
              </div>
              <div>
                <FieldLabel>Telefon</FieldLabel>
                <Input value={profil.telefon} onChange={v => setProfil(p => ({ ...p, telefon: v }))} placeholder="+90 5XX XXX XX XX" />
              </div>
              <div>
                <FieldLabel>E-posta</FieldLabel>
                <Input value={profil.eposta} onChange={v => setProfil(p => ({ ...p, eposta: v }))} placeholder="ornek@mail.com" />
              </div>
              <div>
                <FieldLabel>Şehir</FieldLabel>
                <Input value={profil.sehir} onChange={v => setProfil(p => ({ ...p, sehir: v }))} placeholder="Ankara" />
              </div>
              <div className="col-span-2">
                <FieldLabel>Hakkımda / Özet</FieldLabel>
                <textarea
                  rows={3}
                  value={profil.hakkinda}
                  onChange={e => setProfil(p => ({ ...p, hakkinda: e.target.value }))}
                  placeholder="Kısa bir tanıtım metni…"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-[#F4F5F8] outline-none focus:border-[#0E0F12] resize-none text-[#0E0F12] placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Eğitim */}
          <div className="card p-5 space-y-4">
            <SectionTitle icon={<GraduationCap className="w-4 h-4" />} title="Eğitim" />
            {([
              { key: 'lisans' as const,      label: 'Lisans'         },
              { key: 'yuksekLisans' as const, label: 'Yüksek Lisans' },
              { key: 'doktora' as const,      label: 'Doktora'        },
            ]).map(({ key, label }) => (
              <div key={key}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={profil[key].universite}
                    onChange={v => setEgitim(key, 'universite', v)}
                    placeholder="Üniversite"
                  />
                  <Input
                    value={profil[key].bolum}
                    onChange={v => setEgitim(key, 'bolum', v)}
                    placeholder="Bölüm / Program"
                  />
                  <Input
                    value={profil[key].yil}
                    onChange={v => setEgitim(key, 'yil', v)}
                    placeholder="Mezuniyet yılı"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Uzmanlık Alanları */}
          <div className="card p-5 space-y-3">
            <SectionTitle icon={<Award className="w-4 h-4" />} title="Uzmanlık Alanları" />
            <TagInput
              value={newUzmanlik}
              onChange={setNewUzmanlik}
              onAdd={() => addTag('uzmanlikAlanlari', newUzmanlik, () => setNewUzmanlik(''))}
              placeholder="Örn: Anksiyete Bozuklukları"
            />
            <TagList
              items={profil.uzmanlikAlanlari}
              onRemove={i => removeTag('uzmanlikAlanlari', i)}
              color="indigo"
            />
          </div>

          {/* Dernek Üyelikleri */}
          <div className="card p-5 space-y-3">
            <SectionTitle icon={<Building2 className="w-4 h-4" />} title="Dernek Üyelikleri" />
            <TagInput
              value={newDernek}
              onChange={setNewDernek}
              onAdd={() => addTag('dernekUyelikleri', newDernek, () => setNewDernek(''))}
              placeholder="Örn: Türk Psikologlar Derneği"
            />
            <TagList
              items={profil.dernekUyelikleri}
              onRemove={i => removeTag('dernekUyelikleri', i)}
              color="violet"
            />
          </div>

          {/* Sertifikalar */}
          <div className="card p-5 space-y-3">
            <SectionTitle icon={<Award className="w-4 h-4" />} title="Sertifikalar & Eğitimler" />
            <TagInput
              value={newSertifika}
              onChange={setNewSertifika}
              onAdd={() => addTag('sertifikalar', newSertifika, () => setNewSertifika(''))}
              placeholder="Örn: BDT Uygulayıcı Eğitimi – Beck Institute"
            />
            <TagList
              items={profil.sertifikalar}
              onRemove={i => removeTag('sertifikalar', i)}
              color="emerald"
            />
          </div>

          {/* Gelişim Haritası */}
          <GelisimHaritasi />

          {/* Kaydet */}
          <button
            onClick={saveProfil}
            className="flex items-center gap-2 bg-[#0E0F12] text-white text-sm rounded-xl px-5 py-2.5 hover:opacity-80 transition"
          >
            <Save className="w-4 h-4" />
            {profilSaved ? '✓ Kaydedildi' : 'Profili Kaydet'}
          </button>
        </div>
      )}

      {/* ── CHECK-IN TAB ──────────────────────────────────────────────── */}
      {tab === 'checkin' && (
        <div className="card p-5 space-y-5">
          {todayCheckin && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-700 font-medium">
              ✓ Bugün check-in tamamlandı. Tekrar kaydet = güncellenir.
            </div>
          )}

          {([
            { label: 'Değerlere uygun yaşadım', val: degerler, set: setDegerler, icon: <Heart className="w-4 h-4" /> },
            { label: 'Kaçınma (düşük = iyi)',   val: kacinma,  set: setKacinma,  icon: <TrendingUp className="w-4 h-4" /> },
            { label: 'Tükenmişlik belirtisi',   val: burnout,  set: setBurnout,  icon: <AlertTriangle className="w-4 h-4" /> },
          ]).map(({ label, val, set, icon }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-[#0E0F12]">
                  <span className="text-gray-400">{icon}</span>{label}
                </div>
                <span className="text-sm font-bold text-[#0E0F12]">{val}/5</span>
              </div>
              <input type="range" min={0} max={5} step={1} value={val}
                onChange={e => set(Number(e.target.value))}
                className="w-full accent-[#0E0F12]" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                {[0,1,2,3,4,5].map(n => <span key={n}>{n}</span>)}
              </div>
            </div>
          ))}

          <div>
            <label className="text-xs text-gray-500 block mb-1">Bu hafta eylem</label>
            <input type="text"
              placeholder="Örn: Cuma akşamı e-postaları kapatacağım"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-[#F4F5F8] outline-none focus:border-[#0E0F12] text-[#0E0F12] placeholder-gray-400"
              value={eylem} onChange={e => setEylem(e.target.value)} />
          </div>

          <button onClick={saveCheckin}
            className="flex items-center gap-2 bg-[#0E0F12] text-white text-sm rounded-xl px-5 py-2 hover:opacity-80 transition">
            <Save className="w-4 h-4" />
            {checkSaved ? '✓ Kaydedildi' : 'Kaydet'}
          </button>

          {checkins.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3">Son Check-in'ler</p>
              <div className="space-y-2">
                {checkins.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400 w-24 flex-shrink-0">{c.tarih}</span>
                    <span title="Değerler">💛 {c.degerler}</span>
                    <span title="Kaçınma">🔄 {c.kacinma}</span>
                    <span title="Burnout" className={c.burnout >= 4 ? 'text-red-500 font-semibold' : 'text-gray-600'}>🔥 {c.burnout}</span>
                    {c.eylem && <span className="text-gray-500 truncate">→ {c.eylem}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MOOD TAB ──────────────────────────────────────────────────── */}
      {tab === 'mood' && (
        <div className="card p-5 space-y-5">
          {todayMood && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-700 font-medium">
              ✓ Bugünkü giriş: {todayMood.emoji} {todayMood.skor}/5
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-3 font-medium">Bugün nasılsın?</p>
            <div className="flex justify-between">
              {MOODS.map(m => (
                <button key={m.skor} onClick={() => setMoodSkor(m.skor)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                    moodSkor === m.skor ? 'bg-[#0E0F12] text-white' : 'hover:bg-[#F4F5F8]'
                  }`}>
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Not (opsiyonel)</label>
            <textarea rows={2}
              placeholder="Bugün nasıl geçti…"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-[#F4F5F8] outline-none focus:border-[#0E0F12] resize-none text-[#0E0F12] placeholder-gray-400"
              value={moodNot} onChange={e => setMoodNot(e.target.value)} />
          </div>

          <button onClick={saveMood}
            className="flex items-center gap-2 bg-[#0E0F12] text-white text-sm rounded-xl px-5 py-2 hover:opacity-80 transition">
            <Save className="w-4 h-4" />
            {moodSaved ? '✓ Kaydedildi' : 'Kaydet'}
          </button>

          {moods.length > 1 && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">Son 14 Gün</p>
              <MiniChart data={moods} />
            </div>
          )}

          {moods.length > 0 && (
            <div className="space-y-1.5">
              {moods.slice(0, 7).map(m => (
                <div key={m.id} className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400 w-24 flex-shrink-0">{m.tarih}</span>
                  <span>{m.emoji}</span>
                  <span className="font-medium text-[#0E0F12]">{m.skor}/5</span>
                  {m.not && <span className="text-gray-500 truncate">{m.not}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUPERVIZYON TAB ───────────────────────────────────────────── */}
      {tab === 'supervizyon' && (
        <SupervizyonPanel patients={patients} seanslar={seanslar} />
      )}

      {/* ── DEĞER EYLEMLERI TAB ───────────────────────────────────────── */}
      {tab === 'deger-eylemler' && <DegerYonluEylemler />}

      {/* ── AYARLAR TAB ───────────────────────────────────────────────── */}
      {tab === 'ayarlar' && (
        <div className="space-y-4">
          {/* Terapist kimliği */}
          <div className="card p-5 space-y-4">
            <SectionTitle icon={<User className="w-4 h-4" />} title="Terapist Bilgileri" />
            <div>
              <FieldLabel>Sistemde görünen ad</FieldLabel>
              <Input
                value={settTerapistAdi}
                onChange={setSettTerapistAdi}
                placeholder="Ad Soyad"
              />
              <p className="text-[10px] text-gray-400 mt-1">Ana ekran başlığı ve tüm selamlama metinlerinde kullanılır.</p>
            </div>
          </div>

          {/* SMS / NetGSM */}
          <div className="card p-5 space-y-4">
            <SectionTitle icon={<MessageSquare className="w-4 h-4" />} title="SMS Entegrasyonu" />
            <ToggleRow
              label="SMS bildirimlerini etkinleştir"
              sub="Randevu hatırlatıcıları ve bildirimler için"
              checked={settSmsEnabled}
              onChange={setSettSmsEnabled}
            />
            {settSmsEnabled && (
              <div>
                <FieldLabel>SMS Webhook URL (NetGSM veya benzeri)</FieldLabel>
                <div className="flex gap-2">
                  <input
                    type={showSmsPass ? 'text' : 'password'}
                    value={settSmsUrl}
                    onChange={e => setSettSmsUrl(e.target.value)}
                    placeholder="https://api.netgsm.com.tr/…"
                    className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-[#F4F5F8] outline-none focus:border-[#0E0F12] text-[#0E0F12] placeholder-gray-400"
                  />
                  <button
                    onClick={() => setShowSmsPass(v => !v)}
                    className="px-3 rounded-xl border border-gray-200 hover:bg-[#F4F5F8] transition text-gray-500"
                  >
                    {showSmsPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bildirimler */}
          <div className="card p-5 space-y-4">
            <SectionTitle icon={<Bell className="w-4 h-4" />} title="Bildirim Tercihleri" />
            <ToggleRow
              label="Uygulama içi bildirimler"
              sub="Bekleyen dosyalar ve hatırlatıcılar için"
              checked={settBildirim}
              onChange={setSettBildirim}
            />
          </div>

          {/* Kaydet */}
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 bg-[#0E0F12] text-white text-sm rounded-xl px-5 py-2.5 hover:opacity-80 transition font-medium"
          >
            <Save className="w-4 h-4" />
            {settSaved ? '✓ Kaydedildi' : 'Ayarları Kaydet'}
          </button>

          {settSaved && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-700 font-medium">
              ✓ Ayarlar kaydedildi. Terapist adı güncellendi.
            </div>
          )}
        </div>
      )}

      {/* ── CV Modal ──────────────────────────────────────────────────── */}
      {showCv && (
        <CvModal profil={profil} onClose={() => setShowCv(false)} moods={moods} checkins={checkins} />
      )}
    </div>
  );
}

// ─── Küçük yardımcı bileşenler ────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-gray-400">{icon}</span>
      <h3 className="text-sm font-semibold text-[#0E0F12]">{title}</h3>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-gray-500 block mb-1 font-medium">{children}</label>;
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-[#F4F5F8] outline-none focus:border-[#0E0F12] text-[#0E0F12] placeholder-gray-400 transition"
    />
  );
}

function TagInput({ value, onChange, onAdd, placeholder }: {
  value: string; onChange: (v: string) => void; onAdd: () => void; placeholder?: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onAdd()}
        placeholder={placeholder}
        className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-[#F4F5F8] outline-none focus:border-[#0E0F12] text-[#0E0F12] placeholder-gray-400 transition"
      />
      <button
        onClick={onAdd}
        className="flex items-center gap-1 text-xs bg-[#0E0F12] text-white rounded-xl px-3 py-2 hover:opacity-80 transition"
      >
        <Plus className="w-3.5 h-3.5" /> Ekle
      </button>
    </div>
  );
}

function TagList({ items, onRemove, color }: {
  items: string[]; onRemove: (i: number) => void;
  color: 'indigo' | 'violet' | 'emerald';
}) {
  const cls = {
    indigo:  'bg-indigo-50 text-indigo-700 border-indigo-100',
    violet:  'bg-violet-50 text-violet-700 border-violet-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  }[color];
  if (!items.length) return <p className="text-xs text-gray-400 italic">Henüz eklenmedi.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium ${cls}`}>
          {item}
          <button onClick={() => onRemove(i)} className="hover:opacity-60 transition ml-0.5">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }: {
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-[#0E0F12]">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors ${checked ? 'bg-[#0E0F12]' : 'bg-gray-200'}`}
      >
        <span
          className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

// ─── Gelişim Haritası ─────────────────────────────────────────────────────────

function GelisimHaritasi() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);

  useEffect(() => {
    try {
      const t = JSON.parse(localStorage.getItem('terapist_todos') || '[]');
      const c = JSON.parse(localStorage.getItem('terapist_checkins') || '[]');
      if (Array.isArray(t)) setTodos(t);
      if (Array.isArray(c)) setCheckins(c);
    } catch { /* ignore */ }
  }, []);

  const done = todos.filter(t => t.tamamlandi && t.deger);

  // Değer sayım
  const valueCount: Record<string, number> = {};
  done.forEach(t => { if (t.deger) valueCount[t.deger] = (valueCount[t.deger] ?? 0) + 1; });
  const sorted = Object.entries(valueCount).sort((a, b) => b[1] - a[1]);
  const maxVal = sorted[0]?.[1] ?? 1;

  // Ortalama burnout (son 4 checkin)
  const recentBurnout = checkins.slice(0, 4).reduce((a, c) => a + c.burnout, 0) / Math.max(checkins.slice(0, 4).length, 1);

  return (
    <div className="card p-5 space-y-4">
      <SectionTitle icon={<span className="text-base">🗺</span>} title="Gelişim Haritası" />

      {sorted.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Terapistin planları tamamlandıkça değer haritası burada görünür.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(([degId, count]) => {
            const deg = ACT_DEGERLER_PROFIL.find(d => d.id === degId);
            const barW = Math.max(Math.round((count / maxVal) * 100), 6);
            return (
              <div key={degId} className="flex items-center gap-3">
                <span className="text-base w-6 flex-shrink-0">{deg?.emoji ?? '🏷'}</span>
                <span className="text-xs text-gray-600 w-32 flex-shrink-0 truncate">{deg?.label ?? degId}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${barW}%` }} />
                </div>
                <span className="text-xs font-semibold text-[#0E0F12] w-4 text-right flex-shrink-0">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {checkins.length > 0 && (
        <div className="mt-2 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className={`text-lg font-semibold ${recentBurnout >= 4 ? 'text-red-500' : recentBurnout >= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
              {recentBurnout.toFixed(1)}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Ort. Burnout</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-[#0E0F12]">{checkins.length}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Check-in</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-[#0E0F12]">{todos.filter(t => t.tamamlandi).length}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Plan Tamamlanan</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Değer Yönlü Eylemler ─────────────────────────────────────────────────────

function DegerYonluEylemler() {
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('terapist_todos') || '[]');
      if (Array.isArray(saved)) setTodos(saved);
    } catch { /* ignore */ }
  }, []);

  const done    = todos.filter(t => t.tamamlandi && t.deger);
  const noDeger = todos.filter(t => t.tamamlandi && !t.deger);

  const grouped: Record<string, TodoItem[]> = {};
  done.forEach(t => { if (!grouped[t.deger!]) grouped[t.deger!] = []; grouped[t.deger!].push(t); });
  const sortedGroups = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  if (todos.filter(t => t.tamamlandi).length === 0) {
    return (
      <div className="card p-6 text-center">
        <Tag className="w-8 h-8 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-medium">Henüz tamamlanmış plan yok.</p>
        <p className="text-xs text-gray-400 mt-1">Ana sayfadaki planlarını tamamladıkça burada değer bazlı görünür.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-[#0E0F12]">{todos.filter(t => t.tamamlandi).length}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Tamamlanan</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-[#0E0F12]">{sortedGroups.length}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Değer Alanı</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-[#0E0F12]">{todos.filter(t => !t.tamamlandi).length}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Bekleyen</p>
        </div>
      </div>

      {sortedGroups.length > 0 && (() => {
        const [topId, topItems] = sortedGroups[0];
        const deg = ACT_DEGERLER_PROFIL.find(d => d.id === topId);
        if (!deg) return null;
        return (
          <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white">
            <p className="text-xs uppercase tracking-widest text-indigo-200 mb-2">En çok yaşanan değer</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{deg.emoji}</span>
              <div>
                <p className="text-lg font-semibold">{deg.label}</p>
                <p className="text-sm text-indigo-200">{topItems.length} eylem bu değerle etiketlendi</p>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="space-y-3">
        {sortedGroups.map(([degId, items]) => {
          const deg = ACT_DEGERLER_PROFIL.find(d => d.id === degId);
          return (
            <div key={degId} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{deg?.emoji ?? '🏷'}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#0E0F12]">{deg?.label ?? degId}</p>
                  <p className="text-xs text-gray-400">{items.length} eylem</p>
                </div>
                <div className="bg-indigo-50 rounded-xl px-3 py-1">
                  <p className="text-sm font-bold text-indigo-700">{items.length}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-500 leading-snug line-through">{item.text}</span>
                    {item.tamamlanmaTarihi && (
                      <span className="ml-auto flex-shrink-0 text-gray-300 whitespace-nowrap">
                        {new Date(item.tamamlanmaTarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {noDeger.length > 0 && (
        <div className="card p-5 opacity-60">
          <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Değer etiketi olmadan tamamlananlar</p>
          <div className="space-y-1.5">
            {noDeger.map(item => (
              <div key={item.id} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 line-through leading-snug">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CV Modal ─────────────────────────────────────────────────────────────────

function CvModal({ profil, onClose, moods, checkins }: {
  profil: ProfilData;
  onClose: () => void;
  moods: MoodLog[];
  checkins: CheckIn[];
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CV – ${profil.adSoyad || 'Terapist'}</title>
        <meta charset="UTF-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: white; }
          .cv-wrap { max-width: 700px; margin: 0 auto; padding: 40px 32px; }
          .cv-header { display: flex; align-items: center; gap: 20px; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 24px; }
          .cv-photo { width: 72px; height: 72px; border-radius: 12px; object-fit: cover; background: #eee; }
          .cv-photo-placeholder { width: 72px; height: 72px; border-radius: 12px; background: #eee; display:flex; align-items:center; justify-content:center; font-size:28px; flex-shrink:0; }
          .cv-name { font-size: 22px; font-weight: 700; }
          .cv-sub  { font-size: 14px; color: #555; margin-top: 4px; }
          .cv-section { margin-bottom: 20px; }
          .cv-section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #555; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 10px; }
          .cv-row { display: flex; gap: 8px; margin-bottom: 6px; }
          .cv-label { font-size: 11px; color: #888; width: 100px; flex-shrink: 0; padding-top: 1px; }
          .cv-value { font-size: 13px; color: #111; }
          .cv-tags { display: flex; flex-wrap: wrap; gap: 6px; }
          .cv-tag { font-size: 11px; border: 1px solid #ddd; border-radius: 6px; padding: 2px 8px; color: #333; }
          .cv-egitim-row { margin-bottom: 8px; }
          .cv-egitim-title { font-size: 13px; font-weight: 600; }
          .cv-egitim-sub { font-size: 12px; color: #666; }
          p { margin-bottom: 6px; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const hasEgitim = (e: { universite: string; bolum: string; yil: string }) =>
    e.universite || e.bolum || e.yil;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#0E0F12]">CV Önizleme</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#0E0F12] text-white text-xs rounded-xl px-4 py-2 hover:opacity-80 transition font-medium"
            >
              <Printer className="w-3.5 h-3.5" /> Yazdır / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#F4F5F8] transition text-gray-500 hover:text-[#0E0F12]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CV İçerik */}
        <div ref={printRef} className="cv-wrap p-8">
          {/* Başlık */}
          <div className="cv-header flex items-center gap-5 pb-6 mb-6 border-b-2 border-[#0E0F12]">
            {profil.foto
              ? <img src={profil.foto} alt="Profil" className="cv-photo w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
              : <div className="cv-photo-placeholder w-20 h-20 rounded-2xl bg-[#F4F5F8] flex items-center justify-center flex-shrink-0">
                  <User className="w-9 h-9 text-gray-300" />
                </div>
            }
            <div>
              <h1 className="cv-name text-2xl font-bold text-[#0E0F12]">{profil.adSoyad || 'Ad Soyad'}</h1>
              {profil.unvan && <p className="cv-sub text-sm text-gray-600 mt-1">{profil.unvan}</p>}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                {profil.sehir      && <span>📍 {profil.sehir}</span>}
                {profil.telefon    && <span>📞 {profil.telefon}</span>}
                {profil.eposta     && <span>✉️ {profil.eposta}</span>}
                {profil.dogumTarihi && <span>🎂 {new Date(profil.dogumTarihi).toLocaleDateString('tr-TR')}</span>}
              </div>
            </div>
          </div>

          {/* Hakkında */}
          {profil.hakkinda && (
            <CvSection title="Hakkımda">
              <p className="text-sm text-gray-700 leading-relaxed">{profil.hakkinda}</p>
            </CvSection>
          )}

          {/* Eğitim */}
          {(hasEgitim(profil.lisans) || hasEgitim(profil.yuksekLisans) || hasEgitim(profil.doktora)) && (
            <CvSection title="Eğitim">
              <div className="space-y-3">
                {([
                  { key: 'lisans' as const,       label: 'Lisans'         },
                  { key: 'yuksekLisans' as const,  label: 'Yüksek Lisans' },
                  { key: 'doktora' as const,       label: 'Doktora'        },
                ]).filter(({ key }) => hasEgitim(profil[key])).map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{label}</p>
                    <p className="text-sm font-semibold text-[#0E0F12]">
                      {profil[key].bolum}{profil[key].bolum && profil[key].universite ? ' — ' : ''}{profil[key].universite}
                    </p>
                    {profil[key].yil && <p className="text-xs text-gray-500">{profil[key].yil}</p>}
                  </div>
                ))}
              </div>
            </CvSection>
          )}

          {/* Uzmanlık */}
          {profil.uzmanlikAlanlari.length > 0 && (
            <CvSection title="Uzmanlık Alanları">
              <div className="flex flex-wrap gap-2">
                {profil.uzmanlikAlanlari.map((u, i) => (
                  <span key={i} className="text-xs border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 font-medium">{u}</span>
                ))}
              </div>
            </CvSection>
          )}

          {/* Dernek */}
          {profil.dernekUyelikleri.length > 0 && (
            <CvSection title="Dernek Üyelikleri">
              <ul className="space-y-1">
                {profil.dernekUyelikleri.map((d, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-gray-300 mt-0.5">•</span>{d}
                  </li>
                ))}
              </ul>
            </CvSection>
          )}

          {/* Sertifikalar */}
          {profil.sertifikalar.length > 0 && (
            <CvSection title="Sertifikalar & Eğitimler">
              <ul className="space-y-1">
                {profil.sertifikalar.map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-gray-300 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </CvSection>
          )}

          {/* Gelişim özeti */}
          {checkins.length > 0 && (
            <CvSection title="Mesleki Süreklilik">
              <p className="text-sm text-gray-600">
                {checkins.length} haftalık öz-değerlendirme kaydı · Ortalama değer uyumu:{' '}
                <span className="font-semibold text-[#0E0F12]">
                  {(checkins.reduce((a, c) => a + c.degerler, 0) / checkins.length).toFixed(1)}/5
                </span>
              </p>
            </CvSection>
          )}

          <p className="text-[10px] text-gray-300 text-right mt-8">
            Bu CV {new Date().toLocaleDateString('tr-TR')} tarihinde sistem tarafından oluşturulmuştur.
          </p>
        </div>
      </div>
    </div>
  );
}

function CvSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cv-section mb-5">
      <p className="cv-section-title text-[10px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100 pb-1 mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}
