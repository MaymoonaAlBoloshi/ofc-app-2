import { prepareReportSet } from "../lib/report-preparation.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  applyCommand,
  readiness,
  latestReport,
  reviewReady,
} from "../lib/engine.mjs";
import {
  stageById,
  reportReviewRoles,
  approvalRoles,
} from "../lib/requirements.mjs";
function setup() {
  let s = applyCommand(seed(), {
    action: "create",
    role: "Investment",
    name: "Test investment",
  });
  s = applyCommand(s, {
    action: "documents",
    role: "Investment",
    id: s.opportunities[0].id,
    documents: [
      {
        id: "source",
        name: "Signed evidence.txt",
        hash: "test",
        text: "Verified project evidence",
        kind: "Source",
        warnings: [],
      },
    ],
  });
  return applyCommand(s, {
    action: "review-document",
    role: "Investment",
    id: s.opportunities[0].id,
    documentId: "source",
    kind: "Source",
    note: "Checked signed project evidence and its scope.",
  });
}
function cmd(s, action, values = {}) {
  return applyCommand(s, {
    id: s.opportunities[0].id,
    role: "Investment",
    action,
    ...values,
  });
}
function complete(s) {
  if (s.opportunities[0].stage === "monitoring") {
    s = cmd(s, "register", {
      role: "Finance",
      kind: "financials",
      data: {
        period: s.opportunities[0].period,
        revenue: 100,
        budget: 120,
        ebitda: 20,
        adjustments: 2,
        allocated: 50,
        utilized: 40,
        sourceId: "source",
        note: "Simulation: adjustments reflect one-off costs.",
      },
    });
    s = cmd(s, "register", {
      role: "Asset Management",
      kind: "board",
      data: {
        name: "Test representative",
        position: "Director",
        appointed: "2026-10-28",
      },
    });
  }
  for (const r of stageById(s.opportunities[0].stage).requirements)
    s = cmd(s, "requirement", {
      role: r.owner,
      requirementId: r.id,
      status: "Reviewed",
      narrative:
        "The responsible reviewer verified the specified requirement against the linked project evidence.",
      sourceIds: ["source"],
    });
  s = cmd(s, "report");
  for (const role of reportReviewRoles[s.opportunities[0].stage])
    s = cmd(s, "review-report", {
      role,
      reportId: latestReport(s.opportunities[0]).id,
      note: "Reviewed the report, source evidence and conclusion.",
    });
  return cmd(s, "submit-report", {
    reportId: latestReport(s.opportunities[0]).id,
  });
}
function approve(s, values = {}) {
  return cmd(s, "decision", {
    role: approvalRoles[s.opportunities[0].stage][0],
    outcome: "Approve",
    meetingDate: "2026-10-28",
    votes: "Unanimous, all members present",
    note: "Approved after the required evidence and report reviews.",
    ...values,
  });
}
test("all stages enforce their evidence, owners, report chain and archived decisions", () => {
  let s = setup();
  for (const stage of [
    "sg1",
    "sg2",
    "sg3",
    "handover",
    "delivery",
    "monitoring",
  ]) {
    assert.equal(s.opportunities[0].stage, stage);
    assert.throws(() => approve(s), /Cannot approve/);
    s = complete(s);
    assert.deepEqual(readiness(s.opportunities[0]).blockers, []);
    s = approve(s);
  }
  const o = s.opportunities[0];
  assert.equal(o.status, "Monitoring");
  assert.equal(o.assetOwner, "Asset Management");
  assert.equal(o.decisions.length, 6);
  assert.equal(o.reports.length, 6);
  assert.ok(o.reports.every((r) => r.status === "Approved"));
  s = cmd(s, "new-period", { role: "Asset Management", period: "2027-Q1" });
  assert.equal(s.opportunities[0].status, "Active");
  assert.equal(reviewReady(s.opportunities[0]).filter((r) => r.done).length, 0);
  assert.equal(s.opportunities[0].reports.length, 6);
});
test("SG1 rejects stale PIN and wrong decision authority", () => {
  let s = complete(setup());
  assert.throws(() => approve(s, { role: "Investment" }), /authority/);
  s = cmd(s, "facts", { facts: { overview: "Changed scope" } });
  assert.throws(() => approve(s), /Refresh report/);
});
test("SG2 rejects minimal assessment and requires both CEO and CIO report reviews", () => {
  let s = approve(complete(setup()));
  assert.throws(() => approve(s), /Cannot approve/);
  for (const r of stageById("sg2").requirements)
    s = cmd(s, "requirement", {
      role: r.owner,
      requirementId: r.id,
      status: "Reviewed",
      narrative:
        "Reviewed all evidence and the requirements for this investment.",
      sourceIds: ["source"],
    });
  s = cmd(s, "report");
  s = cmd(s, "review-report", {
    role: "CEO",
    reportId: latestReport(s.opportunities[0]).id,
    note: "Reviewed the pre-feasibility report.",
  });
  assert.throws(
    () =>
      cmd(s, "submit-report", {
        reportId: latestReport(s.opportunities[0]).id,
      }),
    /All required/,
  );
});
test("templates, wrong reviewers and mandatory waivers cannot satisfy requirements", () => {
  let s = setup();
  assert.throws(
    () =>
      cmd(s, "requirement", {
        requirementId: "economics",
        role: "Investment",
        status: "Reviewed",
        narrative: "Reviewed all finance evidence for the investment.",
        sourceIds: ["source"],
      }),
    /Finance/,
  );
  assert.throws(
    () =>
      cmd(s, "requirement", {
        requirementId: "economics",
        role: "Finance",
        status: "Not applicable",
        narrative: "This requirement is not applicable to our investment.",
      }),
    /cannot be waived/,
  );
  s = cmd(s, "review-document", {
    documentId: "source",
    kind: "Template",
    note: "This file is an uncompleted template only.",
  });
  assert.throws(
    () =>
      cmd(s, "requirement", {
        requirementId: "sourcing",
        status: "Reviewed",
        narrative: "Reviewed all evidence for the investment sources.",
        sourceIds: ["source"],
      }),
    /Templates/,
  );
});
test("SG3 consultant appointment requires Finance budget confirmation first", () => {
  let s = approve(complete(approve(complete(setup()))));
  assert.equal(s.opportunities[0].stage, "sg3");
  assert.throws(
    () =>
      cmd(s, "requirement", {
        requirementId: "procurement",
        status: "Reviewed",
        narrative: "Consultant was appointed following procurement review.",
        sourceIds: ["source"],
      }),
    /Finance must/,
  );
});
test("conditional approvals need details and block the specified release point", () => {
  let s = complete(setup());
  assert.throws(
    () => approve(s, { outcome: "Approve with conditions" }),
    /at least one/,
  );
  s = approve(s, {
    outcome: "Approve with conditions",
    conditions: [
      {
        text: "Receive signed financing confirmation",
        owner: "Finance",
        due: "2026-12-01",
        before: "Next gate",
      },
    ],
  });
  s = complete(s);
  assert.throws(() => approve(s), /Resolve conditions/);
  assert.throws(
    () =>
      cmd(s, "condition", {
        conditionId: s.opportunities[0].conditions[0].id,
        note: "Signed agreement verified and accepted.",
        documentId: "source",
      }),
    /Finance/,
  );
  s = cmd(s, "condition", {
    role: "Finance",
    conditionId: s.opportunities[0].conditions[0].id,
    note: "Signed agreement verified and accepted.",
    documentId: "source",
  });
  s = complete(s);
  assert.equal(approve(s).opportunities[0].stage, "sg3");
});
test("information requests preserve history and require fresh report review", () => {
  let s = complete(setup());
  s = approve(s, {
    outcome: "Request information",
    note: "Please provide updated financial assumptions and evidence.",
  });
  assert.equal(s.opportunities[0].stage, "sg1");
  assert.equal(latestReport(s.opportunities[0]).status, "Returned");
  assert.throws(() => approve(s), /Cannot approve/);
  assert.ok(
    s.opportunities[0].tasks.some(
      (t) => t.title === "Respond to information request",
    ),
  );
});
test("closure has stage-specific authority and retains all evidence", () => {
  let s = setup();
  s = cmd(s, "request-closure", {
    outcome: "Deferred",
    note: "Investment deferred because the proposed partner has withdrawn.",
    commitments:
      "Retain all evidence and review any outstanding consulting fees.",
  });
  assert.equal(s.opportunities[0].status, "Active");
  assert.throws(
    () => cmd(s, "approve-closure", { role: "CEO", note: "Agree to defer." }),
    /CIO/,
  );
  s = cmd(s, "approve-closure", {
    role: "CIO",
    note: "Approved deferral after reviewing the justification.",
  });
  assert.equal(s.opportunities[0].status, "Deferred");
  assert.equal(s.opportunities[0].documents.length, 1);
  assert.throws(() => cmd(s, "report"), /Reopen/);
  s = cmd(s, "reopen", {
    role: "CIO",
    note: "Partner has supplied new evidence and requested reconsideration.",
  });
  assert.equal(s.opportunities[0].status, "Active");
});
test("editing a report makes a new unreviewed version without overwriting history", () => {
  let s = complete(setup()),
    r = latestReport(s.opportunities[0]);
  s = cmd(s, "edit-report", {
    reportId: r.id,
    sections: r.sections.map((x, i) =>
      i
        ? x
        : {
            ...x,
            text: "Updated sourcing narrative with verified project evidence.",
          },
    ),
  });
  assert.equal(latestReport(s.opportunities[0]).version, 2);
  assert.equal(latestReport(s.opportunities[0]).reviews.length, 0);
  assert.equal(s.opportunities[0].reports[0].status, "Submitted");
  assert.throws(() => approve(s), /Cannot approve/);
});

test("execution and monitoring conditions block their specific release points", () => {
  let s = approve(complete(approve(complete(setup()))));
  s = approve(complete(s), {
    outcome: "Approve with conditions",
    conditions: [
      {
        text: "Resolve execution funding commitment",
        owner: "Finance",
        due: "2026-12-01",
        before: "Execution",
      },
      {
        text: "Confirm operations monitoring protocol",
        owner: "Operations",
        due: "2026-12-01",
        before: "Monitoring",
      },
    ],
  });
  s = complete(s);
  assert.throws(() => approve(s), /before execution/);
  s = cmd(s, "condition", {
    role: "Finance",
    conditionId: s.opportunities[0].conditions[0].id,
    note: "Simulation: financing commitment has been verified.",
    documentId: "source",
  });
  s = approve(complete(s));
  assert.equal(s.opportunities[0].stage, "delivery");
  s = complete(s);
  assert.throws(() => approve(s), /before monitoring/);
  s = cmd(s, "condition", {
    role: "Operations",
    conditionId: s.opportunities[0].conditions[1].id,
    note: "Simulation: monitoring protocol has been verified.",
    documentId: "source",
  });
  assert.equal(approve(complete(s)).opportunities[0].stage, "monitoring");
});

test("returned reports cannot be resubmitted without a new version", () => {
  let s = approve(complete(setup()), {
    outcome: "Request information",
    note: "Please provide a revised assessment of market assumptions.",
  });
  assert.throws(
    () =>
      cmd(s, "review-report", {
        role: "Investment",
        reportId: latestReport(s.opportunities[0]).id,
        note: "Reviewed the same returned report again.",
      }),
    /new report version/,
  );
});

test("demo shortcut keeps evidence unchanged and prepares a labeled version for review and decision", () => {
  let s = applyCommand(seed(), {
    action: "create",
    role: "Investment",
    name: "Fast demo",
  });
  const id = s.opportunities[0].id;
  s = applyCommand(s, { action: "report", id, role: "Investment" });
  const original = structuredClone(s.opportunities[0].reports[0]);
  s = applyCommand(s, {
    action: "demo-assume-reviewed",
    id,
    role: "Investment",
  });
  const o = s.opportunities[0],
    report = latestReport(o);
  assert.ok(reviewReady(o).every((r) => r.done && r.saved.demoAssumed));
  assert.deepEqual(o.documents, []);
  assert.deepEqual(o.reports[0], original);
  assert.equal(report.demoAssumed, true);
  assert.equal(report.version, 2);
  assert.equal(report.status, "Draft");
  assert.ok(
    report.sections.some((section) =>
      section.text.includes("Evidence needed:"),
    ),
  );
  assert.ok(s.events.some((e) => e.action === "Reviews assumed for demo"));
  s = applyCommand(s, {
    action: "review-report",
    id,
    role: "Investment",
    reportId: report.id,
    note: "Simulated report review for demonstration.",
  });
  s = applyCommand(s, {
    action: "submit-report",
    id,
    role: "Investment",
    reportId: report.id,
  });
  s = applyCommand(s, {
    action: "decision",
    id,
    role: "CEO",
    outcome: "Approve",
    note: "Simulated gate approval for demonstration.",
  });
  assert.equal(s.opportunities[0].stage, "sg2");
  assert.ok(reviewReady(s.opportunities[0]).some((r) => !r.done));
});

test("report sets include reached stages, preserve approvals and prevent future-stage reports", () => {
  let s = applyCommand(seed(), {
    action: "create",
    role: "Investment",
    name: "Report set",
  });
  const id = s.opportunities[0].id;
  const command = (action, values = {}) => {
    s = applyCommand(s, { action, id, role: "Investment", ...values });
  };
  command("demo-assume-reviewed");
  const first = latestReport(s.opportunities[0]);
  command("review-report", {
    reportId: first.id,
    note: "Demonstration review confirmed.",
  });
  command("submit-report", { reportId: first.id });
  command("decision", {
    role: "CEO",
    outcome: "Approve",
    note: "Demonstration approval confirmed.",
  });
  const archived = structuredClone(s.opportunities[0].reports[0]);
  const decisions = structuredClone(s.opportunities[0].decisions);
  s = prepareReportSet(s, { id, role: "Asset Management", scope: "through" });
  let o = s.opportunities[0];
  assert.equal(o.stage, "sg2");
  assert.deepEqual(
    o.reports.map((r) => r.stage),
    ["sg1", "sg1", "sg2"],
  );
  assert.deepEqual(o.reports[0], archived);
  assert.deepEqual(o.decisions, decisions);
  assert.equal(
    o.reports.at(-1).sections.length,
    stageById("sg2").requirements.length,
  );
  s = prepareReportSet(s, {
    id,
    role: "Asset Management",
    reportStage: "sg2",
    demo: true,
  });
  assert.match(
    s.opportunities[0].reports.at(-1).mode,
    /Prepared ORCI demo report/,
  );
  assert.ok(
    s.opportunities[0].reports
      .at(-1)
      .sections.every((r) => r.text.length > 250 && r.sourceNames.length),
  );
  assert.throws(
    () => prepareReportSet(s, { id, role: "Investment", reportStage: "sg3" }),
    /up to the current gate/,
  );
  assert.throws(
    () =>
      applyCommand(s, {
        action: "report",
        id,
        role: "Investment",
        reportStage: "sg3",
      }),
    /up to the current gate/,
  );
});

test("demo approval mode supports one profile across SG1 and SG2 with an explicit audit trail", () => {
  let s = applyCommand(seed(), {
    action: "create",
    role: "Investment",
    name: "One profile demo",
  });
  const id = s.opportunities[0].id;
  for (const stage of ["sg1", "sg2"]) {
    const cmd = (action, values = {}) => {
      s = applyCommand(s, { action, id, role: "Investment", ...values });
    };
    cmd("demo-assume-reviewed");
    const report = latestReport(s.opportunities[0]);
    cmd("review-report", {
      reportId: report.id,
      note: "Confirmed for demonstration purposes.",
      demoApproval: true,
    });
    const reviewed = latestReport(s.opportunities[0]);
    assert.ok(
      reportReviewRoles[stage].every((role) =>
        reviewed.reviews.some(
          (r) =>
            r.role === role && r.demoAssumed && r.performedBy === "Investment",
        ),
      ),
    );
    cmd("submit-report", { reportId: report.id });
    assert.throws(
      () =>
        applyCommand(s, {
          action: "decision",
          id,
          role: "Investment",
          outcome: "Approve",
          note: "Demo approval confirmed.",
        }),
      /Decision authority/,
    );
    cmd("decision", {
      outcome: "Approve",
      note: "Demo approval confirmed.",
      meetingDate: "2026-10-28",
      votes: "Simulated approval",
      demoApproval: true,
    });
    assert.equal(s.opportunities[0].decisions.at(-1).demoApproval, true);
  }
  assert.equal(s.opportunities[0].stage, "sg3");
  assert.ok(s.events.some((e) => e.action === "Demo decision: Approve"));
});

test("demo submission records missing reviews without fabricating their completion", () => {
  let s = applyCommand(seed(), {
    action: "create",
    role: "Investment",
    name: "Incomplete submission demo",
  });
  const id = s.opportunities[0].id;
  s = applyCommand(s, { action: "report", id, role: "Investment" });
  const report = latestReport(s.opportunities[0]);
  const command = {
    action: "submit-report",
    id,
    role: "Investment",
    reportId: report.id,
  };
  assert.throws(
    () => applyCommand(s, command),
    /Complete the requirement reviews/,
  );
  s = applyCommand(s, { ...command, demoApproval: true });
  const submitted = latestReport(s.opportunities[0]);
  assert.equal(submitted.status, "Submitted");
  assert.ok(submitted.demoSubmission.gaps.includes("Investment report review"));
  assert.equal(submitted.reviews.length, 0);
  assert.ok(reviewReady(s.opportunities[0]).every((r) => !r.done));
  assert.ok(s.events.at(-1).details.includes("Outstanding:"));
});
