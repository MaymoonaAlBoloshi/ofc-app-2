import { readState } from "./store.mjs";
import { readiness, reviewReady } from "./engine.mjs";
import {
  stageById,
  reportReviewRoles,
  approvalRoles,
} from "./requirements.mjs";
export function opportunitySummary(o) {
  return JSON.stringify({
    name: o.name,
    reference: o.reference,
    stage: stageById(o.stage).title,
    status: o.status,
    demoPack: o.demoPack || null,
    facts: o.facts,
    readiness: readiness(o),
    requirements: reviewReady(o).map((r) => ({
      title: r.title,
      owner: r.owner,
      reviewed: r.done,
      demoAssumed: r.saved?.demoAssumed || false,
    })),
    reportReviewers: reportReviewRoles[o.stage],
    decisionAuthority: approvalRoles[o.stage],
    tasks: o.tasks,
    reports: o.reports.map((r) => ({
      title: r.title,
      stage: r.stage,
      status: r.status,
      version: r.version,
      mode: r.mode,
      demoTemplate: r.demoTemplate,
      demoSubmission: r.demoSubmission,
    })),
    instructions:
      "Navigation: Reports has prepared demo reports and Siraaj drafting. Gate workspace has requirement reviews, Assume reviewed for demo, and Record decision. Demo approval mode permits submission with gaps and simulated role reviews. Actual gate readiness and conditions are shown above. Chat cannot change these records.",
  });
}
export async function opportunityEvidence(id, query) {
  const state = await readState();
  const o = state.opportunities.find((o) => o.id === id);
  if (!o)
    throw Error(
      "The selected opportunity was not found. Select another chat context.",
    );
  const words = [
    ...new Set(query.toLowerCase().match(/[a-z]{4,}/g) || []),
  ].slice(-60);
  const hits = o.documents
    .map((d) => {
      const lines = d.text.split("\n");
      const ranked = lines
        .map((text, i) => ({
          text,
          i,
          score: words.filter((w) => text.toLowerCase().includes(w)).length,
        }))
        .sort((a, b) => b.score - a.score);
      return {
        d,
        score: ranked.slice(0, 6).reduce((sum, l) => sum + l.score, 0),
        text: ranked
          .slice(0, 9)
          .sort((a, b) => a.i - b.i)
          .map((l) => `Line ${l.i + 1}: ${l.text}`)
          .join("\n")
          .slice(0, 3500),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  return [
    {
      id: "workspace:" + o.id,
      entity: o.name,
      locator: "Current opportunity and gate records",
      path: "Investment workspace",
      text: opportunitySummary(o).slice(0, 18000),
    },
    ...hits.map(({ d, text }) => ({
      id: "opportunity:" + d.id,
      entity: o.name,
      locator: d.name,
      path: d.name,
      text:
        "Document classification: " +
        d.kind +
        "; reviewed: " +
        Boolean(d.reviewed) +
        "; warnings: " +
        d.warnings.join(" ") +
        "\n" +
        text,
    })),
  ];
}
export async function opportunitySource(id) {
  const s = await readState();
  if (id.startsWith("workspace:")) {
    const o = s.opportunities.find((o) => o.id === id.slice(10));
    return o ? opportunitySummary(o) : null;
  }
  if (id.startsWith("opportunity:")) {
    for (const o of s.opportunities) {
      const d = o.documents.find((d) => d.id === id.slice(12));
      if (d)
        return `${o.name}\n${d.name}\nClassification: ${d.kind}; reviewed: ${Boolean(d.reviewed)}\n${d.warnings.join("\n")}\n\n${d.text}`;
    }
  }
  return null;
}
