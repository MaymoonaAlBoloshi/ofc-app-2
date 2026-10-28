import { preparedDemoReport } from "./demo-report.mjs";
import { reportTargets } from "./report-preparation.mjs";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { dataRoot, readState, mutate } from "./store.mjs";
import { applyCommand, revision } from "./engine.mjs";
import { roles } from "./requirements.mjs";
import { aiDraft } from "./assist.mjs";

// Local Node server worker. Disk status survives page reloads; a server restart
// is reported as interrupted rather than leaving a job permanently running.
const key = Symbol.for("ofc2.reportJobs");
const worker = (globalThis[key] ??= {
  token: randomUUID(),
  queue: Promise.resolve(),
});
const file = (id) => path.join(dataRoot(), "report-jobs", `${id}.json`);
async function save(job) {
  await mkdir(path.dirname(file(job.opportunityId)), { recursive: true });
  const temp = file(job.opportunityId) + "." + randomUUID() + ".tmp";
  await writeFile(temp, JSON.stringify(job));
  await rename(temp, file(job.opportunityId));
}
export async function reportJob(id) {
  if (!/^[a-zA-Z0-9-]+$/.test(id || "")) throw Error("Invalid opportunity.");
  try {
    const job = JSON.parse(await readFile(file(id), "utf8"));
    if (
      job.status === "running" &&
      (job.worker !== worker.token ||
        Date.now() - job.startedAt > 360000 * (job.total || 1))
    ) {
      job.status = "failed";
      job.error =
        "Report preparation was interrupted. Retry or prepare a structured draft.";
      await save(job);
    }
    const { worker: token, ...publicJob } = job;
    return publicJob;
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}
export async function startReportJob(command, draft = aiDraft) {
  const run = worker.queue.then(async () => {
    const s = await readState();
    const o = s.opportunities.find((o) => o.id === command.id);
    if (!o || o.status !== "Active")
      throw Error("Select an active opportunity.");
    if (!roles.includes(command.role)) throw Error("Select a valid profile.");
    const existing = await reportJob(o.id);
    if (existing?.status === "running") return existing;
    if (s.version !== command.version)
      throw Error("Workspace changed. Refresh before preparing a report.");
    const targets = reportTargets(o, command);
    const job = {
      total: targets.length,
      completed: 0,
      id: randomUUID(),
      opportunityId: o.id,
      status: "running",
      startedAt: Date.now(),
      worker: worker.token,
    };
    await save(job);
    void (async () => {
      try {
        const drafts = [];
        for (const target of targets) {
          job.currentReport = target.report;
          await save(job);
          const view = { ...o, stage: target.id };
          const prepared = command.demo
            ? preparedDemoReport(view)
            : { sections: await draft(view) };
          drafts.push({ stage: target.id, ...prepared });
          job.completed = drafts.length;
          await save(job);
        }
        const next = await mutate(
          (input) =>
            drafts.reduce(
              (state, result) =>
                applyCommand(state, {
                  id: o.id,
                  role: command.role,
                  action: "report",
                  reportStage: result.stage,
                  sections: result.sections,
                  presentation: result.presentation,
                  demoTemplate: result.demoTemplate,
                  mode: command.demo ? "Prepared demo report" : "Siraaj draft",
                }),
              input,
            ),
          (current) => {
            const latest = current.opportunities.find(
              (item) => item.id === o.id,
            );
            if (
              !latest ||
              latest.stage !== o.stage ||
              latest.status !== o.status ||
              latest.period !== o.period ||
              revision(latest) !== revision(o) ||
              latest.reports.length !== o.reports.length
            )
              throw Error(
                "The report inputs or gate changed while Siraaj was working. Prepare a new draft using the current evidence.",
              );
          },
        );
        job.reportId = next.opportunities
          .find((item) => item.id === o.id)
          .reports.at(-1).id;
        job.status = "completed";
      } catch (e) {
        job.status = "failed";
        job.error =
          e.message ||
          "Report preparation failed. Retry or prepare a structured draft.";
      }
      job.finishedAt = Date.now();
      await save(job);
    })().catch((e) =>
      console.error("Could not save report job status:", e.message),
    );
    const { worker: token, ...publicJob } = job;
    return publicJob;
  });
  worker.queue = run.catch(() => {});
  return run;
}
