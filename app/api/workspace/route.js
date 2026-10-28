import { prepareReportSet } from "../../../lib/report-preparation.mjs";
import { prepareDemoOpportunity } from "../../../lib/demo-pack.mjs";
import { readState, mutate } from "../../../lib/store.mjs";
import { sameOrigin, bodyBytes, failure } from "../../../lib/http.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await readState(), {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(request) {
  try {
    sameOrigin(request);
    const { version, ...command } = JSON.parse(
      (await bodyBytes(request)).toString(),
    );
    if (["documents", "draft-assessments"].includes(command.action))
      throw Error("Use the upload or assistance endpoint for this action.");
    if (command.action === "create" && command.demoPack === true) {
      return Response.json(
        await mutate(await prepareDemoOpportunity(command), version),
      );
    }
    if (command.action === "prepare-reports") {
      return Response.json(
        await mutate((state) => prepareReportSet(state, command), version),
      );
    }
    const expected =
      command.action === "task" && command.expectedTask
        ? (state) => {
            const opportunity = state.opportunities.find(
              (o) => o.id === command.id,
            );
            const task = opportunity?.tasks.find(
              (t) => t.id === command.taskId,
            );
            if (
              !task ||
              opportunity.stage !== command.expectedStage ||
              opportunity.status !== command.expectedStatus ||
              JSON.stringify(task) !== JSON.stringify(command.expectedTask)
            )
              throw Error(
                "This task or gate changed. Refresh before saving your edit.",
              );
          }
        : version;
    return Response.json(await mutate(command, expected));
  } catch (e) {
    return failure(e);
  }
}
