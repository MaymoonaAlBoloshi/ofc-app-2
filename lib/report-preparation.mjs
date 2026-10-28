import { stages } from "./requirements.mjs";
import { applyCommand } from "./engine.mjs";
import { preparedDemoReport } from "./demo-report.mjs";
export function reportTargets(o, command) {
  const available = stages.slice(
    0,
    stages.findIndex((s) => s.id === o.stage) + 1,
  );
  if (command.scope === "through") return available;
  const target = available.find(
    (s) => s.id === (command.reportStage || o.stage),
  );
  if (!target)
    throw Error("Reports are available only up to the current gate.");
  return [target];
}
export function prepareReportSet(input, command) {
  const o = input.opportunities.find((o) => o.id === command.id);
  if (!o) throw Error("Opportunity not found.");
  let state = input;
  for (const stage of reportTargets(o, command)) {
    const prepared = command.demo
      ? preparedDemoReport({ ...o, stage: stage.id })
      : {};
    state = applyCommand(state, {
      action: "report",
      id: o.id,
      role: command.role,
      reportStage: stage.id,
      ...prepared,
      mode: command.demo ? "Prepared ORCI demo report" : "Structured draft",
    });
  }
  return state;
}
