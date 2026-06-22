'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BriefingPanel from '@/components/BriefingPanel';
import type {
  BriefingHero, Vital, VerbatimQuote, ToolkitTool, SessionStep, BriefingPanelProps,
} from '@/components/BriefingPanel';
import '@/components/BriefingPanel.css';

// ─── helpers ────────────────────────────────────────────────────────────────

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

function mapVitals(sessions: any[]): Vital[] {
  return sessions
    .filter(s => s.seansNotu?.suds != null || s.seansNotu?.moodPuani != null)
    .slice(-6)
    .map(s => ({
      date:  (s.tarih ?? '').slice(5, 10).replace('-', '.'),   // "05.17"
      suds:  s.seansNotu?.suds      ?? 5,
      mood:  s.seansNotu?.moodPuani ?? 5,
    }));
}

function mapVerbatim(sessions: any[], clientName: string): VerbatimQuote | undefined {
  const last = [...sessions].reverse().find(s => s.seansNotu?.notlar);
  if (!last) return undefined;
  const notes: string = last.seansNotu?.notlar ?? '';
  const sentence = notes.split(/[.!?]/)[0]?.trim() ?? notes.slice(0, 120);
  if (!sentence) return undefined;
  return {
    text:        sentence + '.',
    who:         clientName.toLowerCase(),
    sessionMeta: `${last.no ?? '?'}. seans · ${(last.tarih ?? '').slice(0, 10).replace(/-/g, '.')}`,
  };
}

function mapToolkit(interventions: any[]): ToolkitTool[] {
  return interventions.slice(0, 5).map((iv, i) => ({
    id:          String(iv.id ?? i),
    short:       String(iv.modality ?? 'Genel'),
    full:        String(iv.title ?? 'Müdahale'),
    modality:    String(iv.modality ?? 'BDT'),
    durationMin: Number(iv.durationMinutes ?? iv.duration_minutes ?? 20),
  }));
}

const DEFAULT_STEPS: SessionStep[] = [
  { block: 'opening', label: 'İlişki kurma + gündem',       durationMin: 3  },
  { block: 'opening', label: 'Hafta özeti + ödev kontrolü', durationMin: 5  },
  { block: 'main',    label: 'Ana müdahale',                durationMin: 20, modality: 'BDT' },
  { block: 'main',    label: 'Değerlendirme + defüzyon',    durationMin: 8,  modality: 'ACT' },
  { block: 'main',    label: 'Pratik uygulama',             durationMin: 8,  modality: 'BDT' },
  { block: 'closing', label: 'Ödev belirleme',              durationMin: 5  },
  { block: 'closing', label: 'Sonraki seans odağı',         durationMin: 3  },
];

// ─── page ────────────────────────────────────────────────────────────────────

export default function BriefingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }  = use(params);
  const router  = useRouter();

  const [props, setProps] = useState<Partial<BriefingPanelProps>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${id}`).then(r => r.json()).catch(() => null),
      fetch(`/api/seanslar?clientId=${id}`).then(r => r.json()).catch(() => []),
      fetch(`/api/takvim-yaklasan`).then(r => r.json()).catch(() => []),
      fetch(`/api/interventions?suggest=1`).then(r => r.json()).catch(() => []),
    ]).then(([c, rawSessions, calendar, interventions]) => {
      const sessions = Array.isArray(rawSessions) ? rawSessions : [];
      const calEvents = Array.isArray(calendar)   ? calendar   : [];

      // ── hero ──────────────────────────────────────────────
      const fullName   = c?.adSoyad ?? c?.name ?? c?.alias ?? '—';
      const firstName  = fullName.split(' ')[0];
      const lastName   = fullName.split(' ').slice(1).join(' ');
      const sessionNum = sessions.length + 1;

      // Try to find next appointment from calendar by name match
      const calMatch = calEvents.find((ev: any) =>
        (ev.clientName ?? '').toLowerCase().includes(firstName.toLowerCase())
      );
      const sessionStartISO = calMatch?.tarih && calMatch?.saat
        ? `${calMatch.tarih}T${calMatch.saat}:00`
        : new Date(Date.now() + 23 * 60 * 1000).toISOString();

      const hero: BriefingHero = {
        clientId:        id,
        vakaNo:          `#${c?.id ?? id}`,
        firstName,
        lastName,
        age:             c?.yas  ? Number(c.yas)  : c?.age ? Number(c.age) : undefined,
        sessionNumber:   sessionNum,
        sessionStartISO,
        modality:        c?.modality ?? undefined,
      };

      // ── vitals ────────────────────────────────────────────
      const vitals = mapVitals(sessions);

      // ── verbatim ──────────────────────────────────────────
      const verbatim = mapVerbatim(sessions, fullName);

      // ── toolkit ───────────────────────────────────────────
      const toolkit = interventions.length > 0 ? mapToolkit(interventions) : undefined;

      // ── session steps ─────────────────────────────────────
      // Inject top intervention as the main block label if available
      const steps: SessionStep[] = [...DEFAULT_STEPS];
      if (interventions[0]?.title) {
        steps[2] = {
          block:       'main',
          label:       String(interventions[0].title),
          durationMin: Number(interventions[0].durationMinutes ?? 20),
          modality:    String(interventions[0].modality ?? 'BDT'),
        };
      }

      setProps({ hero, vitals: vitals.length > 0 ? vitals : undefined, verbatim, toolkit, sessionSteps: steps });
    });
  }, [id]);

  return (
    <BriefingPanel
      hero={props.hero ?? {
        clientId:        id,
        vakaNo:          `#${id}`,
        firstName:       '—',
        lastName:        '',
        sessionNumber:   1,
        sessionStartISO: new Date(Date.now() + 23 * 60 * 1000).toISOString(),
      }}
      vitals={props.vitals}
      verbatim={props.verbatim}
      toolkit={props.toolkit}
      sessionSteps={props.sessionSteps}
      onBack={() => router.back()}
      onStartSession={() => router.push(`/clients/${id}/seans/yeni`)}
      onPrint={() => window.print()}
      onExportPdf={() => window.print()}
      onAddTool={() => router.push('/uygulama?tab=mudahale-kutuphanesi')}
      onOpenTool={(toolId) => console.log('open tool', toolId)}
      onOpenLastSession={() => router.push(`/clients/${id}`)}
    />
  );
}
