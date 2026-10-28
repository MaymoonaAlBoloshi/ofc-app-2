import { readFileSync } from "node:fs";
import path from "node:path";
import { stageById } from "./requirements.mjs";

// Authored examples, fixed to the supplied ORCI pack. No AI/network request.
export function preparedDemoReport(o) {
  const stage = stageById(o.stage);
  if (!stage) throw Error("Unknown report stage.");
  const content = JSON.parse(
    readFileSync(
      path.join(process.cwd(), "fixtures/reports", stage.id + ".json"),
      "utf8",
    ),
  );
  const { sections: entries, ...presentation } = content;
  const sections = stage.requirements.map((r) => {
    const entry = entries[r.id];
    if (!entry?.text || !entry.sourceNames?.length)
      throw Error("Prepared demo report is incomplete.");
    return {
      id: r.id,
      title: r.title,
      text: entry.text,
      sourceNames: entry.sourceNames,
      sourceIds: entry.sourceNames.flatMap((name) => {
        const doc = o.documents.find((d) => d.name === name);
        return doc ? [doc.id] : [];
      }),
    };
  });
  return { sections, presentation, demoTemplate: true };
}
export async function demoReport(o) {
  return preparedDemoReport(o).sections;
}
