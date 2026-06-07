import { getDb } from '@/lib/db';
import { NextRequest } from 'next/server';

// GET /api/mindmap/node/[id]
// Returns SelectedNode shape for FormulasyonPanel
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const node = db
    .prepare('SELECT * FROM mindmap_nodes WHERE id = ?')
    .get(id) as {
      id: string;
      patient_id: number;
      parent_process: string | null;
      label: string | null;
      content: string | null;
      created_at: string;
    } | undefined;

  if (!node) {
    return Response.json({ error: 'Node not found' }, { status: 404 });
  }

  // Related seanslar: find seanslar for this patient where konu/notlar mention the label
  const labelKeyword = (node.label ?? '').split(/[\s"«»""]/).find((w) => w.length > 3) ?? '';
  const relatedSeanslar: { ix: string; date: string; quote: string }[] = [];

  if (labelKeyword) {
    const seanslar = db
      .prepare(
        `SELECT id, tarih, konu, notlar FROM seanslar
         WHERE client_id = ?
           AND (konu LIKE ? OR notlar LIKE ?)
         ORDER BY tarih DESC
         LIMIT 3`
      )
      .all(node.patient_id, `%${labelKeyword}%`, `%${labelKeyword}%`) as {
        id: string;
        tarih: string;
        konu: string | null;
        notlar: string | null;
      }[];

    const romans = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
    seanslar.forEach((s, i) => {
      const excerpt = (s.notlar ?? s.konu ?? '').slice(0, 120);
      relatedSeanslar.push({
        ix:    romans[i] ?? String(i + 1),
        date:  s.tarih,
        quote: excerpt || `${node.label} konusu işlendi.`,
      });
    });
  }

  // Detect gaps: missing content or parent_process
  const gaps: string[] = [];
  if (!node.content || node.content.trim().length < 10) {
    gaps.push('Düğüm içeriği henüz doldurulmamış.');
  }
  if (!node.parent_process) {
    gaps.push('ACT süreci ilişkisi belirsiz.');
  }

  return Response.json({
    id:              String(node.id),
    type:            node.parent_process ?? 'Düğüm',
    label:           node.label          ?? '—',
    content:         node.content        ?? '',
    relatedSessions: relatedSeanslar,
    gaps:            gaps.length > 0 ? gaps : undefined,
  });
}
