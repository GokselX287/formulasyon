import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Ortak Çalışma (collaboration) — YEREL kalıcılık.
// Tek dosyada {partners, works, comments} tutulur. İleride gerçek çok-kullanıcı
// senkronu için sunucuya/paylaşılan API'ye taşınacak; arayüz aynı kalır.
export const dynamic = 'force-dynamic';

const FILE = join(process.cwd(), 'data-collab.json');
type Doc = { partners: unknown[]; works: unknown[]; comments: unknown[] };
const EMPTY: Doc = { partners: [], works: [], comments: [] };

function read(): Doc {
  try {
    if (existsSync(FILE)) {
      const j = JSON.parse(readFileSync(FILE, 'utf8'));
      return {
        partners: Array.isArray(j.partners) ? j.partners : [],
        works: Array.isArray(j.works) ? j.works : [],
        comments: Array.isArray(j.comments) ? j.comments : [],
      };
    }
  } catch { /* yoksay → boş */ }
  return EMPTY;
}

export async function GET() {
  return NextResponse.json(read());
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const doc: Doc = {
      partners: Array.isArray(body?.partners) ? body.partners : [],
      works: Array.isArray(body?.works) ? body.works : [],
      comments: Array.isArray(body?.comments) ? body.comments : [],
    };
    writeFileSync(FILE, JSON.stringify(doc), 'utf8');
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
