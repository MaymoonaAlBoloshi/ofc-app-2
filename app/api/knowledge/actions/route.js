import { openKnowledge, createAction } from '../../../../legacy/lib/server/knowledge.mjs';
export const runtime = 'nodejs';
export async function POST(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('origin');
    const expected = `${url.protocol}//${request.headers.get('host') || url.host}`;
    if (origin !== expected)
        return Response.json({ error: 'Save tasks from the OFC site.' }, { status: 403 });
    if (!request.headers.get('content-type')?.startsWith('application/json'))
        return Response.json({ error: 'Expected JSON.' }, { status: 415 });
    const reader = request.body?.getReader();
    const chunks = [];
    let size = 0;
    if (reader) {
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                size += value.length;
                if (size > 16000) {
                    await reader.cancel();
                    return Response.json({ error: 'Task is too large.' }, { status: 413 });
                }
                chunks.push(value);
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    const db = openKnowledge();
    try {
        return Response.json(createAction(db, JSON.parse(Buffer.concat(chunks).toString('utf8'))), {
            status: 201,
            headers: { 'Cache-Control': 'no-store' },
        });
    }
    catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : 'Could not save task.' }, { status: 400 });
    }
    finally {
        db.close();
    }
}
