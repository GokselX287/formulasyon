'use client';

import type { FourP } from '@/lib/types';

// ──────────────────────────────────────────────────────────────────────────
// Danışan Özeti (Vaka Sunumu) — paylaşılan içerik. Modal, indirme ve public
// sayfa (/ozet/[token]) hep aynı içeriği kullanır → tek kaynak.
// Klinik-içi alanlar (risk, klinik not) gösterilmez. Danışan adı yerine
// isimden türeyen "danışan kodu" (baş harfler) kullanılır — anonimlik.
// ──────────────────────────────────────────────────────────────────────────

export type CycleNode = { t: string; m: string };

export type LongitudinalOzet = {
  earlyExperiences?: string[];
  coreBeliefs?: string[];
  intermediateBeliefs?: string[];
  copingStrategies?: string[];
};

export type OzetData = {
  name?: string;
  summary?: string;
  fourP?: FourP;
  longitudinal?: LongitudinalOzet;
  interventionsPlanned?: string[];
  cycle?: CycleNode[];
};

const INK = '#0E0F12';
const SOFT = '#6B7280';
const LINE = '#E5E7EB';

export const OZET_P_LABELS: { key: keyof FourP; label: string }[] = [
  { key: 'predisposing', label: 'Geçmişten gelenler' },
  { key: 'precipitating', label: 'Tetikleyenler' },
  { key: 'perpetuating', label: 'Sürdürenler' },
  { key: 'protective', label: 'Güçlü yanların' },
];

// Danışana giden Vaka Sunumu için YUMUŞATILMIŞ, ikinci-tekil dil (4P etiketleriyle
// aynı ton). Klinik terimler (temel inanç, ara inanç…) bilinçli olarak gündelik
// dile çevrildi. Klinisyen tarafı (FormulasyonOzetiModal) kendi klinik etiketlerini
// korur — burası yalnız danışan görür.
export const OZET_LONG_LABELS: { key: keyof LongitudinalOzet; label: string }[] = [
  { key: 'earlyExperiences',    label: 'Hayatının erken yılları' },
  { key: 'coreBeliefs',         label: 'Kendinle ilgili inançların' },
  { key: 'intermediateBeliefs', label: 'Edindiğin kurallar' },
  { key: 'copingStrategies',    label: 'Başa çıkma yolların' },
];

// İsimden danışan kodu — baş harfler (Mine Bedir → "M.B."). Anonim sunum için.
export function danisanKodu(name?: string): string {
  const t = (name ?? '').trim();
  if (!t) return 'Danışan';
  const parts = t.split(/\s+/).filter(Boolean).slice(0, 3);
  return parts.map((w) => w[0].toLocaleUpperCase('tr')).join('.') + '.';
}

export function hasOzetContent(d: OzetData): boolean {
  const fp = d.fourP;
  const hasFourP = !!fp && OZET_P_LABELS.some(({ key }) => ((fp[key] ?? []) as string[]).length > 0);
  const lg = d.longitudinal;
  const hasLong = !!lg && OZET_LONG_LABELS.some(({ key }) => ((lg[key] ?? []) as string[]).length > 0);
  return !!(d.summary || hasFourP || hasLong || (d.interventionsPlanned ?? []).length > 0 || (d.cycle ?? []).length > 0);
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Yazdırılabilir (PDF) tam HTML belge — izole pencerede açılır
export function buildOzetPrintHtml(d: OzetData): string {
  const kod = danisanKodu(d.name);
  const list = (items: string[]) => (items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '');
  const sec = (title: string, body: string) => (body ? `<section><h2>${esc(title)}</h2>${body}</section>` : '');
  const fp = d.fourP;
  const fourPHtml = fp
    ? OZET_P_LABELS.map(({ key, label }) => {
        const items = (fp[key] ?? []) as string[];
        return items.length ? `<div class="p"><h3>${esc(label)}</h3>${list(items)}</div>` : '';
      }).join('')
    : '';
  const cycleHtml = (d.cycle ?? []).length
    ? `<ol class="cyc">${d.cycle!.map((n) => `<li><b>${esc(n.t)}</b> — ${esc(n.m)}</li>`).join('')}</ol>`
    : '';
  const lg = d.longitudinal;
  const longHtml = lg
    ? OZET_LONG_LABELS.map(({ key, label }) => {
        const items = (lg[key] ?? []) as string[];
        return items.length ? `<div class="p"><h3>${esc(label)}</h3>${list(items)}</div>` : '';
      }).join('')
    : '';
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(kod)} · Vaka Sunumu</title>
<style>
  @page { margin: 22mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Plus Jakarta Sans', -apple-system, system-ui, sans-serif; color: ${INK}; line-height: 1.6; max-width: 720px; margin: 0 auto; padding: 24px 16px; }
  .eyebrow { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: ${SOFT}; }
  h1 { font-family: Georgia, 'Times New Roman', serif; font-weight: 600; font-size: 30px; margin: 6px 0 2px; }
  .sub { color: ${SOFT}; margin: 0 0 22px; }
  section { margin: 0 0 22px; padding-top: 16px; border-top: 1px solid ${LINE}; }
  h2 { font-size: 13px; letter-spacing: .04em; text-transform: uppercase; color: ${SOFT}; margin: 0 0 12px; }
  h3 { font-size: 14px; margin: 0 0 6px; }
  .p { margin: 0 0 14px; } ul, ol { margin: 0; padding-left: 18px; } li { margin: 4px 0; }
  .cyc li b { color: ${INK}; }
  p.body { margin: 0; } .foot { margin-top: 28px; color: ${SOFT}; font-size: 11px; }
</style></head><body>
  <span class="eyebrow">Vaka Sunumu</span>
  <h1>${esc(kod)}</h1>
  <p class="sub">Birlikte üzerinde çalıştığımız konuların özeti.</p>
  ${sec('Genel bakış', d.summary ? `<p class="body">${esc(d.summary)}</p>` : '')}
  ${sec('Üzerinde çalıştığımız etkenler', fourPHtml)}
  ${sec('Hikâyenin akışı', longHtml)}
  ${sec('Kısır döngü', cycleHtml)}
  ${sec('Planlı çalışmalar', list(d.interventionsPlanned ?? []))}
  <p class="foot">Bu sunum, terapistinle yürüttüğün çalışmayı hatırlaman için hazırlanmıştır.</p>
</body></html>`;
}

export default function DanisanOzetIcerik({ data }: { data: OzetData }) {
  const { summary, fourP, longitudinal: lg, interventionsPlanned = [], cycle = [] } = data;
  const secStyle: React.CSSProperties = { padding: '18px 0 0', borderTop: `1px solid ${LINE}`, marginTop: 18 };
  const h3Style: React.CSSProperties = { fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase', color: SOFT, margin: '0 0 10px' };
  const hasFourP = !!fourP && OZET_P_LABELS.some(({ key }) => ((fourP[key] ?? []) as string[]).length > 0);
  const hasLong = !!lg && OZET_LONG_LABELS.some(({ key }) => ((lg[key] ?? []) as string[]).length > 0);

  return (
    <>
      {summary && (
        <div style={secStyle}>
          <h3 style={h3Style}>Genel bakış</h3>
          <p style={{ margin: 0, color: INK, fontSize: 14.5, lineHeight: 1.6 }}>{summary}</p>
        </div>
      )}
      {hasFourP && (
        <div style={secStyle}>
          <h3 style={h3Style}>Üzerinde çalıştığımız etkenler</h3>
          {OZET_P_LABELS.map(({ key, label }) => {
            const items = (fourP![key] ?? []) as string[];
            if (!items.length) return null;
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: INK, marginBottom: 4 }}>{label}</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: INK, fontSize: 14 }}>
                  {items.map((it, i) => <li key={i} style={{ margin: '3px 0' }}>{it}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      {hasLong && lg && (
        <div style={secStyle}>
          <h3 style={h3Style}>Hikâyenin akışı</h3>
          {OZET_LONG_LABELS.map(({ key, label }) => {
            const items = (lg[key] ?? []) as string[];
            if (!items.length) return null;
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: INK, marginBottom: 4 }}>{label}</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: INK, fontSize: 14 }}>
                  {items.map((it, i) => <li key={i} style={{ margin: '3px 0' }}>{it}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      {cycle.length > 0 && (
        <div style={secStyle}>
          <h3 style={h3Style}>Kısır döngü</h3>
          <ol style={{ margin: 0, paddingLeft: 18, color: INK, fontSize: 14 }}>
            {cycle.map((n, i) => <li key={i} style={{ margin: '4px 0' }}><b>{n.t}</b> — {n.m}</li>)}
          </ol>
        </div>
      )}
      {interventionsPlanned.length > 0 && (
        <div style={secStyle}>
          <h3 style={h3Style}>Planlı çalışmalar</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: INK, fontSize: 14 }}>
            {interventionsPlanned.map((it, i) => <li key={i} style={{ margin: '3px 0' }}>{it}</li>)}
          </ul>
        </div>
      )}
      {!hasOzetContent(data) && (
        <div style={{ ...secStyle, color: SOFT, fontSize: 14 }}>Henüz danışana sunulacak içerik yok.</div>
      )}
    </>
  );
}
