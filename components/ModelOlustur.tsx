'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Check, Info, ArrowRight, FileText, Printer } from 'lucide-react';
import FormulasyonOzetiModal from './FormulasyonOzetiModal';

// ─── Types ────────────────────────────────────────────────────────────────────

// Minimal patient/formulation shapes — compatible with page.tsx types
type PatientSummary = {
  adSoyad: string;
  yas?: string;
  cinsiyet?: string;
  telefon?: string;
  email?: string;
  basvuruTarihi?: string;
  sunumSorunu?: string;
};

type FormulationSummary = {
  anaSikayetler?: string;
  yonlendirmeNedeni?: string;
  predispozan?: string;
  presipitan?: string;
  perpetuan?: string;
  protektif?: string;
  temelInanclar?: string;
  araInanclar?: string;
  basaCikma?: string;
  otomatikDusunceler?: string;
  duyguBedensel?: string;
  davranislar?: string;
  smartSpesifik?: string;
  smartOlculebilir?: string;
  smartZaman?: string;
};

export type SavedModel = {
  templateId: string;
  baslik: string;
  fields: Record<string, string>;
  savedAt: string;
};

type FieldDef = {
  key: string;
  label: string;
  subtitle?: string;
  placeholder: string;
  guideTitle: string;
  guidance: string;
};

export type TemplateDef = {
  id: string;
  baslik: string;
  renk: string;               // tailwind colour token
  aciklama: string;
  kaynak: string;
  fields: FieldDef[];
};

// ─── Field definitions ────────────────────────────────────────────────────────

const SOSYAL_KAYGI_FIELDS: FieldDef[] = [
  {
    key: 'sa_situation',
    label: 'Sosyal Durum',
    placeholder: 'Toplantıda konuşmak, yeni biriyle tanışmak, değerlendirilme ortamı…',
    guideTitle: 'Tetikleyici Durum Neden Önemli?',
    guidance:
      'BDT\'de tetikleyici, döngünün başladığı noktadır. Sosyal kaygıda bu genellikle bir performans ya da değerlendirilme durumudur. Danışanın en çok zorlandığı durumları spesifik ve gözlemlenebilir biçimde tanımlayın: "toplantıda konuşmak", "yeni biriyle tanışmak", "otorite figürüyle etkileşim". Spesifik tetikleyiciler hem değerlendirmeyi hem de ileriki maruz bırakma planını kolaylaştırır.',
  },
  {
    key: 'sa_assumptions',
    label: 'Varsayımların Aktivasyonu',
    placeholder: '"Mükemmel görünmem gerekir, yoksa reddedilirim."',
    guideTitle: 'Koşullu İnançlar ve Varsayımlar',
    guidance:
      'Varsayımlar, erken yaşam deneyimlerinden şekillenen koşullu inançlardır ve sosyal bir duruma girildiğinde otomatik olarak devreye girer. Genellikle "Eğer … olursa … olur" biçimindedir: "Eğer hata yaparsam aptal görünürüm." Bu inançlar temel inançları hayata taşıyan köprülerdir. Danışanı en çok yönlendiren varsayımı keşfetmek müdahalenin odağını netleştirir.',
  },
  {
    key: 'sa_threat',
    label: 'Sosyal Tehdit Algısı',
    subtitle: 'Olumsuz Otomatik Düşünceler',
    placeholder: '"Yüzüm kızardı, herkes gördü." / "Saçmaladım."',
    guideTitle: 'Otomatik Düşünceler ve Tehdit İşleme',
    guidance:
      'Clark & Wells modeline göre aktive olan varsayımlar, durumu gerçek bir sosyal tehdit olarak işlemeye neden olur. Bu aşamada olumsuz otomatik düşünceler (NAT) belirir. NAT\'lar anlık, istemsiz ve inandırıcıdır. "Herkes benim kaygılı olduğumu fark etti" gibi. Bu düşünceler düşünce kaydına alınabilecek ham materyal niteliğindedir ve bilişsel yeniden yapılandırmanın giriş noktasıdır.',
  },
  {
    key: 'sa_processing',
    label: 'Kendini Sosyal Nesne Olarak İşlemleme',
    placeholder: 'Titreyen ellerimi izliyorum, sesimin değiştiğini hissediyorum…',
    guideTitle: 'Modelin Kalbi: İçeriden İzleme',
    guidance:
      'Clark & Wells (1995) modelinin en özgün katkısıdır. Tehdit algısı oluştuktan sonra kişi kendini, dışarıdan bir nesne gibi izlemeye başlar: ellerin titrediğini, yüzün kızardığını, sesin değiştiğini gözlemler. Bu "içeriden izleme" (self-focused attention) hem gerçek sosyal performansı bozar hem de kaygıyı körükler. Maruz bırakma egzersizlerinde dikkati dışarıya yönlendirmek (externally focused attention) tam bu yüzden kritiktir.',
  },
  {
    key: 'sa_safety',
    label: 'Güvenlik Arama Davranışları',
    placeholder: 'Az konuşmak, gözden kaçmak, hazırlıklı olmak, alkol kullanmak…',
    guideTitle: 'Güvenlik Davranışlarının Paradoksu',
    guidance:
      'Güvenlik davranışları kaygıyı kısa vadede azaltır; ancak uzun vadede döngüyü besler. Kişi "az konuştuğu için" utanmadığını düşünür — korkulan felaket "davranış sayesinde" önlenmiş gibi algılanır ve bu inanç pekişir. Salkovskis\'in (1991) modeli, güvenlik davranışları kaldırılmadan yapılan maruz bırakmanın neden yetersiz kaldığını açıklar. Tedavide bu davranışları kademeli olarak azaltmak gereklidir.',
  },
  {
    key: 'sa_symptoms',
    label: 'Somatik & Bilişsel Semptomlar',
    placeholder: 'Yüz kızarması, titreme, boş zihin, ses titremesi, mide bulantısı…',
    guideTitle: 'Semptomlar Döngüyü Nasıl Besler?',
    guidance:
      'Bedensel ve bilişsel belirtiler, tehdit algısına geri beslenerek döngüyü devam ettirir. "Kalbim çarpıyor, bu belli oluyor, herkes görüyor" şeklinde tehdit algısını güçlendirir. Clark & Wells modelinde belirtiler hem içeriden izlemenin ürünüdür hem de onu besleyen bir girdi haline gelir. En rahatsız edici belirtileri not edin — maruz bırakma hiyerarşisi ve interoceptive egzersizler planlanırken bu bilgi kullanılacaktır.',
  },
];

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'sosyal-kaygi',
    baslik: 'Sosyal Kaygı Bozukluğu',
    renk: 'blue',
    aciklama: 'Clark & Wells (1995) modeli. Sosyal performans durumlarında kaygı, güvenlik davranışları ve içeriden izleme döngüsü.',
    kaynak: 'Clark & Wells, 1995',
    fields: SOSYAL_KAYGI_FIELDS,
  },
  {
    id: 'panik',
    baslik: 'Panik Bozukluğu',
    renk: 'red',
    aciklama: 'Clark (1986) bilişsel modeli. Bedensel duyumların felaket yorumu ve kaçınma döngüsü.',
    kaynak: 'Clark, 1986',
    fields: [
      {
        key: 'panic_trigger', label: 'Tetikleyici', placeholder: 'Egzersiz, kafein, stres, hastalık…',
        guideTitle: 'Panik Tetikleyicileri',
        guidance: 'Panik bozukluğunda tetikleyici genellikle fizyolojik bir uyarılmadır. Bu uyarılma dışsal (kafein, egzersiz) ya da içsel (stres, yorgunluk) olabilir. İlk panik atağının nerede ve nasıl yaşandığını anlamak, sonraki ataklardaki şartlanmayı çözümlemek için kritiktir.',
      },
      {
        key: 'panic_thought', label: 'Otomatik Düşünce', placeholder: '"Kalbim çarpıyor, öleceğim."',
        guideTitle: 'Felaketleştirme Sürecinin Başlangıcı',
        guidance: 'Clark modeline göre panik, bedensel duyumların tehlikeli biçimde yorumlanmasıyla başlar. "Kalp çarpıntısı = kalp krizi", "baş dönmesi = bayılma" gibi. Bu yorumlar otomatiktir ve danışan tarafından gerçek sanılır. Sokratik sorgulama ile bu inançların kanıtlarını incelemek müdahalenin temelidir.',
      },
      {
        key: 'panic_emotion', label: 'Duygu & Uyarılma', placeholder: 'Yoğun korku, çaresizlik, kontrol kaybı korkusu…',
        guideTitle: 'Uyarılma ve Döngünün Hızlanması',
        guidance: 'Felaket yorumu yoğun kaygı ve korku yaratır. Bu duygu ANS\'yi aktive eder ve adrenalin salınımı bedensel belirtileri artırır — bu da "tehlike" yorumunu güçlendirir. Psikoeğitimde kaygının biyolojik işlevi ve zararsızlığı anlatılmalıdır.',
      },
      {
        key: 'panic_body', label: 'Bedensel Duyumlar', placeholder: 'Çarpıntı, nefes darlığı, uyuşma, terleme…',
        guideTitle: 'Bedensel Belirtiler ve Hiper-Vigilans',
        guidance: 'Kişi tehlikeli olduğunu düşündüğü bedensel belirtileri sürekli izlemeye başlar (body scanning). Bu izleme doğal fizyolojik dalgalanmaları "tehdit sinyali" olarak algılamaya yol açar. Interoceptive maruz bırakma (nefes tutma, dönerek ayağa kalkma) bu döngüyü kırar.',
      },
      {
        key: 'panic_catastrophe', label: 'Felaketleştirme', placeholder: '"Ölüyorum / deliriyorum / kontrolümü kaybediyorum."',
        guideTitle: 'Felaket Yorumunun Klinik Önemi',
        guidance: 'Felaketleştirme, Clark modelinin merkezidir. Üç klasik tema: ölüm korkusu, delilik korkusu, kontrol kaybı korkusu. Bu üç temadan hangisinin baskın olduğu tedavi planını şekillendirir. Bilişsel yeniden yapılandırmada gerçekçi alternatif yorumlar üretilir ve kanıt incelemesi yapılır.',
      },
    ],
  },
  {
    id: 'depresyon',
    baslik: 'Major Depresif Bozukluk',
    renk: 'indigo',
    aciklama: 'Beck (1979) bilişsel üçlü modeli. Olumsuz benlik, dünya ve gelecek yorumları ile davranışsal inaktivasyon.',
    kaynak: 'Beck vd., 1979',
    fields: [
      {
        key: 'dep_early', label: 'Erken Yaşantılar', placeholder: 'Erken kayıp, eleştirel ebeveyn, ihmal…',
        guideTitle: 'Temel İnançların Kökeni',
        guidance: 'Depresyonda temel inançlar (örn. "değersizim") genellikle erken yaşam deneyimlerinde şekillenir. Eleştirel ebeveynlik, erken kayıplar, istismar veya ihmal bu inançların zeminini hazırlar. Gelişimsel formülasyon, "neden şimdi?" sorusunu yanıtlamak yerine "neden bu kişi?" sorusunu yanıtlamaya odaklanır.',
      },
      {
        key: 'dep_beliefs', label: 'İşlevsel Olmayan İnançlar', placeholder: '"Değersizim." / "Sevilmeye layık değilim."',
        guideTitle: 'Bilişsel Üçlü: Benlik, Dünya, Gelecek',
        guidance: 'Beck\'in bilişsel üçlüsü depresyonun bilişsel özüdür. Benlik hakkında ("yetersizim"), dünya hakkında ("kimse umursamıyor") ve gelecek hakkında ("hiçbir şey değişmeyecek") olumsuz inançlar. Bu üç alan sorgulanmadan formülasyon tamamlanmaz.',
      },
      {
        key: 'dep_trigger', label: 'Kritik Olaylar', placeholder: 'Ayrılık, işten çıkarılma, yas, başarısızlık…',
        guideTitle: 'Presipitan: Neden Şimdi?',
        guidance: 'Kritik olaylar, var olan işlevsel olmayan inançları tetikleyen ve semptomları başlatan deneyimlerdir. Genellikle erken dönem şemayla anlam olarak örtüşür: "değersizim" inancına sahip biri için işten çıkarılmak bu inancı doğrular niteliktedir. Tetikleyici olay ile temel inanç arasındaki bağı keşfetmek psikoeğitim için değerli bir araçtır.',
      },
      {
        key: 'dep_thoughts', label: 'Olumsuz Otomatik Düşünceler', placeholder: '"Hiçbir şey yapmaya değmez." / "Kimse umursamıyor."',
        guideTitle: 'NAT\'lar ve Düşünce Kaydı',
        guidance: 'Olumsuz otomatik düşünceler, işlevsel olmayan inançların günlük yaşamdaki yansımasıdır. Beck\'in "Depresyon Envanteri" bu düşünceleri kategorize eder. Düşünce kaydı formu ile NAT → duygu → sonuç zinciri haritalanır. Hangi bilişsel çarpıtmaların (genelleme, felaketleştirme, kişiselleştirme) baskın olduğunu not edin.',
      },
      {
        key: 'dep_behavior', label: 'Davranışsal İnaktivasyon', placeholder: 'Hobilerden çekilme, izolasyon, yatakta kalma…',
        guideTitle: 'Davranışsal Aktivasyon Neden Önce Gelir?',
        guidance: 'Martell\'in davranışsal aktivasyon modeli, inaktivasyon döngüsünü kırmayı hedefler. Depresyonda aktivite azaldıkça keyif ve ustalık deneyimi de azalır — bu duygu durumunu daha da kötüleştirir. BA\'da danışan önce aktivite izleme, ardından keyif/ustalık aktivitelerini planlama ve kademeli artırma sürecine girer.',
      },
      {
        key: 'dep_symptoms', label: 'Belirtiler', placeholder: 'Yorgunluk, uyku bozukluğu, konsantrasyon güçlüğü…',
        guideTitle: 'Belirtiler Formülasyonu Nasıl Şekillendirir?',
        guidance: 'Belirtilerin şiddeti ve örüntüsü tedavi planını etkiler. Ağır vejetatif belirtiler (ciddi uyku-iştah bozukluğu, psikomotor yavaşlama) önce davranışsal müdahale gerektirirken, belirtiler hafifledikçe bilişsel yeniden yapılandırmaya geçilebilir. Belirtilerin biyolojik (yeterli uyku, beslenme) ve psikolojik bileşenlerini ayırt edin.',
      },
    ],
  },
];

// ─── Renk eşleme ─────────────────────────────────────────────────────────────

export const BADGE: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-700 border-blue-200',
  red:    'bg-red-100 text-red-700 border-red-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};
const GUIDE_BG: Record<string, string> = {
  blue:   'bg-blue-50 border-blue-200',
  red:    'bg-red-50 border-red-200',
  indigo: 'bg-indigo-50 border-indigo-200',
};
const GUIDE_TEXT: Record<string, string> = {
  blue:   'text-blue-900',
  red:    'text-red-900',
  indigo: 'text-indigo-900',
};
const ACTIVE_RING: Record<string, string> = {
  blue:   '#3b82f6',
  red:    '#ef4444',
  indigo: '#6366f1',
};

// ─── Sosyal Kaygı Display SVG ─────────────────────────────────────────────────

export function SosyalKaygiSVG({ fields, activeKey }: { fields: Record<string, string>; activeKey: string | null }) {
  const W = 720, H = 760;
  const A = { x: 228, y: 22,  w: 264, h: 74  };
  const B = { x: 210, y: 144, w: 300, h: 72  };
  const C = { x: 195, y: 264, w: 330, h: 82  };
  const D = { x: 186, y: 406, w: 348, h: 88  };
  const E = { x: 28,  y: 572, w: 236, h: 80  };
  const F = { x: 456, y: 572, w: 236, h: 80  };

  const boxKey: Record<string, typeof A> = {
    sa_situation: A, sa_assumptions: B, sa_threat: C,
    sa_processing: D, sa_safety: E, sa_symptoms: F,
  };

  const bCx = (b: typeof A) => b.x + b.w / 2;
  const bCy = (b: typeof A) => b.y + b.h / 2;

  const nodeLabel = (b: typeof A, key: string, main: string, sub?: string, color = '#374151', bgFill = 'white', stroke = '#9ca3af', rx = 8) => {
    const isActive = activeKey === key;
    const val = fields[key] || '';
    const done = val.trim().length > 0;
    return (
      <g key={key}>
        {isActive && (
          <rect x={b.x - 4} y={b.y - 4} width={b.w + 8} height={b.h + 8} rx={rx + 4}
            fill="none" stroke={ACTIVE_RING['blue'] || '#3b82f6'} strokeWidth="2.5" opacity="0.6" strokeDasharray="5,3" />
        )}
        <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={rx}
          fill={isActive ? (bgFill === 'white' ? '#eff6ff' : bgFill) : bgFill}
          stroke={isActive ? (ACTIVE_RING['blue'] || stroke) : stroke}
          strokeWidth={isActive ? 2 : 1.5} />
        {/* Done indicator */}
        {done && !isActive && (
          <circle cx={b.x + b.w - 10} cy={b.y + 10} r="6" fill="#22c55e" />
        )}
        {/* Labels */}
        <foreignObject x={b.x + 8} y={b.y + 4} width={b.w - 16} height={b.h - 8}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', overflow:'hidden' }}>
            <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color, marginBottom: 1, textAlign: 'center', lineHeight: 1.2 }}>{main}</div>
            {sub && <div style={{ fontSize: 7.5, color: '#6b7280', marginBottom: 2, textAlign: 'center' }}>{sub}</div>}
            {val ? (
              <div style={{ fontSize: 8.5, color: isActive ? '#1d4ed8' : '#374151', textAlign: 'center', lineHeight: 1.3, maxHeight: 36, overflow: 'hidden' }}>
                {val.length > 55 ? val.slice(0, 55) + '…' : val}
              </div>
            ) : (
              <div style={{ fontSize: 8, color: '#d1d5db', textAlign: 'center', fontStyle: 'italic' }}>Boş</div>
            )}
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <marker id="mo-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
        </marker>
        <marker id="mo-ad" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
        </marker>
      </defs>

      {/* Arrows */}
      <line x1={bCx(A)} y1={A.y+A.h} x2={bCx(B)} y2={B.y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#mo-a)" />
      <line x1={bCx(B)} y1={B.y+B.h} x2={bCx(C)} y2={C.y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#mo-a)" />
      <line x1={bCx(C)-18} y1={C.y+C.h} x2={bCx(D)-18} y2={D.y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#mo-a)" />
      <line x1={bCx(D)+18} y1={D.y} x2={bCx(C)+18} y2={C.y+C.h} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#mo-a)" />
      <line x1={D.x+80} y1={D.y+D.h} x2={bCx(E)} y2={E.y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#mo-a)" />
      <line x1={D.x+D.w-80} y1={D.y+D.h} x2={bCx(F)} y2={F.y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#mo-a)" />
      <line x1={E.x+E.w} y1={bCy(E)} x2={F.x} y2={bCy(F)} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#mo-a)" />
      <path d={`M ${E.x},${bCy(E)} L 10,${bCy(E)} L 10,${bCy(A)} L ${A.x},${bCy(A)}`}
        fill="none" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#mo-ad)" />
      <path d={`M ${F.x+F.w},${bCy(F)} L ${W-10},${bCy(F)} L ${W-10},${bCy(A)} L ${A.x+A.w},${bCy(A)}`}
        fill="none" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="6,4" markerEnd="url(#mo-ad)" />

      {/* Nodes */}
      {nodeLabel(A, 'sa_situation',  'Sosyal Durum',         undefined,        '#374151', 'white',   '#9ca3af', 37)}
      {nodeLabel(B, 'sa_assumptions','Varsayımların Aktivasyonu', undefined,   '#374151', '#f9fafb', '#e5e7eb', 8)}
      {nodeLabel(C, 'sa_threat',     'Sosyal Tehdit Algısı', 'Olumsuz Otomatik Düşünceler', '#374151', '#f9fafb', '#e5e7eb', 8)}
      {nodeLabel(D, 'sa_processing', 'Kendini Sosyal Nesne Olarak İşlemleme', undefined, '#0f766e', '#f0fdfa', '#0d9488', 44)}
      {nodeLabel(E, 'sa_safety',     'Güvenlik Arama Davranışları', undefined, '#374151', 'white',   '#9ca3af', 8)}
      {nodeLabel(F, 'sa_symptoms',   'Somatik & Bilişsel Semptomlar', undefined,'#374151', 'white',  '#9ca3af', 8)}
    </svg>
  );
}

// Generic display SVG (numbered boxes for other templates)
function GenericSVG({ template, fields, activeKey }: { template: TemplateDef; fields: Record<string, string>; activeKey: string | null }) {
  const col = ACTIVE_RING[template.renk] || '#6b7280';
  return (
    <div className="space-y-2 p-4">
      {template.fields.map((f, i) => {
        const isActive = activeKey === f.key;
        const val = fields[f.key] || '';
        const done = val.trim().length > 0;
        return (
          <div key={f.key}
            style={{ borderColor: isActive ? col : undefined }}
            className={`rounded-xl border-2 p-3 transition-all ${isActive ? 'shadow-md' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ background: isActive ? col : '#e5e7eb', color: isActive ? 'white' : '#374151' }}
                className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {done ? '✓' : i + 1}
              </span>
              <span className="text-[11px] font-semibold text-[#0E0F12]">{f.label}</span>
            </div>
            <p className="text-[11px] text-gray-600 pl-7 leading-snug">
              {val || <span className="text-gray-400 italic">Boş</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

// ─── localStorage helpers ─────────────────────────────────────────────────────

const storageKey = (patientId: string) => `bdt_model_${patientId}`;

export function loadSavedModel(patientId: string): SavedModel | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(patientId));
    return raw ? (JSON.parse(raw) as SavedModel) : null;
  } catch { return null; }
}

function saveModel(patientId: string, templateId: string, baslik: string, fields: Record<string, string>) {
  try {
    const data: SavedModel = { templateId, baslik, fields, savedAt: new Date().toISOString() };
    localStorage.setItem(storageKey(patientId), JSON.stringify(data));
  } catch { /* quota exceeded — silently ignore */ }
}

// ─── BdtModelDisplay (used in VakaHaritasi) ──────────────────────────────────

export function BdtModelDisplay({ patientId }: { patientId?: string }) {
  const [model, setModel] = useState<SavedModel | null>(null);

  useEffect(() => {
    if (!patientId) return;
    setModel(loadSavedModel(patientId));
  }, [patientId]);

  if (!patientId || !model) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <FileText className="w-8 h-8 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">Henüz BDT modeli oluşturulmadı</p>
        <p className="text-xs text-gray-400 max-w-xs">
          Formülasyon sekmesindeki <strong>Model Oluştur</strong> adımını tamamlayın.
        </p>
      </div>
    );
  }

  const template = TEMPLATES.find(t => t.id === model.templateId);
  const renk = template?.renk ?? 'blue';
  const badge = BADGE[renk] ?? 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge}`}>
          {model.baslik}
        </span>
        <span className="text-[11px] text-gray-400 italic">
          {template?.kaynak}
          {model.savedAt && ` · ${new Date(model.savedAt).toLocaleDateString('tr-TR')}`}
        </span>
      </div>

      {/* SVG diagram (sosyal kaygı) */}
      {model.templateId === 'sosyal-kaygi' && (
        <div className="card overflow-hidden p-2">
          <SosyalKaygiSVG fields={model.fields} activeKey={null} />
        </div>
      )}

      {/* Field summary cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        {(template?.fields ?? []).map(f => {
          const val = model.fields[f.key] ?? '';
          if (!val.trim()) return null;
          return (
            <div key={f.key} className="card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{f.label}</p>
              <p className="text-sm text-[#0E0F12] dark:text-gray-200 leading-relaxed">{val}</p>
            </div>
          );
        })}
      </div>

      {/* Generic display for non-SVG templates */}
      {model.templateId !== 'sosyal-kaygi' && (
        <GenericSVG
          template={template ?? TEMPLATES[0]}
          fields={model.fields}
          activeKey={null}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ModelOlustur({
  patientId,
  patient,
  formulation,
}: {
  patientId?: string;
  patient?: PatientSummary;
  formulation?: FormulationSummary | null;
}) {
  const [selected, setSelected] = useState<TemplateDef | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [showOzet, setShowOzet] = useState(false);
  const rightRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Load previously saved model for this patient
  useEffect(() => {
    if (!patientId) return;
    const saved = loadSavedModel(patientId);
    if (!saved) return;
    const tpl = TEMPLATES.find(t => t.id === saved.templateId);
    if (tpl) {
      setSelected(tpl);
      setFields(saved.fields);
      setActiveKey(tpl.fields[0]?.key ?? null);
    }
  }, [patientId]);

  // Auto-save whenever fields change
  useEffect(() => {
    if (!patientId || !selected) return;
    saveModel(patientId, selected.id, selected.baslik, fields);
  }, [patientId, selected, fields]);

  // Pick template
  const pickTemplate = (t: TemplateDef) => {
    setSelected(t);
    setFields({});
    setActiveKey(t.fields[0]?.key ?? null);
  };

  const activeField = selected?.fields.find(f => f.key === activeKey) ?? null;
  const completedCount = selected ? selected.fields.filter(f => (fields[f.key] || '').trim()).length : 0;
  const totalCount = selected?.fields.length ?? 0;

  // Scroll to field in right panel when activeKey changes
  useEffect(() => {
    if (!activeKey) return;
    const el = fieldRefs.current[activeKey];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeKey]);

  // ── Template selection ────────────────────────────────────────────────────

  if (!selected) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Model Oluştur</p>
          <h2 className="text-lg font-medium text-[#0E0F12] mt-0.5">Formülasyon Şablonu Seç</h2>
          <p className="text-xs text-gray-500 mt-1">
            Danışanın sunduğu probleme uygun BDT modelini seçin. Adım adım doldurmanıza rehberlik edeceğiz.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => pickTemplate(t)}
              className="card p-5 text-left hover:shadow-md transition-all active:scale-[0.98] group">
              <div className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mb-3 ${BADGE[t.renk] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {t.baslik}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{t.aciklama}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 italic">{t.kaynak}</span>
                <span className="text-xs text-gray-400 group-hover:text-[#0E0F12] transition-colors flex items-center gap-1">
                  Başla <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
          {/* Placeholder cards for future templates */}
          {['YAB', 'TSSB', 'OKB'].map(name => (
            <div key={name} className="card p-5 opacity-40 select-none border-dashed">
              <div className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200 mb-3">
                {name}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Yakında eklenecek</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Split-panel editor ────────────────────────────────────────────────────

  const renk = selected.renk;
  const guideBg = GUIDE_BG[renk] || 'bg-gray-50 border-gray-200';
  const guideText = GUIDE_TEXT[renk] || 'text-gray-900';

  return (
    <>
    {/* Formülasyon Özeti modal */}
    {showOzet && patient && patientId && (
      <FormulasyonOzetiModal
        patient={patient}
        formulation={formulation ?? null}
        patientId={patientId}
        onClose={() => setShowOzet(false)}
      />
    )}
    <div className="animate-fade-in flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header bar */}
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <button onClick={() => setSelected(null)}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${BADGE[renk] || ''}`}>
              {selected.baslik}
            </span>
            <span className="text-xs text-gray-400">{selected.kaynak}</span>
          </div>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex gap-1">
            {selected.fields.map(f => (
              <div key={f.key}
                style={{ background: (fields[f.key] || '').trim() ? '#22c55e' : activeKey === f.key ? (ACTIVE_RING[renk] || '#6b7280') : '#e5e7eb' }}
                className="w-2 h-2 rounded-full transition-all" />
            ))}
          </div>
          <span className="text-xs text-gray-500">{completedCount}/{totalCount}</span>
        </div>
        {/* Özet & Yazdır — visible when at least one field is filled and patient info is available */}
        {completedCount > 0 && patient && patientId && (
          <button
            onClick={() => setShowOzet(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition flex-shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            Özet &amp; Yazdır
          </button>
        )}
      </div>

      {/* Split layout */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 240px)', minHeight: 600 }}>

        {/* LEFT: Live diagram */}
        <div className="w-[42%] flex-shrink-0 card overflow-hidden flex flex-col">
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex-shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Canlı Model</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {selected.id === 'sosyal-kaygi'
              ? <SosyalKaygiSVG fields={fields} activeKey={activeKey} />
              : <GenericSVG template={selected} fields={fields} activeKey={activeKey} />
            }
          </div>
          <div className="px-4 py-2 border-t border-gray-100 flex-shrink-0">
            <p className="text-[10px] text-gray-400 italic text-center">{selected.kaynak}</p>
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">

          {/* Sticky guidance */}
          <div className={`rounded-2xl border p-4 mb-3 flex-shrink-0 transition-all ${guideBg}`}>
            <div className="flex items-start gap-2.5">
              <Info className={`w-4 h-4 flex-shrink-0 mt-0.5 ${guideText}`} style={{ opacity: 0.7 }} />
              <div>
                <p className={`text-xs font-semibold mb-1 ${guideText}`}>
                  {activeField?.guideTitle ?? 'Bir alan seçin'}
                </p>
                <p className={`text-xs leading-relaxed ${guideText}`} style={{ opacity: 0.85 }}>
                  {activeField?.guidance ?? 'Aşağıdaki alanlardan birini tıklayarak o bölümle ilgili klinik rehbere ulaşın.'}
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable fields */}
          <div ref={rightRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
            {selected.fields.map((f, i) => {
              const isActive = activeKey === f.key;
              const val = fields[f.key] || '';
              const done = val.trim().length > 0;
              return (
                <div key={f.key}
                  ref={el => { fieldRefs.current[f.key] = el; }}
                  onClick={() => setActiveKey(f.key)}
                  style={{ borderColor: isActive ? (ACTIVE_RING[renk] || '#6b7280') : undefined }}
                  className={`rounded-2xl border-2 transition-all cursor-pointer ${
                    isActive ? 'bg-white shadow-md' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  {/* Field header */}
                  <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
                    <div style={{ background: done ? '#22c55e' : isActive ? (ACTIVE_RING[renk] || '#374151') : '#e5e7eb', color: done || isActive ? 'white' : '#6b7280' }}
                      className="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0 transition-all">
                      {done ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0E0F12]">{f.label}</p>
                      {f.subtitle && <p className="text-[11px] text-gray-500">{f.subtitle}</p>}
                    </div>
                    {done && !isActive && (
                      <span className="text-[10px] text-green-600 font-medium">✓ Dolduruldu</span>
                    )}
                  </div>

                  {/* Textarea (only when active) */}
                  {isActive && (
                    <div className="px-4 pb-4">
                      <textarea
                        autoFocus
                        rows={4}
                        value={val}
                        onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full rounded-xl border border-gray-200 bg-[#F4F5F8] px-3 py-2 text-sm text-[#0E0F12] outline-none focus:border-gray-400 resize-none leading-relaxed transition-colors"
                      />
                      {/* Next field button */}
                      {i < selected.fields.length - 1 && (
                        <div className="flex justify-end mt-2">
                          <button onClick={e => { e.stopPropagation(); setActiveKey(selected.fields[i+1].key); }}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-[#0E0F12] text-white hover:opacity-80 transition-opacity">
                            Sonraki <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {i === selected.fields.length - 1 && (
                        <div className="mt-3 rounded-xl bg-green-50 border border-green-200 p-3 text-center">
                          <p className="text-xs font-semibold text-green-700">
                            {completedCount === totalCount ? '✓ Model tamamlandı!' : `${completedCount}/${totalCount} alan dolduruldu`}
                          </p>
                          {completedCount === totalCount && (
                            <p className="text-[11px] text-green-600 mt-1">Bu modeli Bozukluk Döngüleri sekmesine aktarabilirsiniz.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview when not active and has value */}
                  {!isActive && done && (
                    <div className="px-4 pb-3">
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{val}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
