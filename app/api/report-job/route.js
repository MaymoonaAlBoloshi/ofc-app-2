import { reportJob, startReportJob } from "../../../lib/report-jobs.mjs";
import { sameOrigin, bodyBytes, failure } from "../../../lib/http.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request) {
  try {
    return Response.json({
      job: await reportJob(new URL(request.url).searchParams.get("id")),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request) {
  try {
    sameOrigin(request);
    const command = JSON.parse((await bodyBytes(request)).toString());
    return Response.json(
      { job: await startReportJob(command) },
      { status: 202 },
    );
  } catch (e) {
    return failure(e);
  }
}
