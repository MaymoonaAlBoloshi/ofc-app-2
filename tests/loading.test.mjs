import { test } from "node:test";
import assert from "node:assert/strict";
import { firefox } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { seed, applyCommand } from "../lib/engine.mjs";

test(
  "Siraaj shows pending, slow, success and failure states without duplicate requests",
  { timeout: 90000 },
  async () => {
    const browser = await firefox.launch({
      headless: true,
      executablePath:
        process.env.OFC2_FIREFOX ||
        "/home/maymona/Documents/ofc/OFC_Next/.cache/playwright/firefox-1555/firefox/firefox",
    });
    try {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      const state = applyCommand(seed(), {
        action: "create",
        role: "Investment",
        name: "Loading state preview",
      });
      let releaseWorkspace;
      const workspaceWait = new Promise((resolve) => {
        releaseWorkspace = resolve;
      });
      await page.route("**/api/workspace", async (route) => {
        await workspaceWait;
        await route.fulfill({ json: state });
      });
      await page.goto(
        (process.env.OFC2_URL || "http://127.0.0.1:3004") +
          "?opportunity=" +
          state.opportunities[0].id,
        { waitUntil: "domcontentloaded" },
      );
      await page
        .getByRole("status", { name: "Loading investment workspace" })
        .waitFor();
      releaseWorkspace();
      await page
        .getByRole("button", { name: "Prepare", exact: true })
        .first()
        .click();
      await page.clock.install();
      let complete,
        calls = 0;
      await page.route("**/api/assist", async (route) => {
        calls++;
        await new Promise((resolve) => {
          complete = resolve;
        });
        await route.fulfill({
          json: {
            text: "Suggested notes from source evidence.",
            sourceIds: [],
          },
        });
      });
      const button = page.getByRole("button", {
        name: "Find relevant evidence and draft notes",
      });
      await button.click();
      const panel = page.getByRole("region", { name: "Siraaj activity" });
      await panel.waitFor();
      assert.equal(await button.isDisabled(), true);
      assert.equal(await button.getAttribute("aria-busy"), "true");
      await page.clock.fastForward(31000);
      await panel.getByText(/This is taking longer/).waitFor();
      assert.equal(calls, 1);
      await mkdir("test-results", { recursive: true });
      await page.screenshot({
        path: "test-results/siraaj-working-desktop.png",
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: "test-results/siraaj-working-mobile.png" });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      complete();
      await panel.waitFor({ state: "hidden" });
      assert.equal(await button.isEnabled(), true);
      assert.equal(await button.getAttribute("aria-busy"), null);
      await page
        .getByRole("dialog")
        .getByText(
          "Siraaj has finished. Review the suggested material before using it.",
        )
        .waitFor();
      await page.unroute("**/api/assist");
      await page.route("**/api/assist", (route) =>
        route.fulfill({
          status: 503,
          json: { error: "Source service unavailable. Try again." },
        }),
      );
      await button.click();
      await page
        .getByRole("dialog")
        .getByRole("alert")
        .getByText("Source service unavailable. Try again.")
        .waitFor();
      assert.equal(await button.isEnabled(), true);
      assert.equal(await panel.count(), 0);
    } finally {
      await browser.close();
    }
  },
);
