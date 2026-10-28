import { openKnowledge } from '../../../../legacy/lib/server/knowledge.mjs';
import { getReport, ReportError } from '../../../../legacy/lib/server/reports.mjs';
import { renderReportPdf } from '../../../../legacy/lib/server/report-pdf.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request) {
    const db = openKnowledge();
    try {
        const url = new URL(request.url);
        const report = getReport(db, url.searchParams.get('id'), url.searchParams.get('version'));
        const pdf = await renderReportPdf(report);
        return new Response(new Uint8Array(pdf), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="ONLDC-${report.scope.period}-v${report.version}.pdf"`,
                'Cache-Control': 'no-store',
            },
        });
    }
    catch (error) {
        return Response.json({
            error: error instanceof ReportError
                ? error.message
                : 'PDF export is unavailable. Please try again.',
        }, { status: error instanceof ReportError ? error.status : 503 });
    }
    finally {
        db.close();
    }
}
