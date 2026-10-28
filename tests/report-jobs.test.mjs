import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { mutate, readState } from "../lib/store.mjs";
import { startReportJob, reportJob } from "../lib/report-jobs.mjs";
import { stageById } from "../lib/requirements.mjs";
import { POST as workspacePost } from "../app/api/workspace/route.js";
import { aiDraft } from "../lib/assist.mjs";

async function finished(id) {
  for (let i = 0; i < 100; i++) {
    const job = await reportJob(id);
    if (job.status !== "running") return job;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw Error("Job did not finish");
}
const sections = (o) =>
  stageById(o.stage).requirements.map((r) => ({
    id: r.id,
    title: r.title,
    text: "Evidence needed: complete assessment.",
    sourceIds: [],
  }));

test("background reports allow task edits, deduplicate starts, and reject changed source inputs", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "ofc2-jobs-"));
  process.env.OFC2_DATA_DIR = dir;
  try {
    let s = await mutate(
      { action: "create", role: "Investment", name: "Background report" },
      0,
    );
    const o = s.opportunities[0];
    let release,
      calls = 0;
    const draft = async (opportunity) => {
      calls++;
      await new Promise((resolve) => {
        release = resolve;
      });
      return sections(opportunity);
    };
    const command = { id: o.id, role: "Investment", version: s.version };
    const first = await startReportJob(command, draft);
    assert.equal(first.status, "running");
    assert.equal((await startReportJob(command, draft)).id, first.id);
    assert.equal(calls, 1);
    s = await mutate(
      {
        action: "task",
        id: o.id,
        role: "Investment",
        taskId: o.tasks[0].id,
        owner: "Investment",
        due: "2026-12-01",
        note: "Updated while Siraaj prepares the report.",
      },
      s.version,
    );
    assert.equal((await reportJob(o.id)).status, "running");
    release();
    assert.equal((await finished(o.id)).status, "completed");
    s = await readState();
    assert.equal(s.opportunities[0].reports.length, 1);
    assert.equal(s.opportunities[0].tasks[0].due, "2026-12-01");
    // A task form opened before the report finished still saves without
    // discarding either the task changes or the completed report.
    const staleVersion = s.version - 1;
    const expectedTask = structuredClone(s.opportunities[0].tasks[0]);
    const edit = {
      action: "task",
      id: o.id,
      role: "Investment",
      taskId: expectedTask.id,
      owner: "Investment",
      due: "2026-12-02",
      note: "Saved after the report completed.",
      version: staleVersion,
      expectedTask,
      expectedStage: o.stage,
      expectedStatus: o.status,
    };
    const response = await workspacePost(
      new Request("http://localhost/api/workspace", {
        method: "POST",
        body: JSON.stringify(edit),
      }),
    );
    assert.equal(response.status, 200);
    s = await response.json();
    assert.equal(s.opportunities[0].reports.length, 1);
    assert.equal(s.opportunities[0].tasks[0].due, "2026-12-02");
    const conflict = await workspacePost(
      new Request("http://localhost/api/workspace", {
        method: "POST",
        body: JSON.stringify(edit),
      }),
    );
    assert.equal(conflict.status, 409);

    await startReportJob({ ...command, version: s.version }, draft);
    s = await mutate(
      {
        action: "documents",
        id: o.id,
        role: "Investment",
        documents: [
          {
            id: "new-source",
            name: "Source.txt",
            hash: "source",
            text: "Updated evidence",
            warnings: [],
            kind: "Source",
          },
        ],
      },
      s.version,
    );
    release();
    const failed = await finished(o.id);
    assert.equal(failed.status, "failed");
    assert.match(failed.error, /inputs or gate changed/);
    assert.equal((await readState()).opportunities[0].reports.length, 1);
    const statusPath = path.join(dir, "report-jobs", o.id + ".json");
    const status = JSON.parse(await readFile(statusPath, "utf8"));
    await writeFile(
      statusPath,
      JSON.stringify({
        ...status,
        status: "running",
        worker: "previous-server",
      }),
    );
    assert.match((await reportJob(o.id)).error, /interrupted/);
    await startReportJob({ ...command, version: s.version }, async () => {
      throw Error("Provider timed out");
    });
    assert.match((await finished(o.id)).error, /Provider timed out/);
  } finally {
    delete process.env.OFC2_DATA_DIR;
    await rm(dir, { recursive: true, force: true });
  }
});

test("provider timeouts give actionable errors with no draft", async () => {
  const env = {
    SIRAAJ_API_KEY: "test",
    SIRAAJ_BASE_URL: "https://provider.invalid",
    SIRAAJ_MODEL: "test",
  };
  const o = { stage: "sg1", documents: [], facts: {}, requirements: {} };
  await assert.rejects(
    () =>
      aiDraft(o, env, async () => {
        throw new DOMException("Timed out", "TimeoutError");
      }),
    /five minutes.*No report was saved/,
  );
  await assert.rejects(
    () => aiDraft(o, env, async () => new Response("", { status: 504 })),
    /provider timed out/,
  );
});
