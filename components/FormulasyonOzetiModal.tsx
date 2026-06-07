'use client';

import { useEffect, useState } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import {
  loadSavedModel,
  type SavedModel,
  type TemplateDef,
  TEMPLATES,
  BADGE,
  SosyalKaygiSVG,
} from './ModelOlustur';

// ─── Types ────────────────────────────────────────────────────────────────────

type Patient = {
  adSoyad: string; yas?: string; cinsiyet?: string;
  telefon?: string; email?: string; basvuruTarihi?: string;
  sunumSorunu?: string;
};

type Formulation = {
  anaSikayetler?: string; yonlendirmeNedeni?: string;
  predispozan?: string; presipitan?: string;
  perpetuan?: string; protektif?: string;
  temelInanclar?: string; araInanclar?: string;
  basaCikma?: string; otomatikDusunceler?: string;
  duyguBedensel?: string; davranislar?: string;
  smartSpesifik?: string; smartOlculebilir?: string; smartZaman?: string;
};

type Props = {
  patient: Patient;
  formulation: Formulation | null;
  patientId: string;
  onClose: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('tr-TR');
}

// Section divider with bold header
function Section({ title, color = 'gray' }: { title: string; color?: string }) {
  const bar: Record<string, string> = {
    gray:   'bg-gray-100',
    blue:   'bg-blue-50',
    indigo: 'bg-indigo-50',
    green:  'bg-emerald-50',
    amber:  'bg-amber-50',
  };
  return (
    <div className={`flex items-center gap-3 mt-6 mb-3 px-3 py-2 rounded-xl ${bar[color] ?? bar.gray}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 flex-1">{title}</p>
    </div>
  );
}

// Light-bg / dark-text field card
function Field({ label, value, accent }: { label: string; value?: string; accent?: string }) {
  if (!value?.trim()) return null;
  return (
    <div className={`rounded-xl px-4 py-3 mb-2 ${accent ?? 'bg-[#F4F5F8]'}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-1 leading-none">{label}</p>
      <p className="text-sm font-medium text-[#0E0F12] leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

// Two-column grid wrapper
function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

// 4P coloured quadrant card
function P4Card({ label, emoji, value, bg, labelColor }: {
  label: string; emoji: string; value?: string;
  bg: string; labelColor: string;
}) {
  if (!value?.trim()) return null;
  return (
    <div className={`rounded-xl px-4 py-3 ${bg}`}>
      <p className={`text-[10px] font-bold uppercase tracking-[0.14em] mb-1 flex items-center gap-1 ${labelColor}`}>
        <span>{emoji}</span>{label}
      </p>
      <p className="text-sm font-medium text-[#0E0F12] leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

// ─── BDT model field labels ───────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  sa_situation:  'Sosyal Durum (Tetikleyici)',
  sa_assumptions:'Varsayımların Aktivasyonu',
  sa_threat:     'Sosyal Tehdit Algısı',
  sa_processing: 'Kendini Sosyal Nesne Olarak İşlemleme',
  sa_safety:     'Güvenlik Arama Davranışları',
  sa_symptoms:   'Somatik & Bilişsel Semptomlar',
  panic_trigger:     'Tetikleyici',
  panic_thought:     'Otomatik Düşünce',
  panic_emotion:     'Duygu & Uyarılma',
  panic_body:        'Bedensel Duyumlar',
  panic_catastrophe: 'Felaketleştirme',
  dep_early:    'Erken Yaşantılar',
  dep_beliefs:  'İşlevsel Olmayan İnançlar',
  dep_trigger:  'Kritik Olaylar',
  dep_thoughts: 'Olumsuz Otomatik Düşünceler',
  dep_behavior: 'Davranışsal İnaktivasyon',
  dep_symptoms: 'Belirtiler',
};

// ─── Print helper ─────────────────────────────────────────────────────────────

function buildPrintHtml(contentHtml: string, patientName: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Formülasyon Özeti — ${patientName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           color: #111; background: #fff; padding: 32px 40px; max-width: 860px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: 600; color: #0E0F12; }
    .subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; margin-bottom: 8px; }
    .stamp { font-size: 10px; color: #9ca3af; margin-bottom: 24px; }
    .section-wrap { background: #f4f5f8; border-radius: 10px; padding: 7px 12px;
                    margin-top: 22px; margin-bottom: 10px; }
    .section-title { font-size: 9.5px; font-weight: 700; text-transform: uppercase;
                     letter-spacing: 0.18em; color: #6b7280; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .field { background: #f4f5f8; border-radius: 10px; padding: 10px 14px; margin-bottom: 0; }
    .field-label { font-size: 9px; font-weight: 700; text-transform: uppercase;
                   letter-spacing: 0.14em; color: #9ca3af; margin-bottom: 3px; }
    .field-value { font-size: 12.5px; font-weight: 500; color: #0e0f12;
                   line-height: 1.55; white-space: pre-wrap; }
    .p4-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .p4-pred { background: #eff6ff; } .p4-prec { background: #fffbeb; }
    .p4-perp { background: #fef2f2; } .p4-prot { background: #f0fdf4; }
    .p4-label { font-size: 9px; font-weight: 800; text-transform: uppercase;
                letter-spacing: 0.14em; margin-bottom: 3px; }
    .p4-pred .p4-label { color: #1d4ed8; }
    .p4-prec .p4-label { color: #b45309; }
    .p4-perp .p4-label { color: #b91c1c; }
    .p4-prot .p4-label { color: #15803d; }
    .model-badge { display: inline-block; font-size: 10px; font-weight: 700;
                   background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
                   padding: 2px 10px; border-radius: 999px; margin-bottom: 12px; }
    @media print {
      body { padding: 20px 28px; }
      @page { margin: 15mm 15mm; }
    }
  </style>
</head>
<body>${contentHtml}</body>
</html>`;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function FormulasyonOzetiModal({ patient, formulation, patientId, onClose }: Props) {
  const [model, setModel] = useState<SavedModel | null>(null);

  useEffect(() => {
    setModel(loadSavedModel(patientId));
  }, [patientId]);

  const template: TemplateDef | undefined = model ? TEMPLATES.find(t => t.id === model.templateId) : undefined;

  // ── Print ────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    const f = formulation;
    const rows: string[] = [];

    rows.push(`<h1>${patient.adSoyad}</h1>`);
    const meta = [patient.yas ? `${patient.yas} yaş` : '', patient.cinsiyet ?? '', patient.telefon ?? ''].filter(Boolean).join(' · ');
    if (meta) rows.push(`<p class="subtitle">${meta}</p>`);
    rows.push(`<p class="stamp">Oluşturulma: ${new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>`);

    const field = (label: string, value?: string, cls = '') =>
      value?.trim() ? `<div class="field ${cls}"><p class="field-label">${label}</p><p class="field-value">${value}</p></div>` : '';

    // Klinik Profil
    if (f?.anaSikayetler || f?.yonlendirmeNedeni) {
      rows.push('<div class="section-wrap"><p class="section-title">Klinik Profil</p></div><div class="grid2">');
      rows.push(field('Ana Şikayetler', f?.anaSikayetler));
      rows.push(field('Yönlendirme Nedeni', f?.yonlendirmeNedeni));
      rows.push('</div>');
    }

    // 4P
    if (f?.predispozan || f?.presipitan || f?.perpetuan || f?.protektif) {
      rows.push('<div class="section-wrap"><p class="section-title">4P — Vaka Formülasyonu</p></div><div class="p4-grid">');
      if (f?.predispozan) rows.push(`<div class="field p4-pred"><p class="p4-label">🧬 Predispozan</p><p class="field-value">${f.predispozan}</p></div>`);
      if (f?.presipitan)  rows.push(`<div class="field p4-prec"><p class="p4-label">⚡ Presipitan</p><p class="field-value">${f.presipitan}</p></div>`);
      if (f?.perpetuan)   rows.push(`<div class="field p4-perp"><p class="p4-label">🔄 Perpetuan</p><p class="field-value">${f.perpetuan}</p></div>`);
      if (f?.protektif)   rows.push(`<div class="field p4-prot"><p class="p4-label">🛡 Protektif</p><p class="field-value">${f.protektif}</p></div>`);
      rows.push('</div>');
    }

    // Bilişsel Yapı
    const hasCog = f?.temelInanclar || f?.araInanclar || f?.basaCikma || f?.otomatikDusunceler || f?.duyguBedensel || f?.davranislar;
    if (hasCog) {
      rows.push('<div class="section-wrap"><p class="section-title">Bilişsel Yapı</p></div>');
      rows.push(field('Temel İnançlar', f?.temelInanclar));
      rows.push(field('Ara İnançlar / Varsayımlar', f?.araInanclar));
      rows.push(field('Başa Çıkma Stratejileri', f?.basaCikma));
      rows.push('<div class="grid2">');
      rows.push(field('Otomatik Düşünceler', f?.otomatikDusunceler));
      rows.push(field('Duygular & Bedensel', f?.duyguBedensel));
      rows.push('</div>');
      rows.push(field('Davranışlar', f?.davranislar));
    }

    // SMART
    if (f?.smartSpesifik || f?.smartZaman) {
      rows.push('<div class="section-wrap"><p class="section-title">Tedavi Hedefleri (SMART)</p></div>');
      rows.push(field('Spesifik Hedef',  f?.smartSpesifik));
      rows.push(field('Ölçülebilir',     f?.smartOlculebilir));
      rows.push(field('Zaman Çerçevesi', f?.smartZaman));
    }

    // BDT Modeli
    if (model && Object.values(model.fields).some(v => v?.trim())) {
      const tpl = TEMPLATES.find(t => t.id === model.templateId);
      rows.push(`<div class="section-wrap"><p class="section-title">BDT Modeli — ${model.baslik}</p></div>`);
      rows.push('<div class="grid2">');
      (tpl?.fields ?? []).forEach(fd => {
        const v = model.fields[fd.key];
        if (v?.trim()) rows.push(field(fd.label, v));
      });
      rows.push('</div>');
    }

    const html = buildPrintHtml(rows.join('\n'), patient.adSoyad);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const f = formulation;
  const hasAny = f?.anaSikayetler || f?.predispozan || f?.temelInanclar || model;
  const modelHasFields = model && Object.values(model.fields).some(v => v?.trim());

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-8 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-950 rounded-3xl shadow-2xl w-full max-w-2xl z-10 mb-8">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F4F5F8] flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0E0F12] dark:text-white">Formülasyon Özeti</p>
              <p className="text-xs text-gray-400">{patient.adSoyad}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#0E0F12] text-white text-xs font-medium px-4 py-2 rounded-xl hover:opacity-80 transition-opacity"
            >
              <Printer className="w-3.5 h-3.5" />
              Yazdır / PDF
            </button>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#F4F5F8] dark:hover:bg-gray-800 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">

          {/* Danışan başlığı */}
          <div className="rounded-2xl bg-[#F4F5F8] px-5 py-4 mb-2">
            <h1 className="text-xl font-semibold text-[#0E0F12] dark:text-white">{patient.adSoyad}</h1>
            <p className="text-xs text-gray-500 mt-1">
              {[patient.yas ? `${patient.yas} yaş` : '', patient.cinsiyet, patient.telefon].filter(Boolean).join(' · ')}
            </p>
            {patient.basvuruTarihi && (
              <p className="text-[11px] text-gray-400 mt-0.5">Başvuru: {fmtDate(patient.basvuruTarihi)}</p>
            )}
          </div>

          {!hasAny && (
            <p className="text-sm text-gray-400 text-center py-8">Henüz doldurulmuş alan yok. Formülasyon ve Model Oluştur adımlarını tamamlayın.</p>
          )}

          {/* ── Klinik Profil ── */}
          {(f?.anaSikayetler || f?.yonlendirmeNedeni) && (
            <>
              <Section title="Klinik Profil" />
              <Grid2>
                <Field label="Ana Şikayetler"     value={f.anaSikayetler} />
                <Field label="Yönlendirme Nedeni" value={f.yonlendirmeNedeni} />
              </Grid2>
            </>
          )}

          {/* ── 4P Formülasyonu ── */}
          {(f?.predispozan || f?.presipitan || f?.perpetuan || f?.protektif) && (
            <>
              <Section title="4P — Vaka Formülasyonu" color="blue" />
              <div className="grid grid-cols-2 gap-2">
                <P4Card label="Predispozan" emoji="🧬" value={f?.predispozan}
                  bg="bg-blue-50" labelColor="text-blue-700" />
                <P4Card label="Presipitan"  emoji="⚡" value={f?.presipitan}
                  bg="bg-amber-50" labelColor="text-amber-700" />
                <P4Card label="Perpetuan"   emoji="🔄" value={f?.perpetuan}
                  bg="bg-red-50" labelColor="text-red-700" />
                <P4Card label="Protektif"   emoji="🛡" value={f?.protektif}
                  bg="bg-emerald-50" labelColor="text-emerald-700" />
              </div>
            </>
          )}

          {/* ── Bilişsel Yapı ── */}
          {(f?.temelInanclar || f?.araInanclar || f?.basaCikma || f?.otomatikDusunceler || f?.duyguBedensel || f?.davranislar) && (
            <>
              <Section title="Bilişsel Yapı" color="indigo" />
              <Field label="Temel İnançlar"             value={f?.temelInanclar} />
              <Field label="Ara İnançlar / Varsayımlar" value={f?.araInanclar} />
              <Field label="Başa Çıkma Stratejileri"    value={f?.basaCikma} />
              <Grid2>
                <Field label="Otomatik Düşünceler" value={f?.otomatikDusunceler} />
                <Field label="Duygular & Bedensel"  value={f?.duyguBedensel} />
              </Grid2>
              <Field label="Davranışlar" value={f?.davranislar} />
            </>
          )}

          {/* ── SMART Hedefler ── */}
          {(f?.smartSpesifik || f?.smartZaman) && (
            <>
              <Section title="Tedavi Hedefleri (SMART)" color="green" />
              <Grid2>
                <Field label="Spesifik Hedef"  value={f?.smartSpesifik} />
                <Field label="Ölçülebilir"     value={f?.smartOlculebilir} />
              </Grid2>
              <Field label="Zaman Çerçevesi" value={f?.smartZaman} />
            </>
          )}

          {/* ── BDT Modeli (doldurulan şablon) ── */}
          {modelHasFields && template && (
            <>
              <Section title={`BDT Modeli — ${model!.baslik}`} color="amber" />

              {/* Template badge + kaynak */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${BADGE[template.renk] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {model!.baslik}
                </span>
                <span className="text-[11px] text-gray-400 italic">{template.kaynak}</span>
              </div>

              {/* Visual diagram (Sosyal Kaygı has SVG; others get field cards) */}
              {model!.templateId === 'sosyal-kaygi' ? (
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden p-2 mb-3">
                  <SosyalKaygiSVG fields={model!.fields} activeKey={null} />
                </div>
              ) : null}

              {/* Template fields in order — light/dark card style */}
              <div className="space-y-2">
                {template.fields.map((fd, i) => {
                  const val = model!.fields[fd.key];
                  if (!val?.trim()) return null;
                  return (
                    <div key={fd.key} className="rounded-xl bg-[#F4F5F8] px-4 py-3 flex gap-3">
                      {/* Step number */}
                      <div className="w-5 h-5 rounded-full bg-gray-300 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-0.5 leading-none">
                          {fd.label}
                        </p>
                        <p className="text-sm font-medium text-[#0E0F12] leading-relaxed whitespace-pre-wrap">{val}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400 text-center">
              Gizli klinik belge · {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
