'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TerapistProfilPanel from '@/components/TerapistProfilPanel';
import type { TerapistProfilPanelProps, SupervisionNote } from '@/components/TerapistProfilPanel';
import '@/components/TerapistProfilPanel.css';

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

export default function TerapistProfilPage() {
  const router = useRouter();
  const [settings,   setSettings]   = useState<any>(null);
  const [supervizyon, setSupervizyon] = useState<any[]>([]);
  // Deep-link: /profil?section=gelisim → ilgili bölümü aç (client'ta oku — SSR'de window yok)
  const [initialSection, setInitialSection] = useState<string | null>(null);
  useEffect(() => {
    setInitialSection(new URLSearchParams(window.location.search).get('section'));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(r => r.json()).catch(() => null),
      fetch('/api/supervizyon-notu').then(r => r.json()).catch(() => []),
    ]).then(([s, sup]) => {
      setSettings(s);
      setSupervizyon(Array.isArray(sup) ? sup : []);
    });
  }, []);

  const therapistName = (settings?.therapistName ?? 'Ayşe Demir').trim();
  const parts = therapistName.split(' ');

  // Supervizyon notlarını SupervisionNote[] formatına dönüştür
  const supNotes: SupervisionNote[] | undefined = supervizyon.length
    ? supervizyon.slice(0, 6).map((n, i) => ({
        id:         n.id,
        romanNum:   ROMAN[i] ?? String(i + 1),
        topic:      n.topic ?? n.goal ?? n.konu ?? 'Süpervizyon notu',
        date:       n.date  ?? n.tarih ?? '—',
        difficulty: Number(n.difficulty ?? n.zorluk ?? 5),
        learning:   Number(n.learning   ?? n.ogrenme ?? 5),
        upcoming:   false,
      }))
    : undefined;

  const props: TerapistProfilPanelProps = {
    hero: {
      name:       parts.slice(0, -1).join(' ') || parts[0] || 'Terapist',
      lastName:   parts.length > 1 ? parts[parts.length - 1] : '',
      title:      settings?.title ?? 'Klinik Psikolog',
      years:      settings?.yearsOfPractice ?? 12,
      modalities: settings?.modalities ?? ['ACT', 'CFT'],
      specs:      settings?.specs      ?? ['Sosyal kaygı', 'OKB'],
    },
    supervisionNotes: supNotes,
    initialSection:      (initialSection as TerapistProfilPanelProps['initialSection']) ?? undefined,

    onBack:              () => router.back(),
    onPublicPreview:     () => console.log('public-preview'),
    onToggleEdit:        () => console.log('toggle-edit'),
    onMeasureBurnout:    () => router.push('/olcek/burnout'),
    onAddSupervisionNote:    () => router.push('/supervizyon'),
    onOpenSupervisionNote:   () => router.push('/supervizyon'),
    onMessageSupervisor: () => console.log('message-supervisor'),
    onSaveReflection:    async (text: string) => {
      await fetch('/api/reflections', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      });
    },
  };

  return <TerapistProfilPanel {...props} />;
}
