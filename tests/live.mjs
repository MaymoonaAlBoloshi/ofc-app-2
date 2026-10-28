import { test } from "node:test";
import assert from "node:assert/strict";
import { aiDraft, research } from "../lib/assist.mjs";
import { seed, applyCommand } from "../lib/engine.mjs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
test(
  "live configured Siraaj produces a structurally valid, unreviewed source-grounded report",
  { timeout: 150000 },
  async () => {
    process.loadEnvFile(".env.local");
    let s = applyCommand(seed(), {
        action: "create",
        role: "Investment",
        name: "SIMULATION - provider smoke check",
      }),
      o = s.opportunities[0];
    s = applyCommand(s, {
      action: "documents",
      role: "Investment",
      id: o.id,
      documents: [
        {
          id: "smoke-source",
          name: "smoke-evidence.txt",
          hash: "test",
          kind: "Source",
          category: "Market",
          warnings: ["Synthetic test evidence."],
          text: "SIMULATED INVESTMENT EVIDENCE. Test company proposes a packaging study. No investment amount, financial projections, KYC verification, permits or approval has been supplied. The market study remains outstanding. This is fictional test data, not an actual company.",
        },
      ],
    });
    o = s.opportunities[0];
    const sections = await aiDraft(o);
    s = applyCommand(s, {
      action: "report",
      role: "Investment",
      id: o.id,
      sections,
      mode: "Siraaj draft",
    });
    assert.equal(s.opportunities[0].reports[0].sections.length, 14);
    assert.equal(s.opportunities[0].reports[0].status, "Draft");
    assert.ok(sections.some((s) => /Evidence needed:/i.test(s.text)));
    console.log(
      "Live provider: 14 draft sections; missing evidence retained; no approvals recorded.",
    );
  },
);
test(
  "live official-source retrieval extracts content with its origin",
  { timeout: 60000 },
  async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "ofc2-research-"));
    process.env.OFC2_DATA_DIR = dir;
    try {
      const d = await research("https://www.msx.om/snapshot.aspx?s=ORCI");
      assert.ok(d.text.length > 100);
      assert.ok(d.retrievedAt);
      assert.equal(d.researchUrl, "https://www.msx.om/snapshot.aspx?s=ORCI");
      console.log(
        "Live research: official page extracted with URL and retrieval time.",
      );
    } finally {
      delete process.env.OFC2_DATA_DIR;
      await rm(dir, { recursive: true, force: true });
    }
  },
);
