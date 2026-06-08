'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DanisanRaporu from '@/components/DanisanRaporu';
import { EMPTY_PROFIL_DATA as EMPTY } from '@/components/danisanRaporuData';

/** Metni satır/noktalı virgülle böl, boşları at */
function splitField(val: unknown): string[] {
  if (typeof val !== 'string' || !val.trim()) return [];
  return val.split(/[\n;]/).map((s) => s.trim()).filter(Boolean);
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export default function DanisanProfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // ── Boş iskeletle başla — gerçek danışan açılana dek Elif görünmesin ──
  const [data, setData] = useState<any>(EMPTY);
  const [backLabel, setBackLabel] = useState('Danışanlar');
  const fdRef = useRef<any>(null);

  const goBack = () => {
    const from = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('from') : null;
    if (from === 'havuz') router.push('/?tab=calendar&takvim=hazirlik');
    else if (from === 'home') router.push('/?tab=home&focus=havuz');
    else router.back();
  };

  const handleBriefing = async () => {
    await fetch('/api/brief', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: id, not: '' }),
    }).catch(() => {});
    router.push(`/seansa-hazirlik/${id}`);
  };

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const from = sp.get('from');
    const focus = sp.get('focus');
    setBackLabel(from === 'havuz' || from === 'home' ? 'Günün seansları' : 'Danışanlar');

    Promise.all([
      fetch(`/api/clients/${id}`).then(r => r.json()).catch(() => null),
      fetch(`/api/formulations/${id}/panel`).then(r => r.json()).catch(() => null),
      fetch(`/api/seanslar?clientId=${id}`).then(r => r.json()).catch(() => []),
    ]).then(([c, fd, ssRaw]) => {
      fdRef.current = fd;
      const sessions: any[] = Array.isArray(ssRaw) ? ssRaw : [];
      const sec = fd?.sections ?? {};

      // c geçerli mi? (404 → { error } döndüğü için truthy olur; ayıkla)
      const valid = c && !c.error && c.adSoyad != null;

      // ── İsim: takma addan ad/soyad ayrıştır (tek kelimede soyad boş) ──
      const fullName = valid ? String(c.adSoyad ?? c.name ?? '') : '';
      const parts = fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = parts[0] ?? '';
      const lastName = parts.slice(1).join(' ');

      // ── Seans kayıtları (gerçek seanslardan, en yeni üstte) ──
      const sessionRecords = sessions.map((s, i) => {
        const n = s.seansNotu ?? {}; const d = s.detay ?? {};
        return {
          seansNo: s.no ?? (i + 1),
          date: (s.tarih ?? '').slice(0, 10).replace(/-/g, '.'),
          isoDate: (s.tarih ?? '').slice(0, 10),
          durum: ['katildi', 'katilmadi', 'ertelendi', 'iptal'].includes(s.durum) ? s.durum : 'katildi',
          title: n.seansOdagi || (s.tip === 'anamnez' ? 'Anamnez' : 'Seans'),
          modality: s.tip === 'anamnez' ? 'Anamnez' : 'Seans',
          durationMin: 50,
          summary: d.seansOzeti || n.gelisimGozlemi || n.gundemMaddeleri || n.terapistNotu || n.notlar || '—',
          interventions: Array.isArray(n.kullanilanTeknikler) ? n.kullanilanTeknikler
                       : Array.isArray(n.teknikler) ? n.teknikler : [],
          homework: n.evOdevi ? [n.evOdevi] : (n.odev ? [n.odev] : (d.odev ? [d.odev] : [])),
          suds: null,
          mood: (typeof n.ruhHali === 'number' && n.ruhHali > 0) ? n.ruhHali
              : (typeof n.moodPuani === 'number' && n.moodPuani > 0) ? n.moodPuani : null,
        };
      }).reverse();

      // ── Ölçek skorları (ruh hali serisi) ──
      const scaleScores = sessions
        .map((s, i) => ({ seansNo: s.no ?? (i + 1), score: s.seansNotu?.ruhHali ?? s.seansNotu?.moodPuani ?? 0 }))
        .filter(x => x.score > 0);

      // ── 4P (formülasyondan) ──
      const fpKeys = ['predisposing', 'precipitating', 'perpetuating', 'protective'];
      const fourP = (EMPTY.fourP as any[]).map((p, idx) => {
        const arr: string[] = fd?.fourP?.[fpKeys[idx]] ?? [];
        return { ...p, body: arr.length ? arr.join('; ') : '', chips: arr.slice(0, 2) };
      });

      // ── Esneklik (hexaflex → yetenek skoru) ──
      let flexibility = EMPTY.flexibility;
      if (fd?.hexaflex) {
        const h = fd.hexaflex;
        const vals = [10 - (h.fusion ?? 5), 10 - (h.avoidance ?? 5), h.presentMoment ?? 5, 10 - (h.selfAsContent ?? 5), h.values ?? 5, h.committedAction ?? 5];
        const axes = (EMPTY.flexibility.axes as any[]).map((a, i) => ({ ...a, value: Math.max(0, Math.min(10, vals[i] ?? 0)) }));
        const score = +(axes.reduce((s, a) => s + a.value, 0) / axes.length).toFixed(1);
        flexibility = { ...EMPTY.flexibility, score, axes };
      }

      // ── Benlik & Algı (kayıtlı JSON) ──
      let benlikAlgisi = EMPTY.benlikAlgisi;
      if (fd?.benlikAlgisiJson) {
        try {
          const p = JSON.parse(fd.benlikAlgisiJson);
          if (p && typeof p === 'object') {
            if (typeof p.self === 'string' || typeof p.outer === 'string') {
              benlikAlgisi = {
                ...EMPTY.benlikAlgisi,
                self: { ...EMPTY.benlikAlgisi.self, note: typeof p.self === 'string' ? p.self : '' },
                outer: { ...EMPTY.benlikAlgisi.outer, note: typeof p.outer === 'string' ? p.outer : '' },
              };
            } else if (p.self && p.outer) { benlikAlgisi = p; }
          }
        } catch {}
      }

      // ── Danışanın KENDİ hedefleri (terapist hedeflerinden AYRI koleksiyon) ──
      let danisanHedefleri: { hedef: string; durum: string }[] = [];
      try {
        const raw = (fd as any)?.danisanHedefleriJson;
        if (raw) {
          const p = JSON.parse(raw);
          if (Array.isArray(p)) danisanHedefleri = p.filter((x: any) => x && x.hedef)
            .map((x: any) => ({ hedef: String(x.hedef), durum: ['tamamlandi', 'devam', 'baslanmadi'].includes(x.durum) ? x.durum : 'baslanmadi' }));
        }
      } catch { /* ignore */ }
      // Yapısal veri yoksa danışanın metin hedeflerinden türet (durum: başlanmadı) — bölüm boş kalmasın
      if (danisanHedefleri.length === 0) {
        danisanHedefleri = splitField(sec.clientGoal).map((t: string) => ({ hedef: t, durum: 'baslanmadi' }));
      }

      // ── Hikaye (narrative) ──
      const narrative = (sec.narrative ?? '').trim();
      const story = narrative
        ? { ...EMPTY.story, preQuote: narrative, meta: firstName ? `${firstName} · ${sessions.length}. seans` : '', metaTail: 'aktarılan içgörü' }
        : EMPTY.story;

      // ── Sorun & Hedef ──
      const problems = splitField(sec.presentingProblem).map((t) => ({ label: t, note: '' }));
      const goals = [
        ...splitField(sec.clientGoal).map((t) => ({ label: t, note: 'Danışan hedefi' })),
        ...splitField(sec.therapistGoal).map((t) => ({ label: t, note: 'Terapist hedefi' })),
      ];
      const problemsGoals = { ...EMPTY.problemsGoals, problems, goals };

      // ── Güçlü & Zayıf ──
      const strengthsWeaknesses = {
        strengths: (sec.strengths ?? []).map((t: string) => ({ label: t, detail: '' })),
        weaknesses: [
          ...(sec.barrierThoughts ?? []),
          ...(sec.barrierEmotions ?? []),
          ...(sec.barrierMemories ?? []),
        ].map((t: string) => ({ label: t, detail: '' })),
      };

      // ── Müdahaleler ──
      const ivAll = [
        ...(sec.interventionsDone ?? []).map((t: string) => ({ title: t, outcome: 'yararli' })),
        ...(sec.interventionsPlanned ?? []).map((t: string) => ({ title: t, outcome: 'notr' })),
      ];
      const interventions = ivAll.map((iv, i) => ({
        romanNum: ROMAN[i] ?? String(i + 1),
        title: iv.title, modality: '', durationMin: null, outcome: iv.outcome,
      }));

      // ── İlişki / Klinik notlar ──
      const relationship = {
        rupture: (sec.ruptureNotes ?? '').trim(),
        supervision: sec.supervisionQuestions ?? [],
        note: (sec.clinicalNotes ?? '').trim(),
      };

      // ── ACT Matrisi (item'ları kategorilerden doldur) ──
      const mxItems = [
        sec.values ?? [],                                                   // 01 toward/internal
        [...(sec.barrierThoughts ?? []), ...(sec.barrierEmotions ?? []), ...(sec.barrierMemories ?? [])], // 02 away/internal
        sec.controlStrategies ?? [],                                        // 03 away/behavior
        [...(sec.actionSteps ?? []), ...(sec.interventionsPlanned ?? [])],  // 04 toward/behavior
      ];
      const actMatrix = {
        ...EMPTY.actMatrix,
        quadrants: (EMPTY.actMatrix.quadrants as any[]).map((q, i) => ({ ...q, items: mxItems[i] ?? [] })),
      };

      // ── Değerler ──
      const values = (sec.values ?? []).map((t: string) => ({ label: t, level: '', strength: 0, note: '' }));

      setData({
        ...EMPTY,
        from: from === 'havuz' ? 'havuz' : EMPTY.from,
        focus: focus === 'seanslar' ? 'seanslar' : null,
        client: {
          ...EMPTY.client,
          vakaNo:           valid ? (c.id ?? id) : id,
          sessionCount:     sessions.length,
          firstName,
          lastName,
          age:              valid && (c.yas ?? c.age) != null ? Number(c.yas ?? c.age) : null,
          gender:           valid ? (c.cinsiyet ?? '') : '',
          occupation:       valid ? (c.meslek ?? c.occupation ?? '') : '',
          tags:             valid && c.sunumSorunu ? String(c.sunumSorunu).split(/[,،]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 4) : [],
          nextSessionLabel: valid ? (c.nextSession ?? '') : '',
          seansUcreti:      valid && (c as any).seansUcreti != null ? Number((c as any).seansUcreti) : null,
          takipSikligi:     valid ? ((c as any).takipSikligi ?? null) : null,
          kisilikTipi:      valid ? ((c as any).kisilikTipi ?? null) : null,
        },
        sessionRecords,
        danisanHedefleri,
        scaleScores,
        fourP,
        flexibility,
        benlikAlgisi,
        heroQuote: { ...EMPTY.heroQuote, description: (fd?.summary ?? '').trim() },
        story,
        problemsGoals,
        strengthsWeaknesses,
        interventions,
        relationship,
        actMatrix,
        values,
      });
    });
  }, [id]);

  return (
    <DanisanRaporu
      data={data}
      backLabel={backLabel}
      onBack={goBack}
      onCreateBriefing={handleBriefing}
      onOpenFormulationHub={() => router.push(`/?tab=formulation&client=${id}`)}
      onOpenStory={() => router.push(`/?tab=formulation&client=${id}`)}
      onSaveBenlik={async (notes) => {
        const fd = fdRef.current;
        if (!fd?.formulationId) return;
        await fetch(`/api/formulations/${fd.formulationId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ benlikAlgisiJson: JSON.stringify(notes) }),
        }).catch(() => {});
      }}
      onSaveFee={async (amount) => {
        await fetch(`/api/clients/${id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seansUcreti: amount }),
        }).catch(() => {});
      }}
      onSaveClientPatch={async (patch) => {
        await fetch(`/api/clients/${id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      }}
      onNav={(t) => { if (t === 'home') router.push('/?tab=home'); else router.push(`/?tab=${t}`); }}
    />
  );
}
