import { openKnowledge } from '../../../legacy/lib/server/knowledge.mjs';
import { reportCoverage, getReport, listReports, generateReport, saveReport, refineReport, ReportError, } from '../../../legacy/lib/server/reports.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
function failure(error) {
    return json({
        error: error instanceof ReportError
            ? error.message
            : 'The report could not be processed. Please try again.',
    }, error instanceof ReportError ? error.status : 500);
}
export async function GET(request) {
    const db = openKnowledge();
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        return json(id ? getReport(db, id, url.searchParams.get('version')) : { reports: listReports(db) });
    }
    catch (error) {
        return failure(error);
    }
    finally {
        db.close();
    }
}
export async function POST(request) {
    const url = new URL(request.url), origin = request.headers.get('origin'), host = request.headers.get('host') || url.host;
    if (origin !== `${url.protocol}//${host}`)
        return json({ error: 'Open the report builder from the OFC site.' }, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json'))
        return json({ error: 'Expected a JSON request.' }, 415);
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
                if (size > 100000) {
                    await reader.cancel();
                    return json({ error: 'The report request is too large.' }, 413);
                }
                chunks.push(value);
            }
        }
        catch {
            return json({ error: 'The request was interrupted. Please try again.' }, 400);
        }
        finally {
            reader.releaseLock();
        }
    }
    let input;
    try {
        input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!input || typeof input !== 'object')
            throw Error();
    }
    catch {
        return json({ error: 'Invalid report request.' }, 400);
    }
    const db = openKnowledge();
    try {
        switch (input.action) {
            case 'coverage':
                return json(reportCoverage(db, input.scope));
            case 'generate':
                return json(await generateReport(db, input));
            case 'save':
                return json(saveReport(db, input));
            case 'refine':
                return json(await refineReport(db, input));
            default:
                return json({ error: 'Unknown report action.' }, 400);
        }
    }
    catch (error) {
        return failure(error);
    }
    finally {
        db.close();
    }
}
