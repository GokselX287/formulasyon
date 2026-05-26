/**
 * GET /api/seans-context/[clientId]
 *
 * SeansPlanlayiciPanel'in sol paneline beslenen bağlam verisi:
 * - nextSessionNumber  : mevcut seans sayısı + 1
 * - lastSession        : son seanstan özet / ödevler / odak noktaları
 * - recommendations    : formülasyon modalitesine göre önerilen müdahaleler
 */

import { getDb } from '@/lib/db';

type DbRow = Record<string, unknown>;

export async function GET(_req: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const db = getDb();
  const numId = Number(clientId);

  // Son seans
  const lastSeans = db.prepare(`
    SELECT * FROM seanslar WHERE client_id = ? ORDER BY tarih DESC LIMIT 1
  `).get(numId) as DbRow | undefined;

  // Toplam seans sayısı
  const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM seanslar WHERE client_id = ?`).get(numId) as { cnt: number };
  const nextSessionNumber = (countRow?.cnt ?? 0) + 1;

  // Sonraki randevu (takvimden — table may not exist yet)
  let nextEvent: DbRow | undefined;
  try {
    nextEvent = db.prepare(`
      SELECT * FROM events WHERE title LIKE '%' || (
        SELECT alias FROM clients WHERE id = ?
      ) || '%' AND start >= datetime('now') ORDER BY start ASC LIMIT 1
    `).get(numId) as DbRow | undefined;
  } catch { /* table doesn't exist */ }

  // Son seans notları / detay
  let lastSession = null;
  if (lastSeans) {
    let detay: Record<string, unknown> = {};
    try { detay = lastSeans.detay_json ? JSON.parse(lastSeans.detay_json as string) : {}; } catch {}
    let sNotuData: Record<string, unknown> = {};
    try { sNotuData = lastSeans.seans_notu_data ? JSON.parse(lastSeans.seans_notu_data as string) : {}; } catch {}

    lastSession = {
      summary:     (detay.seansOzeti as string) ?? (sNotuData.genel as string) ?? '',
      homework:    Array.isArray(detay.odevler)
        ? (detay.odevler as string[]).map((l: string) => ({ label: l, done: false }))
        : [],
      focusPoints: Array.isArray(detay.odakNoktalar)
        ? detay.odakNoktalar as string[]
        : [],
      avoid:       Array.isArray(detay.kacin) ? detay.kacin as string[] : undefined,
      recommendedModalities: Array.isArray(detay.onerilModaliteler) ? detay.onerilModaliteler : undefined,
    };
  }

  // Formülasyon verisinden modalite önerileri (ACT ağırlıklıysa ACT öner, vb.)
  // formulations table uses client_id, no modalite_json column — derive from ACT fields
  let modaliteList: string[] = [];
  try {
    const formRow = db.prepare(`
      SELECT act_kabul, act_defuzyon, act_simdi, act_baglam, act_degerler, act_eylem
      FROM formulations WHERE client_id = ? ORDER BY updated_at DESC LIMIT 1
    `).get(numId) as DbRow | undefined;
    if (formRow) {
      // If ACT fields are populated, suggest ACT; otherwise no modality filter
      const hasAct = Object.values(formRow).some(v => v && String(v).trim().length > 0);
      if (hasAct) modaliteList = ['ACT'];
    }
  } catch { /* formulations table may have different schema */ }

  // Öneri müdahaleler: client'ın yaşına göre + modaliteye göre
  const clientRow = db.prepare(`SELECT age FROM clients WHERE id = ?`).get(numId) as DbRow | undefined;
  const age = clientRow?.age ? Number(clientRow.age) : null;
  const ageGroup = !age ? 'yetiskin' : age < 7 ? 'cocuk-4-6' : age < 12 ? 'cocuk-7-11' : age < 18 ? 'ergen' : 'yetiskin';

  // Top-5 müdahale: modal uyum + en yüksek use_count
  const allInterventions = db.prepare(
    `SELECT * FROM interventions ORDER BY use_count DESC LIMIT 50`
  ).all() as DbRow[];

  const tryJ = (v: unknown): string[] => {
    if (!v) return [];
    try { return JSON.parse(v as string); } catch { return []; }
  };

  const recommendations = allInterventions
    .filter(iv => {
      const groups = tryJ(iv.age_groups);
      const matchesAge = groups.length === 0 || groups.includes(ageGroup);
      const matchesModality = modaliteList.length === 0 || modaliteList.includes(iv.modality as string);
      return matchesAge && matchesModality;
    })
    .slice(0, 5)
    .map(r => ({
      id: String(r.id),
      title: r.title,
      modality: r.modality,
      problems: tryJ(r.problems),
      ageGroups: tryJ(r.age_groups),
      format: r.format,
      duration: r.duration,
      durationMinutes: r.duration_minutes != null ? Number(r.duration_minutes) : undefined,
      evidence: r.evidence,
      description: r.description,
      protocol: tryJ(r.protocol),
      homeworkVariant: r.homework_variant ?? undefined,
      favorite: Boolean(r.favorite),
      useCount: Number(r.use_count ?? 0),
    }));

  // Sonraki seans tarihi ve saati
  let nextSessionDate = '—';
  let nextSessionTime = '—';
  if (nextEvent?.start) {
    const d = new Date(nextEvent.start as string);
    nextSessionDate = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    nextSessionTime = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }

  return Response.json({
    nextSessionNumber,
    nextSessionDate,
    nextSessionTime,
    lastSession,
    recommendations,
  });
}
