import { opportunitySource } from '../../../../lib/chat-context.mjs';
import { openKnowledge, source } from '../../../../legacy/lib/server/knowledge.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request) {
    const id = new URL(request.url).searchParams.get('id') || '';
    if (id.startsWith('workspace:') || id.startsWith('opportunity:')) {
      const text = await opportunitySource(id);
      return new Response(text || 'Evidence not found', {status:text ? 200 : 404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    const db = openKnowledge();
    try {
        const row = source(db, new URL(request.url).searchParams.get('id') || '');
        if (!row)
            return new Response('Evidence not found', { status: 404 });
        return new Response(`${row.entity}\n\nDocument: ${row.path}\nLocation: ${row.locator}\nDocument SHA-256: ${row.hash}\nReview status: ${row.status}\n\n${row.text}\n\nThis is a curated excerpt or calculation from the copied source. Original files remain unchanged.`, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-store',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    }
    finally {
        db.close();
    }
}
