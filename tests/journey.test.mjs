import { test } from "node:test";
import assert from "node:assert/strict";
import { firefox } from "playwright-core";
import { spawn } from "node:child_process";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  stages,
  reportReviewRoles,
  approvalRoles,
} from "../lib/requirements.mjs";
test(
  "isolated browser journey: intake, evidence review, all stages, reporting and retained history",
  { timeout: 240000 },
  async () => {
    const data = await mkdtemp(path.join(os.tmpdir(), "ofc2-journey-")),
      base = "http://127.0.0.1:3005";
    let server, browser;
    try {
      server = spawn(
        process.execPath,
        [
          "node_modules/next/dist/bin/next",
          "start",
          "--hostname",
          "127.0.0.1",
          "--port",
          "3005",
        ],
        {
          cwd: process.cwd(),
          env: { ...process.env, OFC2_DATA_DIR: data },
          stdio: "pipe",
        },
      );
      let logs = "";
      server.stdout.on("data", (c) => (logs += c));
      server.stderr.on("data", (c) => (logs += c));
      let up = false;
      for (let i = 0; i < 60; i++) {
        try {
          up = (await fetch(base + "/api/workspace")).ok;
          if (up) break;
        } catch {}
        await new Promise((r) => setTimeout(r, 250));
      }
      assert.ok(up, logs);
      browser = await firefox.launch({
        headless: true,
        executablePath:
          process.env.OFC2_FIREFOX ||
          "/home/maymona/Documents/ofc/OFC_Next/.cache/playwright/firefox-1555/firefox/firefox",
      });
      const page = await browser.newPage({
          viewport: { width: 1440, height: 1000 },
        }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", async (r) => {
        if (r.status() >= 400 && r.url().includes("/api/"))
          console.log("API", r.status(), await r.text());
      });
      await page.goto(base);
      const profile = async (role) => {
        await page.getByLabel("Profile", { exact: true }).click();
        await page
          .getByLabel("Profile role", { exact: true })
          .selectOption(role);
        if (await page.locator(".profile-switch").evaluate((el) => el.open))
          await page.getByLabel("Profile", { exact: true }).click();
      };
      await page.getByRole("button", { name: "Start ORCI example ↗" }).click();
      await page.getByRole("heading", { name: "Source library" }).waitFor();
      assert.equal(await page.locator(".document-card").count(), 42);
      await page
        .getByRole("button", { name: "Gate workspace", exact: true })
        .click();
      await mkdir("test-results", { recursive: true });
      await page.screenshot({
        path: "test-results/sg1-desktop.png",
        fullPage: true,
      });
      await profile("CEO");
      await page
        .getByRole("button", { name: "Record decision", exact: true })
        .click();

      await page
        .getByLabel("Decision rationale / information request")
        .fill("Testing that missing evidence blocks a forward approval.");
      await page
        .locator("dialog")
        .getByRole("button", { name: "Record decision", exact: true })
        .click();
      await page
        .locator("dialog")
        .getByRole("alert")
        .filter({ hasText: "Cannot approve" })
        .waitFor();
      await page.getByRole("button", { name: "Close dialog" }).click();
      await page.getByRole("button", { name: "← All opportunities" }).click();
      await profile("Investment");
      await page.getByRole("button", { name: "+ New opportunity" }).click();
      // This synthetic workflow fixture deliberately starts without sample documents.
      await page.route(
        "**/api/workspace",
        async (route) => {
          const body = route.request().postDataJSON();
          await route.continue({
            postData: JSON.stringify({ ...body, demoPack: false }),
          });
        },
        { times: 1 },
      );
      await page
        .getByLabel("Opportunity name")
        .fill("SIMULATION - complete gate journey");
      await page
        .getByRole("button", { name: "Create opportunity", exact: true })
        .click();
      await page.locator("dialog").waitFor({ state: "hidden" });
      await page.getByRole("button", { name: /^Evidence \(/ }).click();
      await page.getByLabel("Upload documents").setInputFiles({
        name: "simulated-project-evidence.txt",
        mimeType: "text/plain",
        buffer: Buffer.from(
          "SIMULATION ONLY. Synthetic evidence for testing the workflow, not a real investment. All figures, appointments, studies and approvals in this test are simulated.",
        ),
      });
      await page.getByRole("button", { name: "Read & review ↗" }).click();
      await page
        .getByLabel("Review notes")
        .fill(
          "This is synthetic test evidence. Reviewed only to test the simulated workflow.",
        );
      await page.getByRole("button", { name: "Save source review" }).click();
      await page.locator("dialog").waitFor({ state: "hidden" });
      await page
        .getByRole("button", { name: "Gate workspace", exact: true })
        .click();
      for (const r of stages[0].requirements) {
        const row = page.locator(".requirement").filter({
          has: page.getByRole("heading", { name: r.title, exact: true }),
        });
        await profile(r.owner);
        await row.getByRole("button").click();
        if (r.id === "sourcing") {
          await page
            .getByRole("button", {
              name: "✧ Find relevant evidence and draft notes",
            })
            .click();
          await page
            .getByRole("button", {
              name: "✧ Find relevant evidence and draft notes",
            })
            .waitFor();
          await page.waitForFunction(
            () => !document.querySelector(".modal-busy"),
          );
        }
        await page
          .getByLabel("Assessment and conclusion")
          .fill(
            "SIMULATION: the responsible reviewer confirms this requirement using the attached synthetic evidence. No real approval is implied.",
          );
        await page.locator(".source-picker input").check();
        await page.getByLabel("Review outcome").selectOption("Reviewed");
        await page.getByRole("button", { name: "Save assessment" }).click();
        await page.locator("dialog").waitFor({ state: "hidden" });
      }
      await page.getByRole("button", { name: /^Reports \(/ }).click();
      await page
        .getByRole("button", { name: "Compile saved assessments", exact: true })
        .click();
      const downloadEvent = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Download PDF", exact: true })
        .click();
      const download = await downloadEvent,
        stream = await download.createReadStream(),
        chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      assert.equal(Buffer.concat(chunks).subarray(0, 5).toString(), "%PDF-");
      await profile("Investment");
      await page
        .getByRole("button", { name: "Read & review", exact: true })
        .click();

      await page
        .getByLabel("Review conclusion")
        .fill(
          "SIMULATION: checked all report sections against synthetic evidence.",
        );
      await page
        .getByRole("button", { name: "Confirm report review", exact: true })
        .click();
      await page.locator("dialog").waitFor({ state: "hidden" });
      await profile("Investment");
      await page
        .getByRole("button", { name: "Read & review", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Submit for decision", exact: true })
        .click();
      await page.locator("dialog").waitFor({ state: "hidden" });
      await page
        .getByRole("button", { name: "Gate workspace", exact: true })
        .click();
      await profile("CEO");
      await page
        .getByRole("button", { name: "Record decision", exact: true })
        .click();

      await page
        .getByLabel("Decision rationale / information request")
        .fill(
          "SIMULATION: approved the reviewed PIN for the browser workflow test.",
        );
      await page
        .locator("dialog")
        .getByRole("button", { name: "Record decision", exact: true })
        .click();
      await page.locator("dialog").waitFor({ state: "hidden" });
      await page
        .getByRole("heading", {
          name: "Have we selected a development option that fits the objective?",
        })
        .waitFor();
      let s = await (await fetch(base + "/api/workspace")).json(),
        o = s.opportunities.find((o) => o.name.startsWith("SIMULATION"));
      const sourceId = o.documents[0].id;
      const send = async (action, values = {}) => {
        const res = await fetch(base + "/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            id: o.id,
            role: "Investment",
            version: s.version,
            ...values,
          }),
        });
        const result = await res.json();
        assert.equal(res.status, 200, result.error);
        s = result;
        o = s.opportunities.find((x) => x.id === o.id);
      };
      for (const stage of stages.slice(1)) {
        assert.equal(o.stage, stage.id);
        if (stage.id === "monitoring") {
          await send("register", {
            role: "Finance",
            kind: "financials",
            data: {
              period: o.period,
              revenue: 100,
              budget: 120,
              ebitda: 20,
              adjustments: 2,
              allocated: 50,
              utilized: 40,
              sourceId,
              note: "Simulation only: one-off cost adjustments.",
            },
          });
          await send("register", {
            role: "Asset Management",
            kind: "board",
            data: {
              name: "Simulated representative",
              position: "Director",
              appointed: "2026-10-28",
            },
          });
        }
        for (const r of stage.requirements)
          await send("requirement", {
            role: r.owner,
            requirementId: r.id,
            status: "Reviewed",
            sourceIds: [sourceId],
            narrative:
              "SIMULATION: this requirement was checked against synthetic test evidence. This is not a real investment decision.",
          });
        await send("report");
        const report = o.reports.at(-1);
        for (const role of reportReviewRoles[stage.id])
          await send("review-report", {
            role,
            reportId: report.id,
            note: "Simulation: reviewed all sections and evidence.",
          });
        await send("submit-report", { reportId: report.id });
        await send("decision", {
          role: approvalRoles[stage.id][0],
          outcome: "Approve",
          meetingDate: "2026-10-28",
          votes: "Simulation: unanimous",
          note: "SIMULATION: approved after the required evidence and report reviews.",
        });
      }
      assert.equal(o.status, "Monitoring");
      assert.equal(o.decisions.length, 6);
      assert.equal(o.reports.length, 6);
      const r = await fetch(base + "/api/report?id=" + o.reports.at(-1).id);
      assert.equal(r.status, 200);
      assert.match(await r.text(), /adjusted EBITDA 22/);
      await page.reload();
      await page
        .getByRole("button", { name: "Meetings & performance", exact: true })
        .click();
      await page.getByRole("heading", { name: "Financial periods" }).waitFor();
      await page.screenshot({
        path: "test-results/monitoring-desktop.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page
        .getByRole("button", { name: "Gate workspace", exact: true })
        .click();
      await page.screenshot({
        path: "test-results/monitoring-mobile.png",
        fullPage: true,
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
      server?.kill("SIGTERM");
      await rm(data, { recursive: true, force: true });
    }
  },
);
