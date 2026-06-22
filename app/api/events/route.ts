import { getAllEvents, createEvent } from '@/lib/queries';
import { ownerOr401 } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

function toAdminShape(e: ReturnType<typeof getAllEvents>[number]) {
  return {
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end_time,
    notes: e.notes,
  };
}

export async function GET(request: NextRequest) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  return Response.json(getAllEvents(uid).map(toAdminShape));
}

export async function POST(request: NextRequest) {
  const uid = ownerOr401(request); if (uid instanceof NextResponse) return uid;
  const data = await request.json();
  createEvent(data, uid);
  return Response.json({ ok: true });
}
