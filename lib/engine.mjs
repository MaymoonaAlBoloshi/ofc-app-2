import {
  stages,
  stageById,
  roles,
  approvalRoles,
  reportReviewRoles,
} from "./requirements.mjs";
export const uid = () => crypto.randomUUID();
export const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const assert = (ok, message) => {
  if (!ok) throw Error(message);
};
const clean = (v, max = 30000) =>
  String(v ?? "")
    .trim()
    .slice(0, max);
export function seed() {
  return { version: 0, opportunities: [], events: [] };
}
export function requirementKey(stage, id) {
  return `${stage}:${id}`;
}
export function latestReport(o, stage = o.stage) {
  return o.reports.filter((r) => r.stage === stage).at(-1);
}
export function revision(o, stage = o.stage) {
  return o.revisions[stage] || 0;
}
function touch(o, stage = o.stage) {
  o.revisions[stage] = revision(o, stage) + 1;
}
export function reviewReady(o, stage = o.stage) {
  return stageById(stage).requirements.map((r) => {
    const saved = o.requirements[requirementKey(stage, r.id)];
    const valid =
      saved?.demoAssumed === true
        ? true
        : saved?.status === "Not applicable"
          ? r.optional
          : saved?.status === "Reviewed" &&
            saved.sourceIds?.length &&
            saved.sourceIds.every((id) => {
              const d = o.documents.find((d) => d.id === id);
              return d?.reviewed && d.kind === "Source";
            });
    return { ...r, saved, done: !!valid };
  });
}
export function readiness(o) {
  const reqs = reviewReady(o),
    report = latestReport(o),
    blockers = reqs.filter((r) => !r.done).map((r) => r.title);
  if (!report)
    blockers.push(`Prepare ${stageById(o.stage).report.toLowerCase()}`);
  else {
    if (report.revision !== revision(o))
      blockers.push("Refresh report after evidence or review changes");
    for (const role of reportReviewRoles[o.stage])
      if (!report.reviews?.some((r) => r.role === role))
        blockers.push(`${role} report review`);
    if (
      report.status !== "Submitted" &&
      !(o.status === "Monitoring" && report.status === "Approved")
    )
      blockers.push("Submit reviewed report for decision");
  }
  if (
    o.conditions.some(
      (c) => c.status !== "Resolved" && c.before === "Next gate",
    )
  )
    blockers.push("Resolve conditions due before the next gate");
  if (
    o.stage === "handover" &&
    o.conditions.some(
      (c) => c.status !== "Resolved" && c.before === "Execution",
    )
  )
    blockers.push("Resolve conditions due before execution");
  if (
    o.stage === "delivery" &&
    o.conditions.some(
      (c) => c.status !== "Resolved" && c.before === "Monitoring",
    )
  )
    blockers.push("Resolve conditions due before monitoring");
  if (o.closure?.status === "Submitted")
    blockers.push("Resolve the pending closure request");
  if (
    o.tasks.some(
      (t) =>
        t.title === "Respond to information request" &&
        t.stage === o.stage &&
        t.status !== "Completed",
    )
  )
    blockers.push("Complete the requested follow-up actions");
  return {
    reqs,
    report,
    blockers,
    complete: reqs.filter((r) => r.done).length,
    total: reqs.length,
  };
}
function event(state, o, role, action, details) {
  state.events.push({
    id: uid(),
    at: now(),
    opportunityId: o.id,
    stage: o.stage,
    role,
    action,
    details,
  });
}
function taskDefaults(o, stage) {
  const due = new Date();
  due.setDate(due.getDate() + 14);
  for (const r of stageById(stage).requirements) {
    const key = requirementKey(stage, r.id);
    if (!o.tasks.some((t) => t.key === key))
      o.tasks.push({
        id: uid(),
        key,
        stage,
        title: r.title,
        owner: r.owner,
        due: o.targetDate || due.toISOString().slice(0, 10),
        status: "Open",
        note: "Suggested date. Review with the owner.",
      });
  }
}
export function applyCommand(input, cmd) {
  const state = structuredClone(input),
    role = cmd.role;
  assert(roles.includes(role), "Choose a valid demo role.");
  if (cmd.action === "create") {
    assert(
      role === "Investment",
      "Use the Investment role to create an opportunity.",
    );
    const name = clean(cmd.name, 160);
    assert(name, "Enter an opportunity name.");
    assert(
      !state.opportunities.some(
        (o) => o.name.toLowerCase() === name.toLowerCase(),
      ),
      "An opportunity already has this name.",
    );
    const o = {
      id: uid(),
      reference: `OFC-${new Date().getFullYear()}-${String(state.opportunities.length + 1).padStart(3, "0")}`,
      name,
      type: [
        "Greenfield",
        "Brownfield",
        "Venture Capital",
        "Divestment",
      ].includes(cmd.type)
        ? cmd.type
        : "Brownfield",
      sector: clean(cmd.sector, 100) || "Food and beverages",
      owner: clean(cmd.owner, 100) || "Investment team",
      targetDate: cmd.targetDate || "",
      createdAt: now(),
      stage: "sg1",
      status: "Active",
      requirements: {},
      revisions: {},
      documents: [],
      reports: [],
      decisions: [],
      conditions: [],
      tasks: [],
      facts: {},
      closure: null,
      closures: [],
      period: `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`,
    };
    state.opportunities.unshift(o);
    taskDefaults(o, "sg1");
    event(
      state,
      o,
      role,
      "Opportunity created",
      "Preparation tasks and suggested dates created.",
    );
    state.version++;
    return state;
  }
  const o = state.opportunities.find((o) => o.id === cmd.id);
  assert(o, "Opportunity not found.");
  const active = () =>
    assert(
      o.status === "Active",
      "Reopen this opportunity before continuing work.",
    );
  if (cmd.action === "demo-assume-reviewed") {
    active();
    const previous = latestReport(o);
    for (const r of reviewReady(o)) {
      if (r.done) continue;
      const key = requirementKey(o.stage, r.id);
      o.requirements[key] = {
        ...r.saved,
        narrative:
          r.saved?.narrative ||
          "Demo assumption: requirement review is simulated. Evidence has not been verified.",
        sourceIds: r.saved?.sourceIds || [],
        status: "Reviewed",
        reviewer: role,
        at: now(),
        demoAssumed: true,
      };
      const task = o.tasks.find((t) => t.key === key);
      if (task) {
        task.status = "Completed";
        task.note = "Review assumed for demo by " + role;
      }
    }
    touch(o);
    event(
      state,
      o,
      role,
      "Reviews assumed for demo",
      "Current gate requirements marked as simulated reviews. Source documents remain unchanged. A new demo report version was prepared.",
    );
    return applyCommand(state, {
      action: "report",
      id: o.id,
      role,
      sections: previous?.sections,
      presentation: previous?.presentation,
      demoTemplate: previous?.demoTemplate,
      mode: "Demo assumptions: reviews simulated",
    });
  } else if (cmd.action === "documents") {
    active();
    assert(
      Array.isArray(cmd.documents) && cmd.documents.length,
      "No readable files supplied.",
    );
    for (const d of cmd.documents)
      if (!o.documents.some((x) => x.hash === d.hash))
        o.documents.push({
          ...d,
          id: d.id || uid(),
          reviewed: false,
          uploadedAt: now(),
        });
    touch(o);
    event(
      state,
      o,
      role,
      "Sources added",
      `${cmd.documents.length} processed files. Duplicates retained once. Reports require a fresh review.`,
    );
  } else if (cmd.action === "draft-assessments") {
    active();
    let count = 0;
    for (const draft of cmd.drafts || []) {
      const def = stageById(o.stage).requirements.find(
        (r) => r.id === draft.id,
      );
      assert(def, "Invalid draft requirement.");
      const key = requirementKey(o.stage, def.id);
      if (o.requirements[key]?.narrative) continue;
      o.requirements[key] = {
        narrative: clean(draft.text),
        sourceIds: (draft.sourceIds || []).filter((id) =>
          o.documents.some((d) => d.id === id),
        ),
        status: "Draft",
        reviewer: null,
        at: now(),
      };
      count++;
    }
    if (count) touch(o);
    event(
      state,
      o,
      role,
      "Assessment drafts prepared",
      `${count} empty assessments populated from source excerpts. Existing work retained. Review required.`,
    );
  } else if (cmd.action === "review-document") {
    active();
    const d = o.documents.find((d) => d.id === cmd.documentId);
    assert(d, "Document not found.");
    assert(
      ["Source", "Template", "Reference"].includes(cmd.kind),
      "Choose a document classification.",
    );
    assert(
      clean(cmd.note).length >= 10,
      "Record what you verified and any remaining gaps.",
    );
    d.kind = cmd.kind;
    d.reviewNote = clean(cmd.note);
    d.reviewed = true;
    d.reviewedBy = role;
    d.reviewedAt = now();
    touch(o);
    event(
      state,
      o,
      role,
      "Source reviewed",
      `${d.name}: ${d.kind}. ${d.reviewNote}`,
    );
  } else if (cmd.action === "requirement") {
    active();
    const def = stageById(o.stage).requirements.find(
      (r) => r.id === cmd.requirementId,
    );
    assert(def, "Requirement is not in the active stage.");
    const key = requirementKey(o.stage, def.id),
      status = cmd.status || "Draft";
    assert(
      ["Draft", "Reviewed", "Not applicable"].includes(status),
      "Invalid review status.",
    );
    const narrative = clean(cmd.narrative),
      refs = [...new Set(cmd.sourceIds || [])];
    assert(
      refs.every((id) => o.documents.some((d) => d.id === id)),
      "A linked source no longer exists.",
    );
    if (status !== "Draft") {
      assert(role === def.owner, `This review belongs to ${def.owner}.`);
      assert(
        narrative.length >= 30,
        "Record a substantive assessment or non-applicability justification (at least 30 characters).",
      );
      assert(
        !/Evidence needed:|Assessment and conclusion: complete after|No relevant uploaded evidence found/i.test(
          narrative,
        ),
        "Replace drafting placeholders with your reviewed assessment before completing this requirement.",
      );
      if (status === "Not applicable")
        assert(def.optional, "This requirement cannot be waived.");
      else {
        assert(refs.length, "Link at least one reviewed source.");
        assert(
          refs.every((id) => {
            const d = o.documents.find((d) => d.id === id);
            return d.reviewed && d.kind === "Source";
          }),
          "Use reviewed source evidence. Templates and reference links do not establish completion.",
        );
      }
      if (o.stage === "sg3" && def.id === "procurement")
        assert(
          o.requirements["sg3:budget"]?.status === "Reviewed",
          "Finance must confirm budget before consultant appointment.",
        );
      if (o.stage === "monitoring" && def.id === "financials")
        assert(
          o.registers?.financials?.some((r) => r.period === o.period),
          "Record the current period financial actuals and budget first.",
        );
      if (o.stage === "monitoring" && def.id === "board")
        assert(
          o.registers?.board?.length,
          "Record the board representative assignments first.",
        );
    }
    o.requirements[key] = {
      narrative,
      sourceIds: refs,
      status,
      reviewer: status === "Draft" ? null : role,
      at: now(),
    };
    const t = o.tasks.find((t) => t.key === key);
    if (t) t.status = status === "Draft" ? "Open" : "Completed";
    touch(o);
    event(state, o, role, `${def.title}: ${status}`, narrative);
  } else if (cmd.action === "task") {
    const task = o.tasks.find((t) => t.id === cmd.taskId);
    assert(task, "Task not found.");
    assert(roles.includes(cmd.owner), "Select a responsible team.");
    assert(/^\d{4}-\d{2}-\d{2}$/.test(cmd.due), "Choose a due date.");
    if (!task.meetingId) {
      const meeting = o.registers?.meeting?.find(
        (r) =>
          r.action === task.title && task.note === `From meeting: ${r.title}`,
      );
      if (meeting) task.meetingId = meeting.id;
    }
    task.owner = cmd.owner;
    task.due = cmd.due;
    task.note = clean(cmd.note);
    event(state, o, role, "Task updated", task.title);
    if (!task.key && cmd.status === "Completed") {
      assert(
        role === task.owner,
        "The assigned team must complete the follow-up.",
      );
      assert(task.note.length >= 20, "Record the follow-up outcome.");
      task.status = "Completed";
      touch(o);
    }
  } else if (cmd.action === "register") {
    active();
    const kind = cmd.kind;
    assert(
      ["financials", "board", "meeting", "kpi"].includes(kind),
      "Unknown register.",
    );
    const data = cmd.data || {};
    const record = { id: uid(), at: now(), actor: role };
    if (kind === "financials") {
      assert(role === "Finance", "Finance owns financial reporting.");
      assert(
        /^\d{4}-Q[1-4]$/.test(data.period),
        "Enter a quarter, for example 2026-Q4.",
      );
      for (const key of [
        "revenue",
        "budget",
        "ebitda",
        "adjustments",
        "allocated",
        "utilized",
      ]) {
        assert(
          data[key] !== "" &&
            data[key] != null &&
            Number.isFinite(Number(data[key])),
          `Enter a valid ${key} amount.`,
        );
        record[key] = Number(data[key]);
      }
      assert(
        record.revenue >= 0 &&
          record.budget >= 0 &&
          record.allocated >= 0 &&
          record.utilized >= 0,
        "Revenue, budget and fund amounts cannot be negative.",
      );
      const d = o.documents.find((d) => d.id === data.sourceId);
      assert(
        d?.reviewed && d.kind === "Source",
        "Link reviewed financial evidence.",
      );
      assert(
        clean(data.note).length >= 15,
        "Explain adjustments and material variances.",
      );
      Object.assign(record, {
        period: data.period,
        sourceId: d.id,
        currency: "OMR",
        unit: "OMR",
        variance: record.revenue - record.budget,
        adjustedEbitda: record.ebitda + record.adjustments,
        note: clean(data.note),
      });
    } else if (kind === "board") {
      assert(
        role === "Asset Management",
        "Asset Management maintains board appointments.",
      );
      assert(
        clean(data.name) && clean(data.position) && data.appointed,
        "Enter the representative, position and appointment date.",
      );
      Object.assign(record, {
        name: clean(data.name, 120),
        position: clean(data.position, 100),
        appointed: data.appointed,
        reviewDate: data.reviewDate || "",
        note: clean(data.note),
      });
    } else if (kind === "meeting") {
      assert(
        clean(data.title) && data.date && clean(data.agenda),
        "Record meeting title, date and agenda.",
      );
      Object.assign(record, {
        title: clean(data.title, 160),
        date: data.date,
        forum: clean(data.forum, 100),
        agenda: clean(data.agenda),
        minutes: clean(data.minutes),
        votes: clean(data.votes),
        action: clean(data.action),
        owner: data.owner || role,
        due: data.due || data.date,
      });
      if (record.action) {
        assert(roles.includes(record.owner), "Select a follow-up owner.");
        o.tasks.push({
          id: uid(),
          stage: o.stage,
          title: record.action,
          meetingId: record.id,
          owner: record.owner,
          due: record.due,
          status: "Open",
          note: `From meeting: ${record.title}`,
        });
      }
    } else {
      assert(
        role === "Asset Management",
        "Asset Management maintains performance indicators.",
      );
      assert(
        clean(data.name) &&
          clean(data.target) &&
          clean(data.actual) &&
          clean(data.period),
        "Record the KPI name, period, target and actual.",
      );
      Object.assign(record, {
        name: clean(data.name, 160),
        period: clean(data.period, 30),
        target: clean(data.target, 100),
        actual: clean(data.actual, 100),
        note: clean(data.note),
      });
    }
    o.registers ??= {};
    o.registers[kind] ??= [];
    o.registers[kind].push(record);
    touch(o);
    event(
      state,
      o,
      role,
      `${kind} record added`,
      record.title || record.name || record.period,
    );
  } else if (cmd.action === "facts") {
    active();
    o.facts = {
      ...o.facts,
      ...Object.fromEntries(
        Object.entries(cmd.facts || {})
          .filter(([k]) =>
            [
              "overview",
              "investor",
              "amount",
              "currency",
              "rationale",
            ].includes(k),
          )
          .map(([k, v]) => [k, clean(v, 10000)]),
      ),
    };
    touch(o);
    event(
      state,
      o,
      role,
      "Opportunity facts updated",
      "Reviewed intake suggestions saved.",
    );
  } else if (cmd.action === "report") {
    active();
    const stage = stageById(cmd.reportStage || o.stage);
    assert(
      stage &&
        stages.findIndex((s) => s.id === stage.id) <=
          stages.findIndex((s) => s.id === o.stage),
      "Reports are available only up to the current gate.",
    );
    const reqs = reviewReady(o, stage.id);
    const sections =
      cmd.sections ||
      reqs.map((r) => ({
        id: r.id,
        title: r.title,
        text:
          (r.saved?.narrative &&
          !/Assessment and conclusion: complete after|No relevant uploaded evidence found|^Source:/i.test(
            r.saved.narrative,
          )
            ? r.saved.narrative
            : `Evidence needed: ${r.detail}

${r.saved?.sourceIds?.length ? "The source library contains potentially relevant material, but its relevance and completeness have not yet been confirmed for this investment." : "The available record does not yet establish a supported conclusion for this assessment."}

The responsible team (${r.owner}) should evaluate the supporting documents, resolve the outstanding information and record its conclusion before the gate decision.`) +
          (stage.id === "monitoring" &&
          r.id === "financials" &&
          o.registers?.financials?.length
            ? "\n\nRecorded financial data (OMR):\n" +
              o.registers.financials
                .filter((f) => f.period === o.period)
                .map(
                  (f) =>
                    `${f.period}: revenue ${f.revenue}; budget ${f.budget}; variance ${f.variance}; EBITDA ${f.ebitda}; adjustments ${f.adjustments}; adjusted EBITDA ${f.adjustedEbitda}; funds allocated ${f.allocated}; utilized ${f.utilized}. ${f.note}`,
                )
                .join("\n")
            : ""),
        sourceIds: r.saved?.sourceIds || [],
      }));
    assert(
      sections.length === stage.requirements.length &&
        sections.every((s, i) => s.id === stage.requirements[i].id),
      "The report must contain every required section.",
    );
    assert(
      sections.every(
        (s) =>
          typeof s.text === "string" &&
          s.sourceIds?.every((id) => o.documents.some((d) => d.id === id)),
      ),
      "Report has invalid source references.",
    );
    const report = {
      id: uid(),
      stage: stage.id,
      title: stage.report,
      version: o.reports.filter((r) => r.stage === stage.id).length + 1,
      revision: revision(o, stage.id),
      period: o.period,
      createdAt: now(),
      preparedBy: role,
      demoTemplate: cmd.demoTemplate === true,
      presentation: cmd.presentation
        ? structuredClone(cmd.presentation)
        : undefined,
      demoAssumed: reqs.some((r) => r.saved?.demoAssumed),
      mode: cmd.demoTemplate
        ? "Prepared ORCI demo report"
        : reqs.some((r) => r.saved?.demoAssumed)
          ? "Demo assumptions: reviews simulated"
          : cmd.mode || "Structured draft",
      status: "Draft",
      reviews: [],
      sections,
      snapshot: {
        facts: structuredClone(o.facts),
        requirements: structuredClone(o.requirements),
        registers: structuredClone(o.registers || {}),
        tasks: structuredClone(o.tasks),
        decisions: structuredClone(o.decisions),
        sources: o.documents.map((d) => ({
          id: d.id,
          name: d.name,
          hash: d.hash,
          reviewed: d.reviewed,
          kind: d.kind,
        })),
        conditions: structuredClone(o.conditions),
      },
    };
    o.reports.push(report);
    event(
      state,
      o,
      role,
      "Report version prepared",
      `${stage.report} v${report.version}. Review required.`,
    );
  } else if (cmd.action === "edit-report") {
    active();
    const report = latestReport(o);
    assert(report?.id === cmd.reportId, "Open the latest report version.");
    assert(
      report.revision === revision(o),
      "Sources changed. Prepare a fresh report first.",
    );
    const sections = cmd.sections;
    assert(
      Array.isArray(sections) &&
        sections.length === report.sections.length &&
        sections.every(
          (s, i) => s.id === report.sections[i].id && clean(s.text),
        ),
      "Retain every report section.",
    );
    const next = {
      ...structuredClone(report),
      id: uid(),
      version: report.version + 1,
      status: "Draft",
      createdAt: now(),
      reviews: [],
      sections: sections.map((s, i) => ({
        ...report.sections[i],
        text: clean(s.text),
      })),
    };
    o.reports.push(next);
    event(
      state,
      o,
      role,
      "Report edited",
      `Saved v${next.version}; new review required.`,
    );
  } else if (cmd.action === "review-report" || cmd.action === "submit-report") {
    active();
    const report = latestReport(o);
    assert(report?.id === cmd.reportId, "Open the latest report.");
    assert(
      report.status !== "Returned",
      "Prepare a new report version to respond to the information request.",
    );
    const demoSubmit =
      cmd.action === "submit-report" && cmd.demoApproval === true;
    assert(
      demoSubmit || report.revision === revision(o),
      "Evidence changed. Generate a fresh version.",
    );
    assert(
      demoSubmit || reviewReady(o).every((r) => r.done),
      "Complete the requirement reviews before reviewing or submitting the report.",
    );
    assert(
      demoSubmit ||
        report.demoAssumed ||
        !report.sections.some((s) => /Evidence needed:/i.test(s.text)),
      "Resolve report evidence gaps before review.",
    );
    if (cmd.action === "review-report") {
      assert(
        cmd.demoApproval === true || reportReviewRoles[o.stage].includes(role),
        `Required reviewers: ${reportReviewRoles[o.stage].join(", ")}.`,
      );
      assert(clean(cmd.note).length >= 10, "Record your review conclusion.");
      if (cmd.demoApproval === true) {
        for (const authority of reportReviewRoles[o.stage]) {
          if (
            report.reviews.some((r) => r.role === authority && !r.demoAssumed)
          )
            continue;
          report.reviews = report.reviews.filter((r) => r.role !== authority);
          report.reviews.push({
            role: authority,
            performedBy: role,
            demoAssumed: true,
            at: now(),
            note: "Demo review: " + clean(cmd.note),
          });
        }
      } else {
        report.reviews = report.reviews.filter((r) => r.role !== role);
        report.reviews.push({ role, at: now(), note: clean(cmd.note) });
      }
      report.status = "Reviewed";
    } else {
      assert(
        demoSubmit ||
          reportReviewRoles[o.stage].every((role) =>
            report.reviews.some((r) => r.role === role),
          ),
        "All required report reviews must be recorded.",
      );
      if (demoSubmit) {
        report.demoSubmission = {
          by: role,
          at: now(),
          gaps: [
            ...reviewReady(o)
              .filter((r) => !r.done)
              .map((r) => r.title),
            ...reportReviewRoles[o.stage]
              .filter((role) => !report.reviews.some((r) => r.role === role))
              .map((role) => role + " report review"),
            ...(report.revision !== revision(o)
              ? ["Report predates the latest evidence or assessments"]
              : []),
            ...(report.sections.some((s) => /Evidence needed:/i.test(s.text))
              ? ["Unresolved report evidence gaps"]
              : []),
          ],
        };
      }
      report.status = "Submitted";
      report.submittedAt = now();
    }
    event(
      state,
      o,
      role,
      cmd.action === "review-report"
        ? cmd.demoApproval === true
          ? "Report reviews simulated for demo"
          : "Report reviewed"
        : demoSubmit
          ? "Report submitted for demo with gaps recorded"
          : "Report submitted",
      `${report.title} v${report.version}${demoSubmit ? ". Outstanding: " + (report.demoSubmission.gaps.join("; ") || "None") : ""}`,
    );
  } else if (cmd.action === "decision") {
    active();
    assert(
      cmd.demoApproval === true || approvalRoles[o.stage].includes(role),
      `Decision authority: ${approvalRoles[o.stage].join(" or ")}.`,
    );
    assert(
      o.closure?.status !== "Submitted",
      "Resolve the pending closure request before a gate decision.",
    );
    assert(
      ["Approve", "Approve with conditions", "Request information"].includes(
        cmd.outcome,
      ),
      "Choose a valid decision.",
    );
    assert(clean(cmd.note).length >= 15, "Record the decision rationale.");
    if (["sg2", "sg3", "monitoring"].includes(o.stage)) {
      assert(
        cmd.meetingDate && clean(cmd.votes),
        "Record the meeting date and voting outcome.",
      );
    }
    const report = latestReport(o);
    if (cmd.outcome === "Request information") {
      assert(
        report?.status === "Submitted" && report.revision === revision(o),
        "Submit the current report before a formal information request.",
      );
      report.status = "Returned";
      report.reviews = [];
      o.tasks.push({
        id: uid(),
        stage: o.stage,
        title: "Respond to information request",
        owner: stageById(o.stage).owner,
        due: cmd.due || today(),
        status: "Open",
        note: clean(cmd.note),
      });
    } else {
      const ready = readiness(o);
      assert(
        !ready.blockers.length,
        `Cannot approve: ${ready.blockers.join("; ")}`,
      );
      if (cmd.outcome === "Approve with conditions") {
        assert(
          Array.isArray(cmd.conditions) && cmd.conditions.length,
          "Add at least one condition.",
        );
        for (const c of cmd.conditions) {
          assert(
            clean(c.text).length >= 10 &&
              roles.includes(c.owner) &&
              /^\d{4}-\d{2}-\d{2}$/.test(c.due) &&
              ["Next gate", "Execution", "Monitoring"].includes(c.before),
            "Each condition needs text, owner, due date and release point.",
          );
          o.conditions.push({
            ...c,
            id: uid(),
            status: "Open",
            stage: o.stage,
          });
        }
      }
      report.status = "Approved";
      report.approvedAt = now();
      report.demoApproval = cmd.demoApproval === true;
    }
    const decision = {
      id: uid(),
      stage: o.stage,
      outcome: cmd.outcome,
      demoApproval: cmd.demoApproval === true,
      note: clean(cmd.note),
      role,
      at: now(),
      meetingDate: cmd.meetingDate || today(),
      votes: clean(cmd.votes),
      reportId: report?.id,
      reportVersion: report?.version,
      conditions: structuredClone(o.conditions),
    };
    o.decisions.push(decision);
    event(
      state,
      o,
      role,
      cmd.demoApproval === true ? `Demo decision: ${cmd.outcome}` : cmd.outcome,
      `${decision.note} Report v${report?.version}.`,
    );
    if (cmd.outcome !== "Request information") {
      const index = stages.findIndex((s) => s.id === o.stage);
      if (index < stages.length - 1) {
        o.stage = stages[index + 1].id;
        taskDefaults(o, o.stage);
        if (o.stage === "delivery") o.assetOwner = "Asset Management";
      } else {
        o.lastReportedPeriod = o.period;
        o.status = "Monitoring";
      }
    }
  } else if (cmd.action === "condition") {
    const c = o.conditions.find((c) => c.id === cmd.conditionId);
    assert(c, "Condition not found.");
    assert(c.owner === role, `Resolution belongs to ${c.owner}.`);
    assert(clean(cmd.note).length >= 20, "Record resolution evidence.");
    const d = o.documents.find((d) => d.id === cmd.documentId);
    assert(
      d?.reviewed && d.kind === "Source",
      "Link reviewed source evidence.",
    );
    c.status = "Resolved";
    c.resolution = clean(cmd.note);
    c.sourceId = d.id;
    c.resolvedAt = now();
    event(state, o, role, "Condition resolved", c.text);
    touch(o);
  } else if (cmd.action === "request-closure") {
    active();
    assert(
      ["Deferred", "Declined", "Closed"].includes(cmd.outcome),
      "Select a closure outcome.",
    );
    assert(
      clean(cmd.note).length >= 30,
      "Explain why the investment is being abandoned or deferred.",
    );
    assert(
      o.closure?.status !== "Submitted",
      "A closure report is already awaiting a decision.",
    );
    if (o.closure) {
      o.closures ??= [];
      o.closures.push(structuredClone(o.closure));
    }
    o.closure = {
      id: uid(),
      status: "Submitted",
      outcome: cmd.outcome,
      reason: clean(cmd.note),
      commitments: clean(cmd.commitments),
      requestedBy: role,
      at: now(),
      stage: o.stage,
      reportIds: o.reports.map((r) => r.id),
      authority:
        o.stage === "sg1" ? ["CIO"] : o.stage === "sg2" ? ["EC"] : ["Board"],
    };
    assert(
      o.closure.commitments.length >= 15,
      "Record outstanding commitments, liabilities and follow-up.",
    );
    event(state, o, role, "Closure report submitted", o.closure.reason);
  } else if (cmd.action === "approve-closure") {
    assert(o.closure?.status === "Submitted", "Submit a closure report first.");
    assert(
      o.closure.authority.includes(role),
      `Closure requires ${o.closure.authority.join(" or ")} approval.`,
    );
    assert(
      clean(cmd.note).length >= 10,
      "Record the closure approval rationale.",
    );
    o.closure.status = "Approved";
    o.closure.approvedBy = role;
    o.closure.approvedAt = now();
    o.closure.approvalNote = clean(cmd.note);
    o.status = o.closure.outcome;
    if (o.stage !== "sg1")
      o.tasks.push({
        id: uid(),
        stage: o.stage,
        title: "Include closure in quarterly committee update",
        owner: "Investment",
        due: today(),
        status: "Open",
        note: o.closure.reason,
      });
    event(state, o, role, "Closure approved", `${o.status}: ${cmd.note}`);
  } else if (cmd.action === "return-closure") {
    assert(o.closure?.status === "Submitted", "No submitted closure report.");
    assert(
      o.closure.authority.includes(role),
      "Use the designated closure authority.",
    );
    assert(
      clean(cmd.note).length >= 15,
      "Explain why the closure report is returned.",
    );
    o.closure.status = "Returned";
    o.closure.returnNote = clean(cmd.note);
    event(state, o, role, "Closure report returned", clean(cmd.note));
  } else if (cmd.action === "reopen") {
    assert(
      o.status !== "Active" && o.status !== "Monitoring",
      "Opportunity is already active.",
    );
    assert(
      (o.closure?.authority || ["CIO"]).includes(role),
      "Reopening requires the closure authority.",
    );
    assert(clean(cmd.note).length >= 15, "Explain the reopening decision.");
    o.status = "Active";
    touch(o);
    event(state, o, role, "Opportunity reopened", clean(cmd.note));
  } else if (cmd.action === "new-period") {
    assert(
      o.stage === "monitoring" && o.status === "Monitoring",
      "Complete the current reporting cycle first.",
    );
    assert(
      role === "Asset Management",
      "Asset Management starts the reporting cycle.",
    );
    assert(
      /^\d{4}-Q[1-4]$/.test(cmd.period) && cmd.period !== o.lastReportedPeriod,
      "Enter a new period, for example 2026-Q4.",
    );
    o.period = cmd.period;
    o.status = "Active";
    for (const r of stageById("monitoring").requirements)
      delete o.requirements[requirementKey("monitoring", r.id)];
    o.tasks = o.tasks.filter(
      (t) => t.stage !== "monitoring" || t.status === "Completed",
    );
    taskDefaults(o, "monitoring");
    touch(o);
    event(state, o, role, "New reporting period", cmd.period);
  } else throw Error("Unknown action.");
  state.version++;
  return state;
}
