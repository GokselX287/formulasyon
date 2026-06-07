import { getAllEvents, createEvent } from '@/lib/queries';
import { NextRequest } from 'next/server';

function toAdminShape(e: ReturnType<typeof getAllEvents>[number]) {
  return {
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end_time,
    notes: e.notes,
  };
}

export async function GET() {
  return Response.json(getAllEvents().map(toAdminShape));
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  createEvent(data);
  return Response.json({ ok: true });
}
