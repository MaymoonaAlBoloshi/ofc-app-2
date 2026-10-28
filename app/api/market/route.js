import { refresh } from '../../../legacy/lib/server/market.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
    try {
        return Response.json(await refresh(), { headers: { 'Cache-Control': 'no-store' } });
    }
    catch {
        return Response.json({ error: 'Market update unavailable' }, { status: 503 });
    }
}
