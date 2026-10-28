import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { mutate } from "../lib/store.mjs";
import { GET } from "../app/api/report/route.js";
test(
  "saved draft and approved closure export as HTML and actual PDF",
  { timeout: 60000 },
  async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "ofc2-report-"));
    process.env.OFC2_DATA_DIR = dir;
    try {
      let s = await mutate(
          {
            action: "create",
            role: "Investment",
            name: "SIMULATION <script>alert(1)</script>",
          },
          0,
        ),
        id = s.opportunities[0].id;
      const send = async (action, values = {}) =>
        (s = await mutate(
          { action, id, role: "Investment", ...values },
          s.version,
        ));
      await send("report");
      let report = s.opportunities[0].reports[0];
      let response = await GET(
        new Request("http://localhost/api/report?id=" + report.id),
      );
      const html = await response.text();
      assert.match(html, /&lt;script&gt;/);
      assert.ok(!html.includes("<script>alert"));
      assert.match(html, /Evidence needed:/);
      response = await GET(
        new Request("http://localhost/api/report?format=pdf&id=" + report.id),
      );
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "application/pdf");
      assert.equal(
        Buffer.from(await response.arrayBuffer())
          .subarray(0, 5)
          .toString(),
        "%PDF-",
      );
      await send("request-closure", {
        outcome: "Deferred",
        note: "Simulation: proposed investment deferred due to unavailable partner evidence.",
        commitments:
          "Simulation: retain all evidence and review outstanding obligations.",
      });
      await send("approve-closure", {
        role: "CIO",
        note: "Simulation: closure justification and obligations reviewed.",
      });
      const closure = s.opportunities[0].closure;
      response = await GET(
        new Request("http://localhost/api/report?id=" + closure.id),
      );
      const text = await response.text();
      assert.match(text, /Investment closure report/);
      assert.match(text, /Approved/);
      assert.match(text, /CIO/);
      assert.match(text, /Project Identification Note v1/);
    } finally {
      delete process.env.OFC2_DATA_DIR;
      await rm(dir, { recursive: true, force: true });
    }
  },
);
