import { startReportJob } from "../../../lib/report-jobs.mjs";
import { readState, mutate } from "../../../lib/store.mjs";
import { suggest, intakeSuggestions, research } from "../../../lib/assist.mjs";
import { sameOrigin, bodyBytes, failure } from "../../../lib/http.mjs";
import { stageById } from "../../../lib/requirements.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request) {
  try {
    sameOrigin(request);
    const c = JSON.parse((await bodyBytes(request)).toString()),
      s = await readState(),
      o = s.opportunities.find((o) => o.id === c.id);
    if (!o) throw Error("Opportunity not found.");
    if (s.version !== c.version)
      throw Error("Workspace changed. Refresh before using assistance.");
    if (c.action === "suggest")
      return Response.json(suggest(o, c.requirementId));
    if (c.action === "intake") return Response.json(intakeSuggestions(o));
    if (c.action === "prepare") {
      const drafts = stageById(o.stage).requirements.map((r) => ({
        id: r.id,
        ...suggest(o, r.id),
      }));
      return Response.json({
        state: await mutate(
          { ...c, action: "draft-assessments", drafts },
          c.version,
        ),
      });
    }
    if (c.action === "report") {
      return Response.json({ job: await startReportJob(c) }, { status: 202 });
    }
    if (c.action === "research") {
      const d = await research(c.url);
      return Response.json({
        state: await mutate(
          { ...c, action: "documents", documents: [d] },
          c.version,
        ),
      });
    }
    throw Error("Unknown assistance action.");
  } catch (e) {
    return failure(e);
  }
}
