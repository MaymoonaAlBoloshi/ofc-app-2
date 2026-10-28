import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { intake, classify } from "../lib/intake.mjs";
test("ORCI ZIP preserves all formats and distinguishes templates, gaps and conflicting figures", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "ofc2-intake-"));
  process.env.OFC2_DATA_DIR = dir;
  try {
    const r = await intake(
      await readFile(
        new URL("../fixtures/ORCI_DD_Demo_Pack.zip", import.meta.url),
      ),
      "ORCI_DD_Demo_Pack.zip",
    );
    assert.equal(r.documents.length, 42);
    assert.deepEqual(r.skipped, []);
    const find = (s) => r.documents.find((d) => d.name.includes(s));
    assert.equal(find("Screening_Log").kind, "Template");
    assert.ok(
      find("Screening_Log").warnings.some((w) =>
        w.includes("not been performed"),
      ),
    );
    assert.ok(
      find("Use_of_Funds").warnings.some((w) => w.includes("example values")),
    );
    assert.ok(
      find("2.01_Group_Financial").text.includes("Sheet: FY2025 third-party"),
    );
    assert.ok(find("Company_Profile").text.includes("PDF page 1"));
    assert.equal(find("Download_List").kind, "Reference");
    assert.equal(find("ESG_Assessment").category, "ESG");
    assert.ok(
      find("Finance_Review").warnings.some((w) => w.includes("reconciliation")),
    );
    assert.equal(
      (await readFile(path.join(dir, "files", find("Company_Profile").hash)))
        .subarray(0, 5)
        .toString(),
      "%PDF-",
    );
  } finally {
    delete process.env.OFC2_DATA_DIR;
    await rm(dir, { recursive: true, force: true });
  }
});
