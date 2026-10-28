import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { preparedDemoReport, demoReport } from "../lib/demo-report.mjs";
import { stages } from "../lib/requirements.mjs";
import { seed, applyCommand } from "../lib/engine.mjs";
import { reportHtml } from "../lib/report-html.mjs";

test("all six authored demo reports load without AI, map sources and preserve narrative and presentation", async () => {
  const raw = JSON.parse(readFileSync("fixtures/reports/sg2.json", "utf8"));
  const names = [
    ...new Set(Object.values(raw.sections).flatMap((s) => s.sourceNames)),
  ];
  const documents = names.map((name, i) => ({ id: "source-" + i, name }));
  for (const stage of stages) {
    const o = { stage: stage.id, documents };
    const result = preparedDemoReport(o);
    assert.equal(result.sections.length, stage.requirements.length);
    assert.ok(result.presentation.summary.length > 450);
    assert.equal(result.presentation.metrics.length, 4);
    assert.equal(result.presentation.actions.length, 3);
    assert.match(result.presentation.subject, /Oman Refreshment/);
    assert.ok(
      result.sections.every(
        (s, i) =>
          s.id === stage.requirements[i].id &&
          s.text.length > 250 &&
          s.sourceNames.length,
      ),
    );
    assert.ok(
      result.sections.every(
        (s) =>
          !/^Source:|Assessment and conclusion: complete after|^Evidence needed:/.test(
            s.text,
          ),
      ),
    );
    assert.ok(!/[\u2013\u2014]/.test(JSON.stringify(result)));
    assert.deepEqual(
      await demoReport(o, () => {
        throw Error("AI must not be called");
      }),
      result.sections,
    );
  }
  const first = preparedDemoReport({ stage: "sg2", documents });
  assert.ok(first.sections[0].sourceIds.length);
  const second = preparedDemoReport({
    stage: "sg2",
    documents: documents.map((d) => ({ ...d, id: "other-" + d.id })),
  });
  assert.notEqual(
    first.sections[0].sourceIds[0],
    second.sections[0].sourceIds[0],
  );
  const detached = preparedDemoReport({ stage: "sg2", documents: [] });
  assert.deepEqual(detached.sections[0].sourceIds, []);
  assert.ok(detached.sections[0].sourceNames.length);
});

test("prepared report HTML includes the executive brief and preserves it after demo review assumptions", () => {
  let state = applyCommand(seed(), {
    action: "create",
    role: "Investment",
    name: "Demo <script>test</script>",
  });
  const o = state.opportunities[0];
  state = applyCommand(state, {
    action: "report",
    id: o.id,
    role: "Investment",
    ...preparedDemoReport(o),
  });
  state = applyCommand(state, {
    action: "demo-assume-reviewed",
    id: o.id,
    role: "Investment",
  });
  const report = state.opportunities[0].reports.at(-1);
  assert.equal(report.demoTemplate, true);
  assert.match(report.presentation.summary, /Oman Refreshment/);
  const html = reportHtml(state.opportunities[0], report);
  for (const label of [
    "Executive summary",
    "Recommendation",
    "Next actions",
    "Report sections",
    "OMR 63.37m",
  ])
    assert.ok(html.includes(label));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>test"));
});
