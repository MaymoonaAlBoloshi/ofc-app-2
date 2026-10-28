import { preparedDemoReport } from "./demo-report.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { intake } from "./intake.mjs";
import { applyCommand } from "./engine.mjs";
import { stageById } from "./requirements.mjs";
import { suggest } from "./assist.mjs";

export async function prepareDemoOpportunity(command) {
  const pack = await intake(
    await readFile(path.join(process.cwd(), "fixtures/ORCI_DD_Demo_Pack.zip")),
    "ORCI_DD_Demo_Pack.zip",
  );
  if (pack.documents.length !== 42)
    throw Error("The demo pack is incomplete. Expected 42 documents.");
  // One storage transaction: an extraction or preparation failure never leaves
  // a partly created opportunity behind.
  return (input) => {
    let state = applyCommand(input, { ...command, action: "create" });
    const id = state.opportunities[0].id;
    const run = (action, values = {}) => {
      state = applyCommand(state, {
        action,
        id,
        role: command.role,
        ...values,
      });
    };
    run("documents", { documents: pack.documents });
    const o = state.opportunities.find((o) => o.id === id);
    run("draft-assessments", {
      drafts: stageById(o.stage).requirements.map((r) => ({
        id: r.id,
        ...suggest(o, r.id),
      })),
    });
    run("report", {
      ...preparedDemoReport(o),
      mode: "Prepared ORCI demo report",
    });
    state.opportunities.find((o) => o.id === id).demoPack = "ORCI_DD_Demo_Pack";
    return state;
  };
}
