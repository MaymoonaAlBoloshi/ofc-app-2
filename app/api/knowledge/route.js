import { readState } from '../../../lib/store.mjs';
import { openKnowledge, knowledgeStatus, listActions } from '../../../legacy/lib/server/knowledge.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request) {
    const id = new URL(request.url).searchParams.get('opportunity');
    if (id) {
        const o = (await readState()).opportunities.find(item => item.id === id);
        if (!o) return Response.json({error: 'Opportunity not found.'}, {status: 404});
        return Response.json({documents: o.documents.length, coverage: 'Sources and tasks for ' + o.name + '.', actions: o.tasks}, {headers: {'Cache-Control': 'no-store'}});
    }
    const db = openKnowledge();
    try {
        return Response.json({ ...knowledgeStatus(db), actions: listActions(db) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    finally {
        db.close();
    }
}
