import { getFormulationByClient, updateFormulationByClient } from '@/lib/queries';
import { ownerOr401 } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

function toAdminShape(f: ReturnType<typeof getFormulationByClient>) {
  if (!f) return null;
  return {
    id: String(f.id),
    patientId: String(f.client_id),
    anaSikayetler: f.ana_sikayetler,
    yonlendirmeNedeni: f.yonlendirme_nedeni,
    predispozan: f.predispozan,
    presipitan: f.presipitan,
    perpetuan: f.perpetuan,
    protektif: f.protektif,
    temelInanclar: f.temel_inanclar,
    araInanclar: f.ara_inanclar,
    basaCikma: f.basa_cikma,
    otomatikDusunceler: f.otomatik_dusunceler,
    duyguBedensel: f.duygu_bedensel,
    davranislar: f.davranislar,
    smartSpesifik: f.smart_spesifik,
    smartOlculebilir: f.smart_olculebilir,
    smartZaman: f.smart_zaman,
    // ACT fields
    presenting_problem: f.presenting_problem,
    client_goal: f.client_goal,
    therapist_goal: f.therapist_goal,
    narrative: f.narrative,
    clinical_notes: f.clinical_notes,
    rupture_notes: f.rupture_notes,
    actKabul: f.act_kabul,
    actDefuzyon: f.act_defuzyon,
    actSimdi: f.act_simdi,
    actBaglam: f.act_baglam,
    actDegerler: f.act_degerler,
    actEylem: f.act_eylem,
    actYaraticiCaresizlik: f.act_yaratici_caresizlik,
    benlikAlgisiJson: (f as any).benlik_algisi_json ?? null,
    updatedAt: f.updated_at,
  };
}

// GET /api/formulations/[id] — id is client_id
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  const f = getFormulationByClient(parseInt(id), uid);
  return Response.json(toAdminShape(f));
}

// PATCH /api/formulations/[id] — id is client_id (GET ile tutarlı; 1:1 formülasyon)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const { id } = await params;
  const data = await request.json();

  // Map camelCase → snake_case
  const mapped: Record<string, unknown> = { ...data };
  const mapping: Record<string, string> = {
    anaSikayetler: 'ana_sikayetler',
    yonlendirmeNedeni: 'yonlendirme_nedeni',
    temelInanclar: 'temel_inanclar',
    araInanclar: 'ara_inanclar',
    basaCikma: 'basa_cikma',
    otomatikDusunceler: 'otomatik_dusunceler',
    duyguBedensel: 'duygu_bedensel',
    smartSpesifik: 'smart_spesifik',
    smartOlculebilir: 'smart_olculebilir',
    smartZaman: 'smart_zaman',
    actKabul: 'act_kabul',
    actDefuzyon: 'act_defuzyon',
    actSimdi: 'act_simdi',
    actBaglam: 'act_baglam',
    actDegerler: 'act_degerler',
    actEylem: 'act_eylem',
    actYaraticiCaresizlik: 'act_yaratici_caresizlik',
    benlikAlgisiJson: 'benlik_algisi_json',
  };
  for (const [cc, sc] of Object.entries(mapping)) {
    if (cc in data) { mapped[sc] = data[cc]; delete mapped[cc]; }
  }

  updateFormulationByClient(parseInt(id), mapped as any, uid);
  return Response.json({ ok: true });
}
