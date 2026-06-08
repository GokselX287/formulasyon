'use client';
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Target, Clock, ChevronDown, ChevronUp, BookOpen, Award, RotateCcw } from 'lucide-react';
import './actMotion.css';

// ─── Types ────────────────────────────────────────────────────────────────────
type Urgency = 'ivedi' | 'kisa' | 'orta' | 'uzun';
type AppTab = 'hedefler' | 'pratik';

interface SMARTGoal {
  id: string;
  specific: string;
  measurable: string;
  attainable: string;
  realistic: string;
  timeLimited: string;
  urgency: Urgency;
  value: string;
  done: boolean;
  createdAt: string;
}

const URGENCY_CONFIG: Record<Urgency, { label: string; desc: string; color: string; bg: string; icon: string }> = {
  ivedi: { label: 'İvedi',      desc: '24 saat içinde yapılabilecek küçük, basit eylem', color: '#C0392B', bg: '#FFF0EE', icon: '⚡' },
  kisa:  { label: 'Kısa Vadeli',desc: 'Birkaç gün veya haftada yapılabilecek eylem',     color: '#1A5276', bg: '#EEF5FF', icon: '📅' },
  orta:  { label: 'Orta Vadeli',desc: 'Sonraki birkaç hafta veya ayda yapılabilecek',    color: '#784212', bg: '#FFF8EE', icon: '📆' },
  uzun:  { label: 'Uzun Vadeli',desc: 'Sonraki haftalar veya aylar içinde gerçekleşecek', color: '#1E5631', bg: '#EEFFF5', icon: '🗓' },
};

const SMART_FIELDS: {
  key: keyof Pick<SMARTGoal, 'specific' | 'measurable' | 'attainable' | 'realistic' | 'timeLimited'>;
  letter: string;
  label: string;
  sublabel: string;
  placeholder: string;
  hint: string;
  color: string;
}[] = [
  {
    key: 'specific', letter: 'S', label: 'Specific', sublabel: 'Spesifik',
    placeholder: '"Çocuklarımla daha çok zaman geçirmek" yerine: "Her Salı akşamı çocuklarımla 1 saat masa oyunu oynayacağım."',
    hint: 'Hangi eylem? Kimle? Ne zaman? Nerede? Nasıl?',
    color: '#C0392B',
  },
  {
    key: 'measurable', letter: 'M', label: 'Measurable', sublabel: 'Ölçülebilir',
    placeholder: '"Kardeşimle daha çok vakit geçireceğim" yerine: "Kardeşimle haftada iki kez telefonla görüşeceğim."',
    hint: 'Ne kadar? Kaç kez? Hangi sıklıkla? Ölçüm kriteri nedir?',
    color: '#1A5276',
  },
  {
    key: 'attainable', letter: 'A', label: 'Attainable', sublabel: 'Ulaşılabilir',
    placeholder: 'Küçük adımlar (7 üzeri zorluk olmamalı). Bu hedef danışanın değerleriyle bağlantılı olmalı.',
    hint: 'Ulaşılabilir mi? Değerlerle bağlantılı mı? Danışan başarabilir mi?',
    color: '#1E8449',
  },
  {
    key: 'realistic', letter: 'R', label: 'Realistic', sublabel: 'Gerçekçi',
    placeholder: '"Asla tartışmayacağım" → ölü adam hedefi. Şahit eşliğinde yapılabilecek, gözlemlenebilir bir hedef seç.',
    hint: 'Gözlemlenebilir mi? "Ölü adam hedefi" değil mi? Şahit var mı?',
    color: '#784212',
  },
  {
    key: 'timeLimited', letter: 'T', label: 'Time-Limited', sublabel: 'Zaman Sınırlı',
    placeholder: 'Tarih, gün ve zaman belirt. Örn: "Bu Pazar 15:00\'te park gezisi."',
    hint: 'Tam tarih? Gün? Saat? Başlangıç-bitiş? Ne zaman değerlendirme?',
    color: '#6D3B8A',
  },
];

function newGoal(): SMARTGoal {
  return {
    id: crypto.randomUUID(),
    specific: '', measurable: '', attainable: '', realistic: '', timeLimited: '',
    urgency: 'kisa',
    value: '',
    done: false,
    createdAt: new Date().toLocaleDateString('tr-TR'),
  };
}

// ─── Quiz Data ────────────────────────────────────────────────────────────────
interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Aşağıdaki hedeflerden hangisi SMART kriterlerine en uygun?',
    options: [
      'Daha sağlıklı olmak istiyorum.',
      'Bu Pazartesi öğle yemeğinde fast food yerine salata yiyeceğim.',
      'Kaygımı azaltmak istiyorum.',
      'Spor yapmaya başlayacağım.',
    ],
    correct: 1,
    explanation: 'Belirli eylem (salata), belirli zaman (Bu Pazartesi öğle) ve ölçülebilir sonuç içeriyor — SMART kriterleri karşılanmış.',
  },
  {
    id: 2,
    question: '"Ölü adam hedefi" ne anlama gelir?',
    options: [
      'Geçmişte başarısız olunmuş bir hedef.',
      'Bir ölü adamın da yapabileceği pasif veya kaçınma odaklı hedef.',
      'Zaman sınırı olmayan bir hedef.',
      'Danışanın benimsemediği bir hedef.',
    ],
    correct: 1,
    explanation: '"Asla tartışmayacağım" gibi hedefler — bir ölü adam da tartışmaz. Aktif, gözlemlenebilir davranışları hedefleyin.',
  },
  {
    id: 3,
    question: 'SMART\'ta "M" (Measurable — Ölçülebilir) kriteri için en doğru soru hangisi?',
    options: [
      'Bu hedef ulaşılabilir mi?',
      'Hedef tamamlandığında ne hissedilecek?',
      'Hedefin gerçekleşip gerçekleşmediğini nasıl anlayabiliriz?',
      'Danışan bu hedefi istiyor mu?',
    ],
    correct: 2,
    explanation: 'Ölçülebilirlik: başarıyı somut olarak tanımlayabilmek — kaç kez, ne kadar süre, hangi gözlemlenebilir sonuç.',
  },
  {
    id: 4,
    question: 'Danışan "Artık asla kaygılanmayacağım" diyor. Bu hedefle ilgili doğru değerlendirme hangisi?',
    options: [
      'Spesifik ve iyi tanımlanmış bir hedef.',
      'Ölçülebilir bir hedef.',
      'Gerçekçi ve ACT ile uyumlu bir hedef.',
      'Ölü adam hedefi — ACT değerleriyle çelişiyor.',
    ],
    correct: 3,
    explanation: 'ACT kaygıyı yok etmeyi değil, kaygıyla birlikte değer yönünde hareket etmeyi hedefler.',
  },
  {
    id: 5,
    question: 'SMART hedefte "A" (Attainable — Ulaşılabilir) değerlendirmek için en uygun yaklaşım?',
    options: [
      'Hedefi olabildiğince büyük ve meydan okuyucu tut.',
      'Zorluk düzeyini 1-10 skalasında değerlendir; 7\'yi aşmaması önerilir.',
      'Sadece terapistin yapabileceği şeyleri hedefle.',
      'Hedefi en az aylık bir süreye yay.',
    ],
    correct: 1,
    explanation: 'Zorluk 7\'yi aşan hedefler başarısızlık riskini artırır ve danışanı cesaretsizleştirebilir.',
  },
  {
    id: 6,
    question: 'SMART hedefi bir değerle ilişkilendirmek neden önemlidir?',
    options: [
      'Protokol zorunluluğu olduğu için.',
      'Seans süresini doldurmak için.',
      'Değerlerle bağlantılı davranış değişikliği daha kalıcı ve motive edici olur.',
      'Yalnızca uzun vadeli hedefler için gereklidir.',
    ],
    correct: 2,
    explanation: 'ACT\'te tüm davranış hedefleri danışanın değerleriyle bağlantılı olduğunda içsel motivasyon güçlenir.',
  },
  {
    id: 7,
    question: 'Aşağıdakilerden hangisi en iyi SMART hedef örneğidir?',
    options: [
      'Daha iyi bir ebeveyn olmak istiyorum.',
      'Her Çarşamba akşamı 19:00-20:00 arası çocuğumla telefonsuz masa oyunu oynayacağım.',
      'Haftada birkaç kez egzersiz yapmak.',
      'Ailemle daha fazla zaman geçireceğim.',
    ],
    correct: 1,
    explanation: 'Belirli gün, saat aralığı, aktivite ve kural (telefonsuz) içeriyor — tüm SMART kriterleri karşılanmış.',
  },
  {
    id: 8,
    question: 'Danışan "Telefona daha az bakacağım" diyor. Bu hedefi SMART yapmak için ne önerirsiniz?',
    options: [
      'Hedefi olduğu gibi bırakın, yeterince somut.',
      '"Sabah 8-9 arası telefonumu çekmecede tutacağım" gibi spesifik bir eylem belirleyin.',
      'Daha uzun vadeli bir hedef koyun.',
      'Danışana hedefi kendisi yeniden yazmasını söyleyin.',
    ],
    correct: 1,
    explanation: 'Zaman, yer ve davranış belirtilerek pasif niyetten aktif, gözlemlenebilir bir taahhüde dönüştürüldü.',
  },
];

const STORAGE_KEY = 'smart-hedef-pratik-v1';

interface PratikProgress {
  correctIds: number[];     // which question ids were answered correctly
  timeSpentSec: number;     // total seconds on the pratik tab
}

function loadProgress(): PratikProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PratikProgress;
  } catch { /* ignore */ }
  return { correctIds: [], timeSpentSec: 0 };
}

function saveProgress(p: PratikProgress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function calcPercent(p: PratikProgress): number {
  const quizPct  = Math.round((p.correctIds.length / QUIZ_QUESTIONS.length) * 75);
  const timePct  = Math.min(25, Math.round(p.timeSpentSec / 72)); // 72sec per 1%, cap at 25% (30min)
  return Math.min(100, quizPct + timePct);
}

// ─── GoalCard ─────────────────────────────────────────────────────────────────
function GoalCard({
  goal,
  onChange,
  onDelete,
}: {
  goal: SMARTGoal;
  onChange: (patch: Partial<SMARTGoal>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const urg = URGENCY_CONFIG[goal.urgency];
  const filled = SMART_FIELDS.filter(f => goal[f.key].trim().length > 0).length;
  const pct = Math.round((filled / 5) * 100);

  return (
    <div className={`rounded-2xl border-2 transition-all ${goal.done ? 'opacity-60 border-gray-200' : 'border-gray-200 hover:border-gray-300'} bg-white shadow-sm`}>
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <button onClick={e => { e.stopPropagation(); onChange({ done: !goal.done }); }} className="flex-shrink-0">
          {goal.done
            ? <CheckCircle2 size={22} className="text-green-500" />
            : <Circle size={22} className="text-gray-300 hover:text-gray-400" />
          }
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: urg.bg, color: urg.color }}>
              {urg.icon} {urg.label}
            </span>
            {goal.value && (
              <span className="text-xs text-gray-400 italic">"{goal.value.slice(0, 30)}{goal.value.length > 30 ? '…' : ''}"</span>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-600 truncate">
            {goal.specific || <span className="text-gray-300 italic">Hedef tanımlanmamış…</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-xs text-gray-400 font-mono">{pct}%</div>
          <div className="w-16 h-1.5 bg-gray-100 rounded-full">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#1E8449' : '#C0392B' }} />
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Zaman Dilimi</label>
              <div className="flex gap-1 flex-wrap">
                {(Object.keys(URGENCY_CONFIG) as Urgency[]).map(u => {
                  const uc = URGENCY_CONFIG[u];
                  return (
                    <button key={u} onClick={() => onChange({ urgency: u })}
                      className="text-xs px-2 py-1 rounded-lg font-medium transition-all"
                      style={goal.urgency === u ? { backgroundColor: uc.color, color: 'white' } : { backgroundColor: uc.bg, color: uc.color }}>
                      {uc.icon} {uc.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-1">{urg.desc}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Bağlı Değer</label>
              <input type="text" value={goal.value} onChange={e => onChange({ value: e.target.value })}
                placeholder="Aile, özgürlük, bağlantı…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#D7AD9C] transition-colors" />
              <p className="text-xs text-gray-400 mt-1">Tüm hedef ve davranışlar danışanın değerleriyle bağlantılı olmalı.</p>
            </div>
          </div>

          {SMART_FIELDS.map(field => {
            const val = goal[field.key];
            const isFilled = val.trim().length > 0;
            return (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: field.color }}>
                    {field.letter}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800">{field.label}</span>
                    <span className="text-xs text-gray-400 ml-2">({field.sublabel})</span>
                  </div>
                  {isFilled && <CheckCircle2 size={14} className="text-green-400 ml-auto" />}
                </div>
                <div className="ml-8">
                  <p className="text-xs text-gray-400 mb-1">{field.hint}</p>
                  <textarea value={val} onChange={e => onChange({ [field.key]: e.target.value })}
                    placeholder={field.placeholder} rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-gray-400 transition-colors placeholder:text-xs placeholder:text-gray-300" />
                </div>
              </div>
            );
          })}

          <div className="ml-0 mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs text-amber-700 italic">
              *** Adanmış Davranışın; basitçe sadece hedeflere ulaşmak demek olmadığı, hayatı yaşamaya değecek şekilde yaşama süreci olduğunu hatırlatmak isterim.
            </p>
          </div>

          <div className="flex justify-end">
            <button onClick={onDelete} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={12} /> Hedefi Sil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PratikTab ────────────────────────────────────────────────────────────────
function PratikTab() {
  const [progress, setProgress] = useState<PratikProgress>(() => loadProgress());
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer: accumulate time spent on this tab
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const next = { ...prev, timeSpentSec: prev.timeSpentSec + 5 };
        saveProgress(next);
        return next;
      });
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const percent = calcPercent(progress);
  const q = QUIZ_QUESTIONS[currentQ];
  const alreadyCorrect = progress.correctIds.includes(q.id);
  const answered = selected !== null || alreadyCorrect;

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setShowExplanation(true);
    if (idx === q.correct && !alreadyCorrect) {
      setProgress(prev => {
        const next = { ...prev, correctIds: [...prev.correctIds, q.id] };
        saveProgress(next);
        return next;
      });
    }
  };

  const handleNext = () => {
    setSelected(null);
    setShowExplanation(false);
    setCurrentQ(i => (i + 1) % QUIZ_QUESTIONS.length);
  };

  const handleReset = () => {
    const fresh: PratikProgress = { correctIds: [], timeSpentSec: 0 };
    saveProgress(fresh);
    setProgress(fresh);
    setCurrentQ(0);
    setSelected(null);
    setShowExplanation(false);
  };

  const correctCount = progress.correctIds.length;
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="space-y-8">
      {/* ── Progress ring card ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-6">
          {/* Ring */}
          <div className="flex-shrink-0 relative">
            <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden>
              <circle cx="64" cy="64" r="52" fill="none" stroke="#F3F4F6" strokeWidth="10" />
              <circle
                cx="64" cy="64" r="52"
                fill="none"
                stroke={percent >= 100 ? '#1E8449' : percent >= 60 ? '#1A5276' : '#C0392B'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (percent / 100) * circumference}
                transform="rotate(-90 64 64)"
                style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-gray-900 leading-none">{percent}</span>
              <span className="text-xs text-gray-400 font-mono mt-0.5">%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">SMART Hedef Uzmanlığı</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {percent < 30 && 'Henüz başlıyorsunuz — soruları yanıtladıkça ilerleme kaydedeceksiniz.'}
                {percent >= 30 && percent < 60 && 'İyi ilerliyorsunuz. Devam edin!'}
                {percent >= 60 && percent < 85 && 'Harika gidiyor — SMART becerisi gelişiyor.'}
                {percent >= 85 && percent < 100 && 'Neredeyse uzman seviyesindesiniz.'}
                {percent >= 100 && 'Tebrikler! SMART hedef belirleme becerisini tamamladınız.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <div className="text-xs text-gray-400 font-mono uppercase tracking-wide">Doğru Cevap</div>
                <div className="text-xl font-bold text-gray-800 mt-0.5">{correctCount} <span className="text-sm font-normal text-gray-400">/ {QUIZ_QUESTIONS.length}</span></div>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <div className="text-xs text-gray-400 font-mono uppercase tracking-wide">Geçirilen Süre</div>
                <div className="text-xl font-bold text-gray-800 mt-0.5">
                  {progress.timeSpentSec < 60
                    ? `${progress.timeSpentSec}s`
                    : `${Math.floor(progress.timeSpentSec / 60)}d ${progress.timeSpentSec % 60}s`}
                </div>
              </div>
            </div>
            <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
              <RotateCcw size={11} /> İlerlemeyi sıfırla
            </button>
          </div>
        </div>

        {/* Progress bar milestones */}
        <div className="mt-5 relative">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${percent}%`,
                background: percent >= 100
                  ? 'linear-gradient(90deg, #1E8449, #27AE60)'
                  : 'linear-gradient(90deg, #C0392B, #1A5276)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {[0, 25, 50, 75, 100].map(m => (
              <span key={m} className={`text-xs font-mono ${percent >= m ? 'text-gray-600' : 'text-gray-300'}`}>{m}%</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Question card ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Soru {currentQ + 1} / {QUIZ_QUESTIONS.length}</span>
            {alreadyCorrect && (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} /> daha önce doğru
              </span>
            )}
          </div>
          <p className="text-base font-semibold text-gray-900 leading-snug">{q.question}</p>
        </div>

        {/* Options */}
        <div className="px-6 py-4 space-y-2.5">
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.correct;
            const isSelected = selected === idx;
            let style = 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50';
            if (answered) {
              if (isCorrect) style = 'border-green-400 bg-green-50 text-green-800';
              else if (isSelected && !isCorrect) style = 'border-red-300 bg-red-50 text-red-700';
              else style = 'border-gray-100 bg-gray-50 text-gray-400';
            }
            return (
              <button
                key={idx}
                type="button"
                disabled={answered}
                onClick={() => handleAnswer(idx)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${style} ${answered ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="font-mono text-xs mr-2 opacity-50">{String.fromCharCode(65 + idx)})</span>
                {opt}
                {answered && isCorrect && <span className="ml-2 text-green-600">✓</span>}
                {answered && isSelected && !isCorrect && <span className="ml-2 text-red-500">✗</span>}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className={`mx-6 mb-4 p-4 rounded-xl text-sm ${selected === q.correct ? 'bg-green-50 border border-green-100 text-green-800' : 'bg-amber-50 border border-amber-100 text-amber-800'}`}>
            <strong>{selected === q.correct ? 'Doğru!' : 'Yanlış.'}</strong> {q.explanation}
          </div>
        )}

        {/* Next button */}
        <div className="px-6 pb-5">
          {(answered || alreadyCorrect) ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
            >
              {currentQ < QUIZ_QUESTIONS.length - 1 ? 'Sonraki Soru →' : 'Başa Dön →'}
            </button>
          ) : (
            <div className="h-11 flex items-center justify-center">
              <span className="text-xs text-gray-400 font-mono">Bir seçenek işaretleyin</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Progress legend ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Award size={14} className="text-[#B5654A]" />
          İlerleme nasıl hesaplanıyor?
        </h3>
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-start gap-2">
            <span className="font-mono text-[#B5654A] mt-0.5">%75</span>
            <span>Quiz sorularından: her doğru cevap ~%9,4 katkı sağlar ({QUIZ_QUESTIONS.length} soru × %75).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono text-blue-500 mt-0.5">%25</span>
            <span>Geçirilen süreden: bu bölümde yeterince zaman harcadıkça (maks. 30 dakika) dolar.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function SMARTHedef() {
  const [goals, setGoals] = useState<SMARTGoal[]>([newGoal()]);
  const [clientName, setClientName] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<Urgency | 'all'>('all');
  const [activeTab, setActiveTab] = useState<AppTab>('hedefler');

  const addGoal = () => setGoals(g => [...g, newGoal()]);
  const updateGoal = (id: string, patch: Partial<SMARTGoal>) =>
    setGoals(g => g.map(x => x.id === id ? { ...x, ...patch } : x));
  const deleteGoal = (id: string) =>
    setGoals(g => g.filter(x => x.id !== id));

  const filtered = filterUrgency === 'all' ? goals : goals.filter(g => g.urgency === filterUrgency);
  const done = goals.filter(g => g.done).length;

  const savedProgress = loadProgress();
  const overallPct = calcPercent(savedProgress);

  return (
    <div className="act-fade-in min-h-screen bg-gradient-to-br from-[#F2EFEA] via-[#EFEDE9] to-[#E7E4DE] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Target size={22} className="text-[#B5654A]" />
            <h1 className="text-2xl font-bold text-gray-900">SMART Hedef</h1>
          </div>
          <p className="text-sm text-gray-500">ACT değer odaklı, adanmış eylem planlaması</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('hedefler')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'hedefler'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Target size={14} />
            Hedefler
            {done > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'hedefler' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                {done}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pratik')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'pratik'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <BookOpen size={14} />
            Pratik & Öğrenme
            {overallPct > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${activeTab === 'pratik' ? 'bg-white/20 text-white' : 'bg-[#EFE4DD] text-[#8F4F39]'}`}>
                {overallPct}%
              </span>
            )}
          </button>
        </div>

        {/* ── Hedefler tab ── */}
        {activeTab === 'hedefler' && (
          <>
            {/* Danışan + filter row */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Danışan adı (isteğe bağlı)"
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#D7AD9C] w-52"
              />
              {clientName && <span className="text-sm text-gray-600"><strong>{clientName}</strong> için hedefler</span>}
            </div>

            {/* SMART quick reference */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {SMART_FIELDS.map(f => (
                <div key={f.key} className="rounded-xl p-2 text-center" style={{ backgroundColor: f.color + '15' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-1" style={{ backgroundColor: f.color }}>
                    {f.letter}
                  </div>
                  <div className="text-xs font-semibold text-gray-700">{f.sublabel}</div>
                </div>
              ))}
            </div>

            {/* Urgency filter + stats */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setFilterUrgency('all')}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filterUrgency === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  Tümü ({goals.length})
                </button>
                {(Object.keys(URGENCY_CONFIG) as Urgency[]).map(u => {
                  const uc = URGENCY_CONFIG[u];
                  const count = goals.filter(g => g.urgency === u).length;
                  return (
                    <button key={u} onClick={() => setFilterUrgency(u)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                      style={filterUrgency === u ? { backgroundColor: uc.color, color: 'white' } : { backgroundColor: uc.bg, color: uc.color }}>
                      {uc.icon} {uc.label} ({count})
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-gray-400">{done}/{goals.length} tamamlandı</div>
            </div>

            {/* Goal cards */}
            <div className="space-y-4">
              {filtered.map(goal => (
                <GoalCard key={goal.id} goal={goal} onChange={patch => updateGoal(goal.id, patch)} onDelete={() => deleteGoal(goal.id)} />
              ))}
            </div>

            {/* Add button */}
            <button onClick={addGoal}
              className="mt-5 w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-[#C68A74] rounded-2xl py-4 text-sm text-gray-400 hover:text-[#B5654A] transition-all">
              <Plus size={16} /> Yeni SMART Hedef Ekle
            </button>

            {/* ACT reminder footer */}
            <div className="mt-8 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock size={14} className="text-[#B5654A]" />
                Zaman Dilimi Rehberi
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(URGENCY_CONFIG) as Urgency[]).map(u => {
                  const uc = URGENCY_CONFIG[u];
                  return (
                    <div key={u} className="flex gap-2 items-start">
                      <span className="text-lg">{uc.icon}</span>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: uc.color }}>{uc.label}</div>
                        <div className="text-xs text-gray-400">{uc.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-[#F6EFEA] rounded-xl border border-[#EFE4DD] text-xs text-[#8F4F39] space-y-1">
                <p><strong>Ölü Adam Hedefi:</strong> "Asla tartışmayacağım" gibi bir hedef — bir ölü adam da yapabilir. Gözlemlenebilir, aktif davranış hedefle.</p>
                <p><strong>Değer Bağlantısı:</strong> Tüm hedefler danışanın değerlerine bağlantılı ve onlarla tutarlı olmalıdır.</p>
              </div>
            </div>
          </>
        )}

        {/* ── Pratik & Öğrenme tab ── */}
        {activeTab === 'pratik' && <PratikTab />}
      </div>
    </div>
  );
}
