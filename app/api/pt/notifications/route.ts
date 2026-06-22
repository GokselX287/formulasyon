import { computeNotifications } from '@/lib/pt-queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(computeNotifications());
}
